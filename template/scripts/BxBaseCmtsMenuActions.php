<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseCmtsMenuActions extends BxTemplMenuCustom
{
    protected static $_sModeActions = 'actions';
    protected static $_sModeCounters = 'counters';

    protected $_bIsApi;

    protected $_oCmts;
    protected $_aCmt;
    protected $_aBp;
    protected $_aDp;

    protected $_sMode;
    protected $_bShowTitles;
    protected $_bShowCounters;
    protected $_bShowCountersEmpty;
    protected $_bShowCountersIcons;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_bIsApi = bx_is_api();

        $this->_aBp = [];
        $this->_aDp = [];

        $this->_sMode = strpos($this->_sObject, '_actions') !== false ? self::$_sModeActions : self::$_sModeCounters;
        $this->_bShowTitles = true;
        $this->_bShowCounters = false;
        $this->_bShowCountersEmpty = false;
        $this->_bShowCountersIcons = true;
    }

    public function setCmtsData($oCmts, $iCmtId, $aBp = [], $aDp = [])
    {
        if(empty($oCmts) || empty($iCmtId))
            return;

        $this->_oCmts = $oCmts;
        $this->_aCmt = $oCmts->getCommentRow($iCmtId);

        $this->_aBp = $aBp;
        $this->_aDp = $aDp;

        $sJsObject = $oCmts->getJsObjectName();
        $this->addMarkers(array(
            'js_object' => $sJsObject,
            'cmt_system' => $this->_oCmts->getSystemName(),
            'cmt_object_id' => $this->_oCmts->getId(),
            'cmt_id' => $iCmtId,
            'content_id' => $iCmtId,
            'reply_onclick' => $sJsObject . '.toggleReply(this, ' . $iCmtId . ')',
            'quote_onclick' => $sJsObject . '.toggleQuote(this, ' . $iCmtId . ')'
        ));
    }

    public function getMenuItems()
    {
        if($this->_sMode == self::$_sModeActions && (int)$this->_aCmt['cmt_pinned'] > 0 && !empty($this->_aBp['pinned']))
            $this->_aObject['menu_items'] = [
                'item-unpin' => [
                    'name' => 'item-unpin', 
                    'title' => '_sys_menu_item_title_cmts_item_unpin', 
                    'link' => 'javascript:void(0)',
                    'onclick' => 'javascript:{js_object}.cmtPin(this, {content_id}, 0)',
                    'icon' => 'pin'
                ]
            ];

        return parent::getMenuItems();
    }

    protected function _getMenuItemItemVote($aItem)
    {
        $oVote = $this->_oCmts->getVoteObject($this->_aCmt['cmt_unique_id']);
        if(!$oVote)
            return false;

        $aVotesParams = [
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_vote_label' => $this->_bShowTitles,
            'show_counter' => $this->_bShowCounters,
            'show_counter_empty' => $this->_bShowCountersEmpty,
            'show_counter_label_icon' => $this->_bShowCountersIcons,
        ];

        switch($this->_sMode) {
            case self::$_sModeActions:
                $sVotesMethod = 'getElementInline';
                break;

            case self::$_sModeCounters:
                $sVotesMethod = 'getCounter';
                break;
        }

        if($this->_bIsApi)
            return $this->_getMenuItemElementApi($aItem, $oVote->getElementApi(array_merge($aVotesParams, [
                'show_counter' => true,
            ])));

        return $oVote->$sVotesMethod($aVotesParams);
    }

    protected function _getMenuItemItemReaction($aItem)
    {
        $oReaction = $this->_oCmts->getReactionObject($this->_aCmt['cmt_unique_id']);
        if(!$oReaction)
            return false;

        $aReactionsParams = [
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_vote_label' => $this->_bShowTitles,
            'show_counter' => $this->_bShowCounters,
            'show_counter_empty' => $this->_bShowCountersEmpty,
            'show_counter_style' => 'compound',
            'show_counter_label_icon' => $this->_bShowCountersIcons,
        ];

        switch($this->_sMode) {
            case self::$_sModeActions:
                $sReactionsMethod = 'getElementInline';
                break;

            case self::$_sModeCounters:
                $sReactionsMethod = 'getCounter';
                break;
        }

        if($this->_bIsApi)
            return $this->_getMenuItemElementApi($aItem, $oReaction->getElementApi(array_merge($aReactionsParams, [
                'show_counter' => true,
            ])));

        return $oReaction->$sReactionsMethod($aReactionsParams);
    }

    protected function _getMenuItemItemScore($aItem)
    {
        $oScore = $this->_oCmts->getScoreObject($this->_aCmt['cmt_unique_id']);
        if(!$oScore)
            return false;

        $aScoresParams = array(
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_vote_label' => $this->_bShowTitles,
            'show_counter' => $this->_bShowCounters,
            'show_counter_empty' => $this->_bShowCountersEmpty,
            'show_counter_label_icon' => $this->_bShowCountersIcons,
        );

        switch($this->_sMode) {
            case self::$_sModeActions:
                $sScoresMethod = 'getElementInline';
                break;

            case self::$_sModeCounters:
                $sScoresMethod = 'getCounter';
                break;
        }

        if($this->_bIsApi)
            return $this->_getMenuItemElementApi($aItem, $oScore->getElementApi(array_merge($aScoresParams, [
                'show_counter' => true,
            ])));

    	return $oScore->$sScoresMethod($aScoresParams);
    }

    protected function _getMenuItemItemReport($aItem)
    {
        $oReport = $this->_oCmts->getReportObject($this->_aCmt['cmt_unique_id']);
        if(!$oReport)
            return false;

        $aReportParams = [
            'dynamic_mode' => $this->_bDynamicMode,
            'show_do_report_label' => $this->_bShowTitles,
            'show_counter' => $this->_bShowCounters,
        ];

        if($this->_bIsApi)
            return $this->_getMenuItemElementApi($aItem, $oReport->getElementApi(array_merge($aReportParams, [
                'show_counter' => true,
            ])));

    	return $oReport->getElementInline($aReportParams);
    }

    protected function _getMenuItemElementApi($aItem, $aElement)
    {
        if(!$this->_bIsApi)
            return $aItem;

        return [
                'id' => $aItem['id'],
                'name' => $aItem['name'],
                'display_type' => 'element',
                'data' => $aElement
            ];
    }

    /**
     * Check if menu items is visible.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isVisible ($a)
    {
        if(!parent::_isVisible($a))
            return false;

        if((int)$this->_aCmt['cmt_pinned'] > 0 && !empty($this->_aBp['pinned']) && $a['name'] != 'item-unpin')
            return false;

        $sCheckFuncName = '';
        $aCheckFuncParams = array();
        switch ($a['name']) {
            case 'item-reply':
                $sCheckFuncName = 'isReplyAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-quote':
                $sCheckFuncName = 'isQuoteAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-vote':
                $sCheckFuncName = 'isVoteAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-score':
                $sCheckFuncName = 'isScoreAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-report':
                $sCheckFuncName = 'isReportAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-pin':
                $sCheckFuncName = 'isPinAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-unpin':
                $sCheckFuncName = 'isUnpinAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-edit':
                $sCheckFuncName = 'isEditAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-delete':
                $sCheckFuncName = 'isRemoveAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;

            case 'item-more':
                $sCheckFuncName = 'isMoreAllowed';
                if(!empty($this->_aCmt))
                    $aCheckFuncParams = array($this->_aCmt);
                break;
        }

        if(!$sCheckFuncName || !method_exists($this->_oCmts, $sCheckFuncName))
            return true;

        return call_user_func_array(array($this->_oCmts, $sCheckFuncName), $aCheckFuncParams);
    }
}

/** @} */
