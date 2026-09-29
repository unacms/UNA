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
use NeuronAI\Tools\ArrayProperty;
use NeuronAI\Tools\ObjectProperty;

class BxDolAIToolChatButtons extends BxDolAITool
{
    public function __construct()
    {
        $sYes = _t('_Yes');
        $sNo = _t('_No');

        parent::__construct(
            'chat_buttons',
            'Show clickable buttons under THIS assistant reply: ' . $sYes . '/' . $sNo . ', suggested names, register/support links. Call once per turn, after the sentence the user should confirm. Write every label in the site language. A yes/no choice uses exactly these labels: "' . $sYes . '" and "' . $sNo . '". Do not write another assistant message after this tool. Do not say that buttons are ready.',
        );
    }

    protected function properties(): array
    {
        $sYes = _t('_Yes');
        $sNo = _t('_No');

        return [
            new ArrayProperty(
                name: 'buttons',
                description: 'Buttons under this reply. reply = visitor tap sends that label as the next message; link = an https URL (site pages, help, registration). Yes/no labels are exactly "' . $sYes . '" and "' . $sNo . '" (site language). Example: [{"type":"reply","label":"' . $sYes . '"},{"type":"reply","label":"' . $sNo . '"}]',
                required: true,
                items: new ObjectProperty(
                    name: 'button',
                    properties: [
                        new ToolProperty('type', PropertyType::STRING, 'reply or link', true),
                        new ToolProperty('label', PropertyType::STRING, 'Button text shown to the visitor', true),
                        new ToolProperty('url', PropertyType::STRING, 'Required for link. https URL.', false),
                    ]
                ),
                minItems: 1,
                maxItems: 8
            ),
        ];
    }

    public function __invoke($buttons): string
    {
        $i = BxDolAiChat::getInstance()->setPendingChatActions(is_array($buttons) ? $buttons : []);

        return $i > 0
            ? 'Buttons are already under your last sentence. Do not send another assistant message this turn. Wait for the user to tap a button.'
            : 'ignored';
    }
}
