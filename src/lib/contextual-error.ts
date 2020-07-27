export type ContextualInfo = Record<string | number | symbol, unknown>

export interface ContextualErrorOpts {
	/**
	 * Specifies arbitrary informational properties that are available through the
	 * `ContextualError.info(err)` static class method. See that method for details.
	 */
	info?: ContextualInfo;

	/**
	 * Describes what kind of error this is.
	 * This is intended for programmatic use to distinguish between different kinds of errors.
	 * Note that in modern versions of Node.js, this name is ignored in the stack property value,
	 * but callers can still use the name property to get at it.
	 */
	name?: string;
}

export class ContextualError extends Error {
	public readonly name: string = 'ContextualError';
	public readonly message!: string;

	public readonly info: ContextualInfo = {};

	/**
	 * For debugging, we keep track of the original short message (attached
	 * to this Error particularly) separately from the complete message,
	 * which includes the messages of our cause chain.
	 */
	public readonly shortMessage: string;

	/**
	 * Indicates that the new error was caused by some other error
	 */
	private readonly cause?: Error | ContextualError;


	constructor(message?: string, cause?: Error, options?: ContextualErrorOpts) {
		super(message);
		this.shortMessage = this.message;

		if (options?.info) {
			/*
				* If we've been given an object with properties, shallow-copy that
				* here.  We don't want to use a deep copy in case there are non-plain
				* objects here, but we don't want to use the original object in case
				* the caller modifies it later.
				*/
			for (const k in options.info) {
				this.info[k] = options.info[k];
			}
		}

		if (options?.name) {
			this.name = options.name;
		}

		if (cause) {
			this.cause = cause;
			this.message += `: ${cause.message}`;
		}
	}

	public toString(): string {
		// eslint-disable-next-line no-prototype-builtins
		let str = this.hasOwnProperty('name') && this.name || this.constructor.name || this.constructor.prototype.name;

		if (this.message) {
			str += ': ' + this.message;
		}

		return str;
	}

	public toJSON(): Record<string, string> {
		return {
			error: this.name,
			message: this.shortMessage,
		};
	}

	public static cause(err: ContextualError | Error): ContextualError | Error | null {
		if (err instanceof ContextualError && err.cause) {
			return err.cause;
		} else {
			return null;
		}
	}

	public static info(err: ContextualError | Error): ContextualInfo {
		const cause = ContextualError.cause(err);
		let info: ContextualInfo;

		if (cause !== null) {
			info = ContextualError.info(cause);
		} else {
			info = {};
		}

		// Sorta messy duck-type check of err.info for info object merging
		if (typeof ((err as ContextualError).info) == 'object' && (err as ContextualError).info !== null) {
			for (const k in (err as ContextualError).info) {
				info[k] = (err as ContextualError).info?.[k];
			}
		}

		return info;
	}

	/**
	 * Returns a string containing the full stack trace, with all nested errors recursively reported as 'caused by:' + err.stack.
	 */
	public static fullStack(err: ContextualError | Error): string {
		const cause = ContextualError.cause(err);

		if (cause) {
			return (err.stack + '\ncaused by: ' + ContextualError.fullStack(cause));
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return err.stack!;
	}

	public static findCauseByName(err: ContextualError | Error, name: string): ContextualError | Error | null {
		let cause: ContextualError | Error | null;

		for (cause = err; cause !== null; cause = ContextualError.cause(cause)) {
			if (cause.name == name) {
				return cause;
			}
		}

		return null;
	}

	public static hasCauseWithName(err: ContextualError | Error, name: string): boolean {
		return ContextualError.findCauseByName(err, name) !== null;
	}
}

export default ContextualError;
