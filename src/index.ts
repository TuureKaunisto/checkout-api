import { createHmac } from 'crypto';
import fetch from 'node-fetch';
import { get, set } from 'lodash';

import { CheckoutHeaders, CheckoutBody } from './interfaces';
import { MERCHANT_SECRET } from '../test/fixture';

const PREPARE_PAYMENT_URL = 'https://api.checkout.fi/payments';

interface CheckoutOptions {
	body?: Partial<CheckoutBody>,
	headers?: Partial<CheckoutHeaders>,
}

type KeyValue = { [key: string]: string };

export class CheckoutApi {
	options: CheckoutOptions = {};

	constructor(options?: CheckoutOptions) {
		if (options) this.setDefaults(options);
	}

	setDefaults(options: CheckoutOptions) {
		this.options = options || {};
		// make sure the content-type header is set
		if (get(this.options, 'headers.content-type')) {
			set(this.options, 'headers.content-type', 'application/json; charset=utf-8');
		}
	}

	preparePayment(options: CheckoutOptions): Promise<any> {
		// merge given options with defaults
		const mergedOptions: CheckoutOptions = Object.assign({}, this.options, options);

		const signature = CheckoutApi.calculateHmac(MERCHANT_SECRET, <KeyValue>mergedOptions.headers, <CheckoutBody | undefined>mergedOptions.body);
		set(mergedOptions, 'headers.signature', signature);

		return fetch(PREPARE_PAYMENT_URL, {
			method: 'POST',
			headers: <KeyValue>mergedOptions.headers,
			body: JSON.stringify(mergedOptions.body),
		});
	}

	static calculateHmac(secret: string, headers: KeyValue, body?: CheckoutBody): string {
		const hmacPayload =
			Object.keys(headers || {})
				// keep only checkout- params
				.filter(key => key.startsWith('checkout-'))
				.sort()
				.map(key => `${key}:${headers[key]}`)
				.concat(body ? JSON.stringify(body) : '')
				.join("\n");

		return createHmac('sha256', secret)
			.update(hmacPayload)
			.digest('hex');
	}
}
