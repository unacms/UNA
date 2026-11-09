<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolModuleQuery extends BxDolDb implements iBxDolSingleton
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
        $sClass = __CLASS__;
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new $sClass();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    function getModuleById($iId, $bFromCache = true)
    {
        $sSql = $this->prepare("SELECT * FROM `sys_modules` WHERE `id`=? LIMIT 1", $iId);
        return $bFromCache ? $this->fromMemory('sys_modules_' . $iId, 'getRow', $sSql) : $this->getRow($sSql);
    }
    function getModuleByName($sName, $bFromCache = true)
    {            
        if ($bFromCache) {
            /**
             * It's read on every service call, so the list is kept in memory for the request too.
             * The memory key can't be 'sys_modules_*', which getModuleByUri uses for any uri.
             */
            $sSql = "SELECT * FROM `sys_modules`";
            $a = $this->fromMemory('BxDolModuleQuery::getModuleByName', 'fromCache', 'sys_modules_list', 'getAllWithKey', $sSql, 'name');
            if ($a && isset($a[$sName]))
                return $a[$sName];
            return false;
        } else {
            $sSql = $this->prepare("SELECT * FROM `sys_modules` WHERE `name`=? LIMIT 1", $sName);
            return $this->getRow($sSql);
        }
    }
    /**
     * Clean the modules list which getModuleByName reads, in the cache and in memory.
     */
    public function cleanModulesListCache()
    {
        $this->cleanMemory('BxDolModuleQuery::getModuleByName');
        return $this->cleanCache('sys_modules_list');
    }
    function getModuleByUri($sUri, $bFromCache = true)
    {
        $sSql = $this->prepare("SELECT * FROM `sys_modules` WHERE `uri`=? LIMIT 1", $sUri);
        return $bFromCache ? $this->fromMemory('sys_modules_' . $sUri, 'getRow', $sSql) : $this->getRow($sSql);
    }
    function enableModuleByUri($sUri)
    {
        $sSql = $this->prepare("UPDATE `sys_modules` SET `enabled`='1' WHERE `uri`=? LIMIT 1", $sUri);
        $bRet = (int)$this->query($sSql) > 0;
        if ($bRet)
            $this->cleanModulesListCache();
        return $bRet;
    }
    function disableModuleByUri($sUri)
    {
        $sSql = $this->prepare("UPDATE `sys_modules` SET `enabled`='0' WHERE `uri`=? LIMIT 1", $sUri);
        $bRet = (int)$this->query($sSql) > 0;
        if ($bRet)
            $this->cleanModulesListCache();
        return $bRet;
    }
    function setModulePendingUninstall($sUri, $bPendingUninstall)
    {
        $sSql = $this->prepare("UPDATE `sys_modules` SET `pending_uninstall` = ? WHERE `uri` = ? LIMIT 1", $bPendingUninstall ? 1 : 0, $sUri);
        $bRet = $this->query($sSql);
        if ($bRet)
            $this->cleanModulesListCache();
        return $bRet;
    }
    function isModule($sUri)
    {
        $sSql = $this->prepare("SELECT `id` FROM `sys_modules` WHERE `uri`=? LIMIT 1", $sUri);
        return (int)$this->fromMemory('sys_module_' . $sUri, 'getOne', $sSql) > 0;
    }
    function isModuleByName($sName)
    {
        $sSql = $this->prepare("SELECT `id` FROM `sys_modules` WHERE `name`=? LIMIT 1", $sName);
        return (int)$this->fromMemory('sys_module_' . $sName, 'getOne', $sSql) > 0;
    }
    function isModuleParamsUsed($sName, $sUri, $sPath, $sPrefixDb, $sPrefixClass)
    {
        $sSql = "SELECT `id` FROM `sys_modules` WHERE `name`=:name || `uri`=:uri || `path`=:path || `db_prefix`=:db_prefix || `class_prefix`=:class_prefix LIMIT 1";
        return (int)$this->getOne($sSql, [
            'name' => $sName,
            'uri' => $sUri,
            'path' => $sPath,
            'db_prefix' => $sPrefixDb,
            'class_prefix' => $sPrefixClass
        ]) > 0;
    }
    function isEnabled($sUri)
    {
        $sSql = $this->prepare("SELECT `id` FROM `sys_modules` WHERE `uri`=? AND `enabled`='1' LIMIT 1", $sUri);
        return (int)$this->fromMemory('sys_module_enabled_' . $sUri, 'getOne', $sSql) > 0;
    }
    function isEnabledByName($sName)
    {
        $sSql = $this->prepare("SELECT `id` FROM `sys_modules` WHERE `name`=? AND `enabled`='1' LIMIT 1", $sName);
        return (int)$this->fromMemory('sys_module_enabled_' . $sName, 'getOne', $sSql) > 0;
    }
    function getModules()
    {
        $sSql = "SELECT * FROM `sys_modules` ORDER BY `title`";
        return $this->fromMemory('sys_modules', 'getAll', $sSql);
    }
    function getModulesBy($aParams = array(), $bFromCache = true)
    {
    	$aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sPostfix = $sWhereClause = $sOrderByClause = "";
        $sSelectClause = "`id`, `type`, `name`, `title`, `vendor`, `version`, `help_url`, `path`, `uri`, `class_prefix`, `db_prefix`, `lang_category`, `date`, `enabled`";
        $aBindings = [];

        switch($aParams['type']) {
            case 'type':
                if(!is_array($aParams['value']))
                    $aParams['value'] = array($aParams['value']);

                $sPostfix .= '_type_' . implode('_', $aParams['value']);
                $sWhereClause .= " AND `type` IN (" . $this->implode_escape($aParams['value']) . ")";
                break;

            case 'modules':
                $sPostfix .= '_modules';
                $aBindings['type'] = BX_DOL_MODULE_TYPE_MODULE;

                $sWhereClause .= " AND `type`=:type";
                break;

            case 'modules_subtypes':
                $sPostfix .= '_modules_subtypes_';

                if(isset($aParams['id_as_key']) && $aParams['id_as_key'] === true) {
                    $sPostfix .= 'id_as_key_';
                            
                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = 'id';
                }

                if(isset($aParams['name_as_key']) && $aParams['name_as_key'] === true) {
                    $sPostfix .= 'name_as_key_';

                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = 'name';
                }

                if(!is_array($aParams['value']))
                    $aParams['value'] = [$aParams['value']];

                $sPostfix .= implode('_', $aParams['value']);
                $aBindings['type'] = BX_DOL_MODULE_TYPE_MODULE;

                $iSubtypes = 0;
                foreach($aParams['value'] as $iSubtype) 
                    $iSubtypes |= pow(2, $iSubtype);

                $aBindings['subtypes'] = $iSubtypes;

                $sWhereClause .= " AND `type`=:type AND `subtypes` & :subtypes";
                break;

            case 'is_module_subtype':
                $sPostfix .= '_is_module_' . $aParams['subtype'] . '_' . $aParams['name'];
                $aMethod['name'] = 'getOne';
                $aBindings = [
                    'type' => BX_DOL_MODULE_TYPE_MODULE,
                    'subtypes' => pow(2, (int)$aParams['subtype']),
                    'name' => $aParams['name']
                ];
                $sSelectClause = "`id`";
                $sWhereClause .= " AND `type`=:type AND `subtypes` & :subtypes AND `name`=:name";
                break;

            case 'languages':
                $sPostfix .= '_languages';
                $aBindings['type'] = BX_DOL_MODULE_TYPE_LANGUAGE;

                $sWhereClause .= " AND `type`=:type";
                break;

            case 'templates':
                $sPostfix .= '_templates';
                $aBindings['type'] = BX_DOL_MODULE_TYPE_TEMPLATE;

                $sWhereClause .= " AND `type`=:type";
                break;

            case 'path_and_uri':
                $sPostfix .= '_path_and_uri_' . $aParams['path'] . '_' . $aParams['uri'];
            	$aMethod['name'] = 'getRow';
            	$aBindings = array_merge($aBindings, array(
                    'path' => $aParams['path'],
                    'uri' => $aParams['uri']
                ));

            	$sWhereClause .= " AND `path`=:path AND `uri`=:uri";
            	break;

            case 'all_pairs_name_uri':
                $sPostfix .= 'all_pairs_name_uri';
            	$aMethod['name'] = 'getPairs';
            	$aMethod['params'][1] = 'name';
            	$aMethod['params'][2] = 'uri';
            	break;

            case 'all_key_name':
                $sPostfix .= 'all_key_name';
            	$aMethod['name'] = 'getAllWithKey';
            	$aMethod['params'][1] = 'name';
            	break;

            case 'all':
            	break;
        }

        if(isset($aParams['active'])) {
            $sPostfix .= "_active";
            $aBindings['enabled'] = (int)$aParams['active'];

            $sWhereClause .= " AND `enabled`=:enabled";
        }

        $sOrderByClause = " ORDER BY " . (isset($aParams['order_by']) ? $aParams['order_by'] : '`title`');

        $aMethod['params'][0] = "SELECT " . $sSelectClause . "
            FROM `sys_modules`
            WHERE 1 " . $sWhereClause . $sOrderByClause;
        $aMethod['params'][] = $aBindings;

        if(!$bFromCache || empty($sPostfix))
            return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        return call_user_func_array(array($this, 'fromMemory'), array_merge(array('sys_modules' . $sPostfix, $aMethod['name']), $aMethod['params']));
    }
    
    function isModuleContent($sName)
    {
        return (int)$this->getModulesBy(['type' => 'is_module_subtype', 'subtype' => BX_DOL_MODULE_SUBTYPE_TEXT, 'name' => $sName]) != 0;
    }
    
    function isModuleContext($sName)
    {
        return (int)$this->getModulesBy(['type' => 'is_module_subtype', 'subtype' => BX_DOL_MODULE_SUBTYPE_CONTEXT, 'name' => $sName]) != 0;
    }
    
    function isModuleProfile($sName)
    {
        return (int)$this->getModulesBy(['type' => 'is_module_subtype', 'subtype' => BX_DOL_MODULE_SUBTYPE_PROFILE, 'name' => $sName]) != 0;
    }

    function getModulesUri()
    {
        return $this->fromMemory('sys_modules_uri', 'getColumn', 'SELECT `uri` FROM `sys_modules` ORDER BY `uri`');
    }

    function getDependent($sName, $sUri)
    {
        $aResults = array();

        $aModules = $this->getAll("SELECT `id`, `title`, `dependencies`, `enabled` FROM `sys_modules` WHERE (`dependencies` LIKE " . $this->escape('%' . $sName . '%') . " OR `dependencies` LIKE " . $this->escape('%' . $sUri . '%') . ") AND `enabled`='1'");
        foreach($aModules as $aModule) {
            $aDependencies = explode(',', $aModule['dependencies']);
            if(in_array($sName, $aDependencies) || in_array($sUri, $aDependencies))
                $aResults[] = $aModule;
        }

        return $aResults;
    }

    public function updateModule($aParamsSet, $aParamsWhere = array())
    {
        if(empty($aParamsSet))
            return false;

        $sWhereClause = !empty($aParamsWhere) ? $this->arrayToSQL($aParamsWhere, " AND ") : "1";

        $sSql = "UPDATE `sys_modules` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $sWhereClause;
        $mixedRet = $this->query($sSql);
        if ($mixedRet)
            $this->cleanModulesListCache();
        return $mixedRet;        
    }
    
    public function checkModulesSubtypes()
    {
        return (int)$this->getOne("SELECT COUNT(`id`) FROM `sys_modules` WHERE `type` = :type AND `subtypes` <> 0", [
            'type' => BX_DOL_MODULE_TYPE_MODULE
        ]) > 0;
    }
}

/** @} */
