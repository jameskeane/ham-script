(function() {
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
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume___();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0._ = address1;
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
            address5 = this.__consume__statement();
            if (address5) {
              elements2.push(address5);
              text2 += address5.textValue;
              labelled1.statement = address5;
              var address6 = null;
              address6 = this.__consume___();
              if (address6) {
                elements2.push(address6);
                text2 += address6.textValue;
                labelled1._ = address6;
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
        var type2 = find(this.constructor, "HarpFile");
        address0 = new klass2(text0, this._offset, elements0, labelled0);
        if (typeof type2 === "object") {
          extend(address0, type2);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
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
              if (slice2 === "}") {
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address5 = new klass1("}", this._offset, []);
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
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"}\""};
                }
              }
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
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
      } else {
        elements0 = null;
        this._offset = index2;
      }
      if (elements0) {
        this._offset = index2;
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
      if (address0) {
        var type3 = find(this.constructor, "FunctionalBlock");
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
      } else {
        this._offset = index1;
        var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
        var address6 = null;
        var slice4 = null;
        if (this._input.length > this._offset) {
          slice4 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice4 = null;
        }
        if (slice4 === "{") {
          var klass3 = this.constructor.SyntaxNode;
          var type4 = null;
          address6 = new klass3("{", this._offset, []);
          if (typeof type4 === "object") {
            extend(address6, type4);
          }
          this._offset += 1;
        } else {
          address6 = null;
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
            var remaining0 = 0, index4 = this._offset, elements2 = [], text2 = "", address9 = true;
            while (address9) {
              var index5 = this._offset, elements3 = [], labelled2 = {}, text3 = "";
              var address10 = null;
              address10 = this.__consume___();
              if (address10) {
                elements3.push(address10);
                text3 += address10.textValue;
                labelled2._ = address10;
                var address11 = null;
                address11 = this.__consume__statement();
                if (address11) {
                  elements3.push(address11);
                  text3 += address11.textValue;
                  labelled2.statement = address11;
                  var address12 = null;
                  address12 = this.__consume___();
                  if (address12) {
                    elements3.push(address12);
                    text3 += address12.textValue;
                    labelled2._ = address12;
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
                var klass4 = this.constructor.SyntaxNode;
                var type5 = null;
                address9 = new klass4(text3, this._offset, elements3, labelled2);
                if (typeof type5 === "object") {
                  extend(address9, type5);
                }
                this._offset += text3.length;
              } else {
                address9 = null;
              }
              if (address9) {
                elements2.push(address9);
                text2 += address9.textValue;
                remaining0 -= 1;
              }
            }
            if (remaining0 <= 0) {
              this._offset = index4;
              var klass5 = this.constructor.SyntaxNode;
              var type6 = null;
              address8 = new klass5(text2, this._offset, elements2);
              if (typeof type6 === "object") {
                extend(address8, type6);
              }
              this._offset += text2.length;
            } else {
              address8 = null;
            }
            if (address8) {
              elements1.push(address8);
              text1 += address8.textValue;
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
        if (elements1) {
          this._offset = index3;
          var klass7 = this.constructor.SyntaxNode;
          var type8 = null;
          address0 = new klass7(text1, this._offset, elements1, labelled1);
          if (typeof type8 === "object") {
            extend(address0, type8);
          }
          this._offset += text1.length;
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
              if (slice2 === ";") {
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address5 = new klass1(";", this._offset, []);
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
        var klass2 = this.constructor.SyntaxNode;
        var type2 = find(this.constructor, "ReturnStmt");
        address0 = new klass2(text0, this._offset, elements0, labelled0);
        if (typeof type2 === "object") {
          extend(address0, type2);
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
      address1 = this.__consume__value();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.value = address1;
        var address2 = null;
        var index2 = this._offset;
        var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
        var address3 = null;
        address3 = this.__consume___();
        if (address3) {
          elements1.push(address3);
          text1 += address3.textValue;
          labelled1._ = address3;
          var address4 = null;
          var slice0 = null;
          if (this._input.length > this._offset) {
            slice0 = this._input.substring(this._offset, this._offset + 1);
          } else {
            slice0 = null;
          }
          if (slice0 && /^[-+=*]/.test(slice0)) {
            var klass0 = this.constructor.SyntaxNode;
            var type0 = null;
            address4 = new klass0(slice0, this._offset, []);
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
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[-+=*]"};
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
              address6 = this.__consume__value();
              if (address6) {
                elements1.push(address6);
                text1 += address6.textValue;
                labelled1.value = address6;
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
        var type3 = find(this.constructor, "Expression");
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
      }
      return this._nodeCache["expr"][index0] = address0;
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
    __consume__value: function(input) {
      var address0 = null, index0 = this._offset;
      this._nodeCache["value"] = this._nodeCache["value"] || {};
      var cached = this._nodeCache["value"][index0];
      if (cached) {
        this._offset += cached.textValue.length;
        return cached;
      }
      var index1 = this._offset;
      address0 = this.__consume__string();
      if (address0) {
      } else {
        this._offset = index1;
        address0 = this.__consume__number();
        if (address0) {
        } else {
          this._offset = index1;
          address0 = this.__consume__object();
          if (address0) {
          } else {
            this._offset = index1;
            address0 = this.__consume__listcomp();
            if (address0) {
            } else {
              this._offset = index1;
              address0 = this.__consume__array_rng();
              if (address0) {
              } else {
                this._offset = index1;
                address0 = this.__consume__array();
                if (address0) {
                } else {
                  this._offset = index1;
                  address0 = this.__consume__lambda();
                  if (address0) {
                  } else {
                    this._offset = index1;
                    address0 = this.__consume__special();
                    if (address0) {
                    } else {
                      this._offset = index1;
                      address0 = this.__consume__funcall();
                      if (address0) {
                      } else {
                        this._offset = index1;
                        address0 = this.__consume__arrayslc();
                        if (address0) {
                        } else {
                          this._offset = index1;
                          address0 = this.__consume__arrayacs();
                          if (address0) {
                          } else {
                            this._offset = index1;
                            address0 = this.__consume__proto();
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
      return this._nodeCache["value"][index0] = address0;
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
          address2 = this.__consume__ident_p();
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
      var slice0 = null;
      if (this._input.length > this._offset) {
        slice0 = this._input.substring(this._offset, this._offset + 1);
      } else {
        slice0 = null;
      }
      if (slice0 === "|") {
        var klass0 = this.constructor.SyntaxNode;
        var type0 = null;
        address1 = new klass0("|", this._offset, []);
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
          this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"|\""};
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
          var index3 = this._offset, elements1 = [], labelled1 = {}, text1 = "";
          var address4 = null;
          address4 = this.__consume__ident_p();
          if (address4) {
            elements1.push(address4);
            text1 += address4.textValue;
            labelled1.ident_p = address4;
            var address5 = null;
            var remaining0 = 0, index4 = this._offset, elements2 = [], text2 = "", address6 = true;
            while (address6) {
              var index5 = this._offset, elements3 = [], labelled2 = {}, text3 = "";
              var address7 = null;
              address7 = this.__consume___();
              if (address7) {
                elements3.push(address7);
                text3 += address7.textValue;
                labelled2._ = address7;
                var address8 = null;
                var slice2 = null;
                if (this._input.length > this._offset) {
                  slice2 = this._input.substring(this._offset, this._offset + 1);
                } else {
                  slice2 = null;
                }
                if (slice2 === ",") {
                  var klass1 = this.constructor.SyntaxNode;
                  var type1 = null;
                  address8 = new klass1(",", this._offset, []);
                  if (typeof type1 === "object") {
                    extend(address8, type1);
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
                    this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\",\""};
                  }
                }
                if (address8) {
                  elements3.push(address8);
                  text3 += address8.textValue;
                  var address9 = null;
                  address9 = this.__consume___();
                  if (address9) {
                    elements3.push(address9);
                    text3 += address9.textValue;
                    labelled2._ = address9;
                    var address10 = null;
                    address10 = this.__consume__ident_p();
                    if (address10) {
                      elements3.push(address10);
                      text3 += address10.textValue;
                      labelled2.ident_p = address10;
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
                var klass2 = this.constructor.SyntaxNode;
                var type2 = null;
                address6 = new klass2(text3, this._offset, elements3, labelled2);
                if (typeof type2 === "object") {
                  extend(address6, type2);
                }
                this._offset += text3.length;
              } else {
                address6 = null;
              }
              if (address6) {
                elements2.push(address6);
                text2 += address6.textValue;
                remaining0 -= 1;
              }
            }
            if (remaining0 <= 0) {
              this._offset = index4;
              var klass3 = this.constructor.SyntaxNode;
              var type3 = null;
              address5 = new klass3(text2, this._offset, elements2);
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
            address3 = new klass4(text1, this._offset, elements1, labelled1);
            if (typeof type4 === "object") {
              extend(address3, type4);
            }
            this._offset += text1.length;
          } else {
            address3 = null;
          }
          if (address3) {
          } else {
            this._offset = index2;
            var klass5 = this.constructor.SyntaxNode;
            var type5 = null;
            address3 = new klass5("", this._offset, []);
            if (typeof type5 === "object") {
              extend(address3, type5);
            }
            this._offset += 0;
          }
          if (address3) {
            elements0.push(address3);
            text0 += address3.textValue;
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
              if (slice4 === "|") {
                var klass6 = this.constructor.SyntaxNode;
                var type6 = null;
                address12 = new klass6("|", this._offset, []);
                if (typeof type6 === "object") {
                  extend(address12, type6);
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
                  this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"|\""};
                }
              }
              if (address12) {
                elements0.push(address12);
                text0 += address12.textValue;
                var address13 = null;
                address13 = this.__consume___();
                if (address13) {
                  elements0.push(address13);
                  text0 += address13.textValue;
                  labelled0._ = address13;
                  var address14 = null;
                  address14 = this.__consume__funblock();
                  if (address14) {
                    elements0.push(address14);
                    text0 += address14.textValue;
                    labelled0.funblock = address14;
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
        var klass7 = this.constructor.SyntaxNode;
        var type7 = find(this.constructor, "Lambda");
        address0 = new klass7(text0, this._offset, elements0, labelled0);
        if (typeof type7 === "object") {
          extend(address0, type7);
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
                          address12 = this.__consume__proto();
                          if (address12) {
                            elements1.push(address12);
                            text1 += address12.textValue;
                            labelled1.proto = address12;
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
                                    address23 = this.__consume__proto();
                                    if (address23) {
                                      elements4.push(address23);
                                      text4 += address23.textValue;
                                      labelled3.proto = address23;
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
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
      var address1 = null;
      address1 = this.__consume__proto();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.proto = address1;
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
          if (slice0 === "(") {
            var klass0 = this.constructor.SyntaxNode;
            var type0 = null;
            address3 = new klass0("(", this._offset, []);
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
              var index2 = this._offset;
              address5 = this.__consume__expr_list();
              if (address5) {
              } else {
                this._offset = index2;
                var klass1 = this.constructor.SyntaxNode;
                var type1 = null;
                address5 = new klass1("", this._offset, []);
                if (typeof type1 === "object") {
                  extend(address5, type1);
                }
                this._offset += 0;
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
                  var slice2 = null;
                  if (this._input.length > this._offset) {
                    slice2 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice2 = null;
                  }
                  if (slice2 === ")") {
                    var klass2 = this.constructor.SyntaxNode;
                    var type2 = null;
                    address7 = new klass2(")", this._offset, []);
                    if (typeof type2 === "object") {
                      extend(address7, type2);
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
                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\")\""};
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
        var type3 = find(this.constructor, "FunctionInvocation");
        address0 = new klass3(text0, this._offset, elements0, labelled0);
        if (typeof type3 === "object") {
          extend(address0, type3);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
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
      address1 = this.__consume__proto();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.proto = address1;
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
          if (slice0 === "[") {
            var klass0 = this.constructor.SyntaxNode;
            var type0 = null;
            address3 = new klass0("[", this._offset, []);
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
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"[\""};
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
              var index2 = this._offset;
              address5 = this.__consume__string();
              if (address5) {
              } else {
                this._offset = index2;
                address5 = this.__consume__number();
                if (address5) {
                } else {
                  this._offset = index2;
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
                  var slice2 = null;
                  if (this._input.length > this._offset) {
                    slice2 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice2 = null;
                  }
                  if (slice2 === "]") {
                    var klass1 = this.constructor.SyntaxNode;
                    var type1 = null;
                    address7 = new klass1("]", this._offset, []);
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
                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"]\""};
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
      address1 = this.__consume__proto();
      if (address1) {
        elements0.push(address1);
        text0 += address1.textValue;
        labelled0.proto = address1;
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
          if (slice0 === "[") {
            var klass0 = this.constructor.SyntaxNode;
            var type0 = null;
            address3 = new klass0("[", this._offset, []);
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
              this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"[\""};
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
              address5 = this.__consume__slice();
              if (address5) {
                elements0.push(address5);
                text0 += address5.textValue;
                labelled0.slice = address5;
                var address6 = null;
                address6 = this.__consume___();
                if (address6) {
                  elements0.push(address6);
                  text0 += address6.textValue;
                  labelled0._ = address6;
                  var address7 = null;
                  var slice2 = null;
                  if (this._input.length > this._offset) {
                    slice2 = this._input.substring(this._offset, this._offset + 1);
                  } else {
                    slice2 = null;
                  }
                  if (slice2 === "]") {
                    var klass1 = this.constructor.SyntaxNode;
                    var type1 = null;
                    address7 = new klass1("]", this._offset, []);
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
                      this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "\"]\""};
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
      var index1 = this._offset, elements0 = [], labelled0 = {}, text0 = "";
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
        var remaining0 = 0, index2 = this._offset, elements1 = [], text1 = "", address3 = true;
        while (address3) {
          var index3 = this._offset;
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
            this._offset = index3;
            var index4 = this._offset, elements2 = [], labelled1 = {}, text2 = "";
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
                this._offset = index4;
              }
            } else {
              elements2 = null;
              this._offset = index4;
            }
            if (elements2) {
              this._offset = index4;
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
              this._offset = index3;
              address3 = this.__consume__hex();
              if (address3) {
              } else {
                this._offset = index3;
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
          this._offset = index2;
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
        var type7 = find(this.constructor, "StringNode");
        address0 = new klass7(text0, this._offset, elements0, labelled0);
        if (typeof type7 === "object") {
          extend(address0, type7);
        }
        this._offset += text0.length;
      } else {
        address0 = null;
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
        var slice2 = null;
        if (this._input.length > this._offset) {
          slice2 = this._input.substring(this._offset, this._offset + 1);
        } else {
          slice2 = null;
        }
        if (slice2 && /^[1-9]/.test(slice2)) {
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
            this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[1-9]"};
          }
        }
        if (address2) {
          elements0.push(address2);
          text0 += address2.textValue;
          var address3 = null;
          var remaining0 = 0, index3 = this._offset, elements1 = [], text1 = "", address4 = true;
          while (address4) {
            var slice4 = null;
            if (this._input.length > this._offset) {
              slice4 = this._input.substring(this._offset, this._offset + 1);
            } else {
              slice4 = null;
            }
            if (slice4 && /^[0-9]/.test(slice4)) {
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
                this.error = this.constructor.lastError = {input: this._input, offset: this._offset, expected: "[0-9]"};
              }
            }
            if (address4) {
              elements1.push(address4);
              text1 += address4.textValue;
              remaining0 -= 1;
            }
          }
          if (remaining0 <= 0) {
            this._offset = index3;
            var klass4 = this.constructor.SyntaxNode;
            var type4 = null;
            address3 = new klass4(text1, this._offset, elements1);
            if (typeof type4 === "object") {
              extend(address3, type4);
            }
            this._offset += text1.length;
          } else {
            address3 = null;
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
    harp = Grammar;
    harpParser = Parser;
    harpParser.formatError = formatError;
  }
})();

