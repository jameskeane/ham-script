#!/usr/bin/env node
"use strict";

var fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    sourcemap = require('source-map'),
    argv = require('optimist').argv,
    ham = require('./bootstrap');

// support source map'd stack traces
var source_maps = require('./stack_trace').maps;

// hook into the require() system
require.extensions['.ham'] = function(module, filename) {
  var mod = ham.compile(fs.readFileSync(filename, 'utf8'), filename);
  var source = mod;

  if(typeof mod !== 'string') {
    source = mod.code;
    source_maps[filename] = new sourcemap.SourceMapConsumer(mod.map.toString());
  }

  if(argv.c) {
    var out_file = filename.replace(/\.ham$/, '.js');
    fs.writeFile(out_file, source);
  }

  module._compile(source, filename);
};

// compile the compiler
ham = require('./ham');

// once we are here we know we are bootstrapped
if(argv.o) {
  var out_file = argv.o,
      map_file = out_file + '.map';

  var sm = ham.compile(process.cwd() + '/' + argv._[0]);
  if(out_file === true) {
    console.log(sm.code);
  } else {
    sm.code += '\n//@ sourceMappingURL=' + map_file;
    sm.code += '\n//@ sourceURL=' + argv._[0];
    fs.writeFile(map_file, sm.map.toString());
    fs.writeFile(out_file, sm.code);
  }
} else if(argv._.length > 0) {
  require(process.cwd() + '/' + argv._[0]);
}

/*
var file = process.cwd() + '/' + process.argv[2]
if(process.argv[3] == '-o') {
  var sm = compile(file);
  source_maps[file] = new SourceMapConsumer(sm.map.toString());

  // TODO
} else {
  // require the file into this scope ... i.e. run it
  require(file);
}
*/

module.exports.eval = ham.eval;