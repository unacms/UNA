<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * The guest splash (Studio > Designer > Splash): what guests see on the home page, set per platform.
 *
 * The site shows `sys_site_splash_code` from splash.php when `sys_site_splash_enabled` is on. The apps (NEO web, iOS,
 * Android) ask for the home page through the page API (BxBasePage::getPageAPI), which says which client asks in
 * `X-Neo-Platform`. When that platform's switch is on, the page comes back with `layout: 'splash'` and a `splash`
 * object made here: `source: 'una'` and `code`, the platform's own code, else the shared code, prepared for the apps.
 *
 * A switch that was never saved (`''`) follows the older `sys_api_root_page_guest` option: `splash` is on.
 *
 * Code for the apps (see neo/AGENTS.md, "Guest splash"):
 * - The site's markers become placeholder elements, `<neo-slot name="..."></neo-slot>`, which the apps draw with
 *   their own components: `login_form` (`__login_form__`, `__login_form_in_box__`: the sign-in form with its social
 *   sign-in buttons and the Sign up link, as the site's form has them), `join_link` (`__join_form__`,
 *   `__join_form_in_box__`: the apps open Sign up rather than embed its form), `logo` (`__logo__`) and `illustration`
 *   (`__illustration__`). `social_login` (the social sign-in buttons alone) has no marker; write the element.
 * - `{site_title}` in text becomes `<neo-slot name="site_title">Site title</neo-slot>`, in attributes the plain title.
 * - `__join_link__` and `__login_link__` are the apps' own paths, `/create-account` and `/login`.
 * - Macros run as on the site. `<main>` becomes a `<div>` (the apps have their own). Scripts, inline event handlers and javascript: links are removed, and so are the
 *   elements that have a `data-site-only` attribute (the site page's own header and footer, which the apps draw
 *   themselves).
 */
class BxDolSplash extends BxDolFactory implements iBxDolSingleton
{
    /** The apps' platforms, as NEO names them in `X-Neo-Platform`. */
    public const PLATFORMS = ['web', 'ios', 'android'];

    public const PLATFORM_DEFAULT = 'web';

    /** What the apps draw in place of `<neo-slot name="...">`. */
    public const SLOTS = ['login_form', 'social_login', 'join_link', 'logo', 'site_title', 'illustration'];

    /** Elements with this attribute are left out of the apps' code. */
    public const ATTR_SITE_ONLY = 'data-site-only';

    /** Stands in for `{site_title}` until the code is parsed, so text and attributes can get different things. */
    protected const TOKEN_SITE_TITLE = 'bxsplashsitetitletoken';

    /** Elements the apps never get. */
    protected const TAGS_REMOVED = ['script', 'base', 'meta'];

    /** Elements an agent may not write: the site page shows the code as it is, to every guest. */
    protected const TAGS_UNSAFE = ['script', 'base', 'meta', 'link', 'iframe', 'object', 'embed'];

    /** Attributes that hold an address. */
    protected const ATTRS_URL = ['href', 'src', 'action', 'formaction', 'xlink:href', 'poster', 'background'];

