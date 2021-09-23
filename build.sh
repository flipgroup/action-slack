#!/bin/bash -e

DIRNAME=$(dirname "$0")


npm install --no-save esbuild@^0.13.1
npx esbuild "$DIRNAME/src/main.js" \
  --bundle \
  --outfile="$DIRNAME/dist/main.js" \
  --platform=node
