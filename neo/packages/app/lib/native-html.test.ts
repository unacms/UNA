/// <reference types="node" />
// Run with `node --test packages/app/lib/native-html.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { addParagraphGaps, toNativeInlineTags } from './native-html.ts';

test('semantic inline tags become the ones the native renderer reads', () => {
    assert.equal(
        toNativeInlineTags('<p><strong>Bold</strong>, <EM class="x">italic</EM>, <ins>added</ins>, <del>gone</del>, <strike>old</strike></p>'),
        '<p><b>Bold</b>, <i>italic</i>, <u>added</u>, <s>gone</s>, <s>old</s></p>',
    );
});

test('no bold inside headings, which are bold already', () => {
    assert.equal(
        toNativeInlineTags('<h3><strong>Our mission</strong></h3><p><strong>True</strong></p><h2 class="a"><b>T</b>wo <em>x</em></h2>'),
        '<h3>Our mission</h3><p><b>True</b></p><h2 class="a">Two <i>x</i></h2>',
    );
    assert.equal(toNativeInlineTags('<h3><b class="x">Title</b></h3>'), '<h3>Title</h3>');
});

test('nested lists and long articles', () => {
    assert.equal(
        addParagraphGaps('<ul><li><p>a</p><ol><li><p>b</p><p>c</p></li></ol><p>d</p></li></ul><p>after</p>'),
        '<ul><li><p>a</p><ol><li><p>b</p><p>c</p></li></ol><p>d</p></li></ul><br><p>after</p>',
    );
    const paragraphs = Array.from({ length: 20000 }, (_, i) => `<p>Paragraph ${i}</p>`);
    const started = performance.now();
    assert.equal(addParagraphGaps(paragraphs.join('')), paragraphs.join('<br>'));
    assert.ok(performance.now() - started < 1000, 'one pass, not a rescan per paragraph');
});

test('other tags and lookalike names are left alone', () => {
    const html = '<p><b>b</b> <i>i</i> <strongest>x</strongest> <a href="/em">em</a></p>';
    assert.equal(toNativeInlineTags(html), html);
});

test('a blank line between paragraphs', () => {
    assert.equal(addParagraphGaps('<p>One</p><p>Two</p><p>Three</p>'), '<p>One</p><br><p>Two</p><br><p>Three</p>');
});

test('headings, lists and quotes are spaced like paragraphs', () => {
    assert.equal(
        addParagraphGaps('<h1>Title</h1><p>Lead</p><ul><li>a</li></ul><blockquote>q</blockquote><h2 class="x">Next</h2>'),
        '<h1>Title</h1><br><p>Lead</p><br><ul><li>a</li></ul><br><blockquote>q</blockquote><br><h2 class="x">Next</h2>',
    );
});

test('whitespace between blocks is replaced by the gap', () => {
    assert.equal(addParagraphGaps('<p>One</p>\n  <p>Two</p>'), '<p>One</p><br><p>Two</p>');
});

test('no gap next to an empty paragraph, which is a blank line already', () => {
    const html = '<p>One</p><p></p><p>Two</p><p><br></p><p>Three</p><p>&nbsp;</p>';
    assert.equal(addParagraphGaps(html), html);
});

test('paragraphs inside list items keep their spacing', () => {
    const html = '<ul><li><p>a</p><p>b</p></li></ul>';
    assert.equal(addParagraphGaps(html), html);
});

test('a single block, inline text and empty input are left alone', () => {
    assert.equal(addParagraphGaps('<p>Only</p>'), '<p>Only</p>');
    assert.equal(addParagraphGaps('Plain <b>text</b>'), 'Plain <b>text</b>');
    assert.equal(addParagraphGaps(''), '');
});
