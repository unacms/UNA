import React, { useContext } from 'react';
import { View, Row } from 'app/design/view'

import { LayoutData } from 'app/context/layout';

export default function ElementCommentForm(props) {
    
    const { layoutData, setLayoutData } = useContext(LayoutData);

    return (

        <View className=''>
          {!!layoutData && layoutData[0]}
        </View>
  )
}