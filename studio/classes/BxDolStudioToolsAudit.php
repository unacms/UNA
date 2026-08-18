<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_AUDIT_FAIL', 'fail');
define('BX_DOL_AUDIT_WARN', 'warn');
define('BX_DOL_AUDIT_UNDEF', 'undef');
define('BX_DOL_AUDIT_OK', 'ok');

class BxDolStudioToolsAudit extends BxDol
{
    protected $aType2ClassCSS;
    protected $aType2Title;

    protected $sMinPhpVer;
    protected $aPhpSettings;
    protected $iPhpErrorReporting;

    protected $sMinMysqlVer;
    protected $aMysqlOptimizationSettings;

    protected $aOptimizationSettings;

    protected $aRequiredApacheModules;

    function __construct()
    {
        parent::__construct();

        $this->aType2ClassCSS = array (
            BX_DOL_AUDIT_FAIL => 'fail',
            BX_DOL_AUDIT_WARN => 'warn',
            BX_DOL_AUDIT_UNDEF => 'undef',
            BX_DOL_AUDIT_OK => 'ok',
        );

        $this->aType2Title = array (
            BX_DOL_AUDIT_FAIL => _t('_sys_audit_title_fail'),
            BX_DOL_AUDIT_WARN => _t('_sys_audit_title_warn'),
            BX_DOL_AUDIT_UNDEF => _t('_sys_audit_title_undef'),
            BX_DOL_AUDIT_OK => _t('_sys_audit_title_ok'),
        );

        $this->sMinPhpVer = '8.1.0';
        $this->aPhpSettings = array (
            'allow_url_fopen' => array('op' => '=', 'val' => true, 'type' => 'bool'),
            'allow_url_include' => array('op' => '=', 'val' => false, 'type' => 'bool'),
            'magic_quotes_gpc' => array('op' => '=', 'val' => false, 'type' => 'bool', 'warn' => 1),
            'memory_limit' => array('op' => '>=', 'val' => 128*1024*1024, 'type' => 'bytes', 'unlimited' => -1),
            'post_max_size' => array('op' => '>=', 'val' => 2*1024*1024, 'type' => 'bytes', 'warn' => 1),
            'upload_max_filesize' => array('op' => '>=', 'val' => 2*1024*1024, 'type' => 'bytes', 'warn' => 1),
            'register_globals' => array('op' => '=', 'val' => false, 'type' => 'bool'),
            'safe_mode' => array('op' => '=', 'val' => false, 'type' => 'bool'),
            'short_open_tag' => array('op' => '=', 'val' => true, 'type' => 'bool'),
            'disable_functions' => array('op' => 'without', 'val' => 'shell_exec,eval,assert,phpinfo,getenv,ini_set,fsockopen,chmod,parse_ini_file,readfile,escapeshellcmd,fput,popen'),
            'php module: curl' => array('op' => 'module', 'val' => 'curl'),
            'php module: gd' => array('op' => 'module', 'val' => 'gd'),
            'php module: mbstring' => array('op' => 'module', 'val' => 'mbstring'),
            'php module: json' => array('op' => 'module', 'val' => 'json'),
            'php module: fileinfo' => array('op' => 'module', 'val' => 'fileinfo'),
            'php module: zip' => array('op' => 'module', 'val' => 'zip'),
            'php module: openssl' => array('op' => 'module', 'val' => 'openssl'),
            'php module: exif' => array('op' => 'module', 'val' => 'exif'),
        );

        $this->sMinMysqlVer = '5.5.3';
        $this->aMysqlOptimizationSettings = array (
            'key_buffer_size' => array('op' => '>=', 'val' => 128*1024, 'type' => 'bytes'),
            'max_heap_table_size' => array('op' => '>=', 'val' => 16*1024*1024, 'type' => 'bytes'),
            'tmp_table_size' => array('op' => '>=', 'val' => 16*1024*1024, 'type' => 'bytes'),
            'thread_cache_size ' => array('op' => '>', 'val' => 0),
        );

        $this->aOptimizationSettings = array (
            'DB cache' => array('enabled' => 'sys_db_cache_enable', 'cache_engine' => 'sys_db_cache_engine', 'check_accel' => true),
            'Pages cache' => array('enabled' => 'sys_page_cache_enable', 'cache_engine' => 'sys_page_cache_engine', 'check_accel' => true),
            'Page blocks cache' => array('enabled' => 'sys_pb_cache_enable', 'cache_engine' => 'sys_pb_cache_engine', 'check_accel' => true),
            'Templates Cache' => array('enabled' => 'sys_template_cache_enable', 'cache_engine' => 'sys_template_cache_engine', 'check_accel' => true),
            'CSS files cache' => array('enabled' => 'sys_template_cache_css_enable', 'cache_engine' => '', 'check_accel' => false),
            'JS files cache' => array('enabled' => 'sys_template_cache_js_enable', 'cache_engine' => '', 'check_accel' => false),
            'Compression for CSS/JS cache' => array('enabled' => 'sys_template_cache_compress_enable', 'cache_engine' => '', 'check_accel' => false),
        );

        $this->aRequiredApacheModules = array (
            'rewrite_module' => 'mod_rewrite',
        );

        if (isset($_GET['action'])) {
            $sOutput = null;
            switch ($_GET['action']) {
                case 'audit_send_test_email':
                    $sOutput = $this->sendTestEmail();
                    break;
                case 'phpinfo':
                    ob_start();
                    phpinfo();
                    $sOutput = ob_get_clean();
                    break;
                case 'phpinfo_popup':
                    $sUrlSelf = bx_js_string($_SERVER['PHP_SELF'], BX_ESCAPE_STR_APOS);
                    $sUrlSelf = bx_append_url_params($sUrlSelf, array('action' => 'phpinfo'));
                    $sOutput = '<iframe width="640" height="480" src="' . $sUrlSelf . '"></iframe>';
                    break;
            }
            if ($sOutput) {
                header('Content-type: text/html; charset=utf-8');
                echo $sOutput;
                exit;
            }
        }
    }

