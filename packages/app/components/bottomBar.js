import React, { useCallback, useMemo, useRef, useContext } from 'react';
import { View, Row } from 'app/design/view'
import {StyleSheet } from 'react-native';

import { A, H1, P, Text, TextLink } from 'app/design/typography'
import { LayoutData } from 'app/context/layout';

export default function ElementCommentForm(props) {
    
    const { layoutData, setLayoutData } = useContext(LayoutData);
    return ( 
      <View>
        {layoutData[0]}
    </View>
  )
}