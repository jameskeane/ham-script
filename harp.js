var lang = require('./lang'),
    fs = require('fs'),
    _ = require('underscore'),

    ASTNode    = require('./compiler/node'),
    array      = require('./compiler/array'),
    functional = require('./compiler/functional'),
    oop        = require('./compiler/oop');

lang.Parser.HarpFile = ASTNode.extend({
  template: 'prologue',

  serialize: function() {
    var state = {}, indent = 0;

    var ret = [];

    this.elements[1].elements.forEach(function(el) {
        ret.push(el.statement.toJS(state, indent+1));
    });

    return {
      body: ret.join('\n')
    };
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
    return this.serialize().join('\n');
  }
}

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

    var elsestate = this.elements[10].block.toJS(state);

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
    return this.serialize().join('\n');
  }
}

lang.Parser.Import = {
  toJS: function(state) {
    return "";
  }
}

lang.Parser.ArrayAccess = array.ArrayAccess;
lang.Parser.ArraySlice = array.ArraySlice;
lang.Parser.ArrayNode = array.ArrayDef;
lang.Parser.ArrayRange = array.ArrayRange;

lang.Parser.Lambda = functional.Lambda;
lang.Parser.ListComprehension = functional.ListComprehension;
lang.Parser.FunctionInvocation = functional.FunctionInvocation;

lang.Parser.PrototypeExpander = oop.PrototypeExpander;
lang.Parser.ClassDef = oop.ClassDef;

lang.Parser.ExprList = {
  toJS: function(state) {
    var ret = [this.expr.toJS(state)];

    this.elements[1].elements.forEach(function(el) {
      ret.push(el.expr.toJS(state));
    });
    
    return ret.join(', ');
  }
}

lang.Parser.IdentiferChain = {
  toJS: function(state) {
    // TODO
    return this.textValue;
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
    return this.elements[0].toJS(state, indent+1);
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
    return this.textValue;
  }
}

lang.Parser.Expression = {
  toJS: function(state, indent) {
    var ret = this.value.toJS(state, indent+1);

    if(this.elements[1].value) {
      ret += ' ' + this.elements[1].elements[1].textValue;
      ret += ' ' + this.elements[1].value.toJS();
    }

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
    acc[name] = first.expr.toJS();

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

module.exports = lang;

//lang.parse(fs.readFileSync('language.hp', 'utf8')).toJS(state, indent+1);