import { CheckBox as CheckBoxDef } from 'react-native';
import { Theme } from 'app/design/theme';


export default function CheckBox(props){
    const { colors } = Theme();
    return <CheckBoxDef 
        tintColors={{ true: colors.primary, false: colors.primary }} 
        color= {colors.primary}
        {...props} 
    />
}

