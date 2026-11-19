<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OAuth2 OAuth2 server
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOAuthDb extends BxDolModuleDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

	function getClientsBy($aParams = array())
    {
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['id']
                );

                $sWhereClause .= "AND `tc`.`id`=:id";
                $sLimitClause .= "LIMIT 1";
                break;

            case 'client_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'client_id' => $aParams['client_id']
                );

                $sWhereClause .= "AND `tc`.`client_id`=:client_id";
                $sLimitClause .= "LIMIT 1";
                break;

			case 'parent_id':
                $aMethod['params'][1] = array(
                	'parent_id' => $aParams['parent_id']
                );

                $sWhereClause .= "AND `tc`.`parent_id`=:parent_id";
                break;

            case 'user_id':
                $aMethod['params'][1] = array(
                	'user_id' => $aParams['user_id']
                );

                $sWhereClause .= "AND `tc`.`user_id`=:user_id";
                break;
        }

        $aMethod['params'][0] = "SELECT * " . $sSelectClause . "
            FROM `bx_oauth_clients` AS `tc` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sOrderClause . " " . $sLimitClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    function getClientTitle($sClientId)
    {
        $sQuery = $this->prepare("SELECT `title` FROM `bx_oauth_clients` WHERE `client_id` = ?", $sClientId);
        return $this->getOne($sQuery);
    }

    function getClientIdByAccessToken($sToken)
    {
        $sQuery = $this->prepare("SELECT `client_id` FROM `bx_oauth_access_tokens` WHERE `access_token` = ?", $sToken);
        return $this->getOne($sQuery);
    }
    
	function addClient($aClient)
    {
        $mixedResult = $this->query("INSERT INTO `bx_oauth_clients` SET " . $this->arrayToSQL($aClient));
        return (int)$mixedResult > 0 ? $this->lastId() : false;
    }

	function updateClientsBy($aPrmSet, $aPrmWhere)
    {
    	if(empty($aPrmSet) || !is_array($aPrmSet) || empty($aPrmWhere) || !is_array($aPrmWhere))
    		return false;

        return (int)$this->query("UPDATE `bx_oauth_clients` SET " . $this->arrayToSQL($aPrmSet) . " WHERE " . $this->arrayToSQL($aPrmWhere, ' AND ')) > 0;
    }

    function deleteClients($aClients)
    {        
        foreach ($aClients as $sClientId) {
            $sQuery = $this->prepare("DELETE FROM `bx_oauth_clients` WHERE `client_id` = ?", $sClientId);
            $this->query($sQuery);
        }
    }

	function deleteClientsBy($aParams)
    {
    	if(empty($aParams) || !is_array($aParams))
    		return false;

        return $this->query("DELETE FROM `bx_oauth_clients` WHERE " . $this->arrayToSQL($aParams, ' AND '));
    }

    function getSavedProfile($sClientId, $aProfiles)
    {
        $aIds = array_keys($aProfiles);
        return $this->getOne("SELECT `user_id` FROM `bx_oauth_refresh_tokens` WHERE `client_id` = ? AND `user_id` IN (" . $this->implode_escape($aIds) . ") LIMIT 1", array($sClientId));
    }

    /**
     * The clients profiles have codes or tokens of: client_id and title (none for a built-in native app), by title.
     */
    function getConnectedApps($aProfileIds)
    {
        if (!$aProfileIds)
            return array();

        $sIn = $this->implode_escape(array_map('intval', $aProfileIds));
        return $this->getAll("SELECT `t`.`client_id`, `c`.`title` FROM (
                SELECT `client_id` FROM `bx_oauth_refresh_tokens` WHERE `user_id` IN (" . $sIn . ")
                UNION SELECT `client_id` FROM `bx_oauth_access_tokens` WHERE `user_id` IN (" . $sIn . ")
            ) AS `t`
            LEFT JOIN `bx_oauth_clients` AS `c` ON (`c`.`client_id` = `t`.`client_id`)
            ORDER BY `c`.`title`, `t`.`client_id`");
    }

    /**
     * Delete a client's codes and tokens of these profiles.
     */
    function disconnectApp($sClientId, $aProfileIds)
    {
        if (!$aProfileIds)
            return false;

        $sIn = $this->implode_escape(array_map('intval', $aProfileIds));
        foreach (array('bx_oauth_access_tokens', 'bx_oauth_refresh_tokens', 'bx_oauth_authorization_codes') as $sTable)
            $this->query("DELETE FROM `" . $sTable . "` WHERE `client_id` = :client AND `user_id` IN (" . $sIn . ")", array('client' => $sClientId));

        return true;
    }

    function getClientByAllowedOriginUrl($sUrl)
    {
        return $this->getRow("SELECT `c`.* FROM `bx_oauth_clients` AS `c` INNER JOIN `bx_oauth_allowed_origins` AS `o` ON (`o`.`client_id` = `c`.`id`) WHERE `o`.`url` = :url", array('url' => $sUrl));
    }    
}

/** @} */
