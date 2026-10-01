<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    DataFox Data Fox API integration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDataFoxModule extends BxDolModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function serviceGetActions($aWidget)
    {
        $oInformer = BxDolInformer::getInstance(BxDolStudioTemplate::getInstance());
        $oInformer->add('sys-module-discontinued', _t('_adm_txt_modules_discontinued', BX_DOL_URL_STUDIO . 'module.php?name=bx_datafox', _t('_bx_datafox_adm_stg_cpt_type')), BX_INFORMER_ALERT);

        return bx_srv('system', 'get_actions', [$aWidget], 'TemplStudioModules');
    }

    function serviceIncludeCssJs()
    {
        $this->_oTemplate->addCss('datafox.css');
    }

    function serviceParseText($sHtml)
    {
        if (false === strstr($sHtml, '<a '))
            return $sHtml;
        
        $sId = 'bx-datafox-' . md5(microtime());

        // load html with wrapper
        $dom = new DOMDocument();
        @$dom->loadHTML('<?xml encoding="UTF-8"><div id="' . $sId . '">' . $sHtml . '</div>');
        $xpath = new DOMXpath($dom);

        // grab links, also add special classes
        $aLinks = array();
        $oLinks = $xpath->evaluate('//a');
        for ($i = 0; $i < $oLinks->length; $i++) {
            $oLink = $oLinks->item($i);
            $sIdLink = $sId . '_' . $i;

            $aLinks[$sIdLink] = $oLink->getAttribute('href');

            $sClasses = $oLink->getAttribute('class');
            $sClasses = ($sClasses ? preg_replace('/\s*bx-datafox-[a-zA-Z0-9]+_[0-9]+/', '', $sClasses) . ' ' : '') . $sIdLink;

            $oLink->removeAttribute('class');
            $oLink->setAttribute("class", $sClasses);
        }

        // remove old code with references
        $eCont = $dom->getElementById($sId);
        foreach ($xpath->query('//div[contains(attribute::class, "bx-datafox-companies")]', $eCont) as $e)
            $e->parentNode->removeChild($e);

        // save the result 
        if (false === ($s = $dom->saveHTML($dom->getElementsByTagName('div')->item(0)))) // in case of error return original string
            return $sHtml;

        // strip added tags
        $sHtml = mb_substr($s, 54, -6); 

        // add new code with references
        $aCompanies = $this->apiGetCompanies($aLinks);

        $sHtml .= $this->_oTemplate->parseHtmlByName('companies.html', array(
            'bx_repeat:companies' => $aCompanies,
            'bx_repeat:companies2' => $aCompanies,
        ));

        return $sHtml;
    }

    function apiGetCompanies($aLinks)
    {
        $sAccessToken = $this->apiGetAccessToken();
        $aCompanies = array();
        $iCounter = 0;
        foreach ($aLinks as $sId => &$sHref) {
            if (!($a = $this->apiGetCompanyByUrl($sAccessToken, $sHref, $aCompanies)))
                continue;
            $a['link_id'] = $sId;
            $a['item_number'] = ++$iCounter;
            unset($a['top_keywords']);
            $aCompanies[$a['id']] = $a;
        }
        return array_values($aCompanies);
    }

    function apiGetAccessToken()
    {
        // make request for token
        $sHttpCode = null;
        $s = bx_file_get_contents($this->_oConfig->sApiUrl . 'oauth2/token', array(
            'grant_type' => 'client_credentials',
            'scope' => 'full',
        ), 'post', array(), $sHttpCode, array(
            'user' => getParam('bx_datafox_id'), 
            'password' => getParam('bx_datafox_secret'),
        ));

        if (!$s)
            return false;

        $o = json_decode($s);

        return $o && isset($o->access_token) ? $o->access_token : '';
    }

    function apiGetCompanyByUrl($sAccessToken, $sHref, $aCompanies)
    {
        $sHost = parse_url($sHref, PHP_URL_HOST);
        if (!$sHref)
            return false;

        $a = $this->api($sAccessToken, 'companies', array('url' => $sHost));

        if (!isset($a['total_count']) || !$a['total_count'] && $a['entries'])
            return false;

        $aCompany = array_pop($a['entries']);

        if (isset($aCompanies[$aCompany['id']]))
            return false;

        $aCompanyFull = $this->api($sAccessToken, 'companies/' . $aCompany['id'] . '/details');

        return $aCompanyFull;
    }

    function api($sAccessToken, $sUrlAppend, $aData = array())
    {
        $s = bx_file_get_contents($this->_oConfig->sApiUrl . $sUrlAppend, $aData, 'get', array(
            'Authorization: Bearer ' . $sAccessToken,
        ));

        if (!$s || !($a = json_decode($s, true)) || (isset($a['object_type']) && 'error' == $a['object_type']))
            return false;

        return $a;
    }

}

/** @} */
