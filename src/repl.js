var Ham, addMultilineHandler, nodeREPL, replDefaults, vm;
var _ = require('underscore');
vm = require('vm');
nodeREPL = require('repl');
Ham = require('./ham');

replDefaults = {
  prompt: '> ',
  "eval": function(input, context, filename, cb) {
    var js;
    if (/^\s*$/.test(input)) {
      return cb(null);
    }

    try {
      js = Ham.compile(input, filename, {bare: true}).code;
    } catch (err) {
      return cb(err.stack.replace(/^Error/, "SyntaxError"));
    }
    return cb(null, vm.runInContext(js, context, filename));
  }
};

module.exports = {
  start: function(opts) {
    var repl;
    if (opts == null) {
      opts = {};
    }
    opts = _.defaults(opts, replDefaults);
    repl = nodeREPL.start(opts);
    repl.on('exit', function() {
      return repl.outputStream.write('\n');
    });
    //addMultilineHandler(repl);
    return repl;
  }
};

