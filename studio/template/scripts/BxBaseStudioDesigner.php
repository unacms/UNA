<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioDesigner extends BxDolStudioDesigner
{
    protected $oDbSettings;

    protected $sLogoFormId = 'adm-dsg-logo-form';
    protected $sLogoIframeId = 'adm-dsg-logo-iframe';

    protected $sIconFormId = 'adm-dsg-icon-form';
    protected $sIconIframeId = 'adm-dsg-icon-iframe';

    protected $sCoverFormId = 'adm-dsg-cover-form';
    protected $sCoverIframeId = 'adm-dsg-cover-iframe';
    protected $sCoverStorage = BX_DOL_STORAGE_OBJ_IMAGES;
    protected $sCoverTranscoder = 'sys_cover_preview';

    protected $sSplashFormId = 'adm-dsg-splash-form';
    protected $sSplashIframeId = 'adm-dsg-splash-iframe';
    protected $sSplashEditorId = 'adm-dsg-splash-editor';

    protected $sInjectionsFormId = 'adm-dsg-injections-form';
    protected $sInjectionsIframeId = 'adm-dsg-injections-iframe';
    protected $sInjectionsEditorId = 'adm-dsg-injections-editor';

    public function __construct($sPage = '')
    {
        parent::__construct($sPage);

        $this->aPageCss = array_merge($this->aPageCss, ['forms.css', 'designer.css']);
        $this->aPageJs = array_merge($this->aPageJs, ['designer.js']);
        $this->sPageJsClass = 'BxDolStudioDesigner';
        $this->sPageJsObject = 'oBxDolStudioDesigner';

        $this->oDbSettings = new BxDolStudioSettingsQuery();
    }

    public function getPageJsCode($aOptions = array(), $bWrap = true)
    {
    	$aOptions = array_merge([
            'sActionUrl' => $this->sManageUrl,
            'sParamPrefix' => $this->sParamPrefix
    	], $aOptions);

    	return parent::getPageJsCode($aOptions, $bWrap);
    }

    public function getPageMenu($aMenu = [], $aMarkers = [])
    {
        $sJsObject = $this->getPageJsObject();

        $aMenu = [];
        $aMenuItems = [
            BX_DOL_STUDIO_DSG_TYPE_GENERAL => ['icon' => 'mi-dsg-general.svg'],
            BX_DOL_STUDIO_DSG_TYPE_LOGO => ['icon' => 'mi-dsg-logo.svg'],
            BX_DOL_STUDIO_DSG_TYPE_ICON => ['icon' => 'mi-dsg-icon.svg'],
            BX_DOL_STUDIO_DSG_TYPE_COVER => ['icon' => 'mi-dsg-cover.svg'],
            BX_DOL_STUDIO_DSG_TYPE_SPLASH => ['icon' => 'mi-dsg-splash.svg'],
            BX_DOL_STUDIO_DSG_TYPE_INJECTIONS => ['icon' => 'mi-dsg-injections.svg'],
            BX_DOL_STUDIO_DSG_TYPE_PWA => ['icon' => 'mi-dsg-pwa.svg'],
            BX_DOL_STUDIO_DSG_TYPE_SETTINGS => ['icon' => 'mi-dsg-settings.svg'],
        ];
        foreach($aMenuItems as $sMenuItem => $aItem)
            $aMenu[] = [
                'name' => $sMenuItem,
                'icon' => $aItem['icon'],
                'icon_bg' => true,
                'link' => BX_DOL_URL_STUDIO . 'designer.php?page=' . $sMenuItem,
                'title' => _t('_adm_lmi_cpt_' . $sMenuItem),
                'selected' => $sMenuItem == $this->sPage
            ];

        return parent::getPageMenu($aMenu);
    }

    protected function getGeneral()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sResult = '';

        $sTemplate = getParam('template');
        $aTemplates = get_templates_array(true, false);

        $aTmplVarsTemplates = array ();
        foreach($aTemplates as $sUri => $aTemplate) {
        	$sIcon = $this->getModuleIcon($aTemplate, 'store');
	        $bIcon = strpos($sIcon, '.') === false && strcmp(substr($sIcon, 0, 10), 'data:image') != 0;

            $aTmplVarsTemplates[] = array(
                'uri' => $sUri,
                'title' => htmlspecialchars_adv($aTemplate['title']),
                'version' => htmlspecialchars_adv($aTemplate['version']),
                'vendor' => htmlspecialchars_adv($aTemplate['vendor']),
            	'bx_if:icon' => array (
	                'condition' => $bIcon,
	                'content' => array('icon' => $sIcon),
	            ),
                'bx_if:image' => array (
	                'condition' => !$bIcon,
	                'content' => array('icon_url' => $sIcon),
	            ),
                'bx_if:default' => array (
                    'condition' => $sUri == $sTemplate,
                    'content' => array (),
                ),
                'bx_if:make_default' => array (
                    'condition' => $sUri != $sTemplate,
                    'content' => array(
                        'js_object' => $sJsObject,
                        'uri' => $sUri
                    ),
                )
            );
        }

        $sContent  = $sResult ? MsgBox($sResult, 10) : '';
        $sContent .= $oTemplate->parseHtmlByName('templates.html', array(
            'bx_repeat:templates' => $aTmplVarsTemplates,
        ));

        return $oTemplate->parseHtmlByName('designer.html', array(
            'content' => $sContent,
            'js_content' => $this->getPageJsCode()
        ));
    }

    protected function getLogo()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aForm = array(
            'form_attrs' => [
                'id' => $this->sLogoFormId,
                'name' => $this->sLogoFormId,
                'action' => $this->sManageUrl,
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sLogoIframeId
            ],
            'params' => [
                'db' => [
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'save'
                ],
            ],
            'inputs' => [
                'page' => [
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $this->sPage
                ],
                'alt' => [
                    'type' => 'text',
                    'name' => 'alt',
                    'caption' => _t('_adm_dsg_txt_alt_text'),
                    'info' => _t('_adm_dsg_dsc_alt_text'),
                    'value' => getParam($this->sParamLogoAlt),
                    'checker' => [
                        'func' => '',
                        'params' => [],
                        'error' => ''
                    ],
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'save' => [
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_adm_btn_designer_submit'),
                ]
            ]
        );

        $aInputs = [];
        foreach($this->aLogos as $sLogo => $aLogo) {
            if(empty($this->{$aLogo['param']}))
                continue;

            if(isset($aLogo['storage'], $aLogo['transcoder']))
                $aInputs[$sLogo] = [
                    'type' => 'files',
                    'name' => $sLogo,
                    'storage_object' => $aLogo['storage'],
                    'storage_private' => 0,
                    'images_transcoder' => $aLogo['transcoder'],
                    'uploaders' => ['sys_html5'],
                    'multiple' => false,
                    'content_id' => $this->getOptionId($this->{$aLogo['param']}),
                    'ghost_template' => BxTemplStudioFunctions::getInstance()->getDefaultGhostTemplate($sLogo),
                    'caption' => _t('_adm_dsg_txt_upload_' . $sLogo),
                ];
            else
                $aInputs[$sLogo] = [
                    'type' => 'textarea',
                    'name' => $sLogo,
                    'caption' => _t('_adm_dsg_txt_upload_' . $sLogo),
                    'value' => getParam($this->{$aLogo['param']}),
                    'code' => 1,
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ];
        }

        $aForm['inputs'] = bx_array_insert_after($aInputs, $aForm['inputs'], 'page');

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitLogo($oForm);
            exit;
        }

        return MsgBox(_t('_adm_dsg_txt_logo_redefinition')) . $oTemplate->parseHtmlByName('designer.html', array(
            'content' => $oTemplate->parseHtmlByName('dsr_logo.html', array('logo_iframe_id' => $this->sLogoIframeId, 'form' => $oForm->getCode())),
            'js_content' => $this->getPageJsCode()
        ));
    }

    protected function getIcon()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();
        $oFunctions = BxTemplStudioFunctions::getInstance();

        $aTmplVarsPreview = ['bx_repeat:images' => []];
        foreach($this->aIcons as $sIcon => $aIcon) {
            $sSetting = 'sys_site_' . $sIcon;
            $iIconValue = (int)getParam($sSetting);

            if(($iOptionId = $this->getOptionId($sSetting)) != 0)
                $this->aIcons[$sIcon]['id'] = $iOptionId;

            if(empty($iIconValue))
                continue;

            $sIconUrl = '';
            $aIconParams = [];
            if(!empty($aIcon['transcoder'])) {
                $oTranscoder = BxDolTranscoderImage::getObjectInstance($aIcon['transcoder']);
                $sIconUrl = $oTranscoder->getFileUrl($iIconValue);
                $aIconParams = $oTranscoder->getFilterParams('Resize');
            }
            else {
                $oStorage = BxDolStorage::getObjectInstance($aIcon['storage']);
                $sIconUrl = $oStorage->getFileUrlById($iIconValue);
            }

            if($sIconUrl === false) {
                setParam($sSetting, 0);
                continue;
            }

            $bIconWidth = !empty($aIconParams['w']);
            $bIconHeight = !empty($aIconParams['h']);

            $aTmplVarsPreview['bx_repeat:images'][] = array(
                'js_object' => $this->getPageJsObject(),
                'id' => $iIconValue,
                'name' => $sIcon,
                'caption' => _t('_adm_dsg_txt_' . $sIcon),
                'url' => $sIconUrl,
                'bx_if:show_width' => array(
                    'condition' => $bIconWidth,
                    'content' => array(
                        'width' => $bIconWidth ? (int)$aIconParams['w'] : 0
                    )
                ),
                'bx_if:show_height' => array(
                    'condition' => $bIconHeight,
                    'content' => array(
                        'height' => $bIconHeight ? (int)$aIconParams['h'] : 0
                    )
                ), 
            );
        }
        
        $aForm = array(
            'form_attrs' => array(
                'id' => $this->sIconFormId,
                'name' => $this->sIconFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sIconIframeId
            ),
            'params' => array(
                'db' => array(
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'save'
                ),
            ),
            'inputs' => array(
                'page' => array(
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $this->sPage
                ),
                'icon' => array(
                    'type' => 'file',
                    'name' => 'icon',
                    'caption' => _t('_adm_dsg_txt_upload_icon'),
                    'info' => _t('_adm_dsg_txt_upload_icon_inf'),
                    'attrs' => ['accept' => '.ico']
                ),
                'icon_svg' => array(
                    'type' => 'file',
                    'name' => 'icon_svg',
                    'caption' => _t('_adm_dsg_txt_upload_icon_svg'),
                    'info' => _t('_adm_dsg_txt_upload_icon_svg_inf'),
                    'attrs' => ['accept' => '.svg']
                ),
                'icon_apple' => array(
                    'type' => 'files',
                    'name' => 'icon_apple',
                    'storage_object' => $this->aIcons['icon_apple']['storage'],
                    'images_transcoder' => $this->aIcons['icon_apple']['transcoder'],
                    'uploaders' => ['sys_html5'],
                    'multiple' => false,
                    'content_id' => $this->aIcons['icon_apple']['id'],
                    'ghost_template' => $oFunctions->getDefaultGhostTemplate('icon_apple'),
                    'caption' => _t('_adm_dsg_txt_upload_icon_apple'),
                    'info' => _t('_adm_dsg_txt_upload_icon_apple_inf'),
                ),
                'icon_android' => array(
                    'type' => 'files',
                    'name' => 'icon_android',
                    'storage_object' => $this->aIcons['icon_android']['storage'],
                    'images_transcoder' => $this->aIcons['icon_android']['transcoder'],
                    'uploaders' => ['sys_html5'],
                    'multiple' => false,
                    'content_id' => $this->aIcons['icon_android']['id'],
                    'ghost_template' => $oFunctions->getDefaultGhostTemplate('icon_android'),
                    'caption' => _t('_adm_dsg_txt_upload_icon_android'),
                    'info' => _t('_adm_dsg_txt_upload_icon_android_inf'),
                ),
                'icon_android_splash' => array(
                    'type' => 'files',
                    'name' => 'icon_android_splash',
                    'storage_object' => $this->aIcons['icon_android_splash']['storage'],
                    'images_transcoder' => $this->aIcons['icon_android_splash']['transcoder'],
                    'uploaders' => ['sys_html5'],
                    'multiple' => false,
                    'content_id' => $this->aIcons['icon_android_splash']['id'],
                    'ghost_template' => $oFunctions->getDefaultGhostTemplate('icon_android_splash'),
                    'caption' => _t('_adm_dsg_txt_upload_icon_android_splash'),
                    'info' => _t('_adm_dsg_txt_upload_icon_android_splash_inf'),
                ),
                'save' => array(
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_adm_btn_designer_submit'),
                )
            )
        );

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitIcon($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_icon.html', [
                'preview' => $oTemplate->parseHtmlByName('dsr_icon_preview.html', $aTmplVarsPreview),
                'icon_iframe_id' => $this->sIconIframeId, 
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    /**
     * A language string, or nothing at all when it has not been imported yet.
     *
     * _t() echoes the key back when it is missing from the database, and language strings live in the
     * database rather than in the file - so a site which takes this code without running the upgrade
     * would print `_adm_dsg_txt_upload_cover_common_inf` at an administrator as if it were help.
     * Silence is the better failure here: the field keeps its caption and simply has no hint.
     */
    protected function getTranslated($sKey)
    {
        $s = _t($sKey);

        return $s !== $sKey ? $s : '';
    }

    protected function getCover()
    {
    	$sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $oDbSettings = new BxDolStudioSettingsQuery();

        // the card of the site itself. Its URL is content addressed and the picture behind it is drawn upon
        // the first request for it, so showing the preview here is also what generates it - the most common
        // share of all, a link to the home page, then never pays for the generation.
        $oShareCard = BxDolShareCard::getInstance();
        $sShareCardUrl = bx_html_attribute($oShareCard->getImageUrl($oShareCard->getDefaultSpec()));

        // Each picture is its own group: what it is, where it shows up, what is set right now, and the
        // control to change it - in that order. They used to be two lists, every preview stacked in one
        // block and every uploader in another, so no preview sat anywhere near the thing it previewed.
        $aFormInputs = array();
        foreach($this->aCovers as $sCover => $aCover) {
            $aSetting = array();
            $oDbSettings->getOptions(array('type' => 'by_name', 'value' => $aCover['setting']), $aSetting, false);
            if(empty($aSetting) || !is_array($aSetting))
                continue;

            $iImageId = (int)getParam($aCover['setting']);

            $sImageUrl = '';
            if($iImageId != 0) {
                $oTranscoder = BxDolTranscoderImage::getObjectInstance($aCover['transcoder']);
                $sImageUrl = $oTranscoder ? (string)$oTranscoder->getFileUrl($iImageId) : '';

                // NO setParam(.., 0) here. This used to erase the setting whenever the transcoder
                // could not hand back a URL, so merely OPENING this page threw away a picture an
                // administrator had uploaded - and getFileUrl() returns false for reasons that have
                // nothing to do with the file being gone, such as a transcode that cannot run yet.
                // It cost the covers on the PR preview. A preview we cannot draw is a preview we
                // leave out; the setting is not ours to discard.
            }

            // one collapsible section per picture, the same chrome the Settings page uses - but open,
            // because the preview inside it is the most useful thing on the page
            $aFormInputs[$sCover . '_section'] = array(
                'type' => 'block_header',
                'name' => $sCover . '_section',
                'caption' => _t($aCover['title']),
                'info' => $this->getTranslated('_adm_dsg_txt_upload_' . $sCover . '_inf'),
                'collapsed' => false,
            );

            // the share card is drawn whether or not it has a background of its own - from the page
            // cover, the logo and the site title - so its preview is always worth showing
            $bPreview = $iImageId != 0 || $sCover == 'cover_share';
            if($bPreview)
                $aFormInputs[$sCover . '_preview'] = array(
                    'type' => 'custom',
                    'name' => $sCover . '_preview',
                    'content' => $oTemplate->parseHtmlByName('dsr_cover_preview.html', array(
                        'type' => $sCover,
                        'content' => $oTemplate->parseHtmlByName($aCover['template'], array(
                            'js_object' => $sJsObject,
                            'type' => $sCover,
                            'caption' => _t($aCover['title']),
                            'image_id' => $iImageId,
                            'share_card_url' => $sShareCardUrl,
                            'bx_if:show_bg' => array(
                                'condition' => !empty($sImageUrl),
                                'content' => array(
                                    'image_url' => $sImageUrl
                                )
                            ),
                            'bx_if:show_delete' => array(
                                'condition' => $iImageId != 0,
                                'content' => array(
                                    'js_object' => $sJsObject,
                                    'type' => $sCover,
                                    'image_id' => $iImageId
                                )
                            ),
                        ))
                    ))
                );

            $aFormInputs[$sCover] = array(
                'type' => 'files',
                'name' => $sCover,
                'storage_object' => $this->sCoverStorage,
                'images_transcoder' => $this->sCoverTranscoder,
                'uploaders' => array('sys_std_crop_cover'),
                'multiple' => false,
                'content_id' => $aSetting['id'],
                'ghost_template' => BxTemplStudioFunctions::getInstance()->getDefaultGhostTemplate($sCover),
                'caption' => _t('_adm_dsg_txt_upload_' . $sCover),
                'db' => array (
                    'pass' => 'Int',
                )
            );

            // the switch belongs to the picture it switches off, not to the top of the page where it
            // was asking to be understood before the reader had met a single cover
            if($sCover == 'cover_common')
                $aFormInputs['disabled'] = array(
                    'type' => 'checkbox',
                    'name' => 'disabled',
                    'caption' => _t('_adm_dsg_txt_cover_disabled'),
                    'info' => $this->getTranslated('_adm_dsg_txt_cover_disabled_inf'),
                    'value' => 'on',
                    'checked' => getParam('sys_site_cover_disabled') == 'on',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                );
        }

        $aForm = array(
            'form_attrs' => array(
                'id' => $this->sCoverFormId,
                'name' => $this->sCoverFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sCoverIframeId
            ),
            'params' => array(
                'db' => array(
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'save'
                ),
            ),
            'inputs' => array_merge(array(
                'page' => array(
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $this->sPage
                ),
            ), $aFormInputs, array(
                'save' => array(
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_adm_btn_designer_submit'),
                )
            ))
        );

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitCover($oForm);
            exit;
        }

        $this->aPageCss[] = 'cover.css';
        return $oTemplate->parseHtmlByName('designer.html', array(
            'content' => $oTemplate->parseHtmlByName('dsr_cover.html', array('iframe_id' => $this->sCoverIframeId, 'form' => $oForm->getCode())),
            'js_content' => $this->getPageJsCode()
        ));
    }

    protected function getSplash()
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();

        $aForm = array(
            'form_attrs' => array(
                'id' => $this->sSplashFormId,
                'name' => $this->sSplashFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sSplashIframeId
            ),
            'params' => array(
                'db' => array(
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'save'
                ),
            ),
            'inputs' => array(
                'page' => array(
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $this->sPage
                ),
                'enabled' => array(
                    'type' => 'checkbox',
                    'name' => 'enabled',
                    'caption' => _t('_adm_dsg_txt_splash_enabled'),
                    'value' => 'on',
                    'checked' => getParam('sys_site_splash_enabled') == 'on',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'code' => array(
                    'type' => 'textarea',
                    'code' => true,
                    'name' => 'code',
                    'caption' => '',
                    'value' => getParam('sys_site_splash_code'),
                ),
                'save' => array(
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_adm_btn_designer_submit'),
                )
            )
        );

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitSplash($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_splash.html', [
                'warning' => MsgBox(_t('_adm_dsg_dsc_splash_warning')),
                'splash_iframe_id' => $this->sSplashIframeId, 
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode(),
        ]);
    }

    protected function getInjections()
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();

        $aForm = array(
            'form_attrs' => array(
                'id' => $this->sInjectionsFormId,
                'name' => $this->sInjectionsFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sInjectionsIframeId
            ),
            'params' => array(
                'db' => array(
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'save'
                ),
            ),
            'inputs' => array(
                'page' => array(
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $this->sPage
                ),
                'sys_head' => array(
                    'type' => 'textarea',
                    'code' => true,
                    'name' => 'sys_head',
                    'caption' => _t('_adm_dsg_txt_inj_head'),
                    'info' => _t('_adm_dsg_txt_inj_head_inf'),
                    'value' => $this->oDb->getOne("SELECT `data` FROM `sys_injections` WHERE `name`='sys_head'"),
                ),
                'sys_body' => array(
                    'type' => 'textarea',
                    'code' => true,
                    'name' => 'sys_body',
                    'caption' => _t('_adm_dsg_txt_inj_body'),
                    'info' => _t('_adm_dsg_txt_inj_body_inf'),
                    'value' => $this->oDb->getOne("SELECT `data` FROM `sys_injections` WHERE `name`='sys_body'"),
                ),
                'save' => array(
                'type' => 'submit',
                'name' => 'save',
                'value' => _t('_adm_btn_designer_submit'),
                )
            )
        );

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitInjections($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_injections.html', [
                'warning' => '',
                'splash_iframe_id' => $this->sInjectionsIframeId, 
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    protected function getPwa()
    {
        $oOptions = new BxTemplStudioOptions(BX_DOL_STUDIO_STG_TYPE_SYSTEM, ['pwa_manifest', 'pwa_sw']);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('designer.html', array(
            'content' => $oOptions->getCode(),
            'js_content' => $this->getPageJsCode()
        ));
    }

    protected function getSettings()
    {
        $oOptions = new BxTemplStudioOptions(BX_DOL_STUDIO_STG_TYPE_SYSTEM, BX_DOL_STUDIO_STG_CATEGORY_TEMPLATES);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('designer.html', array(
            'content' => $oOptions->getCode(),
            'js_content' => $this->getPageJsCode()
        ));
    }

    protected function getOptionId($sName)
    {
        $aSetting = [];
        $this->oDbSettings->getOptions(['type' => 'by_name', 'value' => $sName], $aSetting, false);
        if(empty($aSetting) || !is_array($aSetting))
            return 0;

        return (int)$aSetting['id'];
    }
}

/** @} */
