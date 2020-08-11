import CError, { Options } from './cerror';

export class WError extends CError {
	public readonly name: string = 'WError';

	constructor(message?: string, cause?: Error, options?: Options) {
		super(message, cause, Object.assign(options || {}, { skipCauseMessage: true }));

		if (options?.name) {
			this.name = options.name;
		}
	}
}

export default WError;
