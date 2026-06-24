export function env(key) {
    if (key == 'UNA_URL')
        return process.env.NEXT_PUBLIC_UNA_URL || process.env.UNA_URL;
    if (key == 'APP_URL')
        return process.env.NEXT_PUBLIC_APP_URL;
    if (key == 'GOOGLE_MAPS_API_KEY')
        return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (key == 'GOOGLE_WEB_CLIENT_ID')
        return process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_WEB_CLIENT_ID;

    return process.env[key];
}