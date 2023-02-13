import Unit from '../unit';
import { useState, useContext } from 'react';
import { View, ScrollView } from 'app/design/view'

export default function ElementBrowse(props) {
  let data = props.data;
  
  return (
    
      <ScrollView className=''>
        <View className='flex-col  gap-y-2'>

        {data.data.map(a => <Unit key={a.id ? a.id : Object.keys(a)[0]} unit={data.unit ? data.unit : ''} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} {...props} data={a} />)}
        </View>
      </ScrollView> 
    
    );
}
