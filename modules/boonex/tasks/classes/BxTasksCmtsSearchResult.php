<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksCmtsSearchResult extends BxBaseModGeneralCmtsSearchResult
{
    public function __construct($sMode = '', $aParams = [])
    {
    	$this->sModule = 'bx_tasks';

        parent::__construct($sMode, $aParams);

        $this->aCurrent['title'] = _t('_bx_tasks_page_block_title_browse_cmts');
        $this->aCurrent['restriction']['exclude_auto'] = [
            'value' => (int)getParam('sys_profile_bot'), 
            'field' => 'cmt_author_id', 
            'operator' => '<>'
        ];
    }

    public function displaySearchUnit($aData)
    {
        if(bx_srv($this->sModule, 'check_allowed_comments_view', [$aData['object_id'], $this->sModuleObjectComments]) !== CHECK_ACTION_RESULT_ALLOWED)
            return BxDolCmts::getObjectInstance($this->sModuleObjectComments, $aData['object_id'])->getCommentPrivate($aData['id']);

        return parent::displaySearchUnit($aData);
    }
}

/** @} */
