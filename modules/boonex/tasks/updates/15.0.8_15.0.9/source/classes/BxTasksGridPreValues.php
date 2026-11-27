<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksGridPreValues extends BxBaseModGeneralGrid
{
    protected $_iContextPid;

    protected $_sList;
    protected $_aListInfo;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_tasks';

        parent::__construct ($aOptions, $oTemplate);

        $this->_aConfirmMessages = [
            'delete' => _t('_bx_tasks_grid_action_confirm_pv_delete')
        ];

        if(($sFfName = 'profile_id') && ($iValue = bx_get($sFfName)) !== false) 
            $this->setContextPid($iValue);
        
        if(($sFfName = 'list') && ($sValue = bx_get($sFfName)) !== false) 
            $this->setList($sValue);
    }

    public function setContextPid($iContextPid)
    {
        $this->_iContextPid = (int)$iContextPid;
        $this->_aQueryAppend['profile_id'] = $this->_iContextPid;
    }

    public function setList($sList)
    {
        $this->_sList = bx_process_input($sList);
        $this->_aQueryAppend['list'] = $this->_sList;

        $this->_aListInfo = $this->_oModule->_oDb->getPreLists([
            'sample' => 'name', 
            'name' => $this->_sList
        ]);
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
        return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&profile_id=' . $this->_iContextPid . '&list=' . $this->_sList . '&id=' . $iId;
    }

    public function getCode ($isDisplayHeader = true)
    {
        if(!$this->_isAllowedManage())
            return '';

        return parent::getCode($isDisplayHeader);
    }

    public function getCodeAPI($bForceReturn = false)
    {
        if(!$this->_isAllowedManage())
            return [];

        return parent::getCodeAPI($bForceReturn);
    }

    public function performActionAdd()
    {
        if(!$this->_isAllowedManage())
            return $this->_getActionResult([]);

        if(!$this->_sList)
            return $this->_getActionResult(($sMsg = _t('_bx_tasks_txt_err_empty_pre_list')) && $this->_bIsApi ? bx_api_get_msg($sMsg) : ['msg' => $sMsg]);

        $sAction = 'add';

        $oForm = $this->_getForm($sAction);
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $iId = (int)$oForm->insert(['context_id' => $this->_iContextPid, 'list' => $this->_sList]);                    
            if(!$iId)
                return $this->_getActionResult(['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')]);

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $iId]);
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('pre_values_popup') . $sAction, _t('_bx_tasks_popup_pv_title_' . $sAction), $this->_oModule->_oTemplate->parseHtmlByName('popup_pre_values.html', [
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    public function performActionEdit()
    {
        $sAction = 'edit';

        if(!$this->_isAllowedManage())
            return $this->_getActionResult([]);

        $iItemId = $this->_getIds();
        $aItem = $this->_oModule->_oDb->getPreValues(['sample' => 'id', 'id' => $iItemId]);
        //--- The value comes by its id, so it has to be one of the context the permission is checked for.
        if(!$aItem || (int)($aItem['context_id'] ?? 0) != $this->_iContextPid)
            return $this->_bIsApi ? [] : echoJson([]);

        $oForm = $this->_getForm($sAction, $aItem);
        $oForm->initChecker($aItem);
        if($oForm->isSubmittedAndValid()) {
            if(!$oForm->update($aItem['id']))
                return $this->_getActionResult(['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')]);

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $iItemId]);
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iItemId);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('pre_values_popup') . $sAction, _t('_bx_tasks_popup_pv_title_' . $sAction), $this->_oModule->_oTemplate->parseHtmlByName('popup_pre_values.html', [
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    public function performActionActivate()
    {
        if(!$this->_isAllowedManage())
            return $this->_getActionResult([]);

    	parent::performActionEnable(1);
    }

    public function performActionDeactivate()
    {
        if(!$this->_isAllowedManage())
            return $this->_getActionResult([]);

        parent::performActionEnable(0);
    }

    public function performActionDelete()
    {
        if(!$this->_isAllowedManage())
            return $this->_getActionResult([]);

        return parent::performActionDelete();
    }

    protected function _delete ($mixedId)
    {
        return $this->_isInContext($mixedId) ? parent::_delete($mixedId) : false;
    }

    protected function _enable ($mixedId, $isChecked)
    {
        return $this->_isInContext($mixedId) ? parent::_enable($mixedId, $isChecked) : false;
    }

    /**
     * Values come by their ids, so each has to be one of the context the permission is checked for.
     */
    protected function _isInContext($iId)
    {
        $aItem = $this->_oModule->_oDb->getPreValues(['sample' => 'id', 'id' => (int)$iId]);

        return !empty($aItem) && (int)($aItem['context_id'] ?? 0) == (int)$this->_iContextPid;
    }

    /**
     * A context's properties: the `manage_properties` permission of the viewer's role there; site-wide ones: site administrators.
     */
    protected function _isAllowedManage()
    {
        return $this->_iContextPid ? $this->_oModule->getTimeRights($this->_iContextPid)['manage_properties'] : isAdmin();
    }

    protected function _getActionAdd($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if(!$this->_sList)
            $isDisabled = true;

        return parent::_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getFilterOnChange()
    {
        return $this->_oModule->_oConfig->getJsObject('pre_values') . '.onChangeList(this)';
    }

    protected function _getFilterControls()
    {
        parent::_getFilterControls();

        $sContent = $this->_getFilterSelectOne('list', $this->_sList, $this->_oModule->getPreLists(), '_bx_tasks_grid_filter_item_title_pv_select_one_list');
        $sContent .= $this->_getSearchInput();
        return $sContent;
    }

    protected function _getFilterControlsAPI($aFilters = [])
    {
        $aFilters = [
            'list' => [
                ['value' => '', 'title' => _t('_bx_tasks_grid_filter_item_title_pv_select_one_list')]
            ]
        ];

        $aLists = $this->_oModule->getPreLists();
        foreach($aLists as $sKey => $sValue) 
            $aFilters['list'][] = ['value' => $sKey, 'title' => $sValue];

        return parent::_getFilterControlsAPI($aFilters);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if(!$this->_iContextPid || !$this->_sList)
            return [];

        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(' AND `context_id`=? AND `list`=?', $this->_iContextPid, $this->_sList);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getForm($sAction, $aItem = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aActionParams = [
            'o' => $this->_sObject, 
            'a' => $sAction,
            'profile_id' => $this->_iContextPid,
            'list' => $this->_sList
        ];

        if($aItem)
            $aActionParams['id'] = $aItem['id'];

        $aForm = [
            'form_attrs' => [
                'id' => 'bx-tasks-pre-value-' . $sAction,
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('grid.php', $aActionParams),
                'method' => BX_DOL_FORM_METHOD_DEFAULT
            ],
            'params' => [
                'db' => [
                    'table' => $CNF['TABLE_PRE_VALUES'],
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ],
            ],
            'inputs' => [
                'value' => [
                    'type' => 'hidden',
                    'name' => 'value',
                    'value' => (int)$this->_oModule->_oDb->getPreValues([
                        'sample' => 'value_to_use', 
                        'context_id' => $this->_iContextPid, 
                        'list' => $this->_sList
                    ]),
                    'db' => [
                        'pass' => 'Int',
                    ]
                ],
                'color' => [
                    'type' => 'rgb',
                    'name' => 'color',
                    'caption' => _t('_bx_tasks_form_pv_input_color'),
                    'value' => '',
                    'required' => '0',
                    'db' => [
                        'pass' => 'Xss',
                    ]
                ],
                'title' => [
                    'type' => 'text',
                    'name' => 'title',
                    'caption' => _t('_bx_tasks_form_pv_input_title'),
                    'value' => '',
                    'required' => '1',
                    'db' => [
                        'pass' => 'Xss',
                    ],
                    'checker' => [
                        'func' => 'Avail',
                        'params' => [],
                        'error' => _t('_bx_tasks_form_pv_input_err'),
                    ],
                ],
                'controls' => [
                    'name' => 'controls',
                    'type' => 'input_set',
                    [
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_bx_tasks_form_pv_input_submit'),
                    ], [
                        'type' => 'reset',
                        'name' => 'do_cancel',
                        'value' => _t('_bx_tasks_form_pv_input_cancel'),
                        'attrs' => [
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ],
                    ]
                ]
            ]
        ];

        if($this->_aListInfo && (int)$this->_aListInfo['use_color'] == 0)
            unset($aForm['inputs']['color']);

        return new BxTemplFormView($aForm);
    }

    protected function _getIds()
    {
        if(($aIds = bx_get('ids')) && is_array($aIds))
            return reset($aIds);

        if(($iId = bx_get('id')) !== false) 
            return (int)$iId;

        return false;
    }
}

/** @} */
