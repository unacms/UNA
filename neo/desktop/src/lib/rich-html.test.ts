import { describe, expect, it } from 'vitest';

import { linkifyHtml, mentionsToUnaLinks, unaLinksToMentions } from '../../../packages/app/components/form-fields/editor-mention-html.js';
import { htmlToDoc } from '../components/rich-editor/schema';
import { docToHtml, docToText, type EditorMode, linkifyText, MODE_TAGS, textToDoc, textToRichHtml } from './rich-html';

const PROFILE = 'https://community.example/u/lily';
/** UNA's Quill mention, the form the app writes. */
const QUILL_MENTION = `<a href="${PROFILE}" title="Lily Hart" dchar="@" data-profile-id="4" class="bx-mention-link">@Lily Hart</a>`;

const roundTrip = (html: string, mode: EditorMode) => docToHtml(htmlToDoc(html, mode), mode);
const tagsOf = (html: string) => [...new Set([...html.matchAll(/<\/?([a-z0-9]+)\b/gi)].map((m) => m[1]!.toLowerCase()))];

describe('stored HTML read and written', () => {
    it('writes a mention in Quill’s form, whichever form it was read in', () => {
        const variants = [
            // UNA's Quill
            QUILL_MENTION,
            // NEO: no @, no title
            `<a class="bx-mention-link" data-profile-id="4" href="${PROFILE}">Lily Hart</a>`,
            // NEO's buildUnaMentionHtml, its class carrying the id
            `<a class="bx-mention-link data-profile-id=4 " data-profile-id="4" href="${PROFILE}">Lily Hart</a>`,
            // seeded content
            `<a class="bx-mention bx-link" data-profile-id="4" href="${PROFILE}">@Lily Hart</a>`,
        ];
        for (const v of variants) {
            expect(roundTrip(`<p>Hi ${v} there</p>`, 'mini')).toBe(`<p>Hi ${QUILL_MENTION} there</p>`);
            expect(roundTrip(`<p>Hi ${v} there</p>`, 'full')).toBe(`<p>Hi ${QUILL_MENTION} there</p>`);
        }
    });

    it('reads a mention as one atom with its profile', () => {
        const doc = htmlToDoc(`<p>${QUILL_MENTION}</p>`, 'mini');
        expect(doc.content?.[0]?.content?.[0]).toMatchObject({ type: 'mention', attrs: { id: '4', label: 'Lily Hart', href: PROFILE } });
    });

    it('keeps typed hashtags as text, and picked ones as the site’s tag link', () => {
        expect(roundTrip('<p>Going #hiking today</p>', 'mini')).toBe('<p>Going #hiking today</p>');
        const picked = '<a class="bx-tag-link" dchar="#" href="https://community.example/tags/hiking">#hiking</a>';
        expect(roundTrip(`<p>${picked}</p>`, 'mini')).toBe(`<p>${picked}</p>`);
        // NEO's bx-tag, without the #
        expect(roundTrip('<p><a class="bx-tag" href="https://community.example/tags/hiking">hiking</a></p>', 'mini')).toBe(`<p>${picked}</p>`);
        // Quill's, with dchar and an id
        expect(roundTrip('<p><a href="https://community.example/tags/hiking" title="hiking" dchar="#" data-profile-id="0" class="bx-tag-link">#hiking</a></p>', 'full')).toBe(`<p>${picked}</p>`);
    });

    it('keeps embeds and inline images in full mode', () => {
        const una = '<div class="bx-embed-link" source="https://video.example/v/1">https://video.example/v/1</div>';
        expect(roundTrip(una, 'full')).toBe(una);
        // what the site's purifier leaves of an embed that showed its card
        expect(roundTrip('<div class="bx-embed-link" source="https://video.example/v/1"><a href="https://video.example/v/1">A video</a></div>', 'full')).toBe(una);
        const neo = '<p><img src="https://community.example/storage.php?o=sys_images_editor&amp;f=abc.jpg#neo-embed=https%3A%2F%2Fvideo.example%2Fv%2F1"></p>';
        expect(roundTrip(neo, 'full')).toBe(neo);
        const inline = '<p>Look <img src="https://community.example/storage.php?o=sys_images_editor&amp;f=xyz.png" alt="A map" width="640" height="480"> here</p>';
        expect(roundTrip(inline, 'full')).toBe(inline);
    });

    it('keeps full formatting as Quill writes it', () => {
        const html =
            '<p><strong>b</strong> <em>i</em> <u>u</u> <s>s</s> <code>c</code> <strong><em>both</em></strong></p>' +
            '<h2>Title</h2><h3>Sub</h3>' +
            '<ul><li>one</li><li>two</li></ul><ol start="3"><li>three</li></ol>' +
            '<blockquote>quoted</blockquote><pre>code\n  indented &lt;b&gt;</pre>' +
            '<p class="ql-align-center">centred</p><p><br></p><p>after a blank line<br>and a break</p>';
        expect(roundTrip(html, 'full')).toBe(html);
    });

    it('writes only a, p, br and span in mini mode', () => {
        const rich =
            `<h2>Title</h2><p><strong>bold</strong> ${QUILL_MENTION} <img src="https://x.example/a.png"></p>` +
            '<ul><li>one</li></ul><blockquote>q</blockquote><pre>x\ny</pre><div class="bx-embed-link" source="https://v.example/1">https://v.example/1</div>';
        const out = roundTrip(rich, 'mini');
        expect(tagsOf(out).every((t) => MODE_TAGS.mini.includes(t))).toBe(true);
        expect(out).toContain(QUILL_MENTION);
        expect(out).toContain('<a href="https://v.example/1">https://v.example/1</a>');
    });

    it('is stable: what it writes reads back to the same HTML', () => {
        for (const mode of ['mini', 'full'] as const) {
            for (const html of [`<p>${QUILL_MENTION} see example.com</p>`, '<p>a</p><p><br></p><p>b</p>', '<h2>x</h2><ul><li><p>a</p><p>b</p></li></ul>']) {
                const once = roundTrip(html, mode);
                expect(roundTrip(once, mode)).toBe(once);
            }
        }
    });

    it('drops links it would not open, and leaves out empty paragraphs at the ends', () => {
        expect(roundTrip('<p><a href="javascript:alert(1)">x</a></p>', 'full')).toBe('<p>x</p>');
        expect(roundTrip('<p><br></p><p>a</p><p></p>', 'mini')).toBe('<p>a</p>');
        expect(roundTrip('<p> </p>', 'mini')).toBe('');
        expect(roundTrip('<p><img src="data:image/png;base64,AAAA"></p>', 'full')).toBe('');
    });
});

