const { CError } = require('../');

var err1 = new Error('No such file or directory');
var err2 = new CError('failed to stat "/junk"', err1);
var err3 = new CError('request failed', err2);
console.error(err3.message);
