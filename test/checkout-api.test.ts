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
