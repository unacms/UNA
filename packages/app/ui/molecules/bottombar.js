import React, { useContext } from 'react';
import { View, Row } from 'app/design/view'
import {StyleSheet } from 'react-native';

import { LayoutData } from 'app/context/layout';
import { KeyboardAvoidingView } from 'react-native';
export default function ElementCommentForm(props) {
    
    const { layoutData, setLayoutData } = useContext(LayoutData);

    return (
      <KeyboardAvoidingView>
        <View className=''>
          {!!layoutData && layoutData[0]}
        </View>
      </KeyboardAvoidingView> 
  )
}