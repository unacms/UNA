import { RefreshControl, Platform, Animated } from 'react-native';
import { View } from 'app/design/view'
import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { LegendList } from "@legendapp/list";
import { useSetScrollDirection, useHeaderHeight, useSetScrollValue } from 'app/context/jotai/layout';
import { nextScrollDirectionFromDelta } from 'app/lib/scroll-navigation-state';

export default function UniList(props) {
    const uniRef = useRef();
    const { 
        preloadComponent, 
        contentContainerStyle: contentContainerStyleProp, 
        ListHeaderComponent, 
        scrollProps, 
        isModal, 
        data, 
        renderItem, 
        onEndReached, 
        onStartReached,
        ListFooterComponent, 
        refer, 
        refreshing, 
        inverted,
        onRefresh, 
        ...rest 
    } = props;

    const scrollY = useRef(0);
    const scrollState = useRef(0);
    const accDir = useRef(0);
    const setScrollDirection = useSetScrollDirection();
    const setScrollValue = useSetScrollValue();

    const headerHeightFromAtom = useHeaderHeight();
    
    const headerHeight = useMemo(() => {
        if (typeof headerHeightFromAtom === 'number') {
            return headerHeightFromAtom;
        }
        return typeof scrollProps?.headerHeight === 'number' 
            ? scrollProps.headerHeight 
            : 0;
    }, [headerHeightFromAtom, scrollProps?.headerHeight]);
    
    const filteredData = useMemo(() => 
        data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
        [data]
    );
    const [showContent, setShowContent] = useState(!preloadComponent);
    const revealTimerRef = useRef(null);
    const lastPreloadRef = useRef(preloadComponent);
    const contentOpacity = useRef(new Animated.Value(preloadComponent ? 0 : 1)).current;
    const preloadOpacity = useRef(new Animated.Value(preloadComponent ? 1 : 0)).current;

    useEffect(() => {
        if (preloadComponent) {
            lastPreloadRef.current = preloadComponent;
        }
    }, [preloadComponent]);

    useEffect(() => {
        if (revealTimerRef.current) {
            clearTimeout(revealTimerRef.current);
        }

        if (preloadComponent) {
            setShowContent(false);
            contentOpacity.setValue(0);
            preloadOpacity.setValue(1);
            return;
        }

        if (!lastPreloadRef.current) {
            setShowContent(true);
            contentOpacity.setValue(1);
            preloadOpacity.setValue(0);
            return;
        }

        setShowContent(false);
        contentOpacity.setValue(0);
        preloadOpacity.setValue(1);
        revealTimerRef.current = setTimeout(() => {
            setShowContent(true);
            Animated.parallel([
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(preloadOpacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 140);

        return () => {
            if (revealTimerRef.current) {
                clearTimeout(revealTimerRef.current);
            }
        };
    }, [preloadComponent, contentOpacity, preloadOpacity]);

    const handleScroll = useCallback((event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        setScrollValue(currentScrollY);
        const previousScrollY = scrollY.current;

        const next = nextScrollDirectionFromDelta(previousScrollY, currentScrollY, accDir);
        if (next !== null && next !== scrollState.current) {
            scrollState.current = next;
            setScrollDirection(next);
        }
        scrollY.current = currentScrollY;
    }, [setScrollDirection, setScrollValue]);

    const handleScrollToIndexFailed = useCallback((info) => {
        console.log('onScrollToIndexFailed', info);
    }, []);

    const shouldApplyHeaderOffset = !inverted && !isModal;
    const shouldApplyFooterOffset = inverted && !isModal;

    // 🔧 Правильная обработка ListHeaderComponent (может быть функцией или компонентом)
    const enhancedListHeaderComponent = useCallback(() => {
        return (
            <>
                {shouldApplyHeaderOffset && headerHeight > 0 && (
                    <View style={{ height: headerHeight }} />
                )}
                {ListHeaderComponent && (
                    typeof ListHeaderComponent === 'function' 
                        ? <ListHeaderComponent /> 
                        : ListHeaderComponent
                )}
                {shouldApplyFooterOffset && headerHeight > 0 && inverted && (
                    <View style={{ height: headerHeight }} />
                )}
            </>
        );
    }, [shouldApplyHeaderOffset, headerHeight, ListHeaderComponent]);

    // 🔧 Правильная обработка ListFooterComponent (может быть функцией или компонентом)
    const enhancedListFooterComponent = useCallback(() => {
        return (
            <>
                {ListFooterComponent && (
                    typeof ListFooterComponent === 'function' 
                        ? <ListFooterComponent /> 
                        : ListFooterComponent
                )}
                {shouldApplyFooterOffset && headerHeight > 0 && !inverted && (
                    <View style={{ height: headerHeight }} />
                )}
            </>
        );
    }, [shouldApplyFooterOffset, headerHeight, ListFooterComponent]);

    const refreshControl = useMemo(() => 
        props.url ? (
            <RefreshControl 
                progressViewOffset={headerHeight || 100} 
                size="large" 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
            />
        ) : null,
        [props.url, headerHeight, refreshing, onRefresh]
    );

    const overlayPreload = preloadComponent || lastPreloadRef.current;

    return (
        <View className="w-full flex-1">
            <Animated.View style={{ opacity: contentOpacity, flex: 1 }}>
                <LegendList
                    contentContainerStyle={contentContainerStyleProp}
                    ref={refer || uniRef}
                    onEndReachedThreshold={4}
                    data={filteredData}
                    ListHeaderComponent={enhancedListHeaderComponent}
                    ListFooterComponent={enhancedListFooterComponent}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    onEndReached={onEndReached}
                    onStartReached={onStartReached}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="always"
                    onScrollToIndexFailed={handleScrollToIndexFailed}
                    refreshControl={refreshControl}
                    alignItemsAtEnd={inverted}
                    maintainScrollAtEnd={inverted}
                    contentInsetAdjustmentBehavior="never"
                    automaticallyAdjustContentInsets={false}
                    onStartReachedThreshold={inverted ? 4 : undefined}
                    initialScrollIndex={inverted && filteredData.length > 0 ? filteredData.length - 1 : undefined}
                    {...rest}
                />
            </Animated.View>
            {overlayPreload && (
                <Animated.View
                    pointerEvents="none"
                    style={{
                        opacity: preloadOpacity,
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                    }}
                >
                    <View className="w-full" style={{ height: headerHeight }} />
                    {overlayPreload}
                </Animated.View>
            )}
        </View>
    );
}