import type { Ref } from 'react';

import { t } from '../lib/i18n';
import { useSettings } from '../lib/settings';
import { Dialog, type DialogHandle } from './dialog';
import { ShortcutList } from './shortcut-list';

/**
 * `dismiss` closes the sheet without sending focus back: a menu command chosen while the sheet
 * is open runs next, and the page under the sheet must not be inert any more when it moves focus.
 */
export type ShortcutsDialogHandle = DialogHandle;

type Props = { open: boolean; onClose: () => void; mac: boolean; handle?: Ref<ShortcutsDialogHandle> };

/**
 * The keyboard shortcut sheet (? or Help > Keyboard Shortcuts). A modal <dialog>: it keeps
 * focus inside, Esc closes it, and focus goes back where it was.
 */
export function ShortcutsDialog({ open, onClose, mac, handle }: Props) {
    const { singleKeyShortcuts } = useSettings();

    return (
        <Dialog open={open} onClose={onClose} className="dialog" labelledBy="shortcuts-title" handle={handle}>
            <div className="dialog-head">
                <h2 id="shortcuts-title">{t('Keyboard shortcuts')}</h2>
                <button className="btn btn-quiet icon-btn" aria-label={t('Close')} onClick={onClose}>
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div className="dialog-body">
                <ShortcutList mac={mac} singleKeys={singleKeyShortcuts} labelledBy="shortcuts-title" />
                {!singleKeyShortcuts ? <p className="muted small">{t('Single-key shortcuts are off (Settings, Keyboard).')}</p> : null}
                <p className="muted small">
                    {t(
                        'Single keys such as ? and Esc do nothing while you type in a text box. J, K, O and . act on the list when focus is in the list pane; L, C and P act on the post (or comment) that has focus, R on the focused comment or the open thread or conversation.',
                    )}
                </p>
            </div>
        </Dialog>
    );
}
