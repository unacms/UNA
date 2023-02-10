import Unit from '../unit';
import { useState, useContext } from 'react';
import { View } from 'app/design/view'

export default function ElementBrowse(props) {
  let data = props.data;
  
  return (
    <View className='@container/cell'>
      <View className={(data.unit.includes('card')  ? 'overflow-x-auto to scroll flex @xl/cell:px-4 mt-4' : 'flex @xl/cell:px-4 flex-wrap')}>
        {data.data.map(a => <Unit key={a.id ? a.id : Object.keys(a)[0]} unit={data.unit ? data.unit : ''} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} {...props} data={a} />)}
      </View> 
    </View>
    );
}
