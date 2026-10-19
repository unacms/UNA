<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * The Studio side menu in sections (Traffic, Behavior, Conversion...). Each section's items are
 * drawn by Studio's own menu object, so they look and behave like any Studio menu; this class
 * only adds the section headings around them.
 */
class BxAnalyticsStudioMenu
{
    protected $_oTemplate;
    protected $_aSections;

    /**
     * @param object $oTemplate the module template
     * @param array $aSections list of ['name' => section name, 'title' => heading or '', 'menu' => Studio menu object]
     */
    public function __construct($oTemplate, $aSections)
    {
        $this->_oTemplate = $oTemplate;
        $this->_aSections = $aSections;
    }

    public function getCode()
    {
        $aSections = [];
        foreach($this->_aSections as $aSection)
            $aSections[] = [
                'name' => $aSection['name'],
                'bx_if:title' => [
                    'condition' => $aSection['title'] !== '',
                    'content' => [
                        'name' => $aSection['name'],
                        'title' => $aSection['title'],
                    ],
                ],
                'attrs' => $aSection['title'] !== '' ? 'role="group" aria-labelledby="bx-analytics-std-menu-' . $aSection['name'] . '"' : '',
                'menu' => $aSection['menu']->getCode(),
            ];

        return $this->_oTemplate->parseHtmlByName('studio_menu.html', [
            'bx_repeat:sections' => $aSections,
        ]);
    }
}

/** @} */
