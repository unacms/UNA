import Image from '../../ui/atoms/image';
import { stripTags } from '../../lib/util';
import Link from '../../ui/atoms/link';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';
import { TouchableOpacity } from 'app/design/view'
import { useState } from 'react';
import Html from '../../ui/atoms/html';
import { Text, H1 } from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic, Image as ImageNative } from 'react-native';
import { Button } from 'app/design/controls';

export default function UnitFeed({data}) {
    var oImage = null;
    if (data.content.images)  
      oImage = data.content.images.length > 0 ? data.content.images[0] : null;

    var oCmt = null;
    if (data.cmts.data.length > 0){
        oCmt = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data;
    }
    
    const [showFull, setShowFull] = useState(false)
    const [imageAspect, setImageAspect] = useState('aspect-square bg-blue-500/50')

    
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
    let sFirstImg = '';
    let sImages = [];
    var DomParser = require('react-native-html-parser').DOMParser
    let doc = new DomParser().parseFromString(data.content.text,'text/html')

    if (doc){
      sImages = doc.getElementsByTagName('img');
      if (sImages.length > 0){
          sFirstImg = sImages[0].attributes[0].value
      }
    }
    if (sFirstImg){
      ImageNative.getSize(sFirstImg, (width, height) => {
        if (width > height)
          setImageAspect('aspect-video');
      });
    }
    let bShowMore = false;

    let sPlainFull = '';
    let sPlain = '';
    if (data.content.text){
      sPlainFull = stripTags(data.content.text);
      sPlain = sPlainFull.substr(0,200);
      
      if (sPlain != sPlainFull || sImages.length > 1){
          bShowMore = true;
      }
    }
    return (
        <Link href={url} className="w-full">
        
        <View className="bg-card group duration-200 hover:shadow-lg active:shadow-none dark:bg-card-dark overflow-hidden border-y sm:border sm:rounded-lg hover:border-bordercolor/20 border-bordercolor/10 dark:border-bordercolor-dark/10 dark:hover:border-bordercolor-dark/20"  style={styles.card}>
                {oImage &&
                    <View className="w-full aspect-[3/1] " style={styles.card_image}>
                        <Image {...oImage} alt={data.title} view="cover" className="u-cover"  />
                    </View>
                }  
                  <View className="px-4 pt-4">
                  <Profile {...data.author_data} displayType="full" displaySize="lg" showInfo={(<Time className="" ts={data.date}></Time>)} className="" />
        
                  <View className="w-full  pb-4 flex-col space-y-4 pt-4">
                    <Text className="text-neo-700  group-hover:text-neo-900 duration-200 dark:group-hover:text-white dark:text-neo-200  text-2xl  tracking-tight font-bold">
                      {data.content.title}
                    </Text>
                        { !showFull ? <View><View className="flex-row space-x-2 max-h-12 overflow-hidden relative">
                            <Text className="text-neo-700  dark:text-neo-200 text-base">
                                 {sPlain}{data.cmts.count}
                          </Text>
                           { bShowMore && <View className='absolute  flex-row bottom-0  right-0 bg-gradient-to-r '  >
                                <View className='  w-10 right-0 bg-gradient-to-r from-transparent to-card dark:to-card-dark'></View>
                                <TouchableOpacity className='pl-2  bg-card dark:bg-card-dark'  onPress={(e) => {setShowFull(true);e.preventDefault() }}>
                                    <Text className="text-brand dark:text-brand-dark text-base font-medium">More...</Text>
                                </TouchableOpacity>
                            </View>
                            }
                        </View>
                        {sFirstImg &&
                            <View className={imageAspect + " w-full rounded mt-4 overflow-hidden"} >
                                <Image src={sFirstImg} alt={data.title} view="cover"    />
                            </View>
                        }  
                        </View>
                          :
                        <View>
                            <Html data={data.content.text} />
                        </View>
                        }
                  </View>
              
 </View>
                  <View className=" p-2  border-t border-bordercolor/10 dark:border-bordercolor-dark/10  flex-row space-x-1  ">
                    
                  <View className='flex-row w-full space-x-2'>
                      <View className=" flex-row space-x-2  ">
                      
                      <Button title="902" startDecorator="comment" size="sm" solid rounded variant="text"/>
                      
                      <Button title="12" startDecorator="share" size="sm" solid rounded variant="text"/>
                      <Button title="306" startDecorator="like" size="sm" solid rounded variant="text"/>
                      <Button title="8" startDecorator="dislike" size="sm" solid rounded variant="text"/>
                        

                      </View>
                      <View className=" flex-auto space-x-4 flex-row justify-end ">
                      <Button title="" startDecorator="more" size="sm" solid rounded variant="text"/>
                      </View>
                  </View>
                    
                    
                    
                    
                  </View>
                </View>
        
        
      
        </Link>     
    );
}
