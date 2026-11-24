/// <reference types="node" />
// Run with `node --test packages/app/components/form-fields/editor-mention-html.test.ts` from the NEO root.
import assert from 'node:assert/strict';
import test from 'node:test';
import { mentionsToUnaLinks, unaLinksToMentions, schemeBareLinks, EDITOR_LINK_RE } from './editor-mention-html.js';
import { buildUnaMentionHtml, mentionAttributesForUser, mentionDisplayText } from '../../lib/editor/editor-mention-shared.ts';

const TAG_URL = 'https://example.com/searchKeyword.php?keyword=travel';

test('a picked hashtag saves in the form UNA indexes', () => {
    // Web insert: the mark text has no "#"; it carries the keyword id the suggestion row had.
    const web = `<p>Hi <mention indicator="#" text="travel" data-profile-id="12" href="${TAG_URL}" class="bx-mention-link">travel</mention>&nbsp;</p>`;
    assert.equal(
        mentionsToUnaLinks(web),
        `<p>Hi <a class="bx-tag-link" dchar="#" title="travel" href="${TAG_URL}">#travel</a>&nbsp;</p>`,
    );
    // Native insert keeps the indicator in the text.
    assert.equal(
        mentionsToUnaLinks(`<mention indicator="#" text="#travel" href="${TAG_URL}">#travel</mention>`),
        `<a class="bx-tag-link" dchar="#" title="travel" href="${TAG_URL}">#travel</a>`,
    );
});

test('a saved hashtag has no data-profile-id, so UNA does not read it as a mention', () => {
    const out = mentionsToUnaLinks(`<mention indicator="#" text="travel" data-profile-id="12" href="${TAG_URL}">travel</mention>`);
    assert.doesNotMatch(out, /data-profile-id/);
});

test('mentions still save as bx-mention-link with the profile id', () => {
    assert.equal(
        mentionsToUnaLinks('<mention indicator="@" text="@Ann" data-profile-id="5" href="/u/ann">@Ann</mention>'),
        '<a class="bx-mention-link" data-profile-id="5" href="/u/ann">Ann</a>',
    );
});

test('UNA and old NEO hashtag links load as hashtag marks', () => {
    const expected = `<mention indicator="#" text="#travel" href="${TAG_URL}">#travel</mention>`;
    // UNA's Quill editor (it puts the keyword id in data-profile-id; dropped here).
    assert.equal(
        unaLinksToMentions(`<a href="${TAG_URL}" title="travel" dchar="#" data-profile-id="12" class="bx-tag-link">#travel</a>`),
        expected,
    );
    // This NEO, and UNA's rendered hashtag.
    assert.equal(unaLinksToMentions(`<a class="bx-tag-link" dchar="#" title="travel" href="${TAG_URL}">#travel</a>`), expected);
    assert.equal(unaLinksToMentions(`<a class="bx-tag-link" rel="tag" href="${TAG_URL}"><s>#</s><b>travel</b></a>`), expected);
    // Older NEO builds.
    assert.equal(unaLinksToMentions(`<a class="bx-tag" href="${TAG_URL}">travel</a>`), expected);
});

test('mention links load as mention marks', () => {
    assert.equal(
        unaLinksToMentions('<a href="/u/ann" title="Ann" dchar="@" data-profile-id="5" class="bx-mention-link">@Ann</a>'),
        '<mention indicator="@" text="@Ann" data-profile-id="5" href="/u/ann">@Ann</mention>',
    );
    // tentap's class also carries "data-profile-id=5"; the attribute read must not pick that up.
    assert.equal(
        unaLinksToMentions('<a class="bx-mention-link data-profile-id=5 " data-profile-id="5" href="/u/ann">Ann</a>'),
        '<mention indicator="@" text="@Ann" data-profile-id="5" href="/u/ann">@Ann</mention>',
    );
});

test('other links are left alone', () => {
    const html = '<a class="bx-tagged" href="/x">x</a> <a href="/y">y</a>';
    assert.equal(unaLinksToMentions(html), html);
});

test('a hashtag survives a load and save round trip', () => {
    const saved = `<p>Go <a class="bx-tag-link" dchar="#" title="travel" href="${TAG_URL}">#travel</a></p>`;
    assert.equal(mentionsToUnaLinks(unaLinksToMentions(saved)), saved);
    const old = `<p>Go <a class="bx-tag" href="${TAG_URL}">travel</a></p>`;
    assert.equal(mentionsToUnaLinks(unaLinksToMentions(old)), saved);
});

