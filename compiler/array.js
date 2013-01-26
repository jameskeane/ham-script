var _ = require('underscore'),
    ASTNode = require('./node');

module.exports.ArrayAccess = ASTNode.extend({
  toJS: function(state) {
    var ret = this.proto.toJS();
    var accessor = this.elements[4].toJS();

    return ret + '[' + accessor + ']';
  }
});

module.exports.ArraySlice = ASTNode.extend({
  toJS: function(state) {
    var ret = this.proto.toJS();

    // slice
    var start = this.elements[4].start.textValue,
        end   = this.elements[4].end.textValue,
        step  = this.elements[4].step.integer;

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
