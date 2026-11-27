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

/*
 * Courses module representation.
 */
class BxCoursesTemplate extends BxBaseModGroupsTemplate
{
    protected $_iProfileId;

    public function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_courses';

        parent::__construct($oConfig, $oDb);

        // the gallery card (unit.html here) is the apps' card (unit_card.html), as groups' is
        $this->_bUnitCard = true;
        $this->_aUnitCardTemplates = ['unit.html', 'unit_with_cover.html'];
        $this->_sUnitCardViewIcon = 'arrow-circle-right';

        $this->_iProfileId = bx_get_logged_profile_id();
    }

    public function unit ($aData, $isCheckPrivateContent = true, $mixedTemplate = false, $aParams = [])
    {
        if(!empty($aParams['context']) && in_array($aParams['context'], ['favorite', 'joined_entries']))
            $aParams['template_name'] = 'unit_personal.html';

        return parent::unit($aData, $isCheckPrivateContent, $mixedTemplate, $aParams);
    }

    public function unitVars($aData, $isCheckPrivateContent = true, $mixedTemplate = false, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $aVars = parent::unitVars($aData, $isCheckPrivateContent, $mixedTemplate, $aParams);

        $bVarsShowProgress = $bVarsShoStats = false;
        $aVarsShowProgress = $aVarsShowStats = [true];
        if(!empty($aParams['context']) && in_array($aParams['context'], ['favorite', 'joined_entries'])) {
            $aLevelToNode = $this->_oConfig->getContentLevel2Node(false);
            $sTxtProgress = _t('_bx_courses_txt_n_m_progress');

            list($iPassPercent, $aPassDetails, $sPassStatus, $sPassTitle) = $this->_oModule->getEntryPass($this->_iProfileId, $aData[$CNF['FIELD_ID']]);

            $bVarsShowProgress = true;
            $aVarsShowProgress = [
                'progress' => $iPassPercent
            ];

            $aTmplVarsCounters = [];
            foreach($aPassDetails as $iLevel => $aDetails) {
                $aTmplVarsCounters[] = [
                    'cn_title' => $aLevelToNode[$iLevel],
                    'cn_passed' => $aDetails['passed'],
                    'cn_total' => $aDetails['total'],
                    'cn_progress' => bx_replace_markers($sTxtProgress, $aDetails)
                ];
            }

            $bVarsShoStats = true;
            $aVarsShowStats = [
                'status' => $sPassStatus,
                'bx_repeat:counters' => $aTmplVarsCounters,
                'bx_if:show_pass' => [
                    'condition' => $iPassPercent > 0 && $iPassPercent < 100,
                    'content' => [
                        'pass_link' => $aVars['content_url'],
                        'pass_title' => $sPassTitle
                    ]
                ]
            ];
        }

        return array_merge($aVars, [
            'bx_if:show_pass_progress' => [
                'condition' => $bVarsShowProgress,
                'content' => $aVarsShowProgress
            ],
            'bx_if:show_pass_stats' => [
                'condition' => $bVarsShoStats,
                'content' => $aVarsShowStats
            ]
        ]);
    }

    public function getCounters($aCounters)
    {
        $aTmplVars = [];
        foreach([BX_COURSES_CND_USAGE_ST, BX_COURSES_CND_USAGE_AT] as $iUsage) {
            $sUsage = $this->_oConfig->getUsageI2S($iUsage);

            $aTmplVarsCounters = [true];
            $bTmplVarsCounters = !empty($aCounters[$sUsage]) && is_array($aCounters[$sUsage]);
            if($bTmplVarsCounters) {
                $aTmplVarsCounters['bx_repeat:counters_' . $sUsage] = [];
                foreach($aCounters[$sUsage] as $sModule => $iCount) {
                    $aCounter = [
                        'title' => _t('_' . $sModule), 
                        'value' => $iCount
                    ];

                    if($this->_bIsApi)
                        $aTmplVars[$sUsage][] = $aCounter;
                    else
                        $aTmplVarsCounters['bx_repeat:counters_' . $sUsage][] = $aCounter;
                }
            }
            
            if($this->_bIsApi)
                continue;

            $aTmplVars['bx_if:show_' . $sUsage] = [
                'condition' => $bTmplVarsCounters,
                'content' => $aTmplVarsCounters
            ];
        }

        return $this->_bIsApi ? $aTmplVars : $this->parseHtmlByName('counters.html', $aTmplVars);
    }

    public function getJoinedEntriesSummary($iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
        if(!$oConnection)
            return false;

        $aEntries = $oConnection->getConnectedContent($iProfileId);

        $iJoined = count($aEntries);
        $iStarted = 0;
        $iPassed = 0;

        foreach($aEntries as $iEntryId) {
            $aEntryInfo = $this->_oDb->getContentInfoByProfileId($iEntryId);

            list($iPassPercent) = $this->_oModule->getEntryPass($iProfileId, $aEntryInfo[$CNF['FIELD_ID']]);
            if($iPassPercent > 0 && $iPassPercent < 100)
                $iStarted += 1;
            else if($iPassPercent == 100)
                $iPassed +=1;
        }

        $aTmplVars = [
            'joined' => $iJoined,
            'passed' => $iPassed,
            'not_passed' => $iJoined - $iPassed,
            'passed_percent' => $iJoined != 0 ? (int)round(100 * $iPassed/$iJoined) : 0
        ];

        return $this->_bIsApi ? $aTmplVars : $this->parseHtmlByName('entries_summary.html', $aTmplVars);
    }

    public function entryStructureByLevel($aContentInfo, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isset($aParams['level']))
            return '';

        $iProfileId = bx_get_logged_profile_id();
        $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];
        $bEditable = $this->_oModule->checkAllowedEdit($aContentInfo) === CHECK_ACTION_RESULT_ALLOWED;

        $oPermalink = BxDolPermalinks::getInstance();

        $iLevel = (int)$aParams['level'];
        $iSelected = (int)$aParams['selected'];
        $iStart = isset($aParams['start']) ? (int)$aParams['start'] : 0;
        $iPerPage = isset($aParams['per_page']) ? (int)$aParams['per_page'] : 2;

        $aNodes = $this->_oDb->getContentStructure([
            'sample' => 'entry_id_full', 
            'entry_id' => $iContentId, 
            'level' => $iLevel, 
            'status' => 'active',
            'start' => $iStart, 
            'per_page' => $iPerPage ? $iPerPage + 1 : 0
        ]);

        if(empty($aNodes) || !is_array($aNodes))
            return $this->_bIsApi ? [
                'items' => [], 
                'isEditable' => $bEditable, 
                'entry_id' => $iContentId
            ] : '';

        $iLevelMax = $this->_oConfig->getContentLevelMax();
        $aLevelToNode = $this->_oConfig->getContentLevel2Node(false);

        $sTxtProgress = _t('_bx_courses_txt_n_m_progress');
        $sTmplKeysSelected = $this->_bIsApi ? 'selected' : 'bx_if:selected';
        $sTmplKeysCounters = $this->_bIsApi ? 'counters' : 'bx_repeat:counters';
        
        $aTmplVarsNodes = [];
        foreach($aNodes as $iKey => $aNode) {
            $aNodeStats = [];
            $this->_oModule->getNodePassByChildren($iProfileId, $iContentId, $aNode, $aNodeStats);           

            $aTmplVarsCounters = [];
            for($i = $iLevel + 1; $i <= $iLevelMax; $i++) {
                if(!isset($aNodeStats[$i]))
                    continue;

                $aTmplVarsCounters[] = [
                    'cn_title' => $aLevelToNode[$i],
                    'cn_passed' => $aNodeStats[$i]['passed'],
                    'cn_total' => $aNodeStats[$i]['total'],
                    'cn_progress' => bx_replace_markers($sTxtProgress, $aNodeStats[$i])
                ];
            }

            $bSelected = $aNode['node_id'] == $iSelected;
            $sLink = BX_DOL_URL_ROOT . $oPermalink->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&' . $CNF['FIELD_ID'] . '=' . $iContentId, [
                'parent_id' => $aNode['node_id']
            ]);
            $aNode = array_merge($aNode, [
                $sTmplKeysSelected => $this->_bIsApi ? $bSelected : [
                    'condition' => $bSelected,
                    'content' => [true]
                ],
                'index' => $iKey + 1,
                'link' => $this->_bIsApi ? bx_api_get_relative_url($sLink) : $sLink,
                'percent' => isset($aNodeStats[$iLevelMax]) && ($aStats = $aNodeStats[$iLevelMax]) && $aStats['total'] ? round(100 * $aStats['passed']/$aStats['total']) : 0,
                'status' => $this->_getNodeStatus($iProfileId, $iContentId, $aNode['node_id']),
                $sTmplKeysCounters => $aTmplVarsCounters
            ]);

            $aTmplVarsNodes[] = $this->_bIsApi ? $aNode : [
                'node' => $this->parseHtmlByName('node_l' . $iLevel . '.html', $aNode)
            ];
        }

        if($this->_bIsApi)
            return [
                'items' => $aTmplVarsNodes, 
                'isEditable' => $bEditable, 
                'entry_id' => $iContentId
            ];

        $oPaginate = new BxTemplPaginate([
            'start' => $iStart,
            'per_page' => $iPerPage,
            'on_change_page' => "return !loadDynamicBlockAutoPaginate(this, '{start}', '{per_page}')"
        ]);
        $oPaginate->setNumFromDataArray($aTmplVarsNodes);

        return $this->parseHtmlByName('nodes_l' . $iLevel . '.html', [
            'level' => $iLevel,
            'bx_repeat:nodes' => $aTmplVarsNodes,
            'paginate' => $oPaginate->getSimplePaginate()
        ]);
    }

    /**
     * For 1 level bases structure ( Max Level = 1)
     */
    public function entryStructureByParentMl1($aContentInfo, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];
        $iParentId = isset($aParams['parent_id']) ? (int)$aParams['parent_id'] : 0;
        $iProfileId = bx_get_logged_profile_id();

        $aNodes = $this->_oDb->getContentStructure([
            'sample' => 'entry_id_full', 
            'entry_id' => $iContentId, 
            'parent_id' => $iParentId,
            'status' => 'active'
        ]);

        if((empty($aNodes) || !is_array($aNodes)) && !$this->_bIsApi)
            return '';

        $sJsObject = $this->_oConfig->getJsObject('entry');
        $oPermalink = BxDolPermalinks::getInstance();
        
        $iLevelMax = $this->_oConfig->getContentLevelMax();

        $sTmplKeysShowPass = $this->_bIsApi ? 'show_pass' : 'bx_if:show_pass';

        $aTmplVarsNodes = [];
        foreach($aNodes as $iKey => $aNode) {
            list($iPassPercent, $sPassProgress, $sPassStatus, $sPassTitle) = $this->_oModule->getNodePassByData($iProfileId, $iContentId, $aNode);

            $sLink = BX_DOL_URL_ROOT . $oPermalink->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY_NODE'] . '&id=' . $iContentId, [
                'node_id' => $aNode['node_id']
            ]);

            $bShowPass = !empty($sPassTitle);

            $aNode = array_merge($aNode, [
                'level_max' => $iLevelMax,
                'index' => $iKey + 1,
                'link' => $sLink,
                'pass_percent' => $iPassPercent,
                'pass_progress' => $sPassProgress,
                'pass_status' => $sPassStatus,
                $sTmplKeysShowPass => $this->_bIsApi ? $bShowPass : [
                    'condition' => $bShowPass,
                    'content' => [
                        'js_object' => $sJsObject,
                        'id' => $aNode['node_id'],
                        'pass_href' => $sLink,
                        'pass_title' => $sPassTitle,
                    ]
                ]
            ]);

            if($this->_bIsApi) {
                if(!empty($aNode['counters']) && ($aCounters = json_decode($aNode['counters'], true)))
                    $aNode['counters'] = $this->getCounters($aCounters);

                $aNode = array_merge($aNode, [
                    'link' => bx_api_get_relative_url($aNode['link']),
                    'pass_title' => $sPassTitle,
                    'pass_callback' => $this->MODULE . '/pass_node&params[]=' . $aNode['node_id'],
                ]);
            }

            $aTmplVarsNodes[] = $this->_bIsApi ? $aNode : [
                'node' => $this->parseHtmlByName('ml' . $iLevelMax . '_node_l' . $aNode['level'] . '.html', $aNode)
            ];
        }

        if($this->_bIsApi)           
            return [
                'items' => $aTmplVarsNodes, 
                'isEditable' => $this->_oModule->checkAllowedEdit($aContentInfo) === CHECK_ACTION_RESULT_ALLOWED, 
                'entry_id' => $iContentId, 
                'parent_id' => $iParentId
            ];

        return $this->parseHtmlByName('ml' . $iLevelMax . '_nodes_l' . $aNode['level'] . '.html', [
            'level_max' => $iLevelMax,
            'level' => $aNode['level'],
            'bx_repeat:nodes' => $aTmplVarsNodes
        ]);
    }

    /**
     * For 2 levels bases structure ( Max Level = 2)
     */
    public function entryStructureByParentMl2($aContentInfo, $aParams = [])
    {
        if(empty($aParams['parent_id']))
            return $this->_bIsApi ? [] : '';

        return $this->entryStructureByParentMl1($aContentInfo, $aParams);
    }

    /**
     * For 3 levels bases structure ( Max Level = 3)
     */
    public function entryStructureByParentMl3($aContentInfo, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParams['parent_id']))
            return $this->_bIsApi ? [] : '';

        $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];
        $iParentId = (int)$aParams['parent_id'];
        $iProfileId = bx_get_logged_profile_id();

        $aNodes = $this->_oDb->getContentStructure([
            'sample' => 'entry_id_full', 
            'entry_id' => $iContentId, 
            'parent_id' => $iParentId,
            'status' => 'active'
        ]);

        if(empty($aNodes) || !is_array($aNodes))
            return $this->_bIsApi ? [] : '';

        $sJsObject = $this->_oConfig->getJsObject('entry');
        $oPermalink = BxDolPermalinks::getInstance();

        $iLevelMax = $this->_oConfig->getContentLevelMax();

        $aInputs = [];
        foreach($aNodes as $aNode) {
            $aInputs['node_' . $aNode['node_id']] = [
                'type' => 'block_header',
                'caption' => bx_process_output($aNode['title']),
                'collapsed' => false,
                'attrs' => ['id' => 'node_' . $aNode['node_id'], 'class' => ''],
            ];

            $aSubNodes = $this->_oDb->getContentStructure([
                'sample' => 'entry_id_full', 
                'entry_id' => $iContentId, 
                'parent_id' => (int)$aNode['node_id'], 
                'status' => 'active'
            ]);

            if(!empty($aSubNodes) && is_array($aSubNodes)) {
                $sTmplKeysShowPass = $this->_bIsApi ? 'show_pass' : 'bx_if:show_pass';
                $aTmplVarsNodes = [];
                foreach($aSubNodes as $iKey => $aSubNode) {
                    list($iPassPercent, $sPassProgress, $sPassStatus, $sPassTitle) = $this->_oModule->getNodePassByData($iProfileId, $iContentId, $aSubNode);

                    $sLink = BX_DOL_URL_ROOT . $oPermalink->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY_NODE'] . '&id=' . $iContentId, [
                        'node_id' => $aSubNode['node_id']
                    ]);

                    $bShowPass = !empty($sPassTitle);
                    
                    $aSubNode = array_merge($aSubNode, [
                        'level_max' => $iLevelMax,
                        'index' => $iKey + 1,
                        'link' => $this->_bIsApi ? bx_api_get_relative_url($sLink) : $sLink,
                        'pass_percent' => $iPassPercent,
                        'pass_progress' => $sPassProgress,
                        'pass_status' => $sPassStatus,
                        $sTmplKeysShowPass => $this->_bIsApi ? $bShowPass : [
                            'condition' => $sPassTitle,
                            'content' => [
                                'js_object' => $sJsObject,
                                'id' => $aSubNode['node_id'],
                                'pass_href' => $sLink,
                                'pass_title' => $sPassTitle,
                            ]
                        ]
                    ]);

                    $aTmplVarsNodes[] = $this->_bIsApi ? $aSubNode : [
                        'node' => $this->parseHtmlByName('ml3_node_l' . $aSubNode['level'] . '.html', $aSubNode)
                    ];
                }

                $sInput = 'node_' . $aNode['node_id'] . '_subnodes';
                $aInputs[$sInput] = [
                    'type' => 'custom',
                    'name' => $sInput,
                    'caption' => '',
                    'content' => $this->_bIsApi ? $aTmplVarsNodes : $this->parseHtmlByName('ml3_nodes_l' . $aSubNode['level'] . '.html', [
                        'level_max' => $iLevelMax,
                        'level' => $aSubNode['level'],
                        'bx_repeat:nodes' => $aTmplVarsNodes
                    ]),
                ];
            }
            else
                $aInputs['node_' . $aNode['node_id']]['collapsed'] = true;
        }

        $oForm = new BxTemplFormView([
            'form_attrs' => [
                'id' => 'bx-courses-structure-by-parent-' . $iParentId,
            ],
            'inputs' => $aInputs,
        ]);
        $oForm->setShowEmptySections(true);

        return $this->_bIsApi ? $oForm->getCodeAPI() : $oForm->getCode();
    }

    public function entryNode($aContentInfo, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isset($aParams['node_id']))
            return '';

        $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];
        $iNodeId = (int)$aParams['node_id'];
        $iUsage = isset($aParams['usage']) && $aParams['usage'] !== false ? (int)$aParams['usage'] : BX_COURSES_CND_USAGE_ST;
        $iProfileId = bx_get_logged_profile_id();

        $aNode = $this->_oDb->getContentNodes([
            'sample' => 'id_full', 
            'id' => $iNodeId,
        ]);

        $aTmplVars = [
            'index' => $aNode['order'],
            'sample' => $this->_oConfig->getContentNodeTitle($aNode['level']),
            'title' => $aNode['title'],
            'text' => $aNode['text'],
            'passing' => $aNode['passing']
        ];

        if($this->_bIsApi)
            return array_merge($aTmplVars, [
                'steps' => $this->_entryNodeItems($iProfileId, $iContentId, $aNode, BX_COURSES_CND_USAGE_ST),
                'attachments' => $this->_entryNodeItems($iProfileId, $iContentId, $aNode, BX_COURSES_CND_USAGE_AT) 
            ]);
        else
            $aTmplVars['bx_repeat:items'] = $this->_entryNodeItems($iProfileId, $iContentId, $aNode, $iUsage);
            

        $sMiName = 'node-data-';
        $sMiLink = BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY_NODE'] . '&id=' . $iContentId, [
            'node_id' => $iNodeId,
            'usage' => ''
        ]);

        $oMenu = new BxTemplMenu([
            'template' => 'menu_block_submenu_ver.html', 
            'menu_id'=> 'node-data', 
            'menu_items' => [
                ['id' => $sMiName . 'st', 'name' => $sMiName . 'st', 'class' => '', 'link' => $sMiLink . '0', 'target' => '_self', 'title' => _t('_bx_courses_menu_item_title_node_data_steps')],
                ['id' => $sMiName . 'at', 'name' => $sMiName . 'at', 'class' => '', 'link' => $sMiLink . '1', 'target' => '_self', 'title' => _t('_bx_courses_menu_item_title_node_data_attachments')]
            ]
        ]);
        $oMenu->setSelected('', $sMiName . $this->_oConfig->getUsageI2S($iUsage));

        return [
            'content' => $this->parseHtmlByName('node_view.html', $aTmplVars),
            'menu' => $oMenu
        ];
    }

    public function entryData($aData, $sView)
    {
        $sJsObject = $this->_oConfig->getJsObject('entry');

        $aNode = $this->_oDb->getContentNodes([
            'sample' => 'id', 
            'id' => $aData['node_id']
        ]);  

        $iOrder = (int)$aData['order'];
        $aSiblings = $this->_oDb->getContentData([
            'sample' => 'siblings', 
            'entry_id' => $aData['entry_id'], 
            'node_id' => $aData['node_id'], 
            'usage' => BX_COURSES_CND_USAGE_ST, 
            'order' => $iOrder
        ]);

        $bTmplVarsBack = false;
        $aTmplVarsBack = ($iOrderB = $iOrder - 1) && ($bTmplVarsBack = !empty($aSiblings[$iOrderB]) && is_array($aSiblings[$iOrderB])) ? [
            'js_object' => $sJsObject,
            'id_back' => $aSiblings[$iOrderB]['id']
        ] : [true];

        $bTmplVarsNext = false;
        $aTmplVarsNext = ($iOrderN = $iOrder + 1) && ($bTmplVarsNext = !empty($aSiblings[$iOrderN]) && is_array($aSiblings[$iOrderN])) ? [
            'js_object' => $sJsObject,
            'id_next' => $aSiblings[$iOrderN]['id']
        ] : [true];

        return ['popup' => [
            'html' => BxTemplFunctions::getInstance()->popupBox($this->_oConfig->getHtmlIds('popup_content_data'), $aNode['title'], $this->parseHtmlByName('node_data_view.html', [
                'js_object' => $sJsObject,
                'view' => $sView,
                'bx_if:show_back' => [
                    'condition' => $bTmplVarsBack,
                    'content' => $aTmplVarsBack
                ],
                'bx_if:show_next' => [
                    'condition' => $bTmplVarsNext,
                    'content' => $aTmplVarsNext
                ]
            ]), true),
            'options' => [
                'onHide' => 'document.location = document.location'
            ]
        ]];
    }

    protected function _entryNodeItems($iProfileId, $iContentId, $aNode, $iUsage)
    {
        $sJsObject = $this->_oConfig->getJsObject('entry');

        $aDataItems = $this->_oDb->getContentData([
            'sample' => 'entry_node_ids', 
            'entry_id' => $iContentId,
            'node_id' => $aNode['id'],
            'usage' => $iUsage
        ]);

        $sTxtUndefined = _t('_undefined');
        $sTxtPass = _t('_bx_courses_txt_pass');

        $bUsageSt = $iUsage == BX_COURSES_CND_USAGE_ST;
        $bUsageAt = $iUsage == BX_COURSES_CND_USAGE_AT;

        $aResults = [];
        if(!empty($aDataItems) && is_array($aDataItems))
            foreach($aDataItems as $iIndex => $aDataItem) {
                $sImageUrl = '';
                if(($sMethod = 'get_thumb') && bx_is_srv($aDataItem['content_type'], $sMethod))
                    $sImageUrl = bx_srv($aDataItem['content_type'], $sMethod, [$aDataItem['content_id']]);

                $sVideoUrl = '';
                if(($sMethod = 'get_video') && bx_is_srv($aDataItem['content_type'], $sMethod))
                    $sVideoUrl = bx_srv($aDataItem['content_type'], $sMethod, [$aDataItem['content_id']]);

                $sLink = '';
                if(($sMethod = 'get_link') && bx_is_srv($aDataItem['content_type'], $sMethod))
                    $sLink = bx_srv($aDataItem['content_type'], $sMethod, [$aDataItem['content_id']]);

                $bPassed = $bUsageSt && $this->_oModule->isDataPassed($iProfileId, $aDataItem);

                $aTmplVarsPass = [true];
                $bTmplVarsPass = $bUsageSt && !$bPassed && $sLink && ((int)$aNode['passing'] == BX_COURSES_CND_PASSING_ALL || $iIndex == 0 || $this->_oModule->isDataPassed($iProfileId, $aDataItems[$iIndex - 1]));
                if($bTmplVarsPass) {
                    $aTmplVarsPass = [
                        'js_object' => $sJsObject,
                        'id' => $aDataItem['id'],
                        'link' => $sLink,
                        'title' => $sTxtPass
                    ];
                }

                $sType = _t('_bx_courses_txt_data_type_' . $aDataItem['content_type']);

                $sTitle = '';
                if(($sMethod = 'get_title') && bx_is_srv($aDataItem['content_type'], $sMethod))              
                    $sTitle = bx_srv($aDataItem['content_type'], $sMethod, [$aDataItem['content_id']]);
                if(!$sTitle && ($sMethod = 'get_text') &&  bx_is_srv($aDataItem['content_type'], $sMethod))
                    $sTitle = bx_srv($aDataItem['content_type'], $sMethod, [$aDataItem['content_id']]);
                if(!$sTitle)
                    $sTitle = $sTxtUndefined;

                $bTmplVarsShowLink = $bUsageAt && $sLink;
                $aTmplVarsShowLink = $bTmplVarsShowLink ? [
                    'link' => $sLink,
                    'title' => $sTitle
                ] : false;

                $bTmplVarsShowSize = $aTmplVarsShowSize = false;
                $bTmplVarsShowDownload = $aTmplVarsShowDownload = false;
                if($bUsageAt && ($bTmplVarsShowSize = ($sMethod = 'get_file') && bx_is_srv($aDataItem['content_type'], $sMethod))) {
                    $aFileInfo = bx_srv($aDataItem['content_type'], $sMethod, [$aDataItem['content_id']]);
                    if(!empty($aFileInfo) && is_array($aFileInfo)) {
                        $aTmplVarsShowSize = [
                            'size' => _t_format_size($aFileInfo['size'])
                        ];

                        if(($bTmplVarsShowDownload = !empty($aFileInfo['url_download'])))
                            $aTmplVarsShowDownload = [
                                'link' => $aFileInfo['url_download']
                            ];
                    }
                }

                if($this->_bIsApi) {
                    $sText = '';
                    if(($sMethod = 'get_text') &&  bx_is_srv($aDataItem['content_type'], $sMethod))
                        $sText = bx_srv($aDataItem['content_type'], $sMethod, [$aDataItem['content_id']]);

                    $aResults[] = array_merge([
                        'id' => $aDataItem['id'],
                        'type' => $sType,
                        'title' => $sTitle,
                        'text' => $sText,
                        'image' => $sImageUrl,
                        'video' => $sVideoUrl
                    ], ($bUsageSt ? [
                        'pass_link' => $bTmplVarsPass ? bx_api_get_relative_url($sLink) : '',
                        'pass_title' => $sTxtPass,
                        'passed' => $bPassed
                    ] : [
                        'size' => $bTmplVarsShowSize ? $aTmplVarsShowSize['size'] : '',
                        'view_link' => $bTmplVarsShowLink ? bx_api_get_relative_url($sLink) : '',
                        'download_link' => $bTmplVarsShowDownload ? $aTmplVarsShowDownload['link'] : '',
                    ]));
                }
                else 
                    $aResults[] = [
                        'bx_if:show_image' => [
                            'condition' => $sImageUrl,
                            'content' => [
                                'image' => $sImageUrl
                            ]
                        ],
                        'bx_if:show_image_empty' => [
                            'condition' => !$sImageUrl,
                            'content' => [
                                'type' => $sType
                            ]
                        ],
                        'bx_if:show_video' => [
                            'condition' => $sVideoUrl,
                            'content' => [
                                'video' => $sVideoUrl
                            ]
                        ],
                        'type' => $sType,
                        'bx_if:show_link' => [
                            'condition' => $bTmplVarsShowLink,
                            'content' => $aTmplVarsShowLink
                        ],
                        'bx_if:show_text' => [
                            'condition' => !$bTmplVarsShowLink,
                            'content' => [
                                'title' => $sTitle,
                            ]
                        ],
                        'bx_if:show_size' => [
                            'condition' => $bTmplVarsShowSize,
                            'content' => $aTmplVarsShowSize
                        ],
                        'bx_if:show_pass' => [
                            'condition' => $bTmplVarsPass,
                            'content' => $aTmplVarsPass
                        ],
                        'bx_if:show_download' => [
                            'condition' => $bTmplVarsShowDownload,
                            'content' => $aTmplVarsShowDownload
                        ],
                    ];
            }

        return $aResults;
    }

    protected function _getNodeStatus($iProfileId, $iContentId, $iNodeId)
    {
        if($this->_oModule->isNodePassed($iProfileId, $iNodeId))
            return _t('_bx_courses_txt_status_completed');

        if($this->_oModule->isNodeStarted($iProfileId, $iNodeId))
            return _t('_bx_courses_txt_status_in_process');
        
        return _t('_bx_courses_txt_status_not_started');
    }
}

/** @} */
