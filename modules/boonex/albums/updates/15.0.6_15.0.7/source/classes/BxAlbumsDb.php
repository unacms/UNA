<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Albums Albums
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxAlbumsDb extends BxBaseModTextDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    public function associateFileWithContent($iContentId, $iFileId, $iProfileId, $sTitle, $sData = '', $sExif = '')
    {
        $sQuery = $this->prepare ("SELECT MAX(`order`) FROM `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` WHERE `content_id` = ?", $iContentId);
        $iOrder = 1 + (int)$this->getOne($sQuery);

        $sQuery = $this->prepare ("INSERT INTO `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` SET `content_id` = ?, `file_id` = ?, `author` = ?, `title` = ?, `data` = ?, `exif` = ?, `order` = ? ON DUPLICATE KEY UPDATE `title` = ?, `data` = ?, `exif` = ?", $iContentId, $iFileId, $iProfileId, $sTitle, $sData, $sExif, $iOrder, $sTitle, $sData, $sExif);
        return $this->res($sQuery);
    }

    public function deassociateFileWithContent($iContentId, $iFileId)
    {
    	$aBindings = array();

        $sWhere = '';
        if ($iContentId) {
        	$aBindings['content_id'] = $iContentId;

            $sWhere .= " AND `content_id` = :content_id";
        }

        if ($iFileId) {
        	$aBindings['file_id'] = $iFileId;

            $sWhere .= " AND `file_id` = :file_id";
        }

        $sQuery = "DELETE FROM `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` WHERE 1 " . $sWhere;
        return $this->query($sQuery, $aBindings);
    }

    public function getFileTitle($iFileId)
    {
        $sQuery = $this->prepare ("SELECT `title` FROM `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` WHERE `file_id` = ?", $iFileId);
        return $this->getOne($sQuery);
    }

    public function getMediaInfoById($iMediaId)
    {
        $CNF = &$this->_oConfig->CNF;

        $sSelectClause = "`f2e`.*, `f`.`added`";
        $sJoinClause = "INNER JOIN `" . $CNF['TABLE_FILES'] . "` AS `f` ON (`f`.`id` = `f2e`.`file_id`) INNER JOIN `" . $CNF['TABLE_ENTRIES'] . "` AS `e` ON (`e`.`id` = `f2e`.`content_id`)";

        if($CNF['PARAM_ORDER_BY_GHOSTS']) {
            $sSelectClause .= ", `g`.`order` as `gorder`";
            $sJoinClause .= $this->prepareAsString("INNER JOIN `sys_storage_ghosts` AS `g` ON `g`.`id`=`f2e`.`file_id` AND `g`.`content_id`=`f2e`.`content_id` AND `g`.`object`=?", $CNF['OBJECT_STORAGE']);
        }

        $sQuery = $this->prepare("SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_FILES2ENTRIES'] . "` AS `f2e` " . $sJoinClause . " WHERE `f2e`.`id` = ?", $iMediaId);
        return $this->getRow($sQuery);
    }

    public function getMediaInfoSimpleByFileId($iFileId)
    {
        $sQuery = $this->prepare ("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` WHERE `file_id` = ?", $iFileId);
        return $this->getRow($sQuery);
    }

    public function getMediaCountByContentId($iContentId)
    {
        $sQuery = $this->prepare ("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` WHERE `content_id` = ? LIMIT 1", $iContentId);
        return $this->getOne($sQuery);
    }

    public function getMediaListByContentId($iContentId, $iLimit = false)
    {
        $sLimitQuery = '';
        $aBindings = array('id' => $iContentId);
        if ((int)$iLimit) {
            $sLimitQuery = ' LIMIT :limit';
            $aBindings = array_merge($aBindings, array('limit' => (int)$iLimit));
        }
            
        $sQuery = "SELECT * FROM `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` WHERE `content_id` = :id ORDER BY `order`" . $sLimitQuery;
        return $this->getAll($sQuery, $aBindings);
    }

    function getMediaBy($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query', 1 => array()));
        $sSelectClause = $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        $sSelectClause = "`{$CNF['TABLE_FILES2ENTRIES']}`.*";

        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1]['id'] = (int)$aParams['id'];

                $sWhereClause .= " AND `{$CNF['TABLE_FILES2ENTRIES']}`.`id` = :id";
                break;

            case 'search_ids':
                $aMethod['name'] = 'getColumn';
                
                $sSelectClause = "`{$CNF['TABLE_FILES2ENTRIES']}`.`id`";

                if (!empty($aParams['start']) && !empty($aParams['per_page']))
                    $sLimitClause = $this->prepareAsString("?, ?", $aParams['start'], $aParams['per_page']);
                elseif (!empty($aParams['per_page']))
                    $sLimitClause = $this->prepareAsString("?", $aParams['per_page']);

                BxDolSearchExtended::processParams($aParams['search_params'], [
                    'table' => $CNF['TABLE_FILES2ENTRIES'],
                    'bindings' => &$aMethod['params'][1],
                    'where_clause' => &$sWhereClause,
                    'bindings_ref' => &$aMethod['params'][1],
                    'where_clause_ref' => &$sWhereClause
                ]);

                $sOrderClause .=  "`{$CNF['TABLE_FILES2ENTRIES']}`.`id` ASC";
                break;

            case 'all_ids':
                $aMethod['name'] = 'getColumn';

                $sSelectClause = "`{$CNF['TABLE_FILES2ENTRIES']}`.`id`";
                $sOrderClause .=  "`{$CNF['TABLE_FILES2ENTRIES']}`.`id` ASC";
                break;

            case 'all':
                $sOrderClause .=  "`{$CNF['TABLE_FILES2ENTRIES']}`.`id` ASC";
                break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = 'ORDER BY ' . $sOrderClause;

        if(!empty($sLimitClause))
            $sLimitClause = 'LIMIT ' . $sLimitClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `{$CNF['TABLE_FILES2ENTRIES']}` " . $sJoinClause . " WHERE 1 " . $sWhereClause . " " . $sOrderClause . " " . $sLimitClause;
		return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }
    
    /**
     * The ORDER BY of an album's media as its page shows them: by their ghosts' order (when the
     * module orders so) or their own, the id breaking ties; with the JOIN that order needs.
     * @return array [join clause, order clause]
     */
    protected function _mediaOrder()
    {
        $CNF = &$this->_oConfig->CNF;
        if (empty($CNF['PARAM_ORDER_BY_GHOSTS']))
            return ['', "`f2e`.`order` ASC, `f2e`.`id` ASC"];
        return [$this->prepareAsString("INNER JOIN `sys_storage_ghosts` AS `g` ON `g`.`id` = `f2e`.`file_id` AND `g`.`content_id` = `f2e`.`content_id` AND `g`.`object` = ?", $CNF['OBJECT_STORAGE']), "`g`.`order` ASC, `f2e`.`id` ASC"];
    }

    /**
     * A page of an album's media in its order (API v2): rows of files2albums with the file's
     * `added`.
     */
    public function getMediaPage($iContentId, $iStart, $iLimit)
    {
        $CNF = &$this->_oConfig->CNF;
        list($sJoin, $sOrder) = $this->_mediaOrder();
        $sQuery = "SELECT `f2e`.*, `f`.`added` FROM `" . $CNF['TABLE_FILES2ENTRIES'] . "` AS `f2e` INNER JOIN `" . $CNF['TABLE_FILES'] . "` AS `f` ON (`f`.`id` = `f2e`.`file_id`) " . $sJoin . " WHERE `f2e`.`content_id` = :content_id ORDER BY " . $sOrder . " LIMIT :start, :limit";
        return $this->getAll($sQuery, ['content_id' => (int)$iContentId, 'start' => (int)$iStart, 'limit' => (int)$iLimit]);
    }

    /**
     * The first $iPer media of each of these albums, in their order (API v2: a list's previews),
     * in one query: album id => rows.
     */
    public function getMediaPreviews($aContentIds, $iPer)
    {
        $CNF = &$this->_oConfig->CNF;
        $aContentIds = array_values(array_unique(array_filter(array_map('intval', (array)$aContentIds))));
        if (!$aContentIds || (int)$iPer <= 0)
            return [];

        list($sJoin, $sOrder) = $this->_mediaOrder();
        $aParts = [];
        foreach ($aContentIds as $iContentId)
            $aParts[] = "(SELECT `f2e`.*, `f`.`added` FROM `" . $CNF['TABLE_FILES2ENTRIES'] . "` AS `f2e` INNER JOIN `" . $CNF['TABLE_FILES'] . "` AS `f` ON (`f`.`id` = `f2e`.`file_id`) " . $sJoin . $this->prepareAsString(" WHERE `f2e`.`content_id` = ? ORDER BY " . $sOrder . " LIMIT ?)", $iContentId, (int)$iPer);

        $aResult = array_fill_keys($aContentIds, []);
        foreach ($this->getAll(implode(' UNION ALL ', $aParts)) as $aRow)
            $aResult[(int)$aRow['content_id']][] = $aRow;
        return $aResult;
    }

    /**
     * How many media each of these albums has, in one query: album id => count.
     */
    public function getMediaCounts($aContentIds)
    {
        $aContentIds = array_values(array_unique(array_filter(array_map('intval', (array)$aContentIds))));
        if (!$aContentIds)
            return [];
        $aCounts = $this->getPairs("SELECT `content_id`, COUNT(*) AS `n` FROM `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` WHERE `content_id` IN (" . $this->implode_escape($aContentIds) . ") GROUP BY `content_id`", 'content_id', 'n');
        return array_map('intval', $aCounts + array_fill_keys($aContentIds, 0));
    }

    /**
     * The media of these files in an album, with the file's `added` (API v2: what an addition
     * added).
     */
    public function getMediaByFileIds($iContentId, $aFileIds)
    {
        $CNF = &$this->_oConfig->CNF;
        $aFileIds = array_values(array_filter(array_map('intval', (array)$aFileIds)));
        if (!$aFileIds)
            return [];
        $sQuery = $this->prepare("SELECT `f2e`.*, `f`.`added` FROM `" . $CNF['TABLE_FILES2ENTRIES'] . "` AS `f2e` INNER JOIN `" . $CNF['TABLE_FILES'] . "` AS `f` ON (`f`.`id` = `f2e`.`file_id`) WHERE `f2e`.`content_id` = ? AND `f2e`.`file_id` IN (" . $this->implode_escape($aFileIds) . ")", (int)$iContentId);
        return $this->getAll($sQuery);
    }

    /**
     * Puts these files of an album after its others in the order its page shows (their ghosts'
     * order), in this order (API v2: photos added to an album).
     */
    public function setGhostsOrderLast($iContentId, $aFileIds)
    {
        $CNF = &$this->_oConfig->CNF;
        $aFileIds = array_values(array_filter(array_map('intval', (array)$aFileIds)));
        if (!$aFileIds)
            return;

        $aBindings = ['object' => $CNF['OBJECT_STORAGE'], 'content_id' => (int)$iContentId];
        $sIn = $this->implode_escape($aFileIds);
        $iNext = 1 + (int)$this->getOne("SELECT MAX(`order`) FROM `sys_storage_ghosts` WHERE `object` = :object AND `content_id` = :content_id AND `id` NOT IN (" . $sIn . ")", $aBindings);
        $sCase = '';
        foreach ($aFileIds as $i => $iFileId)
            $sCase .= $this->prepareAsString(" WHEN ? THEN ?", $iFileId, $iNext + $i);
        $this->query("UPDATE `sys_storage_ghosts` SET `order` = CASE `id`" . $sCase . " END WHERE `object` = :object AND `content_id` = :content_id AND `id` IN (" . $sIn . ")", $aBindings);
    }

    public function updateMedia($aParamsSet, $aParamsWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        $sSql = "UPDATE `" . $CNF['TABLE_FILES'] . "` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND ");
        return $this->query($sSql);
    }
}

/** @} */
