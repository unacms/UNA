<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolIO extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }

    public static function isRealOwner()
    {
    	if(defined('BX_DOL_CRON_EXECUTE'))
    		trigger_error('Function can\'t be called under cron', E_USER_ERROR);

		$sName = time() . rand(0, 999999999);
		$sFilePath = BX_DIRECTORY_PATH_TMP . $sName . '.txt';
		if(!$rHandler = fopen($sFilePath, 'w'))
            return false;

		if(!fwrite($rHandler, $sName))
            return false;

		fclose($rHandler);

		$bResult = fileowner(BX_DIRECTORY_PATH_INC . 'utils.inc.php') === fileowner($sFilePath);
		@unlink($sFilePath);

		return $bResult;
    }

    public static function getFfmpegPath($sRootDir = '')
    {
        if (defined('BX_SYSTEM_FFMPEG') && BX_SYSTEM_FFMPEG)
            return BX_SYSTEM_FFMPEG;

        $bWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $sBundledRel = $bWindows ? 'plugins/ffmpeg/ffmpeg.exe' : 'plugins/ffmpeg/ffmpeg';

        if ($sRootDir === '') {
            if (defined('BX_INSTALL_DIR_ROOT'))
                $sRootDir = BX_INSTALL_DIR_ROOT;
            elseif (defined('BX_DIRECTORY_PATH_ROOT'))
                $sRootDir = BX_DIRECTORY_PATH_ROOT;
            else
                $sRootDir = '';
        }
        $sRoot = $sRootDir === '' ? '' : rtrim($sRootDir, '/\\') . '/';

        $sBundledAbs = $sRoot . $sBundledRel;
        if ($sRoot !== '' && is_file($sBundledAbs) && is_executable($sBundledAbs))
            return $sBundledAbs;

        if (!$bWindows) {
            foreach (array('/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg') as $sCand) {
                if (is_file($sCand) && is_executable($sCand))
                    return $sCand;
            }
            $sWhich = trim((string)@shell_exec('command -v ffmpeg 2>/dev/null'));
            if ($sWhich !== '' && $sWhich[0] === '/' && is_file($sWhich) && is_executable($sWhich))
                return $sWhich;
        }

        return $sRoot !== '' ? $sRoot . $sBundledRel : $sBundledRel;
    }

    public static function isExecutable($sFile)
    {
        clearstatcache();

        $bAbsolute = (isset($sFile[0]) && $sFile[0] === '/') || (strlen($sFile) >= 2 && ctype_alpha($sFile[0]) && $sFile[1] === ':');
        if ($bAbsolute)
            return (is_file($sFile) && is_executable($sFile));

        $aPathInfo = pathinfo(__FILE__);
        $sFile = $aPathInfo['dirname'] . '/../../' . $sFile;

        return (is_file($sFile) && is_executable($sFile));
    }

    public static function isWritable($sFile)
    {
        clearstatcache();

        $aPathInfo = pathinfo(__FILE__);
        $sFile = $aPathInfo['dirname'] . '/../../' . $sFile;

        return is_readable($sFile) && is_writable($sFile);
    }

    public static function getPermissions($sFileName)
    {
        $sPath = isset($GLOBALS['logged']['admin']) && $GLOBALS['logged']['admin'] ? BX_DIRECTORY_PATH_ROOT : '../';

        clearstatcache();
        $hPerms = @fileperms($sPath . $sFileName);
        if($hPerms == false) return false;
        $sRet = substr( decoct( $hPerms ), -3 );
        return $sRet;
    }
}

/** @} */
