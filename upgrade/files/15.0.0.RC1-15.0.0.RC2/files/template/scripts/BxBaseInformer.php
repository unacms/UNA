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

        if (!$this->_aMessages)
            return '';

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
