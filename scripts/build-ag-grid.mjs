/**
 * Bundle AG Grid Community into plugins_public/ag-grid (UMD/IIFE + Quartz CSS).
 * Run from the repository root: npm run build:ag-grid
 */
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { minify } from 'uglify-js';

const sRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sOut = join(sRoot, 'plugins_public', 'ag-grid');
const sPkg = join(sRoot, 'node_modules', 'ag-grid-community');

mkdirSync(sOut, { recursive: true });

const oBundle = await rollup({
    input: join(sRoot, 'scripts', 'ag-grid-entry.js'),
    plugins: [
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        resolve({ browser: true }),
        commonjs(),
    ],
    onwarn(oWarning, fWarn) {
        if (oWarning.code === 'CIRCULAR_DEPENDENCY')
            return;
        fWarn(oWarning);
    },
});

const { output } = await oBundle.generate({
    format: 'iife',
    name: 'bxAgGrid',
    exports: 'named',
});
await oBundle.close();

const oMin = minify(output[0].code, { compress: true, mangle: true });
if (oMin.error)
    throw oMin.error;

writeFileSync(join(sOut, 'ag-grid.min.js'), oMin.code);

const sStyles = join(sPkg, 'styles');
copyFileSync(join(sStyles, 'ag-grid.min.css'), join(sOut, 'ag-grid.min.css'));
copyFileSync(join(sStyles, 'ag-theme-quartz.min.css'), join(sOut, 'ag-theme-quartz.min.css'));
copyFileSync(join(sPkg, 'LICENSE.txt'), join(sOut, 'LICENSE.txt'));
