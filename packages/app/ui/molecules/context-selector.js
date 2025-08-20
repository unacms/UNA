import { View, Row } from 'app/design/view';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon';
import Profile from 'app/ui/molecules/profile'
import { appStatic } from 'app/lib/app-static';
import { FeedbackHaptics, appSetting } from 'app/lib/util';
import { useState } from 'react';

function renderListItem(props, isActive, onItemClick) {
    return renderListItem_(props.url, props.display_name, <Profile {...props} displayType="unit_wo_info" displaySize="sm" />, isActive)
}

function renderListItem_(url, text, icon, isActive) {
    return (
        <Link key={url} className="w-full" href={url}>
            <Row className={`w-full px-0.5 active:bg-secondary web:hover:bg-muted/60 rounded-xl justify-between items-center ${isActive ? ' bg-accent text-accent-foreground rounded-xl' : ''}`}>
                <Row className='items-center p-1.5'>
                    <View className={`items-center w-9 h-9  justify-center ${isActive ? ' bg-primary text-primary-foreground  ' : ' bg-secondary/80'} rounded-full`}>
                        {icon}
                    </View>
                    <Text className="text-base p-1.5 font-semibold text-popover-foreground">{text}</Text>
                </Row>
                {isActive && <View className='rounded-full bg-primary text-primary-foreground h-2 w-2 mr-4'></View>}
            </Row>
        </Link>
    );
}

function getContextRoot(data, url, uri) {
    const link = data.links?.find(item => item.url?.includes('/' + url));
    if (link) {
        return {
            url: link.url,
            image: <Icon icon={link.icon} size={20} className="w-5 h-5" />,
            name: link.title,
        };
    }

    if (!data.current?.id) {
        return {
            url: '/',
            image: appStatic('logo'),
            name: false,
        };
    }

    return {
        url: data.current.url,
        image: <Profile {...data.current} displayType="unit_wo_info" displaySize="sm" />,
        name: data.current.display_name,
    };

}

export default function ContextSelector({ data, url, uri, mode }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!data) return null;

    const contextRoot = getContextRoot(data, url, uri);

    const handleOpenChange = (open) => {
        if (open && !isOpen) {
            FeedbackHaptics('Medium');
        }
        setIsOpen(open);
    };

    const handleItemClick = () => {
        setIsOpen(false);
    };

    const CurrentContext = (
        <Link href={contextRoot.url}>
            <View className=' flex-row web:hover:bg-muted/60 rounded-xl overflow-hidden max-w-56 sm:max-w-none'>
                <View className=' px-2 py-1.5 flex-row rounded-full items-center justify-center'>
                    <View className='  rounded-full items-center justify-center'>{contextRoot.image}</View>
                </View>
                {!!contextRoot.name && <Text className="text-base font-semibold tracking-tight text-secondary-foreground my-auto truncate p-1.5">{contextRoot.name}</Text>}
            </View>
        </Link>
    )

    const DropDown = <DropdownPopup
        trigger={
            <Button
                variant="text"
                size="base"
                rounded
                ring
                startDecorator="ChevronDown"
            />
        }
        minPopupWidth={352}
        open={isOpen}
        onOpenChange={handleOpenChange}
    >
        <View className='flex-col gap-y-0.5'>
            {data.list.map(item => renderListItem(item, item.id === data.current?.id, handleItemClick))}

            {data.links?.map(item =>
                item.url ? (renderListItem_(item.url, item.title, (item.icon && <Icon icon={item.icon} size={20} className="w-5 h-5" />), contextRoot.url == item.url)) : (<View
                    key={Math.random()}
                    className="border-t border-bdr dark:border-bdr-d mt-1 pt-1"
                />)
            )}


        </View>
    </DropdownPopup>

    if (mode === 'min') {
        return DropDown
    }

    return (
        <>
            {(data?.list?.length > 0 || data?.links?.length > 0) ? <Row className=" w-full flex-auto items-center">
                {(!!contextRoot.name && appSetting('context_selector', 'logo')) && <>
                    <Link href="/"><Row className=' web:hover:bg-muted/60 rounded-xl '>
                        <View className='p-1.5 flex-row rounded-full items-center justify-center'>
                            {appStatic('logo', { mode: 'mark' })}
                        </View>
                    </Row></Link>
                    <Icon icon="ChevronRight" size={20} className="w-5 h-5 text-muted-foreground" /></>}
                {CurrentContext}
                {DropDown}
            </Row> : CurrentContext}
        </>
    );
}