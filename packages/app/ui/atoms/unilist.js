import { MasonryFlashList, FlashList } from "@shopify/flash-list";
import { LayoutData } from 'app/context/layout';
import { useContext, useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';

export default function UniList(props) {
    const { layoutData, setLayoutData } = useContext(LayoutData);
    const routerExpo = useRouter();
    let { data, renderItem, onEndReached, ListFooterComponent, refer, onScrollToIndex, numColumns, keyExtractor, ...rest } = props

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
        routerExpo.replace(props.url)
        //setRefreshing(true);
        
        //setRefreshing(false);
    };

    if (props.unit == 'feed'){
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
    }
    data = data.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id)) === i);
    
    if (props.masonry){
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
    else{
        return (
            <FlashList  
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
}
