<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Polls Polls
 * @ingroup     UnaModules
 *
 * @{
 */

class BxPollsVoteSubentries extends BxTemplVoteLikes
{
    protected $_sModule;
    protected $_oModule;

    protected $_aObjectInfo;
    protected $_aContentInfo;

    protected $_sTmplNameElementBlock;

    // A poll vote follows the object's IsUndo setting, unlike a like.
    protected $_bUndoAlways = false;

    function __construct($sSystem, $iId, $iInit = 1)
    {
    	$this->_sModule = 'bx_polls';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sSystem, $iId, $iInit, $this->_oModule->_oTemplate);

        $CNF = $this->_oModule->_oConfig->CNF;

        $this->_aElementDefaults = array_merge($this->_aElementDefaults, array(
            'show_do_vote_label' => true,
            'show_counter' => false
        ));

        $this->_aObjectInfo = $this->_oModule->_oDb->getSubentries(array('type' => 'id', 'id' => $iId));
        $this->_aContentInfo = array();

        $this->_sTmplNameElementBlock = 'subentries_ve_block.html';
    }

    public function setEntry($aEntry)
    {
        $this->_aContentInfo = $aEntry;
    }

    public function getEntryField($sField)
    {
        if(empty($this->_aContentInfo))
            $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoBySubentryId($this->getId());

        return isset($this->_aContentInfo[$sField]) ? $this->_aContentInfo[$sField] : false;
    }

    public function getJsClick($iValue = 0)
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        $sJsObjectVote = $this->getJsObjectName();
        $sJsObjectEntry = $this->_oModule->_oConfig->getJsObject('entry');

        return $sJsObjectVote . '.vote(this, ' . $this->getValue() . ', function(oLink, oData) {' . $sJsObjectEntry . '.onVote(oLink, oData, ' . $this->getEntryField($CNF['FIELD_ID']) . ', \'' . $this->getEntryField('salt') . '\');})';
    }

    public function getCounter($aParams = array())
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        $bShowInBrackets = !isset($aParams['show_counter_in_brackets']) || $aParams['show_counter_in_brackets'] == true;

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        if((int)$this->getEntryField($CNF['FIELD_HIDDEN_RESULTS']) == 1)
            if(!$this->isPerformed($iObjectId, $iAuthorId))
                return '';

        $sResult = parent::getCounter($aParams);
        if($bShowInBrackets)
            $sResult = '(' . $sResult . ')';

        return $sResult;
    }

    public function getObjectAuthorId($iObjectId = 0)
    {
    	if(empty($this->_aSystem['trigger_field_author']))
    		return 0;

        $aContentInfo = $this->_oModule->_oDb->getContentInfoBySubentryId($iObjectId ? $iObjectId : $this->getId());
        return $aContentInfo[$this->_aSystem['trigger_field_author']];
    }

    public function isPerformed($iObjectId, $iAuthorId, $iAuthorIp = 0)
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        return $this->_oModule->isPerformed((int)$this->getEntryField($CNF['FIELD_ID']), $iAuthorId, $iAuthorIp);
    }

    /**
     * Permissions functions
     */
    public function isAllowedVote($isPerformAction = false)
    {
        return $this->_oModule->isAllowedVote($isPerformAction)  === CHECK_ACTION_RESULT_ALLOWED;
    }

    public function isAllowedVoteViewVoters($isPerformAction = false)
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        if((int)$this->getEntryField($CNF['FIELD_ANONYMOUS_VOTING']) == 1)
            return false;

        return parent::isAllowedVoteViewVoters($isPerformAction);
    }

    /**
     * Internal functions
     */
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
    	return _t('_bx_polls_txt_subentry_vote_do_by');
    }

    protected function _getCounterLabel($iCount, $aParams = array())
    {
        return _t('_bx_polls_txt_subentry_vote_counter', $iCount);
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
