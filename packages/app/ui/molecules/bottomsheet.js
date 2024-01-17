import React, { useCallback, useMemo, useRef, useContext } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { View } from 'app/design/view'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'


export default function ElementCommentForm(props) {
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => (props.snapPoints? props.snapPoints : ['25%', '90%']), []);
    const handleSheetChanges = useCallback((index) => {
       // console.log('handleSheetChanges', index);
    }, []);


    return (
        props.open && <BottomSheet backgroundStyle={{backgroundColor: 'rgba(255,255,255,1)'}}   
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            detached={true}
        >
           {props.children}
        </BottomSheet>
    )
}