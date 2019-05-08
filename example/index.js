'use strict';

require('dotenv').config();

var CheckoutApi = require('checkout-api').CheckoutApi;
var express = require('express');

var app = express();
var checkout = new CheckoutApi({
	account:     process.env.MERCHANT_ID,
	merchantSecret: process.env.MERCHANT_SECRET
});

const parameterToInput = (param) =>
`<input type='hidden' name='${param.name}' value='${param.value}' />`;

const responseToHtml = (response) =>
response.providers
.map((provider) =>
`<form method='POST' action=${provider.url}>
${provider.parameters.map(parameterToInput).join('')}
<button><img src="${provider.svg}" width="100" /></button>
</form>`
)
.join('\n');

// front page
app.get('/', function (req, res) {
	res.send('<form action="/buy-shoe" method="post"><input type="submit" value="Buy a shoe!"></form>');
});

// payment page
app.post('/buy-shoe', function (req, res) {
	let html = '<h1>Select payment method</h1>';

	checkout.preparePayment({
		stamp: Math.round(Math.random()*100000).toString(), // this is just to keep the example simple
		// you actually need to generate a unique stamp and store it in the database
		reference: '3759170',
		amount: 1500,
		items: [{
			unitPrice: 1500,
			units: 1,
			vatPercentage: 24,
			productCode: '#1234',
			deliveryDate: '2018-09-01'
		}],
		customer: {
			email: 'test.customer@example.com'
		},
		redirectUrls: {
			success: `${process.env.BASE_URL}/payment-return`,
			cancel: `${process.env.BASE_URL}/payment-cancel`
		}
	}).then(async paymentResponse => {
		const response = await paymentResponse.json();
		html += responseToHtml(response);

		res.send(html);
	});
});

// thanks page
app.get('/payment-return', function (req, res) {
	// validate the MAC and check the status
	if (checkout.validateReturnRequest(req.query) && req.query['checkout-status'] === 'ok') {
		res.send('Thanks for your purchase!');
	} else {
		res.send('Unfortunately something went wrong.');
	}
});

// cancel page
app.get('/payment-cancel', function (req, res) {
	// validate the MAC and check the status
	if (checkout.validateReturnMsg(req.query)) {
		res.send('Your payment has been cancelled.');
	} else {
		res.send('Unfortunately something went wrong.');
	}
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
