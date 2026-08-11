import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Field, { getValidationRules } from './_field';
import { View, ViewRef, Row, Pressable } from 'app/design/view'
import * as ImagePicker from 'expo-image-picker';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { genRnd, appSetting, prepareImageForUpload } from 'app/lib/util';
import * as DocumentPicker from 'expo-document-picker';
import { fetcher } from 'app/lib/fetcher';
import { useFormContext, useController } from 'react-hook-form';
import { uploadImage, md5 } from 'app/lib/util';
import Loading from 'app/ui/atoms/loading'
import { Text } from 'app/design/typography'
import { Image as ImageNative, Alert, Linking, Platform } from 'react-native';
import { useFilesData } from 'app/context/files';
import { Image as ImageRN } from 'react-native';
import Video from 'app/ui/atoms/video';
import Msg from 'app/ui/molecules/msg';
import { useTranslation } from 'react-i18next'
import emitter from 'app/context/emitter';
import { CaptionForFileInput } from 'app/customization/functions';
import i18n from 'i18next';
import { useFormInstanceId } from 'app/context/form-instance';
import { trackFormUploadStart, trackFormUploadEnd } from 'app/lib/form-helpers';

function showPermissionAlert(type, canAskAgain) {
    const isCamera = type === 'camera';
    const title = isCamera ? i18n.t('media_permission_camera_title') : i18n.t('media_permission_library_title');
    const message = canAskAgain === false
        ? i18n.t('media_permission_denied')
        : i18n.t('media_permission_required');

    const buttons = [{ text: i18n.t('Cancel'), style: 'cancel' }];

    if (canAskAgain === false || Platform.OS === 'ios') {
        buttons.push({
            text: i18n.t('Open Settings'),
            onPress: () => Linking.openSettings(),
        });
    }

    Alert.alert(title, message, buttons, { cancelable: true });
}

function resolvePickerSource(source, fallback = 'library') {
    if (source === 'camera' || source === 'library') {
        return source;
    }
    return fallback;
}

function isMediaField(extDeny, extAllow) {
    if (extDeny === '' || extAllow === 'mp3,m4a,m4b,wma,wav,3gp') {
        return true;
    }
    if (extDeny?.length && !'jpg,jpeg,jpe,gif,png,svg,webp'.split(',').some((s) => extDeny.split(',').includes(s))) {
        return true;
    }
    return false;
}

function resolveNativeMediaTypes(mediaTypes) {
    const hasImages = mediaTypes.includes('images');
    const hasVideos = mediaTypes.includes('videos');

    if (hasImages && hasVideos) {
        return ImagePicker.MediaTypeOptions.All;
    }
    if (hasVideos) {
        return ImagePicker.MediaTypeOptions.Videos;
    }
    return ImagePicker.MediaTypeOptions.Images;
}

