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
        $oFunctions = BxTemplStudioFunctions::getInstance();

        $aTemplate = $this->getLogoTemplateModule();
        $sTemplate = !empty($aTemplate['title']) ? $aTemplate['title'] : '';

        $aForm = [
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
            ]
        ];

        // A section per image: the previews of what the header shows, then the uploads and the SVG code.
        $aPreviews = $this->getLogoPreviews($sTemplate);
        foreach(['logo' => ['logo', 'logo_dark', 'logo_inline'], 'mark' => ['mark', 'mark_dark', 'mark_inline']] as $sSection => $aLogos) {
            $aInputs = [];
            foreach($aLogos as $sLogo) {
                $aLogo = $this->aLogos[$sLogo];
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
                        'ghost_template' => $oFunctions->getDefaultGhostTemplate($sLogo),
                        'caption' => _t(strpos($sLogo, '_dark') !== false ? '_adm_dsg_txt_logo_upload_for_dark' : '_adm_dsg_txt_logo_upload_for_light'),
                    ];
                else {
                    $aInputs[$sLogo] = [
                        'type' => 'textarea',
                        'name' => $sLogo,
                        'caption' => _t('_adm_dsg_txt_logo_code'),
                        'value' => getParam($this->{$aLogo['param']}),
                        'code' => 1,
                        'db' => [
                            'pass' => 'Xss',
                        ],
                    ];
                    // The hint in the section text style: the form's own field info is too faint to read.
                    $aInputs[$sLogo . '_info'] = [
                        'type' => 'custom',
                        'name' => $sLogo . '_info',
                        'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_' . $sSection . '_code')]),
                    ];
                }
            }

            if(empty($aInputs))
                continue;

            $aForm['inputs'] = array_merge($aForm['inputs'], [
                $sSection . '_section' => [
                    'type' => 'block_header',
                    'name' => $sSection . '_section',
                    'caption' => _t('_adm_dsg_txt_' . $sSection . '_section'),
                ],
                $sSection . '_info' => [
                    'type' => 'custom',
                    'name' => $sSection . '_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_' . $sSection . '_section')]),
                ],
                $sSection . '_preview' => [
                    'type' => 'custom',
                    'name' => $sSection . '_preview',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_preview.html', [
                        'bx_repeat:previews' => array_values(array_filter($aPreviews, function($aPreview) use ($aLogos) {
                            return in_array($aPreview['name'], $aLogos);
                        }))
                    ]),
                ],
            ], $aInputs);
        }

        $aForm['inputs'] = array_merge($aForm['inputs'], [
            'text_section' => [
                'type' => 'block_header',
                'name' => 'text_section',
                'caption' => _t('_adm_dsg_txt_logo_text_section'),
            ],
            'text_info' => [
                'type' => 'custom',
                'name' => 'text_info',
                'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_logo_text')]),
            ],
            'alt' => [
                'type' => 'text',
                'name' => 'alt',
                'caption' => _t('_adm_dsg_txt_logo_text'),
                'value' => getParam($this->sParamLogoAlt),
                'attrs' => [
                    'placeholder' => getParam('site_title'),
                ],
                'checker' => [
                    'func' => '',
                    'params' => [],
                    'error' => ''
                ],
                'db' => [
                    'pass' => 'Xss',
                ],
            ],
            'header_note' => [ // the note under the sections, in a section of its own
                'type' => 'block_header',
            ],
            'note' => [
                'type' => 'custom',
                'name' => 'note',
                'content' => $this->getLogoNote($aTemplate),
            ],
            'header_save' => [ // a section of its own for the Save button: the block footer (page.css) is that last section
                'type' => 'block_header',
            ],
            'save' => [
                'type' => 'submit',
                'name' => 'save',
                'value' => _t('_adm_btn_settings_save'),
            ]
        ]);

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitLogo($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_logo.html', ['logo_iframe_id' => $this->sLogoIframeId, 'form' => $oForm->getCode()]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    /**
     * The note above the logo form: which logos the page sets and where the others are.
     */
    protected function getLogoNote($aTemplate)
    {
        $sTemplate = !empty($aTemplate['title']) ? $aTemplate['title'] : '';

        if(!empty($this->sLogoTemplate)) {
            $sText = _t('_adm_dsg_txt_logo_note_template', $sTemplate);
            $sLink = _t('_adm_dsg_lnk_logo_system');
            $sUrl = bx_append_url_params(BX_DOL_URL_STUDIO . 'designer.php', ['page' => BX_DOL_STUDIO_DSG_TYPE_LOGO]);
        }
        else {
            $sText = _t('_adm_dsg_txt_logo_note_system');
            if(!empty($sTemplate))
                $sText .= ' ' . _t('_adm_dsg_txt_logo_note_previews', $sTemplate);
            $sLink = $sUrl = '';
            if(!empty($aTemplate) && $this->getLogoTemplateParams()) {
                $sLink = _t('_adm_dsg_lnk_logo_template', $sTemplate);
                $sUrl = bx_append_url_params(BX_DOL_URL_STUDIO . 'design.php', ['name' => $aTemplate['name'], 'page' => BX_DOL_STUDIO_DSG_TYPE_LOGO]);
            }
        }

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('dsr_logo_note.html', [
            'text' => $sText,
            'bx_if:show_link' => [
                'condition' => !empty($sUrl),
                'content' => [
                    'url' => $sUrl,
                    'link' => $sLink,
                ]
            ],
        ]);
    }

    /**
     * A preview per logo image this page sets: what the header shows for it, and where that comes from.
     */
    protected function getLogoPreviews($sTemplate)
    {
        $aSources = $this->getLogoSources();
        $aShown = $this->getLogoShown($aSources);

        $sAlt = getParam($this->sParamLogoAlt);
        if(empty($sAlt))
            $sAlt = getParam('site_title');

        $aResult = [];
        foreach(['logo', 'logo_dark', 'mark', 'mark_dark'] as $sType) {
            if(empty($this->{$this->aLogos[$sType]['param']}))
                continue;

            $bDark = strpos($sType, '_dark') !== false;
            $sInfo = $this->getLogoPreviewInfo($sType, $aSources, $sTemplate);

            $aShow = $aShown[$sType];
            $bImage = !empty($aShow['url']);
            $bCode = !$bImage && !empty($aShow['code']);

            $aResult[] = [
                'name' => $sType,
                'scheme' => $bDark ? 'dark' : 'light',
                'caption' => _t($bDark ? '_adm_dsg_txt_logo_upload_dark' : '_adm_dsg_txt_logo_upload_light'),
                'info' => $sInfo,
                'bx_if:show_image' => [
                    'condition' => $bImage,
                    'content' => [
                        'url' => $bImage ? $aShow['url'] : '',
                        'alt' => bx_html_attribute($sAlt),
                    ]
                ],
                'bx_if:show_code' => [
                    'condition' => $bCode,
                    'content' => [
                        'code' => $bCode ? $aShow['code'] : '',
                    ]
                ],
                'bx_if:show_text' => [
                    'condition' => !$bImage && !$bCode,
                    'content' => [
                        'text' => bx_process_output($sAlt),
                    ]
                ],
                'bx_if:show_remove' => [
                    'condition' => (int)getParam($this->{$this->aLogos[$sType]['param']}) != 0,
                    'content' => [
                        'js_object' => $this->getPageJsObject(),
                        'name' => $sType,
                        'label' => bx_html_attribute(_t('_adm_dsg_btn_logo_remove_' . $sType)),
                        'confirm' => bx_html_attribute(_t('_adm_dsg_cnf_logo_remove')),
                    ]
                ],
            ];
        }

        return $aResult;
    }

    /**
     * What the header draws for each logo image: its own, or the image that stands in for it
     * (the light one in dark mode, the logo where there is no mark).
     */
    protected function getLogoShown($aSources)
    {
        $fSet = function($sType) use ($aSources) {
            return $aSources[$sType]['source'] != BxDolDesigns::LOGO_SOURCE_NONE;
        };

        $aShown = ['logo' => $aSources['logo']];
        $aShown['logo_dark'] = $fSet('logo_dark') ? $aSources['logo_dark'] : $aShown['logo'];
        $aShown['mark'] = $fSet('mark') ? $aSources['mark'] : $aShown['logo'];

        $aShown['mark_dark'] = $aSources['mark_dark'];
        if(!$fSet('mark_dark'))
            $aShown['mark_dark'] = $fSet('mark') ? $aShown['mark'] : $aShown['logo_dark'];

        return $aShown;
    }

    /**
     * The line under a logo preview: where the image the header draws for it comes from.
     */
    protected function getLogoPreviewInfo($sType, $aSources, $sTemplate)
    {
        $aSource = $aSources[$sType];
        $bTemplatePage = !empty($this->sLogoTemplate);
        $sPageSource = $bTemplatePage ? BxDolDesigns::LOGO_SOURCE_TEMPLATE : BxDolDesigns::LOGO_SOURCE_SYSTEM;

        $aTemplateParams = $this->getLogoTemplateParams();
        if(!$bTemplatePage && !empty($aTemplateParams) && !isset($aTemplateParams[$sType]))
            return _t('_adm_dsg_txt_logo_src_unused', $sTemplate);

        switch($aSource['source']) {
            case BxDolDesigns::LOGO_SOURCE_TEMPLATE:
            case BxDolDesigns::LOGO_SOURCE_SYSTEM:
                if($aSource['source'] == $sPageSource)
                    return _t('_adm_dsg_txt_logo_src_here');
                return _t($bTemplatePage ? '_adm_dsg_txt_logo_src_system' : '_adm_dsg_txt_logo_src_template', $sTemplate);

            case BxDolDesigns::LOGO_SOURCE_BUILTIN:
                // The system's default, unless the template ships its own copy (named on the template's page only).
                $sKind = strpos($sType, 'mark') === 0 ? 'mark' : 'logo';
                if($bTemplatePage && $this->isLogoBuiltinOwn(BxDolDesigns::$aLogoBuiltins[$sType]))
                    return _t('_adm_dsg_txt_' . $sKind . '_src_builtin', $sTemplate);
                return _t('_adm_dsg_txt_' . $sKind . '_src_default');

            case BxDolDesigns::LOGO_SOURCE_INLINE:
                if($aSource['code_source'] == $sPageSource)
                    return _t('_adm_dsg_txt_logo_src_code');
                return _t($bTemplatePage ? '_adm_dsg_txt_logo_src_code_system' : '_adm_dsg_txt_logo_src_code_template', $sTemplate);
        }

        $aNone = [
            'logo' => '_adm_dsg_txt_logo_src_none',
            'logo_dark' => '_adm_dsg_txt_logo_dark_src_none',
            'mark' => '_adm_dsg_txt_mark_src_none',
            'mark_dark' => $aSources['mark']['source'] != BxDolDesigns::LOGO_SOURCE_NONE ? '_adm_dsg_txt_mark_dark_src_none' : '_adm_dsg_txt_mark_src_none',
        ];
        return _t($aNone[$sType]);
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

    protected function getCover()
    {
    	$sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $oDbSettings = new BxDolStudioSettingsQuery();

        $aFormInputs = array();
        $aTmplVarsCovers = array();
        foreach($this->aCovers as $sCover => $aCover) {
            $aSetting = array();
            $oDbSettings->getOptions(array('type' => 'by_name', 'value' => $aCover['setting']), $aSetting, false);
            if(empty($aSetting) || !is_array($aSetting))
                continue;

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

            if(($iImageId = (int)getParam($aCover['setting'])) == 0)
                continue;

            $sImageUrl = BxDolTranscoderImage::getObjectInstance($aCover['transcoder'])->getFileUrl($iImageId);
            if($sImageUrl === false) {
            	setParam($aCover['setting'], 0);
                continue;
            }

            $aTmplVarsCovers[] = array(
                'image_id' => $iImageId,
                'content' => $oTemplate->parseHtmlByName($aCover['template'], array(
                    'js_object' => $sJsObject,
                    'type' => $sCover,
                    'caption' => _t($aCover['title']),
                    'image_id' => $iImageId,
                        'bx_if:show_bg' => array(
                            'condition' => !empty($sImageUrl),
                            'content' => array(
                                'image_url' => $sImageUrl
                            )
                    ),
                ))
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
            'inputs' => array(
                'page' => array(
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $this->sPage
                ),
                'disabled' => array(
                    'type' => 'checkbox',
                    'name' => 'disabled',
                    'caption' => _t('_adm_dsg_txt_cover_disabled'),
                    'value' => 'on',
                    'checked' => getParam('sys_site_cover_disabled') == 'on',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'preview' => array(
                    'type' => 'custom',
                    'name' => 'preview',
                    'content' => $oTemplate->parseHtmlByName('dsr_cover_preview.html', array(
                        'bx_repeat:covers' => $aTmplVarsCovers
                    ))
                ),

                'save' => array(
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_adm_btn_designer_submit'),
                )
            )
        );

        $aForm['inputs'] = bx_array_insert_after($aFormInputs, $aForm['inputs'], 'preview');

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
