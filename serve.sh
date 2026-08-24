#!/usr/bin/env bash
# Serve the site locally. Needs nothing installed — python3 ships with macOS.
# Usage:  ./serve.sh        (port 8000)
#         ./serve.sh 9000   (any other port)
PORT="${1:-8000}"
cd "$(dirname "$0")"
echo ""
echo "  Save the Date  →  http://localhost:$PORT"
echo "  Ctrl-C to stop"
echo ""
# open the browser once the server is actually up
( sleep 1; open "http://localhost:$PORT" ) &
exec python3 -m http.server "$PORT"
