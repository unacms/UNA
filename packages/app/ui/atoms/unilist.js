import { RefreshControl, Platform } from 'react-native';
import { View } from 'app/design/view'
import { useRef, useCallback, useMemo } from 'react';
import { LegendList } from "@legendapp/list";
import { useSetScrollDirection, useHeaderHeight, useSetScrollValue } from 'app/context/jotai/layout';

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

    const handleScroll = useCallback((event) => {
        const SCROLL_OFFSET_THRESHOLD = 100;
        const currentScrollY = event.nativeEvent.contentOffset.y;
        setScrollValue(currentScrollY);
        const previousScrollY = scrollY.current;

        let newScrollState;

        if (currentScrollY < SCROLL_OFFSET_THRESHOLD) {
            newScrollState = 0;
        } else if (currentScrollY > previousScrollY && currentScrollY > 0) {
            newScrollState = 1;
        } else if (currentScrollY < previousScrollY) {
            newScrollState = -1;
        } else {
            newScrollState = scrollState.current;
        }

        if (newScrollState !== scrollState.current) {
            setScrollDirection(newScrollState);
            scrollState.current = newScrollState;
        }
        scrollY.current = currentScrollY;
    }, [setScrollDirection, setScrollValue]);

    const handleScrollToIndexFailed = useCallback((info) => {
        console.log('onScrollToIndexFailed', info);
    }, []);

    const shouldApplyHeaderOffset = !inverted && !isModal;
    const shouldApplyFooterOffset = inverted && !isModal;

    // ?? Правильная обработка ListHeaderComponent (может быть функцией или компонентом)
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

    if (preloadComponent) {
        return (
            <View className="w-full flex-1">
                <View className="w-full" style={{ height: headerHeight }} />
                {preloadComponent}
            </View>
        );
    }

    return (
        
        <LegendList
            contentContainerStyle={contentContainerStyleProp}
            ref={refer || uniRef}
            onEndReachedThreshold={1}
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
    );
}