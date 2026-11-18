/** Props shared by the web sidebar and its native stand-in. */
export type AppSidebarProps = {
    /** The page's JSON from UNA: its `url` marks the current row. */
    pageData?: { url?: string; uri?: string } | null;
};
