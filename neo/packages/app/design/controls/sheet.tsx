import { Modal } from 'app/design/controls/modal';
import type { SheetProps } from './sheet.types';

/**
 * A titled sheet with close and optional back buttons. iOS presents a native SwiftUI sheet
 * (sheet.ios.tsx); web and Android use the JS Modal, where `fitContent` has no effect.
 */
export function Sheet({ visible, title, onClose, onBack, children }: Readonly<SheetProps>) {
    return (
        // No line under the title and the iOS sheet's insets, so the sheet looks the same everywhere.
        <Modal onVisible={visible} title={title} onClose={onClose} onBack={onBack} headerBorder={false} padding="px-4 pt-2 pb-4" scrollable>
            {children}
        </Modal>
    );
}
