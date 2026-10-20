<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxDolPaginate
 */
class BxBasePaginate extends BxDolPaginate
{
    protected static $_isCssAdded = false;

    protected $_oTemplate;

    protected $_sPaginateClass; ///< add this class to whole paginate container div
    protected $_sButtonsClass; ///< add this class to buttons class attribute
    protected $_aButtonsConf; ///< buttons configuration

    public function __construct($aParams, $oTemplate = null)
    {
        parent::__construct($aParams);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_sPaginateClass = $aParams['paginate_class'] ?? '';
        $this->_sButtonsClass = $aParams['buttons_class'] ?? '';
        $this->_aButtonsConf = [
            'btn_1' => [
                'name' => 'prev',
                'active' => $aParams['button_prev'] ?? true
            ], 
            'btn_2' => [
                'name' => 'next',
                'active' => $aParams['button_next'] ?? true
            ]
        ];
    }

    /**
     * Get default paginate, it is better to use it on the whole page.
     * @param $iStart - @see setStart.
     * @param $iNum - @see setNum and @see setNumFromDataArray.
     * @param $iPerPage - @see setPerPage.
     * @return HTML string.
     */
    public function getPaginate($iStart = -1, $iNum = -1, $iPerPage = -1)
    {
        $this->setNum($iNum);
        if (!$this->_iNum)
            return '';

        $this->setStart($iStart);
        $this->setPerPage($iPerPage);

        if (0 == $this->getStart() && !$this->isNextAvail ())
            return '';

        $sClassAdd = ($this->_sButtonsClass ? ' ' . $this->_sButtonsClass : '');

        $aTmplVarsButtons = [];
        foreach($this->_aButtonsConf as $sTmplVar => $aConf) {
            if(!$aConf['active'])
                continue;

            $sName = $aConf['name'];
            $sClassAdd = ' bx-btn-disabled';
            $sLinkUrl = 'javascript:void(0);';
            $sLinkClick = '';
            if(($sMethod = bx_gen_method_name($sName)) && $this->{'is' . $sMethod . 'Avail'}()) {
                $aReplacementLink = $this->{'_getReplacement' . $sMethod}();

                $sClassAdd = '';
                $sLinkUrl = $this->_getPageChangeUrl($aReplacementLink);
                $sLinkClick = $this->_getPageChangeOnClick($aReplacementLink);
            }

            $aTmplVarsButtons[$sTmplVar] = $this->_getButton($sName, [
                'class' => $sClassAdd . $sClassAdd,
                'href' => $sLinkUrl,
                'onclick' => $sLinkClick,
            ]);
        }

        $this->addCssJs();
        return $this->_oTemplate->parseHtmlByName('paginate.html', array_merge([
            'bx_if:info' => [
                'condition' => $this->_bInfo && !$this->_bTotal,
                'content' => [
                    'text' => _t('_sys_paginate_info', $this->_iStart + 1, $this->_iStart + ($this->isNextAvail () ? $this->_iPerPage : $this->_iNum)),
                ],
            ],
            'bx_if:total' => [
                'condition' => $this->_bTotal,
                'content' => [
                    'text' => _t('_sys_paginate_total', $this->_iStart + 1, $this->_iStart + ($this->isNextAvail() ? $this->_iPerPage : $this->_iNum), $this->_iTotal),
                ],
            ],
            'bx_if:view_all' => [
                'condition' => (bool)$this->_sViewAllUrl,
                'content' => [
                    'lnk_url' => $this->_sViewAllUrl,
                    'lnk_title' => $this->_sViewAllCaption,
                    'lnk_content' => $this->_sViewAllCaption,
                ],
            ],
            'btn_1' => '',
            'btn_2' => '',
            'paginate_class' => $this->_sPaginateClass,
            'bx_repeat:attrs' => [
                ['key' => 'bx-data-start', 'value' => $this->_iStart],
                ['key' => 'bx-data-perpage', 'value' => $this->_iPerPage]
            ]
        ], $aTmplVarsButtons));
    }

    /**
     * Get limited paginate, it is better to use in some boxes, where availabel space is limited or for ajax paginate.
     * @param $sViewAllUrl - url to page for 'view all' link.
     * @param $iStart - @see setStart.
     * @param $iNum - @see setNum and @see setNumFromDataArray.
     * @param $iPerPage - @see setPerPage.
     * @return HTML string.
     */
    public function getSimplePaginate($sViewAllUrl = '', $iStart = -1, $iNum = -1, $iPerPage = -1)
    {
        if($sViewAllUrl)
            $this->_sViewAllUrl = $sViewAllUrl;

        if(!isset($this->_aParams['info']))
            $this->_bInfo = false;

        $this->_sButtonsClass .= ($this->_sButtonsClass ? ' ' : '') . 'bx-btn-small bx-btn-symbol-small';
        $this->_sPaginateClass = 'bx-paginate-simple';

        return $this->getPaginate($iStart, $iNum, $iPerPage);
    }

    public function getLoadMorePaginate($sViewAllUrl = '', $iStart = -1, $iNum = -1, $iPerPage = -1)
    {
        if($sViewAllUrl)
            $this->_sViewAllUrl = $sViewAllUrl;

        if(!isset($this->_aParams['info']))
            $this->_bInfo = false;

        $this->_sPaginateClass = 'bx-paginate-simple-load-more';
        $this->_sButtonsClass .= ($this->_sButtonsClass ? ' ' : '') . 'bx-btn-small bx-btn-symbol-small';
        
        $this->_aButtonsConf['btn_1']['active'] = false;
        $this->_aButtonsConf['btn_2']['name'] = 'load_more';

        return $this->getPaginate($iStart, $iNum, $iPerPage);
    }

    public function addCssJs ()
    {
        if(self::$_isCssAdded)
            return false;

        $this->_oTemplate->addCss('paginate.css');
        self::$_isCssAdded = true;
        return true;
    }

    protected function _getButton($sName, $aParams)
    {
        $aTmplVarsIcon = [];
        if(($sMethodIc = '_getButtonIcon' . bx_gen_method_name($sName)) && method_exists($this, $sMethodIc))
            $aTmplVarsIcon = [
                'icon' => $this->$sMethodIc()
            ];

        $aTmplVarsTitle = [];
        if(($sMethodTtl = '_getButtonTitle' . bx_gen_method_name($sName)) && method_exists($this, $sMethodTtl))
            $aTmplVarsTitle = [
                'title' => $this->$sMethodTtl()
            ];

        return $this->_oTemplate->parseHtmlByName('paginate_btn.html', [
            'class' => 'bx-paginate-btn bx-paginate-btn-' . $sName . (!empty($aParams['class']) ? $aParams['class'] : ''),
            'href' => !empty($aParams['href']) ? $aParams['href'] : 'javascript:void(0)',
            'onclick' => !empty($aParams['onclick']) ? $aParams['onclick'] : '',
            'bx_if:icon' => [
                'condition' => $aTmplVarsIcon && is_array($aTmplVarsIcon), 
                'content' => $aTmplVarsIcon
            ],
            'bx_if:title' => [
                'condition' => $aTmplVarsTitle && is_array($aTmplVarsTitle), 
                'content' => $aTmplVarsTitle
            ],
        ]);
    }

    protected function _getButtonIconPrev()
    {
        return 'angle-double-left';
    }

    protected function _getButtonIconNext()
    {
        return 'angle-double-right';
    }

    protected function _getButtonTitleLoadMore()
    {
        return 'Load More...';
    }
}

/** @} */