test('tentap builds the same hashtag and mention links', () => {
    assert.equal(
        buildUnaMentionHtml({ label: 'travel', value: 12, url: TAG_URL }, '#'),
        `<a class="bx-tag-link" dchar="#" title="travel" href="${TAG_URL}">#travel</a>`,
    );
    assert.equal(
        buildUnaMentionHtml({ label: 'Ann', value: 5, url: '/u/ann' }),
        '<a class="bx-mention-link data-profile-id=5 " data-profile-id="5" href="/u/ann">Ann</a>',
    );
});

test('a picked hashtag mark shows "#" and carries no profile id', () => {
    const row = { label: 'travel', value: 12, url: TAG_URL };
    assert.equal(mentionDisplayText(row, '#'), '#travel');
    assert.equal(mentionDisplayText({ ...row, label: '#travel' }, '#'), '#travel');
    assert.deepEqual(mentionAttributesForUser(row, '#'), { href: TAG_URL, class: 'bx-tag-link' });
    assert.equal(mentionDisplayText({ label: 'Ann ', value: 5 }), 'Ann');
    assert.deepEqual(mentionAttributesForUser({ label: 'Ann', value: 5, url: '/u/ann' }), {
        'data-profile-id': '5',
        href: '/u/ann',
        class: 'bx-mention-link',
    });
});

test('a tentap-saved hashtag (Link mark class merged in) loads as a hashtag mark', () => {
    assert.equal(
        unaLinksToMentions(`<a target="_blank" rel="noopener noreferrer nofollow" class="bx-mention-link bx-tag-link" href="${TAG_URL}" title="travel">#travel</a>`),
        `<mention indicator="#" text="#travel" href="${TAG_URL}">#travel</mention>`,
    );
});

test('the editor links URLs and known domains as you type, not file names', () => {
    const links = (word: string) => [...word.matchAll(new RegExp(EDITOR_LINK_RE.source, 'gi'))].map((m) => m[0]);
    assert.deepEqual(links('Next.js'), []);
    assert.deepEqual(links('editor-inner.js'), []);
    assert.deepEqual(links('config.ts'), []);
    assert.deepEqual(links('unacms.com'), ['unacms.com']);
    assert.deepEqual(links('https://github.com/unacms/UNA/issues'), ['https://github.com/unacms/UNA/issues']);
    assert.deepEqual(links('www.example.org/x'), ['www.example.org/x']);
});

test('a link the editor made from a bare domain saves with https://', () => {
    assert.equal(
        schemeBareLinks('<p>Deploy on <a href="unacms.com">unacms.com</a> now</p>'),
        '<p>Deploy on <a href="https://unacms.com">unacms.com</a> now</p>',
    );
    assert.equal(
        schemeBareLinks('<a target="_blank" rel="noopener" href="www.example.org/x?y=1">www.example.org/x</a>'),
        '<a target="_blank" rel="noopener" href="https://www.example.org/x?y=1">www.example.org/x</a>',
    );
    assert.equal(schemeBareLinks(`<a href='docs.unacms.com'>docs</a>`), `<a href='https://docs.unacms.com'>docs</a>`);
    // An apostrophe in a double-quoted href, an uppercase tag from the HTML source, "$" in a URL.
    assert.equal(schemeBareLinks(`<a href="example.com/it's">x</a>`), `<a href="https://example.com/it's">x</a>`);
    assert.equal(schemeBareLinks('<A HREF="unacms.com">x</A>'), '<A HREF="https://unacms.com">x</A>');
    assert.equal(schemeBareLinks('<a href="example.com/?q=$&amp;r=$1">x</a>'), '<a href="https://example.com/?q=$&amp;r=$1">x</a>');
});

test('links with a scheme, paths, mentions and hashtags keep their href', () => {
    const kept = [
        '<a href="https://unacms.com">unacms.com</a>',
        '<a href="http://unacms.com">x</a>',
        '<a href="mailto:a@unacms.com">a@unacms.com</a>',
        '<a href="/d/she-s-nearly-ready">post</a>',
        '<a href="#top">top</a>',
        '<a href="searchKeyword.php?keyword=x">x</a>',
        '<a class="bx-mention-link" data-profile-id="3" href="u.com">Ann</a>',
        `<a class="bx-tag-link" dchar="#" title="travel" href="travel.com">#travel</a>`,
        '<a data-href="unacms.com">x</a>',
    ];
    for (const html of kept) assert.equal(schemeBareLinks(html), html);
});