    public function generate()
    {
        ob_start();

        $this->setErrorReporting();

        $this->generateStyles();
        $this->generateJs();

        $this->requirements();

        if (!defined('BX_DOL_INSTALL'))
            $this->siteSetup();

        $this->optimization();

        $this->manualCheck();

        $this->restoreErrorReporting();

        return ob_get_clean();
    }

    public function generateStyles($bReturn = false)
    {
    	ob_start();
        ?>
<style>
    .ok {
        color:green;
    }
    .fail {
        color:red;
    }
    .warn {
        color:orange;
    }
    .undef {
        color:gray;
    }
</style>
        <?php
        $sStyles = ob_get_clean();

        if($bReturn)
			return $sStyles;

		echo $sStyles;
    }

    public function generateJs()
    {
        $sUrlSelf = bx_js_string($_SERVER['PHP_SELF'], BX_ESCAPE_STR_APOS);
        ?>
        <script language="javascript">
            function bx_sys_adm_audit_test_email()
            {
            	bx_prompt('<?php echo _t('_Email'); ?>', '<?php echo class_exists('BxDolDb') && BxDolDb::getInstance() ? BxDolDb::getInstance()->getParam('site_email') : ''; ?>', function(oPopup) {
        			var sEmail = oPopup.getValue();
                    if (null == sEmail || ('string' == (typeof sEmail) && !sEmail.length))
                        return;

                    $('#bx-sys-adm-audit-test-email').html('Sending...');
                    $.post('<?php echo bx_append_url_params($sUrlSelf, array('action' => 'audit_send_test_email')); ?>&email=' + sEmail, function(data) {
                        $('#bx-sys-adm-audit-test-email').html(data);
                    });
				});

            	return false;
            }

            function bx_sys_adm_audit_phpinfo()
            {
                $(window).dolPopupAjax({url: '<?php echo bx_append_url_params($sUrlSelf, array('action' => 'phpinfo_popup')); ?>'});
            }
        </script>
        <?php
    }

