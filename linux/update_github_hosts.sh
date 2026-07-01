#!/usr/bin/env bash

# GitHub hosts update script
# Directly edit /etc/hosts using sed -i

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
printf '%s\n' "$NEW_HOSTS" "$END_MARK" >"$TEMP_FILE"

if grep -q "$START_MARK" "$HOSTS_FILE"; then
  # Markers exist: replace the block between them (including the END marker)
  sed -i -e "/$START_MARK/,/$END_MARK/{" \
    -e "/$START_MARK/{ r $TEMP_FILE" \
    -e "n" \
    -e "}" \
    -e "/$END_MARK/!d" \
    -e "/$END_MARK/d" \
    -e "}" "$HOSTS_FILE"
else
  # Markers do not exist: append new block at the end
  printf '\n%s\n%s\n%s\n' "$START_MARK" "$NEW_HOSTS" "$END_MARK" >>"$HOSTS_FILE"
fi

echo "GitHub hosts update completed"
