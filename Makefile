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
	touch build

.PHONY: dist
dist: dist/super-speedy-dial.zip

dist/super-speedy-dial.zip: build
	mkdir -p dist
	cd build; zip -r ../dist/super-speedy-dial.zip *

GIT_HASH := $(shell git reset HEAD -- . &> /dev/null && git add -A &> /dev/null && if [[ -n `git stash create` ]]; then git stash create; else printf HEAD; fi)
GIT_FILES := $(shell git ls-files --others --exclude-standard --cached 2> /dev/null)
GIT_DIRS := $(shell git ls-tree -d -r --name-only $(GIT_HASH) 2> /dev/null)
dist/source.zip: $(GIT_FILES) $(GIT_DIRS) $(shell pwd)
	mkdir -p dist
	git archive -o dist/source.zip $(GIT_HASH)

.PHONY: distAll
distAll: dist/super-speedy-dial.zip dist/source.zip