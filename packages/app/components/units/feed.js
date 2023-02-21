import Image from '../atoms/image';
import Link from '../atoms/link';
import Time from '../atoms/time';
import Profile from '../atoms/profile';

import { Text, H1 } from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic } from 'react-native'




export default function UnitFeed({data}) {
    var oImage = data.content.images.length > 0 ? data.content.images[0] : null;
    if (oImage == null)
        oImage = data.content.images_attach ? data.content.images_attach[0] : null;
    
        var oCmt = null;
    if (data.cmts.data.length > 0){
        oCmt = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data;
    }
    
    const {height, width, scale, fontScale} = useWindowDimensions();

    //TODO: rework url
    let url = '/' + data.url;
    
    let styles = StyleSheet.create({
    });
    
    if (Platform.OS != 'web'){
    
        var _margin = 8;
        var _margin2 = 8;
        var _col2w = 1000;  
        var _col1w = 600;    

        let w = width/3 - _margin * 2 ;
        if (width < _col2w)
            w = width - _margin * 2 - 2;  
        let mw = w - 2 * _margin2;
        
        styles = StyleSheet.create({
          card: {
            width: w,
            flexShrink:1,
            flexGrow: 1,
            alignContent: 'flex-start',
            borderRadius: 10,
            flexDirection:'row',
            flexWrap: 'wrap',
            flexShrink:1,
            margin:_margin,
          }, 
          card_image: {
           
             width: width,
          },      
          card2: {
              width: width,
          }, 
        });
    }
    
    return (
        <Link href={url}>
      
            <View className='flex-col bg-white dark:bg-gray-900 overflow-hidden  u-feed-card style={styles.card} mb-2 sm:m-2 sm:rounded-lg'>
                <View className='flex-row px-4 my-3 w-full' style={styles.card2}>
                    <View className="flex-col flex-1" style={styles.card2}>
                                <View className="flex-auto flex-row space-x-2">
                                    <View className="flex-none">
                                        <Profile {...data.author_data} displayType="unit_wo_info" className="" />
                                    </View>
                                    <View className="flex-none">
                                        <Profile {...data.author_data} displayType="unit_wo_image" showLinks="false" showInfo={(<Time className="" ts={data.date}></Time>)} className="" />
                                    </View>
                                </View>  
                        
                        
                    </View> 
                    <View className="flex-none flex-col bg-blue-500 rounded-full  px-1.5 mb-auto ">    
                        <Text className=" text-xs font-bold text-white dark:text-gray-800">{data.cmts.count}</Text>  
                    </View>
                </View>
                {oImage &&
                    
                    <View className="flex-row aspect-video mb-3" style={styles.card_image}>
                        <Image {...oImage} alt={data.title} prefWidth="500" prefHidth="400" className="w-full aspect-video u-image " />
                        
                    </View>
                    
                }  
                <View className="flex-col u-card-fix">
                    
                    <Text className="px-4 mb-3 text-lg  font-bold tracking-tight leading-6 text-gray-800 dark:text-gray-100 ">{data.content.title}</Text>
                    <View className="px-4 mb-3  flex-row space-x-3  ">
                        <Text className="text-gray-600 dark:text-gray-400 text-xs"><Text className="font-bold">12</Text> views</Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-xs"><Text className="font-bold">48</Text> likes</Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-xs"><Text className="font-bold">16</Text> comments</Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-xs"><Text className="font-bold">32</Text> reposts</Text>
                    </View>

                    

                    <View className="px-4 py-1  border-t border-gray-500/20  flex-row space-x-1  ">
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"><Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>Like</Text></View>
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"><Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>Comment</Text></View>
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"><Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>Repost</Text></View>
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"><Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>Share</Text></View>
                    </View>

                    {/* oCmt &&
                        <View className='flex gap-1  ml-12 @xl/cell:m-0'>
                            <View className='flex-none hidden @xl/cell:block'><Profile {...data.author_data} displayType="unit_wo_info" displaySize="sm" /></View>
                            <View className='flex w-full'>  
                                <View className='flex relative flex-none @xl/cell:flex-wrap gap-x-2  ml-1  w-full text-sm  bg-gray-300/50 dark:bg-gray-700/50 py-0.5 px-1.5  @xl/cell:py-1.5 @xl/cell:px-2.5 rounded-lg     '>
                                    <Text className=' flex-none  hidden @xl/cell:line-clamp-1 my-auto font-semibold '>{oCmt.author_data.display_name}</Text>
                                    <View className='flex-auto line-clamp-1 @xl/cell:line-clamp-2 text-gray-600 dark:text-gray-400  my-auto' dangerouslySetInnerHTML={{__html:oCmt.cmt_text}}/>
                                    <View className="text-sm -mt-4 ring ring-white dark:ring-gray-900 -mr-1.5 flex-none @xl/cell:hidden font-medium   bg-blue-500 h-min  rounded-xl rounded-br-sm  ml-auto px-2  text-white dark:text-gray-800  ">{data.cmts.count}</View>
                                </View>  
                            </View> 
                        </View>
            */}
                </View>
            </View> 
        </Link>     
    );
}
