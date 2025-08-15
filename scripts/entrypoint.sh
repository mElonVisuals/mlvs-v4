#!/bin/sh
set -euo pipefail

echo "[entrypoint] Starting bot + web"
echo "[entrypoint] Node: $(node -v) | PORT=${PORT:-3005} | LOG_LEVEL=${LOG_LEVEL:-info} | NODE_ENV=${NODE_ENV:-}"

# Start bot and dashboard, forward signals, and exit if any fails
node src/bot.js &
BOT_PID=$!
echo "[entrypoint] Bot PID=$BOT_PID"

# Start web (app.js)
node app.js &
WEB_PID=$!
echo "[entrypoint] Web(app.js) PID=$WEB_PID"

term_handler() {
  echo "[entrypoint] Caught signal, terminating..."
  kill -TERM "$BOT_PID" 2>/dev/null || true
  kill -TERM "$WEB_PID" 2>/dev/null || true
  wait "$BOT_PID" "$WEB_PID" 2>/dev/null || true
  echo "[entrypoint] Exited cleanly"
  exit 0
}

trap term_handler INT TERM

# Wait on both
set +e
wait -n "$BOT_PID" "$WEB_PID"
EXIT_CODE=$?
set -e
echo "[entrypoint] A process exited with code $EXIT_CODE, shutting down others"
kill -TERM "$BOT_PID" "$WEB_PID" 2>/dev/null || true
wait 2>/dev/null || true
exit "$EXIT_CODE"
