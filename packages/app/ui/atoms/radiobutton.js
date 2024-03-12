import { RadioButton } from 'react-native-paper';
import { Theme } from 'app/design/theme';

export default function (props){
    const { colors } = Theme();
    return <RadioButton 
        {...props} 
        color = {colors.checkbox}
        uncheckedColor = {colors.default}
    />
}