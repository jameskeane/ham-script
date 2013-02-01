(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/src/lang.js",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var extend = function (destination, source) {
    if (!destination || !source) return destination;
    for (var key in source) {
      if (destination[key] !== source[key])
        destination[key] = source[key];
    }
    return destination;
  };
  
  var find = function (root, objectName) {
    var parts = objectName.split('.'),
        part;
    
    while (part = parts.shift()) {
      root = root[part];
      if (root === undefined)
        throw new Error('Cannot find object named ' + objectName);
    }
    return root;
  };
  
  var formatError = function (error) {
    var lines  = error.input.split(/\n/g),
        lineNo = 0,
        offset = 0;
    
    while (offset < error.offset + 1) {
      offset += lines[lineNo].length + 1;
      lineNo += 1;
    }
    var message = 'Line ' + lineNo + ': expected ' + error.expected + '\n',
        line    = lines[lineNo - 1];
    
    message += line + '\n';
    offset  -= line.length + 1;
    
    while (offset < error.offset) {
      message += ' ';
      offset  += 1;
    }
    return message + '^';
  };
  
  var Grammar = {
    __consume__root: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["root"] = this._nodeCache["root"] || {};
      var cached = this._nodeCache["root"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      var index2 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume___();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0._ = address1;
        var address2 = null;
        var index3 = this._offset;
        address2 = this.__consume__statement();
        this._offset = index3;
        if (!(address2)) {
          var klass0 = this.constructor.SyntaxNode;
          var type0 = null;
          address2 = new klass0("", this._offset, []);
          if (typeof type0 === "object") {
            extend(address2, type0);
          }
          this._offset += 0;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          var address3 = null;
          address3 = this.__consume__expr();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.expr = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
            } else {
              elements0 = null;
              this._offset = index2;
            }
          } else {
            elements0 = null;
            this._offset = index2;
          }
        } else {
          elements0 = null;
          this._offset = index2;
        }
      } else {
        elements0 = null;
        this._offset = index2;
      }
      if (elements0) {
        this._offset = index2;
        var klass1 = this.constructor.SyntaxNode;
        var type1 = null;
        address0 = new klass1(text0, this._offset, elements0, labelled0);
        if (typeof type1 === "object") {
          extend(address0, type1);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      if (address0) {
        var type2 = find(this.constructor, "HamFile");
        if (typeof type2 === "object") {
          extend(address0, type2);
        }
      } else {
        this._offset = index1;
        var remaining0 = 0, index4 = this._offset, elements1 = [], text1 = "", address5 = true;
        while (address5) {
          var index5 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
          var address6 = null;
          address6 = this.__consume___();
          if (address6) {
            elements2.push(address6);
            text2 += address6.textValue;
            labelled1._ = address6;
            var address7 = null;
            address7 = this.__consume__statement();
            if (address7) {
              elements2.push(address7);
              text2 += address7.textValue;
              labelled1.statement = address7;
              var address8 = null;
              address8 = this.__consume___();
              if (address8) {
                elements2.push(address8);
                text2 += address8.textValue;
                labelled1._ = address8;
              } else {
                elements2 = null;
                this._offset = index5;
              }
            } else {
              elements2 = null;
              this._offset = index5;
            }
          } else {
            elements2 = null;
            this._offset = index5;
          }
          if (elements2) {
            this._offset = index5;
            var klass2 = this.constructor.SyntaxNode;
            var type3 = null;
            address5 = new klass2(text2, this._offset, elements2, labelled1);
            if (typeof type3 === "object") {
              extend(address5, type3);
            }
            this._offset += text2.length;
          } else {
            address5 = null;
          }
          if (address5) {
            elements1.push(address5);
            text1 += address5.textValue;
            remaining0 -= 1;
          }
        }
        if (remaining0 <= 0) {
          this._offset = index4;
          var klass3 = this.constructor.SyntaxNode;
          var type4 = null;
          address0 = new klass3(text1, this._offset, elements1);
          if (typeof type4 === "object") {
            extend(address0, type4);
          }
          this._offset += text1.length;
        } else {
          address0 = null;
        }
        if (address0) {
          var type5 = find(this.constructor, "HamFile");
          if (typeof type5 === "object") {
            extend(address0, type5);
          }
        } else {
          this._offset = index1;
        }
      }
      return this._nodeCache["root"][index0] = address0;
    },
    __consume__funblock: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["funblock"] = this._nodeCache["funblock"] || {};
      var cached = this._nodeCache["funblock"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      var index2 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "{") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("{", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"{\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          var remaining0 = 0, index3 = this._offset, elements1 = [], text1 = "", address4 = true;
          while (address4) {
            var index4 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
            var address5 = null;
            address5 = this.__consume___();
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
              labelled1._ = address5;
              var address6 = null;
              address6 = this.__consume__statement();
              if (address6) {
                elements2.push(address6);
                text2 += address6.textValue;
                labelled1.statement = address6;
                var address7 = null;
                address7 = this.__consume___();
                if (address7) {
                  elements2.push(address7);
                  text2 += address7.textValue;
                  labelled1._ = address7;
                } else {
                  elements2 = null;
                  this._offset = index4;
                }
              } else {
                elements2 = null;
                this._offset = index4;
              }
            } else {
              elements2 = null;
              this._offset = index4;
            }
            if (elements2) {
              this._offset = index4;
              var klass1 = this.constructor.SyntaxNode;
              var type1 = null;
              address4 = new klass1(text2, this._offset, elements2, labelled1);
              if (typeof type1 === "object") {
                extend(address4, type1);
              }
              this._offset += text2.length;
            } else {
              address4 = null;
            }
            if (address4) {
              elements1.push(address4);
              text1 += address4.textValue;
              remaining0 -= 1;
            }
          }
          if (remaining0 <= 0) {
            this._offset = index3;
            var klass2 = this.constructor.SyntaxNode;
            var type2 = null;
            address3 = new klass2(text1, this._offset, elements1);
            if (typeof type2 === "object") {
              extend(address3, type2);
            }
            this._offset += text1.length;
          } else {
            address3 = null;
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            var address8 = null;
            var slice2 = null;
            if (this._input.length > this._offset) {
              slice2 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice2 = null;
            }
            if (slice2 === "}") {
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address8 = new klass3("}", this._offset, []);
              if (typeof type3 === "object") {
                extend(address8, type3);
              }
              this._offset += 1;
            } else {
              address8 = null;
              var slice3 = null;
              if (this._input.length > this._offset) {
                slice3 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice3 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"}\""};
              }
            }
            if (address8) {
              elements0.push(address8);
              text0 += address8.textValue;
            } else {
              elements0 = null;
              this._offset = index2;
            }
          } else {
            elements0 = null;
            this._offset = index2;
          }
        } else {
          elements0 = null;
          this._offset = index2;
        }
      } else {
        elements0 = null;
        this._offset = index2;
      }
      if (elements0) {
        this._offset = index2;
        var klass4 = this.constructor.SyntaxNode;
        var type4 = null;
        address0 = new klass4(text0, this._offset, elements0, labelled0);
        if (typeof type4 === "object") {
          extend(address0, type4);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      if (address0) {
        var type5 = find(this.constructor, "FunctionalBlock");
        if (typeof type5 === "object") {
          extend(address0, type5);
        }
      } else {
        this._offset = index1;
        var index5 = this._offset, elements3 = [], labelled2 = {}, text3 = "";
        var address9 = null;
        var slice4 = null;
        if (this._input.length > this._offset) {
          slice4 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice4 = null;
        }
        if (slice4 === "{") {
          var klass5 = this.constructor.SyntaxNode;
          var type6 = null;
          address9 = new klass5("{", this._offset, []);
          if (typeof type6 === "object") {
            extend(address9, type6);
          }
          this._offset += 1;
        } else {
          address9 = null;
          var slice5 = null;
          if (this._input.length > this._offset) {
            slice5 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice5 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"{\""};
          }
        }
        if (address9) {
          elements3.push(address9);
          text3 += address9.textValue;
          var address10 = null;
          address10 = this.__consume___();
          if (address10) {
            elements3.push(address10);
            text3 += address10.textValue;
            labelled2._ = address10;
            var address11 = null;
            address11 = this.__consume__expr();
            if (address11) {
              elements3.push(address11);
              text3 += address11.textValue;
              labelled2.expr = address11;
              var address12 = null;
              address12 = this.__consume___();
              if (address12) {
                elements3.push(address12);
                text3 += address12.textValue;
                labelled2._ = address12;
                var address13 = null;
                var slice6 = null;
                if (this._input.length > this._offset) {
                  slice6 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice6 = null;
                }
                if (slice6 === "}") {
                  var klass6 = this.constructor.SyntaxNode;
                  var type7 = null;
                  address13 = new klass6("}", this._offset, []);
                  if (typeof type7 === "object") {
                    extend(address13, type7);
                  }
                  this._offset += 1;
                } else {
                  address13 = null;
                  var slice7 = null;
                  if (this._input.length > this._offset) {
                    slice7 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice7 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"}\""};
                  }
                }
                if (address13) {
                  elements3.push(address13);
                  text3 += address13.textValue;
                } else {
                  elements3 = null;
                  this._offset = index5;
                }
              } else {
                elements3 = null;
                this._offset = index5;
              }
            } else {
              elements3 = null;
              this._offset = index5;
            }
          } else {
            elements3 = null;
            this._offset = index5;
          }
        } else {
          elements3 = null;
          this._offset = index5;
        }
        if (elements3) {
          this._offset = index5;
          var klass7 = this.constructor.SyntaxNode;
          var type8 = null;
          address0 = new klass7(text3, this._offset, elements3, labelled2);
          if (typeof type8 === "object") {
            extend(address0, type8);
          }
          this._offset += text3.length;
        } else {
          address0 = null;
        }
        if (address0) {
          var type9 = find(this.constructor, "FunctionalBlock");
          if (typeof type9 === "object") {
            extend(address0, type9);
          }
        } else {
          this._offset = index1;
        }
      }
      return this._nodeCache["funblock"][index0] = address0;
    },
    __consume__block: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["block"] = this._nodeCache["block"] || {};
      var cached = this._nodeCache["block"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "{") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("{", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"{\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address4 = true;
          while (address4) {
            var index3 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
            var address5 = null;
            address5 = this.__consume___();
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
              labelled1._ = address5;
              var address6 = null;
              address6 = this.__consume__statement();
              if (address6) {
                elements2.push(address6);
                text2 += address6.textValue;
                labelled1.statement = address6;
                var address7 = null;
                address7 = this.__consume___();
                if (address7) {
                  elements2.push(address7);
                  text2 += address7.textValue;
                  labelled1._ = address7;
                } else {
                  elements2 = null;
                  this._offset = index3;
                }
              } else {
                elements2 = null;
                this._offset = index3;
              }
            } else {
              elements2 = null;
              this._offset = index3;
            }
            if (elements2) {
              this._offset = index3;
              var klass1 = this.constructor.SyntaxNode;
              var type1 = null;
              address4 = new klass1(text2, this._offset, elements2, labelled1);
              if (typeof type1 === "object") {
                extend(address4, type1);
              }
              this._offset += text2.length;
            } else {
              address4 = null;
            }
            if (address4) {
              elements1.push(address4);
              text1 += address4.textValue;
              remaining0 -= 1;
            }
          }
          if (remaining0 <= 0) {
            this._offset = index2;
            var klass2 = this.constructor.SyntaxNode;
            var type2 = null;
            address3 = new klass2(text1, this._offset, elements1);
            if (typeof type2 === "object") {
              extend(address3, type2);
            }
            this._offset += text1.length;
          } else {
            address3 = null;
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            var address8 = null;
            var slice2 = null;
            if (this._input.length > this._offset) {
              slice2 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice2 = null;
            }
            if (slice2 === "}") {
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address8 = new klass3("}", this._offset, []);
              if (typeof type3 === "object") {
                extend(address8, type3);
              }
              this._offset += 1;
            } else {
              address8 = null;
              var slice3 = null;
              if (this._input.length > this._offset) {
                slice3 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice3 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"}\""};
              }
            }
            if (address8) {
              elements0.push(address8);
              text0 += address8.textValue;
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass4 = this.constructor.SyntaxNode;
        var type4 = find(this.constructor, "Block");
        address0 = new klass4(text0, this._offset, elements0, labelled0);
        if (typeof type4 === "object") {
          extend(address0, type4);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["block"][index0] = address0;
    },
    __consume__statement: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["statement"] = this._nodeCache["statement"] || {};
      var cached = this._nodeCache["statement"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      address0 = this.__consume__variable();
      if (address0) {
      } else {
        this._offset = index1;
        address0 = this.__consume__class_def();
        if (address0) {
        } else {
          this._offset = index1;
          address0 = this.__consume__import();
          if (address0) {
          } else {
            this._offset = index1;
            address0 = this.__consume__return();
            if (address0) {
            } else {
              this._offset = index1;
              address0 = this.__consume__if_stmt();
              if (address0) {
              } else {
                this._offset = index1;
                address0 = this.__consume__exprstmt();
                if (address0) {
                } else {
                  this._offset = index1;
                }
              }
            }
          }
        }
      }
      return this._nodeCache["statement"][index0] = address0;
    },
    __consume__exprstmt: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["exprstmt"] = this._nodeCache["exprstmt"] || {};
      var cached = this._nodeCache["exprstmt"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume__expr();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.expr = address1;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          var slice0 = null;
          if (this._input.length > this._offset) {
            slice0 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice0 = null;
          }
          if (slice0 === ";") {
            var klass0 = this.constructor.SyntaxNode;
            var type0 = null;
            address3 = new klass0(";", this._offset, []);
            if (typeof type0 === "object") {
              extend(address3, type0);
            }
            this._offset += 1;
          } else {
            address3 = null;
            var slice1 = null;
            if (this._input.length > this._offset) {
              slice1 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice1 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\";\""};
            }
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass1 = this.constructor.SyntaxNode;
        var type1 = find(this.constructor, "ExprStmt");
        address0 = new klass1(text0, this._offset, elements0, labelled0);
        if (typeof type1 === "object") {
          extend(address0, type1);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["exprstmt"][index0] = address0;
    },
    __consume__import: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["import"] = this._nodeCache["import"] || {};
      var cached = this._nodeCache["import"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 6);
      } else {
        slice0 = null;
      }
      if (slice0 === "import") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("import", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 6;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"import\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__ident();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.ident = address3;
            var address4 = null;
            var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address5 = true;
            while (address5) {
              var index3 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
              var address6 = null;
              address6 = this.__consume___();
              if (address6) {
                elements2.push(address6);
                text2 += address6.textValue;
                labelled1._ = address6;
                var address7 = null;
                var slice2 = null;
                if (this._input.length > this._offset) {
                  slice2 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice2 = null;
                }
                if (slice2 === ",") {
                  var klass1 = this.constructor.SyntaxNode;
                  var type1 = null;
                  address7 = new klass1(",", this._offset, []);
                  if (typeof type1 === "object") {
                    extend(address7, type1);
                  }
                  this._offset += 1;
                } else {
                  address7 = null;
                  var slice3 = null;
                  if (this._input.length > this._offset) {
                    slice3 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice3 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\",\""};
                  }
                }
                if (address7) {
                  elements2.push(address7);
                  text2 += address7.textValue;
                  var address8 = null;
                  address8 = this.__consume___();
                  if (address8) {
                    elements2.push(address8);
                    text2 += address8.textValue;
                    labelled1._ = address8;
                    var address9 = null;
                    address9 = this.__consume__ident();
                    if (address9) {
                      elements2.push(address9);
                      text2 += address9.textValue;
                      labelled1.ident = address9;
                    } else {
                      elements2 = null;
                      this._offset = index3;
                    }
                  } else {
                    elements2 = null;
                    this._offset = index3;
                  }
                } else {
                  elements2 = null;
                  this._offset = index3;
                }
              } else {
                elements2 = null;
                this._offset = index3;
              }
              if (elements2) {
                this._offset = index3;
                var klass2 = this.constructor.SyntaxNode;
                var type2 = null;
                address5 = new klass2(text2, this._offset, elements2, labelled1);
                if (typeof type2 === "object") {
                  extend(address5, type2);
                }
                this._offset += text2.length;
              } else {
                address5 = null;
              }
              if (address5) {
                elements1.push(address5);
                text1 += address5.textValue;
                remaining0 -= 1;
              }
            }
            if (remaining0 <= 0) {
              this._offset = index2;
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address4 = new klass3(text1, this._offset, elements1);
              if (typeof type3 === "object") {
                extend(address4, type3);
              }
              this._offset += text1.length;
            } else {
              address4 = null;
            }
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              var address10 = null;
              address10 = this.__consume___();
              if (address10) {
                elements0.push(address10);
                text0 += address10.textValue;
                labelled0._ = address10;
                var address11 = null;
                var slice4 = null;
                if (this._input.length > this._offset) {
                  slice4 = this._input.substring(this._offset, this._offset + 4);
                } else {
                  slice4 = null;
                }
                if (slice4 === "from") {
                  var klass4 = this.constructor.SyntaxNode;
                  var type4 = null;
                  address11 = new klass4("from", this._offset, []);
                  if (typeof type4 === "object") {
                    extend(address11, type4);
                  }
                  this._offset += 4;
                } else {
                  address11 = null;
                  var slice5 = null;
                  if (this._input.length > this._offset) {
                    slice5 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice5 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"from\""};
                  }
                }
                if (address11) {
                  elements0.push(address11);
                  text0 += address11.textValue;
                  var address12 = null;
                  address12 = this.__consume___();
                  if (address12) {
                    elements0.push(address12);
                    text0 += address12.textValue;
                    labelled0._ = address12;
                    var address13 = null;
                    address13 = this.__consume__string();
                    if (address13) {
                      elements0.push(address13);
                      text0 += address13.textValue;
                      labelled0.string = address13;
                      var address14 = null;
                      address14 = this.__consume___();
                      if (address14) {
                        elements0.push(address14);
                        text0 += address14.textValue;
                        labelled0._ = address14;
                        var address15 = null;
                        var slice6 = null;
                        if (this._input.length > this._offset) {
                          slice6 = this._input.substring(this._offset, this._offset + 1);
                        } else {
                          slice6 = null;
                        }
                        if (slice6 === ";") {
                          var klass5 = this.constructor.SyntaxNode;
                          var type5 = null;
                          address15 = new klass5(";", this._offset, []);
                          if (typeof type5 === "object") {
                            extend(address15, type5);
                          }
                          this._offset += 1;
                        } else {
                          address15 = null;
                          var slice7 = null;
                          if (this._input.length > this._offset) {
                            slice7 = this._input.substring(this._offset, this._offset + 1);
                          } else {
                            slice7 = null;
                          }
                          if (!this.error || this.error.offset <= this._offset) {
                            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\";\""};
                          }
                        }
                        if (address15) {
                          elements0.push(address15);
                          text0 += address15.textValue;
                        } else {
                          elements0 = null;
                          this._offset = index1;
                        }
                      } else {
                        elements0 = null;
                        this._offset = index1;
                      }
                    } else {
                      elements0 = null;
                      this._offset = index1;
                    }
                  } else {
                    elements0 = null;
                    this._offset = index1;
                  }
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass6 = this.constructor.SyntaxNode;
        var type6 = find(this.constructor, "Import");
        address0 = new klass6(text0, this._offset, elements0, labelled0);
        if (typeof type6 === "object") {
          extend(address0, type6);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["import"][index0] = address0;
    },
    __consume__class_def: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["class_def"] = this._nodeCache["class_def"] || {};
      var cached = this._nodeCache["class_def"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 5);
      } else {
        slice0 = null;
      }
      if (slice0 === "class") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("class", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 5;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"class\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__ident();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.ident = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              var index2 = this._offset;
              var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
              var address6 = null;
              var slice2 = null;
              if (this._input.length > this._offset) {
                slice2 = this._input.substring(this._offset, this._offset + 7);
              } else {
                slice2 = null;
              }
              if (slice2 === "extends") {
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address6 = new klass1("extends", this._offset, []);
                if (typeof type1 === "object") {
                  extend(address6, type1);
                }
                this._offset += 7;
              } else {
                address6 = null;
                var slice3 = null;
                if (this._input.length > this._offset) {
                  slice3 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice3 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"extends\""};
                }
              }
              if (address6) {
                elements1.push(address6);
                text1 += address6.textValue;
                var address7 = null;
                address7 = this.__consume___();
                if (address7) {
                  elements1.push(address7);
                  text1 += address7.textValue;
                  labelled1._ = address7;
                  var address8 = null;
                  address8 = this.__consume__ident();
                  if (address8) {
                    elements1.push(address8);
                    text1 += address8.textValue;
                    labelled1.ident = address8;
                    var address9 = null;
                    address9 = this.__consume___();
                    if (address9) {
                      elements1.push(address9);
                      text1 += address9.textValue;
                      labelled1._ = address9;
                    } else {
                      elements1 = null;
                      this._offset = index3;
                    }
                  } else {
                    elements1 = null;
                    this._offset = index3;
                  }
                } else {
                  elements1 = null;
                  this._offset = index3;
                }
              } else {
                elements1 = null;
                this._offset = index3;
              }
              if (elements1) {
                this._offset = index3;
                var klass2 = this.constructor.SyntaxNode;
                var type2 = null;
                address5 = new klass2(text1, this._offset, elements1, labelled1);
                if (typeof type2 === "object") {
                  extend(address5, type2);
                }
                this._offset += text1.length;
              } else {
                address5 = null;
              }
              if (address5) {
              } else {
                this._offset = index2;
                var klass3 = this.constructor.SyntaxNode;
                var type3 = null;
                address5 = new klass3("", this._offset, []);
                if (typeof type3 === "object") {
                  extend(address5, type3);
                }
                this._offset += 0;
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
                var address10 = null;
                address10 = this.__consume__object();
                if (address10) {
                  elements0.push(address10);
                  text0 += address10.textValue;
                  labelled0.object = address10;
                  var address11 = null;
                  address11 = this.__consume___();
                  if (address11) {
                    elements0.push(address11);
                    text0 += address11.textValue;
                    labelled0._ = address11;
                    var address12 = null;
                    var slice4 = null;
                    if (this._input.length > this._offset) {
                      slice4 = this._input.substring(this._offset, this._offset + 1);
                    } else {
                      slice4 = null;
                    }
                    if (slice4 === ";") {
                      var klass4 = this.constructor.SyntaxNode;
                      var type4 = null;
                      address12 = new klass4(";", this._offset, []);
                      if (typeof type4 === "object") {
                        extend(address12, type4);
                      }
                      this._offset += 1;
                    } else {
                      address12 = null;
                      var slice5 = null;
                      if (this._input.length > this._offset) {
                        slice5 = this._input.substring(this._offset, this._offset + 1);
                      } else {
                        slice5 = null;
                      }
                      if (!this.error || this.error.offset <= this._offset) {
                        this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\";\""};
                      }
                    }
                    if (address12) {
                      elements0.push(address12);
                      text0 += address12.textValue;
                    } else {
                      elements0 = null;
                      this._offset = index1;
                    }
                  } else {
                    elements0 = null;
                    this._offset = index1;
                  }
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass5 = this.constructor.SyntaxNode;
        var type5 = find(this.constructor, "ClassDef");
        address0 = new klass5(text0, this._offset, elements0, labelled0);
        if (typeof type5 === "object") {
          extend(address0, type5);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["class_def"][index0] = address0;
    },
    __consume__variable: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["variable"] = this._nodeCache["variable"] || {};
      var cached = this._nodeCache["variable"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 3);
      } else {
        slice0 = null;
      }
      if (slice0 === "var") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("var", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 3;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"var\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__ident();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.ident = address3;
            var address4 = null;
            var index2 = this._offset;
            var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
            var address5 = null;
            var slice2 = null;
            if (this._input.length > this._offset) {
              slice2 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice2 = null;
            }
            if (slice2 === ":") {
              var klass1 = this.constructor.SyntaxNode;
              var type1 = null;
              address5 = new klass1(":", this._offset, []);
              if (typeof type1 === "object") {
                extend(address5, type1);
              }
              this._offset += 1;
            } else {
              address5 = null;
              var slice3 = null;
              if (this._input.length > this._offset) {
                slice3 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice3 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\":\""};
              }
            }
            if (address5) {
              elements1.push(address5);
              text1 += address5.textValue;
              var address6 = null;
              address6 = this.__consume___();
              if (address6) {
                elements1.push(address6);
                text1 += address6.textValue;
                labelled1._ = address6;
                var address7 = null;
                address7 = this.__consume__type();
                if (address7) {
                  elements1.push(address7);
                  text1 += address7.textValue;
                  labelled1.type = address7;
                } else {
                  elements1 = null;
                  this._offset = index3;
                }
              } else {
                elements1 = null;
                this._offset = index3;
              }
            } else {
              elements1 = null;
              this._offset = index3;
            }
            if (elements1) {
              this._offset = index3;
              var klass2 = this.constructor.SyntaxNode;
              var type2 = null;
              address4 = new klass2(text1, this._offset, elements1, labelled1);
              if (typeof type2 === "object") {
                extend(address4, type2);
              }
              this._offset += text1.length;
            } else {
              address4 = null;
            }
            if (address4) {
            } else {
              this._offset = index2;
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address4 = new klass3("", this._offset, []);
              if (typeof type3 === "object") {
                extend(address4, type3);
              }
              this._offset += 0;
            }
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              var address8 = null;
              var index4 = this._offset;
              var index5 = this._offset, elements2 = [], labelled2 = {}, text2 = "";
              var address9 = null;
              address9 = this.__consume___();
              if (address9) {
                elements2.push(address9);
                text2 += address9.textValue;
                labelled2._ = address9;
                var address10 = null;
                var slice4 = null;
                if (this._input.length > this._offset) {
                  slice4 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice4 = null;
                }
                if (slice4 === "=") {
                  var klass4 = this.constructor.SyntaxNode;
                  var type4 = null;
                  address10 = new klass4("=", this._offset, []);
                  if (typeof type4 === "object") {
                    extend(address10, type4);
                  }
                  this._offset += 1;
                } else {
                  address10 = null;
                  var slice5 = null;
                  if (this._input.length > this._offset) {
                    slice5 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice5 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"=\""};
                  }
                }
                if (address10) {
                  elements2.push(address10);
                  text2 += address10.textValue;
                  var address11 = null;
                  address11 = this.__consume___();
                  if (address11) {
                    elements2.push(address11);
                    text2 += address11.textValue;
                    labelled2._ = address11;
                    var address12 = null;
                    address12 = this.__consume__expr();
                    if (address12) {
                      elements2.push(address12);
                      text2 += address12.textValue;
                      labelled2.expr = address12;
                    } else {
                      elements2 = null;
                      this._offset = index5;
                    }
                  } else {
                    elements2 = null;
                    this._offset = index5;
                  }
                } else {
                  elements2 = null;
                  this._offset = index5;
                }
              } else {
                elements2 = null;
                this._offset = index5;
              }
              if (elements2) {
                this._offset = index5;
                var klass5 = this.constructor.SyntaxNode;
                var type5 = null;
                address8 = new klass5(text2, this._offset, elements2, labelled2);
                if (typeof type5 === "object") {
                  extend(address8, type5);
                }
                this._offset += text2.length;
              } else {
                address8 = null;
              }
              if (address8) {
              } else {
                this._offset = index4;
                var klass6 = this.constructor.SyntaxNode;
                var type6 = null;
                address8 = new klass6("", this._offset, []);
                if (typeof type6 === "object") {
                  extend(address8, type6);
                }
                this._offset += 0;
              }
              if (address8) {
                elements0.push(address8);
                text0 += address8.textValue;
                var address13 = null;
                address13 = this.__consume___();
                if (address13) {
                  elements0.push(address13);
                  text0 += address13.textValue;
                  labelled0._ = address13;
                  var address14 = null;
                  var slice6 = null;
                  if (this._input.length > this._offset) {
                    slice6 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice6 = null;
                  }
                  if (slice6 === ";") {
                    var klass7 = this.constructor.SyntaxNode;
                    var type7 = null;
                    address14 = new klass7(";", this._offset, []);
                    if (typeof type7 === "object") {
                      extend(address14, type7);
                    }
                    this._offset += 1;
                  } else {
                    address14 = null;
                    var slice7 = null;
                    if (this._input.length > this._offset) {
                      slice7 = this._input.substring(this._offset, this._offset + 1);
                    } else {
                      slice7 = null;
                    }
                    if (!this.error || this.error.offset <= this._offset) {
                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\";\""};
                    }
                  }
                  if (address14) {
                    elements0.push(address14);
                    text0 += address14.textValue;
                  } else {
                    elements0 = null;
                    this._offset = index1;
                  }
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass8 = this.constructor.SyntaxNode;
        var type8 = find(this.constructor, "VariableDef");
        address0 = new klass8(text0, this._offset, elements0, labelled0);
        if (typeof type8 === "object") {
          extend(address0, type8);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["variable"][index0] = address0;
    },
    __consume__return: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["return"] = this._nodeCache["return"] || {};
      var cached = this._nodeCache["return"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 6);
      } else {
        slice0 = null;
      }
      if (slice0 === "return") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("return", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 6;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"return\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          var index2 = this._offset;
          address3 = this.__consume__expr();
          if (address3) {
          } else {
            this._offset = index2;
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1("", this._offset, []);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += 0;
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.expr = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              var slice2 = null;
              if (this._input.length > this._offset) {
                slice2 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice2 = null;
              }
              if (slice2 === ";") {
                var klass2 = this.constructor.SyntaxNode;
                var type2 = null;
                address5 = new klass2(";", this._offset, []);
                if (typeof type2 === "object") {
                  extend(address5, type2);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice3 = null;
                if (this._input.length > this._offset) {
                  slice3 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice3 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\";\""};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass3 = this.constructor.SyntaxNode;
        var type3 = find(this.constructor, "ReturnStmt");
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["return"][index0] = address0;
    },
    __consume__if_stmt: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["if_stmt"] = this._nodeCache["if_stmt"] || {};
      var cached = this._nodeCache["if_stmt"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 2);
      } else {
        slice0 = null;
      }
      if (slice0 === "if") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("if", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 2;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"if\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          var slice2 = null;
          if (this._input.length > this._offset) {
            slice2 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice2 = null;
          }
          if (slice2 === "(") {
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1("(", this._offset, []);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += 1;
          } else {
            address3 = null;
            var slice3 = null;
            if (this._input.length > this._offset) {
              slice3 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice3 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"(\""};
            }
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              address5 = this.__consume__expr();
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
                labelled0.expr = address5;
                var address6 = null;
                address6 = this.__consume___();
                if (address6) {
                  elements0.push(address6);
                  text0 += address6.textValue;
                  labelled0._ = address6;
                  var address7 = null;
                  var slice4 = null;
                  if (this._input.length > this._offset) {
                    slice4 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice4 = null;
                  }
                  if (slice4 === ")") {
                    var klass2 = this.constructor.SyntaxNode;
                    var type2 = null;
                    address7 = new klass2(")", this._offset, []);
                    if (typeof type2 === "object") {
                      extend(address7, type2);
                    }
                    this._offset += 1;
                  } else {
                    address7 = null;
                    var slice5 = null;
                    if (this._input.length > this._offset) {
                      slice5 = this._input.substring(this._offset, this._offset + 1);
                    } else {
                      slice5 = null;
                    }
                    if (!this.error || this.error.offset <= this._offset) {
                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\")\""};
                    }
                  }
                  if (address7) {
                    elements0.push(address7);
                    text0 += address7.textValue;
                    var address8 = null;
                    address8 = this.__consume___();
                    if (address8) {
                      elements0.push(address8);
                      text0 += address8.textValue;
                      labelled0._ = address8;
                      var address9 = null;
                      address9 = this.__consume__block();
                      if (address9) {
                        elements0.push(address9);
                        text0 += address9.textValue;
                        labelled0.block = address9;
                        var address10 = null;
                        var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address11 = true;
                        while (address11) {
                          var index3 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
                          var address12 = null;
                          address12 = this.__consume___();
                          if (address12) {
                            elements2.push(address12);
                            text2 += address12.textValue;
                            labelled1._ = address12;
                            var address13 = null;
                            var slice6 = null;
                            if (this._input.length > this._offset) {
                              slice6 = this._input.substring(this._offset, this._offset + 4);
                            } else {
                              slice6 = null;
                            }
                            if (slice6 === "else") {
                              var klass3 = this.constructor.SyntaxNode;
                              var type3 = null;
                              address13 = new klass3("else", this._offset, []);
                              if (typeof type3 === "object") {
                                extend(address13, type3);
                              }
                              this._offset += 4;
                            } else {
                              address13 = null;
                              var slice7 = null;
                              if (this._input.length > this._offset) {
                                slice7 = this._input.substring(this._offset, this._offset + 1);
                              } else {
                                slice7 = null;
                              }
                              if (!this.error || this.error.offset <= this._offset) {
                                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"else\""};
                              }
                            }
                            if (address13) {
                              elements2.push(address13);
                              text2 += address13.textValue;
                              var address14 = null;
                              address14 = this.__consume___();
                              if (address14) {
                                elements2.push(address14);
                                text2 += address14.textValue;
                                labelled1._ = address14;
                                var address15 = null;
                                var slice8 = null;
                                if (this._input.length > this._offset) {
                                  slice8 = this._input.substring(this._offset, this._offset + 2);
                                } else {
                                  slice8 = null;
                                }
                                if (slice8 === "if") {
                                  var klass4 = this.constructor.SyntaxNode;
                                  var type4 = null;
                                  address15 = new klass4("if", this._offset, []);
                                  if (typeof type4 === "object") {
                                    extend(address15, type4);
                                  }
                                  this._offset += 2;
                                } else {
                                  address15 = null;
                                  var slice9 = null;
                                  if (this._input.length > this._offset) {
                                    slice9 = this._input.substring(this._offset, this._offset + 1);
                                  } else {
                                    slice9 = null;
                                  }
                                  if (!this.error || this.error.offset <= this._offset) {
                                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"if\""};
                                  }
                                }
                                if (address15) {
                                  elements2.push(address15);
                                  text2 += address15.textValue;
                                  var address16 = null;
                                  address16 = this.__consume___();
                                  if (address16) {
                                    elements2.push(address16);
                                    text2 += address16.textValue;
                                    labelled1._ = address16;
                                    var address17 = null;
                                    var slice10 = null;
                                    if (this._input.length > this._offset) {
                                      slice10 = this._input.substring(this._offset, this._offset + 1);
                                    } else {
                                      slice10 = null;
                                    }
                                    if (slice10 === "(") {
                                      var klass5 = this.constructor.SyntaxNode;
                                      var type5 = null;
                                      address17 = new klass5("(", this._offset, []);
                                      if (typeof type5 === "object") {
                                        extend(address17, type5);
                                      }
                                      this._offset += 1;
                                    } else {
                                      address17 = null;
                                      var slice11 = null;
                                      if (this._input.length > this._offset) {
                                        slice11 = this._input.substring(this._offset, this._offset + 1);
                                      } else {
                                        slice11 = null;
                                      }
                                      if (!this.error || this.error.offset <= this._offset) {
                                        this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"(\""};
                                      }
                                    }
                                    if (address17) {
                                      elements2.push(address17);
                                      text2 += address17.textValue;
                                      var address18 = null;
                                      address18 = this.__consume___();
                                      if (address18) {
                                        elements2.push(address18);
                                        text2 += address18.textValue;
                                        labelled1._ = address18;
                                        var address19 = null;
                                        address19 = this.__consume__expr();
                                        if (address19) {
                                          elements2.push(address19);
                                          text2 += address19.textValue;
                                          labelled1.expr = address19;
                                          var address20 = null;
                                          address20 = this.__consume___();
                                          if (address20) {
                                            elements2.push(address20);
                                            text2 += address20.textValue;
                                            labelled1._ = address20;
                                            var address21 = null;
                                            var slice12 = null;
                                            if (this._input.length > this._offset) {
                                              slice12 = this._input.substring(this._offset, this._offset + 1);
                                            } else {
                                              slice12 = null;
                                            }
                                            if (slice12 === ")") {
                                              var klass6 = this.constructor.SyntaxNode;
                                              var type6 = null;
                                              address21 = new klass6(")", this._offset, []);
                                              if (typeof type6 === "object") {
                                                extend(address21, type6);
                                              }
                                              this._offset += 1;
                                            } else {
                                              address21 = null;
                                              var slice13 = null;
                                              if (this._input.length > this._offset) {
                                                slice13 = this._input.substring(this._offset, this._offset + 1);
                                              } else {
                                                slice13 = null;
                                              }
                                              if (!this.error || this.error.offset <= this._offset) {
                                                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\")\""};
                                              }
                                            }
                                            if (address21) {
                                              elements2.push(address21);
                                              text2 += address21.textValue;
                                              var address22 = null;
                                              address22 = this.__consume___();
                                              if (address22) {
                                                elements2.push(address22);
                                                text2 += address22.textValue;
                                                labelled1._ = address22;
                                                var address23 = null;
                                                address23 = this.__consume__block();
                                                if (address23) {
                                                  elements2.push(address23);
                                                  text2 += address23.textValue;
                                                  labelled1.block = address23;
                                                } else {
                                                  elements2 = null;
                                                  this._offset = index3;
                                                }
                                              } else {
                                                elements2 = null;
                                                this._offset = index3;
                                              }
                                            } else {
                                              elements2 = null;
                                              this._offset = index3;
                                            }
                                          } else {
                                            elements2 = null;
                                            this._offset = index3;
                                          }
                                        } else {
                                          elements2 = null;
                                          this._offset = index3;
                                        }
                                      } else {
                                        elements2 = null;
                                        this._offset = index3;
                                      }
                                    } else {
                                      elements2 = null;
                                      this._offset = index3;
                                    }
                                  } else {
                                    elements2 = null;
                                    this._offset = index3;
                                  }
                                } else {
                                  elements2 = null;
                                  this._offset = index3;
                                }
                              } else {
                                elements2 = null;
                                this._offset = index3;
                              }
                            } else {
                              elements2 = null;
                              this._offset = index3;
                            }
                          } else {
                            elements2 = null;
                            this._offset = index3;
                          }
                          if (elements2) {
                            this._offset = index3;
                            var klass7 = this.constructor.SyntaxNode;
                            var type7 = null;
                            address11 = new klass7(text2, this._offset, elements2, labelled1);
                            if (typeof type7 === "object") {
                              extend(address11, type7);
                            }
                            this._offset += text2.length;
                          } else {
                            address11 = null;
                          }
                          if (address11) {
                            elements1.push(address11);
                            text1 += address11.textValue;
                            remaining0 -= 1;
                          }
                        }
                        if (remaining0 <= 0) {
                          this._offset = index2;
                          var klass8 = this.constructor.SyntaxNode;
                          var type8 = null;
                          address10 = new klass8(text1, this._offset, elements1);
                          if (typeof type8 === "object") {
                            extend(address10, type8);
                          }
                          this._offset += text1.length;
                        } else {
                          address10 = null;
                        }
                        if (address10) {
                          elements0.push(address10);
                          text0 += address10.textValue;
                          var address24 = null;
                          var index4 = this._offset;
                          var index5 = this._offset, elements3 = [], labelled2 = {}, text3 = "";
                          var address25 = null;
                          address25 = this.__consume___();
                          if (address25) {
                            elements3.push(address25);
                            text3 += address25.textValue;
                            labelled2._ = address25;
                            var address26 = null;
                            var slice14 = null;
                            if (this._input.length > this._offset) {
                              slice14 = this._input.substring(this._offset, this._offset + 4);
                            } else {
                              slice14 = null;
                            }
                            if (slice14 === "else") {
                              var klass9 = this.constructor.SyntaxNode;
                              var type9 = null;
                              address26 = new klass9("else", this._offset, []);
                              if (typeof type9 === "object") {
                                extend(address26, type9);
                              }
                              this._offset += 4;
                            } else {
                              address26 = null;
                              var slice15 = null;
                              if (this._input.length > this._offset) {
                                slice15 = this._input.substring(this._offset, this._offset + 1);
                              } else {
                                slice15 = null;
                              }
                              if (!this.error || this.error.offset <= this._offset) {
                                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"else\""};
                              }
                            }
                            if (address26) {
                              elements3.push(address26);
                              text3 += address26.textValue;
                              var address27 = null;
                              address27 = this.__consume___();
                              if (address27) {
                                elements3.push(address27);
                                text3 += address27.textValue;
                                labelled2._ = address27;
                                var address28 = null;
                                address28 = this.__consume__block();
                                if (address28) {
                                  elements3.push(address28);
                                  text3 += address28.textValue;
                                  labelled2.block = address28;
                                } else {
                                  elements3 = null;
                                  this._offset = index5;
                                }
                              } else {
                                elements3 = null;
                                this._offset = index5;
                              }
                            } else {
                              elements3 = null;
                              this._offset = index5;
                            }
                          } else {
                            elements3 = null;
                            this._offset = index5;
                          }
                          if (elements3) {
                            this._offset = index5;
                            var klass10 = this.constructor.SyntaxNode;
                            var type10 = null;
                            address24 = new klass10(text3, this._offset, elements3, labelled2);
                            if (typeof type10 === "object") {
                              extend(address24, type10);
                            }
                            this._offset += text3.length;
                          } else {
                            address24 = null;
                          }
                          if (address24) {
                          } else {
                            this._offset = index4;
                            var klass11 = this.constructor.SyntaxNode;
                            var type11 = null;
                            address24 = new klass11("", this._offset, []);
                            if (typeof type11 === "object") {
                              extend(address24, type11);
                            }
                            this._offset += 0;
                          }
                          if (address24) {
                            elements0.push(address24);
                            text0 += address24.textValue;
                            var address29 = null;
                            address29 = this.__consume___();
                            if (address29) {
                              elements0.push(address29);
                              text0 += address29.textValue;
                              labelled0._ = address29;
                              var address30 = null;
                              var index6 = this._offset;
                              var slice16 = null;
                              if (this._input.length > this._offset) {
                                slice16 = this._input.substring(this._offset, this._offset + 1);
                              } else {
                                slice16 = null;
                              }
                              if (slice16 === ";") {
                                var klass12 = this.constructor.SyntaxNode;
                                var type12 = null;
                                address30 = new klass12(";", this._offset, []);
                                if (typeof type12 === "object") {
                                  extend(address30, type12);
                                }
                                this._offset += 1;
                              } else {
                                address30 = null;
                                var slice17 = null;
                                if (this._input.length > this._offset) {
                                  slice17 = this._input.substring(this._offset, this._offset + 1);
                                } else {
                                  slice17 = null;
                                }
                                if (!this.error || this.error.offset <= this._offset) {
                                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\";\""};
                                }
                              }
                              if (address30) {
                              } else {
                                this._offset = index6;
                                var klass13 = this.constructor.SyntaxNode;
                                var type13 = null;
                                address30 = new klass13("", this._offset, []);
                                if (typeof type13 === "object") {
                                  extend(address30, type13);
                                }
                                this._offset += 0;
                              }
                              if (address30) {
                                elements0.push(address30);
                                text0 += address30.textValue;
                              } else {
                                elements0 = null;
                                this._offset = index1;
                              }
                            } else {
                              elements0 = null;
                              this._offset = index1;
                            }
                          } else {
                            elements0 = null;
                            this._offset = index1;
                          }
                        } else {
                          elements0 = null;
                          this._offset = index1;
                        }
                      } else {
                        elements0 = null;
                        this._offset = index1;
                      }
                    } else {
                      elements0 = null;
                      this._offset = index1;
                    }
                  } else {
                    elements0 = null;
                    this._offset = index1;
                  }
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass14 = this.constructor.SyntaxNode;
        var type14 = find(this.constructor, "IfStmt");
        address0 = new klass14(text0, this._offset, elements0, labelled0);
        if (typeof type14 === "object") {
          extend(address0, type14);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["if_stmt"][index0] = address0;
    },
    __consume__expr: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["expr"] = this._nodeCache["expr"] || {};
      var cached = this._nodeCache["expr"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume__value_acs();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.value_acs = address1;
        var address2 = null;
        var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address3 = true;
        while (address3) {
          var index3 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
          var address4 = null;
          address4 = this.__consume___();
          if (address4) {
            elements2.push(address4);
            text2 += address4.textValue;
            labelled1._ = address4;
            var address5 = null;
            address5 = this.__consume__binaryop();
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
              labelled1.binaryop = address5;
              var address6 = null;
              address6 = this.__consume___();
              if (address6) {
                elements2.push(address6);
                text2 += address6.textValue;
                labelled1._ = address6;
                var address7 = null;
                address7 = this.__consume__value_acs();
                if (address7) {
                  elements2.push(address7);
                  text2 += address7.textValue;
                  labelled1.value_acs = address7;
                } else {
                  elements2 = null;
                  this._offset = index3;
                }
              } else {
                elements2 = null;
                this._offset = index3;
              }
            } else {
              elements2 = null;
              this._offset = index3;
            }
          } else {
            elements2 = null;
            this._offset = index3;
          }
          if (elements2) {
            this._offset = index3;
            var klass0 = this.constructor.SyntaxNode;
            var type0 = null;
            address3 = new klass0(text2, this._offset, elements2, labelled1);
            if (typeof type0 === "object") {
              extend(address3, type0);
            }
            this._offset += text2.length;
          } else {
            address3 = null;
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            remaining0 -= 1;
          }
        }
        if (remaining0 <= 0) {
          this._offset = index2;
          var klass1 = this.constructor.SyntaxNode;
          var type1 = null;
          address2 = new klass1(text1, this._offset, elements1);
          if (typeof type1 === "object") {
            extend(address2, type1);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass2 = this.constructor.SyntaxNode;
        var type2 = find(this.constructor, "Expression");
        address0 = new klass2(text0, this._offset, elements0, labelled0);
        if (typeof type2 === "object") {
          extend(address0, type2);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["expr"][index0] = address0;
    },
    __consume__binaryop: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["binaryop"] = this._nodeCache["binaryop"] || {};
      var cached = this._nodeCache["binaryop"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 2);
      } else {
        slice0 = null;
      }
      if (slice0 === "or") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address0 = new klass0("or", this._offset, []);
        if (typeof type0 === "object") {
          extend(address0, type0);
        }
        this._offset += 2;
      } else {
        address0 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"or\""};
        }
      }
      if (address0) {
      } else {
        this._offset = index1;
        var slice2 = null;
        if (this._input.length > this._offset) {
          slice2 = this._input.substring(this._offset, this._offset + 4);
        } else {
          slice2 = null;
        }
        if (slice2 === "isnt") {
          var klass1 = this.constructor.SyntaxNode;
          var type1 = null;
          address0 = new klass1("isnt", this._offset, []);
          if (typeof type1 === "object") {
            extend(address0, type1);
          }
          this._offset += 4;
        } else {
          address0 = null;
          var slice3 = null;
          if (this._input.length > this._offset) {
            slice3 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice3 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"isnt\""};
          }
        }
        if (address0) {
        } else {
          this._offset = index1;
          var slice4 = null;
          if (this._input.length > this._offset) {
            slice4 = this._input.substring(this._offset, this._offset + 2);
          } else {
            slice4 = null;
          }
          if (slice4 === "is") {
            var klass2 = this.constructor.SyntaxNode;
            var type2 = null;
            address0 = new klass2("is", this._offset, []);
            if (typeof type2 === "object") {
              extend(address0, type2);
            }
            this._offset += 2;
          } else {
            address0 = null;
            var slice5 = null;
            if (this._input.length > this._offset) {
              slice5 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice5 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"is\""};
            }
          }
          if (address0) {
          } else {
            this._offset = index1;
            var slice6 = null;
            if (this._input.length > this._offset) {
              slice6 = this._input.substring(this._offset, this._offset + 2);
            } else {
              slice6 = null;
            }
            if (slice6 === "+=") {
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address0 = new klass3("+=", this._offset, []);
              if (typeof type3 === "object") {
                extend(address0, type3);
              }
              this._offset += 2;
            } else {
              address0 = null;
              var slice7 = null;
              if (this._input.length > this._offset) {
                slice7 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice7 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"+=\""};
              }
            }
            if (address0) {
            } else {
              this._offset = index1;
              var slice8 = null;
              if (this._input.length > this._offset) {
                slice8 = this._input.substring(this._offset, this._offset + 2);
              } else {
                slice8 = null;
              }
              if (slice8 === "*=") {
                var klass4 = this.constructor.SyntaxNode;
                var type4 = null;
                address0 = new klass4("*=", this._offset, []);
                if (typeof type4 === "object") {
                  extend(address0, type4);
                }
                this._offset += 2;
              } else {
                address0 = null;
                var slice9 = null;
                if (this._input.length > this._offset) {
                  slice9 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice9 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"*=\""};
                }
              }
              if (address0) {
              } else {
                this._offset = index1;
                var slice10 = null;
                if (this._input.length > this._offset) {
                  slice10 = this._input.substring(this._offset, this._offset + 2);
                } else {
                  slice10 = null;
                }
                if (slice10 === "/=") {
                  var klass5 = this.constructor.SyntaxNode;
                  var type5 = null;
                  address0 = new klass5("/=", this._offset, []);
                  if (typeof type5 === "object") {
                    extend(address0, type5);
                  }
                  this._offset += 2;
                } else {
                  address0 = null;
                  var slice11 = null;
                  if (this._input.length > this._offset) {
                    slice11 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice11 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"/=\""};
                  }
                }
                if (address0) {
                } else {
                  this._offset = index1;
                  var slice12 = null;
                  if (this._input.length > this._offset) {
                    slice12 = this._input.substring(this._offset, this._offset + 2);
                  } else {
                    slice12 = null;
                  }
                  if (slice12 === "-=") {
                    var klass6 = this.constructor.SyntaxNode;
                    var type6 = null;
                    address0 = new klass6("-=", this._offset, []);
                    if (typeof type6 === "object") {
                      extend(address0, type6);
                    }
                    this._offset += 2;
                  } else {
                    address0 = null;
                    var slice13 = null;
                    if (this._input.length > this._offset) {
                      slice13 = this._input.substring(this._offset, this._offset + 1);
                    } else {
                      slice13 = null;
                    }
                    if (!this.error || this.error.offset <= this._offset) {
                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"-=\""};
                    }
                  }
                  if (address0) {
                  } else {
                    this._offset = index1;
                    var slice14 = null;
                    if (this._input.length > this._offset) {
                      slice14 = this._input.substring(this._offset, this._offset + 2);
                    } else {
                      slice14 = null;
                    }
                    if (slice14 === "%=") {
                      var klass7 = this.constructor.SyntaxNode;
                      var type7 = null;
                      address0 = new klass7("%=", this._offset, []);
                      if (typeof type7 === "object") {
                        extend(address0, type7);
                      }
                      this._offset += 2;
                    } else {
                      address0 = null;
                      var slice15 = null;
                      if (this._input.length > this._offset) {
                        slice15 = this._input.substring(this._offset, this._offset + 1);
                      } else {
                        slice15 = null;
                      }
                      if (!this.error || this.error.offset <= this._offset) {
                        this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"%=\""};
                      }
                    }
                    if (address0) {
                    } else {
                      this._offset = index1;
                      var slice16 = null;
                      if (this._input.length > this._offset) {
                        slice16 = this._input.substring(this._offset, this._offset + 2);
                      } else {
                        slice16 = null;
                      }
                      if (slice16 === "==") {
                        var klass8 = this.constructor.SyntaxNode;
                        var type8 = null;
                        address0 = new klass8("==", this._offset, []);
                        if (typeof type8 === "object") {
                          extend(address0, type8);
                        }
                        this._offset += 2;
                      } else {
                        address0 = null;
                        var slice17 = null;
                        if (this._input.length > this._offset) {
                          slice17 = this._input.substring(this._offset, this._offset + 1);
                        } else {
                          slice17 = null;
                        }
                        if (!this.error || this.error.offset <= this._offset) {
                          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"==\""};
                        }
                      }
                      if (address0) {
                      } else {
                        this._offset = index1;
                        var slice18 = null;
                        if (this._input.length > this._offset) {
                          slice18 = this._input.substring(this._offset, this._offset + 2);
                        } else {
                          slice18 = null;
                        }
                        if (slice18 === "!=") {
                          var klass9 = this.constructor.SyntaxNode;
                          var type9 = null;
                          address0 = new klass9("!=", this._offset, []);
                          if (typeof type9 === "object") {
                            extend(address0, type9);
                          }
                          this._offset += 2;
                        } else {
                          address0 = null;
                          var slice19 = null;
                          if (this._input.length > this._offset) {
                            slice19 = this._input.substring(this._offset, this._offset + 1);
                          } else {
                            slice19 = null;
                          }
                          if (!this.error || this.error.offset <= this._offset) {
                            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"!=\""};
                          }
                        }
                        if (address0) {
                        } else {
                          this._offset = index1;
                          var slice20 = null;
                          if (this._input.length > this._offset) {
                            slice20 = this._input.substring(this._offset, this._offset + 2);
                          } else {
                            slice20 = null;
                          }
                          if (slice20 === "**") {
                            var klass10 = this.constructor.SyntaxNode;
                            var type10 = null;
                            address0 = new klass10("**", this._offset, []);
                            if (typeof type10 === "object") {
                              extend(address0, type10);
                            }
                            this._offset += 2;
                          } else {
                            address0 = null;
                            var slice21 = null;
                            if (this._input.length > this._offset) {
                              slice21 = this._input.substring(this._offset, this._offset + 1);
                            } else {
                              slice21 = null;
                            }
                            if (!this.error || this.error.offset <= this._offset) {
                              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"**\""};
                            }
                          }
                          if (address0) {
                          } else {
                            this._offset = index1;
                            var slice22 = null;
                            if (this._input.length > this._offset) {
                              slice22 = this._input.substring(this._offset, this._offset + 1);
                            } else {
                              slice22 = null;
                            }
                            if (slice22 === ">") {
                              var klass11 = this.constructor.SyntaxNode;
                              var type11 = null;
                              address0 = new klass11(">", this._offset, []);
                              if (typeof type11 === "object") {
                                extend(address0, type11);
                              }
                              this._offset += 1;
                            } else {
                              address0 = null;
                              var slice23 = null;
                              if (this._input.length > this._offset) {
                                slice23 = this._input.substring(this._offset, this._offset + 1);
                              } else {
                                slice23 = null;
                              }
                              if (!this.error || this.error.offset <= this._offset) {
                                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\">\""};
                              }
                            }
                            if (address0) {
                            } else {
                              this._offset = index1;
                              var slice24 = null;
                              if (this._input.length > this._offset) {
                                slice24 = this._input.substring(this._offset, this._offset + 1);
                              } else {
                                slice24 = null;
                              }
                              if (slice24 === "<") {
                                var klass12 = this.constructor.SyntaxNode;
                                var type12 = null;
                                address0 = new klass12("<", this._offset, []);
                                if (typeof type12 === "object") {
                                  extend(address0, type12);
                                }
                                this._offset += 1;
                              } else {
                                address0 = null;
                                var slice25 = null;
                                if (this._input.length > this._offset) {
                                  slice25 = this._input.substring(this._offset, this._offset + 1);
                                } else {
                                  slice25 = null;
                                }
                                if (!this.error || this.error.offset <= this._offset) {
                                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"<\""};
                                }
                              }
                              if (address0) {
                              } else {
                                this._offset = index1;
                                var slice26 = null;
                                if (this._input.length > this._offset) {
                                  slice26 = this._input.substring(this._offset, this._offset + 2);
                                } else {
                                  slice26 = null;
                                }
                                if (slice26 === "<=") {
                                  var klass13 = this.constructor.SyntaxNode;
                                  var type13 = null;
                                  address0 = new klass13("<=", this._offset, []);
                                  if (typeof type13 === "object") {
                                    extend(address0, type13);
                                  }
                                  this._offset += 2;
                                } else {
                                  address0 = null;
                                  var slice27 = null;
                                  if (this._input.length > this._offset) {
                                    slice27 = this._input.substring(this._offset, this._offset + 1);
                                  } else {
                                    slice27 = null;
                                  }
                                  if (!this.error || this.error.offset <= this._offset) {
                                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"<=\""};
                                  }
                                }
                                if (address0) {
                                } else {
                                  this._offset = index1;
                                  var slice28 = null;
                                  if (this._input.length > this._offset) {
                                    slice28 = this._input.substring(this._offset, this._offset + 2);
                                  } else {
                                    slice28 = null;
                                  }
                                  if (slice28 === ">=") {
                                    var klass14 = this.constructor.SyntaxNode;
                                    var type14 = null;
                                    address0 = new klass14(">=", this._offset, []);
                                    if (typeof type14 === "object") {
                                      extend(address0, type14);
                                    }
                                    this._offset += 2;
                                  } else {
                                    address0 = null;
                                    var slice29 = null;
                                    if (this._input.length > this._offset) {
                                      slice29 = this._input.substring(this._offset, this._offset + 1);
                                    } else {
                                      slice29 = null;
                                    }
                                    if (!this.error || this.error.offset <= this._offset) {
                                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\">=\""};
                                    }
                                  }
                                  if (address0) {
                                  } else {
                                    this._offset = index1;
                                    var slice30 = null;
                                    if (this._input.length > this._offset) {
                                      slice30 = this._input.substring(this._offset, this._offset + 2);
                                    } else {
                                      slice30 = null;
                                    }
                                    if (slice30 === "&&") {
                                      var klass15 = this.constructor.SyntaxNode;
                                      var type15 = null;
                                      address0 = new klass15("&&", this._offset, []);
                                      if (typeof type15 === "object") {
                                        extend(address0, type15);
                                      }
                                      this._offset += 2;
                                    } else {
                                      address0 = null;
                                      var slice31 = null;
                                      if (this._input.length > this._offset) {
                                        slice31 = this._input.substring(this._offset, this._offset + 1);
                                      } else {
                                        slice31 = null;
                                      }
                                      if (!this.error || this.error.offset <= this._offset) {
                                        this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"&&\""};
                                      }
                                    }
                                    if (address0) {
                                    } else {
                                      this._offset = index1;
                                      var slice32 = null;
                                      if (this._input.length > this._offset) {
                                        slice32 = this._input.substring(this._offset, this._offset + 1);
                                      } else {
                                        slice32 = null;
                                      }
                                      if (slice32 && /^[-+=*\^/%]/.test(slice32)) {
                                        var klass16 = this.constructor.SyntaxNode;
                                        var type16 = null;
                                        address0 = new klass16(slice32, this._offset, []);
                                        if (typeof type16 === "object") {
                                          extend(address0, type16);
                                        }
                                        this._offset += 1;
                                      } else {
                                        address0 = null;
                                        var slice33 = null;
                                        if (this._input.length > this._offset) {
                                          slice33 = this._input.substring(this._offset, this._offset + 1);
                                        } else {
                                          slice33 = null;
                                        }
                                        if (!this.error || this.error.offset <= this._offset) {
                                          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[-+=*\\^/%]"};
                                        }
                                      }
                                      if (address0) {
                                      } else {
                                        this._offset = index1;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return this._nodeCache["binaryop"][index0] = address0;
    },
    __consume__value_acs: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["value_acs"] = this._nodeCache["value_acs"] || {};
      var cached = this._nodeCache["value_acs"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume__value();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.value = address1;
        var address2 = null;
        var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address3 = true;
        while (address3) {
          var index3 = this._offset;
          var index4 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
          var address4 = null;
          address4 = this.__consume___();
          if (address4) {
            elements2.push(address4);
            text2 += address4.textValue;
            labelled1._ = address4;
            var address5 = null;
            var slice0 = null;
            if (this._input.length > this._offset) {
              slice0 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice0 = null;
            }
            if (slice0 === ".") {
              var klass0 = this.constructor.SyntaxNode;
              var type0 = null;
              address5 = new klass0(".", this._offset, []);
              if (typeof type0 === "object") {
                extend(address5, type0);
              }
              this._offset += 1;
            } else {
              address5 = null;
              var slice1 = null;
              if (this._input.length > this._offset) {
                slice1 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice1 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\".\""};
              }
            }
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
              var address6 = null;
              address6 = this.__consume___();
              if (address6) {
                elements2.push(address6);
                text2 += address6.textValue;
                labelled1._ = address6;
                var address7 = null;
                address7 = this.__consume__value();
                if (address7) {
                  elements2.push(address7);
                  text2 += address7.textValue;
                  labelled1.value = address7;
                } else {
                  elements2 = null;
                  this._offset = index4;
                }
              } else {
                elements2 = null;
                this._offset = index4;
              }
            } else {
              elements2 = null;
              this._offset = index4;
            }
          } else {
            elements2 = null;
            this._offset = index4;
          }
          if (elements2) {
            this._offset = index4;
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1(text2, this._offset, elements2, labelled1);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += text2.length;
          } else {
            address3 = null;
          }
          if (address3) {
          } else {
            this._offset = index3;
            var index5 = this._offset, elements3 = [], labelled2 = {}, text3 = "";
            var address8 = null;
            address8 = this.__consume___();
            if (address8) {
              elements3.push(address8);
              text3 += address8.textValue;
              labelled2._ = address8;
              var address9 = null;
              address9 = this.__consume__accessor();
              if (address9) {
                elements3.push(address9);
                text3 += address9.textValue;
                labelled2.accessor = address9;
              } else {
                elements3 = null;
                this._offset = index5;
              }
            } else {
              elements3 = null;
              this._offset = index5;
            }
            if (elements3) {
              this._offset = index5;
              var klass2 = this.constructor.SyntaxNode;
              var type2 = null;
              address3 = new klass2(text3, this._offset, elements3, labelled2);
              if (typeof type2 === "object") {
                extend(address3, type2);
              }
              this._offset += text3.length;
            } else {
              address3 = null;
            }
            if (address3) {
            } else {
              this._offset = index3;
            }
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            remaining0 -= 1;
          }
        }
        if (remaining0 <= 0) {
          this._offset = index2;
          var klass3 = this.constructor.SyntaxNode;
          var type3 = null;
          address2 = new klass3(text1, this._offset, elements1);
          if (typeof type3 === "object") {
            extend(address2, type3);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass4 = this.constructor.SyntaxNode;
        var type4 = find(this.constructor, "ValueAccessor");
        address0 = new klass4(text0, this._offset, elements0, labelled0);
        if (typeof type4 === "object") {
          extend(address0, type4);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["value_acs"][index0] = address0;
    },
    __consume__value: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["value"] = this._nodeCache["value"] || {};
      var cached = this._nodeCache["value"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      address0 = this.__consume__number();
      if (address0) {
      } else {
        this._offset = index1;
        address0 = this.__consume__new_obj();
        if (address0) {
        } else {
          this._offset = index1;
          address0 = this.__consume__special();
          if (address0) {
          } else {
            this._offset = index1;
            address0 = this.__consume__string();
            if (address0) {
            } else {
              this._offset = index1;
              address0 = this.__consume__object();
              if (address0) {
              } else {
                this._offset = index1;
                address0 = this.__consume__lambda();
                if (address0) {
                } else {
                  this._offset = index1;
                  address0 = this.__consume__listcomp();
                  if (address0) {
                  } else {
                    this._offset = index1;
                    address0 = this.__consume__array();
                    if (address0) {
                    } else {
                      this._offset = index1;
                      address0 = this.__consume__array_rng();
                      if (address0) {
                      } else {
                        this._offset = index1;
                        address0 = this.__consume__proto();
                        if (address0) {
                        } else {
                          this._offset = index1;
                          address0 = this.__consume__chain_pp();
                          if (address0) {
                          } else {
                            this._offset = index1;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return this._nodeCache["value"][index0] = address0;
    },
    __consume__chain_pp: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["chain_pp"] = this._nodeCache["chain_pp"] || {};
      var cached = this._nodeCache["chain_pp"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "(") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("(", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"(\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__expr();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.expr = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              var slice2 = null;
              if (this._input.length > this._offset) {
                slice2 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice2 = null;
              }
              if (slice2 === ")") {
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address5 = new klass1(")", this._offset, []);
                if (typeof type1 === "object") {
                  extend(address5, type1);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice3 = null;
                if (this._input.length > this._offset) {
                  slice3 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice3 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\")\""};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass2 = this.constructor.SyntaxNode;
        var type2 = find(this.constructor, "ParenExpression");
        address0 = new klass2(text0, this._offset, elements0, labelled0);
        if (typeof type2 === "object") {
          extend(address0, type2);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["chain_pp"][index0] = address0;
    },
    __consume__accessor: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["accessor"] = this._nodeCache["accessor"] || {};
      var cached = this._nodeCache["accessor"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      address0 = this.__consume__arrayslc();
      if (address0) {
      } else {
        this._offset = index1;
        address0 = this.__consume__arrayacs();
        if (address0) {
        } else {
          this._offset = index1;
          address0 = this.__consume__funcall();
          if (address0) {
          } else {
            this._offset = index1;
          }
        }
      }
      return this._nodeCache["accessor"][index0] = address0;
    },
    __consume__pp_expr: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["pp_expr"] = this._nodeCache["pp_expr"] || {};
      var cached = this._nodeCache["pp_expr"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "(") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("(", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"(\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__expr();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.expr = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              var slice2 = null;
              if (this._input.length > this._offset) {
                slice2 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice2 = null;
              }
              if (slice2 === ")") {
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address5 = new klass1(")", this._offset, []);
                if (typeof type1 === "object") {
                  extend(address5, type1);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice3 = null;
                if (this._input.length > this._offset) {
                  slice3 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice3 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\")\""};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass2 = this.constructor.SyntaxNode;
        var type2 = null;
        address0 = new klass2(text0, this._offset, elements0, labelled0);
        if (typeof type2 === "object") {
          extend(address0, type2);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["pp_expr"][index0] = address0;
    },
    __consume__expr_list: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["expr_list"] = this._nodeCache["expr_list"] || {};
      var cached = this._nodeCache["expr_list"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume__expr();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.expr = address1;
        var address2 = null;
        var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address3 = true;
        while (address3) {
          var index3 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
          var address4 = null;
          address4 = this.__consume___();
          if (address4) {
            elements2.push(address4);
            text2 += address4.textValue;
            labelled1._ = address4;
            var address5 = null;
            var slice0 = null;
            if (this._input.length > this._offset) {
              slice0 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice0 = null;
            }
            if (slice0 === ",") {
              var klass0 = this.constructor.SyntaxNode;
              var type0 = null;
              address5 = new klass0(",", this._offset, []);
              if (typeof type0 === "object") {
                extend(address5, type0);
              }
              this._offset += 1;
            } else {
              address5 = null;
              var slice1 = null;
              if (this._input.length > this._offset) {
                slice1 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice1 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\",\""};
              }
            }
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
              var address6 = null;
              address6 = this.__consume___();
              if (address6) {
                elements2.push(address6);
                text2 += address6.textValue;
                labelled1._ = address6;
                var address7 = null;
                address7 = this.__consume__expr();
                if (address7) {
                  elements2.push(address7);
                  text2 += address7.textValue;
                  labelled1.expr = address7;
                } else {
                  elements2 = null;
                  this._offset = index3;
                }
              } else {
                elements2 = null;
                this._offset = index3;
              }
            } else {
              elements2 = null;
              this._offset = index3;
            }
          } else {
            elements2 = null;
            this._offset = index3;
          }
          if (elements2) {
            this._offset = index3;
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1(text2, this._offset, elements2, labelled1);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += text2.length;
          } else {
            address3 = null;
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            remaining0 -= 1;
          }
        }
        if (remaining0 <= 0) {
          this._offset = index2;
          var klass2 = this.constructor.SyntaxNode;
          var type2 = null;
          address2 = new klass2(text1, this._offset, elements1);
          if (typeof type2 === "object") {
            extend(address2, type2);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass3 = this.constructor.SyntaxNode;
        var type3 = find(this.constructor, "ExprList");
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["expr_list"][index0] = address0;
    },
    __consume__new_obj: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["new_obj"] = this._nodeCache["new_obj"] || {};
      var cached = this._nodeCache["new_obj"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 3);
      } else {
        slice0 = null;
      }
      if (slice0 === "new") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("new", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 3;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"new\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__expr();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.expr = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass1 = this.constructor.SyntaxNode;
        var type1 = find(this.constructor, "ObjectNew");
        address0 = new klass1(text0, this._offset, elements0, labelled0);
        if (typeof type1 === "object") {
          extend(address0, type1);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["new_obj"][index0] = address0;
    },
    __consume__array: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["array"] = this._nodeCache["array"] || {};
      var cached = this._nodeCache["array"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "[") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("[", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"[\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          var index2 = this._offset;
          address3 = this.__consume__expr_list();
          if (address3) {
          } else {
            this._offset = index2;
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1("", this._offset, []);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += 0;
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              var slice2 = null;
              if (this._input.length > this._offset) {
                slice2 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice2 = null;
              }
              if (slice2 === "]") {
                var klass2 = this.constructor.SyntaxNode;
                var type2 = null;
                address5 = new klass2("]", this._offset, []);
                if (typeof type2 === "object") {
                  extend(address5, type2);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice3 = null;
                if (this._input.length > this._offset) {
                  slice3 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice3 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"]\""};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass3 = this.constructor.SyntaxNode;
        var type3 = find(this.constructor, "ArrayNode");
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["array"][index0] = address0;
    },
    __consume__array_rng: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["array_rng"] = this._nodeCache["array_rng"] || {};
      var cached = this._nodeCache["array_rng"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "[") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("[", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"[\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          var index2 = this._offset;
          address3 = this.__consume__integer();
          if (address3) {
          } else {
            this._offset = index2;
            address3 = this.__consume__ident();
            if (address3) {
            } else {
              this._offset = index2;
            }
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.start = address3;
            var address4 = null;
            var slice2 = null;
            if (this._input.length > this._offset) {
              slice2 = this._input.substring(this._offset, this._offset + 2);
            } else {
              slice2 = null;
            }
            if (slice2 === "..") {
              var klass1 = this.constructor.SyntaxNode;
              var type1 = null;
              address4 = new klass1("..", this._offset, []);
              if (typeof type1 === "object") {
                extend(address4, type1);
              }
              this._offset += 2;
            } else {
              address4 = null;
              var slice3 = null;
              if (this._input.length > this._offset) {
                slice3 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice3 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"..\""};
              }
            }
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              var address5 = null;
              var index3 = this._offset;
              address5 = this.__consume__integer();
              if (address5) {
              } else {
                this._offset = index3;
                address5 = this.__consume__ident();
                if (address5) {
                } else {
                  this._offset = index3;
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
                labelled0.end = address5;
                var address6 = null;
                address6 = this.__consume___();
                if (address6) {
                  elements0.push(address6);
                  text0 += address6.textValue;
                  labelled0._ = address6;
                  var address7 = null;
                  var slice4 = null;
                  if (this._input.length > this._offset) {
                    slice4 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice4 = null;
                  }
                  if (slice4 === "]") {
                    var klass2 = this.constructor.SyntaxNode;
                    var type2 = null;
                    address7 = new klass2("]", this._offset, []);
                    if (typeof type2 === "object") {
                      extend(address7, type2);
                    }
                    this._offset += 1;
                  } else {
                    address7 = null;
                    var slice5 = null;
                    if (this._input.length > this._offset) {
                      slice5 = this._input.substring(this._offset, this._offset + 1);
                    } else {
                      slice5 = null;
                    }
                    if (!this.error || this.error.offset <= this._offset) {
                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"]\""};
                    }
                  }
                  if (address7) {
                    elements0.push(address7);
                    text0 += address7.textValue;
                  } else {
                    elements0 = null;
                    this._offset = index1;
                  }
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass3 = this.constructor.SyntaxNode;
        var type3 = find(this.constructor, "ArrayRange");
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["array_rng"][index0] = address0;
    },
    __consume__object: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["object"] = this._nodeCache["object"] || {};
      var cached = this._nodeCache["object"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "{") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("{", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"{\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        var index2 = this._offset;
        var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
        var address3 = null;
        address3 = this.__consume__object_p();
        if (address3) {
          elements1.push(address3);
          text1 += address3.textValue;
          labelled1.object_p = address3;
          var address4 = null;
          var remaining0 = 0, index4 = this._offset, elements2 = [], text2 = "", address5 = true;
          while (address5) {
            var index5 = this._offset, elements3 = [], labelled2 = {}, text3 = "";
            var address6 = null;
            var slice2 = null;
            if (this._input.length > this._offset) {
              slice2 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice2 = null;
            }
            if (slice2 === ",") {
              var klass1 = this.constructor.SyntaxNode;
              var type1 = null;
              address6 = new klass1(",", this._offset, []);
              if (typeof type1 === "object") {
                extend(address6, type1);
              }
              this._offset += 1;
            } else {
              address6 = null;
              var slice3 = null;
              if (this._input.length > this._offset) {
                slice3 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice3 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\",\""};
              }
            }
            if (address6) {
              elements3.push(address6);
              text3 += address6.textValue;
              var address7 = null;
              address7 = this.__consume__object_p();
              if (address7) {
                elements3.push(address7);
                text3 += address7.textValue;
                labelled2.object_p = address7;
              } else {
                elements3 = null;
                this._offset = index5;
              }
            } else {
              elements3 = null;
              this._offset = index5;
            }
            if (elements3) {
              this._offset = index5;
              var klass2 = this.constructor.SyntaxNode;
              var type2 = null;
              address5 = new klass2(text3, this._offset, elements3, labelled2);
              if (typeof type2 === "object") {
                extend(address5, type2);
              }
              this._offset += text3.length;
            } else {
              address5 = null;
            }
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
              remaining0 -= 1;
            }
          }
          if (remaining0 <= 0) {
            this._offset = index4;
            var klass3 = this.constructor.SyntaxNode;
            var type3 = null;
            address4 = new klass3(text2, this._offset, elements2);
            if (typeof type3 === "object") {
              extend(address4, type3);
            }
            this._offset += text2.length;
          } else {
            address4 = null;
          }
          if (address4) {
            elements1.push(address4);
            text1 += address4.textValue;
          } else {
            elements1 = null;
            this._offset = index3;
          }
        } else {
          elements1 = null;
          this._offset = index3;
        }
        if (elements1) {
          this._offset = index3;
          var klass4 = this.constructor.SyntaxNode;
          var type4 = null;
          address2 = new klass4(text1, this._offset, elements1, labelled1);
          if (typeof type4 === "object") {
            extend(address2, type4);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
        } else {
          this._offset = index2;
          var klass5 = this.constructor.SyntaxNode;
          var type5 = null;
          address2 = new klass5("", this._offset, []);
          if (typeof type5 === "object") {
            extend(address2, type5);
          }
          this._offset += 0;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          var address8 = null;
          var slice4 = null;
          if (this._input.length > this._offset) {
            slice4 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice4 = null;
          }
          if (slice4 === "}") {
            var klass6 = this.constructor.SyntaxNode;
            var type6 = null;
            address8 = new klass6("}", this._offset, []);
            if (typeof type6 === "object") {
              extend(address8, type6);
            }
            this._offset += 1;
          } else {
            address8 = null;
            var slice5 = null;
            if (this._input.length > this._offset) {
              slice5 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice5 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"}\""};
            }
          }
          if (address8) {
            elements0.push(address8);
            text0 += address8.textValue;
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass7 = this.constructor.SyntaxNode;
        var type7 = find(this.constructor, "ObjectNode");
        address0 = new klass7(text0, this._offset, elements0, labelled0);
        if (typeof type7 === "object") {
          extend(address0, type7);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["object"][index0] = address0;
    },
    __consume__object_p: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["object_p"] = this._nodeCache["object_p"] || {};
      var cached = this._nodeCache["object_p"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume___();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0._ = address1;
        var address2 = null;
        var index2 = this._offset;
        address2 = this.__consume__string();
        if (address2) {
        } else {
          this._offset = index2;
          address2 = this.__consume__obj_name();
          if (address2) {
          } else {
            this._offset = index2;
          }
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0.name = address2;
          var address3 = null;
          address3 = this.__consume___();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0._ = address3;
            var address4 = null;
            var slice0 = null;
            if (this._input.length > this._offset) {
              slice0 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice0 = null;
            }
            if (slice0 === ":") {
              var klass0 = this.constructor.SyntaxNode;
              var type0 = null;
              address4 = new klass0(":", this._offset, []);
              if (typeof type0 === "object") {
                extend(address4, type0);
              }
              this._offset += 1;
            } else {
              address4 = null;
              var slice1 = null;
              if (this._input.length > this._offset) {
                slice1 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice1 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\":\""};
              }
            }
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              var address5 = null;
              address5 = this.__consume___();
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
                labelled0._ = address5;
                var address6 = null;
                address6 = this.__consume__expr();
                if (address6) {
                  elements0.push(address6);
                  text0 += address6.textValue;
                  labelled0.expr = address6;
                  var address7 = null;
                  address7 = this.__consume___();
                  if (address7) {
                    elements0.push(address7);
                    text0 += address7.textValue;
                    labelled0._ = address7;
                  } else {
                    elements0 = null;
                    this._offset = index1;
                  }
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass1 = this.constructor.SyntaxNode;
        var type1 = null;
        address0 = new klass1(text0, this._offset, elements0, labelled0);
        if (typeof type1 === "object") {
          extend(address0, type1);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["object_p"][index0] = address0;
    },
    __consume__lambda: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["lambda"] = this._nodeCache["lambda"] || {};
      var cached = this._nodeCache["lambda"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var index2 = this._offset;
      var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
      var address2 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "|") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address2 = new klass0("|", this._offset, []);
        if (typeof type0 === "object") {
          extend(address2, type0);
        }
        this._offset += 1;
      } else {
        address2 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"|\""};
        }
      }
      if (address2) {
        elements1.push(address2);
        text1 += address2.textValue;
        var address3 = null;
        address3 = this.__consume___();
        if (address3) {
          elements1.push(address3);
          text1 += address3.textValue;
          labelled1._ = address3;
          var address4 = null;
          var index4 = this._offset;
          var index5 = this._offset, elements2 = [], labelled2 = {}, text2 = "";
          var address5 = null;
          address5 = this.__consume__ident_p();
          if (address5) {
            elements2.push(address5);
            text2 += address5.textValue;
            labelled2.ident_p = address5;
            var address6 = null;
            var remaining0 = 0, index6 = this._offset, elements3 = [], text3 = "", address7 = true;
            while (address7) {
              var index7 = this._offset, elements4 = [], labelled3 = {}, text4 = "";
              var address8 = null;
              address8 = this.__consume___();
              if (address8) {
                elements4.push(address8);
                text4 += address8.textValue;
                labelled3._ = address8;
                var address9 = null;
                var slice2 = null;
                if (this._input.length > this._offset) {
                  slice2 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice2 = null;
                }
                if (slice2 === ",") {
                  var klass1 = this.constructor.SyntaxNode;
                  var type1 = null;
                  address9 = new klass1(",", this._offset, []);
                  if (typeof type1 === "object") {
                    extend(address9, type1);
                  }
                  this._offset += 1;
                } else {
                  address9 = null;
                  var slice3 = null;
                  if (this._input.length > this._offset) {
                    slice3 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice3 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\",\""};
                  }
                }
                if (address9) {
                  elements4.push(address9);
                  text4 += address9.textValue;
                  var address10 = null;
                  address10 = this.__consume___();
                  if (address10) {
                    elements4.push(address10);
                    text4 += address10.textValue;
                    labelled3._ = address10;
                    var address11 = null;
                    address11 = this.__consume__ident_p();
                    if (address11) {
                      elements4.push(address11);
                      text4 += address11.textValue;
                      labelled3.ident_p = address11;
                    } else {
                      elements4 = null;
                      this._offset = index7;
                    }
                  } else {
                    elements4 = null;
                    this._offset = index7;
                  }
                } else {
                  elements4 = null;
                  this._offset = index7;
                }
              } else {
                elements4 = null;
                this._offset = index7;
              }
              if (elements4) {
                this._offset = index7;
                var klass2 = this.constructor.SyntaxNode;
                var type2 = null;
                address7 = new klass2(text4, this._offset, elements4, labelled3);
                if (typeof type2 === "object") {
                  extend(address7, type2);
                }
                this._offset += text4.length;
              } else {
                address7 = null;
              }
              if (address7) {
                elements3.push(address7);
                text3 += address7.textValue;
                remaining0 -= 1;
              }
            }
            if (remaining0 <= 0) {
              this._offset = index6;
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address6 = new klass3(text3, this._offset, elements3);
              if (typeof type3 === "object") {
                extend(address6, type3);
              }
              this._offset += text3.length;
            } else {
              address6 = null;
            }
            if (address6) {
              elements2.push(address6);
              text2 += address6.textValue;
            } else {
              elements2 = null;
              this._offset = index5;
            }
          } else {
            elements2 = null;
            this._offset = index5;
          }
          if (elements2) {
            this._offset = index5;
            var klass4 = this.constructor.SyntaxNode;
            var type4 = null;
            address4 = new klass4(text2, this._offset, elements2, labelled2);
            if (typeof type4 === "object") {
              extend(address4, type4);
            }
            this._offset += text2.length;
          } else {
            address4 = null;
          }
          if (address4) {
          } else {
            this._offset = index4;
            var klass5 = this.constructor.SyntaxNode;
            var type5 = null;
            address4 = new klass5("", this._offset, []);
            if (typeof type5 === "object") {
              extend(address4, type5);
            }
            this._offset += 0;
          }
          if (address4) {
            elements1.push(address4);
            text1 += address4.textValue;
            var address12 = null;
            address12 = this.__consume___();
            if (address12) {
              elements1.push(address12);
              text1 += address12.textValue;
              labelled1._ = address12;
              var address13 = null;
              var slice4 = null;
              if (this._input.length > this._offset) {
                slice4 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice4 = null;
              }
              if (slice4 === "|") {
                var klass6 = this.constructor.SyntaxNode;
                var type6 = null;
                address13 = new klass6("|", this._offset, []);
                if (typeof type6 === "object") {
                  extend(address13, type6);
                }
                this._offset += 1;
              } else {
                address13 = null;
                var slice5 = null;
                if (this._input.length > this._offset) {
                  slice5 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice5 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"|\""};
                }
              }
              if (address13) {
                elements1.push(address13);
                text1 += address13.textValue;
              } else {
                elements1 = null;
                this._offset = index3;
              }
            } else {
              elements1 = null;
              this._offset = index3;
            }
          } else {
            elements1 = null;
            this._offset = index3;
          }
        } else {
          elements1 = null;
          this._offset = index3;
        }
      } else {
        elements1 = null;
        this._offset = index3;
      }
      if (elements1) {
        this._offset = index3;
        var klass7 = this.constructor.SyntaxNode;
        var type7 = null;
        address1 = new klass7(text1, this._offset, elements1, labelled1);
        if (typeof type7 === "object") {
          extend(address1, type7);
        }
        this._offset += text1.length;
      } else {
        address1 = null;
      }
      if (address1) {
      } else {
        this._offset = index2;
        var klass8 = this.constructor.SyntaxNode;
        var type8 = null;
        address1 = new klass8("", this._offset, []);
        if (typeof type8 === "object") {
          extend(address1, type8);
        }
        this._offset += 0;
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address14 = null;
        address14 = this.__consume___();
        if (address14) {
          elements0.push(address14);
          text0 += address14.textValue;
          labelled0._ = address14;
          var address15 = null;
          address15 = this.__consume__funblock();
          if (address15) {
            elements0.push(address15);
            text0 += address15.textValue;
            labelled0.funblock = address15;
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass9 = this.constructor.SyntaxNode;
        var type9 = find(this.constructor, "Lambda");
        address0 = new klass9(text0, this._offset, elements0, labelled0);
        if (typeof type9 === "object") {
          extend(address0, type9);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["lambda"][index0] = address0;
    },
    __consume__listcomp: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["listcomp"] = this._nodeCache["listcomp"] || {};
      var cached = this._nodeCache["listcomp"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "[") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("[", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"[\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__expr();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.expr = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              var slice2 = null;
              if (this._input.length > this._offset) {
                slice2 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice2 = null;
              }
              if (slice2 === "|") {
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address5 = new klass1("|", this._offset, []);
                if (typeof type1 === "object") {
                  extend(address5, type1);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice3 = null;
                if (this._input.length > this._offset) {
                  slice3 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice3 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"|\""};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
                var address6 = null;
                address6 = this.__consume___();
                if (address6) {
                  elements0.push(address6);
                  text0 += address6.textValue;
                  labelled0._ = address6;
                  var address7 = null;
                  var index2 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
                  var address8 = null;
                  address8 = this.__consume__ident_p();
                  if (address8) {
                    elements1.push(address8);
                    text1 += address8.textValue;
                    labelled1.ident_p = address8;
                    var address9 = null;
                    address9 = this.__consume___();
                    if (address9) {
                      elements1.push(address9);
                      text1 += address9.textValue;
                      labelled1._ = address9;
                      var address10 = null;
                      var slice4 = null;
                      if (this._input.length > this._offset) {
                        slice4 = this._input.substring(this._offset, this._offset + 2);
                      } else {
                        slice4 = null;
                      }
                      if (slice4 === "<-") {
                        var klass2 = this.constructor.SyntaxNode;
                        var type2 = null;
                        address10 = new klass2("<-", this._offset, []);
                        if (typeof type2 === "object") {
                          extend(address10, type2);
                        }
                        this._offset += 2;
                      } else {
                        address10 = null;
                        var slice5 = null;
                        if (this._input.length > this._offset) {
                          slice5 = this._input.substring(this._offset, this._offset + 1);
                        } else {
                          slice5 = null;
                        }
                        if (!this.error || this.error.offset <= this._offset) {
                          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"<-\""};
                        }
                      }
                      if (address10) {
                        elements1.push(address10);
                        text1 += address10.textValue;
                        var address11 = null;
                        address11 = this.__consume___();
                        if (address11) {
                          elements1.push(address11);
                          text1 += address11.textValue;
                          labelled1._ = address11;
                          var address12 = null;
                          address12 = this.__consume__expr();
                          if (address12) {
                            elements1.push(address12);
                            text1 += address12.textValue;
                            labelled1.expr = address12;
                          } else {
                            elements1 = null;
                            this._offset = index2;
                          }
                        } else {
                          elements1 = null;
                          this._offset = index2;
                        }
                      } else {
                        elements1 = null;
                        this._offset = index2;
                      }
                    } else {
                      elements1 = null;
                      this._offset = index2;
                    }
                  } else {
                    elements1 = null;
                    this._offset = index2;
                  }
                  if (elements1) {
                    this._offset = index2;
                    var klass3 = this.constructor.SyntaxNode;
                    var type3 = null;
                    address7 = new klass3(text1, this._offset, elements1, labelled1);
                    if (typeof type3 === "object") {
                      extend(address7, type3);
                    }
                    this._offset += text1.length;
                  } else {
                    address7 = null;
                  }
                  if (address7) {
                    elements0.push(address7);
                    text0 += address7.textValue;
                    var address13 = null;
                    var remaining0 = 0, index3 = this._offset, elements2 = [], text2 = "", address14 = true;
                    while (address14) {
                      var index4 = this._offset, elements3 = [], labelled2 = {}, text3 = "";
                      var address15 = null;
                      address15 = this.__consume___();
                      if (address15) {
                        elements3.push(address15);
                        text3 += address15.textValue;
                        labelled2._ = address15;
                        var address16 = null;
                        var slice6 = null;
                        if (this._input.length > this._offset) {
                          slice6 = this._input.substring(this._offset, this._offset + 1);
                        } else {
                          slice6 = null;
                        }
                        if (slice6 === ",") {
                          var klass4 = this.constructor.SyntaxNode;
                          var type4 = null;
                          address16 = new klass4(",", this._offset, []);
                          if (typeof type4 === "object") {
                            extend(address16, type4);
                          }
                          this._offset += 1;
                        } else {
                          address16 = null;
                          var slice7 = null;
                          if (this._input.length > this._offset) {
                            slice7 = this._input.substring(this._offset, this._offset + 1);
                          } else {
                            slice7 = null;
                          }
                          if (!this.error || this.error.offset <= this._offset) {
                            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\",\""};
                          }
                        }
                        if (address16) {
                          elements3.push(address16);
                          text3 += address16.textValue;
                          var address17 = null;
                          address17 = this.__consume___();
                          if (address17) {
                            elements3.push(address17);
                            text3 += address17.textValue;
                            labelled2._ = address17;
                            var address18 = null;
                            var index5 = this._offset, elements4 = [], labelled3 = {}, text4 = "";
                            var address19 = null;
                            address19 = this.__consume__ident_p();
                            if (address19) {
                              elements4.push(address19);
                              text4 += address19.textValue;
                              labelled3.ident_p = address19;
                              var address20 = null;
                              address20 = this.__consume___();
                              if (address20) {
                                elements4.push(address20);
                                text4 += address20.textValue;
                                labelled3._ = address20;
                                var address21 = null;
                                var slice8 = null;
                                if (this._input.length > this._offset) {
                                  slice8 = this._input.substring(this._offset, this._offset + 2);
                                } else {
                                  slice8 = null;
                                }
                                if (slice8 === "<-") {
                                  var klass5 = this.constructor.SyntaxNode;
                                  var type5 = null;
                                  address21 = new klass5("<-", this._offset, []);
                                  if (typeof type5 === "object") {
                                    extend(address21, type5);
                                  }
                                  this._offset += 2;
                                } else {
                                  address21 = null;
                                  var slice9 = null;
                                  if (this._input.length > this._offset) {
                                    slice9 = this._input.substring(this._offset, this._offset + 1);
                                  } else {
                                    slice9 = null;
                                  }
                                  if (!this.error || this.error.offset <= this._offset) {
                                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"<-\""};
                                  }
                                }
                                if (address21) {
                                  elements4.push(address21);
                                  text4 += address21.textValue;
                                  var address22 = null;
                                  address22 = this.__consume___();
                                  if (address22) {
                                    elements4.push(address22);
                                    text4 += address22.textValue;
                                    labelled3._ = address22;
                                    var address23 = null;
                                    address23 = this.__consume__expr();
                                    if (address23) {
                                      elements4.push(address23);
                                      text4 += address23.textValue;
                                      labelled3.expr = address23;
                                    } else {
                                      elements4 = null;
                                      this._offset = index5;
                                    }
                                  } else {
                                    elements4 = null;
                                    this._offset = index5;
                                  }
                                } else {
                                  elements4 = null;
                                  this._offset = index5;
                                }
                              } else {
                                elements4 = null;
                                this._offset = index5;
                              }
                            } else {
                              elements4 = null;
                              this._offset = index5;
                            }
                            if (elements4) {
                              this._offset = index5;
                              var klass6 = this.constructor.SyntaxNode;
                              var type6 = null;
                              address18 = new klass6(text4, this._offset, elements4, labelled3);
                              if (typeof type6 === "object") {
                                extend(address18, type6);
                              }
                              this._offset += text4.length;
                            } else {
                              address18 = null;
                            }
                            if (address18) {
                              elements3.push(address18);
                              text3 += address18.textValue;
                            } else {
                              elements3 = null;
                              this._offset = index4;
                            }
                          } else {
                            elements3 = null;
                            this._offset = index4;
                          }
                        } else {
                          elements3 = null;
                          this._offset = index4;
                        }
                      } else {
                        elements3 = null;
                        this._offset = index4;
                      }
                      if (elements3) {
                        this._offset = index4;
                        var klass7 = this.constructor.SyntaxNode;
                        var type7 = null;
                        address14 = new klass7(text3, this._offset, elements3, labelled2);
                        if (typeof type7 === "object") {
                          extend(address14, type7);
                        }
                        this._offset += text3.length;
                      } else {
                        address14 = null;
                      }
                      if (address14) {
                        elements2.push(address14);
                        text2 += address14.textValue;
                        remaining0 -= 1;
                      }
                    }
                    if (remaining0 <= 0) {
                      this._offset = index3;
                      var klass8 = this.constructor.SyntaxNode;
                      var type8 = null;
                      address13 = new klass8(text2, this._offset, elements2);
                      if (typeof type8 === "object") {
                        extend(address13, type8);
                      }
                      this._offset += text2.length;
                    } else {
                      address13 = null;
                    }
                    if (address13) {
                      elements0.push(address13);
                      text0 += address13.textValue;
                      var address24 = null;
                      address24 = this.__consume___();
                      if (address24) {
                        elements0.push(address24);
                        text0 += address24.textValue;
                        labelled0._ = address24;
                        var address25 = null;
                        var slice10 = null;
                        if (this._input.length > this._offset) {
                          slice10 = this._input.substring(this._offset, this._offset + 1);
                        } else {
                          slice10 = null;
                        }
                        if (slice10 === "]") {
                          var klass9 = this.constructor.SyntaxNode;
                          var type9 = null;
                          address25 = new klass9("]", this._offset, []);
                          if (typeof type9 === "object") {
                            extend(address25, type9);
                          }
                          this._offset += 1;
                        } else {
                          address25 = null;
                          var slice11 = null;
                          if (this._input.length > this._offset) {
                            slice11 = this._input.substring(this._offset, this._offset + 1);
                          } else {
                            slice11 = null;
                          }
                          if (!this.error || this.error.offset <= this._offset) {
                            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"]\""};
                          }
                        }
                        if (address25) {
                          elements0.push(address25);
                          text0 += address25.textValue;
                        } else {
                          elements0 = null;
                          this._offset = index1;
                        }
                      } else {
                        elements0 = null;
                        this._offset = index1;
                      }
                    } else {
                      elements0 = null;
                      this._offset = index1;
                    }
                  } else {
                    elements0 = null;
                    this._offset = index1;
                  }
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass10 = this.constructor.SyntaxNode;
        var type10 = find(this.constructor, "ListComprehension");
        address0 = new klass10(text0, this._offset, elements0, labelled0);
        if (typeof type10 === "object") {
          extend(address0, type10);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["listcomp"][index0] = address0;
    },
    __consume__funcall: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["funcall"] = this._nodeCache["funcall"] || {};
      var cached = this._nodeCache["funcall"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      var index2 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume___();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0._ = address1;
        var address2 = null;
        address2 = this.__consume__lambda();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0.lambda = address2;
          var address3 = null;
          address3 = this.__consume___();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0._ = address3;
          } else {
            elements0 = null;
            this._offset = index2;
          }
        } else {
          elements0 = null;
          this._offset = index2;
        }
      } else {
        elements0 = null;
        this._offset = index2;
      }
      if (elements0) {
        this._offset = index2;
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address0 = new klass0(text0, this._offset, elements0, labelled0);
        if (typeof type0 === "object") {
          extend(address0, type0);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      if (address0) {
        var type1 = find(this.constructor, "FunctionInvocation");
        if (typeof type1 === "object") {
          extend(address0, type1);
        }
      } else {
        this._offset = index1;
        var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
        var address4 = null;
        var slice0 = null;
        if (this._input.length > this._offset) {
          slice0 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice0 = null;
        }
        if (slice0 === "(") {
          var klass1 = this.constructor.SyntaxNode;
          var type2 = null;
          address4 = new klass1("(", this._offset, []);
          if (typeof type2 === "object") {
            extend(address4, type2);
          }
          this._offset += 1;
        } else {
          address4 = null;
          var slice1 = null;
          if (this._input.length > this._offset) {
            slice1 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice1 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"(\""};
          }
        }
        if (address4) {
          elements1.push(address4);
          text1 += address4.textValue;
          var address5 = null;
          address5 = this.__consume___();
          if (address5) {
            elements1.push(address5);
            text1 += address5.textValue;
            labelled1._ = address5;
            var address6 = null;
            var index4 = this._offset;
            address6 = this.__consume__expr_list();
            if (address6) {
            } else {
              this._offset = index4;
              var klass2 = this.constructor.SyntaxNode;
              var type3 = null;
              address6 = new klass2("", this._offset, []);
              if (typeof type3 === "object") {
                extend(address6, type3);
              }
              this._offset += 0;
            }
            if (address6) {
              elements1.push(address6);
              text1 += address6.textValue;
              var address7 = null;
              address7 = this.__consume___();
              if (address7) {
                elements1.push(address7);
                text1 += address7.textValue;
                labelled1._ = address7;
                var address8 = null;
                var slice2 = null;
                if (this._input.length > this._offset) {
                  slice2 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice2 = null;
                }
                if (slice2 === ")") {
                  var klass3 = this.constructor.SyntaxNode;
                  var type4 = null;
                  address8 = new klass3(")", this._offset, []);
                  if (typeof type4 === "object") {
                    extend(address8, type4);
                  }
                  this._offset += 1;
                } else {
                  address8 = null;
                  var slice3 = null;
                  if (this._input.length > this._offset) {
                    slice3 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice3 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\")\""};
                  }
                }
                if (address8) {
                  elements1.push(address8);
                  text1 += address8.textValue;
                } else {
                  elements1 = null;
                  this._offset = index3;
                }
              } else {
                elements1 = null;
                this._offset = index3;
              }
            } else {
              elements1 = null;
              this._offset = index3;
            }
          } else {
            elements1 = null;
            this._offset = index3;
          }
        } else {
          elements1 = null;
          this._offset = index3;
        }
        if (elements1) {
          this._offset = index3;
          var klass4 = this.constructor.SyntaxNode;
          var type5 = null;
          address0 = new klass4(text1, this._offset, elements1, labelled1);
          if (typeof type5 === "object") {
            extend(address0, type5);
          }
          this._offset += text1.length;
        } else {
          address0 = null;
        }
        if (address0) {
          var type6 = find(this.constructor, "FunctionInvocation");
          if (typeof type6 === "object") {
            extend(address0, type6);
          }
        } else {
          this._offset = index1;
        }
      }
      return this._nodeCache["funcall"][index0] = address0;
    },
    __consume__arrayacs: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["arrayacs"] = this._nodeCache["arrayacs"] || {};
      var cached = this._nodeCache["arrayacs"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "[") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("[", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"[\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__expr();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.expr = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              var slice2 = null;
              if (this._input.length > this._offset) {
                slice2 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice2 = null;
              }
              if (slice2 === "]") {
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address5 = new klass1("]", this._offset, []);
                if (typeof type1 === "object") {
                  extend(address5, type1);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice3 = null;
                if (this._input.length > this._offset) {
                  slice3 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice3 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"]\""};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
                var address6 = null;
                address6 = this.__consume___();
                if (address6) {
                  elements0.push(address6);
                  text0 += address6.textValue;
                  labelled0._ = address6;
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass2 = this.constructor.SyntaxNode;
        var type2 = find(this.constructor, "ArrayAccess");
        address0 = new klass2(text0, this._offset, elements0, labelled0);
        if (typeof type2 === "object") {
          extend(address0, type2);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["arrayacs"][index0] = address0;
    },
    __consume__arrayslc: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["arrayslc"] = this._nodeCache["arrayslc"] || {};
      var cached = this._nodeCache["arrayslc"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "[") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("[", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"[\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        address2 = this.__consume___();
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          labelled0._ = address2;
          var address3 = null;
          address3 = this.__consume__slice();
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.slice = address3;
            var address4 = null;
            address4 = this.__consume___();
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0._ = address4;
              var address5 = null;
              var slice2 = null;
              if (this._input.length > this._offset) {
                slice2 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice2 = null;
              }
              if (slice2 === "]") {
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address5 = new klass1("]", this._offset, []);
                if (typeof type1 === "object") {
                  extend(address5, type1);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice3 = null;
                if (this._input.length > this._offset) {
                  slice3 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice3 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"]\""};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
                var address6 = null;
                address6 = this.__consume___();
                if (address6) {
                  elements0.push(address6);
                  text0 += address6.textValue;
                  labelled0._ = address6;
                } else {
                  elements0 = null;
                  this._offset = index1;
                }
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass2 = this.constructor.SyntaxNode;
        var type2 = find(this.constructor, "ArraySlice");
        address0 = new klass2(text0, this._offset, elements0, labelled0);
        if (typeof type2 === "object") {
          extend(address0, type2);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["arrayslc"][index0] = address0;
    },
    __consume__slice: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["slice"] = this._nodeCache["slice"] || {};
      var cached = this._nodeCache["slice"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var index2 = this._offset;
      address1 = this.__consume__integer();
      if (address1) {
      } else {
        this._offset = index2;
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 0;
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.start = address1;
        var address2 = null;
        var slice0 = null;
        if (this._input.length > this._offset) {
          slice0 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice0 = null;
        }
        if (slice0 === ":") {
          var klass1 = this.constructor.SyntaxNode;
          var type1 = null;
          address2 = new klass1(":", this._offset, []);
          if (typeof type1 === "object") {
            extend(address2, type1);
          }
          this._offset += 1;
        } else {
          address2 = null;
          var slice1 = null;
          if (this._input.length > this._offset) {
            slice1 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice1 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\":\""};
          }
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          var address3 = null;
          var index3 = this._offset;
          address3 = this.__consume__integer();
          if (address3) {
          } else {
            this._offset = index3;
            var klass2 = this.constructor.SyntaxNode;
            var type2 = null;
            address3 = new klass2("", this._offset, []);
            if (typeof type2 === "object") {
              extend(address3, type2);
            }
            this._offset += 0;
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            labelled0.end = address3;
            var address4 = null;
            var index4 = this._offset;
            var index5 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
            var address5 = null;
            var slice2 = null;
            if (this._input.length > this._offset) {
              slice2 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice2 = null;
            }
            if (slice2 === ":") {
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address5 = new klass3(":", this._offset, []);
              if (typeof type3 === "object") {
                extend(address5, type3);
              }
              this._offset += 1;
            } else {
              address5 = null;
              var slice3 = null;
              if (this._input.length > this._offset) {
                slice3 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice3 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\":\""};
              }
            }
            if (address5) {
              elements1.push(address5);
              text1 += address5.textValue;
              var address6 = null;
              address6 = this.__consume__integer();
              if (address6) {
                elements1.push(address6);
                text1 += address6.textValue;
                labelled1.integer = address6;
              } else {
                elements1 = null;
                this._offset = index5;
              }
            } else {
              elements1 = null;
              this._offset = index5;
            }
            if (elements1) {
              this._offset = index5;
              var klass4 = this.constructor.SyntaxNode;
              var type4 = null;
              address4 = new klass4(text1, this._offset, elements1, labelled1);
              if (typeof type4 === "object") {
                extend(address4, type4);
              }
              this._offset += text1.length;
            } else {
              address4 = null;
            }
            if (address4) {
            } else {
              this._offset = index4;
              var klass5 = this.constructor.SyntaxNode;
              var type5 = null;
              address4 = new klass5("", this._offset, []);
              if (typeof type5 === "object") {
                extend(address4, type5);
              }
              this._offset += 0;
            }
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              labelled0.step = address4;
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass6 = this.constructor.SyntaxNode;
        var type6 = null;
        address0 = new klass6(text0, this._offset, elements0, labelled0);
        if (typeof type6 === "object") {
          extend(address0, type6);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["slice"][index0] = address0;
    },
    __consume__type: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["type"] = this._nodeCache["type"] || {};
      var cached = this._nodeCache["type"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 6);
      } else {
        slice0 = null;
      }
      if (slice0 === "string") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address0 = new klass0("string", this._offset, []);
        if (typeof type0 === "object") {
          extend(address0, type0);
        }
        this._offset += 6;
      } else {
        address0 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"string\""};
        }
      }
      if (address0) {
      } else {
        this._offset = index1;
        var slice2 = null;
        if (this._input.length > this._offset) {
          slice2 = this._input.substring(this._offset, this._offset + 6);
        } else {
          slice2 = null;
        }
        if (slice2 === "number") {
          var klass1 = this.constructor.SyntaxNode;
          var type1 = null;
          address0 = new klass1("number", this._offset, []);
          if (typeof type1 === "object") {
            extend(address0, type1);
          }
          this._offset += 6;
        } else {
          address0 = null;
          var slice3 = null;
          if (this._input.length > this._offset) {
            slice3 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice3 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"number\""};
          }
        }
        if (address0) {
        } else {
          this._offset = index1;
          address0 = this.__consume__ident();
          var type2 = find(this.constructor, "Type");
          if (typeof type2 === "object") {
            extend(address0, type2);
          }
          if (address0) {
          } else {
            this._offset = index1;
          }
        }
      }
      return this._nodeCache["type"][index0] = address0;
    },
    __consume__string: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["string"] = this._nodeCache["string"] || {};
      var cached = this._nodeCache["string"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      var index2 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "\"") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("\"", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"\\\"\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        var remaining0 = 0, index3 = this._offset, elements1 = [], text1 = "", address3 = true;
        while (address3) {
          var index4 = this._offset;
          var slice2 = null;
          if (this._input.length > this._offset) {
            slice2 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice2 = null;
          }
          if (slice2 && /^[^"\\]/.test(slice2)) {
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1(slice2, this._offset, []);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += 1;
          } else {
            address3 = null;
            var slice3 = null;
            if (this._input.length > this._offset) {
              slice3 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice3 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[^\"\\\\]"};
            }
          }
          if (address3) {
          } else {
            this._offset = index4;
            var index5 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
            var address4 = null;
            var slice4 = null;
            if (this._input.length > this._offset) {
              slice4 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice4 = null;
            }
            if (slice4 === "\\") {
              var klass2 = this.constructor.SyntaxNode;
              var type2 = null;
              address4 = new klass2("\\", this._offset, []);
              if (typeof type2 === "object") {
                extend(address4, type2);
              }
              this._offset += 1;
            } else {
              address4 = null;
              var slice5 = null;
              if (this._input.length > this._offset) {
                slice5 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice5 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"\\\\\""};
              }
            }
            if (address4) {
              elements2.push(address4);
              text2 += address4.textValue;
              var address5 = null;
              var slice6 = null;
              if (this._input.length > this._offset) {
                slice6 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice6 = null;
              }
              if (slice6 && /^["bfnrt\\/]/.test(slice6)) {
                var klass3 = this.constructor.SyntaxNode;
                var type3 = null;
                address5 = new klass3(slice6, this._offset, []);
                if (typeof type3 === "object") {
                  extend(address5, type3);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice7 = null;
                if (this._input.length > this._offset) {
                  slice7 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice7 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[\"bfnrt\\\\/]"};
                }
              }
              if (address5) {
                elements2.push(address5);
                text2 += address5.textValue;
              } else {
                elements2 = null;
                this._offset = index5;
              }
            } else {
              elements2 = null;
              this._offset = index5;
            }
            if (elements2) {
              this._offset = index5;
              var klass4 = this.constructor.SyntaxNode;
              var type4 = null;
              address3 = new klass4(text2, this._offset, elements2, labelled1);
              if (typeof type4 === "object") {
                extend(address3, type4);
              }
              this._offset += text2.length;
            } else {
              address3 = null;
            }
            if (address3) {
            } else {
              this._offset = index4;
              address3 = this.__consume__hex();
              if (address3) {
              } else {
                this._offset = index4;
              }
            }
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            remaining0 -= 1;
          }
        }
        if (remaining0 <= 0) {
          this._offset = index3;
          var klass5 = this.constructor.SyntaxNode;
          var type5 = null;
          address2 = new klass5(text1, this._offset, elements1);
          if (typeof type5 === "object") {
            extend(address2, type5);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          var address6 = null;
          var slice8 = null;
          if (this._input.length > this._offset) {
            slice8 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice8 = null;
          }
          if (slice8 === "\"") {
            var klass6 = this.constructor.SyntaxNode;
            var type6 = null;
            address6 = new klass6("\"", this._offset, []);
            if (typeof type6 === "object") {
              extend(address6, type6);
            }
            this._offset += 1;
          } else {
            address6 = null;
            var slice9 = null;
            if (this._input.length > this._offset) {
              slice9 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice9 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"\\\"\""};
            }
          }
          if (address6) {
            elements0.push(address6);
            text0 += address6.textValue;
          } else {
            elements0 = null;
            this._offset = index2;
          }
        } else {
          elements0 = null;
          this._offset = index2;
        }
      } else {
        elements0 = null;
        this._offset = index2;
      }
      if (elements0) {
        this._offset = index2;
        var klass7 = this.constructor.SyntaxNode;
        var type7 = null;
        address0 = new klass7(text0, this._offset, elements0, labelled0);
        if (typeof type7 === "object") {
          extend(address0, type7);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      if (address0) {
        var type8 = find(this.constructor, "StringNode");
        if (typeof type8 === "object") {
          extend(address0, type8);
        }
      } else {
        this._offset = index1;
        var index6 = this._offset, elements3 = [], labelled2 = {}, text3 = "";
        var address7 = null;
        var slice10 = null;
        if (this._input.length > this._offset) {
          slice10 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice10 = null;
        }
        if (slice10 === "'") {
          var klass8 = this.constructor.SyntaxNode;
          var type9 = null;
          address7 = new klass8("'", this._offset, []);
          if (typeof type9 === "object") {
            extend(address7, type9);
          }
          this._offset += 1;
        } else {
          address7 = null;
          var slice11 = null;
          if (this._input.length > this._offset) {
            slice11 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice11 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"'\""};
          }
        }
        if (address7) {
          elements3.push(address7);
          text3 += address7.textValue;
          var address8 = null;
          var remaining1 = 0, index7 = this._offset, elements4 = [], text4 = "", address9 = true;
          while (address9) {
            var index8 = this._offset;
            var slice12 = null;
            if (this._input.length > this._offset) {
              slice12 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice12 = null;
            }
            if (slice12 && /^[^'\\]/.test(slice12)) {
              var klass9 = this.constructor.SyntaxNode;
              var type10 = null;
              address9 = new klass9(slice12, this._offset, []);
              if (typeof type10 === "object") {
                extend(address9, type10);
              }
              this._offset += 1;
            } else {
              address9 = null;
              var slice13 = null;
              if (this._input.length > this._offset) {
                slice13 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice13 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[^'\\\\]"};
              }
            }
            if (address9) {
            } else {
              this._offset = index8;
              var index9 = this._offset, elements5 = [], labelled3 = {}, text5 = "";
              var address10 = null;
              var slice14 = null;
              if (this._input.length > this._offset) {
                slice14 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice14 = null;
              }
              if (slice14 === "\\") {
                var klass10 = this.constructor.SyntaxNode;
                var type11 = null;
                address10 = new klass10("\\", this._offset, []);
                if (typeof type11 === "object") {
                  extend(address10, type11);
                }
                this._offset += 1;
              } else {
                address10 = null;
                var slice15 = null;
                if (this._input.length > this._offset) {
                  slice15 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice15 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"\\\\\""};
                }
              }
              if (address10) {
                elements5.push(address10);
                text5 += address10.textValue;
                var address11 = null;
                var slice16 = null;
                if (this._input.length > this._offset) {
                  slice16 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice16 = null;
                }
                if (slice16 && /^["bfnrt\\/]/.test(slice16)) {
                  var klass11 = this.constructor.SyntaxNode;
                  var type12 = null;
                  address11 = new klass11(slice16, this._offset, []);
                  if (typeof type12 === "object") {
                    extend(address11, type12);
                  }
                  this._offset += 1;
                } else {
                  address11 = null;
                  var slice17 = null;
                  if (this._input.length > this._offset) {
                    slice17 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice17 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[\"bfnrt\\\\/]"};
                  }
                }
                if (address11) {
                  elements5.push(address11);
                  text5 += address11.textValue;
                } else {
                  elements5 = null;
                  this._offset = index9;
                }
              } else {
                elements5 = null;
                this._offset = index9;
              }
              if (elements5) {
                this._offset = index9;
                var klass12 = this.constructor.SyntaxNode;
                var type13 = null;
                address9 = new klass12(text5, this._offset, elements5, labelled3);
                if (typeof type13 === "object") {
                  extend(address9, type13);
                }
                this._offset += text5.length;
              } else {
                address9 = null;
              }
              if (address9) {
              } else {
                this._offset = index8;
                address9 = this.__consume__hex();
                if (address9) {
                } else {
                  this._offset = index8;
                }
              }
            }
            if (address9) {
              elements4.push(address9);
              text4 += address9.textValue;
              remaining1 -= 1;
            }
          }
          if (remaining1 <= 0) {
            this._offset = index7;
            var klass13 = this.constructor.SyntaxNode;
            var type14 = null;
            address8 = new klass13(text4, this._offset, elements4);
            if (typeof type14 === "object") {
              extend(address8, type14);
            }
            this._offset += text4.length;
          } else {
            address8 = null;
          }
          if (address8) {
            elements3.push(address8);
            text3 += address8.textValue;
            var address12 = null;
            var slice18 = null;
            if (this._input.length > this._offset) {
              slice18 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice18 = null;
            }
            if (slice18 === "'") {
              var klass14 = this.constructor.SyntaxNode;
              var type15 = null;
              address12 = new klass14("'", this._offset, []);
              if (typeof type15 === "object") {
                extend(address12, type15);
              }
              this._offset += 1;
            } else {
              address12 = null;
              var slice19 = null;
              if (this._input.length > this._offset) {
                slice19 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice19 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"'\""};
              }
            }
            if (address12) {
              elements3.push(address12);
              text3 += address12.textValue;
            } else {
              elements3 = null;
              this._offset = index6;
            }
          } else {
            elements3 = null;
            this._offset = index6;
          }
        } else {
          elements3 = null;
          this._offset = index6;
        }
        if (elements3) {
          this._offset = index6;
          var klass15 = this.constructor.SyntaxNode;
          var type16 = null;
          address0 = new klass15(text3, this._offset, elements3, labelled2);
          if (typeof type16 === "object") {
            extend(address0, type16);
          }
          this._offset += text3.length;
        } else {
          address0 = null;
        }
        if (address0) {
          var type17 = find(this.constructor, "StringNode");
          if (typeof type17 === "object") {
            extend(address0, type17);
          }
        } else {
          this._offset = index1;
        }
      }
      return this._nodeCache["string"][index0] = address0;
    },
    __consume__number: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["number"] = this._nodeCache["number"] || {};
      var cached = this._nodeCache["number"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var index2 = this._offset;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "-") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("-", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"-\""};
        }
      }
      if (address1) {
      } else {
        this._offset = index2;
        var klass1 = this.constructor.SyntaxNode;
        var type1 = null;
        address1 = new klass1("", this._offset, []);
        if (typeof type1 === "object") {
          extend(address1, type1);
        }
        this._offset += 0;
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
        var address3 = null;
        var index4 = this._offset;
        var slice2 = null;
        if (this._input.length > this._offset) {
          slice2 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice2 = null;
        }
        if (slice2 === "0") {
          var klass2 = this.constructor.SyntaxNode;
          var type2 = null;
          address3 = new klass2("0", this._offset, []);
          if (typeof type2 === "object") {
            extend(address3, type2);
          }
          this._offset += 1;
        } else {
          address3 = null;
          var slice3 = null;
          if (this._input.length > this._offset) {
            slice3 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice3 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"0\""};
          }
        }
        if (address3) {
        } else {
          this._offset = index4;
          var index5 = this._offset, elements2 = [], labelled2 = {}, text2 = "";
          var address4 = null;
          var slice4 = null;
          if (this._input.length > this._offset) {
            slice4 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice4 = null;
          }
          if (slice4 && /^[1-9]/.test(slice4)) {
            var klass3 = this.constructor.SyntaxNode;
            var type3 = null;
            address4 = new klass3(slice4, this._offset, []);
            if (typeof type3 === "object") {
              extend(address4, type3);
            }
            this._offset += 1;
          } else {
            address4 = null;
            var slice5 = null;
            if (this._input.length > this._offset) {
              slice5 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice5 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[1-9]"};
            }
          }
          if (address4) {
            elements2.push(address4);
            text2 += address4.textValue;
            var address5 = null;
            var remaining0 = 0, index6 = this._offset, elements3 = [], text3 = "", address6 = true;
            while (address6) {
              var slice6 = null;
              if (this._input.length > this._offset) {
                slice6 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice6 = null;
              }
              if (slice6 && /^[0-9]/.test(slice6)) {
                var klass4 = this.constructor.SyntaxNode;
                var type4 = null;
                address6 = new klass4(slice6, this._offset, []);
                if (typeof type4 === "object") {
                  extend(address6, type4);
                }
                this._offset += 1;
              } else {
                address6 = null;
                var slice7 = null;
                if (this._input.length > this._offset) {
                  slice7 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice7 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9]"};
                }
              }
              if (address6) {
                elements3.push(address6);
                text3 += address6.textValue;
                remaining0 -= 1;
              }
            }
            if (remaining0 <= 0) {
              this._offset = index6;
              var klass5 = this.constructor.SyntaxNode;
              var type5 = null;
              address5 = new klass5(text3, this._offset, elements3);
              if (typeof type5 === "object") {
                extend(address5, type5);
              }
              this._offset += text3.length;
            } else {
              address5 = null;
            }
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
            } else {
              elements2 = null;
              this._offset = index5;
            }
          } else {
            elements2 = null;
            this._offset = index5;
          }
          if (elements2) {
            this._offset = index5;
            var klass6 = this.constructor.SyntaxNode;
            var type6 = null;
            address3 = new klass6(text2, this._offset, elements2, labelled2);
            if (typeof type6 === "object") {
              extend(address3, type6);
            }
            this._offset += text2.length;
          } else {
            address3 = null;
          }
          if (address3) {
          } else {
            this._offset = index4;
          }
        }
        if (address3) {
          elements1.push(address3);
          text1 += address3.textValue;
          var address7 = null;
          var index7 = this._offset;
          var index8 = this._offset, elements4 = [], labelled3 = {}, text4 = "";
          var address8 = null;
          var slice8 = null;
          if (this._input.length > this._offset) {
            slice8 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice8 = null;
          }
          if (slice8 === ".") {
            var klass7 = this.constructor.SyntaxNode;
            var type7 = null;
            address8 = new klass7(".", this._offset, []);
            if (typeof type7 === "object") {
              extend(address8, type7);
            }
            this._offset += 1;
          } else {
            address8 = null;
            var slice9 = null;
            if (this._input.length > this._offset) {
              slice9 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice9 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\".\""};
            }
          }
          if (address8) {
            elements4.push(address8);
            text4 += address8.textValue;
            var address9 = null;
            var remaining1 = 1, index9 = this._offset, elements5 = [], text5 = "", address10 = true;
            while (address10) {
              var slice10 = null;
              if (this._input.length > this._offset) {
                slice10 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice10 = null;
              }
              if (slice10 && /^[0-9]/.test(slice10)) {
                var klass8 = this.constructor.SyntaxNode;
                var type8 = null;
                address10 = new klass8(slice10, this._offset, []);
                if (typeof type8 === "object") {
                  extend(address10, type8);
                }
                this._offset += 1;
              } else {
                address10 = null;
                var slice11 = null;
                if (this._input.length > this._offset) {
                  slice11 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice11 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9]"};
                }
              }
              if (address10) {
                elements5.push(address10);
                text5 += address10.textValue;
                remaining1 -= 1;
              }
            }
            if (remaining1 <= 0) {
              this._offset = index9;
              var klass9 = this.constructor.SyntaxNode;
              var type9 = null;
              address9 = new klass9(text5, this._offset, elements5);
              if (typeof type9 === "object") {
                extend(address9, type9);
              }
              this._offset += text5.length;
            } else {
              address9 = null;
            }
            if (address9) {
              elements4.push(address9);
              text4 += address9.textValue;
            } else {
              elements4 = null;
              this._offset = index8;
            }
          } else {
            elements4 = null;
            this._offset = index8;
          }
          if (elements4) {
            this._offset = index8;
            var klass10 = this.constructor.SyntaxNode;
            var type10 = null;
            address7 = new klass10(text4, this._offset, elements4, labelled3);
            if (typeof type10 === "object") {
              extend(address7, type10);
            }
            this._offset += text4.length;
          } else {
            address7 = null;
          }
          if (address7) {
          } else {
            this._offset = index7;
            var klass11 = this.constructor.SyntaxNode;
            var type11 = null;
            address7 = new klass11("", this._offset, []);
            if (typeof type11 === "object") {
              extend(address7, type11);
            }
            this._offset += 0;
          }
          if (address7) {
            elements1.push(address7);
            text1 += address7.textValue;
            var address11 = null;
            var index10 = this._offset;
            var index11 = this._offset, elements6 = [], labelled4 = {}, text6 = "";
            var address12 = null;
            var index12 = this._offset;
            var slice12 = null;
            if (this._input.length > this._offset) {
              slice12 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice12 = null;
            }
            if (slice12 === "e") {
              var klass12 = this.constructor.SyntaxNode;
              var type12 = null;
              address12 = new klass12("e", this._offset, []);
              if (typeof type12 === "object") {
                extend(address12, type12);
              }
              this._offset += 1;
            } else {
              address12 = null;
              var slice13 = null;
              if (this._input.length > this._offset) {
                slice13 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice13 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"e\""};
              }
            }
            if (address12) {
            } else {
              this._offset = index12;
              var slice14 = null;
              if (this._input.length > this._offset) {
                slice14 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice14 = null;
              }
              if (slice14 === "E") {
                var klass13 = this.constructor.SyntaxNode;
                var type13 = null;
                address12 = new klass13("E", this._offset, []);
                if (typeof type13 === "object") {
                  extend(address12, type13);
                }
                this._offset += 1;
              } else {
                address12 = null;
                var slice15 = null;
                if (this._input.length > this._offset) {
                  slice15 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice15 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"E\""};
                }
              }
              if (address12) {
              } else {
                this._offset = index12;
              }
            }
            if (address12) {
              elements6.push(address12);
              text6 += address12.textValue;
              var address13 = null;
              var index13 = this._offset;
              var index14 = this._offset;
              var slice16 = null;
              if (this._input.length > this._offset) {
                slice16 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice16 = null;
              }
              if (slice16 === "+") {
                var klass14 = this.constructor.SyntaxNode;
                var type14 = null;
                address13 = new klass14("+", this._offset, []);
                if (typeof type14 === "object") {
                  extend(address13, type14);
                }
                this._offset += 1;
              } else {
                address13 = null;
                var slice17 = null;
                if (this._input.length > this._offset) {
                  slice17 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice17 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"+\""};
                }
              }
              if (address13) {
              } else {
                this._offset = index14;
                var slice18 = null;
                if (this._input.length > this._offset) {
                  slice18 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice18 = null;
                }
                if (slice18 === "-") {
                  var klass15 = this.constructor.SyntaxNode;
                  var type15 = null;
                  address13 = new klass15("-", this._offset, []);
                  if (typeof type15 === "object") {
                    extend(address13, type15);
                  }
                  this._offset += 1;
                } else {
                  address13 = null;
                  var slice19 = null;
                  if (this._input.length > this._offset) {
                    slice19 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice19 = null;
                  }
                  if (!this.error || this.error.offset <= this._offset) {
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"-\""};
                  }
                }
                if (address13) {
                } else {
                  this._offset = index14;
                }
              }
              if (address13) {
              } else {
                this._offset = index13;
                var klass16 = this.constructor.SyntaxNode;
                var type16 = null;
                address13 = new klass16("", this._offset, []);
                if (typeof type16 === "object") {
                  extend(address13, type16);
                }
                this._offset += 0;
              }
              if (address13) {
                elements6.push(address13);
                text6 += address13.textValue;
                var address14 = null;
                var remaining2 = 1, index15 = this._offset, elements7 = [], text7 = "", address15 = true;
                while (address15) {
                  var slice20 = null;
                  if (this._input.length > this._offset) {
                    slice20 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice20 = null;
                  }
                  if (slice20 && /^[0-9]/.test(slice20)) {
                    var klass17 = this.constructor.SyntaxNode;
                    var type17 = null;
                    address15 = new klass17(slice20, this._offset, []);
                    if (typeof type17 === "object") {
                      extend(address15, type17);
                    }
                    this._offset += 1;
                  } else {
                    address15 = null;
                    var slice21 = null;
                    if (this._input.length > this._offset) {
                      slice21 = this._input.substring(this._offset, this._offset + 1);
                    } else {
                      slice21 = null;
                    }
                    if (!this.error || this.error.offset <= this._offset) {
                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9]"};
                    }
                  }
                  if (address15) {
                    elements7.push(address15);
                    text7 += address15.textValue;
                    remaining2 -= 1;
                  }
                }
                if (remaining2 <= 0) {
                  this._offset = index15;
                  var klass18 = this.constructor.SyntaxNode;
                  var type18 = null;
                  address14 = new klass18(text7, this._offset, elements7);
                  if (typeof type18 === "object") {
                    extend(address14, type18);
                  }
                  this._offset += text7.length;
                } else {
                  address14 = null;
                }
                if (address14) {
                  elements6.push(address14);
                  text6 += address14.textValue;
                } else {
                  elements6 = null;
                  this._offset = index11;
                }
              } else {
                elements6 = null;
                this._offset = index11;
              }
            } else {
              elements6 = null;
              this._offset = index11;
            }
            if (elements6) {
              this._offset = index11;
              var klass19 = this.constructor.SyntaxNode;
              var type19 = null;
              address11 = new klass19(text6, this._offset, elements6, labelled4);
              if (typeof type19 === "object") {
                extend(address11, type19);
              }
              this._offset += text6.length;
            } else {
              address11 = null;
            }
            if (address11) {
            } else {
              this._offset = index10;
              var klass20 = this.constructor.SyntaxNode;
              var type20 = null;
              address11 = new klass20("", this._offset, []);
              if (typeof type20 === "object") {
                extend(address11, type20);
              }
              this._offset += 0;
            }
            if (address11) {
              elements1.push(address11);
              text1 += address11.textValue;
            } else {
              elements1 = null;
              this._offset = index3;
            }
          } else {
            elements1 = null;
            this._offset = index3;
          }
        } else {
          elements1 = null;
          this._offset = index3;
        }
        if (elements1) {
          this._offset = index3;
          var klass21 = this.constructor.SyntaxNode;
          var type21 = null;
          address2 = new klass21(text1, this._offset, elements1, labelled1);
          if (typeof type21 === "object") {
            extend(address2, type21);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass22 = this.constructor.SyntaxNode;
        var type22 = find(this.constructor, "NumberNode");
        address0 = new klass22(text0, this._offset, elements0, labelled0);
        if (typeof type22 === "object") {
          extend(address0, type22);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["number"][index0] = address0;
    },
    __consume__integer: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["integer"] = this._nodeCache["integer"] || {};
      var cached = this._nodeCache["integer"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var index2 = this._offset;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "-") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("-", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"-\""};
        }
      }
      if (address1) {
      } else {
        this._offset = index2;
        var klass1 = this.constructor.SyntaxNode;
        var type1 = null;
        address1 = new klass1("", this._offset, []);
        if (typeof type1 === "object") {
          extend(address1, type1);
        }
        this._offset += 0;
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        var index3 = this._offset;
        var slice2 = null;
        if (this._input.length > this._offset) {
          slice2 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice2 = null;
        }
        if (slice2 && /^[0]/.test(slice2)) {
          var klass2 = this.constructor.SyntaxNode;
          var type2 = null;
          address2 = new klass2(slice2, this._offset, []);
          if (typeof type2 === "object") {
            extend(address2, type2);
          }
          this._offset += 1;
        } else {
          address2 = null;
          var slice3 = null;
          if (this._input.length > this._offset) {
            slice3 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice3 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0]"};
          }
        }
        if (address2) {
        } else {
          this._offset = index3;
          var index4 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
          var address3 = null;
          var slice4 = null;
          if (this._input.length > this._offset) {
            slice4 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice4 = null;
          }
          if (slice4 && /^[1-9]/.test(slice4)) {
            var klass3 = this.constructor.SyntaxNode;
            var type3 = null;
            address3 = new klass3(slice4, this._offset, []);
            if (typeof type3 === "object") {
              extend(address3, type3);
            }
            this._offset += 1;
          } else {
            address3 = null;
            var slice5 = null;
            if (this._input.length > this._offset) {
              slice5 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice5 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[1-9]"};
            }
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            var address4 = null;
            var remaining0 = 0, index5 = this._offset, elements2 = [], text2 = "", address5 = true;
            while (address5) {
              var slice6 = null;
              if (this._input.length > this._offset) {
                slice6 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice6 = null;
              }
              if (slice6 && /^[0-9]/.test(slice6)) {
                var klass4 = this.constructor.SyntaxNode;
                var type4 = null;
                address5 = new klass4(slice6, this._offset, []);
                if (typeof type4 === "object") {
                  extend(address5, type4);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice7 = null;
                if (this._input.length > this._offset) {
                  slice7 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice7 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9]"};
                }
              }
              if (address5) {
                elements2.push(address5);
                text2 += address5.textValue;
                remaining0 -= 1;
              }
            }
            if (remaining0 <= 0) {
              this._offset = index5;
              var klass5 = this.constructor.SyntaxNode;
              var type5 = null;
              address4 = new klass5(text2, this._offset, elements2);
              if (typeof type5 === "object") {
                extend(address4, type5);
              }
              this._offset += text2.length;
            } else {
              address4 = null;
            }
            if (address4) {
              elements1.push(address4);
              text1 += address4.textValue;
            } else {
              elements1 = null;
              this._offset = index4;
            }
          } else {
            elements1 = null;
            this._offset = index4;
          }
          if (elements1) {
            this._offset = index4;
            var klass6 = this.constructor.SyntaxNode;
            var type6 = null;
            address2 = new klass6(text1, this._offset, elements1, labelled1);
            if (typeof type6 === "object") {
              extend(address2, type6);
            }
            this._offset += text1.length;
          } else {
            address2 = null;
          }
          if (address2) {
          } else {
            this._offset = index3;
          }
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass7 = this.constructor.SyntaxNode;
        var type7 = null;
        address0 = new klass7(text0, this._offset, elements0, labelled0);
        if (typeof type7 === "object") {
          extend(address0, type7);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["integer"][index0] = address0;
    },
    __consume__proto: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["proto"] = this._nodeCache["proto"] || {};
      var cached = this._nodeCache["proto"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume__ident();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.ident = address1;
        var address2 = null;
        var index2 = this._offset;
        var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
        var address3 = null;
        var slice0 = null;
        if (this._input.length > this._offset) {
          slice0 = this._input.substring(this._offset, this._offset + 2);
        } else {
          slice0 = null;
        }
        if (slice0 === "::") {
          var klass0 = this.constructor.SyntaxNode;
          var type0 = null;
          address3 = new klass0("::", this._offset, []);
          if (typeof type0 === "object") {
            extend(address3, type0);
          }
          this._offset += 2;
        } else {
          address3 = null;
          var slice1 = null;
          if (this._input.length > this._offset) {
            slice1 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice1 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"::\""};
          }
        }
        if (address3) {
          elements1.push(address3);
          text1 += address3.textValue;
          var address4 = null;
          address4 = this.__consume__ident_p();
          if (address4) {
            elements1.push(address4);
            text1 += address4.textValue;
            labelled1.ident_p = address4;
          } else {
            elements1 = null;
            this._offset = index3;
          }
        } else {
          elements1 = null;
          this._offset = index3;
        }
        if (elements1) {
          this._offset = index3;
          var klass1 = this.constructor.SyntaxNode;
          var type1 = null;
          address2 = new klass1(text1, this._offset, elements1, labelled1);
          if (typeof type1 === "object") {
            extend(address2, type1);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
        } else {
          this._offset = index2;
          var klass2 = this.constructor.SyntaxNode;
          var type2 = null;
          address2 = new klass2("", this._offset, []);
          if (typeof type2 === "object") {
            extend(address2, type2);
          }
          this._offset += 0;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass3 = this.constructor.SyntaxNode;
        var type3 = find(this.constructor, "PrototypeExpander");
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["proto"][index0] = address0;
    },
    __consume__ident: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["ident"] = this._nodeCache["ident"] || {};
      var cached = this._nodeCache["ident"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume__ident_p();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.ident_p = address1;
        var address2 = null;
        var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address3 = true;
        while (address3) {
          var index3 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
          var address4 = null;
          var slice0 = null;
          if (this._input.length > this._offset) {
            slice0 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice0 = null;
          }
          if (slice0 === ".") {
            var klass0 = this.constructor.SyntaxNode;
            var type0 = null;
            address4 = new klass0(".", this._offset, []);
            if (typeof type0 === "object") {
              extend(address4, type0);
            }
            this._offset += 1;
          } else {
            address4 = null;
            var slice1 = null;
            if (this._input.length > this._offset) {
              slice1 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice1 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\".\""};
            }
          }
          if (address4) {
            elements2.push(address4);
            text2 += address4.textValue;
            var address5 = null;
            address5 = this.__consume__ident_p();
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
              labelled1.ident_p = address5;
            } else {
              elements2 = null;
              this._offset = index3;
            }
          } else {
            elements2 = null;
            this._offset = index3;
          }
          if (elements2) {
            this._offset = index3;
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1(text2, this._offset, elements2, labelled1);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += text2.length;
          } else {
            address3 = null;
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            remaining0 -= 1;
          }
        }
        if (remaining0 <= 0) {
          this._offset = index2;
          var klass2 = this.constructor.SyntaxNode;
          var type2 = null;
          address2 = new klass2(text1, this._offset, elements1);
          if (typeof type2 === "object") {
            extend(address2, type2);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass3 = this.constructor.SyntaxNode;
        var type3 = find(this.constructor, "Identifier");
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["ident"][index0] = address0;
    },
    __consume__ident_p: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["ident_p"] = this._nodeCache["ident_p"] || {};
      var cached = this._nodeCache["ident_p"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 && /^[$_a-zA-Z]/.test(slice0)) {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0(slice0, this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 1;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[$_a-zA-Z]"};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address3 = true;
        while (address3) {
          var slice2 = null;
          if (this._input.length > this._offset) {
            slice2 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice2 = null;
          }
          if (slice2 && /^[$_a-zA-Z0-9]/.test(slice2)) {
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1(slice2, this._offset, []);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += 1;
          } else {
            address3 = null;
            var slice3 = null;
            if (this._input.length > this._offset) {
              slice3 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice3 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[$_a-zA-Z0-9]"};
            }
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            remaining0 -= 1;
          }
        }
        if (remaining0 <= 0) {
          this._offset = index2;
          var klass2 = this.constructor.SyntaxNode;
          var type2 = null;
          address2 = new klass2(text1, this._offset, elements1);
          if (typeof type2 === "object") {
            extend(address2, type2);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass3 = this.constructor.SyntaxNode;
        var type3 = null;
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["ident_p"][index0] = address0;
    },
    __consume__obj_name: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["obj_name"] = this._nodeCache["obj_name"] || {};
      var cached = this._nodeCache["obj_name"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      var index2 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 8);
      } else {
        slice0 = null;
      }
      if (slice0 === "operator") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("operator", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 8;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"operator\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        var remaining0 = 0, index3 = this._offset, elements1 = [], text1 = "", address3 = true;
        while (address3) {
          var slice2 = null;
          if (this._input.length > this._offset) {
            slice2 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice2 = null;
          }
          if (slice2 && /^[^:]/.test(slice2)) {
            var klass1 = this.constructor.SyntaxNode;
            var type1 = null;
            address3 = new klass1(slice2, this._offset, []);
            if (typeof type1 === "object") {
              extend(address3, type1);
            }
            this._offset += 1;
          } else {
            address3 = null;
            var slice3 = null;
            if (this._input.length > this._offset) {
              slice3 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice3 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[^:]"};
            }
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            remaining0 -= 1;
          }
        }
        if (remaining0 <= 0) {
          this._offset = index3;
          var klass2 = this.constructor.SyntaxNode;
          var type2 = null;
          address2 = new klass2(text1, this._offset, elements1);
          if (typeof type2 === "object") {
            extend(address2, type2);
          }
          this._offset += text1.length;
        } else {
          address2 = null;
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
        } else {
          elements0 = null;
          this._offset = index2;
        }
      } else {
        elements0 = null;
        this._offset = index2;
      }
      if (elements0) {
        this._offset = index2;
        var klass3 = this.constructor.SyntaxNode;
        var type3 = null;
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      if (address0) {
      } else {
        this._offset = index1;
        address0 = this.__consume__ident_p();
        if (address0) {
        } else {
          this._offset = index1;
        }
      }
      return this._nodeCache["obj_name"][index0] = address0;
    },
    __consume__special: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["special"] = this._nodeCache["special"] || {};
      var cached = this._nodeCache["special"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 4);
      } else {
        slice0 = null;
      }
      if (slice0 === "true") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address0 = new klass0("true", this._offset, []);
        if (typeof type0 === "object") {
          extend(address0, type0);
        }
        this._offset += 4;
      } else {
        address0 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"true\""};
        }
      }
      if (address0) {
        var type1 = find(this.constructor, "SpecialNode");
        if (typeof type1 === "object") {
          extend(address0, type1);
        }
      } else {
        this._offset = index1;
        var slice2 = null;
        if (this._input.length > this._offset) {
          slice2 = this._input.substring(this._offset, this._offset + 5);
        } else {
          slice2 = null;
        }
        if (slice2 === "false") {
          var klass1 = this.constructor.SyntaxNode;
          var type2 = null;
          address0 = new klass1("false", this._offset, []);
          if (typeof type2 === "object") {
            extend(address0, type2);
          }
          this._offset += 5;
        } else {
          address0 = null;
          var slice3 = null;
          if (this._input.length > this._offset) {
            slice3 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice3 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"false\""};
          }
        }
        if (address0) {
          var type3 = find(this.constructor, "SpecialNode");
          if (typeof type3 === "object") {
            extend(address0, type3);
          }
        } else {
          this._offset = index1;
          var slice4 = null;
          if (this._input.length > this._offset) {
            slice4 = this._input.substring(this._offset, this._offset + 4);
          } else {
            slice4 = null;
          }
          if (slice4 === "null") {
            var klass2 = this.constructor.SyntaxNode;
            var type4 = null;
            address0 = new klass2("null", this._offset, []);
            if (typeof type4 === "object") {
              extend(address0, type4);
            }
            this._offset += 4;
          } else {
            address0 = null;
            var slice5 = null;
            if (this._input.length > this._offset) {
              slice5 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice5 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"null\""};
            }
          }
          if (address0) {
            var type5 = find(this.constructor, "SpecialNode");
            if (typeof type5 === "object") {
              extend(address0, type5);
            }
          } else {
            this._offset = index1;
          }
        }
      }
      return this._nodeCache["special"][index0] = address0;
    },
    __consume__hex: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["hex"] = this._nodeCache["hex"] || {};
      var cached = this._nodeCache["hex"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 2);
      } else {
        slice0 = null;
      }
      if (slice0 === "\\u") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("\\u", this._offset, []);
        if (typeof type0 === "object") {
          extend(address1, type0);
        }
        this._offset += 2;
      } else {
        address1 = null;
        var slice1 = null;
        if (this._input.length > this._offset) {
          slice1 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice1 = null;
        }
        if (!this.error || this.error.offset <= this._offset) {
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"\\\\u\""};
        }
      }
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        var address2 = null;
        var slice2 = null;
        if (this._input.length > this._offset) {
          slice2 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice2 = null;
        }
        if (slice2 && /^[0-9a-fA-F]/.test(slice2)) {
          var klass1 = this.constructor.SyntaxNode;
          var type1 = null;
          address2 = new klass1(slice2, this._offset, []);
          if (typeof type1 === "object") {
            extend(address2, type1);
          }
          this._offset += 1;
        } else {
          address2 = null;
          var slice3 = null;
          if (this._input.length > this._offset) {
            slice3 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice3 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9a-fA-F]"};
          }
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          var address3 = null;
          var slice4 = null;
          if (this._input.length > this._offset) {
            slice4 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice4 = null;
          }
          if (slice4 && /^[0-9a-fA-F]/.test(slice4)) {
            var klass2 = this.constructor.SyntaxNode;
            var type2 = null;
            address3 = new klass2(slice4, this._offset, []);
            if (typeof type2 === "object") {
              extend(address3, type2);
            }
            this._offset += 1;
          } else {
            address3 = null;
            var slice5 = null;
            if (this._input.length > this._offset) {
              slice5 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice5 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9a-fA-F]"};
            }
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
            var address4 = null;
            var slice6 = null;
            if (this._input.length > this._offset) {
              slice6 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice6 = null;
            }
            if (slice6 && /^[0-9a-fA-F]/.test(slice6)) {
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address4 = new klass3(slice6, this._offset, []);
              if (typeof type3 === "object") {
                extend(address4, type3);
              }
              this._offset += 1;
            } else {
              address4 = null;
              var slice7 = null;
              if (this._input.length > this._offset) {
                slice7 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice7 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9a-fA-F]"};
              }
            }
            if (address4) {
              elements0.push(address4);
              text0 += address4.textValue;
              var address5 = null;
              var slice8 = null;
              if (this._input.length > this._offset) {
                slice8 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice8 = null;
              }
              if (slice8 && /^[0-9a-fA-F]/.test(slice8)) {
                var klass4 = this.constructor.SyntaxNode;
                var type4 = null;
                address5 = new klass4(slice8, this._offset, []);
                if (typeof type4 === "object") {
                  extend(address5, type4);
                }
                this._offset += 1;
              } else {
                address5 = null;
                var slice9 = null;
                if (this._input.length > this._offset) {
                  slice9 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice9 = null;
                }
                if (!this.error || this.error.offset <= this._offset) {
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9a-fA-F]"};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
              } else {
                elements0 = null;
                this._offset = index1;
              }
            } else {
              elements0 = null;
              this._offset = index1;
            }
          } else {
            elements0 = null;
            this._offset = index1;
          }
        } else {
          elements0 = null;
          this._offset = index1;
        }
      } else {
        elements0 = null;
        this._offset = index1;
      }
      if (elements0) {
        this._offset = index1;
        var klass5 = this.constructor.SyntaxNode;
        var type5 = null;
        address0 = new klass5(text0, this._offset, elements0, labelled0);
        if (typeof type5 === "object") {
          extend(address0, type5);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["hex"][index0] = address0;
    },
    __consume___: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["_"] = this._nodeCache["_"] || {};
      var cached = this._nodeCache["_"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var remaining0 = 0, index1 = this._offset, elements0 = [], text0 = "", address1 = true;
      while (address1) {
        var index2 = this._offset;
        var index3 = this._offset, elements1 = [], labelled0 = {}, text1 = "";
        var address2 = null;
        var slice0 = null;
        if (this._input.length > this._offset) {
          slice0 = this._input.substring(this._offset, this._offset + 2);
        } else {
          slice0 = null;
        }
        if (slice0 === "//") {
          var klass0 = this.constructor.SyntaxNode;
          var type0 = null;
          address2 = new klass0("//", this._offset, []);
          if (typeof type0 === "object") {
            extend(address2, type0);
          }
          this._offset += 2;
        } else {
          address2 = null;
          var slice1 = null;
          if (this._input.length > this._offset) {
            slice1 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice1 = null;
          }
          if (!this.error || this.error.offset <= this._offset) {
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"//\""};
          }
        }
        if (address2) {
          elements1.push(address2);
          text1 += address2.textValue;
          var address3 = null;
          var remaining1 = 0, index4 = this._offset, elements2 = [], text2 = "", address4 = true;
          while (address4) {
            var slice2 = null;
            if (this._input.length > this._offset) {
              slice2 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice2 = null;
            }
            if (slice2 && /^[^\n]/.test(slice2)) {
              var klass1 = this.constructor.SyntaxNode;
              var type1 = null;
              address4 = new klass1(slice2, this._offset, []);
              if (typeof type1 === "object") {
                extend(address4, type1);
              }
              this._offset += 1;
            } else {
              address4 = null;
              var slice3 = null;
              if (this._input.length > this._offset) {
                slice3 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice3 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[^\\n]"};
              }
            }
            if (address4) {
              elements2.push(address4);
              text2 += address4.textValue;
              remaining1 -= 1;
            }
          }
          if (remaining1 <= 0) {
            this._offset = index4;
            var klass2 = this.constructor.SyntaxNode;
            var type2 = null;
            address3 = new klass2(text2, this._offset, elements2);
            if (typeof type2 === "object") {
              extend(address3, type2);
            }
            this._offset += text2.length;
          } else {
            address3 = null;
          }
          if (address3) {
            elements1.push(address3);
            text1 += address3.textValue;
            var address5 = null;
            var slice4 = null;
            if (this._input.length > this._offset) {
              slice4 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice4 = null;
            }
            if (slice4 && /^[\n]/.test(slice4)) {
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address5 = new klass3(slice4, this._offset, []);
              if (typeof type3 === "object") {
                extend(address5, type3);
              }
              this._offset += 1;
            } else {
              address5 = null;
              var slice5 = null;
              if (this._input.length > this._offset) {
                slice5 = this._input.substring(this._offset, this._offset + 1);
              } else {
                slice5 = null;
              }
              if (!this.error || this.error.offset <= this._offset) {
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[\\n]"};
              }
            }
            if (address5) {
              elements1.push(address5);
              text1 += address5.textValue;
            } else {
              elements1 = null;
              this._offset = index3;
            }
          } else {
            elements1 = null;
            this._offset = index3;
          }
        } else {
          elements1 = null;
          this._offset = index3;
        }
        if (elements1) {
          this._offset = index3;
          var klass4 = this.constructor.SyntaxNode;
          var type4 = null;
          address1 = new klass4(text1, this._offset, elements1, labelled0);
          if (typeof type4 === "object") {
            extend(address1, type4);
          }
          this._offset += text1.length;
        } else {
          address1 = null;
        }
        if (address1) {
        } else {
          this._offset = index2;
          var slice6 = null;
          if (this._input.length > this._offset) {
            slice6 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice6 = null;
          }
          if (slice6 && /^[ \n\t]/.test(slice6)) {
            var klass5 = this.constructor.SyntaxNode;
            var type5 = null;
            address1 = new klass5(slice6, this._offset, []);
            if (typeof type5 === "object") {
              extend(address1, type5);
            }
            this._offset += 1;
          } else {
            address1 = null;
            var slice7 = null;
            if (this._input.length > this._offset) {
              slice7 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice7 = null;
            }
            if (!this.error || this.error.offset <= this._offset) {
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[ \\n\\t]"};
            }
          }
          if (address1) {
          } else {
            this._offset = index2;
          }
        }
        if (address1) {
          elements0.push(address1);
          text0 += address1.textValue;
          remaining0 -= 1;
        }
      }
      if (remaining0 <= 0) {
        this._offset = index1;
        var klass6 = this.constructor.SyntaxNode;
        var type6 = null;
        address0 = new klass6(text0, this._offset, elements0);
        if (typeof type6 === "object") {
          extend(address0, type6);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["_"][index0] = address0;
    }
  };
  
  var Parser = function(input) {
    this._input = input;
    this._offset = 0;
    this._nodeCache = {};
  };
  
  Parser.prototype.parse = function() {
    var result = this.__consume__root();
    if (result && this._offset === this._input.length) {
      return result;
    }
    if (!(this.error)) {
      this.error = {input: this._input, offset: this._offset, expected: "<EOF>"};
    }
    var message = formatError(this.error);
    var error = new Error(message);
    throw error;
  };
  
  Parser.parse = function(input) {
    var parser = new Parser(input);
    return parser.parse();
  };
  
  extend(Parser.prototype, Grammar);
  
  var SyntaxNode = function(textValue, offset, elements, properties) {
    this.textValue = textValue;
    this.offset    = offset;
    this.elements  = elements || [];
    if (!properties) return;
    for (var key in properties) this[key] = properties[key];
  };
  
  SyntaxNode.prototype.forEach = function(block, context) {
    for (var i = 0, n = this.elements.length; i < n; i++) {
      block.call(context, this.elements[i], i);
    }
  };
  
  Parser.SyntaxNode = SyntaxNode;
  
  if (typeof require === "function" && typeof exports === "object") {
    exports.Grammar = Grammar;
    exports.Parser  = Parser;
    exports.parse   = Parser.parse;
    
  } else {
    var namespace = this;
    ham = Grammar;
    hamParser = Parser;
    hamParser.formatError = formatError;
  }
})();


});

require.define("/node_modules/underscore/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"underscore.js"}
});

require.define("/node_modules/underscore/underscore.js",function(require,module,exports,__dirname,__filename,process,global){//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

});

require.define("/src/runtime.js",function(require,module,exports,__dirname,__filename,process,global){module.exports.patch = function() {
  var _ = require('underscore');

  Object.prototype.extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ 
        if(parent.apply)
          return parent.apply(this, arguments); 
      };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  Object.prototype['__op+'] = function(x) { return this + x; }
  Object.prototype['__op*'] = function(x) { return this * x; }
  Object.prototype['__op-'] = function(x) { return this - x; }


  Number.prototype.times = function(fn) {
    for(var i = 0; i < this; i++) fn();
  };

  Array.prototype.step = function(step) {
    var ret = [];
    for(var i = 0; i < this.length; i += Math.abs(step)) {
      var next = this[i];
      if(step < 0) {
        next = this[this.length-1-i];
      }
      ret.push(next);
    }
    return ret;
  };

  Array.prototype.each = function(it) {
    for(var i = 0; i < this.length; i++) {
      it(this[i]);
    }
  };

  Array.prototype.map = function(m) {
    var ret = [];
    this.each(function(it) { ret.push(m(it)); });
    return ret;
  };

  Array.prototype.filter = function(f) {
    var ret = [];
    this.each(function(it) { if(f(it)) ret.push(it); });
    return ret;
  };

  Array.prototype.reduce = function(it, memo, context) {
    if(memo === undefined && typeof this[0] === 'number')
      memo = Number(0);

    return _.reduce(this, it, memo, context);
  };
};

});

require.define("/src/compiler/node.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
  var _ = require('underscore');

  Object.prototype.extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ 
        if(parent.apply)
          return parent.apply(this, arguments); 
      };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  Object.prototype['__op+'] = function(x) { return this + x; }
  Object.prototype['__op*'] = function(x) { return this * x; }
  Object.prototype['__op-'] = function(x) { return this - x; }


  Number.prototype.times = function(fn) {
    for(var i = 0; i < this; i++) fn();
  };

  Array.prototype.step = function(step) {
    var ret = [];
    for(var i = 0; i < this.length; i += Math.abs(step)) {
      var next = this[i];
      if(step < 0) {
        next = this[this.length-1-i];
      }
      ret.push(next);
    }
    return ret;
  };

  Array.prototype.each = function(it) {
    for(var i = 0; i < this.length; i++) {
      it(this[i]);
    }
  };

  Array.prototype.map = function(m) {
    var ret = [];
    this.each(function(it) { ret.push(m(it)); });
    return ret;
  };

  Array.prototype.filter = function(f) {
    var ret = [];
    this.each(function(it) { if(f(it)) ret.push(it); });
    return ret;
  };

  Array.prototype.reduce = function(it, memo, context) {
    if(memo === undefined && typeof this[0] === 'number')
      memo = Number(0);

    return _.reduce(this, it, memo, context);
  };
})(); (function() {var _ = require('underscore');var sourceMap = require('source-map');var template_cache = {};var Node = Object.extend({serialize: function() {return {};}, walk:function(state) {var parsed = state.source.substr(Number(0),this.offset);var match = parsed.match(new RegExp("\n","g"));if(match){this.line=match.length["__op+"] (Number(1));} else {this.line=Number(1);}this.column=(this.offset["__op-"] (Number(1))["__op-"] (parsed.lastIndexOf('\n'))||Number(0));this.source=new sourceMap.SourceNode(this.line,this.column,state.filename);return this.serialize(state)||this.source;}});module.exports={extend: function(o) {return _.defaults(o,Node.prototype);}};})();
});

