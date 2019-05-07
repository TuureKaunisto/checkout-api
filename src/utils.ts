import { get, set } from 'lodash';

export class Utils {
	static setIfEmpty(obj: object, path: string, value: any): void {
		if (!get(obj, path)) {
			set(obj, path, value);
		}
	}

	static camelCaseToDashes(str: string): string {
		// Note: If support for special characters is needed, a specialized library may be a good idea
		const dashed = str.replace(/([a-z])([A-Z])/g, '$1-$2');
		return dashed.toLowerCase();
	}
}
