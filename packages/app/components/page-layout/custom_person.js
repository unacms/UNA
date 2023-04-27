import * as React from 'react';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, useWindowDimensions, Image, TouchableOpacity } from 'react-native';
import { TabbedHeaderPager } from 'react-native-sticky-parallax-header';
import { useNavigation } from '@react-navigation/native';

import Animated, { Extrapolate, interpolate, useAnimatedStyle, useSharedValue, runOnJS  } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {BlockByName} from 'app/components/block';
import { Icon } from 'app/ui/atoms/icon'; 
import { View, Pressable } from 'app/design/view'
import Cover, {CoverSmall} from 'app/components/elements/cover';
import { Theme } from 'app/design/theme';
import {  processMenu } from 'app/lib/util'

export default function PageLayout(props) {

  const { colors } = Theme();

  let TabList =[];

  processMenu( props.data.menu.object, props.data.menu.items).forEach(function (item) { 
    TabList.push({
      title: item.title,
      description: item.title,
      testID: 'menu' + item.id,
      contentTestID: 'contnt' + item.id,
      link:  item.link,
    },)

  })

  const HeaderBar = ({ scrollValue, coverBlock }) => {

    const navigation = useNavigation();
    setTimeout(() => navigation.setOptions({ headerShown: false }), 200);
    

    const goBack = React.useCallback(() => {
      navigation.goBack();
    }, [navigation]);
  
    const animatedStyle = useAnimatedStyle(() => {
      return { opacity: interpolate(scrollValue.value, [0, 60, 90], [0, 0, 1], Extrapolate.CLAMP) };
    });
  
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.barsBackground,
      }}>
        <View style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Pressable
          className=""
            onPress={goBack}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.5 : 1,
                backgroundColor:'red'
              },
            ]}
          >
            <Icon icon="left" width={24} height={24}  color={colors.barsColor} />
          </Pressable>
          
          <Animated.View style={animatedStyle}>
            <CoverSmall data={coverBlock} />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  };

  const { height: windowHeight } = useWindowDimensions();
  const scrollValue = useSharedValue(0);

  const [endReached, setEndReached] = useState(false);


  let f = {
    callback: function () {
      
    }
  }

  if (endReached){
    setTimeout(() => f.callback(), 5);
  }

  function setEndReachedT(){
    if (endReached != true)
      setEndReached(true)
  }
  function setEndReachedF(){
    if (endReached != false)
      setEndReached(false)
  }
  
  function onScroll(e) {
    'worklet';
    scrollValue.value = e.contentOffset.y;
    
    const offsetY = e.contentOffset.y;
    const contentHeight = e.contentSize.height;
    const scrollViewHeight = e.layoutMeasurement.height;
    //console.log('zzzz', offsetY + scrollViewHeight,contentHeight)
    if (offsetY + scrollViewHeight >= contentHeight-1) {
      console.log('Reached the end of the scroll');
      runOnJS(setEndReachedT)();

    }
    else{
      runOnJS(setEndReachedF)();
    }
  }

  /*function onScroll2() {
    console.log('***');
  }*/

  let name = props.data.cover_block.profile.display_name
 
  return (
    <>
      <TabbedHeaderPager
        containerStyle={{
          alignSelf: 'stretch',
          flex: 1,
        }}
        backgroundImage={{
          uri: props.data?.cover_block?.cover?.src ? props.data?.cover_block?.cover?.src : 'https://una.io/cover.png',
        }}
        title={name}
       // headerHeight={10}
        titleStyle={{
          backgroundColor: colors.barsBackground,
          color: colors.default,
          fontSize: 24,
          padding: 10,
        }}
       /* logoStyle={
          {
            padding: 10,
            borderRadius:5000
          }
        }*/
        foregroundImage={{
          uri: props.data?.cover_block?.profile?.url_avatar ? props.data?.cover_block?.profile?.url_avatar :'https://ci.una.io/test3/s/bx_persons_pictures_resized/vx77wrncb7dbv5inmbxy4vjiwjkuhrfl.jpg',
        }}
        
        tabsContainerBackgroundColor={colors.barsBackground}
        tabTextContainerStyle={{
          backgroundColor: 'transparent',
          borderRadius: 0,
        }}
        tabTextContainerActiveStyle={{
          borderBottomWidth:3,
          borderBottomColor: colors.primary,
          backgroundColor: 'transparent',

        }}
        tabTextStyle={{
          color: colors.text,
          paddingHorizontal: 12,
          paddingVertical: 16,
        }}
        tabTextActiveStyle={{
          color: colors.primary,
          paddingHorizontal: 12,
          paddingVertical: 16,
        }}
        tabWrapperStyle={{
          paddingVertical: 0,
        }}
        tabsContainerStyle={{
          paddingHorizontal: 10,
        }}
        onScroll={onScroll}
        tabs={TabList}
        renderHeaderBar={() => <HeaderBar coverBlock={props.data.cover_block} scrollValue={scrollValue} />}
        showsVerticalScrollIndicator={true}>
        {TabList.map((tab, i) => (
          <View key={i} >
            <BlockByName data={props.data} name={props.blocks.col1} f={f} />
          </View>
        ))}
      </TabbedHeaderPager>
    </>
  );
};
