module.exports = function(bundle) {
  bundle.register('post', function(src) {
    return src.replace('require("/src/ham.js");', 'module.exports = require("/src/ham.js");')
  });
}