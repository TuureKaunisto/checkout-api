export interface CheckoutHeaders {
	// Checkout account ID, eg. 375917
	'checkout-account': string,
	// Used signature algorithm, either sha256 or sha512
	'checkout-algorithm': 'sha256' | 'sha512',
	// HTTP verb of the request, either GET or POST
	'checkout-method': 'GET' | 'POST',
	// Unique identifier for this request
	'checkout-nonce': string,
	// ISO 8601 date time
	'checkout-timestamp': string
	// Checkout transaction ID when accessing single transaction - not required for a new payment request
	'checkout-transaction-id'?: string,
	'content-type'?: string,
}

export interface CheckoutBody {
	// Merchant unique identifier for the order
	stamp: string,
	// Order reference
	reference: string,
	// Total amount of the payment in currency's minor units, eg. for Euros use cents. Must match the total sum of items.
	amount: number,
	// Currency, only EUR supported at the moment
	currency: 'EUR',
	// Payment's language, currently supported are FI, SV, and EN
	language: 'FI' | 'SV' | 'EN',
	// Used for eg. Collector payments order ID. If not given, merchant reference is used instead.
	orderId?: string,
	// Array of items
	items: CheckoutItem[],
	// Customer information
	customer: CheckoutCustomer,
	deliveryAddress?: CheckoutAddress,
	invoicingAddress?: CheckoutAddress,
	// Where to redirect browser after a payment is paid or cancelled
	redirectUrls: CheckoutCallbackUrl,
	// Which url to ping after this payment is paid or cancelled
	callbackUrls?: CheckoutCallbackUrl,
}

export interface CheckoutItem {
	// Price per unit, VAT included, in each country's minor unit, e.g. for Euros use cents
	unitPrice: number,
	// Quantity, how many items ordered
	units: number,
	// VAT percentage e.g. 24
	vatPercentage: number,
	// Merchant product code. May appear on invoices of certain payment methods
	productCode: string,
	// When is this item going to be delivered e.g. 2019-12-31
	deliveryDate: string,
	// Item description. May appear on invoices of certain payment methods.
	description?: string,
	// Merchant specific item category
	category?: string,
	// Item level order ID (suborder ID). Mainly useful for Shop-in-Shop purchases.
	orderId?: string,
	// Unique identifier for this item. Required for Shop-in-Shop payments.
	stamp?: string,
	// Reference for this item. Required for Shop-in-Shop payments.
	reference?: string,
	// Merchant ID for the item. Required for Shop-in-Shop payments, do not use for normal payments.
	merchant?: string,
	// Shop-in-Shop commission. Do not use for normal payments.
	commission?: {
		// Merchant who gets the commission
		merchant: string,
		// Amount of commission in currency's minor units, eg. for Euros use cents. VAT not applicable.
		amount: number
	}
}

export interface CheckoutCustomer {
	email: string,
	firstName?: string,
	lastName?: string,
	phone?: string,
	// VAT ID, if any e.g. FI02454583
	vatId?: string
}

export interface CheckoutAddress {
	streetAddress: string,
	postalCode: string,
	city: string,
	// County / State
	county?: string,
	// Alpha-2 country code e.g. SE
	country: string
}

export interface CheckoutCallbackUrl {
	// Called on successful payment
	success: string,
	// Called on cancelled payment
	cancel: string
}
