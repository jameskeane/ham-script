#!/usr/bin/env node
"use strict";

var fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    bootstrap = require('./bootstrap'),
    sourcemap = require('source-map'),
    ham = null;

// support source maps
var source_maps = require('./stack_trace').maps;

var compile = function(filename, withSM) {
  var compiler = ham || bootstrap;

  var source = fs.readFileSync(filename, 'utf8');
  var ast = compiler.parse(source);

  if(ast.walk) {
    var sourceGenerator = ast.walk({filename: filename, source: source});
    var sm = sourceGenerator.toStringWithSourceMap({file: filename});

    source_maps[filename] = new sourcemap.SourceMapConsumer(sm.map.toString());

    if(withSM) return sm;
    return sm.code;
  } else {
    return ast.toJS({});
  }
}

// hook into the require() system
require.extensions['.ham'] = function(module, filename) {
  module._compile(compile(filename), filename);
};


// first compile the ham compiler
ham = require('./ham');

var file = process.cwd() + '/' + process.argv[2]
if(process.argv[3] == '-o') {
  var sm = compile(file);
  source_maps[file] = new SourceMapConsumer(sm.map.toString());

  // TODO
} else {
  // require the file into this scope ... i.e. run it
  require(file);
}
