import { Pressable, View } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Button } from 'app/design/controls'
import { memo, useCallback } from 'react'
import { FeedbackHaptics } from 'app/lib/util';

const Menu = memo(({ items, onSelect, setBottomSheetData }) => {

    const handlePressMenu = useCallback(
        (item) => (event) => {
            FeedbackHaptics('Medium');
            setBottomSheetData(false);
            onSelect(item, event);
        },
        [onSelect, setBottomSheetData]
    );

    return (
        <View className='w-full mt-0 mb-2'>
            {items.map(
                (item, index) =>
                    <View key={item.id} className='mb-0'><Button
                        variant="text"
                        size="base"
                        fullWidth
                        onPress={handlePressMenu(item)}
                        align="start"
                        title={item.title}
                    /></View>
            )}
        </View>
    );
});

export default function (oProps) {

    const { setBottomSheetData } = useBottomSheetData();

    const handlePress = useCallback(() => {
        FeedbackHaptics('Medium')
        setBottomSheetData({ title: 'Menu options', showClose: true, snapPoints: ['10%', '50%'], content: <Menu items={oProps.items} onSelect={oProps.onSelect} setBottomSheetData={setBottomSheetData} /> });
    }, [setBottomSheetData, oProps]);


    return (
        <Pressable onPress={handlePress}>{oProps.children}</Pressable>
    );
}





