import { View, Pressable } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { menuItemsByName } from 'app/lib/util'
import { appSetting } from 'app/lib/util'
import { MotiView, AnimatePresence } from 'moti'
import { useTranslation } from 'react-i18next';
export default function ElementMainMenu({menuPopup, showMenu, cssClass}) {

    const handleHideMenu = (params) => {}
    const menu_top = appSetting('menu_items', 'menu_top')
    const { t } = useTranslation();

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
                            <View className={(menuPopup? 'h-screen': '') +"bg-white/50 dark:bg-black/50 w-full backdrop-blur absolute top-0 h-screen z-50 bg-red-500"}/>
                        </Pressable>
                    </MotiView>
                    <MotiView
                        style={{ width: 288 }}
                        from={{
                            translateX: -300,
                            overshootClamping: false,
                        }}
                        animate={{
                            translateX: 0,

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
                        <Pressable className="w-72 h-screen m-menu" onPress={showMenu}>
                            <View onPress={handleHideMenu} className="backdrop-blur h-full xl:flex shadow-2xl p-4 bg-bgrnavbar dark:bg-bgrnavbar-d   flex-col gap-y-2">
                                <View className="flex-col gap-y-0.5">
                                    {menuItemsByName('main_menu', menu_top).map((item, index) => (
                                        <Link key={`menu-${index}`} href= {item.link}>
                                            <Button variant="text" size="lg" startDecorator={item.icon.indexOf(' ') == -1 ? item.icon : item.icon.split(' ')[0]} fullWidth solid align='start' title = {t(item.title)} />
                                        </Link>
                                    ))}
                                </View>
                            </View>
                        </Pressable>
                    </MotiView>
                </View>
            )}
        </AnimatePresence>
    );
}