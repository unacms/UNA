import React, { useCallback, useState, useEffect } from "react";
import { StatusBar,  } from "react-native";
import { Text, H1C } from 'app/design/typography';
import { useSharedValue } from "react-native-reanimated";
import { Route, TabView } from "showtime-tab-view";
import Cover, {CoverSmall} from 'app/components/elements/cover';

import {BlockByName} from 'app/components/block';

import { View,Row, ScrollView, FlatList,Pressable } from 'app/design/view';
import { Button } from 'app/design/controls'

import { FlashList } from "@shopify/flash-list";

import { useHeaderTabContext } from "showtime-tab-view";
import { SceneComponent } from "showtime-tab-view";

import Animated from "react-native-reanimated";
import { useNavigation } from '@react-navigation/native';
const StatusBarHeight = StatusBar.currentHeight ?? 0;



export default function PageLayout(props) {

  const [isSmall, setIsSmall] = useState(0);
  const handleEndReached = () => {  
    console.log('End reached')
  };
const navigation = useNavigation();

const handleLayout = (event) => {
  
  console.log(5555555555, event.nativeEvent.contentOffset.y, isSmall)
  if (event.nativeEvent.contentOffset.y > 130){
    console.log('------------')
   // navigation.setOptions({ headerTitle: () => <CoverSmall data={props.data.cover_block} />, headerShown: true,  })
    setIsSmall(1)
  }
  if (event.nativeEvent.contentOffset.y < 130){
    console.log('++++++++++')
   /// navigation.setOptions({ headerTitle: () => <Text></Text>, headerShown: true,  })
    setIsSmall(0)
  }
 };

 function TabFlashListScrollViewComponent(props, ref) {
  return (
    <SceneComponent
      {...props}
      useExternalScrollView
      forwardedRef={ref}
      ContainerView={Animated.ScrollView}
    />
  );
}

TabFlashListScrollView = React.forwardRef(
  TabFlashListScrollViewComponent
);

function TabFlashListComponent(
props,
ref
) {
const { scrollViewPaddingTop } = useHeaderTabContext();
return (
  <>
  
  <FlashList
    {...props}
    renderScrollComponent={TabFlashListScrollView}
    contentContainerStyle={{ paddingTop: scrollViewPaddingTop }}
    ref={ref}
    onScroll={handleLayout}
    onEndReachedThreshold={0.5}
    onEndReached ={handleEndReached} 
  /></>
);
}

 const TabFlashList = React.forwardRef(TabFlashListComponent) ;



const TabScene = ({ route }) => {
  return (
    
    <TabFlashList
      index={route.index}
      onEndReached ={handleEndReached} 
      data={new Array(20).fill(0)}
      estimatedItemSize={60}
      renderItem={({ index }) => {
        return (
          <View
            style={{
              height: 60,
              backgroundColor: "#fff",
              marginBottom: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text>{`${route.title}-Item-${index}`}</Text>
          </View>
        );
      }}
    />
  );
};


  const [isRefreshing, setIsRefreshing] = useState(false);
  


  const [routes] = useState([
    { key: "like", title: "Like", index: 0 },
    { key: "owner", title: "Owner", index: 1 },
    { key: "created", title: "Created", index: 2 },
  ]);
  const [index, setIndex] = useState(0);
  const animationHeaderPosition = useSharedValue(0);
  const animationHeaderHeight = useSharedValue(0);

  const renderScene = useCallback(({ route }) => {
    switch (route.key) {
      case "like":
        return <TabScene route={route} index={0} />;
      case "owner":
        return <TabScene route={route} index={1} />;
      case "created":
        return <TabScene route={route} index={2} />;
      default:
        return null;
    }
  }, []);

  const onStartRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      console.log("onStartRefresh");
      setIsRefreshing(false);
    }, 300);
  };

  const renderTabBar = (props) => (
    <Row className="bg-red-500">
      {props.navigationState.routes.map(a => (props.navigationState.index == a.index ? <Button disabled variant="primary" title={a.title} rounded  onPress={() => setIndex(a.index)} />: <Button variant="primary" title={a.title} rounded  onPress={() => setIndex(a.index)} />))}
    </Row>
  );


  useEffect(() => {
    if (isSmall)
    navigation.setOptions({ headerTitle: () => <CoverSmall data={props.data.cover_block} />, headerShown: true,  })
    else
    navigation.setOptions({ headerTitle: () => <Text></Text>, headerShown: true,  })
}, [isSmall]);

  const renderHeader = () => { return(
    <View style={{height:130}} ><Cover data={props.data.cover_block}/></View>
  )}
  return (
    <>
    <TabView
   
      /*onStartRefresh={onStartRefresh}
      isRefreshing={isRefreshing}*/
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      lazy
      renderScrollHeader={renderHeader}
      minHeaderHeight={0}
      animationHeaderPosition={animationHeaderPosition}
      animationHeaderHeight={animationHeaderHeight}
      renderTabBar={renderTabBar}
    /></>
  );
}