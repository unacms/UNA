
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { View } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'
import { styled } from 'nativewind'
import  {LayoutData} from 'app/context/layout';
import { useContext } from 'react';
import { Dimensions } from 'react-native';   
import { storageSet, storageGet , appSetting} from 'app/lib/util'
import  CurRouter from "app/ui/atoms/router";
import { useEffect } from 'react'

export default function UniList(props) {
    
    const { layoutData, setLayoutData } = useContext(LayoutData);

    let { data, renderItem, onEndReached, ListFooterComponent, refer, onScrollToIndex, numColumns, keyExtractor, useWindowScroll, height, ...rest } = props
   
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

    const exitingFunction = () => {
        if (appSetting('cache', 'list')){
            if (refer?.current && refer.current.getState && rest.storagekey) {
                refer.current.getState((state) => {
                    storageSet('ls', rest.storagekey, state);
                });
            }
            else{
                if (window)
                    storageSet('ls', rest.storagekey, window.scrollY);
            }
        }
    };

    let parsedRestoreState = {};
    useEffect(() => {
        if (rest.storagekey && appSetting('cache', 'list')){
            let restoreState =  storageGet('ls', rest.storagekey);
            if (!isNaN(parseFloat(restoreState))){
                setTimeout(() => {
                    window.scrollTo({
                        top: restoreState,
                    }); 
                }, 100);
            }
            else{
                console.log('++++', props, restoreState);
                parsedRestoreState = restoreState != null ? { restoreStateFrom: restoreState } : {};
            }   
        }
    }, [])
    

    if (numColumns > 1){
        const itemComponent = styled(ReactNativeView, '  w-1/' + props.numColumns)
        const listComponent = styled(ReactNativeView, ' flex flex-wrap flex-row ')

        return ( <><CurRouter exitingFunction={exitingFunction} /><VirtuosoGrid 
                useWindowScroll = {!height ? true : false}
                data={data}
                style={style}
                itemContent={itemContent} 
                {...parsedRestoreState}
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

        return (
            <><CurRouter exitingFunction={exitingFunction} /><Virtuoso 
                useWindowScroll = {!height ? true : false}
                data={data}
                style={style}
                {...parsedRestoreState}
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
            /></>
        )
    }
}