    protected function __construct()
    {
        parent::__construct();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolSplash();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * The app that asks, from `X-Neo-Platform`; anything else (another client, a link preview) counts as the web app.
     */
    public static function getPlatformFromRequest()
    {
        $sPlatform = isset($_SERVER['HTTP_X_NEO_PLATFORM']) ? mb_strtolower(trim((string)$_SERVER['HTTP_X_NEO_PLATFORM'])) : '';
        return in_array($sPlatform, self::PLATFORMS, true) ? $sPlatform : self::PLATFORM_DEFAULT;
    }

    public static function isPlatform($sPlatform)
    {
        return in_array($sPlatform, self::PLATFORMS, true);
    }

    public static function getOptionEnabled($sPlatform)
    {
        return 'sys_site_splash_' . $sPlatform . '_enabled';
    }

    public static function getOptionCode($sPlatform)
    {
        return 'sys_site_splash_code_' . $sPlatform;
    }

    /**
     * Whether guests of the app see the splash on the home page: the app's switch (`on` or `off`), else, while it was
     * never saved, the older `sys_api_root_page_guest` option.
     */
    public function isEnabledForApp($sPlatform)
    {
        if(!self::isPlatform($sPlatform))
            $sPlatform = self::PLATFORM_DEFAULT;

        $sValue = getParam(self::getOptionEnabled($sPlatform));
        if($sValue === 'on')
            return true;
        if($sValue === 'off')
            return false;

        return getParam('sys_api_root_page_guest') == 'splash';
    }

    /**
     * The code an app shows as it is saved: its own code, else the shared code.
     */
    public function getCodeRawForApp($sPlatform)
    {
        if(!self::isPlatform($sPlatform))
            $sPlatform = self::PLATFORM_DEFAULT;

        $sCode = (string)getParam(self::getOptionCode($sPlatform));
        if(trim($sCode) === '')
            $sCode = (string)getParam('sys_site_splash_code');

        return $sCode;
    }

    /**
     * The `splash` object of the page API: `source: 'una'`, and `code` unless there is none.
     */
    public function getSplashAPI($sPlatform)
    {
        $aResult = ['source' => 'una'];

        $sCode = $this->getCodeRawForApp($sPlatform);
        if(trim($sCode) !== '' && ($sCode = $this->getCodeForApp($sCode)) !== '')
            $aResult['code'] = $sCode;

        return $aResult;
    }

    /**
     * Splash code prepared for the apps: markers to placeholders, macros run, scripts and handlers removed.
     */
    public function getCodeForApp($sCode)
    {
        if(trim($sCode) === '')
            return '';

        $oTemplate = BxDolTemplate::getInstance();

        $sLoginForm = $this->getSlot('login_form');
        $sJoinLink = $this->getSlot('join_link');
        $sCode = $oTemplate->parseHtmlByContent($sCode, [
            'logo' => $this->getSlot('logo'),
            'illustration' => $this->getSlot('illustration'),
            'login_form' => $sLoginForm,
            'login_form_in_box' => $sLoginForm,
            'join_form' => $sJoinLink,
            'join_form_in_box' => $sJoinLink,
            'join_link' => '/create-account',
            'login_link' => '/login',
        ]);

        $sCode = bx_process_macros($sCode);
        $sCode = bx_replace_markers($sCode, ['site_title' => self::TOKEN_SITE_TITLE]);

        return $this->cleanForApp($sCode, (string)getParam('site_title'));
    }

    /**
     * The site's illustration for `__illustration__`, the shapes NEO's built-in splash shows.
     */
    public function getIllustration()
    {
        return BxDolTemplate::getInstance()->parseHtmlByName('splash_illustration.html', []);
    }

    protected function getSlot($sName)
    {
        return BxDolTemplate::getInstance()->parseHtmlByName('splash_slot.html', ['name' => $sName]);
    }

    /**
     * Removes what the apps must not run or show, and puts the site title in.
     */
    protected function cleanForApp($sHtml, $sSiteTitle)
    {
        if(trim($sHtml) === '')
            return '';

        $oDoc = new DOMDocument('1.0', 'UTF-8');
        $oBody = $this->loadBody($oDoc, $sHtml);
        if(!$oBody)
            return '';

        $this->cleanNode($oDoc, $oBody, $sSiteTitle);

        $sResult = '';
        foreach($oBody->childNodes as $oChild)
            $sResult .= $oDoc->saveHTML($oChild);

        return trim($sResult);
    }

    protected function loadBody($oDoc, $sHtml)
    {
        $bErrors = libxml_use_internal_errors(true);

        // A whole document with its charset, so libxml reads the code as UTF-8 and keeps it all in the body.
        $sDocument = BxDolTemplate::getInstance()->parseHtmlByName('splash_document.html', ['content' => $sHtml]);
        $bLoaded = $sDocument !== '' && $oDoc->loadHTML($sDocument, LIBXML_NONET | LIBXML_HTML_NODEFDTD);

        libxml_clear_errors();
        libxml_use_internal_errors($bErrors);

        return $bLoaded ? $oDoc->getElementsByTagName('body')->item(0) : null;
    }

    /**
     * What an agent may not write in splash code: script elements, frames, inline handlers and script addresses.
     *
     * @return string[] one description per kind of problem; empty when the code is clean
     */
    public function findUnsafe($sCode)
    {
        if(trim($sCode) === '')
            return [];

        $oDoc = new DOMDocument('1.0', 'UTF-8');
        $oBody = $this->loadBody($oDoc, $sCode);
        if(!$oBody)
            return ['code that cannot be parsed'];

        $aFound = [];
        foreach($oBody->getElementsByTagName('*') as $oElement) {
            $sTag = mb_strtolower($oElement->nodeName);
            if(in_array($sTag, self::TAGS_UNSAFE, true))
                $aFound['<' . $sTag . '>'] = true;

            foreach($oElement->attributes as $oAttr) {
                $sName = mb_strtolower($oAttr->nodeName);
                if(strncmp($sName, 'on', 2) === 0 || $sName == 'srcdoc' || (in_array($sName, self::ATTRS_URL, true) && $this->isUnsafeUrl($oAttr->value)))
                    $aFound[$sName . ' attribute'] = true;
            }
        }

        return array_keys($aFound);
    }

    protected function cleanNode($oDoc, $oNode, $sSiteTitle)
    {
        // A copy: children are removed and replaced on the way.
        $aChildren = [];
        foreach($oNode->childNodes as $oChild)
            $aChildren[] = $oChild;

        $bRawText = $oNode instanceof DOMElement && in_array(mb_strtolower($oNode->nodeName), ['style', 'textarea', 'title'], true);

        foreach($aChildren as $oChild) {
            if($oChild instanceof DOMElement) {
                $sTag = mb_strtolower($oChild->nodeName);
                if(in_array($sTag, self::TAGS_REMOVED, true) || $oChild->hasAttribute(self::ATTR_SITE_ONLY)) {
                    $oNode->removeChild($oChild);
                    continue;
                }

                // The apps have a main landmark of their own, and a page has one.
                if($sTag == 'main')
                    $oChild = $this->renameElement($oDoc, $oChild, 'div');

                $this->cleanAttributes($oChild, $sSiteTitle);
                $this->cleanNode($oDoc, $oChild, $sSiteTitle);
            }
            elseif($oChild instanceof DOMComment) {
                $oNode->removeChild($oChild);
            }
            elseif($oChild instanceof DOMText && bx_mb_strpos($oChild->nodeValue, self::TOKEN_SITE_TITLE) !== false) {
                if($bRawText) {
                    $oChild->nodeValue = str_replace(self::TOKEN_SITE_TITLE, $sSiteTitle, $oChild->nodeValue);
                    continue;
                }

                // Text with the title in it: the text around it, and the title as a placeholder holding the title.
                $aParts = explode(self::TOKEN_SITE_TITLE, $oChild->nodeValue);
                foreach($aParts as $i => $sPart) {
                    if($i > 0) {
                        $oSlot = $oDoc->createElement('neo-slot');
                        $oSlot->setAttribute('name', 'site_title');
                        $oSlot->appendChild($oDoc->createTextNode($sSiteTitle));
                        $oNode->insertBefore($oSlot, $oChild);
                    }
                    if($sPart !== '')
                        $oNode->insertBefore($oDoc->createTextNode($sPart), $oChild);
                }
                $oNode->removeChild($oChild);
            }
        }
    }

    protected function renameElement($oDoc, $oElement, $sTag)
    {
        $oNew = $oDoc->createElement($sTag);
        foreach($oElement->attributes as $oAttr)
            $oNew->setAttribute($oAttr->nodeName, $oAttr->value);
        while($oElement->firstChild)
            $oNew->appendChild($oElement->firstChild);

        $oElement->parentNode->replaceChild($oNew, $oElement);
        return $oNew;
    }

    protected function cleanAttributes($oElement, $sSiteTitle)
    {
        $aRemove = [];
        $aSet = [];
        foreach($oElement->attributes as $oAttr) {
            $sName = mb_strtolower($oAttr->nodeName);
            if(strncmp($sName, 'on', 2) === 0 || $sName == 'srcdoc') {
                $aRemove[] = $oAttr->nodeName;
                continue;
            }

            if(in_array($sName, self::ATTRS_URL, true) && $this->isUnsafeUrl($oAttr->value)) {
                $aRemove[] = $oAttr->nodeName;
                continue;
            }

            if(bx_mb_strpos($oAttr->value, self::TOKEN_SITE_TITLE) !== false)
                $aSet[$oAttr->nodeName] = str_replace(self::TOKEN_SITE_TITLE, $sSiteTitle, $oAttr->value);
        }

        foreach($aRemove as $sName)
            $oElement->removeAttribute($sName);

        // setAttribute takes the value as it is (saveHTML escapes it); assigning DOMAttr::$value would parse entities.
        foreach($aSet as $sName => $sValue)
            $oElement->setAttribute($sName, $sValue);
    }

    /**
     * Script addresses (`javascript:`, `vbscript:`, `data:` other than images), however they are spaced or cased.
     */
    protected function isUnsafeUrl($sUrl)
    {
        $sUrl = mb_strtolower(preg_replace('/[\x00-\x20]+/', '', html_entity_decode((string)$sUrl, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
        if(strncmp($sUrl, 'javascript:', 11) === 0 || strncmp($sUrl, 'vbscript:', 9) === 0)
            return true;

        return strncmp($sUrl, 'data:', 5) === 0 && strncmp($sUrl, 'data:image/', 11) !== 0;
    }
}

/** @} */
