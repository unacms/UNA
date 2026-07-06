import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import Profile from 'app/ui/molecules/profile';
import { Card } from 'app/ui/molecules/card';
import { getComponent } from 'app/components/registry';

export default function Unit({ data }) {
    const TaskTimer = getComponent('molecule', 'task_timer');
    const context = data?.context;

    return (
        <Card padding="p-3" className="web:hover:bg-muted/30 web:duration-300">
            {context?.display_name ? (
                <Link href={context.url} emulate>
                    <Row className="items-center gap-2 mb-2">
                        <Profile
                            url_avatar={context.url_avatar}
                            display_name={context.display_name}
                            displayType="unit_wo_info"
                            displaySize="xs"
                        />
                        <Text
                            numberOfLines={1}
                            className="text-xs font-medium text-muted-foreground flex-auto"
                        >
                            {context.display_name}
                        </Text>
                    </Row>
                </Link>
            ) : null}

            <Row className="items-center gap-3">
                <View className="flex-auto min-w-0 gap-1">
                    <Link href={data.content_url} emulate>
                        <Text
                            numberOfLines={2}
                            className="text-sm font-semibold text-card-foreground web:hover:text-foreground leading-tight"
                        >
                            {data.content_title}
                        </Text>
                    </Link>
                </View>

                <TaskTimer data={data?.timer} className="w-auto flex-none" />
            </Row>
        </Card>
    );
}
