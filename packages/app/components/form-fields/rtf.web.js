import 'react-quill/dist/quill.snow.css'; // import styles
import { useController, useFormContext } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useRef } from 'react'
import { Platform } from 'react-native'
import { uploadImage } from '../../lib/util';

export default function FormFieldFtf(props) {
    const quillRef = useRef(null);
    const formContext = useFormContext();
    const isWeb = Platform.OS == 'web'
    const ReactQuill = require('react-quill');
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';

    const { field } = useController({ name, rules, defaultValue });

    const handleChange = (content) => {
        setTimeout(() => {
            formContext.setValue(name, content)
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
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        editor.insertEmbed(range.index, 'image', url);
    }

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['image', 'code-block']
            ],
            handlers: {
                image: handleInsertImage
            }
        }
    }), [])

    let formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ];

    return <ReactQuill 
        ref={quillRef}
        modules={modules}
        formats={formats}
        value={field.value} 
        onChange={handleChange} />;
}