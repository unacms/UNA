import { useState, useContext } from 'react';
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
import { uploadImage } from '../../lib/util';
import { FormContext} from 'app/context/form';

export default function FormFieldFiles(props) {
    
    const { formContextData, setFormContextData } = useContext(FormContext);

    const [imageSource, setImageSource] = useState({images:null, preload:0});
    const isWeb = Platform.OS == 'web'
    const formContext = useFormContext();

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const [value, setValue] = useState(defaultValue)

    const { field } = useController({ name, rules, defaultValue });

    const url = '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&uo=' + props.uploaders[0] + '&so=' + props.storage_object + '&uid=' + genRnd(8) + '&img_trans=' + props.images_transcoder + '&m=' + (props.multiple ? 1 : 0) + '&c=' + props.content_id + '&p=' + (props.privacy ? 1 : 0);

    const RestoreGhosts =  async (inc) => { 
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
            setTimeout(() => {
                if (k.file_id)
                    formContext.setValue(name, av.join(','))
            }, 100);
        });

        setImageSource({images:a, preload:imageSource.preload});
    }

    
    if (!imageSource.images){
        RestoreGhosts(0);
    }

    if(formContext.formState.isSubmitted){
        setTimeout(() => {
            RestoreGhosts(0);
        }, 500);
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
                let b = imageSource.preload;
                result.assets.forEach(function (i) {
                    b = b + 1;
                    uploadImage(
                        i.uri, 
                        url + '&a=upload', 
                        handleInsertImageFinish
                    );
                });
                setImageSource({images:imageSource.images, preload:b});
            }
        }
        else{
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*', // This allows all file types
                });
                if (result.type === 'success') {
                    uploadImage(
                        result.uri, 
                        url + '&a=upload', 
                        handleInsertImageFinish
                    );
                }
              } catch (err) {
                console.error('Error picking document:', err);
              }
        }
    };

   // console.log(11111111, 5555)

    if (formContextData?.action === 'open_files'){
        selectImage();
        setFormContextData({action:'', data:formContextData?.data});
    }
    

    function PrevList() {
        const elements = [];
        for (let i = 1; i <= imageSource.preload; i++) {
            elements.push(
                <View key={'preload-'+i} className="mr-2 mb-2 bg-neocard dark:bg-neocard-dark border border-neoborder dark:border-neoborder-dark sm:rounded-lg animate-pulse rounded-lg h-20 w-20 items-center justify-center"><Icon icon="CloudArrowUp" className="w-8 h-8" size={32} /></View>
            );
        }
        return elements;
    }

    function GhostsList() {
        return (
            imageSource.images?.map((img, index) => (
                <View key={'file-'+index} className='h-20 w-20 mr-2' >
                    { img?.file_type?.includes('image/') && <Image view='cover' className="dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark border rounded-lg u-cover rounded-lg" alt=''  src={img.file_url} /> }
                    { !img?.file_type?.includes('image/') && <Icon icon="File" className="w-20 h-20" size={80} /> }
                    { img =='' && <View className="bg-neocard dark:bg-neocard-dark border border-neoborder dark:border-neoborder-dark sm:rounded-lg animate-pulse rounded-lg h-16 w-16 items-center justify-center"><Icon icon="CloudArrowUp" className="w-8 h-8" size={64} /></View>}
                    { img !='' && <View className='absolute top-0 right-0 w-8 text-center mx-auto'>
                        <Button  onPress={() => handleDelete(img.file_id)} startDecorator="X" align="start" title="" rounded size ="xs" />
                    </View> }
                </View>
            ))
        )

        return <></>;
    }
    const handleInsertImageFinish = async (url) => {
        RestoreGhosts(-1);
    }
  
    const handleDelete = async (id) => {
        const result = await fetcher(url + "&a=delete&id=" + id);
        RestoreGhosts(0);
    } 

    
    let button = <Button  startDecorator={"plus"} title={"Select " + props.name} onPress={selectImage} />
    if (typeof setFormContextData === "function" &&  (!formContextData || formContextData?.imageSource!= imageSource)){
        setTimeout(() => {
            setFormContextData({action:'show_files', imageSource:imageSource, data: <Row className='flex-wrap '>
            <GhostsList/>
            <PrevList/>
        </Row>})
        }, 1000);
    }

    return (
        <Field {...props}>
            <View className="mr-2 mb-2" >
                {button}
            </View>
            <Row className='flex-wrap gap-2'>
                <GhostsList/>
                <PrevList/>
            </Row>
        </Field>
       
    );
}


