#!/bin/sh
set -e

# Start bot and dashboard, forward signals, and exit if any fails
node src/bot.js &
BOT_PID=$!
node dashboard/index.js &
WEB_PID=$!

term_handler() {
  kill -TERM "$BOT_PID" 2>/dev/null || true
  kill -TERM "$WEB_PID" 2>/dev/null || true
  wait "$BOT_PID" "$WEB_PID" 2>/dev/null || true
  exit 0
}

trap term_handler INT TERM

# Wait on both
wait -n "$BOT_PID" "$WEB_PID"
EXIT_CODE=$?
# If one exits, bring down the other
kill -TERM "$BOT_PID" "$WEB_PID" 2>/dev/null || true
wait 2>/dev/null || true
exit "$EXIT_CODE"
