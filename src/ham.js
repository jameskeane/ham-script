var lang = require('./lang'),
    fs = require('fs'),
    _ = require('underscore'),

    ASTNode    = require('./compiler/node'),
    array      = require('./compiler/array'),
    functional = require('./compiler/functional'),
    oop        = require('./compiler/oop');

lang.Parser.HamFile = new ASTNode.extend({
  template: 'prologue',

  serialize: function(state) {
    this.source.add(this.compile({}));

    this.elements[1].elements.forEach(function(el) {
        this.source.add(el.statement.walk(state));
    }.bind(this));

    this.source.add('})();');
  }
});

lang.Parser.ObjectNew = ASTNode.extend({
  serialize: function(state) {
    this.source.add('new ');
    this.source.add(this.expr.walk(state));
  }
});

lang.Parser.FunctionalBlock = ASTNode.extend({
  serialize: function(state) {
    if(this.expr) {
      this.source.add('return ');
      this.source.add(this.expr.walk(state));
      this.source.add(';');
    } else {
      this.elements[2].elements.forEach(function(el) {
        this.source.add(el.statement.walk(state));
      }.bind(this));
    }
  }
});

lang.Parser.IfStmt = ASTNode.extend({
  serialize: function(state) {
    var condition = this.expr.walk(state);
    var main_block = this.block.walk(state);
    var elifs = [];

    // generate the elifs
    this.elements[9].elements.forEach(function(el) {
      elifs.push([el.expr.walk(state), el.block.walk(state)]);
    }.bind(this));

    var elsestate = this.elements[10].block ? this.elements[10].block.walk(state) : '';

    // create the source
    this.source.add('if('); this.source.add(condition); this.source.add('){');
    this.source.add(main_block);
    elifs.forEach(function(elif) {
      this.source.add('} else if('); this.source.add(elif[0]); this.source.add('){');
        this.source.add(elif[1]);
    }.bind(this));
    if(elsestate !== '') {
      this.source.add('} else {');
        this.source.add(elsestate);
    }
    this.source.add('}');
  }
});

lang.Parser.Block = ASTNode.extend({
  serialize: function(state) {
    this.elements[2].elements.forEach(function(el) {
      this.source.add(el.statement.walk(state));
    }.bind(this));
  }
});

lang.Parser.Import = ASTNode.extend({
  serialize: function(state) {
    return "";
  }
});

lang.Parser.ArrayAccess = array.ArrayAccess;
lang.Parser.ArraySlice = array.ArraySlice;
lang.Parser.ArrayNode = array.ArrayDef;
lang.Parser.ArrayRange = array.ArrayRange;

lang.Parser.Lambda = functional.Lambda;
lang.Parser.ListComprehension = functional.ListComprehension;
lang.Parser.FunctionInvocation = functional.FunctionInvocation;

lang.Parser.PrototypeExpander = oop.PrototypeExpander;
lang.Parser.ClassDef = oop.ClassDef;

lang.Parser.ExprList = ASTNode.extend({
  serialize: function(state) {
    this.source.add(this.expr.walk(state));

    this.elements[1].elements.forEach(function(el) {
      this.source.add(el.expr.walk(state));
    }.bind(this));
  }
});

lang.Parser.ValueAccessor = ASTNode.extend({
  serialize: function(state) {
    this.source.add(this.value.walk(state));

    if(this.elements[1].textValue !== '') {
      this.elements[1].elements.forEach(function(el) {
        if(el.value) {
          this.source.add('.');
          this.source.add(el.value.walk(state));
        } else {
          this.source.add(el.accessor.walk(state));
        }
      }.bind(this));
    }
  }
});

lang.Parser.Identifier = ASTNode.extend({
  serialize: function(state) {
    this.source.add(this.textValue);
  }
});

lang.Parser.ExprStmt = ASTNode.extend({
  serialize: function(state) {
    this.source.add(this.elements[0].walk(state));
    this.source.add(';');
  }
});


lang.Parser.Type = ASTNode.extend({
  val: function() {

  },
  toJS: function(state, indent) {
    return this.textValue;
  }
});

lang.Parser.ReturnStmt = ASTNode.extend({
  serialize: function(state) {
    this.source.add('return');
    if(this.expr.walk) {
      this.source.add(' ');
      this.source.add(this.expr.walk(state));
    }
    this.source.add(';');
  }
});

lang.Parser.ParenExpression = ASTNode.extend({
  serialize: function(state) {
    this.source.add('(');
    this.source.add(this.expr.walk(state));
    this.source.add(')');
  }
});

lang.Parser.Expression = ASTNode.extend({
  translate: {
    'or': '||',
    'is': '===',
    'isnt': '!=='
  },

  serialize: function(state) {
    this.source.add(this.value_acs.walk(state));

    this.elements[1].elements.forEach(function(el) {      
      var op = this.translate[el.binaryop.textValue];
      if(op === undefined)
        op = el.binaryop.textValue;

      this.source.add(' ' + op + ' ');
      this.source.add(el.value_acs.walk(state));
    }.bind(this));
  }
});

lang.Parser.Assignment = ASTNode.extend({
  serialize: function(state) {
    this.source.add(this.ident.walk(state));
  }
});

lang.Parser.VariableDef = ASTNode.extend({
  serialize: function(state) {
    var ident = this.ident.walk(state);
    var has_type = this.elements[3].type !== undefined;

    var value = this.elements[4].expr ? this.elements[4].expr.walk(state) : "null";

    this.source.add('var ');
    this.source.add(ident);
    this.source.add(' = ');
    this.source.add(value);
    this.source.add(';');
  }
});

lang.Parser.ObjectNode = ASTNode.extend({
  serialize: function(state) {
    this.source.add('{');

    var first = this.elements[1].elements[0];
    if(first && first.textValue !== '') {
      var acc = {};
      var name = first.name.val ? first.name.val() : first.name.textValue;

      this.source.add(name + ': ');
      this.source.add(first.expr.walk(state));

      this.elements[1].elements[1].elements.forEach(function(node) {
        if(node.textValue === '') return;

        var val = node.object_p.name.val ? node.object_p.name.val() : node.object_p.name.textValue;

        this.source.add(', ' + val + ':');
        this.source.add(node.object_p.expr.walk(state));
      }.bind(this));
    }

    this.source.add('}');
  }
});

lang.Parser.StringNode = ASTNode.extend({
  serialize: function(state) {
    this.source.add(this.elements[0].textValue);
    this.source.add(this.elements[1].textValue);
    this.source.add(this.elements[2].textValue);
  },
  val: function() {
    return this.elements[1].textValue;
  }
});

lang.Parser.NumberNode = ASTNode.extend({
  serialize: function(state) {
    this.source.add(this.textValue);
  },
  val: function() {
    return parseFloat(this.textValue, 10);
  }
});

lang.Parser.SpecialNode = ASTNode.extend({
  serialize: function(state) {
    this.source.add(this.textValue);
  },
  val: function() {
    if(this.textValue === 'true')  return true;
    if(this.textValue === 'false') return false;
    if(this.textValue === 'null')  return null;
  }
});

module.exports = lang;

//lang.parse(fs.readFileSync('language.hp', 'utf8')).toJS(state, indent+1);