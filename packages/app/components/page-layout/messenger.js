import { BlockByName, DataByName } from 'app/components/block';
import { TalksList } from 'app/components/elements/messenger';
import { Animated, TouchableOpacity, Platform, useWindowDimensions, Text } from "react-native";
import  LayoutDataContext from 'app/context/layout';
import {getScreenMode, getSpace, sDesktop} from "../elements/messenger/grid-utils";
import MessengerContext from "../elements/messenger/messenger-сontext";
import { View } from "../../design/view";
import {MenuColumn} from "../elements/messenger/menu";
import { useRef, useState } from "react";
import {Button} from "../../design/controls";

export default function PageLayout({ data , blocks: { main } }) {
    const isWeb = Platform.OS == 'web',
        { height, width } = useWindowDimensions(),
        sMode = getScreenMode(),
        iSpace = getSpace(sMode),
        iHeight = height - iSpace;

    const offsetValue = useRef(new Animated.Value(0)).current;
    // Scale Intially must be One...
    const scaleValue = useRef(new Animated.Value(1)).current;
    const scaleHistory = useRef(new Animated.Value(2)).current;

    const { content } = DataByName(data, main);
    console.log('----- log generate page layout ----');

    const [currentTab, setCurrentTab] = useState("Home");
    // To get the curretn Status of menu ...
    const [showMenu, setShowMenu] = useState(false);

    const oData = content[0].data;
    return isWeb ? <BlockByName data={ data } name={ main } /> :
        <LayoutDataContext>
            <MessengerContext.Provider value={{ device: 'phone', onSelect: () => {}, menu: 'index', talk: null, viewMenu: true, selectPanel: () => {
                    Animated.timing(scaleValue, {
                        toValue: showMenu ? 1 : 0.95,
                        duration: 200,
                        useNativeDriver: true
                    }).start();

                    Animated.timing(offsetValue, {
                        // YOur Random Value...
                        toValue: showMenu ? 0 : 260,
                        duration: 300,
                        useNativeDriver: true
                    }).start()

                    Animated.timing(scaleHistory, {
                        // YOur Random Value...
                        toValue: !showMenu ? -width : 0,
                        duration: 200,
                        useNativeDriver: true
                    }).start()

                    setShowMenu(!showMenu);
                } }}>
                <View style={{ height: iHeight }} className="w-full h-full overflow-hidden flex">
                    <MenuColumn {...oData.menu} colWidth={ `w-full justify-start max-w-[260] ` + ((!showMenu && 'hidden') || "") }/>
                    <Animated.View style={{
                        flexGrow: 1,
                        position: 'absolute',
                        top: 0, bottom: 0, left: 0, right: 0,
                        transform: [
                            { scale: scaleValue },
                            { translateX: offsetValue }
                        ]
                    }}>
                    <TalksList list={oData?.list?.items} stylesName={"bg-backgroundnavbar dark:bg-backgroundnavbar-dark opacity-100 z-10 border-l"}/>
                    </Animated.View>
                    <Animated.View style={{
                        flexGrow: 1,
                        //position: 'absolute',
                        top: 0, bottom: 0, left: width,
                        transform: [
                            { translateX: scaleHistory }
                        ]
                    }}>
                     <View className={"w-full text-center text-2xl border-l h-full flex items-center justify-center hidden"}>
                         <Text>History</Text>
                     </View>
                    </Animated.View>
                </View>
            </MessengerContext.Provider>
        </LayoutDataContext>;
}