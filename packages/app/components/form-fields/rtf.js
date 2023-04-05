import { useRef, useState } from "react";
import { Pressable } from 'app/design/view'
import { actions, RichEditor, RichToolbar} from "react-native-pell-rich-editor";
import { useController, useFormContext } from 'react-hook-form';
import { useTheme } from '@react-navigation/native';

export default function FormFieldFtf(props) {
    const richText = useRef();
    const formContext = useFormContext();

    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const [value, setValue] = useState(defaultValue)
    const { field } = useController({ name, rules, defaultValue });

    const handleChange = (descriptionText) => {
        if (descriptionText) {
            setValue(descriptionText);
            setContent();
        } else {
            setValue("");
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
            onChange={handleChange}
            onBlur ={handleBlur}
            initialContentHTML={field.value}
            androidHardwareAccelerationDisabled={true}
            initialHeight={250}
            editorStyle={{ backgroundColor: colors.fieldBackground }}
        />
        <RichToolbar
            style={{backgroundColor: colors.barsBackground}}
            editor={richText}
            selectedIconTint = {colors.primary}
            iconTint = {colors.default}
            actions={[
                /*actions.insertImage,
                actions.insertVideo,*/
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