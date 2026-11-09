<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Microlink integration.
 * 
 * @see BxDolEmbed
 */
class BxBaseEmbedMicrolink extends BxTemplEmbedSystem
{
    protected $_sEndpoint;
    protected $_sEndpointPro;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_bAsync = true;

        $this->_sEndpoint = "https://api.microlink.io/?url=";
        $this->_sEndpointPro = "https://pro.microlink.io/?url=";
    }

    public function getApiUrl ($sUrl, $bPro = false)
    {
        return ($bPro ? $this->_sEndpointPro : $this->_sEndpoint) . rawurlencode((string)$sUrl);
    }

    public function getDataFromApi ($sUrl, $sTheme)
    {
        $sResponse = '';
        if(($sApiKey = getParam('sys_embed_microlink_key')) != '')
            $sResponse = bx_file_get_contents($this->getApiUrl($sUrl, true), [], 'get', ['x-api-key: ' . $sApiKey]);
        else
            $sResponse = bx_file_get_contents($this->getApiUrl($sUrl));

        $aResponse = [];
        if(!$sResponse || !($aResponse = json_decode($sResponse, true)) || empty($aResponse['data']) || !is_array($aResponse['data']))
            return '';

        $aResult = [
            'title' => $aResponse['data']['title'],
            'description' => $aResponse['data']['description'],
            'image' => $aResponse['data']['image']['url'],
            'logo' => $aResponse['data']['logo']['url'],
            'url' => $sUrl,
            'domain' => parse_url($sUrl, PHP_URL_HOST)
        ];

        $this->_storeImages($aResult);

        return json_encode($aResult);
    }
}

/** @} */
