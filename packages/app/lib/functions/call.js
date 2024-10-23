import * as defaultFunctions from 'app/lib/functions/functions-default';
import * as customFunctions from 'app/lib/functions/functions.js';

export const callFn = (function () {
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
            functionCache[functionName] = defaultFunctions[functionName]; // Кэшируем результат
            return defaultFunctions[functionName].apply(null, argsArray); // Вызов с аргументами
        }

        console.error(`Function ${functionName} not found in either custom or default functions.`);
    };
})();