var ASTNode = require('./node');

module.exports.ClassDef = ASTNode.extend({
  template: 'class',

  serialize: function(state) {
    var parent = this.elements[4].ident ? this.elements[4].ident.toJS(state) : 'Object';

    return {
      name: this.ident.toJS(state),
      parent: parent,
      body: this.elements[5].toJS(state)
    }
  }
});

module.exports.PrototypeExpander = ASTNode.extend({
  serialize: function() {
    var ret = this.ident.toJS();
    if(this.elements[1].ident_p)  {
      ret += '.prototype.' + this.elements[1].ident_p.textValue;
    }
    return ret;
  }
});