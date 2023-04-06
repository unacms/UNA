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

function DefaultUnit(data) {
    const [showFull, setShowFull] = useState(false)
    const [imageAspect, setImageAspect] = useState('aspect-square bg-blue-500/50')
    const {height, width, scale, fontScale} = useWindowDimensions();

    if (data.sFirstImg){
        ImageNative.getSize(data.sFirstImg, (width, height) => {
            if (width > height)
                setImageAspect('aspect-video');
        });
    }

    let styles = StyleSheet.create({});
    
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
        <View className="bg-neocard group duration-200 hover:shadow-lg active:shadow-none dark:bg-neocard-dark overflow-hidden border-y sm:border sm:rounded-lg  border-neoborder dark:border-neoborder-dark"    style={styles.card}>
        {data.mainImage &&
            <View className="w-full aspect-[3/1] " style={styles.card_image}>
                    <Image {...data.mainImage} alt={data.title} view="cover" className="u-cover"    />
            </View>
        }    
        <View className="px-4 pt-4">
        <Profile {...data.author_data} displayType="unit" displaySize="lg" showInfo={(<Time className="" ts={data.date}></Time>)}  />
        <View className="w-full    pb-4 flex-col space-y-4 pt-4">
            <Text className="text-neogray-700    group-hover:text-neogray-900 duration-200 dark:group-hover:text-white dark:text-neogray-200    text-2xl    tracking-tight font-bold">
                {data.content.title}
            </Text>
                { !showFull ? <View><View className="flex-row space-x-2 max-h-12 overflow-hidden relative">
                    <Text className="text-neogray-700    dark:text-neogray-200 text-base">
                        {data.plainText}
                    </Text>
                        { data.showMore && <View className='absolute    flex-row bottom-0    right-0 bg-gradient-to-r '    >
                            <View className='    w-10 right-0 bg-gradient-to-r from-transparent to-card dark:to-card-dark'></View>
                                <TouchableOpacity className='pl-2    bg-neocard dark:bg-neocard-dark'    onPress={(e) => {setShowFull(true);e.preventDefault() }}>
                                        <Text className="text-brand dark:text-brand-dark text-base font-medium">More...</Text>
                                </TouchableOpacity>
                            </View>
                        }
                </View>
                {data.sFirstImg &&
                    <View className={imageAspect + " w-full rounded mt-4 overflow-hidden"} >
                        <Image src={data.sFirstImg} alt={data.title} view="cover"        />
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
        <View className=" p-2 border-t border-neoborder dark:border-neoborder-dark flex-row space-x-1 ">
            <View className='flex-row w-full space-x-2'>
                    <View className=" flex-row space-x-2    ">
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
    </View>);
}

function SmallUnit(data) {
    
    return (
        <View className="sm:rounded-lg flex-row  w-full mx-auto p-4 active:translate-y-0.5 active:bg-neocard-active dark:active:bg-neocard-darkactive duration-200 bg-neocard dark:bg-neocard-dark border-t sm:mb-1 hover:bg-neocard-hover dark:hover:bg-neogray-800 border-neoborder dark:border-neoborder-dark overflow-hidden ">    
            <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
                <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
            </View>
            <View className="flex-auto my-auto ">
                <View className='flex-row '>
                    <Text className='text-sm flex-auto mr-2 font-semibold text-neogray-900 dark:text-neogray-100'>{data.author_data.display_name}</Text>
                    <Text className='text-sm flex-none text-neogray-500'><Time ts={data.date}></Time></Text>
                </View>
                <View className='flex-row '>
                    <Text className="flex-auto text-base font-bold text-neogray-900 dark:text-neogray-100" numberOfLines={1}>{data.content.title}</Text>
                    
                </View>
                <View className='flex-row  w-full items-end content-end'>
                    <Text className='flex-auto mr-2 text-sm text-neogray-900 dark:text-neogray-100' numberOfLines={1}>{data.plainText}</Text>
                    <View className='flex-none bg-primary dark:bg-primary-dark rounded-full  my-auto h-min px-1.5'>
                        <Text className='text-xs text-white dark:text-black font-medium'>{data.cmts.count}</Text></View>
                    </View>         
            </View>
    </View>
    )
}

export default function UnitFeed(props) {

        let data = props.data;

        //TODO: rework url
        let url = '/' + data.url;

        data.mainImage = null;
        if (data.content.images)    
            data.mainImage = data.content.images.length > 0 ? data.content.images[0] : null;

        data.comments = null;
        if (data.cmts.data.length > 0){
            data.comments = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data;
        }

        data.sFirstImg = '';
        let sImages = [];
        try {

            var DomParser = require('react-native-html-parser').DOMParser
            
            let doc = new DomParser().parseFromString('<div>' + data.content.text + '</div>','text/html')

            if (doc){
                sImages = doc.getElementsByTagName('img');
                if (sImages.length > 0){
                    data.sFirstImg = sImages[0].attributes[0].value
                }
            }

        } catch (error) {
        }

        data.showMore = false;
        data.plainTextFull = '';
        data.plainText = '';

        if (data.content.text){
            data.plainTextFull = stripTags(data.content.text);
            data.plainText = data.plainTextFull.substr(0,200);
            
            if (data.plainText != data.plainTextFull || sImages.length > 1){
                data.showMore = true;
            }
        }

        let unit = props.mode == '' ? DefaultUnit(data) : SmallUnit(data);

        return (
            <Link href={url} className="w-full">{unit}</Link>         
        );
}
