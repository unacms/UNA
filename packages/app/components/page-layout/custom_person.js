import React, { useCallback, useState } from "react";
import { StatusBar, Text, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { Route, TabView } from "showtime-tab-view";
import Cover, {CoverSmall} from 'app/components/elements/cover';
import {BlockByName} from 'app/components/block';
import { TabFlashList } from "app/components/elements/tab-flash-list";

const StatusBarHeight = StatusBar.currentHeight ?? 0;

export default function PageLayout(props) {

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
        return <TabScene route={route} index={0} data={props.data} />;
      case "owner":
        return <TabScene route={route} index={1} data={props.data}/>;
      case "created":
        return <TabScene route={route} index={2} data={props.data}/>;
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
    <View style={{ height: 120}}><Cover data={props.data.cover_block}/></View>
  );
  return (
    <TabView
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
    />
  );
}