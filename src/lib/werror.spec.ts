/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import test from 'ava';
import CError from './cerror';
import WError from './werror';

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
function helperStack(message: string, name = 'WError') {
	const nodestack = new Error().stack!.split('\n').slice(2).join('\n');

	return [
		`${name}: ${message}`,
		cleanStack(nodestack),
	].join('\n');
}

test('should act like a regular error', t => {
	const message = '_custom_message_';
	const err = new WError(message);

	t.is(err.name, 'WError', 'has expected name');
	t.is(err.message, message, 'has expected message');
	t.is(cleanStack(err.stack!), helperStack(message), 'has expected stack');
	t.throws(() => { throw err; }, { is: err }, 'is throwable');
});

test('should handle no input', t => {
	const err = new WError();

	t.is(err.name, 'WError', 'has expected name');
	t.is(err.message, '', 'has expected message');
	t.is(cleanStack(err.stack!), helperStack(''), 'has expected stack');
	t.throws(() => { throw err; }, { is: err }, 'is throwable');
});

test('should accept an Error as cause', t => {
	const parentError = new Error('ParentError');
	const childError = new WError('ChildError', parentError);

	t.is(childError.message, `ChildError`, 'builds correct message');
	t.is((childError as any).cause, parentError, 'has expected cause');
});

test('should accept a CError as cause', t => {
	const parentError = new CError('ParentError');
	const childError = new WError('ChildError', parentError);

	t.is(childError.message, `ChildError`, 'builds correct message');
	t.is((childError as any).cause, parentError, 'has expected cause');
});

test('should accept an options object', t => {
	const uncausedErr = new CError('uncausedErr', undefined, { info: { text: '_uncausedErr_', fromUncaused: true }, name: 'UncausedError' });
	const causedErr = new WError('causedErr', uncausedErr, { info: { text: '_causedErr_', fromCaused: true }, name: 'CausedError' });

	t.is(uncausedErr.name, `UncausedError`, 'sets correct name');
	t.is(causedErr.name, `CausedError`, 'sets correct name');

	t.is(uncausedErr.message, `uncausedErr`, 'builds correct message');
	t.is(causedErr.message, `causedErr`, 'builds correct message');

	t.is((uncausedErr as any).cause, undefined, 'does not have a cause');
	t.is((causedErr as any).cause, uncausedErr, 'has expected cause');

	t.deepEqual(uncausedErr.info, { text: '_uncausedErr_', fromUncaused: true }, 'has expected info');
	t.deepEqual(causedErr.info, { text: '_causedErr_', fromCaused: true }, 'has expected info');
});

test('should handle multiple nestings of causes', t => {
	const parentError = new CError('ParentError');
	const childError = new CError('ChildError', parentError);
	const grandChildError = new WError('GrandChildError', childError);

	t.is(grandChildError.message, `GrandChildError`, 'builds correct message');
	t.is((grandChildError as any).cause, childError, 'has expected cause');

	t.is((grandChildError as any).cause.message, `ChildError: ParentError`, 'builds correct message');
	t.is((grandChildError as any).cause.cause, parentError, 'has expected cause');
});

test('should stringify correctly', t => {
	const parentError = new CError('ParentError');
	const childError = new WError('ChildError', parentError, { info: { foo: 'bar' }});

	t.is(childError.toString(), 'WError: ChildError');
});

test('should JSON.stringify correctly', t => {
	const parentError = new CError('ParentError');
	const childError = new WError('ChildError', parentError, { info: { foo: 'bar' } });

	t.is(JSON.stringify(childError), '{"error":"WError","message":"ChildError"}');
});

test('should have a static .cause which returns the expected cause', t => {
	const parentError = new Error('ParentError');
	const childError = new WError('ChildError', parentError, { info: { foo: 'bar' } });

	t.is(WError.cause(parentError), null, 'handles regular errors');
	t.is(WError.cause(childError), parentError, 'returns cause');
});

test('should have a static .info which returns the info object', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' } });
	const grandChildError = new WError('GrandChildError', childError, { info: { bar: 'baz' } });

	t.deepEqual(WError.info(parentError), {}, 'handles regular errors');
	t.deepEqual(WError.info(childError), { foo: 'bar' }, 'returns info');
	t.deepEqual(WError.info(grandChildError), { foo: 'bar', bar: 'baz' }, 'returns merged info objects');
});

test('should have a static .fullStack which returns the combined stack trace', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' } });
	const grandChildError = new WError('GrandChildError', childError, { info: { bar: 'baz' } });

	const expectedParentStack = helperStack('ParentError', 'Error');
	const expectedChildStack = helperStack('ChildError: ParentError', 'CError') + '\ncaused by: ' + expectedParentStack;
	const expectedGrandChildStack = helperStack('GrandChildError', 'WError') + '\ncaused by: ' + expectedChildStack;

	t.is(cleanStack(WError.fullStack(parentError)), expectedParentStack, 'builds parentError stack');
	t.is(cleanStack(WError.fullStack(childError)), expectedChildStack, 'builds childError stack');
	t.is(cleanStack(WError.fullStack(grandChildError)), expectedGrandChildStack, 'builds grandChildError stack');
});

test('should have a static .findCauseByName', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError);
	const grandChildError = new WError('GrandChildError', childError, { name: 'CustomErrorName' });

	t.is(WError.findCauseByName(grandChildError, 'Error'), parentError, 'finds regular Error');
	t.is(WError.findCauseByName(grandChildError, 'CError'), childError, 'finds CError');
	t.is(WError.findCauseByName(grandChildError, 'CustomErrorName'), grandChildError, 'finds CustomError');
	t.is(WError.findCauseByName(grandChildError, 'NoName'), null, 'does not find NoName');
});

test('should have a static .hasCauseWithName', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError);
	const grandChildError = new WError('GrandChildError', childError, { name: 'CustomErrorName' });

	t.is(WError.hasCauseWithName(grandChildError, 'Error'), true, 'finds regular Error');
	t.is(WError.hasCauseWithName(grandChildError, 'CError'), true, 'finds CError');
	t.is(WError.hasCauseWithName(grandChildError, 'CustomErrorName'), true, 'finds CustomError');
	t.is(WError.hasCauseWithName(grandChildError, 'NoName'), false, 'does not find NoName');
});
