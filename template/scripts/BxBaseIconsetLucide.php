<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Basic Lucide iconset representation.
 * @see BxDolIconset
 */
class BxBaseIconsetLucide extends BxBaseIconset
{
    /**
     * Where the page's code (getCode) takes the drawings of the page's icons (fillPageIcons).
     */
    const PAGE_ICONS = '{/*bx-iconset-lucide-page-icons*/}';

    /**
     * Brand marks (template/images/brands, from Simple Icons), named `brand-<name>`: Lucide draws no brands. Share
     * buttons and Connect sign-in buttons use them.
     */
    public static $aBrands = ['drupal', 'facebook', 'google', 'linkedin', 'pinterest', 'whatsapp', 'x'];

    /**
     * Classes in an icon code that are not its name: Font Awesome's styles and sizes, and the icon's own classes.
     * Colours (`col-red1`) are skipped as well.
     */
    protected static $_aCodeClasses = ['fa', 'fas', 'far', 'fab', 'fa-fw', 'sys-icon', 'sys-icon-bigger', 'sys-colored'];

    protected $_aMap;
    protected static $_aCacheSvg = [];

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        /**
         * Font Awesome names and the Lucide icons (or brand marks) they draw. UNA's own data and templates name
         * Lucide icons (IconsNamesTest checks them), so the map is for icon codes that come from elsewhere:
         * third-party modules, Market data, an operator's older settings.
         */
        $this->_aMap = [
            'ad' => 'circle-star',
            'address-book' => 'contact-round',
            'address-card' => 'id-card',
            'adjust' => 'eclipse',
            'angle-double-down' => 'chevrons-down',
            'angle-double-left' => 'chevrons-left',
            'angle-double-right' => 'chevrons-right',
            'angle-double-up' => 'chevrons-up',
            'angle-down' => 'chevron-down',
            'angle-left' => 'chevron-left',
            'angle-right' => 'chevron-right',
            'angle-up' => 'chevron-up',
            'arrows-alt' => 'move',
            'arrows-alt-v' => 'chevrons-up-down', // the profile switcher's button (profile_avatar.html, profile_stats.html)
            'bars' => 'menu',
            'battery-empty' => 'battery',
            'battery-half' => 'battery-medium',
            'book-reader' => 'book-open-text',
            'buffer' => 'layers',
            'bullhorn' => 'megaphone',
            'calendar-alt' => 'calendar-days',
            'calendar-day' => 'calendar-days',
            'camera-retro' => 'camera',
            'caret-down' => 'chevron-down',
            'caret-left' => 'chevron-left',
            'caret-right' => 'chevron-right',
            'caret-up' => 'chevron-up',
            'cart-arrow-down' => 'shopping-cart',
            'cart-plus' => 'shopping-cart',
            'cc-stripe' => 'credit-card',
            'certificate' => 'award',
            'check-circle' => 'circle-check',
            'check-double' => 'check-check',
            'cog' => 'settings',
            'cogs' => 'settings',
            'cube' => 'box',
            'comment' => 'message-circle',
            'comment-alt' => 'message-square',
            'comment-dots' => 'message-square-dashed',
            'comments' => 'messages-square',
            'compress' => 'shrink',
            'desktop' => 'monitor',
            'donate' => 'hand-coins',
            'drupal' => 'brand-drupal',
            'ellipsis-h' => 'ellipsis',
            'ellipsis-v' => 'ellipsis-vertical',
            'envelope' => 'mail',
            'envelope-open' => 'mail-open',
            'envelope-open-text' => 'mail-open',
            'exchange-alt' => 'repeat',
            'exclamation-circle' => 'circle-alert',
            'exclamation-triangle' => 'triangle-alert',
            'eye-slash' => 'eye-closed',
            'fa-book' => 'book-text',
            'fa-bookmark' => 'bookmark',
            'fa-certificate' => 'badge',
            'fa-check-circle' => 'circle-check', 
            'fa-grip-horizontal' => 'layout-grid',
            'fa-smile' => 'smile',
            'fa-thumbs-up' => 'thumbs-up',
            'facebook' => 'brand-facebook',
            'facebook-f' => 'brand-facebook',
            'facebook-square' => 'brand-facebook',
            'file-alt' => 'file-text',
            'file-import' => 'file-input',
            'file-export' => 'file-output',
            'file-invoice' => 'receipt',
            'file-pdf' => 'file-text',
            'file-word' => 'file-text',
            'file-excel' => 'file-spreadsheet',
            'file-powerpoint' => 'file-chart-pie',
            'fire' => 'flame',
            'group' => 'users',
            'google' => 'brand-google',
            'hand-holding' => 'hand-helping',
            'hand-holding-usd' => 'hand-coins',
            'hashtag' => 'hash',
            'helpcircle' => 'circle-question-mark',
            'industry' => 'factory',
            'info-circle' => 'info',
            'keyround' => 'key-round',
            'language' => 'languages',
            'list-alt' => 'list',
            'linkedin' => 'brand-linkedin',
            'linkedin-in' => 'brand-linkedin',
            'list-ul' => 'list',
            'location-arrow' => 'navigation',
            'lockopen' => 'lock-open',
            'mail-bulk' => 'mails',
            'map-marker' => 'map-pin',
            'map-marker-alt' => 'map-pin',
            'money-check-alt' => 'wallet-cards',
            'money-bill-alt' => 'banknote',
            'object-group' => 'layout-dashboard',
            'paint-brush' => 'paintbrush',
            'pencil-alt' => 'pencil-line',
            'pencil-ruler' => 'ruler',
            'photo-video' => 'image-play',
            'pinterest' => 'brand-pinterest',
            'pinterest-p' => 'brand-pinterest',
            'plus-circle' => 'circle-plus',
            'minus-circle' => 'circle-minus',
            'qrcode' => 'qr-code',
            'question' => 'circle-question-mark',
            'question-circle' => 'circle-question-mark',
            'quote-right' => 'quote',
            'remove' => 'x',
            'robot' => 'bot',
            'search-location' => 'search-check',
            'share-alt' => 'share-2',
            'shield-alt' => 'shield',
            'sign-in-alt' => 'log-in',
            'sign-out-alt' => 'log-out',
            'star-half-o' => 'star-half',
            'stopwatch' => 'timer',
            'swatchbook' => 'swatch-book',
            'sync' => 'refresh-ccw',
            'sync-alt' => 'refresh-ccw',
            'tachometer-alt' => 'gauge',
            'tasks' => 'square-check',
            'th-large' => 'grid-2x2',
            'thumbtack' => 'pin',
            'times' => 'x',
            'times-circle' => 'circle-x',
            'toolbox' => 'tool-case',
            'trash2' => 'trash-2',
            'twitter' => 'brand-x',
            'unlock-alt' => 'lock-open',
            'user' => 'user-round',
            'user-friends' => 'users',
            'user-plus' => 'user-round-plus',
            'user-secret' => 'user-key',
            'user-slash' => 'user-x',
            'user-shield' => 'user-shield', // Lucide has it now; keep the entry so the name is not remapped by a later rule
            'user-tag' => 'user-star',
            'user-check' => 'user-round-check',
            'arrow-circle-right' => 'circle-arrow-right',
            'calendar-times' => 'calendar-x',
            'user-times' => 'user-round-x',
            'user-circle' => 'circle-user-round',
            'users' => 'users-round',
            'video-camera' => 'video',
            'whatsapp' => 'brand-whatsapp',
            'world' => 'globe',
            'x-twitter' => 'brand-x',
            'volume-up' => 'volume-2',
            'volume-down' => 'volume-1',
            'volume-mute' => 'volume-x',
            'at' => 'at-sign',
            'backspace' => 'delete',
            'trash-alt' => 'trash',
            'magic' => 'wand-sparkles',
        ];
    }

    /**
     * The icons' styles: the room an icon takes before its script has drawn it.
     */
    public function getPreloaderCss()
    {
        return 'icons_lucide.css';
    }

    /**
     * The set has no script to load: the page's code draws its icons (getCode).
     */
    public function getPreloaderJs()
    {
        return false;
    }

    public function getIcon($sIcon)
    {
        return bx_gen_method_name($this->_getIconName($sIcon), ['_', '-']);
    }

    public function getIconHtml($sIcon, $aAttrs = [])
    {
        $sSvg = $this->getSvg($this->_getIconName($sIcon));
        if($sSvg === false)
            return false;

        $sClass = 'sys-icon';
        if(!empty($aAttrs['class']))
            $sClass .= ' ' . $aAttrs['class'];
        unset($aAttrs['class']);

        $sAttrs = '';
        foreach($aAttrs as $sKey => $sValue)
            $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

        return preg_replace('/^<svg class="/', '<svg' . $sAttrs . ' class="' . bx_html_attribute($sClass) . ' ', $sSvg, 1);
    }

    /**
     * The Lucide icon an icon code of the site draws (a Lucide name, or a Font Awesome one this
     * set maps, with or without its classes: `shield-alt`, `fas fa-star col-red`), or the brand
     * mark it draws (`brand-x`); false when it names neither (an image, an emoji, HTML, an
     * unknown name).
     */
    public function getLucideName($sIcon)
    {
        $sIcon = trim((string)$sIcon);
        if($sIcon === '' || !preg_match('/^[a-z0-9\s_-]+$/i', $sIcon))
            return false;

        $sName = $this->_getIconName($sIcon);

        return ($sPath = $this->_getSvgPath($sName)) && file_exists($sPath) ? $sName : false;
    }

    /**
     * Whether a name is one of the brand marks (brand-x).
     */
    public static function isBrandName($sName)
    {
        return strncmp($sName, 'brand-', 6) === 0 && in_array(substr($sName, 6), self::$aBrands, true);
    }

    /**
     * The name in an icon code: its first class that is not a Font Awesome style or size, a colour (`col-red1`) or
     * a class of UNA's own (`bx-`, `sys-`); in a class list with `sys-icon`, the first after it.
     * `far file-alt col-red1` and `bx-std-star sys-icon star` name `file-alt` and `star`.
     * A PascalCase name (getIcon's, which the apps take) is taken in kebab case: `UserRoundKey` names `user-round-key`.
     */
    public static function getCodeName($sIcon)
    {
        // a PascalCase name (getIcon, which the apps take) is the kebab-case one: UserRoundKey, Grid2x2
        $aParts = array_map(function($s) {
            return preg_match('/[A-Z]/', $s) ? mb_strtolower(preg_replace(['/([a-z])([A-Z0-9])/', '/([0-9])([A-Z])/'], '$1-$2', $s)) : mb_strtolower($s);
        }, preg_split('/\s+/', trim((string)$sIcon)));
        if(($iPos = array_search('sys-icon', $aParts, true)) !== false)
            $aParts = array_slice($aParts, $iPos + 1);

        foreach($aParts as $sPart)
            if($sPart !== '' && !in_array($sPart, self::$_aCodeClasses, true) && !preg_match('/^(col|bx|sys)-/', $sPart))
                return $sPart;

        return '';
    }

    /**
     * Get Lucide icon name (kebab-case) by Font Awesome or Lucide icon name: a name the map has is
     * mapped, with or without Font Awesome's `fa-` prefix; any other name is kept.
     */
    protected function _getIconName($sIcon)
    {
        $sName = self::getCodeName($sIcon);
        if(isset($this->_aMap[$sName]))
            return $this->_aMap[$sName];

        if(strncmp($sName, 'fa-', 3) === 0) {
            $sBare = mb_substr($sName, 3);
            if(isset($this->_aMap[$sBare]))
                return $this->_aMap[$sBare];
            if(($sPath = $this->_getSvgPath($sBare)) && file_exists($sPath))
                return $sBare;
        }

        return $sName;
    }

    /**
     * The file of a Lucide icon or a brand mark, false for a name that can be neither.
     */
    protected function _getSvgPath($sName)
    {
        if(!preg_match('/^[a-z0-9-]+$/', $sName))
            return false;

        if(self::isBrandName($sName))
            return BX_DIRECTORY_PATH_ROOT . 'template/images/brands/' . substr($sName, 6) . '.svg';

        return BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'lucide/icons/' . $sName . '.svg';
    }

    /**
     * The drawing of an icon as the page's script takes it: the SVG of the file, false when there is none.
     */
    public function getSvg($sName)
    {
        if(!array_key_exists($sName, self::$_aCacheSvg)) {
            $sPath = $this->_getSvgPath($sName);

            $sSvg = $sPath && file_exists($sPath) ? file_get_contents($sPath) : false;
            if($sSvg !== false) {
                $sSvg = preg_replace('/<!--.*?-->/s', '', $sSvg);
                $sSvg = trim(preg_replace('/\s+/', ' ', $sSvg));
                $sSvg = str_replace(' />', '/>', $sSvg);
            }

            self::$_aCacheSvg[$sName] = $sSvg;
        }

        return self::$_aCacheSvg[$sName];
    }

    /**
     * The drawings of the icons a page's HTML names (`class="sys-icon ..."`), by name, for the page's script: it draws
     * them at once, and loads the drawing of an icon that comes later (a popup, a list's next page) from its file.
     */
    public function getPageIcons($sHtml)
    {
        $aResult = [];
        if(!preg_match_all('/class=(["\'])([^"\']*\bsys-icon\b[^"\']*)\1/', $sHtml, $aMatches))
            return $aResult;

        foreach(array_unique($aMatches[2]) as $sClasses) {
            $sName = $this->_getIconName($sClasses);
            if($sName === '' || isset($aResult[$sName]))
                continue;

            if(($sSvg = $this->getSvg($sName)) !== false)
                $aResult[$sName] = $sSvg;
        }

        return $aResult;
    }

    /**
     * Put the drawings of the icons the page names into its script (getCode). The template calls it with the page's
     * HTML before the page goes out (BxDolTemplate::getPageCode).
     */
    public function fillPageIcons($sHtml)
    {
        if(strpos($sHtml, self::PAGE_ICONS) === false)
            return $sHtml;

        $sJson = json_encode((object)$this->getPageIcons($sHtml), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);

        return str_replace(self::PAGE_ICONS, $sJson, $sHtml);
    }

    public function getCode()
    {
        $sMap = json_encode($this->_aMap);
        $sCodeClasses = json_encode(self::$_aCodeClasses);
        $sBrands = json_encode(self::$aBrands);
        $sRev = json_encode((string)getParam('sys_revision'));
        $sUrlIcons = json_encode(BX_DOL_URL_PLUGINS_PUBLIC . 'lucide/icons/', JSON_UNESCAPED_SLASHES);
        $sUrlBrands = json_encode(BX_DOL_URL_ROOT . 'template/images/brands/', JSON_UNESCAPED_SLASHES);
        $sPageIcons = self::PAGE_ICONS;

        $sCode = <<<BLAH
        (function() {
            // the drawings of the icons the page names; others load from their files when they come
            const oSvgs = $sPageIcons;
            const aMap = $sMap;
            const aCodeClasses = $sCodeClasses;
            const aBrands = $sBrands;
            const oLoading = {};

            const getName = function(el) {
                // a PascalCase name (getIcon, which the apps take) is the kebab-case one: UserRoundKey, Grid2x2
                const aParts = (el.getAttribute('class') || '').split(/\s+/).map(s => /[A-Z]/.test(s) ? s.replace(/([a-z])([A-Z0-9])/g, '$1-$2').replace(/([0-9])([A-Z])/g, '$1-$2').toLowerCase() : s.toLowerCase());
                let sName = aParts.slice(aParts.indexOf('sys-icon') + 1).find(s => s && !aCodeClasses.includes(s) && !/^(col|bx|sys)-/.test(s));
                if(!sName)
                    return '';

                if(aMap[sName] != undefined)
                    return aMap[sName];
                if(sName.startsWith('fa-'))
                    return aMap[sName.substring(3)] != undefined ? aMap[sName.substring(3)] : sName.substring(3);
                return sName;
            };

            const draw = function(el, sName) {
                const oTmp = document.createElement('div');
                oTmp.innerHTML = oSvgs[sName];
                const oSvg = oTmp.querySelector('svg');
                if(!oSvg) {
                    el.setAttribute('data-lucide', sName);
                    return;
                }

                for(const oAttr of el.attributes)
                    if(oAttr.name != 'class')
                        oSvg.setAttribute(oAttr.name, oAttr.value);

                const bBrand = sName.startsWith('brand-');
                oSvg.setAttribute('class', (bBrand ? 'sys-icon-brand ' : 'lucide lucide-' + sName + ' ') + el.getAttribute('class'));
                oSvg.setAttribute('data-lucide', sName);
                if(!el.hasAttribute('aria-label'))
                    oSvg.setAttribute('aria-hidden', 'true');

                el.replaceWith(oSvg);
            };

            const load = function(sName) {
                if(oLoading[sName])
                    return;

                oLoading[sName] = true;

                const bBrand = sName.startsWith('brand-');
                if(!/^[a-z0-9-]+$/.test(sName) || (bBrand && !aBrands.includes(sName.substring(6)))) {
                    oSvgs[sName] = '';
                    window.bx_iconset_init_lucide();
                    return;
                }

                fetch((bBrand ? $sUrlBrands + sName.substring(6) : $sUrlIcons + sName) + '.svg?rev=' + $sRev)
                    .then(r => r.ok ? r.text() : '')
                    .catch(() => '')
                    .then(s => {
                        oSvgs[sName] = s;
                        window.bx_iconset_init_lucide();
                    });
            };

            window.bx_iconset_init_lucide = function() {
                document.querySelectorAll('i.sys-icon').forEach(el => {
                    if(el.hasAttribute('data-lucide'))
                        return;

                    const sName = getName(el);
                    if(!sName)
                        return;

                    if(oSvgs[sName] != undefined)
                        draw(el, sName);
                    else
                        load(sName);
                });
            };
        })();

        bx_iconset_init_lucide();

        if (typeof glOnProcessHtml === 'undefined')
            glOnProcessHtml = [];
        if (glOnProcessHtml instanceof Array) {
            glOnProcessHtml.push(function(e) {
                bx_iconset_init_lucide();
            });
        }
BLAH;

        return $this->_oTemplate->_wrapInTagJsCode($sCode);
    }
}

/** @} */
