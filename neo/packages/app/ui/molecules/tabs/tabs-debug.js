/**
 * Opt-in Tabs diagnostics. In dev, set before reproducing:
 *   globalThis.__NEO_TABS_DEBUG__ = true
 * Watch Metro for [Tabs:…] lines (render storms, sync loops, layout churn).
 */
export function tabsDebug(..._args) {
    if (!__DEV__) return;
    if (!globalThis.__NEO_TABS_DEBUG__) return;
}
