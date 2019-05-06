import nock from 'nock';

import { CheckoutApi } from '../src/index';
import { basicRequest, MERCHANT_SECRET } from './fixture';

describe('calculateHmac', () => {
	it('Should calculate the HMAC', () => {
		const hmac = CheckoutApi.calculateHmac(MERCHANT_SECRET, basicRequest.headers, basicRequest.body);
		expect(hmac).toBe(basicRequest.hmac);
	});

	it('Should calculate the HMAC without body', () => {
		const hmac = CheckoutApi.calculateHmac(MERCHANT_SECRET, basicRequest.headers);
		expect(hmac).toBe(basicRequest.hmacWithoutBody);
	});
});

describe('mergeOptions', () => {
	it('Should merge options with defaults', () => {
		const checkout = new CheckoutApi({
			headers: { 'checkout-account': '123' },
			body: { stamp: '456' }
		});
		const mergedOptions = checkout.mergeOptions({
			headers: { 'checkout-algorithm': 'sha512' },
			body: { reference: '789' }
		});

		expect(mergedOptions).toEqual({
			headers: {
				'checkout-account': '123',
				'checkout-algorithm': 'sha512',
				'content-type': 'application/json; charset=utf-8',
				'checkout-method': 'POST'
			},
			body: {
				stamp: '456',
				reference: '789',
				currency: 'EUR',
				language: 'EN'
			}
		});
	});

	it('Should override defaults', () => {
		const checkout = new CheckoutApi({
			headers: { 'checkout-account': '123' },
			body: {
				stamp: '456',
				language: 'FI',
			}
		});
		const mergedOptions = checkout.mergeOptions({
			headers: { 'checkout-account': '789' },
			body: { stamp: 'abc' }
		});

		expect(mergedOptions).toEqual({
			headers: {
				'checkout-account': '789',
				'checkout-algorithm': 'sha256',
				'content-type': 'application/json; charset=utf-8',
				'checkout-method': 'POST'
			},
			body: {
				stamp: 'abc',
				currency: 'EUR',
				language: 'FI'
			},
		});
	});
});

describe('preparePayment', () => {
	it('Should call the checkout api with a signature', async () => {
		const checkout = new CheckoutApi();

		nock('https://api.checkout.fi', {
			reqheaders: { 'signature': /.+/ }
		})
  			.post('/payments')
			.reply(200);

		const result = await checkout.preparePayment({});
		expect(result.status).toBe(200);
	});
});
