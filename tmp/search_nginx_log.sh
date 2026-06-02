#!/usr/bin/env bash
lineCount=1000
if [ $2 ]; then
    lineCount=$2
fi

contextCount=10
if [ $3 ]; then
    contextCount=$3
fi

cd /var/log/nginx
echo "tail -n $lineCount error.log | grep --color -$contextCount $1"
tail -n $lineCount error.log | grep --color -$contextCount $1
