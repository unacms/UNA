import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',

    output: {
        file: 'plugins_public/bundle.js',
        format: 'iife',
    },

    plugins: [
        resolve({ browser: true }),
        commonjs(),
        typescript({ tsconfig: './tsconfig.json' }),
    ],
};
