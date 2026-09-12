<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_DSG_TYPE_GENERAL', 'general');
define('BX_DOL_STUDIO_DSG_TYPE_LOGO', 'logo');
define('BX_DOL_STUDIO_DSG_TYPE_ICON', 'icon');
define('BX_DOL_STUDIO_DSG_TYPE_COVER', 'cover');
define('BX_DOL_STUDIO_DSG_TYPE_SPLASH', 'splash');
define('BX_DOL_STUDIO_DSG_TYPE_INJECTIONS', 'injections');
define('BX_DOL_STUDIO_DSG_TYPE_PWA', 'pwa');
define('BX_DOL_STUDIO_DSG_TYPE_SETTINGS', 'settings');

define('BX_DOL_STUDIO_DSG_TYPE_DEFAULT', 'general');

class BxDolStudioDesigner extends BxTemplStudioWidget
{
    protected $sPage;

    protected $sManageUrl;
    protected $sParamPrefix;

    protected $sParamLogo;
    protected $sParamLogoDark;
    protected $sParamLogoInline;
    protected $sParamMark;
    protected $sParamMarkDark;
    protected $sParamMarkInline;
    protected $sParamLogoAlt;

    protected $aLogos;
    protected $aIcons;
    protected $aCovers;

    function __construct($sPage = "")
    {
        parent::__construct('designer');

        $this->oDb = new BxDolStudioDesignerQuery();

        $this->sPage = BX_DOL_STUDIO_DSG_TYPE_DEFAULT;
        if(is_string($sPage) && !empty($sPage))
            $this->sPage = $sPage;

        $this->sManageUrl = BX_DOL_URL_STUDIO . 'designer.php';
        $this->sParamPrefix = 'dsg';

        $this->sParamLogo = 'sys_site_logo';
        $this->sParamLogoDark = '';
        $this->sParamLogoInline = '';
        $this->sParamMark = '';
        $this->sParamMarkDark = '';
        $this->sParamMarkInline = '';
        $this->sParamLogoAlt = 'sys_site_logo_alt';

        $this->aLogos = [
            'logo' => [
                'param' => 'sParamLogo',
                'storage' => 'sys_images_custom',
                'transcoder' => 'sys_custom_images'
            ],
            'logo_dark' => [
                'param' => 'sParamLogoDark',
                'storage' => 'sys_images_custom',
                'transcoder' => 'sys_custom_images'
            ],
            'logo_inline' => [
                'param' => 'sParamLogoInline',
            ],
            'mark' => [
                'param' => 'sParamMark',
                'storage' => 'sys_images_custom',
                'transcoder' => 'sys_custom_images'
            ],
            'mark_dark' => [
                'param' => 'sParamMarkDark',
                'storage' => 'sys_images_custom',
                'transcoder' => 'sys_custom_images'
            ],
            'mark_inline' => [
                'param' => 'sParamMarkInline',
            ],
        ];

        $this->aIcons = [
            'icon' => [
                'storage' => BX_DOL_STORAGE_OBJ_FILES
            ],
            'icon_svg' => [
                'storage' => BX_DOL_STORAGE_OBJ_IMAGES
            ],
            'icon_apple' => [
                'storage' => BX_DOL_STORAGE_OBJ_IMAGES,
                'transcoder' => BX_DOL_TRANSCODER_OBJ_ICON_APPLE
            ],
            'icon_android' => [
                'storage' => BX_DOL_STORAGE_OBJ_IMAGES,
                'transcoder' => BX_DOL_TRANSCODER_OBJ_ICON_ANDROID
            ],
            'icon_android_splash' => [
                'storage' => BX_DOL_STORAGE_OBJ_IMAGES,
                'transcoder' => BX_DOL_TRANSCODER_OBJ_ICON_ANDROID_SPLASH
            ]
        ];

        $this->aCovers = array(
            'cover_common' => array(
                'setting' => 'sys_site_cover_common',
                'transcoder' => BX_DOL_TRANSCODER_OBJ_COVER,
                'title' => '_adm_dsg_txt_cover_common', 
                'template' => 'dsr_cover_preview_page.html'
            ),
            'cover_share' => array(
                'setting' => 'sys_site_share_image',
                'transcoder' => 'sys_share_image',
                'title' => '_adm_dsg_txt_cover_share',
                'template' => 'dsr_cover_preview_share.html'
            ),
            'cover_unit_profile' => array(
                'setting' => 'sys_unit_cover_profile',
                'transcoder' => BX_DOL_TRANSCODER_OBJ_COVER_UNIT_PROFILE,
                'title' => '_adm_dsg_txt_cover_unit_profile',
                'template' => 'dsr_cover_preview_unit_profile.html'
            )
        );
    }

