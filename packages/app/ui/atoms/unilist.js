import { MasonryFlashList, FlashList } from "@shopify/flash-list";
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { Platform } from 'react-native'
import { View, ScrollView } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'
import { styled } from 'nativewind'
import  {LayoutData} from 'app/context/layout';
import { useContext } from 'react';

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
            if (numColumns >1){
                const lala = styled(ReactNativeView, '  w-1/' + props.numColumns)
                const lala2 = styled(ReactNativeView, ' flex flex-wrap flex-row ')

                return ( <VirtuosoGrid useWindowScroll
                        data={data}
                        itemContent={itemContent} 
                        endReached={onEndReached}
                        overscan={200}
                        components={{
                            List: lala2,
                            Item: lala,
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
                        overscan={200}
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
            <FlashList 
                keyExtractor={item => item.id}
                ref = {refer}   
                numColumns={numColumns}
                onEndReachedThreshold={0.5}
                estimatedItemSize={400}
                data={dataItems}
                renderItem={renderItem}
                onEndReached = {onEndReached} 
                ListFooterComponent={ListFooterComponent}
                {...rest}
            />
        )
    }
    else{
        return (
            <MasonryFlashList 
                ref = {refer}   
                keyExtractor={item => item.id}
                onEndReachedThreshold={0.5}
                numColumns={numColumns}

                estimatedItemSize={400}
                {...props}
            />
        )
    }
}
