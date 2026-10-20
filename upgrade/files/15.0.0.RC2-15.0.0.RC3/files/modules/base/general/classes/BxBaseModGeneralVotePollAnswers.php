<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

class BxBaseModGeneralVotePollAnswers extends BxTemplVoteLikes
{
    protected $_sModule;
    protected $_oModule;

    protected $_aObjectInfo;
    protected $_aPollInfo;

    protected $_bContentInfo;
    protected $_aContentInfo;

    protected $_bFormMode;
    protected $_bHiddenResults;
    protected $_bAnonymousVoting;

    protected $_sTmplNameElementBlock;

    // A poll vote follows the object's IsUndo setting, unlike a like.
    protected $_bUndoAlways = false;

    function __construct($sSystem, $iId, $iInit = 1)
    {
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sSystem, $iId, $iInit, $this->_oModule->_oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_aElementDefaults = array_merge($this->_aElementDefaults, array(
            'show_do_vote_label' => true,
            'show_counter' => false
        ));

        $this->_aObjectInfo = $this->_oModule->_oDb->getPollAnswers(array('type' => 'id', 'id' => $iId));
        $this->_aPollInfo = $this->_oModule->_oDb->getPolls(array('type' => 'answer_id', 'answer_id' => $iId));

        $this->_aContentInfo = [];
        if(!empty($this->_aPollInfo[$CNF['FIELD_POLL_CONTENT_ID']]))
            $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_aPollInfo[$CNF['FIELD_POLL_CONTENT_ID']]);
        $this->_bContentInfo = !empty($this->_aContentInfo) && is_array($this->_aContentInfo);

        $this->_bFormMode = false;
        $this->_bHiddenResults = $CNF['PARAM_POLL_HIDDEN_RESULTS'];
        $this->_bAnonymousVoting = $CNF['PARAM_POLL_ANONYMOUS_VOTING'];

        $this->_sTmplNameElementBlock = 'poll_answer_ve_block.html';
    }

    public function getJsClick($iValue = 0)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sJsObjectVote = $this->getJsObjectName();
        $sJsObjectPoll = $this->_bFormMode ? $this->_oModule->_oConfig->getJsObjectPoll($this->_bContentInfo ? (int)$this->_aPollInfo[$CNF['FIELD_POLL_CONTENT_ID']] : 0) : $this->_oModule->_oConfig->getJsObject('poll');

        return $sJsObjectVote . '.vote(this, ' . $this->getValue() . ', function(oLink, oData) {' . $sJsObjectPoll . '.onPollAnswerVote(oLink, oData, ' . $this->_aPollInfo[$CNF['FIELD_POLL_ID']] . ');})';
    }
    
    public function getElement($aParams = [])
    {
        $this->_bFormMode = isset($aParams['form_mode']) ? $aParams['form_mode'] : false;

        return parent::getElement($aParams);
    }

    public function getCounter($aParams = [])
    {
        $this->_bFormMode = isset($aParams['form_mode']) ? $aParams['form_mode'] : false;

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        if($this->_bHiddenResults && !$this->isPerformed($iObjectId, $iAuthorId))
            return '';

        $sResult = parent::getCounter($aParams);
        if(!isset($aParams['show_counter_in_brackets']) || $aParams['show_counter_in_brackets'] == true)
            $sResult = '(' . $sResult . ')';

        return $sResult;
    }

    public function getObjectAuthorId($iObjectId = 0)
    {
    	if(empty($this->_aSystem['trigger_field_author']))
            return 0;

        $aPoll = $this->_oModule->_oDb->getPolls(array('type' => 'answer_id', 'answer_id' => $iObjectId ? $iObjectId : $this->getId()));
        if(empty($aPoll) || !is_array($aPoll))
            return 0;

        return $aPoll[$this->_aSystem['trigger_field_author']];
    }

    public function isPerformed($iObjectId, $iAuthorId, $iAuthorIp = 0)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return $this->_oModule->isPollPerformed((int)$this->_aPollInfo[$CNF['FIELD_POLL_ID']], $iAuthorId, $iAuthorIp);
    }

    /**
     * Permissions functions
     */
    public function isAllowedVote($isPerformAction = false)
    {
        if($this->_bContentInfo && $this->_oModule->checkAllowedView($this->_aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return parent::isAllowedVote($isPerformAction);
    }

    public function isAllowedVoteViewVoters($isPerformAction = false)
    {
        if($this->_bAnonymousVoting)
           return false;

        return parent::isAllowedVoteViewVoters($isPerformAction);
    }

    /**
     * Internal functions
     */
    protected function _isAllowedVoteByObject($aObject)
    {
        /**
         * If a poll wasn't attached to any content yet, 
         * then we cannot check content's visibility.
         */
        if(!$this->_bContentInfo)
            return true;

        return parent::_isAllowedVoteByObject($this->_aContentInfo);
    }

    protected function _getIconDo($bVoted)
    {
    	return $bVoted ?  'far dot-circle' : 'far circle';
    }

    protected function _getTitleDo($bVoted)
    {
    	return bx_process_output($this->_aObjectInfo['title']);
    }

    protected function _getTitleDoBy($aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

    	return _t($CNF['T']['txt_poll_answer_vote_do_by']);
    }

    protected function _getCounterLabel($iCount, $aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return _t($CNF['T']['txt_poll_answer_vote_counter'], $iCount);
    }

    protected function _isShowDoVote($aParams, $isAllowedVote, $bCount)
    {
        return !isset($aParams['show_do_vote']) || $aParams['show_do_vote'] == true;
    }

    protected function _getTmplContentElementBlock()
    {
        return $this->_oTemplate->getHtml($this->_sTmplNameElementBlock);
    }
}

/** @} */
