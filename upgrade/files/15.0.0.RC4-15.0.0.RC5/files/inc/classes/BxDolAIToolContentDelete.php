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

class BxDolAIToolContentDelete extends BxDolAITool
{
    public static function isMemberSafe(): bool
    {
        return true;
    }

    public function __construct()
    {
        parent::__construct(
            'content_delete',
            'Use this tool to delete content. Available modules: ' . $this->getContentModules() . '.',
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
                description: 'Content ID to delete.',
                required: true
            ),
        ];
    }

    public function __invoke(string $module, int $content_id = 0): array
    {        
        if (($aError = $this->memberContentError($module, $content_id, 'delete')))
            return $aError;

        $aBefore = bx_srv('system', 'get_info', [$module, $content_id, true], 'TemplServiceContent');
        $a = bx_srv('system', 'delete', [$module, $content_id], 'TemplServiceContent');
        if ($this->adminLogOk($a))
            $this->adminLog('content:' . $module, (string)$content_id, 'delete', $aBefore, null);

        return $a;
    }
}
