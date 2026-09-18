<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolCacheFile extends BxDolCache
{
    protected $sPath;

    /**
     * constructor
     */
    function __construct()
    {
        parent::__construct();
        $this->sPath = BX_DIRECTORY_PATH_CACHE;
    }

    /**
     * Get all data from the cache file.
     *
     * @param  string $sKey - file name
     * @param  int    $iTTL - time to live
     * @return the    data is got from cache.
     */
    function getData($sKey, $iTTL = false)
    {
        if (!file_exists($this->sPath . $sKey))
            return null;

        if ($iTTL > 0 && $this->_removeFileIfTtlExpired ($this->sPath . $sKey, $iTTL))
            return null;

        include($this->sPath . $sKey);
        if (!isset($mixedData))
            return null;

        return $mixedData;
    }

    /**
     * Save all data in cache file.
     *
     * @param  string  $sKey      - file name
     * @param  mixed   $mixedData - the data to be cached in the file
     * @param  int     $iTTL      - time to live
     * @return boolean result of operation.
     */
    function setData($sKey, $mixedData, $iTTL = false)
    {
        $sFileName = $this->sPath . $sKey;
        $sFileNameTmp = $this->sPath . '.' . uniqid('', true) . '.tmp';

        if(file_exists($sFileName) && !is_writable($sFileName))
           return false;

        $content = '<?php $mixedData=' . var_export($mixedData, true) . '; ?>';
        if (false === file_put_contents($sFileNameTmp, $content))
            return false;
        rename($sFileNameTmp, $sFileName);
        @chmod($sFileName, 0666);

        if (function_exists('opcache_invalidate')) opcache_invalidate($sFileName, true);

        return true;
    }

    /**
     * Delete cache file.
     *
     * @param  string $sKey - file name
     * @return result of the operation
     */
    function delData($sKey)
    {
        $sFile = $this->sPath . $sKey;
        return !file_exists($sFile) || $this->_unlinkFile($sFile);
    }

    /**
     * remove all data from cache by key prefix
     * @return true on success
     */
    function removeAllByPrefix ($s)
    {
        if (!($rHandler = opendir($this->sPath)))
            return false;

        $l = strlen($s);
        while (($sFile = readdir($rHandler)) !== false)
            if (0 === strncmp($sFile, $s, $l))
                $this->_unlinkFile($this->sPath . $sFile);

        closedir($rHandler);

        return true;
    }

    /**
     * get size of cached data by name prefix
     */
    function getSizeByPrefix ($s)
    {
        if (!($rHandler = opendir($this->sPath)))
            return false;

        $iSize = 0;
        $l = strlen($s);
        while (($sFile = readdir($rHandler)) !== false)
            if (0 === strncmp($sFile, $s, $l))
                $iSize += @filesize ($this->sPath . $sFile);

        closedir($rHandler);

        return $iSize;
    }

    /**
     * remove file from dist if TTL expored
     * @param  string $sFile - full path to filename
     * @param  int    $iTTL  - time to live in seconds
     * @return true   if TTL is expired and file is deleted or false otherwise
     */
    function _removeFileIfTtlExpired ($sFile, $iTTL)
    {
        $iTimeDiff = time() - filectime($sFile);
        if ($iTimeDiff > $iTTL) {
            $this->_unlinkFile($sFile);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Remove a cache file together with its opcache entry.
     *
     * Cache files are PHP scripts read with include(), so opcache keeps a compiled copy of each of them.
     * It never evicts entries on its own, and once a file is gone opcache_invalidate() can no longer resolve
     * its path, so a file removed with a plain unlink() leaves a dead entry behind for good. With hash-named
     * cache files being regenerated all the time such entries pile up until the cache is full and every
     * script that no longer fits is recompiled on every request. Invalidating before the unlink turns the
     * entry into wasted memory instead, which opcache reclaims with its next restart.
     *
     * @param  string $sFile - full path to the file
     * @return true if the file is deleted, false otherwise
     */
    protected function _unlinkFile ($sFile)
    {
        if (function_exists('opcache_invalidate'))
            opcache_invalidate($sFile, true);

        return @unlink($sFile);
    }
}

/** @} */
