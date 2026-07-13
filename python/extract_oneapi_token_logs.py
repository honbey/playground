"""
从 newapi 日志中提取 token 消耗记录，输出 JSONL（每行一个 JSON）。

用法:
    python3 extract_token_logs.py <日志文件> [输出文件]

示例:
    python3 extract_token_logs.py /var/log/newapi/app.log token_logs.jsonl
    python3 extract_token_logs.py app.log | jq 'select(.model_name == "gpt-4")'
"""

import re
import json
import sys
import os

LOG_PATTERN = re.compile(
    r"^\[INFO\]\s+(\d{4}/\d{2}/\d{2}\s+-\s+\d{2}:\d{2}:\d{2})\s+\|\s+"
    r"(\S+)\s+\|\s+record consume log:\s+userId=(\d+),\s+params=(.+)$"
)


def extract(logfile: str, outfile: str) -> int:
    count = 0
    with (
        open(logfile, "r", encoding="utf-8") as fin,
        open(outfile, "w", encoding="utf-8") as fout,
    ):
        for line in fin:
            line = line.strip()
            m = LOG_PATTERN.match(line)
            if not m:
                continue
            time_str, request_id, user_id, params_str = m.groups()
            try:
                params = json.loads(params_str)
            except json.JSONDecodeError:
                continue

            other = params.pop("other", {})
            if isinstance(other, dict):
                params.update(other)

            params["time"] = time_str
            params["requestId"] = request_id
            params["userId"] = int(user_id)

            fout.write(json.dumps(params, ensure_ascii=False) + "\n")
            count += 1

    print(f"提取完成: {count} 条记录 -> {outfile}", file=sys.stderr)
    return count


def main():
    if len(sys.argv) < 2:
        print(f"用法: {sys.argv[0]} <日志文件> [输出文件]", file=sys.stderr)
        sys.exit(1)

    logfile = sys.argv[1]
    outfile = sys.argv[2] if len(sys.argv) > 2 else "/dev/stdout"

    if not os.path.isfile(logfile):
        print(f"错误: 日志文件不存在: {logfile}", file=sys.stderr)
        sys.exit(1)

    extract(logfile, outfile)


if __name__ == "__main__":
    main()
