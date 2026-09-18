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
    /**
     * Studio draws a block's title icon as an inline Lucide SVG (like its menus), whatever the site's default iconset is.
     */
    public function designBoxContent ($sTitle, $sContent, $iTemplateNum = BX_DB_DEF, $mixedMenu = false, $mixedButtons = [])
    {
        if(is_array($sTitle) && !empty($sTitle[2]) && preg_match('/^[a-z0-9-]+$/', $sTitle[2]) && ($oIconset = BxDolIconset::getObjectInstance('sys_lucide')) && ($sSvg = $oIconset->getIconHtml($sTitle[2])) !== false)
            $sTitle[2] = $sSvg;

        return parent::designBoxContent($sTitle, $sContent, $iTemplateNum, $mixedMenu, $mixedButtons);
    }

    /**
     * A Studio block may hand the caption ready-made markup (a segmented switcher, say) instead of a menu object.
     */
    public function designBoxMenu ($mixedMenu, $mixedButtons = [])
    {
        if(is_string($mixedMenu) && strncmp(ltrim($mixedMenu), '<', 1) === 0)
            return $mixedMenu;

        return parent::designBoxMenu($mixedMenu, $mixedButtons);
    }

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

        $sCaption = _t($mixedWidget['caption']);

        $aTmplVarsActionsLeft = $aTmplVarsActionsRight = [];
        if(!empty($mixedWidget['cnt_actions'])) {
            $aService = unserialize($mixedWidget['cnt_actions']);
            $aActions = bx_srv_ii($aService['module'], $aService['method'], array_merge(array($mixedWidget), $aService['params']), $aService['class']);

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

                if($bActionIcon)
                    $sActionIconHtml = '<i class="sys-icon ' . $sActionIcon . '" aria-hidden="true"></i>';
                else if($bActionIconInline)
                    $sActionIconHtml = $sActionIcon;
                else
                    $sActionIconHtml = '<img src="' . $sActionIcon . '" alt="" />';

                /*
                 * A control with a URL is a link, one that only runs a script is a button. Every widget has a control with the
                 * same caption (Settings), so the accessible name adds the app it belongs to.
                 */
                $sActionCaption = _t($aAction['caption']);
                $bActionLink = !empty($aAction['url']);

                $aTmplVarsControl = [
                    'name' => !empty($aAction['name']) ? $aAction['name'] : $mixedWidget['id'] . '-' . $iIndex,
                    'url' => $bActionLink ? bx_replace_markers($aAction['url'], $aMarkers) : '',
                    'onclick' => !empty($aAction['click']) ? 'onclick="' . bx_html_attribute($aAction['click']) . '"' : '',
                    'caption' => bx_html_attribute($sActionCaption),
                    'label' => bx_html_attribute(_t('_adm_txt_widget_action_label', $sActionCaption, $sCaption)),
                    'icon' => $sActionIconHtml,
                ];

                $aTmplVarsAction = [
                    'action' => $oTemplate->parseHtmlByName('widget_action.html', [
                        'bx_if:show_link' => ['condition' => $bActionLink, 'content' => $aTmplVarsControl],
                        'bx_if:show_button' => ['condition' => !$bActionLink, 'content' => $aTmplVarsControl],
                    ]),
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
            // right-click (or a long press) on the tile opens the app's context menu, fetched from its page on first use
            'bx_if:show_context_menu' => array(
                'condition' => !empty($mixedWidget['page_name']),
                'content' => array(
                    'page' => !empty($mixedWidget['page_name']) ? $mixedWidget['page_name'] : '',
                    'id' => (int)$mixedWidget['id'],
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
            'bx_repeat:actions_right' => $aTmplVarsActionsRight,
            'move_left' => bx_html_attribute(_t('_adm_txt_widget_move_left', $sCaption)),
            'move_right' => bx_html_attribute(_t('_adm_txt_widget_move_right', $sCaption)),
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
            $sResult .= $this->transBox('bx-std-pcap-menu-popup-account', ['content' => $oAccounMenu->getCode(), 'wrapper_attrs' => 'aria-label="' . bx_html_attribute(_t('_adm_tmi_cpt_account')) . '"'], true);

        return $sResult;
    }
}

/** @} */
