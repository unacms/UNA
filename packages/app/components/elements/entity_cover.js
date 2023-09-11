import { View } from 'app/design/view';
import Image from '../../ui/atoms/image';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls'
import EntityAuthor from './entity_author';

export default function ElementEntityCover(props) {
   const data = props.data;
    return (
        <View className="flex-col  w-full mx-auto  bg-bgrcard h-min dark:bg-bgrcard-d border hover:shadow-lg border-bdr dark:border-bdr-d overflow-hidden rounded-lg">  
      <View className="w-28 h-28 mt-4 mx-4 overflow-hidden bg-neutral-100 dark:bg-neutral-700  rounded-full  ">
        { !!data.image ? <Image alt={data.fullname} className="rounded-full" view="cover" src={data.image} /> : <View><View className="w-[50%] z-20 aspect-square bg-neutral-200  dark:bg-neutral-600 border-4 border-neutral-100 dark:border-neutral-700  mx-auto rounded-full mt-[15%] "></View>
        <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neutral-200  dark:bg-neutral-600  mx-auto rounded-t-full  "></View></View>}
      </View>
      <View className="flex-row flex-wrap ">
            <View className=" flex-col px-4  flex-auto">
              <View className="text-3xl pt-4 font-bold text-neutral-800 dark:text-neutral-100">
                {data.fullname}
              </View>
               
            </View>
            <View className="flex-none my-auto px-4 pt-4  flex-row gap-x-2 ">
              
              <Button title="Follow" startDecorator="plus" variant="primary"  />
              <Button title="Message" startDecorator="messages" variant="default" />
            </View>

        </View>
       <View className="text-center flex-row px-2 py-4 gap-x-2 items-center">
        
        <Button title="325 Followers" startDecorator="people" size='sm' rounded variant="text"  />
        <Button title="123 Following" startDecorator="people" size='sm' rounded variant="text"  />
      </View>
      <View className="bg-neutral-50 dark:bg-neutral-700 m-4 p-2 rounded-lg">
          <Text className='text-base text-neutral-600 dark:text-neutral-400'>Generic persona that doesn't exist. Used commonly in software prototypes to denote a human.</Text>
        </View> 
     
      
  </View>
    );
}
