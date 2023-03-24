import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Dropdown as DropdownDef } from 'app/design/controls'
import { useTheme } from '@react-navigation/native';


export default function Dropdown(props) {
    const { colors } = useTheme();
  
    let { className,  ...rest } = props;
  
    return (
      <DropdownDef {...rest} style={{height:48}} placeholderStyle={{}}  containerStyle={{borderRadius:8}} itemTextStyle={{padding:0, borderRadius:8}} itemContainerStyle = {{backgroundColor:colors.selectBackground, padding:0,   }} activeColor={colors.selectBackgroundActive} ></DropdownDef>
  );
  }