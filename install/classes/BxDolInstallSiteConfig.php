<?php defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaInstall UNA Install
 * @{
 */

define('BX_INSTALL_ERR_GENERAL', 'general');
define('BX_INSTALL_FIELD_MODULES', 'modules');
define('BX_INSTALL_FIRST_MODULE', 'persons'); ///< URI of the module to install before the other modules
define('BX_INSTALL_PASSWORD_MIN_LENGTH', 8); ///< shortest admin password the web form accepts
define('BX_INSTALL_PATH_HEADER_STAGED', dirname(__DIR__, 2) . '/inc/header.installing.php'); ///< config file while the web installer installs modules
define('BX_INSTALL_PATH_QUEUE', dirname(__DIR__, 2) . '/inc/install.queue.php'); ///< modules the web installer has still to install
define('BX_INSTALL_QUEUE_COOKIE', 'bx_install_queue'); ///< cookie with the token of the queue

class BxDolInstallSiteConfig
{
    /**
     * Modules the web installer preselects: a working community a client can try at once.
     * Their dependencies are added when they are installed.
     */
    public static $aStarterModules = array(
        'persons', 'orgs',
        'timeline', 'posts', 'photos', 'videos', 'albums',
        'forum', 'groups', 'events',
        'notifications', 'messenger',
        'antispam', 'editor', 'analytics',
    );

    /**
     * Modules and templates that are discontinued: the installer doesn't offer them.
     */
    public static $aHiddenModules = array(
        'chat_plus', 'datafox', 'unacon', 'froala',
        'decorous', 'ocean',
    );

    /**
     * Groups of the module list, in the order they are shown. A module that is in no group
     * goes to 'other', so a new module shows up without a change here.
     */
    public static $aModuleGroups = array(
        'profiles' => array('persons', 'orgs'),
        'content' => array('timeline', 'posts', 'photos', 'videos', 'albums', 'files', 'polls', 'stories', 'stream', 'reviews', 'new_comments'),
        'communities' => array('forum', 'groups', 'events', 'channels', 'spaces', 'classes', 'courses', 'jobs', 'workspaces', 'wiki', 'glossary', 'resources', 'tasks', 'quoteofday'),
        'communication' => array('notifications', 'messenger', 'convos', 'reminders', 'contact', 'feedback', 'invites', 'help_tours', 'attendant', 'massmailer', 'mailchimp', 'smtpmailer'),
        'money' => array('payment', 'acl', 'market', 'ads', 'credits', 'donations', 'stripe_connect', 'shopify', 'snipcart', 'xero'),
        'admin' => array('antispam', 'editor', 'analytics', 'accounts', 'reputation', 'charts', 'mapshow', 'plyr', 'anon_follow', 'nexus', 'api', 'oauth2', 'ai_proxy'),
        'signin' => array('facebook_connect', 'googlecon', 'twitter', 'linkedin', 'github', 'azrcon', 'azrb2c', 'oktacon', 'cidaascon', 'cas', 'drupal', 'dolcon'),
        'services' => array('fontawesome', 'intercom', 'markerio', 'google_tagmanager', 'opencv', 'elasticsearch'),
        'developer' => array('developer', 'profiler', 'dolphin_migration', 'se_migration'),
        'other' => array(),
    );

    /**
     * Title of the module the batched install is installing, for an error that ends the request.
     */
    public static $sModuleInProgress = '';

    protected $_iPasswordMinLength = BX_INSTALL_PASSWORD_MIN_LENGTH;
    protected $_bModulesBatch = false;

    protected $_sSqlDb;
    protected $_sSqlMariaDb;
    protected $_sSqlAddon;
    protected $_sPatternHeader;

    protected $_aDbErrorMap;
    protected $_aConfig;

    protected $_sServerHttpHost;
    protected $_sServerPhpSelf;
    protected $_sServerDocumentRoot;

    protected $_isAutologin;

    public function __construct($sServerHttpHost = false, $sServerPhpSelf = false, $sServerDocumentRoot = false, $isAutologin = true)
    {
        $this->_sServerHttpHost = false === $sServerHttpHost ? $_SERVER['HTTP_HOST'] : $sServerHttpHost;
        $this->_sServerPhpSelf = false === $sServerPhpSelf ? $_SERVER['PHP_SELF'] : $sServerPhpSelf;
        $this->_sServerDocumentRoot = false === $sServerDocumentRoot ? $_SERVER['DOCUMENT_ROOT'] : $sServerDocumentRoot;

        $this->_isAutologin = $isAutologin;

        $this->_sSqlDb = BX_INSTALL_DIR . 'sql/system.sql';
        $this->_sSqlMariaDb = BX_INSTALL_DIR . 'sql/mariadb.sql';
        $this->_sSqlAddon = BX_INSTALL_DIR . 'sql/addon.sql';
        $this->_sPatternHeader = BX_INSTALL_DIR . 'patterns/header.inc.php';

        $this->_aDbErrorMap = array (
            'Database connect failed' => array ('fields' => array('db_host', 'db_user', 'db_password'), 'msg' => _t('_sys_inst_msg_db_err_connect')),
            'Database select failed' => array ('fields' => array('db_name'), 'msg' => _t('_sys_inst_msg_db_err_select')),
        );

        $aModulesVals = $this->getSelectValues(BX_DOL_MODULE_TYPE_MODULE);

        $this->_aConfig = array (

            // db config

            'section_db_config_open' => array(
                'name' => _t('_sys_inst_conf_section_db_config'),
                'desc' => _t('_sys_inst_conf_section_db_config_desc'),
                'func' => 'rowSectionOpen',
                'step' => 'database',
            ),

            'db_host' => array(
                'name' => _t('_sys_inst_conf_field_db_host'),
                'ex' => 'localhost',
                'desc' => _t('_sys_inst_conf_desc_db_host'),
                'def' => 'localhost',
                'check' => array('checkLength', 1),
                'db_conf' => 'host',
                'autocomplete' => 'off',
            ),
            'db_port' => array(
                'name' => _t('_sys_inst_conf_field_db_port'),
                'ex' => '3306',
                'desc' => _t('_sys_inst_conf_desc_db_port'),
                'db_conf' => 'port',
                'autocomplete' => 'off',
                'inputmode' => 'numeric',
            ),
            'db_sock' => array(
                'name' => _t('_sys_inst_conf_field_db_sock'),
                'ex' => '/tmp/mysql.sock',
                'desc' => _t('_sys_inst_conf_desc_db_sock'),
                'db_conf' => 'sock',
                'autocomplete' => 'off',
            ),
            'db_name' => array(
                'name' => _t('_sys_inst_conf_field_db_name'),
                'ex' => 'example_db',
                'desc' => _t('_sys_inst_conf_desc_db_name'),
                'def' => 'una',
                'check' => array('checkLength', 1),
                'db_conf' => 'name',
                'autocomplete' => 'off',
            ),
            'db_user' => array(
                'name' => _t('_sys_inst_conf_field_db_user'),
                'ex' => 'example_user',
                'desc' => _t('_sys_inst_conf_desc_db_user'),
                'def' => 'una',
                'check' => array('checkLength', 1),
                'db_conf' => 'user',
                'autocomplete' => 'off',
            ),
            'db_password' => array(
                'name' => _t('_sys_inst_conf_field_db_pwd'),
                'desc' => _t('_sys_inst_conf_desc_db_pwd'),
                'db_conf' => 'pwd',
                'type' => 'password',
                'autocomplete' => 'off',
            ),
            'db_engine' => array(
                'name' => _t('_sys_inst_conf_field_db_engine'),
                'desc' => _t('_sys_inst_conf_desc_db_engine'),
                'def' => 'MYISAM',
                'func' => 'rowSelect',
                'vals' => array('MYISAM' => 'MyISAM', 'INNODB' => 'InnoDB'),
                'check' => array('checkInList', array('MYISAM', 'INNODB')),
                'normalize' => 'strtoupper',
            ),

            'section_db_config_close' => array(
                'func' => 'rowSectionClose',
            ),

            // path config

            'section_site_paths_open' => array(
                'name' => _t('_sys_inst_conf_section_paths'),
                'func' => 'rowSectionOpen',
                'step' => 'site',
            ),

            'site_url' => array(
                'name' => _t('_sys_inst_conf_field_site_url'),
                'ex' => 'https://example.com/',
                'desc' => _t('_sys_inst_conf_desc_site_url'),
                'def' => 'http://',
                'def_exp' => array('defUrl', ''),
                'check' => array('checkUrl', 10),
                'type' => 'url',
                'autocomplete' => 'url',
            ),
            'root_dir' => array(
                'name' => _t('_sys_inst_conf_field_root_dir'),
                'ex' => '/home/example/public_html/',
                'desc' => _t('_sys_inst_conf_desc_root_dir'),
                'def_exp' => array('defPath', ''),
                'check' => array('checkLength', 1),
                'autocomplete' => 'off',
            ),

            'section_site_paths_close' => array(
                'func' => 'rowSectionClose',
            ),

            // site config

            'section_site_info_open' => array(
                'name' => _t('_sys_inst_conf_section_site_info'),
                'func' => 'rowSectionOpen',
                'step' => 'site',
            ),

            'site_title' => array(
                'name' => _t('_sys_inst_conf_field_site_title'),
                'ex' => 'The Best Community',
                'desc' => _t('_sys_inst_conf_desc_site_title'),
                'check' => array('checkLength', 1),
                'autocomplete' => 'organization',
            ),
            'site_email' => array(
                'name' => _t('_sys_inst_conf_field_site_email'),
                'ex' => 'no-reply@example.com',
                'desc' => _t('_sys_inst_conf_desc_site_email'),
                'check' => array('checkEmail', 3),
                'type' => 'email',
                'autocomplete' => 'off',
            ),
            'admin_email' => array(
                'name' => _t('_sys_inst_conf_field_admin_email'),
                'ex' => 'admin@example.com',
                'desc' => _t('_sys_inst_conf_desc_admin_email'),
                'check' => array('checkEmail', 3),
                'type' => 'email',
                'autocomplete' => 'email',
            ),
            'admin_username' => array(
                'name' => _t('_sys_inst_conf_field_admin_username'),
                'ex' => 'admin',
                'desc' => _t('_sys_inst_conf_desc_admin_username'),
                'check' => array('checkLength', 1),
                'autocomplete' => 'username',
            ),
            'admin_password' => array(
                'name' => _t('_sys_inst_conf_field_admin_pwd'),
                'desc' => _t('_sys_inst_conf_desc_admin_pwd', BX_INSTALL_PASSWORD_MIN_LENGTH),
                'check' => array('checkPassword', BX_INSTALL_PASSWORD_MIN_LENGTH),
                'type' => 'password',
                'autocomplete' => 'new-password',
            ),

            'section_site_info_close' => array(
                'func' => 'rowSectionClose',
            ),

            // link with the UNA account, optional

            'section_link_to_market_open' => array(
                'name' => _t('_sys_inst_conf_section_link_with_market'),
                'desc' => _t('_sys_inst_conf_desc_oauth_key_secret'),
                'func' => 'rowSectionOpen',
                'step' => 'site',
            ),

            'oauth_key' => array(
                'name' => _t('_sys_inst_conf_field_oauth_key'),
                'ex' => '123abc4d56',
                'check' => array('checkLengthExactOrEmpty', 10),
                'optional' => true,
                'autocomplete' => 'off',
            ),
            'oauth_secret' => array(
                'name' => _t('_sys_inst_conf_field_oauth_secret'),
                'ex' => '45de12368a9b367abc23512a7f0e9d1c',
                'check' => array('checkLengthExactOrEmpty', 32),
                'optional' => true,
                'type' => 'password',
                'autocomplete' => 'off',
            ),

            'section_link_to_market_close' => array(
                'func' => 'rowSectionClose',
            ),

            // modules

            'section_modules_open' => array(
                'name' => _t('_sys_inst_conf_section_modules'),
                'func' => 'rowSectionOpen',
                'step' => 'apps',
            ),

            BX_DOL_MODULE_TYPE_LANGUAGE => array(
                'name' => _t('_sys_inst_conf_field_language'),
                'desc' => _t('_sys_inst_conf_desc_language'),
                'def' => isset($_COOKIE['lang']) ? $_COOKIE['lang'] : (isset($_GET['lang']) ? $_GET['lang'] : 'en'),
                'func' => 'rowSelect',
                'vals' => $this->getSelectValues(BX_DOL_MODULE_TYPE_LANGUAGE),
            ),

            BX_DOL_MODULE_TYPE_TEMPLATE => array(
                'name' => _t('_sys_inst_conf_field_template'),
                'desc' => _t('_sys_inst_conf_desc_template'),
                'def' => 'artificer',
                'func' => 'rowSelect',
                'vals' => $this->getSelectValues(BX_DOL_MODULE_TYPE_TEMPLATE),
            ),

            // the starter set is preselected, a value from the form, command line or environment replaces it
            BX_INSTALL_FIELD_MODULES => array(
                'name' => _t('_sys_inst_conf_field_modules'),
                'desc' => _t('_sys_inst_conf_desc_modules'),
                'def' => implode(',', array_values(array_intersect(self::$aStarterModules, array_keys($aModulesVals)))),
                'func' => 'rowModules',
                'vals' => $aModulesVals,
                'multiple' => true,
            ),

            'section_modules_close' => array(
                'func' => 'rowSectionClose',
            ),

        );
    }

    public function getAutoValues($aData = array())
    {
        $aRet = array();
        foreach($this->_aConfig as $sKey => $a) {
            $sAutoMessage = '';
            $aRet[$sKey] = $this->def ($aData, $sKey, $a, $sAutoMessage);
        }
        return $aRet;
    }

    /**
     * Whether the web installer installs the modules one per request (see startModulesQueue).
     * Off for the command line, which installs everything in one run.
     */
    public function setModulesBatch($b)
    {
        $this->_bModulesBatch = (bool)$b;
    }

    /**
     * The command line accepts the short passwords that scripts and CI pass.
     */
    public function setPasswordMinLength($i)
    {
        $this->_iPasswordMinLength = max(1, (int)$i);
        $this->_aConfig['admin_password']['check'] = array('checkPassword', $this->_iPasswordMinLength);
    }

    public function getFormHtml($aData = false, $bRedirectOnSuccess = true, &$sOutputErrorMessage = null)
    {
        if (false === $aData)
            $aData = $_POST;

        $aErrorFields = array();
        if (isset($aData['site_config'])) {
            $aErrorFields = $this->processConfigData($this->processInputData($aData));
            if (empty($aErrorFields)) {
                if ($bRedirectOnSuccess) {
                    $sHost = $this->_sServerHttpHost;
                    $sUri = rtrim(dirname($this->_sServerPhpSelf), '/\\');
                    $sPage = $this->_bModulesBatch ? 'index.php?action=modules' : 'index.php';
                    $sProto = $this->proto();
                    header("Location: {$sProto}{$sHost}{$sUri}/{$sPage}");
                    exit;
                } else {
                    return true;
                }
            }
        }

        $sErrorMessage = '';
        if (isset($aErrorFields[BX_INSTALL_ERR_GENERAL]) && $aErrorFields[BX_INSTALL_ERR_GENERAL]) {
            $sErrorMessage = '<div class="bx-install-error-message bx-def-padding bx-def-margin-bottom" role="alert">' . $aErrorFields[BX_INSTALL_ERR_GENERAL] . '</div>';
            if (null !== $sOutputErrorMessage)
                $sOutputErrorMessage = strip_tags(str_replace('<br />', "\n", $aErrorFields[BX_INSTALL_ERR_GENERAL])) . (empty($aErrorFields) ? '' : ' / Fields: ' . join(',', array_keys($aErrorFields)));
        }

        $sRows = $this->getFormFields($aErrorFields, $aData);
        $sSubmitTitle = bx_html_attribute(_t('_sys_inst_conf_submit'));
        $sBackTitle = _t('_sys_inst_back');
        $sSubmitApps = bx_html_attribute(_t('_sys_inst_conf_submit_apps'));
        return <<<EOF
            {$sErrorMessage}
            <form method="post" class="bx-install-form" novalidate>
                <div class="bx-form-advanced-wrapper sys_account_wrapper">

                    {$sRows}

                    <div class="bx-install-form-nav">
                        <button type="button" class="bx-btn" data-nav="back" hidden>{$sBackTitle}</button>
                        <button type="button" class="bx-btn bx-btn-primary" data-nav="next" hidden></button>
                        <button class="bx-btn bx-btn-primary" type="submit" name="site_config" value="1" data-template="{$sSubmitApps}">{$sSubmitTitle}</button>
                    </div>

                </div>
            </form>
EOF;
    }

    public function processConfigData ($a)
    {
        $aSteps = $this->_bModulesBatch ?
            array('checkConfig', 'processConfigDataDb', 'processConfigDataHeader', 'startModulesQueue') :
            array('checkConfig', 'processConfigDataDb', 'processConfigDataHeader', 'processModules');
        foreach ($aSteps as $sFunc) {
            $aErrors = $this->{$sFunc} ($a);
            if (!empty($aErrors)) {
                if ($this->_bModulesBatch)
                    $this->clearModulesQueue(true);
                return $aErrors;
            }
        }

        return array();
    }

    protected function checkConfig($a)
    {
        $aErrorFields = array();
        foreach ($this->_aConfig as $sKey => $r) {
            if (true !== ($mixedRes = $this->check ($sKey, isset($a[$sKey]) ? $a[$sKey] : '', $r)))
                $aErrorFields[$sKey] = is_string($mixedRes) ? $mixedRes : true;
        }

        if (!empty($aErrorFields))
            $aErrorFields[BX_INSTALL_ERR_GENERAL] = _t('_sys_inst_msg_form_error');

        return $aErrorFields;
    }

    public function processConfigDataDb ($a)
    {
        $aDbConf = array ('error_checking' => false);
        foreach ($this->_aConfig as $sKey => $r)
            if (isset($this->_aConfig[$sKey]['db_conf']))
                $aDbConf[$this->_aConfig[$sKey]['db_conf']] = $a[$sKey];

        // the system tables are created with the engine the modules get later from BX_DATABASE_ENGINE
        $sEngine = $this->getDbEngine($a);
        if ($sEngine)
            $aDbConf['storage_engine'] = $sEngine;

        $sErrorMessage = '';
        try {
            $oDb = BxDolDb::getInstanceWithConf($aDbConf, $sErrorMessage);
        }
        catch (PDOException $e) {
            // connect() throws, and the database's own error page would show the form's passwords
            $oDb = null;
            $sErrorMessage = $this->dbConnectError($e);
        }
        if (!$oDb) {
            $aErrorFields = array();
            if (isset($this->_aDbErrorMap[$sErrorMessage])) {
                foreach ($this->_aDbErrorMap[$sErrorMessage]['fields'] as $sField)
                    $aErrorFields[$sField] = true;
                $aErrorFields[BX_INSTALL_ERR_GENERAL] = $this->_aDbErrorMap[$sErrorMessage]['msg'];
            } else {
                $aErrorFields[BX_INSTALL_ERR_GENERAL] = htmlspecialchars($sErrorMessage, ENT_QUOTES, 'UTF-8');
            }
            return $aErrorFields;
        }

        $mixedRes = $oDb->executeSQL($this->_sSqlDb);
        if (true !== $mixedRes)
            return $this->dbErrors2ErrorFields($mixedRes);

        // UUID and VECTOR. MariaDB 11.7 and newer only. MySQL and older MariaDB cannot create these tables.
        if ($this->shouldRunMariaDbSql($oDb)) {
            $mixedRes = $oDb->executeSQL($this->_sSqlMariaDb);
            if (true !== $mixedRes)
                return $this->dbErrors2ErrorFields($mixedRes);
        }

        $mixedRes = $oDb->executeSQL($this->_sSqlAddon, $this->getMarkersForDb($a, $oDb));
        if (true !== $mixedRes)
            return $this->dbErrors2ErrorFields($mixedRes);

        $aSqlDirs = array(
            BX_INSTALL_DIR . 'sql/',
            BX_INSTALL_DIR_MODULES . 'system/install/sql/',
        );
        foreach ($aSqlDirs as $sSqlDir) {
            if (!is_dir($sSqlDir))
                continue;

            $aFiles = scandir($sSqlDir);
            foreach ($aFiles as $sFile) {
                if ($sFile[0] === '.' || $sFile === 'system.sql' || $sFile === 'addon.sql' || $sFile === 'mariadb.sql') {
                    continue;
                }
                $sFilePath = $sSqlDir . $sFile;
                if (is_file($sFilePath)) {
                    $mixedRes = $oDb->executeSQL($sFilePath, $this->getMarkersForDb($a, $oDb));
                    if (true !== $mixedRes) {
                        return $this->dbErrors2ErrorFields($mixedRes);
                    }
                }
            }
        }
        
        return array();
    }

    /**
     * Which of the messages of _aDbErrorMap fits a failed connection: a missing database, or the rest.
     */
    protected function dbConnectError ($e)
    {
        // 1044 access denied to the database, 1049 unknown database
        $iCode = isset($e->errorInfo[1]) ? (int)$e->errorInfo[1] : 0;
        if (!$iCode && preg_match('/\[(\d{4})\]/', $e->getMessage(), $m))
            $iCode = (int)$m[1];
        return in_array($iCode, array(1044, 1049)) ? 'Database select failed' : 'Database connect failed';
    }

    /**
     * The engine of the new tables: the UNA_DB_ENGINE environment variable, or the form's choice.
     */
    protected function getDbEngine ($a)
    {
        $sEngine = getenv('UNA_DB_ENGINE');
        if (!$sEngine && !empty($a['db_engine']))
            $sEngine = $a['db_engine'];

        $sEngine = strtoupper(trim((string)$sEngine));
        return in_array($sEngine, array('MYISAM', 'INNODB'), true) ? $sEngine : '';
    }

    /**
     * mariadb.sql uses UUID and VECTOR, available on MariaDB 11.7 and newer.
     */
    protected function shouldRunMariaDbSql($oDb)
    {
        if (!class_exists('BxDolAIVectorStoreMariaDb', false))
            require_once(BX_INSTALL_DIR . '../inc/classes/BxDolAIVectorStoreMariaDb.php');

        $sVersion = (string)$oDb->getOne('SELECT VERSION()');
        $aServer = BxDolAIVectorStoreMariaDb::describe($sVersion);

        return ($aServer['engine'] ?? '') === 'mariadb' && !empty($aServer['supported']);
    }

    public function processConfigDataHeader ($a)
    {
        $aMarkers = $this->getMarkersForPhp($a);

        $sFile = $this->_sPatternHeader;
        $sHeader = file_get_contents($sFile);
        if (false === $sHeader)
            return array(BX_INSTALL_ERR_GENERAL => _t('_sys_inst_msg_file_read_failed', $sFile));

        $sHeader = str_replace(array_keys($aMarkers), array_values($aMarkers), $sHeader);

        // the batched install keeps the file aside until every module is installed, so the site
        // doesn't start (and the installer doesn't stop) halfway
        $sPath = $this->_bModulesBatch ? BX_INSTALL_PATH_HEADER_STAGED : BX_INSTALL_PATH_HEADER;
        if (false === file_put_contents($sPath, $sHeader))
            return array(BX_INSTALL_ERR_GENERAL => _t('_sys_inst_msg_file_write_failed', $sPath));

        // no chmod: the file holds the database password, so it keeps the server's default permissions
        // instead of being opened up to everyone (Studio's audit warns when others can write it)

        if (function_exists('opcache_invalidate')) opcache_invalidate($sPath);
        
        return array();
    }

    /**
     * Include the configuration file the install has written: the staged one while a batched install runs.
     */
    public static function includeHeader ()
    {
        if (defined('BX_DOL'))
            return true;

        clearstatcache();
        $sPath = file_exists(BX_INSTALL_PATH_HEADER_STAGED) ? BX_INSTALL_PATH_HEADER_STAGED : BX_INSTALL_PATH_HEADER;
        if (!file_exists($sPath))
            return false;

        require_once($sPath);
        require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");
        return true;
    }

    /**
     * Modules in the order to install them: the language and the template, then the chosen modules
     * with their dependencies.
     *
     * @return array of arrays with 'type' and 'name'
     */
    public function getModulesToInstall ($a)
    {
        $oModulesTools = new BxDolInstallModulesTools();

        $aRet = array();
        foreach (array (BX_DOL_MODULE_TYPE_LANGUAGE, BX_DOL_MODULE_TYPE_TEMPLATE) as $sModuleType) {
            if (empty($a[$sModuleType]))
                continue;
            $aConfig = $oModulesTools->getModuleConfigByUri($a[$sModuleType], $oModulesTools->getModules($sModuleType));
            if ($aConfig)
                $aRet[] = array('type' => $sModuleType, 'name' => $aConfig['name'], 'title' => $aConfig['title']);
        }

        if (!empty($a[BX_INSTALL_FIELD_MODULES])) {
            $aModules = $oModulesTools->getInstallOrder($oModulesTools->getModules(BX_DOL_MODULE_TYPE_MODULE), $a[BX_INSTALL_FIELD_MODULES], BX_INSTALL_FIRST_MODULE);
            foreach ($aModules as $aConfig)
                $aRet[] = array('type' => BX_DOL_MODULE_TYPE_MODULE, 'name' => $aConfig['name'], 'title' => $aConfig['title']);
        }

        return $aRet;
    }

    public function processModules ($a)
    {
        self::includeHeader();

        // installing many modules takes longer than a default request
        @set_time_limit(0);

        foreach ($this->getModulesToInstall($a) as $aModule) {
            $sErrorMessage = $this->processModuleByName ($aModule['name'], array ('install', 'enable'), $aModule['type']);
            if ($sErrorMessage)
                return array(BX_INSTALL_ERR_GENERAL => $sErrorMessage);
        }

        return $this->finishModules($a['admin_email']);
    }

    /**
     * After the last module: record the migrations as done and sign the admin in.
     */
    protected function finishModules ($sAdminEmail)
    {
        // This install ran this code's install SQL, which has every migration's change already.
        try {
            BxDolMigrations::getInstance()->baseline();
        }
        catch (Throwable $e) {
            return array(BX_INSTALL_ERR_GENERAL => htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'));
        }

        bx_import('BxDolAccount');
        $oAccount = BxDolAccount::getInstance($sAdminEmail);
        if (!$oAccount)
            return array(BX_INSTALL_ERR_GENERAL => _t('_sys_inst_msg_admin_account_not_found', htmlspecialchars($sAdminEmail, ENT_QUOTES, 'UTF-8')));

        if ($this->_isAutologin)
            bx_login($oAccount->id());

        return array();
    }

    /**
     * Write the queue of modules for the batched install, and give its token to this browser.
     */
    protected function startModulesQueue ($a)
    {
        $sToken = bin2hex(random_bytes(24));
        $aQueue = array(
            // only a hash: the file may be readable where the web server doesn't deny inc/
            'token_hash' => hash('sha256', $sToken),
            'admin_email' => $a['admin_email'],
            'modules' => $this->getModulesToInstall($a),
            'done' => array(),
            'skipped' => array(),
        );

        if (!$this->writeModulesQueue($aQueue))
            return array(BX_INSTALL_ERR_GENERAL => _t('_sys_inst_msg_file_write_failed', BX_INSTALL_PATH_QUEUE));

        $this->setQueueCookie($sToken, 0);

        return array();
    }

    /**
     * The token's cookie: for the installer's folder only, never readable by scripts or sent from other sites.
     */
    protected function setQueueCookie ($sValue, $iExpires)
    {
        if (headers_sent())
            return;

        setcookie(BX_INSTALL_QUEUE_COOKIE, $sValue, array( // NOSONAR php:S2092, Secure is set on https; an http install must still get the cookie
            'expires' => $iExpires,
            'path' => rtrim(dirname($this->_sServerPhpSelf), '/\\') . '/',
            'secure' => 'https://' === $this->proto(),
            'httponly' => true,
            'samesite' => 'Strict',
        ));
    }

    /**
     * The queue of the batched install, when the given token is its token.
     *
     * @return array|false
     */
    public static function getModulesQueue ($sToken)
    {
        clearstatcache();
        if (!$sToken || !is_string($sToken) || !file_exists(BX_INSTALL_PATH_QUEUE))
            return false;

        $s = file_get_contents(BX_INSTALL_PATH_QUEUE);
        if (false === $s || false === ($i = strpos($s, "\n")))
            return false;

        $aQueue = json_decode(substr($s, $i + 1), true);
        if (!is_array($aQueue) || empty($aQueue['token_hash']) || !is_string($aQueue['token_hash']) || !hash_equals($aQueue['token_hash'], hash('sha256', $sToken)))
            return false;

        return $aQueue;
    }

    /**
     * A batched install has started and not finished: its staged configuration file or its queue exists.
     * Only the browser that started it (see getModulesQueue) may continue it or start over.
     */
    public static function isModulesBatchInProgress ()
    {
        clearstatcache();
        return file_exists(BX_INSTALL_PATH_HEADER_STAGED) || file_exists(BX_INSTALL_PATH_QUEUE);
    }

    protected static function writeModulesQueue ($aQueue)
    {
        // the PHP opening line keeps the file unreadable through a web server that runs PHP files
        $s = "<?php defined('BX_DOL_INSTALL') or die('hack attempt'); exit; ?>\n" . json_encode($aQueue);
        if (false === file_put_contents(BX_INSTALL_PATH_QUEUE, $s, LOCK_EX))
            return false;
        @chmod(BX_INSTALL_PATH_QUEUE, 0600);
        return true;
    }

    /**
     * Remove the queue; with $bStaged, the staged configuration file too (the install starts over).
     */
    public function clearModulesQueue ($bStaged = false)
    {
        @unlink(BX_INSTALL_PATH_QUEUE);
        if ($bStaged)
            @unlink(BX_INSTALL_PATH_HEADER_STAGED);
    }

    /**
     * Install the next module of the queue.
     *
     * @param string $sToken the queue's token
     * @param bool $bSkip leave the next module out instead (after it failed)
     * @return array 'code' 0 on success; 'done' and 'total' module counts; 'next' title of the module
     *               that follows; 'complete' when nothing is left; 'message' and 'module' on an error
     */
    public function installNextModule ($sToken, $bSkip = false)
    {
        $aQueue = self::getModulesQueue($sToken);
        if (!$aQueue || !self::includeHeader())
            return array('code' => 1, 'message' => _t('_sys_inst_msg_queue_not_found'));

        @set_time_limit(0);

        $iDone = count($aQueue['done']) + count($aQueue['skipped']);
        $iTotal = $iDone + count($aQueue['modules']);
        if (empty($aQueue['modules']))
            return array('code' => 0, 'done' => $iDone, 'total' => $iTotal, 'complete' => true);

        $aModule = array_shift($aQueue['modules']);
        if ($bSkip) {
            $aQueue['skipped'][] = $aModule['name'];
        }
        else {
            self::$sModuleInProgress = $aModule['title'];
            $sErrorMessage = $this->processModuleByName($aModule['name'], array('install', 'enable'), $aModule['type']);
            self::$sModuleInProgress = '';
            if ($sErrorMessage)
                return array('code' => 2, 'module' => $aModule['title'], 'message' => strip_tags(str_replace('<br />', "\n", $sErrorMessage)), 'done' => $iDone, 'total' => $iTotal);
            $aQueue['done'][] = $aModule['name'];
        }

        if (!self::writeModulesQueue($aQueue))
            return array('code' => 1, 'message' => _t('_sys_inst_msg_file_write_failed', BX_INSTALL_PATH_QUEUE));

        return array(
            'code' => 0,
            'done' => $iDone + 1,
            'total' => $iTotal,
            'next' => empty($aQueue['modules']) ? '' : $aQueue['modules'][0]['title'],
            'complete' => empty($aQueue['modules']),
        );
    }

    /**
     * Finish the batched install: put the configuration file in place and sign the admin in.
     *
     * @return string empty on success, or an error message
     */
    public function completeModules ($sToken)
    {
        $aQueue = self::getModulesQueue($sToken);
        if (!$aQueue || !self::includeHeader())
            return _t('_sys_inst_msg_queue_not_found');

        if (!empty($aQueue['modules']))
            return _t('_sys_inst_msg_queue_not_empty');

        $aErrors = $this->finishModules($aQueue['admin_email']);
        if (!empty($aErrors))
            return $aErrors[BX_INSTALL_ERR_GENERAL];

        if (!rename(BX_INSTALL_PATH_HEADER_STAGED, BX_INSTALL_PATH_HEADER))
            return _t('_sys_inst_msg_file_write_failed', BX_INSTALL_PATH_HEADER);
        if (function_exists('opcache_invalidate')) opcache_invalidate(BX_INSTALL_PATH_HEADER, true);

        $this->clearModulesQueue();
        $this->setQueueCookie('', time() - 3600);

        return '';
    }

    public function processModuleByUri ($sModuleUri, $aActions = array ('install', 'enable'), $sModuleType = null)
    {
        return $this->processModuleByField('home_uri', $sModuleUri, $aActions, $sModuleType);
    }

    public function processModuleByName ($sModuleName, $aActions = array ('install', 'enable'), $sModuleType = null)
    {
        return $this->processModuleByField('name', $sModuleName, $aActions, $sModuleType);
    }

    protected function processModuleByField ($sField, $sModuleUri, $aActions = array ('install', 'enable'), $sModuleType = null)
    {
        if (!self::includeHeader())
            return _t('_sys_inst_msg_script_isnt_installed');

        bx_import('BxDolStudioInstallerUtils');
        bx_import('BxDolLanguages');
        BxDolLanguages::getInstance();
        $oModulesTools = new BxDolInstallModulesTools();

        $aModules = $oModulesTools->getModules($sModuleType);
        foreach ($aModules as $aConfig) {
            if ($sModuleUri != $aConfig[$sField])
                continue;

            if (!$oModulesTools->hasDependencies($aConfig))
                return _t('_sys_inst_msg_module_error', htmlspecialchars($aConfig['title'], ENT_QUOTES, 'UTF-8'), _t('_sys_inst_msg_module_needs_composer', 'modules/' . $aConfig['home_dir']));

            foreach ($aActions as $sAction) {
                $aResult = BxDolStudioInstallerUtils::getInstance()->perform($aConfig['home_dir'], $sAction);
                if ((!isset($aResult['code']) || $aResult['code']) && !empty($aResult['message']))
                    return _t('_sys_inst_msg_module_error', htmlspecialchars($aConfig['title'], ENT_QUOTES, 'UTF-8'), $aResult['message']);
            }
        }

        return '';
    }

    protected function dbErrors2ErrorFields ($a)
    {
        $s = '';
        foreach ($a as $r)
            $s .= htmlspecialchars($r['error'], ENT_QUOTES, 'UTF-8') . ':<br /><code>' . htmlspecialchars($r['query'], ENT_QUOTES, 'UTF-8') . '</code><br />';
        return array(BX_INSTALL_ERR_GENERAL => $s);
    }

    protected function processInputData ($a)
    {
        $oModulesTools = new BxDolInstallModulesTools();
        foreach ($a as $sKey => $mixedValue) {
            $a[$sKey] = bx_process_input($mixedValue);

            // multiple choice fields are kept as a comma separated string, as the other fields are used as strings
            if (!empty($this->_aConfig[$sKey]['multiple']))
                $a[$sKey] = implode(',', $oModulesTools->parseUris($a[$sKey]));
            elseif (is_string($a[$sKey]) && !empty($this->_aConfig[$sKey]['type']) && 'password' !== $this->_aConfig[$sKey]['type'])
                $a[$sKey] = trim($a[$sKey]);
            if (!empty($this->_aConfig[$sKey]['normalize']) && is_string($a[$sKey]))
                $a[$sKey] = call_user_func($this->_aConfig[$sKey]['normalize'], $a[$sKey]);
        }
        return $a;
    }

    protected function getMarkers($a)
    {
        $aMarkers = array();
        foreach($this->_aConfig as $sKey => $r)
            $aMarkers[$sKey] = isset($a[$sKey]) ? $a[$sKey] : '';

        $aMarkers['db_engine'] = $this->getDbEngine($a);
        $aMarkers['admin_pwd_salt'] = genRndPwd();
        $aMarkers['admin_pwd_hash'] = encryptUserPwd($a['admin_password'], $aMarkers['admin_pwd_salt']);
        $aMarkers['current_timestamp'] = time();
        $aMarkers['version'] = BX_DOL_VER;
        $aMarkers['time'] = time();
        $aMarkers['secret'] = genRndPwd(11);
        $aMarkers['ffmpeg_path'] = self::getFfmpegPath($aMarkers['root_dir']);

        $aJava = explode(' ', str_replace('java: ', '', trim(`whereis java`)));
        $aMarkers['java_path'] = isset($aJava[0]) && $aJava[0] && !is_dir($aJava[0]) ? $aJava[0] : '';

        return $aMarkers;
    }

    protected function getMarkersForDb($a, $oDb)
    {
        $a = $this->getMarkers($a);
        $aMarkers = array();
        foreach ($a as $sKey => $mixedVal) {
            $aMarkers['from'][] = '{' . $sKey . '}';
            $aMarkers['to'][] = $oDb->escape($mixedVal);
        }
        return $aMarkers;
    }

    protected function getMarkersForPhp($a)
    {
        $a = $this->getMarkers($a);
        $aMarkers = array();
        foreach ($a as $sKey => $mixedVal)
            $aMarkers['%' . strtoupper($sKey) . '%'] = bx_php_string_apos($mixedVal);
        return $aMarkers;
    }

    protected function getFormFields($aErrorFields, $aData)
    {
        $s = '';
        foreach($this->_aConfig as $sKey => $a) {
            $sFunc = isset($a['func']) ? $a['func'] : 'rowInput';
            $s .= $this->$sFunc($aData, $sKey, $a, isset($aErrorFields[$sKey]) ? $aErrorFields[$sKey] : false);
        }

        return $s;
    }

    protected function getFieldId ($sKey)
    {
        return 'bx-install-' . str_replace('_', '-', $sKey);
    }

    protected function rowInput ($aData, $sKey, $a, $isError = false)
    {
        $sAutoMessage = '';
        $sType = isset($a['type']) ? $a['type'] : 'text';
        // a password the browser sent is never sent back
        $sValue = 'password' === $sType ? '' : bx_html_attribute($this->def ($aData, $sKey, $a, $sAutoMessage));
        $sId = $this->getFieldId($sKey);

        $sAttrs = '';
        if (!empty($a['autocomplete']))
            $sAttrs .= ' autocomplete="' . $a['autocomplete'] . '"';
        if (!empty($a['inputmode']))
            $sAttrs .= ' inputmode="' . $a['inputmode'] . '"';
        if ($this->isRequired($a))
            $sAttrs .= ' required aria-required="true"';
        if ($isError)
            $sAttrs .= ' aria-invalid="true" aria-describedby="' . $sId . '-error ' . $sId . '-desc"';
        elseif (!empty($a['desc']) || !empty($a['ex']))
            $sAttrs .= ' aria-describedby="' . $sId . '-desc"';
        if (in_array($sType, array('url', 'email')) || !empty($a['db_conf']) || 'root_dir' == $sKey)
            $sAttrs .= ' spellcheck="false" autocapitalize="none"';

        $sInput = '<input type="' . $sType . '" id="' . $sId . '" name="' . $sKey . '" value="' . $sValue . '" class="bx-def-font-inputs bx-form-input-text"' . $sAttrs . ' />';
        return $this->rowWrapper ($aData, $sInput, $sAutoMessage, 'text', $sKey, $a, $isError);
    }

    protected function rowSelect ($aData, $sKey, $a, $isError = false)
    {
        $sAutoMessage = '';
        $sValue = $this->def ($aData, $sKey, $a, $sAutoMessage);
        if (!empty($a['normalize']))
            $sValue = call_user_func($a['normalize'], $sValue);
        $sValues = '';
        foreach ($a['vals'] as $sVal => $sTitle)
            $sValues .= '<option value="' . bx_html_attribute($sVal) . '"' . ((string)$sVal === (string)$sValue ? ' selected="selected"' : '') . '>' . htmlspecialchars($sTitle, ENT_QUOTES, 'UTF-8') . '</option>';
        $sId = $this->getFieldId($sKey);
        $sInput = '<select id="' . $sId . '" name="' . $sKey . '" class="bx-def-font-inputs bx-form-input-select"' . (!empty($a['desc']) ? ' aria-describedby="' . $sId . '-desc"' : '') . '>' . $sValues . '</select>';
        return $this->rowWrapper ($aData, $sInput, $sAutoMessage, 'select', $sKey, $a, $isError);
    }

    /**
     * The modules: a group of checkboxes per purpose, the starter set checked.
     */
    protected function rowModules ($aData, $sKey, $a, $isError = false)
    {
        $sAutoMessage = '';
        $oModulesTools = new BxDolInstallModulesTools();
        $aSelected = $oModulesTools->parseUris($this->def ($aData, $sKey, $a, $sAutoMessage));
        $aConfigs = array();
        foreach ($oModulesTools->getModules(BX_DOL_MODULE_TYPE_MODULE) as $aConfig)
            $aConfigs[$aConfig['home_uri']] = $aConfig;

        $sGroups = '';
        foreach ($this->getModuleGroups(array_keys($a['vals'])) as $sGroup => $aUris) {
            $sItems = '';
            foreach ($aUris as $sUri) {
                $sId = $this->getFieldId($sKey . '-' . $sUri);
                $bAvailable = empty($aConfigs[$sUri]) || $oModulesTools->hasDependencies($aConfigs[$sUri]);
                $sNote = $bAvailable ? '' : '<span class="bx-install-module-note">' . _t('_sys_inst_conf_module_needs_composer') . '</span>';
                $sItems .= '<li class="bx-install-module' . ($bAvailable ? '' : ' bx-install-module-unavailable') . '">'
                    . '<input type="checkbox" id="' . $sId . '" name="' . $sKey . '[]" value="' . bx_html_attribute($sUri) . '"'
                    . ($bAvailable && in_array($sUri, $aSelected) ? ' checked="checked"' : '') . ($bAvailable ? '' : ' disabled="disabled"') . ' />'
                    . '<label for="' . $sId . '">' . htmlspecialchars($a['vals'][$sUri], ENT_QUOTES, 'UTF-8') . $sNote . '</label>'
                    . '</li>';
            }

            $sGroups .= '<fieldset class="bx-install-modules-group">'
                . '<legend>' . _t('_sys_inst_conf_modules_group_' . $sGroup) . '</legend>'
                . '<p class="bx-install-modules-group-desc">' . _t('_sys_inst_conf_modules_group_' . $sGroup . '_desc') . '</p>'
                . '<ul>' . $sItems . '</ul>'
                . '</fieldset>';
        }

        $sDefault = bx_html_attribute(json_encode($oModulesTools->parseUris($a['def'])));
        $sSelectStarter = _t('_sys_inst_conf_modules_select_starter');
        $sSelectAll = _t('_sys_inst_conf_modules_select_all');
        $sSelectNone = _t('_sys_inst_conf_modules_select_none');
        $sCount = bx_html_attribute(_t('_sys_inst_conf_modules_selected'));

        // the empty value keeps the field in the request when nothing is checked, so that it is not reset to the default
        $sInput = <<<EOF
<input type="hidden" name="{$sKey}[]" value="" />
<div class="bx-install-modules" data-starter="{$sDefault}">
    <div class="bx-install-modules-toolbar">
        <button type="button" class="bx-btn bx-btn-small" data-select="starter">{$sSelectStarter}</button>
        <button type="button" class="bx-btn bx-btn-small" data-select="all">{$sSelectAll}</button>
        <button type="button" class="bx-btn bx-btn-small" data-select="none">{$sSelectNone}</button>
        <span class="bx-install-modules-count" aria-live="polite" data-template="{$sCount}"></span>
    </div>
    {$sGroups}
</div>
EOF;

        return $this->rowWrapper ($aData, $sInput, $sAutoMessage, 'modules', $sKey, $a, $isError, false);
    }

    /**
     * Module URIs by group, in the order of the groups.
     */
    public function getModuleGroups ($aUris)
    {
        $aRet = array();
        $aGrouped = array();
        foreach (self::$aModuleGroups as $sGroup => $aGroupUris) {
            $aRet[$sGroup] = array_values(array_intersect($aGroupUris, $aUris));
            $aGrouped = array_merge($aGrouped, $aGroupUris);
        }
        $aRet['other'] = array_merge($aRet['other'], array_values(array_diff($aUris, $aGrouped)));

        return array_filter($aRet);
    }

    protected function isRequired ($a)
    {
        return !empty($a['check']) && empty($a['optional']);
    }

    protected function rowWrapper ($aData, $sInput, $sAutoMessage, $sType, $sKey, $a, $isError = false, $bLabel = true)
    {
        $sId = $this->getFieldId($sKey);

        $sDesc = '';
        if (!empty($a['desc']))
            $sDesc .= $a['desc'];
        if (!empty($a['ex']))
            $sDesc .= ($sDesc ? '<br />' : '') . _t('_sys_inst_conf_example', htmlspecialchars($a['ex'], ENT_QUOTES, 'UTF-8'));
        if ($sDesc)
            $sDesc = '<div class="bx-form-info bx-def-font-grayed bx-def-font-small" id="' . $sId . '-desc">' . $sDesc . '</div>';

        $sError = '';
        if ($isError)
            $sError = '<div class="bx-form-warn" id="' . $sId . '-error">' . (is_string($isError) ? $isError : _t('_sys_inst_conf_error')) . '</div>';

        $sRequired = '';
        if ($this->isRequired($a))
            $sRequired = '<span class="bx-form-required" aria-hidden="true">*</span>';

        $sCaption = $bLabel ?
            '<label for="' . $sId . '">' . $a['name'] . $sRequired . '</label>' :
            '<span id="' . $sId . '-caption">' . $a['name'] . $sRequired . '</span>';
        // "Detected" / "Not detected": a value the installer filled in from this server
        if ($sAutoMessage)
            $sCaption .= ' ' . trim($sAutoMessage);

        return <<<EOF
            <div class="bx-form-element-wrapper bx-def-margin-top-auto bx-install-field-{$sType}">
                <div class="bx-form-caption">
                    {$sCaption}
                </div>
                <div class="bx-form-value">
                    <div class="bx-form-input-wrapper bx-form-input-wrapper-{$sType}">
                        $sInput
                    </div>
                    $sError
                    {$sDesc}
                </div></div>
EOF;
    }

    protected function rowSectionOpen ($aData, $sKey, $a)
    {
        $sDesc = empty($a['desc']) ? '' : '<p class="bx-install-section-desc">' . $a['desc'] . '</p>';
        $sStep = empty($a['step']) ? '' : ' data-step="' . $a['step'] . '"';
        return <<<EOF
                    <div class="bx-form-section-wrapper bx-def-margin-top"{$sStep}>
                        <fieldset class="bx-form-section bx-def-padding-sec-top bx-def-border-top bx-form-section-header">
                            <legend class="bx-def-padding-sec-right bx-def-font-grayed bx-def-font-h3">{$a['name']}</legend>
                            {$sDesc}
                            <div class="bx-form-section-content bx-def-padding-top bx-def-padding-bottom">
EOF;
    }

    protected function rowSectionClose ($aData, $sKey, $a)
    {
        return <<<EOF
                            </div>
                        </fieldset>
                    </div>
EOF;
    }

    /**
     * @return true when the value is fine, false or an error message otherwise
     */
    protected function check ($sKey, $sValue, $a)
    {
        if (empty($a['check']))
            return true;

        // an empty optional field passes, an empty required one gets the same message everywhere
        if ('' === trim((string)$sValue))
            return $this->isRequired($a) ? _t('_sys_inst_conf_err_required') : true;

        return $this->{$a['check'][0]}($sValue, $a['check'][1]);
    }

    protected function checkLength ($s, $i)
    {
        return mb_strlen($s) >= $i ? true : false;
    }

    protected function checkLengthExactOrEmpty ($s, $i)
    {
        return empty($s) || mb_strlen($s) == $i ? true : _t('_sys_inst_conf_err_length_exact', $i);
    }

    protected function checkPassword ($s, $i)
    {
        return mb_strlen($s) >= $i ? true : _t('_sys_inst_conf_err_password', $i);
    }

    protected function checkEmail ($s, $i)
    {
        return mb_strlen($s) > $i && false !== filter_var($s, FILTER_VALIDATE_EMAIL) ? true : _t('_sys_inst_conf_err_email');
    }

    protected function checkUrl ($s, $i)
    {
        $s = (string)$s;
        $sScheme = strtolower((string)parse_url($s, PHP_URL_SCHEME));
        if (mb_strlen($s) < $i || !in_array($sScheme, array('http', 'https')) || !parse_url($s, PHP_URL_HOST))
            return _t('_sys_inst_conf_err_url');
        return '/' === substr($s, -1) ? true : _t('_sys_inst_conf_err_url_slash');
    }

    protected function checkInList ($s, $a)
    {
        return in_array(strtoupper((string)$s), $a, true);
    }

    protected function def ($aData, $sKey, $a, &$sAutoMessage)
    {
        if (isset($aData[$sKey]))
            return bx_process_pass($aData[$sKey]);
        elseif (false !== getenv('UNA_' . strtoupper($sKey)))
            return bx_process_pass(getenv('UNA_' . strtoupper($sKey)));
        elseif (!empty($a['def_exp'])) {
            $s = $this->{$a['def_exp'][0]}($a['def_exp'][1]);
            if ($s) {
                $sAutoMessage = _t('_sys_inst_conf_found') . ' ';
                return $s;
            } else {
                $sAutoMessage = _t('_sys_inst_conf_not_found') . ' ';
            }
        }
        return isset($a['def']) ? $a['def'] : '';
    }

    protected function defUrl ($foo)
    {
        $s = $this->proto() . $this->_sServerHttpHost . $this->_sServerPhpSelf;
        return preg_replace("/install\/(index\.php$)/", '', $s);
    }

    protected function defPath ($foo)
    {
        $s = rtrim($this->_sServerDocumentRoot, '/') . $this->_sServerPhpSelf;
        return preg_replace("/install\/(index\.php$)/", '', $s);
    }

    protected function getSelectValues($sType)
    {
        $a = array();
        $oModulesTools = new BxDolInstallModulesTools();
        $aModules = $oModulesTools->getModules($sType);
        foreach ($aModules as $sName => $aConfig)
            if (!in_array($aConfig['home_uri'], self::$aHiddenModules))
                $a[$aConfig['home_uri']] = $aConfig['title'];
        return $a;
    }

    protected function proto()
    {
        $sProto = 'http://';
        if  (
                (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS']) || 
                (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && 'https' == strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'])) || 
                getenv('UNA_HTTPS')
            )
            $sProto = 'https://';
        return $sProto;
    }

    /**
     * The ffmpeg bundled in plugins/, or, when it can't run here, one installed on the server.
     * A release package carries the x64 build, which doesn't run on an arm64 server.
     *
     * @param string $sRootDir UNA root folder, with a trailing slash
     * @param callable|null $fRuns check of one path, isFfmpegRunnable by default
     * @return string path for BX_SYSTEM_FFMPEG; the bundled one when none runs, so that the Studio audit names it
     */
    public static function getFfmpegPath($sRootDir, $fRuns = null)
    {
        $sBundled = $sRootDir . 'plugins/ffmpeg/ffmpeg.exe';
        if($fRuns === null) {
            $fRuns = [self::class, 'isFfmpegRunnable'];
        }

        foreach([$sBundled, '/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg'] as $sPath) {
            if(call_user_func($fRuns, $sPath)) {
                return $sPath;
            }
        }

        return $sBundled;
    }

    public static function isFfmpegRunnable($sPath)
    {
        if(!is_file($sPath) || !is_executable($sPath) || !function_exists('exec')) {
            return false;
        }

        $aOutput = [];
        $iCode = 1;
        @exec(escapeshellarg($sPath) . ' -version 2>/dev/null', $aOutput, $iCode);

        return $iCode === 0 && isset($aOutput[0]) && str_starts_with($aOutput[0], 'ffmpeg version');
    }
}

/** @} */
