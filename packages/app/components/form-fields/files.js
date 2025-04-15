import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Field, { getValidationRules } from './_field';
import { View, ViewRef, Row, Pressable } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { genRnd, appSetting } from 'app/lib/util';
import * as DocumentPicker from 'expo-document-picker';
import { fetcher } from 'app/lib/fetcher';
import { useFormContext, useController } from 'react-hook-form';
import { uploadImage, md5, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import Loading from 'app/ui/atoms/loading'
import { Text } from 'app/design/typography'
import { Image as ImageNative, Alert, Platform } from 'react-native';
import { Camera } from "expo-camera";
import { useFilesData } from 'app/context/files';
import { Image as ImageRN } from 'react-native';
import Video from 'app/ui/atoms/video';

export default function (props) {
    const name = props.name;
    const [uploadFinished, setUploadFinished] = useState(null);
    const [uploadFinishedArr, setUploadFinishedArr] = useState([]);
    const [imageSource, setImageSource] = useState({ images: props?.values_src });
    const formContext = useFormContext();
    const formValue = formContext.watch(name);
    const obfuscateFaces = formContext.watch('obfuscate_faces');
    const video_source = formContext.watch('video_source');
    const rules = getValidationRules(props);
    const defaultValue = props?.value ? props.value : '';
    const { filesData, setFilesData } = useFilesData();
    const { field } = useController({ name, rules, defaultValue });
    const bMultiple = props.multiple;
    const [hasPermissionCamera, requestPermissionCamera] = ImagePicker.useCameraPermissions();
    const [hasPermissionLibrary, requestPermissionLibrary] = ImagePicker.useMediaLibraryPermissions();

    const isAutoGhosts = appSetting('forms', 'auto_ghosts_in_files')

    const url = useMemo(() => {
        return '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&obfuscate_faces=' + obfuscateFaces + '&&uo=' + props.uploaders[0] + '&so=' + props.storage_object + '&uid=' + genRnd(8) + '&img_trans=' + props.images_transcoder + '&m=' + (bMultiple ? 1 : 0) + '&c=' + props.content_id + '&p=' + (props.privacy ? 1 : 0);
    }, [props, obfuscateFaces]);

    useEffect(() => {
        const uploadImagesAsync = async (assets) => {
            const k = await uploadImages(assets);
            setImageSource({ images: k });
        };

        if (filesData?.type == 'images:pasted' && props.asDefaultStorage) {
            uploadImagesAsync(filesData.data)
            setFilesData(null);
        }
    }, [filesData]);


    const RestoreGhosts = async (data) => {
        if (isAutoGhosts)
            return;
        /*
                let a = [];
                let av = [];
        
                const result = await fetcher(url + "&a=restore_ghosts&_t=" + escape(new Date()));
                if (result && result?.data[0]) {
                    Object.keys(result.data[0]).forEach(function (k) {
                        a.push(result.data[0][k]);
                        av.push(result.data[0][k].file_id)
                    });
                }
        
                a.forEach(function (k) {
                     if (k.file_id) {
                         const val = av.join(',');
                         if (name == 'covers') {
                             formContext.setValue('thumb', val)
                         }
                         if (props.useUrl) {
                             field.onChange(a[0].file_url);
                         }
                         else {
                             field.onChange(val);
                         }
                     }
                 });
                 if (a.length == 0 && field.value != '')
                     field.onChange('');
        
                let filteredArr = []
                if (imageSource?.images)
                    filteredArr = imageSource?.images?.filter(
                        item => item.preload === true && !uploadFinishedArr.some(finished => finished == item.hash)
                    );
              //  console.log("aaa",{ images: [...a, ...filteredArr] })
               // console.log("aaa1", props.values_src.g)
                setImageSource({ images: [...a, ...filteredArr] });*/
    };

    useEffect(() => {
        if (props.previewPlaceHolder) {
            props.previewPlaceHolder(name, GhostsList(imageSource.images, bMultiple, handleDelete, props));
        }
        if (imageSource.images) {
            const fileIds = imageSource.images
                .filter(item => item.file_id !== undefined) // Оставляем только элементы с file_id
                .map(item => item.file_id) // Извлекаем file_id
                .join(',');
            if (name == 'covers') {
                formContext.setValue('thumb', fileIds)
            }
            field.onChange(fileIds);
        }
        else {
            field.onChange('');
        }
        // console.log("imageSourceimageSource", imageSource.images)
    }, [imageSource]);

    useEffect(() => {
        if (formValue && field.value && !isNaN(field.value)) {
            RestoreGhosts(0);
        }
        if (!formValue) {
            //setImageSource({ images: null });  //TOFIX
        }
    }, [formValue]);

    useEffect(() => {
        if (!imageSource.images && !props.useUrl) {
            RestoreGhosts(0);
        }
        if (formContext.formState.isSubmitted) {
            setTimeout(() => {
                //may be need restore
                // RestoreGhosts(0);
            }, 100);
        }
    }, [formContext.formState.isSubmitted, imageSource.images]);


    /* const handleInsertImageFinish = useCallback(async (result, extraVar) => {
         RestoreGhosts({ hash: extraVar.hash, id: result?.data?.id });
     }, []);*/

    useEffect(() => {
        if (uploadFinished?.result) {
            if (isAutoGhosts) {
                if (uploadFinished?.result?.data?.ghost) {
                    const updatedImages = imageSource?.images?.map(item =>
                        item.hash === uploadFinished.extraVar.hash ? { ...uploadFinished?.result.data.ghost, uri: item.uri } : item
                    );
                    setImageSource({ images: updatedImages });
                }
                else {

                    const updatedImages = imageSource?.images.filter(item => item.hash != uploadFinished.extraVar.hash);
                    setImageSource({ images: updatedImages });
                }

            }
            else {
                setUploadFinishedArr((prevArr) => [...prevArr, uploadFinished.extraVar.hash]);
            }

        }
    }, [uploadFinished]);

    useEffect(() => {
        RestoreGhosts();
    }, [uploadFinishedArr]);

    const uploadImages = async (asset) => {
        let k = imageSource.images ? imageSource.images : [];
        if (!asset)
            return
        let objectsToAdd = [];
        setImageSource({ images: k });

        for (const i of asset) {
            let uri = i.uri;
            const hash = md5(uri);
            objectsToAdd.push({ preload: true, file_type: i.mimeType, type: i.type, hash: hash, uri: uri });

            const isImage = i?.mimeType?.includes('image/');
            if (isImage) {
                ImageNative.getSize(uri, async (width, height) => {
                    let manipulatedWidth = 1600;
                    let manipulatedHeight = 1600;

                    if (width > manipulatedWidth || height > manipulatedHeight) {
                        if (width > height) {
                            manipulatedHeight = Math.round((height * manipulatedWidth) / width);
                        } else {
                            manipulatedWidth = Math.round((width * manipulatedHeight) / height);
                        }

                        const resizedPhoto = await manipulateAsync(
                            uri,
                            [{ resize: { width: manipulatedWidth, height: manipulatedHeight } }], // Изменение ширины до 800 пикселей; высота будет рассчитана автоматически
                            { compress: 0.4, format: SaveFormat.JPEG }
                        );

                        uri = resizedPhoto.uri;
                    }

                    uploadImage(
                        uri,
                        url + '&a=upload',
                        setUploadFinished,
                        { hash: hash }
                    );

                    let fileType = i.type ? i.type + '/' : uri.split(';')[0].split(':')[1];
                    k = [
                        ...k,
                        { file_url: uri, file_type: fileType, preload: true, hash: hash }
                    ];
                });
            }
            else {


                uploadImage(
                    uri,
                    url + '&a=upload',
                    setUploadFinished,
                    { hash: hash }
                );

                let fileType = i.type ? i.type + '/' : uri.split(';')[0].split(':')[1];
                /*k = [
                    ...k,
                    { file_url: uri, file_type: fileType, preload: true, hash: hash }
                ];*/
            }
        }
        if (bMultiple) {
            k = [
                ...k,
                ...objectsToAdd
            ];
        }
        else {
            k = [
                ...objectsToAdd
            ];
        }
        return k;
    }

    const selectImage = useCallback(async () => {

        let bIsMedia = props.ext_deny == '' || props.ext_allow == 'mp3,m4a,m4b,wma,wav,3gp' ? true : false;

        if (!bIsMedia && props.ext_deny.length && !'jpg,jpeg,jpe,gif,png,svg,webp'.split(',').filter((s) => ~props.ext_deny.split(',').indexOf(s)).length)
            bIsMedia = true;

        if (Platform.OS !== 'web' && bIsMedia) {
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status === "granted") {
                selectImage1(props.source, bIsMedia)
            }
            else {
                Alert.alert(
                    "Upload Photo",
                    "Gallery permissions are needed",
                    [
                        {
                            text: "Cancel",
                            style: "cancel"
                        }
                    ],
                    { cancelable: true }


                )
            }
        }
        else {
            selectImage1('library', bIsMedia)
        }
    }, [props.ext_deny, props.ext_allow, props.source, imageSource, url, hasPermissionCamera, hasPermissionLibrary]);


    const selectImage1 = useCallback(async (type, bIsMedia) => {
        if (bIsMedia) {

            let mediaTypes = ['images', 'videos'];
            if (props.ext_allow.includes('jpg') && !props.ext_allow.includes('mp4'))
                mediaTypes = ['images'];
            if (props.ext_allow.includes('mp4') && !props.ext_allow.includes('mp4'))
                mediaTypes = ['videos'];

            let result = null
            if (type != 'camera') {

                if (!hasPermissionLibrary) {
                    const { status2 } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status2 !== 'granted') {
                        Alert.alert('Permission to access lib is required!');
                        return;
                    }
                }

                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: mediaTypes,
                    quality: 1,
                    UIImagePickerPreferredAssetRepresentationMode: 'current',
                    allowsMultipleSelection: bMultiple,
                });
            }
            else {

                if (!hasPermissionCamera) {
                    const permission = await requestPermissionCamera();
                    if (!permission.granted) {
                        Alert.alert('Camera access is required to use this feature.');
                        return;
                    }
                }

                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: mediaTypes,
                    quality: 1,
                    UIImagePickerPreferredAssetRepresentationMode: 'current',
                    allowsMultipleSelection: bMultiple,
                });
            }
            if (!result.cancelled) {
                let k = await uploadImages(result.assets);
                setImageSource({ images: k });
            }
        }
        else {
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*', // This allows all file types
                    multiple: true
                });

                if (!result.cancelled) {
                    let k = await uploadImages(result.assets);
                    setImageSource({ images: k });
                }
            } catch (err) {
                console.error('Error picking document:', err);
            }
        }
    }, [props.ext_deny, props.ext_allow, imageSource, url, hasPermissionCamera, hasPermissionLibrary]);

    const handleDelete = useCallback(async (id) => {
        const filteredArr = imageSource?.images?.filter(item => item.file_id != id);
        setImageSource({ images: [...filteredArr] });
        await fetcher(url + "&a=delete&id=" + id);
    }, [url, imageSource]);


    // may be need improve in future
    if (video_source == 'embed')
        return null;

    if (props.view == 'button') {
        return <ButtonCover imageSource={imageSource} selectImage={selectImage} />
    }

    if (props.view == 'preview') {
        return imageSource?.images?.length > 0 ? <ActionButton uploadImages={uploadImages} imagesList={imageSource.images} bMultiple={bMultiple} props={props} selectImage={selectImage} handleDelete={handleDelete} />
            : <></>;
    }
    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <View className={bMultiple ? "" : ""} >
                <ActionButton uploadImages={uploadImages} imagesList={imageSource.images} props={props} bMultiple={bMultiple} selectImage={selectImage} handleDelete={handleDelete} />
            </View>
            {!props.previewPlaceHolder && <Row className='flex-wrap '>{GhostsList(imageSource.images, bMultiple, handleDelete, props)}</Row>}
        </Field>
    );
}

