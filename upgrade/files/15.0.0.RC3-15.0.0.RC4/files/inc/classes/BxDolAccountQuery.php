<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * All queries related to account
 */
class BxDolAccountQuery extends BxDolDb implements iBxDolSingleton
{
    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolAccountQuery();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function getOperators ()
    {
        $sSql = $this->prepare("SELECT `id` FROM `sys_accounts` WHERE `role`&" . BX_DOL_ROLE_ADMIN);
        return $this->getColumn($sSql);
    }
    
    /**
     * Get account by specified field name and value.
     * It is for internal usage only.
     * Use other funtions to get account info, like getInfoById, etc.
     * @param  string $sField database field name
     * @param  mixed  $sValue database field value
     * @return array  with porfile info
     */
    protected function _getDataByField ($sField, $sValue)
    {
        $sSql = $this->prepare("SELECT * FROM `sys_accounts` WHERE `$sField` = ? LIMIT 1", $sValue);
        return $this->getRow($sSql);
    }

    /**
     * Get account info by id
     * @param  int   $iID account id
     * @return array with account info
     */
    public function getInfoById( $iID )
    {
        return $this->_getDataByField('id', (int)$iID);
    }

    /**
     * get account id by emial
     */
    public function getIdByEmail($sEmail)
    {
        return (int)$this->_getFieldByField('id', 'email', $sEmail);
    }
    
    /**
     * get account id by phone
     */
    public function getIdByPhone($sPhone)
    {
        return (int)$this->_getFieldByField('id', 'phone', $sPhone);
    }

    /**
     * get account id by id
     */
    public function getIdById($iId, $bClearCache = false)
    {
        if (!$iId)
            return false;

        $sKey = 'BxDolAccountQuery::getIdById' . $iId;
        if ($bClearCache)
            $this->cleanMemory($sKey);

        $sSql = $this->prepare("SELECT `id` FROM `sys_accounts` WHERE `id` = ? LIMIT 1", $iId);
        $bResult = $this->fromMemory($sKey, 'getOne', $sSql);
        if (!$bResult)
            $this->cleanMemory($sKey);
        return $bResult;
    }

    /**
     * get first studio operator id
     */
    public function getStudioOperatorId()
    {
        return (int)$this->_getFieldByField('id', 'role', 3);
    }

    /**
     * Get account email by id
     * @param  string  $s search account by this id
     * @return account email
     */
    public function getEmail($iID)
    {
        return $this->_getFieldByField('email', 'id', (int)$iID);
    }

    /**
     * Get account password by id
     * @param  string  $s search account by this id
     * @return account password
     */
    public function getPassword($iID)
    {
        return $this->_getFieldByField('password', 'id', (int)$iID);
    }

