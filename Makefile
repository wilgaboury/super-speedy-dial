.DEFAULT_GOAL := build

.PHONY: clean
clean:
	rm -rf build
	rm -rf build_dev
	rm -rf dist

.PHONY: cleanAll
cleanAll: clean
	rm -rf node_modules

node_modules: package.json package-lock.json
	npm install
	touch node_modules

SOURCE_FILES := $(shell find src public -type f)
OTHER_FILES := $(index.html Makefile package-lock.json package.json tsconfig.json vite.config.ts)
build: node_modules $(SOURCE_FILES) $(OTHER_FILES)
	npm run build

.PHONY: dist
dist: dist/super-speedy-dial.zip

dist/super-speedy-dial.zip: build
	mkdir -p dist
	cd build; zip -r ../dist/super-speedy-dial.zip *

.PHONY: distSrc
distSrc: dist
	mkdir -p dist
	git archive -o dist/source.zip HEAD

.PHONY: distAll
distAll: dist/super-speedy-dial.zip distSrc