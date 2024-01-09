import React, { useCallback, useMemo, useRef, useContext } from 'react';
import BottomSheet2 from 'app/ui/molecules/bottomsheet';
import { FeedbackHaptics, getAlert } from 'app/lib/util';
import { LayoutData } from 'app/context/layout';
import { View } from 'app/design/view'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'

export default function ElementCommentForm(props) {
    const { layoutData, setLayoutData } = useContext(LayoutData);
    let isShow = false;
    if (layoutData && layoutData?.type == 'bottomsheet:data' && layoutData?.data) {
        isShow = true;
    }

    //console.log("layoutData", layoutData, isShow)
    return (
        isShow ? (
            <BottomSheet2 open={isShow}>
                <View className='absolute right-2 top-2 z-50'>
                    <Button startDecorator="X" tooltip={('Close')} variant='text' size='sm' onPress={() => setLayoutData(getAlert('bottomsheet:data', false))}  />           
                </View>
                <View className="max-w-lg lg:mx-auto m-4">
                    <View className='pb-4'>
                        <Text className='text-neutral-700 dark:text-neutral-200 text-xl font-bold'>{layoutData.data.title}</Text>
                    </View>
                    <View className=''>
                        {layoutData.data.content}
                    </View>
                </View>
            </BottomSheet2>
        ) : <></>
    )
}