var harp = require('./harp'),
    fs = require('fs');

//eval(harp.parse(fs.readFileSync(process.argv[2], 'utf8')).toJS());
console.log(harp.parse(fs.readFileSync(process.argv[2], 'utf8')).toJS());