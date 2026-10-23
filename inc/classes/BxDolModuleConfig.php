<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Base class for Config classes in modules engine.
 *
 * The object of the class contains different basic configuration settings which are necessary for all modules.
 *
 *
 * Example of usage:
 * refer to any BoonEx module
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

class BxDolModuleConfig extends BxDol
{
    protected $_iId;

    protected $_sName;

    protected $_sVendor;

    protected $_sClassPrefix;

    protected $_sDbPrefix;

    protected $_sDirectory;

    protected $_sUri;

    protected $_sHomePath;

    protected $_sClassPath;

    protected $_sHomeUrl;

    protected $_bEnabled;

    /**
     * constructor
     */
    public function __construct($aModule)
    {
        parent::__construct();

        $this->_iId = empty($aModule['id']) ? 0 : (int)$aModule['id'];
        $this->_sName = isset($aModule['name']) ? $aModule['name'] : '';
        $this->_sVendor = $aModule['vendor'];
        $this->_sClassPrefix = $aModule['class_prefix'];
        $this->_sDbPrefix = $aModule['db_prefix'];

        $this->_sDirectory = $aModule['path'];
        $this->_sHomePath = BX_DIRECTORY_PATH_MODULES . $this->_sDirectory;
        $this->_sClassPath = $this->_sHomePath . 'classes/';

        $this->_sUri = $aModule['uri'];
        $this->_sHomeUrl = BX_DOL_URL_MODULES . $this->_sDirectory;

        $this->_bEnabled = (int)$aModule['enabled'] != 0;
    }
    function getId()
    {
        return $this->_iId;
    }
    function getName()
    {
        return $this->_sName;
    }
    function getClassPrefix()
    {
        return $this->_sClassPrefix;
    }
    function getDbPrefix()
    {
        return $this->_sDbPrefix;
    }
    function getDirectory()
    {
        return $this->_sDirectory;
    }
    function getHomePath()
    {
        return $this->_sHomePath;
    }
    function getClassPath()
    {
        return $this->_sClassPath;
    }
    /**
     * Get unique URI.
     *
     * @return string with unique URI.
     */
    function getUri()
    {
        return $this->_sUri;
    }
    /**
     * Get base URI which depends on the Permalinks mechanism.
     *
     * example /modules/?r=module_uri or /m/module_uri
     * @return string with base URI.
     */
    function getBaseUri()
    {
        return BxDolPermalinks::getInstance()->permalink('modules/?r=' . $this->_sUri . '/');
    }
    /**
     * Get full URL.
     *
     * @return string with full URL.
     */
    function getHomeUrl()
    {
        return $this->_sHomeUrl;
    }

    function isEnabled()
    {
        return $this->_bEnabled;
    }
}

/** @} */
