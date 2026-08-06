<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksFormEntryChecker extends BxDolFormChecker
{
    public function isTrackableField($aInput)
    {
        return parent::isTrackableField($aInput) || in_array($aInput['name'], ['stickers', 'type']);
    }
}

/**
 * Create/Edit entry form
 */
class BxTasksFormEntry extends BxBaseModTextFormEntry
{
    protected $_iContextId;

    protected $_sGhostTemplateCover = 'form_ghost_template_cover.html';

    protected $_aProperties;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_tasks';

        $aInfo['params'] ??= [];
        $aInfo['params']['checker'] = 'BxTasksFormEntryChecker';

        parent::__construct($aInfo, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_aProperties = $this->_oModule->_oConfig->getProperties();

        if(($sKf = $CNF['FIELD_ALLOW_VIEW_TO'] ?? false) && isset($this->aInputs[$sKf])) {
            if(!$this->_bIsApi) {
                $this->aInputs[$sKf]['attrs'] ??= [];
                $this->aInputs[$sKf]['attrs']['onchange'] = $this->_oModule->_oConfig->getJsObject('tasks') . '.changeAlloViewTo(this);';
            }
            else
                $this->aInputs[$sKf]['request_url_change'] = $this->MODULE . '/process_task_form&params[]=';
        }
    }

    public function setContextId($iContextId)
    {
        if($this->_iContextId == $iContextId)
            return;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_iContextId = $iContextId;

        if(($sKf = 'FIELD_ALLOW_VIEW_TO') && isset($CNF[$sKf]) && isset($this->aInputs[$CNF[$sKf]]))
            $this->aInputs[$CNF[$sKf]] = array_merge($this->aInputs[$CNF[$sKf]], [
                'type' => 'hidden',
                'value' => -$iContextId
            ]);

        if(($sKf = 'FIELD_TASKLIST') && isset($CNF[$sKf]) && isset($this->aInputs[$CNF[$sKf]])) {
            $aLists = [['id' => 0, 'title' => _t('_bx_tasks_txt_list_inbox')]];
            if(($aListsAdd = $this->_oModule->_oDb->getLists($this->_iContextId)) && is_array($aListsAdd))
                $aLists = array_merge($aLists, $aListsAdd);

            foreach($aLists as $aList)
                $this->aInputs[$CNF[$sKf]]['values'][$aList['id']] = $aList['title'];
        }

        if(($sKf = 'FIELD_TYPE') && isset($CNF[$sKf]) && isset($this->aInputs[$CNF[$sKf]])) {
            $aItems = $this->_oModule->_oDb->getPreValues([
                'sample' => 'context_list', 
                'context_id' => $this->_iContextId, 
                'list' => 'type',
                'active' => 1
            ]);

            if($aItems && is_array($aItems)) {
                $this->aInputs[$CNF[$sKf]]['values'] = [
                    '' => _t('_sys_please_select')
                ];

                foreach($aItems as $aItem)
                    $this->aInputs[$CNF[$sKf]]['values'][$aItem['value']] = $aItem['title'];
            }
        }

        if(($sKf = 'FIELD_STICKERS') && isset($CNF[$sKf]) && isset($this->aInputs[$CNF[$sKf]])) {
            $aItems = $this->_oModule->_oDb->getPreValues([
                'sample' => 'context_list', 
                'context_id' => $this->_iContextId, 
                'list' => 'sticker'
            ]);

            if($aItems && is_array($aItems)) {
                $this->aInputs[$CNF[$sKf]]['values'] = [];

                foreach($aItems as $aItem)
                    $this->aInputs[$CNF[$sKf]]['values'][$aItem['value']] = $aItem['title'];
            }
        }
    }

    public function genViewRowValue(&$aInput)
    {
        $sValue = parent::genViewRowValue($aInput);
        if($this->_oModule->isAllowManage($this->_iContentId) && !empty($aInput['name']) && in_array($aInput['name'], $this->_aProperties))
            $sValue = $this->_oModule->_oTemplate->parseLink('javascript:void(0)', $sValue ?: _t('_bx_tasks_txt_set'), [
                'onclick' => 'javascript:' . $this->_oModule->_oConfig->getJsObject('tasks') . '.processTaskEdit' . bx_gen_method_name($aInput['name']) . '(' . $this->_iContentId . ', this)'
            ]);

        return $sValue;
    }

    protected function genCustomViewRowValueTasksList(&$aInput)
    {
        if(!isset($aInput['value']))
            return null;

        return isset($aInput['value']) && isset($aInput['values'][$aInput['value']]) ? $aInput['values'][$aInput['value']] : null;
    }

    public function getCode($bDynamicMode = false)
    {
        $this->_replaceMarkersInControls('controls_edit');

        $sResult = parent::getCode($bDynamicMode);
        $sInclude = $this->_oModule->_oTemplate->addJs(array('tasks.js'), $bDynamicMode);
        $sResult .= ($bDynamicMode ? $sInclude : '') . $this->_oModule->_oTemplate->getJsCodeView('tasks');
    	return $sResult;
    }