require.define("/node_modules/source-map/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"./lib/source-map.js"}
});

require.define("/node_modules/source-map/lib/source-map.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./source-map/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./source-map/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./source-map/source-node').SourceNode;

});

require.define("/node_modules/source-map/lib/source-map/source-map-generator.js",function(require,module,exports,__dirname,__filename,process,global){/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = require('./base64-vlq');
var util = require('./util');
var ArraySet = require('./array-set').ArraySet;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. To create a new one, you must pass an object
 * with the following properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: An optional root for all URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  this._file = util.getArg(aArgs, 'file');
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = [];
}

SourceMapGenerator.prototype._version = 3;

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    this._validateMapping(generated, original, source, name);

    if (source && !this._sources.has(source)) {
      this._sources.add(source);
    }

    if (name && !this._names.has(name)) {
      this._names.add(name);
    }

    this._mappings.push({
      generated: generated,
      original: original,
      source: source,
      name: name
    });
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping.');
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var mapping;

    // The mappings must be guarenteed to be in sorted order before we start
    // serializing them or else the generated line numbers (which are defined
    // via the ';' separators) will be all messed up. Note: it might be more
    // performant to maintain the sorting as we insert them, rather than as we
    // serialize them, but the big O is the same either way.
    this._mappings.sort(function (mappingA, mappingB) {
      var cmp = mappingA.generated.line - mappingB.generated.line;
      return cmp === 0
        ? mappingA.generated.column - mappingB.generated.column
        : cmp;
    });

    for (var i = 0, len = this._mappings.length; i < len; i++) {
      mapping = this._mappings[i];

      if (mapping.generated.line !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generated.line !== previousGeneratedLine) {
          result += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          result += ',';
        }
      }

      result += base64VLQ.encode(mapping.generated.column
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generated.column;

      if (mapping.source && mapping.original) {
        result += base64VLQ.encode(this._sources.indexOf(mapping.source)
                                   - previousSource);
        previousSource = this._sources.indexOf(mapping.source);

        // lines are stored 0-based in SourceMap spec version 3
        result += base64VLQ.encode(mapping.original.line - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.original.line - 1;

        result += base64VLQ.encode(mapping.original.column
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.original.column;

        if (mapping.name) {
          result += base64VLQ.encode(this._names.indexOf(mapping.name)
                                     - previousName);
          previousName = this._names.indexOf(mapping.name);
        }
      }
    }

    return result;
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      file: this._file,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._sourceRoot) {
      map.sourceRoot = this._sourceRoot;
    }
    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this);
  };

