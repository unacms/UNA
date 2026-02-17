import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Field, { getValidationRules } from './_field';
import { View, ViewRef, Row, Pressable } from 'app/design/view'
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'app/lib/image-manipulator'
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { genRnd, appSetting } from 'app/lib/util';
import * as DocumentPicker from 'expo-document-picker';
import { fetcher } from 'app/lib/fetcher';
import { useFormContext, useController } from 'react-hook-form';
import { uploadImage, md5 } from 'app/lib/util';
import Loading from 'app/ui/atoms/loading'
import { Text } from 'app/design/typography'
import { Image as ImageNative, Alert, Platform } from 'react-native';
import { Camera } from "expo-camera";
import { useFilesData } from 'app/context/files';
import { Image as ImageRN } from 'react-native';
import Video from 'app/ui/atoms/video';
import Msg from 'app/ui/molecules/msg';
import { useTranslation } from 'react-i18next'
import emitter from 'app/context/emitter';

export default function (props) {
    
    const name = props.name;
    const [uploadFinished, setUploadFinished] = useState(null);
    const [message, setMessage] = useState(false);
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
            if (filesData.data.form_name == props.form_name) {
                uploadImagesAsync(filesData.data.images)
                setFilesData(null);
            }
        }
    }, [filesData]);

    useEffect(() => {
        if (hasPermissionLibrary) {
            const subscription = emitter.addListener(`fld_files_${name}`, (data) => {
                if (data.action == 'add') {
                    selectImage(data.source)
                }
                if (data.action == 'clear') {
                     setImageSource({ images: [] });
                }
               
            })
            return () => {
                subscription.remove()
            }
        }
    }, [hasPermissionLibrary])

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
            if (name == 'videos') {
                formContext.setValue('video', fileIds)
            }
            field.onChange(fileIds);
        }
        else {
            field.onChange('');
        }
    }, [imageSource]);

    useEffect(() => {
        if (uploadFinished?.result) {
            if (isAutoGhosts) {
                if (uploadFinished?.result?.data?.ghost) {
                    /* const updatedImages = imageSource?.images?.map(item =>
                         item.hash === uploadFinished.extraVar.hash ? { ...uploadFinished?.result.data.ghost, uri: item.uri } : item
                     );*/
                    setImageSourceN([{ ...uploadFinished?.result.data.ghost, hash: uploadFinished.extraVar.hash }], bMultiple);
                }
                else {

                    /*  const updatedImages = imageSource?.images.filter(item => item.hash != uploadFinished.extraVar.hash);
                        console.log("setImageSource3")
                      setImageSource({ images: updatedImages });*/
                }

            }
            else {
                setUploadFinishedArr((prevArr) => [...prevArr, uploadFinished.extraVar.hash]);
            }

        }
    }, [uploadFinished]);

    const setImageSourceN = (newImages, bMultiple) => {
        if (!bMultiple){
                setImageSource({
                    images: newImages
                }
            );
            return;
        }
        setImageSource(prev => {
            const existingImages = prev?.images || [];

            // Создаём Map из новых изображений по hash
            const newImagesMap = new Map(newImages.map(img => [img.hash, img]));

            // Заменяем или сохраняем старые изображения
            const mergedImages = existingImages.map(img =>
                newImagesMap.has(img.hash) ? newImagesMap.get(img.hash) : img
            );

            // Добавляем только те newImages, которых ещё нет в existingImages
            const existingHashes = new Set(existingImages.map(img => img.hash));
            const newOnlyImages = newImages.filter(img => !existingHashes.has(img.hash));

            return {
                ...prev,
                images: [...mergedImages, ...newOnlyImages]
            };
        });
    }


    const uploadImages = async (asset) => {
        let k = imageSource.images ? imageSource.images : [];
        if (!asset)
            return
        let objectsToAdd = [];

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
                        console.log("width", width)
                        if (width > height) {
                            manipulatedHeight = Math.round((height * manipulatedWidth) / width);
                        } else {
                            manipulatedWidth = Math.round((width * manipulatedHeight) / height);
                        }

                        if (manipulateAsync) {
                            const resizedPhoto = await manipulateAsync(
                                uri,
                                [{ resize: { width: manipulatedWidth, height: manipulatedHeight } }], // Изменение ширины до 800 пикселей; высота будет рассчитана автоматически
                                { compress: 0.4, format: SaveFormat.JPEG }
                            );
                            uri = resizedPhoto.uri;
                        }
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

    const selectImage = useCallback(async (source) => {
        let bIsMedia = props.ext_deny == '' || props.ext_allow == 'mp3,m4a,m4b,wma,wav,3gp' ? true : false;
        if (!bIsMedia && props.ext_deny.length && !'jpg,jpeg,jpe,gif,png,svg,webp'.split(',').filter((s) => ~props.ext_deny.split(',').indexOf(s)).length)
            bIsMedia = true;

        if (Platform.OS !== 'web' && bIsMedia) {
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status === "granted") {
                selectImage1(source, bIsMedia)
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

            if (!result.canceled) {

                const goodAssets = result.assets.filter(
                    asset => !asset.uri.startsWith('data:application/octet-stream')
                );
                if (goodAssets.length !== result.assets.length) {
                    setMessage('Some files are not supported.');
                }
                let k = await uploadImages(goodAssets);
                setImageSourceN(k, bMultiple);
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
        setImageSource(prev => ({
            ...prev,
            images: prev.images.filter(item => item.file_id !== id)
        }));

        await fetcher(url + "&a=delete&id=" + id);
    }, [url, imageSource]);

    const handleDeleteSingle = useCallback(async (id) => {
        setImageSource(prev => ({
            ...prev,
            images: prev.images.filter(item => item.file_id !== id)
        }));

        
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
    if (props.list_only){
        return GhostsList(imageSource.images, bMultiple, handleDelete, props);
    }
    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Msg onVisible={message} title={message} handleOk={() => { setMessage(false) }} />
            {!props.hide_button && <View>
                <ActionButton uploadImages={uploadImages} imagesList={imageSource.images} props={props} bMultiple={bMultiple} selectImage={selectImage} handleDelete={handleDeleteSingle} />
            </View>}
            {!props.previewPlaceHolder && <Row className='flex-wrap '>{GhostsList(imageSource.images, bMultiple, handleDelete, props)}</Row>}
        </Field>
    );
}

function ActionButton({ imagesList, props, selectImage, handleDelete, bMultiple, uploadImages }) {
    const { t } = useTranslation()
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
    let sTitle = sIcon === "Plus" ? t("Select " + props.name) : "";
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
                    setImageSource({ images: k });
                };
                reader.readAsDataURL(files[0]);
            }
        }
    };
    let button = <Button startDecorator={props.icon ? props.icon : sIcon} tooltip={t("Add " + props.name)} title={props.title ? props.title : sTitle} size={props.size ? props.size : "base"} variant={props.variant ? props.variant : "text"} rounded={props.rounded ? props.rounded : false} onPress={selectImage} />

    if (!bMultiple) {
        let img = imagesList && imagesList.length > 0 ? imagesList[0] : null;
        if (!img && props.useUrl) {
            img = { file_url: props.value, file_type: "image/jpeg" };
        }
        let w = props.name == 'picture' ? 'w-48 h-48 overflow-hidden' : 'w-48 ' + appSetting('cover', 'aspect_ratio');
        if (!props.viewClasses) {
            w += ' bg-input border-border rounded-xl overflow-hidden'
        }
        else {
            w += ' ' + props.viewClasses
        }

        const isImage = img?.file_type?.includes('image/');
        const isPreload = img?.preload;

        button = (
            <Pressable onPress={selectImage} >
                <View className={w + ' max-w-full items-center justify-center bg-input ' + (isImage ? '' : 'h-32')}>
                    {!img && (<View ref={drop} className=' text-muted-foreground/50 text-lg  flex-auto w-full border-border rounded-lg  justify-center  flex-col border border-dashed text-center'>
                        <Text className='text-muted-foreground/50 text-lg  justify-center  flex-col text-center'>Drag & Drop or browse files...</Text>
                    </View>)}
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

    const isCover = props.preview === "cover";

    const sizes = [
        isCover ? "w-full h-[30vh] mb-4 sm:rounded-xl" : "w-25 h-25 mb-3 rounded-lg",
        "m-px justify-center items-center overflow-hidden bg-muted  ",
    ].join(" ");

    const sizes2 = isCover ? '100%' : 100;

    return imagesList.map((img, index) => {
        const isImage = img?.file_type?.includes('image/');
        const isVideo = img?.file_type?.includes('video/');
        const isPreload = img?.preload;
        return (
            <View
                key={`file-${props.name}-${index}`}
                className={`${sizes}`}
            >
                {isImage ? <ImageRN
                    source={{ uri: img.uri || img.file_url }}
                    style={{ width: sizes2, height: sizes2, opacity: isPreload ? 0.5 : 1 }}
                    resizeMode="cover"
                    view="cover"
                    alt=""
                /> : (

                    isVideo ? (
                        <Video src={img.uri || img.file_url} />
                    ) : (
                        <View className="h-16 w-16 text-muted  items-center justify-center"><Icon icon="File" className="w-9 h-9" size={36} /></View>
                    )

                )}

                {isPreload && <View className={`w-full h-full absolute top-8`}><Loading className="absolute" /></View>}

                <View className="absolute top-1 right-1 w-6.5 text-center mx-auto">
                    <Button
                        onPress={() => handleDelete(img.file_id)}
                        variant="default"
                        startDecorator="X"
                        align="center"
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
