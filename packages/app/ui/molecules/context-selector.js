import { View, Row, Pressable } from 'app/design/view';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import Image from 'app/ui/atoms/image';
import { Icon } from 'app/ui/atoms/icon';

function renderListItem({ url, url_avatar, display_name }) {
    return (
        <Link key={url} className="w-full" href={url}>
            <Row className="w-full p-2">
                <View className="h-8 aspect-square mr-2 rounded-full overflow-hidden">
                    {!!url_avatar && (
                        <Image src={url_avatar} view="cover" className="rounded-full" />
                    )}
                </View>
                <Text className="text-lg">{display_name}</Text>
            </Row>
        </Link>
    );
}

function renderTrigger(current) {

    return (
        <Row className=" ml-2 h-12 hover:bg-neutral-500/10 px-1 items-center rounded-xl ">
            {current?.display_name ? (
                <>
                    <View className="h-10 w-10 rounded-full overflow-hidden">
                    {!!current?.url_avatar && (
                        <Image src={current?.url_avatar} view="cover"  />
                    )}
                    </View>
                    <Text className="text-lg font-semibold ml-2">{current.display_name}</Text>
                    <View className="h-10 w-10 ml-2 aspect-square p-2 justify-center hover:bg-gray-500/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-full">
                        <Icon icon="ChevronsUpDown" />
                    </View>
                </>
            ) : (
                <>
                    <View className="h-10 w-10 items-center justify-center text-neutral-600 dark:text-neutral-300 bg-neutral-500/10 rounded-full overflow-hidden">
                     <Icon icon="Compass" />
                    </View>
                    <Text className="text-lg font-semibold ml-2 text-neutral-600 dark:text-neutral-300">Discover</Text>
                    <View className="h-10 w-10 ml-2 aspect-square p-2 justify-center hover:bg-gray-500/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-full">
                        <Icon icon="ChevronsUpDown" />
                    </View>
                </>
            )}
        </Row>
    );
}

export default function ContextSelector({ data }) {
    if (!data) return null;

    return (
        <View className="max-w-xs">
            <DropdownPopup
                trigger={renderTrigger(data.current)}
                popupWidth={256}
            >
                <View>
                    {data.list.map(renderListItem)}
                    <Link className="w-full" href={data.create.url}>
                        <Row className="w-full p-2">
                            <View className="h-8 aspect-square mr-2">
                                <Icon icon="Plus" />
                            </View>
                            <Text className="text-lg">{data.create.title}</Text>
                        </Row>
                    </Link>
                </View>
            </DropdownPopup>
        </View>
    );
}