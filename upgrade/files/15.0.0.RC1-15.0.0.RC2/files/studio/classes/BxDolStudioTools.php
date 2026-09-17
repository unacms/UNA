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

    public $aInstallPermissions;
    public $aPostInstallPermissions;

    public function __construct()
    {
        parent::__construct();

        $this->aInstallPermissions = array(
            'inc',
            'cache',
            'cache_public',
            'logs',
            'tmp',
            'storage',
            defined('BX_SYSTEM_FFMPEG') ? bx_ltrim_str(BX_SYSTEM_FFMPEG, BX_DIRECTORY_PATH_ROOT) : 'plugins/ffmpeg/ffmpeg.exe',
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
            if (!$isOk && $bRet)
                $bRet = false;
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

    /**
     * The permission checks as data: each path with whether it passes and its current and desired state as titles.
     */
    public function getPermissionsReport($isShowModules = false)
    {
        $aMessages = array();
        $this->checkPermissions($isShowModules, false, $aMessages);

        $aRows = array();
        foreach ($aMessages as $s => $r)
            $aRows[] = $this->_getPermissionRow($s, $r);
        return $aRows;
    }

    /**
     * One permission check as data: the path, whether it passes, and its current and desired state as titles.
     */
    protected function _getPermissionRow($s, $r)
    {
        $sDesired = BX_DOL_PERM_EXE == $r['type'] ? _t('_adm_admtools_Executable') : _t('_adm_admtools_Writable');
        $sCurrent = $sDesired;
        if (BX_DOL_PERM_FAIL == $r['res']) {
            if (false === $this->getPermissions($s))
                $sCurrent = _t('_adm_admtools_Not_Exists');
            else
                $sCurrent = BX_DOL_PERM_EXE == $r['type'] ? _t('_adm_admtools_Non_Executable') : _t('_adm_admtools_Non_Writable');
        }

        return array('path' => $s, 'ok' => BX_DOL_PERM_OK == $r['res'], 'current' => $sCurrent, 'desired' => $sDesired);
    }

    protected function _getHtmlPermissionRow($s, $r)
    {
        $aRow = $this->_getPermissionRow($s, $r);
        $sClass = $aRow['ok'] ? 'bx-permissions-ok' : 'bx-permissions-wrong';

        return <<<EOF
<tr class="bx-def-color-bg-hl-even">
    <td class="bx-def-padding-thd">{$aRow['path']}</td>
    <td class="bx-def-padding-thd"><span class="{$sClass}">{$aRow['current']}</span></td>
    <td class="bx-def-padding-thd">{$aRow['desired']}</td>
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
        elseif (substr($s, -4) === '.exe')
            $sType = BX_DOL_PERM_EXE;
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
