import { parse as flatted_parse, stringify as flatted_stringify } from 'flatted';

/** Structural equality via flatted serialization (handles cycles; key order matters). */
export function isObjectsEqual(obj: unknown, obj2: unknown): boolean {
    return flatted_stringify(obj) == flatted_stringify(obj2)
}

export function cloneObject<T>(obj: T): T {
    return flatted_parse(flatted_stringify(obj))
}

export function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
        return true;
    }

    if (typeof obj1 != "object" || obj1 === null ||
        typeof obj2 != "object" || obj2 === null) {
        return false;
    }

    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);

    if (keys1.length != keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

export function mergeDeep(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

function isObject(item: unknown): item is Record<string, any> {
    return !!(item && typeof item === 'object' && !Array.isArray(item));
}

/** Parse a loose JS-style object literal (unquoted keys, single quotes); null on failure. */
export function strToObj(s: string): any {
    try {
        const jsonReadyString = s
            .replace(/\s*([{}[\],:])\s*/g, '$1') // Remove spaces around {}, [], :, ,
            .replace(/([{,])([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Wrap keys in double quotes
            .replace(/'/g, '"') // Replace single quotes with double quotes
            .replace(/,\s*}/g, '}') // Remove trailing commas before }
            .replace(/,\s*]/g, ']') // Remove trailing commas before ]
            .trim(); // Trim leading/trailing whitespace
        const a = JSON.parse(jsonReadyString);
        return a
    } catch (error) {
        return null
    }
}

export function filterContent(dataOrig: any, needed: string[]): any {
    let data = cloneObject(dataOrig);
    for (let cell in data.elements) {
        data.elements[cell] = data.elements[cell].filter((obj: any) => needed.includes(obj.source));
    }
    return data;
}