exports.SourceMapGenerator = SourceMapGenerator;


});

require.define("/node_modules/source-map/lib/source-map/base64-vlq.js",function(require,module,exports,__dirname,__filename,process,global){/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = require('./base64');

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * is placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * is placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string.
 */
exports.decode = function base64VLQ_decode(aStr) {
  var i = 0;
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (i >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }
    digit = base64.decode(aStr.charAt(i++));
    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  return {
    value: fromVLQSigned(result),
    rest: aStr.slice(i)
  };
};


});

require.define("/node_modules/source-map/lib/source-map/base64.js",function(require,module,exports,__dirname,__filename,process,global){/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var charToIntMap = {};
var intToCharMap = {};

'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  .split('')
  .forEach(function (ch, index) {
    charToIntMap[ch] = index;
    intToCharMap[index] = ch;
  });

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function base64_encode(aNumber) {
  if (aNumber in intToCharMap) {
    return intToCharMap[aNumber];
  }
  throw new TypeError("Must be between 0 and 63: " + aNumber);
};

/**
 * Decode a single base 64 digit to an integer.
 */
exports.decode = function base64_decode(aChar) {
  if (aChar in charToIntMap) {
    return charToIntMap[aChar];
  }
  throw new TypeError("Not a valid base 64 digit: " + aChar);
};

});

