import BottomSheet2 from 'app/ui/molecules/bottomsheet';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import { Modal } from 'app/design/controls'
import { ScrollView } from 'app/design/view'
import { useWindowDimensions } from 'react-native'
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'

export default function ElementCommentForm(props) {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    const windowDimensions = useWindowDimensions();

    let isShow = false;
    if (bottomSheetData && bottomSheetData?.content) {
        isShow = true;
    }

    let isListView = false;
    if (bottomSheetData?.isListView) {
        isListView = bottomSheetData.isListView;
    }

    const isShowClose = bottomSheetData?.showClose !== 'undefined' ? bottomSheetData?.showClose : true;

    let bottomSheetProps = {
        open: isShow,
        blocking: false,
    };

    bottomSheetProps.snapPoints = bottomSheetData?.snapPoints;

    if (!isShow)
        return <></>

    if (windowDimensions.width > LAYOUT_BREAKPOINTS.lg) {
        return (
            <Modal
                title={bottomSheetData.title}
                onVisible={true}
                onClose={() => {
                    setBottomSheetData(false)
                    if (bottomSheetData.onClose)
                        bottomSheetData.onClose();
                }}
                padding={bottomSheetData?.modal?.padding}
                outerClickClose={false}
                transparent={true}
            >
                <View className='w-full ' style={{ maxHeight: windowDimensions.height - 100 }}>
                    <ScrollView className=' w-full'>
                        {bottomSheetData.content}
                        {bottomSheetData.footer}
                    </ScrollView>
                </View>
            </Modal>
        )
    }

    let k = [bottomSheetProps?.snapPoints ? parseInt(bottomSheetProps.snapPoints[0].replace('%', '')) : 50, bottomSheetProps?.snapPoints ? parseInt(bottomSheetProps.snapPoints[1].replace('%', '')) : 50]
    bottomSheetProps.defaultSnap = ({ maxHeight }) => (maxHeight / 100 * k[0]);
    bottomSheetProps.snapPoints = ({ maxHeight }) => [
        maxHeight / 100 * k[0],
        maxHeight / 100 * k[1]
    ]

    if (bottomSheetData.footer) {
        bottomSheetProps.footer = bottomSheetData.footer

    }

    bottomSheetProps.header = <>
        {bottomSheetData.title && <View><Text className='text-neutral-700 dark:text-neutral-200 text-center text-xl font-bold mb-2 '>{bottomSheetData.title}</Text></View>}
        {isShowClose && <View className={'absolute right-2 z-50 top-4'}>
            <Button startDecorator="X" tooltip={('Close')} variant='text' size='sm' onPress={() => onClose()} />
        </View>}
        {!!bottomSheetData.header && bottomSheetData.header}
    </>

    const onClose = () => {
        setBottomSheetData(false);
        if (bottomSheetData.onClose)
            bottomSheetData.onClose();
    }

    let content = <View className=" mx-auto w-full flex-1 px-4 py-2">
        {bottomSheetData.content}
    </View>

    return (
        <BottomSheet2 {...bottomSheetProps} >
            <View className=" mx-auto w-full flex-1 flex-auto py-2 h-full">
                {isListView ? content : <ScrollView className=' w-full'>
                    {content}
                </ScrollView>}
            </View>
        </BottomSheet2>
    )
}