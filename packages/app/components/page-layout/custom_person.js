import React, { useCallback, useState } from "react";
import { StatusBar,} from "react-native";
import { Text, H1C } from 'app/design/typography';
import { useSharedValue,withTiming} from "react-native-reanimated";
import { Route, TabView, useHeaderTabContext, SceneComponent } from "showtime-tab-view";
import Cover, {CoverSmall} from 'app/components/elements/cover';
import { SafeAreaView } from 'react-native-safe-area-context';
import {BlockByName} from 'app/components/block';
import { View, Row, ScrollView, FlatList,Pressable } from 'app/design/view';
import { Button } from 'app/design/controls'
import { FlashList } from "@shopify/flash-list";
import { Theme } from 'app/design/theme';
import { useNavigation } from '@react-navigation/native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const StatusBarHeight = StatusBar.currentHeight ?? 0;

export default function PageLayout(props) {

    const scroll = useSharedValue(1);
    const navigation = useNavigation();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { colors } = Theme();
    
    const [index, setIndex] = useState(0);
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);


    const [routes] = useState([
        { key: "like", title: "Like", index: 0 },
        { key: "owner", title: "Owner", index: 1 },
        { key: "created", title: "Created", index: 2 },
    ]);

    const handleEndReached = () => {
        console.log('End reached')
    };

    setTimeout(() => {
        navigation.setOptions({headerShown: false})
    }, 300);

    const handleLayout = (event) => {
        scroll.value = event.nativeEvent.contentOffset.y > 200 ? 0: 1;
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

    TabFlashListScrollView = React.forwardRef(TabFlashListScrollViewComponent);

    function TabFlashListComponent(props, ref) {
        const { scrollViewPaddingTop } = useHeaderTabContext();
        return (
            <FlashList
                {...props}
                renderScrollComponent={TabFlashListScrollView}
                contentContainerStyle={{ paddingTop: scrollViewPaddingTop }}
                ref={ref}
                onScroll={handleLayout}
                onEndReachedThreshold={0.5}
                onEndReached ={handleEndReached} 
            />
        );
    }

    const TabFlashList = React.forwardRef(TabFlashListComponent) ;

    const TabScene = ({ route }) => {
        return (
            <TabFlashList
                index={route.index}
                onEndReached = {handleEndReached} 
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

    /*const onStartRefresh = async () => {
        setIsRefreshing(true);
        setTimeout(() => {
            console.log("onStartRefresh");
            setIsRefreshing(false);
        }, 300);
    };*/

    const renderTabBar = (props) => (
        <Row className="py-4" style={{backgroundColor: colors.barsBackground}}>
            {props.navigationState.routes.map(a => (props.navigationState.index == a.index ? <Button disabled variant="text" title={a.title} roundedonPress={() => setIndex(a.index)} />: <Button variant="text" title={a.title} roundedonPress={() => setIndex(a.index)} />))}
        </Row>
    );

    const renderHeader = useCallback(() => {
        const animatedStyleA = useAnimatedStyle(() => {
            return {
                opacity: withTiming(scroll.value, { duration: 500 }),
            };
        });

        const animatedStyleB = useAnimatedStyle(() => {
            return {
                opacity: withTiming(1 - scroll.value, { duration: 500 }),
            };
        });

        return (
            <View className='w-full h-80'>
                <Animated.View style={[{width:'100%',position:'absolute', }, animatedStyleA]}>
                    <Cover data={props.data.cover_block}/>
                </Animated.View>
                <Animated.View style={[{width:'100%', position:'absolute', bottom:0, }, animatedStyleB]}>
                    <CoverSmall data={props.data.cover_block}/>
                </Animated.View>
            </View>
        );
    }, [scroll]);

    return (
    <>
        <SafeAreaView edges={[ 'left', 'right']} style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height:'100%'
        }}>
            <TabView
                /*onStartRefresh={onStartRefresh}
                isRefreshing={isRefreshing}*/
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                lazy
                renderScrollHeader={renderHeader}
                minHeaderHeight={100}
                animationHeaderPosition={animationHeaderPosition}
                animationHeaderHeight={animationHeaderHeight}
                renderTabBar={renderTabBar}
            />
        </SafeAreaView>
    </>
    );
}