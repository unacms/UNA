<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Chat\History\MessageStoreInterface;
use NeuronAI\Chat\Messages\Message;
use NeuronAI\Chat\Messages\MessageDeserializer;

/**
 * NeuronAI message store on top of `sys_agents_chat_history`: one row per
 * thread, all messages of the thread are kept as a JSON list in the `messages` column.
 * Rows written by NeuronAI 3.x are read as is.
 */
class BxDolAiChatHistory implements MessageStoreInterface
{
    protected $_oDb;

    public function __construct($oDb = null)
    {
        $this->_oDb = $oDb ?: new BxDolAiQuery();
    }

    public function loadActive(string $threadId): array
    {
        return $this->deserialize($this->readRaw($threadId));
    }

    public function loadAll(string $threadId, ?int $limit = null, ?string $before = null): array
    {
        $aRaw = $this->readRaw($threadId);

        if ($before !== null) {
            $iPos = $this->findRaw($aRaw, $before);
            if ($iPos === false)
                return [];
            $aRaw = array_slice($aRaw, 0, $iPos);
        }

        if ($limit !== null)
            $aRaw = array_slice($aRaw, max(0, count($aRaw) - $limit));

        return $this->deserialize($aRaw);
    }

    public function append(string $threadId, Message $message): void
    {
        $aRaw = $this->readRaw($threadId);
        if ($this->findRaw($aRaw, $message->getId()) !== false)
            return;

        $bStampIp = $this->isFirstUserMessage($aRaw, $message);

        $aRaw[] = $this->serializeMessage($message);
        $this->writeRaw($threadId, $aRaw);

        if ($bStampIp)
            $this->stampVisitorIp($threadId);
    }

    /**
     * Messages trimmed out of the context window are dropped from the thread.
     */
    public function archive(string $threadId, int $count): void
    {
        if ($count <= 0)
            return;

        $aRaw = $this->readRaw($threadId);
        if (!$aRaw)
            return;

        $this->writeRaw($threadId, array_slice($aRaw, $count));
    }

    public function clear(string $threadId): void
    {
        $this->_oDb->deleteChatHistoryByThreadId($threadId);
    }

    /**
     * Store the changed version of a message which is already in the thread.
     */
    public function replace(string $threadId, Message $message): bool
    {
        $aRaw = $this->readRaw($threadId);
        $iPos = $this->findRaw($aRaw, $message->getId());
        if ($iPos === false)
            return false;

        $aRaw[$iPos] = $this->serializeMessage($message);
        $this->writeRaw($threadId, $aRaw);
        return true;
    }

    protected function readRaw(string $sThreadId): array
    {
        $a = json_decode((string)$this->_oDb->getChatHistoryMessagesByThreadId($sThreadId), true);
        if (!is_array($a))
            return [];

        $aRaw = [];
        foreach (array_values(array_filter($a, 'is_array')) as $i => $aItem) {
            // messages stored by NeuronAI 3.x have no identity: give a stable one, it is saved with the next write
            if (empty($aItem['__id']) || !is_string($aItem['__id']))
                $aItem['__id'] = 'legacy_' . get_mb_substr(md5($sThreadId . '|' . $i), 0, 16);
            $aRaw[] = $aItem;
        }
        return $aRaw;
    }

    protected function writeRaw(string $sThreadId, array $aRaw): void
    {
        $this->_oDb->setChatHistoryMessagesByThreadId($sThreadId, json_encode(array_values($aRaw), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE));
    }

    protected function serializeMessage(Message $oMessage): array
    {
        $a = json_decode(json_encode($oMessage, JSON_INVALID_UTF8_SUBSTITUTE), true);
        return is_array($a) ? $a : [];
    }

    protected function findRaw(array $aRaw, string $sId)
    {
        foreach ($aRaw as $i => $a) {
            if (isset($a['__id']) && $a['__id'] === $sId)
                return $i;
        }
        return false;
    }

    /**
     * @return Message[]
     */
    protected function deserialize(array $aRaw): array
    {
        $oDeserializer = new MessageDeserializer();

        $aMessages = [];
        foreach ($aRaw as $a) {
            try {
                $aMessages[] = $oDeserializer->deserialize($a);
            } catch (Throwable $o) {
                bx_log('sys_agents', 'chat history: skipped broken message: ' . $o->getMessage(), BX_LOG_WARN);
            }
        }
        return $aMessages;
    }

    protected function isUserRaw(array $a): bool
    {
        return ($a['role'] ?? '') === 'user' && ($a['type'] ?? '') !== 'tool_call_result';
    }

    protected function isFirstUserMessage(array $aRaw, Message $oMessage): bool
    {
        if (!$this->isUserRaw($this->serializeMessage($oMessage)))
            return false;

        foreach ($aRaw as $a) {
            if ($this->isUserRaw($a))
                return false;
        }
        return true;
    }

    protected function stampVisitorIp(string $sThreadId): void
    {
        if (!function_exists('getVisitorIP') || !function_exists('bx_get_ip_hash'))
            return;

        $iIp = bx_get_ip_hash(getVisitorIP());
        if ($iIp === '' || $iIp === '0' || $iIp === 0)
            return;

        $this->_oDb->setChatHistoryIpByThreadId($sThreadId, $iIp);
    }
}

/** @} */
