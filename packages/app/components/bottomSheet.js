import React, { useCallback, useMemo, useRef, useContext } from 'react';
import { View, Row } from 'app/design/view'
import {StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { A, H1, P, Text, TextLink } from 'app/design/typography'
import { LayoutData } from 'app/context/layout';

export default function ElementCommentForm(props) {
    
    const { layoutData, setLayoutData } = useContext(LayoutData);
    // ref
    const bottomSheetRef = useRef(null);
    // variables
    const snapPoints = useMemo(() => ['90%', '10%'], []);
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
      {layoutData}
    </BottomSheet>
  )
}