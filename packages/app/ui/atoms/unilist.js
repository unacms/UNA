//import { /*MasonryFlashList,*/ FlashList } from "@shopify/flash-list";
import { RefreshControl, FlatList } from 'react-native';
import { View } from 'app/design/view'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef, useCallback } from 'react';
import { LegendList } from "@legendapp/list";
import { useSetAtom, useAtomValue } from 'jotai';
import { scrollDirectionAtom, headerHeightAtom } from 'app/context/jotai/layout';

export default function UniList(props) {
    const uniRef = useRef();
    const { preloadComponent, contentContainerStyle, scrollProps, data, index, mode, renderItem, onEndReached, maxToRenderPerBatch, initialNumToRender, ListFooterComponent, refer, onScrollToIndex, numColumns, keyExtractor, unit, refreshing, onRefresh, height, ...rest } = props

    const scrollY = useRef(0); // Добавить для отслеживания позиции
    const scrollState = useRef(0); // Добавить для отслеживания состояния: 0, 1 или -1
    const setScrollDirection = useSetAtom(scrollDirectionAtom); // Добавить
    const headerHeightFromAtom = useAtomValue(headerHeightAtom);
    // Prefer measured shared header height when available, otherwise fall back to legacy scrollProps.
    const headerHeight =
        typeof headerHeightFromAtom === 'number' && headerHeightFromAtom > 0
            ? headerHeightFromAtom
            : (typeof scrollProps?.headerHeight === 'number' ? scrollProps.headerHeight : 0);
    const filteredData = data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    // Добавить обработчик скролла
    const handleScroll = useCallback((event) => {
        const SCROLL_OFFSET_THRESHOLD = 100;
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const previousScrollY = scrollY.current;
        
        let newScrollState;
        
        if (currentScrollY < SCROLL_OFFSET_THRESHOLD) {
            newScrollState = 0;
        } else if (currentScrollY > previousScrollY && currentScrollY > 0) {
            newScrollState = 1; // Скролл вниз
        } else if (currentScrollY < previousScrollY) {
            newScrollState = -1; // Скролл вверх
        } else {
            newScrollState = scrollState.current;
        }
        
        if (newScrollState !== scrollState.current) {
            setScrollDirection(newScrollState);
            scrollState.current = newScrollState;
        }
        scrollY.current = currentScrollY;
    }, [setScrollDirection]);

    if (mode == 'simple') {
        const content = preloadComponent ? <View className="w-full flex-1">
            <View className={`w-full`} style={{ height: headerHeight }} />
            {preloadComponent}
        </View> : <LegendList
            contentContainerStyle={{
                ...(headerHeight && !scrollProps?.inverted ? { paddingTop: headerHeight } : {}),
                ...(headerHeight && scrollProps?.inverted ? { paddingBottom: headerHeight } : {}),
                ...contentContainerStyle,
            }}
            ref={refer ? refer : uniRef}
            onEndReachedThreshold={4}
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            onEndReached={onEndReached}
            onScroll={handleScroll} // Добавить это свойство
            scrollEventThrottle={16} // Добавить для оптимизац
            keyboardShouldPersistTaps="always"
            ListFooterComponent={ListFooterComponent}
            onScrollToIndexFailed={(info) => {
                console.log('onScrollToIndexFailed', info)
                /*setTimeout(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 500);*/
            }}
            {...rest}
            refreshControl={
                props.url ? (
                    <RefreshControl progressViewOffset={headerHeight || 100} size={'large'} refreshing={refreshing} onRefresh={onRefresh} />
                ) : null
            }
        />

        if (!scrollProps)
            return content;
        return (
            <ScrollList
                content={content}
                contentType="FlatList"
                refer={refer ? refer : uniRef}
                index={index}
                {...scrollProps}
            />

        )
    }


}
