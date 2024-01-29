import { CheckBox as CheckBoxDef } from 'react-native';
import { Theme } from 'app/design/theme';


export default function CheckBox(props){
    const { colors } = Theme();
    return <CheckBoxDef 
        tintColors={{ true: colors.checkbox, false: colors.checkbox }} 
        color= {colors.checkbox}
        {...props} 
    />
}

