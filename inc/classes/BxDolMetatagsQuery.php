<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for metatags objects.
 * @see BxDolMetatag
 */
class BxDolMetatagsQuery extends BxDolDb
{
    protected $_aObject;

    public function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
    }

    static public function getMetatagsObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_metatags` WHERE `object` = ?", $sObject);
        $aObject = $oDb->getRow($sQuery);
        if (!$aObject || !is_array($aObject))
            return false;

        return $aObject;
    }
    
    static public function getMetatagsObjects ()
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_metatags`");
        $aObject = $oDb->getAll($sQuery);
        if (!$aObject || !is_array($aObject))
            return false;

        return $aObject;
    }

    public function mentionsAdd($mixedContentId, $aMentions, $bDeletePrevious = true)
    {
        return $this->metaAdd($mixedContentId, $aMentions, $bDeletePrevious, 'mentionsDelete', $this->_aObject['table_mentions'], 'profile_id');
    }

    public function mentionsDelete($mixedContentId)
    {
        return $this->metaDelete($this->_aObject['table_mentions'], $mixedContentId);
    }

    public function mentionsGet($mixedContentId)
    {
        $sQuery = $this->prepare("SELECT `profile_id` FROM `{$this->_aObject['table_mentions']}` WHERE `object_id` = ? ORDER BY `profile_id` DESC LIMIT ?", $mixedContentId, (int)getParam('sys_metatags_mentions_max'));
        return $this->getColumn($sQuery);
    }
    
    public function keywordsAdd($mixedContentId, $aKeywords, $bDeletePreviousKeywords = true)
    {
        return $this->metaAdd($mixedContentId, $aKeywords, $bDeletePreviousKeywords, 'keywordsDelete', $this->_aObject['table_keywords'], 'keyword');
    }

    public function keywordsDelete($mixedContentId)
    {
        $mixedResult = $this->metaDelete($this->_aObject['table_keywords'], $mixedContentId);
        if ($mixedResult != false){
             /**
             * @hooks
             * @hookdef hook-meta_keyword-deleted 'meta_keyword', 'deleted' - hook on delete meta keyword
             * - $unit_name - equals `meta_keyword`
             * - $action - equals `deleted` 
             * - $object_id - content_id
             * - $sender_id - profile_id fror logged user
             * - $extra_params - array of additional params with the following array keys:
             *      - `object` - [string] object name
             * @hook @ref hook-meta_keyword-deleted
             */
            bx_alert('meta_keyword', 'deleted', $mixedContentId, bx_get_logged_profile_id(), array('object' => $this->_aObject['object']));
        }
        return $mixedResult;
    }

    public function keywordsGet($mixedContentId)
    {
        $sQuery = $this->prepare("SELECT `keyword` FROM `{$this->_aObject['table_keywords']}` WHERE `object_id` = ? ORDER BY CHAR_LENGTH(`keyword`) DESC LIMIT ?", $mixedContentId, (int)getParam('sys_metatags_hashtags_max'));
        return $this->getColumn($sQuery);
    }
    
    /**
     * Get keywords which start with the term. Only keywords of public and active content are returned,
     * so the result doesn't depend on the viewer and can't reveal hashtags of private, hidden,
     * awaiting or draft content. Keywords whose content can't be resolved are skipped.
     */
    public function keywordsGetByTerm($sTerm)
    {
        $aParts = $this->getPublicContentSQLParts('kw', 'object_id');
        if(!$aParts)
            return [];

        $sQuery = $this->prepare("SELECT `kw`.`object_id`, `kw`.`keyword` FROM `{$this->_aObject['table_keywords']}` AS `kw` " . $aParts['join'] . " WHERE `kw`.`keyword` LIKE ?" . $aParts['where'] . " ORDER BY CHAR_LENGTH(`kw`.`keyword`) DESC", $sTerm . '%');
        return $this->getAll($sQuery);
    }

    /**
     * Get SQL parts to limit meta records by public and active content only.
     * Table and field names are taken from the module config, never from the request.
     *
     * @param string $sMetaAlias alias of the meta table in the query
     * @param string $sMetaField field of the meta table with content id
     * @return array|false array with 'join' and 'where' parts or false if content can't be resolved
     */
    protected function getPublicContentSQLParts($sMetaAlias, $sMetaField)
    {
        if(empty($this->_aObject['module']))
            return false;

        $oModule = BxDolModule::getInstance($this->_aObject['module']);
        if(!$oModule || empty($oModule->_oConfig->CNF) || !is_array($oModule->_oConfig->CNF))
            return false;

        $CNF = $oModule->_oConfig->CNF;
        if(empty($CNF['TABLE_ENTRIES']) || empty($CNF['FIELD_ID']))
            return false;

        $sPrivacyField = '';
        if(!empty($CNF['FIELD_ALLOW_VIEW_TO']))
            $sPrivacyField = $CNF['FIELD_ALLOW_VIEW_TO'];
        else if(!empty($CNF['FIELD_OBJECT_PRIVACY_VIEW']))
            $sPrivacyField = $CNF['FIELD_OBJECT_PRIVACY_VIEW'];
        if(!$sPrivacyField)
            return false;

        $sJoin = '';
        $sContentLink = "`{$sMetaAlias}`.`{$sMetaField}`";

        // meta of files attached to entries, content is the entry which the file belongs to
        $aMediaObjects = array_filter([
            isset($CNF['OBJECT_METATAGS_MEDIA']) ? $CNF['OBJECT_METATAGS_MEDIA'] : '',
            isset($CNF['OBJECT_METATAGS_MEDIA_CAMERA']) ? $CNF['OBJECT_METATAGS_MEDIA_CAMERA'] : '',
        ]);
        if(!empty($CNF['TABLE_FILES2ENTRIES']) && in_array($this->_aObject['object'], $aMediaObjects)) {
            $sJoin .= " INNER JOIN `{$CNF['TABLE_FILES2ENTRIES']}` AS `cf` ON `cf`.`id` = {$sContentLink}";
            $sContentLink = '`cf`.`content_id`';
        }

        $sJoin .= " INNER JOIN `{$CNF['TABLE_ENTRIES']}` AS `ce` ON `ce`.`{$CNF['FIELD_ID']}` = {$sContentLink}";

        $sWhere = $this->prepareAsString(" AND `ce`.`{$sPrivacyField}` = ?", BX_DOL_PG_ALL);

        if(!empty($CNF['FIELD_STATUS']))
            $sWhere .= " AND `ce`.`{$CNF['FIELD_STATUS']}` = 'active'";
        else {
            // profile modules keep status in the profiles table
            $sJoin .= $this->prepareAsString(" INNER JOIN `sys_profiles` AS `cp` ON `cp`.`type` = ? AND `cp`.`content_id` = `ce`.`{$CNF['FIELD_ID']}` AND `cp`.`status` = 'active'", $this->_aObject['module']);
        }

        if(!empty($CNF['FIELD_STATUS_ADMIN']))
            $sWhere .= " AND `ce`.`{$CNF['FIELD_STATUS_ADMIN']}` = 'active'";

        return ['join' => $sJoin, 'where' => $sWhere];
    }

    public function keywordsGetSQLParts($sContentTable, $sContentField, $mixedKeyword)
    {
        if(!is_array($mixedKeyword))
            $mixedKeyword = array($mixedKeyword);

        return array(
            'where' => !empty($mixedKeyword) ? ' AND `tt`.`keyword` IN (' . $this->implode_escape($mixedKeyword) . ')' : '',
            'join' => 'INNER JOIN `' . $this->_aObject['table_keywords'] . '` AS `tt` ON `' . $sContentTable . '`.`' . $sContentField . '`=`tt`.`object_id`'
        );
    }

    public function keywordsPopularList($iLimit, $mContextId = false)
    {   
        if ($mContextId){
            $oModule = BxDolModule::getInstance($this->_aObject['module']);
            $CNF = $oModule->_oConfig->CNF;
            if (isset($CNF['TABLE_ENTRIES']) && isset($CNF['FIELD_ID']) && isset($CNF['FIELD_ALLOW_VIEW_TO'])){
                $sQuery = $this->prepare("SELECT `keyword`, COUNT(*) as `count` FROM `{$this->_aObject['table_keywords']}` INNER JOIN `{$CNF['TABLE_ENTRIES']}` ON `{$this->_aObject['table_keywords']}`.`object_id` = `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_ID']}` AND `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_ALLOW_VIEW_TO']}` = ? GROUP BY `keyword` ORDER BY `count` DESC LIMIT ?", -$mContextId,  $iLimit);
                return $this->getPairs($sQuery, 'keyword', 'count');
            }
            else
                return [];
        }
        else{
            $sQuery = $this->prepare("SELECT `keyword`, COUNT(*) as `count` FROM `{$this->_aObject['table_keywords']}` GROUP BY `keyword` ORDER BY `count` DESC LIMIT ?", $iLimit);
            return $this->getPairs($sQuery, 'keyword', 'count');
        }
    }    

    public function locationsAdd($mixedContentId, $fLat, $fLng, $sCountryCode, $sState, $sCity, $sZip, $sStreet, $sStreetNumber)
    {
        $this->locationsDelete($mixedContentId);
        if (!$fLat && !$fLng) // locations without latitude and longitude aren't allowed
            return true;

        $sQuery = $this->prepare("INSERT INTO `{$this->_aObject['table_locations']}` SET `object_id` = ?, `lat` = ?, `lng` = ?, `country` = ?, `state` = ?, `city` = ?, `zip` = ?, `street` = ?, `street_number` = ?", $mixedContentId, $fLat, $fLng, $sCountryCode, $sState, $sCity, $sZip, $sStreet, $sStreetNumber);
        return $this->query($sQuery);
    }
    
    public function locationsDelete($mixedContentId)
    {
        return $this->metaDelete($this->_aObject['table_locations'], $mixedContentId);
    }

    public function locationGet($mixedContentId)
    {
        $sQuery = $this->prepare("SELECT * FROM `{$this->_aObject['table_locations']}` WHERE `object_id` = ?", $mixedContentId);
        return $this->getRow($sQuery);
    }

    public function locationsGetSQLParts($sContentTable, $sContentField, $sCountry = false, $sState = false, $sCity = false, $sZip = false, $aBounds = array())
    {
        $aFields = array('country' => 'sCountry', 'state' => 'sState', 'city' => 'sCity', 'zip' => 'sZip', 'bounds' => 'aBounds');

        $aWhere = array();
        $sWhereBounds = '';
        foreach ($aFields as $sIndex => $sVar) {
            if (!$$sVar)
                continue;

            if ('bounds' == $sIndex) {
                $sWhereBounds = $this->prepareAsString(" AND `tl`.`lat` != 0 AND `tl`.`lng` != 0 AND `tl`.`lat` > ? AND `tl`.`lat` < ? AND `tl`.`lng` > ? AND `tl`.`lng` < ?", ${$sVar}['min_lat'], ${$sVar}['max_lat'], ${$sVar}['min_lng'], ${$sVar}['max_lng']);
            } 
            else {
                $aWhere['tl`.`' . $sIndex] = $$sVar;
            }
        }

        return array(
            'where' => $sWhereBounds . (!empty($aWhere) ? ' AND ' . $this->arrayToSQL($aWhere, ' AND ', 'LIKE', true) : ''),
            'join' => 'INNER JOIN `' . $this->_aObject['table_locations'] . '` AS `tl` ON `' . $sContentTable . '`.`' . $sContentField . '`=`tl`.`object_id`'
        );
    }

    protected function metaDelete($sTable, $mixedContentId)
    {
        $sQuery = $this->prepare("DELETE FROM `{$sTable}` WHERE `object_id` = ?", $mixedContentId);
        return $this->query($sQuery);
    }

    protected function metaAdd($mixedContentId, $aMetas, $bDeletePrevious, $sFuncDelete, $sTable, $sField)
    {
        if ($bDeletePrevious)
            $this->$sFuncDelete($mixedContentId);

        $i = 0;
        foreach ($aMetas as $sMeta) {
            $sQuery = $this->prepare("INSERT INTO `{$sTable}` SET `object_id` = ?, `{$sField}` = ?", $mixedContentId, $sMeta);
            $i += ($this->query($sQuery) ? 1 : 0);
        }
        return $i;
    }
}

/** @} */
