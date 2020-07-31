/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import test from 'ava';
// import { ContextualError } from './contextual-error';
// import stacktraceMetadata from 'stacktrace-metadata';
import normalize from 'normalize-path';
import path from 'path';

/*
 * Remove full paths and relative line numbers from stack traces so that we can
 * compare against "known-good" output.
 */
function cleanStack(stacktxt: string) {
	let stack = stacktxt.split('\n');
	const result = [];

	if (!(/^\s*at /.test(stack[0])) && (/^\s*at /i.test(stack[1]))) {
		result.push(stack[0]);
		stack = stack.slice(1);
	}
	console.log('result', result, stack);

	stack.forEach(function(line) {
		const m = /^\s+at\s(.+ )?\(?(.+):(\d*):(\d*)\)?$/.exec(line) || [];

		console.log('m', m, m[2]);
		if (m[2]) {
			const relativePath = normalize(path.relative(process.cwd(), m[2]));
			console.log('relativePath', relativePath);

			line = line.replace(m[2], relativePath);
		}

		// const res = m[1] ? line.replace(m[1], path.relative(process.cwd(), m[1])) : line;
		// console.log('line', line);
		// console.log('m', m, m[1]);
		// console.log('res', res);
		result.push(line);
	});

	return result.join('\n');

	// const re = new RegExp(/\/.*\/.*spec\.ts:\d+:\d+/, 'gm');
	// stacktxt = stacktxt.replace(re, '(dummy filename)');
	// return stacktxt;
}

Error.stackTraceLimit = 20;
/*
 * Save the generic parts of all stack traces so we can avoid hardcoding
 * Node-specific implementation details in our testing of stack traces.
 * The stack trace limit has to be large enough to capture all of Node's frames,
 * which are more than the default (10 frames) in Node v6.x.
 */
// function helperStack(message: string, name = 'ContextualError') {
// 	const nodestack = new Error().stack!.split('\n').slice(2).join('\n');

// 	return [
// 		`${name}: ${message}`,
// 		cleanStack(nodestack),
// 	].join('\n');
// }

test('should act like a regular error', t => {
	// const message = '_custom_message_';
	// const err = new ContextualError(message);


	const err1 = new Error('testing').stack;
	const err2 = cleanStack(new Error('testing').stack as string);

	console.log('1:', err1);
	console.log('2:', err2);
	t.is(err1, err2);

	// t.is(err.name, 'ContextualError', 'has expected name');
	// t.is(err.message, message, 'has expected message');
	// t.is(cleanStack(err.stack!), helperStack(message), 'has expected stack');
	// t.throws(() => { throw err; }, { is: err }, 'is throwable');
});

// test('should handle no input', t => {
// 	const err = new ContextualError();

// 	t.is(err.name, 'ContextualError', 'has expected name');
// 	t.is(err.message, '', 'has expected message');
// 	t.is(cleanStack(err.stack!), helperStack(''), 'has expected stack');
// 	t.throws(() => { throw err; }, { is: err }, 'is throwable');
// });

// test('should accept an Error as cause', t => {
// 	const parentError = new Error('ParentError');
// 	const childError = new ContextualError('ChildError', parentError);

// 	t.is(childError.message, `ChildError: ParentError`, 'builds correct message');
// 	t.is((childError as any).cause, parentError, 'has expected cause');
// });

// test('should accept a ContextualError as cause', t => {
// 	const parentError = new ContextualError('ParentError');
// 	const childError = new ContextualError('ChildError', parentError);

// 	t.is(childError.message, `ChildError: ParentError`, 'builds correct message');
// 	t.is((childError as any).cause, parentError, 'has expected cause');
// });

// test('should accept an options object', t => {
// 	const uncausedErr = new ContextualError('uncausedErr', undefined, { info: { text: '_uncausedErr_', fromUncaused: true }, name: 'UncausedError' });
// 	const causedErr = new ContextualError('causedErr', uncausedErr, { info: { text: '_causedErr_', fromCaused: true }, name: 'CausedError' });

// 	t.is(uncausedErr.name, `UncausedError`, 'sets correct name');
// 	t.is(causedErr.name, `CausedError`, 'sets correct name');

// 	t.is(uncausedErr.message, `uncausedErr`, 'builds correct message');
// 	t.is(causedErr.message, `causedErr: uncausedErr`, 'builds correct message');

// 	t.is((uncausedErr as any).cause, undefined, 'does not have a cause');
// 	t.is((causedErr as any).cause, uncausedErr, 'has expected cause');

// 	t.deepEqual(uncausedErr.info, { text: '_uncausedErr_', fromUncaused: true }, 'has expected info');
// 	t.deepEqual(causedErr.info, { text: '_causedErr_', fromCaused: true }, 'has expected info');
// });

