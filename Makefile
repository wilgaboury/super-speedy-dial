SHELL := /bin/bash
.DEFAULT_GOAL := build

.PHONY: clean
clean:
	rm -rf {build,build_dev,dist,public/help.html}

.PHONY: cleanAll
cleanAll: clean
	rm -rf node_modules

node_modules: package.json package-lock.json
	npm install
	touch $@

public/help.html:
	npm exec --package=marked -- marked --silent -o public/help.html help.md 

.PHONY: install
install: node_modules public/help.html

SOURCE_FILES := $(shell find src public -type f)
OTHER_FILES := $(index.html package-lock.json package.json tsconfig.json vite.config.ts)
build: node_modules public/help.html $(SOURCE_FILES) $(OTHER_FILES)
	npm run build
	touch $@

dist:
	mkdir -p $@

dist/super-speedy-dial.zip: build dist
	cd build; zip -r ../dist/super-speedy-dial.zip *

GIT_HASH = $(shell git reset HEAD -- . &> /dev/null && git add -A &> /dev/null && if [[ -n `git stash create` ]]; then git stash create; else printf HEAD; fi)
GIT_FILES = $(shell git ls-tree -r -t --name-only $(GIT_HASH) 2> /dev/null)
dist/source.zip: dist $(GIT_FILES) $(shell pwd)
	git archive -o dist/source.zip $(GIT_HASH)

.PHONY: distAddon
distAddon: dist/super-speedy-dial.zip 

.PHONY: distSource
distSource: dist/source.zip

.PHONY: distAll
distAll: dist/super-speedy-dial.zip dist/source.zip