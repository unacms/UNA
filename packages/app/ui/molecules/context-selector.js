import { View, Row, Pressable, ScrollView } from 'app/design/view';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon';
import Profile from 'app/ui/molecules/profile'
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { useWindowDimensions } from 'react-native';
import { FeedbackHaptics, appSetting } from 'app/lib/util';
import { useState } from 'react';

function renderListItem(props, isActive, onItemClick) {
    return (
        <Link key={props.url} className="w-full" href={props.url} onPress={onItemClick}>
            <Row className={`w-full px-2 py-1.5 gap-x-3 active:bg-bgritem dark:active:bg-bgritem-d hover:bg-bgritem align-middle dark:hover:bg-bgritem-d rounded-xl items-center ${isActive ? ' bg-bgritemprimary dark:bg-bgritemprimary-d rounded-xl' : ''}`}>
                <View className={`items-center w-10 h-10 justify-center bg-bgritem border border-bdritem dark:bg-bgritem-d ${isActive ? 'border-primary-100 dark:border-primary-950' : ''} dark:border-bdritem-d rounded-full`}>
                    <Profile {...props} displayType="unit_wo_info" displaySize="base" />
                </View>
                <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{props.display_name}</Text>
            </Row>
        </Link>
    );
}



function getContextRoot(data) {
    if (!data.current?.id) {
        return {
            url: '/',
            image: appStatic('logo_mark'),
            name: appStatic('logo_text'),
        };
    } else {
        return {
            url: data.current.url,
            image: <Profile {...data.current} displayType="unit_wo_info" displaySize="base" />,
            name: data.current.display_name,
        };
    }
}

export default function ContextSelector({ data, url }) {

    const [isOpen, setIsOpen] = useState(false);

    if (!data) return null;

    const contextRoot = getContextRoot(data);

    if (url && (url != 'home' && data.list.filter(item => item.url == '/' + url).length == 0))
        return null;

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
            <View className=' flex-row gap-x-3 lg:px-2 p-1 lg:hover:bg-bgritem dark:lg:hover:bg-bgritem-d rounded-xl'>
                <View className="items-center justify-center text-neutral-800 dark:text-neutral-200">
                    {contextRoot.image}
                </View>
                <Text className="text-lg whitespace-nowrap font-semibold tracking-tight text-neutral-800 dark:text-neutral-200 my-auto truncate text-center items-center align-middle justify-center">{contextRoot.name}</Text>
            </View>
        </Link>
    )
    
    return (
        <>
            {(data?.list?.length > 1 || data?.links?.length > 0) ? <Row className=" w-full flex-auto items-center">
                {data.current?.id && <>
                    <Link href="/"><View className=' flex-row gap-x-3 lg:px-2 p-1 lg:hover:bg-bgritem dark:lg:hover:bg-bgritem-d rounded-xl'>
                        <View className="items-center justify-center text-neutral-800 dark:text-neutral-200">
                            {appStatic('logo_mark')}
                        </View>

                    </View></Link>

                    <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 px-4">/</Text></>}
                {CurrentContext}
                <DropdownPopup
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
                    <View>
                        {data.list.map(item => renderListItem(item, item.id === data.current?.id, handleItemClick))}
                        {!!data.create && <Link className="w-full" href={data.create.url} onPress={handleItemClick}>
                            <Row className="w-full px-2 py-1.5 gap-x-3 items-center hover:bg-bgritem dark:hover:bg-bgritem-d rounded-xl">
                                <View className="items-center w-10 h-10 text-neutral-800 dark:text-neutral-200 justify-center bg-bgritem border border-bdritem dark:bg-bgritem-d dark:border-bdritem-d rounded-full">
                                    <Icon icon="Plus" />
                                </View>
                                <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{data.create.title}</Text>
                            </Row>
                        </Link>}
                        {(data.links && Array.isArray(data.links)) && <View className='border-t border-bdr dark:border-bdr-d mt-2 pt-2'>
                            {data.links.map(item =>
                                <Link key={item.url} className="w-full" href={item.url} onPress={handleItemClick}>
                                    <Row className={`w-full px-2  gap-x-3 items-center rounded-xl py-1.5 hover:bg-bgritem dark:hover:bg-bgritem-d ${!data.current?.id && item.url == appSetting('context_selector', 'default_item') ? 'bg-bgritemprimary dark:bg-bgritemprimary-d  rounded-xl' : ''}`}>
                                        <View className="items-center w-10 h-10 text-neutral-800 dark:text-neutral-200 justify-center bg-bgritem border border-bdritem dark:bg-bgritem-d dark:border-bdritem-d rounded-full">
                                            {item.icon && <Icon icon={item.icon} />}
                                        </View>
                                        <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{item.title}</Text>
                                    </Row>
                                </Link>
                            )}
                        </View>
                        }
                    </View>
                </DropdownPopup></Row> : CurrentContext}
        </>
    );
}