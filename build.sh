#!/bin/bash -e

DIRNAME=$(dirname "$0")


npm install --no-save @vercel/ncc@^0.31.1
npx ncc build "$DIRNAME/src/main.js" --license=licenses.txt
mv "$DIRNAME/dist/index.js" "$DIRNAME/dist/main.js"
