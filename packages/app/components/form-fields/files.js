import { useState, useMemo, useCallback, useEffect  } from 'react';
import Field from './_field';
import { View, Row, Pressable } from 'app/design/view'
import Image from '../../ui/atoms/image';
import * as ImagePicker from 'expo-image-picker';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { genRnd } from '../../lib/util';
import { Platform } from 'react-native'
import * as DocumentPicker from 'expo-document-picker';
import { fetcher } from '../../lib/fetcher';
import { useController, useFormContext } from 'react-hook-form';
import { uploadImage } from '../../lib/util';
import { stringMd5 } from 'react-native-quick-md5';
import Loading from 'app/ui/atoms/loading'
import { Text } from 'app/design/typography'

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
            if (k.file_id)
                formContext.setValue(name, av.join(','))
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
            RestoreGhosts(0);
        }
    }, 
    [RestoreGhosts, formContext.formState.isSubmitted, imageSource.images]);
    
    const selectImage = useCallback(async () => {
        let bIsMedia = props.ext_deny == '' || props.ext_allow == 'mp3,m4a,m4b,wma,wav,3gp'? true : false;

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

            if (!result.canceled) {
                let k = imageSource.images;
                result.assets.forEach(function (i) {
                    let hash = stringMd5(i.uri);
                    uploadImage(
                        i.uri, 
                        url + '&a=upload', 
                        handleInsertImageFinish,
                        {hash: hash}
                    );
                    let fileType = i.uri.split(';')[0].split(':')[1];
                    k = [...k , {file_url: i.uri, file_type:fileType, preload:true, hash: hash}]
                });
                
                setImageSource({images:k});
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
                    let fileType = result.uri.split(';')[0].split(':')[1];
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
                    { img !='' && <View className='absolute top-1 right-0 w-8 text-center mx-auto'>
                        <Button onPress={() => handleDelete(img.file_id)} startDecorator="X" align="start" title="" rounded size ="xs" />
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
        let button = <Button startDecorator={sIcon} title={sTitle} variant="text" onPress={selectImage} />
        
        if (!bMultiple){
            let img = imagesList && imagesList.length > 0 ? imagesList[0] : null;

            button = (
                <Pressable onPress={selectImage} >
                    <View className='w-full h-48 bg-red-500 rounded-lg items-center justify-center'>
                        {img == null ? 
                        <Text>For styling (Andrew)</Text> : 
                        <> { img?.preload && <View className='absolute w-full h-full justify-center items-center'><Loading/></View> }
                           { img?.file_type?.includes('image/') && <Image view='cover'  className="dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark border rounded-lg u-cover rounded-lg" alt=''  src={img.file_url} /> }
                           { img?.preload && <View className='absolute w-full h-full justify-center items-center'><Loading/></View> }
                           <View className='absolute top-1 right-0 w-8 text-center mx-auto'>
                                <Button onPress={() => handleDelete(img.file_id)} startDecorator="X" align="start" title="" rounded size ="xs" />
                           </View>
                    </>}
                    </View>
                </Pressable>
            );
        }

        return button;
    }

    
    return (
        <Field {...props}>
            <View className="mr-2 mb-2" >
                {getButton(imageSource.images)}
            </View>
            {!props.previewPlaceHolder && <Row className='flex-wrap gap-2'>{GhostsList(imageSource.images)}</Row>}
        </Field>
    );
}


