/** Next.js Image remotePatterns — hostname allowlist для next/image */
const ImageRemotePatternsCustom = [
    { protocol: 'https', hostname: 'test.neo.so', pathname: '**' },
];

module.exports = { ImageRemotePatterns: ImageRemotePatternsCustom };