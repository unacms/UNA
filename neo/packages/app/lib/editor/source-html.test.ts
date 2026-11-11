/// <reference types="node" />
// Run with `node --test packages/app/lib/editor/source-html.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import { htmlTableToMarkdown, preToCodeBlock, sourceToEditorHtml } from './source-html.ts';

test('a pre block keeps its lines, entities included', () => {
    assert.equal(
        preToCodeBlock('<p>x</p><pre><code>&lt;h1&gt;\n  &lt;neo-slot&gt;\n&lt;/h1&gt;</code></pre>'),
        '<p>x</p><codeblock><p>&lt;h1&gt;</p><p>  &lt;neo-slot&gt;</p><p>&lt;/h1&gt;</p></codeblock>',
    );
    assert.equal(preToCodeBlock('<pre>a<br>b<br/><b>c</b></pre>'), '<codeblock><p>a</p><p>b</p><p>c</p></codeblock>');
    assert.equal(preToCodeBlock('<pre>{ "group": "profile" }</pre>'), '<codeblock><p>{ "group": "profile" }</p></codeblock>');
});

test('a table becomes GFM Markdown with its header, alignment and inline formatting', () => {
    const table = `<table><thead><tr><th>Change</th><th style="text-align: center">RC4</th></tr></thead>
        <tbody><tr><td><strong>Remember</strong> me</td><td>No <a href="https://example.com/x">switch</a></td></tr>
        <tr><td>NEO font</td><td><code>a|b</code></td></tr></tbody></table>`;
    assert.equal(htmlTableToMarkdown(table), [
        '| Change | RC4 |',
        '| --- | :---: |',
        '| **Remember** me | No [switch](https://example.com/x) |',
        '| NEO font | `a\\|b` |',
    ].join('\n'));
});

test('short rows are padded, an empty table is dropped', () => {
    assert.equal(htmlTableToMarkdown('<table><tr><td>a</td><td>b</td></tr><tr><td>c</td></tr></table>'), '| a | b |\n| --- | --- |\n| c |  |');
    assert.equal(htmlTableToMarkdown('<table></table>'), null);
});

test('source HTML gets code blocks and table placeholders', () => {
    const out = sourceToEditorHtml('<p>a</p><table><tr><th>x</th></tr><tr><td>1</td></tr></table><pre>l1\nl2</pre>', (md) => `<p><img alt="${md.length}"></p>`);
    assert.equal(out, '<p>a</p><p><img alt="19"></p><codeblock><p>l1</p><p>l2</p></codeblock>');
    assert.equal(sourceToEditorHtml('<p>plain</p>', () => 'x'), '<p>plain</p>');
});

test('plain cell text keeps its meaning: Markdown characters are escaped', () => {
    assert.equal(
        htmlTableToMarkdown('<table><tr><th>[Docs](https://x.com) **bold** _x_ a\\b</th></tr></table>'),
        '| \\[Docs\\](https://x.com) \\*\\*bold\\*\\* \\_x\\_ a\\\\b |\n| --- |',
    );
});

test('code spans hold backticks and entities as written', () => {
    assert.equal(htmlTableToMarkdown('<table><tr><td><code>a`b</code></td><td><code>&lt;b&gt; | x</code></td></tr></table>'),
        '| ``a`b`` | `<b> \\| x` |\n| --- | --- |');
});

test('a blank line inside pre is kept as an empty line', () => {
    assert.equal(preToCodeBlock('<pre>\na\n\nb\n</pre>'), '<codeblock><p>a</p><p>&nbsp;</p><p>b</p></codeblock>');
});
