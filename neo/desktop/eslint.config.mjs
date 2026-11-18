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
    {
        // A query key is made by the module that owns the data (`activityKey(id)`, `TASKS_KEY`),
        // never written out where it is used: a key spelled by hand that matches no query fails
        // silently (the cache is not updated, nothing says so). Tests may spell them.
        files: ['src/**/*.{ts,tsx}'],
        ignores: ['src/**/*.test.{ts,tsx}'],
        rules: {
            'no-restricted-syntax': [
                'error',
                { selector: "Property[key.name='queryKey'] > ArrayExpression", message: 'Use a query-key helper of the module that owns the data, not a key written by hand.' },
                {
                    selector: "CallExpression[callee.property.name=/^(invalidateQueries|refetchQueries|cancelQueries|removeQueries|resetQueries|setQueryData|getQueryData|getQueryState|setQueriesData|getQueriesData|fetchQuery|prefetchQuery)$/] > ArrayExpression.arguments:first-child",
                    message: 'Use a query-key helper of the module that owns the data, not a key written by hand.',
                },
            ],
        },
    },
];

export default config;
