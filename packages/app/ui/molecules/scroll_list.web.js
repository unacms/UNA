import { View } from 'app/design/view';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { appSetting, isShowCover, getPageSettings } from 'app/lib/util'
import { Header, TextHeader } from 'app/ui/molecules/scroll_list_header';
import { useCurrentUser } from 'app/context/user';
import { getMenuSettings } from 'app/lib/util'
import { useIsDesktop } from 'app/context/measure';

export default function ScrollList({
    content,
    pageData,
    headerHeight = 56,
    bottomPadding = 64,
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
    const isDesktop = useIsDesktop();
    const isCollapsibleHeader = appSetting('native', 'collapsible_header') && !isDesktop;
    const { currentUser } = useCurrentUser();
    
    const [showHeader, setShowHeader] = useState(true);
    const lastScrollYRef = useRef(0);

    const handleScroll = useCallback(() => {
        if (!isCollapsibleHeader) return;
        
        requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            const isScrollingUp = currentScrollY < lastScrollYRef.current;
            const isAtTop = currentScrollY < 100; // small buffer for top

            if (isScrollingUp || isAtTop) {
                setShowHeader(true);
            } else if (currentScrollY > 100) {
                setShowHeader(false);
            }
            
            lastScrollYRef.current = currentScrollY;
        });
    }, [isCollapsibleHeader]);

    useEffect(() => {
        if (isCollapsibleHeader) {
            window.addEventListener('scroll', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll);
            };
        }
    }, [handleScroll, isCollapsibleHeader]);

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

    const isSimplePage = ['home', 'login', 'create-account'].includes(pageData?.uri) && !currentUser;
    const baseProps = {};

    if (!isShowCover(pageData?.cover, currentUser,pageData?.url))
        return content;

    const enhanced = React.cloneElement(content, baseProps);
    const settings = getPageSettings(pageData?.config, pageData?.uri);
    if (!subHeaderComponent && !isSimplePage && !currentUser && (!settings?.headerSettings || settings?.headerSettings?.header)) {
        let textName = pageData?.name;
        if (isMenuNameAsTitle) {
            const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config);
            textName = menuSettings.name;
        }
        headerHeight = 116;
        subHeaderComponent = (
            <View className='px-3 items-start py-2 justify-center '>
                <TextHeader text={textName} />
            </View>
        );
    }

    const headerClasses = `backdrop-blur-xl w-full bg-card fixed top-0 left-0 z-50 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`;

    return (
        <View className="flex-auto" style={{ paddingTop: !isDesktop && !useCustomScrollHandler ? headerHeight : 0, paddingBottom: !isDesktop ? bottomPadding : 0 }}>
            {enhanced}
            {!isDesktop && (
                <View className={headerClasses}>
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
            )}
        </View>
    )
}