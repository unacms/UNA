<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    GitHub GitHub
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGitHubDb extends BxDolModuleDb
{
    protected $_oConfig;

    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);

        $this->_oConfig = $oConfig;
    }

    public function getApps($aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];

        $sSelectClause = "*";
        $sWhereClause = $sOrderClause = "";

        switch($aParams['sample']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'id' => $aParams['id']
                ];

                $sWhereClause .= " AND `id`=:id";
                break;

            case 'profile_id':
                $aMethod['params'][1] = [
                    'profile_id' => $aParams['profile_id']
                ];

                $sWhereClause .= " AND `profile_id`=:profile_id";

                if(($sClientId = $aParams['client_id'] ?? false)) {
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1]['client_id'] = $sClientId;

                    $sWhereClause .= " AND `client_id`=:client_id";
                }
                break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_APPS'] . "` WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function getAuthorizations($aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];

        $sSelectClause = "*";
        $sWhereClause = $sOrderClause = "";

        switch($aParams['sample']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'id' => $aParams['id']
                ];

                $sWhereClause .= " AND `id`=:id";
                break;

            case 'profile_app_ids':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'profile_id' => $aParams['profile_id'],
                    'app_id' => $aParams['app_id']
                ];

                $sWhereClause .= " AND `profile_id`=:profile_id AND `app_id`=:app_id";
                break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_AUTHORIZATIONS'] . "` WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function getAuthorization($iProfileId, $iAppId)
    {
        $aAuthorization = $this->getAuthorizations([
            'sample' => 'profile_app_ids', 
            'profile_id' => $iProfileId, 
            'app_id' => $iAppId
        ]);

        return ($aAuthorization['access_token'] ?? false) ? $aAuthorization : false;
    }

    public function isAuthorization($iProfileId, $iAppId)
    {
        return $this->getAuthorization($iProfileId, $iAppId) !== false;
    }

    public function insertAuthorization($iProfileId, $iAppId, $aAccessToken)
    {
        $CNF = &$this->_oConfig->CNF;
        
        $iNow = time();
        $aItems = array_merge(['profile_id', 'app_id', 'added', 'changed'], array_keys($aAccessToken));

        return $this->query("INSERT INTO `" . $CNF['TABLE_AUTHORIZATIONS'] . "`(`" . implode('`, `', $aItems) . "`) VALUES(:" . implode(', :', $aItems) . ") ON DUPLICATE KEY UPDATE `changed`=:changed, " . $this->arrayToSQL($aAccessToken), array_merge([
            'profile_id' => $iProfileId,
            'app_id' => $iAppId,
            'added' => $iNow,
            'changed' => $iNow
        ], $aAccessToken));
    }

    public function getSettings($aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];

        $sSelectClause = "*";
        $sWhereClause = $sOrderClause = "";

        switch($aParams['sample']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'id' => $aParams['id']
                ];

                $sWhereClause .= " AND `id`=:id";
                break;

            case 'profile_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'profile_id' => $aParams['profile_id']
                ];

                $sWhereClause .= " AND `profile_id`=:profile_id";
                break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_SETTINGS'] . "` WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }
}

/** @} */
