<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Service calls to modules' methods.
 *
 * The class has one static method to make service calls to the module's methods
 *
 *
 * Example of usage:
 * @code
 * $isSpam = BxDolService::call('bx_antispam', 'is_spam', array($sText));
 * @endcode
 *
 *
 * Memberships/ACL:
 * Doesn't depend on user's membership.
 *
 *
 * Alerts:
 * no alerts available
 *
 */
class BxDolService extends BxDol
{
    static protected $_aMemoryCache = array();
    static protected $_aExternalCall = null;

    /**
     * Perform serice call
     * @param $mixed module name or module id
     * @param $sMethod service method name in format 'method_name', corresponding class metod is serviceMethodName
     * @param $aParams params to pass to service method
     * @param $sClass class to search for service method, by default it is main module class
     * @return service call result
     */
    public static function call($mixed, $sMethod, $aParams = array(), $sClass = 'Module', $bIgnoreCache = false, $bIgnoreInactive = false)
    {
        $aModule = self::getModule($mixed);
        if (empty($aModule) || ((int)$aModule['enabled'] == 0 && !$bIgnoreInactive))
            return '';

        $sKey = md5($mixed . $sMethod . print_r($aParams, true) . $sClass . bx_get_logged_profile_id());
        if (!$bIgnoreCache && isset(self::$_aMemoryCache[$sKey]))
            return self::$_aMemoryCache[$sKey];

        self::$_aMemoryCache[$sKey] = BxDolRequest::processAsService($aModule, $sMethod, array_values($aParams), $sClass);

        return self::$_aMemoryCache[$sKey];
    }

    /**
     * Perform service call on behalf of an outside caller: API, OAuth API or a macro in content.
     * Services can tell such a call from an internal one with isExternalCall and return less data.
     * The result is cached apart from internal calls, because it may be reduced for the caller.
     */
    public static function callExternal($mixed, $sMethod, $aParams = array(), $sClass = 'Module', $bIgnoreCache = false)
    {
        $aModule = self::getModule($mixed);
        if (empty($aModule) || (int)$aModule['enabled'] == 0)
            return '';

        $sKey = 'external' . md5($mixed . $sMethod . print_r($aParams, true) . $sClass . bx_get_logged_profile_id());
        if (!$bIgnoreCache && isset(self::$_aMemoryCache[$sKey]))
            return self::$_aMemoryCache[$sKey];

        $aPrev = self::$_aExternalCall;
        self::$_aExternalCall = array($aModule['name'], bx_gen_method_name($sMethod));
        try {
            self::$_aMemoryCache[$sKey] = BxDolRequest::processAsService($aModule, $sMethod, array_values($aParams), $sClass);
        } finally {
            self::$_aExternalCall = $aPrev;
        }

        return self::$_aMemoryCache[$sKey];
    }

    /**
     * Whether an outside caller (api.php, the OAuth2 API) may call the service in this class
     * as the signed-in member. See isServiceListed.
     */
    public static function isSafeService($mixedModule, $sMethod, $sClass = 'Module')
    {
        return self::isServiceListed($mixedModule, $sMethod, $sClass, 'get_safe_services');
    }

    /**
     * Whether an outside caller may call the service in this class without signing in.
     * See isServiceListed.
     */
    public static function isPublicService($mixedModule, $sMethod, $sClass = 'Module')
    {
        return self::isServiceListed($mixedModule, $sMethod, $sClass, 'get_public_services');
    }

    /**
     * Whether a macro in content (callMacro) may call the service in this class.
     * A macro runs as whoever views the content, not as its author, so the list
     * (get_macro_services) holds services which only show something.
     */
    public static function isMacroService($mixedModule, $sMethod, $sClass = 'Module')
    {
        return self::isServiceListed($mixedModule, $sMethod, $sClass, 'get_macro_services');
    }

    /**
     * Whether a service is in a list the module publishes for the class it is called in.
     *
     * A list maps a method name ('GetMenu') to the class the method is allowed in:
     * '' for the module's main class, a class name ('BxBaseServicePages'), or an array of them
     * when the same name is allowed in several classes. The class a request names
     * ('TemplServicePages') must be that class or extend it, so a name allowed in one class
     * doesn't open a method with the same name in another.
     *
     * @param $mixedModule module name or id
     * @param $sMethod service method name, 'get_menu' or 'GetMenu'
     * @param $sClass class the request names, as for call
     * @param $sListService service which returns the list: get_safe_services, get_public_services or get_macro_services
     */
    public static function isServiceListed($mixedModule, $sMethod, $sClass, $sListService)
    {
        if (!is_string($sMethod) || !is_string($sClass) || !preg_match('/^[A-Za-z0-9_]+$/', $sMethod) || !preg_match('/^[A-Za-z0-9_]+$/', $sClass))
            return false;

        $aModule = self::getModule($mixedModule);
        if (empty($aModule) || (int)$aModule['enabled'] == 0)
            return false;

        $bSystem = 'system' == $aModule['name'];
        $sListClass = $bSystem ? 'TemplServices' : 'Module';
        if (!BxDolRequest::serviceExists($aModule, $sListService, $sListClass) || !BxDolRequest::serviceExists($aModule, $sMethod, $sClass))
            return false;

        $aList = self::call($aModule['name'], $sListService, [], $sListClass);
        $sKey = bx_gen_method_name($sMethod);
        if (!is_array($aList) || !array_key_exists($sKey, $aList))
            return false;

        // serviceExists above has loaded the class
        $sCalled = $aModule['class_prefix'] . ($bSystem && 'Module' == $sClass ? 'BaseServices' : $sClass);
        foreach ((array)$aList[$sKey] as $sAllowed) {
            if (!is_string($sAllowed))
                continue;
            if ('' === $sAllowed)
                $sAllowed = $aModule['class_prefix'] . ($bSystem ? 'BaseServices' : 'Module');
            if (is_a($sCalled, $sAllowed, true))
                return true;
        }

        return false;
    }

