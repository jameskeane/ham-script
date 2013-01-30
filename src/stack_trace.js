var fs = require('fs');

var cache = module.exports.maps = {};

function mapSourcePosition(position) {
  var sourceMap = cache[position.source];
  if (!sourceMap && fs.existsSync(position.source)) {
    // Get the URL of the source map
    var fileData = fs.readFileSync(position.source, 'utf8');
    var match = /\/\/@\s*sourceMappingURL=(.*)\s*$/.exec(fileData);
    if (!match) return position;
    var sourceMappingURL = match[1];

    // Support source map URLs relative to the source URL
    var dir = path.dirname(position.source);
    sourceMappingURL = path.resolve(dir, sourceMappingURL);

    // Parse the source map
    if (fs.existsSync(sourceMappingURL)) {
      var sourceMapData = fs.readFileSync(sourceMappingURL, 'utf8');
      try {
        sourceMap = new SourceMapConsumer(sourceMapData);
        cache[position.source] = sourceMap;
      } catch (e) {
      }
    }
  }
  return sourceMap ? sourceMap.originalPositionFor(position) : position;
}


// Mimic node's stack trace printing when an exception escapes the process
process.on('uncaughtException', function(error) {
  if (!error || !error.stack) {
    console.log('Uncaught exception:', error);
    process.exit();
  }
  var match = /at ([^:]+):(\d+):(\d+)/.exec(error.stack);
  if (match) {

    var position = mapSourcePosition({
      source: match[1],
      line: match[2],
      column: match[3]
    });
    
    if (fs.existsSync(position.source)) {
      var contents = fs.readFileSync(position.source, 'utf8');
      var line = contents.split(/(?:\r\n|\r|\n)/)[position.line - 1];
      if (line) {
        console.log('\n' + position.source + ':' + position.line);
        console.log(line);
        console.log(new Array(+position.column).join(' ') + '^');
      }
    }
  }
  console.log(error.stack);
  process.exit();
});