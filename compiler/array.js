var _ = require('underscore'),
    ASTNode = require('./node');

module.exports.ArrayAccess = ASTNode.extend({
  toJS: function(state) {
    var accessor = this.elements[2].toJS();

    return '[' + accessor + ']';
  }
});

module.exports.ArraySlice = ASTNode.extend({
  toJS: function(state) {
    var ret = '';

    // slice
    var start = this.elements[2].start.textValue,
        end   = this.elements[2].end.textValue,
        step  = this.elements[2].step.integer;

    start = start === '' ? '0' : start;
    if(start !== '0' || end !== '') {
      ret += '.slice('+start
      if(end !== '') ret += ', '+end
      ret += ')'
    }
    
    if(step) {
      ret += '.step(' + step.textValue + ')'
    }
    return ret;
  }
});

module.exports.ArrayRange = ASTNode.extend({
  template: 'array_range', 

  serialize: function(state) {
    return {
      start: this.start.textValue,
      end: this.end.textValue
    };
  }
});

module.exports.ArrayDef = ASTNode.extend({
  toJS: function(state, indent) {
    if(this.elements[2].textValue === '') {
      return "[]"
    }

    var first = this.elements[2];
    var acc = [first.expr.elements[0].toJS(state, indent+1)];

    first.elements[1].elements.forEach(function(node) {
      acc.push(node.expr.elements[0].toJS(state, indent+1));
    });

    return "[" + acc.join(', ') + "]";
  }
});
