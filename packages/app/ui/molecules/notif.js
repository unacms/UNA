import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Button, ButtonRef } from 'app/design/controls'
import { useState, useRef, useEffect, useMemo } from 'react'
import { appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { fetcher } from 'app/lib/fetcher'
import { useTranslation } from 'react-i18next';
import Browse from 'app/components/elements/browse'
import useDaemon from 'app/lib/hooks/daemon'
import Redirect from 'app/ui/atoms/redirect'

export default function (props) {
    const redirectdRef = useRef()
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { daemonData, error } = useDaemon("/api.php?r=bx_notifications/get_unread_notifications_num&params[]=", false);
    const [ntfsOpen, setNtfsOpen] = useState(false);
    const [notifCount, setNotifCount] = useState(currentUser.notifications);

    const { t } = useTranslation();

    const sTxtNtfsTitle = t("Notifications")
    const sTxtNtfsViewAll = t("View all")

    useEffect(() => {
        if (daemonData && daemonData != notifCount) {
            setNotifCount(daemonData)
        }
    }, [daemonData]);

    useEffect(() => {
      /*  if (currentUser.notifications != notifCount) {
            setNotifCount(currentUser.notifications)
        }*/
    }, [currentUser.notifications]);

    const handleClick = (sUrl) => {
        redirectdRef.current.redirect(sUrl)
    }

    let data = { request_url: "/api.php?r=bx_notifications/get_data/&params[]=", "type": "obj_own_and_con", unit: "notifications" }

    const memoizedBrowse = useMemo(() => {
        return <Browse cachePrefix={Date.now()} height={400} data={data} />;
    }, [notifCount]);

    const ntfsContent = (
        ntfsOpen && <View key="ddp-content" className="px-1.5 pb-1.5">
            <Redirect ref={redirectdRef} />
            <View className="flex-row items-center mb-1">
                <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5">
                    {sTxtNtfsTitle}
                </Text>
                <Button
                    variant="text"
                    size="sm"
                    rounded
                    endDecorator="CaretDoubleRight"
                    title={sTxtNtfsViewAll}
                    onPress={() => {
                        setNtfsOpen(false)
                        handleClick(appSetting('layout', 'notifications'))
                    }}
                />
            </View>
            {memoizedBrowse}
        </View>
    )

    let ntfsTrigger = <View key="ddp-trigger3">
        <ButtonRef
            variant="outline"
            tooltip={props.tooltip === undefined ? "Notifications" : props.tooltip}
            rounded
            startDecorator="Bell"
            id="m1"
        />
        {(notifCount > 0) && <View className='absolute bg-contrast border-2 border-white dark:border-neutral-900 rounded-full  px-1.5 items-center justify-center -right-1 -top-2'><Text className='text-white text-xs font-semibold'>{notifCount}</Text></View>}

    </View>

    if (props.children) {
        ntfsTrigger = props.children
    }

    if (props.buttonProps) {
        ntfsTrigger = <View className='w-full' key="ddp-trigger3"><ButtonRef
            addon={{ text: notifCount, variant: 'primary' }}
            {...props.buttonProps}
        /></View>
    }

    const dd = <DropdownPopup
        open={ntfsOpen}
        onOpenChange={async (bOpen) => {
            await fetcher('/api.php?r=bx_notifications/mark_as_read/')
            setNotifCount(0)
            setNtfsOpen(bOpen);
        }}
        title={t(sTxtNtfsTitle)}
    >
        {[
            ntfsTrigger,
            ntfsContent
        ]}
    </DropdownPopup>

    if (props.buttonProps)
        return <View className='w-full'>{dd}</View>

    return dd
}
