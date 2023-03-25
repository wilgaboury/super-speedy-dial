#!/bin/bash

cd "$(dirname "$0")"

npm run build
mkdir -p dist
rm -rf dist/*
cd build
zip -r ../dist/super-speedy-dial.zip *
cd ..
git archive -o dist/source.zip HEAD