describe('linkify', () => {
    it('links URLs, bare domains and emails as NEO does', () => {
        expect(linkifyText('see example.com, https://x.org/a_(b). or mail me@site.dev')).toBe(
            'see <a href="https://example.com">example.com</a>, <a href="https://x.org/a_(b)">https://x.org/a_(b)</a>. or mail <a href="mailto:me@site.dev">me@site.dev</a>',
        );
        expect(linkifyText('#tags.com and @lily.dev are not links; <b> is text')).toBe('#tags.com and @lily.dev are not links; &lt;b&gt; is text');
    });

    it('leaves text in links and code alone', () => {
        expect(roundTrip('<p><a href="https://a.example">see b.example</a> <code>c.example</code></p>', 'full')).toBe('<p><a href="https://a.example">see b.example</a> <code>c.example</code></p>');
    });

    it('agrees with NEO’s linkifyHtml', () => {
        const typed = '<p>see example.com and https://x.org/a. mail me@site.dev</p>';
        expect(roundTrip(typed, 'mini')).toBe(linkifyHtml(typed));
    });
});

describe('plain text', () => {
    it('is a line per paragraph or break, with mentions and hashtags as text', () => {
        const doc = htmlToDoc(`<p>Hi ${QUILL_MENTION}</p><p><br></p><p>#trip<br>tomorrow</p>`, 'mini');
        expect(docToText(doc)).toBe('Hi @Lily Hart\n\n#trip\ntomorrow');
    });

    it('reads back the way it was written', () => {
        const text = 'one\n\ntwo\nthree';
        expect(docToText(textToDoc(text))).toBe(text);
        expect(textToRichHtml(text)).toBe('<p>one</p><p><br></p><p>two</p><p>three</p>');
    });
});

describe('the same text in NEO and here', () => {
    const neoMention = '<mention indicator="@" text="@Lily Hart" data-profile-id="4" href="https://community.example/u/lily">@Lily Hart</mention>';

    it('reads what NEO writes', () => {
        // NEO's save: enriched mentions to UNA links, then linkify
        const neoSaved = linkifyHtml(mentionsToUnaLinks(`<p>Hi ${neoMention} see example.com</p>`));
        const doc = htmlToDoc(neoSaved, 'mini');
        expect(doc.content?.[0]?.content?.find((n) => n.type === 'mention')).toMatchObject({ attrs: { id: '4', label: 'Lily Hart', href: PROFILE } });
        expect(docToHtml(doc, 'mini')).toBe(`<p>Hi ${QUILL_MENTION} see <a href="https://example.com">example.com</a></p>`);
    });

    it('is read by NEO as the mention it wrote', () => {
        const ours = docToHtml(htmlToDoc(`<p>Hi ${QUILL_MENTION}</p>`, 'mini'), 'mini');
        const neoLoaded = unaLinksToMentions(ours);
        expect(neoLoaded).toBe(`<p>Hi <mention indicator="@" text="@Lily Hart" data-profile-id="4" href="${PROFILE}">@Lily Hart</mention></p>`);
        // and NEO saving it again changes nothing here
        expect(roundTrip(mentionsToUnaLinks(neoLoaded), 'mini')).toBe(ours);
    });

    it('keeps a picked hashtag through NEO', () => {
        const ours = '<p><a class="bx-tag-link" dchar="#" href="https://community.example/tags/hiking">#hiking</a></p>';
        const neoLoaded = unaLinksToMentions(ours);
        expect(neoLoaded).toContain('indicator="#"');
        expect(roundTrip(mentionsToUnaLinks(neoLoaded), 'mini')).toBe(ours);
    });

    it('leaves NEO nothing to link again', () => {
        const ours = roundTrip('<p>see example.com and https://x.org/a</p>', 'mini');
        expect(linkifyHtml(ours)).toBe(ours);
    });
});
