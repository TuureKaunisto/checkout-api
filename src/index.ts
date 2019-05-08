import { createHmac, randomBytes } from 'crypto';
import fetch, { Response } from 'node-fetch';
import _, { pickBy, get } from 'lodash';

import { Utils } from './utils';
import { CheckoutHeaders, CheckoutBody } from './interfaces';

const PREPARE_PAYMENT_URL = 'https://api.checkout.fi/payments';
const POLL_PAYMENT_URL = PREPARE_PAYMENT_URL;
const HEADER_FIELDS = [
	'checkout-account',
	'checkout-algorithm',
	'checkout-method',
	'checkout-nonce',
	'checkout-timestamp',
	'checkout-transaction-id',
	'content-type'
]

interface CheckoutOptions extends Partial<CheckoutHeaders>, Partial<CheckoutBody> {
	merchantSecret?: string
}
type KeyValue = { [key: string]: string };

export class CheckoutApi {
	// define sensible defaults
	options: CheckoutOptions = {
		currency: 'EUR',
		language: 'EN',
		algorithm: 'sha256',
		contentType: 'application/json; charset=utf-8',
		method: 'POST'
	};

	constructor(options?: CheckoutOptions) {
		if (options) this.setDefaults(options);
	}

	setDefaults(options: CheckoutOptions): void {
		Object.assign(this.options, options);
	}

	completeOptions(options?: CheckoutOptions): CheckoutOptions {
		// merge into a new shallow copy
		const completedOptions = Object.assign({}, this.options, options);
		// create a random nonce if none was given
		Utils.setIfEmpty(completedOptions, 'nonce', randomBytes(16).toString('hex'));
		// use current time if no timestamp was given
		Utils.setIfEmpty(completedOptions, 'timestamp', new Date().toISOString());
		return completedOptions;
	}

	preparePayment(options: CheckoutOptions): Promise<Response> {
		// apply options on top of defaults and complete smart defaults for undefined mandatory fields
		const completedOptions = this.completeOptions(options);

		// TODO: validate request (account must be set etc.) perhaps use type guards.
		const secret = <string>completedOptions.merchantSecret;
		const headers = CheckoutApi.getHeaders(completedOptions);
		const body = CheckoutApi.getBody(completedOptions);

		// calculate HMAC signature and add the signature header
		const signature = CheckoutApi.calculateHmac(secret, headers, <CheckoutBody | undefined>body);
		headers['signature'] = signature;

		// make the api call
		return fetch(POLL_PAYMENT_URL, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(body),
		});
	}

	validateReturnRequest(parameters: KeyValue): boolean {
		const secret = <string>this.options.merchantSecret;
		// calculate actual signature of the given parameters
		const hmacSignature = CheckoutApi.calculateHmac(secret, parameters);
		return hmacSignature === parameters.signature;
	}

	pollPayment(transactionId: string): Promise<Response> {
		// calculate HMAC signature and add the signature header
		const completedOptions = this.completeOptions();
		const secret = <string>completedOptions.merchantSecret;
		const headers = CheckoutApi.getHeaders(completedOptions);
		const signature = CheckoutApi.calculateHmac(secret, headers);
		headers['signature'] = signature;

		// make the api call
		return fetch(`${POLL_PAYMENT_URL}/${encodeURIComponent(transactionId)}`, {
			method: 'GET',
			headers: headers,
		});
	}

	static getFullHeaderName(key: string): string | boolean {
		// make a kebab-case version of the key
		const dashedKey = Utils.camelCaseToDashes(key);
		// check if the key is found on the header list
		if (HEADER_FIELDS.includes(dashedKey)) {
			return dashedKey;
		}
		// the full name might have a checkout- prefix
		if (HEADER_FIELDS.includes(`checkout-${dashedKey}`)) {
			return `checkout-${dashedKey}`;
		}
		return false;
	}

	static getHeaders(options: CheckoutOptions): KeyValue {
		// pick only header fields and convert the keys to full names
		// e.g. transactionId -> checkout-transaction-id
		return <CheckoutHeaders>_(options)
			.pickBy((_value: any, key: string) => CheckoutApi.getFullHeaderName(key))
			.mapKeys((_value: any, key: string) => CheckoutApi.getFullHeaderName(key))
			.value();
	}

	static getBody(options: CheckoutOptions): CheckoutBody {
		// pick only fields that are not listed as header fields
		// also exclude merchantSecret
		return <CheckoutBody>pickBy(options, (_value: any, key: string) => {
			return key !== 'merchantSecret' && !CheckoutApi.getFullHeaderName(key)
		});
	}

	static calculateHmac(secret: string, headers: KeyValue, body?: CheckoutBody): string {
		const hmacPayload =
			Object.keys(headers)
				// use only headers with checkout- prefix
				.filter(key => key.startsWith('checkout-'))
				.sort()
				.map(key => `${key}:${headers[key]}`)
				.concat(body ? JSON.stringify(body) : '')
				.join("\n");

		// allow only sha256 or sha512 as the algorithm value. Default to sha256.
		let algorithm = get(headers, 'checkout-algorithm');
		if (algorithm !== 'sha512') algorithm = 'sha256';

		return createHmac(algorithm, secret)
			.update(hmacPayload)
			.digest('hex');
	}
}
