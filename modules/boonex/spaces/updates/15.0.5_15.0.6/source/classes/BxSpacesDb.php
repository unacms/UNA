<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defdroup    Spaces Spaces
 * @indroup     UnaModules
 *
 * @{
 */

/**
 * Spaces module database queries
 */
class BxSpacesDb extends BxBaseModGroupsDb
{
    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }
    
    public function searchByTermForParentSpace($iProfileId, $iContentId, $iLevelsLimit, $sTerm, $iLimit)
    {
        $CNF = &$this->_oConfig->CNF;

        if (!$CNF['FIELDS_QUICK_SEARCH'])
            return array();

        $aBindings = array(
            'type' => $this->_oConfig->getName(),
            'status' => BX_PROFILE_STATUS_ACTIVE,
            'profile_id' => $iProfileId,
            'content_id' => $iContentId
        );

        $sWhereClause = "";

        //--- Add levels limit
        if($iLevelsLimit > 0) {
            $aBindings['levels_limit'] = $iLevelsLimit;

            $sWhereClause .= "AND `c`.`" . $CNF['FIELD_LEVEL'] . "` < :levels_limit ";
        }

        //--- Add search by term
        $sWhereClauseTerm = "";
        foreach ($CNF['FIELDS_QUICK_SEARCH'] as $sField) {
            $aBindings[$sField] = '%' . $sTerm . '%';

            $sWhereClauseTerm .= " OR `c`.`$sField` LIKE :" . $sField;
        }
        $sWhereClause .= "AND (0 " . $sWhereClauseTerm . ") ";

        $sOrderByClause = $this->prepareAsString("ORDER BY `added` DESC LIMIT ?", (int)$iLimit);

        $sQuery = "SELECT `c`.`id` AS `content_id`, `p`.`account_id`, `p`.`id` AS `profile_id`, `p`.`status` AS `profile_status` FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `c` INNER JOIN `sys_profiles` AS `p` ON (`p`.`content_id` = `c`.`id` AND `p`.`type` = :type) WHERE `p`.`status` = :status AND (`c`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` = 3 OR `c`.`" . $CNF['FIELD_AUTHOR'] . "` = :profile_id) AND `c`.`" . $CNF['FIELD_ID'] . "` <> :content_id " . $sWhereClause . $sOrderByClause;
        return $this->getAll($sQuery, $aBindings);
    }
    
    public function getCountEntriesByParent ($iParent)
    {
        $aBindings = array(
            'content_id' => $iParent,
            'type' => $this->_oConfig->getName()
        );
        $sQuery = "SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` WHERE `" . $this->_oConfig->CNF['FIELD_PARENT'] . "` IN (SELECT `id` FROM `sys_profiles` WHERE `content_id` = :content_id  AND `type` = :type)";
        return $this->getOne($sQuery, $aBindings);
    }

    public function getLevelById ($iContentId)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getOne("SELECT `" . $CNF['FIELD_LEVEL'] . "` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_ID'] . "` = :content_id", array(
            'content_id' => $iContentId
        ));
    }

    public function getChildEntriesIdByProfileId ($iParentPid)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getColumn("SELECT `id` FROM `sys_profiles` WHERE `content_id` IN (SELECT `" . $CNF['FIELD_ID'] . "` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_PARENT'] . "` = :parent_pid AND `" . $CNF['FIELD_STATUS'] . "` = 'active' AND `" . $CNF['FIELD_STATUS_ADMIN'] . "` = 'active') AND `type` = :type AND `status`='active'", [
            'parent_pid' => $iParentPid,
            'type' => $this->_oConfig->getName()
        ]);
    }

    /**
     * API v2: how many rows of a search result's query are in each parent space, in one
     * query: the result's main table, its joins and its WHERE (BxDolSearchResult::getJoins(false)
     * and getRestriction(), the module's own conditions and privacy), grouped by the parent.
     * @return array parent space's profile id => count
     */
    public function getApiV2ChildCounts($sTable, $sJoin, $sWhere)
    {
        $CNF = &$this->_oConfig->CNF;
        $sEntries = '`' . $CNF['TABLE_ENTRIES'] . '`';
        $sParent = $sEntries . '.`' . $CNF['FIELD_PARENT'] . '`';
        $sQuery = "SELECT " . $sParent . " AS `parent`, COUNT(DISTINCT " . $sEntries . ".`" . $CNF['FIELD_ID'] . "`) AS `num` FROM `" . $sTable . "` " . $sJoin . " " . $sWhere . " GROUP BY " . $sParent;
        return $this->getPairs($sQuery, 'parent', 'num');
    }
}

/** @} */
