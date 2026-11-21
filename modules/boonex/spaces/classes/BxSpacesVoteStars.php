<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Spaces Spaces
 * @ingroup     UnaModules
 *
 * @{
 */

class BxSpacesVoteStars extends BxTemplVoteStars
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($sSystem, $iId, $iInit = 1)
    {
    	$this->_sModule = 'bx_spaces';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sSystem, $iId, $iInit);        
    }

    public function isAllowedVote($isPerformAction = false)
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

    	if($this->getObjectAuthorId() == $this->_getAuthorId())
            return false;

        if($this->_oModule->_oConfig->isPaidJoin() && !$this->_oModule->isFan($this->_iId))
            return false;

    	return parent::isAllowedVote($isPerformAction);
    }

    protected function _getCounterLabel($iCount, $aParams = [])
    {
        return _tn('_bx_spaces_txt_vote_starts_counter', $iCount);
    }
}

/** @} */
