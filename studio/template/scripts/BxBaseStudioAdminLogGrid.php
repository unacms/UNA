<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioAdminLogGrid extends BxDolStudioAdminLogGrid
{
    public function getCode($isDisplayHeader = true)
    {
        list($aCssCalendar, $aJsCalendar) = BxBaseFormView::getCssJsCalendar();
        $this->_oTemplate->addCss(array_merge($aCssCalendar, ['admin_log.css', 'forms.css']));
        $this->_oTemplate->addJs($aJsCalendar);

        $sObject = bx_js_string($this->_sObject);
        $sJs = "function bx_admin_log_filter(){var o=glGrids['" . $sObject . "'];if(!o)return;var v=function(n){var e=jQuery('#bx-grid-'+n+'-" . $sObject . "');return e.length?e.val():'';};o.setFilter([v('source'),v('profile_id'),v('agent_id'),v('object_type'),v('from_date'),v('to_date')].join('#-#'), true);}";

        return BxDolTemplate::getInstance()->_wrapInTagJsCode($sJs) . parent::getCode($isDisplayHeader);
    }

    public function performActionView()
    {
        $aIds = bx_get('ids');
        $iId = 0;
        if (is_array($aIds))
            $iId = (int)reset($aIds);
        elseif ($aIds !== false)
            $iId = (int)$aIds;

        $aRow = $iId > 0 ? BxDolAdminLogQuery::getInstance()->getById($iId) : false;
        if (!$aRow) {
            echoJson(['msg' => _t('_adm_txt_admin_log_empty')]);
            return;
        }

        $aRows = $this->diffRows((string)$aRow['before'], (string)$aRow['after']);
        $sContent = $this->_oTemplate->parseHtmlByName('admin_log_diff.html', [
            'before_title' => _t('_adm_txt_admin_log_before'),
            'after_title' => _t('_adm_txt_admin_log_after'),
            'bx_repeat:rows' => $aRows,
        ]);

        $sPopup = BxTemplStudioFunctions::getInstance()->popupBox('bx-admin-log-diff', _t('_adm_txt_admin_log_popup'), $sContent);
        echoJson(['popup' => $sPopup]);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] = $this->_sSource;
        $this->applyFilter($sFilter);

        return parent::_getDataSql('', $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getFilterControls()
    {
        $aSources = [
            'studio' => '_adm_txt_admin_log_source_studio',
            'agent' => '_adm_txt_admin_log_source_agent',
            'api' => '_adm_txt_admin_log_source_api',
            'cli' => '_adm_txt_admin_log_source_cli',
        ];

        return $this->_getFilterSelectOne('source', $this->_sFilterSource, $aSources, '_adm_txt_admin_log_source_any')
            . $this->_getFilterSelectOne('profile_id', $this->_sFilterProfile, $this->_aProfiles, '_adm_txt_admin_log_profile_any')
            . $this->_getFilterSelectOne('agent_id', $this->_sFilterAgent, $this->_aAgents, '_adm_txt_admin_log_agent_any')
            . $this->_getFilterSelectOne('object_type', $this->_sFilterObject, $this->_aObjects, '_adm_txt_admin_log_object_any')
            . $this->_getFilterDatePicker('from_date', $this->_sFilterFrom)
            . $this->_getFilterLabel('-')
            . $this->_getFilterDatePicker('to_date', $this->_sFilterTo)
            . $this->filterButton();
    }

    protected function _getRowsDataDesign(&$aData)
    {
        $aGrid = [];

        if (empty($aData)) {
            $aGrid[] = [
                'bx_if:click' => [
                    'condition' => false,
                    'content' => ['id_row' => '', 'row_class' => '', 'row' => '', 'row_id' => ''],
                ],
                'bx_if:plain' => [
                    'condition' => true,
                    'content' => [
                        'id_row' => 0,
                        'row_class' => 'bx-grid-table-row-empty',
                        'row' => '<td class="bx-def-padding-sec-topbottom" colspan="' . count($this->_aOptions['fields']) . '">' . $this->_getEmptyState() . '</td>',
                    ],
                ],
            ];
            return $aGrid;
        }

        foreach ($aData as $aRow) {
            $sId = (string)$aRow[$this->_aOptions['field_id']];
            $aCells = [
                'id_row' => $this->_getRowId($aRow),
                'row_class' => $this->_isRowDisabled($aRow) ? 'bx-grid-table-row-disabled bx-def-font-grayed' : '',
                'row' => $this->_getRowDesign($aRow),
                'row_id' => $sId,
            ];
            $aGrid[] = [
                'bx_if:click' => [
                    'condition' => true,
                    'content' => $aCells,
                ],
                'bx_if:plain' => [
                    'condition' => false,
                    'content' => [
                        'id_row' => $aCells['id_row'],
                        'row_class' => $aCells['row_class'],
                        'row' => $aCells['row'],
                    ],
                ],
            ];
        }

        return $aGrid;
    }

    protected function _getCellAdded($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(bx_time_js($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellProfileId($mixedValue, $sKey, $aField, $aRow)
    {
        $iId = (int)$mixedValue;
        $sName = $this->_aProfiles[$iId] ?? '';
        if ($sName === '' && $iId > 0) {
            $oProfile = BxDolProfile::getInstance($iId);
            $sName = $oProfile ? $oProfile->getDisplayName() : (string)$iId;
        }

        return parent::_getCellDefault($this->esc($sName), $sKey, $aField, $aRow);
    }

    protected function _getCellSource($mixedValue, $sKey, $aField, $aRow)
    {
        $sKeyLang = '_adm_txt_admin_log_source_' . $mixedValue;
        $s = _t($sKeyLang);

        return parent::_getCellDefault($this->esc($s === $sKeyLang ? (string)$mixedValue : $s), $sKey, $aField, $aRow);
    }

    protected function _getCellAgentId($mixedValue, $sKey, $aField, $aRow)
    {
        $iId = (int)$mixedValue;
        $sName = $iId > 0 ? (string)($this->_aAgents[$iId] ?? $iId) : '';

        return parent::_getCellDefault($this->esc($sName), $sKey, $aField, $aRow);
    }

    protected function _getCellObjectType($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->esc((string)$mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellObjectId($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->esc((string)$mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellAction($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->esc((string)$mixedValue), $sKey, $aField, $aRow);
    }

    protected function applyFilter(string $sFilter): void
    {
        if (bx_mb_strpos($sFilter, '#-#') !== false) {
            $aParts = explode('#-#', $sFilter);
            $this->_sFilterSource = (string)($aParts[0] ?? '');
            $this->_sFilterProfile = (string)($aParts[1] ?? '');
            $this->_sFilterAgent = (string)($aParts[2] ?? '');
            $this->_sFilterObject = (string)($aParts[3] ?? '');
            $this->_sFilterFrom = (string)($aParts[4] ?? '');
            $this->_sFilterTo = (string)($aParts[5] ?? '');
        }

        $oDb = BxDolDb::getInstance();
        if (in_array($this->_sFilterSource, ['studio', 'agent', 'api', 'cli'], true))
            $this->_aOptions['source'] .= $oDb->prepareAsString(' AND `source` = ?', $this->_sFilterSource);

        $iProfile = (int)$this->_sFilterProfile;
        if ($iProfile > 0)
            $this->_aOptions['source'] .= $oDb->prepareAsString(' AND `profile_id` = ?', $iProfile);

        $iAgent = (int)$this->_sFilterAgent;
        if ($iAgent > 0)
            $this->_aOptions['source'] .= $oDb->prepareAsString(' AND `agent_id` = ?', $iAgent);

        if ($this->_sFilterObject !== '' && preg_match('/^[A-Za-z0-9_:-]{1,128}$/', $this->_sFilterObject))
            $this->_aOptions['source'] .= $oDb->prepareAsString(' AND `object_type` = ?', $this->_sFilterObject);

        $iFrom = $this->_sFilterFrom !== '' ? strtotime($this->_sFilterFrom) : false;
        if ($iFrom)
            $this->_aOptions['source'] .= $oDb->prepareAsString(' AND `added` >= ?', $iFrom);

        $iTo = $this->_sFilterTo !== '' ? strtotime($this->_sFilterTo) : false;
        if ($iTo)
            $this->_aOptions['source'] .= $oDb->prepareAsString(' AND `added` <= ?', $iTo + 86399);
    }

    protected function filterButton(): string
    {
        $aInput = $this->_getFilterButton(true);
        $aInput['tr_attrs'] = ['class' => 'bx-grid-controls-filter-button'];
        $aInput['attrs']['onClick'] = 'javascript:bx_admin_log_filter()';

        $oForm = new BxTemplFormView([]);

        return $oForm->genRow($aInput);
    }

    protected function diffRows(string $sBefore, string $sAfter): array
    {
        $aBefore = $this->decode($sBefore);
        $aAfter = $this->decode($sAfter);
        $aFlatBefore = $this->flatten($aBefore);
        $aFlatAfter = $this->flatten($aAfter);
        $aKeys = array_unique(array_merge(array_keys($aFlatBefore), array_keys($aFlatAfter)));

        $aRows = [];
        foreach ($aKeys as $sKey) {
            $sB = $this->show($aFlatBefore[$sKey] ?? '');
            $sA = $this->show($aFlatAfter[$sKey] ?? '');
            $aRows[] = [
                'key' => $this->esc((string)$sKey),
                'before' => $this->esc($sB),
                'after' => $this->esc($sA),
                'changed' => $sB === $sA ? '' : 'bx-admin-log-diff-changed',
            ];
        }

        if (!$aRows)
            $aRows[] = [
                'key' => '',
                'before' => $this->esc(_t('_adm_txt_admin_log_empty')),
                'after' => '',
                'changed' => '',
            ];

        return $aRows;
    }

    protected function decode(string $s): array
    {
        if ($s === '')
            return [];

        $a = json_decode($s, true);

        return is_array($a) ? $a : ['' => $s];
    }

    protected function flatten(array $a, string $sPrefix = ''): array
    {
        $aOut = [];
        foreach ($a as $sKey => $mValue) {
            $sName = $sPrefix === '' ? (string)$sKey : $sPrefix . '.' . $sKey;
            if (is_array($mValue))
                $aOut += $this->flatten($mValue, $sName);
            else
                $aOut[$sName] = $mValue;
        }

        return $aOut;
    }

    protected function show($mValue): string
    {
        if ($mValue === null)
            return '';
        if (is_bool($mValue))
            return $mValue ? '1' : '0';
        $s = (string)$mValue;
        if (get_mb_len($s) > 4000)
            $s = get_mb_substr($s, 0, 4000);

        return $s;
    }

    protected function esc(string $s): string
    {
        return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    }
}

/** @} */