require.define("/node_modules/source-map/lib/source-map/util.js",function(require,module,exports,__dirname,__filename,process,global){/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

function join(aRoot, aPath) {
  return aPath.charAt(0) === '/'
    ? aPath
    : aRoot.replace(/\/*$/, '') + '/' + aPath;
}
exports.join = join;

});

require.define("/node_modules/source-map/lib/source-map/array-set.js",function(require,module,exports,__dirname,__filename,process,global){/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = {};
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i]);
  }
  return set;
};

/**
 * Because behavior goes wacky when you set `__proto__` on `this._set`, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
ArraySet.prototype._toSetString = function ArraySet__toSetString (aStr) {
  return "$" + aStr;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr) {
  if (this.has(aStr)) {
    // Already a member; nothing to do.
    return;
  }
  var idx = this._array.length;
  this._array.push(aStr);
  this._set[this._toSetString(aStr)] = idx;
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  return Object.prototype.hasOwnProperty.call(this._set,
                                              this._toSetString(aStr));
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (this.has(aStr)) {
    return this._set[this._toSetString(aStr)];
  }
  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

exports.ArraySet = ArraySet;


});

require.define("/node_modules/source-map/lib/source-map/source-map-consumer.js",function(require,module,exports,__dirname,__filename,process,global){/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var binarySearch = require('./binary-search');
var ArraySet = require('./array-set').ArraySet;
var base64VLQ = require('./base64-vlq');

/**
 * A SourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The only parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function SourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  var names = util.getArg(sourceMap, 'names');
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file');

  if (version !== this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._names = ArraySet.fromArray(names);
  this._sources = ArraySet.fromArray(sources);
  this._sourceRoot = sourceRoot;
  this.file = file;

  // `this._generatedMappings` and `this._originalMappings` hold the parsed
  // mapping coordinates from the source map's "mappings" attribute. Each
  // object in the array is of the form
  //
  //     {
  //       generatedLine: The line number in the generated code,
  //       generatedColumn: The column number in the generated code,
  //       source: The path to the original source file that generated this
  //               chunk of code,
  //       originalLine: The line number in the original source that
  //                     corresponds to this chunk of generated code,
  //       originalColumn: The column number in the original source that
  //                       corresponds to this chunk of generated code,
  //       name: The name of the original symbol which generated this chunk of
  //             code.
  //     }
  //
  // All properties except for `generatedLine` and `generatedColumn` can be
  // `null`.
  //
  // `this._generatedMappings` is ordered by the generated positions.
  //
  // `this._originalMappings` is ordered by the original positions.
  this._generatedMappings = [];
  this._originalMappings = [];
  this._parseMappings(mappings, sourceRoot);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._sources.toArray().map(function (s) {
      return this._sourceRoot ? util.join(this._sourceRoot, s) : s;
    }, this);
  }
});

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (an ordered list in this._generatedMappings).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var mappingSeparator = /^[,;]/;
    var str = aStr;
    var mapping;
    var temp;

    while (str.length > 0) {
      if (str.charAt(0) === ';') {
        generatedLine++;
        str = str.slice(1);
        previousGeneratedColumn = 0;
      }
      else if (str.charAt(0) === ',') {
        str = str.slice(1);
      }
      else {
        mapping = {};
        mapping.generatedLine = generatedLine;

        // Generated column.
        temp = base64VLQ.decode(str);
        mapping.generatedColumn = previousGeneratedColumn + temp.value;
        previousGeneratedColumn = mapping.generatedColumn;
        str = temp.rest;

        if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
          // Original source.
          temp = base64VLQ.decode(str);
          if (aSourceRoot) {
            mapping.source = util.join(aSourceRoot, this._sources.at(previousSource + temp.value));
          }
          else {
            mapping.source = this._sources.at(previousSource + temp.value);
          }
          previousSource += temp.value;
          str = temp.rest;
          if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
            throw new Error('Found a source, but no line and column');
          }

          // Original line.
          temp = base64VLQ.decode(str);
          mapping.originalLine = previousOriginalLine + temp.value;
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;
          str = temp.rest;
          if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
            throw new Error('Found a source and line, but no column');
          }

          // Original column.
          temp = base64VLQ.decode(str);
          mapping.originalColumn = previousOriginalColumn + temp.value;
          previousOriginalColumn = mapping.originalColumn;
          str = temp.rest;

          if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
            // Original name.
            temp = base64VLQ.decode(str);
            mapping.name = this._names.at(previousName + temp.value);
            previousName += temp.value;
            str = temp.rest;
          }
        }

        this._generatedMappings.push(mapping);
        this._originalMappings.push(mapping);
      }
    }

    this._originalMappings.sort(this._compareOriginalPositions);
  };

/**
 * Comparator between two mappings where the original positions are compared.
 */
SourceMapConsumer.prototype._compareOriginalPositions =
  function SourceMapConsumer_compareOriginalPositions(mappingA, mappingB) {
    if (mappingA.source > mappingB.source) {
      return 1;
    }
    else if (mappingA.source < mappingB.source) {
      return -1;
    }
    else {
      var cmp = mappingA.originalLine - mappingB.originalLine;
      return cmp === 0
        ? mappingA.originalColumn - mappingB.originalColumn
        : cmp;
    }
  };

/**
 * Comparator between two mappings where the generated positions are compared.
 */
SourceMapConsumer.prototype._compareGeneratedPositions =
  function SourceMapConsumer_compareGeneratedPositions(mappingA, mappingB) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    return cmp === 0
      ? mappingA.generatedColumn - mappingB.generatedColumn
      : cmp;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
SourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator);
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
SourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var mapping = this._findMapping(needle,
                                    this._generatedMappings,
                                    "generatedLine",
                                    "generatedColumn",
                                    this._compareGeneratedPositions)

    if (mapping) {
      return {
        source: util.getArg(mapping, 'source', null),
        line: util.getArg(mapping, 'originalLine', null),
        column: util.getArg(mapping, 'originalColumn', null),
        name: util.getArg(mapping, 'name', null)
      };
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
SourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var mapping = this._findMapping(needle,
                                    this._originalMappings,
                                    "originalLine",
                                    "originalColumn",
                                    this._compareOriginalPositions)

    if (mapping) {
      return {
        line: util.getArg(mapping, 'generatedLine', null),
        column: util.getArg(mapping, 'generatedColumn', null)
      };
    }

    return {
      line: null,
      column: null
    };
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping. This function should
 *        not mutate the mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    mappings.forEach(aCallback, context);
  };

exports.SourceMapConsumer = SourceMapConsumer;

});

require.define("/node_modules/source-map/lib/source-map/binary-search.js",function(require,module,exports,__dirname,__filename,process,global){/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the next
  //      closest element that is less than that element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element which is less than the one we are searching for, so we
  //      return null.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid]);
  if (cmp === 0) {
    // Found the element we are looking for.
    return aHaystack[mid];
  }
  else if (cmp > 0) {
    // aHaystack[mid] is greater than our needle.
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
    }
    // We did not find an exact match, return the next closest one
    // (termination case 2).
    return aHaystack[mid];
  }
  else {
    // aHaystack[mid] is less than our needle.
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
    }
    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (2) or (3) and return the appropriate thing.
    return aLow < 0
      ? null
      : aHaystack[aLow];
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the next lowest value checked if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 */
exports.search = function search(aNeedle, aHaystack, aCompare) {
  return aHaystack.length > 0
    ? recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
    : null;
};


});

