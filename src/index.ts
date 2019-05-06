import { createHmac, randomBytes } from 'crypto';
import fetch from 'node-fetch';
import { set } from 'lodash';

import { Utils } from './utils';
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

	setDefaults(options: CheckoutOptions): void {
		this.options = this.mergeOptions(options);
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
		// merge into a new shallow copy
		const completedOptions = this.mergeOptions(options);
		// create a random nonce if none was given
		Utils.setIfEmpty(completedOptions, 'headers.checkout-nonce', randomBytes(64).toString('hex'));
		// use current time if no timestamp was given
		Utils.setIfEmpty(completedOptions, 'headers.checkout-timestamp', new Date().toISOString());
		return completedOptions;
	}

	preparePayment(options: CheckoutOptions): Promise<any> {
		// apply options on top of defaults and complete smart defaults for undefined mandatory fields
		const completedOptions = this.completeOptions(options);

		// TODO: validate request (account must be set etc.) perhaps use type guards.

		// calculate HMAC signature and add the signature header
		const signature = CheckoutApi.calculateHmac(MERCHANT_SECRET, <KeyValue>completedOptions.headers, <CheckoutBody | undefined>completedOptions.body);
		set(completedOptions, 'headers.signature', signature);

		// make the api call
		return fetch(PREPARE_PAYMENT_URL, {
			method: 'POST',
			headers: <KeyValue>completedOptions.headers,
			body: JSON.stringify(completedOptions.body),
		});
	}

	static calculateHmac(secret: string, headers: KeyValue, body?: CheckoutBody): string {
		const hmacPayload =
			Object.keys(headers)
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
