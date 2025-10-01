import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useState, useMemo } from 'react'
import { appSetting, clearNotif } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { useTranslation } from 'react-i18next'
import Browse from 'app/components/elements/browse'
import Link from 'app/ui/atoms/link'
import { useIsDesktop } from 'app/context/measure';

export default function ({ buttonProps, children, tooltip, fullWidth, uri }) {
    const { currentUser, setCurrentUser } = useCurrentUser()
    const isDesktop = useIsDesktop();
    const [ntfsOpen, setNtfsOpen] = useState(false)
    const notifCount = currentUser.notifications
    const { t } = useTranslation()

    let data = {
        request_url: '/api.php?r=bx_notifications/get_data/&params[]=',
        type: 'obj_own_and_con',
        unit: 'notifications',
    }

    const memoizedBrowse = useMemo(() => {
        return (
            <Browse
                key={notifCount}
                only_one_page={true}
                cachePrefix={Date.now()}
                height={400}
                data={data}
            />
        )
    }, [notifCount])

    const defaultButtonProps = {
        variant: isDesktop ? 'secondary' : 'text',
        tooltip: tooltip || 'Notifications',
        rounded: true,
        startDecorator: 'Bell',
        size: isDesktop ? 'base' : 'base',
    }

    buttonProps = { ...defaultButtonProps, ...(buttonProps || {}) }

    buttonProps.addon = { variant: 'primary', text: notifCount, hideZero: true }

    const handleNotificationsToggle = async (bOpen) => {
        clearNotif()
        setCurrentUser({
            notifications: 0,
            notificationsTs: Date.now(),
        })
        setNtfsOpen(bOpen)
    }

    const dropdown = (
        appSetting('notifications', 'url') === '/' + uri ? <Button {...buttonProps} pressed={true} /> : <DropdownPopup
            open={ntfsOpen}
            minPopupWidth={360}
            onOpenChange={handleNotificationsToggle}
            trigger={
                children || (
                    <View key="ddp-trigger3">
                        <Button {...buttonProps} />
                    </View>
                )
            }
        >
            {ntfsOpen && (
                <View key="ddp-content" className="px-1.5 pb-1.5">
                    <View className="flex-row items-center mb-1">
                        <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5">
                            {t('Notifications')}
                        </Text>
                        <Link href={appSetting('notifications', 'url')}>
                            <Button
                                variant="text"
                                size="sm"
                                rounded
                                endDecorator="ChevronsRight"
                                title={t('View all')}
                                onPress={() => {
                                    setNtfsOpen(false)
                                }}
                            />
                        </Link>
                    </View>
                    {memoizedBrowse}
                </View>
            )}
        </DropdownPopup>
    )

    return fullWidth ? <View className="w-full">{dropdown}</View> : dropdown
}
