import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from 'app/design/controls';
import { useIsFocused } from 'app/lib/hooks/router';
import { useIsDesktop } from 'app/context/measure';
import { useSearchWindowState, useOpenSearchWindow, useCloseSearchWindow } from 'app/context/jotai/search-window';
import SearchWindow from './search-window';

/** Whether a key press belongs to a text field or an editor of the page (they keep their own Cmd/Ctrl+K). */
function isEditable(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || typeof el.closest !== 'function') return false;
    if (el.closest('[role="dialog"]')) return false;
    return !!el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
}

/**
 * The search window's dialog, once per page: whatever opens it (the header's Search, a section's or context's
 * Search, Cmd/Ctrl+K on the web) sets the query it opens with. A dialog on desktop, the whole screen elsewhere.
 */
export default function SearchWindowHost() {
    const { t } = useTranslation();
    const state = useSearchWindowState();
    const open = useOpenSearchWindow();
    const close = useCloseSearchWindow();
    const isDesktop = useIsDesktop();
    const isFocused = useIsFocused();

    // Cmd/Ctrl+K: global search
    useEffect(() => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.altKey || String(event.key).toLowerCase() !== 'k') return;
            if (isEditable(event.target)) return;
            event.preventDefault();
            open({});
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    // native tabs each have their page: only the one on screen opens it
    if (Platform.OS !== 'web' && !isFocused) return null;

    return (
        <Modal
            onVisible={state.open}
            onClose={close}
            accessibilityLabel={t('Search')}
            position={isDesktop ? 'top' : 'center'}
            maxWidth="max-w-2xl"
            padding="p-0"
            fillHeight={!isDesktop}
            scrollable
            skipUnsavedGuard
        >
            {state.open && <SearchWindow key={JSON.stringify(state.query)} initialQuery={state.query} mode="modal" onClose={close} />}
        </Modal>
    );
}
