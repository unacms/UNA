import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';

import { Text, H1 ,TextLink} from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import {Platform, PlatformIOSStatic} from 'react-native'
import { Button } from 'app/design/controls';

// g-med style browsing
export default function Unit(props) {
    let data = props.data;
   
const {height, width, scale, fontScale} = useWindowDimensions();
    
    let styles = StyleSheet.create({});
    
    if (Platform.OS != 'web'){
    
        var _margin = 8;
        var _margin2 = 8;
        var _col2w = 1000;  
        var _col1w = 600;    

        let w = width/3 - _margin * 2 ;
        if (width < _col2w)
            w = width - _margin * 2 - 2;  
        let wi = w/3;
        let wt = w - wi - 2*_margin2-2;

        if (width <_col1w || width>_col2w){
            wi = w;
            wt = w;
        }
        let mw = w - 2 * _margin2;
        
        styles = StyleSheet.create({
          card: {
            width: width,
            borderRadius: 0,
            marginLeft:0,
            marginRight:0,
            marginBottom:8,
          
          },
         card_image: {
             width:width-2,
             borderRadius: 0,
         },    
        });
    }

    switch (props.module) {
        case 'bx_groups':
            return groupUnit();
            break;

        case 'bx_persons':
            return personUnit();
        break;

        case 'bx_channels':
            return channelUnit();
        break;

        default:
            return defaultUnit();
    }

    function groupUnit(){
 
        return (
            <View className="u-card-4 flex-1" style={styles.card}>
                <Link href={data.url}>    
                <View className="flex-col space-y-4 w-full mx-auto pb-4 bg-card dark:bg-card-dark border hover:shadow-lg border-bordercolor/10 dark:border-bordercolor-dark/10 overflow-hidden rounded-lg">  
      <View className="w-full aspect-video  bg-secondary-500/10  mx-auto  ">
      {
            !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover" style={styles.card_image} 

            src={data.cover}

          />
        }

      </View>
      <View className=" px-4 ">
        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">
          {data.group_name}
        </Text>
        <View className='flex-row space-x-1'>
          <Text  className='text-sm text-neo-600 dark:text-neo-400'>25 members</Text>
          <Text  className='text-sm text-neo-400 dark:text-neo-600'>·</Text>
          
          <Text  className='text-sm text-neo-600 dark:text-neo-400'>Active 24 min ago </Text>
        </View>     
      </View>
      <View className="text-center px-4 space-y-2">
        
        <Button title="Join Group" variant="primary" fullWidth />
        
      </View>
      </View>
      </Link>
            </View>  
        )  
    }

    function channelUnit(){
        return (
            <View className="u-card-4 flex-1" style={styles.card}>
                <Link href={data.url}>    
                <View className="flex-col space-y-4 w-full mx-auto pb-4 bg-card dark:bg-card-dark border hover:shadow-lg border-bordercolor/10 dark:border-bordercolor-dark/10 overflow-hidden rounded-lg">  
      <View className="w-full aspect-video  bg-secondary-500/10  mx-auto  ">
      {
            !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover" style={styles.card_image} 

            src={data.cover}

          />
        }

      </View>
      <View className=" px-4 ">
        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">
          {data.channel_name}
        </Text>
        <View className='flex-row space-x-1'>
          <Text  className='text-sm text-neo-600 dark:text-neo-400'>25 members</Text>
          <Text  className='text-sm text-neo-400 dark:text-neo-600'>·</Text>
          
          <Text  className='text-sm text-neo-600 dark:text-neo-400'>Active 24 min ago </Text>
        </View>     
      </View>
      <View className="text-center px-4 space-y-2">
        
        <Button title="Join Group" variant="primary" fullWidth />
        
      </View>
      </View>
      </Link>
            </View> 
        )  
    }

    function personUnit(){

        return (
            <View style={styles.card} className="u-card-4 flex-1">
                <Link href={data.url}>  
            <View className="flex-col space-y-4 w-full mx-auto pb-4 bg-card h-min dark:bg-card-dark border hover:shadow-lg border-bordercolor/10 dark:border-bordercolor-dark/10 overflow-hidden rounded-lg">  
      <View className="w-2/3 aspect-square  bg-secondary-500/10  mx-auto rounded-full mt-4 ">
        {
            !!data.image && <Image alt={data.fullname} className="rounded-full" view="cover"

            src={data.image}

          />
        }
      </View>
      <View className="text-center px-4 flex-auto">
        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{data.fullname}</Text>
        <View>
          <Text  className='text-sm text-neo-600 dark:text-neo-400'>some text from menu</Text>
        </View>     
      </View>
      <View className="text-center px-4 space-y-2">
      <Button title="Follow" variant="primary" fullWidth />
        <Button title="Remove" variant="default" fullWidth/>
      </View>
  </View></Link></View>
           
        )  
    }

    function defaultUnit(){
        return (
            <View className="u-card" style={styles.card}>
                <View className="bg-card  duration-200 hover:shadow-lg active:shadow-none dark:bg-card-dark overflow-hidden border sm:rounded-lg hover:border-bordercolor/20  border-bordercolor/10 dark:border-bordercolor-dark/10 dark:hover:border-bordercolor-dark/20  w-full">
                    <Link href={data.url}>            
                        {data.image &&
                            <View className="w-full bg-gray-500/20 aspect-video w-full overflow-hidden items-center" >
                                <Image {...data.image} alt={data.title} view="cover" className="u-cover" style={styles.card_image} />
                            </View>
                        } 
                        {!data.image &&<View className="bg-brand/10 dark:bg-brand-dark/10  w-full sm:rounded-t-md aspect-video"></View> }
                        <View className="px-4">
                            <View className=" overflow-hidden w-full my-3 h-10  ">
                                <Text className='text-gray-800    dark:text-gray-200 text-base leading-5  tracking-tight font-semibold'>
                                    {data.title}
                                </Text>
                                <Text className=" text-gray-600 dark:text-gray-400 mt-1">{data.summary_plain}</Text>   
                            </View>
                            <View className='pb-3'>
                                <Profile {...data.author_data} displayType="minimal" displaySize="xs"  className="" />
                            </View>
                        </View>
                    </Link>
                </View>
            </View>  
        )  
    }
}
