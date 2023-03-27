import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Dropdown as DropdownDef } from 'app/design/controls'
import  {Theme}  from 'app/design/theme'

export default function Dropdown(props) {
    const { colors } = Theme();
    let { className,  ...rest } = props;
  
    return (
      <DropdownDef {...rest} 
        style={{}} 
        placeholderStyle={{color:colors.text}}  
        containerStyle={{borderRadius:8, background:colors.selectBackground, borderColor: colors.selectBackground}} 
        itemTextStyle={{padding:0, borderRadius:8, color:colors.text}} 
        selectedTextStyle={{color:colors.text}} 
        itemContainerStyle = {{backgroundColor:colors.selectBackground, padding:0,  overflow:'hidden', /*borderRadius:8 */}} 
        activeColor={colors.selectBackgroundActive} >
      </DropdownDef>
  );
  }