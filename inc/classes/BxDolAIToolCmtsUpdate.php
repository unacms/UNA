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

class BxDolAIToolCmtsUpdate extends BxDolAITool
{
    public static function isMemberSafe(): bool
    {
        return true;
    }

    public function __construct()
    {
        parent::__construct(
            'comments_update',
            'Use this tool to change comments.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'module',
                type: PropertyType::STRING,
                description: 'The module name to perform content changes on. Use "system" for site accounts. ',
                required: true
            ),
            new ToolProperty(
                name: 'content_id',
                type: PropertyType::INTEGER,
                description: 'Content ID to post comments for.',
                required: true
            ),
            new ToolProperty(
                name: 'comment_text',
                type: PropertyType::STRING,
                description: 'New comments text, in HTML format.',
                required: true
            ),
            new ToolProperty(
                name: 'comment_id',
                type: PropertyType::INTEGER,
                description: 'Comment ID to update.',
                required: true
            ),
        ];
    }

    public function __invoke(string $module, int $content_id, string $comment_text, int $comment_id): array
    {
        $a = [];
        $o = BxDolCmts::getObjectInstance($module, $content_id);
        if ($o && ($aError = $this->memberCmtsError($o, 'edit', $comment_id))) {
            $a = $aError;
        }
        elseif ($o) {
            $a = $o->edit(['cmt_text' => $comment_text], $comment_id);
            unset($a['content']);
        }
        else {
            $a = ['msg' => '_sys_txt_not_found', 'code' => 404];
        }

        return $a;
    }
}
