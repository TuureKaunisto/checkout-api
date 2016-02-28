'use strict';

require('dotenv').config();

var CheckoutApi = require('checkout-api');
var express = require('express');

var app = express();
var payments = new CheckoutApi({
	merchantId:     process.env.MERCHANT_ID,
	merchantSecret: process.env.MERCHANT_SECRET,
	baseUrl:        process.env.BASE_URL
});

// front page
app.get('/', function (req, res) {
  res.send('<form action="/buy-shoe" method="post"><input type="submit" value="Buy a shoe!"></form>');
});

// payment page
app.post('/buy-shoe', function (req, res) {
	var html = '<h1>Select payment method</h1>';

  payments.preparePayment({
  	AMOUNT: 1000,
  	STAMP: Math.round(Math.random()*100000), // this is just to keep the example simple
  	// you actually need to generate a unique stamp and store it in the database
  	REFERENCE: '12345'
  }).then(resp => {
  	var banks = resp.trade.payments.payment.banks;

    // render html from the response
  	for (var bankName in banks) {
  		var hiddenFields = '';
  		var bank = banks[bankName];

  		for (var key in bank) {
  			var value = bank[key];
  			if (value === {}) {
  				value = '';
  			}
  			hiddenFields += `<input type="hidden" name="${ key }" value="${ value }" />`;
  		}

  		html += `<form action="${bank.url}" method="post">
  					${ hiddenFields }
  					<input type="image" src="${ bank.icon }" />
  					<span>${ bank.name }</span>
  				</form>`;
  	}

  	res.send(html);
  });
});

// thanks page
app.get('/payment-return', function (req, res) {
  // validate the MAC and check that the status indicates the payment has been paid (2,5,6,7,8,9 or 10)
  var status = parseInt(req.query.STATUS);
  if (payments.validateReturnMsg(req.query) && (status === 2 || status >= 5)) {
    res.send('Thanks for your purchase!');
  } else {
    res.send('Unfortunately something went wrong.');
  }
});

// cancel page
app.get('/payment-cancel', function (req, res) {
  // validate the MAC
  if (payments.validateReturnMsg(req.query)) {
    res.send('Your payment has been cancelled.');
  } else {
    res.send('Unfortunately something went wrong.');
  }
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});