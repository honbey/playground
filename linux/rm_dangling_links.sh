#!/usr/bin/env bash

find . -maxdepth 1 -type l ! -exec test -e {} \; -print -ok rm {} \;
