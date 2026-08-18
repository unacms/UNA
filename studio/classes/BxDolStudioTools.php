<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_PERM_FILE', 'file');
define('BX_DOL_PERM_DIR', 'dir');
define('BX_DOL_PERM_EXE', 'exe');

define('BX_DOL_PERM_FAIL', false);
define('BX_DOL_PERM_OK', true);

class BxDolStudioTools extends BxDolIO
{
    protected $bInstallScript;
    protected $sRootPath;
    protected $sFfmpegPath;

    public $aInstallPermissions;
    public $aPostInstallPermissions;

    public function __construct()
    {
        parent::__construct();

        $sFfmpegPath = self::getFfmpegPath();
        if (defined('BX_DIRECTORY_PATH_ROOT') && BX_DIRECTORY_PATH_ROOT && strpos($sFfmpegPath, BX_DIRECTORY_PATH_ROOT) === 0)
            $sFfmpegPath = bx_ltrim_str($sFfmpegPath, BX_DIRECTORY_PATH_ROOT);
        $this->sFfmpegPath = $sFfmpegPath;

        $this->aInstallPermissions = array(
            'inc',
            'cache',
            'cache_public',
            'logs',
            'tmp',
            'storage',
            $sFfmpegPath,
        );

        // remove 'inc' folder if script is already installed
        if (defined('BX_DOL'))
            array_shift($this->aInstallPermissions);


        $this->aPostInstallPermissions = array(
        );

        if (defined('BX_DOL_INSTALL') && BX_DOL_INSTALL) {
            $this->bInstallScript = true;
            $this->sRootPath = BX_INSTALL_URL_ROOT;
        } else {
            $this->bInstallScript = false;
            $this->sRootPath = BX_DOL_URL_ROOT;
        }
    }

    public function generateStyles()
    {
        $sRet = <<<EOF
<style type="text/css">

    .bx-adm-hidden {
        display:none;
    }

    .bx-permissions-table {
        border-collapse:collapse;
    }

    .bx-permissions-table thead td {
        font-weight:bold;
    }

    .bx-permissions-table td:not(:first-child) {
        text-align:center;
    }

    .bx-permissions-wrong {
        color:red;
        font-weight:bold;
    }

    .bx-permissions-ok {
        color:green;
        font-weight:bold;
    }

</style>
EOF;
        return $sRet;
    }

    public function checkPermissions($isShowModules = false, $bEcho = true, &$aOutputMessages = null)
    {
        $bRet = true;
        $aMessages = array ();
        foreach ($this->aInstallPermissions as $s) {
            $sType = $this->_getFileType($s);

            $isOk = BX_DOL_PERM_EXE == $sType ? $this->isExecutable($s) : $this->isWritable($s);

            $aMessages[$s] = array ('res' => $isOk ? BX_DOL_PERM_OK : BX_DOL_PERM_FAIL, 'type' => $sType);
            if (!$isOk && $bRet) {
                $bFfmpegInstallSkip = defined('BX_DOL_INSTALL') && BX_DOL_INSTALL && $s === $this->sFfmpegPath;
                if (!$bFfmpegInstallSkip)
                    $bRet = false;
            }
        }

        if ($isShowModules && !$this->_checkPermissionsModules($aMessages) && $bRet)
            $bRet = false;

        if (null !== $aOutputMessages)
            $aOutputMessages = $aMessages;

        if ($bEcho) {
            $sHtml = '';
            foreach ($aMessages as $s => $r)
                $sHtml .= $this->_getHtmlPermissionRow($s, $r);
            echo $this->_getHtmlPermissionTable($sHtml);
        }


        return $bRet;
    }

    function GenCacheEnginesTable()
    {
        $sRet = '<table width="100%" cellspacing="1" cellpadding="0" class="install_table">';
        $sRet .= '
<tr class="head troubled">
    <td></td>
    <td class="center_aligned">' . _t('_sys_adm_installed') . '</td>
    <td class="center_aligned">' . _t('_sys_adm_cache_support') . '</td>
</tr>';

        $aEngines = array ('File', 'Memcache', 'APC', 'XCache');
        foreach ($aEngines as $sEngine) {
            $oCacheObject = @bx_instance ('BxDolCache' . $sEngine);
            $sRet .= '
<tr class="head troubled">
    <td class="left_aligned">' . $sEngine . '</td>
    <td class="center_aligned">' . (@$oCacheObject->isInstalled() ? '<font color="green">' . _t('_Yes') . '</font>' : '<font color="red">' . _t('_No') . '</font>') . '</td>
    <td class="center_aligned">' . (@$oCacheObject->isAvailable() ? '<font color="green">' . _t('_Yes') . '</font>' : '<font color="red">' . _t('_No') . '</font>') . '</td>
</tr>';
        }

        $sRet .= '</table>';
        return $sRet;
    }

