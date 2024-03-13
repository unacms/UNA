import React, { useContext } from 'react';
import BottomSheet2 from 'app/ui/molecules/bottomsheet';
import { getAlert } from 'app/lib/util';
import { BottomSheetData } from 'app/context/bottomsheet';
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import { Platform, Dimensions } from 'react-native'
import { Modal } from 'app/design/controls'
import { ScrollView } from 'dripsy';

export default function ElementCommentForm(props) {
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    let windowWidth = Dimensions.get('window').width

    let isShow = false;
    if (bottomSheetData && bottomSheetData?.content) {
        isShow = true;
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

    if (windowWidth > 1024) {
        return (
            <Modal
                title={bottomSheetData.title}
                presentation = 'fullScreen'
                onVisible={true}
                onClose={() => {
                    setBottomSheetData(false)
                    if (bottomSheetData.onClose)
                        bottomSheetData.onClose();
                }}
                outerClickClose={false}
                transparent={true}
            >
                <View className='w-full px-1 pb-1'>
                    {bottomSheetData.content}
                </View>
            </Modal>
        )
    }

    if (isWeb){
        let k = [bottomSheetProps?.snapPoints ? parseInt(bottomSheetProps.snapPoints[0].replace('%', '')) :  50, bottomSheetProps?.snapPoints ? parseInt(bottomSheetProps.snapPoints[1].replace('%', '')) :  50]
        bottomSheetProps.defaultSnap = ({ maxHeight }) => (maxHeight/100*k[0]) ;
        bottomSheetProps.snapPoints=({ maxHeight }) => [
            maxHeight/100*k[0],
            maxHeight/100*k[1]
          ]
    }

    const onClose  = () => { 
        setBottomSheetData(false);
        if (bottomSheetData.onClose)
            bottomSheetData.onClose();
    }
    return (
        <BottomSheet2 {...bottomSheetProps} >
         
            {bottomSheetData.title && <View><Text className='text-neutral-700 dark:text-neutral-200 text-center text-xl font-bold mb-2 '>{bottomSheetData.title}</Text></View>}
            <ScrollView className=' w-full'>
                <View className={" mx-auto w-full flex-1 " + (isWeb ? 'px-4 py-2' : 'px-4')/*max-w-lg */}>
                    {bottomSheetData.content}
                </View>
            </ScrollView>
            {isShowClose && <View className={'absolute right-2 z-50 ' + (isWeb ? 'top-2' : 'top-0')}>
                <Button startDecorator="X" tooltip={('Close')} variant='text' size='sm' onPress={() => onClose()} />
            </View>}
        </BottomSheet2>
    )
}