    function checkAction()
    {
    	$sAction = bx_get($this->sParamPrefix . '_action');
    	if($sAction === false)
            return false;

    	$sAction = bx_process_input($sAction);

        $aResult = array('code' => 1, 'message' => _t('_adm_dsg_err_cannot_process_action'));
        switch($sAction) {
            case 'delete_icon':
                $sValue = bx_process_input(bx_get($this->sParamPrefix . '_value'));

                $aResult = ['code' => 0, 'message' => ''];
                if(empty($sValue) || !$this->deleteIcon($sValue))
                    $aResult = ['code' => 2, 'message' => _t('_adm_dsg_err_remove_old_icon')];
                break;

            case 'delete_cover':
                $sValue = bx_process_input(bx_get($this->sParamPrefix . '_value'));

                $aResult = array('code' => 0, 'message' => '');
                if(empty($sValue) || !$this->deleteCover($sValue))
                    $aResult = array('code' => 2, 'message' => _t('_adm_dsg_err_remove_old_cover'));
                break;

            case 'make_default':
                $aResult = array('code' => 0, 'message' => '');
                if(!$this->makeDefault())
                    $aResult = array('code' => 2, 'message' => _t('_adm_dsg_err_make_default'));
                break;

            case 'get-page-by-type':
                $sValue = bx_process_input(bx_get($this->sParamPrefix . '_value'));
                if(empty($sValue))
                    break;

                $this->sPage = $sValue;
                $aResult = array('code' => 0, 'content' => $this->getPageCode());
                break;
        }

        return $aResult;
    }

    function setManageUrl($sUrl)
    {
        $this->sManageUrl = $sUrl;
    }

    function setParamPrefix($sPrefix)
    {
        $this->sParamPrefix = $sPrefix;
    }

    function setLogoParams($aParams)
    {
        switch(count($aParams)) {
            case 2:
                list($this->sParamLogo, $this->sParamLogoAlt) = $aParams;
                break;

            case 3:
                list($this->sParamLogo, $this->sParamMark, $this->sParamLogoAlt) = array_values($aParams);
                break;

            case 7:
                list(
                    $this->sParamLogo, 
                    $this->sParamLogoDark, 
                    $this->sParamLogoInline, 
                    $this->sParamMark, 
                    $this->sParamMarkDark, 
                    $this->sParamMarkInline, 
                    $this->sParamLogoAlt
                ) = array_values($aParams);
                break;
        }
    }

    function makeDefault()
    {
        $sValue = bx_get($this->sParamPrefix . '_value');
        if($sValue === false)
            return false;

        $sValue = bx_process_input($sValue);
        return setParam('template', $sValue);
    }

    public function submitLogo(&$oForm)
    {
        $iProfileId = bx_get_logged_profile_id();

        foreach($this->aLogos as $sLogo => $aLogo) {
            if(empty($this->{$aLogo['param']}))
                continue;

            $mixedValue = $mixedValuePrior = false;
            if(isset($aLogo['storage'])) {
                $bValue = bx_get($sLogo) !== false;
                $bFile = isset($_FILES[$sLogo]) && !empty($_FILES[$sLogo]['tmp_name']);

                if(!$bValue && !$bFile)
                    continue;

                $oStorage = BxDolStorage::getObjectInstance($aLogo['storage']);

                $iId = 0;
                if($bValue)
                    $iId = (int)bx_get($sLogo);
                else if($bFile) {
                    $iId = $oStorage->storeFileFromForm($_FILES[$sLogo], true, $iProfileId);
                    if($iId === false)
                        continue;
                }

                $mixedValue = $iId;
                $mixedValuePrior = (int)getParam($this->{$aLogo['param']});
                if($mixedValue != 0 && $mixedValue != $mixedValuePrior)
                    $this->deleteLogo($sLogo);
            }
            else {
                $mixedValue = $oForm->getCleanValue($sLogo);
                $mixedValuePrior = getParam($this->{$aLogo['param']});
            }

            setParam($this->{$aLogo['param']}, $mixedValue);

            bx_alert('system', 'change_' . $sLogo, 0, 0, [
                'option' => $aLogo['param'], 
                'value' => $mixedValue,
                'value_prior' => $mixedValuePrior
            ]);
        }

        setParam($this->sParamLogoAlt, $oForm->getCleanValue('alt'));
        $this->touchShareCards();

        return $this->getJsResult('_adm_dsg_scs_save', true, true, bx_append_url_params($this->sManageUrl, array('page' => BX_DOL_STUDIO_DSG_TYPE_LOGO)));
    }

    public function deleteLogo($sLogo)
    {
        $iProfileId = getLoggedId();

        $sParamByType = $this->aLogos[$sLogo]['param'];
        $oStorage = BxDolStorage::getObjectInstance($this->aLogos[$sLogo]['storage']);

        $iId = (int)getParam($this->$sParamByType);
        if($iId != 0 && !$oStorage->deleteFile($iId, $iProfileId))
            return false;

        setParam($this->$sParamByType, 0);
        $this->touchShareCards();

        bx_alert('system', 'change_' . $sLogo, 0, 0, [
            'option' => $this->$sParamByType, 
            'value' => 0,
            'value_prior' => $iId
        ]);

        return true;
    }

