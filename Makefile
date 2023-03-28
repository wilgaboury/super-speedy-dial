.PHONY: clean deepClean dist

clean:
	rm -rf build
	rm -rf dist

deepClean:
	rm -rf build
	rm -rf dist
	rm -rf node_modules

dist:
	npm run build
	mkdir -p dist
	rm -rf dist/*
	cd build; zip -r ../dist/super-speedy-dial.zip *
	git archive -o dist/source.zip HEAD