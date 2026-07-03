import { useMemo, useState, useCallback } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import ProfilesList from 'app/ui/molecules/profile_list';
import { Card } from 'app/ui/molecules/card';
import { Button, Modal } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { fetcher } from 'app/lib/fetcher';
import { cn } from 'app/lib/util';
import emitter from 'app/context/emitter';

const ACTION_TITLES = {
    set_completed: 'Complete',
};

function actionsToDropdownItems(actions = []) {
    return (actions || []).map((action) => ({
        id: action.name,
        name: action.name,
        title: ACTION_TITLES[action.name] || action.title || action.name,
        action,
    }));
}

async function runTaskAction(action, setFormBlock) {
    if (!action) return;

    if (action.type === 'modal') {
        const fetchedData = await fetcher('/api.php?r=' + action.callback);
        setFormBlock({
            content: fetchedData.data,
            designbox_id: 0,
            title: ACTION_TITLES[action.name] || action.title,
        });
        return;
    }

    if (action.type === 'callback') {
        await fetcher('/api.php?r=' + action.callback);
        if (action.on_callback === 'refresh' || action.on_callback === 'hide_row') {
            emitter.emit('page', { action: 'reload' });
        }
    }
}

export default function Unit({ data }) {
    const [formBlock, setFormBlock] = useState(null);
    const isCompleted = data?.class === 'completed';

    const handleFormClose = useCallback(() => {
        setFormBlock(null);
        emitter.emit('page', { action: 'reload' });
    }, []);

    const actionItems = useMemo(
        () => actionsToDropdownItems(data?.actions),
        [data?.actions]
    );

    const meta = [data?.type, data?.state, data?.priority, data?.time]
        .filter(Boolean)
        .join(' · ');

    return (
        <Card padding="p-3" className="web:hover:bg-muted/30 web:duration-300">
            {formBlock ? (
                <Modal
                    title={formBlock.title || ' '}
                    onVisible={!!formBlock}
                    onClose={() => setFormBlock(null)}
                >
                    <View className="px-4">
                        <BlockByData block={formBlock} onFormEmpty={handleFormClose} />
                    </View>
                </Modal>
            ) : null}

            <Row className="items-start gap-3">
                <View className="flex-auto min-w-0 gap-1">
                    <Link href={data.url} emulate>
                        <Text
                            numberOfLines={2}
                            className={cn(
                                'text-sm font-semibold leading-tight web:hover:text-foreground',
                                isCompleted
                                    ? 'text-muted-foreground line-through'
                                    : 'text-card-foreground'
                            )}
                        >
                            {data.title}
                        </Text>
                    </Link>

                    {meta ? (
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {meta}
                        </Text>
                    ) : null}
                </View>

                {data?.members?.length ? (
                    <ProfilesList data={data.members} maxCount={3} displaySize="xs" />
                ) : null}

                {actionItems.length ? (
                    <DropdownMenu
                        items={actionItems}
                        onSelect={(item) => runTaskAction(item.action, setFormBlock)}
                    >
                        <Button variant="text" size="sm" rounded startDecorator="Ellipsis" />
                    </DropdownMenu>
                ) : null}
            </Row>
        </Card>
    );
}
