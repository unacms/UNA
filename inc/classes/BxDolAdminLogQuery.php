<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAdminLogQuery extends BxDolDb
{
    public function __construct()
    {
        parent::__construct();
    }

    public static function getInstance(): self
    {
        if (!isset($GLOBALS['bxDolClasses'][self::class]))
            $GLOBALS['bxDolClasses'][self::class] = new self();

        return $GLOBALS['bxDolClasses'][self::class];
    }

    /**
     * The only insert into sys_admin_log.
     */
    public function add(array $a): int
    {
        $aRow = [
            'added' => (int)($a['added'] ?? time()),
            'profile_id' => (int)($a['profile_id'] ?? 0),
            'source' => $this->normalizeSource($a['source'] ?? 'studio'),
            'agent_id' => (int)($a['agent_id'] ?? 0),
            'thread_id' => $this->clip((string)($a['thread_id'] ?? ''), 255),
            'object_type' => $this->clip((string)($a['object_type'] ?? ''), 128),
            'object_id' => $this->clip((string)($a['object_id'] ?? ''), 255),
            'action' => $this->clip((string)($a['action'] ?? ''), 64),
            'before' => (string)($a['before'] ?? ''),
            'after' => (string)($a['after'] ?? ''),
            'ip' => $this->clip((string)($a['ip'] ?? ''), 64),
        ];

        $this->query("INSERT INTO `sys_admin_log` SET " . $this->arrayToSQL($aRow));

        return (int)$this->lastId();
    }

    public function getById(int $iId): array|false
    {
        $a = $this->getRow("SELECT * FROM `sys_admin_log` WHERE `id` = :id LIMIT 1", ['id' => $iId]);

        return $a ?: false;
    }

    /**
     * One SELECT for the whole id set.
     *
     * @return array<string, array>
     */
    public function getRows(string $sTable, string $sField, array $aIds): array
    {
        if (!$this->isValidFieldName($sTable, true) || !$this->isValidFieldName($sField, true))
            return [];
        if (!$this->isTableExists($sTable) || !$this->isFieldExists($sTable, $sField))
            return [];

        $aClean = [];
        foreach ($aIds as $mId) {
            if ($mId === '' || $mId === null || $mId === false || is_array($mId))
                continue;
            $aClean[] = $mId;
        }
        if (!$aClean)
            return [];

        $sIn = $this->implode_escape($aClean);
        $aRows = $this->getAll("SELECT * FROM `{$sTable}` WHERE `{$sField}` IN ({$sIn})");
        if (!$aRows)
            return [];

        $aOut = [];
        foreach ($aRows as $aRow)
            if (isset($aRow[$sField]))
                $aOut[(string)$aRow[$sField]] = $aRow;

        return $aOut;
    }

    public function deleteOlderThan(int $iDays): void
    {
        if ($iDays <= 0 || !$this->isTableExists('sys_admin_log'))
            return;

        $this->query("DELETE FROM `sys_admin_log` WHERE `added` < :cut", [
            'cut' => time() - ($iDays * 86400),
        ]);
    }

    public function getColumnValues(string $sColumn): array
    {
        switch ($sColumn) {
            case 'source':
                $sSql = "SELECT DISTINCT `source` FROM `sys_admin_log` WHERE `source` <> '' ORDER BY `source` ASC";
                break;
            case 'object_type':
                $sSql = "SELECT DISTINCT `object_type` FROM `sys_admin_log` WHERE `object_type` <> '' ORDER BY `object_type` ASC LIMIT 200";
                break;
            case 'profile_id':
                $sSql = "SELECT DISTINCT `profile_id` FROM `sys_admin_log` WHERE `profile_id` > 0 ORDER BY `profile_id` ASC LIMIT 200";
                break;
            default:
                return [];
        }

        if (!$this->isTableExists('sys_admin_log'))
            return [];

        $a = $this->getColumn($sSql);

        return is_array($a) ? $a : [];
    }

    /**
     * The AND fragment for the admin log grid. Values are whitelisted or cast here, not in the grid.
     */
    public function filterClause(array $a): string
    {
        $s = '';
        $sSource = (string)($a['source'] ?? '');
        if (in_array($sSource, ['studio', 'agent', 'api', 'cli'], true))
            $s .= $this->prepareAsString(' AND `source` = ?', $sSource);

        $iProfile = (int)($a['profile_id'] ?? 0);
        if ($iProfile > 0)
            $s .= $this->prepareAsString(' AND `profile_id` = ?', $iProfile);

        $iAgent = (int)($a['agent_id'] ?? 0);
        if ($iAgent > 0)
            $s .= $this->prepareAsString(' AND `agent_id` = ?', $iAgent);

        $sObject = (string)($a['object_type'] ?? '');
        if ($sObject !== '' && preg_match('/^[A-Za-z0-9_:-]{1,128}$/', $sObject))
            $s .= $this->prepareAsString(' AND `object_type` = ?', $sObject);

        $iFrom = (int)($a['from'] ?? 0);
        if ($iFrom > 0)
            $s .= $this->prepareAsString(' AND `added` >= ?', $iFrom);

        $iTo = (int)($a['to'] ?? 0);
        if ($iTo > 0)
            $s .= $this->prepareAsString(' AND `added` <= ?', $iTo);

        return $s;
    }

    public function getAgents(): array
    {
        if (!$this->isTableExists('sys_admin_log') || !$this->isTableExists('sys_agents_agents'))
            return [];

        $a = $this->getPairs("SELECT `a`.`id`, `a`.`name` FROM `sys_agents_agents` AS `a` INNER JOIN (SELECT DISTINCT `agent_id` FROM `sys_admin_log` WHERE `agent_id` > 0) AS `l` ON `l`.`agent_id` = `a`.`id` ORDER BY `a`.`name` ASC", 'id', 'name');

        return is_array($a) ? $a : [];
    }

    /**
     * Grid object => its table, for the grids named in a page of log rows.
     */
    public function getGridTables(array $aObjects): array
    {
        $aObjects = array_values(array_filter(array_map('strval', $aObjects), fn($s) => $s !== ''));
        if (!$aObjects)
            return [];

        $a = $this->getPairs("SELECT `object`, `table` FROM `sys_objects_grid` WHERE `object` IN (" . $this->implode_escape($aObjects) . ")", 'object', 'table');

        return is_array($a) ? $a : [];
    }

    /**
     * Setting name => its caption language key, for the settings named in a page of log rows.
     */
    public function getOptionCaptions(array $aNames): array
    {
        $aNames = array_values(array_filter(array_map('strval', $aNames), fn($s) => $s !== ''));
        if (!$aNames)
            return [];

        $a = $this->getPairs("SELECT `name`, `caption` FROM `sys_options` WHERE `name` IN (" . $this->implode_escape($aNames) . ")", 'name', 'caption');

        return is_array($a) ? $a : [];
    }

    protected function normalizeSource($sSource): string
    {
        $sSource = (string)$sSource;

        return in_array($sSource, ['studio', 'agent', 'api', 'cli'], true) ? $sSource : 'studio';
    }

    protected function clip(string $s, int $iLen): string
    {
        if (get_mb_len($s) <= $iLen)
            return $s;

        return get_mb_substr($s, 0, $iLen);
    }
}

/** @} */
