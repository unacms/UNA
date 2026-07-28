<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_REQUEST_ERROR_MODULE_NOT_FOUND', 1);
define('BX_DOL_REQUEST_ERROR_PAGE_NOT_FOUND', 2);

class BxDolRequest extends BxDol
{
    function __construct()
    {
        parent::__construct();
    }
    public static function processAsFile($aModule, &$aRequest)
    {
        if(empty($aRequest) || ($sFileName = array_shift($aRequest)) == "")
            $sFileName = 'index';

        $sFile = BX_DIRECTORY_PATH_MODULES . $aModule['path'] . $sFileName . '.php';
        if(!file_exists($sFile))
            BxDolRequest::pageNotFound($sFileName, $aModule['uri']);
        else {
            if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->beginModule('file', ($sPrHash = uniqid(rand())), $aModule, $sFileName);
            include($sFile);
            if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->endModule('file', $sPrHash);
        }
    }
    public static function processAsAction($aModule, &$aRequest, $sClass = "Module")
    {
        $sAction = empty($aRequest) || (isset($aRequest[0]) && empty($aRequest[0])) ? 'Home' : array_shift($aRequest);
        $sMethod = 'action' . bx_gen_method_name($sAction);

        if(isset($GLOBALS['bx_profiler']))
            $GLOBALS['bx_profiler']->beginModule('action', ($sPrHash = uniqid(rand())), $aModule, $sClass, $sMethod);

        $mixedRet = BxDolRequest::_perform($aModule, $sClass, $sMethod, $aRequest);

        if(isset($GLOBALS['bx_profiler']))
            $GLOBALS['bx_profiler']->endModule('action', $sPrHash);

        return $mixedRet;
    }
    public static function processAsService($aModule, $sMethod, $aParams, $sClass = "Module")
    {
        if (isset($aModule['name']) && 'system' == $aModule['name'] && 'Module' == $sClass)
            $sClass = 'BaseServices';
        $sMethod = 'service' . bx_gen_method_name($sMethod);

        if(isset($GLOBALS['bx_profiler']))
            $GLOBALS['bx_profiler']->beginModule('service', ($sPrHash = uniqid(rand())), $aModule, $sClass, $sMethod);

        $mixedRet = BxDolRequest::_perform($aModule, $sClass, $sMethod, $aParams, false);

        if(isset($GLOBALS['bx_profiler']))
            $GLOBALS['bx_profiler']->endModule('service', $sPrHash);

        return $mixedRet;
    }
    public static function serviceExists($mixedModule, $sMethod, $sClass = "Module", $bIgnoreInactive = false)
    {
        return BxDolRequest::_methodExists($mixedModule, 'service', $sMethod, $sClass, $bIgnoreInactive);
    }
    public static function actionExists($mixedModule, $sMethod, $sClass = "Module")
    {
        return BxDolRequest::_methodExists($mixedModule, 'action', $sMethod, $sClass);
    }
    public static function moduleNotFound($sModule)
    {
        BxDolRequest::_error('module', $sModule);
    }
    public static function pageNotFound($sPage, $sModule)
    {
        BxDolRequest::_error('page', $sPage, $sModule);
    }
    public static function methodNotFound($sMethod, $sModule)
    {
        BxDolRequest::_error('method', $sMethod, $sModule);
    }

    /**
     * Check if number of arguments is not less than number of requires arguments
     * @return  0 - if number of args is correct
     *          1 - if method or class wasn't found
     *          2 - if number of args less than number of required arguments
     *          3 - if number of args more than number of optional + required arguments
     */
    public static function checkCall($aModule, $sMethod, $aParams, $sClass)
    {
        if (isset($aModule['name']) && 'system' == $aModule['name'] && 'Module' == $sClass)
            $sClass = 'BaseServices';
        $sMethod = 'service' . bx_gen_method_name($sMethod);
        $sClass = $aModule['class_prefix'] . $sClass;

        $oModule = BxDolRequest::_require($aModule, $sClass);
        if($oModule === false)
            return 1;

        $iArgs = count($aParams);
        $r = new ReflectionMethod($sClass, $sMethod);

        $iArgsRequired = $r->getNumberOfRequiredParameters();
        if ($iArgs < $iArgsRequired)
            return 2;

        $iArgsAll = $r->getNumberOfParameters();
        if ($iArgs > $iArgsAll)
            return 3;

        return 0;
    }

    protected static function _perform($aModule, $sClass, $sMethod, $aParams, $bTerminateOnError = true)
    {
        $sClass = $aModule['class_prefix'] . $sClass;

        $oModule = BxDolRequest::_require($aModule, $sClass);
        if($oModule === false && $bTerminateOnError)
            BxDolRequest::methodNotFound($sMethod, $aModule['uri']);
        else if($oModule === false && !$bTerminateOnError)
            return false;

        $bMethod = method_exists($oModule, $sMethod);
        if($bMethod)
            return call_user_func_array(array($oModule, $sMethod), $aParams);
        else if(!$bMethod && $bTerminateOnError)
            BxDolRequest::methodNotFound($sMethod, $aModule['uri']);
        else if(!$bMethod && !$bTerminateOnError)
            return false;
    }

    protected static function _require($aModule, $sClass)
    {
        if(isset($GLOBALS['bxDolClasses'][$sClass]))
            return $GLOBALS['bxDolClasses'][$sClass];

        $bPath = $aModule['name'] != 'system' && $aModule['path'];
        if(($bPath && !preg_match('/^[A-Za-z0-9_]+\/[A-Za-z0-9_]+\/$/', $aModule['path'])) || !preg_match('/^[A-Za-z0-9_]+$/', $sClass))
            return false;

        if($bPath) {
            $sFile = BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'classes/' . $sClass . '.php';
            if(!file_exists($sFile))
                return false;

            require_once($sFile);
        } 

        if(!class_exists($sClass))
            return false;

        $GLOBALS['bxDolClasses'][$sClass] = new $sClass($aModule);
        return $GLOBALS['bxDolClasses'][$sClass];
    }
    protected static function _methodExists($mixedModule, $sMethodType, $sMethodName, $sClass = "Module", $bIgnoreInactive = false)
    {
        $aModule = $mixedModule;
        if(is_string($mixedModule)) {
            $oModuleQuery = BxDolModuleQuery::getInstance();

            $aModule = [];
            if($bIgnoreInactive || $oModuleQuery->isEnabledByName($mixedModule))
                $aModule = $oModuleQuery->getModuleByName($mixedModule);
        }

        if (!$aModule)
            return false;

        if (isset($aModule['name']) && 'system' == $aModule['name'] && 'Module' == $sClass)
            $sClass = 'BaseServices';

        $sClass = $aModule['class_prefix'] . $sClass;
        if(($oModule = BxDolRequest::_require($aModule, $sClass)) === false)
            return false;

        $sMethod = $sMethodType . bx_gen_method_name($sMethodName);
        return method_exists($oModule, $sMethod);
    }
    protected static function _error($sType, $sParam1 = '', $sParam2 = '')
    {
        BxDolTemplate::getInstance()->displayPageNotFound(array(
            'title' => _t("_sys_request_" . $sType . "_not_found_cpt"),
            'content' => _t("_sys_request_" . $sType . "_not_found_cnt", bx_process_output($sParam1), bx_process_output($sParam2))
        ), BX_PAGE_DEFAULT, BX_DB_PADDING_NO_CAPTION);
    }
}

/** @} */
