<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

// TODO: check if it is used or maybe usefull for future use, also it needs some refactoring

class BxDolCacheUtilities extends BxDol
{
    protected $_aCacheTypes = array();
    protected $_bRevisionBumped = false; ///< 'sys_revision' is bumped at most once per request even when several caches are cleared

    public function __construct ()
    {
        parent::__construct();

        $this->_aCacheTypes = array(
            'content' => array('option' => 'sys_content_cache_enable'),
            'db' => array('option' => 'sys_db_cache_enable'),
            'template' => array('option' => 'sys_template_cache_enable'),
            'less' => array(),
            'css' => array('option' => 'sys_template_cache_css_enable'),
            'js' => array('option' => 'sys_template_cache_js_enable'),
            'purifier' => array(),
            'opcache' => array(),
            'custom' => array(),
        );
    }

	/**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolCacheUtilities();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    function isEnabled($sCache)
    {
        if(!isset($this->_aCacheTypes[$sCache]))
            return false;

        if ('opcache' == $sCache)
            return function_exists('opcache_reset');

        return !isset($this->_aCacheTypes[$sCache]['option']) || getParam($this->_aCacheTypes[$sCache]['option']) == 'on';
    }

    function clear($sCache)
    {
        return $this->_action($sCache, 'clear');
    }

    function size($sCache, $isFormatted = false)
    {
        $iSize = $this->_action($sCache, 'size');
        return $isFormatted ? sprintf("%.2f", $iSize / 1024 / 1024) : $iSize;
    }

    protected function _action($sCache, $sMode = 'clear')
    {
        $mixedResult = false;
        if(!$this->isEnabled($sCache))
            return $mixedResult;

        $bClear = $sMode == 'clear';
        $sAction = $bClear ? '_clear' : '_getSize';

        $oTemplate = BxDolStudioTemplate::getInstance();
        switch ($sCache) {
            case 'content':
                $oCache = bx_content_cache_obj();
                $mixedResult = $this->{$sAction . 'Object'}($oCache, 'content_');
                break;

            case 'db':
                $oCacheDb = BxDolDb::getInstance()->getDbCacheObject();
                $this->{$sAction . 'Object'}($oCacheDb, 'menu_');
                $mixedResult = $this->{$sAction . 'Object'}($oCacheDb, 'db_');
                break;

            case 'template':
                $oCacheTemplates = $oTemplate->getTemplatesCacheObject();
                $mixedResult = $this->{$sAction . 'Object'}($oCacheTemplates, $oTemplate->getCacheFilePrefix($sCache));
                break;

            case 'less':
                $mixedResult = $this->{$sAction . 'File'}($oTemplate->getCacheFilePrefix($sCache), BX_DIRECTORY_PATH_CACHE_PUBLIC);
                break;

            case 'css':
                if($bClear)
                    $this->clear('less');

                $mixedResult = $this->{$sAction . 'File'}($oTemplate->getCacheFilePrefix($sCache), BX_DIRECTORY_PATH_CACHE_PUBLIC);
                if($bClear)
                    $this->_bumpRevision($mixedResult);
                break;

            case 'js':
                $mixedResult = $this->{$sAction . 'File'}($oTemplate->getCacheFilePrefix($sCache), BX_DIRECTORY_PATH_CACHE_PUBLIC);
                if($bClear)
                    $this->_bumpRevision($mixedResult);
                break;

            default:
                $sMethod = $sAction . bx_gen_method_name($sCache);
                if(!method_exists($this, $sMethod))
                    $sMethod = $sAction . 'Unsupported';

                $mixedResult = $this->$sMethod();
                break;
        }

        return $mixedResult;
    }

    /**
     * Compiled CSS/JS bundles are served with a long max-age under file names derived from bx_site_hash(),
     * which includes the 'sys_revision' option. Bumping it after a successful clear gives the regenerated
     * bundles new names, so browsers fetch them instead of reusing stale cached copies.
     */
    protected function _bumpRevision($aResult)
    {
        if($this->_bRevisionBumped || !isset($aResult['code']) || $aResult['code'] != 0)
            return;

        setParam('sys_revision', (int)getParam('sys_revision') + 1);
        $this->_bRevisionBumped = true;
    }

    protected function _clearObject($oCache, $sPrefix)
    {
        if (!$oCache->removeAllByPrefix ($sPrefix))
            return array('code' => 1, 'message' => _t('_adm_dbd_err_c_clean_failed'));
        else
            return array('code' => 0, 'message' => _t('_adm_dbd_msg_c_clean_success'));
    }

    protected function _clearFile($sPrefix, $sPath)
    {
        if (!($rHandler = opendir($sPath)))
            return array('code' => 1, 'message' => _t('_adm_dbd_err_c_clean_failed'));

        $l = strlen($sPrefix);
        while (($sFile = readdir($rHandler)) !== false)
            if (0 === strncmp($sFile, $sPrefix, $l))
                @unlink($sPath . $sFile);

        closedir($rHandler);

        return array('code' => 0, 'message' => _t('_adm_dbd_msg_c_clean_success'));
    }

    protected function _clearPurifier()
    {
        HTMLPurifier_Bootstrap::registerAutoload();
        $oConfig = HTMLPurifier_Config::createDefault();
        $oConfig->set('Cache.DefinitionImpl', null);
        $oHtmlPurifier = new HTMLPurifier($oConfig);
        $oHtmlPurifier->purify('');
        return ['code' => 0, 'message' => _t('_adm_dbd_msg_c_clean_success')];
    }

    protected function _clearOpcache()
    {
        if(function_exists('opcache_reset'))
            opcache_reset();

        return ['code' => 0, 'message' => _t('_adm_dbd_msg_c_clean_success')];
    }

    protected function _clearCustom()
    {
        return ['code' => 0, 'message' => _t('_adm_dbd_msg_c_clean_success')];
    }

    protected function _clearUnsupported()
    {
        return ['code' => 2, 'message' => _t('_adm_dbd_err_c_clean_unsupported')];
    }

    protected function _getSizeObject($oCache, $sPrefix)
    {
        return $oCache->getSizeByPrefix ($sPrefix);
    }

    protected function _getSizeFile($sPrefix, $sPath)
    {
        if (!($rHandler = opendir($sPath)))
            return 0;

        $iSize = 0;
        $l = strlen($sPrefix);
        while (($sFile = readdir($rHandler)) !== false)
            if (0 === strncmp($sFile, $sPrefix, $l))
                $iSize += filesize($sPath . $sFile);

        closedir($rHandler);

        return $iSize;
    }

    protected function _getSizeOpcache()
    {
        if(!function_exists('opcache_get_status'))
            return 0;
        
        $mixedResult = opcache_get_status();
        if(empty($mixedResult) || !is_array($mixedResult))
            return 0;

        return isset($mixedResult['memory_usage'], $mixedResult['memory_usage']['used_memory']) ? $mixedResult['memory_usage']['used_memory'] : 0;
    }

    protected function _getSizeUnsupported()
    {
        return 0;
    }
}

/** @} */
