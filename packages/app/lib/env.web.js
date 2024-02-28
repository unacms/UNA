export function env(key) {
    if (key == 'UNA_URL')
        return process.env.NEXT_PUBLIC_UNA_URL;
    if (key == 'APP_URL')
        return process.env.NEXT_PUBLIC_APP_URL;
    
    return process.env[key];
}