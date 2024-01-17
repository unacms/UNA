import React, { useContext } from 'react';
import BottomSheet2 from 'app/ui/molecules/bottomsheet';
import { getAlert } from 'app/lib/util';
import { BottomSheetData } from 'app/context/bottomsheet';
import { View } from 'app/design/view'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import { Platform } from 'react-native'

export default function ElementCommentForm(props) {
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
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

    if (!isWeb) {
        bottomSheetProps.snapPoints = bottomSheetData?.snapPoints;
    }

    return (
        isShow ? (
            <BottomSheet2 {...bottomSheetProps}>
                {isShowClose && <View className={'absolute right-2  z-50' + (isWeb ? 'top-2' : 'top-0')}>
                    <Button startDecorator="X" tooltip={('Close')} variant='text' size='sm' onPress={() => setBottomSheetData(false)}  />
                </View>}
                <View className={"max-w-lg mx-auto " + (isWeb ? 'm-4': 'mx-2')}>
                    <View className='pb-4'>
                        <Text className='text-neutral-700 dark:text-neutral-200 text-xl font-bold'>{bottomSheetData.title}</Text>
                    </View>
                    <View className=''>
                        {bottomSheetData.content}
                    </View>
                </View>
            </BottomSheet2>
        ) : <></>
    )
}