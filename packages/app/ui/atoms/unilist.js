import { /*MasonryFlashList,*/ FlashList } from "@shopify/flash-list";
import { useState, useCallback, useMemo, useRef } from 'react';
import { RefreshControl } from 'react-native';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { FlatList} from 'react-native';

export default function UniList(props) {
    let { data,mode, renderItem, onEndReached,maxToRenderPerBatch, initialNumToRender, ListFooterComponent, refer, onScrollToIndex, numColumns, keyExtractor, unit, refreshing, onRefresh, ...rest } = props
    const unitSizeMap = {
        notifications: 40,
        feed: 200,
    };
   
    const estimatedItemSize = unitSizeMap[unit] || 400;
    
    const filteredData = data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    

    if (mode == 'simple'){
      /*  
         const renderedItems = [];
   filteredData.forEach((item, index) => {
     renderedItems.push(
       <View key={item.id}>
         {renderItem({ item, index })}
       </View>
     );
   });
   return renderedItems*/
        return (
            <FlatList  
               // onLoad={onLoadListener}
                ref = {refer}   
                onEndReachedThreshold={4}
                data={filteredData}
                keyExtractor={item => item.id}
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
    console.log("FlashList", filteredData.length)
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
