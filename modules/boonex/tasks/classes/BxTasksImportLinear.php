<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksImportLinear extends BxDol
{
    protected $_oModule;

    public function __construct($oModule)
    {
        parent::__construct();

        $this->_oModule = $oModule;
    }

    public function perform($iContextId = 0)
    {
        if(!isAdmin() && !bx_acl_is_administrator())
            return false;

        $sReqApiKey = bx_get('lk') ?: '';
        if(!$sReqApiKey || !BxDolProfile::getInstance($iContextId))
            return false;

        $aReqParams = ($sP = bx_get('lp')) !== false && is_string($sP) ? json_decode($sP, true) : [];

        $sEndpoint = 'https://api.linear.app/graphql';
        $aRequest = [
            'query' => 'query Issues($first: Int!, $after: String, $filter: IssueFilter, $orderBy: PaginationOrderBy) { 
                issues (first: $first, after: $after, filter: $filter, orderBy: $orderBy) { 
                    nodes { 
                        id 
                        identifier 
                        title 
                        description 
                        priority 
                        estimate 
                        createdAt 
                        updatedAt 
                        state { name type }
                        assignee { email }
                        creator { email }
                        labels { nodes { name } }
                        comments { nodes { id body createdAt user { email } parent { id } } }
                    } 
                    pageInfo { hasNextPage endCursor } 
                } 
            }',
            'variables' => [
                'orderBy' => 'createdAt',
            ]
        ];

        $iLimit = $aReqParams['limit'] ?? 10;
        if(($aFilter = $aReqParams['filter'] ?? false) && is_array($aFilter))
            foreach($aFilter as $sKey => $sValue)
                $aRequest['variables']['filter'][$sKey] = ['name' => ['eq' => $sValue]];

        $iProcessed = $iIssues = 0;
        $sAfter = null;
        while($iProcessed < $iLimit) {
            $aRequest['variables'] = array_merge($aRequest['variables'], [
                'first' => min(100, $iLimit - $iProcessed),
                'after' => $sAfter,
            ]);

            $sData = bx_file_get_contents($sEndpoint, $aRequest, 'post-json', [
                'Authorization: ' . $sReqApiKey
            ]);
            if(!$sData)
                break;

            $aData = json_decode($sData, true);
            if(!$aData || !is_array($aData))
                break;

            foreach($aData['data']['issues']['nodes'] ?? [] as $aNode) {
                if($this->addTask($iContextId, $aNode) !== false)
                    $iIssues++;

                $iProcessed++;
            }

            if(($aPageInfo = $aData['pageInfo'] ?? false) && $aPageInfo['hasNextPage'])
                $sAfter = $aPageInfo['endCursor'];
        }

        return [$iProcessed, $iIssues];
    }

    protected function addTask($iContextId, $aData)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iProfileAuthor = $this->getProfile($aData['creator'] ?? []);
        if(!$iProfileAuthor)
            return false;

        $aStateCnv = [
            'Backlog' => BX_TASKS_STATE_BACBLOG,
            'Todo' => BX_TASKS_STATE_TODO,
            'In Progress' => BX_TASKS_STATE_IN_PROGRESS,
            'In Review' => BX_TASKS_STATE_IN_REVIEW,
            'Canceled' => BX_TASKS_STATE_CANCELLED,
            'Duplicate' => BX_TASKS_STATE_DUPLICATE,
            'Done' => BX_TASKS_STATE_DONE
        ];

        $aLabels = $this->_oModule->_oDb->getPreValues(['sample' => 'context_list', 'context_id' => $iContextId, 'list' => 'sticker']);
        if(!$aLabels || !is_array($aLabels))
            $aLabels = BxDolFormQuery::getDataItems($CNF['OBJECT_PRE_LIST_STICKERS'], false, BX_DATA_VALUES_ALL);

        $aLabelCnv = [];
        array_walk( $aLabels, function($aLavel, $mixedValue) use(&$aLabelCnv) {
            $aLabelCnv[$aLavel['title'] ?? _t($aLavel['LKey'])] = $mixedValue;
        });

        $aStikers = [];
        if(($aLabels = $aData['labels']['nodes'] ?? false) && is_array($aLabels))
            foreach($aLabels as $aLabel)
                if(($sLabel = $aLabel['name'] ?? false) && isset($aLabelCnv[$sLabel]))
                    $aStikers[] = $aLabelCnv[$sLabel];

        $aEntry = [
            $CNF['FIELD_ADDED'] => strtotime($aData['createdAt'] ?? 0),
            $CNF['FIELD_CHANGED'] => strtotime($aData['updatedAt'] ?? 0),
            $CNF['FIELD_TITLE'] => (($sIdentifier = $aData['identifier'] ?? false) ? $sIdentifier . ': ' : '') . $aData['title'] ?? '',
            $CNF['FIELD_TEXT'] => $aData['description'] ?? '',
            $CNF['FIELD_PRIORITY'] => $aData['priority'] ?? 0,
            $CNF['FIELD_STICKERS'] => $aStikers,
            $CNF['FIELD_STATE'] => $aStateCnv[$aData['state']['name'] ?? ''] ?? BX_TASKS_STATE_TODO,
            $CNF['FIELD_ESTIMATE'] => $aData['estimate'] ?? 0,
            $CNF['FIELD_INITIAL_MEMBERS'] => [$this->getProfile($aData['assignee'] ?? [], 0)],
            $CNF['FIELD_ALLOW_VIEW_TO'] => -$iContextId,
            'do_submit' => 'submit'
        ];

        $aResult = $this->_oModule->serviceEntityAddForcedly($iProfileAuthor, $aEntry);
        $bResult = ($aResult['code'] ?? 1) == 0;

        if($bResult && ($aContentInfo = $aResult['content'] ?? false) && is_array($aContentInfo)) {
            $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];
            if($iContentId && ($aComments = $aData['comments']['nodes'] ?? false) && is_array($aComments)) {
                $aCommentsById = [];
                foreach ($aComments as $aComment)
                    $aCommentsById[$aComment['id']] = $aComment + ['children' => []];

                $aRootIds = [];
                foreach ($aCommentsById as $aComment) {
                    if(($sPid = $aComment['parent']['id'] ?? false) && isset($aCommentsById[$sPid]))
                        $aCommentsById[$sPid]['children'][] = $aComment['id'];
                    else
                        $aRootIds[] = $aComment['id'];
                }

                foreach($aRootIds as $sId) {
                    $aComment = $aCommentsById[$sId];

                    $iCmtId = $this->addComment($aComment, $iContentId);
                    if($iCmtId !== false && ($aChildren = $aComment['children'] ?? false))
                        foreach($aChildren as $sChildId)
                            $this->addComment($aCommentsById[$sChildId], $iContentId, $iCmtId);
                }
            }
        }

        return $bResult;
    }

    protected function addComment($aData, $iContentId, $iParentId = 0)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oCmts = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $iContentId);
        if(!$oCmts || !$oCmts->isEnabled())
            return false;

        $iProfileAuthor = $this->getProfile($aData['user'] ?? [], 0);

        $aResult = $oCmts->add([
            'cmt_parent_id' => $iParentId,
            'cmt_author_id' => $iProfileAuthor,
            'cmt_text' => $aData['body'] ?? '',
            'cmt_time' => strtotime($aData['createdAt'] ?? 0)
        ]);

        return $aResult['id'] ?? false;
    }

    protected function getProfile($aData, $iDefault = false)
    {
        if($iDefault === false)
            $iDefault = (int)getParam('sys_profile_bot');

        $sEmail = $aData['email'] ?? false;
        if(!$sEmail)
            return $iDefault;

        $iAccount = BxDolAccountQuery::getInstance()->getIdByEmail($sEmail);
        if(!$iAccount)
            return $iDefault;

        return ($oProfile = BxDolProfile::getInstanceByAccount($iAccount)) !== false ? $oProfile->id() : $iDefault;
    }
}

/** @} */
