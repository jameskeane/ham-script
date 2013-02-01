all: peg
	./src/main.js src/ham.js -c
	./node_modules/.bin/browserify src/ham.js -o src/bootstrap.js -p ./src/browserify_plugin.js

peg: src/lang.peg
	./node_modules/.bin/canopy ./src/lang.peg

clean:
	rm -rf ./src/compiler/*.js
