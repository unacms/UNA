<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolSockets extends BxDolFactory implements iBxDolSingleton
{
    protected $_sHost;
    protected $_sPort;
    protected $_sScheme;
    protected $_sIsEnabled;

    protected function __construct()
    {
        parent::__construct();

        $this->_sIsEnabled = false;

        if(getParam('sys_sockets_type') == 'sys_sockets_disabled')
            return;

        $sUrl = trim(getParam('sys_sockets_url'));
        if(!$sUrl)
            return;

        $a = parse_url($sUrl);
        $this->_sHost = $a['host'] ?? '';
        $this->_sPort = $a['port'] ?? '';
        $this->_sScheme = $a['scheme'] ?? '';

        $this->_sIsEnabled = true;
    }

    static public function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses']['BxDolSockets'])){
            $GLOBALS['bxDolClasses']['BxDolSockets'] = new BxDolSockets();
            if (getParam('sys_sockets_type') == 'sys_sockets_soketi')
                $GLOBALS['bxDolClasses']['BxDolSockets'] = new BxDolSocketsSoketi();
        }
            
        return $GLOBALS['bxDolClasses']['BxDolSockets'];
    }

    public function isEnabled()
    {
        return $this->_sIsEnabled;
    }

    public function sendEvent($sSocket, $iContentId, $sEvent, $sMessage)
    {
        return;
    }

    public function getJsCode()
    {
        return '';
    }

    /**
     * What an app needs to listen to this site's events: the sockets server's scheme, host and
     * port and the app key (never the secret). Null when there is no sockets server.
     */
    public function getClientConfig()
    {
        return null;
    }

    public function writeLog($sString)
    {
        bx_log('sys_sockets', $sString);
    }    
}

/** @} */
