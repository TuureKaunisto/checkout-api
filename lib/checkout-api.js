'use strict';

var request   = require('request-promise'),
    crypto    = require('crypto'),
    md5       = require('md5'),
    xml2json  = require('xml2json'),
    moment    = require('moment');

const PAYMENT_FIELDS = [
        'VERSION',
        'STAMP',
        'AMOUNT',
        'REFERENCE',
        'MESSAGE',
        'LANGUAGE',
        'MERCHANT',
        'RETURN',
        'CANCEL',
        'REJECT',
        'DELAYED',
        'COUNTRY',
        'CURRENCY',
        'DEVICE',
        'CONTENT',
        'TYPE',
        'ALGORITHM',
        'DELIVERY_DATE',
        'FIRSTNAME',
        'FAMILYNAME',
        'ADDRESS',
        'POSTCODE',
        'POSTOFFICE'
      ],
      RETURN_FIELDS = [
        'VERSION',
        'STAMP',
        'REFERENCE',
        'PAYMENT',
        'STATUS',
        'ALGORITHM'
      ];

class CheckoutApi {

  constructor(options) {
    this.merchantId = options.merchantId;
    this.merchantSecret = options.merchantSecret;
    this.baseUrl = options.baseUrl;
    this.sendRequest = options.sendRequest || sendRequest;

    // merge given defaults to pre-defined default values
    this.defaults = Object.assign({
      VERSION:        '0001', // this is currently always 0001
      LANGUAGE:       'FI', // use Finnish as the default language
      COUNTRY:        'FIN',
      MERCHANT:       this.merchantId,
      RETURN:         this.baseUrl + '/payment-return',
      CANCEL:         this.baseUrl + '/payment-cancel',
      DELAYED:        this.baseUrl + '/payment-delayed',
      REJECT:         this.baseUrl + '/payment-cancel',
      CURRENCY:       'EUR', // use euro as the default currency
      DEVICE:         10, // 1 = HTML, 10 = XML (options.responseType overrides this)
      CONTENT:        1, // 1 = normal, 2 = adult entertainment
      TYPE:           0, // currently always 0
      ALGORITHM:      3 // MD5 (atm the checkout system doesn't offer a more secure option)
    }, options.defaults);
  }

  setDefaults(data) {
    // set the default values
    if (!data.DELIVERY_DATE) {
      data.DELIVERY_DATE = moment().format('YYYYMMDD') // use current date as default
    }
    // combine the default values and the given data
    return Object.assign(this.defaults, data);
  }

  preparePayment(data, options) {
    // set default options (if they're not defined in the options object)
    options = parseOptions(options);
    // validate the given fields
    validateData(data, options);
    // set the default values
    data = this.setDefaults(data);
    // calculate the MAC and add it to the data
    data.MAC = this.calcMac(data);

    // send the https request
    return this.sendRequest('https://payment.checkout.fi', data)
    .then(resp => this.processPaymentResponse(resp, options));
  }

  processPaymentResponse(resp, options) {
    // if the json option is set, convert the xml to json
    if (options.responseType === 'json') {
      return parseXML(resp);
    } 
    // otherwise just return the response (xml or html)
    return resp;
  }

  calcMac(data, isReturnMsg) {
    // the payment message uses + as separator and md5 hashes
    var str = concatFields(PAYMENT_FIELDS, data, '+'),
        hashFunc = s => md5(s + '+' + this.merchantSecret);

    // the return message uses & as separator and sha256 hashes
    if (isReturnMsg) {
      str = concatFields(RETURN_FIELDS, data, '&');
      hashFunc = s => crypto.createHmac('sha256', this.merchantSecret).update(s).digest('hex');
    }

    // hash the whole thing and make it uppercase
    return hashFunc(str).toUpperCase();
  }

  validateReturnMsg(data) {
    // compare the given mac and the one calculated from the whole data
    return data.MAC === this.calcMac(data, true);
  }
}

// throw an exception if something is out of line
function validateData(data, options) {
  // make sure all the required values are set
  ['STAMP', 'AMOUNT', 'REFERENCE'].forEach(field => {
    if (Object.keys(data).indexOf(field) === -1) {
      throw { name: 'MissingParameter', message: `The field: ${ field } is required`};
    }
  });

  // disallow too small amounts
  if ( (!options.allowSmallPurchases && data.AMOUNT < 100) || data.AMOUNT < 0 ) {
    throw { name : 'InvalidAmount', message : 'The min. amount is 100' }; 
  }

  // the device parameter can't be overriden
  if (options.responseType === 'html') {
    data.DEVICE = 1;
  } else {
    data.DEVICE = 10;
  }
}

// make sure the options object includes the supported values
function parseOptions(options) {
  options = options || {};
  options.responseType = options.responseType || 'json';
  options.allowSmallPurchases = options.allowSmallPurchases || false;
  
  return options;
}

function parseXML(resp) {
  try {
    var jsObject = JSON.parse(xml2json.toJson(resp));
    // make empty nodes into empty strings instead of empty objects
    clearEmptyObjects(jsObject);
    return jsObject;
  } catch (err) {
    console.log(err);
    return resp;
  }
}

function concatFields(fields, data, sep) {
  // concatenate all the parameters into one long string separated by the separator
  return fields.reduce((prev, current, index) => {
    current = findKey(current, data, '');

    if (index === 1) {
      prev = findKey(prev, data, '');
    }

    return prev + sep + current;
  });
}

// return a default value if property is not found
function findKey(key, obj, notFound) {
  if (Object.keys(obj).indexOf(key) !== -1) {
    return obj[key];
  }

  return notFound;
}

// default function for sending requests with request-promise
function sendRequest(url, data) {
  return request.post({
      url: url,
      form: data
  });
}

// recursively make empty objects empty strings instead
function clearEmptyObjects(obj) {
  for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        if (typeof obj[property] === 'object') {
          if (Object.keys(obj[property]).length === 0) {
            obj[property] = '';
          } else {
            clearEmptyObjects(obj[property]);
          }
        }
      }
  }
}

module.exports = CheckoutApi