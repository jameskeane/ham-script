var ASTNode = require('./node');

module.exports.ListComprehension = ASTNode.extend({
  template: 'comprehension',

  serialize: function(state) {
    // collect params and providers
    var params = [];
    var providers = [];

    var first = this.elements[6];
    params.push(first.ident_p.textValue);
    providers.push(first.proto.toJS());

    this.elements.slice(7, -2).forEach(function(p) {
      if(p.textValue === '') return;
      p = p.elements[0].elements[3];
      if(p.ident_p === undefined || p.proto == undefined) return;
      
      params.push(p.ident_p.textValue);
      providers.push(p.proto.toJS());
    });

    return {
      params: params,
      providers: providers,
      body: this.expr.toJS()
    }
  }
});

module.exports.Lambda = ASTNode.extend({
  template: 'lambda',
  
  serialize: function(state, indent) {
    // get the params
    var params = [];
    var first = this.elements[2].ident_p.textValue;
    if(first !== '') {
      params.push(first);
      this.elements[2].elements[1].elements.forEach(function(el) {
        params.push(el.ident_p.textValue);
      });
    }

    return {
      params: params,
      body: this.block.toJS(state)
    }
  }
});

module.exports.FunctionInvocation = ASTNode.extend({
  serialize: function(state) {
    var name = this.proto.toJS();
    if(this.elements[4].textValue === '')
      return name + "();";

    return name + "(" + this.elements[4].toJS(state) + ");";
  }
});