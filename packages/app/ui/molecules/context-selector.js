import { View, Row, Pressable } from 'app/design/view';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import { Button } from 'app/design/controls'
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
    const isSelected = !!current?.display_name;
    return (
        <Button startDecorator={isSelected ? <Profile {...current} displayType="unit_wo_info" displaySize="sm" /> : "Compass"} variant="text" ize="lg" title={isSelected ? current.display_name : 'Discover'} endDecorator="ChevronsUpDown" />

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