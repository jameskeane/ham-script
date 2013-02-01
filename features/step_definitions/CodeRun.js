var CodeRunDefinitionsWrapper = function () {
  var ham = require('../../src/main');

  var eval_result = null;

  this.Given(/^`([^`]*)`$/, function(code, callback) {
    eval_result = JSON.stringify(ham.eval(code));
    callback();
  });

  this.Then(/^the result should be `([^`]*)`$/, function(result, callback) {
    // matching groups are passed as parameters to the step definition

    if(eval_result !== JSON.stringify(eval(result)))
      callback.fail(new Error("Result should have been " + result + ", rather than " + eval_result + "."));
    else
      callback();
  });
};

module.exports = CodeRunDefinitionsWrapper;