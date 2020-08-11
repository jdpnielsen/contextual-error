export type Info = Record<string | number | symbol, unknown>

export interface Options {
	/**
	 * Specifies arbitrary informational properties that are available through the
	 * `ContextualError.info(err)` static class method. See that method for details.
	 */
	info?: Info;

	/**
	 * Describes what kind of error this is.
	 * This is intended for programmatic use to distinguish between different kinds of errors.
	 * Note that in modern versions of Node.js, this name is ignored in the stack property value,
	 * but callers can still use the name property to get at it.
	 */
	name?: string;

	/**
	 * Prevent extending of message with cause chain.
	 */
	skipCauseMessage?: boolean;


	/**
	 * If specified, then the stack trace for this error ends at function `constructorOpt`.
	 * Functions called by `constructorOpt` will not show up in the stack.
	 * This is useful when this class is subclassed.
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	constructorOpt?: Function;
}

export class CError extends Error {
	public readonly name: string = 'CError';
	public readonly message!: string;

	public readonly info: Info = {};

	/**
	 * For debugging, we keep track of the original short message (attached
	 * to this Error particularly) separately from the complete message,
	 * which includes the messages of our cause chain.
	 */
	public readonly shortMessage: string;

	/**
	 * Indicates that the new error was caused by some other error
	 */
	private readonly cause?: Error | CError;


	constructor(message?: string, cause?: Error, options?: Options) {
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
			if (!options?.skipCauseMessage) {
				this.message += `: ${cause.message}`;
			}
		}

		/* istanbul ignore else */
		if (Error.captureStackTrace) {
			const ctor = options?.constructorOpt || this.constructor;
			Error.captureStackTrace(this, ctor);
		}
	}

	public toString(): string {
		let str = this.name;

		/* istanbul ignore else */
		if (this.message) {
			str += ': ' + this.message;
		}

		return str;
	}

	public toJSON(): Record<string, string | unknown> {
		return {
			error: this.name,
			message: this.shortMessage,
		};
	}

	public static cause(err: CError | Error): CError | Error | null {
		if (err instanceof CError && err.cause) {
			return err.cause;
		} else {
			return null;
		}
	}

	public static info(err: CError | Error): Info {
		const cause = CError.cause(err);
		let info: Info;

		if (cause !== null) {
			info = CError.info(cause);
		} else {
			info = {};
		}

		// Sorta messy duck-type check of err.info for info object merging
		if (typeof ((err as CError).info) == 'object' && (err as CError).info !== null) {
			for (const k in (err as CError).info) {
				info[k] = (err as CError).info[k];
			}
		}

		return info;
	}

	/**
	 * Returns a string containing the full stack trace, with all nested errors recursively reported as 'caused by:' + err.stack.
	 */
	public static fullStack(err: CError | Error): string {
		const cause = CError.cause(err);

		if (cause) {
			return (err.stack + '\ncaused by: ' + CError.fullStack(cause));
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return err.stack!;
	}

	public static findCauseByName(err: CError | Error, name: string): CError | Error | null {
		let cause: CError | Error | null;

		for (cause = err; cause !== null; cause = CError.cause(cause)) {
			if (cause.name == name) {
				return cause;
			}
		}

		return null;
	}

	public static hasCauseWithName(err: CError | Error, name: string): boolean {
		return CError.findCauseByName(err, name) !== null;
	}
}

export default CError;
