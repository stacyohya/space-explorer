#!/bin/sh
# Stamp script/style URLs with a version so browsers (esp. iPad home-screen apps)
# never keep a stale copy, then commit and push to GitHub Pages.
set -e
cd "$(dirname "$0")/.."
V=$(date +%Y%m%d%H%M)
sed -i '' -E "s/(content\.js|app\.js|audio\/manifest\.js|manifest\.json)(\?v=[0-9]+)?/\1?v=$V/g" index.html
git add -A
git commit -q -m "${1:-Update} (build $V)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" || { echo "nothing to commit"; exit 0; }
git push -q origin main
echo "pushed build $V"
