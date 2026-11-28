<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup   Editor integration
 * @ingroup    UnaModules
 *
 * @{
 */

class BxEditorGridToolbar extends BxTemplGrid
{
    protected $_sModule;
    protected $_oModule;
    protected $_sMode;
    
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
        
        $this->_sModule = 'bx_editor';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
        
        // The page names the mode (settings is the mini one); the grid's own requests (AG Grid's rows, the actions) send
        // it back as 'mode'.
        $sMode = bx_get('mode');
        if($sMode === false)
            $sMode = bx_get('page') !== false && bx_get('page') !== 'settings' ? bx_get('page') : 'mini';
        $this->_sMode = in_array($sMode, ['mini', 'standard', 'full']) ? $sMode : 'mini';
        $this->_aQueryAppend['mode'] = $this->_sMode;
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `mode` = ? ", $this->_sMode);
        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getCellName ($mixedValue, $sKey, $aField, $aRow)
    {
        $sName = isset($this->_oModule->_aButtons[$mixedValue]) ? _t($this->_oModule->_aButtons[$mixedValue]['text']) : '';
        return parent::_getCellDefault($sName, $sKey, $aField, $aRow);
    }
}

/** @} */
