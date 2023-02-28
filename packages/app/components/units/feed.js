import Image from '../atoms/image';
import Link from '../atoms/link';
import Time from '../atoms/time';
import Profile from '../atoms/profile';
import { TouchableOpacity } from 'app/design/view'
import { useState } from 'react';
import Html from '../atoms/html';
import { Text, H1 } from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic } from 'react-native'

export default function UnitFeed({data}) {
    var oImage = null;
    if (data.content.images)  
      oImage = data.content.images.length > 0 ? data.content.images[0] : null;

    var oCmt = null;
    if (data.cmts.data.length > 0){
        oCmt = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data;
    }
    
    const [showFull, setShowFull] = useState(false)
    
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
    
    var DomParser = require('react-native-html-parser').DOMParser
    let doc = new DomParser().parseFromString(data.content.text,'text/html')
    let sFirstImg = '';
    let sImages = doc.getElementsByTagName('img');
    if (sImages.length > 0){
        sFirstImg = sImages[0].attributes[0].value
    }
    
    const regex = /(<([^>]+)>)/ig;
    let sPlainFull = data.content.text.replace(regex, '');
    let sPlain = sPlainFull.substr(0,50);
    let bShowMore = false;
    if (sPlain != sPlainFull || sImages.length > 1){
        bShowMore = true;
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
                  <Profile {...data.author_data} displayType="full" displaySize="lg" showInfo={(<Time className="" ts={data.date}></Time>)} className="" />
        
                  <View className="w-full  pb-4 flex-col space-y-4 pt-4">
                    <Text className="text-neo-800  group-hover:text-neo-900 duration-200 dark:group-hover:text-white dark:text-neo-200  text-2xl  tracking-tight font-bold">
                      {data.content.title}
                    </Text>
                        { !showFull ? <View><View className="flex-row space-x-2 max-h-12 overflow-hidden relative">
                            <Text className="text-neo-700  dark:text-neo-300 text-base">
                                 {sPlain} {data.description}{data.cmts.count}
                          </Text>
                           { bShowMore && <View className='absolute  flex-row bottom-0  right-0 bg-gradient-to-r '  >
                                <View className='  w-10 right-0 bg-gradient-to-r from-transparent to-white dark:to-gray-800'></View>
                                <TouchableOpacity className='pl-2  bg-white dark:bg-gray-800'  onPress={(e) => {setShowFull(true);e.preventDefault() }}>
                                    <Text className="text-blue-600 dark:text-blue-400 text-base font-semibold">More...</Text>
                                </TouchableOpacity>
                            </View>
                            }
                        </View>
                        {sFirstImg &&
                            <View className="w-full rounded-lg mt-4 aspect-square bg-blue-500/50" >
                                <Image src={sFirstImg} alt={data.title} view="cover" className="u-cover"  />
                            </View>
                        }  
                        </View>
                          :
                        <View>
                            <Html data={data.content.text} />
                        </View>
                        }
                  </View>
                  <View className='flex-row w-full space-x-4'>
                      <View className=" mb-3 flex-auto flex-row space-x-4  ">
                        <Text className="text-neo-600 dark:text-neo-400 text-sm">
                          <Text className="font-bold text-neo-700 dark:text-neo-300">16</Text> comments
                        </Text>
                      </View>
                      <View className="mb-3  flex-row space-x-4  ">
                        <Text className="text-neo-600 dark:text-neo-400 text-sm">
                          <Text className="font-bold text-neo-700 dark:text-neo-300">12</Text> views
                        </Text>
                        <Text className="text-neo-600 dark:text-neo-400 text-sm">
                          <Text className="font-bold text-neo-700 dark:text-neo-300">48</Text> likes
                        </Text>
                
                        <Text className="text-neo-600 dark:text-neo-400 text-sm">
                          <Text className="font-bold text-neo-700 dark:text-neo-300">32</Text> reposts
                        </Text>
                      </View>
                  </View>
 </View>
                  <View className=" px-4 py-2  border-t border-gray-500/20  flex-row space-x-1  ">
                    
                  <View className='flex-row w-full space-x-4'>
                      <View className=" flex-row space-x-2  ">
                          <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-neo-800 text-neo-600 dark:group-hover:text-neo-200 dark:text-neo-400 text-sm font-semibold mx-auto">
                            Like
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-neo-800 text-neo-600 dark:group-hover:text-neo-200 dark:text-neo-400 text-sm font-semibold mx-auto">
                            Comment
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-neo-800 text-neo-600 dark:group-hover:text-neo-200 dark:text-neo-400 text-sm font-semibold mx-auto">
                            Repost
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-neo-800 text-neo-600 dark:group-hover:text-neo-200 dark:text-neo-400 text-sm font-semibold mx-auto">
                            Share
                          </Text>
                        </View>

                      </View>
                      <View className=" flex-auto space-x-2 flex-row justify-end ">
                        <View className="group  flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-neo-800 text-neo-600 dark:group-hover:text-neo-200 dark:text-neo-400 text-sm font-semibold mx-auto">
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
