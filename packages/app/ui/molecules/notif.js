import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Button, NeoButton } from 'app/design/controls'
import { useState, useMemo } from 'react'
import { appSetting, clearNotif } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { useTranslation } from 'react-i18next'
import Browse from 'app/components/elements/browse'
import Link from 'app/ui/atoms/link'
import { useIsDesktop, useWindowHeight } from 'app/context/measure';

export default function ({ buttonProps, children, tooltip, fullWidth, uri }) {
    const { currentUser, setCurrentUser } = useCurrentUser()
    const isDesktop = useIsDesktop();
    const windowHeight = useWindowHeight();
    const [ntfsOpen, setNtfsOpen] = useState(false)
    const notifCount = currentUser.notifications
    const { t } = useTranslation()

    let data = {
        request_url: '/api.php?r=bx_notifications/get_data/&params[]=',
        type: 'obj_own_and_con',
        unit: 'notifications',
    }

    // Calculate dynamic height: window height minus header (64px), padding (32px), and some bottom margin (100px)
    const notificationHeight = windowHeight - 196;

    const memoizedBrowse = useMemo(() => {
        return (
            <Browse
                key={notifCount}
                only_one_page={false}
                cachePrefix={Date.now()}
                height={notificationHeight}
                data={data}
            />
        )
    }, [notifCount, notificationHeight])

    const isNeoButton = buttonProps?.neoButton === true;
    const defaultButtonProps = isNeoButton ? {
        style: isDesktop ? 'glass' : 'borderless',
        tooltip: tooltip || 'Notifications',
        controlSize: 'regular',
        borderShape: 'circle',
        image: 'Bell',
        accessibilityLabel: 'Notifications',
    } : {
        variant: isDesktop ? 'secondary' : 'text',
        tooltip: tooltip || 'Notifications',
        rounded: true,
        startDecorator: 'Bell',
        size: isDesktop ? 'base' : 'base',
    }

    buttonProps = { ...defaultButtonProps, ...(buttonProps || {}) }

    buttonProps.addon = { variant: 'primary', text: notifCount, hideZero: true }
    const { neoButton, ...renderButtonProps } = buttonProps;
    const ButtonComponent = neoButton ? NeoButton : Button;

    const handleNotificationsToggle = async (bOpen) => {
        clearNotif()
        setCurrentUser({
            notifications: 0,
            notificationsTs: Date.now(),
        })
        setNtfsOpen(bOpen)
    }

    const dropdown = (
        appSetting('notifications', 'url') === '/' + uri ? <ButtonComponent {...renderButtonProps} {...(neoButton ? { selected: true } : { pressed: true })} /> : <DropdownPopup
            open={ntfsOpen}
            minPopupWidth={360}
            onOpenChange={handleNotificationsToggle}
            buttonProps={children ? undefined : buttonProps}
            trigger={children ? children : undefined}
        >
            {ntfsOpen && (
                <View key="ddp-content" className="gap-1">
                    <View className="flex-row items-center ">
                        <Text className="text-secondary-foreground px-1 text-lg flex-auto font-bold ml-0.5">
                            {t('Notifications')}
                        </Text>
                        <Link href={appSetting('notifications', 'url')}>
                            <Button
                                variant="link"
                                size="sm"
                                
                                
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
