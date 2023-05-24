SHELL := /bin/bash
.DEFAULT_GOAL := build

CLEAN := build build_dev dist

.PHONY: clean
clean:
	rm -rf $(CLEAN)

.PHONY: cleanAll
cleanAll:
	rm -rf $(CLEAN) node_modules src/generated

node_modules: package.json package-lock.json
	npm install
	@touch $@

src/generated/help.html: help.md
	@mkdir -p $(@D)
	npm exec --package=marked -- marked --silent -o $@ $<

.PHONY: install
install: node_modules src/generated/help.html

SOURCE_FILES := $(shell find src public -type f)
OTHER_FILES := $(index.html package-lock.json package.json tsconfig.json vite.config.ts)
build: node_modules src/generated/help.html $(SOURCE_FILES) $(OTHER_FILES)
	npm run build
	@touch $@	

dist/super-speedy-dial.zip: build
	@mkdir -p $(@D)
	cd build; zip -r ../dist/super-speedy-dial.zip *

GIT_STASH = $(eval GIT_STASH := $$(shell git stash create))$(GIT_STASH)
GIT_HASH = $(shell git reset HEAD -- . &> /dev/null && git add -A &> /dev/null && if [[ -n "$(GIT_STASH)" ]]; then printf $(GIT_STASH); else printf HEAD; fi)
GIT_FILES = $(shell git ls-tree -r -t --name-only $(GIT_HASH) 2> /dev/null)
.SECONDEXPANSION:
dist/source.zip: $(shell pwd) $$(GIT_FILES)
	@mkdir -p $(@D)
	git archive -o dist/source.zip $(GIT_HASH)

.PHONY: distAddon
distAddon: dist/super-speedy-dial.zip 

.PHONY: distSource
distSource: dist/source.zip

.PHONY: dist
dist: dist/super-speedy-dial.zip dist/source.zip