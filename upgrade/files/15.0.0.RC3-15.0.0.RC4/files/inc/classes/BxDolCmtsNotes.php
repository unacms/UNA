<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Moderation Notes for any content
 */
class BxDolCmtsNotes extends BxTemplCmts
{
    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);
    }

    public function getObjectPrivacyView ($iObjectId = 0)
    {
        return BX_DOL_PG_HIDDEN;
    }
    
    public function getObjectContentFilter ()
    {
        return false;
    }

    public function isViewAllowed ($isPerformAction = false)
    {
        $mixed = $this->_isNotesModerator();
        return $mixed === CHECK_ACTION_RESULT_ALLOWED ? CHECK_ACTION_RESULT_ALLOWED : $mixed;
    }

    public function isPostAllowed ($isPerformAction = false)
    {
        return $this->_isNotesModerator() === CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * Notes are the moderator thread on an entry. The module's edit-any-entry action is that check.
     */
    protected function _isNotesModerator()
    {
        $sModule = $this->_aSystem['module'] ?? '';
        if (!$sModule || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return isAdmin() ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_access_denied');

        $oModule = BxDolModule::getInstance($sModule);
        if (!$oModule || !method_exists($oModule, 'checkAllowedEditAnyEntryForProfile'))
            return isAdmin() ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_access_denied');

        return $oModule->checkAllowedEditAnyEntryForProfile();
    }
}

/** @} */
