/**
 * Props of the `menu_navigation` header-toolbar component (`header_toolbar` item `props`).
 * The web / Android popup passes the rest to its NeoButton trigger.
 */
export type MenuHeaderNavigationProps = {
    /** Trigger icon (Lucide name). */
    image?: string;
    /** Legacy name for `image`. */
    startDecorator?: string;
    accessibilityLabel?: string;
    /** Legacy name for `accessibilityLabel`. */
    alt?: string;
    /**
     * Guests below `sm`: Log In and Sign Up in the menu too, for a toolbar that has no
     * Log In button of its own there.
     */
    auth?: boolean;
    [key: string]: unknown;
};
