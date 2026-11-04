<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

class BxResourcesModule extends BxBaseModTextModule 
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $CNF = &$this->_oConfig->CNF;
        $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, [
            $CNF['FIELD_PUBLISHED'],
            $CNF['FIELD_ALLOW_COMMENTS']
        ]);
    }
	
    /**
    * Action methods
    */
    public function actionProcessListForm($iContextId, $iId)
    {
        if(!$this->isAllowAdd($iContextId))
            return '';

        $CNF = &$this->_oConfig->CNF;

        $bAdd = (int)$iId == 0;

        $oForm = null;
        $sPopupTitle = "";
        $aContentInfo = [];
        if ($bAdd) {
            $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_LIST_ENTRY'], $CNF['OBJECT_FORM_LIST_ENTRY_DISPLAY_ADD']);
            $sPopupTitle = _t('_bx_resources_form_list_entry_display_add');
        }
        else {
            $aContentInfo = $this->getListInContext($iId, $iContextId);
            if($aContentInfo === false)
                return '';

            $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_LIST_ENTRY'], $CNF['OBJECT_FORM_LIST_ENTRY_DISPLAY_EDIT']);
            $sPopupTitle = _t('_bx_resources_form_list_entry_display_edit');
        }

        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'process_list_form/' . $iContextId . '/' . $iId . '/';
        if(!$oForm)
            return '';
		
        $oForm->initChecker($aContentInfo, []);
        if($oForm->isSubmittedAndValid()) {
            if ($bAdd)
                $oForm->insert(['context_id' => $iContextId]);
            else
                $oForm->update($iId);

            return echoJson([
                'eval' => $this->_oConfig->getJsObject('main') . '.reloadData(oData, ' . $iContextId . ')',
            ]);
        }
        else {
            $sContent = $this->_oTemplate->parseHtmlByName('popup_form.html', [
                'form_id' => $oForm->getId(),
                'form' => $oForm->getCode(true)
            ]);

            if($oForm->isSubmitted() && !$oForm->isValid()) 
                return echoJson([
                    'form' => $sContent, 
                    'form_id' => $oForm->getId()
                ]);

            echo $sContent;
        }
    }

    public function actionDeleteList($iContextId, $iListId)
    {
        if(!$this->isAllowManageByContext($iContextId))
            return echoJson([]);

        if(!is_array($this->getListInContext($iListId, $iContextId)))
            return echoJson([]);

        $this->_oDb->deleteList($iListId);

        echoJson([
            'context_id' => $iContextId,
        ]);
    }
	
    public function actionProcessEntryForm($iContextId, $iListId = 0)
    {
        if(!$this->isAllowAdd($iContextId))
            return echoJson([]);

        if($this->getListInContext($iListId, $iContextId) === false)
            return echoJson([]);

        $CNF = &$this->_oConfig->CNF;

        $sForm = $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD'];
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $sForm);
        if(!$oForm)
            return echoJson([]);

        $oForm->setId($sForm);
        $oForm->setAction(BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'process_entry_form/' . $iContextId . '/' . $iListId . '/');
        $oForm->setContextId($iContextId);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $iContentId = $oForm->insert([$CNF['FIELD_ALLOW_VIEW_TO'] => -$iContextId, $CNF['FIELD_LIST'] => $iListId ?: $this->getListDefault($iContextId)]);
            if($iContentId)
                $this->onPublished($iContentId);

            return echoJson([
                'eval' => $this->_oConfig->getJsObject('main') . '.reloadData(oData, ' . $iContextId . ')',
            ]);
        }
        else {
            $sContent = $this->_oTemplate->parseHtmlByName('popup_form.html', [
                'form_id' => $oForm->getId(),
                'form' => $oForm->getCode(true)
            ]);

            if($oForm->isSubmitted()) 
                return echoJson(['form' => $sContent, 'form_id' => $oForm->getId()]);

            echo $sContent;
        }
    }

    public function serviceCheckAllowedManageInContext($iContextPid)
    {
        if(!$this->isAllowManageByContext($iContextPid))
            return false;

        return true;
    }

    public function serviceCheckAllowedManage($iContentId)
    {
        if(!$this->isAllowManage($iContentId))
            return false;

        return true;
    }
    
    public function serviceIsAllowBadges($iContentId)
    {
        if (!$this->isAllowManage($iContentId))
            return false;
        
        if (!$this->serviceIsBadgesAvaliable())
            return false;
        
        return true; 
    }

    public function serviceCheckAllowedCommentsPost($iContentId, $sObjectComments) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if($aContentInfo[$CNF['FIELD_ALLOW_COMMENTS']] == 0)
            return false;

        return parent::serviceCheckAllowedCommentsPost($iContentId, $sObjectComments);
    }

    public function serviceCheckAllowedCommentsView($iContentId, $sObjectComments) 
    {
        $CNF = &$this->_oConfig->CNF;

        //negative id used in comments for reports
        if($iContentId < 0)
            return CHECK_ACTION_RESULT_ALLOWED;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if($aContentInfo[$CNF['FIELD_ALLOW_COMMENTS']] == 0)
            return false;

        return parent::serviceCheckAllowedCommentsView($iContentId, $sObjectComments);
    }

    public function serviceManageTools($sType = 'common')
    {
        $aResult = parent::serviceManageTools('common');
        if($sType == 'common' && isset($aResult['menu']))
            unset($aResult['menu']);

        return $aResult;
    }

    public function serviceBrowseContextByCategory($iProfileId = 0, $mixedCategory = false)
    {
        $aParams = [];
        if($mixedCategory)
            $aParams['category'] = $mixedCategory;

        return parent::serviceBrowseContext($iProfileId, $aParams);
    }

    public function serviceBrowseResources($iContextId = 0, $aParams = [])
    {
        if(!$iContextId)
            $iContextId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iContextId)
            return '';

        if(!$this->isAllowView($iContextId))
            return '';  

        if(!($oProfileContext = BxDolProfile::getInstance($iContextId)) || $oProfileContext->checkAllowedProfileView($iContextId) !== CHECK_ACTION_RESULT_ALLOWED)
            return '';

        return $this->_oTemplate->getEntriesList($iContextId);
    }

    /**
     * Common methods
     */
    public function checkAllowedSetThumb ($iContentId = 0)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * A list id from the request has to belong to the context that passed the permission check.
     * Zero is a new list, or no list, and is not looked up.
     *
     * @return array|true|false list row, true when there is no list id, false when it is missing or belongs to another context
     */
    protected function getListInContext($iListId, $iContextId)
    {
        $iListId = (int)$iListId;
        if($iListId === 0)
            return true;

        $CNF = &$this->_oConfig->CNF;

        $aList = $this->_oDb->getList($iListId);
        if(empty($aList) || !is_array($aList) || (int)$aList[$CNF['FIELD_LIST_CONTEXT_ID']] !== (int)$iContextId)
            return false;

        return $aList;
    }

    public function isAllowView($iContextId)
    {
        if(!($oContext = BxDolProfile::getInstance($iContextId)) || $oContext->checkAllowedProfileView($iContextId) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return true;
    }

    public function isAllowAdd($iContextId)
    {
        if(!($oContext = BxDolProfile::getInstance($iContextId)) || $oContext->checkAllowedPostInProfile($iContextId) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return true;
    }

    public function isAllowManageByContext($iContextId)
    {
        if(isAdmin())
            return true;
      
        $oProfileContext = BxDolProfile::getInstance($iContextId);
        if(BxDolService::call($oProfileContext->getModule(), 'is_admin', array($iContextId)))
            return true;
        
        return false;
    }

    public function isAllowManage($mixedContent)
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = !is_array($mixedContent) ? $this->_oDb->getContentInfoById((int)$mixedContent) : $mixedContent;
        if($this->checkAllowedEdit($aContentInfo) === CHECK_ACTION_RESULT_ALLOWED)
            return true;

        if($this->isAllowManageByContext(abs($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']])))
            return true;

        return false;
    }
    
    public function getListDefault($iContextId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aList = $this->_oDb->getListDefault($iContextId);

        $iListId = 0;
        if(empty($aList) || !is_array($aList))
            $iListId = $this->_oDb->addListDefault($iContextId);
        else
            $iListId = (int)$aList[$CNF['FIELD_LIST_ID']];

        return $iListId;
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedManage ($aDataEntry, $isPerformAction = false)
    {
        return $this->isAllowManage($aDataEntry) ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_access_denied');
    }
    
    public function decodeDataAPI($aData, $aParams = [])
    {
        return array_merge(parent::decodeDataAPI($aData, $aParams), [
            'url' => $this->_oTemplate->getUnitLink($aData)
        ]);
    }
}

/** @} */
