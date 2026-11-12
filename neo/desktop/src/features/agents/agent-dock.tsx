/**
 * The agent chats' end of the bottom bar, as Linear has it: a tab for each chat open in this
 * window (a disclosure: it shows its panel, or puts it back), the Agent button (a new chat with
 * the network's default agent) and Chat history (a menu of the earlier chats). None of it is
 * drawn where the network offers this viewer no agent (GET /agents: no `default_id`, or a site
 * without the route).
 */
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { Icon } from '../../components/icon';
import { Tooltip } from '../../components/tooltip';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { showMenu, useMenuExpanded } from '../../lib/native-menu';
import { agentChatsKey, chatTitle, defaultAgent, type OpenChat, openChatKey, startChat, useAgentChats, useAgents, useOpenChats } from './agents';

/** The id of a chat's tab (focus goes back to it when its panel is minimised). */
export const agentTabId = (c: Pick<OpenChat, 'agentId' | 'chatId'>) => `agent-tab-${c.agentId}-${c.chatId}`;
/** The id of a chat's panel (its tab controls it). */
export const agentPanelId = (c: Pick<OpenChat, 'agentId' | 'chatId'>) => `agent-panel-${c.agentId}-${c.chatId}`;
export const AGENT_BUTTON_ID = 'agent-new-chat';

export function AgentDock() {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const announce = useWindowAnnounce();
    const agent = defaultAgent(useAgents());
    const store = useOpenChats();
    const chats = useAgentChats(agent?.id ?? null);
    const history = useRef<HTMLButtonElement>(null);
    const expanded = useMenuExpanded('agent-history');
    const [starting, setStarting] = useState(false);

    if (!agent || !store) return null;
    const shown = store.shown;

    const startNew = () => {
        if (starting) return;
        setStarting(true);
        startChat(api, agent.id)
            .then((chat) => {
                store.show({
                    agentId: agent.id,
                    chatId: chat.id,
                    title: chat.title,
                });
                void queryClient.invalidateQueries(agentChatsKey(agent.id));
            })
            .catch((e: unknown) => announce(t('Could not start a chat: {{reason}}', { reason: errorMessage(e) })))
            .finally(() => setStarting(false));
    };

    const openHistory = () => {
        const el = history.current;
        if (!el) return;
        const list = chats.data ?? [];
        void showMenu(
            list.length
                ? list.map((c) => ({
                      text: chatTitle(c.title),
                      checked: shown ? openChatKey(shown) === openChatKey({ agentId: agent.id, chatId: c.id }) : undefined,
                      run: () =>
                          store.show({
                              agentId: agent.id,
                              chatId: c.id,
                              title: c.title,
                          }),
                  }))
                : [
                      {
                          text: chats.isLoading ? t('Loading…') : t('No chats yet'),
                          enabled: false,
                          run: () => {},
                      },
                  ],
            { anchor: el },
            { label: t('Chat history'), owner: 'agent-history' },
        ).catch((e: unknown) => console.error('menu', e));
    };

    return (
        <div className="agent-dock" role="group" aria-label={t('Chats with {{name}}', { name: agent.title })}>
            {store.open.length ? (
                <ul className="agent-tabs">
                    {store.open.map((c) => {
                        const isShown = !!shown && openChatKey(shown) === openChatKey(c);
                        const title = chatTitle(c.title);
                        return (
                            <li key={openChatKey(c)} className="agent-tab" data-shown={isShown || undefined}>
                                <button
                                    type="button"
                                    id={agentTabId(c)}
                                    className="agent-tab-button"
                                    aria-expanded={isShown}
                                    aria-controls={agentPanelId(c)}
                                    title={title}
                                    onClick={() => store.toggle(c)}
                                >
                                    <span className="agent-tab-dot" aria-hidden="true" />
                                    <span className="truncate">{title}</span>
                                </button>
                                <Tooltip text={t('Close {{title}}', { title })}>
                                    <button
                                        type="button"
                                        className="agent-tab-close"
                                        aria-label={t('Close {{title}}', { title })}
                                        onClick={() => {
                                            store.close(c);
                                            requestAnimationFrame(() => document.getElementById(AGENT_BUTTON_ID)?.focus());
                                        }}
                                    >
                                        <Icon name="x" size={14} />
                                    </button>
                                </Tooltip>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
            <Tooltip text={t('New chat with {{name}}', { name: agent.title })}>
                <button type="button" id={AGENT_BUTTON_ID} className="agent-button" onClick={startNew} aria-busy={starting || undefined}>
                    <Icon name="bot" size={20} />
                    <span>{t('Agent')}</span>
                </button>
            </Tooltip>
            <Tooltip text={t('Chat history')}>
                <button
                    ref={history}
                    type="button"
                    className="tb-btn tb-btn-lg agent-history"
                    aria-label={t('Chat history')}
                    aria-haspopup="menu"
                    aria-expanded={expanded}
                    onClick={openHistory}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            openHistory();
                        }
                    }}
                >
                    <Icon name="history" size={20} />
                </button>
            </Tooltip>
        </div>
    );
}
