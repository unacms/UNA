<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Artificer Artificer template
 * @ingroup     UnaModules
 *
 * @{
 */


class BxArtificerAlertsResponse extends BxBaseModTemplateAlertsResponse
{
    public function __construct()
    {
        $this->_sModule = 'bx_artificer';

        parent::__construct();
    }

    protected function _processSystemChangeLogo($oAlert)
    {
        $sPrefix = $this->_oModule->_oConfig->getPrefix('option');

        if(!in_array($oAlert->aExtras['option'], ['sys_site_logo', $sPrefix . 'site_logo']))
            return;

        setParam($sPrefix . 'site_logo_aspect_ratio', '');
    }
    
    protected function _processSystemChangeLogoDark($oAlert)
    {
        $sPrefix = $this->_oModule->_oConfig->getPrefix('option');

        if(!in_array($oAlert->aExtras['option'], ['sys_site_logo_dark', $sPrefix . 'site_logo_dark']))
            return;

        setParam($sPrefix . 'site_logo_dark_aspect_ratio', '');
    }

    protected function _processSystemChangeMark($oAlert)
    {
        $sPrefix = $this->_oModule->_oConfig->getPrefix('option');

        if(!in_array($oAlert->aExtras['option'], ['sys_site_mark', $sPrefix . 'site_mark']))
            return;

        setParam($sPrefix . 'site_mark_aspect_ratio', '');
    }

    protected function _processSystemChangeMarkDark($oAlert)
    {
        $sPrefix = $this->_oModule->_oConfig->getPrefix('option');

        if(!in_array($oAlert->aExtras['option'], ['sys_site_mark_dark', $sPrefix . 'site_mark_dark']))
            return;

        setParam($sPrefix . 'site_mark_dark_aspect_ratio', '');
    }

    protected function _processSystemGetObject($oAlert)
    {
        if(!$this->_isActive())
            return;

        if(empty($oAlert->aExtras['type']))
            return;

        switch($oAlert->aExtras['type']) {
            case 'menu':
                if(!($oAlert->aExtras['object'] instanceof BxBaseModGeneralMenuViewActions))
                    break;

                $oAlert->aExtras['object']->setShowAsButton(false);
                break;
        }
    }

    protected function _processSystemGetLayoutImages($oAlert)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sImages = getParam($CNF['PARAM_IMAGES_CUSTOM']);
        if(!$sImages)
            return;
        
        $aImages = preg_split("/\\r\\n|\\r|\\n/", $sImages);
        if(empty($aImages) || !is_array($aImages))
            return;

        foreach($aImages as $sImage) {
            $aImage = explode('=>', $sImage);
            if(empty($aImage))
                continue;

            switch(count($aImage)) {
                case 2:
                    list($sName, $sValue) = $aImage;

                    $aCacheItemKeys = ['v'];
                    $aCacheItemValues = [$sValue];
                    break;

                case 3:
                    list($sName, $sValue, $sType) = $aImage;

                    $aCacheItemKeys = ['v', 't'];
                    $aCacheItemValues = [$sValue, $sType];
                    break;

                case 4:
                    list($sName, $sValue, $sType, $sClass) = $aImage;

                    $aCacheItemKeys = ['v', 't', 'c'];
                    $aCacheItemValues = [$sValue, $sType, $sClass];
                    break;

                default:
                    continue 2;
            }

            $sCacheItemKey = md5(trim($sName));
            if(!isset($oAlert->aExtras['override_result'][$sCacheItemKey]))
                continue;
            
            foreach($aCacheItemValues as $i => $s)
                $aCacheItemValues[$i] = trim($s);

            $aCacheItem = array_combine($aCacheItemKeys, $aCacheItemValues);

            if(isset($aCacheItem['t']) && $aCacheItem['t'] == 'im')
                foreach(['Image', 'Icon'] as $sUrlType) 
                    if(($sUrl = $this->_oModule->_oTemplate->{'get' . $sUrlType . 'Url'}($aCacheItem['v'])) != '')
                        $aCacheItem['v'] = $sUrl;

            $oAlert->aExtras['override_result'][$sCacheItemKey] = array_merge($oAlert->aExtras['override_result'][$sCacheItemKey], $aCacheItem);
        }
    }

    protected function _processSystemSaveSetting($oAlert)
    {
        parent::_processSystemSaveSetting($oAlert);

        $CNF = &$this->_oModule->_oConfig->CNF;

        if($oAlert->aExtras['option'] == $CNF['PARAM_IMAGES_CUSTOM'])
            BxDolTemplate::getInstance()->clearImagesCache($this->_oModule->_oConfig->getUri());
    }

    protected function _processProfileUnit($oAlert)
    {
        if(!$this->_isActive())
            return;

        $sModule = $oAlert->aExtras['module'];
        $oModule = BxDolModule::getInstance($sModule);
        if(!$oModule)
            return;

        $sTemplate = !empty($oAlert->aExtras['template']) && is_array($oAlert->aExtras['template']) ? $oAlert->aExtras['template'][0] : $oAlert->aExtras['template'];
        $sClassSize = $this->_oModule->_oConfig->getThumbSize(isset($oAlert->aExtras['template'][1]) ? $oAlert->aExtras['template'][1] : '', $sTemplate);

        $aTmplVars['class_size'] = $sClassSize;
        $aTmplVars['bx_if:show_thumb_letter']['content']['class_size'] = $sClassSize;
        $aTmplVars['bx_if:show_thumb_image']['content']['class_size'] = $sClassSize;
        
        $aTmplVars['bx_if:show_thumbnail']['content']['class_size'] = $sClassSize;
        $aTmplVars['bx_if:show_thumbnail']['content']['bx_if:show_thumb_letter']['content']['class_size'] = $sClassSize;
        $aTmplVars['bx_if:show_thumbnail']['content']['bx_if:show_thumb_image']['content']['class_size'] = $sClassSize;
    }
}

/** @} */
