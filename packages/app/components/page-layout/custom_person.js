
import {BlockByName} from 'app/components/block';
import { View, FlatList, FlashList } from 'app/design/view'
import Cover, {CoverSmall} from 'app/components/elements/cover';
import React, { useRef, useState, useEffect} from 'react';
import { Text } from "react-native";
import { useNavigation } from '@react-navigation/native';
export default function PageLayout(props) {
  const DATA = [
    {
      title: "First Item",
    },
   
  ];

  const initialScrollPosition = useRef(0);
  const [count, setCount] = useState(false)
  const navigation = useNavigation();
  useEffect(() => {
    if (count)
    navigation.setOptions({ headerTitle: () => <CoverSmall data={props.data.cover_block} />, headerShown: true,  })
    else
    navigation.setOptions({ headerTitle: () => <Text></Text>, headerShown: true,  })
}, [count]);

  const handleScroll = (event) => {
    /*const currentScrollPosition = event.nativeEvent.contentOffset.y;
  
    // If the initial scroll position has not been set yet, set it
    if (initialScrollPosition.current === 0) {
      initialScrollPosition.current = currentScrollPosition;
    }*/
    
    if (event.nativeEvent.contentOffset.y > 100 && count != true){
      setCount(true)
    }
    if (event.nativeEvent.contentOffset.y < 100 && count != false){
      setCount(false)
    }
  
   

    console.log('Initial scroll position:', event.nativeEvent.contentOffset.y);
  };

  function CM(props){
    return <View className='w-full'>{props.children}<View className='w-full bg-blue-500 h-12'><Text>Menu</Text></View></View>
  }
  
    return (<View className='w-full h-full ' >
          {count ?<View className='mt-'><CM></CM></View>: <></>}
         <FlatList estimatedItemSize={200} numColumns={1} className='h-full ' horizontal={false} 
                data={DATA}
                renderItem={({ item }) => <View key={'item'} className=' h-128 w-full  '><BlockByName data={props.data} name={props.blocks.col1} /></View>}
               
                ListHeaderComponent = {!count ?<CM><Cover data={props.data.cover_block}/></CM>: <CM><CoverSmall data={props.data.cover_block}/></CM>}
                onScroll={handleScroll}

                
            />
    </View>)
}
