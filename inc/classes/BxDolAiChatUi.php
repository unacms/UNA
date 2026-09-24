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
    protected $_oImages;

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new self();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function __construct()
    {
        $this->_oImages = BxDolAiChatImages::getInstance();
    }

    public function storedChatJsonToUiMessages($sJson)
    {
        $aStored = json_decode((string)$sJson, true);
        if (is_string($aStored))
            $aStored = json_decode($aStored, true);
        if (!is_array($aStored) || $aStored === [])
            return [];
        if (isset($aStored['messages']) && is_array($aStored['messages']))
            $aStored = $aStored['messages'];
        if (!isset($aStored[0]) && isset($aStored['role']))
            $aStored = [$aStored];

        $aResult = [];
        $i = 0;
        foreach ($aStored as $aMessage) {
            if (!is_array($aMessage))
                continue;

            // A tool call turn keeps the assistant text said before the call
            // (then chat_buttons, etc.): show it, only the tool result is internal.
            $sType = $this->storedEnumString($aMessage['type'] ?? '');
            if ($sType === 'tool_call_result')
                continue;

            $sRole = $this->storedEnumString($aMessage['role'] ?? $aMessage['author'] ?? '');
            if ($sRole === 'model' || $sType === 'tool_call')
                $sRole = 'assistant';
            if ($sRole === 'human')
                $sRole = 'user';
            if ($sRole !== 'user' && $sRole !== 'assistant')
                continue;

            $aParts = [];
            if (!empty($aMessage['parts']) && is_array($aMessage['parts'])) {
                foreach ($aMessage['parts'] as $aBlock) {
                    $aPart = $this->storedContentBlockToUiPart($aBlock);
                    if ($aPart)
                        $aParts[] = $aPart;
                }
            }
            $mixedContent = $aMessage['content'] ?? $aMessage['contents'] ?? '';
            if (is_string($mixedContent) && $mixedContent !== '') {
                $aParts[] = ['type' => 'text', 'content' => $mixedContent];
            } elseif (is_array($mixedContent)) {
                if (isset($mixedContent['type']) && !isset($mixedContent[0]))
                    $mixedContent = [$mixedContent];
                foreach ($mixedContent as $aBlock) {
                    $aPart = $this->storedContentBlockToUiPart($aBlock);
                    if ($aPart)
                        $aParts[] = $aPart;
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

        return $this->foldUiChatMessages($aResult);
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
            // ToolCallMessage is an assistant message holding the text said before
            // the call; only the tool result is skipped (see storedChatJsonToUiMessages).
            if ($oMessage instanceof NeuronAI\Chat\Messages\ToolResultMessage)
                continue;

            $sRole = $oMessage->getRole();
            if ($sRole === 'model' || $oMessage instanceof NeuronAI\Chat\Messages\ToolCallMessage)
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

                $aImage = $this->_oImages->neuronBlockToUiPart($oBlock);
                if ($aImage)
                    $aParts[] = $aImage;
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

        return $this->foldUiChatMessages($aResult);
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
                $aActions = $this->mergeChatActions($aActions, $aParsed['actions']);
            }
        }

        if (!$aParts && !$aActions)
            return null;

        $aOut = [
            'id' => $sId,
            'role' => $sRole,
            'parts' => $aParts,
        ];
        if ($sRole === 'assistant') {
            $aOut['actions'] = $aActions;
            if ($aActions)
                $aOut['metadata'] = ['actions' => $aActions];
        }

        return $aOut;
    }

    /**
     * One model turn can be stored as several assistant messages: the text before a
     * tool call (ToolCallMessage), then the reply after the tool result — often empty
     * and carrying only `actions`. Show them as one bubble, like the live stream does.
     * The first message's id is kept; text is joined, actions are merged.
     *
     * @param array<int, array<string, mixed>> $aMessages
     * @return array<int, array<string, mixed>>
     */
    public function foldUiChatMessages($aMessages)
    {
        $aOut = [];
        foreach ($aMessages as $aMessage) {
            $iLast = count($aOut) - 1;
            $aPrev = $iLast >= 0 ? $aOut[$iLast] : null;
            if (($aMessage['role'] ?? '') !== 'assistant' || ($aPrev['role'] ?? '') !== 'assistant') {
                $aOut[] = $aMessage;
                continue;
            }

            $sText = '';
            $aMedia = [];
            foreach (array_merge($aPrev['parts'] ?? [], $aMessage['parts'] ?? []) as $aPart) {
                if (($aPart['type'] ?? '') === 'text') {
                    $sChunk = (string)($aPart['content'] ?? '');
                    if ($sChunk !== '')
                        $sText .= ($sText !== '' ? "\n\n" : '') . $sChunk;
                    continue;
                }
                $aMedia[] = $aPart;
            }

            $aParts = $sText !== '' ? [['type' => 'text', 'content' => $sText]] : [];
            $aActions = $this->mergeChatActions($aPrev['actions'] ?? [], $aMessage['actions'] ?? []);
            $aMerged = array_merge($aPrev, [
                'parts' => array_merge($aParts, $aMedia),
                'actions' => $aActions,
            ]);
            if ($aActions)
                $aMerged['metadata'] = ['actions' => $aActions];
            else
                unset($aMerged['metadata']);
            $aOut[$iLast] = $aMerged;
        }

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
     * Union of two action lists, duplicates (same type + label + url) dropped, at most 8.
     *
     * @return array<int, array<string, mixed>>
     */
    public function mergeChatActions($a, $b)
    {
        $aAll = array_merge($this->sanitizeChatActions($a), $this->sanitizeChatActions($b));
        $aOut = [];
        $aSeen = [];
        foreach ($aAll as $aItem) {
            $sKey = ($aItem['type'] ?? '') . '|' . ($aItem['label'] ?? '') . '|' . ($aItem['url'] ?? '');
            if (isset($aSeen[$sKey]))
                continue;
            $aSeen[$sKey] = true;
            $aOut[] = $aItem;
            if (count($aOut) >= 8)
                break;
        }

        return $aOut;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function sanitizeChatActions($mixed)
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

    /** Text parts of a UI message joined, tags stripped, whitespace collapsed. */
    public function uiChatMessagePlainText($aMessage)
    {
        $aTexts = [];
        foreach ((array)($aMessage['parts'] ?? []) as $aPart) {
            if (is_array($aPart) && ($aPart['type'] ?? '') === 'text' && is_string($aPart['content'] ?? null))
                $aTexts[] = $aPart['content'];
        }
        $s = strip_tags(html_entity_decode(implode(' ', $aTexts), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        return trim(preg_replace('/\s+/u', ' ', $s));
    }

    /**
     * Neuron / UI content block from stored chat JSON → UI part.
     *
     * @param mixed $mixedBlock
     * @return array<string, mixed>|null
     */
    protected function storedContentBlockToUiPart($mixedBlock)
    {
        if (is_string($mixedBlock) && $mixedBlock !== '')
            return ['type' => 'text', 'content' => $mixedBlock];
        if (!is_array($mixedBlock))
            return null;

        $sType = $this->storedEnumString($mixedBlock['type'] ?? '');
        if (strpos($sType, 'textcontent') !== false)
            $sType = 'text';
        if (strpos($sType, 'imagecontent') !== false)
            $sType = 'image';
        $sText = (string)($mixedBlock['content'] ?? $mixedBlock['text'] ?? '');
        if ($sType === 'text' || $sType === '' || $sType === 'array')
            return $sText !== '' ? ['type' => 'text', 'content' => $sText] : null;
        if ($sType === 'reasoning' || $sType === 'thinking')
            return $sText !== '' ? ['type' => 'thinking', 'content' => $sText] : null;

        $aImage = $this->storedImageBlockToUiPart($mixedBlock);
        return $aImage ?: null;
    }

    /**
     * @param array<string, mixed> $aBlock
     * @return array<string, mixed>|null
     */
    protected function storedImageBlockToUiPart($aBlock)
    {
        $aSource = is_array($aBlock['source'] ?? null) ? $aBlock['source'] : [];
        $sSourceKind = strtolower((string)($aSource['type'] ?? ''));
        $sNeuronSource = $this->storedEnumString($aBlock['source_type'] ?? $aBlock['sourceType'] ?? '');
        $sMime = $this->_oImages->sanitizeMime($aSource['mimeType'] ?? $aBlock['media_type'] ?? $aBlock['mediaType'] ?? $aBlock['mime'] ?? $aBlock['mimeType'] ?? 'image/jpeg');

        if ($sSourceKind === 'data' && (string)($aSource['value'] ?? '') !== '')
            return ['type' => 'image', 'source' => ['type' => 'data', 'value' => (string)$aSource['value'], 'mimeType' => $sMime]];

        if (($sNeuronSource === 'base64' || $sNeuronSource === 'data') && (string)($aBlock['content'] ?? '') !== '')
            return ['type' => 'image', 'source' => ['type' => 'data', 'value' => (string)$aBlock['content'], 'mimeType' => $sMime]];

        $aParsed = $this->_oImages->parsePart($aBlock);
        if ($aParsed)
            return ['type' => 'image', 'source' => ['type' => 'url', 'value' => $aParsed['url'], 'mimeType' => $aParsed['mime']]];

        return null;
    }

    /**
     * Enum (object, `{value}` array or string) from stored JSON → lower-case string.
     *
     * @param mixed $mixed
     */
    protected function storedEnumString($mixed)
    {
        if (is_object($mixed) && $mixed instanceof \BackedEnum)
            return strtolower((string)$mixed->value);
        if (is_array($mixed))
            return strtolower((string)($mixed['value'] ?? $mixed['name'] ?? ''));
        return strtolower((string)$mixed);
    }

    protected function isAllowedChatActionUrl($sUrl)
    {
        $a = parse_url((string)$sUrl);
        if (($a['scheme'] ?? '') !== 'https' || empty($a['host']))
            return false;

        $sHost = strtolower((string)$a['host']);
        if ($sHost === 'localhost' || str_ends_with($sHost, '.localhost'))
            return false;
        if (filter_var($sHost, FILTER_VALIDATE_IP))
            return (bool)filter_var($sHost, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);

        return true;
    }
}

/** @} */