function ActionButton({ imagesList, props, selectImage, handleDelete, bMultiple, uploadImages }) {
    const drop = useRef(null);
    const iconMap = {
        photo: "Image",
        cmt_image: "Image",
        pictures: "Image",
        video: "Image",
        videos: "Image",
        files: "Paperclip",
        file: "Paperclip",
        sounds: "FileAudio"
    };

    let sIcon = iconMap[props.name] || "Plus";
    let sTitle = sIcon === "Plus" ? "Select " + props.name : "";
    if (props.source == 'camera') {
        sIcon = 'Camera';
    }

    useEffect(() => {
        if (drop.current && Platform.OS === 'web') {
            drop.current.addEventListener('dragover', handleDragOver);
            drop.current.addEventListener('drop', handleDrop);
            return () => {
                if (drop.current) {
                    drop.current.removeEventListener('dragover', handleDragOver);
                    drop.current.removeEventListener('drop', handleDrop);
                }
            };
        }
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const { files } = e.dataTransfer;

        if (files && files.length) {
            if (files && files.length) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const k = await uploadImages([{ uri: event.target.result }]);
                    console.log("imageSource3", k)
                    setImageSource({ images: k });
                };
                reader.readAsDataURL(files[0]);
            }
        }
    };
    let button = <Button startDecorator={props.icon ? props.icon : sIcon} title={props.title ? props.title : sTitle} size={props.size ? props.size : "base"} variant={props.variant ? props.variant : "text"} rounded={props.rounded ? props.rounded : false} onPress={selectImage} />

    if (!bMultiple) {
        let img = imagesList && imagesList.length > 0 ? imagesList[0] : null;
        if (!img && props.useUrl) {
            img = { file_url: props.value, file_type: "image/jpeg" };
        }
        let w = props.name == 'picture' ? 'w-48 h-48' : 'w-full';
        if (!props.viewClasses) {
            w += ' bg-bgrinput dark:bg-bgrinput-d border-bdrinput dark:border-bdrinput-d rounded-lg'
        }
        else {
            w += ' ' + props.viewClasses
        }

        const isImage = img?.file_type?.includes('image/');
        const isPreload = img?.preload;

        button = (
            <Pressable onPress={selectImage} >
                <View className={w + '  items-center justify-center bg-primary/5 ' + (isImage ? appSetting('cover', 'aspect_ratio') : 'h-32')}>
                    {!img && (<ViewRef ref={drop} className=' text-neutral-500/50 text-lg  flex-auto w-full border-neutral-300 dark:border-neutral-700 rounded-lg  justify-center  flex-col border border-dashed text-center'>
                        <Text className='text-neutral-500/50 text-lg  justify-center  flex-col text-center'>Drag & Drop or browse files...</Text>
                    </ViewRef>)}
                    {img != null && (<>
                        {isImage && <ImageRN
                            source={{ uri: img.uri || img.file_url }}
                            style={{ width: '100%', height: '100%', opacity: isPreload ? 0.5 : 1 }}
                            resizeMode="cover"
                            view="cover"
                            alt=""
                        />}
                        {isPreload && <View className={`w-full h-full absolute top-8`}><Loading className="absolute" /></View>}
                        <View className='absolute top-1 right-1 w-6.5 text-center mx-auto'>
                            <Button onPress={() => handleDelete(img.file_id)} variant="default" startDecorator="X" align="start" title="" rounded size="xs" />
                        </View>
                    </>)
                    }
                </View>
            </Pressable>
        );
    }
    return button;
}

