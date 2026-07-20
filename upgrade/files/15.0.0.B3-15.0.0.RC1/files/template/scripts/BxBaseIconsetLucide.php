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
    protected $_aMap;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_aMap = [
            'ad' => 'circle-star',
            'address-book' => 'contact-round',
            'address-card' => 'id-card',
            'angle-double-down' => 'chevrons-down',
            'angle-double-left' => 'chevrons-left',
            'angle-double-right' => 'chevrons-right',
            'arrows-alt' => 'move',
            'bars' => 'menu',
            'book-reader' => 'book-open-text',
            'buffer' => 'layers',
            'building' => 'building',
            'bullhorn' => 'megaphone',
            'calendar-alt' => 'calendar-days',
            'calendar-day' => 'calendar-days',
            'calendar-plus' => 'calendar-plus',
            'camera-retro' => 'camera',
            'caret-right' => 'chevron-right',
            'cart-arrow-down' => 'shopping-cart',
            'cart-plus' => 'shopping-cart',
            'cc-stripe' => 'credit-card',
            'certificate' => 'award',
            'chart-pie' => 'pie-chart',
            'check-circle' => 'check-circle',
            'check-double' => 'check-check',
            'clipboard-check' => 'clipboard-check',
            'cog' => 'settings',
            'cogs' => 'settings',
            'comment' => 'message-circle',
            'comment-dots' => 'message-square-dashed',
            'comments' => 'messages-square',
            'desktop' => 'monitor',
            'donate' => 'hand-coins',
            'ellipsis-h' => 'more-horizontal',
            'ellipsis-v' => 'more-vertical',
            'envelope' => 'mail',
            'envelope-open-text' => 'mail-open',
            'exchange-alt' => 'repeat',
            'exclamation-circle' => 'alert-circle',
            'exclamation-triangle' => 'alert-triangle',
            'fa-book' => 'book-text',
            'fa-bookmark' => 'bookmark',
            'fa-certificate' => 'badge',
            'fa-check-circle' => 'circle-check', 
            'fa-grip-horizontal' => 'layout-grid',
            'fa-smile' => 'smile',
            'fa-thumbs-up' => 'thumbs-up',
            'facebook-square' => 'log-in', //TODO: Brand icon. Update later.
            'file-alt' => 'file',
            'file-alt' => 'file-text',
            'file-export' => 'file-output',
            'file-invoice' => 'receipt',
            'file-word' => 'file-text',
            'fire' => 'flame',
            'group' => 'users',
            'google' => 'log-in', //TODO: Brand icon. Update later.
            'hand-holding-usd' => 'hand-coins',
            'hashtag' => 'hash',
            'helpcircle' => 'help-circle',
            'house' => 'home',
            'industry' => 'factory',
            'info-circle' => 'info',
            'keyround' => 'key-round',
            'language' => 'languages',
            'list-alt' => 'list',
            'linkedin-in' => 'log-in', //TODO: Brand icon. Update later.
            'lockopen' => 'unlock',
            'mail-bulk' => 'mails',
            'map-marker' => 'map-pin',
            'map-marker-alt' => 'map-pin',
            'money-check-alt' => 'wallet-cards',
            'object-group' => 'layout-dashboard',
            'pencil-alt' => 'pencil-line',
            'pencil-ruler' => 'ruler',
            'photo-video' => 'image-play',
            'plus-circle' => 'plus-circle',
            'qrcode' => 'qr-code',
            'question' => 'circle-question-mark',
            'question-circle' => 'circle-question-mark',
            'quote-right' => 'quote',
            'remove' => 'x',
            'reply-all' => 'reply-all',
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
            'tasks' => 'check-square',
            'th-large' => 'grid-2x2',
            'thumbtack' => 'pin',
            'times' => 'x',
            'times-circle' => 'x-circle',
            'toolbox' => 'tool-case',
            'trash2' => 'trash-2',
            'twitter' => 'log-in', //TODO: Brand icon. Update later.
            'unlock-alt' => 'unlock',
            'user' => 'user-round',
            'user-friends' => 'users',
            'user-plus' => 'user-round-plus',
            'user-secret' => 'user-key',
            'user-slash' => 'user-x',
            'user-shield' => 'user-round-search',
            'user-check' => 'user-round-check',
            'user-times' => 'user-x',
            'users' => 'users-round',
            'video-camera' => 'video',
            'at' => 'at-sign',
            'backspace' => 'delete',
            'trash-alt' => 'trash',
        ];
    }

    public function getPreloaderJs()
    {
        return 'https://unpkg.com/lucide@latest';
    }

    public function getIcon($sIcon)
    {
        $sIcon = trim(preg_replace('/(sys-icon|far|col-\w+)/i', '', $sIcon));
        if(isset($this->_aMap[$sIcon]))
            $sIcon = $this->_aMap[$sIcon];

        return bx_gen_method_name($sIcon, ['_', '-']);
    }

    public function getCode()
    {
        $sMap = json_encode($this->_aMap);

        $sCode = <<<BLAH
        function bx_iconset_init_lucide() {
            if(!window.lucide || !lucide.icons)
                return;
 
            const aMap = $sMap;
 
            document.querySelectorAll('i.sys-icon').forEach(el => {
                if(el.hasAttribute('data-lucide'))
                    return;

                const sName = el.getAttribute('class').replace(/(sys-icon-bigger|sys-icon|fab|far|fas|col-\w+)/gi, '').trim().split(' ').shift();
                if(sName)
                  el.setAttribute('data-lucide', aMap[sName] != undefined ? aMap[sName] : sName);
                else
                  console.warn('Lucide: no icon class found on', el);
            });

            lucide.createIcons({
              attrs: { class: ['sys-icon'] },
              nameAttr: 'data-lucide'
            });
        };

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
