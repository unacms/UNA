<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGitHubGridApps extends BxBaseModGeneralGrid
{
    protected $_iProfileId;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_github';

        parent::__construct ($aOptions, $oTemplate);

        if(($sFfName = 'profile_id') && ($iValue = bx_get($sFfName)) !== false) 
            $this->setProfileId($iValue);
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'add':
                $sResult = _t('_bx_github_grid_popup_title_apps_add');
                break;

            case 'edit':
                $sResult = _t('_bx_github_grid_popup_title_apps_edit');
                break;
        }

        return $sResult;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
        return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&id=' . $iId;
    }

    public function setProfileId($iProfileId)
    {
        if($iProfileId != bx_get_logged_profile_id())
            return;

        $this->_iProfileId = (int)$iProfileId;
        $this->_aQueryAppend['profile_id'] = $this->_iProfileId;
    }

    public function performActionAdd()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sAction = 'add';

        $oForm = $this->_getFormObject($sAction, $CNF['OBJECT_FORM_APPS_DISPLAY_ADD']);
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $aApp = $this->_oModule->_oDb->getApps([
                'sample' => 'profile_id', 
                'profile_id' => $this->_iProfileId, 
                'client_id' => $oForm->getCleanValue('client_id')
            ]);

            if($aApp && is_array($aApp))
                return echoJson(['msg' => _t('_bx_github_err_app_already_exists')]);

            if(($iId = (int)$oForm->insert(['profile_id' => $this->_iProfileId, 'added' => time()])) != 0)
                $aRes = ['grid' => $this->getCode(false), 'blink' => $iId];
            else
                $aRes = ['msg' => _t('_bx_github_err_cannot_perform_action')];

            return echoJson($aRes);
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('apps_popup') . $sAction, _t('_bx_github_grid_popup_title_apps_' . $sAction), $this->_oModule->_oTemplate->parseHtmlByName('popup_apps.html', [
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    public function performActionEdit()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sAction = 'edit';

        $iId = $this->_getId();
        $aItem = $this->_oModule->_oDb->getApps(['sample' => 'id', 'id' => $iId]);
        if(!$aItem)
            return echoJson([]);

        $oForm = $this->_getFormObject($sAction, $CNF['OBJECT_FORM_APPS_DISPLAY_EDIT'], ['id' => $iId]);
        $oForm->initChecker($aItem);
        if($oForm->isSubmittedAndValid()) {
            if($oForm->update($aItem['id']) !== false)
                $aRes = ['grid' => $this->getCode(false), 'blink' => $iId];
            else
                $aRes = ['msg' => _t('_bx_github_err_cannot_perform_action')];

            return echoJson($aRes);
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iId);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('apps_popup') . $sAction, _t('_bx_github_grid_popup_title_apps_' . $sAction), $this->_oModule->_oTemplate->parseHtmlByName('popup_apps.html', [
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _getCellCallbackUrl($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = BX_DOL_URL_ROOT . $this->_oModule->_oConfig->getBaseUri() . 'authorize/' . $aRow['id'];

    	return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if(!$this->_iProfileId)
            return false;

        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(' AND `profile_id`=?', $this->_iProfileId);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getFormObject($sAction, $sDisplay, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

    	$oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_APPS'], $sDisplay);
    	$oForm->setId($sDisplay);
        $oForm->setName($sDisplay);
        $oForm->setAction(BX_DOL_URL_ROOT . bx_append_url_params('grid.php', array_merge([
            'o' => $this->_sObject, 
            'a' => $sAction, 
            'profile_id' => $this->_iProfileId
        ], $aParams)));

        return $oForm;
    }

    protected function _getId()
    {
        if(($aIds = bx_get('ids')) && is_array($aIds))
            return reset($aIds);

        if(($iId = bx_get('id')) !== false) 
            return (int)$iId;

        return false;
    }
}

/** @} */
