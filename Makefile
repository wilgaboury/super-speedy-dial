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

GEN_DIR := src/generated

GEN_HELP := $(GEN_DIR)/help.html
$(GEN_HELP): help.md node_modules
	@mkdir -p $(@D)
	npm exec --package=marked -- marked --silent -o $@ $<

.PHONY: install
INSTALL := node_modules $(GEN_HELP)
install: $(INSTALL)

SRC := $(shell find src public -type f) index.html package-lock.json package.json tsconfig.json vite.config.ts
build: $(INSTALL) $(SRC)
	npm run build
	@touch $@	

DIST_ADDON := dist/super-speedy-dial.zip
$(DIST_ADDON): build
	@mkdir -p $(@D)
	cd build; zip -r ../$@ *

GIT_STAGE = $(shell git reset HEAD -- . &> /dev/null && git add -A &> /dev/null)
GIT_STASH = $(eval GIT_STASH := $$(shell git stash create 2> /dev/null))$(GIT_STASH)
GIT_HASH = $(if $(GIT_STASH),$(GIT_STASH),HEAD)
GIT_FILES = $(GIT_STAGE)$(shell git ls-tree -r -t --name-only $(GIT_HASH) 2> /dev/null)
.SECONDEXPANSION:
DIST_SOURCE := dist/source.zip
$(DIST_SOURCE): $(shell pwd) $$(GIT_FILES)
	@mkdir -p $(@D)
	@touch $@
	git archive -o $@ $(GIT_HASH)

.PHONY: distAddon
distAddon: $(DIST_ADDON)

.PHONY: distSource
distSource: $(DIST_SOURCE)

.PHONY: dist
dist: $(DIST_ADDON) $(DIST_SOURCE)

.PHONY: watch
watch: $(INSTALL)
	npm run dev