    /**
     * Check minimal requirements
     * @param $sType - BX_DOL_AUDIT_FAIL, BX_DOL_AUDIT_WARN, BX_DOL_AUDIT_UNDEF or BX_DOL_AUDIT_OK
     * @param $sFunc - requirementsPHP, requirementsMySQL or requirementsWebServer
     * @return array of FAIL, WARN, UNDEF or OK items, if array is empty then no specified items are found
     */
    public function checkRequirements($sType = BX_DOL_AUDIT_FAIL, $sFunc = 'requirementsPHP')
    {
        $this->setErrorReporting();

        $aRet = array ();        
        $aMessages = array ();  

        $this->$sFunc(false, $aMessages);

        foreach ($aMessages as $sName => $r) {
            if ($sType != $r['type'])
                continue;

            $aSetting = isset($this->aPhpSettings[$sName]) ? $this->aPhpSettings[$sName] : array();
            $sLabel = (!empty($aSetting['op']) && $aSetting['op'] === 'module') ? $aSetting['val'] : $sName;
            $sValue = (!empty($aSetting['op']) && $aSetting['op'] === 'module') ? '' : $this->format_output($r['params']['real_val'], $aSetting);
            $s = $sLabel;
            if ($sValue !== '' && $sValue !== null)
                $s .= ' = ' . $sValue;
            if ($s !== '')
                $s .= ' ';
            $aRet[] = trim($s . $this->getMsgHTML($sName, $r));
        }

        $this->restoreErrorReporting();

        return $aRet;
    }

    public function typeToTitle ($sType) 
    {
        return $this->aType2Title[$sType];
    }

    protected function requirements()
    {
        echo '<h1>' . _t('_sys_audit_header_requirements') . '</h1>';
        $this->requirementsPHP();
        if (!defined('BX_DOL_INSTALL'))
            $this->requirementsMySQL();
        $this->requirementsWebServer();
        $this->requirementsOS();
        $this->requirementsHardware();
    }

    protected function requirementsPHP($bEcho = true, &$aOutputMessages = null)
    {
        $sHttpCode = null; 
        $s = bx_file_get_contents('http://php.net/releases/index.php?serialize=1', array(), 'get', array(), $sHttpCode, array(), 20, array(CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4));
        $sLatestPhpVersion = $s && ($a = unserialize($s)) ? $a[5]['version'] : '';

        if (version_compare(phpversion(), "5.4", ">=") == 1)
            unset($this->aPhpSettings['short_open_tag']);

        $aMessages = array ();

        $sPhpVer = PHP_VERSION;
        if (empty($sLatestPhpVersion))
            $aVer = array('type' => BX_DOL_AUDIT_UNDEF, 'msg' => _t('_sys_audit_msg_value_checking_failed'), 'params' => array ('real_val' => $sPhpVer));
        elseif (version_compare($sPhpVer, $this->sMinPhpVer, '<'))
            $aVer = array('type' => BX_DOL_AUDIT_FAIL, 'msg' => _t('_sys_audit_msg_version_is_incompatible', $this->sMinPhpVer), 'params' => array ('real_val' => $sPhpVer));
        elseif (version_compare($sPhpVer, '5.3.0', '>=') && version_compare($sPhpVer, '5.4.0', '<'))
            $aVer = array('type' => BX_DOL_AUDIT_WARN, 'msg' => _t('_sys_audit_msg_version_is_outdated', $sLatestPhpVersion), 'params' => array ('real_val' => $sPhpVer));
        else
            $aVer = array('type' => BX_DOL_AUDIT_OK, 'params' => array ('real_val' => $sPhpVer));

        $aMessages[_t('_sys_audit_version')] = $aVer;

        foreach ($this->aPhpSettings as $sName => $r) {
            $a = $this->checkPhpSetting($sName, $r);
            if ($a['res'])
                $aMessages[$sName] = array('type' => BX_DOL_AUDIT_OK, 'params' => $a);
            elseif (isset($r['warn']) && $r['warn'])
                $aMessages[$sName] = array('type' => BX_DOL_AUDIT_WARN, 'msg' => _t('_sys_audit_msg_should_be', $r['op'], $this->format_output($r['val'], $r)), 'params' => $a);
            else
                $aMessages[$sName] = array('type' => BX_DOL_AUDIT_FAIL, 'msg' => _t('_sys_audit_msg_must_be', $r['op'], $this->format_output($r['val'], $r)), 'params' => $a);
        }

        if (null !== $aOutputMessages)
            $aOutputMessages = $aMessages;

        if ($bEcho) {
            $s = '';
            foreach ($aMessages as $sName => $r) {
                $aSetting = isset($this->aPhpSettings[$sName]) ? $this->aPhpSettings[$sName] : array();
                $sLabel = (!empty($aSetting['op']) && $aSetting['op'] === 'module') ? $aSetting['val'] : $sName;
                $sValue = (!empty($aSetting['op']) && $aSetting['op'] === 'module') ? '' : $this->format_output($r['params']['real_val'], $aSetting);
                $s .= $this->getBlock($sLabel, $sValue, $this->getMsgHTML($sName, $r));
            }
            echo $this->getSection('PHP', '', $s);
        }
    }

