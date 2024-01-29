import CheckBox from '@react-native-community/checkbox';
import { Theme } from 'app/design/theme';

export default function CheckBox2(props){
    const { colors } = Theme();
    return <CheckBox 
        tintColors={{ true: colors.checkbox, false: colors.checkbox }} 
        color= {colors.checkbox}
        {...props} 
    />
}