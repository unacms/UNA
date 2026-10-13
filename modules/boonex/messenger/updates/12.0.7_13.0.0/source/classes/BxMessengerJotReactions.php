<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Market Market
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMessengerJotReactions extends BxTemplVoteReactions
{
    protected $_sModule;
    protected $_oModule;

    function __construct($sSystem, $iId, $iInit = 1)
    {
        $this->_sModule = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sSystem, $iId, $iInit);
        $this->_oQuery = &$this->_oModule->_oDb;
    }

    public function isAllowedVote($isPerformAction = false)
    {
        return true;
    }

    protected function _serviceDoReactions($aParams, &$oVote)
    {
        $aResult = $oVote->vote($aParams);
        if((int)$aResult['code'] != 0)
            return $aResult;

        $sDefault = $oVote->getDefault();
        $aDefault = $oVote->getReaction($sDefault);
        $aDefaultInfo = $oVote->getReaction($aDefault['name']);

        return [
            'is_voted' => $aResult['voted'],
            'is_disabled' => $aResult['disabled'],
            'reaction' => $aResult['voted'] ? $aResult['reaction'] : $sDefault,
            'icon' => !empty($aResult['label_emoji']) ? $aResult['label_emoji'] : $aDefaultInfo['emoji'],
            'title' => !empty($aResult['label_title']) ? $aResult['label_title'] : '',
            'counter' => $oVote->getVote()
        ];
    }

    public function vote($aVoteData = [], $aRequestParamsData = [])
    {
        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        $iAuthorIp = $this->_getAuthorIp();

        $bUndo = $this->isUndo();
        $bVoted = $this->_oQuery->isPerformed($iObjectId, $iAuthorId, $aVoteData['reaction']);
        $bPerformUndo = $bVoted && $bUndo;

        if(!$bPerformUndo && !$this->isAllowedVote())
            return ['code' => BX_DOL_OBJECT_ERR_ACCESS_DENIED, 'message' => $this->msgErrAllowedVote()];

        $iId = $this->_putVoteData($iObjectId, $iAuthorId, $iAuthorIp, $aVoteData, $bPerformUndo);
        if($iId === false)
            return ['code' => BX_DOL_OBJECT_ERR_CANNOT_PERFORM];

        if(!$bPerformUndo)
            $this->isAllowedVote(true);

        return $this->_returnVoteData($iObjectId, $iAuthorId, $iAuthorIp, $aVoteData, !$bVoted, $aRequestParamsData);
    }

}

/** @} */
