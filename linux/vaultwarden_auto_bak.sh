#!/usr/bin/env bash
# 此脚本用于自动备份 Vaultwarden(Bitwarden) 的文件

# crontab -e
# 0 0 15 * * /path/vaultwarden_auto_bak.sh $1
#
# rename backup files
# for i in $(ls ./);
# do
#   j=`echo ${i} \
#   | sed 's#\(vaultwarden\)_bak_\([0-9]\{4\}\)-\([0-9]\{2\}\)-\([0-9]\{2\}\)#\1-\2\3\4#'`
#   mv ${i} ${j}
# done

set -e

FILE_NAME="vaultwarden-$(date +"%Y%m%d").tar.gz"

file_path="${1}"
cd "${file_path}/data/"
tar czf "${FILE_NAME}" --exclude "icon_cache" ./*
mv "${FILE_NAME}" "${file_path}/backups/"
