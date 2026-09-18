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

class BxDolAIToolChatArtifactSave extends BxDolAITool
{
    public function __construct()
    {
        parent::__construct(
            'chat_artifact_save',
            'Save one collected field from this conversation (for example name, email, group_name). Call as soon as the visitor gives a value. Do not print saved values to the visitor.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'field_name',
                type: PropertyType::STRING,
                description: 'Field key, e.g. name, email, group_name.',
                required: true
            ),
            new ToolProperty(
                name: 'field_value',
                type: PropertyType::STRING,
                description: 'Field value as given by the visitor.',
                required: true
            ),
        ];
    }

    public function __invoke(string $sFieldName, string $sFieldValue): string
    {
        $sName = strtolower(trim((string)$sFieldName));
        $sName = preg_replace('/[^a-z0-9_]/', '', $sName);
        $sValue = trim((string)$sFieldValue);
        if ($sName === '' || $sValue === '')
            return 'ignored';

        $iHistoryId = (int)BxDolAiChat::getInstance()->getCurrentChatHistoryId();
        if ($iHistoryId <= 0)
            return 'no_history';

        BxDolDb::getInstance()->query("
            INSERT INTO `sys_agents_chat_artifacts`
                (`history_id`, `field_name`, `field_value`, `updated_at`)
            VALUES
                (:h, :n, :v, :t)
            ON DUPLICATE KEY UPDATE
                `field_value` = VALUES(`field_value`),
                `updated_at` = VALUES(`updated_at`)
        ", [
            'h' => $iHistoryId,
            'n' => $sName,
            'v' => $sValue,
            't' => time(),
        ]);

        return 'ok';
    }
}
