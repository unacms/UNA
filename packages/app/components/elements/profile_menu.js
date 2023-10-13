import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { Dimensions, Platform } from 'react-native'
import { appSetting } from 'app/lib/util'
import { useTranslation } from 'react-i18next';

export default function ElementProfileMenu(props) {
    const { t } = useTranslation();
    let windowHeight = Dimensions.get('window').height

    let styles = {}
    if (Platform.OS === 'web') {
        styles = { maxHeight: windowHeight - 64 }
    }

    return (
        <View style={styles} className=" px-4 overflow-y-scroll profile-menu    overflow-hidden    ">
            <View className="flex-col ">
                {appSetting('menu', 'left').map((item, index) => (
                    <Link key={`menu-${index}`} href={item.link.replace('?owner=1', '')}>
                        <Button
                            variant="text"
                            startDecorator={item.icon}
                            fullWidth
                            solid
                            align="start"
                            title={t(item.title)}
                            size="lg"
                        />
                    </Link>
                ))}
            </View>
        </View>
    )
}
