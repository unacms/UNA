<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Task states
 */
define('BX_TASKS_STATE_BACBLOG', 1);
define('BX_TASKS_STATE_TODO', 2);
define('BX_TASKS_STATE_IN_PROGRESS', 3);
define('BX_TASKS_STATE_IN_REVIEW', 4);
define('BX_TASKS_STATE_CANCELLED', 5);
define('BX_TASKS_STATE_DUPLICATE', 6);
define('BX_TASKS_STATE_DONE', 7);

class BxTasksModule extends BxBaseModTextModule implements iBxDolCalendarService 
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $this->_oConfig->init($this->_oDb);

        $CNF = &$this->_oConfig->CNF;
        $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, array(
            $CNF['FIELD_PUBLISHED'],
            $CNF['FIELD_ALLOW_COMMENTS']
        ));
    }
	
    /**
    * Action methods
    */
	
    /**
     * Get possible recipients for start conversation form
     */
    public function actionAjaxGetInitialMembers($iContextPid)
    {
        $sTerm = bx_get('term');

        header('Content-Type:text/javascript; charset=utf-8');
        echo json_encode($this->serviceGetInitialMembers($iContextPid, $sTerm));
    }

    public function actionSetCompleted($iContentId, $iCompleted)
    {
        return echoJson($this->serviceSetCompleted($iContentId, $iCompleted));
    }

    public function actionApplyFilter($iContextId, $iFilterId)
    {
        return echoJson([
            'content' => $this->serviceApplyFilter($iContextId, $iFilterId),
            'eval' => $this->_oConfig->getJsObject('tasks') . '.onApplyFilter(oData)'
        ]);
    }

    public function actionCreateFilter($iContextId)
    {
        $mixedResult = $this->serviceCreateFilter($iContextId);
        if(is_array($mixedResult))
            return echoJson($mixedResult);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oConfig->getHtmlIds('filter_popup'), _t('_bx_tasks_popup_f_title_add'), $this->_oTemplate->parseHtmlByName('popup_form.html', [
            'form_id' => $mixedResult->getId(),
            'form' => $mixedResult->getCode(true)
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    public function actionProcessTaskListForm($iContextId, $iId)
    {
        $mixedResult = $this->serviceProcessTaskListForm($iContextId, $iId);
        if(($bReload = is_bool($mixedResult) || is_numeric($mixedResult)) || is_array($mixedResult)) {
            if($bReload)
                $mixedResult = [
                    'eval' => $this->_oConfig->getJsObject('tasks') . '.reloadData(oData, ' . $iContextId . ')',
                ];

            return echoJson($mixedResult);
        }

        echo $mixedResult;
    }

    public function actionDeleteTaskList($iContextId, $iId)
    {
        return echoJson($this->serviceDeleteTaskList($iContextId, $iId) ? [
            'context_id' => $iContextId,
        ] : []);
    }

    public function actionProcessTaskForm($iContextId, $iListId)
    {
        $mixedResult = $this->serviceProcessTaskForm($iContextId, $iListId);
        if(($bReload = is_bool($mixedResult) || is_numeric($mixedResult)) || is_array($mixedResult)) {
            if($bReload)
                $mixedResult = [
                    'eval' => $this->_oConfig->getJsObject('tasks') . '.reloadData(oData, ' . $iContextId . ')',
                ];

            return echoJson($mixedResult);
        }

        echo $mixedResult;
    }

    public function actionProcessTaskFormEditProperty($iContentId, $sProperty)
    {
        $mixedResult = $this->serviceProcessTaskFormEditProperty($iContentId, $sProperty);
        if(($bReload = is_bool($mixedResult)) || is_array($mixedResult)) {
            if($bReload)
                $mixedResult = [
                    'eval' => $this->_oConfig->getJsObject('tasks') . '.reload(oData)',
                ];

            return echoJson($mixedResult);
        }

        echo $mixedResult;
    }

    public function actionCalendarData()
    {
        // check permissions
        $aSQLPart = array();
        $iContextId = (int)bx_get('context_id');
        
        if(!$this->isAllowView($iContextId))
            return; 
		
        $oPrivacy = BxDolPrivacy::getObjectInstance($this->_oConfig->CNF['OBJECT_PRIVACY_VIEW']);

        if($iContextId) {
            $aSQLPart = $oPrivacy ? $oPrivacy->getContentByGroupAsSQLPart(- $iContextId) : array();
        }

        // get entries
        $aEntries = $this->_oDb->getEntriesByDate(bx_get('start'), bx_get('end'), bx_get('event'), $aSQLPart);

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($aEntries);
    }

    public function actionProcessTimer($sAction, $iContentId, $iProfileId)
    {
        if(!$this->_iProfileId || $this->_iProfileId != $iProfileId)
            return echoJson(['msg' => _t('_sys_txt_access_denied')]);

        $sName = '';
        if(($sName = bx_get('name')) !== false)
            $sName = bx_process_input($sName);

        $aResult = $this->serviceProcessTimer($sAction, $iContentId, $iProfileId);
        if($aResult['code'] == 0)
            $aResult = array_merge($aResult, [
                'content_id' => $iContentId,
                'profile_id' => $iProfileId,
                'content' => $this->_oTemplate->getTimer($iContentId, $iProfileId, $sName),
                'eval' => $this->_oConfig->getJsObject('timer') . '.onPerformAction' . bx_gen_method_name($sAction) . '(oData)'
            ]);

        return echoJson($aResult);
    }

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'GetInitialMembers' => '',
            'BrowseContext' => '',
            'BrowseTasksByProfile' => '',
            'ProcessTaskListForm' => '',
            'DeleteTaskList' => '',
            'ProcessTaskForm' => '',
            'ProcessTaskFormEditProperty' => '',
            'SetProperty' => '',
            'SetCompleted' => '',
            'CreateFilter' => '',
            'SaveFilter' => '',
            'ApplyFilter' => '',
            'ProcessTimer' => '',
        ]);
    }

    public function serviceGetInitialMembers($iContextPid, $sTerm)
    {
        if($this->_bIsApi) {
            if(!$sTerm)
                return [];

            $aParams = json_decode($sTerm, true);
            if(!isset($aParams['term']))
                return [];

            $sTerm = $aParams['term'];
        }

        $sModule = $this->_oConfig->getName();
        return bx_srv('system', 'profiles_search', [$sTerm, [
            'module' => $sModule,
            'search_params' => ['name' => $sModule . '_initial_members', 'context_pid' => $iContextPid]
        ]], 'TemplServiceProfiles');
    }

    public function serviceProcessTaskListForm($iContextId, $iId)
    {
        if(!$this->isAllowAdd(abs($iContextId)))
            return [];

        $CNF = &$this->_oConfig->CNF;

        $bAdd = $iId == 0;

        $aContentInfo = [];
        $sFormDisplay = $sPopupTitle = '';
        if($bAdd) {
            $sFormDisplay = $CNF['OBJECT_FORM_LIST_ENTRY_DISPLAY_ADD'];
            $sPopupTitle = _t('_bx_tasks_form_list_entry_display_add');
        }
        else {
            $aContentInfo = $this->_oDb->getList($iId);
            $sFormDisplay = $CNF['OBJECT_FORM_LIST_ENTRY_DISPLAY_EDIT'];
            $sPopupTitle = _t('_bx_tasks_form_list_entry_display_edit');
        }

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_LIST_ENTRY'], $sFormDisplay);
        if(!$oForm)
            return [];

	$oForm->setAction(BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'process_task_list_form/' . $iContextId . '/' . $iId . '/');
        $oForm->initChecker($aContentInfo, []);
        if($oForm->isSubmittedAndValid()) {
            $mixedResult = $bAdd ? $oForm->insert(['context_id' => $iContextId]) : (bool)$oForm->update($iId);

            return $this->_bIsApi ? [] : $mixedResult;
        }
        else {
            if($this->_bIsApi)
                return [bx_api_get_block('form', $oForm->getCodeAPI(), [
                    'ext' => [
                        'name' => $this->_aModule['name'], 
                        'request' => ['url' => '/api.php?r=' . $this->_aModule['name'] . '/process_task_list_form/&params[]=' . $iContextId . '&params[]=' . $iId, 'immutable' => true]
                    ]
                ])];

            $sContent = $this->_oTemplate->parseHtmlByName('popup_form.html', [
                'form_id' => $oForm->getId(),
                'form' => $oForm->getCode(true)
            ]);

            if($oForm->isSubmitted())
                return [
                    'form' => $sContent, 
                    'form_id' => $oForm->getId()
                ];

            return $sContent;
        }
    }

    public function serviceDeleteTaskList($iContextId, $iId)
    {
        if(!$this->isAllowManageByContext($iContextId))
            return false;

        $CNF = &$this->_oConfig->CNF;

        $aTasks = $this->_oDb->getTasks($iContextId, $iId);
        if(!empty($aTasks) && ($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION'])) !== false)
            foreach($aTasks as &$aTask)
                $oConnection->onDeleteContent($aTask[$CNF['FIELD_ID']]);

        return $this->_oDb->deleteList($iId);
    }

    public function serviceProcessTaskForm($iContextId, $iListId = 0)
    {
        if(!$this->isAllowAdd($iContextId))
            return [];

        $CNF = &$this->_oConfig->CNF;

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD']);
        if(!$oForm)
            return [];

        $oForm->setAction(BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'process_task_form/' . $iContextId . '/' . $iListId . '/');
        $oForm->setContextId($iContextId);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $iContentId = $oForm->insert([$CNF['FIELD_TASKLIST'] => $iListId]);
            if($iContentId)
                $this->onPublished($iContentId);

            return $this->_bIsApi ? [] : $iContentId;
        }
        else {
            if($this->_bIsApi)
                return [bx_api_get_block('form', $oForm->getCodeAPI(), [
                    'ext' => [
                        'name' => $this->_aModule['name'], 
                        'request' => ['url' => '/api.php?r=' . $this->_aModule['name'] . '/process_task_form/&params[]=' . $iContextId . '&params[]=' . $iListId, 'immutable' => true]
                    ]
                ])];

            $sContent = $this->_oTemplate->parseHtmlByName('popup_form.html', [
                'form_id' => $oForm->getId(),
                'form' => $oForm->getCode(true)
            ]);

            if($oForm->isSubmitted()) 
                return [
                    'form' => $sContent, 
                    'form_id' => $oForm->getId()
                ];

            return $sContent;
        }
    }

    public function serviceProcessTaskFormEditProperty($iContentId, $sProperty)
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(!$this->isAllowAdd(abs($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']])))
            return [];

        $sForm = $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT_' . strtoupper($sProperty)] ?? false;
        if(!$sForm)
            return [];

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $sForm);
        $oForm->setId($sForm);
        $oForm->setName($sForm);
        $oForm->setAction(BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'process_task_form_edit_property/' . $iContentId . '/' . $sProperty . '/');
        if(!$oForm)
            return [];

        $oForm->initChecker($aContentInfo);
        if($oForm->isSubmittedAndValid()) {
            if(!$oForm->update($iContentId))
                return ['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')];

            $mixedPropertyValue = $oForm->getCleanValue($CNF['FIELD_' . strtoupper($sProperty)]);
            if(($sMethod = '_onEdit' . bx_gen_method_name($sProperty)) && method_exists($this, $sMethod))
                $this->$sMethod($aContentInfo, $mixedPropertyValue);
            else
                $this->_onEditProperty($aContentInfo, $sProperty, $mixedPropertyValue);

            return $this->_bIsApi ? [] : true;
        }
        else {
            if($this->_bIsApi)
                return [bx_api_get_block('form', $oForm->getCodeAPI(), [
                    'ext' => [
                        'name' => $this->_aModule['name'], 
                        'request' => ['url' => '/api.php?r=' . $this->_aModule['name'] . '/process_task_form/&params[]=' . $iContextId . '&params[]=' . $sProperty, 'immutable' => true]
                    ]
                ])];

            $sContent = $this->_oTemplate->parseHtmlByName('popup_form.html', [
                'form_id' => $oForm->getId(),
                'form' => $oForm->getCode(true)
            ]);

            if($oForm->isSubmitted())
                return [
                    'form' => $sContent, 
                    'form_id' => $oForm->getId()
                ];

            return $sContent;
        }
    }

    public function serviceSetProperty($iContentId, $sProperty, $mixedValue)
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(!$this->isAllowAdd(abs($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']])))
            return [];

        if(!$this->_oDb->updateEntriesBy([$sProperty => $mixedValue], [$CNF['FIELD_ID'] => $iContentId]))
            return ['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')];

        if(($sMethod = '_onEdit' . bx_gen_method_name($sProperty)) && method_exists($this, $sMethod))
            $this->$sMethod($aContentInfo, $mixedValue);
        else
            $this->_onEditProperty($aContentInfo, $sProperty, $mixedValue);

        return $this->_bIsApi ? [] : true;
    }

    public function serviceSetCompleted($iContentId, $iCompleted)
    {
        if(!$this->isAllowManage($iContentId) || !$this->complete($iContentId, $iCompleted))
            return ['code' => 1];

        return $this->_bIsApi ? [
            'title' => _t('_bx_tasks_menu_item_title_system_set_' . ($iCompleted ? 'un' : '') . 'completed'),
            'request_url' => $this->_aModule['name'] . '/set_completed/&params[]=' . $iContentId . '&params[]=' . (1 - $iCompleted),
        ] : [
            'code' => 0, 
            'reload' => 1
        ];
    }

    public function serviceCreateFilter($iContextId)
    {
        $iAuthorId = bx_get_logged_profile_id();
        $iFilterId = $this->_oDb->getTemporaryFilterId($iContextId, $iAuthorId);

        $oForm = $this->_getFilterForm($iContextId);
        if(!$oForm)
            return [];

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $aValsToAdd = [
                'context_id' => $iContextId,
                'author' => $iAuthorId, 
                'added' => time()
            ];

            $sTitle = '';
            $aValues = [];
            foreach($oForm->aInputs as $sName => $aInput) {
                if(in_array($sName, ['save_me', 'save_all', 'title', 'controls']))
                    continue;

                if(($mixedValue = $oForm->getCleanValue($sName))) {
                    $sFltTitle = '';
                    if(($aFltValues = $aInput['values'] ?? false) && is_array($aFltValues))
                        $sFltTitle = ' (' . (is_array($mixedValue) ? implode(', ', array_intersect_key($aFltValues, array_flip($mixedValue))) : $aFltValues[$mixedValue]) . ')';

                    $sTitle .= $aInput['caption'] . $sFltTitle . ' + ';
                    $aValues[] = [
                        'f' => $sName,
                        'v' => $mixedValue,
                        'r' => ($mixedR = $oForm->getCleanValue($sName . '_reverse')) !== false ? (int)$mixedR : 0
                    ];
                }
            }

            if($aValues && is_array($aValues) && ($aCnds = $this->_getFilterConditions($iContextId, $aValues)))
                $aValsToAdd['conditions'] = json_encode($aCnds);

            if(($bForAll = $oForm->getCleanValue('save_all') == 'on') || ($oForm->getCleanValue('save_me') == 'on')) {
                $aValsToAdd = array_merge($aValsToAdd, [
                    'author' => $bForAll ? 0 : $iAuthorId,
                    'title' => $oForm->getCleanValue('title') ?: $sFltTitle,
                    'permanent' => 1
                ]);
            }
            else
                $aValsToAdd['title'] = trim($sTitle, " +");

            $aRes = [];
            if(($iFilterId && $oForm->update($iFilterId, $aValsToAdd)) || (!$iFilterId && ($iFilterId = (int)$oForm->insert($aValsToAdd)) != 0)) {
                $this->applyFilter($iContextId, $iFilterId);

                $aRes = $this->_bIsApi ? [] : ['reload' => 1];
            }
            else
                $aRes = ($sMsg = _t('_bx_tasks_txt_err_cannot_perform_action')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['msg' => $sMsg];

            return $aRes;
        }

        return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), [
            'ext' => [
                'name' => $this->_aModule['name'], 
                'request' => ['url' => '/api.php?r=' . $this->_aModule['name'] . '/create_filter/&params[]=' . $iContextId, 'immutable' => true]
            ]
        ])] : $oForm;
    }

    public function serviceSaveFilter($iContextId, $iFilterId = 0)
    {
        $iAuthorId = bx_get_logged_profile_id();
        $iFilterId = $iFilterId ?: $this->_oDb->getTemporaryFilterId($iContextId, $iAuthorId);

        $oForm = $this->_getSaveFilterForm($iContextId);
        if(!$oForm)
            return [];

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $aValsToAdd = [
                'author' => $oForm->getCleanValue('save_all') == ($this->_bIsApi ? 1 : 'on') ? 0 : $iAuthorId,
                'title' => $oForm->getCleanValue('title'),
                'permanent' => 1
            ];

            $aRes = [];
            if($oForm->update($iFilterId, $aValsToAdd)) {
                $this->applyFilter($iContextId, $iFilterId);

                $aRes = $this->_bIsApi ? [] : ['reload' => 1];
            }
            else
                $aRes = ($sMsg = _t('_bx_tasks_txt_err_cannot_perform_action')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['msg' => $sMsg];

            return $aRes;
        }

        return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), [
            'ext' => [
                'name' => $this->_aModule['name'], 
                'request' => ['url' => '/api.php?r=' . $this->_aModule['name'] . '/save_filter/&params[]=' . $iContextId, 'immutable' => true]
            ]
        ])] : $oForm;
    }

    public function serviceApplyFilter($iContextId, $iFilterId)
    {
        $this->applyFilter($iContextId, $iFilterId);

        return $this->_oTemplate->getEntries($iContextId, ['filter' => $iFilterId]);
    }

    public function serviceProcessTimer($sAction, $iContentId, $iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = ['code' => 1, 'msg' => _t('_sys_txt_error_occured')];

        $iNow = time();
        switch($sAction) {
            case 'start':
                $this->pauseTimerByAuthor($iProfileId);

                $iTimer = false;
                $aTimer = $this->getTimer($iContentId, $iProfileId);
                if($aTimer && is_array($aTimer)) {
                    if($this->updateTimerById($aTimer['id'], ['started' => $iNow]))
                        $iTimer = $aTimer['id'];
                }
                else
                    $iTimer = $this->_oDb->insertTimer(['content_id' => $iContentId, 'profile_id' => $iProfileId, 'started' => $iNow]);

                if($iTimer !== false)
                    $aResult = $this->_bIsApi ? $this->_oTemplate->getTimer($iContentId, $iProfileId) : ['code' => 0, 'id' => $iTimer];
                break;

            case 'pause':
                if($this->pauseTimerByAuthor($iProfileId))
                    $aResult = $this->_bIsApi ? $this->_oTemplate->getTimer($iContentId, $iProfileId) : ['code' => 0];
                break;

            case 'resume':
                $this->pauseTimerByAuthor($iProfileId);

                $aTimer = $this->getTimer($iContentId, $iProfileId);
                if($aTimer && is_array($aTimer) && $this->updateTimerById($aTimer['id'], ['started' => $iNow]))
                    $aResult = $this->_bIsApi ? $this->_oTemplate->getTimer($iContentId, $iProfileId) : ['code' => 0];
                break;

            case 'reload':
                $aTimer = $this->getTimer($iContentId, $iProfileId);

                $aResult = $this->_bIsApi ? $this->_oTemplate->getTimer($iContentId, $iProfileId) : [
                    'code' => 0,
                    'started' => $aTimer && ($aTimer['started'] ?? 0) != 0
                ];
                break;

            case 'log':
                $this->pauseTimerByAuthor($iProfileId);

                $aTimer = $this->getTimer($iContentId, $iProfileId);
                if(!$aTimer || !is_array($aTimer) || !$aTimer['duration'])
                    break;

                list($iH, $iM) = $this->_oConfig->timeI2A($aTimer['duration'], true);

                $iNow = time();
                $iTrackId = $this->_oDb->insertTimeTrack([
                    'object_id' => $iContentId,
                    'author_id' => $iProfileId,
                    'author_nip' => $iProfileId == $this->_iProfileId ? bx_get_ip_hash(getVisitorIP()) : 0,
                    'value' => $this->_oConfig->timeA2I([(int)$iH, (int)$iM + 1]),
                    'value_date' => $iNow,
                    'date' => $iNow
                ]);
                if(!$iTrackId)
                    break;

                $oTime = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS_TIME'], $iContentId);
                if(!$oTime || !$oTime->isEnabled())
                    break;

                if(!$oTime->putReport($iContentId, $iProfileId, $iTrackId))
                    break;

                $this->_oDb->deleteTimer([
                    'content_id' => $iContentId, 
                    'profile_id' => $iProfileId
                ]);

                $aResult = $this->_bIsApi ? $this->_oTemplate->getTimer($iContentId, $iProfileId) : ['code' => 0];
                break;

            case 'log_all':
                $aTimers = $this->getTimersByAuthor($iProfileId);

                $iAffected = 0;
                foreach($aTimers as $aTimer) {
                    $aSubResult = $this->serviceProcessTimer('log', $aTimer['content_id'], $iProfileId);
                    if(($aSubResult['code'] ?? false) === 0 || ($this->_bIsApi && ($aSubResult['id'] ?? false)))
                        $iAffected++;
                }

                if(count($aTimers) == $iAffected)
                    $aResult = ['code' => 0, 'reload' => 1];
                break;

            case 'clear':
                if($this->_oDb->deleteTimer(['content_id' => $iContentId, 'profile_id' => $iProfileId]) !== false)
                    $aResult = $this->_bIsApi ? $this->_oTemplate->getTimer($iContentId, $iProfileId) : ['code' => 0];
                break;

            case 'clear_all':
                $aTimers = $this->getTimersByAuthor($iProfileId);

                $iAffected = 0;
                foreach($aTimers as $aTimer) {
                    $aSubResult = $this->serviceProcessTimer('clear', $aTimer['content_id'], $iProfileId);
                    if(($aSubResult['code'] ?? false) === 0)
                        $iAffected++;
                }

                if(count($aTimers) == $iAffected)
                    $aResult = ['code' => 0, 'reload' => 1];
                break;
        }

        return $aResult;
    }

    public function serviceManageTools($sType = 'common')
    {
        $mixedResults = parent::serviceManageTools($sType);
        if(!$mixedResults)
            return $mixedResults;

        if($this->_bIsApi)
            return $mixedResults;

        if(isset($mixedResults['menu']))
            unset($mixedResults['menu']);

        return $mixedResults;
    }

    public function serviceGetBlockMenuBrowse()
    {
        $mixedResult = $this->_oTemplate->getBlockMenuBrowse();

        return $this->_bIsApi ? [
            bx_api_get_block('tasks_menu', $mixedResult)
        ] : $mixedResult;
    }

    public function serviceGetBlockMenuContext($iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->isAllowView($iProfileId))
            return $this->_bIsApi ? [] : ''; 

        $oMenu = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_SUBMENU_VIEW_CONTEXT']);
        if(!$oMenu)
            return $this->_bIsApi ? [] : '';

        $oMenu->setContextId($iProfileId);
        return $this->_bIsApi ? [bx_api_get_block('menu', [
            'title' => '', 
            'content' => $oMenu->getCodeAPI()
        ])] : $oMenu->getCode();
    }

    public function serviceGetBlockContextPreValues($iContextPid = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->isAllowManageByContext($iContextPid))
            return $this->_bIsApi ? [] : '';

        $bContextPid = !empty($iContextPid);
        
        $sGrid = $CNF['OBJECT_GRID_PRE_VALUES'];
        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid)
            return $this->_bIsApi ? [] : '';

        if($bContextPid)
            $oGrid->setContextPid($iContextPid);

        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        $this->_oTemplate->addCss(['manage_tools.css']);
        $this->_oTemplate->addJs(['modules/base/text/js/|manage_tools.js', 'pre_values.js']);
        $this->_oTemplate->addJsTranslation(['_sys_grid_search']);
        $aResult = [
            'content' => $this->_oTemplate->getJsCode('pre_values', [
                'sObjNameGrid' => $sGrid,
                'sPageUrl' => BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($CNF['URL_CONTEXT_VALUES'], ['profile_id' => $iContextPid])
            ]) . $oGrid->getCode()
        ];

        return $aResult;
    }

    public function serviceGetBlockContextAuthorize($iContextPid = 0)
    {
        $sModule = 'bx_github';
        $sMethod = 'get_block_authorize';
        if(!bx_is_srv($sModule, $sMethod))
            return '';

        $aContext = $this->_oDb->getContexts(['sample' => 'id', 'id' => $iContextPid]);
        if(empty($aContext) || !is_array($aContext) || empty($aContext['gh_app_id']) || empty($aContext['gh_username']) || empty($aContext['gh_repository']))
            return '';

        return bx_srv($sModule, $sMethod, [$aContext['gh_app_id']]);
    }

    public function serviceGetBlockContextSettings($iContextPid = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $iContextAuthorPid = 0;
        if(!$this->isAllowManageByContext($iContextPid) || !($iContextAuthorPid = $this->getContextAuthorId($iContextPid)))
            return $this->_bIsApi ? [] : '';

        $aContext = $this->_oDb->getContexts(['sample' => 'id', 'id' => $iContextPid]);
        $bContext = !empty($aContext) && is_array($aContext);

        $sMessageText = '';
        $iMessageTimer = 0;

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_CONTEXT'], $CNF['OBJECT_FORM_CONTEXT_DISPLAY_EDIT']);
        $oForm->setProfileId($iContextAuthorPid);
        $oForm->initChecker($aContext);
        if($oForm->isSubmittedAndValid()) {
            if(!$bContext)
                $bResult = $oForm->insert(['id' => $iContextPid]);
            else
                $bResult = $oForm->update($iContextPid) !== false;

            $sMessageText = '_bx_tasks_txt' . (!$bResult ? '_err_cannot' : '_msg') . '_perform_action';
            $iMessageTimer = $bResult ? 3 : 0;
        }

        return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), [
            'ext' => [
                'name' => $oForm->getName(),
                'request' => ['url' => '/api.php?r=' . $this->_aModule['name'] . '/get_block_context_settings&profile_id=' . $iContextPid, 'immutable' => true]
            ]
        ])] : (!empty($sMessageText) ? MsgBox(_t($sMessageText), $iMessageTimer) : '') . $oForm->getCode();
    }

    public function serviceGetBlockManageTime($sType = 'common', $iContextPid = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $bContextPid = !empty($iContextPid);

        $sGrid = $CNF['OBJECT_GRID_TIME_' . ($bContextPid ? 'CONTEXT_' : '') . strtoupper($sType)];
        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid)
            return $this->_bIsApi ? [] : '';

        if($bContextPid)
            $oGrid->setContextPid($iContextPid);

        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        list($aCssCalendar, $aJsCalendar) = BxBaseFormView::getCssJsCalendar();

        $this->_oTemplate->addCss(array_merge($aCssCalendar, ['manage_tools.css', 'time.css']));
        $this->_oTemplate->addJs(array_merge($aJsCalendar, ['modules/base/text/js/|manage_tools.js', 'time.js']));
        $this->_oTemplate->addJsTranslation(['_sys_grid_search']);
        $aResult = [
            'content' => $this->_oTemplate->getJsCode('time', [
                'sObjNameGrid' => $sGrid
            ]) . $oGrid->getCode()
        ];

        if(!$bContextPid)
            $aResult['menu'] = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_MANAGE_TOOLS_SUBMENU']);

        return $aResult;
    }

    public function serviceGetBlockTimers()
    {
        $mixedResult = $this->_oTemplate->getBlockTimers($this->_iProfileId);

        return $this->_bIsApi ? [
            bx_api_get_block('tasks_timers', $mixedResult)
        ] : $mixedResult;
    }

    /**
     * Data for Timeline module
     */
    public function serviceGetTimelineData()
    {
    	$sModule = $this->_aModule['name'];
        return array(
            'handlers' => array(
                array('group' => $sModule . '_object', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'added', 'module_name' => $sModule, 'module_method' => 'get_timeline_post', 'module_class' => 'Module', 'groupable' => 0, 'group_by' => ''),
                array('group' => $sModule . '_completed', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'completed', 'module_name' => $sModule, 'module_method' => 'get_timeline_completed', 'module_class' => 'Module',  'groupable' => 0, 'group_by' => ''),
                array('group' => $sModule . '_reopened', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'reopened', 'module_name' => $sModule, 'module_method' => 'get_timeline_reopened', 'module_class' => 'Module',  'groupable' => 0, 'group_by' => ''),
                array('group' => $sModule . '_object', 'type' => 'update', 'alert_unit' => $sModule, 'alert_action' => 'edited'),
                array('group' => $sModule . '_object', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'deleted'),
            ),
            'alerts' => array(
                array('unit' => $sModule, 'action' => 'added'),
                array('unit' => $sModule, 'action' => 'completed'),
                array('unit' => $sModule, 'action' => 'reopened'),
                array('unit' => $sModule, 'action' => 'edited'),
                array('unit' => $sModule, 'action' => 'deleted'),
            )
        );
    }

    /**
     * Entry task for Timeline module
     */
    public function serviceGetTimelinePost($aEvent, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::serviceGetTimelinePost($aEvent, $aBrowseParams);
        if(empty($aResult) || !is_array($aResult) || empty($aResult['date']))
            return $aResult;

        $aContentInfo = $this->_oDb->getContentInfoById($aEvent['object_id']);
        if($aContentInfo[$CNF['FIELD_PUBLISHED']] > $aResult['date'])
            $aResult['date'] = $aContentInfo[$CNF['FIELD_PUBLISHED']];

        return $aResult;
    }
	
    public function serviceGetTimelineCompleted($aEvent, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::serviceGetTimelinePost($aEvent, $aBrowseParams);
        if(empty($aResult) || !is_array($aResult) || empty($aResult['date']))
            return $aResult;

        $aContentInfo = $this->_oDb->getContentInfoById($aEvent['object_id']);
        if($aContentInfo[$CNF['FIELD_PUBLISHED']] > $aResult['date'])
            $aResult['date'] = $aContentInfo[$CNF['FIELD_PUBLISHED']];

        $aResult['sample_action'] = $aResult['content']['sample_action'] = _t('_bx_tasks_txt_action_completed');
        return $aResult;
    }

    public function serviceGetTimelineReopened($aEvent, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::serviceGetTimelinePost($aEvent, $aBrowseParams);
        if(empty($aResult) || !is_array($aResult) || empty($aResult['date']))
            return $aResult;

        $aContentInfo = $this->_oDb->getContentInfoById($aEvent['object_id']);
        if($aContentInfo[$CNF['FIELD_PUBLISHED']] > $aResult['date'])
            $aResult['date'] = $aContentInfo[$CNF['FIELD_PUBLISHED']];

        $aResult['sample_action'] = $aResult['content']['sample_action'] = _t('_bx_tasks_txt_action_reopened');
        return $aResult;
    }

    public function serviceGetNotificationsData()
    {
        $sModule = $this->_aModule['name'];

        $sEventPrivacy = $sModule . '_allow_view_event_to';
        if(BxDolPrivacy::getObjectInstance($sEventPrivacy) === false)
            $sEventPrivacy = '';

        $aResult = parent::serviceGetNotificationsData();
        $aResult['handlers'] = array_merge($aResult['handlers'], array(
            array('group' => $sModule . '_completed', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'completed', 'module_name' => $sModule, 'module_method' => 'get_notifications_completed', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            array('group' => $sModule . '_reopened', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'reopened', 'module_name' => $sModule, 'module_method' => 'get_notifications_reopened', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            array('group' => $sModule . '_expired', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'expired', 'module_name' => $sModule, 'module_method' => 'get_notifications_expired', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),

            array('group' => $sModule . '_assign', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'assigned', 'module_name' => $sModule, 'module_method' => 'get_notifications_assigned', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            array('group' => $sModule . '_assign', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'unassigned'),
        ));

        $aResult['settings'] = array_merge($aResult['settings'], array(
            array('group' => 'content', 'unit' => $sModule, 'action' => 'completed', 'types' => array('personal', 'follow_member', 'follow_context')),
            array('group' => 'content', 'unit' => $sModule, 'action' => 'reopened', 'types' => array('personal', 'follow_member', 'follow_context')),
            array('group' => 'content', 'unit' => $sModule, 'action' => 'expired', 'types' => array('personal')),
            array('group' => 'content', 'unit' => $sModule, 'action' => 'assigned', 'types' => array('personal')),
        ));

        $aResult['alerts'] = array_merge($aResult['alerts'], array(
            array('unit' => $sModule, 'action' => 'completed'),
            array('unit' => $sModule, 'action' => 'reopened'),
            array('unit' => $sModule, 'action' => 'expired'),

            array('unit' => $sModule, 'action' => 'assigned'),
            array('unit' => $sModule, 'action' => 'unassigned'),
        ));

        return $aResult; 
    }

    public function serviceGetNotificationsCompleted($aEvent)
    {
        return $this->_serviceGetNotificationsByAction($aEvent, 'completed');
    }

    public function serviceGetNotificationsReopened($aEvent)
    {
        return $this->_serviceGetNotificationsByAction($aEvent, 'reopened');
    }

    public function serviceGetNotificationsExpired($aEvent)
    {
        return $this->_serviceGetNotificationsByAction($aEvent, 'expired');
    }

    public function serviceGetNotificationsAssigned($aEvent)
    {
        return $this->_serviceGetNotificationsByAction($aEvent, 'assigned');
    }

    protected function _serviceGetNotificationsByAction($aEvent, $sAction)
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::serviceGetNotificationsPost($aEvent);
        if(empty($aResult) || !is_array($aResult))
            return $aResult;

        $aResult['entry_author'] = $aEvent['object_owner_id'];
        $aResult['entry_author_name'] = '';
        if(($oAuthor = BxDolProfile::getInstance($aResult['entry_author'])) !== false)
            $aResult['entry_author_name'] = $oAuthor->getDisplayName();

        $sLangKey = '_bx_tasks_txt_notification_' . $sAction;
        if((int)$aEvent['object_privacy_view'] < 0)
            $sLangKey .= '_in_context';

        $aResult['lang_key'] = _t($sLangKey);
        return $aResult;
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

    public function serviceCheckAllowedComplete($iContentId)
    {
        if(!$this->serviceCheckAllowedManage($iContentId))
            return false;

        return !$this->isCompleted($iContentId);
    }
    
    public function serviceCheckAllowedUncomplete($iContentId)
    {
        if(!$this->serviceCheckAllowedManage($iContentId))
            return false;

        return $this->isCompleted($iContentId);
    }

    public function serviceIsCompleted($iContentId)
    {
        return $this->isCompleted($iContentId);
    }

    public function serviceIsUncompleted($iContentId)
    {
        return !$this->isCompleted($iContentId);
    }
    
    public function serviceIsAllowBadges($iContentId)
    {
        if (!$this->isAllowManage($iContentId))
            return false;
        
        if (!$this->serviceIsBadgesAvaliable())
            return false;
        
        return true; 
    }

    public function serviceEntityTextBlock ($iContentId = 0)
    {
        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iContentId)
            return false;
        
        $CNF = &$this->_oConfig->CNF;

        $sResult = '';
        if(!$this->isAllowEdit($iContentId))
            $sResult = parent::serviceEntityTextBlock($iContentId);
        else 
            $sResult = $this->serviceEntityEdit($iContentId, $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT_BODY']);

        return $sResult;
    }

    public function serviceEntityAssignments($iContentId = 0, $bAsArray = false)
    {
        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iContentId)
            return false;

        $CNF = &$this->_oConfig->CNF;

        $aProfiles = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION'])->getConnectedInitiators($iContentId);
        if($bAsArray)
            return $aProfiles;

        $mixedResult = $this->_oTemplate->entryAssignments($aProfiles);

        return $this->_bIsApi ? [
            bx_api_get_block('profiles_list', ['data' => $mixedResult])
        ] : $mixedResult;
    }

    public function serviceEntityTimer($iContentId = 0)
    {
        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iContentId)
            return false;

        $mixedResult = $this->_oTemplate->entryTimer($iContentId, $this->_iProfileId);

        return $this->_bIsApi ? [
            bx_api_get_block('task_timer', $mixedResult)
        ] : $mixedResult;
    }

    public function serviceCheckAllowedCommentsTask($iContentId, $sObjectComments) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if($aContentInfo[$CNF['FIELD_ALLOW_COMMENTS']] == 0)
            return false;

        return parent::serviceCheckAllowedCommentsTask($iContentId, $sObjectComments);
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
	
    /**
     * @page service Service Calls
     * @section bx_tasks Tasks
     * @subsection bx_tasks-page_blocks Page Blocks
     * @subsubsection bx_tasks-calendar calendar
     * 
     * @code bx_srv('bx_tasks', 'calendar', [...]); @endcode
     * 
     * Shows tasks calendar baced on die date
     * 
     * @param $aData additional data to point which events to show, leave empty to show all events, specify event's ID in 'event' array key to show calendar for one event only, specify context's ID in 'context_id' array key to show calendar for one context events only. If only one event is specified then it will show calendar only if it's repeating event.
     * @param $sTemplate template to use to show calendar, or leave empty for default template, possible options: calendar.html, calendar_compact.html
     * @return HTML string with calendar to display on the site, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML. On error empty string is returned.
     *
     * @see BxTasksModule::serviceCalendar
     */
    /** 
     * @ref bx_tasks-calendar "calendar"
     */
    public function serviceCalendar($aData = array(), $sTemplate = 'calendar.html')
    {
        if (!$this->isAllowView($aData['context_id']))
            return; 
        
        $o = new BxTemplCalendar(array(
            'eventSources' => array (
                bx_append_url_params(BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'calendar_data', $aData),
            ),
        ), $this->_oTemplate);
        return $o->display($sTemplate);
    }
	
    public function serviceGetCalendarEntries($iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;
        $oConn = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION']);
        $aData = $oConn->getConnectedInitiators($iProfileId);
        $aData2 = array(0);
        foreach($aData as $iProfileId2) {
            $oProfile = BxDolProfile::getInstance($iProfileId2);
            array_push($aData2, $oProfile->getContentId());
        }
        $aSQLPart['where'] = " AND " . $CNF['TABLE_ENTRIES'] . ".`" . $CNF['FIELD_ID'] . "` IN(" . implode(',', $aData2) . ")";
        return $this->_oDb->getEntriesByDate(bx_get('start'), bx_get('end'), null, $aSQLPart);
    }

    public function serviceBrowseHome($aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $sContent = '';
        if(($iContextPid = bx_process_input(bx_get('context_pid'), BX_DATA_INT))) {
            $sContent = $this->serviceBrowseTasks($iContextPid);
            if($sContent && ($oProfile = BxDolProfile::getInstance($iContextPid)) !== false)
                return [
                    'title' => bx_replace_markers(_t('_bx_tasks_page_block_title_entries_in_context'), [
                        'display_name' => $oProfile->getDisplayName(),
                        'profile_link' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_CONTEXT_ENTRIES'], ['profile_id' => $iContextPid]))
                    ]),
                    'content' => $sContent
                ];
        }
        else
            $sContent = $this->serviceBrowseTasksByProfile();

        return $sContent ?: MsgBox(_t('_Empty'));
    }

    public function serviceBrowseContext($iProfileId = 0, $aParams = [])
    {
        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            return '';

        if($this->_bIsApi && is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams);

        return $this->serviceBrowseTasks ($iProfileId, $aParams);
    }

    public function serviceBrowseTasks($iContextId = 0, $aParams = [])
    {
        if(!$this->isAllowView($iContextId))
            return $this->_bIsApi ? [] : '';

        $mixedResult = $this->_oTemplate->getEntriesList($iContextId, $aParams);

        return $this->_bIsApi ? [
            bx_api_get_block('tasks_list', $mixedResult)
        ] : $mixedResult;
    }

    public function serviceBrowseTasksByProfile($iProfileId = 0, $aParams = [])
    {
        if(!$iProfileId && $this->_iProfileId)
            $iProfileId = $this->_iProfileId;

        $mixedResult = $this->_oTemplate->getEntriesList(0, array_merge($aParams, [
            'for_profile' => $iProfileId
        ]));
 
        return $this->_bIsApi ? [
            bx_api_get_block('tasks_list', $mixedResult)
        ] : $mixedResult;
    }

    /**
     * Common methods
     */
    public function getModuleTitle($sName)
    {
        $sResult = $sName;

        if(($_sTitle = '_' . $sName) && ($sTitle = _t($_sTitle)) && strcmp($_sTitle, $sTitle) != 0)
            $sResult = $sTitle;
        else if(($aModule = $this->_oDb->getModuleByName($sName)) && is_array($aModule))
            $sResult = $aModule['title'] ?? _t('_undefined');

        return $sResult;
    }

    public function getAssignees()
    {
        $aResults = [];
        if(($oProfile = BxDolProfile::getInstance()) !== false && ($aIds = $this->_oDb->getTimeTracks(['sample' => 'assignees'])))
            foreach($aIds as $iId)
                $aResults[] = ['key' => $iId, 'value' => $oProfile->getDisplayName($iId)];

        return $aResults;
    }
    
    public function getPreLists()
    {
        $CNF = &$this->_oConfig->CNF;

        $aResults = [];
        if(($aPreLists = $this->_oDb->getPreLists(['sample' => 'all'])) && is_array($aPreLists))
            foreach($aPreLists as $aPreList)
                $aResults[$aPreList['name']] = _t($aPreList['title']);

        return $aResults;
    }

    public function getContexts()
    {
        $aContexts = [];

        $aModules = bx_srv('system', 'get_modules_by_type', ['context', ['name_as_key' => true]]);
        foreach($aModules as $sModule => $aModule)
            $aContexts[$sModule] = ($_sTitle = '_' . $sModule) && ($sTitle = _t($_sTitle)) && strcmp($_sTitle, $sTitle) != 0 ? $sTitle : $aModule['title'];
        
        return $aContexts; 
    }
    
    public function getContextAuthorId($iContextPid)
    {
        $iContextAuthorPid = 0;
        if(($oContext = BxDolProfile::getInstance($iContextPid)) !== false)
            $iContextAuthorPid = bx_srv($oContext->getModule(), 'get_author', [$oContext->getContentId()]);
        
        return $iContextAuthorPid;
    }

    public function getContextMembers($iContextPid)
    {
        $aMembers = [];
        if(($oContext = BxDolProfile::getInstance($iContextPid)) !== false) {
            $aPids = bx_srv($oContext->getModule(), 'fans', [$oContext->getContentId(), true]);
            foreach($aPids as $iPid)
                $aMembers[$iPid] = $oContext->getDisplayName($iPid);
        }

        return $aMembers;
    }

    public function getContextEntries($iContextPid)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEntries = [];
        if(($aTasks = $this->_oDb->getTasks($iContextPid)) && is_array($aTasks))
            foreach($aTasks as $aTask)
                $aEntries[$aTask[$CNF['FIELD_ID']]] = $aTask[$CNF['FIELD_TITLE']];

        return $aEntries;
    }

    public function getTimer($iContentId, $iProfileId)
    {
        return $this->_oDb->getTimers(['sample' => 'content_profile_ids', 'content_id' => $iContentId, 'profile_id' => $iProfileId]);
    }

    public function getTimersByAuthor($iProfileId, $bActive = false)
    {
        return $this->_oDb->getTimers(['sample' => 'profile_id', 'profile_id' => $iProfileId, 'active' => $bActive]);
    }

    public function pauseTimerByAuthor($iProfileId)
    {
        $aTimer = $this->getTimersByAuthor($iProfileId, true);
        if(!$aTimer || !is_array($aTimer) || empty($aTimer['started']))
            return false;

        return $this->updateTimerById($aTimer['id'], [
            'started' => 0,
            'duration' => $aTimer['duration'] + (time() - $aTimer['started']),
        ]);
    }

    public function updateTimerById($iId, $aSet)
    {
        return $this->_oDb->updateTimer($aSet, ['id' => (int)$iId]) !== false;
    }

    public function onPublished($iContentId)
    {
        parent::onPublished($iContentId);

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(!$aContentInfo)
            return;

        $CNF = &$this->_oConfig->CNF;

        if(($iContextId = (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) < 0) {
            $iContextId = abs($iContextId);

            $mixedRepo = $this->ghGetRepository($iContextId);
            if($mixedRepo !== false && ($sMl = 'bx_github') && ($sMd = 'create_issue') && bx_is_srv($sMl, $sMd)) {
                list($sGhUsername, $sGhRepository, $mixedAuth) = $mixedRepo;

                $aFldLoc2Repo = [
                    $CNF['FIELD_STICKERS'] => 'labels', 
                    $CNF['FIELD_TYPE'] => 'type', 
                ];

                $aGhFields = [];
                foreach($aFldLoc2Repo as $sLocField => $sRepoField)
                    if(($sLocValue = $aContentInfo[$sLocField] ?? false))
                        switch($sLocField) {
                            case $CNF['FIELD_STICKERS']:
                                $aStickers = $this->getStickers($sLocValue, $iContextId);
                                if($aStickers && is_array($aStickers)) {
                                    $aGhFields[$sRepoField] = [];
                                    foreach($aStickers as $aSticker)
                                        $aGhFields[$sRepoField][] = $aSticker['title'];
                                }
                                break;

                            case $CNF['FIELD_TYPE']:
                                $aGhFields[$sRepoField] = $this->getType($sLocValue, $iContextId);
                                break;

                            default:
                                $aGhFields[$sRepoField] = $sLocValue;
                        }

                $aIssue = bx_srv($sMl, $sMd, [$sGhUsername, $sGhRepository, $mixedAuth, $aContentInfo[$CNF['FIELD_TITLE']], $aContentInfo[$CNF['FIELD_TEXT']], $aGhFields]);
                if($aIssue && is_array($aIssue) && ($iNumber = (int)($aIssue['number'] ?? 0)) != 0 && ($sUrl = $aIssue['html_url'] ?? '') != '') {
                    $this->_oDb->updateEntriesBy([
                        $CNF['FIELD_GH_ISSUE'] => $iNumber,
                        $CNF['FIELD_GH_ISSUE_URL'] => $sUrl,
                    ], [$CNF['FIELD_ID'] => $iContentId]);

                    $this->logActivity($iContentId, ['key' => '_bx_tasks_txt_msg_synced', 'markers' => [
                        'ghi_link' => $sUrl,
                        'ghi_number' => $iNumber
                    ]]);
                }
            }
        }
    }

    public function onExpired($iContentId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(!$aContentInfo)
            return;

        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION']);
        if($oConnection) {
            $aProfileIds = $oConnection->getConnectedContent($iContentId);
            if(!empty($aProfileIds) && is_array($aProfileIds))
                foreach($aProfileIds as $iProfileId){
                    /**
                     * @hooks
                     * @hookdef hook-bx_tasks-expired 'bx_tasks', 'expired' - hook on task unassigned to profile
                     * - $unit_name - equals `bx_tasks`
                     * - $action - equals `expired`
                     * - $object_id - task id 
                     * - $sender_id - not used 
                     * - $extra_params - array of additional params with the following array keys:
                     *      - `object_author_id` - [int] profile_id for task's author
                     *      - `privacy_view` - [string] privacy view value
                     * @hook @ref hook-bx_tasks-expired
                     */
                    bx_alert($this->getName(), 'expired', $iContentId, false, array(
                        'object_author_id' => $iProfileId,
                        'privacy_view' => $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]
                    ));
                }
        }
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

    public function isAllowEdit($mixedContent)
    {
        $aContentInfo = !is_array($mixedContent) ? $this->_oDb->getContentInfoById((int)$mixedContent) : $mixedContent;
        if($this->checkAllowedEdit($aContentInfo) === CHECK_ACTION_RESULT_ALLOWED)
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

        if(($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION'])) !== false) {
            $iLoggedId = bx_get_logged_profile_id();
            $aProfileIds = $oConnection->getConnectedInitiators($aContentInfo[$CNF['FIELD_ID']]);
            if(!empty($aProfileIds) && is_array($aProfileIds) && in_array($iLoggedId, $aProfileIds))
                return true;
        }

        return false;
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedManage ($aDataEntry, $isPerformAction = false)
    {
        return $this->isAllowManage($aDataEntry) ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_access_denied');
    }

    public function isCompleted($iContentId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);

        return (bool)$aContentInfo[$CNF['FIELD_COMPLETED']];
    }

    public function complete($iContentId, $iCompleted)
    {
        $CNF = &$this->_oConfig->CNF;

        $iCompleted = (int)$iCompleted;
        $this->_oDb->updateEntriesBy([$CNF['FIELD_COMPLETED'] => $iCompleted], [$CNF['FIELD_ID'] => (int)$iContentId]);

        $sModule = $this->getName();
        $sAction = !$iCompleted ? 'reopened' : 'completed';

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        $iContentAuthor = (int)$aContentInfo[$CNF['FIELD_AUTHOR']];
        /**
         * @hooks
         * @hookdef hook-bx_tasks-completed 'bx_tasks', 'completed' - hook on task unassigned to profile
         * - $unit_name - equals `bx_tasks`
         * - $action - can be `completed` or `reopened`
         * - $object_id - task id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_author_id` - [int] profile_id for task's author
         *      - `privacy_view` - [string] privacy view value
         * @hook @ref hook-bx_tasks-completed
         */
        bx_alert($sModule, $sAction, $iContentId, false, array(
            'object_author_id' => $iContentAuthor,
            'privacy_view' => $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]
        ));

        if(($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION'])) !== false) {
            $aProfileIds = $oConnection->getConnectedContent($iContentId);
            if(!empty($aProfileIds) && is_array($aProfileIds))
                foreach($aProfileIds as $iProfileId) {
                    if($iProfileId == $iContentAuthor)
                        continue;

                    bx_alert($sModule, $sAction, $iContentId, false, array(
                        'object_author_id' => $iProfileId,
                        'privacy_view' => $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]
                    ));
                }
        }

        $this->logActivity($iContentId, ['key' => '_bx_tasks_txt_msg_' . ($iCompleted ? '' : 'un') . 'completed']);

        if(($iContextId = (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) < 0 && ($mixedRepo = $this->ghGetRepository(abs($iContextId))) !== false) {
            $sModule = 'bx_github';
            $sMethod = ($iCompleted ? 'close' : 'reopen') . '_issue';
            if(bx_is_srv($sModule, $sMethod) && ($iGhIssue = (int)$aContentInfo[$CNF['FIELD_GH_ISSUE']]) != 0) {
                list($sGhUsername, $sGhRepository, $mixedAuth) = $mixedRepo;

                bx_srv($sModule, $sMethod, [$sGhUsername, $sGhRepository, $mixedAuth, $iGhIssue]);
            }
        }

        return true;
    }

    public function logActivity($iContentId, $aMessage)
    {
        $CNF = &$this->_oConfig->CNF;
        
        $oCmts = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $iContentId);
        if(!$oCmts || !$oCmts->isEnabled())
            return false;

        if(($oAuthor = BxDolProfile::getInstance()) !== false)
            $aMessage['markers'] = array_merge($aMessage['markers'] ?? [], [
                'author_link' => $oAuthor->getUrl(),
                'author_name' => $oAuthor->getDisplayName(),
            ]);

        return $oCmts->addAuto($aMessage);
    }

    public function ghGetRepository($iContextId)
    {
        $mixedRepo = $this->_oDb->getContextRepository($iContextId);
        if($mixedRepo === false) 
            return false;

        return [
            $mixedRepo['gh_username'], 
            $mixedRepo['gh_repository'], 
            $mixedRepo['gh_app_id'] ? [$this->_iProfileId, (int)$mixedRepo['gh_app_id']] : $this->_iProfileId
        ];
    }

    public function ghUpdateIssue($mixedContent, $aGhFields = [])
    {
        $aContentInfo = is_array($mixedContent) ? $mixedContent : $this->_oDb->getContentInfoById((int)$mixedContent);
        if(!$aContentInfo || !is_array($aContentInfo))
            return false;

        $CNF = &$this->_oConfig->CNF;

        $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];
        $iContextId = (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']];
        if($iContextId >= 0) 
            return false;

        $mixedRepo = $this->ghGetRepository(abs($iContextId));
        if($mixedRepo === false) 
            return false;

        list($sGhUsername, $sGhRepository, $mixedAuth) = $mixedRepo;

        $iGhIssue = (int)$aContentInfo[$CNF['FIELD_GH_ISSUE']];

        $sMl = 'bx_github';
        if($aGhFields && ($sMd = 'update_issue') && bx_is_srv($sMl, $sMd))
            if(bx_srv($sMl, $sMd, [$sGhUsername, $sGhRepository, $mixedAuth, $iGhIssue, $aGhFields]) !== false) 
                $this->logActivity($iContentId, ['key' => '_bx_tasks_txt_msg_synced', 'markers' => [
                    'ghi_link' => $aContentInfo[$CNF['FIELD_GH_ISSUE_URL']],
                    'ghi_number' => $iGhIssue
                ]]);

        return true;
    }

    public function getStickers($mixedValues, $iContextId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $aValues = is_array($mixedValues) ? $mixedValues : BxDolFormCheckerHelper::displaySet($mixedValues);

        $aResults = [];
        if($iContextId) {
            $aStickers = $this->_oDb->getPreValues([
                'sample' => 'context_list', 
                'context_id' => $iContextId, 
                'list' => 'sticker'
            ]);

            foreach($aValues as $sValue)
                if(($aSticker = $aStickers[$sValue] ?? false))
                    $aResults[] = [
                        'title' => $aSticker['title'],
                        'color' => $aSticker['color']
                    ];
        }

        if(!$aResults) {
            $aStickers = BxDolForm::getDataItems($CNF['OBJECT_PRE_LIST_STICKERS']);
            foreach($aValues as $sValue)
                $aResults[] = [
                    'title' => $aStickers[$sValue],
                    'color' => ''
                ];
        }

        return $aResults;
    }

    public function getType($mixedValue, $iContextId = 0)
    {
        $sResult = '';

        if($iContextId) {
            $aType = $this->_oDb->getPreValues([
                'sample' => 'context_list_value', 
                'context_id' => $iContextId, 
                'list' => 'type',
                'value' => $mixedValue
            ]);

            if($aType && is_array($aType))
                $sResult = $aType['title'];
        }
        
        if(!$sResult && ($sTypeTitle = $this->_oConfig->getTypeTitle($mixedValue)) != '')
            $sResult = _t($sTypeTitle);

        return $sResult;
    }

    public function applyFilter($iContextId, $iFilterId)
    {
        $sCookieKey = $this->_oConfig->CNF['COOKIE_SETTING_KEY'];

        $aFilters = [];
        if(isset($_COOKIE[$sCookieKey]))
            $aFilters = json_decode($_COOKIE[$sCookieKey], true);

        if(($iFilterId = (int)$iFilterId) != 0)
            $aFilters[$iContextId] = $iFilterId;
        else
            unset($aFilters[$iContextId]);

        bx_setcookie($sCookieKey, json_encode($aFilters), time() + 60 * 60 * 24 * 365);
    }

    /**
     * Internal methods
     */
    protected function _onEditProperty($aContentInfo, $sProperty, $mixedValue)
    {
        $CNF = &$this->_oConfig->CNF;
        $aPropLoc2Repo = [
            $CNF['FIELD_TYPE'] => 'type',
        ];

        $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];

        if(($sMethod = 'get' . bx_gen_method_name($sProperty) . 'Title') && method_exists($this->_oConfig, $sMethod))
            $mixedValue = $this->_oConfig->$sMethod($mixedValue);

        $this->logActivity($iContentId, ['key' => '_bx_tasks_txt_msg_edit_' . $sProperty, 'markers' => ['value' => $mixedValue]]);

        if(($sPropRepo = $aPropLoc2Repo[$sProperty] ?? false))
            $this->ghUpdateIssue($aContentInfo, [
                $sPropRepo => _t($mixedValue)
            ]);        
    }

    protected function _onEditState($aContentInfo, $iState)
    {
        $CNF = &$this->_oConfig->CNF;

        $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];

        $this->logActivity($iContentId, ['key' => '_bx_tasks_txt_msg_edit_state', 'markers' => ['value' => $this->_oConfig->getStateTitle($iState)]]);

        $iCompleted = (int)$this->_oConfig->isCompleted($iState);
        if($iCompleted != (int)$this->_oConfig->isCompleted($aContentInfo[$CNF['FIELD_STATE']]))
            $this->complete($iContentId, $iCompleted);
    }

    protected function _getFilterConditions($iContextId = 0, $aItems = [])
    {
        $iJoins = 0;
        $aResult = [
            'join' => [],
            'where' => []
        ];

        if(count($aItems) > 1) {
            $aResult['where'] = ['grp' => true, 'o' => 'AND', 'cnds' => []];

            foreach($aItems as $aItem)
                if(($mixedCnd = $this->_getFilterCondition($iContextId, $aItem)) !== false) {
                    if(isset($mixedCnd['join'])) {
                        $iJoins++;
                        $aResult['join'][] = $mixedCnd['join'];
                    }

                    if(isset($mixedCnd['where']))
                        $aResult['where']['cnds'][] = $mixedCnd['where'];
                }
        }
        else {
            $mixedCnd = $this->_getFilterCondition($iContextId, reset($aItems));

            if(isset($mixedCnd['join'])) {
                $iJoins++;
                $aResult['join'][] = $mixedCnd['join'];
            }

            if(isset($mixedCnd['where']))
                $aResult['where'] = $mixedCnd['where'];
        }

        if($iJoins == 1)
            $aResult['join'] = reset($aResult['join']);
        else if($iJoins > 1)
            $aResult['join'] = ['grp' => true, 'cnds' => $aResult['join']];

        return $aResult;
    }

    protected function _getFilterCondition($iContextId = 0, $aItem = [])
    {
        $sMethod = '_getFilterCondition' . bx_gen_method_name($aItem['f']);
        if(method_exists($this, $sMethod))
            return $this->$sMethod($iContextId, $aItem);

        $mixedV = $mixedO = false;
        if(!($bArray = is_array($aItem['v'])) || count($aItem['v']) == 1) {
            $mixedV = $bArray ? reset($aItem['v']) : $aItem['v'];
            $mixedO = '=';
        }
        else {
            $mixedV = $aItem['v'];
            $mixedO = !($aItem['r'] ?? 0) ? 'IN' : 'NOT IN';
        }

        if(!$mixedV || !$mixedO)
            return false;

        return [
            'where' => ['cnd' => true, 't' => 'te', 'f' => $aItem['f'], 'v' => $mixedV, 'o' => $mixedO]
        ];
    }
    
    protected function _getFilterConditionInitialMembers ($iContextId = 0, $aItem = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $mixedV = $mixedO = false;
        if(!($bArray = is_array($aItem['v'])) || count($aItem['v']) == 1) {
            $mixedV = $bArray ? reset($aItem['v']) : $aItem['v'];
            $mixedO = '=';
        }
        else {
            $mixedV = $aItem['v'];
            $mixedO = !($aItem['r'] ?? 0) ? 'IN' : 'NOT IN';
        }

        return [
            'join' => ['cnd' => true, 'j' => 'LEFT', 'tj' => $CNF['TABLE_ASSIGNMENTS'], 'taj' => 'ta', 'fj' => 'content', 'tam' => 'te', 'fm' => 'id'],
            'where' => ['cnd' => true, 't' => 'ta', 'f' => 'initiator', 'v' => $mixedV, 'o' => $mixedO]
        ];
    }

    protected function _getFilterForm($iContextId = 0)
    {
        $CNF = &$this->_oConfig->CNF;
        $sJsObject = $this->_oConfig->getJsObject('tasks');
        
        $aFieldToList = [
            $CNF['FIELD_TYPE'] => $CNF['OBJECT_PRE_LIST_TYPES'],
            $CNF['FIELD_PRIORITY'] => $CNF['OBJECT_PRE_LIST_PRIORITIES'],
            $CNF['FIELD_ESTIMATE'] => $CNF['OBJECT_PRE_LIST_ESTIMATES'],
            $CNF['FIELD_STATE'] => $CNF['OBJECT_PRE_LIST_STATES']
        ];

        $aForm = [
            'form_attrs' => [
                'id' => 'bx-tasks-filter-add',
                'action' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'create_filter/' . $iContextId,
                'method' => BX_DOL_FORM_METHOD_DEFAULT
            ],
            'params' => [
                'db' => [
                    'table' => $CNF['TABLE_FILTERS'],
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_apply'
                ],
            ],
            'inputs' => [
                $CNF['FIELD_AUTHOR'] => [
                    'type' => 'checkbox_set',
                ],
                $CNF['FIELD_INITIAL_MEMBERS'] => [
                    'type' => 'checkbox_set',
                ],
                $CNF['FIELD_TYPE'] => [
                    'type' => 'checkbox_set',
                ],
                $CNF['FIELD_PRIORITY'] => [
                    'type' => 'checkbox_set',
                ],
                $CNF['FIELD_ESTIMATE'] => [
                    'type' => 'checkbox_set',
                ],
                $CNF['FIELD_STATE'] => [
                    'type' => 'checkbox_set',
                ],
                'save_me' => [
                    'type' => 'switcher',
                    'name' => 'save_me',
                    'caption' => _t('_bx_tasks_form_f_input_save_me'),
                    'value' => 'on',
                    'attrs' => [
                        'onchange' => $sJsObject . '.onChangeSave(this)'
                    ]
                ],
                'save_all' => [
                    'type' => 'switcher',
                    'name' => 'save_all',
                    'caption' => _t('_bx_tasks_form_f_input_save_all'),
                    'value' => 'on',
                    'attrs' => [
                        'onchange' => $sJsObject . '.onChangeSave(this)'
                    ]
                ],
                'title' => [
                    'type' => 'text',
                    'name' => 'title',
                    'caption' => _t('_bx_tasks_form_f_input_title'),
                    'value' => '',
                    'required' => '0',
                    'tr_attrs' => [
                        'class' => 'bx-tasks-ffi-hidden'
                    ]
                ],
                'controls' => [
                    'name' => 'controls',
                    'type' => 'input_set',
                    [
                        'type' => 'submit',
                        'name' => 'do_apply',
                        'value' => _t('_bx_tasks_form_f_input_apply'),
                    ], [
                        'type' => 'reset',
                        'name' => 'do_cancel',
                        'value' => _t('_bx_tasks_form_f_input_cancel'),
                        'attrs' => [
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ],
                    ]
                ]
            ]
        ];

        foreach($aForm['inputs'] as $sName => $aInput) {
            if(isset($aInput['name']))
                continue;

            $aForm['inputs'][$sName] = array_merge($aForm['inputs'][$sName], [
                'name' => $sName,
                'caption' => _t('_bx_tasks_form_f_input_' . $sName),
                'value' => '',
                'values' => []
            ]);

            if(($sList = $aFieldToList[$sName] ?? false) && ($aList = BxDolForm::getDataItems($sList))) {
                if(isset($aList['']))
                    unset($aList['']);

                $aForm['inputs'][$sName]['values'] = $aList;
            }
        }

        $oContext = false;
        $sContextModule = '';
        if($iContextId && ($oContext = BxDolProfile::getInstance($iContextId)) !== false)
            $sContextModule = $oContext->getModule();

        foreach([$CNF['FIELD_AUTHOR'], $CNF['FIELD_INITIAL_MEMBERS']] as $sK){
            if(!isset($aForm['inputs'][$sK])) 
                continue;

            if($oContext !== false) {
                $aForm['inputs'][$sK]['values']['{logged_pid}'] = _t('_bx_tasks_txt_flt_user_current');

                $aMembers = bx_srv($sContextModule, 'fans', [$oContext->getContentId(), true]);
                foreach($aMembers as $iMember)
                    if(($iMember != $this->_iProfileId) && ($oMember = BxDolProfile::getInstance($iMember)) !== false && !($oMember instanceof BxDolProfileUndefined))
                        $aForm['inputs'][$sK]['values'][$iMember] = $oMember->getDisplayName();
            }
            else
                unset($aForm['inputs'][$sK]);
        }

        if(!$oContext || !bx_srv($sContextModule, 'is_admin', [$iContextId, $this->_iProfileId]))
            unset($aForm['inputs']['save_all']);

        return new BxTemplFormView($aForm);
    }

    protected function _getSaveFilterForm($iContextId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $aForm = [
            'form_attrs' => [
                'id' => 'bx-tasks-filter-save',
                'action' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'save_filter/' . $iContextId,
                'method' => BX_DOL_FORM_METHOD_DEFAULT
            ],
            'params' => [
                'db' => [
                    'table' => $CNF['TABLE_FILTERS'],
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_save'
                ],
            ],
            'inputs' => [
                'save_all' => [
                    'type' => 'switcher',
                    'name' => 'save_all',
                    'caption' => _t('_bx_tasks_form_f_input_save_all'),
                    'value' => 'on',
                ],
                'title' => [
                    'type' => 'text',
                    'name' => 'title',
                    'caption' => _t('_bx_tasks_form_f_input_title'),
                    'value' => '',
                    'required' => '0',
                ],
                'controls' => [
                    'name' => 'controls',
                    'type' => 'input_set',
                    [
                        'type' => 'submit',
                        'name' => 'do_save',
                        'value' => _t('_bx_tasks_form_f_input_save'),
                    ], [
                        'type' => 'reset',
                        'name' => 'do_cancel',
                        'value' => _t('_bx_tasks_form_f_input_cancel'),
                        'attrs' => [
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ],
                    ]
                ]
            ]
        ];

        $oContext = false;
        $sContextModule = '';
        if($iContextId && ($oContext = BxDolProfile::getInstance($iContextId)) !== false)
            $sContextModule = $oContext->getModule();

        if(!$oContext || !bx_srv($sContextModule, 'is_admin', [$iContextId, $this->_iProfileId]))
            unset($aForm['inputs']['save_all']);

        return new BxTemplFormView($aForm);
    }
}

/** @} */
