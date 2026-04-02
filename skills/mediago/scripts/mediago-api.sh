#!/usr/bin/env bash
# MediaGo API helper script for Claude Code skill
# Reads config from ~/.mediago-skill.json

set -euo pipefail

CONFIG_FILE="$HOME/.mediago-skill.json"

# Read config
read_config() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Config file not found at $CONFIG_FILE" >&2
    echo "Please configure MediaGo URL first." >&2
    exit 1
  fi

  MEDIAGO_URL=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(c.get('url',''))" 2>/dev/null)
  MEDIAGO_API_KEY=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(c.get('apiKey',''))" 2>/dev/null)

  if [ -z "$MEDIAGO_URL" ]; then
    echo "ERROR: MediaGo URL not set in $CONFIG_FILE" >&2
    exit 1
  fi
}

# Build auth header
auth_header() {
  if [ -n "${MEDIAGO_API_KEY:-}" ]; then
    echo "-H" "X-API-Key: $MEDIAGO_API_KEY"
  fi
}

# API request helper
api_get() {
  local path="$1"
  curl -s $(auth_header) "${MEDIAGO_URL}${path}"
}

api_post() {
  local path="$1"
  local body="${2:-{}}"
  curl -s $(auth_header) -H "Content-Type: application/json" -d "$body" "${MEDIAGO_URL}${path}"
}

# Commands
cmd_health() {
  read_config
  local resp
  resp=$(api_get "/healthy" 2>/dev/null) || {
    echo "ERROR: Cannot reach MediaGo at $MEDIAGO_URL"
    exit 1
  }
  echo "OK: MediaGo is running at $MEDIAGO_URL"
}

cmd_download() {
  read_config
  local url="${1:?URL is required}"
  local name="${2:-}"
  local type="${3:-}"

  # Auto-detect type from URL
  if [ -z "$type" ]; then
    case "$url" in
      *bilibili.com*|*b23.tv*) type="bilibili" ;;
      *.m3u8*) type="m3u8" ;;
      *) type="direct" ;;
    esac
  fi

  # Build task object
  local task="{\"type\":\"$type\",\"url\":\"$url\""
  if [ -n "$name" ]; then
    task="$task,\"name\":\"$name\""
  fi
  task="$task}"

  local body="{\"tasks\":[$task],\"startDownload\":true}"
  local resp
  resp=$(api_post "/api/downloads" "$body")

  # Extract task ID from response
  local success
  success=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',False))" 2>/dev/null)

  if [ "$success" = "True" ]; then
    local task_id
    task_id=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])" 2>/dev/null)
    echo "TASK_ID=$task_id"
    echo "TYPE=$type"
    echo "URL=$url"
  else
    local msg
    msg=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message','Unknown error'))" 2>/dev/null)
    echo "ERROR: $msg"
    exit 1
  fi
}

cmd_status() {
  read_config
  local task_id="${1:?Task ID is required}"
  local resp
  resp=$(api_get "/api/downloads/$task_id")
  echo "$resp" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d.get('success'):
    print(f\"ERROR: {d.get('message','Unknown error')}\")
    sys.exit(1)
t = d['data']
print(f\"ID: {t['id']}\")
print(f\"Name: {t['name']}\")
print(f\"Status: {t['status']}\")
print(f\"Type: {t['type']}\")
if t.get('exists'):
    print(f\"File: {t.get('file','')}\")
"
}

cmd_list() {
  read_config
  local resp
  resp=$(api_get "/api/downloads?current=1&pageSize=50")
  echo "$resp" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d.get('success'):
    print(f\"ERROR: {d.get('message','Unknown error')}\")
    sys.exit(1)
items = d['data']['list']
print(f'Total: {d[\"data\"][\"total\"]}')
print()
for t in items:
    status = t['status']
    name = t['name']
    tid = t['id']
    print(f'  [{status:12s}] #{tid} {name}')
"
}

cmd_wait() {
  read_config
  local task_id="${1:?Task ID is required}"
  local timeout=600  # 10 minutes
  local elapsed=0

  while [ $elapsed -lt $timeout ]; do
    local resp
    resp=$(api_get "/api/downloads/$task_id" 2>/dev/null) || {
      sleep 2
      elapsed=$((elapsed + 2))
      continue
    }

    local status
    status=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('status',''))" 2>/dev/null)

    case "$status" in
      success)
        local file
        file=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('file',''))" 2>/dev/null)
        echo "DONE: Download complete"
        echo "FILE=$file"
        exit 0
        ;;
      failed)
        echo "FAILED: Download failed"
        exit 1
        ;;
      stopped)
        echo "STOPPED: Download was stopped"
        exit 1
        ;;
      downloading|pending)
        echo "PROGRESS: status=$status elapsed=${elapsed}s"
        ;;
    esac

    sleep 2
    elapsed=$((elapsed + 2))
  done

  echo "TIMEOUT: Download did not complete within ${timeout}s"
  exit 1
}

# Main
case "${1:-help}" in
  health)   cmd_health ;;
  download) shift; cmd_download "$@" ;;
  status)   shift; cmd_status "$@" ;;
  list)     cmd_list ;;
  wait)     shift; cmd_wait "$@" ;;
  *)
    echo "Usage: mediago-api.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  health                       Check if MediaGo is reachable"
    echo "  download <url> [name] [type] Create and start a download"
    echo "  status <task-id>             Get task status"
    echo "  list                         List all downloads"
    echo "  wait <task-id>               Wait for task to complete"
    ;;
esac
