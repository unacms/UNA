import { describe, expect, it } from 'vitest';

import { byCodeUnit } from '../../lib/compare';
import { canonicalHtml } from './round-trip';

describe('the form two texts are compared in', () => {
    it('sorts by code unit, as a bare sort() does, in any locale', () => {
        // localeCompare puts "a" before "B" and "é" before "z": a canonical form must not follow it
        expect(['a', 'B', 'é', 'z', 'Z', '_', 'a1', 'a'].sort(byCodeUnit)).toEqual(['B', 'Z', '_', 'a', 'a', 'a1', 'z', 'é']);
    });

    it('has classes, attributes and nested formatting in one order however they are written', () => {
        expect(canonicalHtml('<p class="b B a" title="t" id="i"><em><strong>x</strong></em></p>')).toBe(canonicalHtml('<p id="i" title="t" class="a b B"><strong><em>x</em></strong></p>'));
        expect(canonicalHtml('<p class="b B a">x</p>')).toBe('<p class="B a b">x</p>');
        expect(canonicalHtml('<p class="a b">x</p>')).not.toBe(canonicalHtml('<p class="a c">x</p>'));
    });

    it('reads a style without the semicolons and the white space around it, and without its alignment', () => {
        expect(canonicalHtml('<p style=" ; color: red; ;">x</p>')).toBe('<p style="color: red">x</p>');
        expect(canonicalHtml('<p style="text-align: center; color: red;">x</p>')).toBe('<p :align="center" style="color: red">x</p>');
        expect(canonicalHtml('<p style=" ;; ">x</p>')).toBe('<p>x</p>');
    });

    it('collapses white space, joins neighbours with the same formatting and drops the space a text ends with', () => {
        expect(canonicalHtml('<p> a  <b>b</b><strong> c </strong> <br> d <i> </i></p>')).toBe('<p>a <m[strong]>b c </m><br>d</p>');
        expect(canonicalHtml('<p>a<span> b</span> <span class="k">c</span></p><p> </p>')).toBe('<p>a b <m[span class="k"]>c</m></p>');
    });

    it('keeps formatting around a block as a difference, and a picture and a line break as pieces of the text', () => {
        expect(canonicalHtml('<b><p>x</p></b>')).toBe('<m[strong]><p>x</p></m>');
        expect(canonicalHtml('<p><a href="https://a.example/x" class="bx-link" target="_blank">read</a> <img src="a.png" alt=""></p>')).toBe('<p><m[a href="https://a.example/x"]>read</m> <img src="a.png"></p>');
    });

    it('reads a style of any length in one pass', () => {
        // separators that end in something else: the regular expression this replaced tried each of them again
        const style = `color: red${'; '.repeat(100_000)}x`;
        const started = performance.now();
        const form = canonicalHtml(`<p style="${style}">x</p>`);
        expect(performance.now() - started).toBeLessThan(2000);
        expect(form).toBe(`<p style="${style}">x</p>`);
    });
});
