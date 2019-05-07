import { Utils } from '../src/utils';

describe('setIfEmpty', () => {
	it('Should set the given value if target is empty', () => {
		const obj = { foo: 'bar' };
		Utils.setIfEmpty(obj, 'lorem', 'ipsum');
		expect(obj).toEqual({ foo: 'bar', lorem: 'ipsum' });
	});

	it('Should not set the given value if target is already set', () => {
		const obj = { foo: 'bar' };
		Utils.setIfEmpty(obj, 'foo', 'baz');
		expect(obj).toEqual({ foo: 'bar' });
	});
});

describe('camelCaseToDashes', () => {
	it('Should convert camel case to kebab case', () => {
		expect(Utils.camelCaseToDashes('loremIpsumDolorSitAmet')).toBe('lorem-ipsum-dolor-sit-amet');
	});

	it('Should not add a dash in front of a leading capital letter', () => {
		expect(Utils.camelCaseToDashes('FooBarBaz')).toBe('foo-bar-baz');
	});

	it('Should work with existing dashed', () => {
		expect(Utils.camelCaseToDashes('Foo-barBaz')).toBe('foo-bar-baz');
	});

	it('Should not add a dash if there already is one', () => {
		expect(Utils.camelCaseToDashes('Foo-BarBaz')).toBe('foo-bar-baz');
	});
});