function getImagePickerOptions(mediaTypes, bMultiple) {
    const options = {
        mediaTypes: Platform.OS === 'web' ? mediaTypes : resolveNativeMediaTypes(mediaTypes),
        quality: 1,
        allowsMultipleSelection: Boolean(bMultiple),
    };

    if (Platform.OS === 'ios') {
        options.UIImagePickerPreferredAssetRepresentationMode = 'current';
    }

    return options;
}

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
    const formInstanceId = useFormInstanceId();
    const formName = props.form_name;

    const url = useMemo(() => {
        return '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&obfuscate_faces=' + obfuscateFaces + '&uo=' + (props.uploaders?.[0] ?? '') + '&so=' + props.storage_object + '&uid=' + genRnd(8) + '&img_trans=' + props.images_transcoder + '&m=' + (bMultiple ? 1 : 0) + '&c=' + props.content_id + '&p=' + (props.privacy ? 1 : 0);
    }, [props, obfuscateFaces]);

    const onUploadFinished = useCallback((payload) => {
        const hash = payload?.extraVar?.hash;
        if (hash != null && hash !== '') {
            trackFormUploadEnd(formName, formInstanceId, hash);
        }
        setUploadFinished(payload);
    }, [formName, formInstanceId]);


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

    const isInitialFilesSync = useRef(true);
    useEffect(() => {
        if (props.previewPlaceHolder) {
            props.previewPlaceHolder(name, GhostsList(imageSource.images, bMultiple, handleDelete, props));
        }
        // The mount-time sync of pre-existing files (values_src) must not mark the
        // form dirty: re-baseline the field instead of firing onChange.
        const syncFieldValue = (nextValue) => {
            if (isInitialFilesSync.current) {
                isInitialFilesSync.current = false;
                formContext.resetField(name, { defaultValue: nextValue });
                return;
            }
            field.onChange(nextValue);
        };
        if (imageSource.images) {
            const fileIds = imageSource.images
                .filter(item => item.file_id !== undefined) // Keep only items with file_id
                .map(item => item.file_id) // Extract file_id
                .join(',');
            if (name == 'covers') {
                formContext.setValue('thumb', fileIds)
            }
            if (name == 'videos') {
                formContext.setValue('video', fileIds)
            }
            syncFieldValue(fileIds);
        }
        else {
            syncFieldValue('');
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

    const getImageMergeKey = (img) => {
        // Preload items use hash; server ghosts often have no hash — use stable ids.
        // Never key on undefined: Map would collapse all existing files into one.
        if (img?.hash != null && img.hash !== '') return `hash:${img.hash}`;
        if (img?.file_id != null && img.file_id !== '') return `id:${img.file_id}`;
        if (img?.file_remote_id) return `remote:${img.file_remote_id}`;
        return null;
    };

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

            const newImagesMap = new Map();
            for (const img of newImages) {
                const key = getImageMergeKey(img);
                if (key != null) newImagesMap.set(key, img);
            }

            // Replace preload (by hash) or keep existing; never match on missing keys
            const mergedImages = existingImages.map((img) => {
                const key = getImageMergeKey(img);
                return key != null && newImagesMap.has(key) ? newImagesMap.get(key) : img;
            });

            const existingKeys = new Set(
                existingImages.map(getImageMergeKey).filter((k) => k != null)
            );
            const newOnlyImages = newImages.filter((img) => {
                const key = getImageMergeKey(img);
                return key == null || !existingKeys.has(key);
            });

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
            trackFormUploadStart(formName, formInstanceId, hash);

            const isImage = i?.mimeType?.includes('image/');
            if (isImage) {
                ImageNative.getSize(uri, async (width, height) => {
                    try {
                        uri = await prepareImageForUpload({
                            uri,
                            width,
                            height,
                            fileSizeBytes: i?.fileSize,
                            maxWidth: 2000,
                            maxHeight: 2000,
                            webpOverMb: 4,
                        });

                        await uploadImage(
                            uri,
                            url + '&a=upload',
                            onUploadFinished,
                            { hash: hash }
                        );
                    } catch (err) {
                        console.error('[files] upload failed:', err);
                        trackFormUploadEnd(formName, formInstanceId, hash);
                    }

                    let fileType = i.type ? i.type + '/' : uri.split(';')[0].split(':')[1];
                    k = [
                        ...k,
                        { file_url: uri, file_type: fileType, preload: true, hash: hash }
                    ];
                }, () => {
                    trackFormUploadEnd(formName, formInstanceId, hash);
                });
            }
            else {
                try {
                    await uploadImage(
                        uri,
                        url + '&a=upload',
                        onUploadFinished,
                        { hash: hash }
                    );
                } catch (err) {
                    console.error('[files] upload failed:', err);
                    trackFormUploadEnd(formName, formInstanceId, hash);
                }

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

    const selectImage1 = useCallback(async (type, bIsMedia) => {
        const extAllow = props.ext_allow ?? '';

        if (bIsMedia) {
            let mediaTypes = ['images', 'videos'];
            if (extAllow.includes('jpg') && !extAllow.includes('mp4')) {
                mediaTypes = ['images'];
            } else if (extAllow.includes('mp4') && !extAllow.includes('jpg')) {
                mediaTypes = ['videos'];
            }

            let result = null;

            if (type != 'camera') {
                if (!hasPermissionLibrary?.granted) {
                    const permission = await requestPermissionLibrary();
                    if (!permission?.granted) {
                        showPermissionAlert('library', permission?.canAskAgain);
                        return;
                    }
                }

                result = await ImagePicker.launchImageLibraryAsync(
                    getImagePickerOptions(mediaTypes, bMultiple)
                );
            } else {
                if (!hasPermissionCamera?.granted) {
                    const permission = await requestPermissionCamera();
                    if (!permission?.granted) {
                        showPermissionAlert('camera', permission?.canAskAgain);
                        return;
                    }
                }

                result = await ImagePicker.launchCameraAsync(
                    getImagePickerOptions(mediaTypes, bMultiple)
                );
            }

            if (!result?.canceled && result?.assets?.length) {
                const goodAssets = result.assets.filter(
                    asset => !asset.uri.startsWith('data:application/octet-stream')
                );
                if (goodAssets.length !== result.assets.length) {
                    setMessage('Some files are not supported.');
                }
                let k = await uploadImages(goodAssets);
                setImageSourceN(k, bMultiple);
            }
        } else {
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*',
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
    }, [props.ext_allow, bMultiple, hasPermissionCamera, hasPermissionLibrary, requestPermissionCamera, requestPermissionLibrary]);

    const selectImage = useCallback(async (source) => {
        try {
            const extAllow = props.ext_allow ?? '';
            const extDeny = props.ext_deny ?? '';
            const type = resolvePickerSource(source, props.source ?? 'library');
            const bIsMedia = isMediaField(extDeny, extAllow) || type === 'library' || type === 'camera';

            if (Platform.OS === 'web' || !bIsMedia) {
                await selectImage1(type, bIsMedia);
                return;
            }

            if (type === 'camera') {
                if (typeof requestPermissionCamera !== 'function') {
                    throw new Error('requestPermissionCamera is not available');
                }
                const permission = hasPermissionCamera?.granted
                    ? hasPermissionCamera
                    : await requestPermissionCamera();
                if (permission?.granted) {
                    await selectImage1('camera', bIsMedia);
                } else {
                    showPermissionAlert('camera', permission?.canAskAgain);
                }
                return;
            }

            if (typeof requestPermissionLibrary !== 'function') {
                throw new Error('requestPermissionLibrary is not available');
            }
            const permission = hasPermissionLibrary?.granted
                ? hasPermissionLibrary
                : await requestPermissionLibrary();
            if (permission?.granted) {
                await selectImage1('library', bIsMedia);
            } else {
                showPermissionAlert('library', permission?.canAskAgain);
            }
        } catch (err) {
            console.error('[files] selectImage failed:', err);
            Alert.alert(i18n.t('Upload error'), err?.message ?? i18n.t('Could not open media picker.'));
        }
    }, [name, props.ext_deny, props.ext_allow, props.source, hasPermissionCamera, hasPermissionLibrary, requestPermissionCamera, requestPermissionLibrary, selectImage1]);

    useEffect(() => {
        const subscription = emitter.addListener(`fld_files_${name}`, (data) => {
            if (data.action == 'add') {
                selectImage(data.source);
            }
            if (data.action == 'clear') {
                setImageSource({ images: [] });
            }
        });
        return () => {
            subscription.remove();
        };
    }, [name, selectImage]);

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
            {!!props.hide_button && <Row className='flex-wrap gap-1'>{GhostsList(imageSource.images, bMultiple, handleDelete, props)}</Row>}
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
    let button = <Button startDecorator={props.icon ? props.icon : sIcon} tooltip={t("Add " + props.name)} title={props.title ? props.title : sTitle} size={props.size ? props.size : "base"} variant={props.variant ? props.variant : "text"} rounded={props.rounded ? props.rounded : false} onPress={() => selectImage(props.source ?? 'library')} />

    if (!bMultiple || props.useSingle) {
        let img = imagesList && imagesList.length > 0 ? imagesList[0] : null;
        if (!img && props.useUrl) {
            img = { file_url: props.value, file_type: "image/jpeg" };
        }
        let w = 'web:w-full ' + appSetting('cover', 'aspect_ratio');

        if (props.name == 'picture')
            w = 'w-48 h-48 overflow-hidden';
        if (props.name == 'badge')
            w = 'w-18 h-18 overflow-hidden';

        if (!props.viewClasses) {
            w += ' bg-input border-border rounded-xl overflow-hidden'
        }
        else {
            w += ' ' + props.viewClasses
        }

        const isImage = img?.file_type?.includes('image/');
        const isPreload = img?.preload;

        button = (
            <Pressable onPress={() => selectImage(props.source ?? 'library')} >
                <View className={w + ' native:max-w-full items-center justify-center bg-input ' + (isImage ? '' : '')}>
                      {(!img || !img?.file_url) && (<View ref={drop} className=' text-muted-foreground/50 text-lg  flex-auto w-full border-border rounded-lg  justify-center  flex-col border border-dashed text-center'>
                        <Text className='text-muted-foreground/50 text-lg justify-center flex-col text-center'>
                            {props?.placeholder || CaptionForFileInput(props)}
                        </Text>
                    </View>)}
                    {img != null && (<>
                        {(isImage && (img.uri || img.file_url)) && <ImageRN
                            source={{ uri: img.uri || img.file_url }}
                            style={{ width: '100%', height: '100%', opacity: isPreload ? 0.5 : 1 }}
                            resizeMode="cover"
                            view="cover"
                            alt=""
                        />}
                        {isPreload && <View className={`w-full h-full absolute top-8`}><Loading className="absolute" /></View>}
                        <View className='absolute top-1 right-1 w-7 h-7 text-center mx-auto'>
                            <Button onPress={() => handleDelete(img.file_id)} variant="default" startDecorator="X" title="" rounded size="xs" />
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
        isCover ? "w-full h-[30vh] mb-4 sm:rounded-xl" : "w-20 h-20 mt-2 mr-2 rounded-lg",
        " justify-center items-center overflow-hidden bg-muted  ",
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
                        <View className="h-16 w-16 text-muted-foreground  items-center justify-center"><Icon icon="File" className="w-9 h-9" size={36} /></View>
                    )

                )}

                {isPreload && <View className={`w-full h-full absolute top-8`}><Loading className="absolute" /></View>}

                <View className="absolute top-1 right-1 w-7 h-7 text-center mx-auto">
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
    const { t } = useTranslation();
    let imagesList = imageSource.images;
    let img = imagesList && imagesList.find(item => item.preload === true)
    let isImages = imagesList && imagesList.find(item => item.preload !== true)

    return !isImages && <Button
        title={t('Add Cover')}
        startDecorator={img?.preload ? "_loading" : "Image"}
        variant="outline"
        size="xs"
        onPress={() => selectImage('library')}
    />
}
