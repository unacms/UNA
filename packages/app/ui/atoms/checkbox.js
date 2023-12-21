import CheckBox from '@react-native-community/checkbox';
import { Theme } from 'app/design/theme';

export default function CheckBox2(props){
    const { colors } = Theme();
    return <CheckBox 
        tintColors={{ true: colors.primary, false: colors.primary }} 
        color= {colors.primary}
        {...props} 
    />
}