    public function getCodeAPI()
    {
        $aResult = parent::getCodeAPI();
        
        $aResult['params'] ??= [];
        if(($sK = 'view_mode') && isset($this->aParams[$sK]) && $this->aParams[$sK]) {
            $aResult['params']['request_url'] = $this->MODULE . '/set_property/&params[]=' . $this->_iContentId . '&params[]=';

            foreach($aResult['inputs'] as $aInput)
                if(($sName = $aInput['name'] ?? false) && in_array($sName, $this->_aProperties))
                    $aResult['inputs'][$sName]['editable'] = true;
        }

        return $aResult;
    }
    
    public function initChecker ($aValues = array (), $aSpecificValues = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $bValues = $aValues && !empty($aValues['id']);

        $aContentInfo = $bValues ? $this->_oModule->_oDb->getContentInfoById($aValues['id']) : false;
        if(!empty($aContentInfo) && is_array($aContentInfo))
            $this->setContextId(abs($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]));

        if($this->aParams['display'] == $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'] && isset($CNF['FIELD_PUBLISHED']) && isset($this->aInputs[$CNF['FIELD_PUBLISHED']]))
            if($bValues && in_array($aValues[$CNF['FIELD_STATUS']], array('active', 'hidden')))
                unset($this->aInputs[$CNF['FIELD_PUBLISHED']]);

        if(($sKey = 'FIELD_COVER') && isset($CNF[$sKey], $this->aInputs[$CNF[$sKey]])) {
            if($bValues)
                $this->aInputs[$CNF['FIELD_COVER']]['content_id'] = $aValues['id'];

            $this->aInputs[$CNF['FIELD_COVER']]['ghost_template'] = $this->_oModule->_oTemplate->parseHtmlByName($this->_sGhostTemplateCover, $this->_getCoverGhostTmplVars($aContentInfo));
        }

        if(($sKey = 'FIELD_INITIAL_MEMBERS') && isset($CNF[$sKey], $this->aInputs[$CNF[$sKey]])) {
            if($bValues)
                $this->aInputs[$CNF[$sKey]]['value'] = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION'])->getConnectedInitiators($aValues['id']);
            else
                $this->aInputs[$CNF[$sKey]]['value'] = [bx_get_logged_profile_id()];
        }

        parent::initChecker ($aValues, $aSpecificValues);
    }

    public function insert ($aValsToAdd = array(), $isIgnore = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aValsToAdd[$CNF['FIELD_STATE']] ??= 1;

        if(isset($CNF['FIELD_ADDED']) && empty($aValsToAdd[$CNF['FIELD_ADDED']])) {
            $iAdded = 0;
            if(isset($this->aInputs[$CNF['FIELD_ADDED']]))
                $iAdded = $this->getCleanValue($CNF['FIELD_ADDED']);
            
            if(empty($iAdded))
                 $iAdded = time();

            $aValsToAdd[$CNF['FIELD_ADDED']] = $iAdded;
        }

        if(empty($aValsToAdd[$CNF['FIELD_PUBLISHED']])) {
            $iPublished = 0;
            if(isset($this->aInputs[$CNF['FIELD_PUBLISHED']]))
                $iPublished = $this->getCleanValue($CNF['FIELD_PUBLISHED']);
                
             if(empty($iPublished))
                 $iPublished = time();

             $aValsToAdd[$CNF['FIELD_PUBLISHED']] = $iPublished;
        }

        $aValsToAdd[$CNF['FIELD_STATUS']] = $aValsToAdd[$CNF['FIELD_PUBLISHED']] > $aValsToAdd[$CNF['FIELD_ADDED']] ? 'awaiting' : 'active';

        $iContentId = parent::insert ($aValsToAdd, $isIgnore);
        if(!empty($iContentId)) {
            $this->processFiles($CNF['FIELD_COVER'], $iContentId, true);

            if(isset($this->aInputs['initial_members']))
                $this->_setAssignments($iContentId, $this->aInputs['initial_members']['value']);
        }
        return $iContentId;
    }

    public function update ($iContentId, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($aValsToAdd[$CNF['FIELD_PUBLISHED']]) && isset($this->aInputs[$CNF['FIELD_PUBLISHED']])) {
            $iPublished = $this->getCleanValue($CNF['FIELD_PUBLISHED']);
            if(empty($iPublished))
                $iPublished = time();

            $aValsToAdd[$CNF['FIELD_PUBLISHED']] = $iPublished;
        }

