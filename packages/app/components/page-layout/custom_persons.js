import {BlockByName} from 'app/components/block';
import { View, ScrollView } from 'app/design/view'
import LayoutDataContext from 'app/context/layout';
import { KeyboardAvoidingView } from 'react-native';
import BottomBar from 'app/ui/molecules/bottombar';
import { useState } from 'react';
import { Text, H1C } from 'app/design/typography';
import { useNavigation } from '@react-navigation/native';
import {
    Header,
    LargeHeader,
    ScalingView,
    ScrollViewWithHeaders,
  } from '@codeherence/react-native-header';
  
  import { useSafeAreaInsets } from 'react-native-safe-area-context';

  
  const HeaderComponent = ({ showNavBar }) =>  {
    
    console.log(11);
    return (
    <Header 
        headerStyle={{paddingTop:0, marginTop:0}}
        showNavBar={showNavBar}
        headerCenter={ <View><Text style={{ fontSize: 16, fontWeight: 'bold' }}>react-native-header{JSON.stringify(showNavBar)}</Text></View>}
     
    />
  )};
  
  const LargeHeaderComponent = ({ scrollY }) => (
    <LargeHeader headerStyle={{paddingTop:0, marginTop:0, marginLeft:0}}>
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
   
  function sas(props) {
    console.log(9899);
  }

  export default function ElementCover(props) {

    const { bottom } = useSafeAreaInsets();
    const navigation = useNavigation();
    setTimeout(() => {
        navigation.setOptions({ headerShown: false })
    }, 100);

    return (
        <View className='w-full flex-1 '>
        <ScrollViewWithHeaders 
        HeaderComponent={HeaderComponent}
        LargeHeaderComponent={LargeHeaderComponent}
        contentContainerStyle={{ padding:0, margin:0, paddingBottom: bottom,  backgroundColor:'#ff00ff' }}
        onLargeHeaderLayout = {sas}
      >
        <View >
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


/*import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';

export default function PageLayout(props) {
    return (<View className="w-full sm:mt-4">
         <BlockByName data={props.data} name={props.blocks.col1} hideTitle={true} hideBg={true} />
    </View>)
}*/