    protected function requirementsMySQL($bEcho = true, &$aOutputMessages = null)
    {
        $sMysqlVer = BxDolDb::getInstance()->getServerInfo();
        if (preg_match ('/^(\d+)\.(\d+)\.(\d+)/', $sMysqlVer, $m)) {
            $sMysqlVer = "{$m[1]}.{$m[2]}.{$m[3]}";
            if (version_compare($sMysqlVer, $this->sMinMysqlVer, '<'))
                $aMessage = array('type' => BX_DOL_AUDIT_FAIL, 'msg' => _t('_sys_audit_msg_version_is_incompatible', $this->sMinMysqlVer));
            else
                $aMessage = array('type' => BX_DOL_AUDIT_OK);
        } else {
            $aMessage = array('type' => BX_DOL_AUDIT_UNDEF, 'msg' => _t('_sys_audit_msg_value_checking_failed'));
        }

        if (null !== $aOutputMessages)
            $aOutputMessages['mysql'] = array($aMessage);

        if ($bEcho) {
            $s = $this->getBlock(_t('_sys_audit_version'), $sMysqlVer, $this->getMsgHTML(_t('_sys_audit_version'), $aMessage));
            echo $this->getSection('MySQL', '', $s);
        }
    }

    protected function requirementsWebServer($bEcho = true, &$aOutputMessages = null)
    {
        $aMessages = array();
        foreach ($this->aRequiredApacheModules as $sName => $sNameCompiledName)
            $aMessages[$sName] = $this->checkApacheModule($sName, $sNameCompiledName);

        if (null !== $aOutputMessages)
            $aOutputMessages = $aMessages;

        if ($bEcho) {
            $s = '';
            foreach ($aMessages as $sName => $r) {
                $s .= $this->getBlock($sName, '', $this->getBlock('', '', $this->getMsgHTML($sName, $r), false));
            }
            echo $this->getSection(_t('_sys_audit_section_webserver'), $_SERVER['SERVER_SOFTWARE'], $s);
        }
    }

    protected function requirementsOS()
    {
        $s = $this->getBlock(php_uname());
        echo $this->getSection(_t('_sys_audit_section_os'), '', $s);
    }

