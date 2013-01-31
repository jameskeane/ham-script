Ham -- an altJS language
=========================
Ham is another altJS language, similar to [CoffeeScript](http://coffeescript.org/).  What makes Ham different is that it is written as a PEG,
and does not have significant whitespace.  Ham looks very similar to Javascript at first, but offers (hopefully)
many useful features.

Ham was written using the [Canopy](http://canopy.jcoglan.com/) PEG Parser Generator, and Javascript.  I am
currently working towards self-hosting Ham but it is not quite there yet.

Ham is written in an MVC style manner, where model is the AST, view is the javascript translations 
(using ejs templates), and the controller is the tree translators.  This makes Ham extremely easy to hack on, and fun!

Syntax
------
Since Ham is extremely similar to Javascript, you can get almost perfect syntax hilighting for free by using the Javascript
hilighters, which is a pretty neat side effect.

### Array Ranges and Slices
Ham supports [python style](http://stackoverflow.com/a/509295) list ranges and slicing.

```Javascript
var range = [1..5];

range === [1, 2, 3, 4, 5];    // true
range[1:] === [2, 3, 4, 5];   // true
range[:4] === [1, 2, 3, 4];   // true
range[::2] === [1, 3, 5];     // true
```

### List Comprehensions
Ham supports list comprehensions, similar in style to Haskell.
```Javascript
var cross = [x*y | x <- range, y <- range[::-1]];
```

### Friendly Lambda's
Ham makes it fun to use lambda's.
```Javascript
var sum = |x, y| { return x + y; }

// If the body of the lambda is a single expression, 
// then the `return` statement and semicolon can be dropped.
var sum = |x, y| { x + y }

// Lambda's are an easy way to iterate a list:
[1, 2, 3].each(|| { console.log('repeating'); });

// If the lambda takes no parameters, the `||` can be dropped.
[1, 2, 3].each({ console.log('repeating');});

// When invoking a function with a lambda as the _only_ parameter, the parentheses can be dropped
[1, 2, 3].each {
   console.log('repeating');
};
```

### Classical Style Inheritence
Some people would prefer to use Classical Inheritence instead of Javascript's prototypical inheritence, that's fine:
```Javascript
class Hamburger extends MeatMeal {
   eat: { console.log('om nom nom'); }
};

// Ham just uses Backbone style .extend() for inheritence, so this translates easily to:
// var Hamburger = MeatMeal.extend({ ... });
```

### Operator overloading
Being able to overload the default behaviour of javascript operators is sometimes useful:
```Javascript
class Vector {
  x:0, y:0, z:0,
  constructor: |x, y, z| { this.x=x; this.y=y; this.z=z; },
  operator+: |other| { new Vector(this.x+other.x, this.y+other.y, this.z+other.z) }
};

var v1 = new Vector(1, 2, 3);
var v2 = new Vector(1, 2, 3);

console.log(v1 + v2); // === {x: 2, y: 4, z: 6}
```

### Prototype shortcut
Stolen from Coffeescript, is the prototype shortcut:
```Javascript
String::startsWith = |str| { this.substr(0, str.length) === str };
```

### Numbers as objects
Ham wraps numbers in the javascript built-in Number Object and extends it's prototype with nice things:
```Javascript
3.times {
  console.log('hello world!'); 
};
```

What else is coming?
---------------------

### Types
Would be nice to have some inference at compile time, with contracts at runtime for what couldn't be inferred.
```Javascript
var x:string = 3; // TypeError -> typeof "x" is string.
var sum = |x:num, y:num| { x + y }; // we could infer the return type easily here
var idk = ||:string { "hello" }; // I'm not sold on the return type syntax here
```

### Imports
I like python style imports, but I think it might be hard/impossible to reconcile it with CommonJS style require.
Another option is to rewrite a CommonJS style require for the browser, similar to 
[browserify](https://github.com/substack/node-browserify).
```Javascript
import Backbone, _ from 'vendor/backbone'; // would work great for browser, but hard for CommonJS
```

### Decorators
I also sometimes find myself with a need for python style Decorators, so Ham will have some form of them.
```Javascript
@watch(notify_change)
var the_ghost_man = 3;
```

### Unary Operators
Yeah, I haven't gotten around to unary operators yet.  I've been focussing on the cool stuff for now.

### Loops
I haven't implemented while or for loops yet, as I am still experimenting with syntax for them.  I've been getting by
largely with the combination of ranges and list comprehensions with `.each`.

Usage
-----
`npm install -g ham`
Then write some Ham.js code, and `ham <filename>` to run it.
