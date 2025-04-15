import { Pressable, View } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Button } from 'app/design/controls'
import { memo, useCallback, useEffect } from 'react'
import { FeedbackHaptics } from 'app/lib/util';
import { Keyboard } from 'react-native'
import { Alert } from 'react-native';
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
                    <View key={item.id} className={' ' + (index != items.length - 1 ? 'mb-1 border-b border-bdr dark:border-bdr-d ' : '')}>
                        <Button
                            variant="text"
                            size="base"
                            fullWidth
                            onPress={handlePressMenu(item)}
                            align="start"
                            title={item.title}
                        />
                    </View>
            )}
        </View>
    );
});

export default function ({ items, onSelect, children, defaultOpen, mode, title, cancelable }) {
    const { setBottomSheetData } = useBottomSheetData();
    const handlePress = useCallback(() => {
        if (mode != "alert") {
            FeedbackHaptics('Medium')
            setBottomSheetData({ showClose: false, snapPoints: ['10%', '50%'], content: <Menu items={items} onSelect={onSelect} setBottomSheetData={setBottomSheetData} /> });
            Keyboard.dismiss();
        }
        else {
            const alertOptions = items.map(item => ({
                text: item.title,
                onPress: () => {
                    onSelect(item);
                }
            }));
            alertOptions.push({
                text: "Cancel",
                style: "cancel"
            });
            Alert.alert(
                title,
                null,
                alertOptions,
                { cancelable: true }
            );
        }
    }, [setBottomSheetData, items, onSelect]);

    useEffect(() => {
        if (defaultOpen)
            handlePress()
    }, []);

    return (
        <Pressable onPress={handlePress}>{children}</Pressable>
    );
}