    protected function requirementsHardware()
    {
        $s = $this->getBlock(_t('_sys_audit_msg_hardware_requirements'));
        echo $this->getSection(_t('_sys_audit_section_hardware'), '', $s);
    }

    protected function siteSetup()
    {
        $sFfmpegPath = defined('BX_SYSTEM_FFMPEG') ? BX_SYSTEM_FFMPEG : BX_DIRECTORY_PATH_PLUGINS . 'ffmpeg/ffmpeg.exe';

        $sEmailToCkeckMailSending = class_exists('BxDolDb') && BxDolDb::getInstance() ? BxDolDb::getInstance()->getParam('site_email') : '';

        $oUpgrader = new BxDolUpgrader();
        if (!($sLatestVer = $oUpgrader->getLatestVersionNumber()))
            $sLatestVer = 'undefined';

        $sVer = bx_get_ver();
        $aMessage = array('type' => BX_DOL_AUDIT_OK);
        if (!version_compare($sVer, $sLatestVer, '>='))
            $aMessage = array('type' => BX_DOL_AUDIT_WARN, 'msg' => _t('_sys_audit_msg_version_is_outdated', $sLatestVer));

        $s = $this->getBlock(_t('_sys_audit_version_script'), $sVer, $this->getMsgHTML(_t('_sys_audit_version_script'), $aMessage));

        $s .= $this->getBlock(_t('_sys_audit_permissions'), '', _t('_sys_audit_msg_permissions'));

        $s .= $this->getBlock('ffmpeg', '', _t('_sys_audit_msg_ffmpeg', shell_exec("{$sFfmpegPath} 2>&1")));

        $s .= $this->getBlock(_t('_sys_audit_mail_sending'), '', _t('_sys_audit_msg_mail_sending'));

        $s .= $this->getBlock(_t('_sys_audit_cron_jobs'), '', _t('_sys_audit_msg_cron_jobs', shell_exec("crontab -l 2>&1")));

        $iCronTime = getParam('sys_cron_time');
        $s .= $this->getBlock(_t('_sys_audit_cron_jobs_exec_time'), '', !empty($iCronTime) ? bx_time_js($iCronTime, BX_FORMAT_DATE_TIME, true) : _t('_None'));

        echo '<h1>' . _t('_sys_audit_header_site_setup') . '</h1>';
        echo "<ul>$s</ul>";
    }

    protected function optimization()
    {
        echo '<h1>' . _t('_sys_audit_header_site_optimization') . '</h1>';

        $this->optimizationPhp();

        if (!defined('BX_DOL_INSTALL'))
            $this->optimizationMySQL();

        $this->optimizationWebServer();

        if (!defined('BX_DOL_INSTALL'))
            $this->optimizationScript();

        if (!defined('BX_DOL_INSTALL'))
            $this->optimizationCache();
    }

    protected function optimizationPhp()
    {
        $s = '';
        $aMessage = array();

        $sAccel = $this->getPhpAccelerator();
        if (!$sAccel)
            $aMessage = array('type' => BX_DOL_AUDIT_WARN, 'msg' => _t('_sys_audit_msg_php_accelerator_missing'));
        else
            $aMessage = array('type' => BX_DOL_AUDIT_OK);
        $s .= $this->getBlock(_t('_sys_audit_php_accelerator'), $sAccel, $this->getMsgHTML(_t('_sys_audit_php_accelerator'), $aMessage));

        $sSapi = php_sapi_name();
        if (0 === strcasecmp('cgi', $sSapi))
            $aMessage = array('type' => BX_DOL_AUDIT_WARN, 'msg' => _t('_sys_audit_msg_php_setup_inefficient'));
        else
            $aMessage = array('type' => BX_DOL_AUDIT_OK);
        $s .= $this->getBlock(_t('_sys_audit_php_setup'), $sSapi, $this->getMsgHTML(_t('_sys_audit_php_setup'), $aMessage));

        echo $this->getSection('PHP', '', $s);
    }

