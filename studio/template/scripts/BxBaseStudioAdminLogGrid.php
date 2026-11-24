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
        $this->_oTemplate->addCss(['admin_log.css', 'forms.css']);

        // Every filter applies as soon as it is picked: the grid gets all of them joined, in the order applyFilter reads.
        $sObject = bx_js_string($this->_sObject);
        $sJs = "function bx_admin_log_filter(){var o=glGrids['" . $sObject . "'];if(!o)return;var v=function(n){var e=jQuery('#bx-grid-'+n+'-" . $sObject . "');return e.length?e.val():'';};o.setFilter([v('source'),v('profile_id'),v('agent_id'),v('object_type'),v('period')].join('#-#'), true);}";

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

        $aData = parent::_getDataSql('', $sOrderField, $sOrderDir, $iStart, $iPerPage);

        // the titles of this page's rows, read at once rather than cell by cell
        if (is_array($aData) && $aData) {
            $aTypes = $aOptions = [];
            foreach ($aData as $aRow) {
                $aTypes[] = (string)$aRow['object_type'];
                if ($aRow['object_type'] === 'option')
                    $aOptions[] = (string)$aRow['object_id'];
            }
            $this->loadLabels(array_unique($aTypes), $aOptions);
        }

        return $aData;
    }

    protected function _getFilterOnChange()
    {
        return 'bx_admin_log_filter()';
    }

    protected function _getFilterControls()
    {
        $aSources = [
            'studio' => '_adm_txt_admin_log_source_studio',
            'agent' => '_adm_txt_admin_log_source_agent',
            'api' => '_adm_txt_admin_log_source_api',
            'cli' => '_adm_txt_admin_log_source_cli',
        ];

        $aPeriods = [];
        foreach (self::PERIODS as $iDays)
            $aPeriods[(string)$iDays] = '_adm_txt_admin_log_period_' . $iDays;

        return $this->_getFilterSelectOne('source', $this->_sFilterSource, $aSources, '_adm_txt_admin_log_source_any')
            . $this->_getFilterSelectOne('profile_id', $this->_sFilterProfile, $this->_aProfiles, '_adm_txt_admin_log_profile_any')
            . $this->_getFilterSelectOne('agent_id', $this->_sFilterAgent, $this->_aAgents, '_adm_txt_admin_log_agent_any')
            . $this->_getFilterSelectOne('object_type', $this->_sFilterObject, $this->_aObjects, '_adm_txt_admin_log_object_any')
            . $this->_getFilterSelectOne('period', $this->_sFilterPeriod, $aPeriods, '_adm_txt_admin_log_period_any');
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
        return parent::_getCellDefault($this->esc($this->getObjectTypeTitle((string)$mixedValue)), $sKey, $aField, $aRow);
    }

    protected function _getCellObjectId($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->esc($this->getObjectName($aRow)), $sKey, $aField, $aRow);
    }

    protected function _getCellAction($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->esc($this->getActionTitle((string)$mixedValue)), $sKey, $aField, $aRow);
    }

    protected function applyFilter(string $sFilter): void
    {
        if (bx_mb_strpos($sFilter, '#-#') !== false) {
            $aParts = explode('#-#', $sFilter);
            $this->_sFilterSource = (string)($aParts[0] ?? '');
            $this->_sFilterProfile = (string)($aParts[1] ?? '');
            $this->_sFilterAgent = (string)($aParts[2] ?? '');
            $this->_sFilterObject = (string)($aParts[3] ?? '');
            $this->_sFilterPeriod = (string)($aParts[4] ?? '');
        }

        $iDays = (int)$this->_sFilterPeriod;
        if (!in_array($iDays, self::PERIODS, true))
            $this->_sFilterPeriod = '';

        $this->_aOptions['source'] .= BxDolAdminLogQuery::getInstance()->filterClause([
            'source' => $this->_sFilterSource,
            'profile_id' => $this->_sFilterProfile,
            'agent_id' => $this->_sFilterAgent,
            'object_type' => $this->_sFilterObject,
            'from' => $this->_sFilterPeriod !== '' ? time() - $iDays * 86400 : 0,
        ]);
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
