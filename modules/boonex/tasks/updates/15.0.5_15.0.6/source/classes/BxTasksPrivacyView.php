<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Photos Photos
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksPrivacyView extends BxTemplPrivacy
{
    protected $_sModule;
    protected $_oModule;
    
    public function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_sModule = 'bx_tasks';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
    }

    protected function getGroups($iOwnerId = 0, $aParams = []) 
    {
        $aValues = [
            ['key' => '', 'value' => _t('_sys_please_select')]
        ];

        return parent::addSpaces($aValues, $iOwnerId, $aParams);
    }

    public function addDynamicGroups($aValues, $iOwnerId, $aParams)
    {
        return $aValues;
    }

    public function addSpaces($aValues, $iOwnerId, $aParams)
    {
        return $aValues;
    }
}

/** @} */
