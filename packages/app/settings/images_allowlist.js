/** Next.js Image remotePatterns — hostname allowlist для next/image */
const ImageRemotePatternsDefault = [
    { protocol: 'http', hostname: 'localhost', pathname: '**' },
    { protocol: 'https', hostname: 'api.neo.so', pathname: '**' },
    { protocol: 'https', hostname: 'ci.una.io', pathname: '**' },
    { protocol: 'https', hostname: 'app.una.io', pathname: '**' },
];

const custom = require('app/customization/config/images_allowlist');
const ImageRemotePatternsCustom = custom.ImageRemotePatterns || [];

const seen = new Set();
const ImageRemotePatterns = [...ImageRemotePatternsDefault, ...ImageRemotePatternsCustom].filter((p) => {
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