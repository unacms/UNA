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
    protected $sLogoTemplate; // the template module whose own logo settings this page edits, '' for Designer's (every template's)

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
        $this->sParamLogoDark = 'sys_site_logo_dark';
        $this->sParamLogoInline = 'sys_site_logo_inline';
        $this->sParamMark = 'sys_site_mark';
        $this->sParamMarkDark = 'sys_site_mark_dark';
        $this->sParamMarkInline = 'sys_site_mark_inline';
        $this->sParamLogoAlt = 'sys_site_logo_alt';
        $this->sLogoTemplate = '';

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
            case 'delete_logo':
                // Deletes a file: a POST from the logo form only, with its CSRF token (kept, so the form can still be saved).
                $sToken = isset($_POST['csrf_token']) ? bx_process_input($_POST['csrf_token']) : '';
                if(!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] != 'POST' || !BxDolForm::isCsrfTokenValid($sToken, false)) {
                    $aResult = ['code' => 3, 'message' => _t('_sys_txt_form_submission_error_csrf_expired')];
                    break;
                }

                $sValue = bx_process_input(bx_get($this->sParamPrefix . '_value'));

                $aResult = ['code' => 0, 'message' => ''];
                if(empty($sValue) || !isset($this->aLogos[$sValue]['storage']) || empty($this->{$this->aLogos[$sValue]['param']}) || !$this->deleteLogo($sValue))
                    $aResult = ['code' => 2, 'message' => _t('_adm_dsg_err_logo_remove')];
                break;

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

    /**
     * Points the page at a template's own logo options (its config's getLogoParams()). A slot the
     * template doesn't declare is cleared, so the page never edits Designer's site-wide option for it.
     * @param array $aParams option names by slot (logo, logo_dark, logo_inline, mark, mark_dark, mark_inline, logo_alt)
     */
    public function setLogoParams($aParams)
    {
        $aSlots = [
            'logo' => 'sParamLogo',
            'logo_dark' => 'sParamLogoDark',
            'logo_inline' => 'sParamLogoInline',
            'mark' => 'sParamMark',
            'mark_dark' => 'sParamMarkDark',
            'mark_inline' => 'sParamMarkInline',
            'logo_alt' => 'sParamLogoAlt',
        ];

        foreach($aSlots as $sSlot => $sProperty)
            $this->$sProperty = !empty($aParams[$sSlot]) ? $aParams[$sSlot] : '';
    }

    /**
     * Makes the page edit a template's own logo settings rather than Designer's.
     * @param string $sModule the template module name
     */
    public function setLogoTemplate($sModule)
    {
        $this->sLogoTemplate = $sModule;
    }

    /**
     * The template module the logo previews are drawn for: this page's template, or on Designer's page the site's default one.
     * @return array module row, [] if there is none
     */
    protected function getLogoTemplateModule()
    {
        $oModuleQuery = BxDolModuleQuery::getInstance();
        $aModule = !empty($this->sLogoTemplate) ? $oModuleQuery->getModuleByName($this->sLogoTemplate) : $oModuleQuery->getModuleByUri(getParam('template'));

        return !empty($aModule) && is_array($aModule) ? $aModule : [];
    }

    /**
     * The previewed template's logo option names (its config's getLogoParams()), [] when it has no logo settings.
     * @return array
     */
    protected function getLogoTemplateParams()
    {
        if(!($aModule = $this->getLogoTemplateModule()))
            return [];

        $oModule = BxDolModule::getInstance($aModule['name']);
        return $oModule && method_exists($oModule->_oConfig, 'getLogoParams') ? $oModule->_oConfig->getLogoParams() : [];
    }

    /**
     * Whether the previewed template's header draws an image. Templates with a dark logo setting (Artificer) draw all four;
     * the others (Lucid, Ocean, Decorous, Protean) draw the base header, the logo alone, at every size and in both modes.
     */
    protected function isLogoDrawn($sType)
    {
        if($sType == 'logo')
            return true;

        $aParams = $this->getLogoTemplateParams();
        return empty($aParams) || isset($aParams['logo_dark']);
    }

    /**
     * Where the logo images of the previewed template come from, as BxDolDesigns::getLogoSources describes.
     * @return array
     */
    protected function getLogoSources()
    {
        return BxDolDesigns::getLogoSources($this->getLogoTemplateParams(), function($sFile) {
            return $this->getLogoBuiltinUrl($sFile);
        });
    }

    /**
     * The URL of a default logo image as the site finds it: the template's own copy, else the system's in template/images.
     * @return string, '' when there is neither
     */
    protected function getLogoBuiltinUrl($sFile)
    {
        if($this->isLogoBuiltinOwn($sFile)) {
            $aModule = $this->getLogoTemplateModule();
            return BX_DOL_URL_MODULES . $aModule['path'] . 'data/template/system/images/' . $sFile;
        }

        return file_exists(BX_DIRECTORY_PATH_ROOT . 'template/images/' . $sFile) ? BX_DOL_URL_ROOT . 'template/images/' . $sFile : '';
    }

    /**
     * Whether the previewed template ships its own copy of a default logo image.
     */
    protected function isLogoBuiltinOwn($sFile)
    {
        $aModule = $this->getLogoTemplateModule();
        return !empty($aModule) && file_exists(BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'data/template/system/images/' . $sFile);
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
        return $this->getJsResult('_adm_dsg_scs_save', true, true, bx_append_url_params($this->sManageUrl, array('page' => BX_DOL_STUDIO_DSG_TYPE_LOGO)));
    }

    public function deleteLogo($sLogo)
    {
        $iProfileId = getLoggedId();

        $sParamByType = $this->aLogos[$sLogo]['param'];
        $oStorage = BxDolStorage::getObjectInstance($this->aLogos[$sLogo]['storage']);

        // A file that is already gone (removed in the uploader) only needs its setting cleared.
        $iId = (int)getParam($this->$sParamByType);
        if($iId != 0 && $oStorage->getFile($iId) && !$oStorage->deleteFile($iId, $iProfileId))
            return false;

        setParam($this->$sParamByType, 0);

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
        return true;
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
