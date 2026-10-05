import { useEffect, useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import BrowseSimple from 'app/components/elements/browse-simple';
import { Button } from 'app/design/controls';
import { components } from 'app/components/registry';
import { fetcher } from 'app/lib/fetcher';
import emitter, { EVENTS } from 'app/context/emitter';

/** Payload is either `{ sections: [...] }` or a bare sections array. */
function getSections(data) {
    if (Array.isArray(data?.sections)) return data.sections;
    if (Array.isArray(data)) return data;
    return [];
}

function removeTimer(prev, timerId) {
    const sections = getSections(prev)
        .map((section) => ({
            ...section,
            timers: (section.timers || []).filter((item) => item?.timer?.id !== timerId),
        }))
        .filter((section) => section.timers.length > 0);
    return { ...prev, sections };
}

export default function ElementTasksTimers({ data, blockWrapperProps }) {
    const NoContent = components['molecule']['no_content'];
    const [timersData, setTimersData] = useState(data);

    // Fresh block data (page reload) replaces the locally pruned copy.
    const [seenData, setSeenData] = useState(data);
    if (seenData !== data) {
        setSeenData(data);
        setTimersData(data);
    }

    useEffect(() => {
        // A logged / cleared timer disappears from the list without a refetch.
        const subscription = emitter.addListener(EVENTS.taskTimer, (event) => {
            if (event.action === 'log' || event.action === 'clear') {
                setTimersData((prev) => removeTimer(prev, event.id));
            }
        });
        return () => subscription.remove();
    }, []);

    const sections = getSections(timersData).filter((section) => section?.timers?.length > 0);
    const globalActions = timersData?.actions?.items || [];

    const runGlobalAction = async (item) => {
        const requestUrl = item?.data?.request_url;
        if (!requestUrl) return;
        await fetcher('/api.php?r=' + requestUrl);
        setTimersData((prev) => ({ ...prev, sections: [] }));
    };

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-6">
                {globalActions.length > 0 && sections.length > 0 ? (
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

                {sections.length === 0 ? (
                    <NoContent endpoint={{ request_url: data?.request_url, params: {} }} />
                ) : (
                    sections.map((section, index) => (
                        <View key={section.section_title || `section-${index}`} className="gap-2">
                            {section.section_title ? (
                                <Text className="px-2 text-base font-semibold tracking-tight text-muted-foreground">
                                    {section.section_title}
                                </Text>
                            ) : null}
                            <BrowseSimple
                                data={{
                                    data: section.timers,
                                    unit: 'general-content-list',
                                    module: 'bx_tasks_timer',
                                }}
                                blockWrapperProps={{ block: { designbox_id: null } }}
                            />
                        </View>
                    ))
                )}
            </View>
        </BlockWrapper>
    );
}
