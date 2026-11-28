<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\ToolProperty;;

class BxDolAIToolCmtsAdd extends BxDolAITool
{
    public static function isMemberSafe(): bool
    {
        return true;
    }

    public static function memberScopedArgs(): array
    {
        return ['author_profile_id'];
    }

    public function __construct()
    {
        parent::__construct(
            'comments_add',
            'Use this tool to post comments.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'module',
                type: PropertyType::STRING,
                description: 'Module name of the content_id.',
                required: true
            ),
            new ToolProperty(
                name: 'content_id',
                type: PropertyType::INTEGER,
                description: 'Content ID where to to post comments.',
                required: true
            ),
            new ToolProperty(
                name: 'comment_text',
                type: PropertyType::STRING,
                description: 'Comments text to post, in HTML format.',
                required: true
            ),
            new ToolProperty(
                name: 'parent_comment_id',
                type: PropertyType::INTEGER,
                description: 'Parent comment ID, for comment replies, default 0.',
                required: false
            ),
            new ToolProperty(
                name: 'author_profile_id',
                type: PropertyType::INTEGER,
                description: 'Author profile ID of the posted comment.',
                required: false
            ),
        ];
    }

    public function __invoke(string $module, int $content_id, string $comment_text, ?int $parent_comment_id = null, ?int $author_profile_id = null): array
    {
        $iPrevious = $this->actAs((int)$author_profile_id);

        $a = [];
        $o = BxDolCmts::getObjectInstance($module, $content_id);
        if ($o && ($aError = $this->memberCmtsError($o, 'post'))) {
            $a = $aError;
        }
        elseif ($o) {
            $aData = [
                'sys' => $module,
                'id' => $content_id,
                'cmt_parent_id' => $parent_comment_id ?? 0,
                // 'cmt_image' => [],
                'cmt_text' => $comment_text,
            ];
            // if ($author_profile_id)
            //    $aData['cmt_author_id'] = $author_profile_id;

            $a = $o->add($aData);
            unset($a['count']);
            unset($a['countf']);
            if ($this->adminLogOk($a)) {
                $sId = $this->adminLogId($a);
                $aAfter = $sId !== '' ? $o->getCommentRow((int)$sId) : ['text' => $comment_text];
                $this->adminLog('cmts:' . $module, $sId !== '' ? $sId : (string)$content_id, 'add', null, $aAfter ?: ['text' => $comment_text]);
            }
        }
        else {
            $a = ['msg' => '_sys_txt_not_found', 'code' => 404];
        }

        $this->endActingAs($iPrevious);

        return $a;
    }
}
