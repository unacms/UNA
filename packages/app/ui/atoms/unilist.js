import { MasonryFlashList, FlashList } from "@shopify/flash-list";
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { Platform } from 'react-native'
import { View, ScrollView } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'
import { styled } from 'nativewind'
import  {LayoutData} from 'app/context/layout';
import { useContext } from 'react';
import { Dimensions } from 'react-native';    


export default function UniList(props) {
    const isWeb = Platform.OS == 'web'
    const { layoutData, setLayoutData } = useContext(LayoutData);
    let { data, renderItem, onEndReached, ListFooterComponent, refer, onScrollToIndex, numColumns, keyExtractor, ...rest } = props
   
    if (props.unit == 'feed' && layoutData?.id){
        let insertIndex = data.findIndex(item => item.type !== 'block');
        if (insertIndex === -1) {
            data = [layoutData, ...data]
        }
        else{
            data.splice(insertIndex, 0, layoutData);
        }
    }
    data = data.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id)) === i);
    
    if (isWeb){

        const itemContent = (index, data) => {
            return renderItem({item: data, index});
        }

        if (props.no_scroll){
            return <View>
               {data.map((item, index) => {
                    return renderItem({item: item, index});
               })}
            </View>;
        }
        if (props.useWindowScroll){
            const windowHeight = Dimensions.get('window').height;
            if (numColumns >1){
                const itemComponent = styled(ReactNativeView, '  w-1/' + props.numColumns)
                const listComponent = styled(ReactNativeView, ' flex flex-wrap flex-row ')

                return ( <VirtuosoGrid useWindowScroll
                        data={data}
                        itemContent={itemContent} 
                        overscan={900}
                        endReached={onEndReached}
                        atBottomStateChange={onEndReached}
                        components={{
                            List: listComponent,
                            Item: itemComponent,
                            Footer: () => {
                                return ListFooterComponent
                            },
                        }}
                        {...rest}
                    />
                )
            }
            else{

                return (
                    <Virtuoso useWindowScroll
                        data={data}
                        itemContent={itemContent}
                        ref = {refer}   
                        endReached={onEndReached}
                        increaseViewportBy={windowHeight - 200}
                        components={{
                            Footer: () => {
                                return ListFooterComponent
                            },
                        }}
                        {...rest}
                    />
                )
            }
        }
    }
    if (props.masonry){
        return (
            <MasonryFlashList
                ref = {refer}   
                keyExtractor={item => item.id}
                onEndReachedThreshold={0.5}
                numColumns={numColumns}
                estimatedItemSize={400}
                data={data}
                renderItem={renderItem}
                onEndReached = {onEndReached} 
                ListFooterComponent={ListFooterComponent}
                {...rest}
            />
        )
    }
    else{
        return (
            <FlashList  
                ref = {refer}   
                keyExtractor={item => item.id}
                onEndReachedThreshold={0.5}
                numColumns={numColumns}
                estimatedItemSize={400}
                data={data}
                renderItem={renderItem}
                onEndReached = {onEndReached} 
                ListFooterComponent={ListFooterComponent}
                {...rest}
            />
        )
    }
}
