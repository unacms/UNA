import React, { useCallback, useMemo, useRef, useContext } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { LayoutData } from 'app/context/layout';

export default function ElementCommentForm(props) {
    
    const { layoutData, setLayoutData } = useContext(LayoutData);
    // ref
    const bottomSheetRef = useRef(null);
    // variables
    const snapPoints = useMemo(() => ['95%', '10%'], []);
    // callbacks
    const handleSheetChanges = useCallback((index) => {
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