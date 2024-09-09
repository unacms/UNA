import { /*MasonryFlashList,*/ FlashList } from "@shopify/flash-list";
import { useState, useCallback, useMemo, useRef } from 'react';
import { RefreshControl } from 'react-native';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function UniList(props) {
    let { data, renderItem, onEndReached, ListFooterComponent, refer, onScrollToIndex, numColumns, keyExtractor, unit, refreshing, onRefresh, ...rest } = props
    const unitSizeMap = {
        notifications: 40,
        feed: 200,
    };
   
    const estimatedItemSize = unitSizeMap[unit] || 400;
    
    const filteredData = useMemo(() => {
        return data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      }, [data]);
    
    
    /*const onLoadListener = useCallback(({ elapsedTimeInMs } ) => {
        console.log("Sample List load time", elapsedTimeInMs);
    }, []);*/

    return (
        <FlashList  
           // onLoad={onLoadListener}
            ref = {refer}   
            keyExtractor={item => item.id}
            onEndReachedThreshold={1}
            numColumns={numColumns}
            estimatedItemSize={estimatedItemSize}
            data={filteredData}
            renderItem={renderItem}
            onEndReached = {onEndReached} 
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
