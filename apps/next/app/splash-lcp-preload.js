/**
 * Guest splash LCP images live in /public/svg/. Render inside `<head>` so Next.js
 * hoists preload hints into the document head (body `<link>` tags are ignored).
 */
export default function SplashLcpPreload() {
    return (
        <head>
            <link
                rel="preload"
                as="image"
                href="/svg/splash-light.svg"
                media="(prefers-color-scheme: light)"
                fetchPriority="high"
            />
            <link
                rel="preload"
                as="image"
                href="/svg/splash-dark.svg"
                media="(prefers-color-scheme: dark)"
                fetchPriority="high"
            />
        </head>
    );
}
