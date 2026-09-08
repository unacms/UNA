<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Chat\History\ChatHistoryInterface;
use NeuronAI\Chat\History\SQLChatHistory;
use NeuronAI\Chat\Messages\AssistantMessage;
use NeuronAI\Chat\Messages\Message;
use NeuronAI\Chat\Messages\ToolCallMessage;
use NeuronAI\Chat\Messages\ToolResultMessage;
use NeuronAI\Chat\Messages\UserMessage;

class BxDolAiChatHistory extends SQLChatHistory
{
    public function addMessage(Message $message): ChatHistoryInterface
    {
        $bStampIp = $this->isIncomingFirstUserMessage($message);
        $this->ensureValidTail($message);
        $o = parent::addMessage($message);
        if ($bStampIp)
            $this->stampVisitorIp();
        return $o;
    }

    protected function isIncomingFirstUserMessage(Message $incoming): bool
    {
        if (!($incoming instanceof UserMessage) || $incoming instanceof ToolResultMessage)
            return false;

        foreach ($this->history as $oMessage) {
            if ($oMessage instanceof UserMessage && !($oMessage instanceof ToolResultMessage))
                return false;
        }

        return true;
    }

    protected function stampVisitorIp(): void
    {
        if (!function_exists('getVisitorIP') || !function_exists('bx_get_ip_hash'))
            return;

        $iIp = bx_get_ip_hash(getVisitorIP());
        if ($iIp === '' || $iIp === '0' || $iIp === 0)
            return;

        $stmt = $this->pdo->prepare("UPDATE {$this->table} SET `ip` = :ip WHERE `thread_id` = :thread_id AND (`ip` = 0 OR `ip` IS NULL)");
        $stmt->execute([
            'ip' => $iIp,
            'thread_id' => $this->thread_id,
        ]);
    }

    protected function ensureValidTail(Message $incoming): void
    {
        if ($this->history === []) {
            return;
        }

        $last = $this->history[array_key_last($this->history)];

        // Dangling tool call: close it before anything else
        if ($last instanceof ToolCallMessage && !($incoming instanceof ToolResultMessage)) {
            foreach ($last->getTools() as $oTool) {
                if (method_exists($oTool, 'setResult')) {
                    $oTool->setResult('Tool call was interrupted');
                }
            }
            $this->history[] = new ToolResultMessage($last->getTools());
            $this->setMessages($this->history);
            $last = $this->history[array_key_last($this->history)];
        }

        // Orphan user (failed inference) or tool result without assistant: close the pair before another user arrives.
        // ToolResultMessage extends UserMessage, so this also covers tool_result → user.
        if (
            $incoming instanceof UserMessage
            && !($incoming instanceof ToolResultMessage)
            && $last instanceof UserMessage
        ) {
            $this->history[] = new AssistantMessage('[Previous reply failed]');
            $this->setMessages($this->history);
        }
    }

    public function persistMessages(): void
    {
        $this->setMessages($this->history);
    }
}