    protected function optimizationMySQL()
    {
        $s = '';
        $oDb = BxDolDb::getInstance();

        foreach ($this->aMysqlOptimizationSettings as $sName => $r) {
            $a = $this->checkMysqlSetting($sName, $r, $oDb);
            $aMessage = array('type' => BX_DOL_AUDIT_OK);
            if (!$a['res'])
                $aMessage = array('type' => BX_DOL_AUDIT_FAIL, 'msg' => _t('_sys_audit_msg_must_be', $r['op'], $this->format_output($r['val'], $r)));
            $s .= $this->getBlock($sName, $this->format_output($a['real_val'], $r), $this->getMsgHTML($sName, $aMessage));
        }

        echo $this->getSection('MySQL', '', $s);
    }

    protected function optimizationWebServer()
    {
        $s = '';

        $sName = 'expires_module';
        $sApacheModuleChack = _t('_sys_audit_msg_optimization_apache_module', $sName, $this->getMsgHTML($sName, $this->checkApacheModule($sName)));
        $s .= $this->getBlock(_t('_sys_audit_userside_caching'), '', _t('_sys_audit_msg_userside_caching', $this->getUrlForGooglePageSpeed('LeverageBrowserCaching'), $sApacheModuleChack));

        $sName = 'deflate_module';
        $sApacheModuleChack = _t('_sys_audit_msg_optimization_apache_module', $sName, $this->getMsgHTML($sName, $this->checkApacheModule($sName)));
        $s .= $this->getBlock(_t('_sys_audit_serverside_compression'), '', _t('_sys_audit_msg_serverside_compression', $sApacheModuleChack));

        echo $this->getSection(_t('_sys_audit_section_webserver'), '', $s);
    }

    protected function optimizationScript()
    {
        $s = '';
        foreach ($this->aOptimizationSettings as $sName => $a) {

            $sVal = ('always_on' == $a['enabled'] || getParam($a['enabled'])) ? 'On' : 'Off';
            if ($a['cache_engine'])
                $sVal .= _t('_sys_audit_msg_x_based_cache_engine', getParam($a['cache_engine']));

            if ('always_on' != $a['enabled'] && !getParam($a['enabled']))
                $aMessage = array('type' => BX_DOL_AUDIT_FAIL, 'msg' => _t('_sys_audit_msg_optimization_fail'));
            elseif ($a['check_accel'] && !$this->getPhpAccelerator() && 'File' == getParam($a['cache_engine']))
                $aMessage = array('type' => BX_DOL_AUDIT_WARN, 'msg' => _t('_sys_audit_msg_optimization_warn'));
            else
                $aMessage = array('type' => BX_DOL_AUDIT_OK);

            $s .= $this->getBlock($sName, $sVal, $this->getMsgHTML($sName, $aMessage));
        }

        echo $this->getSection('UNA', '', $s);
    }

    protected function optimizationCache()
    {
        $a = explode(',', 'File,APC,Memcache,Memcached,Redis');
        $s = '';
        foreach ($a as $sName) {

            $sClass = 'BxDolCache' . $sName;
            if (class_exists($sClass))
                $o = new $sClass();

            if ($o && $o->isInstalled() && $o->isAvailable()) {
                $val = true;
                $aMessage = array('type' => BX_DOL_AUDIT_OK);
            } else {
                $val = false;
                $aMessage = array('type' => BX_DOL_AUDIT_FAIL);
            }

            $s .= $this->getBlock($sName, $this->format_output($val, ['type' => 'bool' ]), $this->getMsgHTML($sName, $aMessage));
        }

        echo $this->getSection('Cache engines', '', $s);
    }

    protected function manualCheck()
    {
        echo '<a name="manual_audit"></a>';
        echo '<h1>' . _t('_sys_audit_header_manual_audit') . '</h1>';
        echo _t('_sys_audit_msg_manual_audit');
    }

