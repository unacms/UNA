/** Next.js Image remotePatterns — hostname allowlist for next/image */
const ImageRemotePatternsDefault = [
    { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    { protocol: 'https', hostname: 'api.neo.so', pathname: '/**' },
    { protocol: 'https', hostname: 'ci.una.io', pathname: '/**' },
    { protocol: 'https', hostname: 'app.una.io', pathname: '/**' },
];

// The configured backend and, for CI previews, every api-pr-<n> host of the preview domain.
// Literal process.env names: the browser bundle only inlines NEXT_PUBLIC_* written out in full.
const hostOf = (url) => { try { return url ? new URL(url).hostname : ''; } catch { return ''; } };
const configuredUnaHost = hostOf(process.env.NEXT_PUBLIC_UNA_URL || process.env.UNA_URL);
const previewDomain = process.env.NEXT_PUBLIC_UNA_PREVIEW_DOMAIN || process.env.UNA_PREVIEW_DOMAIN;
const ImageRemotePatternsEnv = [
    ...(configuredUnaHost ? [{ protocol: 'https', hostname: configuredUnaHost, pathname: '/**' }] : []),
    ...(previewDomain ? [{ protocol: 'https', hostname: `*.${previewDomain}`, pathname: '/**' }] : []),
];

const custom = require('app/customization/config/images-allowlist');
const ImageRemotePatternsCustom = custom.ImageRemotePatterns || [];

const normalizeRemotePattern = (pattern) => {
    if (!pattern?.pathname) {
        return pattern;
    }

    let pathname = pattern.pathname;
    if (!pathname.startsWith('/')) {
        pathname = pathname === '**' ? '/**' : `/${pathname}`;
    }

    if (pathname === pattern.pathname) {
        return pattern;
    }

    return { ...pattern, pathname };
};

const seen = new Set();
const ImageRemotePatterns = [...ImageRemotePatternsDefault, ...ImageRemotePatternsEnv, ...ImageRemotePatternsCustom].map(normalizeRemotePattern).filter((p) => {
    const key = `${p.protocol}//${p.hostname}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
});

const ImageAllowlistHostnames = ImageRemotePatterns.map((p) => p.hostname);

module.exports = {
    ImageRemotePatterns,
    ImageAllowlistHostnames,
};