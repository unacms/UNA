import Unit from '../unit';
import { useState, useContext } from 'react';
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic } from 'react-native'

export default function ElementBrowse(props) {
    let data = props.data;
    
    const {height, width, scale, fontScale} = useWindowDimensions();
    
    let styles = StyleSheet.create({
    });
    
    if (Platform.OS != 'web'){
        styles = StyleSheet.create({
            cardList: {
                flexWrap: 'wrap',
                flexDirection:'row',
                flexShrink:1 
            },
        });
    }
    
    
    return (
        <View className='flex-col u-card-list' style={styles.cardList}>
            {data.data.map(a => <Unit key={a.id ? a.id : Object.keys(a)[0]} unit={data.unit ? data.unit : ''} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} {...props} data={a} />)}
        </View>
    );
}
