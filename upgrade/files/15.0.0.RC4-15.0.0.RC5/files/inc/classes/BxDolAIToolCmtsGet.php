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

class BxDolAIToolCmtsGet extends BxDolAITool
{
    public static function isMemberSafe(): bool
    {
        return true;
    }

    public function __construct()
    {
        parent::__construct(
            'comments_get',
            'Retrieve content\'s comments for a given module and content id. If needed, prepend base URL to links: ' . BX_DOL_URL_ROOT,
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
            ),
            new ToolProperty(
                name: 'per_page',
                type: PropertyType::INTEGER,
                description: 'Pagination, number of comments per page. Default is 10.',
                required: false
            ),
            new ToolProperty(
                name: 'start',
                type: PropertyType::INTEGER,
                description: 'Pagination, start showing comments starting from this number. Default is 0.',
                required: false
            ),
        ];
    }

    public function __invoke(string $module, int $content_id, int $per_page = 10, int $start = 0): array
    {
        $o = BxDolCmts::getObjectInstance($module, $content_id);
        if ($o && ($aError = $this->memberCmtsError($o, 'view'))) {
            return $aError;
        }
        if ($o && $o->isEnabled()) {
            $a = $o->serviceGetAll([
                'type' => 'latest',
                'object_id' => $content_id,
                'start' => $start,
                'per_page' => $per_page
            ]);
            foreach ($a as $k => $r) {
                $a[$k] = $o->getDataAPI($r);
            }
            return $a;
        } 
        else {
            return ['msg' => '_sys_txt_not_found', 'code' => 404];
        }
    }
}
