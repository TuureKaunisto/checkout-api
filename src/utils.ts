import { get, set } from 'lodash';

export class Utils {
	static setIfEmpty(obj: object, path: string, value: any): void {
		if (!get(obj, path)) {
			set(obj, path, value);
		}
	}
}
