#!/bin/bash
# Local preview of the whole site (intro, /work, and case studies).
# Mac: run `bash preview.command` in Terminal (or double-click it in a git clone).
# Serves this folder over HTTP so root links like /work/ and /#play work,
# opens your browser, and prints an address for your phone (same Wi-Fi only).
# Press Ctrl+C (or close the window) to stop.

cd "$(dirname "$0")" || exit 1

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 isn't installed. On a Mac, run: xcode-select --install"
  read -r -p "Press Return to close."
  exit 1
fi

# Use port 8000, or the next free one if it's busy.
PORT=8000
while lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT + 1)); done
URL="http://localhost:$PORT"

# This computer's address on the local network, for phones and tablets.
LAN_IP=""
for IF in en0 en1 en2; do
  LAN_IP=$(ipconfig getifaddr "$IF" 2>/dev/null) && [ -n "$LAN_IP" ] && break
done
[ -z "$LAN_IP" ] && LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')

echo ""
echo "  Previewing the site at $URL"
echo "    Intro:          $URL/"
echo "    Work page:      $URL/work/"
echo "    Press Start:    $URL/work/press-start/"
echo "    Hal's Big Dig:  $URL/work/hals-big-dig/"
echo ""
if [ -n "$LAN_IP" ]; then
  echo "  Phone (same Wi-Fi):  http://$LAN_IP:$PORT"
  echo "    If macOS asks to allow incoming connections for Python, click Allow."
  echo "    Anyone on this Wi-Fi can open it while it runs, so stop it on public networks."
else
  echo "  Phone: couldn't find this computer's network address (are you on Wi-Fi?)."
fi
echo ""
echo "  Press Ctrl+C to stop."
echo ""

( sleep 1; open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null ) &
python3 -m http.server "$PORT" --bind 0.0.0.0
