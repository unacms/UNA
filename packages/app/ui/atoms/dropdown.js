
import { Dropdown as DropdownDef } from 'app/design/controls'
import { Theme }  from 'app/design/theme'

export default function Dropdown(props) {
    const { colors } = Theme();
    let { className,  ...rest } = props;
  
    return (
      <DropdownDef {...rest} 
        style={{lineHeight:24}} 
        placeholderStyle={{color:colors.text, lineHeight:24}}  
        containerStyle={{borderRadius:8, padding: 4,  background:colors.selectBackground, borderColor: colors.selectBackground}} 
        itemTextStyle={{padding:0, borderRadius:8, lineHeight: 6, color:colors.text}} 
        selectedTextStyle={{color:colors.text}} 
        itemContainerStyle = {{backgroundColor:colors.selectBackground, height:40, borderRadius:6, padding:0,  overflow:'hidden', /*borderRadius:8 */}} 
        activeColor={colors.selectBackgroundActive} >
      </DropdownDef>
  );
  }