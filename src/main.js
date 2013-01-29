#!/usr/bin/env node
"use strict";

var fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    bootstrap = require('./bootstrap'),
    ham = null;

// hook into the require() system
require.extensions['.ham'] = function(module, filename) {
  var compiler = ham || bootstrap;

  var source = fs.readFileSync(filename, 'utf8');
  var ast = compiler.parse(source);

  if(ast.walk) {
    var sourceGenerator = ast.walk({filename: filename, source: source});
    module._compile(sourceGenerator.toString(), filename);
  } else {
    module._compile(ast.toJS({}), filename);
  }
};

// first compile the ham compiler
ham = require('./ham');

// require the file into this scope
require(process.cwd() + '/' + process.argv[2]);
