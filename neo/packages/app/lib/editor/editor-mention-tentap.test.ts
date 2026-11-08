/// <reference types="node" />
// Run with `node --test packages/app/lib/editor/editor-mention-tentap.test.ts` from the NEO root.
//
// tentap inserts buildUnaMentionHtml() with editor.setContent(), so the link goes through
// TipTap's Link mark (configured with class bx-mention-link in editor-inner.js) before it is
// saved. This runs that mark's own parse and render rules headless, then applies UNA's
// BxDolMetatags::keywordsAdd / mentionsAdd regexes to the saved link.
import assert from 'node:assert/strict';
import test from 'node:test';
import { getSchema } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Link from '@tiptap/extension-link';
import { buildUnaMentionHtml } from './editor-mention-shared.ts';

const schema = getSchema([Document, Paragraph, Text, Link.configure({ HTMLAttributes: { class: 'bx-mention-link' } })]);

/** The HTML tentap's editor saves for an inserted <a>...</a>. */
function throughLinkMark(html: string) {
    const m = html.match(/^<a\b([^>]*)>([\s\S]*)<\/a>$/);
    assert.ok(m, 'expected one <a>');
    const attrs: Record<string, string> = {};
    for (const a of m[1]!.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]!] = a[2]!;
    const el = { getAttribute: (name: string) => attrs[name] ?? null };

    const type = schema.marks.link!;
    const rule = type.spec.parseDOM!.find((r) => 'tag' in r && r.tag === 'a[href]')!;
    const parsed = (rule as any).getAttrs(el);
    assert.notEqual(parsed, false, 'Link mark rejected the link');
    const [tag, out] = type.spec.toDOM!(type.create(parsed), true) as [string, Record<string, string | null>];
    const attrText = Object.entries(out)
        .filter(([, v]) => v != null)
        .map(([k, v]) => ` ${k}="${v}"`)
        .join('');
    return `<${tag}${attrText}>${m[2]}</${tag}>`;
}

/** Hashtags BxDolMetatags::keywordsAdd finds in the content. */
function unaKeywords(html: string) {
    const text = ' ' + html.replace(/<a\b((?!bx-tag-link)[^>])*>(.*?)<\/a>/gis, '').replace(/<[^>]*>/g, '');
    return [...text.matchAll(/[\p{Cc}\p{Z}\p{Ps}\p{Pe}\p{Pi}\p{Pf}]#(\p{L}[\p{L}\p{N}_]+)/gu)].map((x) => x[1]);
}

/** Profile ids BxDolMetatags::mentionsAdd finds in the content. */
function unaMentions(html: string) {
    return [...html.matchAll(/data-profile-id=(?:"([0-9A-Za-z]+)"|'([0-9A-Za-z]+)'|([0-9A-Za-z]+))/gu)].map((x) => x[1] ?? x[2] ?? x[3]);
}

test('a hashtag inserted by tentap keeps bx-tag-link through the Link mark and is indexed', () => {
    const saved = throughLinkMark(buildUnaMentionHtml({ label: 'travel', value: 12, url: '/tag/travel' }, '#'));
    // The mark merges its configured class in: "bx-mention-link bx-tag-link". UNA only
    // needs bx-tag-link somewhere in the tag, and NEO's load path reads it as a hashtag.
    assert.match(saved, /class="[^"]*\bbx-tag-link\b[^"]*"/);
    assert.match(saved, />#travel</);
    assert.deepEqual(unaKeywords(`<p>Go ${saved} now</p>`), ['travel']);
    assert.deepEqual(unaMentions(saved), []);
});

test('a mention inserted by tentap still carries its profile id', () => {
    const saved = throughLinkMark(buildUnaMentionHtml({ label: 'Ann', value: 5, url: '/u/ann' }));
    assert.deepEqual(unaMentions(saved), ['5']);
    assert.deepEqual(unaKeywords(saved), []);
});
