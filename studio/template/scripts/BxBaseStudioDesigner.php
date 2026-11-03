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
    protected $sPwaFormId = 'adm-dsg-pwa-form';
    protected $sPwaIframeId = 'adm-dsg-pwa-iframe';
    protected $sSettingsFormId = 'adm-dsg-settings-form';
    protected $sSettingsIframeId = 'adm-dsg-settings-iframe';
    protected $sTemplatesFormId = 'adm-dsg-templates-form';

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
            BX_DOL_STUDIO_DSG_TYPE_GENERAL => ['icon' => 'mi-dsg-general.svg', 'title' => '_adm_dsg_lmi_cpt_template'], // _adm_lmi_cpt_general is other apps' too
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
                'title' => _t(isset($aItem['title']) ? $aItem['title'] : '_adm_lmi_cpt_' . $sMenuItem),
                'selected' => $sMenuItem == $this->sPage
            ];

        return parent::getPageMenu($aMenu);
    }

    protected function getGeneral()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sDefault = getParam('template');
        $aTemplates = get_templates_array(true, false);

        $aCards = [];
        foreach($aTemplates as $sUri => $aModule) {
            $sIcon = $this->getModuleIcon($aModule, 'store');
            $bIcon = strpos($sIcon, '.') === false && strcmp(substr($sIcon, 0, 10), 'data:image') != 0;
            $sTitle = htmlspecialchars_adv($aModule['title']);

            $aCards[] = [
                'js_object' => $sJsObject,
                'uri' => $sUri,
                'title' => $sTitle,
                'title_attr' => bx_html_attribute($aModule['title']),
                'version' => htmlspecialchars_adv($aModule['version']),
                'vendor' => htmlspecialchars_adv($aModule['vendor']),
                'pressed' => $sUri == $sDefault ? 'true' : 'false',
                'title_data' => bx_html_attribute($aModule['title']),
                'bx_if:icon' => [
                    'condition' => $bIcon,
                    'content' => ['icon' => $sIcon],
                ],
                'bx_if:image' => [
                    'condition' => !$bIcon,
                    'content' => ['icon_url' => $sIcon],
                ],
                'bx_if:default' => [
                    'condition' => $sUri == $sDefault,
                    'content' => [],
                ],
            ];
        }

        $sDesignerUrl = BX_DOL_URL_STUDIO . 'designer.php?page=';
        $sDefaultTitle = isset($aTemplates[$sDefault]) ? $aTemplates[$sDefault]['title'] : $sDefault;
        $aForm = [
            'form_attrs' => [
                'id' => $this->sTemplatesFormId,
                'name' => $this->sTemplatesFormId,
                'action' => '',
                'method' => 'post',
                'onsubmit' => 'return false;',
            ],
            'params' => [
                'db' => [
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'none'
                ],
            ],
            'inputs' => [
                'templates_section' => [
                    'type' => 'block_header',
                    'name' => 'templates_section',
                    'caption' => _t('_adm_dsg_txt_tmpl_section_list'),
                ],
                'templates_info' => [
                    'type' => 'custom',
                    'name' => 'templates_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_tmpl_section_list')]),
                ],
                'templates' => [
                    'type' => 'custom',
                    'name' => 'templates',
                    'content' => $oTemplate->parseHtmlByName('dsr_templates_list.html', ['bx_repeat:templates' => $aCards]),
                ],
                'preview_section' => [
                    'type' => 'block_header',
                    'name' => 'preview_section',
                    'caption' => _t('_adm_dsg_txt_tmpl_section_preview'),
                ],
                'preview_info' => [
                    'type' => 'custom',
                    'name' => 'preview_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', [
                        'text' => _t('_adm_dsg_inf_tmpl_section_preview')
                    ]),
                ],
                'preview' => [
                    'type' => 'custom',
                    'name' => 'preview',
                    'content' => $this->getTemplateViewer($sDefault, isset($aTemplates[$sDefault]) ? $aTemplates[$sDefault]['title'] : $sDefault),
                ],
                'header_footer' => [ // the last section is the block's pinned footer (page.css): where the default is chosen
                    'type' => 'block_header',
                ],
                'footer' => [
                    'type' => 'custom',
                    'name' => 'footer',
                    'content' => $oTemplate->parseHtmlByName('dsr_templates_footer.html', [
                        'text' => _t('_adm_dsg_txt_tmpl_footer', htmlspecialchars_adv($sDefaultTitle)),
                        'settings_url' => $sDesignerUrl . BX_DOL_STUDIO_DSG_TYPE_SETTINGS,
                    ]),
                ],
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oForm->getCode(),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    /**
     * The Template page preview: the real site in a template (?skin=...&preview=1 shows it without setting the template
     * cookie), with a choice of pages and the viewport controls of the Landing preview. designer.js does the rest.
     */
    protected function getTemplateViewer($sUri, $sTitle)
    {
        $aPages = $this->getTemplatePages();
        $sSrc = bx_append_url_params($aPages[0]['url'], ['skin' => $sUri, 'preview' => 1]);

        $aOptions = [];
        foreach($aPages as $i => $aPage)
            $aOptions[] = [
                'page_url' => bx_html_attribute($aPage['url']),
                'page_title' => $aPage['title'],
                'page_selected' => $i == 0 ? 'selected="selected"' : '',
            ];

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('dsr_template_viewer.html', [
            'js_object' => $this->getPageJsObject(),
            'uri' => bx_html_attribute($sUri),
            'title' => htmlspecialchars_adv($sTitle),
            'src' => bx_html_attribute($sSrc),
            'dialog_id' => $this->sTemplatesFormId . '-fullscreen',
            'bx_repeat:pages' => $aOptions,
        ]);
    }

    /**
     * Pages worth seeing a template on: the home page, system pages, the viewer's own profile, and the home pages of
     * People and Timeline when they are on.
     * @return array of ['url' => ..., 'title' => ...], the home page first
     */
    protected function getTemplatePages()
    {
        $oPermalinks = BxDolPermalinks::getInstance();
        $fPage = function($sUri) use ($oPermalinks) {
            return bx_absolute_url($oPermalinks->permalink('page.php?i=' . $sUri));
        };

        $aPages = [['url' => BX_DOL_URL_ROOT, 'title' => _t('_adm_dsg_txt_tmpl_page_home')]];

        $oModules = BxDolModuleQuery::getInstance();
        if($oModules->isEnabledByName('bx_timeline'))
            $aPages[] = ['url' => $fPage('timeline-view-home'), 'title' => _t('_adm_dsg_txt_tmpl_page_timeline')];
        if($oModules->isEnabledByName('bx_persons'))
            $aPages[] = ['url' => $fPage('persons-home'), 'title' => _t('_adm_dsg_txt_tmpl_page_people')];

        if(($oProfile = BxDolProfile::getInstance()) && ($sProfileUrl = $oProfile->getUrl()))
            $aPages[] = ['url' => $sProfileUrl, 'title' => _t('_adm_dsg_txt_tmpl_page_profile')];

        foreach(['explore' => 'explore', 'about' => 'about', 'login' => 'login', 'create-account' => 'join'] as $sUri => $sKey)
            $aPages[] = ['url' => $fPage($sUri), 'title' => _t('_adm_dsg_txt_tmpl_page_' . $sKey)];

        return $aPages;
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

        // A header that draws the logo alone shows it in place of every other image.
        foreach(['logo_dark', 'mark', 'mark_dark'] as $sType)
            if(!$this->isLogoDrawn($sType))
                $aShown[$sType] = $aShown['logo'];

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

        if(!$this->isLogoDrawn($sType))
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

        foreach($this->aIcons as $sIcon => $aIcon)
            if(($iOptionId = $this->getOptionId('sys_site_' . $sIcon)) != 0)
                $this->aIcons[$sIcon]['id'] = $iOptionId;

        $aForm = [
            'form_attrs' => [
                'id' => $this->sIconFormId,
                'name' => $this->sIconFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sIconIframeId
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

        // A section per place the icons show: previews of what the site uses, then the uploads, each with a hint.
        $aPreviews = $this->getIconPreviews();
        $aAccept = ['icon' => '.ico', 'icon_svg' => '.svg'];
        foreach(['tab' => ['icon_svg', 'icon'], 'home' => ['icon_apple', 'icon_android', 'icon_android_splash']] as $sSection => $aIcons) {
            $aForm['inputs'] = array_merge($aForm['inputs'], [
                $sSection . '_section' => [
                    'type' => 'block_header',
                    'name' => $sSection . '_section',
                    'caption' => _t('_adm_dsg_txt_icon_section_' . $sSection),
                ],
                $sSection . '_info' => [
                    'type' => 'custom',
                    'name' => $sSection . '_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_icon_section_' . $sSection)]),
                ],
                $sSection . '_preview' => [
                    'type' => 'custom',
                    'name' => $sSection . '_preview',
                    'content' => $oTemplate->parseHtmlByName('dsr_icon_preview.html', [
                        'bx_repeat:previews' => array_map(function($sIcon) use ($aPreviews) {
                            return $aPreviews[$sIcon];
                        }, $aIcons)
                    ]),
                ],
            ]);

            foreach($aIcons as $sIcon) {
                $aIcon = $this->aIcons[$sIcon];
                if(isset($aAccept[$sIcon]))
                    $aInput = [
                        'type' => 'file',
                        'name' => $sIcon,
                        'caption' => _t('_adm_dsg_txt_icon_upload_' . $sIcon),
                        'attrs' => ['accept' => $aAccept[$sIcon]]
                    ];
                else
                    $aInput = [
                        'type' => 'files',
                        'name' => $sIcon,
                        'storage_object' => $aIcon['storage'],
                        'images_transcoder' => $aIcon['transcoder'],
                        'uploaders' => ['sys_html5'],
                        'multiple' => false,
                        'content_id' => isset($aIcon['id']) ? $aIcon['id'] : 0,
                        'ghost_template' => $oFunctions->getDefaultGhostTemplate($sIcon),
                        'caption' => _t('_adm_dsg_txt_icon_upload_' . $sIcon),
                    ];

                $aForm['inputs'][$sIcon] = $aInput;
                $aForm['inputs'][$sIcon . '_hint'] = [
                    'type' => 'custom',
                    'name' => $sIcon . '_hint',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_icon_upload_' . $sIcon)]),
                ];
            }
        }

        $aForm['inputs'] = array_merge($aForm['inputs'], [
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
            echo $this->submitIcon($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_icon.html', [
                'icon_iframe_id' => $this->sIconIframeId,
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    /**
     * A preview per icon: what the site uses for it (the upload, the default, or the other favicon), and where it comes from.
     */
    protected function getIconPreviews()
    {
        $aUrls = [];
        foreach($this->aIcons as $sIcon => $aIcon)
            $aUrls[$sIcon] = $this->getIconUrl($sIcon);

        // The site's own defaults, as BxBaseFunctions::getMetaIcons and manifest.json.php use them.
        $aDefaults = [
            'icon' => 'favicon.svg',
            'icon_svg' => 'favicon.svg',
            'icon_apple' => 'apple-touch-icon.png',
            'icon_android' => 'android-icon-192.png',
            'icon_android_splash' => 'android-icon-512.png',
        ];
        $aSizes = [
            'icon' => 'w-8 h-8',
            'icon_svg' => 'w-8 h-8',
            'icon_apple' => 'w-16 h-16 rounded-2xl',
            'icon_android' => 'w-16 h-16 rounded-2xl',
            'icon_android_splash' => 'w-20 h-20 rounded-2xl',
        ];
        $bFavicons = !empty($aUrls['icon']) || !empty($aUrls['icon_svg']);

        $aResult = [];
        foreach($this->aIcons as $sIcon => $aIcon) {
            $sUrl = $aUrls[$sIcon];
            if(!empty($sUrl))
                $sInfo = _t('_adm_dsg_txt_logo_src_here');
            else if(in_array($sIcon, ['icon', 'icon_svg']) && $bFavicons) {
                // One favicon uploaded: browsers use it for both.
                $sUrl = $sIcon == 'icon' ? $aUrls['icon_svg'] : $aUrls['icon'];
                $sInfo = _t('_adm_dsg_txt_icon_src_none_' . $sIcon);
            }
            else {
                $sUrl = $this->getIconDefaultUrl($aDefaults[$sIcon]);
                $sInfo = _t(in_array($sIcon, ['icon', 'icon_svg']) ? '_adm_dsg_txt_icon_src_default_svg' : '_adm_dsg_txt_icon_src_default');
            }

            $bTab = in_array($sIcon, ['icon', 'icon_svg']);
            $aResult[$sIcon] = [
                'name' => $sIcon,
                'stage' => $bTab ? 'adm-dsg-ip-light' : 'adm-dsg-ip-home',
                'caption' => _t('_adm_dsg_txt_icon_preview_' . $sIcon),
                'info' => $sInfo,
                'bx_if:show_image' => [
                    'condition' => !empty($sUrl),
                    'content' => [
                        'url' => $sUrl,
                        'size' => $aSizes[$sIcon],
                    ]
                ],
                // Browser tab icons on both: an SVG icon can switch colours itself (prefers-color-scheme, see designer.css).
                'bx_if:show_dark' => [
                    'condition' => !empty($sUrl) && $bTab,
                    'content' => [
                        'url' => $sUrl,
                        'size' => $aSizes[$sIcon],
                    ]
                ],
                'bx_if:show_remove' => [
                    'condition' => !empty($aUrls[$sIcon]),
                    'content' => [
                        'js_object' => $this->getPageJsObject(),
                        'name' => $sIcon,
                        'label' => bx_html_attribute(_t('_adm_dsg_btn_icon_remove_' . $sIcon)),
                        'confirm' => bx_html_attribute(_t('_adm_dsg_cnf_logo_remove')),
                    ]
                ],
            ];
        }

        return $aResult;
    }

    /**
     * The URL of an uploaded icon, '' when there is none (a setting whose file is gone is cleared).
     */
    protected function getIconUrl($sIcon)
    {
        $aIcon = $this->aIcons[$sIcon];
        $sSetting = 'sys_site_' . $sIcon;
        $iId = (int)getParam($sSetting);
        if(empty($iId))
            return '';

        if(!empty($aIcon['transcoder']))
            $sUrl = BxDolTranscoderImage::getObjectInstance($aIcon['transcoder'])->getFileUrl($iId);
        else
            $sUrl = BxDolStorage::getObjectInstance($aIcon['storage'])->getFileUrlById($iId);

        if($sUrl === false) {
            setParam($sSetting, 0);
            return '';
        }

        return $sUrl;
    }

    protected function getCover()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();
        $oDbSettings = new BxDolStudioSettingsQuery();

        $aForm = [
            'form_attrs' => [
                'id' => $this->sCoverFormId,
                'name' => $this->sCoverFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sCoverIframeId
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

        // A section per cover: what it is, the switch for page covers, a preview of what the site shows, the upload and its hint.
        $aPreviews = $this->getCoverPreviews();
        foreach(['cover_common' => 'page', 'cover_unit_profile' => 'unit'] as $sCover => $sSection) {
            $aSetting = [];
            $oDbSettings->getOptions(['type' => 'by_name', 'value' => $this->aCovers[$sCover]['setting']], $aSetting, false);
            if(empty($aSetting) || !is_array($aSetting))
                continue;

            $aForm['inputs'] = array_merge($aForm['inputs'], [
                $sSection . '_section' => [
                    'type' => 'block_header',
                    'name' => $sSection . '_section',
                    'caption' => _t('_adm_dsg_txt_cover_section_' . $sSection),
                ],
                $sSection . '_info' => [
                    'type' => 'custom',
                    'name' => $sSection . '_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_cover_section_' . $sSection)]),
                ],
            ], $sSection != 'page' ? [] : [
                'show' => [
                    'type' => 'checkbox',
                    'name' => 'show',
                    'caption' => _t('_adm_dsg_txt_cover_show'),
                    'value' => 'on',
                    'checked' => getParam('sys_site_cover_disabled') != 'on',
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
            ], [
                $sSection . '_preview' => [
                    'type' => 'custom',
                    'name' => $sSection . '_preview',
                    'content' => $oTemplate->parseHtmlByName('dsr_cover_preview.html', ['bx_repeat:previews' => [$aPreviews[$sCover]]]),
                ],
                $sCover => [
                    'type' => 'files',
                    'name' => $sCover,
                    'storage_object' => $this->sCoverStorage,
                    'images_transcoder' => $this->sCoverTranscoder,
                    'uploaders' => ['sys_std_crop_cover'],
                    'multiple' => false,
                    'content_id' => $aSetting['id'],
                    'ghost_template' => BxTemplStudioFunctions::getInstance()->getDefaultGhostTemplate($sCover),
                    'caption' => _t('_adm_dsg_txt_cover_upload_' . $sSection),
                    'db' => [
                        'pass' => 'Int',
                    ]
                ],
                $sCover . '_hint' => [
                    'type' => 'custom',
                    'name' => $sCover . '_hint',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_cover_upload_' . $sSection)]),
                ],
            ]);
        }

        $aForm['inputs'] = array_merge($aForm['inputs'], [
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
            echo $this->submitCover($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_cover.html', ['iframe_id' => $this->sCoverIframeId, 'form' => $oForm->getCode()]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    /**
     * A preview per cover: the upload, or the default the site shows without one (in light and dark mode where it has both).
     */
    protected function getCoverPreviews()
    {
        // The site's own defaults. Page covers: the template's own art when its cover.css has some (Artificer's cover-default.svg,
        // with a dark version), else template/css/cover.css's cover.svg, which the other templates import. Profile cards: cover.svg.
        $aDefaults = [
            'cover_common' => [$this->getSiteImageUrl('images/', 'cover-default.svg', false), $this->getSiteImageUrl('images/', 'cover-default-dark.svg', false)],
            'cover_unit_profile' => [$this->getSiteImageUrl('images/', 'cover.svg'), ''],
        ];
        if(empty($aDefaults['cover_common'][0]))
            $aDefaults['cover_common'] = [$this->getSiteImageUrl('images/', 'cover.svg'), ''];

        $aResult = [];
        foreach($this->aCovers as $sCover => $aCover) {
            $sUrl = $sUrlDark = '';
            $iId = (int)getParam($aCover['setting']);
            if($iId != 0) {
                $sUrl = BxDolTranscoderImage::getObjectInstance($aCover['transcoder'])->getFileUrl($iId);
                if($sUrl === false) {
                    setParam($aCover['setting'], 0);
                    $sUrl = '';
                    $iId = 0;
                }
            }

            if($sUrl) {
                $sInfo = _t('_adm_dsg_txt_logo_src_here');
            }
            else {
                list($sUrl, $sUrlDark) = $aDefaults[$sCover];
                if(empty($sUrl))
                    $sInfo = _t('_adm_dsg_txt_cover_src_none');
                else
                    $sInfo = _t(!empty($sUrlDark) ? '_adm_dsg_txt_cover_src_default_dark' : '_adm_dsg_txt_cover_src_default');
            }

            $aResult[$sCover] = [
                'name' => $sCover,
                'info' => $sInfo,
                'bx_if:show_image' => [
                    'condition' => !empty($sUrl),
                    'content' => ['url' => $sUrl]
                ],
                'bx_if:show_dark' => [
                    'condition' => !empty($sUrlDark),
                    'content' => ['url' => $sUrlDark]
                ],
                'bx_if:show_remove' => [
                    'condition' => $iId != 0,
                    'content' => [
                        'js_object' => $this->getPageJsObject(),
                        'name' => $sCover,
                        'label' => bx_html_attribute(_t('_adm_dsg_btn_cover_remove_' . $sCover)),
                        'confirm' => bx_html_attribute(_t('_adm_dsg_cnf_logo_remove')),
                    ]
                ],
            ];
        }

        return $aResult;
    }

    protected function getSplash()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sPreviewUrl = BX_DOL_URL_ROOT . 'splash.php?preview=1';
        $sPreviewDialogId = $this->sSplashIframeId . '-fullscreen';

        $aForm = [
            'form_attrs' => [
                'id' => $this->sSplashFormId,
                'name' => $this->sSplashFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sSplashIframeId
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
                'landing_section' => [
                    'type' => 'block_header',
                    'name' => 'landing_section',
                    'caption' => _t('_adm_dsg_txt_splash_section_landing'),
                ],
                'landing_info' => [
                    'type' => 'custom',
                    'name' => 'landing_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_splash_section_landing')]),
                ],
                'enabled' => [
                    'type' => 'switcher',
                    'name' => 'enabled',
                    'caption' => _t('_adm_dsg_txt_splash_enable'),
                    'value' => 'on',
                    'checked' => getParam('sys_site_splash_enabled') == 'on',
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'code_section' => [
                    'type' => 'block_header',
                    'name' => 'code_section',
                    'caption' => _t('_adm_dsg_txt_splash_section_code'),
                ],
                'code_info' => [
                    'type' => 'custom',
                    'name' => 'code_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_splash_section_code')]),
                ],
                'code' => [
                    'type' => 'textarea',
                    'code' => true,
                    'name' => 'code',
                    'caption' => _t('_adm_dsg_txt_splash_code'),
                    'value' => getParam('sys_site_splash_code'),
                ],
                'code_tools' => [
                    'type' => 'custom',
                    'name' => 'code_tools',
                    'content' => $this->getCodeFullscreen('code', $this->sSplashEditorId . '-fullscreen', _t('_adm_dsg_txt_splash_section_code'), [
                        'preview_dialog_id' => $sPreviewDialogId,
                        'preview_frame_id' => $sPreviewDialogId . '-frame',
                        'preview_url' => $sPreviewUrl,
                    ]),
                ],
                'preview_section' => [
                    'type' => 'block_header',
                    'name' => 'preview_section',
                    'caption' => _t('_adm_dsg_txt_splash_section_preview'),
                ],
                'preview_info' => [
                    'type' => 'custom',
                    'name' => 'preview_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_splash_section_preview')]),
                ],
                'preview' => [
                    'type' => 'custom',
                    'name' => 'preview',
                    'content' => $oTemplate->parseHtmlByName('dsr_splash_preview.html', [
                        'js_object' => $this->getPageJsObject(),
                        'preview_url' => $sPreviewUrl,
                        'frame_id' => $this->sSplashIframeId . '-preview',
                        'dialog_id' => $sPreviewDialogId,
                        'dialog_frame_id' => $sPreviewDialogId . '-frame',
                    ]),
                ],
                'header_note' => [ // the warning under the sections, in a section of its own
                    'type' => 'block_header',
                ],
                'note' => [
                    'type' => 'custom',
                    'name' => 'note',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_note.html', [
                        'text' => _t('_adm_dsg_txt_splash_note'),
                        'bx_if:show_link' => [
                            'condition' => false,
                            'content' => []
                        ],
                    ]),
                ],
                'header_save' => [ // a section of its own for the Save button: the block footer (page.css) is that last section
                    'type' => 'block_header',
                ],
                'save' => [
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_adm_btn_settings_save'),
                ]
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitSplash($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_splash.html', [
                'splash_iframe_id' => $this->sSplashIframeId,
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode(),
        ]);
    }

    protected function getInjections()
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();

        $aForm = [
            'form_attrs' => [
                'id' => $this->sInjectionsFormId,
                'name' => $this->sInjectionsFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sInjectionsIframeId
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

        foreach(['head', 'body'] as $sPart) {
            $sField = 'sys_' . $sPart;
            $aForm['inputs'] += [
                $sPart . '_section' => [
                    'type' => 'block_header',
                    'name' => $sPart . '_section',
                    'caption' => _t('_adm_dsg_txt_inj_section_' . $sPart),
                ],
                $sPart . '_info' => [
                    'type' => 'custom',
                    'name' => $sPart . '_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_inj_section_' . $sPart)]),
                ],
                $sField => [
                    'type' => 'textarea',
                    'code' => true,
                    'name' => $sField,
                    'caption' => _t('_adm_dsg_txt_inj_' . $sPart),
                    'value' => $this->oDb->getInjection($sField),
                ],
                $sPart . '_tools' => [
                    'type' => 'custom',
                    'name' => $sPart . '_tools',
                    'content' => $this->getCodeFullscreen($sField, $this->sInjectionsEditorId . '-' . $sPart, _t('_adm_dsg_txt_inj_section_' . $sPart)),
                ],
            ];
        }

        $aForm['inputs'] += [
            'header_note' => [ // the warning under the sections, in a section of its own
                'type' => 'block_header',
            ],
            'note' => [
                'type' => 'custom',
                'name' => 'note',
                'content' => $oTemplate->parseHtmlByName('dsr_logo_note.html', [
                    'text' => _t('_adm_dsg_txt_inj_note'),
                    'bx_if:show_link' => [
                        'condition' => false,
                        'content' => []
                    ],
                ]),
            ],
            'header_save' => [ // a section of its own for the Save button: the block footer (page.css) is that last section
                'type' => 'block_header',
            ],
            'save' => [
                'type' => 'submit',
                'name' => 'save',
                'value' => _t('_adm_btn_settings_save'),
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitInjections($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_injections.html', [
                'splash_iframe_id' => $this->sInjectionsIframeId,
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    /**
     * "Edit in full screen" for a code field: the button under the editor and the dialog the editor moves into.
     * With $aPreview (preview_dialog_id, preview_frame_id, preview_url) the dialog can open the full-screen preview too.
     */
    protected function getCodeFullscreen($sField, $sDialogId, $sTitle, $aPreview = [])
    {
        $sJsObject = $this->getPageJsObject();

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('dsr_code_fullscreen.html', [
            'js_object' => $sJsObject,
            'field' => $sField,
            'dialog_id' => $sDialogId,
            'title' => $sTitle,
            'title_attr' => bx_html_attribute($sTitle),
            'bx_if:show_preview' => [
                'condition' => !empty($aPreview),
                'content' => array_merge(['js_object' => $sJsObject], $aPreview)
            ],
        ]);
    }

    protected function getPwa()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();
        $sJsObject = $this->getPageJsObject();
        $aPwa = BxDolDesigns::getPwaSettings();

        $aForm = [
            'form_attrs' => [
                'id' => $this->sPwaFormId,
                'name' => $this->sPwaFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sPwaIframeId
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
                'app_section' => [
                    'type' => 'block_header',
                    'name' => 'app_section',
                    'caption' => _t('_adm_dsg_txt_pwa_section_app'),
                ],
                'app_info' => [
                    'type' => 'custom',
                    'name' => 'app_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', [
                        'text' => _t('_adm_dsg_inf_pwa_section_app', BX_DOL_URL_STUDIO . 'designer.php?page=' . BX_DOL_STUDIO_DSG_TYPE_ICON)
                    ]),
                ],
            ]
        ];

        // Each manifest field: empty takes the default, which the field shows as its placeholder.
        $sPreviewJs = $sJsObject . '.updatePwaPreview(this.form);';
        foreach(['name' => 'text', 'short_name' => 'text', 'description' => 'textarea', 'background_color' => 'rgb', 'theme_color' => 'rgb'] as $sKey => $sType) {
            $aAttrs = [
                'placeholder' => $aPwa[$sKey]['default'],
                'oninput' => $sPreviewJs,
                'onchange' => $sPreviewJs,
            ];
            if($sType == 'textarea')
                $aAttrs['rows'] = 3;

            $aForm['inputs']['sys_pwa_manifest_' . $sKey] = [
                'type' => $sType,
                'name' => 'sys_pwa_manifest_' . $sKey,
                'caption' => _t('_adm_dsg_txt_pwa_' . $sKey),
                'info' => _t('_adm_dsg_inf_pwa_' . $sKey),
                'value' => $aPwa[$sKey]['value'],
                'attrs' => $aAttrs,
                'db' => ['pass' => 'Xss'],
            ];
        }

        $aForm['inputs'] += [
            'preview' => [
                'type' => 'custom',
                'name' => 'preview',
                'caption' => _t('_adm_dsg_txt_pwa_preview'),
                'content' => $this->getPwaPreview($aPwa),
            ],
            'sw_section' => [
                'type' => 'block_header',
                'name' => 'sw_section',
                'caption' => _t('_adm_dsg_txt_pwa_section_sw'),
            ],
            'sw_info' => [
                'type' => 'custom',
                'name' => 'sw_info',
                'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_pwa_section_sw')]),
            ],
            'sys_pwa_sw_enable' => [
                'type' => 'switcher',
                'name' => 'sys_pwa_sw_enable',
                'caption' => _t('_adm_dsg_txt_pwa_sw_enable'),
                'info' => _t('_adm_dsg_inf_pwa_sw_enable'),
                'value' => 'on',
                'checked' => getParam('sys_pwa_sw_enable') == 'on',
                'db' => ['pass' => 'Xss'],
            ],
            'sys_pwa_sw_offline' => [
                'type' => 'text',
                'name' => 'sys_pwa_sw_offline',
                'caption' => _t('_adm_dsg_txt_pwa_sw_offline'),
                'info' => _t('_adm_dsg_inf_pwa_sw_offline'),
                'value' => getParam('sys_pwa_sw_offline'),
                'attrs' => ['placeholder' => 'page.php?i=about'],
                'db' => ['pass' => 'Xss'],
            ],
            'sys_pwa_sw_cache' => [
                'type' => 'textarea',
                'name' => 'sys_pwa_sw_cache',
                'caption' => _t('_adm_dsg_txt_pwa_sw_cache'),
                'info' => _t('_adm_dsg_inf_pwa_sw_cache'),
                'value' => getParam('sys_pwa_sw_cache'),
                'attrs' => ['rows' => 4],
                'db' => ['pass' => 'Xss'],
            ],
            'header_note' => [ // the note under the sections, in a section of its own
                'type' => 'block_header',
            ],
            'note' => [
                'type' => 'custom',
                'name' => 'note',
                'content' => $oTemplate->parseHtmlByName('dsr_logo_note.html', [
                    'text' => _t('_adm_dsg_txt_pwa_note'),
                    'bx_if:show_link' => [
                        'condition' => false,
                        'content' => []
                    ],
                ]),
            ],
            'header_save' => [ // a section of its own for the Save button: the block footer (page.css) is that last section
                'type' => 'block_header',
            ],
            'save' => [
                'type' => 'submit',
                'name' => 'save',
                'value' => _t('_adm_btn_settings_save'),
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitPwa($oForm);
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_splash.html', [
                'splash_iframe_id' => $this->sPwaIframeId,
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    /**
     * How the installed app looks: its home screen icon, launch screen and window, with the values in use.
     * designer.js (updatePwaPreview) redraws it as the fields change.
     */
    protected function getPwaPreview($aPwa)
    {
        $sIconUrl = $this->getIconUrl('icon_android');
        if(empty($sIconUrl))
            $sIconUrl = $this->getIconDefaultUrl('android-icon-192.png');

        $sBackground = $aPwa['background_color']['used'];
        $sTheme = $aPwa['theme_color']['used'];

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('dsr_pwa_preview.html', [
            'js_object' => $this->getPageJsObject(),
            'icon_url' => $sIconUrl,
            'name' => bx_process_output($aPwa['name']['used']),
            'short_name' => bx_process_output($aPwa['short_name']['used']),
            'background' => bx_html_attribute($sBackground),
            'background_ink' => $this->getInkFor($sBackground),
            'theme' => bx_html_attribute($sTheme),
            'theme_ink' => $this->getInkFor($sTheme),
        ]);
    }

    protected function getSettings()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aForm = [
            'form_attrs' => [
                'id' => $this->sSettingsFormId,
                'name' => $this->sSettingsFormId,
                'action' => BX_DOL_URL_STUDIO . 'designer.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $this->sSettingsIframeId
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
                'template_section' => [
                    'type' => 'block_header',
                    'name' => 'template_section',
                    'caption' => _t('_adm_dsg_txt_settings_section_template'),
                ],
                'template_info' => [
                    'type' => 'custom',
                    'name' => 'template_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', ['text' => _t('_adm_dsg_inf_settings_section_template')]),
                ],
                'template' => [
                    'type' => 'custom',
                    'name' => 'template',
                    'content' => $this->getSettingsTemplates(),
                ],
                'layout_section' => [
                    'type' => 'block_header',
                    'name' => 'layout_section',
                    'caption' => _t('_adm_dsg_txt_settings_section_layout'),
                ],
                'layout_info' => [
                    'type' => 'custom',
                    'name' => 'layout_info',
                    'content' => $oTemplate->parseHtmlByName('dsr_logo_section_info.html', [
                        'text' => _t('_adm_dsg_inf_settings_section_layout', BX_DOL_URL_STUDIO . 'builder_page.php')
                    ]),
                ],
            ]
        ];

        foreach(['visitor', 'member'] as $sWho)
            $aForm['inputs']['sys_pt_default_' . $sWho] = [
                'type' => 'custom',
                'name' => 'sys_pt_default_' . $sWho,
                'content' => $this->getSettingsLayouts('sys_pt_default_' . $sWho, _t('_adm_dsg_txt_settings_layout_' . $sWho)),
            ];

        $aForm['inputs'] += [
            'header_note' => [ // the note under the sections, in a section of its own
                'type' => 'block_header',
            ],
            'note' => [
                'type' => 'custom',
                'name' => 'note',
                'content' => $oTemplate->parseHtmlByName('dsr_logo_note.html', [
                    'text' => _t('_adm_dsg_txt_settings_note'),
                    'bx_if:show_link' => [
                        'condition' => false,
                        'content' => []
                    ],
                ]),
            ],
            'header_save' => [ // a section of its own for the Save button: the block footer (page.css) is that last section
                'type' => 'block_header',
            ],
            'save' => [
                'type' => 'submit',
                'name' => 'save',
                'value' => _t('_adm_btn_settings_save'),
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitSettings();
            exit;
        }

        return $oTemplate->parseHtmlByName('designer.html', [
            'content' => $oTemplate->parseHtmlByName('dsr_splash.html', [
                'splash_iframe_id' => $this->sSettingsIframeId,
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    /**
     * The site template as a choice of cards: each enabled template with its Studio icon, the one in use checked.
     */
    protected function getSettingsTemplates()
    {
        $sCurrent = getParam('template');

        $aCards = [];
        foreach($this->getSettingsTemplateList() as $sUri => $aModule) {
            $sIcon = 'template/images/icons/std-icon.svg';
            $bIcon = file_exists(BX_DIRECTORY_PATH_MODULES . $aModule['path'] . $sIcon);

            $aCards[] = [
                'uri' => bx_html_attribute($sUri),
                'title' => bx_process_output($aModule['title']),
                'version' => bx_process_output($aModule['version']),
                'checked' => $sUri == $sCurrent ? 'checked="checked"' : '',
                'bx_if:show_icon' => [
                    'condition' => $bIcon,
                    'content' => ['icon_url' => BX_DOL_URL_MODULES . $aModule['path'] . $sIcon]
                ],
                'bx_if:show_letter' => [
                    'condition' => !$bIcon,
                    'content' => ['letter' => bx_process_output(get_mb_substr($aModule['title'], 0, 1))]
                ],
                'bx_if:show_current' => [
                    'condition' => $sUri == $sCurrent,
                    'content' => []
                ],
            ];
        }

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('dsr_settings_templates.html', [
            'bx_repeat:templates' => $aCards
        ]);
    }

    /**
     * A default page layout as a choice of cards: each layout with a sketch of where the header, menus and footer go.
     */
    protected function getSettingsLayouts($sName, $sCaption)
    {
        $iCurrent = (int)getParam($sName);

        $aCards = [];
        foreach($this->getSettingsLayoutList() as $iType => $aType)
            $aCards[] = [
                'name' => $sName,
                'value' => $iType,
                'slug' => $aType['slug'],
                'title' => _t($aType['title']),
                'info' => _t('_adm_dsg_inf_page_type_' . $aType['slug']),
                'checked' => $iType == $iCurrent ? 'checked="checked"' : '',
            ];

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('dsr_settings_layouts.html', [
            'caption' => $sCaption,
            'bx_repeat:layouts' => $aCards
        ]);
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
