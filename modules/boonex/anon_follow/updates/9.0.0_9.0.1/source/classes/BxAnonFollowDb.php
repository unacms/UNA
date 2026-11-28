<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AnonymousFollow Anonymous Follow
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAnonFollowDb extends BxBaseModGeneralDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }
    
    public function addFollower($iInitiator, $iContent)
    {
        $CNF = &$this->_oConfig->CNF;
        $aBindings = array(
            'initiator' => $iInitiator,
            'content' => $iContent,
            'added' => time()
        );
        $this->query("INSERT INTO `" . $CNF['TABLE_ENTRIES'] . "` (`" . $CNF['FIELD_INITIATOR'] . "`, `" . $CNF['FIELD_CONTENT'] . "`, `" . $CNF['FIELD_ADDED'] . "`) values (:initiator, :content, :added)", $aBindings);
    }
    
    public function removeFollower($iInitiator, $iContent)
    {
        $CNF = &$this->_oConfig->CNF;
        $aBindings = array(
            'initiator' => $iInitiator,
            'content' => $iContent
        );
        $this->query("DELETE FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_INITIATOR'] . "` = :initiator AND `" . $CNF['FIELD_CONTENT'] . "`= :content", $aBindings);
    }
}

/** @} */