require.define("/node_modules/source-map/lib/source-map/source-node.js",function(require,module,exports,__dirname,__filename,process,global){/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 */
function SourceNode(aLine, aColumn, aSource, aChunks) {
  this.children = [];
  this.line = aLine;
  this.column = aColumn;
  this.source = aSource;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  this.children.forEach(function (chunk) {
    if (chunk instanceof SourceNode) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source, line: this.line, column: this.column });
      }
    }
  }, this);
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild instanceof SourceNode) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source != null
        && original.line != null
        && original.column != null) {
      map.addMapping({
        source: original.source,
        original: {
          line: original.line,
          column: original.column
        },
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
    }
    chunk.split('').forEach(function (char) {
      if (char === '\n') {
        generated.line++;
        generated.column = 0;
      } else {
        generated.column++;
      }
    });
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;

});

require.define("/src/compiler/array.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
  var _ = require('underscore');

  Object.prototype.extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ 
        if(parent.apply)
          return parent.apply(this, arguments); 
      };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  Object.prototype['__op+'] = function(x) { return this + x; }
  Object.prototype['__op*'] = function(x) { return this * x; }
  Object.prototype['__op-'] = function(x) { return this - x; }


  Number.prototype.times = function(fn) {
    for(var i = 0; i < this; i++) fn();
  };

  Array.prototype.step = function(step) {
    var ret = [];
    for(var i = 0; i < this.length; i += Math.abs(step)) {
      var next = this[i];
      if(step < 0) {
        next = this[this.length-1-i];
      }
      ret.push(next);
    }
    return ret;
  };

  Array.prototype.each = function(it) {
    for(var i = 0; i < this.length; i++) {
      it(this[i]);
    }
  };

  Array.prototype.map = function(m) {
    var ret = [];
    this.each(function(it) { ret.push(m(it)); });
    return ret;
  };

  Array.prototype.filter = function(f) {
    var ret = [];
    this.each(function(it) { if(f(it)) ret.push(it); });
    return ret;
  };

  Array.prototype.reduce = function(it, memo, context) {
    if(memo === undefined && typeof this[0] === 'number')
      memo = Number(0);

    return _.reduce(this, it, memo, context);
  };
})(); (function() {var _ = require('underscore');var ASTNode = require('./node');var ArrayAccess = ASTNode.extend({serialize: function(state) {this.source.add(['[', this.elements[Number(2)].walk(state), ']']);}});var ArraySlice = ASTNode.extend({serialize: function(state) {var start = this.elements[Number(2)].start.textValue;var end = this.elements[Number(2)].end.textValue;var step = this.elements[Number(2)].step.integer;if(start!==''||end!==''){if(start===''){start=Number(0);}this.source.add('.slice('["__op+"] (start));if(end!==''){this.source.add(', '["__op+"] (end));}this.source.add(')');}if(step){this.source.add('.step('["__op+"] (step.textValue)["__op+"] (')'));}}});var ArrayRange = ASTNode.extend({serialize: function(state) {this.source.add(['(function() {', 'var acc = [];']);if(Number(this.end.textValue)>Number(this.start.textValue)){this.source.add(['for(var i = ', this.start.textValue, '; i <= ', this.end.textValue, '; i++) {']);} else {this.source.add(['for(var i = ', this.start.textValue, '; i >= ', this.end.textValue, '; i--) {']);}this.source.add(['acc.push(i);', '}', 'return acc;', '})()']);}});var ArrayDef = ASTNode.extend({serialize: function(state) {this.source.add('[');if(this.elements[Number(2)].textValue!==''){var first = this.elements[Number(2)];this.source.add(first.expr.elements[Number(0)].walk(state));first.elements[Number(1)].elements.each(function(node) {this.source.add(', ');this.source.add(node.expr.elements[Number(0)].walk(state));}.bind(this));}this.source.add(']');}});module.exports.ArrayAccess=ArrayAccess;module.exports.ArraySlice=ArraySlice;module.exports.ArrayRange=ArrayRange;module.exports.ArrayDef=ArrayDef;})();
});

