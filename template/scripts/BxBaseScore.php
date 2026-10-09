<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxDolScore
 */
class BxBaseScore extends BxDolScore
{
    protected $_bCssJsAdded;

    protected $_sJsObjName;
    protected $_sStylePrefix;

    protected $_aHtmlIds;

    protected $_sTmplNameLegend;
    protected $_sTmplNameByList;

    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_bCssJsAdded = false;

        $this->_sJsObjName = 'oScore' . bx_gen_method_name($sSystem, array('_' , '-')) . $iId;
        $this->_sStylePrefix = 'bx-score';

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $sSystem) . '-' . $iId;
        $this->_aHtmlIds = array(
            'main' => 'bx-score-' . $sHtmlId,
            'counter' => 'bx-score-counter-' . $sHtmlId,
            'by_popup' => 'bx-score-by-popup-' . $sHtmlId,
            'legend' => 'bx-score-legend-' . $sHtmlId,
        );

        $this->_aElementDefaults = [
            'show_do_vote_as_button' => false,
            'show_do_vote_as_button_small' => false,
            'show_do_vote_icon' => true,
            'show_do_vote_label' => false,
            'show_counter' => true,
            'show_counter_only' => true,
            'show_counter_empty' => true,
            'show_counter_style' => self::$_sCounterStyleSimple, //--- Alloved styles are 'simple', 'divided'
            'show_counter_label_icon' => false,
            'show_counter_label_text' => true,
            'show_legend' => false,
            'show_script' => true
        ];
        $this->_aElementDefaultsApi = array_merge($this->_aElementDefaults, [
            'show_counter' => true,
        ]);
        $this->_aElementParamsApi = ['is_voted'];

        $this->_sTmplNameLegend = 'score_legend.html';
        $this->_sTmplNameByList = 'score_by_list.html';

        $this->_sTmplContentElementBlock = $this->_oTemplate->getHtml('score_element_block.html');
        $this->_sTmplContentElementInline = $this->_oTemplate->getHtml('score_element_inline.html');
        $this->_sTmplContentDoActionLabel = $this->_oTemplate->getHtml('score_do_vote_label.html');
        $this->_sTmplContentCounterLabel = $this->_oTemplate->getHtml('score_counter_label.html');
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjName;
    }

    public function getJsScript($aParams = [])
    {
        $sJsObjName = $this->getJsObjectName();

        $bDynamicMode = isset($aParams['dynamic_mode']) && (bool)$aParams['dynamic_mode'] === true;

        $aParamsJs = array(
            'sObjName' => $sJsObjName,
            'sSystem' => $this->getSystemName(),
            'iAuthorId' => $this->_getAuthorId(),
            'iObjId' => $this->getId(),
            'sRootUrl' => BX_DOL_URL_ROOT,
            'sSocket' => $this->getSocketName(),
            'sStylePrefix' => $this->_sStylePrefix,
            'aHtmlIds' => $this->_aHtmlIds,
            'aRequestParams' => $this->_prepareRequestParamsData($aParams)
        );
        $sCode = "if(window['" . $sJsObjName . "'] == undefined) var " . $sJsObjName . " = new BxDolScore(" . json_encode($aParamsJs) . ");";

        return $this->_oTemplate->_wrapInTagJsCode($sCode);
    }

    public function getJsClick($sType)
    {
        return $this->getJsObjectName() . '.vote' . ucfirst($sType) . '(this)';
    }

    public function getJsClickCounter($aParams = [])
    {
        $sJsObject = $this->getJsObjectName();
        $sJsMethod = 'toggleByPopup';

        if(!isset($aParams['type'], $aParams['show_counter_style']) || $aParams['show_counter_style'] == self::$_sCounterStyleSimple)
            return $sJsObject . '.' . $sJsMethod . '(this)';

        return $sJsObject . '.' . $sJsMethod . '(this, \'' . $aParams['type'] . '\')';
    }

    public function getCounter($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaults, $aParams);

        $sDefault = $this->_aElementDefaults['show_counter_style'];
        $sCounterStyle = !empty($aParams['show_counter_style']) ? $aParams['show_counter_style'] : $sDefault;

        $sMethodPrefix = '_getCounter';
        $sMethod = $sMethodPrefix . bx_gen_method_name($sCounterStyle);
        if(!method_exists($this, $sMethod))
            $sMethod = $sMethodPrefix . bx_gen_method_name($sDefault);

        return $this->$sMethod($aParams);
    }

    public function _getCounterSimple($aParams = [])
    {
        $aScore = $this->_getVote();

        $iCup = (int)$aScore['count_up'];
        $iCdown = (int)$aScore['count_down'];

        return $this->_getCounterItem(array_merge($aParams, [
            'allowed_view_voters' => $this->isAllowedVoteViewVoters(),
            'value' => $iCup - $iCdown,
            'value_empty' => $iCup == 0 && $iCdown == 0,
        ]));
    }

    public function _getCounterDivided($aParams = [])
    {
        $bShowCounterEmpty = isset($aParams['show_counter_empty']) && (bool)$aParams['show_counter_empty'] === true;
        $bShowCounterOnly = isset($aParams['show_counter_only']) && (bool)$aParams['show_counter_only'] === true;
        $bShowScript = !isset($aParams['show_script']) || (bool)$aParams['show_script'] === true;

        $bAllowedViewVoters = $this->isAllowedVoteViewVoters();

        $bScore = $this->_isVote();
        $aScore = $this->_getVote();

        $aCounters = [
            BX_DOL_SCORE_DO_UP => (int)$aScore['count_up'],
            BX_DOL_SCORE_DO_DOWN => (int)$aScore['count_down']
        ];

        $sCounters = '';
        foreach($aCounters as $sType => $iValue)
            $sCounters .= $this->_getCounterItem(array_merge($aParams, [
                'show_counter_label_icon' => $bShowCounterOnly,
                'show_script' => false,
                'allowed_view_voters' => $bAllowedViewVoters,
                'type' => $sType,
                'value_html_id' => $this->_aHtmlIds['counter'] . '-' . $sType,
                'value' => $iValue,
                'value_empty' => !$bScore,
            ]));

        return $this->_oTemplate->parseHtmlByName('score_counter_wrapper.html', [
            'html_id' => $this->_aHtmlIds['counter'],
            'style_prefix' => $this->_sStylePrefix,
            'class' => $this->_aHtmlIds['counter'] . (!$bScore && !$bShowCounterEmpty ? ' bx-sc-hidden' : ''),
            'style' => self::$_sCounterStyleDivided,
            'counter' => $sCounters,
            'script' => $bShowScript ? $this->getJsScript($aParams) : ''
        ]);
    }

    public function _getCounterItem($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaults, $aParams);

        $bDynamicMode = isset($aParams['dynamic_mode']) && (bool)$aParams['dynamic_mode'] === true;
        $bShowEmpty = isset($aParams['show_counter_empty']) && (bool)$aParams['show_counter_empty'] === true;
        $bShowDoVoteAsButtonSmall = isset($aParams['show_do_vote_as_button_small']) && (bool)$aParams['show_do_vote_as_button_small'] === true;
        $bShowDoVoteAsButton = !$bShowDoVoteAsButtonSmall && isset($aParams['show_do_vote_as_button']) && (bool)$aParams['show_do_vote_as_button'] === true;
        $bShowScript = !isset($aParams['show_script']) || (bool)$aParams['show_script'] === true;

        $sClass = 'sys-action-counter';
        if(isset($aParams['show_counter_only']) && (bool)$aParams['show_counter_only'] === true)
            $sClass .= ' sys-ac-only';

        $sClass .= ' ' . $this->_sStylePrefix . '-counter';
        if($bShowDoVoteAsButtonSmall)
            $sClass .= ' bx-btn-small-height';
        if($bShowDoVoteAsButton)
            $sClass .= ' bx-btn-height';

        $bLink = $aParams['allowed_view_voters'] && !$aParams['value_empty'];
        $sCounter = !$aParams['value_empty'] || $bShowEmpty ? $this->_getCounterLabel($aParams['value'], $aParams) : '';

        $aTmplVarsText = [
            'id' => isset($aParams['value_html_id']) ? $aParams['value_html_id'] : $this->_aHtmlIds['counter'],
            'class' => $sClass,
            'content' => $sCounter,
            'title' => _t($this->_getTitleDoBy()),
        ];

        $aTmplVarsLink = array_merge($aTmplVarsText, [
            'onclick' => $bLink ? 'javascript:' . $this->getJsClickCounter($aParams) : ''
        ]);

        return $this->_oTemplate->parseHtmlByName('score_counter.html', array(
            'bx_if:show_link' => array(
                'condition' => $bLink,
                'content' => $aTmplVarsLink
            ),
            'bx_if:show_text' => array(
                'condition' => !$bLink,
                'content' => $aTmplVarsText
            ),
            'script' => $bShowScript ? $this->getJsScript($aParams) : ''
        ));
    }

    public function getCounterAPI($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        return $this->_getVote();
    }

    public function getLegend($aParams = array())
    {
        $aLegend = $this->_oQuery->getLegend($this->_iId);
        $aTypes = array(
            BX_DOL_SCORE_DO_UP,
            BX_DOL_SCORE_DO_DOWN
        );

        $aTmplVarsItems = array();
        foreach($aTypes as $sType)
            $aTmplVarsItems[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'value' => $this->_getLabelDo($sType, $aParams),
                'label' => isset($aLegend[$sType]['count']) ? (int)$aLegend[$sType]['count'] : 0
            );

        return $this->_oTemplate->parseHtmlByName($this->_sTmplNameLegend, array(
            'style_prefix'  => $this->_sStylePrefix,
            'html_id' => $this->_aHtmlIds['legend'],
            'bx_repeat:items' => $aTmplVarsItems
        ));
    }

    public function getElementBlock($aParams = array())
    {
        $aParams['usage'] = BX_DOL_SCORE_USAGE_BLOCK;

        return $this->getElement($aParams);
    }

    public function getElementInline($aParams = array())
    {
        $aParams['usage'] = BX_DOL_SCORE_USAGE_INLINE;

        return $this->getElement($aParams);
    }

    public function getElement($aParams = array())
    {
    	$aParams = array_merge($this->_aElementDefaults, $aParams);

        $bShowDoVoteAsButtonSmall = isset($aParams['show_do_vote_as_button_small']) && (bool)$aParams['show_do_vote_as_button_small'] === true;
        $bShowDoVoteAsButton = !$bShowDoVoteAsButtonSmall && isset($aParams['show_do_vote_as_button']) && (bool)$aParams['show_do_vote_as_button'] === true;
        $bShowCounterEmpty = isset($aParams['show_counter_empty']) && (bool)$aParams['show_counter_empty'] === true;
        $bShowCounterSimple = $bShowCounterDivided = false;
        if(isset($aParams['show_counter_style'])) {
            if($aParams['show_counter_style'] == self::$_sCounterStyleSimple)
                $bShowCounterSimple = true;
            if($aParams['show_counter_style'] == self::$_sCounterStyleDivided)
                $bShowCounterDivided = true;
        }

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        $iAuthorIp = $this->_getAuthorIp();
        $isAllowedVote = $this->isAllowedVote();
        $isAllowedVoteView = $this->isAllowedVoteView();
        $isAllowedVoteViewVoters = $this->isAllowedVoteViewVoters();

        $aScore = $this->_getVote();
        $bCount = $this->_isCount($aScore);
        $bCounter = $this->_isShowCounter($aParams, $isAllowedVote, $isAllowedVoteView, $bCount);

        $aParams['is_voted'] = $this->isPerformed($iObjectId, $iAuthorId, $iAuthorIp) ? true : false;

        //--- Do Vote
        $bTmplVarsDoVote = $this->_isShowDoVote($aParams, $isAllowedVote, $bCount);
        $aTmplVarsDoVoteUp = $aTmplVarsDoVoteDown = [];
        if($bTmplVarsDoVote)
            foreach([BX_DOL_SCORE_DO_UP, BX_DOL_SCORE_DO_DOWN] as $sType)
                ${'aTmplVarsDoVote' . ucfirst($sType)} = [
                    'style_prefix' => $this->_sStylePrefix,
                    'style' => $aParams['show_counter_style'],
                    'do_vote' => $this->_getDoVote($sType, $aParams, $isAllowedVote),
                    'bx_if:show_counter_' . $sType => [
                        'condition' => $bShowCounterDivided && $bCounter,
                        'content' => [
                            'style_prefix' => $this->_sStylePrefix,
                            'style' => $aParams['show_counter_style'],
                            'bx_if:show_c' . $sType . '_hidden' => [
                                'condition' => !$bShowCounterEmpty && !$bCount,
                                'content' => []
                            ],
                            'counter' => $this->_getCounterItem(array_merge($aParams, [
                                'show_do_vote_as_button' => false,
                                'show_do_vote_as_button_small' => false,
                                'show_counter_only' => false,
                                'show_counter_label_icon' => false,
                                'show_script' => false,
                                'allowed_view_voters' => $isAllowedVoteViewVoters,
                                'type' => $sType,
                                'value_html_id' => $this->_aHtmlIds['counter'] . '-' . $sType,
                                'value' => isset($aScore['count_' . $sType]) ? (int)$aScore['count_' . $sType] : 0,
                                'value_empty' => !$bCount,
                            ]))
                        ]
                    ]
                ];

        //--- Counter (Simple)
        $bTmplVarsCounter = $bShowCounterSimple && $bCounter;
        $aTmplVarsCounter = array();
        if($bTmplVarsCounter)
            $aTmplVarsCounter = array(
                'style_prefix' => $this->_sStylePrefix,
                'bx_if:show_hidden' => array(
                    'condition' => !$bShowCounterEmpty && !$bCount,
                    'content' => array()
                ),
                'counter' => $this->getCounter(array_merge($aParams, [
                    'show_counter_only' => false,
                    'show_script' => false
                ]))
            );

        //--- Legend
        $bTmplVarsLegend = $this->_isShowLegend($aParams, $isAllowedVote, $isAllowedVoteView, $bCount);
        $aTmplVarsLegend = array();
        if($bTmplVarsLegend)
            $aTmplVarsLegend = array(
                'legend' => $this->getLegend($aParams)
            );

        if(!$bTmplVarsDoVote && !$bTmplVarsCounter && !$bTmplVarsLegend)
            return '';

        $sTmplName = $this->{'_getTmplContentElement' . bx_gen_method_name(!empty($aParams['usage']) ? $aParams['usage'] : BX_DOL_SCORE_USAGE_DEFAULT)}();
        return $this->_oTemplate->parseHtmlByContent($sTmplName, array(
            'style_prefix' => $this->_sStylePrefix,
            'html_id' => $this->_aHtmlIds['main'],
            'class' => $this->_sStylePrefix . ($bShowDoVoteAsButton ? '-button' : '') . ($bShowDoVoteAsButtonSmall ? '-button-small' : ''),
            'score' => $aScore['score'],
            'cup' => $aScore['count_up'],
        	'cdown' => $aScore['count_down'],
        	'bx_if:show_do_vote_up' => array(
                    'condition' => $bTmplVarsDoVote,
                    'content' => $aTmplVarsDoVoteUp
        	),
        	'bx_if:show_counter' => array(
                    'condition' => $bTmplVarsCounter,
                    'content' => $aTmplVarsCounter
                ),
                'bx_if:show_do_vote_down' => array(
                    'condition' => $bTmplVarsDoVote,
                    'content' => $aTmplVarsDoVoteDown
        	),
            'bx_if:show_legend' => array(
            	'condition' => $bTmplVarsLegend,
            	'content' => $aTmplVarsLegend
            ),
            'script' => $this->getJsScript($aParams)
        ));
    }

    public function getElementAPI($aParams = [])
    {
        if(!($this->_bIsApi = bx_is_api()))
            return;

        if(!$this->isEnabled())
            return bx_api_get_msg('_sys_score_err_not_enabled');

        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();

        $bCount = $this->_isCount();
        $isAllowedVote = $this->isAllowedVote();
        $isAllowedVoteView = $this->isAllowedVoteView();
        $aParams['is_voted'] = $this->isPerformed($iObjectId, $iAuthorId);
        $aParams['track'] = $aParams['is_voted'] ? $this->_getTrack($iObjectId, $iAuthorId) : [];

        //--- Do Vote
        $bDoVote = $this->_isShowDoVote($aParams, $isAllowedVote, $bCount);
        $aDoVoteUp = $bDoVote ? $this->_getDoVote(BX_DOL_SCORE_DO_UP, $aParams, $isAllowedVote) : [];
        $aDoVoteDown = $bDoVote ? $this->_getDoVote(BX_DOL_SCORE_DO_DOWN, $aParams, $isAllowedVote) : [];

        //--- Counter
        $bCounter = $this->_isShowCounter($aParams, $isAllowedVote, $isAllowedVoteView, $bCount);
        $aCounter = $bCounter ? $this->getCounterAPI(array_merge($aParams, [
            'show_counter_only' => false, 
            'show_script' => false
        ])) : [];

        if(!$bDoVote && !$bCounter)
            return bx_api_get_msg('');

        return [
            'type' => 'scores',
            'system' => $this->_sSystem,
            'object_id' => $this->_iId,
            'params' => array_intersect_key($aParams, array_flip($this->_aElementParamsApi)),
            'action' => [
                BX_DOL_SCORE_DO_UP => $aDoVoteUp,
                BX_DOL_SCORE_DO_DOWN => $aDoVoteDown
            ],
            'counter' => $aCounter,
        ];
    }

    protected function _getDoVote($sType, $aParams = [], $isAllowedVote = true)
    {
        $bUndo = $this->isUndo();
    	$bVoted = isset($aParams['is_voted']) && (bool)$aParams['is_voted'] === true;
        $bShowDoVoteAsButtonSmall = isset($aParams['show_do_vote_as_button_small']) && (bool)$aParams['show_do_vote_as_button_small'] === true;
        $bShowDoVoteAsButton = !$bShowDoVoteAsButtonSmall && isset($aParams['show_do_vote_as_button']) && (bool)$aParams['show_do_vote_as_button'] === true;
        $bDisabled = !$isAllowedVote || ($bVoted && !$bUndo);

        $sClass = '';
        if($bShowDoVoteAsButton)
            $sClass = 'bx-btn';
        else if ($bShowDoVoteAsButtonSmall)
            $sClass = 'bx-btn bx-btn-small';

        if($bDisabled)
            $sClass .= $bShowDoVoteAsButton || $bShowDoVoteAsButtonSmall ? ' bx-btn-disabled' : 'bx-score-disabled';

        if($this->_bIsApi)
            return [
                'is_undo' => $bUndo,
                'is_voted' => $bVoted,
                'is_disabled' => $bDisabled,
                'title' => _t($this->_getTitleDo($sType)),
            ];

        return $this->_oTemplate->parseLink('javascript:void(0)', $this->_getLabelDo($sType, $aParams), array(
            'class' => $this->_sStylePrefix . '-do-vote ' . $this->_sStylePrefix . '-dv-' . $sType . ' ' . $sClass,
            'title' => _t($this->_getTitleDo($sType)),
            'onclick' => !$bDisabled ? $this->getJsClick($sType) : ''
        ));
    }

    protected function _getCounterLabel($iCount, $aParams = [])
    {
        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentCounterLabel(), array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => !isset($aParams['show_counter_label_icon']) || (bool)$aParams['show_counter_label_icon'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'icon' => $this->_oTemplate->getImageAuto($this->_getIconDo(isset($aParams['type']) ? $aParams['type'] : ''))
                )
            ),
            'bx_if:show_text' => array(
                'condition' => !isset($aParams['show_counter_label_text']) || (bool)$aParams['show_counter_label_text'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'text' => _t('_sys_score_counter', $iCount)
                )
            )
        ));
    }

    protected function _getLabelDo($sType, $aParams = array())
    {
        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentDoActionLabel(), array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => isset($aParams['show_do_vote_icon']) && (bool)$aParams['show_do_vote_icon'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'icon' => $this->_oTemplate->getImageAuto($this->_getIconDo($sType))
                )
            ),
            'bx_if:show_text' => array(
                'condition' => isset($aParams['show_do_vote_label']) && (bool)$aParams['show_do_vote_label'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'text' => _t($this->_getTitleDo($sType))
                )
            )
        ));
    }

    protected function _getVotedBy($aParams)
    {
        $aParams = array_merge($this->_aElementDefaults, $aParams, [
            'show_do_vote_icon' => true,
            'show_do_vote_label' => false
        ]);

        $aParamsDb = [];
        if(!empty($aParams['type']))
            $aParamsDb['type'] = $aParams['type'];
        $aUsers = $this->_oQuery->getPerformedBy($this->getId(), $aParamsDb);

        $aTmplUsers = [];
        foreach($aUsers as $aUser) {
            list($sUserName, $sUserLink, $sUserIcon, $sUserUnit, $sUserUnitWoInfo) = $this->_getAuthorInfo($aUser['id']);
            $aTmplUsers[] = [
                'style_prefix' => $this->_sStylePrefix,
            	'user_name' => $sUserName,
            	'user_link' => $sUserLink,
                'user_unit' => $sUserUnitWoInfo,
                'vote' => $this->_getLabelDo($aUser['vote_type'], $aParams),
                'date' => bx_time_js($aUser['vote_date']),
            ];
        }

        if(empty($aTmplUsers))
            $aTmplUsers = MsgBox(_t('_Empty'));

        return $this->_oTemplate->parseHtmlByName($this->_sTmplNameByList, [
            'style_prefix' => $this->_sStylePrefix,
            'bx_repeat:list' => $aTmplUsers
        ]);
    }

    protected function _isShowDoVote($aParams, $isAllowedVote, $bCount)
    {
        $bShowDoVote = !isset($aParams['show_do_vote']) || (bool)$aParams['show_do_vote'] === true;

        return $bShowDoVote && ($isAllowedVote || $bCount);
    }

    protected function _isShowCounter($aParams, $isAllowedVote, $isAllowedVoteView, $bCount)
    {
        return isset($aParams['show_counter']) && (bool)$aParams['show_counter'] === true && $isAllowedVoteView && ($isAllowedVote || $bCount);
    }

    protected function _isShowLegend($aParams, $isAllowedVote, $isAllowedVoteView, $bCount)
    {
        return isset($aParams['show_legend']) && (bool)$aParams['show_legend'] === true && $isAllowedVoteView;
    }
}

/** @} */
