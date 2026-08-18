<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MassMailer Mass Mailer
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Entry forms helper functions
 */
class BxMassMailerFormsEntryHelper extends BxBaseModTextFormsEntryHelper
{
    public function __construct($oModule)
    {
        parent::__construct($oModule);
    }
    
    public function editDataForm ($iContentId, $sDisplay = false, $sCheckFunction = false, $bErrorMsg = true)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $CNF['TABLE_ENTRIES'] = $CNF['TABLE_CAMPAIGNS'];
        return parent::editDataForm($iContentId, $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'], $sCheckFunction, $bErrorMsg);
    }

    public function onDataEditAfter($iContentId, $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm)
    {
        if($this->_bIsApi)
            return '';

        $CNF = &$this->_oModule->_oConfig->CNF;
        $this->_redirectAndExit('page.php?i=' . $CNF['URI_MANAGE_CAMPAIGNS']);
    }

    public function onDataAddAfter($iAccountId, $iContentId)
    {
        if($this->_bIsApi)
            return '';

        $CNF = &$this->_oModule->_oConfig->CNF;
        $this->_redirectAndExit('page.php?i=' . $CNF['URI_MANAGE_CAMPAIGNS']);
    }

    public function redirectAfterAdd($aContentInfo, $sUrl = '')
    {
        if($this->_bIsApi)
            return [];
        
        return parent::redirectAfterAdd($aContentInfo, $sUrl);
    }

    protected function redirectAfterEdit($aContentInfo, $sUrl = '')
    {
        if($this->_bIsApi)
            return [];

        return parent::redirectAfterEdit($aContentInfo, $sUrl);
    }
}

/** @} */
