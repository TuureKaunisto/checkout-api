import { createHmac } from 'crypto';

export interface CheckoutOptions {
	merchantId: number,
	merchantSecret: string,
	algorithm: 'sha256' | 'sha512'
}

export class CheckoutApi {
	options: CheckoutOptions;

	constructor(options: CheckoutOptions) {
		this.options = options;
	}

	static calculateHmac(secret: string, headers: any, body?: any): string {
		const hmacPayload =
			Object.keys(headers)
				.sort()
				.map(key => `${key}:${headers[key]}`)
				.concat(body ? JSON.stringify(body) : '')
				.join("\n");

		return createHmac('sha256', secret)
			.update(hmacPayload)
			.digest('hex');
	}
}
