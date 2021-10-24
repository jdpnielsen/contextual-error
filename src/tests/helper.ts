/* eslint-disable @typescript-eslint/no-non-null-assertion */

/*
 * Remove full paths and relative line numbers from stack traces so that we can
 * compare against "known-good" output.
 */
export function cleanStack(stacktxt: string) {
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
export function helperStack(message: string, name = 'Error') {
	const nodestack = new Error().stack!.split('\n').slice(2).join('\n');

	return [
		`${name}: ${message}`,
		cleanStack(nodestack),
	].join('\n');
}

export function indentHelper(message: string): string {
	return message.replace(/\n/g, '\n    ');
}
