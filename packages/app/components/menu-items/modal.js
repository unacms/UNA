import { useCallback, useState } from 'react';
import { Modal } from 'app/design/controls';
import { View } from 'app/design/view';
import { fetcher } from 'app/lib/fetcher';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import emitter, { EVENTS } from 'app/context/emitter';
import MenuItemActionBase from 'app/lib/menu-item-helpers';

async function openModalFromRequest(oProps, setFormBlock) {
    const requestUrl = oProps?.data?.request_url;
    if (!requestUrl) return;

    const response = await fetcher('/api.php?r=' + requestUrl);
    setFormBlock({
        content: response?.data,
        designbox_id: 0,
        title: oProps.title,
    });
}

export default function MenuItemModal(oProps) {
    const [formBlock, setFormBlock] = useState(null);

    const handlePress = () => {
        void openModalFromRequest(oProps, setFormBlock);
    };

    const handleClose = useCallback(() => {
        setFormBlock(null);
    }, []);

    // After form submit success: close modal and reload wiki page.
    // Emit is a no-op when no wiki listener is mounted.
    const handleFormEmpty = useCallback(() => {
        setFormBlock(null);
        emitter.emit(EVENTS.wiki, { action: 'reload' });
    }, []);

    const formModal = formBlock ? (
        <Modal
            title={formBlock.title || ' '}
            onVisible={!!formBlock}
            onClose={handleClose}
            scrollable
            transparent
        >
            <View className="px-3 sm:px-4">
                <BlockByData
                    block={formBlock}
                    onFormEmpty={handleFormEmpty}
                    exProps={{
                        onClose: handleClose,
                        resetOnSubmit: true,
                        formOnly: true,
                    }}
                />
            </View>
        </Modal>
    ) : null;

    return (
        <MenuItemActionBase
            item={oProps}
            icon={oProps.icon || ''}
            onPress={handlePress}
            extra={formModal}
        />
    );
}