require.define("/src/compiler/functional.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
  var _ = require('underscore');

  Object.prototype.extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ 
        if(parent.apply)
          return parent.apply(this, arguments); 
      };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  Object.prototype['__op+'] = function(x) { return this + x; }
  Object.prototype['__op*'] = function(x) { return this * x; }
  Object.prototype['__op-'] = function(x) { return this - x; }


  Number.prototype.times = function(fn) {
    for(var i = 0; i < this; i++) fn();
  };

  Array.prototype.step = function(step) {
    var ret = [];
    for(var i = 0; i < this.length; i += Math.abs(step)) {
      var next = this[i];
      if(step < 0) {
        next = this[this.length-1-i];
      }
      ret.push(next);
    }
    return ret;
  };

  Array.prototype.each = function(it) {
    for(var i = 0; i < this.length; i++) {
      it(this[i]);
    }
  };

  Array.prototype.map = function(m) {
    var ret = [];
    this.each(function(it) { ret.push(m(it)); });
    return ret;
  };

  Array.prototype.filter = function(f) {
    var ret = [];
    this.each(function(it) { if(f(it)) ret.push(it); });
    return ret;
  };

  Array.prototype.reduce = function(it, memo, context) {
    if(memo === undefined && typeof this[0] === 'number')
      memo = Number(0);

    return _.reduce(this, it, memo, context);
  };
})(); (function() {var _ = require('underscore');var ASTNode = require('./node');var ListComprehension = ASTNode.extend({serialize: function(state) {var params = [];var providers = [];var first = this.elements[Number(6)];params.push(first.ident_p.textValue);providers.push(first.expr.walk(state));this.elements.slice(7, -2).each(function(p) {if(p.textValue===''){return;}p=p.elements[Number(0)].elements[Number(3)];if(p.ident_p===undefined||p.expr===undefined){return;}params.push(p.ident_p.textValue);providers.push(p.expr.walk(state));});this.source.add('(function() { var tmp = [];');_.each(params,function(p, i) {this.source.add(['var ', p, '=', providers[i], ';']);}.bind(this));this.source.add('var evaluator = function('["__op+"] (params.join(', '))["__op+"] (') { return '));this.source.add(this.expr.walk(state));this.source.add(';};');this.source.add('for(var i = 0; i < Math.min('["__op+"] (params.join('.length, '))["__op+"] ('.length); i++) {'));this.source.add('tmp.push(evaluator('["__op+"] (params.join('[i], '))["__op+"] ('[i]));'));this.source.add('} return tmp; })()');}});var Lambda = ASTNode.extend({serialize: function(state) {var params = [];if(this.elements[Number(0)].textValue!==''){var first = this.elements[Number(0)].elements[Number(2)].ident_p;if(first!==undefined){params.push(first.textValue);var it = this.elements[Number(0)].elements[Number(2)].elements[Number(1)].elements;it.each(function(el) {params.push(el.ident_p.elements[Number(0)].textValue);});}}this.source.add(['function(', params.join(', '), ') {', this.funblock.walk(state), '}']);}});var FunctionInvocation = ASTNode.extend({serialize: function(state) {this.source.add('(');if(this.lambda){this.source.add(this.lambda.walk(state));} else if(this.elements[Number(2)].textValue!==''){this.source.add(this.elements[Number(2)].walk(state));}this.source.add(')');}});module.exports.ListComprehension=ListComprehension;module.exports.Lambda=Lambda;module.exports.FunctionInvocation=FunctionInvocation;})();
});

