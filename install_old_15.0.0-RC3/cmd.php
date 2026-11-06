<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaInstall UNA Install
 * @{
 *

/**
 * Install command line interface
 */
class BxDolInstallCmd
{
    protected $_sHeaderPath;
    protected $_aSiteConfig;
    protected $_isQuiet = false;
    protected $_aAdditionalModules = array();
    protected $_aReturnCodes = array(
        'success' => array ('code' => 0, 'msg' => 'Success.'),
        'already installed' => array ('code' => 0, 'msg' => 'Script is already installed. Can\'t perform install.'),
        'requirements failed' => array ('code' => 2, 'msg' => 'Requirements aren\'t met.'),
        'permissions failed' => array ('code' => 3, 'msg' => 'Folders and/or files permissions aren\'t correct.'),
        'create config failed' => array ('code' => 4, 'msg' => 'Form data was not submitted.'),
        'module failed' => array ('code' => 5, 'msg' => 'Additional module install failed. '),
    );

    public function __construct()
    {
        $aPathInfo = pathinfo(__FILE__);

        $this->_aSiteConfig = array (
            'server_http_host' => 'localhost',
            'server_php_self' => '/install/index.php',
            'server_doc_root' => str_replace('/install', '/', $aPathInfo['dirname']),
            // form data below
            'site_config' => true,
            'db_host' => 'localhost',
            'db_port' => '',
            'db_sock' => '',
            'db_name' => 'test',
            'db_user' => 'root',
            'db_password' => 'root',
            'db_engine' => 'MYISAM',
            'site_title' => 'UNA Test',
            'site_email' => 'no-reply@example.com',
            'admin_email' => 'admin@example.com',
            'admin_username' => 'admin',
            'admin_password' => 'unauna',
            'language' => 'en',
            'oauth_key' => '',
            'oauth_secret' => '',
        );

        $this->_sHeaderPath = $this->_aSiteConfig['server_doc_root'] . 'inc/header.inc.php';
    }

    public function main()
    {
        // set neccessary options

        $a = getopt('hqm:', $this->getOptions());

        if (isset($a['h']))
            $this->finish($this->_aReturnCodes['success']['code'], $this->getHelp());

        if (isset($a['q']))
            $this->_isQuiet = true;

        if (isset($a['m']))
            $this->_aAdditionalModules = explode(',', $a['m']);

        $this->_aSiteConfig = array_merge($this->_aSiteConfig, $a);

        // initialize environment

        $this->init();

        // peform install

        $this->checkRequirements();
        $this->checkPermissions();
        $this->createSiteConfig();
        $this->hashSystemFiles();

        $this->finish($this->_aReturnCodes['success']['code'], $this->_aReturnCodes['success']['msg']);
    }

    protected function getOptions()
    {
        $a = array ();
        foreach ($this->_aSiteConfig as $sKey => $sValue)
            if ('site_config' != $sKey)
                $a[] = "$sKey::";
        return $a;
    }

    protected function getHelp()
    {
        $s = "Usage: php cmd.php [options]\n";

        $s .= str_pad("\t -h", 35) . "Print this help\n";
        $s .= str_pad("\t -q", 35) . "Quiet\n";
        $s .= str_pad("\t -m <module1,module2,...,moduleN>", 35) . "Install additional modules, by module name (ex:bx_notes)\n";

        foreach ($this->_aSiteConfig as $sKey => $sVal)
            if ('site_config' != $sKey)
                $s .= str_pad("\t --{$sKey}=<value>", 35) . "Default value: {$sVal}\n";

        $s .= "\n";
        $s .= "Return codes:\n";
        foreach ($this->_aReturnCodes as $r)
            $s .= str_pad("\t {$r['code']}", 5) . "{$r['msg']}\n";

        return $s;
    }

    protected function finish($iCode, $sMsg)
    {
        if (!$this->_isQuiet)
            fwrite($iCode ? STDERR : STDOUT, $sMsg . "\n");

        exit($iCode);
    }

    protected function init()
    {
        // skip this test if script is already installed
        if (file_exists($this->_sHeaderPath))
            $this->finish($this->_aReturnCodes['already installed']['code'], $this->_aReturnCodes['already installed']['msg']);

        // include necessary files to perform install
        $_REQUEST['action'] = 'empty';
        $aPathInfo = pathinfo(__FILE__);
        require_once($aPathInfo['dirname'] . '/index.php');
    }

    public function checkRequirements()
    {
        $oAudit = new BxDolStudioToolsAudit();
        $aErrors = $oAudit->checkRequirements(BX_DOL_AUDIT_FAIL);

        if (!empty($aErrors))
            $this->finish($this->_aReturnCodes['requirements failed']['code'], $this->_aReturnCodes['requirements failed']['msg']);
    }

    public function checkPermissions()
    {
        $oAdmTools = new BxDolStudioTools();
        $bPermissionsOk = $oAdmTools->checkPermissions(false, false);

        if (!$bPermissionsOk)
            $this->finish($this->_aReturnCodes['permissions failed']['code'], $this->_aReturnCodes['permissions failed']['msg']);
    }

    public function createSiteConfig()
    {
        $oSiteConfig = new BxDolInstallSiteConfig($this->_aSiteConfig['server_http_host'], $this->_aSiteConfig['server_php_self'], $this->_aSiteConfig['server_doc_root'], false);

        $sFormData = $this->_aSiteConfig;
        unset($sFormData['server_http_host']);
        unset($sFormData['server_php_self']);
        unset($sFormData['server_doc_root']);

        $sErrorMessage = '';
        $mixedResult = $oSiteConfig->getFormHtml(array_merge($oSiteConfig->getAutoValues(), $sFormData), false, $sErrorMessage);

        if (true !== $mixedResult)
            $this->finish($this->_aReturnCodes['create config failed']['code'], $sErrorMessage ? $sErrorMessage : $this->_aReturnCodes['create config failed']['msg']);

        // install custom additional modules
        if (!empty($this->_aAdditionalModules)) {
            foreach ($this->_aAdditionalModules as $sModuleName) {
                $sErrorMessage = $oSiteConfig->processModuleByName($sModuleName);
                if ($sErrorMessage)
                    $this->finish($this->_aReturnCodes['module failed']['code'], $this->_aReturnCodes['module failed']['msg'] . strip_tags($sErrorMessage));
            }
        }
    }

    public function hashSystemFiles()
    {
        require_once(BX_INSTALL_PATH_HEADER);
        
        $oHasher = bx_instance('BxDolInstallerHasher');
        $oHasher->hashSystemFiles();
    }    
}

$o = new BxDolInstallCmd();
$o->main();

/** @} */
