<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

if (!defined('BX_DOL_SOCKETS_TIMEOUT'))
    define('BX_DOL_SOCKETS_TIMEOUT', 3); // seconds a request waits for the sockets server to take an event

class BxDolSocketsSoketi extends BxDolSockets
{
    protected $_sKey;

    protected $_sJsClass;
    protected $_sJsObject;

    protected $_oPusher = null;

    protected function __construct()
    {
        parent::__construct();
        
        $this->_sKey = getParam('sys_sockets_key');
        
        $this->_sJsClass = 'BxDolSockets';
        $this->_sJsObject = 'oBxDolSockets';
    }
    
    public function sendEvent($sSocket, $iContentId, $sEvent, $sMessage)
    {
        try {
            $this->getPusher()->trigger($sSocket . '_' . $iContentId, $sEvent, $sMessage);
        }
        catch (Exception $oException) {
            $this->writeLog($oException->getFile() . ':' . $oException->getLine() . ' ' . $oException->getMessage(), BX_LOG_ERR);
            return false;
        }
    }

    /**
     * One client for all events of a request. The request waits while an event is sent, so it
     * waits BX_DOL_SOCKETS_TIMEOUT at most (the library's default is 30 s): a comment or a
     * follow sends two events, and a sockets server that doesn't answer held them for a minute.
     */
    protected function getPusher()
    {
        if ($this->_oPusher === null)
            $this->_oPusher = new Pusher\Pusher($this->_sKey, getParam('sys_sockets_secret'), getParam('sys_sockets_app_id'), [
                'host' => $this->_sHost,
                'port' => $this->_sPort,
                'scheme' => $this->_sScheme,
                'encrypted' => true,
                'useTLS' => false,
                'timeout' => BX_DOL_SOCKETS_TIMEOUT,
            ]);

        return $this->_oPusher;
    }

    public function getJsCode()
    {
        $sMask = "{var} {object} = new {class}({params});";
        $aParams = [
            'sKey' => $this->_sKey,
            'sHost' => $this->_sHost,
            'sPort' => $this->_sPort,
        ];

        return bx_replace_markers($sMask, [
            'var' => 'var',
            'object' => $this->_sJsObject, 
            'class' => $this->_sJsClass,
            'params' => json_encode($aParams)
        ]);
    }
}

/** @} */
