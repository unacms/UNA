export type PageTitleProps = {
    data?: {
        name?: string;
        /** The title UNA shows: its custom title (Studio → Pages → page → Title), else the page's name. */
        cover_title?: string;
        cover?: unknown; cover_hidden_on?: unknown; title_show?: unknown; title_hidden_on?: unknown; page_status?: unknown } | null;
};
