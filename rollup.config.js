import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

export default {
    input: 'tmp/ts-out/index.js',

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
    ],
};
