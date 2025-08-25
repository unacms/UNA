import { View, Row } from 'app/design/view'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { Button, ButtonsGroup } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import Profile from 'app/ui/molecules/profile'
import { appStatic } from 'app/lib/app-static'
import { FeedbackHaptics, appSetting } from 'app/lib/util'
import { useState } from 'react'

function renderListItem(props, isActive, onItemClick) {
    return renderListItem_(
        props.url,
        props.display_name,
        <Profile {...props} displayType="unit_wo_info" displaySize="sm" />,
        isActive
    )
}

function renderListItem_(url, text, icon, isActive) {
    return (
        <Link key={url} className="w-full" href={url}>
            <Row
                className={`w-full px-2 h-12 gap-2 group rounded-xl justify-between items-center ${
                    isActive
                        ? ' bg-accent/60 text-accent-foreground rounded-xl  web:hover:bg-accent web:duration-200 '
                        : '  web:hover:bg-muted/60 web:duration-200 '
                }`}
            >
                <Row className="items-center flex-auto gap-2">
                    <View
                        className={`items-center w-9 h-9 justify-center ${
                            isActive
                                ? ' bg-primary text-primary-foreground  '
                                : ' bg-muted/60 web:group-hover:bg-secondary/60 web:duration-200 '
                        } rounded-full`}
                    >
                        {icon}
                    </View>
                    <Text className="text-base flex-auto font-semibold text-popover-foreground">
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
    const link = data.links?.find((item) => item.url?.includes('/' + url))
    if (link) {
        return {
            url: link.url,
            image: <Icon icon={link.icon} size={20} className="w-9 h-9 items-center justify-center flex-row text-center rounded-full bg-muted flex" />,
            name: link.title,
        }
    }

    if (!data.current?.id) {
        return {
            url: '/',
            image: appStatic('logo'),
            name: false,
        }
    }

    return {
        url: data.current.url,
        image: (
            <Profile
                {...data.current}
                displayType="unit_wo_info"
                displaySize="sm"
            />
        ),
        name: data.current.display_name,
    }
}

export default function ContextSelector({ data, url, uri, mode }) {
    const [isOpen, setIsOpen] = useState(false)

    if (!data) return null

    const contextRoot = getContextRoot(data, url, uri)
    const isActiveContextRoot =
        contextRoot?.url === '/' + (url || '') ||
        (contextRoot?.url === '/' && uri === 'home')

    const handleOpenChange = (open) => {
        if (open && !isOpen) {
            FeedbackHaptics('Medium')
        }
        setIsOpen(open)
    }

    const handleItemClick = () => {
        setIsOpen(false)
    }

    const CurrentContext = (
        <Link  href={contextRoot.url}>
            <Row className="items-center gap-2 px-2">
                <View className='rounded-full items-center justify-center'>
                    {contextRoot.image}
                </View>
                {!!contextRoot.name && (
                    <Text className="text-base font-semibold tracking-tight truncate">
                        {contextRoot.name}
                    </Text>
                )}
            </Row>
        </Link>
    )

    const DropDown = (
        <DropdownPopup
            trigger={
                <Row className="items-center justify-center w-12 h-12">
                    <Icon icon="ChevronDown" size={20} />
                </Row>
            }
            minPopupWidth={352}
            open={isOpen}
            onOpenChange={handleOpenChange}
        >
            <View className="flex-col gap-y-0.5">
                {data.list.map((item) =>
                    renderListItem(
                        item,
                        item.id === data.current?.id,
                        handleItemClick
                    )
                )}

                {data.links?.map((item) =>
                    item.url ? (
                        renderListItem_(
                            item.url,
                            item.title,
                            item.icon && (item.icon == '{logo}' ? appStatic('logo', { mode: 'mark', }) : 
                                <Icon
                                    icon={item.icon}
                                    size={20}
                                    className="w-5 h-5"
                                />
                            ),
                            contextRoot.url == item.url
                        )
                    ) : (
                        <View
                            key={Math.random()}
                            className="border-t border-bdr dark:border-bdr-d mt-1 pt-1"
                        />
                    )
                )}
            </View>
        </DropdownPopup>
    )

    if (mode === 'min') {
        return DropDown
    }

    return (
        <>
            {data?.list?.length > 0 || data?.links?.length > 0 ? (
                 <Row className=' items-center'> 
                 {!!contextRoot.name &&
                     appSetting('context_selector', 'logo') && (
                         <>
                             {(() => {
                                 const isActiveAppRoot = uri === 'home'
                                 return (
                                     <Link href="/">
                                         <Row
                                             className={` rounded-xl ${
                                                 isActiveAppRoot
                                                     ? ' bg-accent/0 text-accent-foreground/0 web:hover:bg-accent/0'
                                                     : ' web:hover:bg-muted/60'
                                             }`}
                                         >
                                             <View className="p-1.5 flex-row rounded-full items-center justify-center">
                                                 {appStatic('logo', { mode: 'mark', })}
                                             </View>
                                         </Row>
                                     </Link>
                                 )
                             })()}
                             <Icon
                                 icon="ChevronRight"
                                 size={20}
                                 className="w-5 h-5 text-muted-foreground"
                             />
                         </>
                     )}
                   
                    <ButtonsGroup variant="text" size="lg"  >
                        {CurrentContext}
                        {DropDown}
                    </ButtonsGroup> 
                </Row>
            ) : (
                CurrentContext
            )}
        </>
    )
}
