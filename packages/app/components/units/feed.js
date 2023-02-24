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
        <Link href={url} className="w-full">
        
        <View className="bg-white group duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700"  style={styles.card}>
                {oImage &&
                    <View className="w-full aspect-[3/1] " style={styles.card_image}>
                        <Image {...oImage} alt={data.title} view="cover" className="u-cover"  />
                    </View>
                }  
                  <View className="px-4 pt-4">
                  <Profile {...data.author_data} displayType="full" showInfo={(<Time className="" ts={data.date}></Time>)} className="" />
        
                  <View className="w-full  pb-4 flex-col space-y-4 pt-4">
                    <Text className="text-gray-800  group-hover:text-gray-900 duration-200 dark:group-hover:text-white dark:text-gray-200  text-2xl  tracking-tight font-bold">
                      {data.content.title}
                    </Text>
                    <View className="flex-row space-x-2 h-12 overflow-hidden relative">
                      <Text className="text-gray-700  dark:text-gray-300 text-base">
                        {data.description}{data.cmts.count} Our app provides an intuitive and easy-to-use interface
                        for users to publish and share content on their social
                        media accounts. Leveraging the power of UNA's community
                        platform, our app allows users to connect and engage with
                        like-minded individuals, creating a vibrant social network
                        that is both fun and functional.
                      </Text>
                      <View className='absolute  flex-row bottom-0  right-0 bg-gradient-to-r '>
                        <View className='  w-10 right-0 bg-gradient-to-r from-transparent to-white dark:to-gray-800'>
                          
                        </View>
                        <View className='pl-2  bg-white dark:bg-gray-800'>
                          <Text className="text-blue-600 dark:text-blue-400 text-base font-semibold">
                          More...
                          </Text>
                        </View>
                        
                      </View>
                    </View>
                  </View>
                  <View className="w-full pb-4 rounded-lg">
                    <View className="w-full aspect-square rounded-lg bg-blue-500/50 "></View>
                  </View>
                  <View className='flex-row w-full space-x-4'>
                      <View className=" mb-3 flex-auto flex-row space-x-4  ">
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          <Text className="font-bold text-gray-700 dark:text-gray-300">16</Text> comments
                        </Text>
                      </View>
                      <View className="mb-3  flex-row space-x-4  ">
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          <Text className="font-bold text-gray-700 dark:text-gray-300">12</Text> views
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          <Text className="font-bold text-gray-700 dark:text-gray-300">48</Text> likes
                        </Text>
                
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          <Text className="font-bold text-gray-700 dark:text-gray-300">32</Text> reposts
                        </Text>
                      </View>
                  </View>
 </View>
                  <View className="px-4 py-2  border-t border-gray-500/20  flex-row space-x-1  ">
                    
                  <View className='flex-row w-full space-x-4'>
                      <View className=" flex-row space-x-2  ">
                          <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            Like
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            Comment
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            Repost
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            Share
                          </Text>
                        </View>

                      </View>
                      <View className=" flex-auto space-x-2 flex-row justify-end ">
                        <View className="group  flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            More
                          </Text>
                        </View>
                      </View>
                  </View>
                    
                    
                    
                    
                  </View>
                </View>
        
        
      
        </Link>     
    );
}
