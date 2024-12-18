import { useEffect, useState } from "react";
import { isObjectsEqual } from 'app/lib/util'

export default function useDebounce(value, delay) {
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