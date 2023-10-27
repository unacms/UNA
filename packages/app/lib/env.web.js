
export function env(key) {
    return process.env[key];
}

export function isCustom(key) {
    return env('UNA_URL') == "https://ci.una.io/test3" ? false : true;
}