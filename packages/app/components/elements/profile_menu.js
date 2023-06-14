import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { Dimensions, Platform } from 'react-native'
import { appSetting } from 'app/lib/util'

export default function ElementProfileMenu(props) {
  let windowHeight = Dimensions.get('window').height

  let styles = {}
  if (Platform.OS === 'web') {
    styles = { maxHeight: windowHeight - 64 }
  }

  const handleLayout = (event) => {
    windowHeight = Dimensions.get('window').height
    if (Platform.OS === 'web') {
      styles = { maxHeight: windowHeight - 64 }
    }
  }

  return (
    <View
      style={styles}
      className=" xl:mx-2 p-4  overflow-y-scroll profile-menu flex-col gap-2
        
         overflow-hidden rounded-r-lg xl:rounded-lg  
                bg-backgroundcard dark:bg-backgroundcard-dark  
                border-y border-r xl:border
                border-bordercolorcard dark:border-bordercolorcard-dark 
                
        
        
        "
    >
      <View className="flex-col gap-y-1">
        {appSetting('menu', 'left').map((item, index) => (
          <Link key={`menu-${index}`} href={item.link.replace('?owner=1', '')}>
            <Button
              variant="text"
              startDecorator={item.icon}
              fullWidth
              solid
              align="start"
              title={item.title}
            />
          </Link>
        ))}
      </View>
    </View>
  )
}
