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
