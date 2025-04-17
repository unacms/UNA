import { View, Row, Pressable } from 'app/design/view';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import Image from 'app/ui/atoms/image';
import { Icon } from 'app/ui/atoms/icon';
import Profile from 'app/ui/molecules/profile'

function renderListItem(props) {
    return (
        <Link key={props.url} className="w-full" href={props.url}>
            <Row className="w-full p-2 gap-x-2 items-center">
                <Profile {...props} displayType="unit_wo_info" displaySize="sm" />
                <Text className="text-lg">{props.display_name}</Text>
            </Row>
        </Link>
    );
}

function renderTrigger(current) {

    return (
        <Row className="  h-12  px-2 items-center rounded-xl ">
            {current?.display_name ? (
                <>
                    <Profile {...current} displayType="unit_wo_info" displaySize="sm" />
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