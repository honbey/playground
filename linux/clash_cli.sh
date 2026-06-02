#!/usr/bin/env bash

SCRIPT="$0"
positional=()
# ALLOW_LAN CONFIG CLASH DIRECTORY IPV6 SIGNAL_PARAM SUBSCRIPT_LINK

function signal() {
  case "$1" in
  run)
    run
    ;;
  r | reload)
    stop
    run
    ;;
  s | stop)
    stop
    ;;
  *)
    echo "${SCRIPT}: invalid parameter: $2"
    echo "${SCRIPT}: valid parameter: run, (r)eload, (s)top"
    ;;
  esac
  exit 0
}

function stop() {
  local status pid
  if [[ -f "${DIRECTORY}/pid" ]]; then
    pid="$(cat ${DIRECTORY}/pid)"
    ps -ef | grep "${pid}" | grep -v "grep" | grep "clash" &&
      kill -9 "${pid}"
    status="$?"
  else
    echo "${SCRIPT}: [error] pid file is not"
  fi
  if [[ ${status} -eq 0 ]]; then
    /bin/rm "${DIRECTORY}/pid"
  else
    echo "${SCRIPT}: [error] no such process"
  fi
}

function run() {
  if [[ -z "${DIRECTORY}" || ! (-d "${DIRECTORY}") ]]; then
    echo "${SCRIPT}: [error] need provide a directory"
    exit 1
  fi
  if [[ -z "${CLASH}" || ! (-f "${CLASH}") ]]; then
    echo "${SCRIPT}: [error] need set executabled clash program"
    exit 1
  fi
  if [[ -z "${CONFIG}" ]]; then
    CONFIG="${DIRECTORY}/config.yaml"
    if ! [[ -f "${CONFIG}" ]]; then
      echo "${SCRIPT}: [error] the config file is not found"
    fi
  fi
  if [[ -n "${SUBSCRIPT_LINK}" ]]; then
    if [[ -f "${CONFIG}" ]]; then
      /usr/bin/env -i cp "${CONFIG}" "${CONFIG}-$(date '+%s')"
    fi
    /usr/bin/env -i curl -fL "${SUBSCRIPT_LINK}&flag=clash" \
      -A 'clashX' -o "${CONFIG}"
  fi
  process-config

  nohup "${CLASH}" -f "${CONFIG}" -d "${DIRECTORY}" >/dev/null 2>&1 &
  echo "$!" >"${DIRECTORY}/pid"
}

function process-config() {
  local G
  [[ "${OSTYPE}" =~ "darwin" ]] && G="g"

  ${G}sed -i "/^socks-port/d" "${CONFIG}"
  ${G}sed -i "/^redir-port/d" "${CONFIG}"
  if grep "^mixed-port:" "${CONFIG}" &>/dev/null; then
    ${G}sed -i "/^mixed-port:/ c\mixed-port: 1080" "${CONFIG}"
  else
    ${G}sed -i "1i\mixed-port: 1080" "${CONFIG}"
  fi
  if grep "^external-controller:" "${CONFIG}" &>/dev/null; then
    ${G}sed -i "/^external-controller:/ c\external-controller: 127.0.0.1:1081" "${CONFIG}"
  else
    ${G}sed -i "1i\external-controller: 127.0.0.1:1081" "${CONFIG}"
  fi

  if [[ "${IPV6}" == "true" ]]; then
    ${G}sed -i "/^ipv6:/ c\ipv6: true" "${CONFIG}"
  else
    ${G}sed -i "/^ipv6:/ c\ipv6: false" "${CONFIG}"
  fi
  if [[ "${ALLOW_LAN}" == "true" ]]; then
    ${G}sed -i "/^allow-lan:/ c\allow-lan: true" "${CONFIG}"
    ${G}sed -i "/^bind-address:/ c\bind-address: '*'" "${CONFIG}"
  else
    ${G}sed -i "/^allow-lan:/ c\allow-lan: false" "${CONFIG}"
    ${G}sed -i "/^bind-address:/ c\bind-address: 127.0.0.1" "${CONFIG}"
  fi
}

function msg() {
  echo "Controller message:"
  echo "  external-controller: 127.0.0.1:1081"
  echo "  - show proxies:  curl 'http://127.0.0.1:1081/proxies'"
  echo "  - show logs:     curl 'http://127.0.0.1:1081/logs'"
  echo '  - change proxy:  curl -XPUT -d {"name": "<name>"} "http://127.0.0.1:1081/proxies/<NAME>"'
  exit 0
}

function usage() {
  echo "Usage: ${SCRIPT} [options...] <clash> [link]"
  echo "  options:"
  echo "    -c | --config file       config file"
  echo "    -d | --directory path    directory for clash"
  echo "    -h | --help              show this help message"
  echo "    -l | --lan               allow lan to connect"
  echo "    -m | --message           show message of controller"
  echo "    -s | --signal            control the process"
  echo "    -6 | --ipv6              allow use IPv6"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
  -c | -f | --config)
    CONFIG="$2"
    shift 2
    ;;
  -d | --directory)
    DIRECTORY="$2"
    shift 2
    ;;
  -l | --lan)
    ALLOW_LAN=true
    shift
    ;;
  -m | --message)
    msg
    shift
    ;;
  -s | --signal)
    SIGNAL_PARAM="$2"
    shift 2
    ;;
  -6 | --ipv6)
    IPV6=true
    shift
    ;;
  --)
    positional+=("$2")
    positional+=("$3")
    break
    ;;
  -h | --help)
    usage
    shift
    ;;
  -*)
    echo "$0: option $1: is unknown" >&2
    usage
    exit 1
    ;;
  *)
    positional+=("$1")
    shift
    ;;
  esac
done

CLASH="${positional[0]}"
SUBSCRIPT_LINK="${positional[1]}"

if [[ -n "${SIGNAL_PARAM}" ]]; then
  signal "${SIGNAL_PARAM}"
else
  run
fi