    /**
     * Check if the service which is running right now was called by an outside caller (see callExternal).
     * Services which are called by that service internally are not external.
     */
    public static function isExternalCall($sModule, $sMethod)
    {
        return self::$_aExternalCall !== null && self::$_aExternalCall === array($sModule, bx_gen_method_name($sMethod));
    }

    /**
     * Perform serice call by accepting serialized array of service call parameters:
     * @code
     *     array (
     *         'module' => 'system', // module name
     *         'method' => 'test', // service method name
     *         'params' => array(), // array of parameters to pass to service method
     *         'class' => 'Module', // class to search service method in
     *     )
     * @endcode
     *
     * @param $s serialized array of serice call
     * @param $aMarkers service method name in format 'method_name', corresponding class metod is serviceMethodName
     * @param $sReplaceIn params to pass to service method
     * @return service call result
     */
    public static function callSerialized($s, $aMarkers = array(), $sReplaceIn = 'params')
    {
        $a = self::decodeServiceCall($s);
        if (false === $a)
            return '';

        if (isset($a[$sReplaceIn]) && $aMarkers)
            $a[$sReplaceIn] = bx_replace_markers($a[$sReplaceIn], $aMarkers);

        return self::call($a['module'], $a['method'], isset($a['params']) ? $a['params'] : array(), isset($a['class']) ? $a['class'] : 'Module', isset($a['ignore_cache']) ? $a['ignore_cache'] : false);
    }

    public static function callMacro($s, $aMarkers = array())
    {
        // replace markers
        if ($aMarkers)
            $s = bx_replace_markers($s, $aMarkers);

        // check for correct macros
        if (!preg_match("/^([a-zA-Z0-9_\:]+)(.*)$/", $s, $aMatches))
            return _t('_sys_macros_malformed');

        $a = explode(":", $aMatches[1]);
        if (!isset($a[0]) || !isset($a[1]))
            return _t('_sys_macros_malformed');

        $aParams = array();
        if (!empty($aMatches[2]))
            $aParams = json_decode($aMatches[2], true);
        if (null === $aParams)
            return _t('_sys_macros_malformed');

        // check if macros is allowed: a macro runs as the viewer, so only services in the macro list
        if (!self::isMacroService($a[0], $a[1], isset($a[2]) ? $a[2] : 'Module'))
            return _t('_sys_macros_unsafe');

        // check module, method and number of arguments
        $aModule = self::getModule($a[0]);
        if (empty($aModule))
            return _t('_sys_macros_method_or_class_not_found');
        $iCheck = BxDolRequest::checkCall($aModule, $a[1], $aParams, isset($a[2]) ? $a[2] : 'Module');
        switch ($iCheck) {
            case 1: 
                return _t('_sys_macros_method_or_class_not_found');
            case 2:
                return _t('_sys_macros_required_args_missing');
            case 3:
                return _t('_sys_macros_too_many_args');
        }

        // perform call
        $mixed = self::callExternal($a[0], $a[1], $aParams, isset($a[2]) ? $a[2] : 'Module', isset($a[3]) && 'ignore_cache' == $a[3] ? true : false);

        // check result
        if (is_object($mixed))
            return _t('_sys_macros_output_not_displayable');
        if (is_array($mixed) && !isset($mixed['content']))
            return _t('_sys_macros_output_not_displayable');
        if (is_array($mixed) && isset($mixed['content']))
            return $mixed['content'];
        return $mixed;
    }

    /**
     * Check if string is a stored service call (JSON or historic PHP serialize).
     */
    public static function isSerializedService($s)
    {
        return BxDolServiceCallCodec::isEncoded($s);
    }

    /**
     * Decode a stored service-call blob. Arrays/scalars only; objects are rejected.
     */
    public static function decodeServiceCall($s)
    {
        return BxDolServiceCallCodec::decode($s);
    }

    /**
     * Encode a service call for storage. New writes are JSON, not PHP serialize.
     */
    public static function getSerializedService($mixedModule, $sMethod, $aParams = array(), $sClass = '')
    {
        return BxDolServiceCallCodec::encode($mixedModule, $sMethod, $aParams, $sClass);
    }

    protected static function getModule($mixed)
    {
        $oDb = BxDolModuleQuery::getInstance();
        if (is_string($mixed))
            $aModule = $oDb->getModuleByName($mixed);
        else
            $aModule = $oDb->getModuleById($mixed);
        return $aModule;
    }

    public static function cleanMemoryCache()
    {
        self::$_aMemoryCache = [];
    }
}

/** @} */
