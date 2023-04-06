import { useState } from 'react';
import Field from './_field';
import { View, Row } from 'app/design/view'
import Image from '../../ui/atoms/image';
import * as ImagePicker from 'expo-image-picker';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { genRnd } from '../../lib/util';
import { Platform } from 'react-native'
import * as DocumentPicker from 'expo-document-picker';
import { fetcher } from '../../lib/fetcher';
import { useController, useFormContext } from 'react-hook-form';

export default function FormFieldFiles(props) {
    
    const [imageSource, setImageSource] = useState(null);
    const isWeb = Platform.OS == 'web'
    const formContext = useFormContext();

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const [value, setValue] = useState(defaultValue)
    const { field } = useController({ name, rules, defaultValue });
    const url = '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&uo=' + props.uploaders[0] + '&so=' + props.storage_object + '&uid=' + genRnd(8) + '&img_trans=' + props.images_transcoder + '&m=' + (props.multiple ? 1 : 0) + '&c=' + props.content_id + '&p=' + (props.privacy ? 1 : 0);

    const  isComments = (props.name == 'cmt_image');

    const RestoreGhosts =  async () => { 
        const result = await fetcher(url + "&a=restore_ghosts&_t=" + escape(new Date()));
        let a = [];
        if (!!result.data[0]){
            Object.keys(result.data[0]).forEach(function (k) {
                a.push(result.data[0][k]);
            });
        }
        a.forEach(function (k) {
            setTimeout(() => {
                formContext.setValue(name, k.file_id)
            }, 100);
        });
        setImageSource(a);
    }

    
    if (!imageSource || formContext.formState.isSubmitted){
       
        RestoreGhosts();
    }

    const selectImage = async () => {
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
                allowsMultipleSelection: true,
            });

            if (!result.canceled) {
                result.assets.forEach(function (i) {
                    uploadImage(i.uri);
                });
            }
        }
        else{
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*', // This allows all file types
                });
                if (result.type === 'success') {
                  uploadImage(result.uri);
                  
                }
              } catch (err) {
                console.error('Error picking document:', err);
              }
        }
    };

    function GhostsList(props) {
        let atts = null;
        if (props.src){
            return (
                props.src.map((img, index) => (
                    <View className='mr-2 mb-2 h-24 w-24' >
                        { img.file_type.includes('image/') && <Image view='cover' alt='cx' src={img.file_url} /> }
                        { !img.file_type.includes('image/') && <Icon icon="File" className="w-16 h-16" size={64} /> }
                        <View className='absolute bottom-1 left-4 w-10 text-center mx-auto'>
                            <Button  onPress={() => handleDelete(img.file_id)} startDecorator="trash" align="start"  size ="xs" />
                        </View>
                    </View>
                ))
            )
        }
        return <></>;
    }

    function urltoFile(url, filename, mimeType){
        return (fetch(url)
            .then(function(res){return res.arrayBuffer();})
            .then(function(buf){return new File([buf], filename,{type:mimeType});})
        );
    }
  
    const uploadImage = async (uri) => {
        const formData = new FormData();
        if (isWeb){
            const fileExt = uri.split(';').shift().split('/').pop();
            const fileType = uri.split(';').shift().split(':').pop();
            urltoFile(uri, genRnd(8) + '.' + fileExt, fileType)
            .then(async function(file){
                formData.append("file", file);
                const result = await fetcher([url + '&a=upload', null, formData]);
                RestoreGhosts();
            });
        }
        else{
            const formData = new FormData();
            const fileName = uri.split('/').pop();
            const fileType = uri.match(/\.([a-z]+)$/i)[1];

            formData.append("file",  {
                uri,
                name: fileName,
                type: `image/${fileType}`,
              });
            
            const result = await fetcher([url + '&a=upload', null, formData]);
            RestoreGhosts();
        }
    };

    const handleDelete = async (id) => {
        const result = await fetcher(url + "&a=delete&id=" + id);
        RestoreGhosts();
    } 

    let button = <Button startDecorator={ isComments ? "image" : "plus"} title={ isComments ? "" : "Select " + props.name} onPress={selectImage} />

    return (
        <Field {...props}>
            { !isComments && <View className="mr-2 mb-2" >
                {button}
            </View>
            }
                <Row className='mt-2 flex-wrap'>
                    { isComments && <View className="mr-2 " >{button}</View> }
                    <GhostsList src={imageSource}/>
                </Row>
        </Field>
       
    );
}