    protected function checkPhpSetting($sName, $a)
    {
        $mixedVal = ini_get($sName);
        $mixedVal = $this->format_input ($mixedVal, $a);

        switch ($a['op']) {
            case 'without':
                $aFuncsDisabled = explode(',', $mixedVal);
                array_walk($aFuncsDisabled, function (&$sVal, $sKey) {
                    $sVal = trim($sVal);
                });
                $aFuncsMustBeEnabled = explode(',', $a['val']);
                $a = array_intersect($aFuncsDisabled, $aFuncsMustBeEnabled);
                $bResult = !$a;
                break;
            case 'module':
                $bResult = extension_loaded($a['val']);
                $mixedVal = $bResult ? $a['val'] : '';
                break;
            case '>':
                $bResult = (isset($a['unlimited']) && $mixedVal == $a['unlimited']) ? true : ($mixedVal > $a['val']);
                break;
            case '>=':
                $bResult = (isset($a['unlimited']) && $mixedVal == $a['unlimited']) ? true : ($mixedVal >= $a['val']);
                break;
            case '=':
            default:
                $bResult = ($mixedVal == $a['val']);
        }
        return array ('res' => $bResult, 'real_val' => $mixedVal);
    }

    protected function checkMysqlSetting($sName, $a, $oDb)
    {
        $mixedVal = $oDb->getOption($sName);
        $mixedVal = $this->format_input ($mixedVal, $a);

        switch ($a['op']) {
            case '>':
                $bResult = ($mixedVal > $a['val']);
                break;
            case '>=':
                $bResult = ($mixedVal >= $a['val']);
                break;
            case 'strcasecmp':
                $bResult = 0 === strcasecmp($mixedVal, $a['val']);
                break;
            case '=':
            default:
                $bResult = ($mixedVal == $a['val']);
        }
        return array ('res' => $bResult, 'real_val' => $mixedVal);
    }

    protected function format_output ($mixedVal, $a)
    {
        if (isset($a['type']) && 'bytes' == $a['type'])
            return function_exists('_t_format_size') ? _t_format_size($mixedVal) : $mixedVal;
        if (isset($a['type']) && 'bool' == $a['type'])
            return $mixedVal ? 'On' : 'Off';
        else
            return $mixedVal;
    }

    protected function format_input ($mixedVal, $a)
    {
        if (isset($a['type']) && 'bytes' == $a['type'])
            return $this->format_bytes ($mixedVal);
        else
            return $mixedVal;
    }

    protected function format_bytes($val)
    {
        return return_bytes($val);
    }

    protected function checkApacheModule ($sModule, $sNameCompiledName = '')
    {
        $a = array (
            'deflate_module' => 'mod_deflate',
            'expires_module' => 'mod_expires',
        );
        if (!$sNameCompiledName && isset($a[$sModule]))
            $sNameCompiledName = $a[$sModule];

        if (function_exists('apache_get_modules')) {

            $aModules = apache_get_modules();
            $ret = in_array($sNameCompiledName, $aModules);

        } else {

            $sApachectlPath = trim(shell_exec("which apachectl"));
            if (!$sApachectlPath)
                $sApachectlPath = trim(shell_exec("which apache2ctl"));
            if (!$sApachectlPath)
                $sApachectlPath = trim(shell_exec("which /usr/local/apache/bin/apachectl"));
            if (!$sApachectlPath)
                $sApachectlPath = trim(shell_exec("which /usr/local/apache/bin/apache2ctl"));
            if (!$sApachectlPath) {
                return array('type' => BX_DOL_AUDIT_UNDEF);
            }
            $ret = (bool)shell_exec("$sApachectlPath -M 2>&1 | grep $sModule");
            if (!$ret)
                $ret = (bool)shell_exec("$sApachectlPath -l 2>&1 | grep $sNameCompiledName");
        }

        $aMessage = array('type' => BX_DOL_AUDIT_OK);
        if (!$ret)
            $aMessage = array('type' => BX_DOL_AUDIT_FAIL, 'msg' => _t('_sys_audit_msg_apache_module_fail', $sModule));
        
        return $aMessage;
    }

