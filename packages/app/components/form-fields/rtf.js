import { useRef } from "react";
import QuillEditor, { QuillToolbar } from 'react-native-cn-quill';
import { useController, useFormContext } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native'
import { fetcher } from '../../lib/fetcher';
import { KeyboardAvoidingView } from 'react-native';
import { uploadImage } from '../../lib/util';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { View } from 'app/design/view'

export default function FormFieldFtf(props) {
    const _editor = useRef();
    const isWeb = Platform.OS == 'web'
    const formContext = useFormContext();
    const { colors } = useTheme();

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

            <View className="w-full">

            <QuillEditor
                theme={{
                    background: '#ffff00', 
                    color: '#00ff00', 
                    placeholder: '#0000ff'
                }}
                className="h-32"
                autoSize
                onHtmlChange={handleChange}
                ref={_editor}
                initialHtml={field.value}
            />
            <QuillToolbar 
                theme={{
                    background: 'blue',
                    color: 'green',
                    overlay: 'rgba(255,0,0,0.5)',
                    size: 18,
                }}
                styles={{
                    selection: {
                        provider: (provided) => ({
                            ...provided,
                            backgroundColor: 'cyan',
                        }),
                    },
                    toolbar: {
                        provider: (provided) => ({
                            ...provided,
                            borderTopWidth: 3,
                            borderTopColor: '#ff0000',
                        }),
                        root: () => ({
                            backgroundColor: '#ffff00',
                        }),
                        toolset: { root: () => ({
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            paddingTop: 2,
                            paddingBottom: 2,
                            paddingLeft: 3,
                            paddingRight: 3,
                            marginRight: 1,
                            backgroundColor:'orange'
                        })}
                    },
                }}
                custom={{
                    handler: handleCustomClick,
                    actions: ['image'],
                }}
                editor={_editor}  
                options={['bold', 'italic', 'underline', 'strike', 'image']} 
                
            />

            </View>

    );
}