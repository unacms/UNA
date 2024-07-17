import React, { useContext } from 'react';
import { View, Row } from 'app/design/view'

import { useLayoutData } from 'app/context/layout';

export default function ElementCommentForm(props) {
    
    const { layoutData } = useLayoutData();

    return (
        <View className=''>
          {!!layoutData && layoutData[0]}
        </View>
  )
}