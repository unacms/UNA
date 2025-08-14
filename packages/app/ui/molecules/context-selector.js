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
    return renderListItem_(props.url, props.display_name, <Profile {...props} displayType="unit_wo_info" displaySize="base" />, isActive)
}

function renderListItem_(url, text, icon, isActive) {
    return (
        <Link key={url} className="w-full" href={url}>
            <Row className={`w-full px-1 web:active:bg-bgritem web:dark:active:bg-bgritem-d web:hover:bg-bgritem web:dark:hover:bg-bgritem-d rounded-xl justify-between items-center ${isActive ? ' bg-bgritemprimary dark:bg-bgritemprimary-d rounded-xl' : ''}`}>
                <Row className='items-center'><View className={`items-center w-12 h-12 justify-center ${isActive ? 'border-primary/20 ' : ''} dark:border-bdritem-d rounded-full`}>
                    {icon}
                </View>
                <Text className="text-base px-1.5 font-semibold text-neutral-800 dark:text-neutral-200">{text}</Text>
                </Row>
                {isActive && <View className='rounded-full bg-primary h-2 w-2 mr-4'></View>}
            </Row>
        </Link>
    );
}

function getContextRoot(data, url, uri) {
    const link = data.links?.find(item => item.url?.includes('/' + url));
    if (link) {
        return {
            url: link.url,
            image: <Icon icon={link.icon} />,
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
        image: <Profile {...data.current} displayType="unit_wo_info" displaySize="base" />,
        name: data.current.display_name,
    };
    
}

export default function ContextSelector({ data, url, uri, mode }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!data) return null;

    const contextRoot = getContextRoot(data, url, uri);

    // if (url && (url != 'home' && data.list.filter(item => item.url == '/' + url).length == 0))
    //    return null;

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
            <View className=' flex-row lg:hover:bg-bgritem dark:lg:hover:bg-bgritem-d rounded-xl sm:px-1'>
                <View className="items-center p-1  justify-center text-neutral-800 dark:text-neutral-200">
                    {contextRoot.image}
                </View>
                {!!contextRoot.name && <Text className="text-base px-2 font-semibold tracking-tight text-neutral-800 dark:text-neutral-200 my-auto truncate text-center items-center align-middle justify-center flex-auto">{contextRoot.name}</Text>}
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
                item.url ? (renderListItem_(item.url, item.title, (item.icon && <Icon icon={item.icon} />), contextRoot.url == item.url)) : (<View
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
                    <Link href="/"><View className=' flex-row  sm:px-1 lg:hover:bg-bgritem dark:lg:hover:bg-bgritem-d rounded-xl'>
                        <View className="items-center justify-center p-1 text-neutral-800 dark:text-neutral-200">
                            {appStatic('logo', { mode: 'mark' })}
                        </View>

                    </View></Link>
                    <Icon icon="ChevronRight" className="text-base font-semibold text-neutral-400 dark:text-neutral-600" /></>}
                {CurrentContext}
                {DropDown}
            </Row> : CurrentContext}
        </>
    );
}