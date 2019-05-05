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
