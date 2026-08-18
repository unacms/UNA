<?php defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaInstall UNA Install
 * @{
 */

define('BX_INSTALL_ERR_GENERAL', 'general');

class BxDolInstallSiteConfig
{
    protected $_sSqlDb;
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
        $this->_sSqlAddon = BX_INSTALL_DIR . 'sql/addon.sql';
        $this->_sPatternHeader = BX_INSTALL_DIR . 'patterns/header.inc.php';

        $this->_aDbErrorMap = array (
            'Database connect failed' => array ('fields' => array('db_host', 'db_user', 'db_password'), 'msg' => _t('_sys_inst_msg_db_err_connect')),
            'Database select failed' => array ('fields' => array('db_name'), 'msg' => _t('_sys_inst_msg_db_err_select')),
        );

        $this->_aConfig = array (

            // path config

            'section_site_paths_open' => array(
                'name' => _t('_sys_inst_conf_section_paths'),
                'func' => 'rowSectionOpen',
            ),

            'site_url' => array(
                'name' => _t('_sys_inst_conf_field_site_url'),
                'ex' => 'http://www.mydomain.com/path/',
                'desc' => _t('_sys_inst_conf_desc_site_url'),
                'def' => 'http://',
                'def_exp' => array('defUrl', ''),
                'check' => array('checkLength', 10),
            ),
            'root_dir' => array(
                'name' => _t('_sys_inst_conf_field_root_dir'),
                'ex' => '/home/mydomain/public_html/',
                'desc' => _t('_sys_inst_conf_desc_root_dir'),
                'def_exp' => array('defPath', ''),
                'check' => array('checkLength', 1),
            ),

            'section_site_paths_close' => array(
                'func' => 'rowSectionClose',
            ),

            // db config

            'section_db_config_open' => array(
                'name' => _t('_sys_inst_conf_section_db_config'),
                'func' => 'rowSectionOpen',
            ),

            'db_host' => array(
                'name' => _t('_sys_inst_conf_field_db_host'),
                'ex' => 'localhost',
                'desc' => _t('_sys_inst_conf_desc_db_host'),
                'def' => 'localhost',
                'check' => array('checkLength', 1),
                'db_conf' => 'host',
            ),
            'db_port' => array(
                'name' => _t('_sys_inst_conf_field_db_port'),
                'ex' => '5506',
                'desc' => _t('_sys_inst_conf_desc_db_port'),
                'db_conf' => 'port',
            ),
            'db_sock' => array(
                'name' => _t('_sys_inst_conf_field_db_sock'),
                'ex' => '/tmp/mysql.sock',
                'desc' => _t('_sys_inst_conf_desc_db_sock'),
                'db_conf' => 'sock',
            ),
            'db_name' => array(
                'name' => _t('_sys_inst_conf_field_db_name'),
                'ex' => 'mydomian_tri',
                'desc' => _t('_sys_inst_conf_desc_db_name'),
                'check' => array('checkLength', 1),
                'db_conf' => 'name',
            ),
            'db_user' => array(
                'name' => _t('_sys_inst_conf_field_db_user'),
                'ex' => 'mydomian_tri',
                'desc' => _t('_sys_inst_conf_desc_db_user'),
                'check' => array('checkLength', 1),
                'db_conf' => 'user',
            ),
            'db_password' => array(
                'name' => _t('_sys_inst_conf_field_db_pwd'),
                'ex' => 'Super*Secret#Word_1234',
                'desc' => _t('_sys_inst_conf_desc_db_pwd'),
                'db_conf' => 'pwd',
            ),
            'db_engine' => array(
                'name' => _t('_sys_inst_conf_field_db_engine'),
                'ex' => 'INNODB',
                'desc' => _t('_sys_inst_conf_desc_db_engine'),
                'def' => 'MYISAM',
            ),

            'section_db_config_close' => array(
                'func' => 'rowSectionClose',
            ),

            // site config

            'section_site_info_open' => array(
                'name' => _t('_sys_inst_conf_section_site_info'),
                'func' => 'rowSectionOpen',
            ),

            'site_title' => array(
                'name' => _t('_sys_inst_conf_field_site_title'),
                'ex' => 'The Best Community',
                'desc' => _t('_sys_inst_conf_desc_site_title'),
                'check' => array('checkLength', 1),
            ),
            'site_email' => array(
                'name' => _t('_sys_inst_conf_field_site_email'),
                'ex' => 'no-reply@youdomain.here',
                'desc' => _t('_sys_inst_conf_desc_site_email'),
                'check' => array('checkEmail', 3),
            ),
            'admin_email' => array(
                'name' => _t('_sys_inst_conf_field_admin_email'),
                'ex' => 'admin@email.here',
                'desc' => _t('_sys_inst_conf_desc_admin_email'),
                'check' => array('checkEmail', 3),
            ),
            'admin_username' => array(
                'name' => _t('_sys_inst_conf_field_admin_username'),
                'ex' => 'admin',
                'desc' => _t('_sys_inst_conf_desc_admin_username'),
                'check' => array('checkLength', 1),
            ),
            'admin_password' => array(
                'name' => _t('_sys_inst_conf_field_admin_pwd'),
                'ex' => 'Super*Secret#Word_1234',
                'desc' => _t('_sys_inst_conf_desc_admin_pwd'),
                'check' => array('checkLength', 1),
            ),

            'section_site_info_close' => array(
                'func' => 'rowSectionClose',
            ),

            // link with boonex market

            'section_link_to_market_open' => array(
                'name' => _t('_sys_inst_conf_section_link_with_market'),
                'func' => 'rowSectionOpen',
            ),

            'oauth_key' => array(
                'name' => _t('_sys_inst_conf_field_oauth_key'),
                'ex' => '123abc4d',
                'desc' => _t('_sys_inst_conf_desc_oauth_key_secret'),
                'check' => array('checkLengthExactOrEmpty', 10),
            ),
            'oauth_secret' => array(
                'name' => _t('_sys_inst_conf_field_oauth_secret'),
                'ex' => '45de12368a9b367abc23512a',
                'desc' => _t('_sys_inst_conf_desc_oauth_key_secret'),
                'check' => array('checkLengthExactOrEmpty', 32),
            ),

            'section_link_to_market_close' => array(
                'func' => 'rowSectionClose',
            ),

            // modules

            'section_modules_open' => array(
                'name' => _t('_sys_inst_conf_section_modules'),
                'func' => 'rowSectionOpen',
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

            BX_DOL_MODULE_TYPE_MODULE => array(
                'name' => _t('_sys_inst_conf_field_profiles'),
                'desc' => _t('_sys_inst_conf_desc_profiles'),
                'def' => 'persons',
                'func' => 'rowSelect',
                'vals' => $this->getSelectValues(BX_DOL_MODULE_TYPE_MODULE),
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
                    $sPage = 'index.php?action=finish';
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
            $sErrorMessage = '<div class="bx-install-error-message bx-def-padding bx-def-margin-bottom">' . $aErrorFields[BX_INSTALL_ERR_GENERAL] . '</div>';
            if (null !== $sOutputErrorMessage)
                $sOutputErrorMessage = $aErrorFields[BX_INSTALL_ERR_GENERAL] . (empty($aErrorFields) ? '' : ' / Fields: ' . join(',', array_keys($aErrorFields)));
        }

        $sRows = $this->getFormFields($aErrorFields, $aData);
        $sSubmitTitle = _t('_Submit');
        return <<<EOF
            {$sErrorMessage}
            <form method="post">
                <div class="bx-form-advanced-wrapper sys_account_wrapper">

                    {$sRows}

                    <div class="bx-form-element-wrapper bx-def-margin-top">
                        <div class="bx-form-value">
                            <div class="bx-form-input-wrapper bx-form-input-wrapper-submit">
                                <button class="bx-def-font-inputs bx-form-input-submit bx-btn bx-btn-primary" type="submit" name="site_config" value="1">
                                    {$sSubmitTitle}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            <form>
EOF;
    }

    public function processConfigData ($a)
    {
        $aSteps = array('checkConfig', 'processConfigDataDb', 'processConfigDataHeader', 'processModules');
        foreach ($aSteps as $sFunc) {
            $aErrors = $this->{$sFunc} ($a);
            if (!empty($aErrors))
                return $aErrors;
        }

        return array();
    }

    protected function checkConfig($a)
    {
        $aErrorFields = array();
        foreach ($this->_aConfig as $sKey => $r) {
            if (!$this->check ($sKey, isset($a[$sKey]) ? $a[$sKey] : '', $r))
                $aErrorFields[$sKey] = true;
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

        if ('INNODB' == getenv('UNA_DB_ENGINE'))
            $aDbConf['storage_engine'] = 'INNODB';

        $sErrorMessage = '';
        $oDb = BxDolDb::getInstanceWithConf($aDbConf, $sErrorMessage);
        if (!$oDb) {
            $aErrorFields = array();
            if (isset($this->_aDbErrorMap[$sErrorMessage])) {
                foreach ($this->_aDbErrorMap[$sErrorMessage]['fields'] as $sField)
                    $aErrorFields[$sField] = true;
                $aErrorFields[BX_INSTALL_ERR_GENERAL] = $this->_aDbErrorMap[$sErrorMessage]['msg'];
            } else {
                $aErrorFields[BX_INSTALL_ERR_GENERAL] = $sErrorMessage;
            }
            return $aErrorFields;
        }

        $mixedRes = $oDb->executeSQL($this->_sSqlDb);
        if (true !== $mixedRes)
            return $this->dbErrors2ErrorFields($mixedRes);

        $mixedRes = $oDb->executeSQL($this->_sSqlAddon, $this->getMarkersForDb($a, $oDb));
        if (true !== $mixedRes)
            return $this->dbErrors2ErrorFields($mixedRes);

        $sSqlDir = BX_INSTALL_DIR . 'sql/';
        if (is_dir($sSqlDir)) {
            $aFiles = scandir($sSqlDir);
            foreach ($aFiles as $sFile) {
                if ($sFile[0] === '.' || $sFile === 'system.sql' || $sFile === 'addon.sql') {
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

    public function processConfigDataHeader ($a)
    {
        $aMarkers = $this->getMarkersForPhp($a);

        $sFile = $this->_sPatternHeader;
        $sHeader = file_get_contents($sFile);
        if (false === $sHeader)
            return array(BX_INSTALL_ERR_GENERAL => _t('_sys_inst_msg_file_read_failed', $sFile));

        $sHeader = str_replace(array_keys($aMarkers), array_values($aMarkers), $sHeader);

        if (false === file_put_contents(BX_INSTALL_PATH_HEADER, $sHeader))
            return array(BX_INSTALL_ERR_GENERAL => _t('_sys_inst_msg_file_write_failed', BX_INSTALL_PATH_HEADER));

        @chmod(BX_INSTALL_PATH_HEADER, 0666);

        if (function_exists('opcache_invalidate')) opcache_invalidate(BX_INSTALL_PATH_HEADER);
        
        return array();
    }

    public function processModules ($a)
    {
        require_once(BX_INSTALL_PATH_HEADER);
        require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

        $aTypes = array (BX_DOL_MODULE_TYPE_LANGUAGE, BX_DOL_MODULE_TYPE_TEMPLATE, BX_DOL_MODULE_TYPE_MODULE);
        foreach ($aTypes as $sModuleType) {
            if (empty($a[$sModuleType]))
                continue;
            $sErrorMessage = $this->processModuleByUri ($a[$sModuleType], array ('install', 'enable'), $sModuleType);
            if ($sErrorMessage)
                return array(BX_INSTALL_ERR_GENERAL => $sErrorMessage);
        }

        bx_import('BxDolAccount');
        $oAccount = BxDolAccount::getInstance($a['admin_email']);
        if (!$oAccount)
            return array(BX_INSTALL_ERR_GENERAL => _t('_sys_inst_msg_admin_account_not_found', $a['admin_email']));

        if ($this->_isAutologin)
            bx_login($oAccount->id());

        return array();
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
        if (!file_exists(BX_INSTALL_PATH_HEADER))
            return _t('_sys_inst_msg_script_isnt_installed');

        bx_import('BxDolStudioInstallerUtils');
        bx_import('BxDolLanguages');
        BxDolLanguages::getInstance();
        $oModulesTools = new BxDolInstallModulesTools();

        $aModules = $oModulesTools->getModules($sModuleType);
        foreach ($aModules as $aConfig) {
            if ($sModuleUri != $aConfig[$sField])
                continue;

            foreach ($aActions as $sAction) {
                $aResult = BxDolStudioInstallerUtils::getInstance()->perform($aConfig['home_dir'], $sAction);
                if ((!isset($aResult['code']) || $aResult['code']) && !empty($aResult['message']))
                    return _t('_sys_inst_msg_module_error', $aConfig['title'], $aResult['message']);
            }
        }

        return '';
    }

    protected function dbErrors2ErrorFields ($a)
    {
        $s = '';
        foreach ($a as $r)
            $s = $r['error'] . ': <br />' . $r['query'] . '<br />';
        return array(BX_INSTALL_ERR_GENERAL => $s);
    }

    protected function processInputData ($a)
    {
        foreach ($a as $sKey => $mixedValue)
            $a[$sKey] = bx_process_input($mixedValue);
        return $a;
    }

    protected function getMarkers($a)
    {
        $aMarkers = array();
        foreach($this->_aConfig as $sKey => $r)
            $aMarkers[$sKey] = isset($a[$sKey]) ? $a[$sKey] : '';

        $aMarkers['admin_pwd_salt'] = genRndPwd();
        $aMarkers['admin_pwd_hash'] = encryptUserPwd($a['admin_password'], $aMarkers['admin_pwd_salt']);
        $aMarkers['current_timestamp'] = time();
        $aMarkers['version'] = BX_DOL_VER;
        $aMarkers['time'] = time();
        $aMarkers['secret'] = genRndPwd(11);
        $aMarkers['ffmpeg_path'] = BxDolIO::getFfmpegPath($aMarkers['root_dir']);

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

    protected function rowInput ($aData, $sKey, $a, $isError = false)
    {
        $sAutoMessage = '';
        $sValue = bx_html_attribute($this->def ($aData, $sKey, $a, $sAutoMessage));
        $sInput = '<input type="text" name="' . $sKey. '" value="' . $sValue . '" class="bx-def-font-inputs bx-form-input-text" />';
        return $this->rowWrapper ($aData, $sInput, $sAutoMessage, 'text', $sKey, $a, $isError);
    }

    protected function rowSelect ($aData, $sKey, $a, $isError = false)
    {
        $sAutoMessage = '';
        $sValue = bx_html_attribute($this->def ($aData, $sKey, $a, $sAutoMessage));
        $sValues = '';
        foreach ($a['vals'] as $sVal => $sTitle)
            $sValues .= '<option value="' . $sVal . '" ' . ($sVal == $sValue ? 'selected="selected"' : '') . '>' . $sTitle . '</option>';
        $sInput = '<select name="' . $sKey . '" class="bx-def-font-inputs bx-form-input-select">' . $sValues . '</select>';
        return $this->rowWrapper ($aData, $sInput, $sAutoMessage, 'select', $sKey, $a, $isError);
    }

    protected function rowWrapper ($aData, $sInput, $sAutoMessage, $sType, $sKey, $a, $isError = false)
    {
        $sDesc = _t('_sys_inst_conf_desc', $sAutoMessage, $a['desc'], isset($a['ex']) ? $a['ex'] : _t('_sys_inst_conf_no_example'));

        $sError = '';
        if ($isError)
            $sError = '<div class="bx-form-warn">' . _t('_sys_inst_conf_error') . '</div>';

        $sRequired = '';
        if (isset($a['check']) && $a['check'])
            $sRequired = '<span class="bx-form-required">*</span>';

        return <<<EOF
            <div class="bx-form-element-wrapper bx-def-margin-top-auto">
                <div class="bx-form-caption">
                    {$a['name']}
                    {$sRequired}
                </div>
                <div class="bx-form-value">
                    <div class="bx-form-input-wrapper bx-form-input-wrapper-{$sType}">
                        $sInput
                    </div>
                    $sError
                    <div class="bx-form-info bx-def-font-grayed bx-def-font-small">
                        {$sDesc}
                    </div>
                </div></div>
EOF;
    }

    protected function rowSectionOpen ($aData, $sKey, $a)
    {
        return <<<EOF
                    <div class="bx-form-section-wrapper bx-def-margin-top">
                        <fieldset class="bx-form-section bx-def-padding-sec-top bx-def-border-top bx-form-section-header">
                            <legend class="bx-def-padding-sec-right bx-def-font-grayed bx-def-font-h3">{$a['name']}</legend>
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

    protected function check ($sKey, $sValue, $a)
    {
        if (empty($a['check']))
            return true;
        return $this->{$a['check'][0]}($sValue, $a['check'][1]);
    }

    protected function checkLength ($s, $i)
    {
        return mb_strlen($s) >= $i ? true : false;
    }

    protected function checkLengthExactOrEmpty ($s, $i)
    {
        return empty($s) || mb_strlen($s) == $i;
    }

    protected function checkEmail ($s, $i)
    {
        return mb_strlen($s) > $i && false !== strpos($s, '@') ? true : false;
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
                $sAutoMessage = _t('_sys_inst_conf_found') . '<br />';
                return $s;
            } else {
                $sAutoMessage = _t('_sys_inst_conf_not_found') . '<br />';
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
}

/** @} */
