import { /*MasonryFlashList,*/ FlashList } from "@shopify/flash-list";
import { useState, useCallback } from 'react';
import { RefreshControl } from 'react-native';

export default function UniList(props) {
    let { data, renderItem, onEndReached, ListFooterComponent, refer, onScrollToIndex, numColumns, keyExtractor, unit, refreshing, onRefresh, ...rest } = props
    let estimatedItemSize = 400;
    if (unit == 'notifications'){
        estimatedItemSize=40;
    }
    if (unit == 'feed'){
        estimatedItemSize=200;
    }
    
    data = data.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id)) === i);
    
    
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
            data={data}
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
