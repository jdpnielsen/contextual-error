const fs = require('fs');
const { WError } = require('../');

function checkFile(filename, callback) {
	fs.stat(filename, function(err) {
		if (err) {
			/* Annotate the "stat" error with what we were doing. */
			return callback(new WError(`failed to check "${filename}"`, { cause: err }));
		}

		/* ... */
		return callback();
	});
}

function handleRequest(filename, callback) {
	checkFile('/nonexistent', function(err) {
		if (err) {
			/* Annotate the "checkFile" error. */
			return callback(new WError('request failed', { cause: err }));
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
