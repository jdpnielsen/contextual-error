/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import test from 'ava';
import CError from './cerror';
import { cleanStack, helperStack, indentHelper } from '../tests/helper';
import MultiError from './multi-error';

test('should act like a regular error', t => {
	const message = '_custom_message_';
	const err = new MultiError(message);

	t.is(err.name, 'MultiError', 'has expected name');
	t.is(err.message, message, 'has expected message');
	t.is(cleanStack(err.stack!), helperStack(message, 'MultiError'), 'has expected stack');
	t.throws(() => { throw err; }, { is: err }, 'is throwable');
});

test('should handle no input', t => {
	const err = new MultiError();

	t.is(err.name, 'MultiError', 'has expected name');
	t.is(err.message, '', 'has expected message');
	t.is(cleanStack(err.stack!), helperStack('', 'MultiError'), 'has expected stack');
	t.throws(() => { throw err; }, { is: err }, 'is throwable');
});

test('should accept an Error as cause', t => {
	const parentError = new Error('ParentError');
	const childError = new MultiError('ChildError', [parentError]);

	t.is(childError.message, `ChildError: ParentError`, 'builds correct message');
	t.is((childError as any).cause, parentError, 'has expected cause');
});

test('should accept a CError as cause', t => {
	const parentError = new CError('ParentError');
	const childError = new MultiError('ChildError', [parentError]);

	t.is(childError.message, `ChildError: ParentError`, 'builds correct message');
	t.is((childError as any).cause, parentError, 'has expected cause');
});

test('should be acceptable to CError as cause', t => {
	const grandParentError = new CError('GrandParentError');
	const parentError = new MultiError('ParentError', [grandParentError]);
	const childError = new CError('ChildError', parentError);

	t.is(childError.message, `ChildError: ParentError: GrandParentError`, 'builds correct message');
	t.is((childError as any).cause, parentError, 'has expected cause');
});

test('should accept an options object', t => {
	const uncausedErr = new CError('uncausedErr', undefined, { info: { text: '_uncausedErr_', fromUncaused: true }, name: 'UncausedError' });
	const causedErr = new MultiError('causedErr', [uncausedErr], { info: { text: '_causedErr_', fromCaused: true }, name: 'CausedError' });

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
	const grandChildError = new MultiError('GrandChildError', [childError]);

	t.is(grandChildError.message, `GrandChildError: ChildError: ParentError`, 'builds correct message');
	t.is((grandChildError as any).cause, childError, 'has expected cause');

	t.is((grandChildError as any).cause.message, `ChildError: ParentError`, 'builds correct message');
	t.is((grandChildError as any).cause.cause, parentError, 'has expected cause');
});

test('should stringify correctly', t => {
	const parentError = new CError('ParentError');
	const childError = new MultiError('ChildError', [parentError], { info: { foo: 'bar' }});

	t.is(childError.toString(), 'MultiError: ChildError: ParentError');
});

test('should JSON.stringify correctly', t => {
	const parentError = new CError('ParentError');
	const childError = new MultiError('ChildError', [parentError], { info: { foo: 'bar' } });

	t.is(JSON.stringify(childError), '{"error":"MultiError","message":"ChildError"}');
});

test('should have a static .isCError method which returns true when given a CError', t => {
	const regularError = new Error('RegularError');
	const cError = new CError('CError');
	const multiError = new MultiError('MultiError');

	t.is(MultiError.isCError(regularError), false, 'handles Error');
	t.is(MultiError.isCError(cError), true, 'handles CError');
	t.is(MultiError.isCError(multiError), true, 'handles MultiError');
});

test('should have a static .isMultiError method which returns true when given a MultiError', t => {
	const regularError = new Error('RegularError');
	const cError = new CError('CError');
	const multiError = new MultiError('MultiError');

	t.is(MultiError.isMultiError(null), false, 'handles null');
	t.is(MultiError.isMultiError(regularError), false, 'handles Error');
	t.is(MultiError.isMultiError(cError), false, 'handles CError');
	t.is(MultiError.isMultiError(multiError), true, 'handles MultiError');
});

test('should have a static .cause which returns the expected cause', t => {
	const parentError = new Error('ParentError');
	const childError = new MultiError('ChildError', [parentError], { info: { foo: 'bar' } });

	t.is(MultiError.cause(parentError), null, 'handles regular errors');
	t.is(MultiError.cause(childError), parentError, 'returns cause');
});

test('should have a static .info which returns the info object', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' } });
	const grandChildError = new MultiError('GrandChildError', [childError], { info: { bar: 'baz' } });

	t.deepEqual(MultiError.info(parentError), {}, 'handles regular errors');
	t.deepEqual(MultiError.info(childError), { foo: 'bar' }, 'returns info');
	t.deepEqual(MultiError.info(grandChildError), { foo: 'bar', bar: 'baz' }, 'returns merged info objects');
});

test('should have a static .fullStack which returns the combined stack trace', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError, { info: { foo: 'bar' } });
	const siblingError = new Error('SiblingError');
	const grandChildError = new MultiError('GrandChildError', [childError, siblingError], { info: { bar: 'baz' } });

	const expectedParentStack = helperStack('ParentError', 'Error');
	const expectedChildStack = helperStack('ChildError: ParentError', 'CError') + '\ncaused by: ' + expectedParentStack;
	const expectedGrandChildStack = helperStack('GrandChildError: ChildError: ParentError', 'MultiError') + '\ncaused by multiple errors: ' + indentHelper(
		'\n (0) ' + expectedChildStack + '\n (1) ' + helperStack('SiblingError', 'Error')
	);

	t.is(cleanStack(MultiError.fullStack(parentError)), expectedParentStack, 'builds parentError stack');
	t.is(cleanStack(MultiError.fullStack(childError)), expectedChildStack, 'builds childError stack');
	t.is(cleanStack(MultiError.fullStack(grandChildError)), expectedGrandChildStack, 'builds grandChildError stack');
});

test('should have a static .findCauseByName', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError);
	const grandChildError = new MultiError('GrandChildError', [childError], { name: 'CustomErrorName' });

	t.is(MultiError.findCauseByName(grandChildError, 'Error'), parentError, 'finds regular Error');
	t.is(MultiError.findCauseByName(grandChildError, 'CError'), childError, 'finds CError');
	t.is(MultiError.findCauseByName(grandChildError, 'CustomErrorName'), grandChildError, 'finds CustomError');
	t.is(MultiError.findCauseByName(grandChildError, 'NoName'), null, 'does not find NoName');
});

test('should have a static .hasCauseWithName', t => {
	const parentError = new Error('ParentError');
	const childError = new CError('ChildError', parentError);
	const grandChildError = new MultiError('GrandChildError', [childError], { name: 'CustomErrorName' });

	t.is(MultiError.hasCauseWithName(grandChildError, 'Error'), true, 'finds regular Error');
	t.is(MultiError.hasCauseWithName(grandChildError, 'CError'), true, 'finds CError');
	t.is(MultiError.hasCauseWithName(grandChildError, 'CustomErrorName'), true, 'finds CustomError');
	t.is(MultiError.hasCauseWithName(grandChildError, 'NoName'), false, 'does not find NoName');
});
