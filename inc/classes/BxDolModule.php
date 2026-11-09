<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Base class for Module classes in modules engine.
 *
 * The object of the class contains major objects of the whole module. They are:
 * a. An object of config class
 * @see BxDolModuleConfig
 *
 * b. An object of database class.
 * @see BxDolModuleQuery
 *
 * c. An object of template class.
 * @see BxDolTemplate
 *
 *
 * Example of usage:
 * refer to any BoonEx module
 *
 *
 * Static Methods:
 *
 * Get an instance of a module's class.
 * @see BxDolModule::getInstance($sClassName)
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
class BxDolModule extends BxDol
{
    public $_aModule;
    private $_aInstancesStorage = [];
    private $_aInstancesToStore = ['_oDb' => '_initDb', '_oTemplate' => '_initTemplate', '_oConfig' => '_initConfig'];

    /**
     * constructor
     */
    public function __construct($aModule)
    {
        parent::__construct();
        $this->_aModule = $aModule;
    }

    public function __get($sName) {
        if (isset($this->_aInstancesToStore[$sName])) {
            $sMethod = $this->_aInstancesToStore[$sName];
            return $this->_aInstancesStorage[$sName] ??= $this->$sMethod();
        }
        throw new \Exception("Unknown property: $sName");
    }

    public function __set($sName, $o) {
        if (isset($this->_aInstancesToStore[$sName])) {
            $this->_aInstancesStorage[$sName] = $o;
        }
        throw new \Exception("Unknown property: $sName");
    }

    private function _initDb():BxDolModuleDb {
        $sClassPrefix = $this->_aModule['class_prefix'];
        $sClassPath = BX_DIRECTORY_PATH_MODULES . $this->_aModule['path'] . 'classes/';

        $sClassName = $sClassPrefix . 'Db';
        require_once($sClassPath . $sClassName . '.php');

        /** @var BxDolDb $oDb */
        $oDb = new $sClassName($this->_oConfig);
        return $oDb;
    }
    
    private function _initConfig():BxDolModuleConfig {
        $sClassPrefix = $this->_aModule['class_prefix'];
        $sClassPath = BX_DIRECTORY_PATH_MODULES . $this->_aModule['path'] . 'classes/';

        $sClassName = $sClassPrefix . 'Config';
        require_once($sClassPath . $sClassName . '.php');

        /** @var BxDolModuleConfig $oConfig */
        $oConfig = new $sClassName($this->_aModule);
        return $oConfig;
    }

    private function _initTemplate():BxDolModuleProxy {
        $sClassPrefix = $this->_aModule['class_prefix'];
        $sClassPath = BX_DIRECTORY_PATH_MODULES . $this->_aModule['path'] . 'classes/';

        $sClassName = $sClassPrefix . 'Template';
        require_once($sClassPath . $sClassName . '.php');

        /** @var BxDolTemplate $oTemplate */
        $oTemplate = new $sClassName($this->_oConfig, $this->_oDb); 
        $oTemplate->init();

        return new BxDolModuleProxy('module_template', $oTemplate);
    }

    /**
     * Static method to get an instance of a module's class.
     *
     * @param $sName module name.
     */
    public static function getInstance($sName)
    {
        if (empty($sName))
            return null;

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sName);
        if (empty($aModule) || !is_array($aModule))
            return null;

        $sClassName = $aModule['class_prefix'] . 'Module';

        if ('system' != $sName) {

            if (isset($GLOBALS['bxDolClasses'][$sClassName]))
                return $GLOBALS['bxDolClasses'][$sClassName];

            $sClassPath = BX_DIRECTORY_PATH_MODULES . $aModule['path'] . '/classes/' . $sClassName . '.php';
            if (!file_exists($sClassPath))
                return null;
            require_once($sClassPath);

            $GLOBALS['bxDolClasses'][$sClassName] = new $sClassName($aModule);
            return $GLOBALS['bxDolClasses'][$sClassName];

        } else {

            $sClassName = 'BxTemplServices';
            return bx_instance($sClassName, array($aModule));

        }
    }

    public static function getTitle($sUri)
    {   
        return _t(self::getTitleKey($sUri));
    }

    public static function getTitleKey($sUri)
    {
        return 'system' == $sUri ? '_adm_txt_module_system' : '_sys_module_' . strtolower(str_replace(' ', '_', $sUri));
    }

	/**
     * is module enabled
     */
    function isEnabled()
    {
        return (int)$this->_aModule['enabled'] == 1;
    }

    /**
     * get module name
     */
    function getName()
    {
        return $this->_aModule['name'];
    }

    /**
     * Check whether user logged in or not.
     *
     * @return boolean result of operation.
     */
    public function isLogged()
    {
        return isLogged();
    }

    /**
     * Get currently logged in user ID.
     *
     * @return integer user ID.
     */
    public function getUserId()
    {
        return getLoggedId();
    }

    /**
     * Get currently logged in user password.
     *
     * @return string user password.
     */
    public function getUserPassword ()
    {
        return getLoggedPassword();
    }

    public function serviceIsSafeService($s)
    {
        $sService = bx_gen_method_name($s);
        $aServices = $this->serviceGetSafeServices();
        return isset($aServices[$sService]);
    }

    public function serviceGetSafeServices()
    {
        return array();
    }

    public function serviceIsPublicService($s)
    {
        $sService = bx_gen_method_name($s);
        $aServices = $this->serviceGetPublicServices();
        return isset($aServices[$sService]);
    }

    public function serviceGetPublicServices()
    {
        return array();
    }

    /**
     * Whether the API may let browsers and shared caches keep a guest's answer from this service
     * (see bx_api_cache_response). List only services whose answer depends on nothing but their
     * parameters and the language: never on the viewer, a cookie, a request header, the IP or the
     * time. A module can override this to decide by the parameters too.
     *
     * @param string $s service method name
     * @param array $aParams the parameters of the API request
     */
    public function serviceIsCacheableService($s, $aParams = [])
    {
        $sService = bx_gen_method_name($s);
        $aServices = $this->serviceGetCacheableServices();
        return isset($aServices[$sService]);
    }

    public function serviceGetCacheableServices()
    {
        return array();
    }
}

/** @} */
