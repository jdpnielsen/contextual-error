const fs = require('fs');
const { WError, CError } = require('../');

var filename = '/nonexistent';

fs.stat(filename, function(err1) {
	var err2 = new CError(`failed to stat "${filename}"`, err1);

	/* The following would normally be higher up the stack. */
	var err3 = new WError('failed to handle request', err2);
	console.log(err3.message);
	console.log(err3.toString());
	console.log(err3.stack);
});
