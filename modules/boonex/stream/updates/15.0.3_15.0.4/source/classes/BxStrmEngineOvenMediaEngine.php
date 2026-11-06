<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stream Stream
 * @ingroup     UnaModules
 *
 * @{
 */

class BxStrmEngineOvenMediaEngine extends BxDol
{
    public function getName()
    {
        return 'OvenMediaEngine';
    }

    public function isSreamFromBrowser()
    {
        return true;
    }

    public function getViewersNum($sStreamKey)
    {
        $a = $this->getStreamStats($sStreamKey);
        if (!$a)
            return false;

        if (isset($a['totalConnections'])) // old API
            return $a['totalConnections'];

        $i = 0;
        foreach ($a['connections'] as $k => $v) {
            $i += $v;
        }
        return $i;
    }

    public function getStreamStats($sStreamKey)
    {
        $sApp = getParam('bx_stream_app');
        if (!$sApp)
            return false;

        return $this->_apiRequest("/stats/current/vhosts/default/apps/{$sApp}/streams/{$sStreamKey}");
    }

    public function startRecording($iRecordingId, $sStreamKey)
    {
        $sApp = getParam('bx_stream_app');
        $sSourceName = getParam('bx_stream_server_ome_recordings_source');
        if (!$sApp)
            return false;

        if (!$sSourceName)
            $sSourceName = $sStreamKey;
        else
            $sSourceName = str_replace('{key}', $sStreamKey, $sSourceName);

        return $this->_apiRequest("/vhosts/default/apps/{$sApp}:startRecord", 'post-json', [
            "id" => "{$iRecordingId}",
            "stream" => [
                "name" => $sSourceName,
            ],
        ]);
    }

    public function stopRecording($iRecordingId)
    {
        $sApp = getParam('bx_stream_app');
        if (!$sApp)
            return false;

        return $this->_apiRequest("/vhosts/default/apps/{$sApp}:stopRecord", 'post-json', [
            "id" => "{$iRecordingId}",
        ]);
    }

    public function getRecordings($iRecordingId)
    {
        $sApp = getParam('bx_stream_app');
        if (!$sApp)
            return false;

        return $this->_apiRequest("/vhosts/default/apps/{$sApp}:records", 'post-json', [
            "id" => "{$iRecordingId}",
        ]);
    }

    public function processRecordings ($iRecordingId, $aContentInfo, $oModule, $iTries = 0)
    {
        $CNF = &$oModule->_oConfig->CNF;
        $bDeleteRecording = false;
        $oStorage = BxDolStorage::getObjectInstance('bx_stream_recordings');

        if ($oStorage) {
            $sRecordingsUrl = getParam('bx_stream_recordings_url');
            $sFileUrl = $sRecordingsUrl . $aContentInfo['key'] . '_' . $iRecordingId . '.ts';
            $sBaseHost = parse_url($sRecordingsUrl, PHP_URL_HOST);
            $sUrlHost = parse_url($sFileUrl, PHP_URL_HOST);

            $oModule->_oDb->updateRecording($iRecordingId, ['status' => 'processing']);

            $iFileId = ($sBaseHost && $sUrlHost && strcasecmp($sBaseHost, $sUrlHost) === 0)
                ? $oStorage->storeFileFromUrl($sFileUrl, true, $aContentInfo[$CNF['FIELD_AUTHOR']], $aContentInfo['id'], true)
                : false;
            if ($iFileId) {
                $bDeleteRecording = true;
            }
            else {
                bx_log('bx_stream', "Store recording from URL(" . $sFileUrl . ") failed for content id({$aContentInfo['id']}): " . $oStorage->getErrorString(), BX_LOG_ERR);
            }
        }
        else {
            bx_log('bx_stream', "Store recording failed because 'bx_stream_recordings' storage doesn't exist", BX_LOG_ERR);
            $bDeleteRecording = true;
        }

        if ($bDeleteRecording || ($iTries + 1) > 10) {
            $oModule->_oDb->deleteRecording($iRecordingId);
        }
        else {
            $oModule->_oDb->updateRecording($iRecordingId, ['tries' => $iTries + 1, 'status' => 'pending']);
        }
    }

    public function getRtmpSettings($sStreamKey)
    {
        $sHost = getParam('bx_stream_server_host');
        $sApp = getParam('bx_stream_app');
        $sPolicySecret = getParam('bx_stream_server_ome_policy_secret');
        
        if (!$sHost || !$sApp)
            return false;

        $sBaseUrl = "rtmp://$sHost:1935/$sApp";
        if (!$sPolicySecret)
            return ['server' => $sBaseUrl, 'key' => $sStreamKey];

        return ['server' => $sBaseUrl, 'key' => str_replace($sBaseUrl . '/', '', $this->_signUrl($sBaseUrl . '/' . $sStreamKey, $sPolicySecret))];
    }

    public function getRtmpIngestUrl($sStreamKey)
    {
        if (!($a = $this->getRtmpSettings($sStreamKey)))
            return false;
        list ($sBaseUrl, $sStreamKey) = $a;
        return $a['server'] . '/' . $a['key'];
        

        $sHost = getParam('bx_stream_server_host');
        $sApp = getParam('bx_stream_app');
        $sPolicySecret = getParam('bx_stream_server_ome_policy_secret');
        
        if (!$sHost || !$sApp)
            return false;

        $sBaseUrl = "rtmp://$sHost:1935/$sApp/$sStreamKey";
        if (!$sPolicySecret)
            return $sBaseUrl;

        return $this->_signUrl($sBaseUrl, $sPolicySecret);
    }

    public function getWebrtcIngestUrl($sStreamKey)
    {
        $sHost = getParam('bx_stream_server_host');
        $sApp = getParam('bx_stream_app');
        $sPolicySecret = getParam('bx_stream_server_ome_policy_secret');

        $sBaseUrl = "wss://$sHost:3334/$sApp/$sStreamKey?direction=send";
        if (!$sPolicySecret)
            return $sBaseUrl;

        return $this->_signUrl($sBaseUrl, $sPolicySecret);
    }

    protected function _signUrl($sBaseUrl, $sPolicySecret)
    {
        $sSignatureQueryKeyName = 'signature';
        $sPolicyQueryKeyName = 'policy';
        $sPolicy = json_encode(['url_expire' => 2556104400000]);//(time() + 50*365*24*60*60)*1000]);

        // 1. Perform base64url() for POLICY (RFC 4648 5.)        
        $sPolicyBase64 = $this->_base64URLEncode($sPolicy);

        // 2. Generates an URL such as "ws://ome_host:3333/app/stream?policy=${POLICY_BASE64}"
        $sPolicyUrl = bx_append_url_params($sBaseUrl, [$sPolicyQueryKeyName => $sPolicyBase64]);

        // 3. Perform sha1(base64url()) for SIGNATURE (RFC 4648 5.)
        $sSha1 = hash_hmac('sha1', $sPolicyUrl, $sPolicySecret, true);
        $sSignature = $this->_base64URLEncode($sSha1);

        // 4. Create the whole URL
        $sWholeUrl = bx_append_url_params($sPolicyUrl, [$sSignatureQueryKeyName => $sSignature]);

        return $sWholeUrl;
    }

    protected function _base64URLEncode($s)
    {
        return trim(strtr(base64_encode($s), '+/', '-_'), '=');
    }

    protected function _apiRequest($sUri, $sMethod = 'get', $aBody = [])
    {
        $sApiProtocol = getParam('bx_stream_server_ome_api_protocol');
        $sHost = getParam('bx_stream_server_host');
        $iApiPort = (int)getParam('bx_stream_server_ome_api_port');
        $sApiKey = getParam('bx_stream_server_ome_api_key');

        if (!$sApiProtocol || !$sHost || !$iApiPort || !$sApiKey)
            return false;

        $sUrl = $sApiProtocol . "://{$sHost}:$iApiPort/v1{$sUri}";
        $sHttpCode = null;
        $s = bx_file_get_contents($sUrl, $aBody, $sMethod, ['Authorization: Basic ' . $sApiKey], $sHttpCode, [], 0, [], true);
        bx_log('bx_stream_ome_api', $sUrl . "\n" . $s, BX_LOG_DEBUG);
        if (!$s)
            return false;

        $a = @json_decode($s, true);
        if (null === $a)
            return false;

        if (!isset($a['response']))
            return false;

        return $a['response'];
    }
}

/** @} */
