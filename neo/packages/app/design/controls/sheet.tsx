import { Modal } from 'app/design/controls/modal';
import type { SheetProps } from './sheet.types';

/**
 * A titled sheet with close and optional back buttons. iOS presents a native SwiftUI sheet
 * (sheet.ios.tsx); web and Android use the JS Modal, where `fitContent` has no effect.
 */
export function Sheet({ visible, title, onClose, onBack, children }: Readonly<SheetProps>) {
    return (
        <Modal onVisible={visible} title={title} onClose={onClose} onBack={onBack} scrollable>
            {children}
        </Modal>
    );
}
