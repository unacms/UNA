<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Messenger Messenger
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * For API only.
 */
class BxMessengerJotVoteReactions extends BxTemplVoteReactions
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($sSystem, $iId, $iInit = 1)
    {
        parent::__construct($sSystem, $iId, $iInit);

        $this->_sModule = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
    }

    protected function _isAllowedVoteByObject($aObject)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aLot = $this->_oModule->_oDb->getLotInfoById($aObject[$CNF['FIELD_MESSAGE_FK']]);
        if(empty($aLot) || !is_array($aLot))
            return false;

        return bx_srv($this->_aSystem['module'], 'check_allowed_view_for_profile', [$aLot]) === CHECK_ACTION_RESULT_ALLOWED;
    }
}

/** @} */
