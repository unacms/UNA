/**
 * Bottom Sheet Content - Web Implementation
 * 
 * On web, we always use Modal instead of bottom sheet.
 * This avoids the @gorhom/bottom-sheet dependency on web.
 */

import { useCallback } from 'react';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { View, ScrollView } from 'app/design/view';
import { Modal } from 'app/design/controls';
import { useWindowHeight } from 'app/context/measure';

export default function ElementBottomSheetContent(props) {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    const windowHeight = useWindowHeight();

    const handleClose = useCallback(() => {
        setBottomSheetData(null);
        if (bottomSheetData?.onClose) {
            bottomSheetData.onClose();
        }
    }, [setBottomSheetData, bottomSheetData]);

    if (!bottomSheetData) return null;

    // On web, always use Modal
    return (
        <Modal
            title={bottomSheetData.title}
            onVisible={true}
            onClose={handleClose}
            padding={bottomSheetData?.modal?.padding}
            transparent={true}
        >
            <View className='w-full' style={{ maxHeight: windowHeight - 100 }}>
                <ScrollView className='w-full'>
                    {bottomSheetData.content}
                    {bottomSheetData.footer}
                </ScrollView>
            </View>
        </Modal>
    );
}

