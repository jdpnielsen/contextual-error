const fs = require('fs');
const { CError } = require('../');

function checkFile(filename, callback) {
	fs.stat(filename, function(err) {
		if (err) {
			/* Annotate the "stat" error with what we were doing. */
			return callback(new CError(`failed to check "${filename}"`, err));
		}

		/* ... */
		return callback();
	});
}

function handleRequest(filename, callback) {
	checkFile('/nonexistent', function(err) {
		if (err) {
			/* Annotate the "checkFile" error. */
			return callback(new CError('request failed', err));
		}
		/* ... */
		return callback();
	});
}

handleRequest('/nonexistent', function(err) {
	if (err) {
		console.error(err);
	}
	/* ... */
});
