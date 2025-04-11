import { View } from 'app/design/view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect } from 'react';
import { Theme } from 'app/design/theme';
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Button } from 'app/design/controls';
import { useWindowDimensions } from 'react-native';
import { Header } from 'app/ui/molecules/scroll_list_header';

export default function ScrollList({ content, pageData, headerHeight = 64, isBackButton = false, contentType, refer, useCustomScrollHandler, inverted, headerComponent, subHeaderComponent, rightHeaderComponent, isMenuNameAsTitle = false }) {
    const { width } = useWindowDimensions();
    const isSmallScreen = width < LAYOUT_BREAKPOINTS.lg
    const isCollapsibleHeader = appSetting('native', 'collapsible_header') && isSmallScreen;
    const isShowScrollToTopButton = appSetting('native', 'scroll_to_top_button') && isSmallScreen;
    const transparencyOffset = 200;
    const animationDuration = 300;
    const { colors } = Theme();

    /* ANIMATION */
    const scrollY = useSharedValue(0);
    const scrollDirection = useSharedValue('none');

    const isShow = useDerivedValue(() => {
        return (
            scrollDirection.value === 'up' ||
            scrollY.value < transparencyOffset ||
            scrollY.value === 0
        );
    }, [scrollY, scrollDirection]);

    const isShowButton = useDerivedValue(() => {
        return (
            scrollY.value > transparencyOffset
        );
    }, [scrollY, transparencyOffset]);

    const headerStyle = useAnimatedStyle(() => {
        const opacityValue = withTiming(isShow.value ? 1 : 0, { duration: animationDuration });
        const transformValue = withTiming(isShow.value ? 0 : -114, { duration: animationDuration });
        return {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            opacity: opacityValue,
            transform: [
                { translateY: transformValue },
            ],
        };
    }, [scrollDirection, scrollY, isShow]);

    const buttonStyle = useAnimatedStyle(() => {

        const opacityValue = withTiming(isShowButton.value ? 1 : 0, { duration: animationDuration });
        return {
            position: 'fixed',
            right: 10,
            bottom: 140,
            zIndex: 1000,
            opacity: opacityValue,
        };
    }, [isShowButton]);

    const updateScroll = (value) => {
        const currentY = Math.round(value / 10) * 10;
        if (currentY === scrollY.value) return;
        scrollDirection.value = currentY > scrollY.value ? 'down' : 'up';
        scrollY.value = currentY;
    };

    const onScroll = (event) => {
        if(inverted)
            updateScroll(event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight);
        else
            updateScroll(event.target.scrollTop);            
    };

    const handleScroll = useCallback(() => {
        requestAnimationFrame(() => {
            updateScroll(window.scrollY);
        });
    }, [scrollDirection, scrollY]);

    useEffect(() => {
        if (isCollapsibleHeader) {
            window.addEventListener('scroll', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    const scrollToTop = () => {
        if (contentType === 'FlatList') {
            refer?.current?.scrollToIndex({
                index: inverted ? 100000 : -1,
                align: 'end',
                behavior: 'smooth'
            });
        }
        else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    /* ANIMATION */

    const baseProps = {
        ...(useCustomScrollHandler && { onScroll }),
    };

    const enhanced = React.cloneElement(content, baseProps);

    return (
        <View className="flex-1" style={{ paddingTop: isSmallScreen && !useCustomScrollHandler ? headerHeight : 0 }}>
            {enhanced}
            {isSmallScreen && <Animated.View style={[headerStyle]}>
                
                    <View className="w-full backdrop-blur " style={{ backgroundColor: colors.headerBackground }} >
                        <Header
                            backButtonPresented={isBackButton}
                            headerComponent={headerComponent}
                            rightHeaderComponent={rightHeaderComponent}
                            pageData={pageData}
                            scrollToTop={scrollToTop}
                            router={null}
                            isMenuNameAsTitle={isMenuNameAsTitle}
                        />
                        {subHeaderComponent}
                    </View>

            </Animated.View>}
            {isShowScrollToTopButton && <Animated.View style={[buttonStyle]}>
                <Button
                    onPress={scrollToTop}
                    startDecorator={inverted ? "ChevronDown" : "ChevronUp"}
                    size="sm"
                    variant="primary"
                    rounded
                ></Button>
            </Animated.View>}
        </View>
    )
}
