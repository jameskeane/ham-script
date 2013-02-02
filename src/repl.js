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
      js = Ham.compile(input, filename).code;
      console.log(js);
    } catch (err) {
      cb(err);
    }
    return cb(null, vm.runInContext(js, context, filename));
  }
};

addMultilineHandler = function(repl) {
  var inputStream, multiline, nodeLineListener, outputStream, rli;
  rli = repl.rli, inputStream = repl.inputStream, outputStream = repl.outputStream;
  multiline = {
    enabled: false,
    initialPrompt: repl.prompt.replace(/^[^> ]*/, function(x) {
      return x.replace(/./g, '-');
    }),
    prompt: repl.prompt.replace(/^[^> ]*>?/, function(x) {
      return x.replace(/./g, '.');
    }),
    buffer: ''
  };
  nodeLineListener = rli.listeners('line')[0];
  rli.removeListener('line', nodeLineListener);
  rli.on('line', function(cmd) {
    if (multiline.enabled) {
      multiline.buffer += "" + cmd + "\n";
      rli.setPrompt(multiline.prompt);
      rli.prompt(true);
    } else {
      nodeLineListener(cmd);
    }
  });
  return inputStream.on('keypress', function(char, key) {
    if (!(key && key.ctrl && !key.meta && !key.shift && key.name === 'v')) {
      return;
    }
    console.log(multiline.enabled);
    if (multiline.enabled) {
      if (!multiline.buffer.match(/\n/)) {
        multiline.enabled = !multiline.enabled;
        rli.setPrompt(repl.prompt);
        rli.prompt(true);
        return;
      }
      if ((rli.line != null) && !rli.line.match(/^\s*$/)) {
        return;
      }
      multiline.enabled = !multiline.enabled;
      rli.line = '';
      rli.cursor = 0;
      rli.output.cursorTo(0);
      rli.output.clearLine(1);
      multiline.buffer = multiline.buffer.replace(/\n/g, '\uFF00');
      rli.emit('line', multiline.buffer);
      multiline.buffer = '';
    } else {
      multiline.enabled = !multiline.enabled;
      rli.setPrompt(multiline.initialPrompt);
      rli.prompt(true);
    }
  });
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
    addMultilineHandler(repl);
    return repl;
  }
};

