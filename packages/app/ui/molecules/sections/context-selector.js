import { View, Row } from 'app/design/view'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import Profile from 'app/ui/molecules/profile/profile'
import { appStatic } from 'app/lib/app-static'
import { FeedbackHaptics, appSetting } from 'app/lib/util'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import { getPageData } from 'app/lib/util';
import emitter from 'app/context/emitter'

const rootUrl = appSetting('context_selector', 'root_url');

function ListItem({ url, text, icon, isActive }) {
    return (
        <Link key={url} href={url}>
            <Row
                className={`w-full px-2 h-12 gap-2 web:group rounded-xl justify-between items-center ${isActive
                    ? ' bg-primary/10 text-foreground rounded-xl web:hover:bg-muted/50 web:duration-200 '
                    : ' web:hover:bg-muted/50 web:duration-200 '
                    }`}
            >
                <Row className="items-center flex-auto gap-2 text-card-foreground web:hover:text-foreground ">
                    <View
                        className={`items-center w-9 h-9 justify-center ${isActive
                            ? ' bg-primary text-primary-foreground  '
                            : ' bg-muted/50 web:group-hover:bg-secondary/80 web:duration-200 '
                            } rounded-full`}
                    >
                        {icon}
                    </View>
                    <Text className="text-base flex-auto font-semibold text-card-foreground web:hover:text-foreground">
                        {text}
                    </Text>
                </Row>
                {isActive && (
                    <View className="rounded-full flex-none bg-primary text-primary-foreground h-2 w-2 "></View>
                )}
            </Row>
        </Link>
    )
}

function getContextRoot(data, url, uri) {


    if (uri == rootUrl || !data.current?.id) {
        return {
            url: '/' + rootUrl,
            image: appStatic('logo', { mode: appSetting('context_selector', 'logo_mode') }),
            name: false,
        }
    }

    const link = data.links?.find((item) => item.url?.includes('/' + url))
    if (link) {
        return {
            url: link.url,
            image: <View className="w-9 h-9 items-center justify-center flex-row text-center rounded-full bg-muted flex">
                <Icon icon={link.icon} size={20} /></View>,
            name: link.title,
        }
    }


    return {
        url: data.current?.url,
        image: (
            <Profile
                {...data.current}
                displayType="unit_wo_info"
                displaySize="sm"
                showLinks={false}
            />
        ),
        name: data.current?.display_name,
    }
}

export default function ContextSelector({ data: initialData, url, uri, mode }) {

    const [isOpen, setIsOpen] = useState(false);
    const [data, setContextData] = useState(initialData);
    const { t } = useTranslation();

    useEffect(() => {
        const subscription = emitter.addListener(`connections`, (data) => {
            if (data.action == 'changed') {
                getPageData(url).then(data => { setContextData(data.data.context) })
            }
        })

        return () => {
            subscription.remove();
        }
    }, [])

    if (!data) return null

    const contextRoot = getContextRoot(data, url, uri)

    const handleOpenChange = (open) => {
        if (open && !isOpen) {
            FeedbackHaptics('Medium')
        }
        setIsOpen(open)
    }

    const isLogoOnly = !contextRoot.name

    const CurrentContext = (
        <Link
            size={isLogoOnly ? undefined : 'lg'}
            hitarea={!isLogoOnly}
            className="web:flex-1 native:shrink-0 min-w-0"
            href={contextRoot.url}
            title={t("Context Home")}
        >
            <Row className="items-center gap-2 py-0.5 min-w-0">
                <View className="shrink-0 native:w-9 h-9 items-center justify-center overflow-hidden web:duration-200 text-card-foreground web:hover:text-foreground">
                    {contextRoot.image}
                </View>
                {!!contextRoot.name && (
                    <Text numberOfLines={1} className="text-base web:flex-1 native:flex-none font-semibold tracking-tight truncate max-w-56 text-card-foreground web:hover:text-foreground">
                        {contextRoot.name}
                    </Text>
                )}
            </Row>
        </Link>
    )

    const isLinkSelected = data.links?.some(item => item.url == contextRoot.url);
    
    const contextList = data.list ?? [];

    const List = <View className="flex-col gap-px">
        {data.links?.filter(item => (item.hidden != true)).map((item) =>
            item.url ? (
                <ListItem
                    key={item.url}
                    url={item.url}
                    text={item.title}
                    icon={item.icon && (item.icon == '{logo}' ? appStatic('logo', { mode: 'mark', }) :
                        <Icon
                            icon={item.icon}
                            size={20}
                            className="w-5 h-5"
                        />
                    )}
                    isActive={contextRoot.url == item.url} />

                ) : null
        )}
         {contextList.map((item) =>
            item?.url ? (
                <ListItem
                    key={item.url || item.id}
                    url={item.url}
                    text={item.display_name}
                    icon={<Profile {...item} displayType="unit_wo_info" displaySize="sm" />}
                    isActive={item.id === data.current?.id && !isLinkSelected}
                />
            ) : null
        )}
    </View>
    const DropDown = (
        <DropdownPopup
            buttonProps={{
                image: 'ChevronsUpDown',
                style: 'borderless',
                controlSize: 'regular',
                borderShape: 'circle',
            }}

            minPopupWidth={360}
            open={isOpen}
            onOpenChange={handleOpenChange}
        >
            {List}
        </DropdownPopup>
    )

    if (mode === 'min') {
        return DropDown
    }

    if (mode === 'list') {
        return List
    }

    /*if (mode === 'compact') {
        return <ButtonsGroup variant="text" size="lg" fullWidth={true} >
            {CurrentContext}
            {DropDown}
        </ButtonsGroup>
    }*/

    return (
        contextList.length > 0 || data?.links?.length > 0 ? (
            <Row className="items-center min-w-0 gap-2 ">
                {!!contextRoot.name &&
                    appSetting('context_selector', 'logo') && (
                        <>
                            {(() => {
                                const isActiveAppRoot = uri === rootUrl
                                return (
                                    <Link href={`/${rootUrl}`} variant="ghost" size="lg" title="Home">
                                        <Row
                                            className={`shrink-0 rounded-xl ${isActiveAppRoot
                                                ? ' bg-accent/60 text-accent-foreground web:hover:bg-accent'
                                                : ' web:hover:bg-muted/50'
                                                }`}
                                        >
                                            <View className="flex-row rounded-full items-center justify-center">
                                                {appStatic('logo', { mode: 'mark', })}
                                            </View>
                                        </Row>
                                    </Link>
                                )
                            })()}
                            <Icon
                                icon="ChevronRight"
                                size={20}
                                className="w-5 h-5 shrink-0 text-muted-foreground"
                            />
                        </>
                    )}

                <View className="shrink min-w-0">
                    {CurrentContext}
                </View>

                <View className="shrink-0">
                    {DropDown}
                </View>
            </Row>
        ) : (
            CurrentContext
        )

    )
}
