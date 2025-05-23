import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Button, ButtonRef } from 'app/design/controls'
import { useState, useRef, useEffect, useMemo } from 'react'
import { appSetting, clearNotif } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { useTranslation } from 'react-i18next';
import Browse from 'app/components/elements/browse'
import { Link } from 'solito/link'

export default function ({ buttonProps, children, tooltip, fullWidth }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [ntfsOpen, setNtfsOpen] = useState(false);
    const notifCount = currentUser.notifications;
    const { t } = useTranslation();

    let data = { request_url: "/api.php?r=bx_notifications/get_data/&params[]=", "type": "obj_own_and_con", unit: "notifications" }

    const memoizedBrowse = useMemo(() => {
        return <Browse key={notifCount} only_one_page={true} cachePrefix={Date.now()} height={400} data={data} />;
    }, [notifCount]);

    buttonProps = buttonProps || {
        variant: "secondary",
        tooltip: tooltip || "Notifications",
        rounded: true,
        startDecorator: "Bell",
        size: "sm",
        hitSlop: 4,
    };

    buttonProps.addon = { variant: 'primary', text: notifCount, hideZero: true }



    const handleNotificationsToggle = async (bOpen) => {
        clearNotif();
        setCurrentUser({
            notifications: 0,
            notificationsTs: Date.now(),
        });
        setNtfsOpen(bOpen);
    };

    const dropdown = <DropdownPopup
        open={ntfsOpen}
        minPopupWidth={330}
        onOpenChange={handleNotificationsToggle}
        trigger={children || <View key="ddp-trigger3">
            <Button
                {...buttonProps}
            />
        </View>}
    >
        {
            ntfsOpen && <View key="ddp-content" className="px-1.5 pb-1.5">
                <View className="flex-row items-center mb-1">
                    <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5">
                        {t("Notifications")}
                    </Text>
                    <Link href={appSetting('notifications', 'url')}>
                        <Button
                            variant="text"
                            size="sm"
                            rounded
                            endDecorator="ChevronsRight"
                            title={t("View all")}
                            onPress={() => {
                                setNtfsOpen(false)
                            }}
                        />
                    </Link>
                </View>
                {memoizedBrowse}
            </View>
        }
    </DropdownPopup>

    return fullWidth ? <View className="w-full">{dropdown}</View> : dropdown
}
