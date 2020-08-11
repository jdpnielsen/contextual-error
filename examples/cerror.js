const fs = require('fs');
const { CError } = require('../');

const filename = '/nonexistent';
fs.stat(filename, function(err1) {
	const err2 = new CError(`stat "${filename}" failed`, err1);
	console.error(err2.message);
	console.error(CError.cause(err2).message);
});