    protected function getPhpAccelerator ()
    {
        $aAccelerators = array (
            'APC' => array('op' => 'module', 'val' => 'apc'),
            'XCache' => array('op' => 'module', 'val' => 'xcache'),
        	'ZendOPcache' => array('op' => 'module', 'val' => 'Zend OPcache'),
        );
        foreach ($aAccelerators as $sName => $r) {
            $a = $this->checkPhpSetting($sName, $r);
            if ($a['res'])
                return $sName;
        }
        return false;
    }

    protected function getUrlForGooglePageSpeed ($sRule)
    {
        if (defined('BX_DOL_URL_ROOT')) {
            $sUrl = BX_DOL_URL_ROOT;
        }
        else {
            $sUrl = 'http://';
            if  (
                (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS']) || 
                (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && 'https' == strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'])) || 
                getenv('UNA_HTTPS')
            )
                $sUrl = 'https://';
            $sUrl .= $_SERVER['HTTP_HOST'] . str_replace('/install/index.php', '', $_SERVER['PHP_SELF']);
        }
        return 'https://pagespeed.web.dev/report?url=' . $sUrl;
    }

    protected function sendTestEmail ()
    {
        $sEmailToCkeckMailSending = isset($_GET['email']) ? $_GET['email'] : getParam('site_email');
        $mixedRet = sendMail($sEmailToCkeckMailSending, 'Audit Test Email', 'Sample text for testing<br /><u><b>Sample text for testing</b></u>', '', array(), BX_EMAIL_SYSTEM);
        if (!$mixedRet) {
            $aMessage = array('type' => BX_DOL_AUDIT_FAIL, 'msg' => _t('_sys_audit_msg_mail_send_failed'));
            return $this->getBlock('', '', $this->getMsgHTML(_t('_sys_audit_mail_sending'), $aMessage), false);
        } else {
            return _t('_sys_audit_msg_mail_sent', $sEmailToCkeckMailSending);
        }
    }

    protected function setErrorReporting ()
    {
        if (version_compare(phpversion(), "5.3.0", ">=") == 1)
            $this->iPhpErrorReporting = error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED);
        else
            $this->iPhpErrorReporting = error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
    }

    protected function restoreErrorReporting ()
    {
        error_reporting($this->iPhpErrorReporting);
    }

    protected function getSection($sTitle, $sTitleAddon, $sContent)
    {
        $s = '<div class="bx-audit-section-head">';
        if ($sTitle !== '')
            $s .= '<b>' . $sTitle . '</b>';
        if ($sTitleAddon !== '')
            $s .= ($sTitle !== '' ? ': ' : '') . $sTitleAddon;
        $s .= '</div>';
        $s .= '<ul>';
        $s .= $sContent;
        $s .= '</ul>';
        return $s;
    }

    protected function getBlock($sName, $sValue = '', $sMsg = '', $bWrapAsListItem = true)
    {
        $s = $bWrapAsListItem ? '<li>'  : '';
        if ($sName !== '')
            $s .= $sName;
        if ($sValue !== '')
            $s .= ' = ' . $sValue;
        if ($sMsg) {
            if ($sName !== '' || $sValue !== '')
                $s .= ' ';
            $s .= $sMsg;
        }
        return $s . ($bWrapAsListItem ? '</li>' : '') . "\n";
    }

    protected function getMsgHTML($sName, $a)
    {
        $s = '';
        $s .= '<b class="' . $this->aType2ClassCSS[$a['type']]. '">' . $this->aType2Title[$a['type']]. '</b> ';
        if (isset($a['msg']))
            $s .= '(' . $a['msg'] . ')';
        return $s;
    }
}

/** @} */
