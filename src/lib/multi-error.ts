import CError, { Options } from './cerror';

export const MULTIERROR_SYMBOL = Symbol.for('contextual-error/multi-error');

export class MultiError extends CError {
	public readonly name: string = 'MultiError';
	private readonly causes?: (Error | CError)[];

	constructor(message?: string, causes?: Error[], options?: Options) {
		super(message, causes?.[0], Object.assign({}, options || {}, { skipCauseMessage: true }));
		Object.defineProperty(this, MULTIERROR_SYMBOL, { value: true });

		this.causes = causes;

		if (options?.name) {
			this.name = options.name;
		}

		if (causes) {
			Object.defineProperty(this, 'causes', {
				value: causes,
				enumerable: false,
			});

			if (!options?.skipCauseMessage) {
				this.message += `: [${causes.map(e => e.message).join(', ')}]`;
			}
		}
	}

	public static isMultiError(obj: unknown): obj is MultiError {
		return (obj as { [MULTIERROR_SYMBOL]?: boolean })?.[MULTIERROR_SYMBOL] != null;
	}

	public fullStack(): string {
		if (this.causes && this.causes.length > 0) {
			return this.stack + '\ncaused by multiple errors: ' + (this.causes.map((cause, index) => {
				return `\n (${index}) ${CError.fullStack(cause)}`;
			}).join('').replace(/\n/g, '\n    '));
		}

		return this.stack;
	}

	public static fullStack(err: Error | CError | MultiError): string {
		if (this.isMultiError(err)) {
			return err.fullStack();
		}

		return CError.fullStack(err);
	}
}

export default MultiError;
