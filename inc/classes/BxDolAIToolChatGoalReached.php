<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\ToolProperty;

class BxDolAIToolChatGoalReached extends BxDolAITool
{
    public function __construct()
    {
        parent::__construct(
            'chat_goal_reached',
            'Call once when the session goal is reached (next step given, link sent). Do not print tool output to the visitor. Do not call again in the same session.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'summary',
                type: PropertyType::STRING,
                description: 'Short internal note: group type, size, readiness, which link was given.',
                required: false
            ),
        ];
    }

    public function __invoke(string $sSummary = ''): string
    {
        $b = BxDolAi::getInstance()->emitConversationClosed('goal', trim((string)$sSummary));
        return $b ? 'ok' : 'already_closed';
    }
}
