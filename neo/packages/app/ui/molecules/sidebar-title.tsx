import type { ReactNode } from 'react'
import { Text } from 'app/design/typography'
import { Row, View } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util'

type SidebarTitleProps = {
    title?: string
    icon?: string
    /** Buttons at the end of the row, e.g. the conductor's "Add" menu. */
    actions?: ReactNode
}

/**
 * Title row of a left sidebar: section icon, name and optional actions.
 * Conductor and wiki pages share it, so `conductor.sidebar_title*` settings style both.
 */
export function SidebarTitle({ title, icon, actions }: SidebarTitleProps) {
    if (!title && !actions) return null

    return (
        <Row className={appSetting('conductor', 'sidebar_title')}>
            <Row className={appSetting('conductor', 'sidebar_title_name')}>
                {!!icon && (
                    <View className={appSetting('conductor', 'sidebar_title_icon')}>
                        <Icon
                            icon={icon}
                            size={appSetting('conductor', 'sidebar_title_icon_size')}
                            className={appSetting('conductor', 'sidebar_title_icon_class')}
                        />
                    </View>
                )}
                {!!title && (
                    <Text className={appSetting('conductor', 'sidebar_title_text')}>
                        {title}
                    </Text>
                )}
            </Row>
            {actions ? <Row>{actions}</Row> : null}
        </Row>
    )
}
