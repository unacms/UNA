<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiChatUi
{
    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new self();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function storedChatJsonToUiMessages($sJson)
    {
        $aStored = json_decode((string)$sJson, true);
        if (!is_array($aStored) || $aStored === [])
            return [];

        $aResult = [];
        $i = 0;
        foreach ($aStored as $aMessage) {
            if (!is_array($aMessage))
                continue;

            $sType = (string)($aMessage['type'] ?? '');
            if ($sType === 'tool_call' || $sType === 'tool_call_result')
                continue;

            $sRole = (string)($aMessage['role'] ?? '');
            if ($sRole === 'model')
                $sRole = 'assistant';
            if ($sRole !== 'user' && $sRole !== 'assistant')
                continue;

            $aParts = [];
            $mixedContent = $aMessage['content'] ?? '';
            if (is_string($mixedContent) && $mixedContent !== '') {
                $aParts[] = ['type' => 'text', 'content' => $mixedContent];
            } elseif (is_array($mixedContent)) {
                foreach ($mixedContent as $aBlock) {
                    if (!is_array($aBlock))
                        continue;
                    $sBlockType = (string)($aBlock['type'] ?? '');
                    $sBlockText = (string)($aBlock['content'] ?? '');
                    if ($sBlockText === '')
                        continue;
                    if ($sBlockType === 'text' || $sBlockType === '')
                        $aParts[] = ['type' => 'text', 'content' => $sBlockText];
                }
            }
            $sId = '';
            if (!empty($aMessage['__id']) && is_string($aMessage['__id']))
                $sId = $aMessage['__id'];
            elseif (!empty($aMessage['metadata']['__id']) && is_string($aMessage['metadata']['__id']))
                $sId = $aMessage['metadata']['__id'];

            $mixedActions = $aMessage['actions'] ?? ($aMessage['metadata']['actions'] ?? null);
            $aUi = $this->finalizeUiChatMessage($sId !== '' ? $sId : ('msg_' . $i), $sRole, $aParts, $mixedActions);
            if (!$aUi)
                continue;

            $aResult[] = $aUi;
            $i++;
        }

        return $aResult;
    }

    /**
     * @param NeuronAI\Chat\Messages\Message[] $aMessages
     * @return array<int, array<string, mixed>>
     */
    public function neuronMessagesToUiMessages($aMessages)
    {
        $aResult = [];
        $i = 0;

        foreach ($aMessages as $oMessage) {
            if (
                $oMessage instanceof NeuronAI\Chat\Messages\ToolCallMessage
                || $oMessage instanceof NeuronAI\Chat\Messages\ToolResultMessage
            ) {
                continue;
            }

            $sRole = $oMessage->getRole();
            if ($sRole === 'model')
                $sRole = 'assistant';
            if ($sRole !== 'user' && $sRole !== 'assistant')
                continue;

            $aParts = [];
            foreach ($oMessage->getContentBlocks() as $oBlock) {
                if ($oBlock instanceof NeuronAI\Chat\Messages\ContentBlocks\ReasoningContent) {
                    if ($oBlock->content !== '')
                        $aParts[] = ['type' => 'thinking', 'content' => $oBlock->content];
                    continue;
                }

                if ($oBlock instanceof NeuronAI\Chat\Messages\ContentBlocks\TextContent && $oBlock->content !== '')
                    $aParts[] = ['type' => 'text', 'content' => $oBlock->content];
            }

            $sId = $oMessage->getMetadata('__id');
            $aUi = $this->finalizeUiChatMessage(
                is_string($sId) && $sId !== '' ? $sId : ('msg_' . $i),
                $sRole,
                $aParts,
                $sRole === 'assistant' ? $oMessage->getMetadata('actions') : null
            );
            if (!$aUi)
                continue;

            $aResult[] = $aUi;
            $i++;
        }

        return $aResult;
    }

    /**
     * Split assistant JSON {content, actions} into UI text + actions.
     * User messages pass through unchanged.
     *
     * @param array<int, array<string, mixed>> $aParts
     * @return array<string, mixed>|null
     */
    public function finalizeUiChatMessage($sId, $sRole, $aParts, $mixedActions = null)
    {
        $aActions = $sRole === 'assistant' ? $this->sanitizeChatActions($mixedActions) : [];
        if ($sRole === 'assistant') {
            $sText = '';
            foreach ($aParts as $aPart) {
                if (($aPart['type'] ?? '') === 'text')
                    $sText .= (string)($aPart['content'] ?? '');
            }
            $aParsed = $this->parseAssistantChatPayload($sText);
            if ($aParsed) {
                $aKept = [];
                foreach ($aParts as $aPart) {
                    if (($aPart['type'] ?? '') === 'text')
                        continue;
                    $aKept[] = $aPart;
                }
                if ($aParsed['content'] !== '')
                    $aKept[] = ['type' => 'text', 'content' => $aParsed['content']];
                $aParts = $aKept;
                if (!$aActions)
                    $aActions = $aParsed['actions'];
            }
        }

        if (!$aParts && !$aActions)
            return null;

        $aOut = [
            'id' => $sId,
            'role' => $sRole,
            'parts' => $aParts,
        ];
        if ($sRole === 'assistant')
            $aOut['actions'] = $aActions;

        return $aOut;
    }

    /**
     * @return array{content: string, actions: array}|null
     */
    public function parseAssistantChatPayload($sText)
    {
        $s = trim((string)$sText);
        if ($s === '')
            return null;

        if (preg_match('/^```(?:json)?\s*(\{.*\})\s*```$/s', $s, $aM))
            $s = trim($aM[1]);

        if ($s === '' || $s[0] !== '{') {
            $iStart = strpos($s, '{');
            $iEnd = strrpos($s, '}');
            if ($iStart === false || $iEnd === false || $iEnd <= $iStart)
                return null;
            $s = substr($s, $iStart, $iEnd - $iStart + 1);
        }

        $a = json_decode($s, true);
        if (!is_array($a) || !array_key_exists('content', $a) || !is_string($a['content']))
            return null;
        if (!array_key_exists('actions', $a))
            return null;

        return [
            'content' => $a['content'],
            'actions' => $this->sanitizeChatActions($a['actions']),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function sanitizeChatActions($mixed)
    {
        if (!is_array($mixed))
            return [];

        $aOut = [];
        foreach ($mixed as $aItem) {
            if (!is_array($aItem))
                continue;

            $sType = strtolower(trim((string)($aItem['type'] ?? '')));
            $sLabel = trim((string)($aItem['label'] ?? ''));
            if ($sLabel === '')
                continue;
            if (function_exists('mb_substr'))
                $sLabel = mb_substr($sLabel, 0, 80);
            else
                $sLabel = substr($sLabel, 0, 80);

            if ($sType === 'reply') {
                $aOut[] = ['type' => 'reply', 'label' => $sLabel];
            } elseif ($sType === 'link') {
                $sUrl = trim((string)($aItem['url'] ?? ''));
                if (!$this->isAllowedChatActionUrl($sUrl))
                    continue;
                $aOut[] = ['type' => 'link', 'label' => $sLabel, 'url' => $sUrl];
            }

            if (count($aOut) >= 8)
                break;
        }

        return $aOut;
    }

    protected function isAllowedChatActionUrl($sUrl)
    {
        $a = parse_url((string)$sUrl);
        if (($a['scheme'] ?? '') !== 'https' || empty($a['host']))
            return false;

        $sHost = strtolower((string)$a['host']);
        $aAllowed = ['hiweave.com', 'www.hiweave.com'];
        if (defined('BX_DOL_URL_ROOT')) {
            $aSite = parse_url(BX_DOL_URL_ROOT);
            if (!empty($aSite['host']))
                $aAllowed[] = strtolower((string)$aSite['host']);
        }

        return in_array($sHost, $aAllowed, true);
    }
}

/** @} */
