<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxResourcesDb extends BxBaseModTextDb
{
    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    public function addList ($iContextId, $sTitle, $bDefault = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->query("INSERT INTO `" . $CNF['TABLE_LISTS'] . "` (`context_id`, `title`, `default`) VALUES (:context_id, :title, :default)", [
            'context_id' => $iContextId,
            'title' => $sTitle,
            'default' => $bDefault
        ]) ? $this->lastId() : false;
    }

    public function addListDefault ($iContextId)
    {
        return $this->addList ($iContextId, '', 1);
    }

    public function getLists ($iContextId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getAll("SELECT * FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `context_id` = :context_id", [
            'context_id' => $iContextId
        ]);
    }

    public function getListDefault ($iContextId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getRow("SELECT * FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `context_id` = :context_id AND `default`='1'", [
            'context_id' => $iContextId
        ]);
    }

    public function getList ($iId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getRow("SELECT * FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `id` = :id", [
            'id' => $iId
        ]);
    }

    public function deleteList ($iId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $this->query("DELETE FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `id` = :id", [
            'id' => $iId
        ]);

        $this->query("DELETE FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_LIST'] . "` = :list", [
            'list' => $iId
        ]);
    }

    public function getResources ($iContextId = 0, $iListId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $aBindings = [];
        $sSelectClause = "`te`.*";
        $sJoinClause = $sWhereClause = "";

        if(($sField = $CNF['FIELD_ALLOW_VIEW_TO']) && $iContextId) {
            $aBindings[$sField] = $iContextId;
            $sWhereClause .= " AND ABS(`te`.`" . $sField . "`) = :" . $sField;
        }

        if(($sField = $CNF['FIELD_LIST']) && $iListId) {
            $aBindings[$sField] = $iListId;
            $sWhereClause .= " AND `te`.`" . $sField . "` = :" . $sField;
        }

        if(($oCf = BxDolContentFilter::getInstance()) && $oCf->isEnabled())
            $sWhereClause .= $oCf->getSQLParts('te', $CNF['FIELD_CF']);

        return $this->getAll("SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te`" . $sJoinClause . " WHERE 1" . $sWhereClause, $aBindings);
    }
}

/** @} */
