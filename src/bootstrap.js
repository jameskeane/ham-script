var lang = require('./lang'),
    fs = require('fs'),
    _ = require('underscore');

// ASTNode
// we will cache all compiled templates, so we don't have to read and recompile them
var template_cache = {};

var ASTNode = {
  template: '',

  _initialize: function() {

  },

  serialize: function() {
    return {};
  },

  toJS: function(state) {
    var data = this.serialize(state);
    if(typeof data === 'string') return data;

    // read the template from cache or fs
    var tmpl = template_cache[this.template];
    if(tmpl === undefined) {
      tmpl = _.template(fs.readFileSync(__dirname + '/compiler/templates/' + this.template + '.ejs', 'utf8'));
      template_cache[this.template] = tmpl;
    }

    return tmpl(data);
  }
};

ASTNode.extend = function(o) {
  return _.defaults(o, ASTNode);
};


// AST Transformers
lang.Parser.HamFile = ASTNode.extend({
  template: 'prologue',

  serialize: function(state) {
    var indent = 0;

    if(this.expr) {
      return tmpl({}) + 'return ' + this.expr.toJS(state, indent) + ';})();';
    }

    var ret = [];

    this.elements.forEach(function(el) {
        ret.push(el.statement.toJS(state, indent+1));
    });

    // read the template from cache or fs
    var tmpl = template_cache[this.template];
    if(tmpl === undefined) {
      tmpl = _.template(fs.readFileSync(__dirname + '/compiler/templates/' + this.template + '.ejs', 'utf8'));
      template_cache[this.template] = tmpl;
    }

    return tmpl({}) +  ret.join('\n') + '})();';
  }
});

lang.Parser.FunctionalBlock = {
  serialize: function(state) {
    var stmts = [];

    if(this.expr) {
      stmts.push('return ' + this.expr.toJS(state) + ';');
    } else {
      this.elements[2].elements.forEach(function(el) {
        stmts.push(el.statement.toJS(state));
      });
    }

    return stmts;
  },

  toJS: function(state, indent) {
    return this.serialize(state).join('\n');
  }
}

lang.Parser.ObjectNew = ASTNode.extend({
  serialize: function(state) {
    return 'new ' + this.expr.toJS(state);
  }
});

lang.Parser.IfStmt = ASTNode.extend({
  template: 'if_stmt',

  serialize: function(state) {
    var condition = this.expr.toJS(state);
    var main_block = this.block.toJS(state);
    var elifs = [];

    // generate the elifs
    this.elements[9].elements.forEach(function(el) {
      elifs.push([el.expr.toJS(state), el.block.toJS(state)]);
    });

    var elsestate = this.elements[10].block ? this.elements[10].block.toJS(state) : '';

    return {
      cond: condition,
      main_block: main_block,
      elifs: elifs,
      elsestate: elsestate
    };
  }
});

lang.Parser.Block = {
  serialize: function(state) {
    var stmts = [];

    this.elements[2].elements.forEach(function(el) {
      stmts.push(el.statement.toJS(state));
    });

    return stmts;
  },

  toJS: function(state, indent) {
    return this.serialize(state).join('\n');
  }
}

lang.Parser.Import = {
  toJS: function(state) {
    return "";
  }
}

lang.Parser.ArrayAccess = ASTNode.extend({
  toJS: function(state) {
    var accessor = this.elements[2].toJS(state);

    return '[' + accessor + ']';
  }
});

