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

        styles = StyleSheet.create({
          card: {
            borderRadius: 0,
            marginLeft:0,
            marginRight:0,
            marginBottom:8,

          }, 
          card_image: {
             borderRadius: 0,
             
          }     
        });
    }

    return (
        <Link href={url}>
      <View className="bg-white p-[1px] duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700" style={styles.card}>
                       
                          {oImage &&
                    <View className="w-full sm:rounded-t-md bg-gray-500/20 aspect-video w-full sm:rounded-md overflow-hidden items-center" style={styles.card_image}>
                        <Image {...oImage} alt={data.title} view="cover"  />
                        
                    </View>
                    
                }  
                          <View className='flex-row px-4 py-3 space-x-2 '>
                            <Profile {...data.author_data} displayType="full" showInfo={(<Time className="" ts={data.date}></Time>)} className="" />
                           
                          
                          </View>
                          <View className='w-full px-4 pb-3 flex-col space-y-1'>
                            <Text className='text-gray-800 dark:text-gray-200 text text-xl leading-6 tracking-tight font-bold'>
                           {data.content.title}
                            </Text>
                            <Text className='text-gray-600 dark:text-gray-400'>
                                {data.description}{data.cmts.count}
                            </Text>
                          </View>
                          
                          
                          {false && /* TODO: attachments*/
                          <View className=" px-4 pb-4 w-full">
                              <View className="bg-gray-500/10  max-h-[80vh] w-full  rounded-md overflow-hidden items-center flex-row space-x-1">
                                <View className="bg-blue-500/20  flex-1 aspect-square  ">
                                
                                </View>
                                <View className="bg-blue-500/20  flex-1 aspect-square  ">
                                
                                </View>
                              </View>
                          </View>
                        }
        
        <View className="px-4 mb-3  flex-row space-x-3  ">
                        <Text className="text-gray-600 dark:text-gray-400 text-xs"><Text className="font-bold">12</Text> views</Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-xs"><Text className="font-bold">48</Text> likes</Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-xs"><Text className="font-bold">16</Text> comments</Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-xs"><Text className="font-bold">32</Text> reposts</Text>
                    </View>

                    

                    <View className="px-4 py-1  border-t border-gray-500/20  flex-row space-x-1  ">
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>Like</Text></View>
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>Comment</Text></View>
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>Repost</Text></View>
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>Share</Text></View>
                        <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className='group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto'>
                          More</Text></View>

                    </View>
        </View>
        </Link>     
    );
}
