SHELL := /bin/bash
.DELETE_ON_ERROR:
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
BUN := false

include .env

ifneq ($(BUN),true)
    PKG_MNG := npm
    RUNTIME := node
    LOCK_FILE := package-lock.json
else
    PKG_MNG := bun
    RUNTIME := bun
    LOCK_FILE := bun.lockb
endif

.PHONY: help
help: ## Display list of commands with description
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
.DEFAULT_GOAL := help

CLEAN := build build_dev dist

.PHONY: clean
clean: ## Delete build outputs
	rm -rf $(CLEAN)

.PHONY: clean-all
clean-all: ## Delete build outputs, installed dependencies and generated sources
	rm -rf $(CLEAN) node_modules src/generated

node_modules: package.json $(LOCK_FILE)
	$(PKG_MNG) install
	@touch $@

GEN_DIR := src/generated

GEN_HELP := $(GEN_DIR)/help.html
$(GEN_HELP): help.md node_modules
	@mkdir -p $(@D)
	$(RUNTIME) ./node_modules/marked/bin/marked.js --silent -o $@ $<

.PHONY: install
INSTALL := node_modules $(GEN_HELP)
install: $(INSTALL) ## Install dependencies and generate sources

SRC := $(shell find src public -type f) index.html package-lock.json package.json tsconfig.json vite.config.ts
build: $(INSTALL) $(SRC) ## Build output artifacts
	$(PKG_MNG) run build
	@touch $@

DIST_ADDON := dist/super-speedy-dial.zip
$(DIST_ADDON): build
	@mkdir -p $(@D)
	cd build; zip -r ../$@ *

GIT_STAGE = $(shell git reset HEAD -- . &> /dev/null && git add -A &> /dev/null)
GIT_STASH = $(eval GIT_STASH := $$(shell git stash create 2> /dev/null))$(GIT_STASH)
GIT_REF = $(if $(GIT_STASH),$(GIT_STASH),HEAD)
GIT_FILES = $(GIT_STAGE)$(shell git ls-tree -r -t --name-only $(GIT_REF) 2> /dev/null)
.SECONDEXPANSION:
DIST_SOURCE := dist/source.zip
$(DIST_SOURCE): $(shell pwd) $$(GIT_FILES)
	@mkdir -p $(@D)
	@touch $@
	git archive -o $@ $(GIT_REF)

.PHONY: dist-addon
dist-addon: $(DIST_ADDON) ## Create archive of build artifacts 

.PHONY: dist-src
dist-src: $(DIST_SOURCE) ## Create archive of source code

.PHONY: dist
dist: $(DIST_ADDON) $(DIST_SOURCE) ## Create archive of build artifacts and source code

.PHONY: watch
watch: $(INSTALL) ## Build output artifacts and rebuild when files change
	$(PKG_MNG) run dev