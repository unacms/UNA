import { View, Row, Pressable } from 'app/design/view';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon';
import Profile from 'app/ui/molecules/profile'
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';

function renderListItem(props, isActive) {
    return (
        <Link key={props.url} className="w-full" href={props.url}>
            <Row className={`w-full p-2 gap-x-3 hover:bg-bgritem dark:hover:bg-bgritem rounded-xl items-center ${isActive ? ' bg-bgritemprimary dark:bg-bgritemprimary-d rounded-xl' : ''}`}>
                <View className={`items-center w-10 h-10  justify-center bg-bgritem border border-bdr dark:bg-bgritem-d ${isActive ? 'border-primary/50 dark:border-primary-d/50' : ''} dark:border-bdr-dark rounded-full`}>
                    <Profile {...props} displayType="unit_wo_info" displaySize="base" />
                </View>
                <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">{props.display_name}</Text>
            </Row>
        </Link>
    );
}

function renderLogoListItem(isActive) {
    return (
        <Link key="global-context" className="w-full" href="/">
            <Row className={`w-full p-2 gap-x-3 hover:bg-bgritem dark:hover:bg-bgritem rounded-xl items-center ${isActive ? 'bg-bgritemprimary dark:bg-bgritemprimary-d  rounded-xl' : ''}`}>
                <View className={`items-center w-10 h-10 justify-center ${isActive ? 'border-primary/50 dark:border-primary-d/50' : ''} rounded-full`}>{appStatic('logo_mark')}</View>
                <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Discover</Text>
            </Row>
        </Link>
    );
}

function getContextRoot(data, currentUser) {
    if (!data.current?.id) {
        // Global context
        return {
            url: '/',
            image: appStatic('logo_mark'),
            name: 'Discover',
        };
    } else {
        // Space context
        return {
            url: data.current.url,
            image: <Profile {...data.current} displayType="unit_wo_info" displaySize="base" />,
            name: data.current.display_name,
        };
    }
}

function renderTrigger() {
    return (
        <Button
            variant="text"
            size="sm"
            ring="p-1"
            rounded
            endDecorator="ChevronsUpDown"
        />
    );
}

export default function ContextSelector({ data, url }) {
    const { currentUser } = useCurrentUser();
    if (!data) return null;

    const contextRoot = getContextRoot(data, currentUser);

    console.log("uri", url, data.list.filter(item => item.url == '/' + url).length > 0)
    if (url && (url != 'home' && data.list.filter(item => item.url == '/' + url).length == 0))
        return null;

    return (
        <View className="flex-row items-center ">
            <Link href={contextRoot.url} >
                <View className='flex-row items-center gap-x-1 items-center px-1.5 py-1 gap-x-2 web:group w-full flex-auto hover:bg-bgritem-h dark:hover:bg-bgritem-h rounded-xl'>
                    <View className="items-center w-10 h-10 justify-center ">
                        {contextRoot.image}
                    </View>
                    <Text className="text-lg px-2 whitespace-nowrap leading-[20px] font-semibold text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200">{contextRoot.name}</Text></View>
            </Link>
            <View>
                <DropdownPopup
                    trigger={renderTrigger()}
                    minPopupWidth={352}
                >
                    <View>
                        {renderLogoListItem(!data.current?.id)}
                        {data.list.map(item => renderListItem(item, item.id === data.current?.id))}
                        <Link className="w-full" href={data.create.url}>
                            <Row className="w-full p-2 gap-x-3 items-center">
                                <View className="items-center w-10 h-10 p-1 justify-center bg-bgritem border border-bdr dark:bg-bgritem-d dark:border-bdr-dark rounded-[10px]">
                                    <Icon icon="Plus" />
                                </View>
                                <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">{data.create.title}</Text>
                            </Row>
                        </Link>
                    </View>
                </DropdownPopup>
            </View>
        </View>
    );
}