import {BlockByName} from 'app/components/block';
import { View, ScrollView } from 'app/design/view'
import LayoutDataContext from 'app/context/layout';
import { KeyboardAvoidingView } from 'react-native';
import BottomBar from 'app/ui/molecules/bottombar';
import { useState } from 'react';
import { Text, H1C } from 'app/design/typography';

import {
    Header,
    LargeHeader,
    ScalingView,
    ScrollViewWithHeaders,
  } from '@codeherence/react-native-header';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';

  const HeaderComponent = ({ showNavBar }) => (
    <Header 
        headerStyle={{paddingTop:0, marginTop:0,  backgroundColor:'#ffff00'}}
        showNavBar={showNavBar}
        headerCenter={ <View><Text style={{ fontSize: 16, fontWeight: 'bold' }}>react-native-header{JSON.stringify(showNavBar)}</Text></View>}
     
    />
  );
  
  const LargeHeaderComponent = ({ scrollY }) => (
    <LargeHeader headerStyle={{paddingTop:0, marginTop:0}}>
        <View className='bg-green-500 w-full'>
      <ScalingView scrollY={scrollY} >
        <Text style={{ fontSize: 14 }}>Welcome!</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold' }}>react-native-header</Text>
        <Text style={{ fontSize: 12, fontWeight: 'normal', color: '#8E8E93' }}>
          This project displays some header examples using the package.
        </Text>
      </ScalingView>
      </View>
    </LargeHeader>
  );
   
  export default function ElementCover(props) {

    const { bottom } = useSafeAreaInsets();

    return (
        <View className='bg-red-500 w-full flex-1 '>
        <ScrollViewWithHeaders 
        HeaderComponent={HeaderComponent}
        LargeHeaderComponent={LargeHeaderComponent}
        contentContainerStyle={{ padding:0, margin:0, paddingBottom: bottom,  backgroundColor:'#ff00ff' }}
      >
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
      </ScrollViewWithHeaders></View>
      );

    
}  
/*
export default function PageLayout(props) {
    return (
        <View className='flex-1  w-full h-full'>
                <LayoutDataContext>
                <ScrollView className="w-full h-full flex-1">
                    <BlockByName data={props.data} name={props.blocks.author}/>
                    <BlockByName data={props.data} name={props.blocks.text}/>
                    <BlockByName data={props.data} name={props.blocks.actions}/>
                    <BlockByName data={props.data} name={props.blocks.comments}/>
            </ScrollView>
            <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                <BottomBar/>     
            </KeyboardAvoidingView>
            </LayoutDataContext>
        </View>);
}*/
