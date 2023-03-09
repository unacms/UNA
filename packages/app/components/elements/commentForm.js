import React, { useCallback, useMemo, useRef } from 'react';
import { View, Row } from 'app/design/view'
import {StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { A, H1, P, Text, TextLink } from 'app/design/typography'

export default function ElementCommentForm(props) {
    
    // ref
    const bottomSheetRef = useRef(null);

    // variables
    const snapPoints = useMemo(() => ['80%', '10%'], []);

    // callbacks
    const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
    }, []);

   

    return ( 
      <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
    >
      <View className='items-center w-full text-xl h-full'>
        <Text className='text-base'>write your comment</Text>
      </View>
    </BottomSheet>
  )
}