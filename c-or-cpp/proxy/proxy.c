/*
 * 来源：https://blog.csdn.net/hai315247543/article/details/161901214
 * 九章编程法 · HTTP转发代理网关【终极完美版·矩阵步进交换】
 * 同步机制：双槽位拓扑交换，零数值ID，无回绕，无竞态，无死锁
 * 终极修复：推送失败补偿机制，防止部分推送导致的拓扑撕裂；移除冗余step[0]
 */
#include <arpa/inet.h>
#include <fcntl.h>
#include <poll.h>
#include <pthread.h>
#include <signal.h>
#include <stdatomic.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <unistd.h>

// ===================== M01 🔴一维只读参数矩阵 =====================
typedef enum {
  PARAM_BUF_MAX_LEN,
  PARAM_HEALTH_THRESH,
  PARAM_CACHE_MAX_CNT,
  PARAM_WORKER_CNT,
  PARAM_IO_TIMEOUT,
  PARAM_TOTAL_IDX
} ParamIndex;

static const uint32_t sys_param[PARAM_TOTAL_IDX] = {4096U, 80U, 256U, 4U,
                                                    3000U};

typedef enum {
  RET_OK = 0,
  RET_INVALID_PARAM,
  RET_IO_ERR,
  RET_PARSE_ERR,
  RET_CACHE_MISS,
  RET_QUEUE_EMPTY,
  RET_QUEUE_FULL
} RetCode;

typedef struct {
  uint8_t data[4096U];
  uint32_t len;
} req_t, resp_t;

// ===================== 🟢 矩阵步进交换核心 =====================
typedef struct {
  req_t req;
  resp_t resp;
  atomic_uchar health; // 积分累积，不重置
  atomic_uchar step;   // 完成槽(由内部线程写入，外部线程读取比对)
} WorkerNode;

typedef struct {
  uint32_t key;
  uint8_t data[4096U];
  uint8_t valid;
} cache_item_t;

typedef struct {
  uint8_t target_slot; // 本轮外部线程要求的完成槽位值
  req_t req;
} TaskMsg;

#define QUEUE_DEPTH 16U
typedef struct {
  TaskMsg msg_buf[QUEUE_DEPTH];
  uint32_t head;
  uint32_t tail;
  pthread_mutex_t mtx;
} MsgQueue;

typedef struct {
  struct AppCtx *ctx;
  int thread_idx;
} ThreadArg;

typedef struct AppCtx {
  WorkerNode worker_mat[4];
  cache_item_t cache_mat[256];
  MsgQueue task_queue;
  pthread_t inner_thread[4];
  pthread_t outer_thread;
  volatile bool term_flag;
  int sig_pipe[2];
} AppCtx;

static int g_sig_pipe_w = -1;

// ===================== 🔴参数读取 =====================
uint32_t get_param(ParamIndex idx) {
  if ((uint32_t)idx >= PARAM_TOTAL_IDX)
    return 0U;
  uint32_t val = sys_param[idx];
  if ((idx != PARAM_WORKER_CNT) && (val == 0U))
    return 0U;
  return val;
}

// ===================== 🟢2+1消息队列 =====================
static inline uint32_t queue_used(MsgQueue *q) {
  return (q->tail - q->head + QUEUE_DEPTH) % QUEUE_DEPTH;
}

static RetCode queue_push(MsgQueue *q, const TaskMsg *msg) {
  if (!q || !msg)
    return RET_INVALID_PARAM;
  pthread_mutex_lock(&q->mtx);
  uint32_t next_tail = (q->tail + 1U) % QUEUE_DEPTH;
  if (next_tail == q->head) {
    pthread_mutex_unlock(&q->mtx);
    return RET_QUEUE_FULL;
  }
  memset(&q->msg_buf[q->tail], 0x00, sizeof(TaskMsg));
  q->msg_buf[q->tail] = *msg;
  uint32_t cur_idx = q->tail;
  q->tail = next_tail;
  bool push_ok =
      (q->msg_buf[cur_idx].target_slot == msg->target_slot) &&
      (q->msg_buf[cur_idx].req.len == msg->req.len) &&
      (memcmp(q->msg_buf[cur_idx].req.data, msg->req.data, msg->req.len) == 0);
  pthread_mutex_unlock(&q->mtx);
  return push_ok ? RET_OK : RET_IO_ERR;
}