// test('should handle multiple nestings of causes', t => {
// 	const parentError = new ContextualError('ParentError');
// 	const childError = new ContextualError('ChildError', parentError);
// 	const grandChildError = new ContextualError('GrandChildError', childError);

// 	console.log(stacktraceMetadata(grandChildError));
// 	console.log('err', ContextualError.cause(grandChildError));

// 	t.is(grandChildError.message, `GrandChildError: ChildError: ParentError`, 'builds correct message');
// 	t.is((grandChildError as any).cause, childError, 'has expected cause');

// 	t.is((grandChildError as any).cause.message, `ChildError: ParentError`, 'builds correct message');
// 	t.is((grandChildError as any).cause.cause, parentError, 'has expected cause');
// });

// test('should stringify correctly', t => {
// 	const parentError = new ContextualError('ParentError');
// 	const childError = new ContextualError('ChildError', parentError, { info: { foo: 'bar' } });

// 	t.is(childError.toString(), 'ContextualError: ChildError: ParentError');
// });

// test('should JSON.stringify correctly', t => {
// 	const parentError = new ContextualError('ParentError');
// 	const childError = new ContextualError('ChildError', parentError, { info: { foo: 'bar' } });

// 	t.is(JSON.stringify(childError), '{"error":"ContextualError","message":"ChildError"}');
// });

// test('should have a static .cause which returns the expected cause', t => {
// 	const parentError = new Error('ParentError');
// 	const childError = new ContextualError('ChildError', parentError, { info: { foo: 'bar' } });

// 	t.is(ContextualError.cause(parentError), null, 'handles regular errors');
// 	t.is(ContextualError.cause(childError), parentError, 'returns cause');
// });

// test('should have a static .info which returns the info object', t => {
// 	const parentError = new Error('ParentError');
// 	const childError = new ContextualError('ChildError', parentError, { info: { foo: 'bar' } });
// 	const grandChildError = new ContextualError('GrandChildError', childError, { info: { bar: 'baz' } });

// 	t.deepEqual(ContextualError.info(parentError), {}, 'handles regular errors');
// 	t.deepEqual(ContextualError.info(childError), { foo: 'bar' }, 'returns info');
// 	t.deepEqual(ContextualError.info(grandChildError), { foo: 'bar', bar: 'baz' }, 'returns merged info objects');
// });

// test('should have a static .fullStack which returns the combined stack trace', t => {
// 	const parentError = new Error('ParentError');
// 	const childError = new ContextualError('ChildError', parentError, { info: { foo: 'bar' } });
// 	const grandChildError = new ContextualError('GrandChildError', childError, { info: { bar: 'baz' } });

// 	const expectedParentStack = helperStack('ParentError', 'Error');
// 	const expectedChildStack = helperStack('ChildError: ParentError', 'ContextualError') + '\ncaused by: ' + expectedParentStack;
// 	const expectedGrandChildStack = helperStack('GrandChildError: ChildError: ParentError', 'ContextualError') + '\ncaused by: ' + expectedChildStack;

// 	t.is(cleanStack(ContextualError.fullStack(parentError)), expectedParentStack, 'builds parentError stack');
// 	t.is(cleanStack(ContextualError.fullStack(childError)), expectedChildStack, 'builds childError stack');
// 	t.is(cleanStack(ContextualError.fullStack(grandChildError)), expectedGrandChildStack, 'builds grandChildError stack');
// });

// test('should have a static .findCauseByName', t => {
// 	const parentError = new Error('ParentError');
// 	const childError = new ContextualError('ChildError', parentError);
// 	const grandChildError = new ContextualError('GrandChildError', childError, { name: 'CustomErrorName' });

// 	t.is(ContextualError.findCauseByName(grandChildError, 'Error'), parentError, 'finds regular Error');
// 	t.is(ContextualError.findCauseByName(grandChildError, 'ContextualError'), childError, 'finds ContextualError');
// 	t.is(ContextualError.findCauseByName(grandChildError, 'CustomErrorName'), grandChildError, 'finds CustomError');
// 	t.is(ContextualError.findCauseByName(grandChildError, 'NoName'), null, 'does not find NoName');
// });

// test('should have a static .hasCauseWithName', t => {
// 	const parentError = new Error('ParentError');
// 	const childError = new ContextualError('ChildError', parentError);
// 	const grandChildError = new ContextualError('GrandChildError', childError, { name: 'CustomErrorName' });

// 	t.is(ContextualError.hasCauseWithName(grandChildError, 'Error'), true, 'finds regular Error');
// 	t.is(ContextualError.hasCauseWithName(grandChildError, 'ContextualError'), true, 'finds ContextualError');
// 	t.is(ContextualError.hasCauseWithName(grandChildError, 'CustomErrorName'), true, 'finds CustomError');
// 	t.is(ContextualError.hasCauseWithName(grandChildError, 'NoName'), false, 'does not find NoName');
// });
