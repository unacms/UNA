<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioJson extends BxDolFactory implements iBxDolSingleton
{
    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct ();
    }

    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolStudioJson();
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function load($sUrl, $aParams = array())
    {
        // replies can carry whole module and update packages
        $sHttpCode = null;
        $sContent = bx_file_get_contents($sUrl, $aParams, 'post', [], $sHttpCode, [], BX_DOL_FILE_TRANSFER_TIMEOUT);
        if(empty($sContent))
            return false;

        //echo $sContent; exit;		//--- Uncomment to debug
        $mixedResult = json_decode($sContent, true);
        if(is_null($mixedResult))
            return false;

        return $mixedResult;
    }
}

/** @} */
