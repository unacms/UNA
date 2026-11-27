<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolPushOneSignal extends BxDolPush
{
    protected $_sRestApi;

    protected $_sShortName;
    protected $_sSafariWebId;

    protected $_bCodeAdded;

    protected function __construct($aObject, $oTemplate = null, $sDbClassName = '')
    {
        parent::__construct($aObject, $oTemplate, $sDbClassName);

        $this->_sEndpoint = 'https://onesignal.com/api/v1/notifications';

        $this->_sAppId = getParam('sys_push_onesignal_app_id');
        $this->_sRestApi = getParam('sys_push_onesignal_rest_api');

        $this->_sShortName = getParam('sys_push_onesignal_short_name');
        $this->_sSafariWebId = getParam('sys_push_onesignal_safari_id');

        $this->_bCodeAdded = false;
    }

    public function getAppId()
    {
        return $this->_sAppId;
    }

    public function send($iProfileId, $aMessage, $bAddToQueue = false)
    {
        if(empty($this->_sAppId) || empty($this->_sRestApi))
            return false;

        if($bAddToQueue && BxDolQueuePush::getInstance()->add($iProfileId, $aMessage))
            return true;

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

        $aFilters = [
            ['field' => 'tag', 'key' => 'user_hash', 'relation' => '=', 'value' => encryptUserId($iProfileId)]
        ];
        $aContents = !empty($aMessage['contents']) && is_array($aMessage['contents']) ? $aMessage['contents'] : [];
        $aHeadings = !empty($aMessage['headings']) && is_array($aMessage['headings']) ? $aMessage['headings'] : [];

        $sIcon = !empty($aMessage['icon']) ? $aMessage['icon'] : BxTemplFunctions::getInstance()->getMainLogoUrl();

        $bResult = null;
        /**
         * @hooks
         * @hookdef hook-system-check_send_push 'system', 'check_send_push' - hook for disabling push sending 
         * - $unit_name - equals `system`
         * - $action - equals `check_send_push` 
         * - $object_id - recipient profile id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `name` - [string] push notification processor
         *      - `app_id` - [string] App ID 
         *      - `filters` - [array] filters list
         *      - `contents` - [array] contents
         *      - `headings` - [array] headings list
         *      - `web_url` - [string] URL for WEB
         *      - `app_url` - [string] URL for APP
         *      - `icon` - [string] icon URL
         *      - `override_result` - [boolean] override result of `send` function, if the result isn't null sending will stop
         * @hook @ref hook-system-check_send_push
         */
        bx_alert('system', 'check_send_push', $iProfileId, '', [
            'name' => 'onesignal',
            'app_id' => $this->_sAppId,
            'filters' => $aFilters,
            'contents' => $aContents,
            'headings' => $aHeadings,
            'web_url' => $sUrlWeb,
            'app_url' => $sUrlApp,
            'icon' => $sIcon,
            'override_result' => &$bResult,
        ]);

        if($bResult !== null)
            return $bResult;

        $aFields = [
            'app_id' => $this->_sAppId,
            'filters' => $aFilters,
            'contents' => $aContents,
            'headings' => $aHeadings,
            'web_url' => $sUrlWeb,
            'app_url' => $sUrlApp,
            'data' => [
                'url' => $sUrlWeb
            ]
        ];

        if($sIcon)
            $aFields = array_merge($aFields, [
                'chrome_web_icon' => $sIcon,
                'large_icon' => $sIcon,
                'ios_attachments' => [
                    'id' => $sIcon
                ]
            ]);

        if('on' == getParam('bx_nexus_option_push_notifications_count')) {
            $aFields['ios_badgeType'] = 'SetTo';
            $aFields['ios_badgeCount'] = $this->getNotificationsCount($iProfileId);
        }

        $oChannel = curl_init();
        curl_setopt($oChannel, CURLOPT_URL, $this->_sEndpoint);
        curl_setopt($oChannel, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json; charset=utf-8',
            'Authorization: Basic ' . $this->_sRestApi
        ]);
        curl_setopt($oChannel, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($oChannel, CURLOPT_HEADER, false);
        curl_setopt($oChannel, CURLOPT_POST, true);
        curl_setopt($oChannel, CURLOPT_POSTFIELDS, json_encode($aFields));
        if (getParam('sys_curl_ssl_allow_untrusted') == 'on')
            curl_setopt($oChannel, CURLOPT_SSL_VERIFYPEER, false);

        $sResult = curl_exec($oChannel);

        $oResult = @json_decode($sResult, true);
        if(isset($oResult['errors']))
            foreach($oResult['errors'] as $sError) {  
                bx_log('sys_push', $sError . " Message:" . json_encode($aMessage), BX_LOG_ERR);
            }

        return $sResult;
    }
}

/** @} */
