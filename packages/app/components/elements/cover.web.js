import { useState } from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import { Text } from 'app/design/typography'
import { stripTags } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { Button } from 'app/design/controls'
import { appSetting } from 'app/lib/util'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import Profile from 'app/ui/molecules/profile'
import Menu from 'app/components/menu'
import { useWindowDimensions } from 'react-native'
import { useRouter } from    'next/navigation';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, md5 } from 'app/lib/util';
import { genRnd } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import * as ImageManipulator from 'expo-image-manipulator'
import { Image as ImageNative } from 'react-native';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { FeedbackHaptics } from 'app/lib/util';

function CoverMenu(props) {
    let { width } = useWindowDimensions();
    let size="base"
    
    if (width < 1280)
        size="sm"

    const isSplitMenu = appSetting('layout', 'split_action_menu');

    let aMenuManageItems = [];

    let propsCopy = {...props}; // Create a copy of the array

    if (isSplitMenu){
        propsCopy.items = propsCopy.items.filter(aItem => {
            if(aItem?.display_type && aItem.display_type != 'link') {
                return true; // Exclude this item from the new array
            }
            else{
                aMenuManageItems.push({
                    id: aItem.id ? aItem.id : aItem.name,
                    link: '/' + aItem.link,
                    title: aItem.title
                });
        
                return false; // Include this item in the new array
            }        
        });
    }
    else{
        propsCopy.items = propsCopy.items.filter(aItem => {
            if(aItem.name != props.uri) {
                return true; // Exclude this item from the new array
            }
            else{
                
                return false; // Include this item in the new array
            }        
        });
    }

    return (
        <><Menu
            {...propsCopy}
            displayType="button"
            params={{ 
                show_action: true,
                show_counter: true,
                show_combined: true, 
                button_variant: 'default', 
                button_size: size, 
                button_rounded: false,
            }}
        />
        {isSplitMenu && <View className='ml-2'>
            <DropdownMenu items={aMenuManageItems}>
                <Button variant="default" size={size} tooltip="Settings" startDecorator="Gear" onPress={() => { FeedbackHaptics('Medium'); }}  />
            </DropdownMenu>
        </View>}
        </>
    )
}

function CoverMenuSmall(props) {
    const [ntfsOpen, setNtfsOpen] = useState(false)

    return (
        <DropdownPopup
            open={ntfsOpen}
            onOpenChange={(bOpen) => {
                setNtfsOpen(bOpen)
            }}
            title="Test"
        >
            {[
                <Button key="btn" variant="text" rounded startDecorator="DotsThreeOutline" />,
                <Menu key="menu"
                    {...props}
                    displayType="button"
                    params={{
                        showVertical: true,
                        button_variant: 'default',
                        button_rounded: false,
                        button_full_width: true,
                    }}
                />
            ]}
        </DropdownPopup>
    )
}

function CoverMenuMeta(props) {
    return (
        <Menu {...props} displayType="mixed" params={{ button_variant: 'text', button_size: 'sm', button_hide_title_on_small: false  }} />
    )
}

export function CoverSmall(props) {
    const router = useRouter();
    const data = props.data

    const windowDimen =  useWindowDimensions();
    const windowWidth = windowDimen.width;

    let styles={}
    if (windowWidth > 600 && appSetting('layout', 'format') == 'ver'){
        styles = {width: 1536 - 20*16}
    }

    return (
        <View style={styles} className=" backdrop-blur bg-bgrtabbar    border-b border-bdrnavbar dark:border-bdr-d dark:bg-bgrtabbar-d    w-full ">
            <View className={appSetting('layout', 'max_width') + ' w-full mx-auto'}>
                <View className=" mx-2 py-2 flex-row gap-2">
                    <Row className=" items-center flex-auto">
                        <View className='mr-2 ml-2'>
                            {getBackButtonWeb()}
                        </View>
                        <Profile
                            {...data.profile}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />
                        <Row className=" items-center ml-3 w-full">
                            <Text className="text-lg xl:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                                {data.profile.display_name}
                            </Text>
                            <View className="ml-4">
                                <Button
                                    size="sm"
                                    rounded
                                    startDecorator="SealCheck"
                                    variant="link"
                                    fullWidth
                                />
                            </View>
                        </Row>
                    </Row>
                    <View className=" w-auto    my-auto ">
                        <CoverMenuSmall {...data.actions_menu} />
                    </View>
                </View>
            </View>
        </View>
    )
}

