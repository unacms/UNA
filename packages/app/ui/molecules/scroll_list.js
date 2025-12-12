import { View } from 'app/design/view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect } from 'react';
import { Theme } from 'app/design/theme';
import { appSetting } from 'app/lib/util'
import { Button } from 'app/design/controls';
import { Header } from 'app/ui/molecules/scroll_list_header';
import { useCurrentUser } from 'app/context/user'
import { KbAvoidingViewScroll } from 'app/ui/atoms/kb-avoiding-view'

export default function ScrollList({
    content,
    index,
    pageData,
    headerHeight = 56,
    isBackButton = false,
    contentType,
    refer,
    inverted,
    headerComponent,
    subHeaderComponent,
    rightHeaderComponent,
    isMenuNameAsTitle = false,
    isNoContainer = false,
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

    const animationConfig = {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    };

    const headerStyle = useAnimatedStyle(() => {
        const isShow =
            isProfileHeader ?
                scrollY.value > showHeaderForProfileOffset
                :
                scrollDirection.value === 'up' ||
                scrollY.value < transparencyOffset ||
                scrollY.value === 0;
        return {
            opacity: isShow ? withTiming(1, animationConfig) : withTiming(0, animationConfig),
            transform: [
                { translateY: isShow ? withTiming(0, animationConfig) : withTiming(-114, animationConfig) },
            ],
        };
    }, []);

    const buttonStyle = useAnimatedStyle(() => {
        return {
            opacity: scrollY.value > transparencyOffset ? withTiming(1) : withTiming(0),
        };
    });

    useEffect(() => {
        scrollY.value = 0;
    }, [index]);


    // NOTE:
    // - `useAnimatedScrollHandler` returns a Reanimated event handler object, which will crash if passed
    //   to non-Reanimated lists (e.g. @legendapp/list). We keep `onScroll` as a plain JS function so it
    //   is safe for both RN ScrollView/FlatList and Reanimated Animated.* components.
    const originalOnScroll = content?.props?.onScroll;
    const onScroll = useCallback(
        (event) => {
            const y =
                event?.contentOffset?.y ??
                event?.nativeEvent?.contentOffset?.y ??
                0;
            const currentY = Math.round(y / 10) * 10;

            if (currentY !== scrollY.value) {
                scrollDirection.value = currentY > scrollY.value ? 'down' : 'up';
                scrollY.value = currentY;
            }

            if (typeof originalOnScroll === 'function') {
                originalOnScroll(event);
            }
        },
        [originalOnScroll, scrollDirection, scrollY]
    );

    const scrollToTop = () => {
        const scrollFn = contentType === 'FlatList' ? 'scrollToOffset' : 'scrollTo';
        refer?.current?.[scrollFn]?.({ y: 0, x: 0, animated: true });
    };

    /* ANIMATION */

    /*const baseProps = {
        ...(contentType !== 'FlatList' && { paddingTop: headerHeight }),
        ...(isCollapsibleHeader && { onScroll }),
        style: { backgroundColor: colors.headerBackground }
    };*/

   /* const enhanced = React.cloneElement(content, baseProps);
*/
    const isFlatList = contentType === 'FlatList';

    const baseProps = isFlatList
  ? {
     /* renderScrollComponent: (props) => (
        <KbAvoidingViewScroll {...props} />
      ),*/
     /* paddingTop: headerHeight,*/
      ...(isCollapsibleHeader ? { onScroll, scrollEventThrottle: 16 } : {}),
    }
  : {};

    const enhanced = React.cloneElement(content, baseProps);

    return (
        <View className='w-full h-full'>
            <Animated.View className="absolute top-0 w-full z-50" style={[headerStyle]}>
                <BlurView tint="default"
                    intensity={100}
                    experimentalBlurMethod="none" className={`w-full h-[${headerHeight}px]`} >
                    <View className="w-full" style={{ backgroundColor: colors.headerBackground }} >
                        <Header
                            backButtonPresented={isBackButton}
                            headerComponent={headerComponent}
                            rightHeaderComponent={rightHeaderComponent}
                            pageData={pageData}
                            scrollToTop={scrollToTop}
                            isMenuNameAsTitle={isMenuNameAsTitle}
                            isNoContainer={isNoContainer}
                        />
                        {subHeaderComponent}
                    </View>
                </BlurView>

            </Animated.View>
            {isFlatList ? enhanced : <KbAvoidingViewScroll onScroll={onScroll} paddingTop={headerHeight}>
                {enhanced}
            </KbAvoidingViewScroll>}
            </View>
    )
}
