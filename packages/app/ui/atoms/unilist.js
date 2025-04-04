import { /*MasonryFlashList,*/ FlashList } from "@shopify/flash-list";
import { RefreshControl } from 'react-native';
import { View } from 'app/design/view'
import Animated from 'react-native-reanimated';
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react';

export default function UniList(props) {
    const uniRef = useRef();
    const { preloadComponent, contentContainerStyle, scrollProps, data, mode, renderItem, onEndReached, maxToRenderPerBatch, initialNumToRender, ListFooterComponent, refer, onScrollToIndex, numColumns, keyExtractor, unit, refreshing, onRefresh, height, ...rest } = props
    const unitSizeMap = {
        notifications: 40,
        feed: 200,
    };

    const estimatedItemSize = unitSizeMap[unit] || 400;

    const filteredData = data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    if (numColumns > 1)
        mode = '';

    if (mode == 'simple') {
        const content = preloadComponent ? <View className="w-full">
            <View className={`w-full `} style={{ height: scrollProps?.headerHeight }}></View>
            {preloadComponent}
        </View> : <Animated.FlatList
            contentContainerStyle={{
                ...(scrollProps?.headerHeight && !scrollProps?.inverted ? { paddingTop: scrollProps.headerHeight } : {}),
                ...(scrollProps?.headerHeight && scrollProps?.inverted ? { paddingBottom: scrollProps.headerHeight } : {}),
                ...contentContainerStyle,
            }}
            ref={refer ? refer : uniRef}
            onEndReachedThreshold={4}
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            onEndReached={onEndReached}
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
                    <RefreshControl progressViewOffset={100} size={'large'} refreshing={refreshing} onRefresh={onRefresh} />
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
                {...scrollProps}
            />

        )
    }

    return (
        <FlashList
            ref={refer}
            contentContainerStyle={contentContainerStyle}
            keyExtractor={item => item.id}
            onEndReachedThreshold={1}
            numColumns={numColumns}
            estimatedItemSize={estimatedItemSize}
            data={filteredData}
            renderItem={renderItem}
            onEndReached={onEndReached}
            ListFooterComponent={ListFooterComponent}
            {...rest}
            refreshControl={
                props.url ? (
                    <RefreshControl progressViewOffset={100} size={'large'} refreshing={refreshing} onRefresh={onRefresh} />
                ) : null
            }
        />
    )
    // }
}
