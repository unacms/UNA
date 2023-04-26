import {BlockByName} from 'app/components/block';
import { View, Pressable } from 'app/design/view'
import LayoutDataContext from 'app/context/layout';
import { KeyboardAvoidingView } from 'react-native';
import BottomBar from 'app/ui/molecules/bottombar';
import { useState } from 'react';
import { Text, H1C } from 'app/design/typography';
import { useNavigation } from '@react-navigation/native';
import Cover, {CoverSmall} from 'app/components/elements/cover';
import {
    Header,
    LargeHeader,
    ScalingView,
    ScrollViewWithHeaders,
  } from '@codeherence/react-native-header';
  
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { useRouter } from 'expo-router';
  import { Theme } from 'app/design/theme';
  import { Icon } from 'app/ui/atoms/icon'; 

  
function CoverLeft()
{
  const routerExpo = useRouter();
  const { colors } = Theme();

  return (
    <Pressable
        className="pl-4 "
          onPress={routerExpo.back}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.5 : 1,
              backgroundColor:'red'
            },
          ]}
        >
          <Icon icon="left" width={24} height={24}  color={colors.barsColor} />
        </Pressable>
  )
}

  export default function ElementCover(props) {

    
  
  const HeaderComponent = ({ showNavBar }) =>  (
    <Header 
        headerStyle={{paddingTop:0, marginTop:0}}
        showNavBar={showNavBar}
        headerCenter={ <CoverSmall data={props.data.cover_block}/>}
        headerLeft={ <CoverLeft/>}
        headerLeftFadesIn = {false}
        headerCenterStyle ={{}}
        headerLeftStyle ={{}}
     
    />
  );
  

    const LargeHeaderComponent = ({ scrollY }) => (
      <LargeHeader headerStyle={{paddingTop:0, marginTop:0,marginBottom:0,paddingTop:0, marginLeft:0, paddingLeft:0, paddingRight:0}}>
          <View className=' w-full'>
        <ScalingView scrollY={scrollY} startScale={1} endScale={1.1} startRange={0} endRange={10}>
          <Cover data={props.data.cover_block}/>
        </ScalingView>
        </View>
      </LargeHeader>
    );

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
        contentContainerStyle={{ paddingLeft:0, marginLeft:0, paddingBottom: 0,   }}

      >
        <BlockByName data={props.data} name={props.blocks.col1} hideTitle={true} hideBg={true} />
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
