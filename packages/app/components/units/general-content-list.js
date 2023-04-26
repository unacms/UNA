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
 // style={styles.card}
        return (
            <View className="u-card-4">
                <Link href={data.url}>    
                <View className="flex-col space-y-4 w-full mx-auto pb-4 bg-neocard dark:bg-whiteborder hover:shadow-lg border-neoborder dark:border-neoborder-dark overflow-hidden sm:rounded-lg">  
      <View className="w-full aspect-video  bg-secondary-500/10  mx-auto  ">
      { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover" style={styles.card_image} src={data.cover.src} /> }
      </View>
      <View className=" px-4 ">
        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">
          {data.group_name}
        </Text>
        <View className='flex-row space-x-1'>
          <Text  className='text-sm text-gray-600 dark:text-gray-400'>25 members</Text>
          <Text  className='text-sm text-gray-400 dark:text-gray-600'>·</Text>
          
          <Text  className='text-sm text-gray-600 dark:text-gray-400'>Active 24 min ago </Text>
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
            <View className="u-card-4" style={styles.card}>
                <Link href={data.url}>    
                <View className="flex-col space-y-4 w-full mx-auto pb-4 bg-neocard dark:bg-neocard-dark border hover:shadow-lg border-neoborder dark:border-neoborder-dark overflow-hidden sm:rounded-lg">  
      <View className="w-full aspect-video  bg-secondary-500/10  mx-auto  ">
        { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover" style={styles.card_image} src={data.cover.src} />  }
      </View>
      <View className=" px-4 ">
        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">
          {data.channel_name}
        </Text>
        <View className='flex-row space-x-1'>
          <Text  className='text-sm text-gray-600 dark:text-gray-400'>25 members</Text>
          <Text  className='text-sm text-gray-400 dark:text-gray-600'>·</Text>
          
          <Text  className='text-sm text-gray-600 dark:text-gray-400'>Active 24 min ago </Text>
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
        let sMeta = '';
        if(data?.meta)
            sMeta = (
                <View className="text-center px-4 mt-4">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true}} />
                </View>
            );
        else
            sMeta = (
                <>
                    <Text  className='text-sm text-gray-600 text-center dark:text-gray-400 mt-2'>some text from menu</Text>
                    <View className="text-center px-4 space-y-2 mt-4">
                        <Button title="Follow" variant="primary" fullWidth />
                        <Button title="Remove" variant="default" fullWidth/>
                    </View>
                </>
            );

        return (
            <View style={styles.card} className="u-card-4">
                <Link href={data.url}>  
                    <View className="flex-col space-y-4 w-full mx-auto pb-4 bg-neocard h-min dark:bg-neocard-dark border hover:shadow-lg border-neoborder dark:border-neoborder-dark overflow-hidden sm:rounded-lg">  
                        <View className=" mx-auto mt-4 ">
                            <Profile {...data.profile} displayType="unit_wo_info" displaySize="4xl" />
                        </View>
                        <Text className="px-4 text-lg font-bold text-gray-800 text-center dark:text-gray-100">{data.fullname}</Text>
                        {sMeta}
                    </View>
                </Link>
            </View>
        )
    }

    function defaultUnit(){
        let sMeta = '';

        if(data?.meta)
            sMeta = <Menu {...data.meta} displayType="link" />
        else
            sMeta = <Profile {...data.author_data} displayType="unit" displaySize="xs" showInfo="false" />

        return (
            <View className="u-card" style={styles.card}>
                
                <View className="
                 w-full
                  p-1 mt-2
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
                        {data.image &&
                            <View className="w-full bg-gray-500/20 rounded aspect-video w-full overflow-hidden items-center" >
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