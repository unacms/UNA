import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { nativeDriver } from 'app/lib/animation';
import { appSetting } from 'app/lib/util';
import {
    PageHeaderBody,
    PageHeaderSmall,
    TextHeader,
    usePageHeaderBase,
} from 'app/ui/molecules/page_header_parts';

export { PageHeaderSmall, TextHeader };

export const PageHeader = ({ pageData }) => {

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
            duration: 300,
            useNativeDriver: nativeDriver,
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