        if(isset($this->aInputs['initial_members'])) {
            $this->_setAssignments($iContentId, $this->aInputs['initial_members']['value']);
        }

        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);
        $aValsToAdd[$CNF['FIELD_ALLOW_VIEW_TO']] = $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']];

        $iResult = parent::update ($iContentId, $aValsToAdd, $aTrackTextFieldsChanges);
        $this->processFiles($CNF['FIELD_COVER'], $iContentId, false);   
        return $iResult;
    }

    public function delete ($iContentId, $aContentInfo = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(($sKey = 'OBJECT_REPORTS_TIME') && !empty($CNF[$sKey]) && ($o = BxDolReport::getObjectInstance($CNF[$sKey], $iContentId)))
            $o->onObjectDelete();

        $this->_oModule->_oDb->deleteTimer(['content_id' => $iContentId]);

        return parent::delete($iContentId, $aContentInfo);
    }

    protected function genCustomViewRowValueStickers (&$aInput)
    {
        if(empty($aInput['value']) || !is_array($aInput['value']))
            return null;

        $aStickers = $this->_oModule->getStickers($aInput['value'], $this->_iContextId);
        if(!$aStickers)
            return null;

        return $this->_oModule->_oTemplate->getStickers($aStickers);
    }

    protected function genCustomViewRowValueGhIssueUrl(&$aInput)
    {
        return $aInput['value'] ? bx_linkify(bx_process_output($aInput['value'])) : null;
    }

    protected function _getCoverGhostTmplVars($aContentInfo = [])
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

    	return array (
            'name' => $this->aInputs[$CNF['FIELD_COVER']]['name'],
            'content_id' => $this->aInputs[$CNF['FIELD_COVER']]['content_id'],
            'editor_id' => isset($CNF['FIELD_TEXT_ID']) ? $CNF['FIELD_TEXT_ID'] : '',
            'thumb_id' => isset($CNF['FIELD_THUMB']) && isset($aContentInfo[$CNF['FIELD_THUMB']]) ? $aContentInfo[$CNF['FIELD_THUMB']] : 0,
            'name_thumb' => isset($CNF['FIELD_THUMB']) ? $CNF['FIELD_THUMB'] : ''
        );
    }

    protected function _getPhotoGhostTmplVars($aContentInfo = array())
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

    	return [
            'name' => $this->aInputs[$CNF['FIELD_PHOTO']]['name'],
            'content_id' => (int)$this->aInputs[$CNF['FIELD_PHOTO']]['content_id'],
            'editor_id' => isset($CNF['FIELD_TEXT_ID']) ? $CNF['FIELD_TEXT_ID'] : '',
            'bx_if:set_thumb' => [
                'condition' => false,
                'content' => []
            ]
    	];
    }
	
    protected function _setAssignments($iContentId, $aMembers)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oConn = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION']);

        if($this->_bIsApi && is_string($aMembers))
            $aMembers = explode(',', $aMembers);

        $aMembersCurrent = $oConn->getConnectedInitiators($iContentId);

        $aMembersToAdd = [];
        $aMembersToRemove = $aMembersCurrent;
        if (is_array($aMembers)){
            $aMembersToAdd = array_diff($aMembers, $aMembersCurrent);
            $aMembersToRemove = array_diff($aMembersCurrent, $aMembers);
        }    

        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);

        foreach($aMembersToAdd as $iProfileId){
            $oConn->addConnection($iProfileId, $iContentId);

             /**
             * @hooks
             * @hookdef hook-bx_tasks-assigned 'bx_tasks', 'assigned' - hook on task assigned to profile
             * - $unit_name - equals `bx_tasks`
             * - $action - equals `assigned` 
             * - $object_id - task id 
             * - $sender_id - not used 
             * - $extra_params - array of additional params with the following array keys:
             *      - `object_author_id` - [int] id for assigned profile
             *      - `privacy_view` - [string] privacy view value
             * @hook @ref hook-bx_tasks-assigned
             */
            bx_alert($this->MODULE, 'assigned', $iContentId, false, array(
                'object_author_id' => $iProfileId,
                'privacy_view' => $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]
            ));
        }

        foreach($aMembersToRemove as $iProfileId){
            $oConn->removeConnection($iProfileId, $iContentId);

            /**
             * @hooks
             * @hookdef hook-bx_tasks-unassigned 'bx_tasks', 'unassigned' - hook on task unassigned to profile
             * - $unit_name - equals `bx_tasks`
             * - $action - equals `unassigned` 
             * - $object_id - task id 
             * - $sender_id - not used 
             * - $extra_params - array of additional params with the following array keys:
             *      - `object_author_id` - [int] id for unassigned profile
             *      - `privacy_view` - [string] privacy view value
             * @hook @ref hook-bx_tasks-unassigned
             */
            bx_alert($this->MODULE, 'unassigned', $iContentId, false, array(
                'object_author_id' => $iProfileId,
                'privacy_view' => $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]
            ));
        }
    }

    protected function genCustomInputInitialMembers ($aInput)
    {
        if($this->_bIsApi) {
            $aInput['ajax_get_suggestions'] = $this->MODULE . '/get_initial_members&params[]=' . $this->_iContextId . '&params[]=';

            $aInput['value_data'] = [];
            foreach($aInput['value'] as $iProfileId)
                $aInput['value_data'][] = BxDolProfile::getData($iProfileId);
        }
        else
            $aInput['ajax_get_suggestions'] = BX_DOL_URL_ROOT . "modules/?r=" . $this->_oModule->_oConfig->getUri() . "/ajax_get_initial_members/" . $this->_iContextId;

        return $this->genCustomInputUsernamesSuggestions($aInput);
    }
}

/** @} */
