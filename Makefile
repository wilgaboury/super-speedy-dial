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
	cp public/logo.png logo.png
	cp public/manifest.json manifest.json
	git archive -o dist/source.zip HEAD --add-file=manifest.json --add-file=logo.png
	rm logo.png
	rm manifest.json