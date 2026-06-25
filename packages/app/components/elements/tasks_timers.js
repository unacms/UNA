import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import BrowseSimple from 'app/components/elements/browse_simple';
import { getComponent } from 'app/components/registry';

const NoContent = getComponent('molecule', 'no_content');

export default function ElementTasksTimers({ data, blockWrapperProps }) {
    const sections = Array.isArray(data) ? data : [];
    const hasTimers = sections.some((section) => section?.timers?.length > 0);

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-6">
                {!hasTimers ? (
                    <NoContent endpoint={{ request_url: data.request_url, params: {} }} />
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
