<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for Relation objects.
 * @see BxDolConnection
 */
class BxDolConnectionRelationQuery extends BxDolConnectionQuery
{
    public function __construct($aObject)
    {
        parent::__construct($aObject);
    }

    public function addConnection ($iInitiator, $iContent, &$iMutualParam = null)
    {
        if ($this->getConnection($iInitiator, $iContent)) // connection already exists
            return false;

        $iMutual = 0;
        if(!$this->query("INSERT INTO `" . $this->_sTable . "` SET `initiator` = :initiator, `content` = :content, `added` = :added, `mutual` = :mutual", array(
            'initiator' => $iInitiator, 
            'content' => $iContent, 
            'mutual' => $iMutual, 
            'added' => time()
        ))) return false;

        $iId = $this->lastId();

        if($iMutualParam !== null)
            $iMutualParam = $iMutual;

        $this->cleanMemory('BxDolConnectionQuery::getConnection' . $this->_sTable . $iInitiator . '_' . $iContent);
        return $iId;
    }

    public function removeConnection ($iInitiator, $iContent)
    {
        $sQuery = $this->prepare("DELETE FROM `" . $this->_sTable . "` WHERE `initiator` = ? AND `content` = ?", $iInitiator, $iContent);
        if(!$this->res($sQuery))
            return false;

        $this->cleanMemory('BxDolConnectionQuery::getConnection' . $this->_sTable . $iInitiator . '_' . $iContent);
        return true;
    }
    
    public function getCommonContentExt($iInitiator1, $iInitiator2, $isMutual, $iStart, $iLimit, $iOrder)
    {
        $sFields = "`c`.`content` AS `content`, `c`.`initiator` AS `initiator1`, `c`.`relation` AS `relation1`, `c`.`mutual` AS `mutual1`, `c2`.`initiator` AS `initiator2`, `c2`.`relation` AS `relation2`, `c2`.`mutual` AS `mutual2`";

        $sWhereJoin = (false !== $isMutual) ? " AND `c2`.`mutual` = :mutual" : "";
        $sJoin = "INNER JOIN `" . $this->_sTable . "` AS `c2` ON (`c2`.`initiator` = :initiator2 AND `c`.`content` = `c2`.`content` $sWhereJoin)";

        $sWhere = " AND `c`.`initiator` = :initiator1";
        $sQuery = $this->_getConnectionsQuery($sWhere, $sJoin, $sFields, $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getAllWithKey($sQuery, 'content', array(
            'mutual' => $isMutual,
            'initiator1' => $iInitiator1,
            'initiator2' => $iInitiator2
    	));
    }

    public function getConnectedContentExt($iInitiator, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $sWhere = " AND `c`.`initiator` = :initiator";
        $sQuery = $this->_getConnectionsQuery($sWhere, '', '*', $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getAllWithKey($sQuery, 'content', array(
            'initiator' => $iInitiator
        ));
    }

    public function getConnectedInitiatorsExt($iContent, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $sWhere = " AND `c`.`content` = :content";
        $sQuery = $this->_getConnectionsQuery($sWhere, '', '*', $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getAllWithKey($sQuery, 'initiator', array(
            'content' => $iContent
        ));
    }
}

/** @} */
