<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Courses Courses
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * How to pass a lesson's steps:
 * 0 - all at once, the order is not important
 * 1 - alternate, the order is important
 */
define('BX_COURSES_CND_PASSING_ALL', 0);
define('BX_COURSES_CND_PASSING_ALTERNATE', 1);

/**
 * Content data usage:
 * st - step,
 * at - attachment
 */
define('BX_COURSES_CND_USAGE_ST', 0);
define('BX_COURSES_CND_USAGE_AT', 1);

/**
 * Courses profiles module.
 */
class BxCoursesModule extends BxBaseModGroupsModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $this->_aSearchableNamesExcept[] = $this->_oConfig->CNF['FIELD_JOIN_CONFIRMATION'];
    }

    public function actionPerform()
    {
        $CNF = &$this->_oConfig->CNF;

        $mixedContent = $this->_getContent();
        if($mixedContent === false)
            return echoJson(['code' => 1]);

        list($iContentId, $aContentInfo) = $mixedContent;

        $sAction = bx_process_input(bx_get('action'));
        if(empty($CNF['MENU_ITEM_TO_METHOD'][$CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE']][$sAction])) 
            return echoJson(['code' => 2]);

        $sMethodCheck = $CNF['MENU_ITEM_TO_METHOD'][$CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE']][$sAction];
        $sMethodPerform = '_perform' . bx_gen_method_name($sAction, ['-', '_']);
        if(!method_exists($this, $sMethodCheck) || $this->$sMethodCheck($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED || !method_exists($this, $sMethodPerform))
            return echoJson(['code' => 3, 'msg' => _t('_sys_txt_access_denied')]);

        return echoJson($this->$sMethodPerform($aContentInfo) ? ['reload' => 1] : []);
    }

    public function actionPassNode()
    {
        $iNodeId = bx_get('node_id');
        if($iNodeId === false)
            return echoJson([]);

        return echoJson($this->servicePassNode((int)$iNodeId));
    }

    public function actionPassData()
    {
        $iDataId = bx_get('data_id');
        if($iDataId === false)
            return echoJson([]);

        return echoJson($this->servicePassData((int)$iDataId));
    }

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'Hide' => '',
            'Publish' => '',
            'PassNode' => '',
            'PassData' => '',
        ]);
    }

    public function serviceHide($iContentId)
    {
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
                
        if($this->checkAllowedHide($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;
        
        return $this->_performHideCourseProfile($aContentInfo);
    }

    public function servicePublish($iContentId)
    {
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
                
        if($this->checkAllowedUnhide($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;
        
        return $this->_performUnhideCourseProfile($aContentInfo);
    }

    public function servicePassNode($iNodeId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aNode = $this->_oDb->getContentNodes([
            'sample' => 'id',
            'id' => $iNodeId
        ]);

        if(empty($aNode) || !is_array($aNode))
            return ['code' => 1];

        $iEntryId = (int)$aNode['entry_id'];
        $aEntryInfo = $this->_oDb->getContentInfoById($iEntryId);
        if($this->checkAllowedView($aEntryInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return ['code' => 2];

        $iProfileId = bx_get_logged_profile_id();
        if($this->isNodePassed($iProfileId, $iNodeId)) {
            $aDataItems = $this->_oDb->getContentData([
                'sample' => 'entry_node_ids', 
                'entry_id' => $iEntryId,
                'node_id' => $iNodeId,
            ]);

            if(!empty($aDataItems) && is_array($aDataItems))
                foreach($aDataItems as $aDataItem)
                    $this->_oDb->deleteContentData2Users(['data_id' => $aDataItem['id'], 'profile_id' => $iProfileId]);

            $this->_oDb->deleteContentNodes2Users(['node_id' => $iNodeId, 'profile_id' => $iProfileId]);
        }

        $sLink = BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY_NODE'] . '&id=' . $iEntryId, [
            'node_id' => $iNodeId
        ]);

        return [
            'code' => 0, 
            'redirect' => $this->_bIsApi ? bx_api_get_relative_url($sLink) : $sLink
        ];
    }

    public function servicePassData($iDataId)
    {
        $iNow = time();
        $iProfileId = bx_get_logged_profile_id();
        
        $aData = $this->_oDb->getContentData([
            'sample' => 'id',
            'id' => $iDataId
        ]);
        
        if(empty($aData) || !is_array($aData))
            return ['code' => 1];

        $aEntryInfo = $this->_oDb->getContentInfoById($aData['entry_id']);
        if($this->checkAllowedView($aEntryInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return ['code' => 2];

        $this->_oDb->insertContentData2Users([
            'data_id' => $iDataId, 
            'profile_id' => $iProfileId, 
            'date' => $iNow
        ]);

        $aNode = $this->_oDb->getContentNodes([
            'sample' => 'id_full',
            'id' => $aData['node_id']
        ]);

        $iTotal = $this->getDataTotalByNode($aNode, BX_COURSES_CND_USAGE_ST);

        $aUserTrack = $this->_oDb->getContentData([
            'sample' => 'user_track', 
            'entry_id' => $aNode['entry_id'], 
            'node_id' => $aNode['id'], 
            'profile_id' => $iProfileId
        ]);

        if(count($aUserTrack) == $iTotal) {
            $this->_oDb->insertContentNodes2Users([
                'node_id' => $aNode['id'], 
                'profile_id' => $iProfileId, 
                'date' => $iNow
            ]);
            
            $this->_autoPassNodes($iProfileId, $aNode['parent_id']);
        }

        $aResult = ['code' => 0];
        if(($sMethod = 'get_view') && bx_is_srv($aData['content_type'], $sMethod)) {
            $sView = bx_srv($aData['content_type'], $sMethod, [$aData['content_id']]);
            $aResult = $this->_oTemplate->entryData($aData, $sView);
        }
        else if(($sMethod = 'get_link') && bx_is_srv($aData['content_type'], $sMethod))
            $aResult['redirect'] = bx_srv($aData['content_type'], $sMethod, [$aData['content_id']]);

        if($this->_bIsApi)
            $aResult['redirect'] = bx_api_get_relative_url($aResult['redirect']);

        return $aResult;
    }
    
    protected function _autoPassNodes($iProfileId, $iNodeId)
    {
        $aNode = $this->_oDb->getContentStructure([
            'sample' => 'node_id', 
            'node_id' => $iNodeId, 
        ]);

        if(empty($aNode) || !is_array($aNode))
            return;

        $iTotal = (int)$aNode['cn_l' . ($aNode['level'] + 1)];
        if(!$iTotal)
            return;

        $aUserTrack = $this->_oDb->getContentStructure([
            'sample' => 'user_track',
            'profile_id' => $iProfileId,
            'entry_id' => $aNode['entry_id'],
            'node_id' => $iNodeId
        ]);

        if(count($aUserTrack) == $iTotal) {
            $this->_oDb->insertContentNodes2Users([
                'node_id' => $iNodeId, 
                'profile_id' => $iProfileId, 
                'date' => time()
            ]);

            if((int)$aNode['parent_id'] != 0)
                $this->_autoPassNodes($iProfileId, $aNode['parent_id']);
        }
    }

    public function serviceGetOptionsContentModulesSt()
    {
        return $this->_getOptionsContentModules();
    }

    public function serviceGetOptionsContentModulesAt()
    {
        return $this->_getOptionsContentModules();
    }

    public function serviceIsContentAvaliable($iProfileId)
    {
        if(!$this->_oConfig->isContent())
            return false;

        $aContentInfo = $this->_oDb->getContentInfoByProfileId($iProfileId);
        if($this->checkAllowedEdit($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return true;
    }

    public function serviceOnContentAdded($sContentType, $iContentId, $iContextId, $iContextNodeId, $iContextUsage)
    {
        $this->_oDb->insertContentData([
            'entry_id' => $iContextId,
            'node_id' => $iContextNodeId,
            'content_type' => $sContentType,
            'content_id' => $iContentId,
            'usage' => $iContextUsage,
            'added' => time(),
            'order' => $this->_oDb->getContentDataOrderMax($iContextId, $iContextNodeId) + 1
        ]);

        $aNode = $this->_oDb->getContentNodes(['sample' => 'id', 'id' => $iContextNodeId]);

        $aCounters = [];
        if(!empty($aNode['counters']))
            $aCounters = json_decode($aNode['counters'], true);

        $sUsage = $this->_oConfig->getUsageI2S($iContextUsage);
        if(!isset($aCounters[$sUsage]))
            $aCounters[$sUsage] = [];

        if(!isset($aCounters[$sUsage][$sContentType]))
            $aCounters[$sUsage][$sContentType] = 0;
        $aCounters[$sUsage][$sContentType] += 1;

        $this->_oDb->updateContentNodes(['counters' => json_encode($aCounters)], ['id' => $iContextNodeId]);
    }

    public function serviceOnContentAddedRedirect($sContentType, $iContentId)
    {
        return $this->serviceOnContentActionRedirect('add', $sContentType, $iContentId);
    }

    public function serviceOnContentEditedRedirect($sContentType, $iContentId)
    {
        return $this->serviceOnContentActionRedirect('edit', $sContentType, $iContentId);
    }

    public function serviceOnContentActionRedirect($sAction, $sContentType, $iContentId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aData = $this->_oDb->getContentData(['sample' => 'content', 'content_type' => $sContentType, 'content_id' => $iContentId]);
        if(empty($aData) || !is_array($aData))
            return false;

        $sUrl = BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_EDIT_ENTRY_CONTENT'] . '&id=' . $aData['entry_id'], [
            'parent_id' => $aData['node_id']
        ]);

        return $this->_bIsApi ? '' : $sUrl;
    }

    public function serviceOnContentDeleted($sContentType, $iContentId, $iContextId)
    {
        $aData = $this->_oDb->getContentData(['sample' => 'content', 'content_type' => $sContentType, 'content_id' => $iContentId]);
        if(empty($aData) || !is_array($aData))
            return;

        $this->_oDb->deleteContentData([
            'entry_id' => $iContextId,
            'content_type' => $sContentType,
            'content_id' => $iContentId,
        ]);

        $this->_oDb->deleteContentData2Users([
            'data_id' => $aData['id']
        ]);

        $aNode = $this->_oDb->getContentNodes(['sample' => 'id', 'id' => $aData['node_id']]);
        if(!empty($aNode['counters'])) {
            $sUsage = $this->_oConfig->getUsageI2S($aData['usage']);
            $aCounters = json_decode($aNode['counters'], true);

            if(!empty($aCounters[$sUsage][$sContentType])) {
                if((int)$aCounters[$sUsage][$sContentType] > 1)
                    $aCounters[$sUsage][$sContentType] -= 1;
                else
                    unset($aCounters[$sUsage][$sContentType]);

                $this->_oDb->updateContentNodes(['counters' => json_encode($aCounters)], ['id' => $aData['node_id']]);
            }
        }
    }

    public function serviceJoinedEntriesSummary ($iProfileId = 0)
    {
        if (!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if (!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
            return false;

        if ($iProfileId != $this->_iProfileId)
            return false;

        return $this->_oTemplate->getJoinedEntriesSummary($iProfileId);
    }

    public function serviceEntityContentStructureBlock($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oConfig->isContent())
            return '';

        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            return '';

        $aContentInfo = $this->_oDb->getContentInfoByProfileId($iProfileId);

        $sGridKey = 'OBJECT_GRID_CNT_STRUCTURE_' . ($this->checkAllowedEdit($aContentInfo) === CHECK_ACTION_RESULT_ALLOWED ? 'MANAGE' : 'VIEW');
        $oGrid = BxDolGrid::getObjectInstance($CNF[$sGridKey]);
        if(!$oGrid)
            return '';

        $oGrid->setEntryId($aContentInfo[$CNF['FIELD_ID']]);

        if($this->_bIsApi)
            return ($aGrid = $oGrid->getCodeAPI()) ? [
                bx_api_get_block('grid', $aGrid)
            ] : [];

        return $oGrid->getCode();
    }
    
    public function serviceEntityContentDataBlock($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oConfig->isContent())
            return '';

        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            return '';

        $aContentInfo = $this->_oDb->getContentInfoByProfileId($iProfileId);

        $sGridKey = 'OBJECT_GRID_CNT_DATA_' . ($this->checkAllowedEdit($aContentInfo) === CHECK_ACTION_RESULT_ALLOWED ? 'MANAGE' : 'VIEW');
        $oGrid = BxDolGrid::getObjectInstance($CNF[$sGridKey]);
        if(!$oGrid)
            return '';

        $oGrid->setEntryId($aContentInfo[$CNF['FIELD_ID']]);

        if($this->_bIsApi)
            return ($aGrid = $oGrid->getCodeAPI()) ? [
                bx_api_get_block('grid', $aGrid)
            ] : [];

        return $oGrid->getCode();
    }
    
    public function serviceEntityStructureL1Block($iContentId = 0)
    {
        if(!$this->_oConfig->isContent() || $this->_oConfig->getContentLevelMax() == 1)
            return $this->_bIsApi ? [] : '';

        $mixedResult = $this->_serviceTemplateFuncEx ('entryStructureByLevel', $iContentId, [
            'level' => 1,
            'selected' => ($iNodeId = bx_get('parent_id')) !== false ? (int)$iNodeId : 0,
            'start' => ($iStart = bx_get('start')) !== false ? (int)$iStart : 0,
            'per_page' => ($iPerPage = bx_get('per_page')) !== false ? (int)$iPerPage : $this->_oConfig->getPerPageDefault('structure_l1'),
        ]);

        return $this->_bIsApi ? [bx_api_get_block('course_structure', $mixedResult)] : $mixedResult;
    }

    public function serviceEntityStructureL2Block($iContentId = 0, $iParentId = 0)
    {
        if(!$this->_oConfig->isContent())
            return $this->_bIsApi ? [] : '';

        if(!$iParentId && ($_iParentId = bx_get('parent_id')) !== false)
            $iParentId = (int)$_iParentId;

        $mixedResult = $this->_serviceTemplateFuncEx ('entryStructureByParentMl' . $this->_oConfig->getContentLevelMax(), $iContentId, [
            'parent_id' => $iParentId
        ]);

        return $this->_bIsApi ? [bx_api_get_block('module_structure', $mixedResult)] : $mixedResult;
    }
    
    public function serviceEntityNodeBlock($iContentId = 0, $iNodeId = 0, $iUsage = false)
    {
        if(!$this->_oConfig->isContent())
            return $this->_bIsApi ? [] : '';

        $iContentId = $this->_getContent($iContentId, false);

        if(!$iNodeId && ($_iNodeId = bx_get('node_id')) !== false)
            $iNodeId = (int)$_iNodeId;

        $aNode = $this->_oDb->getContentNodes([
            'sample' => 'id',
            'id' => $iNodeId
        ]);

        if(!$aNode || !is_array($aNode) || $aNode['entry_id'] != $iContentId)
            return $this->_bIsApi ? [] : MsgBox(_t('_sys_txt_not_found'));

        if($iUsage === false && ($_iUsage = bx_get('usage')) !== false)
            $iUsage = (int)$_iUsage;

        $mixedResult = $this->_serviceTemplateFuncEx('entryNode', $iContentId, [
            'node_id' => $iNodeId,
            'usage' => $iUsage
        ]);

        return $this->_bIsApi ? [bx_api_get_block('lesson_structure', $mixedResult)] : $mixedResult;
    }

    public function checkAllowedHide($aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if($aDataEntry[$CNF['FIELD_STATUS']] != 'active')
            return CHECK_ACTION_RESULT_NOT_ALLOWED;

        // moderator and owner always have access
        if ($aDataEntry[$CNF['FIELD_AUTHOR']] == $this->_iProfileId || $this->_isModerator($isPerformAction))
            return CHECK_ACTION_RESULT_ALLOWED;

        return CHECK_ACTION_RESULT_NOT_ALLOWED;
    }

    public function checkAllowedUnhide($aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if($aDataEntry[$CNF['FIELD_STATUS']] == 'active')
            return CHECK_ACTION_RESULT_NOT_ALLOWED;

        // moderator and owner always have access
        if ($aDataEntry[$CNF['FIELD_AUTHOR']] == $this->_iProfileId || $this->_isModerator($isPerformAction))
            return CHECK_ACTION_RESULT_ALLOWED;

        return CHECK_ACTION_RESULT_NOT_ALLOWED;
    }

    public function getNodeLevelByParent($aParentInfo)
    {
        return (is_array($aParentInfo) && !empty($aParentInfo['level']) ? (int)$aParentInfo['level'] : 0) + 1;
    }
    
    public function getDataTotalByNode($mixedNode, $iUsage = 0)
    {
        if(!is_array($mixedNode))
            $mixedNode = $this->_oDb->getContentNodes([
                'sample' => 'id', 
                'id' => (int)$mixedNode
            ]);
        
        $iTotal = 0;
        $sUsage = $this->_oConfig->getUsageI2S($iUsage);
        if(!empty($mixedNode['counters']) && ($aCountes = json_decode($mixedNode['counters'], true)) && !empty($aCountes[$sUsage]) && is_array($aCountes[$sUsage]))
            $iTotal = array_sum($aCountes[$sUsage]);

        return $iTotal;
    }

    public function isNodeStarted($iProfileId, $mixedNode)
    {
        $iNodeId = is_array($mixedNode) ? $mixedNode['id'] : (int)$mixedNode;

        $aChildNodes = $this->_oDb->getContentStructure([
            'sample' => 'parent_id',
            'parent_id' => $iNodeId
        ]);

        if(!empty($aChildNodes) && is_array($aChildNodes)) {
            foreach($aChildNodes as $aChildNode)
                if($this->isNodePassed($iProfileId, $aChildNode['node_id']))
                    return true;
                else
                    return $this->isNodeStarted($iProfileId, $aChildNode['node_id']);
        }
        else {
            $aChildData = $this->_oDb->getContentData([
                'sample' => 'node_id',
                'node_id' => $iNodeId
            ]);

            if(!empty($aChildData) && is_array($aChildData))
                foreach($aChildData as $aChildData)
                    if($this->isDataPassed($iProfileId, $aChildData['id']))
                        return true;

            return false;
        }
    }

    public function isNodePassed($iProfileId, $mixedNode)
    {
        $aUserTrack = $this->_oDb->getContentStructure([
            'sample' => 'user_passed', 
            'profile_id' => $iProfileId, 
            'node_id' => is_array($mixedNode) ? $mixedNode['id'] : (int)$mixedNode
        ]);

        return !empty($aUserTrack) && is_array($aUserTrack);
    }
    
    public function isDataPassed($iProfileId, $mixedData)
    {
        $aUserTrack = $this->_oDb->getContentData([
            'sample' => 'user_passed', 
            'profile_id' => $iProfileId, 
            'data_id' => is_array($mixedData) ? $mixedData['id'] : (int)$mixedData
        ]);

        return !empty($aUserTrack) && is_array($aUserTrack);
    }

    public function getEntryPass($iProfileId, $iContentId)
    {
        $aChildren = $this->_oDb->getContentStructure([
            'sample' => 'entry_id', 
            'entry_id' => $iContentId,
            'level' => 1
        ]);

        $aPassDetails = [];
        foreach($aChildren as $aChild)
            $this->getNodePass($iProfileId, $iContentId, $aChild, $aPassDetails);

        $iPassPercent = 0;
        $sPassStatus = '_bx_courses_txt_status_not_started';
        $sPassTitle = '_bx_courses_txt_pass_start';
        $iLevelMax = $this->_oConfig->getContentLevelMax();
        if(isset($aPassDetails[$iLevelMax]) && ($aPassLevelMax = $aPassDetails[$iLevelMax])) {
            $iPassPercent = ($iTotal = (int)$aPassLevelMax['total']) != 0 ? (int)round(100 * $aPassLevelMax['passed']/$iTotal) : 0;

            if($aPassLevelMax['passed'] != 0) {
                if($aPassLevelMax['passed'] != $aPassLevelMax['total']) {
                    $sPassStatus = '_bx_courses_txt_status_in_process';
                    $sPassTitle = '_bx_courses_txt_pass_continue';
                }
                else {
                    $sPassStatus = '_bx_courses_txt_status_completed';
                    $sPassTitle = '_bx_courses_txt_pass_again';
                }
            }
        }

        return [
            $iPassPercent,
            $aPassDetails,
            _t($sPassStatus),
            _t($sPassTitle)
        ];
    }

    public function getNodePass($iProfileId, $iContentId, $aNode, &$aResults)
    {
        $iLevel = $aNode['level'];

        if(!isset($aResults[$iLevel]))
            $aResults[$iLevel] = [
                'passed' => 0,
                'total' => 0
            ];

        $aResults[$iLevel]['passed'] += $this->isNodePassed($iProfileId, $aNode['node_id']);
        $aResults[$iLevel]['total'] += 1;

        if($iLevel != $this->_oConfig->getContentLevelMax() && !empty($aNode['cn_l' . ($iLevel + 1)])) {
            $aChildren = $this->_oDb->getContentStructure([
                'sample' => 'parent_id', 
                'parent_id' => $aNode['node_id']
            ]);
            
            foreach($aChildren as $aChild)
                $this->getNodePass($iProfileId, $iContentId, $aChild, $aResults);
        }
    }

    public function getNodePassByChildren($iProfileId, $iContentId, $aNode, &$aResults)
    {
        $aUserTrack = $this->_oDb->getContentStructure([
            'sample' => 'user_track', 
            'entry_id' => $iContentId, 
            'node_id' => $aNode['node_id'], 
            'profile_id' => $iProfileId
        ]);

        $iLevelChildren = $aNode['level'] + 1;
        $iCountChildren = $aNode['cn_l' . $iLevelChildren];

        if(!isset($aResults[$iLevelChildren]))
            $aResults[$iLevelChildren] = [
                'passed' => 0,
                'total' => 0
            ];

        $aResults[$iLevelChildren]['passed'] += count($aUserTrack);
        $aResults[$iLevelChildren]['total'] += $iCountChildren;

        if($iCountChildren && $iLevelChildren != $this->_oConfig->getContentLevelMax()) {
            $aChildren = $this->_oDb->getContentStructure([
                'sample' => 'parent_id', 
                'parent_id' => $aNode['node_id']
            ]);
            
            foreach($aChildren as $aChild)
                $this->getNodePassByChildren($iProfileId, $iContentId, $aChild, $aResults);
        }
    }

    public function getNodePassByData($iProfileId, $iContentId, $aNode)
    {
        $iTotal = 0;
        $iPassCount = $iPassPercent = 0;
        $sPassStatus = $sPassTitle = '';
        if(($iTotal = $this->getDataTotalByNode($aNode)) != 0) {
            $aUserTrack = $this->_oDb->getContentData([
                'sample' => 'user_track', 
                'entry_id' => $iContentId, 
                'node_id' => $aNode['node_id'], 
                'profile_id' => $iProfileId
            ]);

            $iPassCount = count($aUserTrack);
            $iPassPercent = (int)round(100 * $iPassCount/$iTotal);
            
            if($iPassCount == 0) {
                $sPassStatus = '_bx_courses_txt_status_not_started';
                $sPassTitle = '_bx_courses_txt_pass_start';
            }
            else {
                if($iPassCount != $iTotal) {
                    $sPassStatus = '_bx_courses_txt_status_in_process';
                    $sPassTitle = '_bx_courses_txt_pass_continue';
                }
                else {
                    $sPassStatus = '_bx_courses_txt_status_completed';
                    $sPassTitle = '_bx_courses_txt_pass_again';
                }
            }
        }

        return [
            $iPassPercent,
            _t('_bx_courses_txt_n_m_steps', $iPassCount, $iTotal),
            _t($sPassStatus ? $sPassStatus : '_undefined'),
            _t($sPassTitle)
        ];
    }

    public function decodeDataAPI($aData, $aParams = [])
    {
        $CNF = $this->_oConfig->CNF;

        $aResult = parent::decodeDataAPI($aData, $aParams);
        $aResultAdd = [
            $CNF['FIELD_STATUS'] => $aData[$CNF['FIELD_STATUS']]
        ];

        $iEntryId = (int)$aData[$CNF['FIELD_ID']];
        $aLevelToNode = $this->_oConfig->getContentLevel2Node(false);        
        if($this->isFan($iEntryId, $this->_iProfileId)) {
            $sTxtProgress = _t('_bx_courses_txt_n_m_progress');

            list($iPassPercent, $aPassDetails, $sPassStatus, $sPassTitle) = $this->getEntryPass($this->_iProfileId, $iEntryId);

            $aCounters = [];
            foreach($aPassDetails as $iLevel => $aDetails) {
                $aCounters[] = [
                    'level' => $iLevel,
                    'title' => $aLevelToNode[$iLevel],
                    'passed' => $aDetails['passed'],
                    'total' => $aDetails['total'],
                    'progress' => bx_replace_markers($sTxtProgress, $aDetails)
                ];
            }

            $aResultAdd = [
                'percent' => $iPassPercent,
                'counters' => $aCounters,
                'pass_status' => $sPassStatus,
                'show_pass' => $iPassPercent > 0 && $iPassPercent < 100,
            ];

            if($aResultAdd['show_pass'])
                $aResultAdd = array_merge($aResultAdd, [
                    'pass_link' => $aResult['url'],
                    'pass_title' => $sPassTitle,
                ]);
            
        }
        else {
            $iLevelMax = $this->_oConfig->getContentLevelMax();
            $aEntryCounters = $this->_oDb->getContentStructure(['sample' => 'entry_id_counters', 'entry_id' => $iEntryId]);

            $aCounters = [];
            if(!empty($aEntryCounters) && is_array($aEntryCounters))
                for($i = 1; $i <= $iLevelMax; $i++) {
                    $aCounters[] = [
                        'level' => $i,
                        'title' => $aLevelToNode[$i],
                        'total' => $aEntryCounters['cn_l' . $i]
                    ];
                }

            $aResultAdd = [
                'counters' => $aCounters,
            ];
        }

        return array_merge($aResult, $aResultAdd);
    }

    protected function _getOptionsContentModules()
    {
        $aResult = [];

        $aModules = bx_srv('system', 'get_modules_by_type', ['content']);
        foreach($aModules as $aModule)
            $aResult[] = ['key' => $aModule['name'], 'value' => $aModule['title']];

        return $aResult;
    }

    protected function _performHideCourseProfile($aDataEntry)
    {
        $CNF = &$this->_oConfig->CNF;

        $iContentId = $aDataEntry[$CNF['FIELD_ID']];
        if(!$this->_oDb->updateEntriesBy([$CNF['FIELD_STATUS'] => 'hidden'], [$CNF['FIELD_ID'] => $iContentId])) 
            return false;

        $this->checkAllowedHide($aDataEntry, true);

        $this->alertAfterEdit($this->_oDb->getContentInfoById($iContentId));

        return $this->_bIsApi ? [
            'title' => _t($CNF['T']['menu_item_title_unhide']),
            'request_url' => $this->_oConfig->getName() . '/publish/&params[]=' . $iContentId, 
        ] : true;
    }

    protected function _performUnhideCourseProfile($aDataEntry)
    {
        $CNF = &$this->_oConfig->CNF;

        $iContentId = $aDataEntry[$CNF['FIELD_ID']];
        if(!$this->_oDb->updateEntriesBy([$CNF['FIELD_STATUS'] => 'active'], [$CNF['FIELD_ID'] => $iContentId])) 
            return false;

        $this->checkAllowedHide($aDataEntry, true);

        $this->alertAfterEdit($this->_oDb->getContentInfoById($iContentId));

        return $this->_bIsApi ? [
            'title' => _t($CNF['T']['menu_item_title_hide']),
            'request_url' => $this->_oConfig->getName() . '/hide/&params[]=' . $iContentId, 
        ] : true;
    }
}

/** @} */
