import nock from 'nock';

import { CheckoutApi } from '../src/index';
import { basicRequest, MERCHANT_ID, MERCHANT_SECRET } from './fixture';

describe('setDefaults', () => {
	it('Should set the default options', () => {
		const checkout = new CheckoutApi();
		checkout.setDefaults({ method: 'GET', nonce: '123' });
		expect(checkout.options).toEqual({
			currency: 'EUR',
			language: 'EN',
			algorithm: 'sha256',
			contentType: 'application/json; charset=utf-8',
			method: 'GET',
			nonce: '123'
		});
	});
});

describe('completeOptions', () => {
	it('Should complete timestamp and nonce', () => {
		const checkout = new CheckoutApi();
		const completedOptions = checkout.completeOptions({});
		expect(completedOptions.timestamp).toBeTruthy();
		expect(completedOptions.nonce).toBeTruthy();
	});

	it('Should merge options with defaults', () => {
		const checkout = new CheckoutApi({ account: '123', stamp: '456' });
		const completedOptions = checkout.completeOptions({ algorithm: 'sha512', reference: '789' });

		expect(completedOptions).toEqual({
			account: '123',
			algorithm: 'sha512',
			contentType: 'application/json; charset=utf-8',
			method: 'POST',
			stamp: '456',
			reference: '789',
			currency: 'EUR',
			language: 'EN',
			timestamp: completedOptions.timestamp,
			nonce: completedOptions.nonce
		});
	});

	it('Should override defaults', () => {
		const checkout = new CheckoutApi({
			account: '123',
			stamp: '456',
			language: 'FI'
		});
		const completedOptions = checkout.completeOptions({ account: '789', stamp: 'abc' });

		expect(completedOptions).toEqual({
			account: '789',
			algorithm: 'sha256',
			contentType: 'application/json; charset=utf-8',
			method: 'POST',
			stamp: 'abc',
			currency: 'EUR',
			language: 'FI',
			timestamp: completedOptions.timestamp,
			nonce: completedOptions.nonce
		});
	});
});

describe('preparePayment', () => {
	it('Should call the checkout api with a signature', async () => {
		const checkout = new CheckoutApi({ merchantSecret: MERCHANT_SECRET });

		nock('https://api.checkout.fi', {
			reqheaders: { 'signature': /.+/ }
		})
  			.post('/payments')
			.reply(418);

		const result = await checkout.preparePayment({});
		// response should be that of a teapot since that's what we mocked
		expect(result.status).toBe(418);
	});
});

describe('validateReturnRequest', () => {
	const queryParameters = {
		'checkout-account': '375917',
		'checkout-algorithm': 'sha256',
		'checkout-amount': '2964',
		'checkout-stamp': '15336332710015',
		'checkout-reference': '192387192837195',
		'checkout-transaction-id': '4b300af6-9a22-11e8-9184-abb6de7fd2d0',
		'checkout-status': 'ok',
		'checkout-provider': 'nordea',
		'signature': 'b2d3ecdda2c04563a4638fcade3d4e77dfdc58829b429ad2c2cb422d0fc64080'
	};
	const checkout = new CheckoutApi({ account: MERCHANT_ID, merchantSecret: MERCHANT_SECRET });

	it('Should return true if a correct signature is given', () => {
		expect(checkout.validateReturnRequest(queryParameters)).toBe(true);
	});

	it('Should return false if an incorrect signature is given', () => {
		// crate a false signature
		const falseQueryParameters = Object.assign({}, queryParameters);
		falseQueryParameters.signature += 'a';

		expect(checkout.validateReturnRequest(falseQueryParameters)).toBe(false);
	});
});

describe('pollPayment', () => {
	it('Should call the checkout api with a signature', async () => {
		const checkout = new CheckoutApi({ merchantSecret: MERCHANT_SECRET });

		nock('https://api.checkout.fi', {
			reqheaders: { 'signature': /.+/ }
		})
  			.get('/payments/foo')
			.reply(418);

		const result = await checkout.pollPayment('foo')
		// response should be that of a teapot since that's what we mocked
		expect(result.status).toBe(418);
	});
});

describe('getFullHeaderName', () => {
	it('Should get the full name of the header field', () => {
		expect(CheckoutApi.getFullHeaderName('account')).toBe('checkout-account');
		expect(CheckoutApi.getFullHeaderName('transactionId')).toBe('checkout-transaction-id');
	});

	it('Should return false if header is not found', () => {
		expect(CheckoutApi.getFullHeaderName('lorem-ipsum')).toBe(false);
	});
});

describe('getHeaders', () => {
	it('Should return set of headers', () => {
		expect(CheckoutApi.getHeaders({ method: 'GET', language: 'FI' }))
			.toEqual({ 'checkout-method': 'GET' });
	});
});

describe('getBody', () => {
	it('Should return set of body fields', () => {
		expect(CheckoutApi.getBody({ nonce: 'foobar', amount: 7894 }))
			.toEqual({ amount: 7894 });
	});
});

describe('calculateHmac', () => {
	it('Should calculate the HMAC', () => {
		const hmac = CheckoutApi.calculateHmac(MERCHANT_SECRET, basicRequest.headers, basicRequest.body);
		expect(hmac).toBe(basicRequest.hmac);
	});

	it('Should calculate the HMAC without body', () => {
		const hmac = CheckoutApi.calculateHmac(MERCHANT_SECRET, basicRequest.headers);
		expect(hmac).toBe(basicRequest.hmacWithoutBody);
	});

	it('Should calculate sha512 HMAC', () => {
		const headers = Object.assign({}, basicRequest.headers);
		headers['checkout-algorithm'] = 'sha512';

		const hmac = CheckoutApi.calculateHmac(MERCHANT_SECRET, headers, basicRequest.body);
		expect(hmac).toBe(basicRequest.hmacWithSha512);
	});
});
