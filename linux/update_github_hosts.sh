#!/usr/bin/env bash
# Update github hosts automatically. It should be executed by root user.

# 0 0 * * * /usr/bin/env bash /path/to/update_hosts.sh > /dev/null 2>&1

# GitHub hosts update script

URL="https://gitlab.com/ineo6/hosts/-/raw/master/hosts"
HOSTS_FILE="/etc/hosts"
START_MARK="# GitHub Hosts Start"
END_MARK="# GitHub Hosts End"

# Check root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script with sudo"
  exit 1
fi

# Download new hosts content
echo "Downloading GitHub hosts..."
NEW_HOSTS=$(curl -s "$URL")

if [ -z "$NEW_HOSTS" ]; then
  echo "Download failed, please check network connection"
  exit 1
fi

# Check if hosts file exists
if [ ! -f "$HOSTS_FILE" ]; then
  echo "hosts file does not exist, creating new file"
  touch "$HOSTS_FILE"
fi

# Create temporary file for sed's 'r' command and clean up on exit
TEMP_FILE=$(mktemp)
trap 'rm -f "$TEMP_FILE"' EXIT

# Prepare the content to be inserted:
# new hosts lines followed by the END marker
echo "$NEW_HOSTS" >"$TEMP_FILE"
echo "$END_MARK" >>"$TEMP_FILE"

if grep -q "$START_MARK" "$HOSTS_FILE"; then
  # Markers exist: replace the block between them (including the END marker)
  # The sed command:
  # - Match lines from START to END
  # - Skip lines outside this range (!b)
  # - Delete all lines inside the range except the START line (//!d)
  # - On the START line, read the temporary file after it (r)
  sed -i "/$START_MARK/,/$END_MARK/!b;//!d;/$START_MARK/r $TEMP_FILE" "$HOSTS_FILE"
else
  # Markers do not exist: append new block at the end
  echo -e "\n$START_MARK" >>"$HOSTS_FILE"
  echo "$NEW_HOSTS" >>"$HOSTS_FILE"
  echo "$END_MARK" >>"$HOSTS_FILE"
fi

echo "GitHub hosts update completed"