	/**
     * Is account online by id
     * @param  int $iId account id 
     * @return account online status
     */
    public function isOnline($iId)
    {
        $sSql = $this->prepare("SELECT 
        		`ta`.`id` 
        	FROM `sys_accounts` AS `ta` 
        	INNER JOIN `sys_sessions` AS `ts` ON `ta`.`id`=`ts`.`user_id` 
        	WHERE 
        		`ta`.`id` = ? AND 
        		`ts`.`date` > (UNIX_TIMESTAMP() - 60 * ?) 
        	LIMIT 1", $iId, (int)getParam('sys_account_online_time'));
        return (int)$this->getOne($sSql) > 0;
    }

    /**
     * Update password
     * @param $sPasswordHash - password hash
     * @param $sSalt - pasword salt
     * @param $iAccountId - account id to update password for
     * @return number of affected rows
     */
    public function updatePassword($sPasswordHash, $sSalt, $iAccountId)
    {
        return $this->query("UPDATE `sys_accounts` SET `password` = :password, `salt` = :salt, `password_changed` = UNIX_TIMESTAMP() WHERE `id` = :id", [
            'id' => $iAccountId,
            'password' => $sPasswordHash,
            'salt' => $sSalt
        ]);
    }

    /**
     * Save password log
     * @param $sPasswordHash - password hash
     * @param $sSalt - pasword salt
     * @param $iAccountId - account id to update password for
     * @return number of affected rows
     */
    public function logPassword($iAccountId)
    {
        $iCount = (int)getParam('sys_account_accounts_password_log_count');
        if($iCount <= 0)
            return;

        $aAccount = $this->getRow("SELECT `password`, `password_changed`, `salt` FROM `sys_accounts` WHERE `id` = :id", [
            'id' => $iAccountId
        ]);

        $this->query("INSERT INTO `sys_accounts_password` SET " . $this->arrayToSQL([
            'account_id' => $iAccountId,
            'password' => $aAccount['password'],
            'password_changed' => $aAccount['password_changed'],
            'salt' => $aAccount['salt'],
        ]));

        $this->query("DELETE FROM `sys_accounts_password` WHERE `id` NOT IN (SELECT `id` FROM (SELECT `id` FROM `sys_accounts_password` WHERE `account_id` = :account_id ORDER BY `password_changed` DESC LIMIT 0, " . $iCount . ") AS `tap`)", [
            'account_id' => $iAccountId
        ]);
    }
    
    public function getLastPasswordChanged($iAccountId)
    {
        $sSql = $this->prepare("SELECT `password_changed` FROM `sys_accounts_password` WHERE `account_id` = ? ORDER BY password_changed  DESC limit 0, 1", $iAccountId);
        return (int)$this->getOne($sSql);
    }
    
    public function getLastPasswordLog($iAccountId)
    {
        $sSql = $this->prepare("SELECT * FROM `sys_accounts_password` WHERE `account_id` = ? ", $iAccountId);
        return $this->getAll($sSql);
    }
    
    /**
     * Update last logged in time
     * @param  int    $iID account id
     * @return number of affected rows
     */
    public function updateLoggedIn($iID)
    {
        return $this->query("UPDATE `sys_accounts` SET `logged` = :ts, `ip` = :ip, `login_attempts` = 0, `lang_id` = :lang WHERE `id`= :id", ['ts' => time(), 'ip' => getVisitorIP(), 'lang' => BxDolLanguages::getInstance()->getCurrentLangId(), 'id' => $iID]);
    }
    
    /**
     * Update login attempts counter
     * @param  int    $iID account id
     * @return number of affected rows
     */
    public function updateAttemptsCounter($iID)
    {
        $sQuery = $this->prepare("UPDATE `sys_accounts` SET `login_attempts` = `login_attempts` + 1 WHERE `id`= ?", $iID);
        return $this->query($sQuery);
    }
    
    /**
     * Lock account
     * @param  int    $iID account id
     * @return number of affected rows
     */
    public function lockAccount($iID)
    {
        $sQuery = $this->prepare("UPDATE `sys_accounts` SET `locked` = 1 WHERE `id`= ?", $iID);
        return $this->query($sQuery);
    }
    
    /**
     * Unlock account
     * @param  int    $iID account id
     * @return number of affected rows
     */
    public function unlockAccount($iID)
    {
        $sQuery = $this->prepare("UPDATE `sys_accounts` SET `locked` = 0, `login_attempts` = 0 WHERE `id`= ?", $iID);
        return $this->query($sQuery);
    }

    /**
     * Update language
     * @param  int    $iID account id
     * @return number of affected rows
     */
    public function updateLanguage($iID, $iLangId)
    {
        return $this->_updateField ($iID, 'lang_id', $iLangId);
    }

    /**
     * Update current profile id associated with account
     * @param  int    $iID        account id
     * @param  int    $iProfileId set current profile id to this value
     * @return number of affected rows
     */
    public function updateCurrentProfile($iID, $iProfileId)
    {
        if ($bResult = $this->_updateField ($iID, 'profile_id', $iProfileId))
            $this->cleanMemory('BxDolProfileQuery::getCurrentProfileByAccount' . $iID);

        // clean acount swither cache
        bx_content_cache_del("profile_switcher_{$iID}_0");
        bx_content_cache_del("profile_switcher_{$iID}_1");

        return $bResult;
    }

    /**
     * Update 'email_confirmed' field.
     * @param  int    $isConfirmed - 0: mark email as unconfirmed, 1: as confirmed
     * @param  int    $iID         - account id
     * @return number of affected rows
     */
    public function updateEmailConfirmed($isConfirmed, $iID)
    {
        return $this->_updateField ($iID, 'email_confirmed', $isConfirmed ? 1 : 0);
    }
    
    /**
     * Update 'phone_confirmed' field.
     * @param  int    $isConfirmed - 0: mark phone as unconfirmed, 1: as confirmed
     * @param  int    $iID         - account id
     * @return number of affected rows
     */
    public function updatePhoneConfirmed($isConfirmed, $iID)
    {
        return $this->_updateField ($iID, 'phone_confirmed', $isConfirmed ? 1 : 0);
    }
    
    /**
     * Update 'receive_news' field.
     * @param  int    $isReceive - 0: unsubscribe from site news, 1: subscribe
     * @param  int    $iID       - account id
     * @return number of affected rows
     */
    public function updateReceiveNews($isReceive, $iID)
    {
        return $this->_updateField ($iID, 'receive_news', $isReceive ? 1 : 0);
    }

    /**
     * Update 'welcome_sent' field.
     * @param  int    $isSent   - 0: mark as sent, 1: as not sent
     * @param  int    $iID      - account id
     * @return number of affected rows
     */
    public function updateWelcomeSent($isSent, $iID)
    {
        return $this->_updateField ($iID, 'welcome_sent', $isSent ? 1 : 0);
    }

    /**
     * Update 'phone' field.
     * @param  int    $sPhone - phone number
     * @param  int    $iID         - account id
     * @return number of affected rows
     */
    public function updatePhone($sPhone, $iID)
    {
        $sSql = $this->prepare("UPDATE `sys_accounts` SET `phone` = ?, `phone_confirmed` = 0 WHERE `id` = ? LIMIT 1", $sPhone, $iID);
        return $this->query($sSql);
    }

    /**
     * Give an account that has no phone this one, unless another account has it.
     * Two accounts saving the same phone at once don't both keep it: each looks for
     * another owner after its own save and gives the phone up if there is one.
     * @param  string $sPhone - phone number
     * @param  int    $iID    - account id
     * @return true if the account has the phone now
     */
    public function setPhoneIfFree($sPhone, $iID)
    {
        $aBind = ['phone' => $sPhone, 'id' => $iID];
        if (!(int)$this->query("UPDATE `sys_accounts` SET `phone` = :phone, `phone_confirmed` = 0 WHERE `id` = :id AND `phone` = '' LIMIT 1", $aBind))
            return false;

        if (!$this->getOne("SELECT `id` FROM `sys_accounts` WHERE `phone` = :phone AND `id` != :id LIMIT 1", $aBind))
            return true;

        $this->query("UPDATE `sys_accounts` SET `phone` = '' WHERE `id` = :id AND `phone` = :phone LIMIT 1", $aBind);
        return false;
    }

    /**
     * Get account field by specified field name and value.
     * In most cases it is for internal usage only.
     * Use other funtions to get account info, like getIdByEmail, etc.
     * @param  string    $sFieldRequested database field name to return
     * @param  string    $sFieldSearch    database field name to search for
     * @param  mixed     $sValue          database field value
     * @return specified account field value
     */
    protected function _getFieldByField ($sFieldRequested, $sFieldSearch, $sValue)
    {
        $sSql = $this->prepare("SELECT `$sFieldRequested` FROM `sys_accounts` WHERE `$sFieldSearch` = ? LIMIT 1", $sValue);
        return $this->getOne($sSql);
    }

    /**
     * Update some field by account id
     * In most cases it is for internal usage only.
     * Use other funtions to get account info, like updateLogged, etc.
     * @param  string    $sFieldRequested database field name to return
     * @param  string    $sFieldSearch    database field name to search for
     * @param  mixed     $sValue          database field value
     * @return specified account field value
     */
    public function _updateField ($iId, $sFieldForUpdate, $sValue)
    {
        $sSql = $this->prepare("UPDATE `sys_accounts` SET `$sFieldForUpdate` = ? WHERE `id` = ? LIMIT 1", $sValue, $iId);
        return $this->query($sSql);
    }

    /**
     * Delete account info by id
     * @param  int      $iID profile id
     * @return affected rows
     */
    public function delete($iID)
    {
        $sSql = $this->prepare("DELETE FROM `sys_accounts` WHERE `id` = ? LIMIT 1", $iID);
        if ($res = $this->query($sSql)) {
            $this->getIdById($iID, true);
        }
        return $res;
    }

	/**
     * Get account(s) by params
     * @param  array   $aParams browse params
     * @return array with account(s)
     */
    public function getAccounts($aParams)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

    	$sFieldsClause = "`ta`.*"; 
    	$sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = "";

    	switch($aParams['type']) {
    		case 'by_join_date':
    			$aMethod['params'][1] = array(
    				'date' => $aParams['date']
    			);

    			$sWhereClause = " AND `ta`.`added` > :date AND `ta`.`added` < UNIX_TIMESTAMP()";
    			break;
                
            case 'confirmed':
    			$sWhereClause = " AND (`ta`.`email_confirmed` = 1 OR `ta`.`phone_confirmed` = 1)";
    			break;
                
            case 'unconfirmed':
    			$sWhereClause = " AND (`ta`.`email_confirmed` = 0 AND `ta`.`phone_confirmed` = 0)";
    			break;
    	}

    	$sGroupClause = $sGroupClause ? "GROUP BY " . $sGroupClause : "";
		$sOrderClause = $sOrderClause ? "ORDER BY " . $sOrderClause : "";

		$aMethod['params'][0] = "SELECT
				" . $sFieldsClause . "
            FROM `sys_accounts` AS `ta`" . $sJoinClause . "
            WHERE 1" . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    /**
     * Search account profile by keyword
     */
    public function searchByTerm($sTerm, $iLimit)
    {
    	$aBindings = array(
    		'system' => 'system',
    		'status' => BX_PROFILE_STATUS_ACTIVE,
    		'limit' => (int)$iLimit
    	);

        $sWhere = '';
        $aFieldsQuickSearch = array('name', 'email');
        foreach ($aFieldsQuickSearch as $sField) {
        	$aBindings[$sField] = '%' . $sTerm . '%';

            $sWhere .= " OR `c`.`$sField` LIKE :$sField ";
        }

        $sQuery = "SELECT `c`.`id` AS `content_id`, `p`.`account_id`, `p`.`id` AS `profile_id`, `p`.`status` AS `profile_status` FROM `sys_accounts` AS `c` INNER JOIN `sys_profiles` AS `p` ON (`p`.`content_id` = `c`.`id` AND `p`.`type` = :system) WHERE `p`.`status` = :status AND (0 $sWhere) ORDER BY `added` DESC LIMIT :limit";
        return $this->getAll($sQuery, $aBindings);
    }
    
    public function getAccountsForPruning($sMode, $iAdded)
    {
        $aBindings = array(
    		'date_limit' => $iAdded,
    	);
        
        $sQuery = '';
        
        switch($sMode) {
    		case 'no_profile':
    			$sQuery = "SELECT `sys_accounts`.`id`, COUNT(`sys_profiles`.`id`) AS `profiles_count` FROM `sys_accounts`
                INNER  JOIN `sys_profiles` ON `sys_accounts`.`id` = `sys_profiles`.`account_id`
                WHERE `added` < :date_limit AND name <> 'Robot'
                GROUP BY `sys_profiles`.`account_id`
                HAVING COUNT(`sys_profiles`.`id`) <= 1 ";
    			break;
                
            case 'no_login':
    			$sQuery = "SELECT `sys_accounts`.`id` FROM `sys_accounts` WHERE `logged` < :date_limit AND `added` < :date_limit  AND name <> 'Robot'  AND  `sys_accounts`.`id` NOT IN (SELECT `user_id` FROM `sys_sessions`)";
    			break;
                
            case 'no_confirm':
    			$sQuery = "SELECT `sys_accounts`.`id` FROM `sys_accounts` WHERE `added` < :date_limit AND (phone_confirmed = 0 OR email_confirmed = 0) AND name <> 'Robot'";
    			break;
    	}
        
        
        return $this->getAll($sQuery, $aBindings);
    }
}

/** @} */
