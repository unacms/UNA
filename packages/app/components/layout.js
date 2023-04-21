import { View, ScrollView } from 'app/design/view'
import BottomBar from 'app/ui/molecules/bottombar';

import React, { useCallback, useState } from "react";
import { StatusBar, Text } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { Route, TabView } from "showtime-tab-view";

const StatusBarHeight = StatusBar.currentHeight ?? 0;
const TabScene = ({ route }) => {
  return (
    <TabFlashList
      index={route.index}
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

export const siteTitle = 'NEO';


export default function Layout(props) {
    let data =props.data;
    let isBrowse = false;
    let oComments=false;

    
    // TODO IMPROVE
    if (props.uri && props.uri.includes('view-post')){
        oComments = true;
    }

    Object.keys(data?.elements).forEach(key => {
        Object.keys(data.elements[key]).forEach(key2 => {
            Object.keys(data.elements[key][key2].content).forEach(key3 => {
                if(data.elements[key][key2].content[key3].type == 'browse'){
                    isBrowse = true;
                }
            });
        });
    });


    const sClassName = 'relative overflow-hidden ' + (oComments ? ' ' : '');


    
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
        return <View route={route} index={0} ><Text>123</Text></View>;
      case "owner":
        return <View route={route} index={1} ><Text>123</Text></View>
      case "created":
        return <View route={route} index={2} ><Text>123</Text></View>;
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
  const renderHeader = () => (
    <View style={{ height: 300, backgroundColor: "#000" }}></View>
  );

    return (
        <View className='bg-red-500 h-full w-full'><Text>5555</Text><TabView
        onStartRefresh={onStartRefresh}
        isRefreshing={isRefreshing}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        lazy
        renderScrollHeader={renderHeader}
        minHeaderHeight={44 + StatusBarHeight}
        animationHeaderPosition={animationHeaderPosition}
        animationHeaderHeight={animationHeaderHeight}
      /></View>
      );

    return (

            <View className="h-full">
            { isBrowse && <View  className="bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50">
                <View className = {sClassName}>
                    {props.children}
                </View>
            </View>
            }
            { !isBrowse && <ScrollView className="bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50">
                <View className = {sClassName}>
                    {props.children}
                </View>
            </ScrollView>
            }
            { (oComments != null ) &&   <View><BottomBar/></View>}
            </View>
    );
}
