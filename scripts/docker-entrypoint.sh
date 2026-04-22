#!/bin/sh
# MediaGo Docker entrypoint.
#
# `exec` replaces the shell with mediago-core so signals (SIGTERM on
# `docker stop`) reach the Go process directly — no shell wrapper in the
# middle that would swallow them. `"$@"` forwards any extra args passed
# via `docker run ... mediago-core --foo=bar`, letting callers override
# individual flags without replacing the whole command.
set -e

exec mediago-core \
  --port=8899 \
  --static-dir=/app/static \
  --enable-auth \
  --db-path=/app/mediago/data/mediago.db \
  --config-dir=/app/mediago/data \
  --log-dir=/app/mediago/logs \
  --local-dir=/app/mediago/downloads \
  --deps-dir=/app/deps \
  "$@"
