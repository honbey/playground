import re
import csv
from datetime import datetime, timedelta
from collections import defaultdict
import pytz


def parse_ddns_log(log_file_path: str, output_csv: str = "ip_changes.csv"):
    """
    解析 DDNS 日志，提取 URL IP 的变化并计算每个 IP 的持续时间。
    所有时间统一转换为 CST (UTC+8)。
    忽略包含 'error' 的行。
    """
    # 匹配时间戳行：支持 UTC 和 CST
    time_pattern = re.compile(
        r"^\w{3}\s+\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+(?:AM|PM)\s+(UTC|CST)\s+\d{4}$"
    )
    ip_pattern = re.compile(r"\[URL IP\]:(\d+\.\d+\.\d+\.\d+)")

    # 时区对象
    utc_zone = pytz.UTC
    cst_zone = pytz.timezone("Asia/Shanghai")  # CST 常用定义

    current_ip = None
    ip_start_time = None  # 存储为 CST 的 datetime
    last_time = None  # 存储为 CST 的 datetime
    records = []

    def parse_time_to_cst(line: str):
        """解析时间戳行，返回 CST 时区的 datetime，失败返回 None"""
        parts = line.split()
        if len(parts) != 7:
            return None

        try:
            # 拼接 "Wed Dec 4 06:54:01 PM 2024"
            time_str = " ".join(parts[:4])  # "Wed Dec 4 06:54:01"
            ampm = parts[4]
            year = parts[6]
            full_time_str = f"{time_str} {ampm} {year}"

            # 解析为无时区的 naive datetime
            naive_time = datetime.strptime(full_time_str, "%a %b %d %H:%M:%S %p %Y")

            # 根据原始时区进行本地化，然后转为 CST
            tz_str = parts[5].upper()
            if tz_str == "UTC":
                aware_time = utc_zone.localize(naive_time)
                return aware_time.astimezone(cst_zone)  # UTC -> CST
            elif tz_str == "CST":
                aware_time = cst_zone.localize(naive_time)  # 已经 CST
                return aware_time
            else:
                # 未知时区，默认当作 UTC 处理并转为 CST
                print(f"警告: 未知时区 {tz_str}，默认按 UTC 处理并转为 CST")
                aware_time = utc_zone.localize(naive_time)
                return aware_time.astimezone(cst_zone)
        except Exception as e:
            print(f"时间解析失败: {line}, 错误: {e}")
            return None

    line_count = 0
    error_lines = 0

    print(f"开始解析日志文件: {log_file_path}")

    with open(log_file_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line_count += 1
            if line_count % 100000 == 0:
                print(f"已处理 {line_count} 行...")

            line = line.strip()
            if not line:
                continue

            # 忽略任何包含 error 的行
            if "error" in line.lower():
                error_lines += 1
                continue

            # 时间戳行
            if time_pattern.match(line):
                parsed = parse_time_to_cst(line)
                if parsed:
                    last_time = parsed
                continue

            # [URL IP] 行
            m = ip_pattern.search(line)
            if m and last_time is not None:
                ip = m.group(1)
                if current_ip is None:
                    current_ip = ip
                    ip_start_time = last_time
                elif ip != current_ip:
                    duration = last_time - ip_start_time
                    records.append(
                        {
                            "ip": current_ip,
                            "start": ip_start_time.strftime("%Y-%m-%d %H:%M:%S CST"),
                            "end": last_time.strftime("%Y-%m-%d %H:%M:%S CST"),
                            "duration_seconds": int(duration.total_seconds()),
                            "duration_human": str(duration),
                        }
                    )
                    current_ip = ip
                    ip_start_time = last_time

    # 处理最后一段 IP
    if current_ip is not None and ip_start_time is not None and last_time is not None:
        duration = last_time - ip_start_time
        records.append(
            {
                "ip": current_ip,
                "start": ip_start_time.strftime("%Y-%m-%d %H:%M:%S CST"),
                "end": last_time.strftime("%Y-%m-%d %H:%M:%S CST"),
                "duration_seconds": int(duration.total_seconds()),
                "duration_human": str(duration),
            }
        )

    print(
        f"解析完成: 总行数={line_count}, 错误行={error_lines}, IP变化记录={len(records)}"
    )

    # 写入 CSV
    if records:
        with open(output_csv, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(
                csvfile,
                fieldnames=["ip", "start", "end", "duration_seconds", "duration_human"],
            )
            writer.writeheader()
            writer.writerows(records)
        print(f"结果已保存至 {output_csv}")

        # 摘要
        print("\n=== IP 变化摘要 (CST) ===")
        for i, rec in enumerate(records, 1):
            print(
                f"{i}. {rec['ip']}  开始: {rec['start']}  持续: {rec['duration_human']}"
            )
    else:
        print("未找到任何 IP 变化记录。")

    return records


def analyze_ip_changes(records):
    """统计各 IP 累计使用时长"""
    if not records:
        return
    ip_durations = defaultdict(int)
    for rec in records:
        ip_durations[rec["ip"]] += rec["duration_seconds"]

    print("\n=== 各 IP 累计时长 ===")
    for ip, sec in sorted(ip_durations.items(), key=lambda x: x[1], reverse=True):
        h, remainder = divmod(sec, 3600)
        m, s = divmod(remainder, 60)
        print(f"  {ip}: {h}小时{m}分{s}秒")
    print(f"总计 {len(set(r['ip'] for r in records))} 个不同 IP，{len(records)} 次变化")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("用法: python ddns_parse.py <日志文件> [输出CSV]")
        sys.exit(1)

    log_file = sys.argv[1]
    out_csv = sys.argv[2] if len(sys.argv) > 2 else "ip_changes.csv"
    records = parse_ddns_log(log_file, out_csv)
    analyze_ip_changes(records)
