<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * The site's search window: the header's search (Cmd/Ctrl+K), a section's or context's Search button and the results
 * page draw it from the same parts. The query and the results come from BxDolSearchUnified, as in the apps.
 */
class BxBaseSearchWindow extends BxDol
{
    const POPUP_ID = 'bx-search-window';

    protected $_oTemplate;
    protected $_oSearch;

    public function __construct($oTemplate = false)
    {
        parent::__construct();

        $this->_oTemplate = $oTemplate ? $oTemplate : BxDolTemplate::getInstance();
        $this->_oSearch = BxDolSearchUnified::getInstance();
    }

    /**
     * The window as a popup, hidden until a search button or Cmd/Ctrl+K opens it (oBxDolSearchWindow.open).
     */
    public function getPopup()
    {
        $this->addCssJs();

        // the parts are asked for when it opens, so a page doesn't pay for them
        return $this->_oTemplate->parseHtmlByName('search_window_popup.html', [
            'id' => self::POPUP_ID,
            'title' => _t('_sys_search_window_title'),
            'content' => $this->getBody(null, false),
        ]);
    }

    /**
     * The window on the results page (search-keyword): the same body, opened on the page's query.
     */
    public function getPage($aQuery)
    {
        $this->addCssJs();

        return $this->getBody($aQuery, true);
    }

    public function addCssJs()
    {
        $this->_oTemplate->addJs(['BxDolSearchWindow.js']);
        $this->_oTemplate->addJsTranslation([
            '_sys_search_window_loading',
            '_sys_search_window_error',
        ]);
    }

    /**
     * The field, the chips, the results and the footer, filled for the query.
     * @param array $aQuery normalized query
     * @param bool $bPage true on the results page, false in the popup
     */
    public function getBody($aQuery, $bPage)
    {
        // without a query (the popup before it opens): an empty field, the parts come with the first request
        $aParts = $aQuery !== null ? $this->getParts($aQuery, $bPage) : ['chips' => '', 'results' => '', 'results_url' => '', 'ai' => BxDolAiSearchParser::getInstance()->isAvailable()];
        if($aQuery === null)
            $aQuery = ['keyword' => ''];
        $bAi = !empty($aParts['ai']);

        return $this->_oTemplate->parseHtmlByName('search_window.html', [
            'class' => $bPage ? 'bx-search-window-page' : 'bx-search-window-popup',
            'form_url' => BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('searchKeyword.php'),
            'content_url' => BX_DOL_URL_ROOT . 'searchKeywordContent.php',
            'mode' => $bPage ? 'page' : 'popup',
            'query' => bx_html_attribute(json_encode(isset($aParts['query']) ? $aParts['query'] : new stdClass())),
            'keyword' => bx_html_attribute($aQuery['keyword']),
            'placeholder' => bx_html_attribute(_t($bAi ? '_sys_search_window_placeholder_ai' : '_sys_search_window_placeholder')),
            'label' => bx_html_attribute(_t('_sys_search_window_title')),
            'ai' => $bAi ? 1 : 0,
            'chips' => $aParts['chips'],
            'results' => $aParts['results'],
            'results_url' => $aParts['results_url'],
            'icon_search' => $this->_getIcon('search', 'size-5 text-gray-500 dark:text-gray-400'),
            'bx_if:close' => ['condition' => !$bPage, 'content' => []],
        ]);
    }

    /**
     * The parts that change with the query: chips, results (with their header and tabs) and the full results link.
     * @return array ['chips' => html, 'results' => html, 'count' => text, 'results_url' => url, 'ai' => bool, 'query' => url params]
     */
    public function getParts($aQuery, $bPage = false)
    {
        $aScope = $this->_oSearch->getScope($aQuery);
        $bHasQuery = $this->_oSearch->hasQuery($aQuery);
        $aResults = $bHasQuery ? $this->_oSearch->search($aQuery, 'html') : ['groups' => [], 'total' => 0, 'total_more' => false];

        // a tab shows one module: its neighbours' tabs and counts come from the "All" view
        $aAll = $aResults;
        if($bHasQuery && $aQuery['tab'] !== '')
            $aAll = $this->_oSearch->search(array_merge($aQuery, ['tab' => '']), 'html');

        return [
            'chips' => $this->_getChips($aScope, $aQuery),
            'results' => $this->_getResults($aScope, $aQuery, $aResults, $aAll, $bHasQuery, $bPage),
            'count' => $bHasQuery ? $this->_getCountText($aResults) : '',
            'results_url' => $aScope['results_url'],
            'ai' => !empty($aScope['ai']),
            'query' => $this->_oSearch->toUrlParams($aQuery),
        ];
    }

