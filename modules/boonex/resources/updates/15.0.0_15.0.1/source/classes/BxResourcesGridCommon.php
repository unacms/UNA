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

class BxResourcesGridCommon extends BxBaseModTextGridCommon
{
    protected $_aCategories;

    protected $_iProfileId;

    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_resources';

        parent::__construct ($aOptions, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_aCategories = BxDolFormQuery::getDataItems($CNF['OBJECT_CATEGORY']);

        if(($iProfileId = bx_get('profile_id')) !== false) 
            $this->setProfileId($iProfileId);
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'add':
                $sResult = _t('_bx_resources_grid_popup_title_adm_add');
                break;

            case 'edit':
                $sResult = _t('_bx_resources_grid_popup_title_adm_edit');
                break;
        }

        return $sResult;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
        return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&profile_id=' . $this->_iProfileId . '&a=' . $sAction . '&id=' . $iId;
    }

    public function performActionAdd()
    {
        $sAction = 'add';

        if(!$this->_oModule->isAllowAdd($this->_iProfileId))
            return $this->_bIsApi ? [] : echoJson([]);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $oForm = $this->_getFormObject($sAction);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $aResult = [];

            $iId = $oForm->insert([$CNF['FIELD_ALLOW_VIEW_TO'] => -$this->_iProfileId, $CNF['FIELD_LIST'] => $this->_oModule->getListDefault($this->_iProfileId)]);
            if($iId) {
                $this->_oModule->onPublished($iId); 

                $aResult = ['grid' => $this->getCode(false), 'blink' => $iId];
            }
            else
                $aResult = ['msg' => _t('_bx_resources_txt_err_cannot_perform_action')];

            return $this->_bIsApi ? [] : echoJson($aResult);
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('entry_popup_' . $sAction), _t('_bx_resources_grid_popup_title_adm_add'), $this->_oModule->_oTemplate->parseHtmlByName('popup_form.html', [
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false, 'removeOnClose' => true]]]);
    }

    public function performActionEdit()
    {
        $sAction = 'edit';

        $aEntry = [];
        if(($aIds = $this->_getIds()) !== false) {
            $aEntry = $this->_oModule->_oDb->getContentInfoById(array_shift($aIds));
            if(empty($aEntry) || !is_array($aEntry) || !$this->_oModule->isAllowManage($aEntry))
                return $this->_bIsApi ? [] : echoJson([]);
        }
        else
            return $this->_bIsApi ? [] : echoJson([]);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $iEntryId = (int)$aEntry[$CNF['FIELD_ID']];

        $oForm = $this->_getFormObject($sAction, $aEntry);
        $oForm->initChecker($aEntry);

        if($oForm->isSubmittedAndValid()) {
            $aResult = [];
            if($oForm->update($iEntryId) !== false)
                $aResult = ['grid' => $this->getCode(false), 'blink' => $iEntryId];
            else
                $aResult = ['msg' => _t('_bx_resources_txt_err_cannot_perform_action')];

            return $this->_bIsApi ? [] : echoJson($aResult);
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iEntryId);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('entry_popup_' . $sAction), _t('_bx_resources_grid_popup_title_adm_' . $sAction), $this->_oModule->_oTemplate->parseHtmlByName('popup_form.html', [
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false, 'removeOnClose' => true]]]);
    }

    public function setProfileId($iProfileId)
    {
        $this->_iProfileId = (int)$iProfileId;
        $this->_aQueryAppend['profile_id'] = $this->_iProfileId;   
    }

    protected function _getCellCat($mixedValue, $sKey, $aField, $aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return parent::_getCellDefault($this->_aCategories[$aRow[$CNF['FIELD_CATEGORY']]] ?? '', $sKey, $aField, $aRow);
    }

    protected function _getActionAdd($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if(!$this->_oModule->isAllowAdd($this->_iProfileId))
            return $this->_bIsApi ? [] : '';

        return $this->_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionEdit($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if(!$this->_oModule->isAllowManage($aRow['id']))
            return $this->_bIsApi ? [] : '';

        return $this->_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if(!$this->_iProfileId)
            return [];

        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND ABS(`allow_view_to`)=?", $this->_iProfileId);

        return $this->__getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getFormObject($sAction, $aEntry = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sForm = $CNF['OBJECT_FORM_ENTRY_DISPLAY_' . strtoupper($sAction)];
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $sForm);
        $oForm->setId($sForm);

        $aActionParams = ['o' => $this->_sObject, 'a' => $sAction, 'profile_id' => $this->_iProfileId];
        if(!empty($aEntry['id']))
            $aActionParams['id'] = $aEntry['id'];
        $oForm->setAction(BX_DOL_URL_ROOT . bx_append_url_params('grid.php', $aActionParams));

        return $oForm;
    }

    protected function _getIds()
    {
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId) 
                return false;

            $aIds = [$iId];
        }

        return $aIds;
    }
}

/** @} */
