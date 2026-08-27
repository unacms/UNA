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
        $this->ensureValidTail($message);
        return parent::addMessage($message);
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
}