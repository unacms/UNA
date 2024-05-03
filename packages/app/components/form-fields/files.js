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
import { uploadImage, md5 } from 'app/lib/util';
import Loading from 'app/ui/atoms/loading'
import { Text } from 'app/design/typography'
import { Image as ImageNative } from 'react-native';

export default function (props) {
    const name = props.name;
    const [imageSource, setImageSource] = useState({ images: null });
    const formContext = useFormContext();
    const formValue = formContext.watch(name);
    let obfuscateFaces = formContext.watch('obfuscate_faces');
    const rules = getValidationRules(props);
    let defaultValue = props?.value ? props.value : '';
    const { field } = useController({ name, rules, defaultValue });
    const bMultiple = props.multiple;

    const url = useMemo(() => {
        return '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&obfuscate_faces='+obfuscateFaces+'&&uo=' + props.uploaders[0] + '&so=' + props.storage_object + '&uid=' + genRnd(8) + '&img_trans=' + props.images_transcoder + '&m=' + (bMultiple ? 1 : 0) + '&c=' + props.content_id + '&p=' + (props.privacy ? 1 : 0);
    }, [props, obfuscateFaces]);

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
                field.onChange(val);
            }
        });
        if (a.length == 0 && field.value != '')
            field.onChange('');

        let filteredArr = []
        if (imageSource?.images)
            filteredArr = imageSource?.images?.filter(item => item.preload === true);

        setImageSource({ images: [...a, ...filteredArr] });

    };

    useEffect(() => {
        if (props.previewPlaceHolder) {
            props.previewPlaceHolder(name, GhostsList(imageSource.images, bMultiple, handleDelete));
        }
    }, [imageSource]);

    useEffect(() => {
        if (formValue && field.value) {
            RestoreGhosts(0);
        }
        if (!formValue)
        {
            setImageSource({ images: null });
        }
    }, [formValue]);

    useEffect(() => {
        if (!imageSource.images) {
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
        return k;
    }

    const selectImage = useCallback(async () => {
        let bIsMedia = props.ext_deny == '' || props.ext_allow == 'mp3,m4a,m4b,wma,wav,3gp' ? true : false;

        if (!bIsMedia && props.ext_deny.length && !'jpg,jpeg,jpe,gif,png,svg,webp'.split(',').filter((s) => ~props.ext_deny.split(',').indexOf(s)).length)
            bIsMedia = true;

        if (bIsMedia) {

            let mediaTypes = ImagePicker.MediaTypeOptions.All;
            if (props.ext_allow == 'jpg,jpeg,jpe,gif,png,svg,webp' || props.ext_allow == 'jpg,jpeg,jpe,gif,png,webp')
                mediaTypes = ImagePicker.MediaTypeOptions.Images;
            if (props.ext_allow == 'avi,flv,mpg,mpeg,wmv,mp4,m4v,mov,qt,divx,xvid,3gp,3g2,webm,mkv,ogv,ogg,rm,rmvb,asf,drc,ts')
                mediaTypes = ImagePicker.MediaTypeOptions.Videos;

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaTypes,
                quality: 1,
                allowsMultipleSelection: bMultiple,
            });

            if (!result.cancelled) {
                let k = await uploadImages(result.assets);
                setImageSource({ images: k });
            }
        }
        else {
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*', // This allows all file types
                });
                if (result.type === 'success') {
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
            {!props.previewPlaceHolder && <Row className='flex-wrap '>{GhostsList(imageSource.images, bMultiple, handleDelete)}</Row>}
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
        if (drop.current) {
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
    let button = <Button startDecorator={props.icon ? props.icon : sIcon} title={props.title ? props.title : sTitle} size={props.size ? props.size : "base"} variant={props.variant ? props.variant : "text"} onPress={selectImage} />

        if (!bMultiple) {
            let img = imagesList && imagesList.length > 0 ? imagesList[0] : null;
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
                            { isImage && <Image view='cover' sizes="(max-width:1024px) 100vw, 1024px" className=" u-cover " alt='' src={img.file_url} />}
                            { imagesList.find(item => item.preload === true) && <View className='absolute w-full h-full justify-center items-center z-50'><Loading /></View>}
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

function GhostsList(imagesList, bMultiple, handleDelete) {

    if (!imagesList || imagesList.length === 0 || !bMultiple) {
        return;
    }

    return imagesList.map((img, index) => {
        const isImage = img?.file_type?.includes('image/');

        return (
            <View key={`file-${name}-${index}`} className='h-24 w-24 justify-center items-center dark:bg-bgrcard-d border-bdr dark:border-bdr-d border rounded-lg m-1 overflow-hidden' >
                {isImage && <Image view='cover' sizes="96px" className="u-cover" alt='' src={img.file_url} />}
                {!isImage && !img?.preload && <Icon icon="File" className="w-20 h-20" size={80} />}
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
            size="sm"
            onPress={selectImage}
        />
 
}
