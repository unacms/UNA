<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioFunctions extends BxBaseFunctions implements iBxDolSingleton
{
    function __construct($oTemplate = false)
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct($oTemplate ? $oTemplate : BxDolStudioTemplate::getInstance());
    }

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses']['BxBaseStudioFunctions']))
            $GLOBALS['bxDolClasses']['BxBaseStudioFunctions'] = new BxTemplStudioFunctions();

        return $GLOBALS['bxDolClasses']['BxBaseStudioFunctions'];
    }

    public function getLogo()
    {
        return bx_idn_to_utf8(BX_DOL_URL_ROOT, true);
    }

    public function getLoginForm()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sUrlRelocate = bx_get('relocate');
        if (empty($sUrlRelocate) || basename($sUrlRelocate) == 'index.php')
            $sUrlRelocate = '';

        $sHtml = $oTemplate->parseHtmlByName('login_form.html', array (
            'role' => BX_DOL_ROLE_ADMIN,
            'csrf_token' => BxDolForm::getCsrfToken(),
            'relocate_url' => bx_html_attribute($sUrlRelocate),
            'action_url' => BX_DOL_URL_ROOT . 'member.php',
            'forgot_password_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password')),
        ));
        $sHtml = $oTemplate->parseHtmlByName('login.html', array (
            'form' => $this->transBox('bx-std-login-form-box', $sHtml, true),
        ));

        $oTemplate->setPageNameIndex(BX_PAGE_CLEAR);
        $oTemplate->setPageParams(array(
           'css_name' => array('forms.css', 'login.css'),
           'js_name' => array('jquery-ui/jquery-ui.min.js', 'jquery.form.min.js', 'jquery.dolPopup.js', 'login.js'),
           'header' => _t('_adm_page_cpt_login'),
        ));
        $oTemplate->setPageContent ('page_main_code', $sHtml);
        $oTemplate->getPageCode();
    }

    public function getWidget($mixedWidget, $aParams = array())
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aNotices = array();
        if(!empty($aParams['notices']) && is_array($aParams['notices']))
            $aNotices = $aParams['notices'];           

        $aMarkers = array(
            'url_root' => BX_DOL_URL_ROOT,
            'url_studio' => BX_DOL_URL_STUDIO,
            'url_studio_icons' => BX_DOL_URL_STUDIO_BASE . 'images/icons/'
        );

        if(!is_array($mixedWidget)) 
            $mixedWidget = BxDolStudioWidgetsQuery::getInstance()->getWidgets(array('type' => 'by_id', 'value' => (int)$mixedWidget));

        if(!empty($mixedWidget['type']) && !BxDolStudioRolesUtils::getInstance()->isActionAllowed('use ' . $mixedWidget['type']))
            return '';

        $aTmplVarsActions = array();
        if(!empty($mixedWidget['cnt_actions'])) {
            $aService = unserialize($mixedWidget['cnt_actions']);
            $aActions = bx_srv_ii($aService['module'], $aService['method'], array_merge(array($mixedWidget), $aService['params']), $aService['class']);

            $aTmplVarsActionsLeft = $aTmplVarsActionsRight = [];
            foreach($aActions as $iIndex => $aAction) {
                if(!empty($aAction['check_func'])) {
                    $sCheckFunc = bx_gen_method_name($aAction['check_func']);
                    if(method_exists($this, $sCheckFunc) && !$this->$sCheckFunc($mixedWidget))
                        continue;
                }

                $sActionIcon = $aAction['icon'];
                $bActionIcon = strpos($sActionIcon, '.') === false;

                $bActionIconInline = !$bActionIcon;
                if($bActionIconInline && ($sActionIcon = $oTemplate->getIconContent($sActionIcon)) === false) {
                    $sActionIcon = $oTemplate->getIconUrl($sActionIcon);
                    $bActionIconInline = false;
                }

                $sCaption = _t($aAction['caption']);
                $aTmplVarsAction = [
                    'name' => !empty($aAction['name']) ? $aAction['name'] : $sPage . '-' . $iIndex,
                    'caption' => $sCaption,
                    'url' => !empty($aAction['url']) ? bx_replace_markers($aAction['url'], $aMarkers) : 'javascript:void(0)',
                    'bx_if:show_click' => [
                        'condition' => !empty($aAction['click']),
                        'content' => [
                            'content' => 'javascript:' . $aAction['click'],
                        ]
                    ],
                    'bx_if:action_icon' => [
                        'condition' => $bActionIcon,
                        'content' => ['name' => $sActionIcon, 'caption' => $sCaption],
                    ],
                    'bx_if:action_image' => [
                        'condition' => !$bActionIcon && !$bActionIconInline,
                        'content' => ['url' => $sActionIcon, 'caption' => $sCaption],
                    ],
                    'bx_if:action_image_inline' => [
                        'condition' => !$bActionIcon && $bActionIconInline,
                        'content' => ['content' => $sActionIcon],
                    ],
                ];

                if(in_array($aAction['name'], ['settings']))
                    $aTmplVarsActionsLeft[] = $aTmplVarsAction;
                else
                    $aTmplVarsActionsRight[] = $aTmplVarsAction;
            }
        }

        $sIcon = BxDolStudioUtils::getWidgetIcon($mixedWidget);
        $bIcon = strpos($sIcon, '.') === false && strcmp(substr($sIcon, 0, 10), 'data:image') != 0;

        $sNotices = !empty($aNotices[$mixedWidget['id']]) ? $aNotices[$mixedWidget['id']] : '';

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($mixedWidget['module']);
        $bEnabled = empty($aModule) || !is_array($aModule) || (int)$aModule['enabled'] == 1;

        $sCaption = _t($mixedWidget['caption']);

        $sStyles = 'animation-delay: -.' . rand(1 , 75) . 's; animation-duration: .' . rand(15 , 20) . 's';

        return $oTemplate->parseHtmlByName('widget.html', array(
            'id' => $mixedWidget['id'],
            'name' => strtolower($sCaption),
            'url' => !empty($mixedWidget['url']) ? bx_replace_markers($mixedWidget['url'], $aMarkers) : 'javascript:void(0)',
            'bx_if:show_click_icon' => array(
                'condition' => !empty($mixedWidget['click']),
                'content' => array(
                    'content' => 'javascript:' . $mixedWidget['click'],
                )
            ),
            'bx_if:show_click_link' => array(
                'condition' => !empty($mixedWidget['click']),
                'content' => array(
                    'content' => 'javascript:' . $mixedWidget['click'],
                )
            ),
            'bx_if:show_notice' => array(
                'condition' => !empty($sNotices),
                'content' => array(
                    'content' => $sNotices
                )
            ),
            'bx_if:show_actions_left' => array(
                'condition' => !empty($aTmplVarsActionsLeft),
                'content' => array(
                    'bx_repeat:actions' => $aTmplVarsActionsLeft,
                )
            ),
            'bx_if:show_actions_right' => array(
                'condition' => !empty($aTmplVarsActionsRight),
                'content' => array(
                    'bx_repeat:actions' => $aTmplVarsActionsRight,
                )
            ),
            'bx_if:icon' => array (
                'condition' => $bIcon,
                'content' => array('icon' => $sIcon),
            ),
            'bx_if:image' => array (
                'condition' => !$bIcon,
                'content' => array('icon_url' => $sIcon),
            ),
            'caption' => $sCaption,
            'caption_attr' => bx_html_attribute($sCaption),
            'widget_disabled_class' => !$bEnabled ? 'bx-std-widget-icon-disabled' : '',
            'widget_styles' => $sStyles
        ));
    }

    /*
     * Note. For multi upload form field add [] at the end of the field name in $mParams parameter.
     */
    public function getDefaultGhostTemplate($mParams, $sTemplateName = 'form_ghost_template.html') 
    {
        if (!is_array($mParams))
            $mParams = ['name' => $mParams];

        return BxDolStudioTemplate::getInstance()->parseHtmlByName($sTemplateName, $mParams);
    }

    protected function getInjHeadLiveUpdates() 
    {
        return '';
    }

    protected function getInjFooterPopupMenus() 
    {
        $sResult = '';

        $oAccounMenu = BxDolMenu::getObjectInstance('sys_studio_account_popup');
        if($oAccounMenu)
            $sResult .= $this->transBox('bx-std-pcap-menu-popup-account', $oAccounMenu->getCode(), true);

        return $sResult;
    }
}

/** @} */
