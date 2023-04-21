import { View, Row } from 'app/design/view';
import Image from '../../ui/atoms/image';
import { Text, H1C } from 'app/design/typography';
import { stripTags } from '../../lib/util';
import { Button } from 'app/design/controls';
import { appSetting } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile';
import { useRef, useState } from 'react';
import { Platform } from 'react-native'
import { useWindowDimensions } from 'react-native'

import {
    Header,
    LargeHeader,
    ScalingView,
    ScrollViewWithHeaders,
  } from '@codeherence/react-native-header';
  
  import { useSafeAreaInsets } from 'react-native-safe-area-context';

  const HeaderComponent = ({ showNavBar }) => (
    <Header
      showNavBar={showNavBar}
      headerCenter={<Text style={{ fontSize: 16, fontWeight: 'bold' }}>react-native-header</Text>}
     
    />
  );
  
  
  
  const LargeHeaderComponent = ({ scrollY }) => (
    <LargeHeader>
      <ScalingView scrollY={scrollY}>
        <Text style={{ fontSize: 14 }}>Welcome!</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold' }}>react-native-header</Text>
        <Text style={{ fontSize: 12, fontWeight: 'normal', color: '#8E8E93' }}>
          This project displays some header examples using the package.
        </Text>
      </ScalingView>
    </LargeHeader>
  );
  
  

export default function ElementCover(props) {

    const { bottom } = useSafeAreaInsets();

    return (
      <ScrollViewWithHeaders
      HeaderComponent={HeaderComponent}
      LargeHeaderComponent={LargeHeaderComponent}
      contentContainerStyle={{ paddingBottom: bottom }}
    >
      {props.children}
      <View style={{ padding: 16 }}>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
        <Text>Some body text...</Text>
      </View>
    </ScrollViewWithHeaders>
      );

    
}
