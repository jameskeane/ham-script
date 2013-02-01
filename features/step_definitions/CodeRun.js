var CodeRunDefinitionsWrapper = function () {
  var ham = require('../../src/main');

  var eval_result = null;

  this.Given(/^`([^`]*)`$/, function(code, callback) {
    eval_result = ham.eval(code);
    callback();
  });

  this.Then(/^the result should be `([^`]*)`$/, function(result, callback) {
    // matching groups are passed as parameters to the step definition
    
    if(JSON.stringify(eval_result) !== JSON.stringify(eval(result)))
      callback.fail(new Error("Result should have been " + result + ", rather than " + eval_result + "."));
    else
      callback();
  });

  this.Then(/^applying `([^`]*)` will yield `([^`]*)`$/, function(args, result, callback) {
    var yielded = eval_result.apply(undefined, eval(args));
    if(JSON.stringify(yielded) !== JSON.stringify(eval(result))) {
      callback.fail(new Error("Result should have been " + result + ", rather than " + yielded + "."));
    } else {
      callback();
    }
  });
};

module.exports = CodeRunDefinitionsWrapper;