const { CError } = require('../');

const err1 = new CError('something bad happened');
/* ... */
const ip = '127.0.0.1';
const port = 215;

const err2 = new CError(`failed to connect to "${ip}:${port}"`, err1, {
	'name': 'ConnectionError',
	'info': {
		'errno': 'ECONNREFUSED',
		'remote_ip': '127.0.0.1',
		'port': 215,
	},
});

console.log(err2.message);
console.log(err2.name);
console.log(CError.info(err2));
console.log(err2.stack);

const err3 = new CError('request failed', err2, {
	'name': 'RequestError',
	'info': {
		'errno': 'EBADREQUEST',
	},
});

console.log(err3.message);
console.log(err3.name);
console.log(CError.info(err3));
console.log(err3.stack);
