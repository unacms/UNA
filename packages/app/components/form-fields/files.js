import { useState, useMemo, useCallback, useEffect  } from 'react';
import Field from './_field';
import { View, Row, Pressable } from 'app/design/view'
import Image from '../../ui/atoms/image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator'
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { genRnd } from '../../lib/util';
import { Platform } from 'react-native'
import * as DocumentPicker from 'expo-document-picker';
import { fetcher } from '../../lib/fetcher';
import { useFormContext } from 'react-hook-form';
import { uploadImage, md5 } from '../../lib/util';
import Loading from 'app/ui/atoms/loading'
import { Text } from 'app/design/typography'
import { Image as ImageNative } from 'react-native';

export default function FormFieldFiles(props) {

    const [imageSource, setImageSource] = useState({ images: null});
    const isWeb = Platform.OS == 'web';
    const formContext = useFormContext();
    const bMultiple = props.multiple;
    let name = props.name;

    const url = useMemo(() => {
        return '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&uo=' + props.uploaders[0] + '&so=' + props.storage_object + '&uid=' + genRnd(8) + '&img_trans=' + props.images_transcoder + '&m=' + (bMultiple ? 1 : 0) + '&c=' + props.content_id + '&p=' + (props.privacy ? 1 : 0);
    }, [props]);
  
    const RestoreGhosts = useCallback(async (data) => { 
        const result = await fetcher(url + "&a=restore_ghosts&_t=" + escape(new Date()));
        let a = [];
        let av = [];
        if (result && !!result.data[0]){
            Object.keys(result.data[0]).forEach(function (k) {
                a.push(result.data[0][k]);
                av.push(result.data[0][k].file_id)
            });
        }
        a.forEach(function (k) {
            if (k.file_id){
                if (name == 'covers'){
                    formContext.setValue('thumb', av.join(','))
                }
                formContext.setValue(name, av.join(','))
            }
        });
        let filteredArr =[]
        if (imageSource?.images)
            filteredArr = imageSource?.images?.filter(item => item.preload === true);

        setImageSource({images: [...a, ...filteredArr]});
        
    }, 
    [url, formContext, name, imageSource]);

    useEffect(() => {
        if (props.previewPlaceHolder ){
            props.previewPlaceHolder(name, GhostsList(imageSource.images));
        }
    }, 
    [imageSource]);

    useEffect(() => {
        if (!imageSource.images) {
            RestoreGhosts(0);
        }
        if (formContext.formState.isSubmitted) {
            setTimeout(() => {
                RestoreGhosts(0);
            }, 100);
        }
    }, 
    [RestoreGhosts, formContext.formState.isSubmitted, imageSource.images]);
    
    const selectImage = useCallback(async () => {
        let bIsMedia = props.ext_deny == '' || props.ext_allow == 'mp3,m4a,m4b,wma,wav,3gp' ? true : false;

        // TODO: added for case when one storage for different file types and allow to use it for media files temporary.
        if (!bIsMedia && props.ext_deny.length && !'jpg,jpeg,jpe,gif,png,svg,webp'.split(',').filter((s) => ~props.ext_deny.split(',').indexOf(s)).length)
            bIsMedia = true;

        if (bIsMedia){

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
                    let k = imageSource.images;
                    for (const i of result.assets) {
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
                
                    setImageSource({ images: k });
                }
        }
        else{
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
                        {hash: hash}

                    );
                  
                    let fileType = i.type? i.type + '/': result.uri.split(';')[0].split(':')[1];
                    k = [...k , {file_url: result.uri, file_type:fileType, preload:true, hash: hash}];
                    setImageSource({images:k});
                }
              } catch (err) {
                console.error('Error picking document:', err);
              }
        }
    }, [props.ext_deny, props.ext_allow, imageSource, url]);
    
    const handleInsertImageFinish = useCallback(async (result, extraVar) => {
        RestoreGhosts({hash: extraVar.hash, id:result?.data?.id});
    }, 
    [RestoreGhosts]);
    
    const handleDelete = useCallback(async (id) => {
        const result = await fetcher(url + "&a=delete&id=" + id);
        RestoreGhosts(0);
    }, 
    [url, RestoreGhosts]); 
    
    function GhostsList(imagesList) {

        if (!imagesList || imagesList.length == 0 || !bMultiple)
            return ;
        
            return (
            imagesList?.map((img, index) => (
                <View key={'file-' + name + '-' + index} className='h-24 w-24 justify-center items-center' >
                    { img?.file_type?.includes('image/') && <Image view='cover' sizes="96px" className="dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark border rounded-lg u-cover rounded-lg" alt=''  src={img.file_url} /> }
                    { !img?.file_type?.includes('image/') && <Icon icon="File" className="w-20 h-20" size={80} /> }
                    { img?.preload && <View className='absolute w-full h-full justify-center items-center'><Loading/></View> }
                    { img !='' && <View className='absolute top-1 right-1 w-6.5 text-center mx-auto'>
                        <Button onPress={() => handleDelete(img.file_id)} variant="primary" startDecorator="X" align="start" title="" rounded size ="xs" />
                    </View> }
                </View>
            ))
        )
    }
  
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

    function getImg(img, sizes){

    }

    function getButton(imagesList) {
        let button = <Button startDecorator={sIcon} title={sTitle} variant="outline" onPress={selectImage} />
        
        if (!bMultiple){
            let img = imagesList && imagesList.length > 0 ? imagesList[0] : null;
            let w = props.name == 'picture' ? 'w-48' : 'w-full';
            if (! props.viewClasses){
                w += ' bg-backgroundinput dark:bg-backgroundinput-dark border-bordercolorinput dark:border-bordercolorinput-dark '
            }
            else{
                w += ' ' + props.viewClasses
            }
            button = (
                <Pressable onPress={selectImage} >
                    <View className={ w + ' h-48 rounded-lg items-center justify-center border'}>
                        {img == null ? 
                            <Text className='text-neutral-500/50 text-xl text-center'>{props.caption}</Text> 
                            :( <>{ img?.preload && <View className='absolute w-full h-full justify-center items-center'><Loading/></View> }
                                { img?.file_type?.includes('image/') && <Image view='cover' sizes="(max-width:1024px) 100vw, 1024px" className="dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark border rounded-lg u-cover rounded-lg" alt=''  src={img.file_url} /> }
                                { img?.preload && <View className='absolute w-full h-full justify-center items-center'><Loading/></View> }
                                <View className='absolute top-1 right-1 w-6.5 text-center mx-auto'>
                                        <Button onPress={() => handleDelete(img.file_id)} variant="primary" startDecorator="X" align="start" title="" rounded size ="xs" />
                                </View>
                            </>)
                    }
                    </View>
                </Pressable>
            );
        }

        return button;
    }

    
    return (
        <Field {...props}>
            <View className={bMultiple ? "mr-2 mb-2" : ""} >
                {getButton(imageSource.images)}
            </View>
            {!props.previewPlaceHolder && <Row className='flex-wrap gap-2'>{GhostsList(imageSource.images)}</Row>}
        </Field>
    );
}


