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

class BxDolAIToolContentGet extends BxDolAITool
{
    public static function isMemberSafe(): bool
    {
        return true;
    }

    public function __construct()
    {
        parent::__construct(
            'content_get',
            'Retrieve content info for a given module and content id, including author info and URL. If needed, prepend base URL to links: ' . BX_DOL_URL_ROOT,
        );
    }
    
    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'module',
                type: PropertyType::STRING,
                description: 'The module name to retrieve content info from. Use "system" for site accounts. ',
                required: true
            ),
            new ToolProperty(
                name: 'content_id',
                type: PropertyType::INTEGER,
                description: 'The ID of the content item to retrieve info for.',
                required: true
            )
        ];
    }

    public function __invoke(string $module, int $content_id): array
    {
        if (($aError = $this->memberContentError($module, $content_id, 'view')))
            return $aError;

        $a = bx_srv('system', 'get_info', [$module, $content_id], 'TemplServiceContent');
        if (!$a)
            return ["error" => "Content item was not found"];

        return $a;
    }
}
