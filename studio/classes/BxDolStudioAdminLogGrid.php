<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioAdminLogGrid extends BxDolStudioGrid
{
    /**
     * Object types the log writes with a short name, and the table each one stands for.
     */
    const TYPE_TABLES = [
        'option' => 'sys_options',
        'module' => 'sys_modules',
        'menu_item' => 'sys_menu_items',
        'page_block' => 'sys_pages_blocks',
        'form' => 'sys_objects_form',
    ];

    /**
     * Periods of the filter, in days.
     */
    const PERIODS = [1, 7, 30, 365];

    protected $_sSource = '';

    protected $_sFilterSource = '';
    protected $_sFilterProfile = '';
    protected $_sFilterAgent = '';
    protected $_sFilterObject = '';
    protected $_sFilterPeriod = '';

    protected $_aProfiles = [];
    protected $_aAgents = [];
    protected $_aObjects = [];

    protected $_aGridTables = [];
    protected $_aOptionCaptions = [];
    protected $_aModuleTitles = [];
    protected $_aModulePrefixes = [];

    public function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_sSource = (string)($aOptions['source'] ?? '');
        $this->_sDefaultSortingOrder = 'DESC';

        $this->_aFilterAreaLabels = [
            'source' => '_adm_form_txt_admin_log_source',
            'profile_id' => '_adm_form_txt_admin_log_profile',
            'agent_id' => '_adm_form_txt_admin_log_agent',
            'object_type' => '_adm_form_txt_admin_log_object',
            'period' => '_adm_txt_admin_log_period',
        ];

        $this->loadFilters();
    }

    protected function loadFilters(): void
    {
        try {
            $oQuery = BxDolAdminLogQuery::getInstance();
            foreach ($oQuery->getColumnValues('profile_id') as $iProfile) {
                $iProfile = (int)$iProfile;
                $oProfile = BxDolProfile::getInstance($iProfile);
                $this->_aProfiles[$iProfile] = $oProfile ? $oProfile->getDisplayName() : (string)$iProfile;
            }
            $this->_aAgents = $oQuery->getAgents();

            $aTypes = array_map('strval', $oQuery->getColumnValues('object_type'));
            $this->loadLabels($aTypes, []);
            foreach ($aTypes as $sType)
                $this->_aObjects[$sType] = $this->getObjectTypeTitle($sType);
            asort($this->_aObjects, SORT_NATURAL | SORT_FLAG_CASE);
        }
        catch (Throwable $e) {
            $this->_aProfiles = [];
            $this->_aAgents = [];
            $this->_aObjects = [];
        }
    }

    /**
     * What the titles of a page of rows need, read at once: the tables behind the grids, the captions of the settings
     * and the titles of the modules.
     */
    protected function loadLabels(array $aTypes, array $aOptionNames): void
    {
        $oQuery = BxDolAdminLogQuery::getInstance();

        $aGrids = [];
        foreach ($aTypes as $sType)
            if (str_starts_with($sType, 'grid:') && !isset($this->_aGridTables[$sGrid = substr($sType, 5)]))
                $aGrids[] = $sGrid;
        if ($aGrids)
            $this->_aGridTables += $oQuery->getGridTables($aGrids);

        $aOptionNames = array_diff(array_unique($aOptionNames), array_keys($this->_aOptionCaptions));
        if ($aOptionNames)
            $this->_aOptionCaptions += $oQuery->getOptionCaptions($aOptionNames);

        if (!$this->_aModuleTitles)
            foreach (BxDolModuleQuery::getInstance()->getModules() as $aModule) {
                $this->_aModuleTitles[$aModule['name']] = $aModule['title'];
                if (!empty($aModule['db_prefix']))
                    $this->_aModulePrefixes[$aModule['db_prefix']] = $aModule['title'];
            }
    }

    /**
     * grid:sys_studio_nav_items -> Menu item; content:bx_posts -> Content: Posts; studio:builder_page -> Studio: Pages.
     * A type without a title is shown as it is stored.
     */
    public function getObjectTypeTitle(string $sType): string
    {
        [$sKind, $sName] = array_pad(explode(':', $sType, 2), 2, '');

        switch ($sKind) {
            case 'grid':
                return isset($this->_aGridTables[$sName]) ? $this->getTableTitle($this->_aGridTables[$sName], $sType) : $sType;

            case 'content':
            case 'cmts':
                return _t('_adm_txt_admin_log_t_' . $sKind, $this->getModuleTitle($sName));

            case 'studio':
                foreach (['_adm_wgt_cpt_' . $sName, '_adm_wgt_cpt_' . $sName . 's'] as $sKey)
                    if (($sTitle = _t($sKey)) !== $sKey)
                        return _t('_adm_txt_admin_log_t_studio', $sTitle);

                return _t('_adm_txt_admin_log_t_studio', $sName);
        }

        return $this->getTableTitle(self::TYPE_TABLES[$sType] ?? $sType, $sType);
    }

    protected function getTableTitle(string $sTable, string $sDefault): string
    {
        $sKey = '_adm_txt_admin_log_t_' . $sTable;
        if (($sTitle = _t($sKey)) !== $sKey)
            return $sTitle;

        foreach ($this->_aModulePrefixes as $sPrefix => $sModule)
            if (str_starts_with($sTable, $sPrefix))
                return _t('_adm_txt_admin_log_t_module_data', $sModule);

        return $sDefault;
    }

    protected function getModuleTitle(string $sName): string
    {
        return $this->_aModuleTitles[$sName] ?? $sName;
    }

    /**
     * add, block_edit, UPDATE -> Added, Edited, Updated; an action without a title is shown as it is stored.
     */
    public function getActionTitle(string $sAction): string
    {
        $sName = strtolower(str_replace('-', '_', $sAction));
        $aParts = explode('_', $sName);

        foreach (array_unique([$sName, end($aParts), reset($aParts)]) as $sCandidate) {
            $sKey = '_adm_txt_admin_log_a_' . $sCandidate;
            if ($sCandidate !== '' && ($sTitle = _t($sKey)) !== $sKey)
                return $sTitle;
        }

        return $sAction;
    }

    /**
     * The changed item as people know it: a setting's caption, a module's title, or the title of the row it changed,
     * with its id.
     */
    public function getObjectName(array $aRow): string
    {
        $sType = (string)$aRow['object_type'];
        $sId = (string)$aRow['object_id'];

        if ($sType === 'option')
            return isset($this->_aOptionCaptions[$sId]) ? _t($this->_aOptionCaptions[$sId]) : $sId;

        if (in_array($sType, ['module', 'language', 'template'], true))
            return $this->getModuleTitle($sId);

        if ($sId === '' || str_contains($sId, ','))
            return $sId;

        $sTitle = $this->getRowTitle((string)$aRow['after']);
        if ($sTitle === '')
            $sTitle = $this->getRowTitle((string)$aRow['before']);

        return $sTitle !== '' ? _t('_adm_txt_admin_log_item', $sTitle, $sId) : $sId;
    }

    protected function getRowTitle(string $sJson): string
    {
        if ($sJson === '')
            return '';

        $a = json_decode($sJson, true);
        if (!is_array($a))
            return '';

        // a grid snapshot is keyed by id, an agent's is the row itself or a list of rows
        if (!array_is_list($a) && !$this->hasTitle($a))
            $a = reset($a);
        elseif (array_is_list($a))
            $a = $a[0] ?? [];

        if (!is_array($a))
            return '';

        foreach (['title', 'caption', 'title_system', 'name', 'subject', 'email'] as $sField) {
            if (!isset($a[$sField]) || !is_scalar($a[$sField]) || (string)$a[$sField] === '')
                continue;

            $s = (string)$a[$sField];
            if (str_starts_with($s, '_'))
                $s = _t($s);

            return get_mb_len($s) > 80 ? get_mb_substr($s, 0, 80) . '...' : $s;
        }

        return '';
    }

    protected function hasTitle(array $a): bool
    {
        foreach (['title', 'caption', 'title_system', 'name', 'subject', 'email'] as $sField)
            if (isset($a[$sField]) && is_scalar($a[$sField]))
                return true;

        return false;
    }
}

/** @} */
