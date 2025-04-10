import { View } from 'app/design/view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Theme } from 'app/design/theme';
import { appSetting } from 'app/lib/util'
import { Button } from 'app/design/controls';
import { Header } from 'app/ui/molecules/scroll_list_header';
import { useEffect } from 'react';
// TODO OPTIMIZATION
export default function ScrollList({ 
    content, 
    index,
    pageData, 
    headerHeight = 64, 
    isBackButton = false, 
    contentType, 
    refer, 
    inverted, 
    headerComponent, 
    subHeaderComponent, 
    rightHeaderComponent, 
    isMenuNameAsTitle = false,
    isProfileHeader = false,
}) {

    const isCollapsibleHeader = appSetting('native', 'collapsible_header');
    const isShowScrollToTopButton = appSetting('native', 'scroll_to_top_button');
    const transparencyOffset = 200
    const showHeaderForProfileOffset = 350
    const { colors } = Theme();

    /* ANIMATION */
    const scrollY = useSharedValue(0);
    const scrollDirection = useSharedValue('none');

    const headerStyle = useAnimatedStyle(() => {
        const isShow =
            isProfileHeader ?
                scrollY.value > showHeaderForProfileOffset
            :
            scrollDirection.value === 'up' ||
            scrollY.value < transparencyOffset ||
            scrollY.value === 0 ;
        return {
            opacity: isShow ? withTiming(1) : withTiming(0),
            transform: [
                { translateY: isShow ? withTiming(0) : withTiming(-50) },
            ],
        };
    });

    const buttonStyle = useAnimatedStyle(() => {
        return {
            opacity: scrollY.value > transparencyOffset ? withTiming(1) : withTiming(0),
        };
    });

    useEffect(() => {
        scrollY.value = 0;
    }, [index]);
    

    const onScroll = useAnimatedScrollHandler((event) => {
        const currentY = Math.round(event.contentOffset.y / 10) * 10;
        if (currentY === scrollY.value) return;
        scrollDirection.value = currentY > scrollY.value ? 'down' : 'up';
        scrollY.value = currentY;
    });

    const scrollToTop = () => {
        const scrollFn = contentType === 'FlatList' ? 'scrollToOffset' : 'scrollTo';
        refer?.current?.[scrollFn]?.({ y: 0, x: 0, animated: true });
    };
    /* ANIMATION */

    const baseProps = {
        ...(contentType !== 'FlatList' && { paddingTop: headerHeight }),
        ...(isCollapsibleHeader && { onScroll }),
        style: { backgroundColor: colors.headerBackground }
    };

    const enhanced = React.cloneElement(content, baseProps);

    return (
        <View className="flex-1">
            {enhanced}
            <Animated.View className="absolute top-0 w-full " style={[headerStyle]}>
                <BlurView tint="default"
                    intensity={100}
                    experimentalBlurMethod="none" className={`w-full h-[${headerHeight}px]`} >
                    <View className="w-full" style={{ backgroundColor: colors.headerBackground }} >
                        <Header
                            backButtonPresented = {isBackButton}
                            headerComponent = {headerComponent}
                            rightHeaderComponent = {rightHeaderComponent}
                            pageData = {pageData}
                            scrollToTop = {scrollToTop}
                            isMenuNameAsTitle={isMenuNameAsTitle}
                            isNoContainer={isProfileHeader}
                            
                        />
                        {subHeaderComponent}
                    </View>
                </BlurView>

            </Animated.View>
            {isShowScrollToTopButton && <Animated.View className="absolute bottom-[10px] right-[10px]" style={[buttonStyle]}>
                <Button
                    onPress={scrollToTop}
                    startDecorator={inverted ? "ChevronDown" : "ChevronUp"}
                    size="lg"
                    variant="primary"
                    rounded
                ></Button>
            </Animated.View>
            }
        </View>
    )
}
