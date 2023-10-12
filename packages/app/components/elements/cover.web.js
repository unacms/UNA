import { useState } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import Image from '../../ui/atoms/image'
import { Text } from 'app/design/typography'
import { stripTags } from '../../lib/util'
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { Button } from 'app/design/controls'
import { appSetting } from 'app/lib/util'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import Profile from 'app/ui/molecules/profile'
import Menu from 'app/components/menu'
import { useWindowDimensions } from 'react-native'
import { useRouter } from    'next/navigation';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, md5 } from '../../lib/util';
import { genRnd } from '../../lib/util';
import { fetcher } from 'app/lib/fetcher';
import * as ImageManipulator from 'expo-image-manipulator'
import { Image as ImageNative } from 'react-native';

function CoverMenu(props) {
    return (
        <View className="w-full">
            <View className="w-full justify-start align-end flex-row gap-2">
                <Menu
                    {...props}
                    displayType="button"
                    params={{ button_variant: 'default', button_rounded: false }}
                />
            </View>
        </View>
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
        <Menu {...props} displayType="mixed" params={{ button_variant: 'text' }} />
    )
}

export function CoverSmall(props) {
    const router = useRouter();
    const data = props.data
    return (
        <View className=" backdrop-blur bg-bgrtabbar    border-b border-bdrnavbar dark:border-bdr-d dark:bg-bgrtabbar-d    w-full ">
            <View className='max-w-screen-2xl w-full'>
                <View className=" mx-2 py-2 flex-row gap-2">
                    <Row className=" items-center    flex-auto">
                        <View className='mr-2 ml-2'>
                            {getBackButtonWeb()}
                        </View>
                        <Profile
                            {...data.profile}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />
                        <Row className=" items-center ml-3 w-full">
                            <Text className="text-lg xl:text-xl font-bold tracking-tight    text-neutral-900 dark:text-neutral-50">
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
            <View className='max-w-screen-2xl sm:px-4 mx-auto w-full'>
                <View className=" duration-500 bg-primary-200    dark:bg-primary-950 aspect-video sm:aspect-3/1 w-auto     xl:rounded-b-lg overflow-hidden">
                    {!!data.cover && (
                        <Image
                            alt={data.group_name}
                            view="cover"
                            sizes="(max-width:1280px) 100vw, 1280px"
                            className="u-cover "
                            src={coverUrl}
                        />
                    )}
                    { data.allow_edit && <View className='p-4'><Button rounded startDecorator="Gear" onPress={() => handleUpload('cover')} /></View>}
                    { bPerson && <View className=" backdrop-blur bg-bgritem/50 dark:bg-bgrnavbar-d pl-4 md:pl-6 pr-6 lg:px-8 lg:py-4 py-3 duration-300    rounded-2xl mb-2 ml-2    mr-32 sm:mr-48 md:ml-44 lg:ml-52 md:mr-4     mt-auto    flex-none flex-row items-center    ">
                            <Text
                                numberOfLines={3}
                                className=" w-full text-sm md:text-base text-neutral-800 dark:text-neutral-200 "
                            >
                                {stripTags(data.profile.info.description)}
                            </Text>
                        </View>
                    }
                    <View className='absolute lg:hidden top-4 left-4 z-50'>
                        {getBackButtonWeb()}
                    </View>
                </View>

                <View className="relative    flex-col md:flex-row gap-x-2 px-2 sm:px-4 pb-4 ">
                    
                {bPerson && <View className=" flex-col    w-full md:w-52 ">
                        <View className='rounded-full w-min p-1 z-50 right-0 lg:p-2 absolute duration-200 -bottom-12 sm:-bottom-24 md:-bottom-2 flex-none bg-bgrcard dark:bg-bgrcard-d '>
                            <Profile
                                {...data.profile}
                                displayType="unit_wo_info"
                                displaySize={width >= 640 ? '4xl' : '3xl'}
                            />
                            { data.allow_edit && <View className='p-4 absolute bottom-0'><Button rounded startDecorator="Gear" onPress={() => handleUpload('picture')} /></View>}
                        </View>    
                    </View>
                    }
                    <View className="flex-col lg:flex-row gap-x-2 gap-y-4    flex-auto ">
                            <View className=" flex-col    mt-4 flex-auto gap-y-2 ">
                                <Text className="tracking-tight text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50 ml-2">
                                    {data.profile.display_name}
                                </Text>
                                <View className="     ">
                                <CoverMenuMeta {...data.meta_menu} />
                            </View>
                                
                            </View>
                    
                            <View className="flex-none ml-2 mt-auto    ">
                                <CoverMenu {...data.actions_menu} />
                            </View>
                    </View>
                </View>
                
             
            </View>
        </View>
    )
}