    function GenTabbedPage($isShowModules = false)
    {
        $sTitleC = _t('_adm_admtools_title');
        $sAuditC = _t('');
        $sPermissionsC = _t('');
        $sCacheEnginesC = _t('');

        $sAuditTab = $this->GenAuditPage();
        $sPermissionsTab = $this->GenPermTable($isShowModules);
        $sCacheEnginesTab = $this->GenCacheEnginesTable();

        $sBoxContent = <<<EOF
<script language="javascript">
    <!--
    function switchAdmPage(oLink)
    {
        var sType = $(oLink).attr('id').replace('main_menu', '');
        var sName = '#page' + sType;

        $(oLink).parent('.notActive').hide().siblings('.notActive:hidden').show().siblings('.active').hide().siblings('#' + $(oLink).attr('id') + '-act').show();
        $(sName).siblings('div:visible').bx_anim('hide', 'fade', 'slow', function(){
            $(sName).bx_anim('show', 'fade', 'slow');
        });

        return false;
    }
    -->
</script>

<div class="boxContent" id="adm_pages">
    <div id="page0" class="bx-adm-visible">{$sAuditTab}</div>
    <div id="page1" class="bx-adm-hidden">{$sPermissionsTab}</div>
    <div id="page2" class="bx-adm-hidden">
        <iframe frameborder="0" width="100%" height="800" scrolling="auto" src="host_tools.php?get_phpinfo=true"></iframe>
    </div>
    <div id="page3" class="bx-adm-hidden">{$sCacheEnginesTab}</div>
</div>
EOF;

        $aTopItems = array(
            'main_menu0' => array('href' => 'javascript:void(0)', 'onclick' => 'javascript:switchAdmPage(this)', 'title' => _t('_adm_admtools_Audit'), 'active' => 1),
            'main_menu1' => array('href' => 'javascript:void(0)', 'onclick' => 'javascript:switchAdmPage(this)', 'title' => _t('_adm_admtools_Permissions'), 'active' => 0),
            'main_menu2' => array('href' => 'javascript:void(0)', 'onclick' => 'javascript:switchAdmPage(this)', 'title' => _t('_adm_admtools_phpinfo'), 'active' => 0),
        );

        return DesignBoxAdmin($sTitleC, $sBoxContent, $aTopItems, '', 11);
    }

    function GenAuditPage()
    {
        $oAudit = new BxDolStudioToolsAudit();
        return $oAudit->generate();
    }

    protected function _getHtmlPermissionRow($s, $r)
    {
        $sAwaitedPerm = BX_DOL_PERM_EXE == $r['type'] ? _t('_adm_admtools_Executable') : _t('_adm_admtools_Writable');
        $sResultPerm = $sAwaitedPerm;
        $sPerm = $this->getPermissions($s);
        $sClass = 'bx-permissions-ok';
        if (BX_DOL_PERM_FAIL == $r['res']) {
            $sClass = 'bx-permissions-wrong';
            if (false === $sPerm)
                $sResultPerm = _t('_adm_admtools_Not_Exists');
            else
                $sResultPerm = BX_DOL_PERM_EXE == $r['type'] ? _t('_adm_admtools_Non_Executable') : _t('_adm_admtools_Non_Writable');
        }

        return <<<EOF
<tr class="bx-def-color-bg-hl-even">
    <td class="bx-def-padding-thd">{$s}</td>
    <td class="bx-def-padding-thd"><span class="{$sClass}">{$sResultPerm}</span></td>
    <td class="bx-def-padding-thd">{$sAwaitedPerm}</td>
</tr>
EOF;
    }

    protected function _getHtmlPermissionTable($sRows)
    {
        $sDirsC = _t('_adm_admtools_Path');
        $sCurrentLevelC = _t('_adm_admtools_Current_level');
        $sDesiredLevelC = _t('_adm_admtools_Desired_level');

        return <<<EOF
<table width="100%" class="bx-permissions-table">
<thead class="bx-def-border-bottom bx-def-border-top">
    <tr>
        <td class="bx-def-padding-thd bx-def-font-h3">{$sDirsC}</td>
        <td class="bx-def-padding-thd bx-def-font-h3">{$sCurrentLevelC}</td>
        <td class="bx-def-padding-thd bx-def-font-h3">{$sDesiredLevelC}</td>
    </tr>
</thead>
<tbody>
    {$sRows}
</tbody>
</table>
EOF;
    }

    protected function _getFileType($s)
    {
        $sType = BX_DOL_PERM_FILE;
        if (is_dir($this->sRootPath . $s))
            $sType = BX_DOL_PERM_DIR;
        else {
            $sBase = basename($s);
            if (substr($s, -4) === '.exe' || $sBase === 'ffmpeg' || strpos($sBase, 'ffmpeg') === 0)
                $sType = BX_DOL_PERM_EXE;
        }
        return $sType;
    }

    protected function _checkPermissionsModules(&$aMessages)
    {
        $bRet = true;
        $oDbModules = new BxDolModuleDb();
        $aModules = $oDbModules->getModules();
        foreach ($aModules as $a) {
            if (empty($a['path']) || !include(BX_DIRECTORY_PATH_MODULES . $a['path'] . 'install/config.php'))
                continue;
            if (empty($aConfig['install_permissions']) || !is_array($aConfig['install_permissions']['writable']))
                continue;
            foreach ($aConfig['install_permissions']['writable'] as $sPath) {
                $s = basename(BX_DIRECTORY_PATH_MODULES) . '/' . $a['path'] . $sPath;

                $sType = $this->_getFileType($s);

                $isOk = BX_DOL_PERM_EXE ? $this->isExecutable($s) : $this->isWritable($s);

                $aMessages[$s] = array ('res' => $isOk ? BX_DOL_PERM_OK : BX_DOL_PERM_FAIL, 'type' => $sType);

                if (!$isOk && $bRet)
                    $bRet = false;
            }
        }

        return $bRet;
    }
}

/** @} */