require.define("/src/compiler/oop.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
  var _ = require('underscore');

  Object.prototype.extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ 
        if(parent.apply)
          return parent.apply(this, arguments); 
      };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  Object.prototype['__op+'] = function(x) { return this + x; }
  Object.prototype['__op*'] = function(x) { return this * x; }
  Object.prototype['__op-'] = function(x) { return this - x; }


  Number.prototype.times = function(fn) {
    for(var i = 0; i < this; i++) fn();
  };

  Array.prototype.step = function(step) {
    var ret = [];
    for(var i = 0; i < this.length; i += Math.abs(step)) {
      var next = this[i];
      if(step < 0) {
        next = this[this.length-1-i];
      }
      ret.push(next);
    }
    return ret;
  };

  Array.prototype.each = function(it) {
    for(var i = 0; i < this.length; i++) {
      it(this[i]);
    }
  };

  Array.prototype.map = function(m) {
    var ret = [];
    this.each(function(it) { ret.push(m(it)); });
    return ret;
  };

  Array.prototype.filter = function(f) {
    var ret = [];
    this.each(function(it) { if(f(it)) ret.push(it); });
    return ret;
  };

  Array.prototype.reduce = function(it, memo, context) {
    if(memo === undefined && typeof this[0] === 'number')
      memo = Number(0);

    return _.reduce(this, it, memo, context);
  };
})(); (function() {var ASTNode = require("./node");var ClassDef = ASTNode.extend({serialize: function(state) {var parent = "Object";if(this.elements[Number(4)].ident){parent=this.elements[Number(4)].ident.walk(state);}var body = this.elements[Number(5)].walk(state);var name = this.ident.walk(state);this.source.add(['var ', name, ' = ', parent, '.extend(', body, ');']);}});var PrototypeExpander = ASTNode.extend({serialize: function(state) {this.source.add(this.ident.walk(state));if(this.elements[Number(1)].ident_p){this.source.add('.prototype.');this.source.add(this.elements[Number(1)].ident_p.textValue);}}});module.exports.ClassDef=ClassDef;module.exports.PrototypeExpander=PrototypeExpander;})();
});

