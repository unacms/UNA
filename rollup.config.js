import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',

    output: {
        file: 'plugins_public/bundle.js',
        format: 'iife',
    },

    plugins: [
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        resolve({ browser: true }),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            compilerOptions: { noEmit: false },
        }),
    ],
};