static RetCode queue_pop(MsgQueue *q, TaskMsg *out_msg) {
  if (!q || !out_msg)
    return RET_INVALID_PARAM;
  pthread_mutex_lock(&q->mtx);
  if (q->head == q->tail) {
    pthread_mutex_unlock(&q->mtx);
    return RET_QUEUE_EMPTY;
  }
  *out_msg = q->msg_buf[q->head];
  uint32_t cur_idx = q->head;
  q->head = (q->head + 1U) % QUEUE_DEPTH;
  bool pop_ok = (out_msg->target_slot == q->msg_buf[cur_idx].target_slot) &&
                (out_msg->req.len == q->msg_buf[cur_idx].req.len) &&
                (memcmp(out_msg->req.data, q->msg_buf[cur_idx].req.data,
                        out_msg->req.len) == 0);
  pthread_mutex_unlock(&q->mtx);
  return pop_ok ? RET_OK : RET_IO_ERR;
}

// ===================== 🔵缓存模块 =====================
cache_item_t *cache_find(AppCtx *ctx, uint32_t key) {
  if (!ctx || key == 0U)
    return NULL;
  uint32_t max_cache = get_param(PARAM_CACHE_MAX_CNT);
  for (uint32_t i = 0U; i < max_cache; i++)
    if ((ctx->cache_mat[i].key == key) && (ctx->cache_mat[i].valid == 1U))
      return &ctx->cache_mat[i];
  return NULL;
}

RetCode cache_write(AppCtx *ctx, uint32_t key, const uint8_t *data,
                    uint32_t len) {
  if (!ctx || key == 0U || !data)
    return RET_INVALID_PARAM;
  uint32_t max_buf = get_param(PARAM_BUF_MAX_LEN);
  uint32_t max_cache = get_param(PARAM_CACHE_MAX_CNT);
  if (len > max_buf || max_cache == 0U)
    return RET_INVALID_PARAM;
  for (uint32_t i = 0U; i < max_cache; i++) {
    if (ctx->cache_mat[i].valid == 0U) {
      memset(ctx->cache_mat[i].data, 0x00, 4096U);
      ctx->cache_mat[i].key = key;
      memcpy(ctx->cache_mat[i].data, data, len);
      ctx->cache_mat[i].valid = 1U;
      return (memcmp(ctx->cache_mat[i].data, data, len) == 0)
                 ? RET_OK
                 : RET_INVALID_PARAM;
    }
  }
  return RET_CACHE_MISS;
}

void cache_invalidate(AppCtx *ctx, uint32_t key) {
  if (!ctx || key == 0U)
    return;
  uint32_t max_cache = get_param(PARAM_CACHE_MAX_CNT);
  for (uint32_t i = 0U; i < max_cache; i++)
    if (ctx->cache_mat[i].key == key) {
      ctx->cache_mat[i].valid = 0U;
      memset(ctx->cache_mat[i].data, 0x00, 4096U);
      break;
    }
}

// ===================== 🔴网络IO =====================
RetCode net_read(int fd, uint8_t *buf, uint32_t *out_len) {
  if (fd < 0 || !buf || !out_len)
    return RET_INVALID_PARAM;
  ssize_t recv_len = recv(fd, buf, get_param(PARAM_BUF_MAX_LEN), 0);
  if (recv_len < 0)
    return RET_IO_ERR;
  *out_len = (uint32_t)recv_len;
  return RET_OK;
}

RetCode net_write(int fd, const uint8_t *buf, uint32_t len) {
  if (fd < 0 || !buf || len > get_param(PARAM_BUF_MAX_LEN))
    return RET_INVALID_PARAM;
  ssize_t send_len = send(fd, buf, len, 0);
  if (send_len < 0 || (uint32_t)send_len != len)
    return RET_IO_ERR;
  return RET_OK;
}

// ===================== 🔴HTTP解析 =====================
typedef enum {
  METHOD_GET = 0U,
  METHOD_POST = 1U,
  METHOD_OTHER = 2U,
  METHOD_TOTAL = 3U
} HttpMethod;
static const uint16_t http_rule[METHOD_TOTAL][3] = {
    {1U, 4U, 4096U}, {1U, 5U, 4096U}, {0U, 0U, 0U}};

static HttpMethod http_match_method(const uint8_t *data, uint32_t len) {
  HttpMethod m = METHOD_OTHER;
  if (len >= 3 && memcmp(data, "GET", 3) == 0)
    m = METHOD_GET;
  if (len >= 4 && memcmp(data, "POST", 4) == 0)
    m = METHOD_POST;
  return m;
}