lang.Parser.ArraySlice = ASTNode.extend({
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

lang.Parser.ArrayRange = ASTNode.extend({
  template: 'array_range', 

  serialize: function(state) {
    return {
      start: this.start.textValue,
      end: this.end.textValue
    };
  }
});

lang.Parser.ArrayNode = ASTNode.extend({
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

lang.Parser.ListComprehension = ASTNode.extend({
  template: 'comprehension',

  serialize: function(state) {
    // collect params and providers
    var params = [];
    var providers = [];

    var first = this.elements[6];
    params.push(first.ident_p.textValue);
    providers.push(first.expr.toJS(state));

    this.elements.slice(7, -2).forEach(function(p) {
      if(p.textValue === '') return;
      p = p.elements[0].elements[3];
      if(p.ident_p === undefined || p.expr == undefined) return;
      
      params.push(p.ident_p.textValue);
      providers.push(p.expr.toJS(state));
    });

    return {
      params: params,
      providers: providers,
      body: this.expr.toJS(state)
    }
  }
});

lang.Parser.Lambda = ASTNode.extend({
  template: 'lambda',
  
  serialize: function(state, indent) {
    // get the params
    var params = [];

    // Is it a no param list lambda?
    if(this.elements[0].textValue !== '') {
      var first = this.elements[0].elements[2].ident_p;
      if(first !== undefined) {
        params.push(first.textValue);
        var it = this.elements[0].elements[2].elements[1];
        it.forEach(function(el) {
          params.push(el.ident_p.elements[0].textValue);
        });
      }
    }

    return {
      params: params,
      body: this.funblock.toJS(state)
    }
  }
});

lang.Parser.FunctionInvocation = ASTNode.extend({
  serialize: function(state) {
    if(this.lambda) {
      return "(" + this.lambda.toJS(state) + ")";
    }

    if(this.elements[2].textValue === '') {
      return "()";
    }

    return "(" + this.elements[2].toJS(state) + ")";
  }
});


lang.Parser.ClassDef = ASTNode.extend({
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

lang.Parser.PrototypeExpander = ASTNode.extend({
  serialize: function(state) {
    var ret = this.ident.toJS(state);
    if(this.elements[1].ident_p)  {
      ret += '.prototype.' + this.elements[1].ident_p.textValue;
    }
    return ret;
  }
});

lang.Parser.ExprList = {
  toJS: function(state) {
    var ret = [this.expr.toJS(state)];

    this.elements[1].elements.forEach(function(el) {
      ret.push(el.expr.toJS(state));
    });
    
    return ret.join(', ');
  }
}

lang.Parser.ValueAccessor = {
  toJS: function(state) {
    // TODO
    var ret = this.value.toJS(state);

    if(this.elements[1].textValue !== '') {
      this.elements[1].elements.forEach(function(el) {
        if(el.value) {
          ret += '.' + el.value.toJS(state);
        } else {
          ret += el.accessor.toJS(state);
        }
      });
    }

    return ret;
  }
}

lang.Parser.Identifier = {
  val: function() {

  },
  toJS: function(state, indent) {
    return this.textValue;
  }
}

lang.Parser.ExprStmt = {
  toJS: function(state, indent) {
    return this.elements[0].toJS(state, indent+1) + ';';
  }
}


lang.Parser.Type = {
  val: function() {

  },
  toJS: function(state, indent) {
    return this.textValue;
  }
}

lang.Parser.ReturnStmt = {
  toJS: function(state, indent) {
    var ret = "return";
    if(this.expr.toJS) {
      ret += " " + this.expr.toJS(state);
    }
    ret += ';';
    return ret;
  }
}

lang.Parser.ParenExpression = {
  toJS: function(state) {
    return "(" + this.expr.toJS(state) + ")";
  }
}

lang.Parser.Expression = {
  translate: {
    'or': '||',
    'is': '===',
    'isnt': '!=='
  },

  toJS: function(state, indent) {
    var ret = this.value_acs.toJS(state, indent+1);

    this.elements[1].elements.forEach(function(el) {      
      var op = this.translate[el.binaryop.textValue];
      if(op === undefined)
        op = el.binaryop.textValue;

      ret += ' ' + op + ' ' + el.value_acs.toJS(state);
    }.bind(this));

    return ret;
  }
}

lang.Parser.Assignment = {
  toJS: function(state, indent) {
    return this.ident.toJS(state, indent+1);
  }
}

lang.Parser.VariableDef = {
  toJS: function(state, indent) {
    var ident = this.ident.toJS(state, indent+1);
    var has_type = this.elements[3].type !== undefined;

    var value = this.elements[4].expr ? this.elements[4].expr.toJS(state, indent+1) : "null";
    return "var " + ident + " = " + value + ";";
  }
}

lang.Parser.ObjectNode = {
  serialize: function(state) {
    var acc = {};

    var first = this.elements[1].elements[0];
    if(!first || first.textValue === '') return acc;

    var name = first.name.val ? first.name.val() : first.name.textValue;
    acc[name] = first.expr.toJS(state);

    this.elements[1].elements[1].elements.forEach(function(node) {
      if(node.textValue === '') return;

      var val = node.object_p.name.val ? node.object_p.name.val() : node.object_p.name.textValue;
      acc[val] = node.object_p.expr.toJS(state);
    });

    return acc;
  },

  toJS: function(state, indent) {
    var properties = this.serialize(state);
    var ret = [];
    _.each(properties, function(value, key) {
      ret.push(key + ': ' + value);
    });

    return "{\n" + ret.join(',\n') + "\n}";
  }
}

lang.Parser.StringNode = {
  val: function() {
    return this.elements[1].textValue;
  },
  toJS: function(state, indent) {
    return this.textValue;
  }
}

lang.Parser.NumberNode = {
  val: function() {
    return parseFloat(this.textValue, 10);
  },
  toJS: function(state, indent) {
    return this.textValue;
  }
}

lang.Parser.SpecialNode = {
  val: function() {
    if(this.textValue === 'true')  return true;
    if(this.textValue === 'false') return false;
    if(this.textValue === 'null')  return null;
  },
  toJS: function(state, indent) {
    return this.textValue;
  }
}

module.exports.compile = function(filename) {
  var source = fs.readFileSync(filename, 'utf8');
  var ast = lang.parse(source);
  return ast.toJS({});
}
module.exports.eval = function(source) {
  var ast = lang.parse(source);
  return eval(ast.toJS({}));
}