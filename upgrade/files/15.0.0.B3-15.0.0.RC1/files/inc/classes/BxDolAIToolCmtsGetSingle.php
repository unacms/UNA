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

class BxDolAIToolCmtsGetSingle extends BxDolAITool
{
    public function __construct()
    {
        parent::__construct(
            'comment_get',
            'Get single comment info. Prepend base URL to links in comment info: ' . BX_DOL_URL_ROOT,
        );
    }
    
    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'comment_id',
                type: PropertyType::INTEGER,
                description: 'ID of comment to get.',
                required: true
            ),
        ];
    }

    public function __invoke(int $comment_id): array
    {
        $aCmt = BxDolCmtsQuery::getCommentExtendedByUniqId($comment_id);        
        $oCmtsObject = $aCmt ? BxDolCmts::getObjectInstance($aCmt['system_name'], $aCmt['cmt_object_id']) : null;

        if ($oCmtsObject) {
            return $oCmtsObject->getDataAPI($aCmt);
        }

        return ['msg' => '_sys_txt_not_found', 'code' => 404];
    }
}
