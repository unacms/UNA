import ConvosListItem from 'app/components/elements/chat/parts/convos-list-item';
import { useCurrentUser } from 'app/context/user';
import { stripTags } from 'app/lib/util';

export default function ({ item, index, changeConvo, selectedIndex }) {
    const { currentUser } = useCurrentUser();
    const participants = item.participants.filter(p => p.id != currentUser.id);

    return (
        <ConvosListItem
            profile={participants[0]}
            title={participants.map(p => p.display_name).join(', ')}
            time={item.date}
            preview={stripTags(item.message)}
            unread={item.unread}
            extraCount={participants.length > 1 ? participants.length - 1 : 0}
            selected={selectedIndex == index}
            onPress={() => changeConvo(item)}
        />
    );
}
