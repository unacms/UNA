<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_PK_CATEGORY_SYSTEM', 1);
define('BX_DOL_STUDIO_PK_CATEGORY_CUSTOM', 2);

define('BX_DOL_STUDIO_PK_PREVIEW', 100);

class BxDolStudioPolyglotKeys extends BxTemplStudioGrid
{
    protected $iPreviewLength;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->oDb = new BxDolStudioPolyglotQuery();
        $this->iPreviewLength = BX_DOL_STUDIO_PK_PREVIEW;
    }

    protected function add(&$oForm)
    {
        $sKey = $oForm->getCleanValue('key');
        $iCategoryId = (int)$oForm->getCleanValue('category_id');
        $aLanguages = explode(',', $oForm->getCleanValue('languages'));

        if(empty($sKey) || empty($iCategoryId))
            return _t('_adm_pgt_err_create_key_empty_fields');

        $aStrings = array();
        foreach($aLanguages as $iLanguageId)
            $aStrings[$iLanguageId] = $oForm->getCleanValue('language_' . $iLanguageId);

        $mixedResult = BxDolStudioLanguagesUtils::getInstance()->addLanguageString($sKey, $aStrings, 0, $iCategoryId);
        if($mixedResult === false)
            return _t('_adm_pgt_err_create_key');

        return $mixedResult;
    }
    protected function edit(&$oForm)
    {
        $iId = $oForm->getCleanValue('id');
        $aLanguages = explode(',', $oForm->getCleanValue('languages'));

        if(empty($iId) || empty($aLanguages))
            return _t('_adm_pgt_err_save');

        $aStrings = array();
        foreach($aLanguages as $iLanguageId)
            $aStrings[$iLanguageId] = $oForm->getCleanValue('language_' . $iLanguageId);

        if(!BxDolStudioLanguagesUtils::getInstance()->updateLanguageStringById($iId, $aStrings))
            return _t('_adm_pgt_err_save');

        return $iId;
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $iModule = 0;
        if(strpos($sFilter, $this->sParamsDivider) !== false)
            list($iModule, $sFilter) = explode($this->sParamsDivider, $sFilter);

        $iLanguage = BxDolLanguages::getInstance()->getCurrentLangId();

        $aLanguage = array();
        $this->oDb->getLanguagesBy(array('type' => 'by_id', 'value' => $iLanguage), $aLanguage, false);

        if(empty($aLanguage) || !is_array($aLanguage))
            $this->oDb->getLanguagesBy(array('type' => 'default'), $aLanguage, false);

        if(empty($aLanguage) || !is_array($aLanguage)) {
            $aLanguages = array();
            $iLanguages = $this->oDb->getLanguagesBy(array('type' => 'active'), $aLanguages);
            if($iLanguages <= 0 || empty($aLanguages))
                return array();

            $aLanguage = $aLanguages[0];
        }

        $this->_aOptions['source'] = sprintf($this->_aOptions['source'], $aLanguage['id']);
        if((int)$iModule != 0)
            $this->_aOptions['source'] .= $this->oDb->prepareAsString(" AND `tlk`.`IDCategory`=?", $iModule);

        $aResults = parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);

        foreach($aResults as $iIndex => $aResult) {
            $aKey = $this->oDb->getKeyFullInfo($aResult['id'], $this->iPreviewLength);
            if(empty($aKey))
                continue;

            $aResults[$iIndex]['module'] = $aKey['module'];
            $aResults[$iIndex]['string'] = $aKey['strings'][$aLanguage['name']]['preview'];
            $aResults[$iIndex]['languages'] = implode(', ', array_keys($aKey['strings']));
        }

        return $aResults;
    }
}

/** @} */
