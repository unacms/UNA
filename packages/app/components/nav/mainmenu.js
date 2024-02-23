import { View, Pressable, ScrollView } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { menuItemsByName } from 'app/lib/util'
import { appSetting } from 'app/lib/util'
import { MotiView, AnimatePresence } from 'moti'
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform } from 'react-native'
import { useCurrentUser } from 'app/context/user'

export default function ElementMainMenu({menuPopup, showMenu, cssClass, items}) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const handleHideMenu = (params) => {}
   
    const { t } = useTranslation();
   // const menu_top = appSetting('menu_items', 'menu_drawer')
    let menu_top_items = items;
    let windowHeight = Dimensions.get('window').height
    let windowWidth = Dimensions.get('window').width
    let styles = {}
    styles = { height: windowHeight - 170 }
    if (windowWidth < 1024)
        styles = { height: windowHeight - 65 }
    return (
        <AnimatePresence exitBeforeEnter>
            {menuPopup && (
                <View className={cssClass}>
                    <MotiView
                        style={{ width: '100%' }}
                        from={{
                            opacity: 1,
                            width: '100%'
                        }}
                        animate={{
                            opacity: 1,
                            width: '100%'
                        }}
                        exit={{
                            opacity: 0,
                            width: '0'
                        }}
                        transition={{
                            duration: 0,
                        }}
                    >
                        <Pressable onPress={showMenu}>
                            <ScrollView className={(menuPopup? 'h-screen': '') +" bg-white/50 dark:bg-black/50 w-full backdrop-blur absolute top-0 h-screen z-50"}>
                                <View className='h-screen '></View>
                                <View className='h-screen '></View>
                            </ScrollView>
                        </Pressable>
                    </MotiView>
                    <MotiView
                        style={{ width: 288 }}
                        from={{
                            translateX: -300,
                            height: 500,
                            overshootClamping: false,
                        }}
                        animate={{
                            translateX: 0,
                            height: 500,
                            overshootClamping: false,
                        }}
                        exit={{
                            height: 0,
                            translateX: -300,
                            overshootClamping: false,
                        }}
                        transition={{
                            overshootClamping: true,
                        }}
                    >
                        {menu_top_items.length > 0 && <View  className="w-72 h-screen m-menu ">
                            <Pressable  onPress={showMenu}>
                                <ScrollView style={styles} onPress={handleHideMenu} className="backdrop-blur xl:flex shadow-2xl p-4 bg-bgrnavbar dark:bg-bgrnavbar-d flex-col gap-y-2 ">
                                    <View className="flex-col gap-y-0.5">
                                        {menu_top_items.map((item, index) => (
                                      
                                            <Link key={`menu-${index}`} href= {item.link}>
                                                <Button variant="text" size="lg" startDecorator={item.icon.indexOf(' ') == -1 ? item.icon : item.icon.split(' ')[0]} fullWidth solid align='start' title = {t(item.title)} />
                                            </Link>
                                        ))}
                                    </View>
                                </ScrollView>
                            </Pressable>
                        </View> }
                    </MotiView>
                </View>
            )}
        </AnimatePresence>
    );
}