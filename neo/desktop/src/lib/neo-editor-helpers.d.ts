/**
 * NEO's own conversion between its editor's mentions and UNA's links
 * (neo/packages/app/components/form-fields/editor-mention-html.js), which the round-trip tests
 * of lib/rich-html.ts run on the desktop app's HTML and NEO's.
 */
declare module '*/editor-mention-html.js' {
    /** On save: enriched `<mention>` to `<a class="bx-mention-link" data-profile-id href>Name</a>`. */
    export function mentionsToUnaLinks(html: string): string;
    /** On load: UNA mention and tag links to enriched `<mention indicator text>`. */
    export function unaLinksToMentions(html: string): string;
    export function linkifyHtml(html: string): string;
}
