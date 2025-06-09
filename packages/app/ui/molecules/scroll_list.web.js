import { View } from 'app/design/view';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useState } from 'react';
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
    const pageScrollThreshold = 10;
    const animationDuration = 300;
    const { colors } = Theme();
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();
    const [isPageScrolled, setIsPageScrolled] = useState(false);

    const updateIsPageScrolledState = (currentScrollY) => {
        setIsPageScrolled(currentScrollY > pageScrollThreshold);
    };

    const handleScroll = useCallback(() => {
        requestAnimationFrame(() => {
            updateIsPageScrolledState(window.scrollY);
        });
    }, []);

    useEffect(() => {
        if (isSmallScreen) {
            window.addEventListener('scroll', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll);
            };
        }
    }, [isSmallScreen, handleScroll]);

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

    const onScroll = (event) => {
        if (inverted)
            updateIsPageScrolledState(event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight);
        else
            updateIsPageScrolledState(event.target.scrollTop);
    };

    // Don't add scroll handlers for simple pages like splash, login, create-account
    const isSimplePage = ['home', 'login', 'create-account'].includes(pageData.uri);
    
    let enhanced;
    if (isSimplePage) {
        // For simple pages, don't add any scroll handling props
        enhanced = content;
    } else {
        const baseProps = {
            ...((useCustomScrollHandler && isCollapsibleHeader) && { onScroll }),
        };
        enhanced = React.cloneElement(content, baseProps);
    }
    if (!currentUser && !subHeaderComponent && !['home', 'login', 'create-account'].includes(pageData.uri)) {
        let textName = pageData?.name;
        if (isMenuNameAsTitle) {
            const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config);
            textName = menuSettings.name;
        }
        headerHeight = 120;
        subHeaderComponent = (
            <View className='px-[12px] sm:px-[16px] items-start py-[10px] justify-center  web:duration-300'>
                <TextHeader text={textName} />
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ paddingTop: isSmallScreen && !useCustomScrollHandler ? headerHeight : 0 }}>
            {enhanced}
            {isSmallScreen && <View style={{ position: 'fixed', top: 0, left: 0, width: '100%' }}>

                <View 
                    className={`w-full transition-all  web:duration-300 ease-in-out will-change-transform ${
                        isPageScrolled
                            ? 'bg-bgrnavbar/80 dark:bg-bgrnavbar-d/80 backdrop-blur-lg shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]'
                            : 'bg-transparent dark:bg-transparent shadow-none'
                    }`}
                >
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

            </View>}
            {isShowScrollToTopButton && <View style={{ position: 'fixed', right: 10, bottom: 140, zIndex: 1000 }}>
                <Button
                    onPress={scrollToTop}
                    startDecorator={inverted ? "ChevronDown" : "ChevronUp"}
                    size="sm"
                    variant="primary"
                    rounded
                ></Button>
            </View>}
        </View>
    )
}
