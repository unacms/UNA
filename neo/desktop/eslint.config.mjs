import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// The desktop app and its API client are linted from this folder alone, with the React rules NEO
// lints with (its eslint-config-next set, without the rules for Next pages), so NEO's own lint
// does not know this folder and this one needs nothing of NEO's.
const unused = ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }];

const config = [
    {
        ignores: ['**/node_modules/**', 'dist/**', 'src-tauri/**', 'una-api/src/schema.ts'],
    },
    {
        files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
        plugins: { react, 'react-hooks': reactHooks, import: importPlugin, 'jsx-a11y': jsxA11y },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: { ...globals.browser, ...globals.node },
        },
        settings: { react: { version: 'detect' } },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'import/no-anonymous-default-export': 'warn',
            'react/no-unknown-property': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-no-target-blank': 'off',
            'jsx-a11y/alt-text': ['warn', { elements: ['img'] }],
            'jsx-a11y/aria-props': 'warn',
            'jsx-a11y/aria-proptypes': 'warn',
            'jsx-a11y/aria-unsupported-elements': 'warn',
            'jsx-a11y/role-has-required-aria-props': 'warn',
            'jsx-a11y/role-supports-aria-props': 'warn',
            'no-unused-vars': unused,
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        plugins: { '@typescript-eslint': tseslint.plugin },
        languageOptions: { parser: tseslint.parser, parserOptions: { sourceType: 'module' } },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': unused,
        },
    },
];

export default config;
