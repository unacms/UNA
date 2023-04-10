import { useRef } from "react";
import QuillEditor, { QuillToolbar } from 'react-native-cn-quill';
import { useController, useFormContext } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native'
import { fetcher } from '../../lib/fetcher';
import { KeyboardAvoidingView } from 'react-native';
import { uploadImage } from '../../lib/util';

export default function FormFieldFtf(props) {
    const _editor = useRef();
    const isWeb = Platform.OS == 'web'
    const formContext = useFormContext();

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';

    const { field } = useController({ name, rules, defaultValue });

    const handleChange = (value) => {
        setTimeout(() => {
            formContext.setValue(name, value.html)
        }, 100);
    };

    const handleInsertImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsMultipleSelection: false,
        });

        if (!result.canceled) {
            result.assets.forEach(function (i) {
                uploadImage(
                    i.uri, 
                    '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]&o=sys_images_editor&t=sys_images_editor&a=upload_inline', 
                    handleInsertImageFinish
                );
            });
        }
    };

    const handleInsertImageFinish = async (url) => {
        _editor.current?.insertEmbed(
            0,
            'image',
            url
        );
    }

   

    const handleCustomClick = (name,value) => {
        if (name === 'image') {
            handleInsertImage();
        } else {
          console.log(`${name} clicked with value: ${value}`);
        }
    };

    return (
        <KeyboardAvoidingView>
            <QuillEditor
                className="h-48"
                onHtmlChange={handleChange}
                ref={_editor}
                initialHtml={field.value}
            />
            <QuillToolbar 
                custom={{
                    handler: handleCustomClick,
                    actions: ['image'],
                }}
                editor={_editor}  
                options={['bold', 'italic', 'underline', 'strike', 'image']} 
                theme="light" 
            />
        </KeyboardAvoidingView>
    );
}