<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System (default) integration.
 * 
 * @see BxDolEmbed
 */
class BxBaseEmbedSystem extends BxDolEmbed
{
    protected $_sStorage;
    protected $_iProfileId;

    public function __construct ($aObject, $oTemplate)
    {
        $this->_sTableData = 'sys_embeded_data';

        parent::__construct ($aObject, $oTemplate);

        $this->_sStorage = 'sys_images';
        $this->_iProfileId = 0;
    }

    public function getLinkHTML ($sLink, $sTitle = '', $sMaxWidth = '')
    {
        $aData = $this->getData($sLink, '');

        if(bx_is_api()) {
            $aData = $this->_getDataApi($aData);
            if(bx_get('mode') == 'alt')
                return json_encode($aData);

            return $aData;
        }

        $aAttrs = [
            'title' => bx_html_attribute($sTitle),
        ];

        // check for external link
        if(strncmp(BX_DOL_URL_ROOT, $sLink, strlen(BX_DOL_URL_ROOT)) !== 0) {
            $aAttrs['target'] = '_blank';

            if(getParam('sys_add_nofollow') == 'on')
                $aAttrs['rel'] = 'nofollow';
        }

        $sImage = $sLogo = '';
        if(($oStorage = BxDolStorage::getObjectInstance($this->_sStorage)) !== false) {
            if(($iImageId = $aData['image_id'] ?? 0) || (($iImageId = $aData['image'] ?? '') && is_numeric($iImageId)))
                $sImage = $oStorage->getFileUrlById($iImageId);

            if(($iLogoId = $aData['logo_id'] ?? 0) ||  (($iLogoId = $aData['logo'] ?? '') && is_numeric($iLogoId)))
                $sLogo = $oStorage->getFileUrlById($iLogoId);
        }
        $sImage = $sImage ?: ($sLogo ?: $this->_oTemplate->getImageUrl('embed.svg'));

        return $this->_oTemplate->parseHtmlByName('embed_system_link.html', [
            'link' => $aData['url'],
            'attrs' => bx_convert_array2attrs($aAttrs),
            'width' => $sMaxWidth,
            'bx_if:show_image' => [
                'condition' => (bool)$sImage,
                'content' => [
                    'image' => $sImage
                ]
            ],
            'bx_if:show_logo' => [
                'condition' => (bool)$sLogo,
                'content' => [
                    'logo' => $sLogo,
                ]
            ],
            'title' => $aData['title'] ?? '',
            'description' => $aData['description'] ?? '',
            'domain' => $aData['domain'],
        ]);
    }

    public function getDataFromApi ($sUrl, $sTheme)
    {
        $a  = bx_get_site_info($sUrl, [
            'thumbnailUrl' => ['tag' => 'link', 'content_attr' => 'href'],
            'OGImage' => ['name_attr' => 'property', 'name' => 'og:image'],
            'icon' => ['tag' => 'link', 'name_attr' => 'rel', 'name' => 'shortcut icon', 'content_attr' => 'href'],
            'icon2' => ['tag' => 'link', 'name_attr' => 'rel', 'name' => 'icon', 'content_attr' => 'href'],
            'icon3' => ['tag' => 'link', 'name_attr' => 'rel', 'name' => 'apple-touch-icon', 'content_attr' => 'href'],
        ]);

        $a = array_merge($a, [
            'image' => $a['OGImage'] ? $a['OGImage'] : $a['thumbnailUrl'],
            'logo' => $a['icon2'] ? $a['icon2'] : ($a['icon3'] ? $a['icon3'] : $a['icon']),
            'url' => $sUrl,
            'domain' => parse_url($sUrl, PHP_URL_HOST)
        ]);

        unset($a['OGImage'], $a['thumbnailUrl'], $a['icon'], $a['icon2'], $a['icon3']);

        foreach(['image', 'logo'] as $sKey)
            if(!empty($a[$sKey]) && !$this->_isRemoteImageUrl($a[$sKey]))
                $a[$sKey] = '';

        $this->_storeImages($a);

        return json_encode($a);
    }

    public function onGetDataFromApi ($iId)
    {
        if(!$this->_sTableData)
            return;

        $aLocal = $this->_oDb->getLocalInfoById($iId);
        if(!$aLocal || !is_array($aLocal))
            return;

        if(($aData = json_decode($aLocal['data'], true)) && is_array($aData)) {
            $oStorage = BxDolStorage::getObjectInstance($this->_sStorage);
            if($oStorage === false)
                return;

            foreach(['image_id', 'logo_id'] as $sKey)
                if(($iMediaId = $aData[$sKey] ?? false))
                    $oStorage->updateGhostsContentId($iMediaId, $this->_iProfileId, $iId, true);
        }
    }

    /**
     * Data for the apps: `image` and `logo` are addresses an app can load. A picture the site keeps
     * (`image_id`, `logo_id`) is given as its local copy, and the other keys stay as they are.
     */
    protected function _getDataApi ($aData)
    {
        if(!is_array($aData))
            return $aData;

        $oStorage = BxDolStorage::getObjectInstance($this->_sStorage);
        foreach(['image', 'logo'] as $sKey) {
            $sUrl = '';
            if($oStorage && ($iId = (int)($aData[$sKey . '_id'] ?? 0)))
                $sUrl = (string)$oStorage->getFileUrlById($iId);
            if($sUrl === '' && ($sValue = $aData[$sKey] ?? '') && is_string($sValue) && $this->_isRemoteImageUrl($sValue))
                $sUrl = $sValue;

            $aData[$sKey] = $sUrl;
        }

        return $aData;
    }

    /**
     * An http(s) address a picture can be fetched from. A page can name its icon as a data: URI, which
     * becomes the page's address followed by "data:..." once it is resolved against it.
     */
    protected function _isRemoteImageUrl ($sUrl)
    {
        return is_string($sUrl) && preg_match('#^https?://#i', $sUrl) && !preg_match('#data:#i', $sUrl);
    }

    protected function _deleteLocalFiles ($aData)
    {
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorage);
        if($oStorage === false)
            return;

        foreach(['image_id', 'logo_id'] as $sKey)
            if(($iMediaId = (int)($aData[$sKey] ?? 0)))
                $oStorage->deleteFile($iMediaId);
    }

    protected function _storeImages (&$a)
    {
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorage);
        if($oStorage === false)
            return;

        foreach(['image', 'logo'] as $sKey)
            if(($sMediaUrl = $a[$sKey] ?? false) && ($iMediaId = $oStorage->storeFileFromUrl($sMediaUrl, false, $this->_iProfileId))) {
                $a = array_merge($a, [
                    $sKey . '_src' => $a[$sKey],
                    $sKey . '_id' => $iMediaId
                ]);

                unset($a[$sKey]);
            }
    }
}

/** @} */
