import * as defaultFunctions from 'app/lib/parts/parts-default';
import * as customFunctions from 'app/lib/parts/parts.js';

export const getPart = (function () {
    const functionCache = {};

    return function (functionName, argsArray) {
        if (functionCache[functionName]) {
            return functionCache[functionName].apply(null, argsArray); 
        }

        if (typeof customFunctions[functionName] === 'function') {
            functionCache[functionName] = customFunctions[functionName]; 
            return customFunctions[functionName].apply(null, argsArray); 
        }

        if (typeof defaultFunctions[functionName] === 'function') {
            functionCache[functionName] = defaultFunctions[functionName]; 
            return defaultFunctions[functionName].apply(null, argsArray); 
        }

        console.log(`Function ${functionName} not found in either custom or default functions.`, argsArray);
    };
})();