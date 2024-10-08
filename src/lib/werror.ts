import CError, { Options } from './cerror';

export const WERROR_SYMBOL = Symbol.for('contextual-error/werror');

export class WError extends CError {
	public readonly name: string = 'WError';

	constructor(message?: string, options?: Options) {
		super(message, Object.assign(options || {}, { skipCauseMessage: true }));
		Object.defineProperty(this, WERROR_SYMBOL, { value: true });

		if (options?.name) {
			this.name = options.name;
		}
	}

	public static isWError(obj: unknown): obj is WError {
		return (obj as { [WERROR_SYMBOL]?: boolean })?.[WERROR_SYMBOL] != null;
	}
}

export default WError;
