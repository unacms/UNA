import { useEffect, useState } from "react";
import { isObjectsEqual } from 'app/lib/util'

/** `value` after it stops changing for `delay` ms (deep-compared, so equal objects don't retrigger). */
export default function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (!isObjectsEqual(debouncedValue, value)){
                setDebouncedValue(value);
            }
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay, debouncedValue]); 
    return debouncedValue;
}