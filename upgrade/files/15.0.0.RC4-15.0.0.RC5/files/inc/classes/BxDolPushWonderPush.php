<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolPushWonderPush extends BxDolPush
{
    protected $_sAcessToken;
    protected $_sWebKey;

    protected $_bCodeAdded;

    protected function __construct($aObject, $oTemplate = null, $sDbClassName = '')
    {
        parent::__construct($aObject, $oTemplate, $sDbClassName);

        $this->_sEndpoint = 'https://management-api.wonderpush.com/v1/deliveries';

        $this->_sAppId = getParam('sys_push_wonderpush_app_id');
        $this->_sAcessToken = getParam('sys_push_wonderpush_access_token');
        $this->_sWebKey = getParam('sys_push_wonderpush_web_key');

        $this->_bCodeAdded = false;
    }

    public function getAppId()
    {
        return $this->_sAppId;
    }

    public function send($iProfileId, $aMessage, $bAddToQueue = false)
    {
        if(empty($this->_sAppId) || empty($this->_sAcessToken))
            return false;

        if($bAddToQueue && BxDolQueuePush::getInstance()->add($iProfileId, $aMessage))
            return true;

        // prepare params

        $sUrlWeb = $sUrlApp = !empty($aMessage['url']) ? $aMessage['url'] : '';

        if($this->_sApiUrlRootEmail !== false) {
            if($sUrlWeb)
                $sUrlWeb = str_replace(BX_DOL_URL_ROOT, $this->_sApiUrlRootEmail, $sUrlWeb);

            if(!empty($aMessage['contents']) && is_array($aMessage['contents']))
                foreach($aMessage['contents'] as $sKey => $sValue)
                    $aMessage['contents'][$sKey] = str_replace(BX_DOL_URL_ROOT, $this->_sApiUrlRootEmail, $sValue);
        }

        if($this->_sApiUrlRootPush !== false) {
            if($sUrlApp)
                $sUrlApp = str_replace(BX_DOL_URL_ROOT, $this->_sApiUrlRootPush, $sUrlApp);
        }
        else
            $sUrlApp = $sUrlWeb;
        
        if(empty($aMessage['icon']))
            $aMessage['icon'] = BxTemplFunctions::getInstance()->getMainLogoUrl();

        // construct notification object 

        $aFields = [
            'accessToken' => $this->_sAcessToken,
            'targetUserIds' => encryptUserId($iProfileId),
        ];
        $aNotification = [
            'alert' => [],
        ];
        if (!empty($aMessage['contents'])) {
            $aNotification['alert']['text'] = is_array($aMessage['contents']) ? $aMessage['contents']['en'] : $aMessage['contents'];
        }
        if (!empty($aMessage['headings'])) {
            $aNotification['alert']['title'] = is_array($aMessage['headings']) ? $aMessage['headings']['en'] : $aMessage['headings'];
        }

        if(!empty($aMessage['icon'])){
            $aNotification['alert']['web'] = $aNotification['alert']['web'] ?? [];
            $aNotification['alert']['web']['icon'] = $aMessage['icon'];

            $aNotification['alert']['android'] = $aNotification['alert']['android'] ?? [];
            $aNotification['alert']['android']['largeIcon'] = $aMessage['icon'];

            $aNotification['alert']['ios'] = $aNotification['alert']['ios'] ?? [];
            $aNotification['alert']['ios']['attachments'] = ['url' => $aMessage['icon']];
        }

        if (!empty($sUrlWeb)) {
            $aNotification['alert']['web'] = $aNotification['alert']['web'] ?? [];
            $aNotification['alert']['web']['targetUrl'] = $sUrlWeb;

            $aFields['push'] = $aFields['push'] ?? [];
            $aFields['push']['custom'] = $aFields['push']['custom'] ?? [];
            $aFields['push']['custom']['url'] = $sUrlWeb;
        }
        if (!empty($sUrlApp)) {
            $aNotification['alert']['ios'] = $aNotification['alert']['ios'] ?? [];
            $aNotification['alert']['ios']['targetUrl'] = $sUrlApp;

            $aNotification['alert']['android'] = $aNotification['alert']['android'] ?? [];
            $aNotification['alert']['android']['targetUrl'] = $sUrlApp;
        }

        if('on' == getParam('bx_nexus_option_push_notifications_count')) {
            $iBadgeCount = $this->getNotificationsCount($iProfileId);
            $aNotification['alert']['ios'] = $aNotification['alert']['ios'] ?? [];
            $aNotification['alert']['ios']['badge'] = $iBadgeCount;
        }

        $aFields['notification'] = json_encode($aNotification);

        // send request

        $oChannel = curl_init();
        curl_setopt($oChannel, CURLOPT_URL, $this->_sEndpoint);
        curl_setopt($oChannel, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json; charset=utf-8',
        ]);
        curl_setopt($oChannel, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($oChannel, CURLOPT_HEADER, false);
        curl_setopt($oChannel, CURLOPT_POST, true);
        curl_setopt($oChannel, CURLOPT_POSTFIELDS, json_encode($aFields));
        if (getParam('sys_curl_ssl_allow_untrusted') == 'on')
            curl_setopt($oChannel, CURLOPT_SSL_VERIFYPEER, false);

        $sResult = curl_exec($oChannel);

        $oResult = @json_decode($sResult, true);
        
        // bx_log('sys_push', "Payload:" . $aFields, BX_LOG_DEBUG);
        // bx_log('sys_push', "Result:" . $sResult, BX_LOG_DEBUG);

        if(isset($oResult['error'])) {
            bx_log('sys_push', "Error message:" . $oResult['error']['message'], BX_LOG_ERR);
        }

        return $sResult;
    }
}

/** @} */