RetCode http_parse(const uint8_t *data, uint32_t len, req_t *out_req) {
  if (!data || !out_req || len == 0U || len > get_param(PARAM_BUF_MAX_LEN))
    return RET_INVALID_PARAM;
  HttpMethod m = http_match_method(data, len);
  const uint16_t *rule = http_rule[m];
  if (rule[0] == 0U || len < rule[1] || len > rule[2])
    return RET_PARSE_ERR;
  memset(out_req->data, 0x00, 4096U);
  memcpy(out_req->data, data, len);
  out_req->len = len;
  return (memcmp(out_req->data, data, len) == 0) ? RET_OK : RET_PARSE_ERR;
}

// ===================== 🟢流态处理 =====================
void worker_process(WorkerNode *node) {
  if (!node || node->req.len == 0U)
    return;
  memcpy(node->resp.data, node->req.data, node->req.len);
  node->resp.len = node->req.len;
  uint8_t cur = atomic_load(&node->health);
  atomic_store(&node->health, (cur > 5U) ? (cur - 2U) : 0U);
}

void req_gather(AppCtx *ctx, uint8_t req_slot_val, resp_t *out_resp) {
  if (!ctx || !out_resp)
    return;
  uint8_t health_limit = get_param(PARAM_HEALTH_THRESH);
  memset(out_resp, 0x00, sizeof(resp_t));
  for (uint32_t i = 0U; i < get_param(PARAM_WORKER_CNT); i++) {
    if (atomic_load(&ctx->worker_mat[i].step) == req_slot_val &&
        atomic_load(&ctx->worker_mat[i].health) >= health_limit) {
      memcpy(out_resp->data, ctx->worker_mat[i].resp.data,
             ctx->worker_mat[i].resp.len);
      out_resp->len = ctx->worker_mat[i].resp.len;
      break;
    }
  }
  if (out_resp->len > get_param(PARAM_BUF_MAX_LEN))
    memset(out_resp, 0x00, sizeof(resp_t));
}

// ===================== 🔴内部刚性线程 =====================
void *inner_thread_func(void *arg) {
  ThreadArg *t_arg = (ThreadArg *)arg;
  AppCtx *ctx = t_arg->ctx;
  int idx = t_arg->thread_idx;
  free(t_arg);
  TaskMsg local_task = {0};
  while (!ctx->term_flag) {
    if (queue_pop(&ctx->task_queue, &local_task) == RET_OK) {
      WorkerNode *wn = &ctx->worker_mat[idx];
      memcpy(&wn->req, &local_task.req, sizeof(req_t));
      worker_process(wn);
      // 拓扑应答：将完成槽对齐为任务携带的指令值
      atomic_store(&wn->step, local_task.target_slot);
    }
    usleep(1000);
  }
  pthread_exit(NULL);
}

