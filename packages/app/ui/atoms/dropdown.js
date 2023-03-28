import { Dropdown as DropdownDef } from 'app/design/controls'
import { Theme }  from 'app/design/theme'
import { Platform, PlatformIOSStatic } from 'react-native'

export default function Dropdown(props) {
    const { colors } = Theme();
    let { className,  ...rest } = props;
  
    let itemTextStyle = { lineHeight: 6, color:colors.text}
    let itemContainerStyle = {backgroundColor:colors.selectBackground, height:40, borderRadius:6, overflow:'hidden'}

    if (Platform.OS != 'web'){
      itemTextStyle = { color:colors.text}
      itemContainerStyle = {backgroundColor:colors.selectBackground, borderRadius:6, overflow:'hidden'}
    }

    return (
      <DropdownDef {...rest} 
        style={{}} 
        placeholderStyle={{color:colors.text}}  
        containerStyle={{borderRadius:8, padding:4, margin:2, background:colors.selectBackground, borderColor: colors.selectBorder}} 
        itemTextStyle={itemTextStyle} 
        itemContainerStyle = {itemContainerStyle} 
        selectedTextStyle={{color:colors.text}} 
        
        activeColor={colors.selectBackgroundActive} >
      </DropdownDef>
  );
  }
