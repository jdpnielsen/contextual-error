/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import test from 'ava';
import CError from './cerror';

/*
 * Remove full paths and relative line numbers from stack traces so that we can
 * compare against "known-good" output.
 */
function cleanStack(stacktxt: string) {
	const re = new RegExp(/\/.*\/.*spec\.ts:\d+:\d+/, 'gm');
	stacktxt = stacktxt.replace(re, '(dummy filename)');
	return stacktxt;
}

Error.stackTraceLimit = 20;
/*
 * Save the generic parts of all stack traces so we can avoid hardcoding
 * Node-specific implementation details in our testing of stack traces.
 * The stack trace limit has to be large enough to capture all of Node's frames,
 * which are more than the default (10 frames) in Node v6.x.
 */
function helperStack(message: string, name = 'CError') {
	const nodestack = new Error().stack!.split('\n').slice(2).join('\n');

	return [
		`${name}: ${message}`,
		cleanStack(nodestack),
	].join('\n');
}

test('should act like a regular error', t => {
	const message = '_custom_message_';
	const err = new CError(message);

	t.is(err.name, 'CError', 'has expected name');
	t.is(err.message, message, 'has expected message');
	t.is(cleanStack(err.stack!), helperStack(message), 'has expected stack');
	t.throws(() => { throw err; }, { is: err }, 'is throwable');
});

test('should handle no input', t => {
	const err = new CError();

	t.is(err.name, 'CError', 'has expected name');
	t.is(err.message, '', 'has expected message');
	t.is(cleanStack(err.stack!), helperStack(''), 'has expected stack');
	t.throws(() => { throw err; }, { is: err }, 'is throwable');
});

test('should accept an Error as cause', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError);

	t.is(childError.message, `ChildError: ParentError`, 'builds correct message');
	t.is((childError as any).cause, parentError, 'has expected cause');
});

test('should accept a CError as cause', t => {
	const parentError = new CError('ParentError');
	const childError = new CError('ChildError', parentError);

	t.is(childError.message, `ChildError: ParentError`, 'builds correct message');
	t.is((childError as any).cause, parentError, 'has expected cause');
});

test('should accept an options object', t => {
	const uncausedErr = new CError('uncausedErr', undefined, { info: { text: '_uncausedErr_', fromUncaused: true }, name: 'UncausedError' });
	const causedErr = new CError('causedErr', uncausedErr, { info: { text: '_causedErr_', fromCaused: true }, name: 'CausedError' });

	t.is(uncausedErr.name, `UncausedError`, 'sets correct name');
	t.is(causedErr.name, `CausedError`, 'sets correct name');

	t.is(uncausedErr.message, `uncausedErr`, 'builds correct message');
	t.is(causedErr.message, `causedErr: uncausedErr`, 'builds correct message');

	t.is((uncausedErr as any).cause, undefined, 'does not have a cause');
	t.is((causedErr as any).cause, uncausedErr, 'has expected cause');

	t.deepEqual(uncausedErr.info, { text: '_uncausedErr_', fromUncaused: true }, 'has expected info');
	t.deepEqual(causedErr.info, { text: '_causedErr_', fromCaused: true }, 'has expected info');
});

test('should handle multiple nestings of causes', t => {
	const parentError = new CError('ParentError');
	const childError = new CError('ChildError', parentError);
	const grandChildError = new CError('GrandChildError', childError);

	t.is(grandChildError.message, `GrandChildError: ChildError: ParentError`, 'builds correct message');
	t.is((grandChildError as any).cause, childError, 'has expected cause');

	t.is((grandChildError as any).cause.message, `ChildError: ParentError`, 'builds correct message');
	t.is((grandChildError as any).cause.cause, parentError, 'has expected cause');
});

test('should stringify correctly', t => {
	const parentError = new CError('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' }});

	t.is(childError.toString(), 'CError: ChildError: ParentError');
});

test('should JSON.stringify correctly', t => {
	const parentError = new CError('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' } });

	t.is(JSON.stringify(childError), '{"error":"CError","message":"ChildError"}');
});

test('should have a static .cause which returns the expected cause', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' } });

	t.is(CError.cause(parentError), null, 'handles regular errors');
	t.is(CError.cause(childError), parentError, 'returns cause');
});

test('should have a static .info which returns the info object', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' } });
	const grandChildError = new CError('GrandChildError', childError, { info: { bar: 'baz' } });

	t.deepEqual(CError.info(parentError), {}, 'handles regular errors');
	t.deepEqual(CError.info(childError), { foo: 'bar' }, 'returns info');
	t.deepEqual(CError.info(grandChildError), { foo: 'bar', bar: 'baz' }, 'returns merged info objects');
});

test('should have a static .fullStack which returns the combined stack trace', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' } });
	const grandChildError = new CError('GrandChildError', childError, { info: { bar: 'baz' } });

	const expectedParentStack = helperStack('ParentError', 'Error');
	const expectedChildStack = helperStack('ChildError: ParentError', 'CError') + '\ncaused by: ' + expectedParentStack;
	const expectedGrandChildStack = helperStack('GrandChildError: ChildError: ParentError', 'CError') + '\ncaused by: ' + expectedChildStack;

	t.is(cleanStack(CError.fullStack(parentError)), expectedParentStack, 'builds parentError stack');
	t.is(cleanStack(CError.fullStack(childError)), expectedChildStack, 'builds childError stack');
	t.is(cleanStack(CError.fullStack(grandChildError)), expectedGrandChildStack, 'builds grandChildError stack');
});

test('should have a static .findCauseByName', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError);
	const grandChildError = new CError('GrandChildError', childError, { name: 'CustomErrorName' });

	t.is(CError.findCauseByName(grandChildError, 'Error'), parentError, 'finds regular Error');
	t.is(CError.findCauseByName(grandChildError, 'CError'), childError, 'finds CError');
	t.is(CError.findCauseByName(grandChildError, 'CustomErrorName'), grandChildError, 'finds CustomError');
	t.is(CError.findCauseByName(grandChildError, 'NoName'), null, 'does not find NoName');
});

test('should have a static .hasCauseWithName', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError);
	const grandChildError = new CError('GrandChildError', childError, { name: 'CustomErrorName' });

	t.is(CError.hasCauseWithName(grandChildError, 'Error'), true, 'finds regular Error');
	t.is(CError.hasCauseWithName(grandChildError, 'CError'), true, 'finds CError');
	t.is(CError.hasCauseWithName(grandChildError, 'CustomErrorName'), true, 'finds CustomError');
	t.is(CError.hasCauseWithName(grandChildError, 'NoName'), false, 'does not find NoName');
});
