import Image from '../../ui/atoms/image';
import { stripTags } from '../../lib/util';
import Link from '../../ui/atoms/link';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';

import { useState } from 'react';
import Html from '../../ui/atoms/html';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, Image as ImageNative } from 'react-native';
import { Button } from 'app/design/controls';
import Menu from '../menu';

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
        <View className="bg-neocard mt-1 sm:mt-0 hover:bg-neocard-hover dark:hover:bg-neocard-darkhover active:bg-neocard-active dark:active:bg-neocard-darkactive p-1 hover:shadow-sm border-y small:border border-neocard-border dark:border-neocard-darkborder hover:border-neocard-borderhover dark:hover:border-neocard-darkborderhover  group duration-200  dark:bg-neocard-dark overflow-hidden  sm:rounded-lg"    style={styles.card}>
        {data.mainImage &&
            <View className="w-full  aspect-[3/1] " style={styles.card_image}>
                    <Image {...data.mainImage} alt={data.title} view="cover" className="u-cover  rounded"    />
            </View>
        }    
        <View className="">
        <View className="px-3 pt-3">
        <Profile className="p-3 gap-3" {...data.author_data} displayType="unit" displaySize="lg" showInfo={(<Time className="" ts={data.date}></Time>)}  />

        </View>
        <View className="w-full p-3   flex-col gap-1">
            <Text numberOfLines={2} ellipsizeMode='head' className=" duration-200  text-gray-950 group-hover:text-gray-black dark:text-gray-50  dark:group-hover:text-white  text-xl    tracking-tight font-bold">
                {data.content.title}
            </Text>
                {!showFull ? <View><View className="flex-col gap-3    relative">
                    <Text numberOfLines={2}  className="text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100  text-base">
                        {data.plainText}
                    </Text>
                </View>
                {!!data.sFirstImg &&
                    <View className={imageAspect + " w-full rounded mt-4 overflow-hidden"} >
                        <Image src={data.sFirstImg} alt={data.title} view="cover"        />
                    </View>
                }    
                </View>
                :   <View>
                        <View className="flex-col gap-3    relative">
                            <Html data={data.content.text} />
                        </View>
                    </View>
                }
               
        </View>
        <View className='flex-row w-full flex-wrap px-3 pb-4'>
                    <View className='flex-row flex-auto justify-between  '>
                        {!!data.content.category && <View className="mr-1"><Button title={data.content.category}  startDecorator="Folders" size="xs" solid rounded variant="outline"/></View> }
                        <Menu {...data.menu_actions} displayType="element" showMatched="true" params={{show_action: false, show_counter: true}} />
                    </View>
                    { data.showMore && !showFull && <View className=' my-auto  flex-none   '    >
                        <Button title="View more"  onPress={(e) => {setShowFull(true); e.preventDefault() }} startDecorator="ArrowFatLineDown" size="xs" solid rounded variant="link"/>  
                    </View>
                    }
        </View>
       
        <View className=" border-t  mx-3 py-2 border-neoborder dark:border-neoborder-dark flex-row items-center justify-between gap-1 ">
            <View className=" flex-row gap-2 flex-auto">
                <Menu {...data.menu_actions} displayType="button" params={{show_action: true, show_action_as_button: false, show_counter: false}} />
            </View>
        </View>
    </View>
        
    </View>);
}

function SmallUnit(data) {
    
    return (
        <View className="sm:rounded-lg flex-row group w-full mx-auto p-4 active:translate-y-0.5 active:bg-neocard-active dark:active:bg-neocard-darkactive duration-200 bg-neocard dark:bg-neocard-dark  sm:border border-neoborder dark:border-neoborder-dark hover:border-primary/20 dark:hover:border-primary-dark/20 hover:shadow-sm active:shadow-none hover:bg-neocard-hover dark:hover:bg-gray-800  overflow-hidden ">    
            <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
                <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
            </View>
            <View className="flex-auto flex-col my-auto ">
                <View className='flex-row gap-2'>
                    <Text className='text-sm flex-auto  font-semibold text-gray-800 dark:text-gray-200'>{data.author_data.display_name}</Text>
                    <Time className='text-sm flex-none' ts={data.date}></Time>
                </View>
                <Text className="flex-auto text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-gray-950 dark:group-hover:text-gray-50" numberOfLines={1}>{data.content.title}</Text>

                <View className='flex-row  w-full items-end content-end'>
                    <Text className='flex-auto mr-2 text-sm text-gray-800 dark:text-gray-200 group-hover:text-gray-950 dark:group-hover:text-gray-50' numberOfLines={1}>{data.plainText}</Text>
                    <View className='flex-none bg-primary dark:bg-primary-dark rounded-full  my-auto h-min px-1.5'>
                        { data.cmts.count > 0 && <Text className='text-xs text-white dark:text-black font-medium'>{data.cmts.count}</Text> }
                    </View>
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
        
        const regex = /<img.*?src=['"](.*?)['"]/g;

        let match;
        while (match = regex.exec('<div>' + data.content.text + '</div>')) {
            sImages.push(match[1]);
        }
        if (sImages.length > 0){
            data.sFirstImg = sImages[0]
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
