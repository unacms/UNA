import React, { useContext } from 'react';
import BottomSheet2 from 'app/ui/molecules/bottomsheet';
import { getAlert } from 'app/lib/util';
import { BottomSheetData } from 'app/context/bottomsheet';
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import { Platform, Dimensions } from 'react-native'
import { Modal } from 'app/design/controls'
import { ScrollView } from 'app/design/view'
import { useWindowDimensions } from 'react-native'

export default function ElementCommentForm(props) {
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const windowDimensions = useWindowDimensions();

    let isShow = false;
    if (bottomSheetData && bottomSheetData?.content) {
        isShow = true;
    }

    let isListView = false;
    if (bottomSheetData?.isListView) {
        isListView = bottomSheetData.isListView;
    }

    const isWeb = Platform.OS == 'web';

    const isShowClose = bottomSheetData?.showClose !== 'undefined' ? bottomSheetData?.showClose : true;

    let bottomSheetProps = {
        open: isShow,
        blocking: false,
    };

    bottomSheetProps.snapPoints = bottomSheetData?.snapPoints;

    if (!isShow)
        return <></>

    console.log(bottomSheetData);
    if (windowDimensions.width > 1024) {
        //outerClickClose={false}
        return (
            <Modal
                title={bottomSheetData.title}
                presentation='fullScreen'
                onVisible={true}
                onClose={() => {
                    setBottomSheetData(false)
                    if (bottomSheetData.onClose)
                        bottomSheetData.onClose();
                }}
                padding={bottomSheetData?.modal?.padding}
                
                transparent={true}
            >
                <View className='w-full pb-6' style={{maxHeight:windowDimensions.height-100}}>
                    <ScrollView className=' w-full'>
                        {bottomSheetData.content}
                        {bottomSheetData.footer}
                    </ScrollView>
                </View>
            </Modal>
        )
    }

    if (isWeb) {
        let k = [bottomSheetProps?.snapPoints ? parseInt(bottomSheetProps.snapPoints[0].replace('%', '')) : 50, bottomSheetProps?.snapPoints ? parseInt(bottomSheetProps.snapPoints[1].replace('%', '')) : 50]
        bottomSheetProps.defaultSnap = ({ maxHeight }) => (maxHeight / 100 * k[0]);
        bottomSheetProps.snapPoints = ({ maxHeight }) => [
            maxHeight / 100 * k[0],
            maxHeight / 100 * k[1]
        ]

        
        if (bottomSheetData.footer){
            bottomSheetProps.footer = bottomSheetData.footer
           
        }
    }

    bottomSheetProps.header = <>
            {bottomSheetData.title && <View><Text className='text-neutral-700 dark:text-neutral-200 text-center text-xl font-bold mb-2 '>{bottomSheetData.title}</Text></View>}
            {isShowClose && <View className={'absolute right-2 z-50 ' + (isWeb ? 'top-4' : 'top-0')}>
                <Button startDecorator="X" tooltip={('Close')} variant='text' size='sm' onPress={() => onClose()} />
            </View>}
            {!!bottomSheetData.header && bottomSheetData.header}
        </>

    const onClose = () => {
        setBottomSheetData(false);
        if (bottomSheetData.onClose)
            bottomSheetData.onClose();
    }

    let content = <View className={" mx-auto w-full flex-1 " + (isWeb ? 'px-4 py-2' : 'px-4')/*max-w-lg */}>
        {bottomSheetData.content}
    </View>

    if (!isWeb){
        bottomSheetProps.isListView=isListView;
        content = <View className={" mx-auto w-full flex-1 " + (isWeb ? 'px-4 py-2' : 'px-4')/*max-w-lg */}>
        {bottomSheetData.content}
        {bottomSheetData.footer}
    </View>
    }

    return (
        <BottomSheet2 {...bottomSheetProps} >
            <View className=" mx-auto w-full flex-1 flex-auto py-2 h-full">
                {!isWeb && bottomSheetProps.header}
                {isListView ? content : <ScrollView className=' w-full'>
                    {content}
                </ScrollView>}

            </View>
        </BottomSheet2>
    )
}