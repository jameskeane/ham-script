#!/usr/bin/env node
"use strict";

var fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    ham = require('./ham');

// hook into the require() system
require.extensions['.ham'] = function(module, filename) {
  var js = ham.parse(fs.readFileSync(filename, 'utf8')).toJS();
  module._compile(js, filename);
};

// require the file into this scope
require(process.cwd() + '/' + process.argv[2]);
