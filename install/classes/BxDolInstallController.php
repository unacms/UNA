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

        $this->_oView->out('audit.php', compact('sAuditOutput'));

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

        if (empty($aErrors))
            $this->_oView->out('initial.php', compact('aLangs', 'aWarnings'));
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

        $this->_oView->setToolbarItem('question', 'https://unacms.com/wiki/installation-overview', _t('_sys_inst_help_permissions'), '_blank');

        $this->_oView->pageEnd($this->_getTitle());
    }

    function actionSiteConfig ()
    {        
        $this->_oView->pageStart();

        $oSiteConfig = new BxDolInstallSiteConfig();
        $sForm = $oSiteConfig->getFormHtml();

        $this->_oView->out('site_config.php', compact('sForm'));

        $this->_oView->setToolbarItem('question', 'https://unacms.com/wiki/installation-overview', _t('_sys_inst_help_site_config'), '_blank');

        $this->_oView->pageEnd($this->_getTitle());
    }

    function actionFinish ()
    {
        require_once(BX_INSTALL_PATH_HEADER);
        
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

        $this->_oView->out('finish.php', compact('sPathToPhp'));

        $this->_oView->setToolbarItem('question', 'https://unacms.com/wiki/installation-overview', _t('_sys_inst_help_finish'), '_blank');

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
