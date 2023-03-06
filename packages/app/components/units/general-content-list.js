import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';

import { Text, H1 ,TextLink} from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import {Platform, PlatformIOSStatic} from 'react-native'

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
                                    {data.title} FOR GROUPS
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

    function channelUnit(){
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
                                    {data.title} FOR channels
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

    function personUnit(){
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
                                    {data.title} FOR PERSONS
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
