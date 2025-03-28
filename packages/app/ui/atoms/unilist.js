import { /*MasonryFlashList,*/ FlashList } from "@shopify/flash-list";
import { RefreshControl } from 'react-native';
import { View } from 'app/design/view'
import { FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    useAnimatedRef,
    useScrollViewOffset,
    withTiming,
} from 'react-native-reanimated';
import Header from 'app/components/nav/header';
import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import ScrollList from 'app/ui/molecules/scroll_list'

export default function UniList(props) {

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
        const content = preloadComponent ? <View style={{paddingTop:scrollProps?.headerHeight}}>{preloadComponent}</View> : <Animated.FlatList
            contentContainerStyle={{
                ...(scrollProps?.headerHeight ? { paddingTop: scrollProps.headerHeight } : {}),
                ...contentContainerStyle,
            }}
            ref={refer}
            onEndReachedThreshold={4}
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            onEndReached={onEndReached}
            keyboardShouldPersistTaps="always"
            ListFooterComponent={ListFooterComponent}
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
                       content = {content}
                       contentType = "FlatList"
                       ref={refer}
                       {...scrollProps}
                    />
            
        )
    }

    return (
        <FlashList
            ref={refer}
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