    function submitIcon(&$oForm)
    {
        $iProfileId = bx_get_logged_profile_id();

        foreach($this->aIcons as $sIcon => $aIcon) {
            $bValue = bx_get($sIcon) !== false;
            $bFile = isset($_FILES[$sIcon]) && !empty($_FILES[$sIcon]['tmp_name']);

            if(!$bValue && !$bFile)
                continue;

            $sSetting = 'sys_site_' . $sIcon;
            $oStorage = BxDolStorage::getObjectInstance($aIcon['storage']);

            if(($bValue || $bFile) && (int)getParam($sSetting) != 0)
                $this->deleteIcon($sIcon);

            $iId = 0;
            if($bValue)
                $iId = (int)bx_get($sIcon);
            else if($bFile) {
                $iId = $oStorage->storeFileFromForm($_FILES[$sIcon], false, $iProfileId);
                if($iId === false)
                    continue;
            }

            $oStorage->afterUploadCleanup($iId, $iProfileId);
            setParam($sSetting, $iId);
        }

        return $this->getJsResult('_adm_dsg_scs_save', true, true, BX_DOL_URL_STUDIO . 'designer.php?page=' . BX_DOL_STUDIO_DSG_TYPE_ICON);
    }

    function deleteIcon($sIcon)
    {
        $iProfile = bx_get_logged_profile_id();

        $sSetting = 'sys_site_' . $sIcon;
        $oStorage = BxDolStorage::getObjectInstance($this->aIcons[$sIcon]['storage']);

        $iId = (int)getParam($sSetting);
        if($iId != 0 && !$oStorage->deleteFile($iId, $iProfile) && $oStorage->getErrorCode() != BX_DOL_STORAGE_ERR_FILE_NOT_FOUND)
            return false;

        setParam($sSetting, 0);
        return true;
    }

    function submitCover(&$oForm)
    {
        $iProfile = bx_get_logged_profile_id();
        $oStorage = BxDolStorage::getObjectInstance($this->sCoverStorage);

        foreach($this->aCovers as $sCover => $aCover) {
            $iIdNew = $oForm->getCleanValue($sCover);
            if(empty($iIdNew))
                continue;

            $iIdOld = (int)getParam($aCover['setting']);
            if(!$this->deleteCover($sCover))
                    return $this->getJsResult('_adm_dsg_err_remove_old_cover');

            setParam($aCover['setting'], $iIdNew);
            $oStorage->afterUploadCleanup($iIdNew, $iProfile);
        }

        setParam('sys_site_cover_disabled', $oForm->getCleanValue('disabled') == 'on' ? 'on' : '');
        $this->touchShareCards();

        return $this->getJsResult('_adm_dsg_scs_save', true, true, BX_DOL_URL_STUDIO . 'designer.php?page=' . BX_DOL_STUDIO_DSG_TYPE_COVER);
    }

    function deleteCover($sCover)
    {
        $iProfile = bx_get_logged_profile_id();
        $oStorage = BxDolStorage::getObjectInstance($this->sCoverStorage);

        $iId = (int)getParam($this->aCovers[$sCover]['setting']);
        if($iId != 0 && !$oStorage->deleteFile($iId, $iProfile) && $oStorage->getErrorCode() != BX_DOL_STORAGE_ERR_FILE_NOT_FOUND)
            return false;

        setParam($this->aCovers[$sCover]['setting'], 0);
        $this->touchShareCards();

        return true;
    }

    /**
     * Every share card is drawn from the site logo, the site cover and the share card background, and every
     * generated card is cached by a hash which includes this timestamp. Without bumping it a re-uploaded
     * picture would leave every already generated card in place and the site would keep sharing the old one.
     */
    protected function touchShareCards()
    {
        setParam('sys_share_card_ts', time());
    }

    function submitSplash(&$oForm)
    {
    	setParam('sys_site_splash_code', $oForm->getCleanValue('code'));
        setParam('sys_site_splash_enabled', $oForm->getCleanValue('enabled') == 'on' ? 'on' : '');

        return $this->getJsResult('_adm_dsg_scs_save', true, true, BX_DOL_URL_STUDIO . 'designer.php?page=' . BX_DOL_STUDIO_DSG_TYPE_SPLASH);
    }

    function submitInjections(&$oForm)
    {
        $sResult = '_adm_dsg_err_save_changes';

        $bResult = $this->oDb->updateInjection('sys_head', $oForm->getCleanValue('sys_head'));
        $bResult |= $this->oDb->updateInjection('sys_body', $oForm->getCleanValue('sys_body'));
        if($bResult) {
            if(getParam('sys_db_cache_enable'))
                $this->oDb->cleanCache('sys_injections.inc');

            $sResult = '_adm_dsg_scs_save';
        }

        return $this->getJsResult($sResult, true, true, BX_DOL_URL_STUDIO . 'designer.php?page=' . BX_DOL_STUDIO_DSG_TYPE_INJECTIONS);
    }
}

/** @} */
