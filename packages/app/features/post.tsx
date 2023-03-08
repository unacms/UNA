import { A, H1, P, Text, TextLink } from 'app/design/typography'
import React, { useCallback, useMemo, useRef } from 'react';
import { View, Row } from 'app/design/view'
import {StyleSheet } from 'react-native';
import { Button } from 'app/design/controls'
import BottomSheet from '@gorhom/bottom-sheet';

export function PostScreen() {

 // ref
 const bottomSheetRef = useRef<BottomSheet>(null);

 // variables
 const snapPoints = useMemo(() => ['80%', '10%'], []);

 // callbacks
 const handleSheetChanges = useCallback((index: number) => {
   console.log('handleSheetChanges', index);
 }, []);

 const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'grey',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});

  return (
    <View style={styles.container}><Text>Awesome 🎉xczvxcv xczzx</Text>
    <BottomSheet
      enablePanDownToClose = {true}
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
    >
      <View style={styles.contentContainer}>
        <Text>Awesome 🎉xczvxcv xczzx</Text>
      </View>
    </BottomSheet>
  </View>
  

    
  )
}
