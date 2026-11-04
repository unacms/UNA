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

/*
 * Module database queries
 */
class BxMarketDb extends BxBaseModTextDb
{
	protected $_aRecurringDurations;

    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);

        $this->_aRecurringDurations = array(
        	'day' => 'INTERVAL 1 DAY',
        	'week' => 'INTERVAL 7 DAY',
        	'month' => 'INTERVAL 1 MONTH',
        	'year' => 'INTERVAL 1 YEAR',
        );
    }

    public function getProductsNames ($iVendor = 0, $iLimit = 1000)
    {
        $CNF = &$this->_oConfig->CNF;

        $sWhere = "AND `{$CNF['FIELD_STATUS']}` = :status AND `{$CNF['FIELD_STATUS_ADMIN']}` = :status_admin";
        $aBindings = array(
            'limit' => $iLimit,
            'status' => 'active',
            'status_admin' => 'active',
        );
        if ($iVendor) {
            $aBindings['author'] = $iVendor;
            $sWhere .= " AND `{$CNF['FIELD_AUTHOR']} = :author`";
        }

        return $this->getAll("SELECT * FROM `{$CNF['TABLE_ENTRIES']}` WHERE (`{$CNF['FIELD_PRICE_SINGLE']}` != '0' OR `{$CNF['FIELD_PRICE_RECURRING']}` != '0') $sWhere LIMIT :limit", $aBindings);
    }
    
    public function getContentInfoBy ($aParams)
    {
    	$CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
		$aOrderWay = array('up' => 'ASC', 'down' => 'DESC');

    	$sFieldsClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = '';

    	//--- Add file info.
    	$sFieldsClause .= " `te`.`" . $CNF['FIELD_PACKAGE'] . "` AS `file_id`, `tf`.`file_name` AS `file_name`, `tfe`.`version` AS `file_version`, ";
    	$sJoinClause .= " LEFT JOIN `" . $CNF['TABLE_FILES2ENTRIES'] . "` AS `tfe` ON `te`.`" . $CNF['FIELD_ID'] . "`=`tfe`.`content_id` AND `te`.`" . $CNF['FIELD_PACKAGE'] . "`=`tfe`.`file_id` LEFT JOIN `" . $CNF['TABLE_FILES'] . "` AS `tf` ON `te`.`" . $CNF['FIELD_PACKAGE'] . "`=`tf`.`id` ";

    	//--- Add license checking for Public listings if Client is specified.
    	if(in_array($aParams['type'], array('latest', 'popular', 'featured', 'category', 'tag', 'vendor', 'keyword')) && isset($aParams['client']) && (int)$aParams['client'] != 0) {
    	    //--- Direct license purchase for a product
    	    $sLicDir = $this->prepareAsString("SELECT `tl`.`added` FROM `" . $CNF['TABLE_LICENSES'] . "` AS `tl` WHERE `tl`.`product_id`=`te`.`" . $CNF['FIELD_ID'] . "` AND `tl`.`profile_id`=? AND (`tl`.`domain`=?" . (empty($aParams['key_assigned']) ? " OR `tl`.`domain`=''" : "") . ") LIMIT 1", (int)$aParams['client'], $aParams['key']);

    	    //--- License got with package purchase
    	    $oConnnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION_SUBENTRIES']);
            $aConnectionSql = $oConnnection->getConnectedInitiatorsAsSQLPartsMultiple('tl', 'product_id', 'te', $CNF['FIELD_ID']);

    	    $sLicPack = $this->prepareAsString("SELECT `tl`.`added` FROM `" . $CNF['TABLE_LICENSES'] . "` AS `tl` " . $aConnectionSql['join'] . " WHERE 1 " . $aConnectionSql['where'] . " AND `tl`.`profile_id`=? AND (`tl`.`domain`=?" . (empty($aParams['key_assigned']) ? " OR `tl`.`domain`=''" : "") . ") LIMIT 1", (int)$aParams['client'], $aParams['key']);

    		$sFieldsClause .= " ((" . $sLicDir . ") OR (" . $sLicPack . ")) AS `purchased_on`, ";
    	}

        //--- Include content by ids or names
        if(!empty($aParams['include_by']) && in_array($aParams['include_by'], array('id', 'name')) && !empty($aParams['include_values']))
            $sWhereClause .= " AND `te`.`" . $aParams['include_by'] . "` IN (" . $this->implode_escape($aParams['include_values']) . ") ";

    	//--- Exclude content by ids or names
        if(!empty($aParams['exclude_by']) && in_array($aParams['exclude_by'], array('id', 'name')) && !empty($aParams['exclude_values']))
            $sWhereClause .= " AND `te`.`" . $aParams['exclude_by'] . "` NOT IN (" . $this->implode_escape($aParams['exclude_values']) . ") ";

        //--- Attach custom queries described with field - value pairs.
        if(!empty($aParams['custom_and']) && is_array($aParams['custom_and']))
            $sWhereClause .= " AND (" . $this->arrayToSQL($aParams['custom_and'], ' AND ') . ") ";

        if(!empty($aParams['custom_or']) && is_array($aParams['custom_or']))
            $sWhereClause .= " AND (" . $this->arrayToSQL($aParams['custom_or'], ' OR ') . ") ";

        //--- Exclude inactive authors
        if(!empty($aParams['exclude_inactive_authors']))
            $sJoinClause .= " INNER JOIN `sys_profiles` AS `tp` ON `te`.`author`=`tp`.`id` AND `tp`.`status`='active'";
        
    	if(isset($aParams['start']) && !empty($aParams['per_page']))
            $sLimitClause = $aParams['start'] . ", " . $aParams['per_page'];

        switch($aParams['type']) {
            case 'id':
                    $aMethod['name'] = 'getRow';
                    $sFieldsClause .= "";
                    $sJoinClause .= "";
                    $sWhereClause .= $this->prepareAsString(" AND `te`.`" . $CNF['FIELD_ID'] . "`=? ", $aParams['value']);
                    $sOrderClause .= "";
                    break;

            case 'name':
                    $aMethod['name'] = 'getRow';
                    $sFieldsClause .= "";
                    $sJoinClause .= "";
                    $sWhereClause .= $this->prepareAsString(" AND `te`.`" . $CNF['FIELD_NAME'] . "`=? ", $aParams['value']);
                    $sOrderClause .= "";
                    break;

            case 'file_id':
                    $aMethod['name'] = 'getRow';
                    $sFieldsClause .= "";
                    $sJoinClause .= "";
                    $sWhereClause .= $this->prepareAsString(" AND `te`.`" . $CNF['FIELD_PACKAGE'] . "`=? ", $aParams['value']);
                    $sOrderClause .= "";
                    break;

            case 'latest':
                    $sFieldsClause .= "";
                    $sJoinClause .= "";
                    $sWhereClause .= "";
                    $sOrderClause = "`te`.`added` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                    break;

            case 'featured':
                    $sFieldsClause .= "";
                    $sJoinClause .= "";
                    $sWhereClause .= " AND `te`.`" . $CNF['FIELD_FEATURED'] . "`<>0";
                    $sOrderClause = "`te`.`" . $CNF['FIELD_FEATURED'] . "` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                    break;

            case 'popular':
                    $sFieldsClause .= "";
                    $sJoinClause .= "";
                    $sWhereClause .= "";
                    $sOrderClause = "`te`.`views` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                    break;

            case 'selected':
                    $sFieldsClause .= "";
                    $sJoinClause .= "";
                    $sWhereClause .= " AND `te`.`id` IN (" . $this->implode_escape($aParams['selected']) . ") ";
                    $sOrderClause = "`te`.`added` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                    break;

            case 'category':
                    if(!is_array($aParams['value']))
                            $aParams['value'] = array($aParams['value']);

                    $sFieldsClause .= "";
                    $sJoinClause .= "";
                    $sWhereClause .= " AND `te`.`" . $CNF['FIELD_CATEGORY'] . "` IN (" . $this->implode_escape($aParams['value']) . ")";
                    $sOrderClause = "`te`.`added` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                    break;

            case 'tag':
                $sFieldsClause .= "";

                $aSql = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS'])->keywordsGetAsSQLPart('te', $CNF['FIELD_ID'], $aParams['value']);
                if(!empty($aSql['where'])) {
                    $sWhereClause .= $aSql['where'];
                
                    if(!empty($aSql['join']))
                        $sJoinClause .= $aSql['join'];
                }

                $sOrderClause = "`te`.`added` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                break;

            case 'vendor':
                    $sFieldsClause .= "";
                    $sJoinClause .= "";

                    $sWhereClause .= $this->prepareAsString(" AND `te`.`" . $CNF['FIELD_AUTHOR'] . "`=? ", (int)$aParams['value']); 
                    if(isset($aParams['paid']) && (int)$aParams['paid'] == 1)
                            $sWhereClause .= " AND `te`.`" . $CNF['FIELD_PRICE_SINGLE'] . "`<>'0' AND `te`.`" . $CNF['FIELD_PRICE_RECURRING'] . "`<>'0'";

                    $sOrderClause = "`te`.`" . (isset($aParams['order_by']) ? $aParams['order_by'] : "added") . "` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                    break;

            case 'keyword':
                if(getParam('useLikeOperator') == 'on') {
                    $sKeyword = $this->escape('%' . preg_replace('/\s+/', '%', $aParams['value']) . '%');

                    $aWhereSubclause = [];
                    foreach ([$CNF['FIELD_TITLE'], $CNF['FIELD_TEXT']] as $sField)
                        $aWhereSubclause []= "`" . $sField . "` LIKE  " . $sKeyword;
                        
                    $sWhereClause .=  ' AND (' . implode(' OR ', $aWhereSubclause) . ')';
                }
                else {
                    $sFieldsClause .= $this->prepareAsString(" MATCH(`" . $CNF['FIELD_TITLE'] . "`, `" . $CNF['FIELD_TEXT'] . "`) AGAINST (?) AS `search_condition`, ", $aParams['value']);
                    $sWhereClause .= $this->prepareAsString(" AND MATCH(`" . $CNF['FIELD_TITLE'] . "`, `" . $CNF['FIELD_TEXT'] . "`) AGAINST (?) ", $aParams['value']);
                    $sOrderClause = "`search_condition` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                }
                break;

            case 'granted':
                    $sFieldsClause .= " '" . $aParams['license']['license'] . "' AS `license`, '" . $aParams['license']['profile_id'] . "' AS `purchased_by`, '' AS `purchased_for`, '" . $aParams['license']['added'] . "' AS `purchased_on`, ";
                    $sWhereClause .= $this->prepareAsString(" AND `te`.`" . $CNF['FIELD_AUTHOR'] . "`=? AND (`te`.`" . $CNF['FIELD_PRICE_SINGLE'] . "`<>'0' OR `te`.`" . $CNF['FIELD_PRICE_RECURRING'] . "`<>'0') ", (int)$aParams['value']);
                    $sOrderClause = "`te`.`added` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                    break;

            case 'purchased':
                    $sFieldsClause .= " `tl`.`license` AS `license`, `tl`.`profile_id` AS `purchased_by`, `tl`.`domain` AS `purchased_for`, `tl`.`added` AS `purchased_on`, ";

                    if(isset($aParams['package']) && (int)$aParams['package'] == 1) {
                        $oConnnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION_SUBENTRIES']);
                        $aConnectionSql = $oConnnection->getConnectedContentAsSQLPartsMultiple('te', $CNF['FIELD_ID'], 'tl', 'product_id');

                        $sJoinClause .= " " . $aConnectionSql['join'] . " LEFT JOIN `" . $CNF['TABLE_LICENSES'] . "` AS `tl` ON " . trim($aConnectionSql['where'], " AND ") . " ";
                    }
                    else
                        $sJoinClause .= " LEFT JOIN `" . $CNF['TABLE_LICENSES'] . "` AS `tl` ON `te`.`" . $CNF['FIELD_ID'] . "`=`tl`.`product_id` ";

                    $sWhereClause .= $this->prepareAsString(" AND `tl`.`profile_id`=? AND (`tl`.`domain`=?" . (empty($aParams['key_assigned']) ? " OR `tl`.`domain`=''" : "") . ") ", (int)$aParams['client'], $aParams['key']);
                    $sGroupClause .= "`te`.`" . $CNF['FIELD_ID'] . "`";
                    $sOrderClause = "`tl`.`added` " . (isset($aParams['order_way']) ? $aOrderWay[$aParams['order_way']] : "DESC");
                    break;
        }

        $sGroupClause = $sGroupClause ? "GROUP BY " . $sGroupClause : "";
        $sOrderClause = $sOrderClause ? "ORDER BY " . $sOrderClause : "";
        $sLimitClause = $sLimitClause ? "LIMIT " . $sLimitClause : "";

        $aMethod['params'][0] = "SELECT " . $sFieldsClause . "`te`.*
        FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te`" . $sJoinClause . "
        WHERE 1" . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

	public function getContentInfoByName ($sContentName)
    {
        $sQuery = $this->prepare ("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` WHERE `" . $this->_oConfig->CNF['FIELD_NAME'] . "` = ?", $sContentName);
        return $this->getRow($sQuery);
    }

    public function updateContentInfoBy ($aSet, $aWhere)
    {
        $sQuery = "UPDATE `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` SET " . $this->arrayToSQL($aSet) . " WHERE " . (!empty($aWhere) ? $this->arrayToSQL($aWhere, ' AND ') : "1");
        return (int)$this->query($sQuery) > 0;
    }

	public function getPhoto($aParams = array())
    {
    	return $this->_getAttachment($this->_oConfig->CNF['TABLE_PHOTOS2ENTRIES'], $aParams);
    }

	public function updatePhoto($aSet, $aWhere)
    {
    	return $this->_updateAttachment($this->_oConfig->CNF['TABLE_PHOTOS2ENTRIES'], $aSet, $aWhere);
    }

    public function getFile($aParams = array())
    {
    	return $this->_getAttachment($this->_oConfig->CNF['TABLE_FILES2ENTRIES'], $aParams);
    }

    public function updateFile($aSet, $aWhere)
    {
    	return $this->_updateAttachment($this->_oConfig->CNF['TABLE_FILES2ENTRIES'], $aSet, $aWhere);
    }

    public function associatePhotoWithContent($iContentId, $iFileId, $sTitle)
    {
        $sQuery = $this->prepare ("SELECT MAX(`order`) FROM `" . $this->_oConfig->CNF['TABLE_PHOTOS2ENTRIES'] . "` WHERE `content_id` = ?", $iContentId);
        $iOrder = 1 + (int)$this->getOne($sQuery);

        $sQuery = $this->prepare ("INSERT INTO `" . $this->_oConfig->CNF['TABLE_PHOTOS2ENTRIES'] . "` SET `content_id` = ?, `file_id` = ?, `title` = ?, `order` = ? ON DUPLICATE KEY UPDATE `title` = ?", $iContentId, $iFileId, $sTitle, $iOrder, $sTitle);
        return $this->res($sQuery);
    }

    public function deassociatePhotoWithContent($iContentId, $iFileId)
    {
    	return $this->_deassociateAttachmentWithContent($this->_oConfig->CNF['TABLE_PHOTOS2ENTRIES'], $iContentId, $iFileId);
    }

    public function associateFileWithContent($iContentId, $iFileId, $aParams)
    {
        $sQuery = $this->prepare ("SELECT MAX(`order`) FROM `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` WHERE `content_id` = ?", $iContentId);
        $iOrder = 1 + (int)$this->getOne($sQuery);

        $aBindings = array_merge(array(
        	'content_id' => $iContentId,
        	'file_id' => $iFileId,
        	'order' => $iOrder,
        ), $aParams);

        $sDiv = ", ";
        $sParams = "";
        foreach($aParams as $sKey => $mixedValue)
            $sParams .= "`" . $sKey . "` = :" . $sKey . $sDiv;
		$sParams = trim($sParams, $sDiv);

        $sQuery = $this->prepare("INSERT INTO `" . $this->_oConfig->CNF['TABLE_FILES2ENTRIES'] . "` SET `content_id` = :content_id, `file_id` = :file_id, " . $sParams . ", `order` = :order ON DUPLICATE KEY UPDATE " . $sParams);
        return $this->res($sQuery, $aBindings);
    }

    public function deassociateFileWithContent($iContentId, $iFileId)
    {
    	return $this->_deassociateAttachmentWithContent($this->_oConfig->CNF['TABLE_FILES2ENTRIES'], $iContentId, $iFileId);
    }

    public function insertDownload($iFileId, $iProfileId, $iProfileNip)
    {
    	$sQuery = $this->prepare("INSERT IGNORE INTO `" . $this->_oConfig->CNF['TABLE_DOWNLOADS'] . "` SET `file_id` = ?, `profile_id` = ?, `profile_nip` = ?, `date` = UNIX_TIMESTAMP()", $iFileId, $iProfileId, $iProfileNip);
		return (int)$this->query($sQuery) > 0;
    }

    /**
     * Integration with Payment based modules.  
     */
    public function getLicense($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sSelectClause = "`tl`.*";
        $sJoinClause = $sWhereClause = $sLimitClause = "";
        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `tl`.`id`=:id";
                break;
            
            case 'license':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'license' => $aParams['license']
                );

                $sWhereClause = " AND `tl`.`license`=:license";
                break;

            case 'new':
                $aMethod['params'][1] = array(
                    'profile_id' => $aParams['profile_id']
                );

                $sWhereClause = " AND `tl`.`profile_id`=:profile_id AND `tl`.`new`='1'";
                break;

            case 'order':
                $aMethod['params'][1] = array(
                    'order' => $aParams['order']
                );

                $sWhereClause = " AND `tl`.`order`=:order";
                if(isset($aParams['used']) && $aParams['used'] == true)
                    $sWhereClause .= " AND `tl`.`domain` <> ''";
                if(isset($aParams['unused']) && $aParams['unused'] == true)
                    $sWhereClause .= " AND `tl`.`domain` = ''";
                break;

            case 'unused':
                $aMethod['params'][1] = array(
                    'profile_id' => $aParams['profile_id']
                );

                $sWhereClause = " AND `tl`.`profile_id`=:profile_id AND `tl`.`domain`=''";
                break;

            case 'expired':
                $aMethod['params'][1] = array(
                    'type' => BX_MARKET_LICENSE_TYPE_RECURRING
                );

                $sWhereClause = " AND `type` = :type AND `added` < UNIX_TIMESTAMP() AND `expired` <> 0 AND `expired` < UNIX_TIMESTAMP()";
                break;

            case 'product_id':
                $aMethod['params'][1] = array(
                    'product_id' => $aParams['product_id']
                );

                $sWhereClause = " AND `tl`.`product_id`=:product_id";

                if(!empty($aParams['profile_id'])) {
                    $aMethod['params'][1]['profile_id'] = $aParams['profile_id'];
                    $sWhereClause .= " AND `tl`.`profile_id`=:profile_id";
                }
                break;

            case 'profile_id':
                $aMethod['params'][1] = array(
                    'profile_id' => $aParams['profile_id']
                );

                $sWhereClause = " AND `tl`.`profile_id`=:profile_id";

                if(!empty($aParams['product_id'])) {
                    $aMethod['params'][1]['product_id'] = $aParams['product_id'];
                    $sWhereClause .= " AND `tl`.`product_id`=:product_id";
                }
                break;

            case 'profile_id_file_id_key':
                $aMethod['name'] = "getRow";
                $aMethod['params'][1] = array(
                    'profile_id' => $aParams['profile_id'],
                    'key' => $aParams['key']
                );

                $iProductId = $this->getOne("SELECT `te`.`" . $CNF['FIELD_ID'] . "` FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te` LEFT JOIN `" . $CNF['TABLE_FILES2ENTRIES'] . "` AS `tfe` ON `te`.`id`=`tfe`.`content_id` WHERE `tfe`.`file_id`=:file_id LIMIT 1", array(
                    'file_id' => $aParams['file_id']
                ));

                if(isset($aParams['package']) && (int)$aParams['package'] == 1) {
                    $oConnnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION_SUBENTRIES']);
                    $aConnectionSql = $oConnnection->getConnectedInitiatorsAsSQLParts('tl', 'product_id', $iProductId);

                    $sJoinClause .= $aConnectionSql['join'];
                }
                else {
                    $aMethod['params'][1]['product_id'] = $iProductId;

                    $sWhereClause .= " AND `tl`.`product_id`=:product_id";
                }

                $sWhereClause .= " AND `tl`.`profile_id`=:profile_id AND (`tl`.`domain`='' OR `tl`.`domain`=:key)";
                $sLimitClause = "1";
                break;

            case 'has_by':
                $aMethod['name'] = "getOne";
                $aMethod['params'][1] = array(
                    'profile_id' => $aParams['profile_id']
                );

                $sSelectClause = "`tl`.`id`";
                $sWhereClause = " AND `tl`.`profile_id`=:profile_id";

                if(isset($aParams['package']) && (int)$aParams['package'] == 1) {
                    $oConnnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION_SUBENTRIES']);
                    $aConnectionSql = $oConnnection->getConnectedInitiatorsAsSQLParts('tl', 'product_id', $aParams['product_id']);

                    $sJoinClause .= $aConnectionSql['join'];
                }
                else {
                    $aMethod['params'][1]['product_id'] = $aParams['product_id'];

                    $sWhereClause .= " AND `tl`.`product_id`=:product_id";
                }

                if(!empty($aParams['domain'])) {
                    $aMethod['params'][1]['domain'] = $aParams['domain'];
                    $sWhereClause .= " AND `tl`.`domain`=:domain";
                }

                if(!empty($aParams['order'])) {
                    $aMethod['params'][1]['order'] = $aParams['order'];
                    $sWhereClause .= " AND `tl`.`order`=:order";
                }

                $sLimitClause = "1";
            break;
        }

        $sLimitClause = !empty($sLimitClause) ? "LIMIT " . $sLimitClause : $sLimitClause;

        $aMethod['params'][0] = "SELECT
                        " . $sSelectClause . "
            FROM `" . $this->_oConfig->CNF['TABLE_LICENSES'] . "` AS `tl`" . $sJoinClause . "
            WHERE 1" . $sWhereClause . " " . $sLimitClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function updateLicense($aSet, $aWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->query("UPDATE `" . $CNF['TABLE_LICENSES'] . "` SET " . $this->arrayToSQL($aSet) . " WHERE " . (!empty($aWhere) ? $this->arrayToSQL($aWhere, ' AND ') : "1"));
    }

    public function deleteLicense($aWhere)
    {
    	if(empty($aWhere))
            return false;

        $sQuery = "DELETE FROM `" . $this->_oConfig->CNF['TABLE_LICENSES'] . "` WHERE " . $this->arrayToSQL($aWhere, ' AND ');
        return (int)$this->query($sQuery) > 0;
    }

    public function hasLicense ($iProfileId, $iProductId, $sDomain = '')
    {
        $aParams = array(
    		'type' => 'has_by', 
    		'profile_id' => $iProfileId, 
    		'product_id' => $iProductId, 
    		'domain' => !empty($sDomain) ? $sDomain : ''
    	);
 
        $iLicenseId = (int)$this->getLicense($aParams);
    	if($iLicenseId > 0)
    	    return true;

        $aParams['package'] = 1;
        $iLicenseId = (int)$this->getLicense($aParams);
    	if($iLicenseId > 0)
    	    return true;

    	return false;
    }

	public function hasLicenseByOrder ($iProfileId, $iProductId, $sOrder = '')
    {
        $aParams = array(
    		'type' => 'has_by', 
    		'profile_id' => $iProfileId, 
    		'product_id' => $iProductId, 
    		'order' => !empty($sOrder) ? $sOrder : ''
    	);

        $iLicenseId = (int)$this->getLicense($aParams);
        if($iLicenseId > 0)
    	    return true;

        $aParams['package'] = 1;
        $iLicenseId = (int)$this->getLicense($aParams);
    	if($iLicenseId > 0)
    	    return true;

    	return false;
    }

    public function registerLicense($iProfileId, $iProductId, $iCount, $sOrder, $sLicense, $sType, $sDuration = '', $iTrial = 0)
    {
    	$CNF = &$this->_oConfig->CNF;

        $oPayments = BxDolPayments::getInstance();

        $iProcessed = 0;
        for($i = 0; $i < $iCount; $i++) {
            $aQueryParams = array(
                'profile_id' => $iProfileId,
                'product_id' => $iProductId,
                'count' => 1,
                'order' => $sOrder,
                'license' => $sLicense,
                'type' => $sType
            );

            $sExpireParam = '';
            if(!empty($iTrial))
                $sExpireParam = ', `expired`=UNIX_TIMESTAMP(DATE_ADD(DATE_ADD(NOW(), INTERVAL ' . (int)$iTrial . ' DAY), INTERVAL ' . (int)$this->getParam($CNF['OPTION_RECURRING_RESERVE']) . ' DAY))';
            else if(!empty($sDuration) && isset($this->_aRecurringDurations[$sDuration]))
                $sExpireParam = ', `expired`=UNIX_TIMESTAMP(DATE_ADD(DATE_ADD(NOW(), ' . $this->_aRecurringDurations[$sDuration] . '), INTERVAL ' . (int)$this->getParam($CNF['OPTION_RECURRING_RESERVE']) . ' DAY))';

            if((int)$this->query("INSERT INTO `" . $CNF['TABLE_LICENSES'] . "` SET " . $this->arrayToSQL($aQueryParams) . ", `added`=UNIX_TIMESTAMP()" . $sExpireParam) == 0)
                continue;

            $sLicense = $oPayments->generateLicense();
            $iProcessed += 1;
        }

        return $iCount == $iProcessed;
    }

    public function prolongLicense($iProfileId, $iProductId, $iCount, $sOrder, $sLicense, $sType, $sDuration = '', $iTrial = 0)
    {
    	$CNF = &$this->_oConfig->CNF;

    	if($sType == BX_MARKET_LICENSE_TYPE_SINGLE)
    		return true;

    	if(empty($sDuration) || empty($this->_aRecurringDurations[$sDuration]))
    		return false;

    	$sQuery = $this->prepare("UPDATE 
    			`" . $CNF['TABLE_LICENSES'] . "` 
    		SET 
    			`expired`=UNIX_TIMESTAMP(DATE_ADD(FROM_UNIXTIME(`expired`), " . $this->_aRecurringDurations[$sDuration] . ")) 
    		WHERE 
    			`profile_id` = ? AND 
    			`product_id` = ? AND 
    			`order` = ? 
    		LIMIT ?", $iProfileId, $iProductId, $sOrder, (int)$iCount);

        return (int)$this->query($sQuery) > 0;
    }

    public function unregisterLicense($iProfileId, $iProductId, $sOrder, $sLicense, $sType)
    {
    	$sWhereClause = "`profile_id` = :profile_id AND `product_id` = :product_id AND `order` = :order AND `license` = :license";
    	$aWhereBindings = array(
    		'profile_id' => $iProfileId,
    		'product_id' => $iProductId,
    		'order' => $sOrder,
    		'license' => $sLicense
    	);
    	
		//--- Move to deleted licenses table with 'refund' as reason.   
    	$sQuery = "INSERT IGNORE INTO `" . $this->_oConfig->CNF['TABLE_LICENSES_DELETED'] . "` SELECT *, 'refund' AS `reason`, UNIX_TIMESTAMP() AS `deleted` FROM `" . $this->_oConfig->CNF['TABLE_LICENSES'] . "` WHERE " . $sWhereClause;
		$this->query($sQuery, $aWhereBindings);

    	$sQuery = "DELETE FROM `" . $this->_oConfig->CNF['TABLE_LICENSES'] . "` WHERE " . $sWhereClause;
        return $this->query($sQuery, $aWhereBindings) !== false;
    }

    public function unregisterLicenseById($iId, $sReason = 'refund')
    {
        $CNF = &$this->_oConfig->CNF;

        //--- Move to deleted licenses table with provided reason.
        $this->query("INSERT IGNORE INTO `" . $CNF['TABLE_LICENSES_DELETED'] . "` SELECT *, :reason AS `reason`, UNIX_TIMESTAMP() AS `deleted` FROM `" . $CNF['TABLE_LICENSES'] . "` WHERE `id` = :id", [
            'id' => $iId,
            'reason' => $sReason
        ]);

        return $this->query("DELETE FROM `" . $CNF['TABLE_LICENSES'] . "` WHERE `id` = :id", [
            'id' => $iId,
    	]) !== false;
    }

    function processExpiredLicense($aLicense)
    {
        //--- Move to deleted licenses table with 'expire' as reason.  
        $this->query("INSERT IGNORE INTO `" . $this->_oConfig->CNF['TABLE_LICENSES_DELETED'] . "` SET " . $this->arrayToSQL($aLicense));

        return $this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_LICENSES'] . "` WHERE `id`=:id LIMIT 1", array('id' => $aLicense['id'])) !== false;
    }

    function processExpiredLicenses()
    {
        $sWhereClause = "`type` = :type AND `added` < UNIX_TIMESTAMP() AND `expired` <> 0 AND `expired` < UNIX_TIMESTAMP()";
        $aWhereBindings = array(
            'type' => BX_MARKET_LICENSE_TYPE_RECURRING
        );

        //--- Move to deleted licenses table with 'expire' as reason.  
        $sQuery = "INSERT IGNORE INTO `" . $this->_oConfig->CNF['TABLE_LICENSES_DELETED'] . "` SELECT *, 'expire' AS `reason`, UNIX_TIMESTAMP() AS `deleted` FROM `" . $this->_oConfig->CNF['TABLE_LICENSES'] . "` WHERE " . $sWhereClause;
        $this->query($sQuery, $aWhereBindings);

        $sQuery = "DELETE FROM `" . $this->_oConfig->CNF['TABLE_LICENSES'] . "` WHERE " . $sWhereClause;
        return $this->query($sQuery, $aWhereBindings) !== false;
    }

    protected function _deassociateAttachmentWithContent($sTable, $iContentId, $iFileId)
    {
        $sWhere = '';
        $aBindings = array();
        if ($iContentId) {
            $sWhere .= " AND `content_id` = :content_id ";
            $aBindings['content_id'] = $iContentId;
        }

        if ($iFileId) {
            $sWhere .= " AND `file_id` = :file_id ";
            $aBindings['file_id'] = $iFileId;
        }

        $sQuery = "DELETE FROM `" . $sTable . "` WHERE 1 " . $sWhere;
        return $this->query($sQuery, $aBindings) !== false;
    }

    protected function _getAttachment($sTable, $aParams = array())
    {
    	$aMethod = array('name' => 'getRow', 'params' => array(0 => 'query'));
    	
    	$sFieldsClause = "`tfe`.*";
    	$sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";
        switch($aParams['type']) {
            case 'id':
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `tfe`.`id`=:id";
                break;

            case 'file_id':
                $aMethod['params'][1] = array(
                    'file_id' => $aParams['file_id']
                );

                $sWhereClause = " AND `tfe`.`file_id`=:file_id";
                break;

            case 'file_id_ext':
                $aMethod['params'][1] = array(
                    'file_id' => $aParams['file_id']
                );

                $sFieldsClause .= ", `tf`.`file_name`, `tf`.`size` AS `file_size`";
                $sJoinClause = " LEFT JOIN `" . $this->_oConfig->CNF['TABLE_FILES'] . "` AS `tf` ON `tfe`.`file_id`=`tf`.`id` ";
                $sWhereClause = " AND `tfe`.`file_id`=:file_id";
                break;
                

            case 'content_id':
            	$aMethod['name'] = 'getAll';
            	$aMethod['params'][1] = array(
                    'content_id' => $aParams['content_id']
                );

            	$sWhereClause = " AND `tfe`.`content_id`=:content_id";
            	if(!empty($aParams['except']))
                    $sWhereClause .= " AND `tfe`.`file_id` NOT IN (" . $this->implode_escape($aParams['except']) . ")";

            	break;

            case 'content_id_key_file_id':
                $aMethod['name'] = 'getAllWithKey';
                $aMethod['params'][1] = 'file_id';
                $aMethod['params'][2] = array(
                    'content_id' => $aParams['content_id']
                );

                $sWhereClause = " AND `tfe`.`content_id`=:content_id";
                $sOrderClause = "`tfe`.`type` ASC, `tfe`.`order` DESC";
                break;

            case 'content_id_and_type':
                $aMethod['name'] = 'getAll';
            	$aMethod['params'][1] = array(
                    'content_id' => $aParams['content_id'],
                    'type' => $aParams['file_type']
                );

                $sFieldsClause .= ", `tf`.`file_name`, `tf`.`size` AS `file_size`";
                $sJoinClause = " LEFT JOIN `" . $this->_oConfig->CNF['TABLE_FILES'] . "` AS `tf` ON `tfe`.`file_id`=`tf`.`id` ";
                $sWhereClause = " AND `tfe`.`content_id`=:content_id AND `tfe`.`type`=:type";

                if(!empty($aParams['version'])) {
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1]['version'] = $aParams['version'];
                    $sWhereClause .= " AND `tfe`.`version`=:version";
                }

                if(isset($aParams['ordered']) && $aParams['ordered'] === true)
                    $sOrderClause = "`tfe`.`version` ASC";

            	break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = " ORDER BY " . $sOrderClause;

        if(!empty($sLimitClause))
            $sLimitClause = " LIMIT " . $sLimitClause;

        $aMethod['params'][0] = "SELECT
                " . $sFieldsClause . "
            FROM `" . $sTable . "` AS `tfe`" . $sJoinClause . "
            WHERE 1" . $sWhereClause . $sOrderClause . $sLimitClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

	protected function _updateAttachment($sTable, $aSet, $aWhere)
    {
        $sQuery = "UPDATE `" . $sTable . "` SET " . $this->arrayToSQL($aSet) . " WHERE " . (!empty($aWhere) ? $this->arrayToSQL($aWhere, ' AND ') : "1");
        return (int)$this->query($sQuery) > 0;
    }
}

/** @} */
