<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View entry social actions menu
 */
class BxReviewsMenuViewActions extends BxBaseModTextMenuViewActions
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_reviews';

        parent::__construct($aObject, $oTemplate);
    }

    protected function _getMenuItemEditReview($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemDeleteReview($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _isContentPublic($iContentId, $aPublicGroups = []) {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($CNF['FIELD_ALLOW_VIEW_TO']))
            return true;

        $aContentInfo = $iContentId == $this->_iContentId ? $this->_aContentInfo : $this->_oModule->_oDb->getContentInfoById($iContentId);
        if(!isset($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]))
            return true;

        if(empty($aPublicGroups))
            $aPublicGroups = [BX_DOL_PG_ALL, BX_DOL_PG_MEMBERS];

        return $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] < 0 || in_array($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']], $aPublicGroups);
    }
}

/** @} */
