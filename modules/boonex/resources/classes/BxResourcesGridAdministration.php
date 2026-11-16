<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

class BxResourcesGridAdministration extends BxBaseModTextGridAdministration
{
    protected $_sFilter3Name;
    protected $_sFilter3Value;
    protected $_aFilter3Values;

    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_resources';
        parent::__construct ($aOptions, $oTemplate);

        $this->_sTableAlias = 'te';

        $this->_initFilter(3, $this->_oModule->getContexts());
    }

    protected function _getCellContextModule($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->_oModule->getModuleTitle($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellContextCid($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->_getContextLink($mixedValue, $aRow), $sKey, $aField, $aRow);
    }

    protected function _getFilterControls()
    {
        $sContent = $this->_getFilterSelectOne($this->_sFilter3Name, $this->_sFilter3Value, $this->_aFilter3Values);
        return $sContent . parent::_getFilterControls();
    }
    
    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_parseFilterValue($sFilter);

        if(!empty($this->_sFilter3Value))
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tp`.`type`=?", $this->_sFilter3Value);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getContextLink($mixedValue, $aRow)
    {
        $sTitle = bx_srv($aRow['context_module'], 'get_title', [$mixedValue]) ?: _t('_undefined');
        $sLink = bx_srv($aRow['context_module'], 'get_link', [$mixedValue]);

        return $this->_oTemplate->parseHtmlByName('title_link.html', [
            'href' => $sLink,
            'title' => bx_html_attribute($sTitle),
            'content' => bx_process_output($sTitle),
            'target' => '_blank'
        ]);
    }
}

/** @} */
