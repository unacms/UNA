<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioGrid extends BxDolStudioGrid
{
    protected $_bFilterModuleInUrl = false; ///< the page opens on the module in its address (_getFilterValue)

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        // Studio styles select2, and its other selects are select2 fields (the page builder's page picker)
        $this->_bAgSelect2 = true;
    }

    /**
     * Studio grid action glyphs are Lucide: a font-icon name from the action's data is drawn by the Lucide iconset (through its
     * Font Awesome map, Studio's own picks first); an icon Lucide lacks keeps the font glyph.
     */
    protected $_aActionIcons = ['pencil-alt' => 'square-pen'];

    protected function _getActionDefault ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(!$this->_bIsApi && !empty($a['icon']) && preg_match('/^[a-z0-9-]+$/i', $a['icon'])) {
            $sName = isset($this->_aActionIcons[$a['icon']]) ? $this->_aActionIcons[$a['icon']] : $a['icon'];
            if(($sSvg = $this->_getIconLucide($sName)) !== false)
                $a['icon'] = $sSvg;
        }

        return parent::_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    /**
     * AG Grid rows get the same Lucide action icons as the classic grid.
     */
    protected function _agActionIcon($sIcon)
    {
        // _getIconLucide refuses anything that is not an icon name (an action with its own <svg>, for one)
        if(!is_string($sIcon)) {
            return $sIcon;
        }

        $sName = isset($this->_aActionIcons[$sIcon]) ? $this->_aActionIcons[$sIcon] : $sIcon;
        $sSvg = $this->_getIconLucide($sName);

        return $sSvg !== false ? $sSvg : $sIcon;
    }

    /**
     * The row drag handle is a Lucide grip in every Studio grid.
     */
    protected function _getCellOrder ($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi || ($sSvg = $this->_getIconLucide('grip-vertical')) === false)
            return parent::_getCellOrder($mixedValue, $sKey, $aField, $aRow);

        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            'bx-def-padding-sec-bottom bx-def-padding-sec-top',
            isset($aField['width']) ? 'width:' . $aField['width'] : false
        );

        return '<td ' . $sAttr . '><div id="' . $this->_sObject . '_cell_' . $aRow[$this->_aOptions['field_id']] . '" class="bx-grid-drag-handle">' . $sSvg . '</div></td>';
    }

    /**
     * Inline Lucide SVG for a Lucide or Font Awesome icon name, or false when Lucide has no such icon.
     */
    protected function _getIconLucide($sName, $aAttrs = [])
    {
        if(empty($sName) || !preg_match('/^[a-z0-9-]+$/i', $sName) || !($oIconset = BxDolIconset::getObjectInstance('sys_lucide')))
            return false;

        return $oIconset->getIconHtml($sName, $aAttrs);
    }

    function getJsObject()
    {
        return '';
    }
    
    public function getModulesSelectOneArray($sGetItemsMethod, $bShowCustom = true, $bShowSystem = true)
    {
        if(empty($sGetItemsMethod))
            return '';

        $aInputModules = array(
            'type' => 'select',
            'name' => 'module',
            'attrs' => array(
                'id' => 'bx-grid-module-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_module'),
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeModule()'
            ),
            'value' => $this->sModule,
            'values' => $this->getModules($bShowCustom, $bShowSystem)
        );

        $aCounter = array();
        $this->oDb->$sGetItemsMethod(array('type' => 'counter_by_modules'), $aCounter, false);
        foreach($aInputModules['values'] as $sKey => $sValue)
            $aInputModules['values'][$sKey] = $aInputModules['values'][$sKey] . " (" . (isset($aCounter[$sKey]) ? $aCounter[$sKey] : "0") . ")";
        
        return $aInputModules;
    }

    public function getModulesSelectOne($sGetItemsMethod, $bShowCustom = true, $bShowSystem = true)
    {
        $aInputModules = $this->getModulesSelectOneArray($sGetItemsMethod, $bShowCustom, $bShowSystem);
        $aInputModules['values'] = array_merge(array('' => _t('_adm_txt_select_module')), $aInputModules['values']);
        $oForm = new BxTemplStudioFormView(array());
        return $oForm->genRow($aInputModules);
    }

    /**
     * Where we are, as breadcrumbs among the grid's filters: each crumb is one of the grid's selects
     * (['control' => ...]), which switches its level, or the name of this page (['text' => ...]). A crumb says what it
     * is before its value (['label' => 'Module', ...]).
     */
    public function getCrumbs($aCrumbs)
    {
        $aTmplCrumbs = [];
        foreach(array_values($aCrumbs) as $i => $aCrumb) {
            $bText = isset($aCrumb['text']);
            $aTmplCrumbs[] = [
                'bx_if:sep' => [
                    'condition' => $i > 0,
                    'content' => [],
                ],
                'bx_if:label' => [
                    'condition' => !empty($aCrumb['label']),
                    'content' => [
                        'label' => $aCrumb['label'] ?? '',
                    ],
                ],
                'bx_if:control' => [
                    'condition' => !$bText,
                    'content' => [
                        'control' => !$bText ? $aCrumb['control'] : '',
                    ],
                ],
                'bx_if:text' => [
                    'condition' => $bText,
                    'content' => [
                        'text' => $bText ? $aCrumb['text'] : '',
                    ],
                ],
            ];
        }

        return $this->_oTemplate->parseHtmlByName('nav_crumbs.html', [
            'txt_label' => bx_html_attribute(_t('_adm_grid_lbl_module')),
            'bx_repeat:crumbs' => $aTmplCrumbs,
        ]);
    }

    /**
     * Breadcrumbs of a list that modules divide (menus, forms, data lists, search forms) and of the pages under it:
     * a select for every level, each one switches its level. Choosing a module is a step down, as choosing a row of
     * the list is: the module's select goes to the list on that module (its first value, to the whole list), and
     * after it come $aNext, the crumbs of the levels under the module.
     * @param $sUrl the list's address
     * @param $aModules module name => title, '' for every module (_getCrumbModules)
     * @param $aNext crumbs after the module, as getCrumbs takes them; left out while no module is chosen
     */
    public function getCrumbsOfList($sUrl, $sModule, $aModules, $aNext = [])
    {
        $aCrumbs = [
            ['label' => _t('_adm_grid_lbl_module'), 'control' => $this->_getCrumbGoSelect('module', $sModule, $aModules, $sUrl . '&module=', $sUrl)],
        ];

        return $this->getCrumbs($sModule !== '' ? array_merge($aCrumbs, $aNext) : $aCrumbs);
    }

    /**
     * A module's forms for the breadcrumbs' select, each with how many displays it has (Studio > Forms).
     */
    protected function _getCrumbForms($sModule)
    {
        $aForms = $aCounter = [];
        $this->oDb->getForms(['type' => 'by_module', 'value' => $sModule], $aForms, false);
        $this->oDb->getDisplays(['type' => 'counter_by_forms'], $aCounter, false);

        $aValues = [];
        foreach($aForms as $aForm)
            $aValues[$aForm['object']] = _t($aForm['title']) . ' (' . ($aCounter[$aForm['object']] ?? 0) . ')';
        asort($aValues);

        return array_merge(['' => _t('_adm_form_txt_select_form')], $aValues);
    }

    /**
     * The modules for the breadcrumbs' select, each with how many rows of the list it has.
     * @param $sCounterMethod the query method that counts the list's rows by modules
     * @param $bOnlyUsed leave out the modules with no rows
     */
    protected function _getCrumbModules($sCounterMethod, $sAllModulesKey, $bShowCustom = true, $bOnlyUsed = false)
    {
        $aCounter = [];
        $this->oDb->$sCounterMethod(['type' => 'counter_by_modules'], $aCounter, false);

        $aModules = ['' => _t($sAllModulesKey)];
        foreach($this->getModules($bShowCustom) as $sKey => $sValue) {
            if($bOnlyUsed && empty($aCounter[$sKey]))
                continue;

            $aModules[$sKey] = $sValue . ' (' . ($aCounter[$sKey] ?? 0) . ')';
        }

        return $aModules;
    }

    /**
     * A select in the breadcrumbs that goes to another page: $sUrl with the chosen value at its end, or $sUrlEmpty for
     * the empty value when it is given.
     */
    protected function _getCrumbGoSelect($sName, $sValue, $aValues, $sUrl, $sUrlEmpty = '')
    {
        $sGo = "var s = this.value; if(s !== '') window.location.href = '" . bx_js_string($sUrl, BX_ESCAPE_STR_APOS) . "' + encodeURIComponent(s);";
        if($sUrlEmpty !== '')
            $sGo .= " else window.location.href = '" . bx_js_string($sUrlEmpty, BX_ESCAPE_STR_APOS) . "';";

        $aInput = [
            'type' => 'select',
            'name' => $sName,
            'attrs' => [
                'id' => 'bx-grid-' . $sName . '-' . $this->_sObject,
                'aria-label' => (string)reset($aValues),
                'onChange' => 'javascript:' . $sGo,
            ],
            'value' => $sValue,
            'values' => $aValues,
        ];

        $oForm = new BxTemplStudioFormView([]);
        return $oForm->genRow($aInput);
    }

    /**
     * A list whose page opens on the module in its address (...&module=...), where the module's select of the
     * breadcrumbs puts it ($_bFilterModuleInUrl): the page's first filter is that module. A request for rows carries
     * the filter itself.
     */
    protected function _getFilterValue()
    {
        $sFilter = parent::_getFilterValue();
        if(!$this->_bFilterModuleInUrl || $sFilter !== '' || ($sModule = bx_get('module')) === false)
            return $sFilter;

        $sModule = bx_process_input($sModule);
        return $sModule !== '' ? $sModule . $this->sParamsDivider : $sFilter;
    }

    /**
     * The module the list is filtered by (the part of the grid's filter before the divider).
     */
    protected function _getFilterModule()
    {
        $aFilter = explode($this->sParamsDivider, $this->_getFilterValue(), 2);
        return count($aFilter) == 2 ? $aFilter[0] : '';
    }

    /**
     * A Studio grid's filter is a module and a search phrase (module, divider, phrase): the search field shows the
     * phrase alone.
     */
    protected function _agSearchPhrase($sFilter)
    {
        $aFilter = explode($this->sParamsDivider, (string)$sFilter, 2);
        return count($aFilter) == 2 ? $aFilter[1] : (string)$sFilter;
    }

    public function getSearchInput()
    {
        return parent::_getSearchInput();
    }

    protected function _getFilterOnChange()
    {
        return $this->getJsObject() . '.onChangeFilter()';
    }

    protected function _getItem($sDbMethod = '')
    {
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId)
                return false;

            $aIds = array($iId);
        }

        $iId = $aIds[0];

        $aItem = array();
        $this->oDb->$sDbMethod(array('type' => 'by_id', 'value' => $iId), $aItem, false);
        if(!is_array($aItem) || empty($aItem))
            return false;

        return $aItem;
    }

    protected function _getIconPreview($iId, $sIconImage = '', $sIcon = '')
    {
        $bIconImage = !empty($sIconImage);

        $aIcons = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIcon($sIcon);
        $sIconHtml = $aIcons[2] . $aIcons[3] . $aIcons[4];
        $bIconHtml = !empty($sIconHtml) && !$bIconImage;

        return $this->_oTemplate->parseHtmlByName('item_icon_preview.html', [
            'id' => $iId,
            'bx_if:show_icon_empty' => [
                'condition' => !$bIconImage && !$bIconHtml,
                'content' => []
            ],
            'bx_if:show_icon_image' => [
                'condition' => $bIconImage,
                'content' => [
                    'js_object' => $this->getJsObject(),
                    'url' => $sIconImage,
                    'id' => $iId
                ]
            ],
            'bx_if:show_icon_html' => [
                'condition' => $bIconHtml,
                'content' => [
                    'icon' => $sIconHtml
                ]
            ]
        ]);
    }

    protected function _getIds()
    {
        if(($aIds = bx_get('ids')) && is_array($aIds))
            return reset($aIds);

        if(($iId = bx_get('id')) !== false) 
            return (int)$iId;

        return false;
    }
}

/** @} */
