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

SOURCE_FILES = $(shell git ls-files)
build: node_modules $(SOURCE_FILES)
	npm run build

.PHONY: forceBuild
forceBuild: node_modules $(SOURCE_FILES)
	npm run build

.PHONY: distAll
distAll: dist/super-speedy-dial.zip  dist/source.zip

.PHONY: distApp
distApp: dist/super-speedy-dial.zip

.PHONY: distSource
distSource: dist/source.zip

dist:
	mkdir -p dist

dist/super-speedy-dial.zip: build dist
	cd build; zip -r ../dist/super-speedy-dial.zip *

dist/source.zip: dist $(SOURCE_FILES)
	git archive -o dist/source.zip HEAD
