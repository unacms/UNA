<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reminders Reminders
 * @ingroup     UnaModules
 *
 * @{
 */

class BxRemindersTemplate extends BxBaseModGeneralTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_reminders';

        parent::__construct($oConfig, $oDb);
    }

    public function getBlockView($iProfileId)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);

        $aEntries = $this->_oDb->getEntry(array('type' => 'rmd_pid', 'rmd_pid' => $iProfileId, 'visible' => true, 'full' => true));
        if(empty($aEntries) || !is_array($aEntries))
            return MsgBox(_t('_Empty'));

        $aTmplVarsItems = array();
        foreach($aEntries as $aEntry) {
            $aParams = unserialize($aEntry['params']);

            $aTmplVarsItems[] = array(
                'id' => $aEntry['id'], 
                'link' => $this->_oModule->getEntryUrl($aEntry),
                'content' => bx_replace_markers(_t($aEntry['text']), $aParams)
            );
        }

        $this->addCss(array('view.css'));
        return $this->parseHtmlByName('block_view.html', array(
            'bx_repeat:items' => $aTmplVarsItems
        ));
    }
}

/** @} */
