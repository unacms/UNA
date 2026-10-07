import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import Profile from 'app/ui/molecules/profile/profile';
import { Card } from 'app/ui/molecules/page/card';
import { components } from 'app/components/registry';
import { UnitTitle } from 'app/components/units/helpers';

export default function Unit({ data: timerData }) {
    const TaskTimer = components['molecule']['task_timer'];
    const context = timerData?.context;

    if (!timerData) return null;

    return (
        <Card padding="p-3" className="web:hover:bg-muted/30 web:duration-300">
            <Row className="items-center gap-3">
                <View className="flex-auto min-w-0 gap-1">
                    <Link href={timerData.content_url}>
                        <UnitTitle title={timerData.content_title} />
                    </Link>
                </View>
                <TaskTimer data={timerData.timer} className="w-auto flex-none" />
            </Row>

            {context?.display_name ? (
                <Link href={context.url}>
                    <Row className="items-center gap-2">
                        <Profile
                            url_avatar={context.url_avatar}
                            display_name={context.display_name}
                            displayType="unit_wo_info"
                            displaySize="xs"
                        />
                        <Text numberOfLines={1} className="text-xs font-medium text-muted-foreground flex-auto">
                            {context.display_name}
                        </Text>
                    </Row>
                </Link>
            ) : null}
        </Card>
    );
}
