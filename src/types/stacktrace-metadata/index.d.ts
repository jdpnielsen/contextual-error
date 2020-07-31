declare module 'stacktrace-metadata' {

	/**
	 * optional options object for more control
	 *
	 * @interface StacktraceMetadataOptions
	 */
	interface StacktraceMetadataOptions {
		/**
		 * if `false` won't clean stack trace from node internals
		 *
		 * @type {boolean}
		 * @memberof StacktraceMetadataOptions
		 */
		cleanStack?: boolean,
		shortStack?: boolean,
		showStack?: boolean,
		relativePaths?: boolean,
		cwd?: string,
		mapper?: (line: string, index: number) => void,
	}

	type EnhancedError = Error & { line: number, column: number, filename: string, place: string, at: string, stack: string };

	/**
	* > Cleans stack trace and attaches few more metadata properties,
	* such as `at`, `line`, `column`, `filename` and `place`. By default
	* it cleans stack, makes is short (4 length) and makes paths relative.
	* But all this is controllable through `options` object.
	* Throws `TypeError` if `error` is not an instance of Error.
	*
	* **Example**
	*
	* ```js
	* const metadata = require('stacktrace-metadata')
	*
	* const error = new Error('foo quxie')
	* error.stack = `Error: foo quxie
	*     at zazz (/home/charlike/apps/alwa.js:8:10)
	*     at module.exports (/home/charlike/apps/foo.js:6:3)
	*     at Object.<anonymous> (/home/charlike/apps/dush.js:45:3)
	*     at Module._compile (module.js:409:26)
	*     at Object.Module._extensions..js (module.js:416:10)
	*     at Module.load (module.js:343:32)
	*     at Function.Module._load (module.js:300:12)
	*     at Function.Module.runMain (module.js:441:10)
	*     at startup (node.js:139:18)
	* `
	* const err = metadata(error)
	*
	* console.log(err.line) // => 8
	* console.log(err.column) // => 10
	* console.log(err.filename) // => 'alwa.js'
	* console.log(err.place) // => 'zazz'
	* console.log(err.at) // => 'zazz (alwa.js:8:10)'
	* console.log(err.stack)
	* // =>
	* // Error: foo quxie
	* //     at zazz (alwa.js:8:10)
	* //     at module.exports (foo.js:6:3)
	* //     at Object.<anonymous> (dush.js:45:3)
	* ```
	*/
	export default function stacktraceMetadata(error: Error, options?: StacktraceMetadataOptions): EnhancedError;
}