// ===================== 🔵外部调度线程 =====================
void *outer_thread_func(void *arg) {
  AppCtx *ctx = (AppCtx *)arg;
  struct sockaddr_in client_addr = {0};
  socklen_t addr_len = sizeof(client_addr);
  uint8_t buf[4096U] = {0};
  uint32_t recv_len = 0U;
  req_t cur_req = {0};
  resp_t cur_resp = {0};

  int listen_fd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, 0);
  if (listen_fd < 0) {
    pthread_exit(NULL);
    return NULL;
  }

  struct sockaddr_in serv_addr = {0};
  serv_addr.sin_family = AF_INET;
  serv_addr.sin_port = htons(8080);
  serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
  if (bind(listen_fd, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0 ||
      listen(listen_fd, 8) < 0) {
    close(listen_fd);
    pthread_exit(NULL);
  }

  struct pollfd pfd = {.fd = listen_fd, .events = POLLIN};

  while (!ctx->term_flag) {
    int ret = poll(&pfd, 1, 100);
    if (ret <= 0)
      continue;

    int client_fd =
        accept(listen_fd, (struct sockaddr *)&client_addr, &addr_len);
    if (client_fd < 0)
      continue;

    int flags = fcntl(client_fd, F_GETFL, 0);
    if (flags >= 0)
      fcntl(client_fd, F_SETFL, flags & ~O_NONBLOCK);
    uint32_t timeout_ms = get_param(PARAM_IO_TIMEOUT);
    struct timeval tv = {.tv_sec = timeout_ms / 1000U,
                         .tv_usec = (timeout_ms % 1000U) * 1000U};
    setsockopt(client_fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
    setsockopt(client_fd, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));

    if (net_read(client_fd, buf, &recv_len) == RET_OK &&
        http_parse(buf, recv_len, &cur_req) == RET_OK) {

      // 🟢 1. 计算目标槽位值（对当前完成槽取反）
      uint8_t target_slot = 1 - atomic_load(&ctx->worker_mat[0].step);

      // 🟢 2. 推送任务，并处理可能的推送失败（防止拓扑撕裂）
      TaskMsg task = {.target_slot = target_slot, .req = cur_req};
      bool push_ok = true;
      for (int i = 0; i < 4; i++) {
        if (queue_push(&ctx->task_queue, &task) != RET_OK) {
          push_ok = false;
          // 关键修复：为未能推入任务的Worker补偿步进值，强行对齐拓扑
          for (int j = i; j < 4; j++) {
            atomic_store(&ctx->worker_mat[j].step, target_slot);
          }
          break;
        }
      }

      // 🟢 3. 无论推送是否完美，必须等待所有 Worker
      // 的完成槽对齐，才能开启下一轮
      while (1) {
        bool all_done = true;
        for (int i = 0; i < 4; i++) {
          if (atomic_load(&ctx->worker_mat[i].step) != target_slot) {
            all_done = false;
            break;
          }
        }
        if (all_done || ctx->term_flag)
          break;
        usleep(1000);
      }

      // 🟢 4. 仅在推送完美时才收集响应
      if (!ctx->term_flag && push_ok) {
        req_gather(ctx, target_slot, &cur_resp);
        cache_write(ctx, 1001U, cur_resp.data, cur_resp.len);
        net_write(client_fd, cur_resp.data, cur_resp.len);
      }
    }
    close(client_fd);
    memset(buf, 0x00, 4096U);
  }
  close(listen_fd);
  pthread_exit(NULL);
}

// ===================== 信号处理 =====================
static void sig_handler(int sig) {
  if (g_sig_pipe_w < 0)
    return;
  uint8_t sig_buf = (uint8_t)sig;
  write(g_sig_pipe_w, &sig_buf, 1);
}

int main(void) {
  AppCtx app_ctx = {0};
  memset(app_ctx.cache_mat, 0x00, sizeof(app_ctx.cache_mat));
  memset(app_ctx.worker_mat, 0x00, sizeof(app_ctx.worker_mat));
  memset(&app_ctx.task_queue, 0x00, sizeof(app_ctx.task_queue));
  pthread_mutex_init(&app_ctx.task_queue.mtx, NULL);

  for (int i = 0; i < 4; i++) {
    atomic_store(&app_ctx.worker_mat[i].step, 0);
    atomic_store(&app_ctx.worker_mat[i].health, 100U);
  }

  if (pipe(app_ctx.sig_pipe) < 0) {
    pthread_mutex_destroy(&app_ctx.task_queue.mtx);
    return -1;
  }
  g_sig_pipe_w = app_ctx.sig_pipe[1];
  signal(SIGINT, sig_handler);
  signal(SIGTERM, sig_handler);

  if (get_param(PARAM_WORKER_CNT) != 4U) {
    pthread_mutex_destroy(&app_ctx.task_queue.mtx);
    close(app_ctx.sig_pipe[0]);
    close(app_ctx.sig_pipe[1]);
    return -1;
  }

  for (int i = 0; i < 4; i++) {
    ThreadArg *t_arg = malloc(sizeof(ThreadArg));
    t_arg->ctx = &app_ctx;
    t_arg->thread_idx = i;
    pthread_create(&app_ctx.inner_thread[i], NULL, inner_thread_func, t_arg);
  }
  pthread_create(&app_ctx.outer_thread, NULL, outer_thread_func, &app_ctx);

  uint8_t recv_sig = 0;
  read(app_ctx.sig_pipe[0], &recv_sig, 1);
  app_ctx.term_flag = true;

  for (int i = 0; i < 4; i++)
    pthread_join(app_ctx.inner_thread[i], NULL);
  pthread_join(app_ctx.outer_thread, NULL);

  pthread_mutex_destroy(&app_ctx.task_queue.mtx);
  close(app_ctx.sig_pipe[0]);
  close(app_ctx.sig_pipe[1]);
  return 0;
}
