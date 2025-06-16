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
import { Header, TextHeader } from 'app/ui/molecules/scroll_list_header';
import { useCurrentUser } from 'app/context/user';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography'
import { getMenuSettings } from 'app/lib/util'


export default function ScrollList({
    content,
    pageData,
    headerHeight = 64,
    isBackButton = false,
    contentType,
    refer,
    useCustomScrollHandler,
    inverted,
    headerComponent,
    subHeaderComponent,
    rightHeaderComponent,
    isMenuNameAsTitle = false,
    isNoContainer = false,
}) {
    const { width } = useWindowDimensions();
    const tabletModeFrom = appSetting('layout', 'tablet_mode_from');
    const isSmallScreen = width < LAYOUT_BREAKPOINTS[tabletModeFrom]
    const isCollapsibleHeader = appSetting('native', 'collapsible_header') && isSmallScreen;
    const isShowScrollToTopButton = appSetting('native', 'scroll_to_top_button') && isSmallScreen;
    const transparencyOffset = 200;
    const animationDuration = 300;
    const { colors } = Theme();
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();

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
        if (inverted)
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

     const isSimplePage = ['home', 'login', 'create-account'].includes(pageData?.uri) && !currentUser;
     console.log("isSimplePage", isSimplePage)
    const baseProps = {
        ...((useCustomScrollHandler && isCollapsibleHeader && !isSimplePage) && { onScroll }),
    };

    const enhanced = React.cloneElement(content, baseProps);
   
    if (!subHeaderComponent && !isSimplePage) {
        let textName = pageData?.name;
        if (isMenuNameAsTitle) {
            const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config);
            textName = menuSettings.name;
        }
        headerHeight = 116;
        subHeaderComponent = (
            <View className='px-[12px] sm:px-[16px] items-start py-2 justify-center bg-bgrtabbar dark:bg-bgrtabbar-d border-b border-bdrtabbar dark:border-bdrtabbar-d shadow-sm'>
                <TextHeader text={textName} />
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ paddingTop: isSmallScreen && !useCustomScrollHandler ? headerHeight : 0 }}>
            {enhanced}
            {isSmallScreen && <Animated.View className="backdrop-blur-lg" style={[headerStyle]}>

                <View className="w-full bg-bgrnavbar/80 dark:bg-bgrnavbar-d/80 shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(0,0,0,0.1)]"  >
                    <Header
                        backButtonPresented={isBackButton}
                        headerComponent={headerComponent}
                        rightHeaderComponent={rightHeaderComponent}
                        pageData={pageData}
                        scrollToTop={scrollToTop}
                        router={null}
                        isMenuNameAsTitle={isMenuNameAsTitle}
                        isNoContainer={isNoContainer}
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
