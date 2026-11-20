<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Informer representation.
 * @see BxDolInformer
 */
class BxBaseInformer extends BxDolInformer
{
    protected $_bJsCssAdded = false;

    protected $_oTemplate;

    protected $_aMapType2Class = [
        BX_INFORMER_ALERT => 'bx-informer-msg-alert',
        BX_INFORMER_INFO => 'bx-informer-msg-info',
        BX_INFORMER_ERROR => 'bx-informer-msg-error',
    ];

    protected $_aMapType2Icon = [
        BX_INFORMER_ALERT => 'exclamation-triangle',
        BX_INFORMER_INFO => 'info-circle',
        BX_INFORMER_ERROR => 'times-circle',
    ];

    /**
     * Iconset used to render indicator icons as inline SVG regardless of the site's default iconset.
     * When it isn't available (or has no such icon) a font icon of the default iconset is used.
     */
    protected $_sIconset = 'sys_lucide';

    public function __construct ($oTemplate)
    {
        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        parent::__construct ();
    }

    /**
     * Display Informer.
     */
    public function display ()
    {
    	if(!$this->_bEnabled)
            return '';

        // "Accounts without a profile" set to "Ask after sign-in": the first page after sign-in opens the "Create your
        // profile" window, and the informer leaves out its own "create a profile" message under it.
        $sProfilePrompt = !bx_is_api() ? $this->_getProfilePrompt() : '';
        if ($sProfilePrompt)
            $this->remove('sys-account-profile-system');

        if (!$this->_aMessages)
            return $sProfilePrompt;

        $oIconset = BxDolIconset::getObjectInstance($this->_sIconset, $this->_oTemplate);

        $aMessages = [];
        foreach ($this->_aMessages as $a)
            $aMessages[] = array_merge($a, [
                'class' => $this->_aMapType2Class[$a['type']],
                'icon' => !empty($a['icon']) ? $a['icon'] : $this->_aMapType2Icon[$a['type']],
            ]);

        if (bx_is_api())
            return array_map(function($a) use($oIconset) {
                // API clients (NEO) render Lucide icons natively, so send the Lucide name.
                return array_merge($a, [
                    'icon' => $oIconset ? $oIconset->getIcon($a['icon']) : $a['icon'],
                ]);
            }, $aMessages);

        $this->_addJsCss();

        return $this->_oTemplate->parseHtmlByName('informer.html', [
            'bx_repeat:messages' => array_map(function($a) use($oIconset) {
                $sIconHtml = $oIconset ? $oIconset->getIconHtml($a['icon']) : false;

                return array_merge($a, [
                    'bx_if:icon_html' => [
                        'condition' => $sIconHtml !== false,
                        'content' => [
                            'icon_html' => $sIconHtml,
                        ],
                    ],
                    'bx_if:icon_font' => [
                        'condition' => $sIconHtml === false,
                        'content' => [
                            'icon' => $a['icon'],
                        ],
                    ],
                    'bx_if:action' => [
                        'condition' => !empty($a['action_url']) && !empty($a['action_title']),
                        'content' => [
                            'action_url' => bx_html_attribute($a['action_url']),
                            'action_title' => $a['action_title'],
                        ],
                    ],
                ]);
            }, $aMessages),
        ]);
    }

    /**
     * The "Create your profile" window: the profile types of the `sys_add_profile` menu, as on the account's profile
     * switcher, in a popup that opens with the page. Not on the account's own pages or a profile creation page, where
     * the account already is, nor on a page that isn't shown as one (the "Please wait" page that sign-in relocates
     * through, a popup, an embed), nor in an answer the browser didn't ask as a page (a missing favicon or image is
     * answered with the "not found" page): it is shown on the next page instead.
     */
    protected function _getProfilePrompt()
    {
        if (in_array($this->_oTemplate->getPageNameIndex(), [BX_PAGE_TRANSITION, BX_PAGE_POPUP, BX_PAGE_EMBED, BX_PAGE_CLEAR]))
            return '';

        if (isset($_SERVER['HTTP_ACCEPT']) && bx_mb_strpos($_SERVER['HTTP_ACCEPT'], 'text/html') === false)
            return '';

        if (!BxDolAccount::isProfilePromptDue())
            return '';

        $sPageUri = (string)bx_get('i');
        if (strncmp($sPageUri, 'account-', 8) === 0 || in_array($sPageUri, BxDolPage::getProfileCreationPages(), true))
            return '';

        BxDolAccount::setProfilePromptSeen();

        $oMenu = BxDolMenu::getObjectInstance('sys_add_profile', $this->_oTemplate);
        $sMenu = $oMenu ? $oMenu->getCode() : '';
        if (!$sMenu)
            return '';

        $sPopupId = 'sys-account-profile-prompt';
        return BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->popupBox($sPopupId, _t('_sys_page_block_title_account_profile_create'), $this->_oTemplate->parseHtmlByName('account_profile_prompt.html', [
            'popup_id' => $sPopupId,
            'text' => _t('_sys_page_block_desc_account_profile_create'),
            'menu' => $sMenu,
        ]), true);
    }

    /**
     * Add css/js files which are needed for display and functionality.
     */
    protected function _addJsCss()
    {
        if ($this->_bJsCssAdded)
            return;

        $this->_oTemplate->addCss(['informer.css']);

        $this->_bJsCssAdded = true;
    }
}

/** @} */
