export const MERCHANT_ID = '375917';
export const MERCHANT_SECRET = 'SAIPPUAKAUPPIAS';

export const basicRequest = {
	headers: {
		'checkout-account': MERCHANT_ID,
		'checkout-algorithm': 'sha256',
		'checkout-method': 'POST',
		'checkout-nonce': '564635208570151',
		'checkout-timestamp': '2018-07-06T10:01:31.904Z'
	},
	body: {
		stamp: 'unique-identifier-for-merchant',
		reference: '3759170',
		amount: 1525,
		currency: <'EUR'>'EUR',
		language: <'FI'>'FI',
		items: [{
				unitPrice: 1525,
				units: 1,
				vatPercentage: 24,
				productCode: '#1234',
				deliveryDate: '2018-09-01'
		}],
		customer: {
			email: 'test.customer@example.com'
		},
		redirectUrls: {
			success: 'https://ecom.example.com/cart/success',
			cancel: 'https://ecom.example.com/cart/cancel'
		}
	},
	hmac: '3708f6497ae7cc55a2e6009fc90aa10c3ad0ef125260ee91b19168750f6d74f6',
	hmacWithoutBody: 'a21294097934b5ea37794c882cdc9cda5954d8aeae774c3cf629ead8915c6439'
};
