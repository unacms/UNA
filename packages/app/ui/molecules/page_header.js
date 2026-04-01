import { useEffect, useRef } from 'react';
import { Animated, Platform, View } from 'react-native';
import { appSetting } from 'app/lib/util';
import {
    PageHeaderBody,
    PageHeaderSmall,
    TextHeader,
    usePageHeaderBase,
} from 'app/ui/molecules/page_header-shared';

export { PageHeaderSmall, TextHeader };

/** Cached so we do not `require` the web implementation on every render. */
let PageHeaderWebModule;
function getPageHeaderWeb() {
    if (!PageHeaderWebModule) {
        PageHeaderWebModule = require('app/ui/molecules/page_header.web').PageHeader;
    }
    return PageHeaderWebModule;
}

function nativeCollapseDurationMs() {
    const v = Number(appSetting('layout', 'header', 'native_collapse_animation_ms'));
    return Number.isFinite(v) && v > 0 ? v : 300;
}

export const PageHeader = ({ pageData }) => {
    if (Platform.OS === 'web') {
        const PageHeaderWeb = getPageHeaderWeb();
        return <PageHeaderWeb pageData={pageData} />;
    }

    const headerState = usePageHeaderBase(pageData);
    const {
        header,
        headerHeight,
        isCollapsibleHeader,
        onHeaderLayout,
        scrollDirection,
    } = headerState;

    const headerTranslateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isCollapsibleHeader || headerHeight <= 0) {
            return;
        }

        Animated.timing(headerTranslateY, {
            toValue: scrollDirection === 1 ? -2 * headerHeight : 0,
            duration: nativeCollapseDurationMs(),
            useNativeDriver: true,
        }).start();
    }, [headerHeight, headerTranslateY, isCollapsibleHeader, scrollDirection]);

    if (header.header === false) {
        return null;
    }

    const HeaderContainer = isCollapsibleHeader ? Animated.View : View;
    const headerContainerStyle = isCollapsibleHeader
        ? {
            transform: [{ translateY: headerTranslateY }],
        }
        : undefined;

    return (
        <HeaderContainer
            className={appSetting('layout', 'header', 'container')}
            style={headerContainerStyle}
            pointerEvents={isCollapsibleHeader && scrollDirection === 1 ? 'none' : 'auto'}
            onLayout={onHeaderLayout}
        >
            <PageHeaderBody
                {...headerState}
                contentClassName={appSetting('layout', 'header', 'content')}
                pageData={pageData}
            />
        </HeaderContainer>
    );
};
