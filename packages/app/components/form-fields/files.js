import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Field, { getValidationRules } from './_field';
import { View, Row, Pressable } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator'
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
import  { useLayoutData } from 'app/context/layout';

export default function (props) {
    const name = props.name;
    const [imageSource, setImageSource] = useState({ images: null });
    const formContext = useFormContext();
    const formValue = formContext.watch(name);
    let obfuscateFaces = formContext.watch('obfuscate_faces');
    const rules = getValidationRules(props);
    let defaultValue = props?.value ? props.value : '';
    const { layoutData, setLayoutData } = useLayoutData();
    const { field } = useController({ name, rules, defaultValue });
    const bMultiple = props.multiple;
    const [hasPermissionCamera, requestPermissionCamera] = ImagePicker.useCameraPermissions();
    const [hasPermissionLibrary, requestPermissionLibrary] = ImagePicker.useMediaLibraryPermissions();
    const url = useMemo(() => {
        return '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&obfuscate_faces=' + obfuscateFaces + '&&uo=' + props.uploaders[0] + '&so=' + props.storage_object + '&uid=' + genRnd(8) + '&img_trans=' + props.images_transcoder + '&m=' + (bMultiple ? 1 : 0) + '&c=' + props.content_id + '&p=' + (props.privacy ? 1 : 0);
    }, [props, obfuscateFaces]);



    useEffect(() => {
        const uploadImagesAsync = async (assets) => {
            const k = await uploadImages(assets);
            setImageSource({ images: k });
        };

        if (layoutData?.type == 'images:pasted' && props.asDefaultStorage){
            uploadImagesAsync(layoutData.data)
            setLayoutData(null);
        }
    }, [layoutData]);

   /* useEffect(() => {
        pickFromGallery = async () => {
            const permissions = Permissions.CAMERA_ROLL;
            const { status } = await Permissions.askAsync(permissions);
          }
        
          pickFromCamera = async () => {
            const permissions = Permissions.CAMERA;
            const { status } = await Permissions.askAsync(permissions);
          }

          pickFromGallery();
          pickFromCamera();
    }, []);*/

    const RestoreGhosts = async (data) => {

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
            filteredArr = imageSource?.images?.filter(item => item.preload === true);

        setImageSource({ images: [...a] });
    };

    useEffect(() => {
        if (props.previewPlaceHolder) {
            props.previewPlaceHolder(name, GhostsList(imageSource.images, bMultiple, handleDelete, props));
        }
    }, [imageSource]);

    useEffect(() => {
        if (formValue && field.value && !isNaN(field.value)) {
            RestoreGhosts(0);
        }
        if (!formValue) {
            setImageSource({ images: null });
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

    const uploadImages = async (asset) => {
        let k = imageSource.images ? imageSource.images : [];
        let objectsToAdd = Array(asset.length).fill({ preload: true });
        k = [
            ...k,
            ...objectsToAdd
        ];
        setImageSource({ images: k });

        for (const i of asset) {
            let uri = i.uri;
            let isImage = i?.mimeType?.includes('image/');
            if (isImage){
                ImageNative.getSize(uri, async (width, height) => {
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

                    let hash = md5(uri);
                    uploadImage(
                        uri,
                        url + '&a=upload',
                        handleInsertImageFinish,
                        { hash: hash }
                    );

                    let fileType = i.type ? i.type + '/' : uri.split(';')[0].split(':')[1];
                    k = [
                        ...k,
                        { file_url: uri, file_type: fileType, preload: true, hash: hash }
                    ];
                });
            }
            else{
                let hash = md5(uri);
                    uploadImage(
                        uri,
                        url + '&a=upload',
                        handleInsertImageFinish,
                        { hash: hash }
                    );

                    let fileType = i.type ? i.type + '/' : uri.split(';')[0].split(':')[1];
                    /*k = [
                        ...k,
                        { file_url: uri, file_type: fileType, preload: true, hash: hash }
                    ];*/
            }
        }
        return k;
    }

    const selectImage = useCallback(async () => {

        let bIsMedia = props.ext_deny == '' || props.ext_allow == 'mp3,m4a,m4b,wma,wav,3gp' ? true : false;

        if (!bIsMedia && props.ext_deny.length && !'jpg,jpeg,jpe,gif,png,svg,webp'.split(',').filter((s) => ~props.ext_deny.split(',').indexOf(s)).length)
            bIsMedia = true;

        if (Platform.OS !== 'web' && bIsMedia) {
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status === "granted"){
                Alert.alert(
                    "Upload Photo",
                    "Choose an option",
                    [
                        {
                            text: "Take Photo",
                            onPress: () => { selectImage1('camera', bIsMedia) }
                        },
                        {
                            text: "Choose from Library",
                            onPress: () => { selectImage1('library', bIsMedia) }
                        },
                        {
                            text: "Cancel",
                            style: "cancel"
                        }
                    ],
                    { cancelable: true }
                );
            }
            else{
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
    }, [props.ext_deny, props.ext_allow, imageSource, url]);


    const selectImage1 = useCallback(async (type, bIsMedia) => {
        if (bIsMedia) {

            let mediaTypes = ImagePicker.MediaTypeOptions.All;
            if (props.ext_allow.includes('jpg') && !props.ext_allow.includes('mp4'))
                mediaTypes = ImagePicker.MediaTypeOptions.Images;
            if (props.ext_allow.includes('mp4') && !props.ext_allow.includes('mp4'))
                mediaTypes = ImagePicker.MediaTypeOptions.Videos;

            let result = null

            if (type == 'library') {
                //const permissions = Permissions.CAMERA_ROLL;
                //const { status } = await Permissions.askAsync(permissions);
                
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
                //const permissions = Permissions.CAMERA;
                //const { status } = await Permissions.askAsync(permissions);
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
                console.log("result.assets", result.assets)
                let k = await uploadImages(result.assets);
                setImageSource({ images: k });
            }
        }
        else {
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*', // This allows all file types
                    multiple:true
                });
              /*   if (result.type === 'success') {
                    let k = imageSource.images;
                    let hash = crypto.createHash('sha256').update(result.uri).digest('hex');
                    uploadImage(
                        result.uri,
                        url + '&a=upload',
                        handleInsertImageFinish,
                        { hash: hash }

                    );

                    let fileType = i.type ? i.type + '/' : result.uri.split(';')[0].split(':')[1];
                    k = [...k, { file_url: result.uri, file_type: fileType, preload: true, hash: hash }];
                    setImageSource({ images: k });
                }*/
                if (!result.cancelled) {
                    let k = await uploadImages(result.assets);
                    console.log("k", k)
                    setImageSource({ images: k });
                }
            } catch (err) {
                console.error('Error picking document:', err);
            }
        }
    }, [props.ext_deny, props.ext_allow, imageSource, url]);

    const handleInsertImageFinish = useCallback(async (result, extraVar) => {
        RestoreGhosts({ hash: extraVar.hash, id: result?.data?.id });
    }, []);

    const handleDelete = useCallback(async (id) => {
        const result = await fetcher(url + "&a=delete&id=" + id);
        RestoreGhosts(0);
    }, [url]);

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
        photo: "ImageSquare",
        cmt_image: "ImageSquare",
        pictures: "ImageSquare",
        video: "MonitorPlay",
        videos: "MonitorPlay",
        files: "FilePlus",
        file: "FilePlus",
        sounds: "FileAudio"
    };

    let sIcon = iconMap[props.name] || "Plus";
    let sTitle = sIcon === "Plus" ? "Select " + props.name : "";


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
                reader.onload = (event) => {
                    uploadImages([{ uri: event.target.result }])
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

        let isImage = img?.file_type?.includes('image/');

        button = (
            <Pressable onPress={selectImage} >
                <View className={w + '  items-center justify-center bg-primary/5 ' + (isImage ? appSetting('layout', 'cover_aspect') : 'h-32')}>
                    <View ref={drop} className=' text-neutral-500/50 text-lg  flex-auto w-full border-neutral-300 dark:border-neutral-700 rounded-lg  justify-center  flex-col border border-dashed text-center'>
                        <Text className='text-neutral-500/50 text-lg  justify-center  flex-col text-center'>Drag & Drop or browse files...</Text>
                    </View>
                    {img != null && (<>
                        {isImage && <Image view='cover' sizes={LAYOUT_BREAKPOINTS.lg} className=" u-cover " alt='' src={img.file_url} />}
                        {imagesList && imagesList.find(item => item.preload === true) && <View className='absolute w-full h-full justify-center items-center z-50'><Loading /></View>}
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
    

    if (!imagesList || imagesList.length === 0 || props.name == 'cover') {//|| !bMultiple
        return;
    }
   
    //console.log("imagesList", imagesList, props)
    return imagesList.map((img, index) => {
        const isImage = img?.file_type?.includes('image/');
        const isVideo = img?.file_type?.includes('video/');
        return (
            <View key={`file-${props.name}-${index}`} className='h-40 w-40 justify-center items-center dark:bg-bgrcard-d rounded-lg mr-1 mt-1 overflow-hidden' >
                {isImage && <Image view='cover' sizes="150px" className="u-cover" alt='' src={img.file_url} />}
                {!isImage && !img?.preload && <View className='h-16 w-16  text-neutral-700 dark:text-neutral-300 items-center justify-center'>{isVideo ? <Icon icon="Video" className="w-8 h-8" size={32}  /> : <Icon  icon="File" className="w-8 h-8" size={32} />}</View>}
                {img?.preload && <View className='absolute w-full h-full justify-center items-center'><Loading /></View>}
                {img?.file_id && <View className='absolute top-1 right-1 w-6.5 text-center mx-auto'>
                    <Button onPress={() => handleDelete(img.file_id)} variant="default" startDecorator="X" align="start" title="" rounded size="xs" />
                </View>}
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
