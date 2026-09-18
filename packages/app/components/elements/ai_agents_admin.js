'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'app/design/view';
import { cn } from 'app/lib/util';
import { BlockWrapper } from 'app/components/block-wrapper';
import { components } from 'app/components/registry';
import { lazyComponent } from 'app/lib/lazy-component';
import { useLocalSearchParams } from 'app/lib/hooks/router';
import { hiddenFirstMessageFromData } from 'app/ui/molecules/ai-agent/hidden-first-message';

// Operators only — the server returns an empty block for everyone else — so keep it out of the main chunk.
// The chat widget's default frame (AiAgent `height`); the list tab takes the same one so the block does not jump.
const TAB_HEIGHT = 'h-[28rem]';

const AiAgentsAdmin = lazyComponent(() => import('app/ui/molecules/ai-agents-admin'), { name: 'AiAgentsAdmin' });

/**
 * `system/get_block_ai_agents_admin` — one block with two tabs in its header:
 * the operator chat (`data.chat`, the same payload as the `ai_agent` block) and
 * the agents list. With no operator agent configured only the list is shown.
 *
 * Both tabs stay mounted once opened, so switching does not lose a half-typed
 * message or an expanded history, and both share one frame height — the list
 * scrolls inside it — so the block keeps its size when the tab changes.
 */
export default function ElementAiAgentsAdmin({ data, blockWrapperProps }) {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const chat = data?.chat && typeof data.chat === 'object' ? data.chat : null;
    const [tab, setTab] = useState(chat ? 'chat' : 'agents');
    const [opened, setOpened] = useState(() => ({ [chat ? 'chat' : 'agents']: true }));

    const select = useCallback((name) => {
        setTab(name);
        setOpened((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
    }, []);

    // The header switcher is the block menu; BlockWrapper renders `onPress` items as buttons.
    const base = blockWrapperProps?.block;
    const block = base && chat
        ? {
              ...base,
              menu: {
                  items: [
                      { name: 'chat', title: data.chat_title || t('operator_agent_title'), pressed: tab === 'chat', onPress: () => select('chat') },
                      { name: 'agents', title: t('agents_admin_tab'), pressed: tab === 'agents', onPress: () => select('agents') },
                  ],
              },
          }
        : base;

    const AiAgent = components['molecule']['ai_agent'];
    const initialMessage = chat ? hiddenFirstMessageFromData(chat, params) : '';
    const chatAgentId = chat?.agent_id ?? '';
    const chatContextPid = Number(chat?.context_profile_id) || 0;

    return (
        <BlockWrapper {...blockWrapperProps} block={block}>
            {chat && opened.chat ? (
                <View className={tab === 'chat' ? '' : 'hidden'}>
                    <AiAgent
                        key={`${chatAgentId}:${chatContextPid}`}
                        data={chat}
                        initialMessage={initialMessage}
                        hideInitialMessage={!!initialMessage}
                        historyAlways
                    />
                </View>
            ) : null}
            {opened.agents && chat ? (
                <ScrollView className={cn(TAB_HEIGHT, tab === 'agents' ? '' : 'hidden')} contentContainerClassName="pr-1 pb-1">
                    <AiAgentsAdmin data={data} />
                </ScrollView>
            ) : null}
            {opened.agents && !chat ? <AiAgentsAdmin data={data} /> : null}
        </BlockWrapper>
    );
}
