#!/bin/bash -e

DIRNAME=$(dirname "$0")


npx esbuild "$DIRNAME/src/main.js" \
  --bundle \
  --outfile="$DIRNAME/dist/main.js" \
  --platform=node
