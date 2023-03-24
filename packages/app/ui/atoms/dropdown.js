import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Dropdown as DropdownDef } from 'app/design/controls'
import { useTheme } from '@react-navigation/native';

export default function Dropdown(props) {
    
    const { colors } = useTheme();
    let {className, ...rest} = props; // remove width & height
    console.log(colors);
    return (
        <DropdownDef {...rest} itemContainerStyle = {{backgroundColor:colors.selectBackground}}  >{props.children}</DropdownDef>
    );
}
