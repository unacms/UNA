/** Next.js Image remotePatterns — hostname allowlist for next/image */
const ImageRemotePatternsCustom = [
    { protocol: 'https', hostname: 'test.neo.so', pathname: '**' },
];

module.exports = { ImageRemotePatterns: ImageRemotePatternsCustom };