require.define("/src/ham.js",function(require,module,exports,__dirname,__filename,process,global){var lang = require('./lang'),
    _ = require('underscore'),

    runtime    = require('./runtime'),
    ASTNode    = require('./compiler/node'),
    array      = require('./compiler/array'),
    functional = require('./compiler/functional'),
    oop        = require('./compiler/oop');

lang.Parser.HamFile = new ASTNode.extend({
  serialize: function(state) {
    this.source.add([
      '(', runtime.patch.toString(), ')(); (function() {']);

    if(this.expr) {
      this.source.add(['return ', this.expr.walk(state), ';']);
    } else {
      this.elements.forEach(function(el) {
        this.source.add(el.statement.walk(state));
      }.bind(this));
    }
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
    this.source.add(['if(', condition, '){']);
    this.source.add(main_block);
    elifs.forEach(function(elif) {
      this.source.add(['} else if(', elif[0], '){']);
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
      this.source.add(',');
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

  overloadable: ['+', '*', '-'],

  serialize: function(state) {
    this.source.add(this.value_acs.walk(state));

    this.elements[1].elements.forEach(function(el) {      
      var op = this.translate[el.binaryop.textValue];
      if(op === undefined)
        op = el.binaryop.textValue;

      if(this.overloadable.indexOf(op) === -1) {
        this.source.add(op);
        this.source.add(el.value_acs.walk(state));
      } else {
        this.source.add('["__op' + op + '"] (');
        this.source.add(el.value_acs.walk(state));
        this.source.add(')');
      }
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

      if(name.substring(0, 8) === 'operator') {
        name = '__op' + name.substring(8);
      }

      this.source.add(name + ': ');
      this.source.add(first.expr.walk(state));

      this.elements[1].elements[1].elements.forEach(function(node) {
        if(node.textValue === '') return;

        var val = node.object_p.name.val ? node.object_p.name.val() : node.object_p.name.textValue;
        if(val.substring(0, 8) === 'operator') {
          val = '"__op' + val.substring(8) + '"';
        }

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
    this.source.add('Number(');
    this.source.add(this.textValue);
    this.source.add(')');
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

module.exports.compile = function(source, filename) {
  var ast = lang.parse(source);

  var sourceGenerator = ast.walk({filename: filename, source: source});
  var sm = sourceGenerator.toStringWithSourceMap({file: filename});
  
  return sm;
};

module.exports.eval = function(source) {
  var ast = lang.parse(source);

  var sourceGenerator = ast.walk({filename: 'eval', source: source});
  var sm = sourceGenerator.toStringWithSourceMap({file: 'eval'});
  
  return eval(sm.code);
};

});
module.exports = require("/src/ham.js");
})();
