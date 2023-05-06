import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Profile from '../../ui/molecules/profile';

import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import { Button } from 'app/design/controls';
import Menu from 'app/components/menu';

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
          /*card: {
            width: width,
            borderRadius: 0,
            marginLeft:0,
            marginRight:0,
            marginTop:8,
            
          
          },*/
         /*card_image: {
             width:width-2,
             borderRadius: 0,
         },  */  
        });
    }

    switch (props.module) {
        case 'bx_groups':
            return groupUnit();

        case 'bx_persons':
            return personUnit();

        case 'bx_channels':
            return channelUnit();

        default:
            return defaultUnit();
    }

    function groupUnit() {
        let sMeta = <></>;
        if(data?.meta)
            sMeta = (
                <View className="text-center px-4 mt-4">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true}} />
                </View>
            );

        return (
            <View className="u-card" style={styles.card}>
                
                <View className="
                flex-auto
                 p-1 mt-1 sm:mx-2 sm:mt-2                   
                 group duration-200 overflow-hidden sm:rounded-lg  
                 bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                 hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                 border  
                 active:translate-y-0.5
                 border-bordercolorcard dark:border-bordercolorcard-dark 
                 sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                 active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                
                
                ">
                    <Link href={data.url}> 
                    <View>  
                    <View className='mb-2'>  
                    {data.cover &&
                            <View className="w-full bg-gray-500/20 rounded aspect-video overflow-hidden items-center absolute" >
                                <Image {...data.cover} alt={data.title} view="cover" className="u-cover" style={styles.card_image} />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10 absolute w-full rounded aspect-video"></View> }
                        <View className=" aspect-video w-full items-center justify-center">
                           
                        </View>
                        </View>
                        <Text className="px-4 text-lg font-bold text-gray-800 text-center dark:text-gray-100">{data.group_name}</Text>
                        {sMeta}
                    </View>
                </Link>
            </View>
            </View>
        )
    }

    function channelUnit() {
        let sMeta = <></>;
        if(data?.meta)
            sMeta = (
                <View className="text-center px-4 mt-4">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true}} />
                </View>
            );

        return (
            <View className="u-card" style={styles.card}>
                
                <View className="
                    flex-auto
                    p-1 mt-1 sm:mx-2 sm:mt-2                   
                    group duration-200 overflow-hidden sm:rounded-lg  sm:hover:shadow-sm
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                    hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                    border  
                    active:translate-y-0.5
                    border-bordercolorcard dark:border-bordercolorcard-dark 
                    sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                    active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                ">
                    <Link href={data.url}> 
                    <View>  
                    <View className='mb-2'>  
                    {data.cover &&
                            <View className="w-full bg-gray-500/20 rounded aspect-video overflow-hidden items-center absolute" >
                                <Image {...data.cover} alt={data.title} view="cover" className="u-cover" style={styles.card_image} />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10 absolute w-full rounded aspect-video"></View> }
                        <View className=" aspect-video w-full items-center justify-center">
                           
                        </View>
                        </View>
                        <Text className="px-4 text-lg font-bold text-gray-800 text-center dark:text-gray-100">{data.channel_name}</Text>
                        {sMeta}
                    </View>
                </Link>
            </View>
            </View>
        )
    }

    function personUnit(){
        let sMeta = <></>;
        if(data?.meta)
            sMeta = (
                <View className="text-center h-auto px-4 mb-2">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true}} />
                </View>
            );

        return (
            <View className="u-card self-stretch" style={styles.card}>
                
                <View className="
                flex-auto h-full
                 p-1 mt-1 sm:mx-2 sm:mt-2                   
                 group duration-200 overflow-hidden sm:rounded-lg  
                 bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                 hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                 border  
                 active:translate-y-0.5
                 border-bordercolorcard dark:border-bordercolorcard-dark 
                 sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                 active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                
                
                ">
                    <Link href={data.url}> 
                    <View>  
                    <View className='mb-2'>  
                    {data.cover &&
                            <View className="w-full bg-gray-500/20 rounded aspect-video overflow-hidden items-center absolute" >
                                <Image {...data.cover} alt={data.title} view="cover" className="u-cover" style={styles.card_image} />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10 absolute w-full rounded aspect-video"></View> }
                        <View className=" aspect-video w-full items-center justify-center">
                            <Profile url_avatar={data.image} displayType="unit_wo_info" displaySize="3xl" />
                        </View>
                        </View>
                        <Text className="px-4 text-base font-bold text-gray-800 text-center dark:text-gray-100 mb-1">{data.fullname}</Text>
                        {sMeta}
                    </View>
                </Link>
            </View>
            </View>
        )
    }

    function defaultUnit(){
        let sMeta = '';

        if(data?.meta)
            sMeta = <Menu {...data.meta} displayType="link" itemsStart={true} />
        else
            sMeta = <Profile {...data.author_data} displayType="unit" displaySize="xs" showInfo="false" />

        return (
            <View className="u-card" style={styles.card}>
                
                <View className="
                flex-auto
                 p-1 mx-2 mt-2                   
                 group duration-200 overflow-hidden rounded-lg  
                 bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                 hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                 border  
                 active:translate-y-0.5
                 border-bordercolorcard dark:border-bordercolorcard-dark 
                 sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                 active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                
                
                ">
                    <Link href={data.url}>            
                        {data.image &&
                            <View className="w-full bg-gray-500/20 rounded aspect-video overflow-hidden items-center" >
                                <Image {...data.image} alt={data.title} view="cover" className="u-cover" style={styles.card_image} />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10  w-full rounded aspect-video"></View> }
                        <View className="px-1.5 py-0.5">
                            <View className=" overflow-hidden w-full my-2 h-10  ">
                                <Text className='text-gray-800    dark:text-gray-200 text-base leading-5  tracking-tight font-semibold'>
                                    {data.title}
                                </Text>
                                <Text className=" text-gray-600 dark:text-gray-400 mt-1">{data.summary_plain}</Text>   
                            </View>
                            <View className='pb-1'>{sMeta}</View>
                        </View>
                    </Link>
                </View>
                
            </View>  
        )
    }
}