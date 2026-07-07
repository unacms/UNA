import { useEffect, useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import BrowseSimple from 'app/components/elements/browse_simple';
import { Button } from 'app/design/controls';
import { getComponent } from 'app/components/registry';
import { fetcher } from 'app/lib/fetcher';
import emitter from 'app/context/emitter';

function getSections(data) {
    if (Array.isArray(data?.sections)) return data.sections;
    if (Array.isArray(data)) return data;
    return [];
}

function removeTimerById(prev, timerId) {
    const sections = getSections(prev)
        .map((section) => ({
            ...section,
            timers: (section.timers || []).filter(
                (item) => item?.timer?.id !== timerId
            ),
        }))
        .filter((section) => section.timers?.length > 0);

    return { ...prev, sections };
}

export default function ElementTasksTimers({ data, blockWrapperProps }) {
    const [timersData, setTimersData] = useState(data);

    const NoContent = getComponent('molecule', 'no_content');

    const sections = getSections(timersData);
    const globalActions = timersData?.actions?.items || [];
    const hasTimers = sections.some((section) => section?.timers?.length > 0);

    useEffect(() => {
        setTimersData(data);
    }, [data]);

    useEffect(() => {
        const subscription = emitter.addListener('task_timer', (event) => {
            if (event.action === 'log' || event.action === 'clear') {
                setTimersData((prev) => removeTimerById(prev, event.id));
            }
        });

        return () => subscription.remove();
    }, []);

    async function runGlobalAction(item) {
        const requestUrl = item?.data?.request_url;
        if (!requestUrl) return;

        await fetcher('/api.php?r=' + requestUrl);
        setTimersData((prev) => ({ ...prev, sections: [] }));
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-6">
                {(globalActions.length > 0 && hasTimers) ? (
                    <Row className="flex-wrap items-center justify-end gap-2 px-2">
                        {globalActions.map((item) => (
                            <Button
                                key={item.name}
                                size="sm"
                                variant="default"
                                title={item.title || item.name}
                                onPress={() => runGlobalAction(item)}
                            />
                        ))}
                    </Row>
                ) : null}

                {!hasTimers ? (
                    <NoContent endpoint={{ request_url: data?.request_url, params: {} }} />
                ) : (
                    sections.map((section, sectionIndex) => {
                        const timers = section?.timers || [];
                        if (!timers.length) return null;

                        return (
                            <View
                                key={section.section_title || `section-${sectionIndex}`}
                                className="gap-2"
                            >
                                {section.section_title ? (
                                    <Text className="px-2 text-base font-semibold tracking-tight text-muted-foreground">
                                        {section.section_title}
                                    </Text>
                                ) : null}

                                <BrowseSimple
                                    data={{
                                        data: timers,
                                        unit: 'general-content-list',
                                        module: 'bx_tasks_timer',
                                    }}
                                    blockWrapperProps={{ block: { designbox_id: null } }}
                                />
                            </View>
                        );
                    })
                )}
            </View>
        </BlockWrapper>
    );
}