export default function ElementCover(props) {
    const data = props.data
    const mode = props.mode
    let { width } = useWindowDimensions()
    let bPerson = props.data.profile.module == 'bx_persons' ? true : false;
    const [coverUrl, setCoverUrl] = useState(data.cover.src);
    const [pictureUrl, setPictureUrl] = useState(data.profile.url_avatar)

    const uo = props.data.profile.module + '_cover_crop';
    const so = data.cover.storage;
    const img_trans = '';
    const c = data.profile.info.id;
    const handleUpload = async (mode) => {

        const url = '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&uo=' + uo + '&so=' + so + '&uid=' + genRnd(8) + '&img_trans=' + img_trans + '&m=0&c=' + c + '&p=0';

        //alert(mode);
        let mediaTypes = ImagePicker.MediaTypeOptions.Images;
                        
        let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaTypes,
                quality: 1,
                allowsMultipleSelection: false,
        });
        if (!result.cancelled) {
            for (const i of result.assets) {
                let uri = i.uri;
                ImageNative.getSize(uri, async (width, height) => {
                    if (mode == 'cover'){
                        let manipulatedWidth = 2000;
                        let manipulatedHeight = 2000;
                        
                        if (width > manipulatedWidth || height > manipulatedHeight) {
                            if (width > height) {
                                manipulatedHeight = Math.round((height * manipulatedWidth) / width);
                            } else {
                                manipulatedWidth = Math.round((width * manipulatedHeight) / height);
                            }
                    
                            const resizedPhoto = await ImageManipulator.manipulateAsync(uri, [
                                { resize: { width: manipulatedWidth, height: manipulatedHeight } }
                            ]);
                            uri = resizedPhoto.uri;
                        }
                    }
                    if (mode == 'picture'){
                      
                        let s = width;
                        let originX = 0;
                        let originY = 0;
                        let acts = [];
                        if (width != height) {
                            if (width > height) {
                                s = height;
                                originX = (width - height)/2;
                            } else {
                                s = width
                                originY = (height - width)/2;
                            }
                            acts.push({ crop: { width: s, height: s, originX:0, originY:0 } });
                        }
                        if (s > 500){
                            acts.push( { resize: { width: 500, height: 500 } });
                        }
                        const resizedPhoto = await ImageManipulator.manipulateAsync(uri, acts);
                        uri = resizedPhoto.uri;
                    }
                    let hash = md5(uri);
                    uploadImage(
                        uri,
                        url + '&a=upload',
                        handleInsertImageFinish,
                        { hash: hash, mode: mode }
                    );
                });
                
                
            }
        }

    };

    const handleInsertImageFinish = async (result, extraVar) => {
        const sRequest = '/api.php?r=' + props.data.profile.module + '/update_image/&params[]=' + extraVar.mode + '&params[]=' + c + '&params[]=' + result.data.id;
        const sResponse = await fetcher(sRequest);
        if (extraVar.mode == 'cover')
            setCoverUrl(sResponse.data);
        else
            setPictureUrl(sResponse.data);
    };

    data.profile.url_avatar = pictureUrl;

    return (
        <View className=" backdrop-blur border-b border-bdrnavbar dark:border-bdr-d bg-bgrnavbar dark:bg-bgrnavbar-d ">
            <View className={appSetting('layout', 'max_width') + ' sm:p-4 mx-auto w-full'}>
                {mode != 'min' && <View className={" duration-500 bg-primary-200  dark:bg-primary-950 aspect-video sm:"+appSetting('layout', 'cover_aspect')+" w-auto sm:rounded-xl overflow-hidden"}>
                    {!!data.cover && (
                        <Image
                            alt={data.group_name}
                            view="cover"
                            sizes="(max-width:1280px) 100vw, 1280px"
                            className="u-cover "
                            src={coverUrl}
                        />
                    )}
                    { data.allow_edit && <View className='p-4 items-end'><Button rounded startDecorator="Gear" onPress={() => handleUpload('cover')} /></View>}
                  
                    <View className='absolute lg:hidden top-4 left-4 z-50'>
                        {getBackButtonWeb()}
                    </View>
                </View>}

                <View className="relative  flex-col md:flex-row gap-x-2 px-2   ">
                    
                {bPerson && <View className=" w-full h-24  md:h-44 lg:h-28 md:w-52 lg:mb-2 items-center  ">
                        <View className='rounded-full absolute w-min p-1 z-50 duration-200 bottom-0  flex-none bg-bgrcard-h dark:bg-bgrcard-dh '>
                            <Profile
                                {...data.profile}
                                displayType="unit_wo_info"
                                displaySize='4xl'
                            />
                            { data.allow_edit && <View className='p-4 absolute -bottom-2 right-0'><Button rounded  startDecorator="Camera" onPress={() => handleUpload('picture')} /></View>}
                        </View>    
                    </View>
                    }
                    <View className="flex-col lg:flex-row px-2 gap-x-4 gap-y-4 my-4 flex-auto">
                            <View className=" flex-col  items-center md:items-start     flex-auto gap-y-2 ">
                                <Text className="tracking-tight text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
                                    {data.profile.display_name}
                                </Text>
                                
                                    <Row className='gap-x-2'>
                                        <CoverMenuMeta {...data.meta_menu} />
                                    </Row>
                                
                                
                            </View>
                    
                            <View className="flex-none mt-auto lg:mt-6 max-w-3xl overflow-hidden ">
                                <ScrollView horizontal={true} className={(data.actions_menu.items.length > (width > 640? 3: 100) ? '' : 'mx-auto md:ml-0') + ' items-center md:items-start'}>
                                    <CoverMenu {...data.actions_menu} uri={props?.uri} />
                                </ScrollView>
                            </View>

                            { bPerson && 
                                <Text
                                    numberOfLines={3}
                                    className="lg:hidden  w-full text-sm md:text-base text-neutral-800 dark:text-neutral-200 "
                                >
                                {stripTags(data.profile.info.description)}
                            </Text>
                    }
                    </View>
                </View>
            </View>
        </View>
    )
}
