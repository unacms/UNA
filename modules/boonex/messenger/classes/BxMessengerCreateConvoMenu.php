<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMessengerCreateConvoMenu extends BxTemplMenu
{
    protected $_sModule;
    protected $_oModule;

    protected $_sJsObject;
    protected $_sStylePrefix;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject, $this->_oModule->_oTemplate);

        $aMarkers['js_object'] = $this->_oModule->_oConfig->CNF['JSCreateConvoMenu'];
        $this->addMarkers($aMarkers);
    }

    protected function _getMenuItem ($a)
    {
        $sClass = '';
        if ($a['name'] === 'standard')
            $sClass = 'bx-menu-tab-active';

        $aResult = parent::_getMenuItem($a);
        if(!$aResult)
            return $aResult;

        return array_merge($aResult, [
            'class_add' => $sClass
        ]);
    }
}

/** @} */
