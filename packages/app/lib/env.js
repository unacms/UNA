import Constants from 'expo-constants';

export function env(key) {
    // For web environments, use process.env with NEXT_PUBLIC_ prefix for client-side access
    if (typeof window !== 'undefined') {
        // Web client-side environment
        if (key === 'UNA_URL') return process.env.NEXT_PUBLIC_UNA_URL;
        if (key === 'APP_URL') {
            // For APP_URL, prefer env var but fallback to current domain
            return process.env.NEXT_PUBLIC_APP_URL || `${window.location.protocol}//${window.location.host}`;
        }
        if (key === 'UNA_API_KEY') return process.env.NEXT_PUBLIC_UNA_API_KEY;
        if (key === 'APP_ORIGIN') return process.env.NEXT_PUBLIC_APP_ORIGIN;
        if (key === 'HOST') return process.env.NEXT_PUBLIC_HOST;
        if (key === 'PORT') return process.env.NEXT_PUBLIC_PORT;
        if (key === 'PROTO') return process.env.NEXT_PUBLIC_PROTO;
        return process.env[key];
    }
    
    // For native environments, use Expo Constants
    try {
        return Constants.expoConfig.extra[key];
    } catch (error) {
        // Fallback for server-side Next.js or when Constants is not available
        if (key === 'UNA_URL') return process.env.NEXT_PUBLIC_UNA_URL || process.env.UNA_URL;
        if (key === 'APP_URL') {
            // For server-side, use Vercel's VERCEL_URL if available
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
            if (appUrl) return appUrl;
            if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
            return 'http://localhost:3000'; // fallback for local development
        }
        if (key === 'UNA_API_KEY') return process.env.NEXT_PUBLIC_UNA_API_KEY || process.env.UNA_API_KEY;
        if (key === 'APP_ORIGIN') return process.env.NEXT_PUBLIC_APP_ORIGIN || process.env.APP_ORIGIN;
        if (key === 'HOST') return process.env.NEXT_PUBLIC_HOST || process.env.HOST;
        if (key === 'PORT') return process.env.NEXT_PUBLIC_PORT || process.env.PORT;
        if (key === 'PROTO') return process.env.NEXT_PUBLIC_PROTO || process.env.PROTO;
        return process.env[key];
    }
}