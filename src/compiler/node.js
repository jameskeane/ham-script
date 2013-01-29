var _ = require('underscore'),
    fs = require('fs');

// we will cache all compiled templates, so we don't have to read and recompile them
var template_cache = {};

var Node = {
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
      tmpl = _.template(fs.readFileSync(__dirname + '/templates/' + this.template + '.ejs', 'utf8'));
      template_cache[this.template] = tmpl;
    }

    return tmpl(data);
  }
};

Node.extend = function(o) {
  return _.defaults(o, Node);
};

module.exports = Node;