import { createHmac, randomBytes } from 'crypto';
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
	// define sensible defaults
	options: CheckoutOptions = {
		body: {
			currency: 'EUR',
			language: 'EN'
		},
		headers: {
			'checkout-algorithm': 'sha256',
			'content-type': 'application/json; charset=utf-8',
			'checkout-method': 'POST'
		}
	};

	constructor(options?: CheckoutOptions) {
		if (options) this.setDefaults(options);
	}

	setDefaults(options: CheckoutOptions) {
		this.options = this.mergeOptions(options);
	}

	setIfEmpty(obj: object, path: string, value: any) {
		if (!get(obj, path)) {
			set(obj, path, value);
		}
	}

	mergeOptions(options: CheckoutOptions): CheckoutOptions {
		// merge given options with defaults
		const mergedOptions = {
			headers: Object.assign({}, this.options.headers, options.headers),
			body: Object.assign({}, this.options.body, options.body)
		};

		return mergedOptions;
	}

	completeOptions(options: CheckoutOptions): CheckoutOptions {
		// make a shallow copy
		const completedOptions = Object.assign({}, options);
		// create a random nonce if none was given
		this.setIfEmpty(completedOptions, 'headers.checkout-nonce', randomBytes(64).toString('hex'));
		// use current time if no timestamp was given
		this.setIfEmpty(completedOptions, 'headers.checkout-timestamp', new Date().toISOString());
		return completedOptions;
	}

	preparePayment(options: CheckoutOptions): Promise<any> {
		// apply options on top of defaults
		const mergedOptions = this.mergeOptions(options);
		const completedOptions = this.completeOptions(mergedOptions);

		// TODO: validate request (account must be set etc.) perhaps use type guards.

		// calculate HMAC signature and add the signature header
		const signature = CheckoutApi.calculateHmac(MERCHANT_SECRET, <KeyValue>mergedOptions.headers, <CheckoutBody | undefined>mergedOptions.body);
		set(mergedOptions, 'headers.signature', signature);

		// make the api call
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