    protected function _getChips($aScope, $aQuery)
    {
        $aChips = [];
        $aPanels = [];
        $aFields = [];
        foreach($aScope['chips'] as $aChip) {
            if($aChip['type'] == 'options') {
                $aFields[] = $aChip;
                // a field chip shows once it has a value; "+ Filter" adds the others
                if(empty($aChip['value']))
                    continue;
            }

            $aChips[] = $this->_getChip($aChip, $aPanels);
        }

        // "+ Filter": the module's fields without a value, or the modules to look in
        $aAdd = [];
        foreach($aFields as $aField)
            if(empty($aField['value']))
                $aAdd[] = ['name' => 'field', 'value' => $aField['name'], 'title' => $aField['caption']];

        if($aScope['scope'] == BxDolSearchUnified::SCOPE_GLOBAL)
            foreach($aScope['groups'] as $aGroup)
                $aAdd[] = ['name' => 'section', 'value' => $aGroup['name'], 'title' => _t('_sys_search_chip_in', $aGroup['title'])];

        if($aAdd) {
            $sPanelId = 'bx-search-window-panel-add';
            $aPanels[] = $this->_oTemplate->parseHtmlByName('search_window_panel_add.html', [
                'id' => $sPanelId,
                'bx_repeat:items' => array_map(function($a) {
                    return ['name' => $a['name'], 'value' => bx_html_attribute($a['value']), 'title' => bx_process_output($a['title'])];
                }, $aAdd),
            ]);
            $aChips[] = $this->_oTemplate->parseHtmlByName('search_window_chip.html', [
                'class' => 'bx-search-window-chip-add',
                'attrs' => 'aria-expanded="false" aria-controls="' . $sPanelId . '" data-panel="' . $sPanelId . '"',
                'icon' => $this->_getIcon('plus', 'size-4'),
                'caption' => _t('_sys_search_chip_filter'),
                'bx_if:remove' => ['condition' => false, 'content' => []],
            ]);
        }

        // hidden panels of the field chips, so "+ Filter" can open them
        foreach($aFields as $aField)
            if(empty($aField['value']))
                $aPanels[] = $this->_getPanel($aField);

        return $this->_oTemplate->parseHtmlByName('search_window_chips.html', [
            'label' => bx_html_attribute(_t('_sys_search_window_filters')),
            'chips' => implode('', $aChips),
            'panels' => implode('', $aPanels),
        ]);
    }

    protected function _getChip($aChip, &$aPanels)
    {
        $bActive = !empty($aChip['value']);
        $sCaption = $aChip['caption'];
        $sAttrs = '';
        $sIcon = '';

        switch($aChip['type']) {
            case 'scope':
                $sIcon = $this->_getIcon($aChip['name'] == 'context' ? 'users-round' : ($aChip['icon'] ?? 'search'), 'size-4');
                return $this->_oTemplate->parseHtmlByName('search_window_chip.html', [
                    'class' => 'bx-search-window-chip-active bx-search-window-chip-scope',
                    'attrs' => 'data-name="' . $aChip['name'] . '" data-value="' . bx_html_attribute($aChip['value']) . '" disabled="disabled"',
                    'icon' => $sIcon,
                    'caption' => bx_process_output($sCaption),
                    'bx_if:remove' => [
                        'condition' => true,
                        'content' => [
                            'name' => $aChip['name'],
                            'value' => bx_html_attribute($aChip['value']),
                            'title' => bx_html_attribute(_t('_sys_search_chip_remove', $sCaption)),
                            'icon' => $this->_getIcon('x', 'size-3.5'),
                        ],
                    ],
                ]);

            case 'toggle':
                $sIcon = $this->_getIcon('type', 'size-4');
                $sAttrs = 'data-toggle="' . $aChip['name'] . '" aria-pressed="' . ($bActive ? 'true' : 'false') . '"';
                break;

            case 'profile':
                $sIcon = $this->_getIcon('user-round', 'size-4');
                if($bActive)
                    $sCaption = _t('_sys_search_chip_created_by_value', $aChip['value_title']);
                break;

            case 'date_range':
                $sIcon = $this->_getIcon('calendar', 'size-4');
                if($bActive)
                    $sCaption = $aChip['value']['from'] . ($aChip['value']['to'] && $aChip['value']['to'] != $aChip['value']['from'] ? ' – ' . $aChip['value']['to'] : '');
                break;

            case 'options':
                $sIcon = $this->_getIcon('list-filter', 'size-4');
                if($bActive) {
                    $aTitles = [];
                    $aValues = (array)$aChip['value'];
                    foreach($aChip['options'] as $aOption)
                        if(in_array($aOption['value'], $aValues))
                            $aTitles[] = $aOption['title'];
                    $sCaption .= ': ' . implode(', ', $aTitles);
                }
                break;
        }

        if($aChip['type'] != 'toggle') {
            $sPanelId = 'bx-search-window-panel-' . $aChip['name'];
            $aPanels[] = $this->_getPanel($aChip);
            $sAttrs = 'aria-expanded="false" aria-controls="' . $sPanelId . '" data-panel="' . $sPanelId . '"';
        }

        return $this->_oTemplate->parseHtmlByName('search_window_chip.html', [
            'class' => $bActive ? 'bx-search-window-chip-active' : '',
            'attrs' => $sAttrs,
            'icon' => $sIcon,
            'caption' => bx_process_output($sCaption),
            'bx_if:remove' => [
                'condition' => $bActive && $aChip['type'] != 'toggle',
                'content' => [
                    'name' => $aChip['name'],
                    'value' => '',
                    'title' => bx_html_attribute(_t('_sys_search_chip_remove', $sCaption)),
                    'icon' => $this->_getIcon('x', 'size-3.5'),
                ],
            ],
        ]);
    }

