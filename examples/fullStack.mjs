const { CError } = require('../');

const err1 = new CError('something bad happened');
/* ... */
const err2 = new CError('something really bad happened here', err1);

console.log(CError.fullStack(err2));
