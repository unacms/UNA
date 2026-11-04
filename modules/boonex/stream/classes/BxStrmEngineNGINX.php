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

class BxStrmEngineNGINX extends BxDol
{
    public function getName()
    {
        return 'NGINX';
    }

    public function isSreamFromBrowser()
    {
        return false;
    }

    public function getViewersNum($sStreamKey)
    {
        $sHost = getParam('bx_stream_server_host');
        $sApp = getParam('bx_stream_app');

        if (!$sHost || !$sApp)
            return false;

        $sTemplate = getParam('bx_stream_server_nginx_stats_url');
        $sUrl = str_replace(
            ['{host}', '{app}', '{key}'],
            [$sHost, $sApp, $sStreamKey],
            $sTemplate
        );
        $sExpectedHost = parse_url(str_replace(['{host}', '{app}', '{key}'], [$sHost, $sApp, ''], $sTemplate), PHP_URL_HOST);
        $sUrlHost = parse_url($sUrl, PHP_URL_HOST);
        if (!$sExpectedHost || !$sUrlHost || strcasecmp($sExpectedHost, $sUrlHost) !== 0)
            return false;

        $sHttpCode = null;
        $s = bx_file_get_contents($sUrl, [], 'get', [], $sHttpCode, [], 0, [], true);
        if (!$s)
            return false;

        $o = @simplexml_load_string ($s);
        if (!$o)
            return false;

        foreach ($o->server->application as $oApp) {
            if ($sApp == $oApp->name && $sStreamKey == $oApp->live->stream->name)
                return (int)$oApp->live->stream->nclients;
        }

        return false;
    }

    public function getRtmpSettings($sStreamKey)
    {
        $sHost = getParam('bx_stream_server_host');
        $sApp = getParam('bx_stream_app');
        
        if (!$sHost || !$sApp)
            return false;

        $sBaseUrl = "rtmp://$sHost:1935/$sApp";
        $sParams = '';
        if (getParam('bx_stream_server_nginx_auth'))
            $sParams = '?s=' . base_convert(substr(md5(BX_DOL_SECRET . $sStreamKey), -4), 16, 36);
        return ['server' => $sBaseUrl, 'key' => $sStreamKey . $sParams];
    }

    public function getRtmpIngestUrl($sStreamKey)
    {
        if (!($a = $this->getRtmpSettings($sStreamKey)))
            return false;
        list ($sBaseUrl, $sStreamKey) = $a;
        return $a['server'] . '/' . $a['key'];
    }

    public function getWebrtcIngestUrl($sStreamKey)
    {
        return false;
    }
}

/** @} */