    /**
     * A chip's panel: what it is set with, under the chips.
     */
    protected function _getPanel($aChip)
    {
        $sId = 'bx-search-window-panel-' . $aChip['name'];

        switch($aChip['type']) {
            case 'profile':
                return $this->_oTemplate->parseHtmlByName('search_window_panel_profile.html', [
                    'id' => $sId,
                    'name' => $aChip['name'],
                    'label' => bx_html_attribute($aChip['caption']),
                    'placeholder' => bx_html_attribute(_t('_sys_search_chip_created_by_placeholder')),
                    'suggest_url' => BX_DOL_URL_ROOT . 'searchExtended.php?action=get_authors',
                    'bx_if:me' => [
                        'condition' => isLogged(),
                        'content' => ['me' => bx_get_logged_profile_id(), 'title' => _t('_sys_search_chip_created_by_me')],
                    ],
                ]);

            case 'date_range':
                $aValue = is_array($aChip['value']) ? $aChip['value'] : ['from' => '', 'to' => '', 'field' => 'created'];
                return $this->_oTemplate->parseHtmlByName('search_window_panel_date.html', [
                    'id' => $sId,
                    'from' => bx_html_attribute($aValue['from']),
                    'to' => bx_html_attribute($aValue['to']),
                    'from_label' => _t('_sys_search_chip_date_from'),
                    'to_label' => _t('_sys_search_chip_date_to'),
                    'apply' => _t('_sys_search_chip_apply'),
                    'bx_if:fields' => [
                        'condition' => count($aChip['fields']) > 1,
                        'content' => [
                            'label' => _t('_sys_search_chip_date_field'),
                            'bx_repeat:fields' => array_map(function($a) use ($aValue) {
                                return ['value' => $a['value'], 'title' => bx_process_output($a['title']), 'selected' => $a['value'] == $aValue['field'] ? 'selected="selected"' : ''];
                            }, $aChip['fields']),
                        ],
                    ],
                ]);

            case 'options':
                $aValues = (array)$aChip['value'];
                return $this->_oTemplate->parseHtmlByName('search_window_panel_options.html', [
                    'id' => $sId,
                    'name' => $aChip['name'],
                    'label' => bx_html_attribute($aChip['caption']),
                    'type' => $aChip['multiple'] ? 'checkbox' : 'radio',
                    'apply' => _t('_sys_search_chip_apply'),
                    'bx_repeat:options' => array_map(function($a) use ($aValues, $aChip) {
                        return [
                            'name' => $aChip['name'],
                            'type' => $aChip['multiple'] ? 'checkbox' : 'radio',
                            'value' => bx_html_attribute($a['value']),
                            'title' => bx_process_output($a['title']),
                            'checked' => in_array($a['value'], $aValues) ? 'checked="checked"' : '',
                        ];
                    }, $aChip['options']),
                ]);
        }

        return '';
    }

