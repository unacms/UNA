import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';

import { useState } from 'react';
import Html from '../../ui/atoms/html';
import { Text } from 'app/design/typography'
import { View, Pressable, Row } from 'app/design/view'
import { StyleSheet } from 'react-native';
import { Platform, Image as ImageNative } from 'react-native';
import { Button } from 'app/design/controls';
import Menu from '../menu';
import { Modal } from 'app/design/controls'
import { truncateHTML, stripTags } from 'app/lib/util'
import Carousel from '../../ui/molecules/carousel';

function DefaultUnit(data) {
    const [showFull, setShowFull] = useState(false)
    const [imageAspect, setImageAspect] = useState('aspect-square bg-blue-500/50')

    if (data.sFirstImg){
        ImageNative.getSize(data.sFirstImg, (width, height) => {
            if (width > height)
                setImageAspect('aspect-video');
        });
    }

    let styles = StyleSheet.create({});
    
    if (Platform.OS != 'web'){
            styles = StyleSheet.create({
                
                card_image: {
                     borderRadius: 0,
                }         
            });
    }

    let url = '/' + data.url;
    let bIsTimelineContent = data.type.includes('timeline') ? true : false;

    let bIsTitle = data?.content?.title && data?.content?.title?.trim() != ''
    let sShort = truncateHTML(data.content.text, 380);
    let bIsLong = stripTags(sShort.trim()) != stripTags(data.content.text.trim());
    console.log(data.content.text, sShort)
    return (
        
            <View className='max-w-5xl w-full mx-auto '>
                <View className=" 
                    p-1 mt-2 sm:mx-4 sm:mt-4  group duration-200 overflow-hidden sm:rounded-lg  
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                    hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                    hover:shadow-sm active:shadow-none 
                    active:translate-y-0.5 border
                    border-bordercolorcard dark:border-bordercolorcard-dark 
                    sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                    active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive"    
                    >
                        <Link href={url} className="w-full" emulate={true}>
                <View className="px-3 pt-3 gap-2 flex-row">
                    <View className="flex-auto">        
                        <Profile {...data.author_data} showLink={true} displayType="unit" displaySize="base" showInfo={(<Time className="" ts={data.date}></Time>)}  />
                    </View>
                    
                    {!!data.content.category && <View className="flex-none"><Button title={data.content.category}   size="xs" solid rounded variant="outline"/></View> }

                    </View>
                    </Link>
                   
                    <View className="flex-col ">
                        
                            {data.mainImage &&
                                <View className="w-full   mb-auto mt-3 aspect-video " style={styles.card_image}>
                                    <Image {...data.mainImage} alt={data.title} view="cover" className=" u-cover rounded" sizes="(max-width:768px) 100vw, 500px"   />
                                </View>
                            }   
                            <View className="flex-auto p-3   flex-col gap-2">
                            {(bIsTitle) && <Link href={url} className="w-full"><Text numberOfLines={2} className=" duration-200  text-gray-950 hover:text-accent dark:text-gray-50 hover:text-accent-dark text-xl tracking-tight font-bold">
                                    {data.content.title}
                                </Text></Link>}
                                    {!showFull ? 
                                    <View>
                                        <View className="flex-col gap-3 relative">
                                        { bIsTimelineContent && (
                                            <View>
                                            <Html  data={truncateHTML(data.content.text, 380)} />
                                                { (data.showMore && !showFull && bIsLong) && <View className='absolute right-0 bottom-0'><Button  title='More' onPress={(e) => {setShowFull(true); e.preventDefault() }} startDecorator="ArrowFatLineDown" size="xs" solid rounded  variant="link" /></View>}
                                            </View>
                                            )}
                                        { !bIsTimelineContent && <Text className='text-gray-950 dark:text-gray-50 text-base' numberOfLines={2} >{data.content.text}</Text>}
                                        </View>
                                    {!!data.sFirstImg &&
                                        <View className={imageAspect + " w-full rounded mt-4 overflow-hidden"} >
                                            <Image src={data.sFirstImg} alt={data.title} view="cover"        />
                                        </View>
                                    }    
                                    </View>
                                    :  <View className="flex-col relative w-full">
                                            <Html data={data.content.text} />
                                        </View>
                                            
                                        
                                    }
                                  
                                    { bIsTimelineContent && <UnitImages images={data.content.images_attach}/>}
                                <View className=" flex-auto  pt-2   flex-row  w-full">
                                    
                                    <View className="mt-auto flex-row space-x-2 flex-auto">
                                        <Menu {...data.menu_actions} displayType="button"  params={{show_action: true, show_counter: true, show_combined: true}} />
                                    </View> 
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
           
        );
}

function SmallUnit(data) {

    let url = '/' + data.url;

    return (
        <Link href={url} className="w-full" emulate={true}>
        <View className="
        flex-row p-2 sm:p-3 sm:mx-4 sm:mt-2  group duration-200 overflow-hidden sm:rounded-lg   
            bg-backgroundcard dark:bg-backgroundcard-dark 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive
            mt-[1px] 
            active:translate-y-0.5
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover
        
        
        ">    
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
    </Link>
    )
}

function UnitImages(images) {

    if (images?.images.length == 0)
        return <></>;

    let aImg = images?.images.map(obj => {
        return {
            src: obj.src_orig,
            type: 'image'
        };
    });

    return (
        <><Carousel data={aImg}/></>
    )
}

export default function UnitFeed(props) {

        let data = props.data;

        data.mainImage = null;
        if (data?.content?.images)    
            data.mainImage = data.content.images.length > 0 ? data.content.images[0] : null;

        data.comments = null;
        if (data?.cmts?.data?.length > 0){
            data.comments = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data;
        }

       /* data.sFirstImg = '';
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
*/
        data.showMore = true;
        let unit = props.mode == '' ? DefaultUnit(data) : SmallUnit(data);

        return (
            <>{unit}</>      
        );
}