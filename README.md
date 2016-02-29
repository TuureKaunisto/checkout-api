# Checkout API

This is a simple library for online payments with the Finnish Checkout online bank payment system

## Installing

```bash
npm install checkout-api --save
```

## Usage

First you need to require the library and initialize an object with your credentials

```javascript
var CheckoutApi = require('checkout-api');
// set the merchant authentication and return base url
var checkout = new CheckoutApi({
    merchantId:     '375917',
    merchantSecret: 'SAIPPUAKAUPPIAS',
    baseUrl:        'https://example.com'
  });
```
I strongly recommend using for example [dotenv](https://github.com/motdotla/dotenv) to load the merchant id and secret. It's a really bad idea to store them in version control.

You can then call the `preparePayment(data, options)` method to initiate a payment and get payment options

```javascript
checkout.preparePayment({
  AMOUNT:     100,
  STAMP:      '123',
  REFERENCE:  '456'
}).then(printPaymentButtons);
```
When the payment has been made the user returns and you can validate the payment with the `validateReturnMsg(message)` method.

```javascript
checkout.validateReturnMsg(req.query);
```

You can poll a payments status by calling `pollPayment(data, options)`. The data parameter must include: `STAMP`, `REFERENCE` and `AMOUNT` and they must be the same as in the payment.

```javascript
checkout.pollPayment(data, { responseType: 'xml' });
```

## preparePayment data and options

`preparePayment(data, options)`

### Data

You can use all options listed in the checkout.fi [documentation](http://www.checkout.fi/materiaalit/tekninen-materiaali/)

### Options

Key | Allowed values | Default | Description
--- | --- | --- | ---
responseType | xml, html, json | json | What kind of data will the output be
allowSmallPurchases | false, true | false | Allow less than 1€ payments

## pollPayment data and options

`pollPayment(data, options).then(resp => { console.log(resp) })`

### Data

You can use all options listed in the checkout.fi [documentation](http://www.checkout.fi/materiaalit/tekninen-materiaali/).
`STAMP`, `REFERENCE` and `AMOUNT` are required.

### Options

Key | Allowed values | Default | Description
--- | --- | --- | ---
responseType | xml, html, json | json | What kind of data will the output be

## CheckoutApi options

Key | Description
--- | ---
merchantId | Your merchant id
merchantSecret | Your merchant secret
baseUrl | The base url of your application
sendRequest | You can use a different method for sending the request than the default Node.js request library. The given function must return a promise. This is usefull for example if you want to use a proxy for static outbound ip or write tests that don't actually send the request.

```javascript
var checkout = new CheckoutApi({
  merchantId:     process.env.MERCHANT_ID,
  merchantSecret: process.env.MERCHANT_SECRET,
  baseUrl:        process.env.BASE_URL,
  sendRequest:    (url, data) => new Promise(resolve => resolve('Mock response'))
});
```

## Example

You can take a look at a minimal example in the [example folder](https://github.com/TuureKaunisto/checkout-api/tree/master/example). It is meant only for displaying the basic functionalities of this library. A real app would not be structured like this.

You can run the example by typing (in the example folder):
```bash
npm install
node index.js
```
and opening [http://localhost:3000](http://localhost:3000) in your browser