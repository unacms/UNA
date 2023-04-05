import { useRef, useState } from "react";
import { Pressable } from 'app/design/view'
import { actions, RichEditor, RichToolbar} from "react-native-pell-rich-editor";
import { useController, useFormContext } from 'react-hook-form';
import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native'
import { fetcher } from '../../lib/fetcher';

export default function FormFieldFtf(props) {

    const isWeb = Platform.OS == 'web'
    const richText = useRef();
    const formContext = useFormContext();

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const [value, setValue] = useState(defaultValue)
    const { field } = useController({ name, rules, defaultValue });


    const uploadImage = async (uri) => {
        const url = '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]&o=sys_images_editor&t=sys_images_editor&a=upload_inline';
        console.log(uri);
        const formData = new FormData();
        if (isWeb){
            const fileExt = uri.split(';').shift().split('/').pop();
            const fileType = uri.split(';').shift().split(':').pop();
            urltoFile(uri, genRnd(8) + '.' + fileExt, fileType)
            .then(async function(file){
                formData.append("file", file);
                const result = await fetcher([url, null, formData]);
                if (result.data.link)
                    richText.current.insertImage(result.data.link); ;
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
            const result = await fetcher([url, null, formData]);
            if (result.data.link)
                richText.current.insertImage(result.data.link); ;
        }
    };

    const handleChange = (descriptionText) => {
        if (descriptionText) {
            setValue(descriptionText);
            setContent();
        } else {
            setValue("");
        }
    };

    const handleInsertImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsMultipleSelection: false,
        });

        if (!result.canceled) {
            result.assets.forEach(function (i) {
                uploadImage(i.uri);
                
            });
        }
    };

    const handleBlur = () => {
        setContent();
    }

    const setContent = () => {
        setTimeout(() => {
            formContext.setValue(name, value)
        }, 100);
    }

    const { colors } = useTheme();

    return (
        <Pressable onPress={() => richText.current?.dismissKeyboard()} >
        <RichEditor 
            ref={richText}
            onChange = {handleChange}
            onBlur = {handleBlur}
            
            initialContentHTML={field.value}
            androidHardwareAccelerationDisabled={true}
            initialHeight={250}
            editorStyle={{ backgroundColor: colors.fieldBackground }}
        />
        <RichToolbar
            style={{backgroundColor: colors.barsBackground}}
            editor={richText}
            onPressAddImage = {handleInsertImage}
            selectedIconTint = {colors.primary}
            iconTint = {colors.default}
            actions={[
                actions.insertImage,
                /*actions.insertVideo,*/
                actions.undo,
                actions.redo,
                actions.setBold,
                actions.setItalic,
                actions.insertBulletsList,
                actions.insertOrderedList,
                actions.insertLink,
                actions.setStrikethrough,
                actions.setUnderline,
            ]}
            
        />
        </Pressable>
  );
}