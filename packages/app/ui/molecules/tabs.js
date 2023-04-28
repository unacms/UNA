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
import {BlockByName2} from 'app/components/block';
import Unit from 'app/components/unit';
import { appSetting } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher';

const StatusBarHeight = StatusBar.currentHeight ?? 0;

export function Tabs({header, smallHeader, minHeaderHeight, isHideDefaultHeader, initRoutes}) {

    let [routes, setRoutes] = useState(initRoutes);
    let [inc, setInc] = useState(0);

    const scroll = useSharedValue(1);
    const navigation = useNavigation();
    //const [ isRefreshing, setIsRefreshing ] = useState(false);
    const { colors } = Theme();
    const startAnimationFrom = 200;

    
    if ('undefined' === typeof minHeaderHeight)
        minHeaderHeight = 100

    if ('undefined' === typeof isHideDefaultHeader)
        isHideDefaultHeader = false    
    
    const [index, setIndex] = useState(routes[0].index);
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);

    const handleEndReached = async () => {
        console.log('End reached')
        let c = routes.filter((item) => item.index == index);
        if (c && c[0].endpoint && !c[0].endpoint.finished){
            let params = Object.assign({}, c[0].endpoint.params)
            params.start = parseInt(params.start) + parseInt(params.per_page);
            let sRequest = c[0].endpoint.request_url + JSON.stringify({'params': params});

            const sResponse = await fetcher(sRequest);
            let tmp = routes;
            
            tmp[0].data = tmp[0].data.concat(sResponse.data[0].data.data);
            tmp[0].endpoint.params.start = params.start;
            if (sResponse.data[0].data.data.length == 0)
                tmp[0].endpoint.finished = true
            
            setRoutes(tmp)
            //let a=inc++
            //console.log("!!!!!!!!!!!!!!-"+inc);
            //setInc(a);
           // console.log("------------",tmp[0].data.length, sRequest);
        }
    };

    if(isHideDefaultHeader){
        setTimeout(() => {
            navigation.setOptions({headerShown: false})
        }, 300);
    }

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
               // onEndReached = {handleEndReached} 
                data={route.data}
                estimatedItemSize={60}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => {
                  
                    console.log('-----item.id=', route.index+'-'+item.id);
                    if (item?.type =='block'){
                        return <View key={route.index+'-'+item.id}><BlockByName2 b={item.data} name={item.block} /></View>
                    } 
                    else{
                        return <View key={route.index+'-'+item.id}><Unit unit={route?.endpoint?.unit} data={item} mode={appSetting('feed', 'default_view')}  /></View>
                    }
                }}
                
            />
        );
    };

    let renderScene = useCallback(({ route }) => {
        // console.log('useCallback--------------------',route.data.length)
         return <TabScene route={route} index={route.index} />;
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
            {props.navigationState.routes.map(a => (props.navigationState.index == a.index ? <Button disabled variant="text" title={a.title}  onPress={() => setIndex(a.index)} />: <Button variant="text" title={a.title} onPress={() => setIndex(a.index)} />))}
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
                    {header}
                </Animated.View>
                <Animated.View style={[{width:'100%', position:'absolute', bottom:0, }, animatedStyleB]}>
                    {smallHeader}
                </Animated.View>
            </View>
        );
    }, [scroll]);
    
    console.log('TabView--------------------',routes[0].data.length)
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
                minHeaderHeight={minHeaderHeight}
                animationHeaderPosition={animationHeaderPosition}
                animationHeaderHeight={animationHeaderHeight}
                renderTabBar={renderTabBar}
            />
        </SafeAreaView>
    </>
    );
}