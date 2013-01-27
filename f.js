var f = (function() {
  var tmp = [];
  
  var x = (function() {
  var acc = [];
  for(var i = 1; i <= 10; i++) {
    acc.push(i);
  }
  return acc;
})();
  

  var evaluator = function(x) {
    return x;
  };

  for(var i = 0; i < Math.min(x.length); i++) {
    tmp.push(evaluator(x[i]));
  }

  return tmp;
})();

console.log(f);
