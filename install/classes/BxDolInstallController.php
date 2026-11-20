<?php defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaInstall UNA Install
 * @{
 */

class BxDolInstallController
{

    protected $_oView;

    function __construct()
    {
        $this->_oView = new BxDolInstallView();
    }

    function run ($sAction = '')
    {
        // While a batched install runs, only the browser that started it may continue it or submit the form
        // again: anyone else could otherwise re-create the database under it. The command line passes.
        if ('empty' !== $sAction && BxDolInstallSiteConfig::isModulesBatchInProgress() && !BxDolInstallSiteConfig::getModulesQueue($this->_getQueueToken())) {
            $this->_inProgress();
            return;
        }

        $sMethod = 'action' . bx_gen_method_name($sAction);
        if ($sAction && method_exists($this, $sMethod))
            $this->$sMethod ();
        else
            $this->actionInitial ();
    }

    function actionEmpty ()
    {
    }

    function actionAudit ()
    {
        $this->_oView->pageStart();

        $oAudit = new BxDolStudioToolsAudit();
        $sAuditOutput = $oAudit->generate();
        $iAuditPassed = preg_match_all('/class="ok"/', $sAuditOutput);
        $iAuditWarnings = preg_match_all('/class="warn"/', $sAuditOutput);
        $iAuditFailed = preg_match_all('/class="fail"/', $sAuditOutput);

        $this->_oView->out('audit.php', compact('sAuditOutput', 'iAuditPassed', 'iAuditWarnings', 'iAuditFailed'));
        $this->_oView->setStep('server');

        $this->_oView->pageEnd($this->_getTitle());
    }

    function actionInitial ()
    {
        $this->_oView->pageStart();

        $aLangs = BxDolInstallLang::getInstance()->getAvailableLanguages();

        $oAudit = new BxDolStudioToolsAudit();
        $aErrors = $oAudit->checkRequirements(BX_DOL_AUDIT_FAIL);
        $aWarnings = $oAudit->checkRequirements(BX_DOL_AUDIT_WARN);

        $oAudit->generateStyles();

        $aSteps = $this->_oView->getSteps();
        if (empty($aErrors))
            $this->_oView->out('initial.php', compact('aLangs', 'aWarnings', 'aSteps'));
        else
            $this->_oView->out('initial_fail.php', compact('aLangs', 'aErrors'));

        $this->_oView->pageEnd($this->_getTitle());
    }

    function actionPermissions ()
    {
        $this->_oView->pageStart();

        $oAdmTools = new BxDolStudioTools();

        $sPermissionsStyles = $oAdmTools->generateStyles();

        ob_start();
        $bPermissionsOk = $oAdmTools->checkPermissions();
        $sPermissionsTable = ob_get_clean();

        $this->_oView->out('permissions.php', compact('sPermissionsStyles', 'sPermissionsTable', 'bPermissionsOk'));
        $this->_oView->setStep('server');

        $this->_oView->setToolbarItem('question', 'https://unacms.com/wiki/installation-overview', _t('_sys_inst_help_permissions'), '_blank');

        $this->_oView->pageEnd($this->_getTitle());
    }

    function actionSiteConfig ()
    {        
        $this->_oView->pageStart();

        $oSiteConfig = new BxDolInstallSiteConfig();
        // the modules are installed one per request, so that no request runs into a web server timeout
        $oSiteConfig->setModulesBatch(true);
        $sForm = $oSiteConfig->getFormHtml();

        $this->_oView->out('site_config.php', compact('sForm'));
        $this->_oView->setStep('database');

        $this->_oView->setToolbarItem('question', 'https://unacms.com/wiki/installation', _t('_sys_inst_help_site_config'), '_blank');

        $this->_oView->pageEnd($this->_getTitle());
    }

    /**
     * The progress of the batched install: the page asks for one module after another (modules_step).
     */
    public function actionModules ()
    {
        $aQueue = BxDolInstallSiteConfig::getModulesQueue($this->_getQueueToken());
        if (!$aQueue) {
            header('Location: index.php?action=site_config');
            exit;
        }

        $this->_oView->pageStart();

        $aModules = array();
        foreach (array_merge($aQueue['done'], $aQueue['skipped']) as $sName)
            $aModules[] = array('name' => $sName, 'state' => in_array($sName, $aQueue['done']) ? 'done' : 'skipped');
        foreach ($aQueue['modules'] as $aModule)
            $aModules[] = array('name' => $aModule['name'], 'title' => $aModule['title'], 'state' => 'pending');

        $aTitles = array();
        $oModulesTools = new BxDolInstallModulesTools();
        foreach ($oModulesTools->getModules() as $aConfig)
            $aTitles[$aConfig['name']] = $aConfig['title'];
        foreach ($aModules as $i => $aModule)
            $aModules[$i]['title'] = isset($aTitles[$aModule['name']]) ? $aTitles[$aModule['name']] : $aModule['name'];

        $this->_oView->out('modules.php', compact('aModules'));
        $this->_oView->setStep('install');

        $this->_oView->pageEnd($this->_getTitle());
    }

    /**
     * Install the next module of the batched install, the answer is JSON.
     */
    public function actionModulesStep ()
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');

        if ('POST' !== ($_SERVER['REQUEST_METHOD'] ?? '')) {
            http_response_code(405);
            echo json_encode(array('code' => 1, 'message' => 'POST only'));
            return;
        }

        // a module may print notices, they must not break the JSON; a module that stops the request
        // (a fatal error, the database's error page) is reported as that module's error
        $bAnswered = false;
        register_shutdown_function(function () use (&$bAnswered) {
            if ($bAnswered)
                return;
            $s = '';
            while (ob_get_level())
                $s .= ob_get_clean();
            $aError = error_get_last();
            $sMessage = trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags($s), ENT_QUOTES, 'UTF-8')));
            // the database's error page goes on with where it happened and a backtrace: the error is enough here
            $sMessage = trim(preg_replace('/\s*(Location:|Debug backtrace:).*$/s', '', $sMessage));
            if ('' === $sMessage && $aError)
                $sMessage = $aError['message'];
            http_response_code(200);
            echo json_encode(array('code' => 2, 'module' => BxDolInstallSiteConfig::$sModuleInProgress, 'message' => mb_substr($sMessage, 0, 600)));
        });

        ob_start();
        $oSiteConfig = new BxDolInstallSiteConfig();
        $aResult = $oSiteConfig->installNextModule($this->_getQueueToken(), !empty($_POST['skip']));
        ob_end_clean();
        $bAnswered = true;

        if (1 === $aResult['code'])
            http_response_code(403);

        echo json_encode($aResult);
    }

    /**
     * The last step of the batched install: put the site in place and show what is left to do.
     */
    public function actionModulesComplete ()
    {
        if ('POST' !== ($_SERVER['REQUEST_METHOD'] ?? '')) {
            header('Location: index.php?action=modules');
            exit;
        }

        ob_start();
        $oSiteConfig = new BxDolInstallSiteConfig();
        $sErrorMessage = $oSiteConfig->completeModules($this->_getQueueToken());
        ob_end_clean();

        if ($sErrorMessage) {
            $this->_oView->pageStart();
            $this->_oView->out('modules_error.php', compact('sErrorMessage'));
            $this->_oView->setStep('install');
            $this->_oView->pageEnd($this->_getTitle());
            return;
        }

        $this->_finish();
    }

    protected function _inProgress ()
    {
        http_response_code(403);
        header('Cache-Control: no-store');

        $this->_oView->pageStart();
        $this->_oView->out('modules_error.php', array('sErrorMessage' => _t('_sys_inst_msg_install_in_progress'), 'bBack' => false, 'sTitleKey' => '_sys_inst_in_progress'));
        $this->_oView->setStep('install');
        $this->_oView->pageEnd($this->_getTitle());
    }

    protected function _getQueueToken ()
    {
        return isset($_COOKIE[BX_INSTALL_QUEUE_COOKIE]) && is_string($_COOKIE[BX_INSTALL_QUEUE_COOKIE]) ? $_COOKIE[BX_INSTALL_QUEUE_COOKIE] : '';
    }

    protected function _finish ()
    {
        // the batched install has included the configuration file already, under its staged name
        BxDolInstallSiteConfig::includeHeader();
        
        $oHasher = bx_instance('BxDolInstallerHasher');
        $oHasher->hashSystemFiles();

        $this->_oView->pageStart();

        $sPathToPhp = "/replace/it/with/path/to/php/binary";
        $a = array(
            '/usr/local/bin/php',
            '/usr/bin/php',
            '/opt/local/bin/php',
        );
        foreach ($a as $sPath)
            if (file_exists($sPath))
                $sPathToPhp = $sPath;

        // the Docker setup runs periodic/cron.php in its own cron container (UNA_CRON_RUNNER in docker-compose.yml)
        $bCronContainer = 'docker' === getenv('UNA_CRON_RUNNER');

        $this->_oView->out('finish.php', compact('sPathToPhp', 'bCronContainer'));
        $this->_oView->setStep('done');

        $this->_oView->setToolbarItem('question', 'https://unacms.com/wiki/cron', _t('_sys_inst_help_finish'), '_blank');

        $this->_oView->pageEnd($this->_getTitle());

        bx_alert('system', 'installed', 0);
    }

    function actionRemoveInstall ()
    {
        require_once(BX_INSTALL_PATH_HEADER);

        $this->_oView->pageStart();

        $this->_oView->out('remove_install.php', array());

        $this->_oView->pageEnd($this->_getTitle());
    }

    protected function _getTitle()
    {
        return _t('_sys_inst_title', BX_DOL_VER);
    }


}

/** @} */
