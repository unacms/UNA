<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxDolVote
 */
class BxBaseVote extends BxDolVote
{
    protected $_bCssJsAdded;

    protected $_sJsClsName;
    protected $_sJsObjName;
    protected $_sStylePrefix;

    protected $_aHtmlIds;

    protected $_sTmplNameLegend;
    protected $_sTmplNameByList;

    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_aElementDefaults = [];
        $this->_aElementDefaultsApi = [];
        $this->_aElementParamsApi = ['is_voted'];

        $this->_bCssJsAdded = false;
        $this->_sStylePrefix = 'bx-vote';

        $this->_sJsClsName = 'BxDolVote';
        $this->_sJsObjName = 'oVote' . bx_gen_method_name($sSystem, array('_' , '-')) . $iId;

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $sSystem) . '-' . $iId;
        $this->_aHtmlIds = array(
            'counter' => 'bx-vote-counter-' . $sHtmlId,
            'by_popup' => 'bx-vote-by-popup-' . $sHtmlId
        );

        $this->_sTmplNameLegend = 'vote_legend.html';
        $this->_sTmplNameByList = 'vote_by_list.html';

        $this->_sTmplContentElementBlock = $this->_oTemplate->getHtml('vote_element_block.html');
        $this->_sTmplContentElementInline = $this->_oTemplate->getHtml('vote_element_inline.html');
        $this->_sTmplContentCounter = $this->_oTemplate->getHtml('vote_counter.html');
    }

    public function getJsClassName()
    {
        return $this->_sJsClsName;
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjName;
    }

    public function getJsScript($aParams = [])
    {
        $sJsObjName = $this->getJsObjectName();
        $sJsObjClass = $this->getJsClassName();

        $bDynamicMode = isset($aParams['dynamic_mode']) && (bool)$aParams['dynamic_mode'] === true;

        $sCode = "if(window['" . $sJsObjName . "'] == undefined) var " . $sJsObjName . " = new " . $sJsObjClass . "(" . json_encode($this->_prepareParamsData([
            'sSocket' => $this->getSocketName(),
            'aRequestParams' => $this->_prepareRequestParamsData($aParams)
        ])) . ");";

        return $this->_oTemplate->_wrapInTagJsCode($sCode);
    }

    public function getJsClick($iValue = 0)
    {
        return $this->getJsObjectName() . '.vote(this, ' . $iValue . ')';
    }

    public function getJsClickCounter($aParams = array())
    {
        return $this->getJsObjectName() . '.toggleByPopup(this)';
    }

    public function getCounter($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaults, $aParams);
        $bDynamicMode = isset($aParams['dynamic_mode']) && (bool)$aParams['dynamic_mode'] === true;
        $bShowEmpty = isset($aParams['show_counter_empty']) && (bool)$aParams['show_counter_empty'] === true;
        $bShowActive = $this->isAllowedVoteViewVoters() && (!isset($aParams['show_counter_active']) || (bool)$aParams['show_counter_active'] === true);
        $bShowScript = !isset($aParams['show_script']) || (bool)$aParams['show_script'] === true;

        $sClass = 'sys-action-counter';
        if(isset($aParams['show_counter_only']) && (bool)$aParams['show_counter_only'] === true)
            $sClass .= ' sys-ac-only';

        $sClass .= ' ' .$this->_sStylePrefix . '-counter ' . $this->_sStylePrefix . '-counter-' . $this->_sType;
        if(!empty($aParams['class_counter']))
            $sClass .= $aParams['class_counter'];

        $aTmplVarsAttrs = array();

        if($bShowActive)
            $aTmplVarsAttrs = array_merge($aTmplVarsAttrs, array(
                array('key' => 'href', 'value' => 'javascript:void(0)'),
                array('key' => 'title', 'value' => bx_html_attribute($this->_getTitleDoBy($aParams))),
                array('key' => 'onclick', 'value' => 'javascript:' . $this->getJsClickCounter($aParams))
            ));

        $sHtmlId = isset($aParams['id_counter']) ? $aParams['id_counter'] : $this->_aHtmlIds['counter'];
        if(!empty($sHtmlId))
            $aTmplVarsAttrs[] = array('key' => 'id', 'value' => $sHtmlId);

        $aVote = !empty($aParams['vote']) && is_array($aParams['vote']) ? $aParams['vote'] : $this->_getVote();
        $sContent = $bShowEmpty || (int)$aVote['count'] > 0 ? $this->_getCounterLabel($aVote['count'], $aParams) : '';

        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentCounter(), [
            'bx_if:show_text' => [
                'condition' => !$bShowActive,
                'content' => [
                    'class' => $sClass,
                    'bx_repeat:attrs' => $aTmplVarsAttrs,
                    'content' => $sContent
                ]
            ],
            'bx_if:show_link' => [
                'condition' => $bShowActive,
                'content' => [
                    'class' => $sClass,
                    'bx_repeat:attrs' => $aTmplVarsAttrs,
                    'content' => $sContent
                ]
            ],
            'class' => $sClass,
            'bx_repeat:attrs' => $aTmplVarsAttrs,
            'content' => $sContent,
            'script' => $bShowScript ? $this->getJsScript($aParams) : ''
        ]);
    }

    public function getLegend($aParams = array())
    {
        return '';
    }

    public function getElementBlock($aParams = array())
    {
        $aParams['usage'] = BX_DOL_VOTE_USAGE_BLOCK;

        return $this->getElement($aParams);
    }

    public function getElementInline($aParams = array())
    {
        $aParams['usage'] = BX_DOL_VOTE_USAGE_INLINE;

        return $this->getElement($aParams);
    }

    public function getElement($aParams = array())
    {
        $sMethod = '_getTmplContentElement' . bx_gen_method_name(!empty($aParams['usage']) ? $aParams['usage'] : BX_DOL_VOTE_USAGE_DEFAULT);
        if(!method_exists($this, $sMethod))
            return '';

        $aTmplVars = $this->_getTmplVarsElement($aParams);
        if(empty($aTmplVars) || !is_array($aTmplVars))
            return '';

        return $this->_oTemplate->parseHtmlByContent($this->$sMethod(), $aTmplVars);
    }
    
    public function getElementAPI($aParams = [])
    {
        if(!($this->_bIsApi = bx_is_api()))
            return;

        if(!$this->isEnabled())
            return bx_api_get_msg('_vote_err_not_enabled');

        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();

        $bCount = $this->_isCount();
        $isAllowedVote = $this->isAllowedVote();
        $isAllowedVoteView = $this->isAllowedVoteView();
        $aParams['is_voted'] = $this->isPerformed($iObjectId, $iAuthorId);
        $aParams['track'] = $aParams['is_voted'] ? $this->_getTrack($iObjectId, $iAuthorId) : array();

        //--- Do Vote
        $bDoVote = $this->_isShowDoVote($aParams, $isAllowedVote, $bCount);
        $aDoVote = $bDoVote ? $this->_getDoVote($aParams, $isAllowedVote) : [];

        //--- Counter
        $bCounter = $this->_isShowCounter($aParams, $isAllowedVote, $isAllowedVoteView, $bCount);
        $aCounter = $bCounter ? $this->getCounterAPI(array_merge($aParams, [
            'show_counter_only' => false, 
            'show_script' => false
        ])) : [];


        if(!$bDoVote && !$bCounter)
            return bx_api_get_msg('');

        return [
            'type' => $this->_sType,
            'system' => $this->_sSystem,
            'object_id' => $this->_iId,
            'params' => array_intersect_key($aParams, array_flip($this->_aElementParamsApi)),
            'action' => $aDoVote,
            'counter' => $aCounter
        ];
    }

    public function getPerformedByAPI($aParams = [])
    {
        $aValues = $this->_oQuery->getPerformedBy($this->getId());

        $aTmplUsers = [];
        foreach($aValues as $mValue) {
            $mValue = is_array($mValue) ? $mValue : ['author_id' => (int)$mValue, 'reaction' => ''];

            $aTmplUsers[] = BxDolProfile::getData($mValue['author_id']);
        }

        return [
            'performed_by' => $aTmplUsers
        ];
    }

    /**
     * Internal methods.
     */
    protected function _prepareParamsData($aParams)
    {
        return parent::_prepareParamsData(array_merge([
            'sObjName' => $this->getJsObjectName(),
            'sStylePrefix' => $this->_sStylePrefix,
            'aHtmlIds' => $this->_aHtmlIds,
        ], $aParams));
    }

    /*
     * This method should be overwritten by subclass.
     */
    protected function _getTmplVarsElement($aParams = array())
    {
    	$aParams = array_merge($this->_aElementDefaults, $aParams);

    	$bDynamicMode = isset($aParams['dynamic_mode']) && (bool)$aParams['dynamic_mode'] === true;
        $bShowCounterEmpty = isset($aParams['show_counter_empty']) && (bool)$aParams['show_counter_empty'] === true;

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();

        $bCount = $this->_isCount();
        $isAllowedVote = $this->isAllowedVote();
        $isAllowedVoteView = $this->isAllowedVoteView();
        $aParams['is_voted'] = $this->isPerformed($iObjectId, $iAuthorId);
        $aParams['track'] = $aParams['is_voted'] ? $this->_getTrack($iObjectId, $iAuthorId) : array();

        //--- Do Vote
        $bTmplVarsDoVote = $this->_isShowDoVote($aParams, $isAllowedVote, $bCount);
        $aTmplVarsDoVote = array();
        if($bTmplVarsDoVote)
            $aTmplVarsDoVote = array(
                'style_prefix' => $this->_sStylePrefix,
                'do_vote' => $this->_getDoVote($aParams, $isAllowedVote),
            );

        //--- Counter
        $bTmplVarsCounter = $this->_isShowCounter($aParams, $isAllowedVote, $isAllowedVoteView, $bCount);
        $aTmplVarsCounter = array();
        if($bTmplVarsCounter)
            $aTmplVarsCounter = array(
                'style_prefix' => $this->_sStylePrefix,
                'bx_if:show_hidden' => array(
                    'condition' => !$bCount && !$bShowCounterEmpty,
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
            return array();

        $sClass = $this->_sStylePrefix . '-' . $this->_sType;
        if(!empty($aParams['class_element']))
            $sClass .= $aParams['class_element'];

        return array(
            'style_prefix' => $this->_sStylePrefix,
            'html_id' => $this->_aHtmlIds['main'],
            'class' => $sClass . ' ' . $this->_aHtmlIds['main'],
            'bx_if:show_vote_data' => array(
                'condition' => false,
                'content' => array()
            ),
            'bx_if:show_do_vote' => array(
                'condition' => $bTmplVarsDoVote,
                'content' => $aTmplVarsDoVote
            ),
            'bx_if:show_counter' => array(
                'condition' => $bTmplVarsCounter,
                'content' => $aTmplVarsCounter
            ),
            'bx_if:show_legend' => array(
            	'condition' => $bTmplVarsLegend,
            	'content' => $aTmplVarsLegend
            ),
            'script' => $this->getJsScript($aParams)
        );
    }

    protected function _getDoVote($aParams = array(), $isAllowedVote = true)
    {
        return $this->_bIsApi ? [] : '';
    }

    protected function _getCounterLabel($iCount, $aParams = array())
    {
        return _t(isset($aParams['caption']) ? $aParams['caption'] : '_vote_counter', $iCount);
    }

    protected function _getVotedBy($aParams = array())
    {
        $aTmplUsers = array();

        $aUserIds = $this->_oQuery->getPerformedBy($this->getId());
        foreach($aUserIds as $iUserId) {
            list($sUserName, $sUserUrl, $sUserIcon, $sUserUnit) = $this->_getAuthorInfo($iUserId);
            $aTmplUsers[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'user_unit' => $sUserUnit
            );
        }

        if(empty($aTmplUsers))
            $aTmplUsers = MsgBox(_t('_Empty'));

        return $this->_oTemplate->parseHtmlByName($this->_sTmplNameByList, array(
            'style_prefix' => $this->_sStylePrefix,
            'class' => '',
            'bx_repeat:list' => $aTmplUsers
        ));
    }

    protected function _isShowDoVote($aParams, $isAllowedVote, $bCount)
    {
        return !isset($aParams['show_do_vote']) || (bool)$aParams['show_do_vote'] === true;
    }

    protected function _isShowCounter($aParams, $isAllowedVote, $isAllowedVoteView, $bCount)
    {
        return isset($aParams['show_counter']) && (bool)$aParams['show_counter'] === true && $isAllowedVoteView && ($isAllowedVote || $bCount);
    }

    protected function _isShowLegend($aParams, $isAllowedVote, $isAllowedVoteView, $bCount)
    {
        return false;
    }
}

/** @} */