    protected function _getResults($aScope, $aQuery, $aResults, $aAll, $bHasQuery, $bPage)
    {
        if(!$bHasQuery)
            return $this->_oTemplate->parseHtmlByName('search_window_hint.html', [
                'text' => _t($aScope['scope'] == BxDolSearchUnified::SCOPE_GLOBAL ? '_sys_search_window_hint' : '_sys_search_window_hint_scope'),
            ]);

        $bOneGroup = isset($aResults['group']);
        $aGroups = $bOneGroup ? (!empty($aResults['group']['items']) ? [$aResults['group']] : []) : $aResults['groups'];

        // tabs: "All" and a tab per module with results; a module scope has none
        $aTabs = [];
        if($aScope['scope'] != BxDolSearchUnified::SCOPE_MODULE && !empty($aAll['groups'])) {
            $aTabs[] = ['value' => '', 'title' => _t('_sys_search_window_tab_all'), 'count' => $this->_getCountNumber($aAll), 'selected' => $aQuery['tab'] === '' ? 'true' : 'false'];
            foreach($aAll['groups'] as $aGroup)
                $aTabs[] = ['value' => $aGroup['name'], 'title' => bx_process_output($aGroup['title']), 'count' => $aGroup['count'] . ($aGroup['count_more'] ? '+' : ''), 'selected' => $aQuery['tab'] === $aGroup['name'] ? 'true' : 'false'];
        }

        $aGroupsOut = [];
        foreach($aGroups as $aGroup) {
            $sCount = $aGroup['count'] . ($aGroup['count_more'] ? '+' : '');
            $aGroupsOut[] = [
                'name' => $aGroup['name'],
                'title' => bx_process_output($aGroup['title']),
                'icon' => $this->_getIcon($aGroup['icon'], 'size-4'),
                'items' => implode('', $aGroup['items']),
                'bx_if:all' => [
                    'condition' => !$bOneGroup && ($aGroup['count'] > count($aGroup['items']) || $aGroup['count_more']),
                    'content' => [
                        'name' => $aGroup['name'],
                        'title' => bx_process_output(_t('_sys_search_window_show_all', $sCount, $aGroup['title'])),
                    ],
                ],
                'bx_if:more' => [
                    'condition' => $bOneGroup && $aGroup['cursor'] !== '',
                    'content' => [
                        'cursor' => bx_html_attribute($aGroup['cursor']),
                        'title' => _t('_sys_search_window_more'),
                    ],
                ],
            ];
        }

        $sEmpty = '';
        if(!$aGroupsOut)
            $sEmpty = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->emptyState(_t('_sys_search_window_empty'), [], 'search', _t('_sys_search_window_empty_title'));

        return $this->_oTemplate->parseHtmlByName('search_window_results.html', [
            'count' => $this->_getCountText($aResults),
            'sort_label' => bx_html_attribute(_t('_sys_search_window_sort')),
            'sort_best' => _t('_sys_search_window_sort_best'),
            'sort_new' => _t('_sys_search_window_sort_new'),
            'sort_best_selected' => $aQuery['sort'] == 'best' ? 'selected="selected"' : '',
            'sort_new_selected' => $aQuery['sort'] == 'new' ? 'selected="selected"' : '',
            'bx_if:tabs' => [
                'condition' => count($aTabs) > 1,
                'content' => [
                    'label' => bx_html_attribute(_t('_sys_search_window_tabs')),
                    'bx_repeat:tabs' => $aTabs,
                ],
            ],
            'bx_repeat:groups' => $aGroupsOut,
            'empty' => $sEmpty,
        ]);
    }

    protected function _getCountText($aResults)
    {
        return _t('_sys_search_window_count', $this->_getCountNumber($aResults));
    }

    protected function _getCountNumber($aResults)
    {
        if(isset($aResults['group']))
            $aResults = ['total' => $aResults['group']['count'], 'total_more' => $aResults['group']['count_more']];

        return ($aResults['total'] ?? 0) . (!empty($aResults['total_more']) ? '+' : '');
    }

    protected function _getIcon($sIcon, $sClass)
    {
        return BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml($sIcon, ['class' => $sClass, 'aria-hidden' => 'true']);
    }
}

/** @} */
