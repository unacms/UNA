import { View, Pressable, Row } from 'app/design/view';
import Profile from 'app/ui/molecules/profile'
import { Text, H1C } from 'app/design/typography'
import Browse from 'app/components/elements/browse'
import UniList from 'app/ui/atoms/unilist'
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer, ItemRendererMemo, LeftSidebar, TopSidebar, getNumCols, processBlocks } from 'app/lib/conductor-helpers';

export default function ElementSearchSections(props) {
    console.log("propsprops", props)
    return (
        <View className="w-full bg-red-500">
            {props.data.data.map((item, index) => {
                return (
                   <> <Text>{item.section}</Text>
                       <UniList
                
                index={0}
                data={item.data}
                endpoint={''}
                listState={''}
                storagekey={''}
                route={{index:0}}
       
                unit={'general-content-list'}
                
                numColumns={5}
               
                renderItem={({ item, index }) => <ItemRenderer module={item.section} unit={'general-content-list'} unitType={'general-content-list'}  item={{ ...item }}  numColumns={5}  />}
               
            />
               </>
                )

})}

        </View>
    );
}