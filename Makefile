all:
	./node_modules/canopy/bin/canopy ./src/lang.peg
	./src/main.js src/ham.js -c
	browserify src/ham.js -o src/bootstrap.js -p ./src/browserify_plugin.js

clean:
	rm -rf ./src/compiler/*.js
	rm -rf ./src/lang.js
