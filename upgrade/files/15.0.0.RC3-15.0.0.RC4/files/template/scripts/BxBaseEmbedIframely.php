<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Iframely integration.
 * @see BxDolEmbed
 */
class BxBaseEmbedIframely extends BxDolEmbed
{
    public function __construct ($aObject, $oTemplate)
    {
        $this->_sTableData = 'sys_iframely_data';

        parent::__construct ($aObject, $oTemplate);
    }

    public function getLinkHTML ($sLink, $sTitle = '', $sMaxWidth = '')
    {
        $aAttrs = array(
            'title' => bx_html_attribute($sTitle),
        );

        // check for external link
        if (strncmp(BX_DOL_URL_ROOT, $sLink, strlen(BX_DOL_URL_ROOT)) !== 0) {
            $aAttrs['target'] = '_blank';

            if (getParam('sys_add_nofollow') == 'on')
                $aAttrs['rel'] = 'nofollow';
        }

        return $this->_oTemplate->parseHtmlByName('embed_iframely_link.html', array(
            'link' => $sLink,
            'title' => $sTitle,
            'attrs' => bx_convert_array2attrs($aAttrs),
            'width' => $sMaxWidth,
        ));
    }

    public function addProcessLinkMethod ()
    {
        return "
        <script>
            function bx_embed_link(e)
            {
                window.iframely && iframely.load(e);
            }
        </script>";
    }

    public function addJsCss ()
    {
        if ($this->_bCssJsAdded)
            return '';

        $sKey = getParam('sys_iframely_api_key');
        $this->_bCssJsAdded = true;

        return $this->_oTemplate->parseHtmlByName('embed_iframely_integration.html', array(
            'key' => $sKey,
        ));
    }
    
    public function getApiUrl ($sUrl, $sTheme)
    {
        return 'https://iframe.ly/api/oembed?' . http_build_query([
            'theme' => (string)$sTheme,
            'url' => (string)$sUrl,
            'api_key' => (string)getParam('sys_iframely_api_key'),
            'card' => 'small',
            'media' => '0',
        ], '', '&', PHP_QUERY_RFC3986);
    }

    public function getDataFromApi ($sUrl, $sTheme)
    {
        return bx_file_get_contents($this->getApiUrl($sUrl, $sTheme));
    }
    
    public function getDataHtml ($sUrl, $sTheme)
    {
        $aData = $this->getData($sUrl, $sTheme);
        return $aData['html'];
    }
}

/** @} */
