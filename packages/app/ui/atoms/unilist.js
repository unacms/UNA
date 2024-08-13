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
    /*if (props.unit == 'feed'){
        if(layoutData && layoutData?.type == 'feed:new_content'){
            if(layoutData.data?.id){
                let insertIndex = data.findIndex(item => item.type !== 'block');
                if (insertIndex === -1) {
                    data.splice(data.length, 0, layoutData.data);
                }
                else{
                    data.splice(insertIndex, 0, layoutData.data);
                }
            }
            if (Array.isArray(layoutData.data)){
                let insertIndex = data.findIndex(item => item.type !== 'block');
                if (insertIndex === -1) {
                    data.splice(data.length, 0, ...layoutData.data);
                }
                else{
                    data.splice(insertIndex, 0, ...layoutData.data);
                }
            }
        }
        if(layoutData && layoutData?.type == 'feed:remove_content'){
            data = data.filter(item => item.id !== layoutData.data);
        }
    }*/
    data = data.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id)) === i);
    
    /*if (props.masonry){
        return (
            <MasonryFlashList
                ref = {refer}   
                keyExtractor={item => item.id}
                onEndReachedThreshold={1}
                numColumns={numColumns}
                estimatedItemSize={400}
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
    }
    else{*/
    const onLoadListener = useCallback(({ elapsedTimeInMs } ) => {
        //console.log("Sample List load time", elapsedTimeInMs);
    }, []);

    return (
        <FlashList  
            onLoad={onLoadListener}
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
