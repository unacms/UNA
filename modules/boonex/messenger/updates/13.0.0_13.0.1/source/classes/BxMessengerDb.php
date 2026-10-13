<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup		UnaModules
 *
 * @{
 */

/**
 * Database queries
 */ 
class BxMessengerDb extends BxBaseModGeneralDb
{
   private $CNF;
   function __construct(&$oConfig)
   {
		parent::__construct($oConfig);		
		$this->CNF = &$oConfig -> CNF;
	}
	
	/**
	* Get all lot by class name 
	*@param string $sClass
	*@return array lot info
	*/
	public function getLotByClass($sClass){
		if (!$sClass)
		    return '';

	    $sQuery = $this -> prepare("SELECT * FROM `{$this->CNF['TABLE_ENTRIES']}` WHERE `{$this->CNF['FIELD_CLASS']}` = ? LIMIT 1", $sClass);
		return $this -> getRow($sQuery);
	}

	/**
	* Get all lot by page url
	*@param string $sUrl or the page
	*@return array lot info
	*/
	public function getLotByUrl($sUrl)
	{
		$sQuery = $this -> prepare("SELECT * FROM `{$this->CNF['TABLE_ENTRIES']}` WHERE `{$this->CNF['FIELD_URL']}` = ? LIMIT 1", $sUrl);
		return $this -> getRow($sQuery);
	}

	/**
	* Get all lot by id
	*@param int $iId lot id
	*@return array lot info
	*/
	public function getLotInfoById($iId)
	{
	    $sQuery = $this -> prepare("SELECT `l`.*, `g`.`{$this->CNF['FMGL_GROUP_ID']}` FROM `{$this->CNF['TABLE_ENTRIES']}` as `l`
                                           LEFT JOIN `{$this->CNF['TABLE_GROUPS_LOTS']}` as `g` ON `g`.`{$this->CNF['FMGL_LOT_ID']}` = `l`.`{$this->CNF['FIELD_ID']}`
                                           WHERE `{$this->CNF['FIELD_ID']}` = ? LIMIT 1", (int)$iId);
		return $this -> getRow($sQuery);
	}

	/**
	* Get lot by id or url
	*@param int $iId lot id
	*@param string $sUrl url or url of the page with talk 
	*@param int $iAuthor profile id 
	*@return array lot info
	*/
	public function getLotByIdOrUrl($iId, $sUrl, $iAuthorId = 0){
		if ($iId)
			return $this -> getLotInfoById($iId);
		
		if ($sUrl)
			return $this -> getLotByUrl($sUrl);
		
		return array();
	}

	/**
	* Check if is the member author of the lot or jot
	*@param int $iId lot id
	*@param int $iAuthor profile id 
	*@param boolean $bLotAuthor if true checks Lot, otherwise jot  
	*@return boolean
	*/
	public function isAuthor($iId, $iAuthorId, $bLotAuthor = true){
		if (!$iAuthorId)
			return false;
		
		if ($bLotAuthor)
			$sQuery = $this -> prepare("SELECT COUNT(*) FROM `{$this->CNF['TABLE_ENTRIES']}` WHERE `{$this->CNF['FIELD_ID']}` = ? AND `{$this->CNF['FIELD_AUTHOR']}` = ? LIMIT 1", (int)$iId, (int)$iAuthorId);
		else
			$sQuery = $this -> prepare("SELECT COUNT(*) FROM `{$this->CNF['TABLE_MESSAGES']}` WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = ? AND `{$this->CNF['FIELD_MESSAGE_AUTHOR']}` = ? LIMIT 1", (int)$iId, (int)$iAuthorId);
			
		return $this -> getOne($sQuery) == 1;
	}

	/**
	* Deletes lot by lot Id
	*@param int $iLotId lot id
	*@return int affected rows
	*/
	public function deleteLot($iLotId){
		$aJots = $this -> getJotsByLotId(['lot' => $iLotId]);
		foreach($aJots as $iKey => $aJot)
            $this->clearJotsConnections($aJot[$this->CNF['FIELD_MESSAGE_ID']], $iLotId);

        $this->query("DELETE FROM `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                                        WHERE `{$this->CNF['FIELD_NEW_LOT']}`=:lot                                        
                                                     ", array('lot' => $iLotId));

        $this -> query("DELETE FROM `{$this->CNF['TABLE_ENTRIES']}` WHERE `{$this->CNF['FIELD_ID']}` = :id", array('id' => $iLotId));
        $this -> query("DELETE FROM `{$this->CNF['TABLE_LOT_SETTINGS']}` WHERE `{$this->CNF['FLS_ID']}` = :id", array('id' => $iLotId));
        $this -> query("DELETE FROM `{$this->CNF['TABLE_USERS_INFO']}` WHERE `{$this->CNF['FIELD_INFO_LOT_ID']}` = :id", array('id' => $iLotId));
		$this -> query("DELETE FROM `{$this->CNF['TABLE_MESSAGES']}` WHERE `{$this->CNF['FIELD_MESSAGE_FK']}` = :id", array('id' => $iLotId));

		return true;
	}

    /**
     * Clear lot history
     *@param int $iLotId lot id
     *@return boolean result
     */
    public function clearLot($iLotId){
        $aJots = $this -> getJotsByLotId(['lot' => $iLotId]);
        foreach($aJots as $iKey => $aJot)
            $this->clearJotsConnections($aJot[$this->CNF['FIELD_MESSAGE_ID']], $iLotId);

        return $this->query("DELETE FROM `{$this->CNF['TABLE_MESSAGES']}` WHERE `{$this->CNF['FIELD_MESSAGE_FK']}` = :id", array('id' => $iLotId));
    }
	
	/**
	* Deletes jot
	*@param int iJotId jot id
	*@param int iProfileId member who deleted jot
	*@param boolean $bCompletely if true totally remove from the site 
	*@return int affected rows
	*/
	public function deleteJot($iJotId, $iProfileId, $bCompletely = false){
		$iJotId = (int)$iJotId;
		if ($bCompletely)
		{
            $this->clearJotsConnections($iJotId);
			return $this -> query("DELETE FROM `{$this->CNF['TABLE_MESSAGES']}` WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = :id", array('id' => $iJotId));
		}		
		
		return $this -> query("UPDATE `{$this->CNF['TABLE_MESSAGES']}` 
								SET 
									`{$this->CNF['FIELD_MESSAGE_TRASH']}` = 1,
									`{$this->CNF['FIELD_MESSAGE_LAST_EDIT']}` = UNIX_TIMESTAMP(),
									`{$this->CNF['FIELD_MESSAGE_EDIT_BY']}` = :profile
								WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = :id", array('id' => $iJotId, 'profile' => $iProfileId));
	}	

	public function clearJotsConnections($iJotId, $iLotId = 0){
        $this->removeFilesByJotId($iJotId);
        $this->deleteJotReactions($iJotId);
        $this->deleteSavedJotItems($iJotId);

        if (!$iLotId)
            $iLotId = $this->getLotByJotId($iJotId, true);

        if ($iLotId) {
            $aUnreadJots = $this->getAll("SELECT * 
                                                    FROM `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                                    WHERE `{$this->CNF['FIELD_NEW_JOT']}`<=:jot AND `{$this->CNF['FIELD_NEW_LOT']}`=:lot", array('jot' => $iJotId, 'lot' => $iLotId));
            foreach ($aUnreadJots as &$aUnreadJot) {
               $iProfileId = (int)$aUnreadJot[$this->CNF['FIELD_NEW_PROFILE']];
               $iUnreadJotId = (int)$aUnreadJot[$this->CNF['FIELD_NEW_JOT']];
               if ($iUnreadJotId && $iUnreadJotId < (int)$iJotId)
                   $this->query("
                                           UPDATE `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                           SET `{$this->CNF['FIELD_NEW_UNREAD']}`=`{$this->CNF['FIELD_NEW_UNREAD']}` - 1
                                           WHERE `{$this->CNF['FIELD_NEW_LOT']}`=:lot AND `{$this->CNF['FIELD_NEW_PROFILE']}`=:profile AND `{$this->CNF['FIELD_NEW_UNREAD']}` > 0 
                                          ", array('lot' => $iLotId, 'profile' => $iProfileId));
               else
                   $this->deleteNewJot($iProfileId, $iLotId, $iJotId);
            }
        }
    }

	public function updateJot($iJotId, $sField, $mixedValue){
	    return $this -> query("UPDATE `{$this->CNF['TABLE_MESSAGES']}` 
								SET 
									`{$sField}` =:value
								WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = :id", array('id' => $iJotId, 'value' => $mixedValue));
       }

	/**
	* Removes participant from the participants list
	*@param int $iLotId lot id
	*@param int $iParticipant profile id
	*@return int/false 
	*/	
	public function leaveLot($iLotId, $iParticipant){
        $this->deleteNewJot($iParticipant, $iLotId);
		return $this -> removeParticipant($iLotId, $iParticipant);
	}
	
	/**
	* Get Lot(Talk) settings for a member
	*@param int $iLotId lot id
	*@param int $iParticipant profile id
	*@param string $sName name the option
	*@param boolean $bParams get from params array, otherwise from table's field
	*@return mixed option value
	*/
	private function getParams($iLotId, $iParticipant, $sName = 0, $bParams = false){
		$sQuery = $this -> prepare("SELECT * FROM `{$this->CNF['TABLE_USERS_INFO']}` 
									WHERE `{$this->CNF['FIELD_INFO_LOT_ID']}` = ? AND `{$this->CNF['FIELD_INFO_USER_ID']}` = ? 
									LIMIT 1", (int)$iLotId, (int)$iParticipant);
		$aInfo = $this -> getRow($sQuery);
		if (empty($aInfo))
			return false;
		
		if (!$sName)
			return $aInfo;
		
		if (!$bParams){	
			$aParams = unserialize($aInfo[$this->CNF['FIELD_INFO_PARAMS']]);
			return isset($aParams[$sName]) ? $aParams[$sName] : 0;
		}
				
		return $aInfo[$sName];
	}

	/**
	* Save Lot(Talk) settings for a member
	*@param int $iLotId lot id
	*@param int $iParticipant profile id
	*@param array $aParams options list
	*@param boolean $bParams get from  params array otherwise as table field
	*@return int affected rows
	*/
	private function setParams($iLotId, $iParticipant, $sName, $sValue, $bParams = false){
		$aParams = $this->getParams($iLotId, $iParticipant);
	
		if (!$bParams)
		{
			if (empty($aParams))
				return $this -> query("INSERT INTO `{$this->CNF['TABLE_USERS_INFO']}` SET `{$this->CNF['FIELD_INFO_PARAMS']}` = :values, `{$this->CNF['FIELD_INFO_LOT_ID']}` = :id, `{$this->CNF['FIELD_INFO_USER_ID']}` = :user", array('user' => $iParticipant, 'id' => $iLotId, 'values' => serialize(array($sName => $sValue))));
			
			return $this -> query("UPDATE `{$this->CNF['TABLE_USERS_INFO']}` SET `{$this->CNF['FIELD_INFO_PARAMS']}` = :values WHERE `{$this->CNF['FIELD_INFO_LOT_ID']}` = :id AND `{$this->CNF['FIELD_INFO_USER_ID']}` = :user", array('user' => $iParticipant, 'id' => $iLotId, 'values' => serialize(array($sName => $sValue))));
		}
		
		if (empty($aParams))
			return $this -> query("INSERT INTO `{$this->CNF['TABLE_USERS_INFO']}` SET `{$sName}` = :value, `{$this->CNF['FIELD_INFO_LOT_ID']}` = :id, `{$this->CNF['FIELD_INFO_USER_ID']}` = :user", array('user' => $iParticipant, 'id' => $iLotId, 'value' => $sValue));		
		
		return $this -> query("UPDATE `{$this->CNF['TABLE_USERS_INFO']}` SET `{$sName}` = :value WHERE `{$this->CNF['FIELD_INFO_LOT_ID']}` = :id AND `{$this->CNF['FIELD_INFO_USER_ID']}` = :user", array('user' => $iParticipant, 'id' => $iLotId, 'value' => $sValue));		
	}

	/**
	* Make the lot mute for a member
	*@param int $iLotId lot id
	*@param int $iParticipant profile id
	*@return int set value
	*/
	public function muteLot($iLotId, $iParticipant){
		$iCurrentNotification = (int)$this->getParams($iLotId, $iParticipant, 'notification');
		$iNotification = (int)!$iCurrentNotification;
		
		$this->setParams($iLotId, $iParticipant, 'notification', $iNotification);
		return $iNotification;
	}
	
	/**
	* Mark the lot with star
	*@param int $iLotId lot id
	*@param int $iParticipant profile id
	*@return int set
	*/
	public function starLot($iLotId, $iParticipant){
		$iCurrent = (int)$this -> getParams($iLotId, $iParticipant, 'star', true);
		$iNew = (int)!$iCurrent;
		
		$this -> setParams($iLotId, $iParticipant, 'star', $iNew, true);
		return $iNew;
	}
	
	public function isStarred($iLotId, $iParticipant){
		return $this -> getParams($iLotId, $iParticipant, 'star', true);
	}
	/**
	* Check if the lot is mute for a member
	*@param int $iLotId lot id
	*@param int $iParticipant profile id
	*@return boolean 
	*/
	public function isMuted($iLotId, $iParticipant){
		return $this -> getParams($iLotId, $iParticipant, 'notification');
	}

	/**
	/**
	* Save participants list for the lot
	*@param int $iLotId lot id
	*@param array $aParticipants
	*@return int affected rows
	*/
	public function saveParticipantsList($iLotId, $aParticipants){
		$sParticipants = '';
		if (!empty($aParticipants) && is_array($aParticipants))
		{
			$aParticipants = array_map('intval', $aParticipants);
			$sParticipants = implode(',', $aParticipants);
		}
		
		return $this -> query("UPDATE `{$this->CNF['TABLE_ENTRIES']}` SET `{$this->CNF['FIELD_PARTICIPANTS']}` = :parts WHERE `{$this->CNF['FIELD_ID']}` = :id", array('parts' => $sParticipants, 'id' => $iLotId));
	}

	public function findThePageOwner($mixedPage){
	    $iAuthorId = 0;
	    if (!$mixedPage)
	        return $iAuthorId;

	    if (is_string($mixedPage))
	        parse_str($mixedPage, $aUrl);
        else if (is_array($mixedPage))
            $aUrl = $mixedPage;

	    if (empty($aUrl) || !isset($aUrl['id']) || !isset($aUrl['i']))
	        return $iAuthorId;

	    $sModule = $this->getOne("SELECT `module` FROM `sys_objects_page` WHERE LOWER(`uri`)=:uri", array('uri' => strtolower($aUrl['i'])));
	    if (!$sModule)
	        return $iAuthorId;

	    $aTable = $this->getRow("SELECT `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor` 
                                                             FROM `sys_objects_cmts`
                                                             WHERE `Module`=:module LIMIT 1", array('module' => $sModule));
	    if (empty($aTable))
	        return $iAuthorId;

	    if (isset($aTable['TriggerTable']) && isset($aTable['TriggerFieldId']) && isset($aTable['TriggerFieldAuthor']))
	        return $this->getOne("SELECT `{$aTable['TriggerFieldAuthor']}` 
                                            FROM `{$aTable['TriggerTable']}` 
                                            WHERE `{$aTable['TriggerFieldId']}`=:id",
                                            array('id' => $aUrl['id']));

	    return $iAuthorId;
    }

    function createLot($iProfileId, $aData){
        $sUrl = isset($aData['url']) ? $aData['url'] : '';
        $aParticipants = isset($aData['participants']) ? $aData['participants'] : array();

        $iAuthorId = $this->findThePageOwner($sUrl);
        $iAuthorId = $iAuthorId ? $iAuthorId : (int)$iProfileId;

        if (isset($aData['thread']) && $aData['thread']) {
            $aJotInfo = $this->getJotById($aData['thread']);
            $iLotId = $this->createNewLot($iProfileId, $aData, $aParticipants);
        }
        else
            $iLotId = $this->createNewLot($iAuthorId, $aData, $aParticipants);

        if (!$iLotId)
            return false;

        bx_alert($this->_oConfig->getObject('alert'), 'create_lot', $iLotId, $iProfileId);
        foreach($aParticipants as &$iParticipant) {
            if ((int)$iParticipant === (int)$iProfileId)
                continue;

            bx_alert($this->_oConfig->getObject('alert'), 'add_part', $iParticipant, $iProfileId, array('lot_id' => $iLotId, 'author_id' => $iAuthorId));
        }
        
        return $iLotId;
    }
	/**
	* Save message for participants to database
	*@param array $aData lot settings
	*@param array $aParticipants participants list, if it empty then used default for lot
	*@return int affected rows
	*/
    public function saveMessage($aData)
    {
        $iLotId = isset($aData['lot']) ? (int)$aData['lot'] : 0;
        $aLotInfo = $iLotId ? $this->getLotInfoById($iLotId) : [];
        if (empty($aLotInfo) && $aData['type'] == BX_IM_TYPE_PRIVATE && !$aData['title'])
            $aLotInfo = $this->findLotByParams($aData);

        if ($iLotId && $aData['type'] == BX_IM_TYPE_PRIVATE && !$this->isParticipant($iLotId, $aData['member_id']))
            return false;

        if (empty($aLotInfo)){
            $iLotId = $this->createLot((int)$aData['member_id'], $aData);

			if (isset($aData['group_id']) && (int)$aData['group_id'] && (int)$iLotId)
				$this->addLotToGroup($iLotId, $aData['group_id']);
		}
        else
            $iLotId = $aLotInfo[$this->CNF['FIELD_ID']];

        if (($aData['type'] != BX_IM_TYPE_PRIVATE || $this->isAuthor($iLotId, $aData['member_id'])) && !$this->isParticipant($iLotId, $aData['member_id'], true)) {
            if ($this->addMemberToParticipantsList($iLotId, $aData['member_id']))
                bx_alert($this->_oConfig->getObject('alert'), 'participant_joined', $iLotId, $aData['member_id'],
                    array(
                        'url' => $aData['url'],
                        'object_author_id' => !empty($aLotInfo[$this->CNF['FIELD_AUTHOR']]) ? $aLotInfo[$this->CNF['FIELD_AUTHOR']] : $this->findThePageOwner($aData['url'])
                    ));
        }

      	$aData['message'] = clear_xss($aData['message']);
	    return $this->addJot($iLotId, $aData['message'], $aData['member_id']);
	}

    /**
     * Find appropriate Talk using input params
     *@param array $aData params
     *@return array Lot info
     */
    public function findLotByParams($aData){
        $sUrl = isset($aData['url']) ? $aData['url'] : '';
        $aParticipants = isset($aData['participants']) && is_array($aData['participants']) ? $aData['participants'] : [];
        $sClass = isset($aData['class']) ? $aData['class'] : '';
        $iType = isset($aData['type']) ? $aData['type'] : 0;

        $aWhere = $aWhereBindings = [];
        $aLots = [];
        if (!empty($aParticipants)) {
            $aItems = $this->getLotsByParticipantsList($aParticipants, $iType, true);
            foreach($aItems as &$aItem)
                $aLots[] = $aItem[$this->CNF['FIELD_ID']];

            if (!empty($aLots))
                $aWhere[] = "`{$this->CNF['FIELD_ID']}` IN (" . implode(',', $aLots) . ")";
            else
                return [];
        }

        if ($sClass){
            $aWhere[] = "`{$this->CNF['FIELD_CLASS']}` =:class";
            $aWhereBindings['class'] = $sClass;
        }

        if ($sUrl){
            $aWhere[] = "`{$this->CNF['FIELD_URL']}` =:url";
            $aWhereBindings['url'] = $sUrl;
        }

        if ($iType){
            $aWhere[] = "`{$this->CNF['FIELD_TYPE']}` =:type";
            $aWhereBindings['type'] = $iType;
        }

        return $this -> getRow("SELECT * FROM `{$this->CNF['TABLE_ENTRIES']}` 
                                                WHERE " . implode(' AND ', $aWhere) . " LIMIT 1", $aWhereBindings);
    }

    function getLotsByParticipantsList($aParticipants, $mixedType = false, $bGetAll = false){
        $aParticipantsList = $aResult = [];
        if (empty($aParticipants))
            return $aResult;

        foreach ($aParticipants as &$iParticipant)
            $aParticipantsList[] = "(^|,)" . (int)$iParticipant . "(,|$)";

        if (empty($aParticipantsList))
            return $aResult;

        $aWhere[] = "`{$this->CNF['FIELD_PARTICIPANTS']}` REGEXP '" . implode('|', $aParticipantsList) . "'";
        if ($mixedType)
            $aWhere[] = "`{$this->CNF['FIELD_TYPE']}` = " . $mixedType;

        $aLots = $this->getAll("SELECT * FROM `{$this->CNF['TABLE_ENTRIES']}` WHERE " . implode(' AND ', $aWhere) . " ORDER BY `{$this->CNF['FIELD_ID']}` ASC ");
        if (empty($aLots))
            return $aResult;

        foreach ($aLots as &$aLot) {
            $aTalkParticipants = explode(',', $aLot[$this->CNF['FIELD_PARTICIPANTS']]);
            if (count($aTalkParticipants) != count($aParticipants))
                continue;

            sort($aTalkParticipants);
            sort($aParticipants);

            if (array_values($aTalkParticipants) == array_values($aParticipants))
                $aResult[] = $aLot;
        }

        return !$bGetAll && !empty($aResult) ? current($aResult) : $aResult;
    }

    /**
	* Mark message as read in lot history
	*@param int $iJotId message id
	*@param int iProfileId	
	*/
	public function readMessage($iJotId, $iProfileId){
	    $aJotInfo = $this->getJotById($iJotId);
	    if (!empty($aJotInfo) && $this->deleteNewJot($iProfileId, $aJotInfo[$this->CNF['FIELD_MESSAGE_FK']], $iJotId))
            bx_alert($this->_oConfig->getObject('alert'), 'read_jot', $iJotId, $iProfileId, array('author_id' => $aJotInfo[$this->CNF['FIELD_MESSAGE_AUTHOR']], 'lot_id' => $aJotInfo[$this->CNF['FIELD_MESSAGE_FK']]));
    }

    /**
     * Mark all message as read in lot history for member
     * @param int $iLot lot id
     * @param int iProfileId
     * @return false
     */
	public function readAllMessages($iLot, $iProfileId){
		$CNF = &$this->_oConfig->CNF;
	    $aNew = $this->getNewJots($iProfileId, $iLot);
	    if (empty($aNew))
	        return false;

	    bx_alert($this->_oConfig->getObject('alert'), 'read_bulk_jot', $iLot, $iProfileId,
        array(
               'first_jot' => $aNew[$CNF['FIELD_NEW_JOT']],
               'count' => $aNew[$CNF['FIELD_NEW_JOT']],
               'lot_id' => $iLot
             ));

        $this->deleteNewJot($iProfileId, $iLot);
        $this->markNotificationAsRead($iProfileId, $iLot);
	}

	/**
	*Add new new jot to database  
	*@param int $iLotID  lot id
	*@param string $sMessage posted message 
	*@param int iProfile Id	owner of the message
	*@return  int affected rows
	*/
	public function addJot($iLotId, $sMessage, $iProfileId)
	{
		$sQuery = $this->prepare("INSERT INTO `{$this->CNF['TABLE_MESSAGES']}` 
												SET  `{$this->CNF['FIELD_MESSAGE']}` = ?, 
													 `{$this->CNF['FIELD_MESSAGE_FK']}` = ?, 
													 `{$this->CNF['FIELD_MESSAGE_AUTHOR']}` = ?,													 
													 `{$this->CNF['FIELD_MESSAGE_ADDED']}` = UNIX_TIMESTAMP()", $sMessage, $iLotId, $iProfileId);

		if (!$this->query($sQuery))
		    return false;
		
		$iJotId = $this -> lastId();
		$aParticipants = $this -> getParticipantsList($iLotId, true, $iProfileId);
		$this->markAsNewJot($aParticipants, $iLotId, $iJotId);
		return $iJotId;
	}
		
	/**
	*Create new chat/lot with list of participants
	*@param int iProfileId owner of the lot
	*@param string $sTitle lot title
	*@param int $iType type of the lot
	*@param string $sUrl url of the page
	*@param array $aParticipants list of participants
	*@return  int affected rows
	*/
    public function createNewLot($iProfileId, $aData, $aParticipants = array())
    {
        $CNF = &$this->_oConfig->CNF;

        // before to create lot
        bx_alert($this->_oConfig->getObject('alert'), 'create_lot_before', 0, $iProfileId, array(
            'data' => &$aData,
            'participants' => &$aParticipants
        ));

        $sTitle = isset($aData['title']) ? $aData['title'] : '';
        $iType = isset($aData['type']) ? (int)$aData['type'] : BX_IM_TYPE_PRIVATE;
        $sUrl = isset($aData['url']) ? $aData['url'] : '';
        $sPage = isset($aData['page']) ? $aData['page'] : '';
        $sClass = isset($aData['class']) ? $aData['class'] : BX_MSG_TALK_CLASS_CUSTOM;
        $iThread = isset($aData['thread']) ? (int)$aData['thread'] : BX_ATT_TYPE_CUSTOM;
        $iVisibility = isset($aData['visibility']) ? (int)$aData['visibility'] : 0;


        $mixedParticipants = !empty($aParticipants) ? implode(',', $aParticipants) : '';

        $sQuery = $this->prepare("INSERT INTO `{$this->CNF['TABLE_ENTRIES']}` 
										SET  `{$this->CNF['FIELD_TITLE']}` = ?,
													 `{$this->CNF['FIELD_TYPE']}` = ?,
													 `{$this->CNF['FIELD_AUTHOR']}` = ?,
													 `{$this->CNF['FIELD_ADDED']}` = UNIX_TIMESTAMP(),
													 `{$this->CNF['FIELD_PARTICIPANTS']}` = ?,
													 `{$this->CNF['FIELD_VISIBILITY']}` = ?,
													 `{$this->CNF['FIELD_CLASS']}` = ?,
													 `{$this->CNF['FIELD_PARENT_JOT']}` = ?,
													 `{$this->CNF['FIELD_URL']}` = ?", $sTitle, $iType, $iProfileId, $mixedParticipants, $iVisibility, $sClass, $iThread, $sUrl);

        return $this->query($sQuery) ? $this -> lastId() : false;
    }
	
	/**
	*Get list of types of member lots
	*@param int iProfileId
	*@param string $sParam keyword to filter lots
	*@return  array found lots types with lots count per each type
	*/
	public function getMemberLotsTypes($iProfileId, $sParam = ''){
		$sWhere = '';
		$aWhere = array();
		
		if ($iProfileId){
			$aSWhere[] = "FIND_IN_SET(:profile, `{$this->CNF['FIELD_PARTICIPANTS']}`)";
			$aWhere = array('profile' => $iProfileId);
		}		
		
		if ($sParam){
			$sParam = "%{$sParam}%";
			$aSWhere[] = " (`{$this->CNF['FIELD_TITLE']}` LIKE :title OR `{$this->CNF['FIELD_URL']}` LIKE :url OR `{$this->CNF['FIELD_TYPE']}` LIKE :type)";
			$aWhere = array_merge($aWhere, array('title' => $sParam, 'url' => $sParam, 'type' => $sParam));
		}	
				
		if (!empty($aWhere))
			$sWhere = "WHERE (" . implode(' AND ', $aSWhere) . ')';
			
		return $this-> getPairs("SELECT `{$this->CNF['FIELD_TYPE']}`, COUNT(*) as `count` 
			FROM `{$this->CNF['TABLE_ENTRIES']}` 
			{$sWhere}
			GROUP BY `{$this->CNF['FIELD_TYPE']}`", $this->CNF['FIELD_TYPE'], 'count', $aWhere);
	}

	/**
	*Get list of all existed types 
	*@return  array types
	*/
	public function getAllLotsTypes(){
		return $this -> getAll("SELECT * FROM `{$this->CNF['TABLE_TYPES']}` ORDER BY `{$this->CNF['FIELD_TYPE_ID']}` ASC");
	}
	
	/**
	*Get list of all existed types as pairs: Id - Value
	*@return  array types
	*/
	public function getLotsTypesPairs(){
		return $this -> getPairs("SELECT * FROM `{$this->CNF['TABLE_TYPES']}` ORDER BY `{$this->CNF['FIELD_TYPE_ID']}`", $this->CNF['FIELD_TYPE_ID'], $this->CNF['FIELD_TYPE_NAME']);
	}

	/**
	* Check if this ype of lot exists
	*@param int $iType type of the lot
	*@return boolean 
	*/
	public function isLotType($iType){
		return $this -> getOne("SELECT COUNT(*) FROM `{$this->CNF['TABLE_TYPES']}` WHERE `{$this->CNF['FIELD_TYPE_ID']}` = :type LIMIT 1", array('type' => $iType)) == 1;
	}
	
	/**
	* Get lot's participant list 
	*@param int $iLotId lot id
	*@param boolean $bArray if true, returns result as array, otherwise string with ids separated commas
	*@param int $bExcludeProfile allows to exclude profile from the list, usually it is owner
	*@return string/array
	*/
	public function getParticipantsList($iLotId, $bArray = true, $bExcludeProfile = 0){
		$sParticipants = $this -> getOne("SELECT `{$this->CNF['FIELD_PARTICIPANTS']}` FROM `{$this->CNF['TABLE_ENTRIES']}` WHERE `{$this->CNF['FIELD_ID']}` = :value", array('value' => $iLotId));
		
		if (!$sParticipants) 
			return [];
		
		$aParticipants = explode(',', $sParticipants);
		if ($bExcludeProfile && ($iId = array_search($bExcludeProfile, $aParticipants)) !== FALSE)
			unset($aParticipants[$iId]);
		
		return !$bArray ? implode(',', $aParticipants) : $aParticipants;
	}

	/**
	* Check if it is participant of the lot
	*@param int $iLotId lot id
	*@param int $iParticipantId profile id
	*@param boolean $bAsParticipant if true to check only participants list without lot owner
	*@return boolean 
	*/
	public function isParticipant($iLotId, $iParticipantId, $bAsParticipant = false)
	{
		$aParticipants = $this -> getParticipantsList($iLotId);
		if (array_search($iParticipantId, $aParticipants) !== FALSE)
			return true;
		
		return !$bAsParticipant ? $this -> getOne("SELECT COUNT(*) FROM `{$this->CNF['TABLE_ENTRIES']}` WHERE `{$this->CNF['FIELD_ID']}` = :lot AND `{$this->CNF['FIELD_AUTHOR']}` = :author LIMIT 1", array('lot' => (int)$iLotId, 'author' => (int)$iParticipantId)) == 1 : false;
	}
	
	/**
	* Add profile to lot's participants list
	*@param int $iLotId lot id
	*@param int $iParticipantId profile id
	*@return int affected rows
	*/
	public function addMemberToParticipantsList($iLotId, $iParticipantId){
		$sParticipants = $this -> getParticipantsList($iLotId, false /* as string list */);
		$sParticipants = $sParticipants ? "{$sParticipants},{$iParticipantId}" : $iParticipantId;
		return $this -> query("UPDATE `{$this->CNF['TABLE_ENTRIES']}` SET `{$this->CNF['FIELD_PARTICIPANTS']}` = :parts WHERE `{$this->CNF['FIELD_ID']}` = :id", array('parts' => $sParticipants, 'id' => $iLotId));
	}	

	/**
	* Remove profile from participants list
	*@param int $iLotId lot id
	*@param int $iParticipantId profile id
	*@return mixed false or affected rows
	*/
	public function removeParticipant($iLotId, $iParticipantId){
		$aParticipants = $this -> getParticipantsList($iLotId);
		$iKey = array_search($iParticipantId, $aParticipants);
		
		if ($iKey !== FALSE){
			unset($aParticipants[$iKey]);
			return $this -> saveParticipantsList($iLotId, $aParticipants);
		}
			
		return false;
	}

	/**
	* Get jots list for specified lot
	*@param int $iLotId lot id
	*@param int $iStart jot id from which start to get jots
	*@param string $sMode just posted or old jots from history 
	*@param int $iLimit number of jots to get
	*@return array of the jots
	*/
	public function getJotsByLotId($aData){  /* $iLotId, $iStart = BX_IM_EMPTY, $sMode = 'new', $iLimit = BX_IM_EMPTY, $bInclude = false */
        $iLotId = isset($aData['lot']) ? (int)$aData['lot'] : BX_IM_EMPTY;
        $iStart = isset($aData['start']) ? (int)$aData['start'] : BX_IM_EMPTY;
        $sMode = isset($aData['mode']) ? $aData['mode'] : 'new';
        $iLimit = isset($aData['limit']) ? (int)$aData['limit'] : BX_IM_EMPTY;
        $bInclude = isset($aData['include']) && $aData['include'];
        $sArea = isset($aData['area']) ? $aData['area'] : '';

        $sJoin = $sWhereJoin = $sLimit = '';
		$aSWhere[] = "`m`.`{$this->CNF['FIELD_MESSAGE_FK']}` = :lot_id ";
		$aBindings['lot_id'] = (int)$iLotId;
		$sInsideOrder = $sMode == 'all' ? 'ASC' : 'DESC';

		if ($iStart && $sMode !== 'all')
		{ 
			$sEqual = '';
			if ($bInclude)
				$sEqual='=';
				
			$aSWhere[] = "`m`.`{$this->CNF['FIELD_MESSAGE_ID']}` " . ($sMode == 'new' ? '>' . $sEqual : '<' . $sEqual) . " :start ";
			$aBindings['start'] = (int)$iStart;

            if ($sMode == 'new')
                $sInsideOrder = 'ASC';
        }

		if ($iLimit)
		{ 
			$sLimit = "LIMIT :limit";
			$aBindings['limit'] = (int)$iLimit;
		}

		if (!empty($aBindings))
			$sWhere = 'WHERE ' . implode(' AND ', $aSWhere);

		if ($sArea)
           list($sJoin, $sWhereJoin, $sFields, $sGroupBy) = $this->getJotsByArea($sArea);

		$sQuery = "SELECT `m`.* FROM `{$this->CNF['TABLE_MESSAGES']}` as `m`
                    {$sJoin}
			    	{$sWhere} {$sWhereJoin}	
				    ORDER BY `m`.`{$this->CNF['FIELD_MESSAGE_ID']}` {$sInsideOrder}
					{$sLimit}";

		//print_r($aBindings);

		return $this -> getAll( $iStart && $sMode == 'new' ? $sQuery : "({$sQuery}) ORDER BY `{$this->CNF['FIELD_MESSAGE_ID']}`", $aBindings);
	}

    function getJotsByArea($sArea){
        $CNF = &$this->_oConfig->CNF;

        $sGroupBy = $sJoin = $sWhere = $sFields = '';
        $iProfileId = bx_get_logged_profile_id();
        switch($sArea){
            case BX_MSG_TALK_TYPE_MR:
                $sUrl = BxDolProfile::getInstance($iProfileId)->getUrl();
                $sJoin = "LEFT JOIN `{$CNF['TABLE_JOT_REACTIONS']}` as `r` ON `m`.`{$CNF['FIELD_MESSAGE_ID']}` = `r`.`{$CNF['FIELD_REACT_JOT_ID']}`";
                $sWhere = "AND ((`r`.`{$CNF['FIELD_REACT_JOT_ID']}` IS NOT NULL AND `m`.`{$CNF['FIELD_MESSAGE_AUTHOR']}`= '{$iProfileId}') OR `m`.`{$CNF['FIELD_MESSAGE']}` LIKE '\"%" . '/' . bx_ltrim_str($sUrl, BX_DOL_URL_ROOT) . "\"')";
                break;
            case BX_MSG_TALK_TYPE_THREADS:
                break;
            case BX_MSG_TALK_TYPE_SAVED:
                $sJoin = "INNER JOIN `{$CNF['TABLE_SAVED_JOTS']}` as `s` ON `s`.`{$CNF['FSJ_ID']}` = `m`.`{$CNF['FIELD_MESSAGE_ID']}`";
                $sWhere = "AND `s`.`{$CNF['FSJ_ID']}` IS NOT NULL";
                break;
            case BX_MSG_TALK_TYPE_REPLIES:
                $sJoin = "LEFT JOIN `{$CNF['TABLE_MESSAGES']}` as `r` ON `r`.`{$CNF['FIELD_MESSAGE_ID']}` = `m`.`{$CNF['FIELD_MESSAGE_REPLY']}`";
                $sWhere = "AND `m`.`{$CNF['FIELD_MESSAGE_REPLY']}` <> 0 AND `r`.`{$CNF['FIELD_MESSAGE_AUTHOR']}`={$iProfileId}";
        }

        return [$sJoin, $sWhere, $sFields, $sGroupBy];
    }

    public function getUnreadMessages($iProfileId, $iLotId, $mixedLimit = 10){
        $sWhere = "WHERE `{$this->CNF['FIELD_MESSAGE_FK']}` = :lot_id";
        $aWhere = array('lot_id' => (int)$iLotId);
	    
		$aLotInfo = $this->getNewJots($iProfileId, $iLotId);
		if (empty($aLotInfo))
			return false;
		
		$sWhere .= " AND `{$this->CNF['FIELD_MESSAGE_ID']}` > :jot";
        $aWhere['jot'] = $aLotInfo[$this->CNF['FIELD_NEW_JOT']];
		
		$sLimit = '';
		if ($mixedLimit)
			$sLimit = "LIMIT " . (int)$mixedLimit;
        
	    $sQuery = "SELECT * FROM `{$this->CNF['TABLE_MESSAGES']}`
									{$sWhere}
									ORDER BY `{$this->CNF['FIELD_MESSAGE_ID']}`
									{$sLimit}";

        return $this->getAll($sQuery, $aWhere);
    }
	
	public function getPrevJot($iLotId, $iStart){
        $sWhere = "WHERE `{$this->CNF['FIELD_MESSAGE_FK']}` = :lot_id";
        $aWhere = array('lot_id' => (int)$iLotId);
	    if ($iStart){
            $sWhere .= " AND `{$this->CNF['FIELD_MESSAGE_ID']}` < :jot";
            $aWhere['jot'] = $iStart;
        }

	    $sQuery = "SELECT `{$this->CNF['FIELD_MESSAGE_ID']}` FROM `{$this->CNF['TABLE_MESSAGES']}`
									{$sWhere}
									ORDER BY `{$this->CNF['FIELD_MESSAGE_ID']}` DESC
									LIMIT 1";

        return $this -> getOne(  $sQuery, $aWhere);
    }

    public function getIntervalJotsCount($iLotId, $iJotId){
        $sQuery = "SELECT COUNT(*) 
                        FROM `{$this->CNF['TABLE_MESSAGES']}`
						WHERE `{$this->CNF['FIELD_MESSAGE_FK']}`=:lot_id 
						        AND `{$this->CNF['FIELD_MESSAGE_ADDED']}` > (UNIX_TIMESTAMP() - :interval)
						        AND `{$this->CNF['FIELD_MESSAGE_ID']}` < :jot";

        return $this -> getOne($sQuery, array('lot_id' => (int)$iLotId, 'interval' => $this->CNF['PARAM_MESSAGES_INTERVAL'] * 60, 'jot' => (int)$iJotId));
    }

	function getLotJotsCount($iLotId){
        if (!$iLotId)
            return false;

        // find the user with most number of unread messages
        $iUnread = $this->getOne("SELECT `{$this->CNF['FIELD_NEW_UNREAD']}` FROM `{$this->CNF['TABLE_NEW_MESSAGES']}`
                                      WHERE `{$this->CNF['FIELD_NEW_LOT']}`=:id
                                      ORDER BY `{$this->CNF['FIELD_NEW_UNREAD']}` DESC
                                      LIMIT 1", array('id' => $iLotId));

        $iTotal = $this-> getOne( "SELECT COUNT(*)
                                             FROM `{$this->CNF['TABLE_MESSAGES']}`                                             
                                             WHERE `{$this->CNF['FIELD_MESSAGE_FK']}`=:id 
                                             ", array('id' => $iLotId));

        return array('unread' => $iUnread, 'read' => ($iTotal - $iUnread));
    }
	/**
	* Get lot id by jot id 
	*@param int $iJotId jot id
	*@param boolean bIdOnly return id or array with info
	*@return mixed lot id or lot info in array
	*/
    public function getLotByJotId($iJotId, $bIdOnly = true){
        $iLotId = $this -> getOne("SELECT `{$this->CNF['FIELD_MESSAGE_FK']}`
						FROM `{$this->CNF['TABLE_MESSAGES']}` 
						WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = :jot LIMIT 1", array('jot' => $iJotId));

        if (!$iLotId)
            return false;

        return $bIdOnly ? $iLotId : $this -> getRow("SELECT * FROM `{$this->CNF['TABLE_ENTRIES']}` 
						WHERE `{$this->CNF['FIELD_ID']}` = :lot LIMIT 1", array('lot' => $iLotId));
    }
    
    public function getLotByJotPairs(&$aJotsList){
        $aJotsList = array_map('intval', $aJotsList);
        return !empty($aJotsList) ? $this -> getAll("SELECT `{$this->CNF['FIELD_MESSAGE_FK']}`, `{$this->CNF['FIELD_MESSAGE_ID']}` 
                                                               FROM `{$this->CNF['TABLE_MESSAGES']}` 
                                                               WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` IN (" . implode(',', $aJotsList) . ")") : false;
    }
	
    /**
	* Get lot id by parent id 
	*@param int $iJotId jot id	
	*@return mixed lot id or lot info in array
	*/
    public function getLotByParentId($iParentId){        
        return $this -> getRow("SELECT * FROM `{$this->CNF['TABLE_ENTRIES']}`
						WHERE `{$this->CNF['FIELD_PARENT_JOT']}`=:id LIMIT 1", array('id' => $iParentId));
    }

	/**
	* Get the latest posted jot(message)
	*@param int $iLotId lot id
	*@param int $iProfileId if not specified then just latest jot of any member
	*@param boolean $bNotTrash don't show trash message
	*@return array with jot info
	*/
	public function getLatestJot($iLotId, $iProfileId = 0, $bNotTrash = true){
		$sWhere = '';
		$aWhere['lot'] = $iLotId;
		
		if ($iProfileId)
		{
			$sWhere = " AND `{$this->CNF['FIELD_MESSAGE_AUTHOR']}` = :profile"; 
			$aWhere['profile'] = $iProfileId;
		}
		
		if ($bNotTrash)
			$sWhere .= " AND `{$this->CNF['FIELD_MESSAGE_TRASH']}` = 0";

		return $this -> getRow("SELECT *
			FROM `{$this->CNF['TABLE_MESSAGES']}` 
			WHERE  `{$this->CNF['FIELD_MESSAGE_FK']}` = :lot {$sWhere}
			ORDER BY `{$this->CNF['FIELD_MESSAGE_ID']}` DESC
			LIMIT 1", $aWhere);
	}

    public function getLatestJotsAuthors($iLotId, $iExcludeProfileId = 0, $iLimit = 3){
        $sWhere = '';
        $aWhere = ['lot' => $iLotId, 'limit' => $iLimit];

        if ($iExcludeProfileId)
        {
            $sWhere = " AND `{$this->CNF['FIELD_MESSAGE_ID']}` != :profile";
            $aWhere['profile'] = (int)$iExcludeProfileId;
        }

        return $this -> getPairs("SELECT `{$this->CNF['FIELD_MESSAGE_AUTHOR']}`, MAX(`{$this->CNF['FIELD_MESSAGE_ADDED']}`) as `{$this->CNF['FIELD_MESSAGE_ADDED']}`
			FROM `{$this->CNF['TABLE_MESSAGES']}`
			WHERE  `{$this->CNF['FIELD_MESSAGE_FK']}` = :lot {$sWhere}
            GROUP BY `{$this->CNF['FIELD_MESSAGE_AUTHOR']}`   
			ORDER BY `{$this->CNF['FIELD_MESSAGE_ADDED']}` DESC
			LIMIT :limit", $this->CNF['FIELD_MESSAGE_ADDED'], $this->CNF['FIELD_MESSAGE_AUTHOR'], $aWhere);
    }
	
	/**
	* Get jot(message) by id
	*@param int $iJotId id
	*@return array with jot info
	*/
	public function getJotById($iJotId){
		$sQuery = $this -> prepare("SELECT * FROM `{$this->CNF['TABLE_MESSAGES']}` WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = ?", $iJotId);
		return $this -> getRow($sQuery);
	}

    /**
     * Get messages number between two messages
     * @param $iLotId
     * @param $iJotStart
     * @param $iJotEnd
     * @return array with jot info
     */
    public function getJotsNumber($iLotId, $iJotStart, $iJotEnd = 0){
        $aWhere = array('id' => $iLotId, 'start' => $iJotStart);
        $sWhere = "`{$this->CNF['FIELD_MESSAGE_ID']}` > :start";
        if ($iJotEnd) {
            $sWhere = "`{$this->CNF['FIELD_MESSAGE_ID']}` BETWEEN :start AND :end";
            $aWhere['end'] = $iJotEnd;
        }

        return $this -> getOne("SELECT COUNT(*) FROM `{$this->CNF['TABLE_MESSAGES']}` 
                            WHERE `{$this->CNF['FIELD_MESSAGE_FK']}`=:id AND {$sWhere} 
                            ORDER BY `{$this->CNF['FIELD_MESSAGE_ID']}` ASC
                            ", $aWhere);
    }

	/**
	* Get all pages with comments block	
	*@return array list with pages
	*/	
	public function getPagesWithComments(){
		return $this -> getPairs("SELECT * FROM `sys_objects_cmts`", 'Name', 'BaseUrl');
	}

	/**
	* Check if the page already contains messenger block
	*@param $sPage page name 
	*@return boolean
	*/
	public function isBlockAdded($sPage){
		$sPage = bx_process_input($sPage);
		$sQuery = $this -> prepare("SELECT COUNT(*) FROM `sys_pages_blocks` WHERE `object` = ? AND `title` = '_bx_messenger_page_block_title_messenger'", $sPage);
		
		return $this -> getOne($sQuery) == 1;
	}

	/**
	* Add messenger block to the page
	*@param $sPage page name
	*@return affected rows
	*/
	public function addMessengerBlock($sPage){
		$sPage = bx_process_input($sPage);
		$aInfo = $this -> findCommentsBlock($sPage);
		
		if (!empty($aInfo))
				return $this -> query("INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
							  (:page, :cell, 'bx_messenger', '_bx_messenger_page_block_title_messenger', 0, 2147483647, 'service', 'a:3:{s:6:\"module\";s:12:\"bx_messenger\";s:6:\"method\";s:19:\"get_block_messenger\";s:6:\"params\";a:1:{i:0;s:6:\"{type}\";}}', 0, 0, :order, 0)",
							  array('page' => $sPage, 'cell' => $aInfo['cell_id'], 'order' => $aInfo['order'] + 1));

		return $this -> query("INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
							  (:page, 1, 'bx_messenger', '_bx_messenger_page_block_title_messenger', 0, 2147483647, 'service', 'a:3:{s:6:\"module\";s:12:\"bx_messenger\";s:6:\"method\";s:19:\"get_block_messenger\";s:6:\"params\";a:1:{i:0;s:6:\"{type}\";}}', 0, 0, 0, 0)",
							   array('page' => $sPage));
	}

	/**
	* Find comments block on the page
	*@param $sPage page name
	*@return array block info
	*/
	private function findCommentsBlock($sPage){
		$sPage = bx_process_input($sPage);
		
		$sQuery = $this -> prepare("SELECT * FROM `sys_pages_blocks` WHERE `object` = ? AND `title` LIKE '%comments%'", $sPage);
		return $this -> getRow($sQuery);
	}
	
	public function getUnreadJotsMessagesCount($iProfileId, $iLotId, $iParentId = 0){
		if (!(int)$iLotId)
		    return false;
		
		return $this->getNewJots($iProfileId, $iLotId, true);
	}

    function getLotsWithUnreadMessages($iProfileId){
	     if (!$iProfileId)
	         return false;

         return $this->getPairs("SELECT `{$this->CNF['FIELD_NEW_UNREAD']}`, `{$this->CNF['FIELD_NEW_LOT']}` 
                                      FROM `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                      WHERE `{$this->CNF['FIELD_NEW_PROFILE']}`=:profile AND `{$this->CNF['FIELD_NEW_UNREAD']}` > 0                                       
                                      ", $this->CNF['FIELD_NEW_LOT'], $this->CNF['FIELD_NEW_UNREAD'], array('profile' => $iProfileId));
    }

	function getNewJots($iProfileId, $iLotId, $bCount = false){
        $aInfo = $this-> getRow("SELECT * 
                                           FROM `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                           WHERE `{$this->CNF['FIELD_NEW_PROFILE']}`=:profile AND `{$this->CNF['FIELD_NEW_LOT']}`=:lot
                                          ", array('lot' => $iLotId, 'profile' => $iProfileId));
        if (empty($aInfo))
            return 0;

        return $bCount ? (int)$aInfo[$this->CNF['FIELD_NEW_UNREAD']] : $aInfo;
    }

    function getForWhomJotIsNew($iLotId, $iJotId){
	    if (!$iLotId && !$iJotId)
	        return array();

        return $this->getColumn("SELECT `{$this->CNF['FIELD_NEW_PROFILE']}` 
                                            FROM `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                            WHERE `{$this->CNF['FIELD_NEW_JOT']}` <=:jot AND `{$this->CNF['FIELD_NEW_LOT']}`=:lot
                                         ", array('jot' => $iJotId, 'lot' => $iLotId));
    }

    private function addNewJotItem($iProfileId, $iLotId, $iJotId){
	    if (!(int)$iProfileId)
	        return false;

        $iJotNumber = 0;
        $iLastJot = $iJotId;
        $aJotInfo = $this->getNewJots($iProfileId, $iLotId);
	    if (!empty($aJotInfo)) {
            $iJotNumber = (int)$aJotInfo[$this->CNF['FIELD_NEW_UNREAD']];
            $iLastJot = (int)$aJotInfo[$this->CNF['FIELD_NEW_JOT']];
        }

	    return $this-> query("REPLACE INTO `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                            SET 
                                            `{$this->CNF['FIELD_NEW_PROFILE']}`=:profile,
                                            `{$this->CNF['FIELD_NEW_UNREAD']}`=:number,
                                            `{$this->CNF['FIELD_NEW_LOT']}`=:lot,
                                            `{$this->CNF['FIELD_NEW_JOT']}`=:jot
                                         ", array(
            'profile' => $iProfileId,
            'lot' => $iLotId,
            'number' => $iJotNumber + 1,
            'jot' => $iLastJot
        ));
    }
    function markAsNewJot($mixedProfile, $iLotId, $iJotId){
	    if (is_array($mixedProfile)){
	        foreach($mixedProfile as &$iProfileId)
                $this->addNewJotItem($iProfileId, $iLotId, $iJotId);
        } elseif ((int)$mixedProfile)
                $this->addNewJotItem($mixedProfile, $iLotId, $iJotId);

        return $this -> query("UPDATE `{$this->CNF['TABLE_ENTRIES']}` 
                                            SET `{$this->CNF['FIELD_UPDATED']}` = UNIX_TIMESTAMP() 
                                            WHERE `{$this->CNF['FIELD_ID']}` = :id", array('id' => $iLotId));
    }

    function deleteNewJot($iProfileId, $iLotId = 0, $iJotId = 0){
        if ($iJotId) {
           $iLotId = $iLotId ? $iLotId : $this->getLotByJotId($iJotId);
           $aNewJotInfo = $this->getNewJots($iProfileId, $iLotId);
           if (empty($aNewJotInfo) || ((int)$aNewJotInfo[$this->CNF['FIELD_NEW_JOT']] > (int)$iJotId))
                return false;

           $iCount = (int)$this->getOne("SELECT COUNT(*) FROM `{$this->CNF['TABLE_MESSAGES']}`
									WHERE `{$this->CNF['FIELD_MESSAGE_FK']}`=:lot AND `{$this->CNF['FIELD_MESSAGE_ID']}` > :jot
									", array('lot' => $iLotId, 'jot' => $iJotId));
           if ($iCount)
               return $this-> query("REPLACE INTO `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                            SET 
                                            `{$this->CNF['FIELD_NEW_PROFILE']}`=:profile,
                                            `{$this->CNF['FIELD_NEW_UNREAD']}`=:number,
                                            `{$this->CNF['FIELD_NEW_JOT']}`=:jot,
                                            `{$this->CNF['FIELD_NEW_LOT']}`=:lot                                            
                                         ", array(
                                            'profile' => $iProfileId,
                                            'lot' => $iLotId,
                                            'number' => $iCount,
                                            'jot' => $iJotId
                                        ));
        }

	    return $iLotId ?
                        $this->query("DELETE FROM `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                                        WHERE `{$this->CNF['FIELD_NEW_LOT']}`=:lot AND `{$this->CNF['FIELD_NEW_PROFILE']}`=:profile                                        
                                                     ", array('profile' => $iProfileId, 'lot' => $iLotId))
                       :
                        $this-> query("DELETE FROM `{$this->CNF['TABLE_NEW_MESSAGES']}` 
                                                        WHERE `{$this->CNF['FIELD_NEW_PROFILE']}`=:profile                                        
                                                     ", array('profile' => $iProfileId));
	}

    public function searchMessage($sParam, $iProfileId = 0, $iLotId = 0){
        $aResult = array();
        if (!$sParam)
            return $aResult;

        $aParams = preg_split('/[\s]/', $sParam, -1, PREG_SPLIT_NO_EMPTY);
        $sCriteria = implode('%', $aParams);
        $aWhere = array('criteria' => "%{$sCriteria}%");

        if ($iLotId){
            $sWhere = " AND `j`.`{$this->CNF['FIELD_MESSAGE_FK']}`=:id";
            $aWhere['id'] = (int)$iLotId;
        }

        if ($iProfileId){
            $sWhere = " AND (`l`.`{$this->CNF['FIELD_PARTICIPANTS']}` REGEXP '(^|,){$iProfileId}(,|$)' OR `l`.`{$this->CNF['FIELD_AUTHOR']}`=:profile)";
            $aWhere['profile'] = (int)$iProfileId;
        }

        return $this->getPairs("SELECT `j`.`{$this->CNF['FIELD_MESSAGE_ID']}`, `j`.`{$this->CNF['FIELD_MESSAGE_FK']}`
			 FROM `{$this->CNF['TABLE_MESSAGES']}` as `j`
			 RIGHT JOIN `{$this->CNF['TABLE_ENTRIES']}` as `l` on `l`.`{$this->CNF['FIELD_ID']}` = `j`.`{$this->CNF['FIELD_MESSAGE_FK']}` 
             WHERE `j`.`{$this->CNF['FIELD_MESSAGE']}` LIKE :criteria {$sWhere}", $this->CNF['FIELD_MESSAGE_ID'], $this->CNF['FIELD_MESSAGE_FK'], $aWhere);
    }

    function getMyTalksIdList($iProfileId){
	    if (!$iProfileId)
	        return [];

	    $sField = $this->CNF['FIELD_ID'];
	    $aList = $this->getMyLots($iProfileId); 
        return array_map(function($aTalk) use ($sField){
                                                       return $aTalk[$sField];
                                                      }, $aList);
	}
	/**
	* Get all member's lots
	*@param int $iProfileId
	*@param array $aParams filter params
	*@param array $aReturn may contain special values for search function
	*@return array list of lots
	*/
    public function getMyLots($iProfileId, $aParams = [], &$aReturn = [])
    {
        $sOrAddon = $sJoin = $sWhere = '';
        $aSWhere = array();
        $aWhere = array('profile' => (int)$iProfileId, 'parts' => '(^|,)' . (int)$iProfileId . '(,|$)');

        // talks groups
        if (isset($aParams['group']) && (int)$aParams['group']) {
            $aSWhere[] = " `g`.`{$this->CNF['FMGL_GROUP_ID']}`=:group_id ";
            $aWhere['group_id'] = (int)$aParams['group'];

            $sOrAddon = " OR `l`.`{$this->CNF['FIELD_TYPE']}` = " . BX_IM_TYPE_PUBLIC;
        }

        //if threads
        if (isset($aParams['threads']))
            $aSWhere[] = " `l`.`{$this->CNF['FIELD_PARENT_JOT']}` !=0 ";

        $sParam = isset($aParams['term']) && $aParams['term'] ? $aParams['term'] : '';
        if ($sParam) {
            $aParamWhere = [];
            if ($this->_oConfig->isSearchCriteria(BX_SEARCH_CRITERIA_TITLES)) {
                $aParamWhere[] = "`l`.`{$this->CNF['FIELD_TITLE']}` LIKE :title";
                $aWhere['title'] = "%{$sParam}%";
            }

            if ($this->_oConfig->isSearchCriteria(BX_SEARCH_CRITERIA_PARTS)) {
                $aProfiles = BxDolService::call('system', 'profiles_search', array($sParam), 'TemplServiceProfiles');
                if (!empty($aProfiles)) {
                    $aRegexp = array();
                    foreach ($aProfiles as &$aProfile)
                        $aRegexp[] = "(^|,){$aProfile['value']}(,|$)";

                    if (!empty($aRegexp)) {
                        $aWhere['part_search'] = implode('|', $aRegexp);
                        $aParamWhere[] = "`{$this->CNF['FIELD_PARTICIPANTS']}` REGEXP :part_search";
                    }
                }
            }

            if ($this->_oConfig->isSearchCriteria(BX_SEARCH_CRITERIA_CONTENT)) {
                $aSelectedLots = $this->searchMessage($sParam, $iProfileId);
                if (!empty($aSelectedLots)) {
                    $aParamWhere[] = "`l`.`{$this->CNF['FIELD_ID']}` IN (" . implode(',', array_unique($aSelectedLots)) . ")";
                    $aReturn['jots_list'] = $aSelectedLots;
                }
            }

            if (!empty($aParamWhere))
                $aSWhere[] = '(' . implode(' OR ', $aParamWhere) . ')';
        	else
                return false;
        }

        if (!empty($aParamWhere))
            $aSWhere[] = '(' . implode(' OR ', $aParamWhere) . ')';

        if (isset($aParams['type']) && $aParams['type']) {
            if (is_numeric($aParams['type'])) {
                $aSWhere[] = " `l`.`{$this->CNF['FIELD_TYPE']}` = :type AND `l`.`{$this->CNF['FIELD_PARENT_JOT']}` = 0 ";
                $aWhere['type'] = (int)$aParams['type'];
            } else if (is_array($aParams['type'])) {
                $aSWhere[] = " `l`.`{$this->CNF['FIELD_TYPE']}` IN (" . implode(',', $aParams['type']) . ")  AND `l`.`{$this->CNF['FIELD_PARENT_JOT']}` = 0 ";
            }
        }

        $bStar = isset($aParams['star']) && $aParams['star'] === true;
        if ($bStar) {
            $sJoin .= "INNER JOIN `{$this->CNF['TABLE_USERS_INFO']}` as `u` ON `u`.`{$this->CNF['FIELD_INFO_LOT_ID']}` = `l`.`{$this->CNF['FIELD_ID']}` AND `u`.`{$this->CNF['FIELD_INFO_USER_ID']}`=:profile";
            $aSWhere[] = "`u`.`{$this->CNF['FIELD_INFO_STAR']}` = 1";
        }

        if (isset($aParams['visibility'])) {
            if ($aParams['visibility'] !== BX_MSG_VISIBILITY_ALL) {
                $aWhere['visibility'] = $aParams['visibility'];
                $aSWhere[] = " `l`.`{$this->CNF['FIELD_VISIBILITY']}` = :visibility";
            }
        } else {
            $aSWhere[] = " `l`.`{$this->CNF['FIELD_VISIBILITY']}` = :visibility";
            $aWhere['visibility'] = BX_MSG_VISIBILITY_VISIBLE;
        }

        $sFields = $sHaving = '';
        $iLastLot = isset($aParams['last_lot']) ? (int)$aParams['last_lot'] : 0;
        if ($iLastLot) {
            $aWhere['last_lot'] = $iLastLot;
            $aSWhere[] = "`l`.`{$this->CNF['FIELD_ID']}` < :last_lot";
        }

        $iLot = isset($aParams['lot']) && (int)$aParams['lot'] ? (int)$aParams['lot'] : 0;
        if ($iLot) {
            $aWhere['lot'] = $iLot;
            $aSWhere[] = "`l`.`{$this->CNF['FIELD_ID']}` = :lot";
        }

        if (!empty($aSWhere))
            $sWhere = ' AND ' . implode(' AND ', $aSWhere);

        $aWhere['start'] = isset($aParams['start']) ? (int)$aParams['start'] : 0;
        $aWhere['per_page'] = isset($aParams['per_page']) ? (int)$aParams['per_page'] : (int)$this->CNF['MAX_LOTS_NUMBER'];
        $sLimit = "LIMIT :start, :per_page";

        $bShowLeft = isset($aParams['left']);
        $sLeft = "";
        if ($bShowLeft)
            $sLeft = "SQL_CALC_FOUND_ROWS";

        $aResult = $this->getAll("SELECT 
                                            {$sLeft}
                                            {$sFields}   
                                            `l`.*,
                                             IF (`g`.`{$this->CNF['FMGL_GROUP_ID']}` IS NOT NULL, `g`.`{$this->CNF['FMGL_GROUP_ID']}`, 0) as `{$this->CNF['FMGL_GROUP_ID']}`,
                                             IF (`l`.`{$this->CNF['FIELD_UPDATED']}` = 0, `l`.`{$this->CNF['FIELD_ADDED']}`, `l`.`{$this->CNF['FIELD_UPDATED']}`) as `order` 
                                             FROM `{$this->CNF['TABLE_ENTRIES']}` as `l`
                                             LEFT JOIN `{$this->CNF['TABLE_GROUPS_LOTS']}` as `g` ON `g`.`{$this->CNF['FMGL_LOT_ID']}` = `l`.`{$this->CNF['FIELD_ID']}`
                                             {$sJoin}                                             
                                             WHERE (`l`.`{$this->CNF['FIELD_PARTICIPANTS']}` REGEXP :parts OR `l`.`{$this->CNF['FIELD_AUTHOR']}`=:profile {$sOrAddon}) {$sWhere}
                                             {$sHaving}
                                             ORDER BY `order` DESC
                                         {$sLimit}", $aWhere);

        if ($bShowLeft)
            $aReturn['left'] = (int)$this->getOne("SELECT FOUND_ROWS()") - $aWhere['start'];

        return $aResult;
    }
	
	/**
	* Check if the title of the lot type must contain link
	*@param int $iType
	*@return boolean
	*/
	public function isLinkedTitle($iType){
		$sQuery = $this -> prepare("SELECT `{$this->CNF['FIELD_TYPE_LINKED']}` FROM `{$this->CNF['TABLE_TYPES']}` WHERE `{$this->CNF['FIELD_TYPE_ID']}` = ? LIMIT 1", $iType);
		return (int)$this -> getOne($sQuery) == 1;	
	}

	/**
	* Get time when member was online  
	*@param int  $iProfileId
	*@return boolean
	*/
	public function lastOnline($iProfileId)
	{
	   $sSql = $this -> prepare("SELECT 
				IF (`ts`.`date` != '', `ts`.`date`, `ta`.`logged`) as `logged` 
			FROM `sys_profiles` AS `tp` 
			INNER JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` 
			LEFT JOIN `sys_sessions` AS `ts` ON `tp`.`account_id`=`ts`.`user_id` 
			WHERE 
				`tp`.`id` = ? AND 
				`ta`.`profile_id`=`tp`.`id`
			LIMIT 1", $iProfileId);
		
		return $this -> getOne($sSql);
	}

	/**
	* Delete all profiles info from lots and jots
	*@param int  $iProfileId
    *@param bool $bTalks if true to remove the talk where removed user participates
	*@return int affected rows
	*/
	public function deleteProfileInfo($iProfileId, $bTalks = false){
		$bResult = true;
		
		$aWhere['profile'] = (int)$iProfileId;

		$bResult &= $this-> query("DELETE
			FROM `{$this->CNF['TABLE_ENTRIES']}`
			WHERE `{$this->CNF['FIELD_AUTHOR']}`=:profile", $aWhere);

		$aJots = $this-> getAll("SELECT *
			FROM `{$this->CNF['TABLE_MESSAGES']}` 
			WHERE `{$this->CNF['FIELD_MESSAGE_AUTHOR']}`=:profile", $aWhere);
		
		foreach($aJots as &$aJot)
           $this->clearJotsConnections($aJot[$this->CNF['FIELD_MESSAGE_ID']], $aJot[$this->CNF['FIELD_MESSAGE_FK']]);
			
		$bResult &= $this-> query("DELETE
			FROM `{$this->CNF['TABLE_MESSAGES']}` 
			WHERE `{$this->CNF['FIELD_MESSAGE_AUTHOR']}`=:profile", $aWhere);

		if ($bTalks)
            $bResult &= (bool)$this->query("DELETE 
                                           FROM `{$this->CNF['TABLE_ENTRIES']}`
                                           WHERE FIND_IN_SET(:profile, `{$this->CNF['FIELD_PARTICIPANTS']}`) AND `type`=:type", array_merge($aWhere, ['type' => BX_IM_TYPE_PRIVATE]));

		$aLots = $this->getAll("SELECT * 
			FROM `{$this->CNF['TABLE_ENTRIES']}` 
			WHERE FIND_IN_SET(:profile, `{$this->CNF['FIELD_PARTICIPANTS']}`)", $aWhere);

        if (empty($aLots))
				return $bResult;

        foreach ($aLots as &$aLot) {
            $bResult &= $this->removeParticipant($aLot[$this->CNF['FIELD_ID']], $iProfileId);
		}

		
		return $bResult;
	}

	/**
	* Add attachment to the jot
	*@param int $iJotId jot id
	*@param text mixedContent attachment content
	*@param int sType attachment type
	*@return int affected rows
	*/

    public function addAttachment($iJotId, $aAttachments, $mixedType = false){
        $iJotId = (int)$iJotId;
        if (!$iJotId || !($aJotInfo = $this -> getJotById($iJotId)) || empty($aAttachments))
            return false;

        if ($mixedType !== false){
            if (empty($aJotInfo[$this->CNF['FIELD_MESSAGE_AT']]))
                $aAttachments = array($mixedType => $aAttachments);
            else
                $aAttachments = @unserialize($aJotInfo[$this->CNF['FIELD_MESSAGE_AT']]) + array($mixedType => $aAttachments);
        }

        $sQuery = $this->prepare("UPDATE `{$this->CNF['TABLE_MESSAGES']}` 
												SET  
													 `{$this->CNF['FIELD_MESSAGE_AT']}` = ?
												WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = ?", @serialize($aAttachments), $iJotId);

        return $this -> query($sQuery);
    }
	
	/**
	* Add attachment to the jot
	*@param int  $iJotId jot id
	*@param int  $iProfileId profile id
	*@param string $sMessage
	*@return int affected rows
	*/
	public function editJot($iJotId, $iProfileId, $sMessage){
		$iJotId = (int)$iJotId;
		$aJotInfo = array();
			
		if (!$iJotId || !($aJotInfo = $this -> getJotById($iJotId)) || !$sMessage)
			return false;
		
		$sWhere = '';
		if ($aJotInfo[$this->CNF['FIELD_MESSAGE_AT_TYPE']] == BX_ATT_TYPE_REPOST)
			$sWhere = ",`{$this->CNF['FIELD_MESSAGE_AT_TYPE']}` = '', `{$this->CNF['FIELD_MESSAGE_AT']}` = ''";

        $sMessage = clear_xss($sMessage);
		$sQuery = $this->prepare("UPDATE `{$this->CNF['TABLE_MESSAGES']}` 
												SET  `{$this->CNF['FIELD_MESSAGE']}` = ?,
													 `{$this->CNF['FIELD_MESSAGE_LAST_EDIT']}` = UNIX_TIMESTAMP(),
													 `{$this->CNF['FIELD_MESSAGE_EDIT_BY']}` = ?
													 {$sWhere}
												WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = ?", $sMessage, $iProfileId, $iJotId);
		
		return $this -> query($sQuery);
	}
	
	/**
	* Check if the Jot already has attachment
	*@param int  $iJotId jot id
	*@param string $sType attachment type
	*@return int original attachment Id
	*/
    public function hasAttachment($iJotId, $sType = BX_ATT_TYPE_REPOST){
        $aValues = $this->getRow("SELECT
									`{$this->CNF['FIELD_MESSAGE_AT']}`, 
                                    `{$this->CNF['FIELD_MESSAGE_AT_TYPE']}`
									FROM `{$this->CNF['TABLE_MESSAGES']}` 
									WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = :id", array('id' => $iJotId));

        if (!isset($aValues[$this->CNF['FIELD_MESSAGE_AT']]))
            return false;

        if ($aValues[$this->CNF['FIELD_MESSAGE_AT_TYPE']]) {
            if ($aValues[$this->CNF['FIELD_MESSAGE_AT_TYPE']] == $sType && (int)$aValues[$this->CNF['FIELD_MESSAGE_AT']] && $aValues[$this->CNF['FIELD_MESSAGE_AT']] !== $iJotId)
                return (int)$aValues[$this->CNF['FIELD_MESSAGE_AT']];

            return false;
        }

        $mixedResult = @unserialize($aValues[$this->CNF['FIELD_MESSAGE_AT']]);
        if (is_array($mixedResult)) {
            if (isset($mixedResult[$sType]) && (int)$mixedResult[$sType] && (int)$mixedResult[$sType] != $iJotId)
                return (int)$mixedResult[$sType];
        }
		
        return false;
    }
	
	public function updateFiles($iJotId, $mixedValues){
	    $sQuery = $this->prepare("UPDATE `{$this->CNF['OBJECT_STORAGE']}` SET " . $this->arrayToSQL($mixedValues) . " WHERE `{$this->CNF['FIELD_ST_ID']}` = ?", $iJotId);
		return $this -> query($sQuery);
	}
	
    public function getJotFiles($iJot, $bCount = false, $iProfileId = 0){
        $sProfileWhere = '';
        if ((int)$iProfileId)
            $sProfileWhere = "AND `t`.`{$this->CNF['FJMT_USER_ID']}`=" . (int)$iProfileId;

        return !$bCount ?
            $this->getAll("SELECT `f`.*, IF (`t`.`{$this->CNF['FJMT_COLLAPSED']}` IS NULL, 0, 1) as `{$this->CNF['FJMT_COLLAPSED']}` 
                                        FROM `{$this->CNF['OBJECT_STORAGE']}` as `f` 
                                        LEFT JOIN `{$this->CNF['TABLE_JOTS_MEDIA_TRACKER']}` as `t` ON `f`.`{$this->CNF['FIELD_ST_ID']}`=`t`.`{$this->CNF['FJMT_FILE_ID']}` {$sProfileWhere} 
                                        WHERE `{$this->CNF['FIELD_ST_JOT']}` = :id", array('id' => $iJot)) :
                                        $this->getOne("SELECT COUNT(*) FROM `{$this->CNF['OBJECT_STORAGE']}` WHERE `{$this->CNF['FIELD_ST_JOT']}` = :id", array('id' => $iJot));
    }
	
	private function removeFilesByJotId($iJotId){
		 $aFiles = $this -> getJotFiles($iJotId);
		 if (empty($aFiles))
			 return false;
		 
		 $oStorage = BxDolStorage::getObjectInstance($this->CNF['OBJECT_STORAGE']);
		 $bResult = true;
		 foreach($aFiles as &$aFile) {
             $bResult &= $oStorage->deleteFile($aFile[$this->CNF['FIELD_ST_ID']], $aFile[$this->CNF['FIELD_ST_AUTHOR']]);
             $this->removeMediaTracker($aFile[$this->CNF['FIELD_ST_ID']]);
         }
		  
		  return $bResult;
	}

    public function removeFileFromJot($iJotId, $iFileId){
        $aJotInfo = $this->getJotById($iJotId);
        $aAttachment = $aFiles = [];
        if ($aJotInfo[$this->CNF['FIELD_MESSAGE_AT_TYPE']] === BX_ATT_TYPE_FILES) {
            $aFiles = explode(',', $aJotInfo[$this->CNF['FIELD_MESSAGE_AT']]);
        } else
            if (!$aJotInfo[$this->CNF['FIELD_MESSAGE_AT_TYPE']] && isset($aJotInfo[$this->CNF['FIELD_MESSAGE_AT']])) {
                $aAttachment = @unserialize($aJotInfo[$this->CNF['FIELD_MESSAGE_AT']]);
                if (isset($aAttachment[BX_ATT_TYPE_FILES])){
                    $mixedFiles = $aAttachment[BX_ATT_TYPE_FILES];
                    if (is_string($mixedFiles))
                        $aFiles = explode(',', $mixedFiles);
                    else if (is_array($mixedFiles))
                        $aFiles = $mixedFiles;
                } else
                    return false;
            }

        $oStorage = BxDolStorage::getObjectInstance($this->CNF['OBJECT_STORAGE']);
        $aFile = $oStorage -> getFile($iFileId);
        $sFileName = $aFile[$this->CNF['FIELD_ST_NAME']];

        if (!empty($aFiles))
            $aFiles = array_filter($aFiles, function($sValue) use ($sFileName){
               return $sValue !== $sFileName;
            });
        else
            return false;

        $aAttachment[BX_ATT_TYPE_FILES] = $aFiles;
        $sQuery = $this->prepare("UPDATE `{$this->CNF['TABLE_MESSAGES']}` 
												SET  
													 `{$this->CNF['FIELD_MESSAGE_AT_TYPE']}` = '',
													 `{$this->CNF['FIELD_MESSAGE_AT']}` = ?
												WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = ?", @serialize($aAttachment), $iJotId);

        return $this -> query($sQuery);
    }
	
	public function isFileVendor($iFileId, $iProfileId){
		$oStorage = BxDolStorage::getObjectInstance($this->CNF['OBJECT_STORAGE']);
		$aFile = $oStorage -> getFile($iFileId);
		return $aFile[$this->CNF['FIELD_ST_AUTHOR']] == $iProfileId;
	}
	
	public function isEmptyJotMessage($iJotId){
		$aJotInfo = $this -> getJotById($iJotId);
		
		return empty($aJotInfo) || !$aJotInfo['FIELD_MESSAGE'];
	}
	
	public function getFirstUnreadJot($iProfileId, $iLotId){
		if (!$iLotId)
		    return 0;

		$aUnreadJots = $this->getNewJots($iProfileId, $iLotId);
		return !empty($aUnreadJots) ? (int)$aUnreadJots[$this->CNF['FIELD_NEW_JOT']] : 0;
	}

    /**
     * @param int $iObjectId item's object ID
     * @param string $sType module's name from sys_modules
     * @param int $iProfileId comments' author
     * @param int $iStart get comments from position
     * @param int $iPerPage number of the comments to get at once
     * @return array list of the comments
     *
     */
    public function getLiveComments($iObjectId, $sType, $iProfileId, $iStart = 0, $iPerPage = 0){
        $aWhere = array('object' => $iObjectId, 'type' => $sType);
        $sLimit = $sAuthor = '';
        if ((int)$iProfileId) {
            $aWhere['author'] = (int)$iProfileId;
            $sAuthor = "AND `{$this->CNF['FIELD_LCMTS_AUTHOR']}`=:author";
        }

        if ($iPerPage) {
            $aWhere['start'] = (int)$iStart;
            $aWhere['per_page'] = (int)$iPerPage;
            $sLimit = "LIMIT :start, :per_page";
        }

        $aComments = $this -> getAll("SELECT 
                                                  SQL_CALC_FOUND_ROWS
                                                  `{$this->CNF['FIELD_LCMTS_ID']}`,
                                                  `{$this->CNF['FIELD_LCMTS_TEXT']}`,
                                                  `{$this->CNF['FIELD_LCMTS_AUTHOR']}`,
                                                  `{$this->CNF['FIELD_LCMTS_DATE']}`,
                                                  `{$this->CNF['FIELD_LCMTS_OBJECT_ID']}`
                                                 FROM `{$this->CNF['TABLE_LIVE_COMMENTS']}` as `c`  
                                                 LEFT JOIN `{$this->CNF['TABLE_CMTS_OBJECTS']}` as `s` ON `s`.`{$this->CNF['FIELD_COBJ_ID']}` = `c`.`{$this->CNF['FIELD_LCMTS_SYS_ID']}`                                                   
                                                 WHERE `s`.`{$this->CNF['FIELD_COBJ_MODULE']}` = :type AND `{$this->CNF['FIELD_LCMTS_OBJECT_ID']}` = :object {$sAuthor}
                                                 ORDER BY `{$this->CNF['FIELD_LCMTS_ID']}` DESC
                                                 {$sLimit}",
            $aWhere);
        return array('result' => $aComments, 'total' => (int)$this->getOne("SELECT FOUND_ROWS()"));
    }

    /**
     * @param string $sText message body
     * @param int $iObjectId item's object ID
     * @param string $sName module's name from sys_modules
     * @param int $iProfileId comments' author
     * @param int $iDate comments' time
     * @return mixed last added comments id or false
     *
     */

    public function addLiveComment($sText, $iObjectId, $sName, $iProfileId, $iDate = 0){
        $iSystem = $this -> getOne("SELECT `{$this->CNF['FIELD_COBJ_ID']}` 
                                            FROM `{$this->CNF['TABLE_CMTS_OBJECTS']}`
                                            WHERE `{$this->CNF['FIELD_COBJ_MODULE']}`=:name LIMIT 1", array('name' => $sName));
        if (!$iSystem)
            return false;

        $sQuery = $this -> prepare("REPLACE INTO `{$this->CNF['TABLE_LIVE_COMMENTS']}`
                                   SET 
                                         `{$this->CNF['FIELD_LCMTS_TEXT']}`=?,
                                         `{$this->CNF['FIELD_LCMTS_AUTHOR']}`=?,
                                         `{$this->CNF['FIELD_LCMTS_DATE']}`=?,                                         
                                         `{$this->CNF['FIELD_LCMTS_OBJECT_ID']}`=?,
                                         `{$this->CNF['FIELD_LCMTS_SYS_ID']}`=?
                                   ", $sText, $iProfileId, $iDate ? $iDate : time(), $iObjectId, $iSystem);

        return $this -> query($sQuery) ? $this -> lastId() : false;
    }

    public function removeLiveComment($iObjectId, $iProfileId){
        return $this -> query("DELETE FROM `{$this->CNF['TABLE_LIVE_COMMENTS']}` 
                              WHERE `{$this->CNF['FIELD_LCMTS_AUTHOR']}`=:author AND `{$this->CNF['FIELD_LCMTS_ID']}`=:object_id", array('author' => $iProfileId, 'object_id' => $iObjectId));
    }

    public function getLotFiles($iLotId, $iStart = 0, $iPerPage = 0){
        $aWhere = array('id' => $iLotId);

        $sLimit = '';
        if ($iPerPage) {
            $aWhere['start'] = (int)$iStart;
            $aWhere['per_page'] = (int)$iPerPage;
            $sLimit = "LIMIT :start, :per_page";
        }

        return $this->getAll("SELECT `s`.* 
                                         FROM `{$this->CNF['OBJECT_STORAGE']}` as `s`
                                         LEFT JOIN `{$this->CNF['TABLE_MESSAGES']}` as `j` ON `s`.`{$this->CNF['FIELD_ST_JOT']}` = `j`.`{$this->CNF['FIELD_MESSAGE_ID']}`
                                         LEFT JOIN `{$this->CNF['TABLE_ENTRIES']}` as `l` ON `l`.`{$this->CNF['FIELD_ID']}` = `j`.`{$this->CNF['FIELD_MESSAGE_FK']}` 
                                         WHERE `l`.`{$this->CNF['FIELD_ID']}` = :id 
                                         ORDER BY `s`.`{$this->CNF['FIELD_ST_ADDED']}` DESC
                                         {$sLimit}
                                         ", $aWhere);
    }

    public function getLotFilesCount($iLot){
        return (int)$this->getOne("SELECT COUNT(*)
                                         FROM `{$this->CNF['OBJECT_STORAGE']}` as `s`
                                         LEFT JOIN `{$this->CNF['TABLE_MESSAGES']}` as `j` ON `s`.`{$this->CNF['FIELD_ST_JOT']}` = `j`.`{$this->CNF['FIELD_MESSAGE_ID']}`
                                         LEFT JOIN `{$this->CNF['TABLE_ENTRIES']}` as `l` ON `l`.`{$this->CNF['FIELD_ID']}` = `j`.`{$this->CNF['FIELD_MESSAGE_FK']}` 
                                         WHERE `l`.`{$this->CNF['FIELD_ID']}` = :id 
                                         ORDER BY `s`.`{$this->CNF['FIELD_ST_ADDED']}` DESC
                                         ", array( 'id' => $iLot ));
    }

    public function getSentNtfsNumber($iProfileId, $iLotId){
        $iInterval = (int)$this->CNF['PARAM_NTFS_INTERVAL'];

        return $this -> getOne("SELECT COUNT(*)
                                                FROM `bx_notifications_events`
                                                WHERE `action`='got_jot_ntfs' 
                                                AND `type`=:type 
                                                AND `object_owner_id`=:profile 
                                                AND `object_id`=:lot_id 
                                                AND `date` > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL :interval HOUR))",
                                array(
                                        'type' => $this->_oConfig->getName(),
                                        'profile' => $iProfileId,
                                        'lot_id' => $iLotId,
                                        'interval' => $iInterval
                                    ));
    }

    /**
     * @param int $iJotId id of the message
     * @param int $iProfileId viewer id
     * @param int $iJotAuthor message's author
     * @param int $iLotAuthorId author id
     * @return bool
     */
    public function isAllowedToDeleteJot($iJotId, $iProfileId=0, $iJotAuthor=0, $iLotAuthorId=0){
        if (!$iJotId)
            return true;

        if (!($aJot = $this->getJotById($iJotId)))
            return false;

        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_DELETE_MESSAGES, $iProfileId);
        if ($mixedResult === true)
            return true;

        if (!$iJotAuthor)
            $iJotAuthor = $aJot[$this->CNF['FIELD_MESSAGE_AUTHOR']];

        if (!$iLotAuthorId) {
            $iLotId = $aJot[$this->CNF['FIELD_MESSAGE_FK']];
            $bIsLotAuthor = $this -> isAuthor($iLotId, $iProfileId);
        }
        else
            $bIsLotAuthor = $iLotAuthorId == $iProfileId;

        return ($this->CNF['ALLOW_TO_REMOVE_MESSAGE'] && $iJotAuthor == $iProfileId) || ($this->CNF['ALLOW_TO_MODERATE_MESSAGE_FOR_AUTHORS'] && $bIsLotAuthor);
    }


    public function isAllowedToEditJot($iJotId, $iProfileId){
       if (!$iJotId || !($aJot = $this->getJotById($iJotId)))
            return false;

        $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_EDIT_MESSAGES, $iProfileId);
        if ($mixedResult === true)
            return true;

        $iJotAuthor = $aJot[$this->CNF['FIELD_MESSAGE_AUTHOR']];

        $iLotId = $aJot[$this->CNF['FIELD_MESSAGE_FK']];
        $bIsLotAuthor = $this->isAuthor($iLotId, $iProfileId);

        return ($this->CNF['ALLOW_TO_REMOVE_MESSAGE'] && +$iJotAuthor === +$iProfileId) || ($this->CNF['ALLOW_TO_MODERATE_MESSAGE_FOR_AUTHORS'] && $bIsLotAuthor);
    }

    function createJVC($iLotId, $iProfileId){
        $aJVC = $this->getJVC($iLotId);
        $aOpened = array();

        if (empty($aJVC)) {
            $aLotInfo = $this->getLotInfoById($iLotId);
            $sRoom = $this->_oConfig->getRoomId($aLotInfo[$this->CNF['FIELD_ID']], $aLotInfo[$this->CNF['FIELD_AUTHOR']]);
            $this->query("INSERT INTO `{$this->CNF['TABLE_JVC']}` 
                SET 
                    `{$this->CNF['FJVC_ROOM']}`=:room,
                    `{$this->CNF['FJVC_LOT_ID']}`=:lot_id,
                    `{$this->CNF['FJVC_NUMBER']}`=1
                ",
                array(
                    'room' => $sRoom,
                    'lot_id' => $iLotId
                ));

          $iJVCId = $this->lastId();
        }
        else
        {
            $iJVCId = $aJVC[$this->CNF['FJVC_ID']];
            $aOpened = $this->closeAllOpenedConversations($iJVCId);
            $sRoom = $aJVC[$this->CNF['FJVC_ROOM']];
            $this->query("UPDATE `{$this->CNF['TABLE_JVC']}` 
                        SET `{$this->CNF['FJVC_NUMBER']}`= 1
                        WHERE `{$this->CNF['FJVC_LOT_ID']}`= :lot_id    
                        ", array('lot_id' => $iLotId));
        }

        if ($iJVCId && ($iJVCItemId = $this->addJVCItem($iJVCId, $iProfileId))) {
            $this->updateJVC($iLotId, $this->CNF['FJVC_ACTIVE'], $iJVCItemId);
            $iJotId = $this->addJot($iLotId, '', $iProfileId);
            $this->updateJot($iJotId, $this->CNF['FIELD_MESSAGE_VIDEOC'], $iJVCItemId);
        }

        return array('jitsi_id' => $iJVCId, 'jot_id' => $iJotId, $this->CNF['FJVC_ROOM'] => $sRoom, 'opened' => array_values($aOpened));
    }

    public function getJotIdByJitsiItem($iJitsiId){
        $sQuery = $this -> prepare("SELECT `{$this->CNF['FIELD_MESSAGE_ID']}` 
                                            FROM `{$this->CNF['TABLE_MESSAGES']}` 
                                            WHERE `{$this->CNF['FIELD_MESSAGE_VIDEOC']}` = ? 
                                            ORDER BY `{$this->CNF['FIELD_MESSAGE_ID']}` DESC
                                            LIMIT 1", $iJitsiId);
        return $this -> getOne($sQuery);
    }

    function addJVCItem($iId, $iProfileId){
        $this->query("INSERT INTO `{$this->CNF['TABLE_JVCT']}` SET 
                            `{$this->CNF['FJVCT_AUTHOR_ID']}` = :author,
                            `{$this->CNF['FJVCT_FK']}`= :id,
                            `{$this->CNF['FJVCT_PART']}`= :part,
                            `{$this->CNF['FJVCT_JOINED']}`= :part,
                            `{$this->CNF['FJVCT_START']}` = UNIX_TIMESTAMP()
                            ",
                    array(
                        'author' => $iProfileId,
                        'id' => $iId,
                        'part' => $iProfileId
                    ));

        return $this->lastId();
    }

    function closeAllOpenedConversations($iJVCId){
        $aAllOpenedChats = $this->getPairs("SELECT  `j`.`{$this->CNF['FIELD_MESSAGE_ID']}`, `v`.`{$this->CNF['FJVCT_ID']}` as `jot_id` 
                                                            FROM `{$this->CNF['TABLE_JVCT']}` as `v` 
                                                            LEFT JOIN `{$this->CNF['TABLE_MESSAGES']}` as `j` ON `v`.`{$this->CNF['FJVCT_ID']}` = `j`.`{$this->CNF['FIELD_MESSAGE_VIDEOC']}`                                                                                                  
                                                            WHERE `{$this->CNF['FJVCT_FK']}`= :id AND `{$this->CNF['FJVCT_END']}`= 0", 'jot_id', $this->CNF['FIELD_MESSAGE_ID'], array('id' => $iJVCId));

        if (empty($aAllOpenedChats))
            return array();

        $this->query("UPDATE `{$this->CNF['TABLE_JVCT']}`
                                  SET
                                        `{$this->CNF['FJVCT_END']}`= UNIX_TIMESTAMP()                                        
                                  WHERE `{$this->CNF['FJVCT_FK']}`= :id AND `{$this->CNF['FJVCT_END']}`= 0",
                    array('id' => $iJVCId));

        return $aAllOpenedChats;
    }

    function joinToActiveJVC($iLotId, $iProfileId, $bJoin = true){
        $aItem = $this->getActiveJVCItem($iLotId);
        if (empty($aItem))
            return false;

        $aParticipants = array();
        if ($aItem[$this->CNF['FJVCT_PART']])
            $aParticipants = explode(',', $aItem[$this->CNF['FJVCT_PART']]);

        if (!in_array($iProfileId, $aParticipants))
             $aParticipants[] = $iProfileId;

        $aJoined = $aItem[$this->CNF['FJVCT_JOINED']] ? explode(',', $aItem[$this->CNF['FJVCT_JOINED']]) : array();
        if (!in_array($iProfileId, $aJoined))
            $aJoined[] = $iProfileId;

        $this->updateJVCItem($aItem[$this->CNF['FJVCT_ID']], $this->CNF['FJVCT_PART'], implode(',', $aParticipants));
        if ($bJoin)
            $this->updateJVCItem($aItem[$this->CNF['FJVCT_ID']], $this->CNF['FJVCT_JOINED'], implode(',', $aJoined));

        $this->updateJVC($iLotId, $this->CNF['FJVC_NUMBER'], count($aParticipants));
        return true;
    }

    function updateJVC($iLotId, $sField, $mixedValue){
       return $this->query("UPDATE `{$this->CNF['TABLE_JVC']}` SET 
                            `{$sField}`=:value                                                       
                            WHERE `{$this->CNF['FJVC_LOT_ID']}`=:lot_id",
            array(
                'lot_id' => $iLotId,
                'value' => $mixedValue
            ));
    }

    function leaveJVC($iLotId, $sField, $mixedValue){
        return $this->query("UPDATE `{$this->CNF['TABLE_JVC']}` SET 
                            `{$sField}`=:value                                                       
                            WHERE `{$this->CNF['FJVC_LOT_ID']}`=:lot_id",
            array(
                'lot_id' => $iLotId,
                'value' => $mixedValue
            ));
    }

    function updateJVCItem($iId, $sField, $mixedValue){
        return $this->query("UPDATE `{$this->CNF['TABLE_JVCT']}` SET 
                            `{$sField}`=:value                                                       
                            WHERE `{$this->CNF['FJVC_ID']}`=:id",
            array(
                'id' => $iId,
                'value' => $mixedValue
            ));
    }

    function closeJVC($iLotId)
    {
        $aJVC = $this->getJVC($iLotId);
        if (empty($aJVC) || !(int)$aJVC[$this->CNF['FJVC_ACTIVE']])
            return false;

        $this->query("UPDATE `{$this->CNF['TABLE_JVCT']}` 
                                        SET                                                    
                                        `{$this->CNF['FJVCT_JOINED']}`=:joined,
                                        `{$this->CNF['FJVCT_END']}`= UNIX_TIMESTAMP()                                              
                                        WHERE `{$this->CNF['FJVCT_ID']}`= :id",
        array(
              'id' => $aJVC[$this->CNF['FJVC_ACTIVE']],
              'joined' => '',
        ));

        $this->updateJVC($iLotId, $this->CNF['FJVC_ACTIVE'], 0);
        return $this->updateJVC($iLotId, $this->CNF['FJVC_NUMBER'], 0);
    }

    function stopJVC($iLotId, $iProfileId){
        $aJVC = $this->getJVC($iLotId);
        if (empty($aJVC) || !(int)$aJVC[$this->CNF['FJVC_ACTIVE']])
            return false;

        $aTrack = $this->getRow("SELECT * FROM `{$this->CNF['TABLE_JVCT']}`                                                                                           
                                        WHERE `{$this->CNF['FJVCT_ID']}`= :id",
            array(
                'id' => $aJVC[$this->CNF['FJVC_ACTIVE']]
            ));

        $aJoined = explode(',', $aTrack[$this->CNF['FJVCT_JOINED']]);
        if (in_array($iProfileId, $aJoined))
            unset($aJoined[array_search($iProfileId, $aJoined)]);
        else
            $this->joinToActiveJVC($iLotId, $iProfileId, false);

        $sEnd = '';
        $iJoinedNumber = count($aJoined);
        if (!$iJoinedNumber)
            $sEnd = ",`{$this->CNF['FJVCT_END']}`= UNIX_TIMESTAMP()";

        $this->query("UPDATE `{$this->CNF['TABLE_JVCT']}` 
                                        SET                                                    
                                        `{$this->CNF['FJVCT_JOINED']}`=:joined
                                        {$sEnd}                                                
                                        WHERE `{$this->CNF['FJVCT_ID']}`= :id",
            array(
                'id' => $aJVC[$this->CNF['FJVC_ACTIVE']],
                'joined' => implode(',', $aJoined),
            ));

        if (!$iJoinedNumber)
            $this->updateJVC($iLotId, $this->CNF['FJVC_ACTIVE'], 0);

        return $this->updateJVC($iLotId, $this->CNF['FJVC_NUMBER'], $iJoinedNumber);
    }

    function getJVC($iLotId){
        return $this->getRow("SELECT * FROM `{$this->CNF['TABLE_JVC']}`
                                     WHERE `{$this->CNF['FJVC_LOT_ID']}`= :lot_id",
        array('lot_id' => $iLotId));
    }

    function getJVCItem($iId){
        return $this->getRow("SELECT * 
                                    FROM `{$this->CNF['TABLE_JVCT']}` 
                                    WHERE `{$this->CNF['FJVCT_ID']}`= :id",
                                    array('id' => $iId));
    }

    function getActiveJVCItem($iLotId, $sFiled = ''){
       $aJVC = $this->getJVC($iLotId);
       if (empty($aJVC) || !(int)$aJVC[$this->CNF['FJVC_ACTIVE']])
           return false;

       $aInfo = $this->getJVCItem($aJVC[$this->CNF['FJVC_ACTIVE']]);
       if ($sFiled)
           return isset($aInfo[$sFiled]) ? $aInfo[$sFiled] : false;

       return $aInfo;
    }

    /*********************** REACT JOT Integration part *****************/

    /**
     * Returns installed list of modules with comments ability
     * @param string $sModule
     * @return array
     */
    function getAllCmtsModule($sModule = ''){
        return $this -> getAllWithKey("SELECT 
                    `c`.`Module` as `module`,
                    `TriggerTable` as `table`,
                    `TriggerFieldId` as `id`,
                    `TriggerFieldAuthor` as `owner`,
                    `TriggerFieldTitle` as `title`,
                    `TriggerFieldComments` as `cmts`,
                    `sm`.*,
                    `m`.`icon`
                FROM `sys_objects_cmts` as `c`
                LEFT JOIN `sys_modules` as `sm` ON `sm`.`name` = `c`.`module`
                LEFT JOIN `sys_menu_items` as `m` ON `c`.`module` = `m`.`module` AND `m`.`set_name` = 'sys_site'
                WHERE `c`.`module` != 'bx_timeline' 
                GROUP BY `c`.`module`
                ", 'module');
    }

    function addJotReaction($iJotId, $iProfileId, $aEmoji){
        $CNF = &$this->_oConfig->CNF;
        return $this->query("REPLACE INTO `{$CNF['TABLE_JOT_REACTIONS']}` 
                                        SET 
                                            `{$CNF['FIELD_REACT_JOT_ID']}` = :jot_id,
                                            `{$CNF['FIELD_REACT_NATIVE']}` = :native,
                                            `{$CNF['FIELD_REACT_EMOJI_ID']}` = :emoji_id,
                                            `{$CNF['FIELD_REACT_PROFILE_ID']}` = :profile_id,
                                            `{$CNF['FIELD_REACT_ADDED']}` = UNIX_TIMESTAMP()
                                        ", array(
            'jot_id' => $iJotId,
            'native' => $aEmoji['native'],
            'emoji_id' => $aEmoji['id'],
            'profile_id' => $iProfileId
        ));
    }

    function deleteReaction($iJotId, $iProfileId, $sEmoji){
        $CNF = &$this->_oConfig->CNF;
        return $this->query("DELETE FROM `{$CNF['TABLE_JOT_REACTIONS']}` 
                                        WHERE 
                                            `{$CNF['FIELD_REACT_JOT_ID']}` = :jot_id AND 
                                            `{$CNF['FIELD_REACT_PROFILE_ID']}` = :profile_id AND 
                                            `{$CNF['FIELD_REACT_EMOJI_ID']}` = :emoji_id
                                        ", array(
            'jot_id' => $iJotId,
            'profile_id' => $iProfileId,
            'emoji_id' => $sEmoji
        ));
    }

    function deleteJotReactions($iJotId){
        $CNF = &$this->_oConfig->CNF;
        return $this->query("DELETE FROM `{$CNF['TABLE_JOT_REACTIONS']}` 
                                        WHERE 
                                            `{$CNF['FIELD_REACT_JOT_ID']}` = :jot_id
                                        ", array(
            'jot_id' => $iJotId
        ));
    }

    function updateReaction($iJotId, $iProfileId, $sEmojiId, $sAction = BX_JOT_REACTION_ADD){
        $CNF = &$this->_oConfig->CNF;
        if ($sAction === BX_JOT_REACTION_ADD) {
           $sNative = $this->getOne("SELECT `{$CNF['FIELD_REACT_NATIVE']}` 
                                                FROM `{$CNF['TABLE_JOT_REACTIONS']}` 
                                                WHERE `{$CNF['FIELD_REACT_JOT_ID']}` = :jot_id LIMIT 1", array( 'jot_id' => $iJotId ));
            return $this-> addJotReaction($iJotId, $iProfileId, array('native' => $sNative, 'id' => $sEmojiId));
        }

        return $this->deleteReaction($iJotId, $iProfileId, $sEmojiId);
    }

    function getJotReactions($iJotId){
        $CNF = &$this->_oConfig->CNF;
        return $this->getAll("SELECT * FROM `{$CNF['TABLE_JOT_REACTIONS']}` 
                                        WHERE 
                                            `{$CNF['FIELD_REACT_JOT_ID']}` = :jot_id
                                        ORDER BY `{$CNF['FIELD_REACT_ADDED']}`", array( 'jot_id' => $iJotId ));
    }

    public function findInHistory($iLotId = 0, $sText = '', $iStart = 0, $iLimit = 10, $sOrder = 'DESC')
    {
        if (!$sText)
            return array();

        $aWhere[] = "`j`.`{$this->CNF['FIELD_MESSAGE']}` LIKE :message";
        $aParams['message'] = "%{$sText}%";

        if ($iLotId)
        {
            $aWhere[] = " `l`.`{$this->CNF['FIELD_ID']}`=:id ";
            $aParams['id'] = $iLotId;
        }

        $sLimit = '';
        $sOrder = $sOrder === 'ASC' ? 'ASC' : 'DESC';
        if ($iLimit) {
            $aParams['start'] = (int)$iStart;
            $aParams['limit'] = (int)$iLimit;
            $sLimit = "LIMIT :start, :limit";
        }

        if (!empty($aWhere))
            $sWhere = implode(' AND ', $aWhere);

        return $this-> getAll("SELECT 
			`l`.`{$this->CNF['FIELD_TITLE']}`,
			`l`.`{$this->CNF['FIELD_TYPE']}`,
			`l`.`{$this->CNF['FIELD_ADDED']}` as `talk_added`,
			`l`.`{$this->CNF['FIELD_AUTHOR']}` as `talk_author`,
			`l`.`{$this->CNF['FIELD_PARTICIPANTS']}`,
			`j`.`{$this->CNF['FIELD_MESSAGE']}`,
			`j`.`{$this->CNF['FIELD_MESSAGE_ID']}` as `message_id`,	
			`j`.`{$this->CNF['FIELD_ADDED']}` as `message_added`,			
			`j`.`{$this->CNF['FIELD_MESSAGE_AUTHOR']}` as `message_author`			
			FROM `{$this->CNF['TABLE_ENTRIES']}` as `l`
			LEFT JOIN `{$this->CNF['TABLE_MESSAGES']}` as `j` ON `l`.`{$this->CNF['FIELD_ID']}` = `j`.`{$this->CNF['FIELD_MESSAGE_FK']}`
			WHERE {$sWhere}
			ORDER BY `j`.`{$this->CNF['FIELD_MESSAGE_ID']}` {$sOrder}
			{$sLimit}", $aParams);
    }

    public function markNotificationAsRead($iRecipientId, $iLotId)
    {
        if (!$this->isModuleByName('bx_notifications'))
            return false;

        $aEvents = $this -> getAll("SELECT `e`.`id` 
                                                FROM `bx_notifications_events` AS `e`
                                                LEFT JOIN `bx_notifications_queue` AS `q` ON `q`.`event_id` = `e`.`id`                                       
                                                WHERE `action`='got_jot_ntfs' 
                                                    AND `e`.`type`=:type                                               
                                                    AND `e`.`object_owner_id`=:object_owner_id
                                                    AND `e`.`object_id`=:lot_id",
            array(
                'type' => $this->_oConfig->getName(),
                'lot_id' => $iLotId,
                'object_owner_id' => $iRecipientId
            ));

        if (empty($aEvents))
            return false;

        foreach($aEvents as &$aEvent) {
            if ($this->query("DELETE FROM `bx_notifications_events` WHERE `id`=:id",
                array(
                    'id' => $aEvent['id']
                )))
               $this->query("DELETE FROM `bx_notifications_queue` WHERE `profile_id`=:profile_id AND `event_id`=:event_id", array(
                    'profile_id' => $iRecipientId,
                    'event_id' => $aEvent['id']
               ));
        }
    }

    function getPublicRoomParticipants($sRoom){
        $aRoom = $this->getPublicVideoRoom($sRoom);
        if (empty($aRoom) || !$aRoom[$this->CNF['FPJVC_PARTS']])
            return array();

        return explode(',', $aRoom[$this->CNF['FPJVC_PARTS']]) ;
    }

    function createPublicVideoRoom($sRoom, $iProfileId){
        $CNF = &$this->_oConfig->CNF;
        $aRoom = $this->getPublicVideoRoom($sRoom);

        if (!empty($aRoom)) {
            if (!(int)$aRoom[$CNF['FPJVC_STATUS']])
                return $this->query("UPDATE `{$this->CNF['TABLE_PUBLIC_JVC']}` 
                                    SET                                         
                                        `{$this->CNF['FPJVC_CREATED']}`=UNIX_TIMESTAMP(),
                                        `{$this->CNF['FPJVC_STATUS']}`=1,
                                        `{$this->CNF['FPJVC_PARTS']}`=:part
                                    WHERE `{$this->CNF['FPJVC_ROOM']}`=:room                                         
                                   ", array('room' => $sRoom, 'part' => $iProfileId));
            else
                return $this->updatePublicVideoRoom($sRoom, $iProfileId, BX_JOT_PUBLIC_JITSI_JOIN);

        }

        return $this->query("REPLACE INTO `{$this->CNF['TABLE_PUBLIC_JVC']}` 
                                    SET 
                                        `{$this->CNF['FPJVC_ROOM']}`=:room,
                                        `{$this->CNF['FPJVC_CREATED']}`=UNIX_TIMESTAMP(),
                                        `{$this->CNF['FPJVC_PARTS']}`=:part                                     
                                   ", array('room' => $sRoom, 'part' => $iProfileId));
    }

    function getPublicVideoRoom($sRoom){
        if (!$sRoom)
            return false;

        return $this->getRow("SELECT * FROM `{$this->CNF['TABLE_PUBLIC_JVC']}` 
                                        WHERE `{$this->CNF['FPJVC_ROOM']}`=:room LIMIT 1", array('room' => $sRoom));
    }

    function updatePublicVideoRoom($sRoom, $iProfileId, $sAction){
        $aRoom = $this->getPublicVideoRoom($sRoom);
        if (empty($aRoom))
            return false;

        if ($sAction == BX_JOT_PUBLIC_JITSI_CLOSE)
            return $this->query("UPDATE `{$this->CNF['TABLE_PUBLIC_JVC']}` 
                                    SET
                                        `{$this->CNF['FPJVC_STATUS']}`=0
                                    WHERE `{$this->CNF['FPJVC_ROOM']}`=:room                                         
                                   ", array('room' => $sRoom));

        $aParticipants = array();
        if ($aRoom[$this->CNF['FPJVC_PARTS']])
            $aParticipants = explode(',', $aRoom[$this->CNF['FPJVC_PARTS']]);

        if ($sAction == BX_JOT_PUBLIC_JITSI_JOIN && !in_array($iProfileId, $aParticipants))
            $aParticipants[] = $iProfileId;

        if ($sAction == BX_JOT_PUBLIC_JITSI_LEAVE)
            $aParticipants = array_diff( $aParticipants, array($iProfileId) );

        return $this->query("UPDATE `{$this->CNF['TABLE_PUBLIC_JVC']}` 
                                    SET
                                        `{$this->CNF['FPJVC_PARTS']}`=:parts,
                                        `{$this->CNF['FPJVC_STATUS']}`=:status
                                    WHERE `{$this->CNF['FPJVC_ROOM']}`=:room                                         
                                   ", array(
                                                'room' => $sRoom,
                                                'parts' => implode(',', $aParticipants),
                                                'status' => (int)!empty($aParticipants)
                                            )
                             );
    }

    function saveLotSettings($iLotId, $mixedOptions, $sField = 'actions'){
        if (!$iLotId || !$sField)
            return false;

        if (empty($mixedOptions))
            $mixedOptions = array();

        $mixedData = is_array($mixedOptions) ? @serialize($mixedOptions) : (int)$mixedOptions;
        $aLotSettings = $this->getLotSettings($iLotId, false);
        if (empty($aLotSettings)){
            return $this->query("INSERT INTO `{$this->CNF['TABLE_LOT_SETTINGS']}` 
                                           SET 
                                             `{$sField}` = :data,
                                             `{$this->CNF['FLS_ID']}` = :id", array('data' => $mixedData, 'id' => $iLotId));
        }

        return $this->query("UPDATE `{$this->CNF['TABLE_LOT_SETTINGS']}` 
                                       SET 
                                         `{$sField}` = :actions
                                       WHERE `{$this->CNF['FLS_ID']}` = :id", array('actions' => $mixedData, 'id' => $iLotId));
    }

    function isActionAllowed($iLotId, $sAction = BX_MSG_SETTING_MSG){
        $mixedOptions = $this->getLotSettings($iLotId);
        if ($mixedOptions === false)
            return true;

        return in_array($sAction, $mixedOptions);
    }

    function getLotSettings($iLotId, $sField = 'actions'){
        $mixedOptions = false;
        if (!$iLotId || !($mixedOptions = $this -> getRow("SELECT * FROM `{$this->CNF['TABLE_LOT_SETTINGS']}` WHERE `{$this->CNF['FLS_ID']}` = :id", array('id' => $iLotId))))
            return false;

        return $sField && isset($mixedOptions[$sField]) ?
            ( $sField !== $this->CNF['FLS_ICON'] ? @unserialize($mixedOptions[$sField]) : (int)$mixedOptions[$sField] ) : $mixedOptions;
    }

    function getLotAttachmentType($sName){
        $sService = $this->getOne("SELECT `{$this->CNF['FLAT_SERVICE']}` FROM `{$this->CNF['TABLE_LOT_ATTACHMENTS']}` WHERE `{$this->CNF['FLAT_NAME']}`=:name LIMIT 1", array('name' => $sName));
        return $sService ? @unserialize($sService) : false;
    }

    function updateLotAttachmentType(&$aData){
        if (!isset($aData['name']) || !isset($aData['service']))
            return false;

        $sService = is_array($aData['service']) ? @serialize($aData['service']) : $aData['service'];

        return $this->query("REPLACE INTO `{$this->CNF['TABLE_LOT_ATTACHMENTS']}` 
                                            SET 
                                                `{$this->CNF['FLSE_NAME']}`=:name, 
                                                `{$this->CNF['FLAT_SERVICE']}`=:service",
            array('name' => $aData['name'], 'service' => $sService));
    }

    function getGroup($iGroupId){
        return $this->getRow("SELECT * FROM `{$this->CNF['TABLE_GROUPS']}` WHERE `{$this->CNF['FMG_ID']}`=:id LIMIT 1", array('id' => $iGroupId));
    }

    function addGroup($iProfileId, $aParams){
        $aGroup = array();
        if (isset($aParams[$this->CNF['FMG_ID']]))
            $aGroup = $this->getGroup($aParams[$this->CNF['FMG_ID']]);

        if (empty($aGroup))
           return $this->query("INSERT INTO `{$this->CNF['TABLE_GROUPS']}` 
                                                 SET `{$this->CNF['FMG_NAME']}` = :name, 
                                                     `{$this->CNF['FMG_PRIVACY']}` = :privacy,
                                                     `{$this->CNF['FMG_AUTHOR']}` = :author,
                                                     `{$this->CNF['FMG_DESC']}` = :desc,
                                                     `{$this->CNF['FMG_ADDED']}` = UNIX_TIMESTAMP()",
                                                 array('name' => $aParams[$this->CNF['FMG_NAME']],
                                                       'author' => $iProfileId,
                                                       'desc' => $aParams[$this->CNF['FMG_DESC']],
                                                       'privacy' => $aParams[$this->CNF['FMG_PRIVACY']]));


        return $this->query("UPDATE `{$this->CNF['TABLE_GROUPS']}`
                                                 SET `{$this->CNF['FMG_NAME']}` = :name, 
                                                     `{$this->CNF['FMG_PRIVACY']}` = :privacy, 
                                                     `{$this->CNF['FMG_DESC']}` = :desc
                                       WHERE  `{$this->CNF['FMG_ID']}`=:id",
                            array('name' => $aParams[$this->CNF['FMG_NAME']], 'desc' => $aParams[$this->CNF['FMG_DESC']], 'privacy' => $aParams[$this->CNF['FMG_PRIVACY']], 'id' => $aParams[$this->CNF['FMG_ID']]));
    }

    function getGroups($iProfileId = 0){
        if ($iProfileId)
            return $this->getAll("SELECT * FROM `{$this->CNF['TABLE_GROUPS']}` WHERE  `{$this->CNF['FMG_AUTHOR']}`=:profile", array('author' => $iProfileId));

        return $this->getAll("SELECT * FROM `{$this->CNF['TABLE_GROUPS']}` ORDER BY {$this->CNF['FMG_NAME']}", array('author' => $iProfileId));
    }

    function addLotToGroup($iLotId, $iGroupId){
        return $this->query("REPLACE INTO `{$this->CNF['TABLE_GROUPS_LOTS']}` 
                                               SET `{$this->CNF['FMGL_LOT_ID']}`=:lot_id,
                                                   `{$this->CNF['FMGL_GROUP_ID']}`=:group_id", array('group_id' => $iGroupId, 'lot_id' => $iLotId));
    }

    function saveJotItem($iJotId, $iProfileId){
        return $this->query("REPLACE INTO `{$this->CNF['TABLE_SAVED_JOTS']}` 
                                               SET  `{$this->CNF['FSJ_ID']}`=:jot_id,
                                                    `{$this->CNF['FSJ_PROFILE_ID']}`=:profile_id", array('jot_id' => $iJotId, 'profile_id' => $iProfileId));
    }

    function deleteSavedJotItems($iJotId = 0, $iProfileId = 0){
        if ($iJotId && $iProfileId)
            return $this->query("DELETE FROM `{$this->CNF['TABLE_SAVED_JOTS']}` 
                                           WHERE `{$this->CNF['FSJ_ID']}`=:jot_id AND `{$this->CNF['FSJ_PROFILE_ID']}`=:profile_id",
                                           array('jot_id' => $iJotId, 'profile_id' => $iProfileId));

        if ($iJotId)
            $this->query("DELETE FROM `{$this->CNF['TABLE_SAVED_JOTS']}` 
                                    WHERE `{$this->CNF['FSJ_ID']}`=:jot_id",
                                    array('jot_id' => $iJotId));

        return $iProfileId ? $this->query("DELETE FROM `{$this->CNF['TABLE_SAVED_JOTS']}` 
                                           WHERE `{$this->CNF['FSJ_PROFILE_ID']}`=:profile_id",
                array('profile_id' => $iProfileId)) : false;
    }

    function getSavedJots($iProfileId){
        return $this->getAllWithKey("SELECT `m`.* FROM `{$this->CNF['TABLE_SAVED_JOTS']}` as `s`
                                           LEFT JOIN `{$this->CNF['TABLE_MESSAGES']}` as `m` ON `s`.`{$this->CNF['FSJ_ID']}` = `m`.`{$this->CNF['FIELD_ID']}` 
                                           FROM `{$this->CNF['FSJ_PROFILE_ID']}`=:profile_id", $this->CNF['FIELD_ID'], array('profile_id' => $iProfileId));
    }

    function getSavedJotInLots($iProfileId, $aParams){

        $aWhere['start'] = isset($aParams['start']) ? (int)$aParams['start'] : 0;
        $aWhere['per_page'] = isset($aParams['per_page']) ? (int)$aParams['per_page'] : (int)$this->CNF['MAX_LOTS_NUMBER'];
        $sLimit = "LIMIT :start, :per_page";

        return $this->getAll("SELECT `m`.`{$this->CNF['FIELD_MESSAGE_FK']}`,`l`.* FROM `{$this->CNF['TABLE_SAVED_JOTS']}` as `s`
                                        LEFT JOIN `{$this->CNF['TABLE_MESSAGES']}` as `m` ON `s`.`{$this->CNF['FSJ_ID']}` = `m`.`{$this->CNF['FIELD_ID']}`
                                        LEFT JOIN `{$this->CNF['TABLE_ENTRIES']}` as `l` ON `l`.`{$this->CNF['FIELD_ID']}` = `m`.`{$this->CNF['FIELD_MESSAGE_FK']}`
                                        WHERE `{$this->CNF['FSJ_PROFILE_ID']}`=:profile_id 
                                        GROUP BY `m`.`{$this->CNF['FIELD_MESSAGE_FK']}`
                                        {$sLimit}", ['profile_id' => $iProfileId] + $aWhere);
    }

    public function getJotReplies($iLotId, $bCount = false){
        $aWhere = array('id' => $iLotId);

        if ($bCount)
            return $this->getOne("SELECT COUNT(*) FROM `{$this->CNF['TABLE_MESSAGES']}` WHERE `{$this->CNF['FIELD_MESSAGE_FK']}`=:id", $aWhere);

        return $this->getAll("SELECT * FROM `{$this->CNF['TABLE_MESSAGES']}` 
                                WHERE `{$this->CNF['FIELD_MESSAGE_FK']}`=:id 
                                ORDER BY `{$this->CNF['FIELD_MESSAGE_ID']}`
                                ", $aWhere);
    }

   function getReactionsMentionsLots($iProfileId, $aParams){
        $CNF = &$this->_oConfig->CNF;

       $aWhere['start'] = isset($aParams['start']) ? (int)$aParams['start'] : 0;
       $aWhere['per_page'] = isset($aParams['per_page']) ? (int)$aParams['per_page'] : (int)$this->CNF['MAX_LOTS_NUMBER'];
       $sLimit = "LIMIT :start, :per_page";

       $sUrl = BxDolProfile::getInstance($iProfileId)->getUrl();
       $aWhere['parts'] = '(^|,)' . (int)$iProfileId . '(,|$)';

       return $this->getAll("SELECT `m`.`{$CNF['FIELD_MESSAGE_FK']}`, `l`.* 
               FROM `{$CNF['TABLE_MESSAGES']}` as `m`
               LEFT JOIN `{$CNF['TABLE_ENTRIES']}` as `l` ON `l`.`{$CNF['FIELD_ID']}` = `m`.`{$CNF['FIELD_MESSAGE_FK']}`
               LEFT JOIN `{$CNF['TABLE_JOT_REACTIONS']}` as `r` ON `m`.`{$CNF['FIELD_MESSAGE_ID']}` = `r`.`{$CNF['FIELD_REACT_JOT_ID']}`
               WHERE ((`r`.`{$CNF['FIELD_REACT_JOT_ID']}` IS NOT NULL AND `m`.`{$CNF['FIELD_MESSAGE_AUTHOR']}`=:profile_id ) 
                            OR `m`.`{$CNF['FIELD_MESSAGE']}` LIKE '\"%" . '/' . bx_ltrim_str($sUrl, BX_DOL_URL_ROOT) . "\"' ) AND 
                            (`l`.`{$CNF['FIELD_PARTICIPANTS']}` REGEXP :parts OR `l`.`{$CNF['FIELD_AUTHOR']}`=:profile_id)
                                    GROUP BY `m`.`{$CNF['FIELD_MESSAGE_FK']}`
                                    {$sLimit}", ['profile_id' => $iProfileId] + $aWhere);
   }

    function getLotsWithReplies($iProfileId, $aParams = []){
        $CNF = &$this->_oConfig->CNF;

        $aWhere['start'] = isset($aParams['start']) ? (int)$aParams['start'] : 0;
        $aWhere['per_page'] = isset($aParams['per_page']) ? (int)$aParams['per_page'] : (int)$this->CNF['MAX_LOTS_NUMBER'];
        $sLimit = "LIMIT :start, :per_page";
        return $this->getAll("SELECT `m`.`{$CNF['FIELD_MESSAGE_FK']}`, `l`.*
                                    FROM `{$this->CNF['TABLE_MESSAGES']}` as `m` 
                                    LEFT JOIN `{$this->CNF['TABLE_ENTRIES']}` as `l` ON `l`.`{$this->CNF['FIELD_ID']}` = `m`.`{$this->CNF['FIELD_MESSAGE_FK']}`
                                    LEFT JOIN `{$CNF['TABLE_MESSAGES']}` as `r` ON `r`.`{$CNF['FIELD_MESSAGE_ID']}` = `m`.`{$CNF['FIELD_MESSAGE_REPLY']}`
                                    WHERE `r`.`{$CNF['FIELD_MESSAGE_AUTHOR']}`=:profile_id AND `m`.`{$CNF['FIELD_MESSAGE_REPLY']}` <> 0
                                    GROUP BY `m`.`{$CNF['FIELD_MESSAGE_FK']}`
                                    {$sLimit}", ['profile_id' => $iProfileId] + $aWhere);
    }

   function registerGroup($sUrl, $iLotId, $bForce = false){
	    parse_str($sUrl, $aUrl);
		if (!empty($aUrl) && isset($aUrl['i'])) {
            $oPage = BxDolPage::getObjectInstanceByModuleAndURI(BX_IM_EMPTY_URL, $aUrl['i']);

            if (!$oPage && !$bForce)
                return false;

            $sModule = '';
            $sTitle = _t('_bx_messenger_page_unknown');
            $iAuthor = $iProfileId = 0;
            $iPrivacy = BX_DOL_PG_ALL;
            if ($oPage && ($aPageInfo = $oPage->getObject()) && ($sModule = $oPage->getModule()) && ($oModule = BxDolModule::getInstance($sModule))) {
                $CNF = &$oModule->_oConfig->CNF;
                $sTitle = _t($aPageInfo['title']);
                $iAuthor = $aPageInfo['author'];
                if (isset($aUrl['id']) && !empty($oModule) && ($aResult = bx_srv($sModule, 'get_info', array($aUrl['id'], false)))) {                    
                    $sTitle = $aResult[$CNF['FIELD_TITLE']];
                    $iAuthor = $aResult[$CNF['FIELD_AUTHOR']];
                    $iProfileId = isset($aResult['profile_id']) ? $aResult['profile_id'] : 0;
                    $iPrivacy = isset($aResult[$CNF['FIELD_ALLOW_VIEW_TO']]);
                }
            }

            if ($this->query("INSERT INTO `{$this->CNF['TABLE_GROUPS']}`
                                                 SET `{$this->CNF['FMG_NAME']}` = :name, 
                                                     `{$this->CNF['FMG_PRIVACY']}` = :privacy,
                                                     `{$this->CNF['FMG_AUTHOR']}` = :author,
                                                     `{$this->CNF['FMG_URL']}` = :url,
                                                     `{$this->CNF['FMG_MODULE']}` = :module,
                                                     `{$this->CNF['FMG_PROFILE_ID']}` =:profile_id,
                                                     `{$this->CNF['FMG_ADDED']}` = UNIX_TIMESTAMP()",
                    array('name' => $sTitle,
                        'author' => $iAuthor,
                        'url' => $sUrl,
                        'module' => in_array($sModule, $this->CNF['ADD-TO-PAGES-AREA'][BX_MSG_TALK_TYPE_PAGES]) ? BX_MSG_TALK_TYPE_PAGES : $sModule,
                        'profile_id' => $iProfileId,
                        'privacy' => $iPrivacy)))

                    return $this->addLotToGroup($iLotId, $this->lastId());
            }


		return false;
   }

   function getMyLotsByGroups($iProfileId, $bCount = false){
       $aWhere = array('profile' => (int)$iProfileId, 'parts' => '(^|,)' . (int)$iProfileId . '(,|$)');

       if ($bCount)
           $sCount = "SQL_CALC_FOUND_ROWS";

       $aGroups = $this-> getAll("SELECT 
                                            `l`.*, `g`.`{$this->CNF['FMG_PROFILE_ID']}`,`g`.`{$this->CNF['FMG_MODULE']}`, `g`.`{$this->CNF['FMG_NAME']}`, `gl`.`{$this->CNF['FMGL_GROUP_ID']}`, 
                                             IF (`l`.`{$this->CNF['FIELD_UPDATED']}` = 0, `l`.`{$this->CNF['FIELD_ADDED']}`, `l`.`{$this->CNF['FIELD_UPDATED']}`) as `order`,
                                             IF (`l`.`{$this->CNF['FIELD_URL']}` = '', `g`.`{$this->CNF['FMG_URL']}`, `l`.`{$this->CNF['FIELD_URL']}`) as `gurl`,
                                             `un`.`{$this->CNF['FIELD_NEW_UNREAD']}` as `unread`
                                             FROM `{$this->CNF['TABLE_ENTRIES']}` as `l`                                                 
                                             LEFT JOIN `{$this->CNF['TABLE_NEW_MESSAGES']}` as `un` ON `l`.`{$this->CNF['FIELD_ID']}` = `un`.`{$this->CNF['FIELD_NEW_LOT']}` AND `un`.`{$this->CNF['FIELD_NEW_PROFILE']}`=:profile 
                                             LEFT JOIN `{$this->CNF['TABLE_GROUPS_LOTS']}` as `gl` ON `gl`.`{$this->CNF['FMGL_LOT_ID']}` = `l`.`{$this->CNF['FIELD_ID']}`
                                             LEFT JOIN `{$this->CNF['TABLE_GROUPS']}` as `g` ON `g`.`{$this->CNF['FMG_ID']}` = `gl`.`{$this->CNF['FMGL_GROUP_ID']}`
                                             WHERE (`l`.`{$this->CNF['FIELD_PARTICIPANTS']}` REGEXP :parts OR `l`.`{$this->CNF['FIELD_AUTHOR']}`=:profile) AND `gl`.`{$this->CNF['FMGL_GROUP_ID']}` IS NOT NULL
                                             ORDER BY `g`.`{$this->CNF['FMG_MODULE']}`", $aWhere);

      // print_r($aGroups);
       $aResult = array();
	   $sModule = '';
       foreach($aGroups as &$aGroup){
           if (!isset($aGroup[$this->CNF['FMG_MODULE']]))
               continue;

           if ($aGroup[$this->CNF['FMG_MODULE']] != $sModule)
			   $sModule = $aGroup[$this->CNF['FMG_MODULE']];

		   if (!isset($aResult[$sModule][$aGroup[$this->CNF['FMGL_GROUP_ID']]])){
				$aResult[$sModule][$aGroup[$this->CNF['FMGL_GROUP_ID']]] =[
					$this->CNF['FMG_NAME'] => $aGroup[$this->CNF['FMG_NAME']],
					$this->CNF['FMG_ID'] => $aGroup[$this->CNF['FMG_PROFILE_ID']], // group profile id of the module
                    $this->CNF['FMGL_GROUP_ID'] => $aGroup[$this->CNF['FMGL_GROUP_ID']],
                    $this->CNF['FMG_URL'] => $aGroup['gurl']
				];
		   }

		   // fill each groups with existed talks in it group
		   $aResult[$sModule][$aGroup[$this->CNF['FMGL_GROUP_ID']]][$this->CNF['GROUPS_ITEMS_FIELD']][] = [
				$this->CNF['FIELD_ADDED'] => $aGroup[$this->CNF['FIELD_ADDED']],
				$this->CNF['FIELD_AUTHOR'] => $aGroup[$this->CNF['FIELD_AUTHOR']],
				$this->CNF['FIELD_TITLE'] => $aGroup[$this->CNF['FIELD_TITLE']],
				$this->CNF['FIELD_PARTICIPANTS'] => $aGroup[$this->CNF['FIELD_PARTICIPANTS']],
				$this->CNF['FIELD_ID'] => $aGroup[$this->CNF['FIELD_ID']],
				$this->CNF['FMG_URL'] => $aGroup[$this->CNF['FIELD_URL']]
				//$this->CNF['FMG_PROFILE_ID'] => $aGroup[$this->CNF['FMG_PROFILE_ID']],
		   ];
       }

	   return $aResult;
   }
   
   function getGroupIdByLotId($iLotId){
	    return $this->getOne("SELECT `{$this->CNF['FMGL_GROUP_ID']}` 
							FROM `{$this->CNF['TABLE_GROUPS_LOTS']}`								
							WHERE `{$this->CNF['FMGL_LOT_ID']}`=:id", array('id' => $iLotId));
   }
   
   function getTalksByGroupId($iGroupId){
	    return $this->getAllWithKey("SELECT `l`.* 
								            FROM `{$this->CNF['TABLE_GROUPS_LOTS']}` as `gl` 
								            LEFT JOIN `{$this->CNF['TABLE_ENTRIES']}` as `l` ON `gl`.`{$this->CNF['FMGL_LOT_ID']}` = `l`.`{$this->CNF['FIELD_ID']}`
								            WHERE `gl`.`{$this->CNF['FMGL_GROUP_ID']}`=:id AND `l`.`id` IS NOT NULL
								            ", $this->CNF['FIELD_ID'], array('id' => $iGroupId));
   }

   function getGroupById($iGroupId){
        return $this->getRow("SELECT *  
							FROM `{$this->CNF['TABLE_GROUPS']}`								
							WHERE `{$this->CNF['FMG_ID']}`=:id LIMIT 1", array('id' => $iGroupId));
   }

    function getGroupByUrl($sUrl){
        return $this->getRow("SELECT * FROM `{$this->CNF['TABLE_GROUPS']}` WHERE `{$this->CNF['FMG_URL']}`=:url LIMIT 1", array('url' => $sUrl));
    }

   function getLotType($iLotId){
       $aInfo = $this->getLotInfoById($iLotId);

       if (empty($aInfo))
           return false;

       if ($aInfo[$this->CNF['FMGL_GROUP_ID']]){
           $aGroupInfo = $this->getGroup($aInfo[$this->CNF['FMGL_GROUP_ID']]);
           return [
                     'group_id' => $aInfo[$this->CNF['FMGL_GROUP_ID']],
                     'type' => BX_MSG_TALK_TYPE_GROUPS,
                     'groups_type' => $aGroupInfo[$this->CNF['FMG_MODULE']]
                  ];
       }

       if ((int)$aInfo[$this->CNF['FIELD_PARENT_JOT']])
           return [ 'type' => BX_MSG_TALK_TYPE_THREADS ];

       if ($aInfo[$this->CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE)
           return [ 'type' => BX_MSG_TALK_TYPE_DIRECT ];

       return false;
   }

   function getUnreadMessagesStat($iProfileId){
       $aItems = $this->getLotsWithUnreadMessages($iProfileId);

       $aResult = [];
       if (empty($aItems))
           return $aResult;

       foreach($aItems as $iLotId => $iCount){
           if (!($aType = $this->getLotType($iLotId)))
               continue;

           if (isset($aType['group_id']))
               $aResult['groups'][$aType['groups_type']][$aType['group_id']][$iLotId] = +$iCount;
           else
               $aResult[$aType['type']][$iLotId] = +$iCount;
       }

       return array_merge($aResult, [BX_MSG_TALK_TYPE_INBOX => count($aItems)]);
   }

   function addMediaTrack($iFileId, $iProfileId){
       return $this->query("REPLACE INTO `{$this->CNF['TABLE_JOTS_MEDIA_TRACKER']}`					
							       SET `{$this->CNF['FJMT_FILE_ID']}`=:id, 
                                       `{$this->CNF['FJMT_USER_ID']}`=:user_id", ['id' => $iFileId, 'user_id' => $iProfileId]);
   }

    function isFileCollapsed($iFileId, $iProfileId){
        return $this->getOne("SELECT COUNT(*) FROM `{$this->CNF['TABLE_JOTS_MEDIA_TRACKER']}`					
							        WHERE `{$this->CNF['FJMT_FILE_ID']}`=:id AND `{$this->CNF['FJMT_USER_ID']}`=:user_id",
                                    ['id' => $iFileId, 'user_id' => $iProfileId]);
    }

    function removeMediaTracker($iFileId=0, $iProfileId=0){
       if (!$iFileId && !$iProfileId)
           return false;

       $aWhereParams = $aWhere = [];
       if ($iFileId) {
           $aWhere[] = "`{$this->CNF['FJMT_FILE_ID']}`=:id";
           $aWhereParams['id'] = $iFileId;
       }

        if ($iProfileId) {
           $aWhere[] = "`{$this->CNF['FJMT_USER_ID']}`=:user_id";
           $aWhereParams['user_id'] = $iProfileId;
        }

        $sWhere = implode(' AND ', $aWhere);
        return $this->query("DELETE FROM `{$this->CNF['TABLE_JOTS_MEDIA_TRACKER']}`					
							       WHERE {$sWhere}", $aWhereParams);
    }

    public function getObjectAuthorId($iId)
    {
        $sQuery = $this->prepare("SELECT `{$this->CNF['FIELD_MESSAGE_AUTHOR']}` FROM `{$this->CNF['TABLE_MESSAGES']}` WHERE `{$this->CNF['FIELD_MESSAGE_ID']}` = ? LIMIT 1", $iId);
        return (int)$this->getOne($sQuery);
    }

    public function isPerformed($iObjectId, $iAuthorId, $sEmoji)
    {
        $sQuery = $this->prepare("SELECT COUNT(*) 
                                         FROM `{$this->CNF['TABLE_JOT_REACTIONS']}` 
                                         WHERE `{$this->CNF['FIELD_REACT_JOT_ID']}` = ? AND `{$this->CNF['FIELD_REACT_PROFILE_ID']}` = ? AND 
                                               `{$this->CNF['FIELD_REACT_EMOJI_ID']}` = ? LIMIT 1", $iObjectId, $iAuthorId, $sEmoji);
        return (int)$this->getOne($sQuery) != 0;
    }

    public function putVote($iObjectId, $iAuthorId, $sAuthorIp, $aData, $bUndo = false)
    {
        $sReaction = $aData['reaction'];
        $aReactions = BxDolFormQuery::getDataItems('sys_vote_reactions', false, BX_DATA_VALUES_ALL);
        if(!isset($aReactions[$sReaction]))
            return false;

        if (!$aReaction = @unserialize($aReactions[$sReaction]['Data']))
            return false;

        $sQuery = "SELECT `id` FROM `{$this->CNF['TABLE_JOT_REACTIONS']}` WHERE `{$this->CNF['FIELD_REACT_JOT_ID']}` = :object_id 
                           AND `{$this->CNF['FIELD_REACT_EMOJI_ID']}` = :reaction AND `{$this->CNF['FIELD_REACT_PROFILE_ID']}`=:author   LIMIT 1";
        $bExists = (int)$this->getOne($sQuery, array('object_id' => $iObjectId, 'reaction' => $sReaction, 'author' => $iAuthorId)) != 0;

        if($bExists && $bUndo)
            return $this->deleteReaction($iObjectId, $iAuthorId, $aData['reaction']);
        else
            return $this->addJotReaction($iObjectId, $iAuthorId, ['id' => $this->_oConfig->convertApp2Emoji($aData['reaction']), 'native' => $aReaction['emoji']]);

        return $this->lastId();
    }

    public function getVote($iObjectId)
    {
        $aReactions = BxDolFormQuery::getDataItems('sys_vote_reactions', false, BX_DATA_VALUES_ALL);
        $aReactionsGot = $this->getPairs("SELECT COUNT(*) as `count`, `{$this->CNF['FIELD_REACT_EMOJI_ID']}` FROM `{$this->CNF['TABLE_JOT_REACTIONS']}` WHERE `{$this->CNF['FIELD_REACT_JOT_ID']}` = :object_id GROUP BY `{$this->CNF['FIELD_REACT_EMOJI_ID']}`", $this->CNF['FIELD_REACT_EMOJI_ID'], 'count', array('object_id' => $iObjectId));
        $aResult = array();
        foreach($aReactions as $sName => $iValue) {
            $iCount = $iSum = 0;
            if(!empty($aReactionsGot[$sName])) {
                $iCount = (int)$aReactionsGot[$sName];
                $iSum += $iCount;
            }

            $aResult['count_' . $sName] = $iCount;
            $aResult['sum_' . $sName] = $iSum;
            $aResult['rate_' . $sName] = $iCount != 0 ? $iSum / $iCount : 0;
        }

        $aResult['count_default'] = $iCount;
        $aResult['sum_default'] = $iSum;

        return $aResult;
    }

    public function getTrack($iObjectId, $iAuthorId)
    {
        return $this->getRow("SELECT *, `{$this->CNF['FIELD_REACT_EMOJI_ID']}` as `reaction` FROM `{$this->CNF['TABLE_JOT_REACTIONS']}` WHERE `{$this->CNF['FIELD_REACT_JOT_ID']}` = :object_id AND `{$this->CNF['FIELD_REACT_PROFILE_ID']}` = :author_id LIMIT 1", array(
            'object_id' => $iObjectId,
            'author_id' => $iAuthorId
        ));
    }

    public function getPerformed($aParams = array())
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $aBindings = array();

        $sSelectClause = '`tt`.*';
        $sJoinClause = $sWhereClause = '';
        $sLimitClause = isset($aParams['start']) && !empty($aParams['per_page']) ? "LIMIT " . $aParams['start'] . ", " . $aParams['per_page'] : "";

        if(!empty($aParams['type']))
            switch($aParams['type']) {
                case 'by':
                    $aBindings['object_id'] = $aParams['object_id'];

                    $sJoinClause = "INNER JOIN `sys_profiles` AS `tp` ON `tt`.`user_id`=`tp`.`id` AND `tp`.`status`='active'";
                    $sWhereClause = "AND `tt`.`jot_id` = :object_id";

                    if(!empty($aParams['reaction'])) {
                        $aMethod['name'] = 'getColumn';
                        $aBindings['reaction'] = $this->_oConfig->convertApp2Emoji($aParams['reaction']);

                        $sSelectClause = "`tt`.`user_id`";
                        $sWhereClause .= " AND `tt`.`emoji_id`=:reaction";
                    }
                    else {
                        $aMethod['name'] = 'getAll';

                        $sSelectClause = "`tt`.`user_id`, `tt`.`emoji_id`";
                    }
                    break;
            }

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `{$this->CNF['TABLE_JOT_REACTIONS']}` AS `tt` " . $sJoinClause . " WHERE 1 " . $sWhereClause . $sLimitClause;
        $aMethod['params'][] = $aBindings;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    /**
     * Occurs when delete context object
     * @param $iAuthorId context id (group,space ) and etc...
     */
    function deleteAuthorEntries($iAuthorId){
        return false;
    }

    public function pruningByDate($iDate) {
        return 0;
    }
}

/** @} */
