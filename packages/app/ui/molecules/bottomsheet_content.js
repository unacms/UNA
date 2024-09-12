import { useEffect, useState, useMemo, useCallback } from 'react';
import BottomSheet2 from 'app/ui/molecules/bottomsheet';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { View, ScrollView } from 'app/design/view';
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';

export default function ElementCommentForm(props) {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    const [isShow, setIsShow] = useState(false);

    useEffect(() => {
        if (bottomSheetData?.content) {
            setIsShow(true);
        }
        else{
            if (isShow){
                setIsShow(false); 
            }
        }
    }, [bottomSheetData?.content]);

    useEffect(() => {
        if (!isShow) {
            setBottomSheetData(null);
            if (onCloseCallback) onCloseCallback();
        }
    }, [isShow]);

    const {
        isListView = false,
        showClose = true,
        title,
        header,
        content,
        footer,
        snapPoints,
        onClose: onCloseCallback
    } = bottomSheetData || {};

    const onClose = useCallback(() => {
        setIsShow(false);
       
    }, []);

    const bottomSheetHeader = useMemo(() => (
        <>
            {title && (
                <View className=''>
                    <Text className='text-neutral-700 dark:text-neutral-200 text-center text-xl font-bold mb-2'>
                        {title}
                    </Text>
                </View>
            )}
            {showClose && (
                <View className='absolute right-2 z-50 top-2 '>
                    <Button startDecorator="X" tooltip='Close' variant='text' size='sm' onPress={onClose} />
                </View>
            )}
            {header}
        </>
    ), [title, showClose, header, onClose]);

    const contentView = useMemo(() => (
        <View className="mx-auto w-full flex-1 px-4">
            {content}
            {footer}
        </View>
    ), [content, footer]);

    const bottomSheetProps = useMemo(() => ({
        open: isShow,
        blocking: false,
        snapPoints,
        isListView,
        header: bottomSheetHeader
    }), [isShow, snapPoints, isListView, bottomSheetHeader]);

    if (!isShow)
        return <></>

    return (
        <BottomSheet2 {...bottomSheetProps}>
            <View className="mx-auto w-full flex-1 flex-auto py-2 h-full">
                {bottomSheetHeader}
                {isListView ? contentView : (
                    <ScrollView className='w-full' keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
                        {contentView}
                    </ScrollView>
                )}
            </View>
        </BottomSheet2>
    );
}