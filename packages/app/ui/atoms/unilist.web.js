
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { View } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'
import { styled } from 'nativewind'
import { Dimensions } from 'react-native';   
import { storageSet, appSetting } from 'app/lib/util'

export default function UniList(props) {
    let { data, renderItem, onEndReached, contentContainerStyle, initialScrollIndex, ListHeaderComponent, ListFooterComponent, refer, onScrollToIndex,
          numColumns, keyExtractor, useWindowScroll, height, listState, endpoint, index, viewParams, topItemCount, ...rest } = props
   
    data = data.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id)) === i);
    
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
    let windowHeight = Dimensions.get('window').height;
    let style={}
    if (height){
        windowHeight = height;
        style={ height: height + 'px' }
    }

    const isScrolling = (isFinished) => {
        
        if (!isFinished && refer?.current && refer.current.getState && rest.storagekey){
            
            refer.current.getState((state) => {
                const ch = {state: state}
                storageSet('ul:state', rest.storagekey, ch);
            });
        }
    }

    const stateChanged = (state) => {
        const ch = {state: state}
        storageSet('ul:state', rest.storagekey, ch);
    }

    if (numColumns > 1){
        const itemComponent = styled(ReactNativeView, ' w-1/' + props.numColumns)
        const listComponent = styled(ReactNativeView, appSetting('layout', 'max_width_block') + ' mx-auto flex flex-wrap flex-row')

        return ( <><VirtuosoGrid 
                useWindowScroll = {!height ? true : false}
                data={data}
                style={style}
                itemContent={itemContent} 
                stateChanged = {stateChanged}
                {...(listState?.viewport ? { restoreStateFrom: listState } : {})}
                overscan={900}
                ref = {refer}   
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
            /></>
        )
    }
    else{
        //increaseViewportBy={windowHeight - 400}
        return (
            <><Virtuoso 
                useWindowScroll = {!height ? true : false}
                data={data}
                topItemCount={topItemCount}
                isScrolling = {isScrolling}
                style={style}
                {...(listState?.ranges ? { restoreStateFrom: listState } : {})}
                itemContent={itemContent}
                ref = {refer}  
                endReached={onEndReached}
                overscan={900}
                followOutput="smooth"
                components={{
                    Footer: () => {
                        return ListFooterComponent
                    },
                    Header: () => {
                        return ListHeaderComponent
                    },
                }}
                {...rest}
            /></>
        )
    }
}
