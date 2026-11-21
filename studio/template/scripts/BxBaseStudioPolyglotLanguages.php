<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioPolyglotLanguages extends BxDolStudioPolyglotLanguages
{
    public function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);
    }

    /**
     * Nothing goes above the list (no filter or buttons; Get more is in the block's caption), so no empty header row.
     */
    public function getCode($isDisplayHeader = true)
    {
        return parent::getCode(false);
    }

    /**
     * The language's name (already escaped by _getCellData) opens its app, where its own settings are.
     */
    protected function _getCellTitle($mixedValue, $sKey, $aField, $aRow)
    {
        if(!$this->_bIsApi && ($sUrl = $this->getLanguageUrl($aRow)) !== '') {
            $mixedValue = '<a href="' . bx_html_attribute($sUrl) . '">' . $mixedValue . '</a>';
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellEnabled($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(_t($this->getStatusKey($aRow)), $sKey, $aField, $aRow);
    }
}

/** @} */
