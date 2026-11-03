<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Task hints: the links the App shows above the chat composer of an agent block
 * with `show_hints` on (get_block_ai_agent params). Each one is a message sent to the chat.
 *
 * They do not come from the conversation or a model: the module the chat is about
 * builds them from its data, with its `get_chat_hints` service:
 *
 *   serviceGetChatHints($iAgentId, $iContextPid) => [['type' => 'reply', 'label' => ..], ...]
 *
 * Which module: the one of the chat context profile (e.g. a project on its page);
 * without a context, the module which answers for this agent at all (it knows its
 * own agent, e.g. `bx_projects_agent_id`). A module returns a non-array for an agent
 * or context that is not its own.
 *
 * When its data changes, the module calls notify(): the open chats of that agent
 * and user get the `hints` event on `sys_agent_{agent id}_{profile id}` and ask
 * for their hints again (GET sys-ai-chat/{agent id}?hints=1). The event carries no
 * data: every chat asks with its own context.
 */
class BxDolAiChatHints
{
    const SERVICE = 'get_chat_hints';

    /** Hints shown at most. */
    const MAX_HINTS = 4;

    /**
     * @param array $aAgent agent row
     * @param int $iContextPid chat context profile id, 0 = none
     * @return array<int, array<string, mixed>> sanitized hints
     */
    public static function get($aAgent, $iContextPid = 0)
    {
        if (!is_array($aAgent) || empty($aAgent['id'])) {
            return [];
        }

        $aHints = [];
        foreach (static::modulesFor((int)$iContextPid) as $sModule) {
            $mixed = static::askModule($sModule, (int)$aAgent['id'], (int)$iContextPid);
            if (is_array($mixed)) {
                $aHints = $mixed;
                break;
            }
        }

        return array_slice(BxDolAiChatUi::getInstance()->sanitizeChatActions($aHints), 0, self::MAX_HINTS);
    }

    /**
     * Data behind the hints of this agent changed for this user: tell the open chats.
     */
    public static function notify($iAgentId, $iProfileId)
    {
        $iAgentId = (int)$iAgentId;
        $iProfileId = (int)$iProfileId;
        $oSockets = BxDolSockets::getInstance();
        if ($iAgentId > 0 && $iProfileId > 0 && $oSockets && $oSockets->isEnabled()) {
            $oSockets->sendEvent('sys_agent_' . $iAgentId, $iProfileId, 'hints', '{}');
        }
    }

    /**
     * Modules to ask, in order: the one of the context profile, or every enabled module.
     *
     * @return string[]
     */
    protected static function modulesFor($iContextPid)
    {
        if ($iContextPid > 0) {
            $oProfile = BxDolProfile::getInstance($iContextPid);
            return $oProfile ? [$oProfile->getModule()] : [];
        }

        $aModules = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules']) as $aModule) {
            if (!empty($aModule['enabled'])) {
                $aModules[] = $aModule['name'];
            }
        }

        return $aModules;
    }

    /**
     * @return array|null the module's hints; null when it has no such service or the agent is not its own
     */
    protected static function askModule($sModule, $iAgentId, $iContextPid)
    {
        if (!BxDolRequest::serviceExists($sModule, self::SERVICE)) {
            return null;
        }

        $mixed = bx_srv($sModule, self::SERVICE, [$iAgentId, $iContextPid]);
        return is_array($mixed) ? $mixed : null;
    }
}

/** @} */
