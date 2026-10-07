import nextConfig from 'eslint-config-next';
import { fileURLToPath } from 'node:url';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/.next/**',
            '**/.expo/**',
            '**/ios/**',
            '**/android/**',
            '**/next-env.d.ts',
            '**/uniwind-types.d.ts',
            '**/md4c-emscripten.cjs',
        ],
    },
    ...nextConfig,
    {
        settings: { next: { rootDir: fileURLToPath(new URL('./apps/next/', import.meta.url)) } },
        rules: {
            'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
        },
    },
    {
        files: ['packages/app/**/*.{js,jsx,ts,tsx}', 'apps/expo/**/*.{js,jsx,ts,tsx}'],
        rules: {
            // Shared/native components use UNA's module prop and platform image atoms.
            '@next/next/no-assign-module-variable': 'off',
            '@next/next/no-img-element': 'off',
            '@next/next/no-html-link-for-pages': 'off',
        },
    },
];