function GhostsList(imagesList, bMultiple, handleDelete, props) {
    if (!imagesList || imagesList.length === 0 || props.name === 'cover' || props.name === 'picture') {
        return null;
    }

    return imagesList.map((img, index) => {
        const isImage = img?.file_type?.includes('image/');
        const isVideo = img?.file_type?.includes('video/');
        const isPreload = img?.preload;
        return (
            <View
                key={`file-${props.name}-${index}`}
                className="mb-[12px] w-[100px] h-[100px] m-[1px] justify-center items-center bg-bgritem dark:bg-bgritem-d rounded-lg overflow-hidden"
            >
                {isImage ? <ImageRN
                    source={{ uri: img.uri || img.file_url }}
                    style={{ width: 100, height: 100, opacity: isPreload ? 0.5 : 1 }}
                    resizeMode="cover"
                    view="cover"
                    alt=""
                /> : (

                    isVideo ? (
                        <Video src={img.uri || img.file_url} />
                    ) : (
                        <View className="h-16 w-16 text-neutral-700 dark:text-neutral-300 items-center justify-center"><Icon icon="File" className="w-8 h-8" size={32} /></View>
                    )

                )}

                {isPreload && <View className={`w-full h-full absolute top-8`}><Loading className="absolute" /></View>}

                <View className="absolute top-1 right-1 w-6.5 text-center mx-auto">
                    <Button
                        onPress={() => handleDelete(img.file_id)}
                        variant="default"
                        startDecorator="X"
                        align="start"
                        title=""
                        rounded
                        size="xs"
                    />
                </View>

            </View>
        );
    });
}

function ButtonCover({ imageSource, selectImage }) {
    let imagesList = imageSource.images;
    let img = imagesList && imagesList.find(item => item.preload === true)
    let isImages = imagesList && imagesList.find(item => item.preload !== true)

    return !isImages && <Button
        title="Add Cover"
        startDecorator={img?.preload ? "_loading" : "Image"}
        variant="outline"
        size="xs"
        onPress={selectImage}
    />

}
