<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Developer Developer
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_DEV_PGT_CATEGORY_SYSTEM', 1);
define('BX_DEV_PGT_CATEGORY_CUSTOM', 2);

class BxDevPolyglotManage extends BxTemplStudioGrid
{
    private $sAllUri = 'all';
    private $aActions = array(
        'restore' => 'eraser',
        'recompile' => 'sync'
    );

    protected $oModule;
    protected $aLanguages;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->oModule = BxDolModule::getInstance('bx_developer');

        $this->aLanguages = BxDolLanguages::getInstance()->getLanguages();

        $iWidth = floor(100 / (count($this->aLanguages) + 1));
        $this->_aOptions['fields']['title']['width'] = $iWidth;

        foreach($this->aLanguages as $sName => $sTitle)
            $this->_aOptions['fields'][$sName] = array(
                'title' => $sTitle,
                'width' => $iWidth,
                'translatable' => '0',
                'chars_limit' => '0'
            );
    }

    public function performActionAddKeys()
    {
        $sAction = 'add_keys';
        $sFormObject = $this->oModule->_oConfig->getObject('form_pgt_keys');
        $sFormDisplay = $this->oModule->_oConfig->getObject('form_display_pgt_keys_add');

        $oForm = BxDolForm::getObjectInstance($sFormObject, $sFormDisplay, $this->oModule->_oTemplate);
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction;
        $this->fillInSelects($oForm->aInputs);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $oXmlParser = BxDolXmlParser::getInstance();
            $oLanguages = BxDolStudioLanguagesUtils::getInstance();
            
            $aLanguages = $oForm->getCleanValue('language');
            $aLanguages = !empty($aLanguages) ? array($aLanguages) : array_keys($oLanguages->getLanguages(true));

            $iCategory = $oForm->getCleanValue('category');

            $sContent = '<strings>' . $oForm->getCleanValue('content') . '</strings>';
            $aKeys = $oXmlParser->getValues($sContent, 'string');

            $iReplace = $oForm->getCleanValue('replace');

            $iKeys = 0;
            foreach($aLanguages as $iLanguage) {
                foreach($aKeys as $sKey => $sValue) {
                    $bAdded = $oLanguages->addLanguageString($sKey, $sValue, $iLanguage, $iCategory, false) !== false;
                    if(!$bAdded && !$iReplace) 
                        continue;

                    if(!$bAdded) {
                        $oLanguages->deleteLanguageString($sKey, $iLanguage, false);
                        if($oLanguages->addLanguageString($sKey, $sValue, $iLanguage, $iCategory, false) === false)
                            continue;
                    }

                    $iKeys += 1;
                }

                $oLanguages->compileLanguage($iLanguage, true);
            }

            return echoJson(array('msg' => _t('_bx_dev_pgt_msg_keys_added', $iKeys)));
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox('bx-dev-pgt-keys-add-popup', _t('_bx_dev_pgt_txt_keys_add_popup'), $this->oModule->_oTemplate->parseHtmlByName('pgt_add_keys.html', array(
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        )));

        return echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
    }

    public function performActionRecompile()
    {
        echoJson(BxDolStudioLanguagesUtils::getInstance()->compileLanguage() ? ['toast' => _t('_adm_pgt_scs_recompiled')] : ['msg' => _t('_adm_pgt_err_cannot_recompile_lang')]);
    }

    public function performActionRestore()
    {
        echoJson(BxDolStudioLanguagesUtils::getInstance()->restoreLanguage() ? ['toast' => _t('_adm_pgt_scs_restored')] : ['msg' => _t('_adm_pgt_err_cannot_restore_lang')]);
    }

    protected function _getCellDefault($mixedValue, $sKey, $aField, $aRow)
    {
        $sJsObject = $this->oModule->_oConfig->getJsObject('polyglot');

        $aLangNames = array_keys($this->aLanguages);
        if(in_array($sKey, $aLangNames)) {
            $bAll = false;
            $aActions = array('restore');
            $sOnclickMask = "javascript:%s.%s('%s', '%s')";

            if($aRow['uri'] == $this->sAllUri) {
                $bAll = true;
                $aActions[] = 'recompile';
                $sOnclickMask = "javascript:%s.%s('%s')";
            }

            $mixedValue = '';
            foreach($aActions as $sAction) {
                $sIcon = $this->aActions[$sAction];
                $sTitle = _t('_bx_dev_pgt_txt_manage_' . $sAction . '_title' . ($bAll ? '_plur' : '_sing'));

                $mixedValue .= $this->_oTemplate->parseButton($this->_oTemplate->parseIcon($sIcon), array(
                	'class' => 'bx-btn bx-def-margin-sec-left-auto',
                    'title' => sprintf($sTitle, $aField['title'], $aRow['title']),
                	'onclick' => sprintf($sOnclickMask, $sJsObject, $sAction, $sKey, $aRow['uri'])
                ));
            }
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= " AND `name`<>'system'";

        $aData = array(
            array('id' => 0, 'title' => _t('_bx_dev_pgt_txt_manage_modules_all'), 'uri' => $this->sAllUri)
        );
        return array_merge($aData, parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage));
    }

    private function fillInSelects(&$aInputs)
    {
        $oLanguages = BxDolLanguagesQuery::getInstance();

        $aInputs['language']['values'] = array_merge(array(0 => _t('_sys_please_select')), $oLanguages->getLanguages(true));
        $aInputs['language']['value'] = '';
        
        $aInputs['category']['values'] = $oLanguages->getCategories();
        $aInputs['category']['value'] = BX_DEV_PGT_CATEGORY_CUSTOM;
    }
}
/** @} */
