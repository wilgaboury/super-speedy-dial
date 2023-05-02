.DEFAULT_GOAL := build

.PHONY: clean
clean:
	rm -rf build
	rm -rf dist

.PHONY: deepClean
deepClean:
	rm -rf build
	rm -rf dist
	rm -rf node_modules

node_modules:
	npm install

SOURCE_FILES := $(shell find src -type f)
MISC_SOURCE_FILES := $(index.html vite.config.ts tsconfig.json)
build: node_modules $(SOURCE_FILES) $(MISC_SOURCE_FILES)
	npm run build

dist:
	mkdir -p dist

dist/super-speedy-dial.zip: build dist
	cd build; zip -r ../dist/super-speedy-dial.zip *

GIT_FILES = $(shell git ls-files 2> /dev/null)
dist/source.zip: dist $(GIT_FILES)
	git archive -o dist/source.zip HEAD
