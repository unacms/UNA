import { useRef } from "react";
import QuillEditor, { QuillToolbar } from 'react-native-cn-quill';
import { useController, useFormContext } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native'
import { fetcher } from '../../lib/fetcher';
import { KeyboardAvoidingView } from 'react-native';
import { uploadImage } from '../../lib/util';
import { Theme } from 'app/design/theme';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { View } from 'app/design/view'

export default function FormFieldFtf(props) {
    const _editor = useRef();
    const isWeb = Platform.OS == 'web'
    const formContext = useFormContext();
    const { colors } = Theme();

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';

    



    const { field } = useController({ name, rules, defaultValue });

    const handleChange = (value) => {
        _editor.current.setPlaceholder('Hello World');
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

            <View className="w-full mb-4">

            <QuillEditor
                theme={{
                    background: colors.fieldBackground, 
                    /*color: '#00ff00', */
                    placeholder: 'black'
                }}
                className="h-32"
                autoSize
                onHtmlChange={handleChange}
                ref={_editor}
                initialHtml={field.value}
            />
            <QuillToolbar 
                theme={{
                    background: colors.barsBackground,
                    color: colors.default,
                    overlay: 'rgba(255,0,0,0)',
                    size: 32,
                }}
                styles={{
                    selection: {
                        provider: (provided) => ({
                            ...provided,
                            backgroundColor: colors.primary,
                        }),
                    },
                    toolbar: {
                        provider: (provided) => ({
                            ...provided,
                            borderTopWidth: 0,
                            borderTopColor: '#ff0000',
                        }),
                        root: () => ({
                            backgroundColor: colors.barsBackground,
                        }),
                        /*toolset: { root: () => ({
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            paddingTop: 0,
                            paddingBottom: 0,
                            paddingLeft: 0,
                            paddingRight: 0,
                            marginRight: 0,
                            backgroundColor: colors.barsBackground,
                        })}*/
                    },
                }}
                custom={{
                    handler: handleCustomClick,
                    actions: ['image'],
                }}
                editor={_editor}  
                options={['bold', 'italic', 'underline', 'strike', 'strike',{'list':'ordered'}, {'list':'bullet'},{ 'align':''},{'align':'center'},{'align':'right'},'blockquote','link', 'image']} 
                
            />

            </View>

    );
}