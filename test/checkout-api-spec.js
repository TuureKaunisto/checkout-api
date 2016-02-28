require('dotenv').config();

var expect = require('chai').expect,
    CheckoutApi = require('../lib/checkout-api');

describe('CheckoutApi', () => {
  var mockPayments = new CheckoutApi({
    merchantId:     process.env.MERCHANT_ID,
    merchantSecret: process.env.MERCHANT_SECRET,
    baseUrl:        process.env.BASE_URL,
    sendRequest:    () => new Promise(resolve => resolve('Test response'))
  });

  var payments = new CheckoutApi({
    merchantId:     process.env.MERCHANT_ID,
    merchantSecret: process.env.MERCHANT_SECRET,
    baseUrl:        process.env.BASE_URL
  });

  describe('.calcMac', () => {
    it('should return correct checksums', () => {
      // these are calculated with the test credentials
      var preCalculated = [
        {
          data: {},
          hash: '84C602C020D216977272E2A4F0E2C083'
        },
        {
          data: { STAMP: 5672, AMOUNT: 450, LANGUAGE: 'FI' },
          hash: '9507F1ADC0BF1F058715A623BFA7D3E8'
        },
        {
          data: { STAMP: '', AMOUNT: 101, DELIVERY_DATE: '10092011' },
          hash: '345E1038471C7AE613F560FD794FE7D0'
        },
      ];

      preCalculated.forEach(row => {
        var mac = mockPayments.calcMac(row.data);
        expect(mac).to.equal(row.hash);
      });

    });
  });

  describe('.preparePayment', () => {
    it('should throw an error with too small amounts if allowSmallPurchases is not set', () => {
      // check that this list of invalid values all throw an error
      [99, 0, -1, '', false].forEach(invalidValue => {
        expect(mockPayments.preparePayment.bind(
          mockPayments,
          { AMOUNT: invalidValue, STAMP: '123', REFERENCE: '456' }
        )).to.throw({ name : 'InvalidAmount' });
      });

      // negative amounts are not allowed even if the allowSmallPurchases flag is set
      expect(mockPayments.preparePayment.bind(
        mockPayments,
        { AMOUNT: -1, STAMP: '123', REFERENCE: '456' },
        { allowSmallPurchases: true }
      )).to.throw({ name : 'InvalidAmount' });

      expect(mockPayments.preparePayment.bind(mockPayments,
        { AMOUNT: 99, STAMP: '123', REFERENCE: '456' },
        { allowSmallPurchases: true }
      )).to.not.throw();
    });

    it('should throw an error if required values are not set', () => {
      // check that this list of invalid values all throw an error
      [
        {},
        { AMOUNT: 150, STAMP: '123' },
        { AMOUNT: 150, REFERENCE: '456' },
        { STAMP: 123, REFERENCE: '456' }
      ].forEach(invalidValues => {
        expect(mockPayments.preparePayment.bind(mockPayments, invalidValues)).to.throw({ name : 'MissingParameter' });
      });

      expect(mockPayments.preparePayment.bind(
        mockPayments,
        { AMOUNT: 150, STAMP: '123', REFERENCE: '456' },
        { allowSmallPurchases: true }
      )).to.not.throw();
    });

    it('should override default values and get a correct response from checkout.fi', (done) => {
      payments.preparePayment({ AMOUNT: 150, STAMP: Math.round(Math.random()*100000), REFERENCE: '456', LANGUAGE: 'EN' }).then(resp => {
        console.log(resp);

        // make sure the override has worked
        expect(resp.trade.language).to.equal('EN');
        // make sure we get banks buttons in the response
        expect(Object.keys(resp.trade.payments.payment.banks).length).to.be.above(9);
        done();
      });
    });
  });

  describe('.validateReturnMsg', () => {
    it('should return true with valid MAC values', () => {
      // the mac is calculated with the test credentials
      expect(mockPayments.validateReturnMsg({
        VERSION: '0001',
        STAMP: '70315',
        REFERENCE: '12345',
        PAYMENT: '35307992',
        STATUS: 2,
        ALGORITHM: 3,
        MAC: '0C5CB93715B2DEAA8793D8C95953836536B42BD8D17B86241C7A1F0A626FFEF2'
      })).to.equal(true);
    });

    it('should return false with invalid MAC values', () => {
      expect(mockPayments.validateReturnMsg({
        VERSION: '0001',
        STAMP: '70316',
        REFERENCE: '12345',
        PAYMENT: '35307992',
        STATUS: 2,
        ALGORITHM: 3,
        MAC: '0C5CB93715B2DEAA8793D8C95953836536B42BD8D17B86241C7A1F0A626FFEF2'
      })).to.equal(false);
    });
  });
});