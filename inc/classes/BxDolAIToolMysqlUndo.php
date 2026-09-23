<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\ToolProperty;

class BxDolAIToolMysqlUndo extends BxDolAITool
{
    public function __construct()
    {
        parent::__construct(
            'mysql_undo',
            'Roll back mysql_write changes from sys_agents_sql_log. scope=last undoes the latest snapshot in this chat; scope=session undoes all remaining snapshots in reverse order. INSERT is undone by deleting that PK internally. UPDATE restores the before snapshot. Do not use mysql_write DELETE.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'scope',
                type: PropertyType::STRING,
                description: 'last = one newest change in this chat. session = all not-yet-undone changes in this chat, newest first.',
                required: true
            ),
            new ToolProperty(
                name: 'log_id',
                type: PropertyType::NUMBER,
                description: 'Optional sys_agents_sql_log.id. If set, undo that snapshot only (must belong to this chat).',
                required: false
            ),
        ];
    }

    public function __invoke(string $scope = 'last', $log_id = 0): array
    {
        $oDb = BxDolDb::getInstance();
        $this->_ensureUndoneColumn($oDb);

        $sScope = strtolower(trim($scope));
        if (!in_array($sScope, ['last', 'session'], true))
            throw new Exception('scope must be last or session.');

        $iLogId = (int)$log_id;
        $aCtx = BxDolAIToolMysqlWrite::currentLogContext();
        $sThread = (string)$aCtx['thread_id'];
        // Only this chat's own changes: without a chat there is nothing that is ours to undo.
        if ($sThread === '')
            throw new Exception('Undo works inside a chat only: there is no current chat to undo changes of.');

        $aRows = $this->_pickRows($oDb, $sScope, $iLogId, $sThread);
        if (!$aRows)
            throw new Exception('Nothing to undo in this chat.');

        $aDone = [];
        foreach ($aRows as $aRow) {
            $aDone[] = $this->_undoRow($oDb, $aRow);
        }

        return [
            'ok' => 1,
            'scope' => $iLogId > 0 ? 'log_id' : $sScope,
            'undone' => count($aDone),
            'items' => $aDone,
        ];
    }

    protected function _ensureUndoneColumn(BxDolDb $oDb): void
    {
        if (!$oDb->isTableExists('sys_agents_sql_log'))
            throw new Exception('sys_agents_sql_log is missing: apply the agents upgrade SQL first.');
        if (!$oDb->isFieldExists('sys_agents_sql_log', 'undone'))
            $oDb->query("ALTER TABLE `sys_agents_sql_log` ADD `undone` int(11) NOT NULL DEFAULT 0");
    }

    protected function _pickRows(BxDolDb $oDb, string $sScope, int $iLogId, string $sThread): array
    {
        if ($iLogId > 0) {
            $aRow = $oDb->getRow("SELECT * FROM `sys_agents_sql_log` WHERE `id` = :id LIMIT 1", ['id' => $iLogId]);
            if (!$aRow)
                throw new Exception("log_id {$iLogId} not found.");
            if ((int)$aRow['undone'] > 0)
                throw new Exception("log_id {$iLogId} is already undone.");
            if ((string)$aRow['thread_id'] !== $sThread)
                throw new Exception("log_id {$iLogId} belongs to another chat.");
            return [$aRow];
        }

        $sSql = "SELECT * FROM `sys_agents_sql_log` WHERE `thread_id` = :t AND `undone` = 0 ORDER BY `id` DESC";
        $aBind = ['t' => $sThread];

        if ($sScope === 'last')
            $sSql .= " LIMIT 1";
        else
            $sSql .= " LIMIT 40";

        $aRows = $oDb->getAll($sSql, $aBind);
        return is_array($aRows) ? $aRows : [];
    }

    protected function _undoRow(BxDolDb $oDb, array $aRow): array
    {
        $sOp = strtolower((string)$aRow['op']);
        $sTable = str_replace('`', '', (string)$aRow['table_name']);
        $sPk = str_replace('`', '', (string)$aRow['pk_name']);
        $sPkValue = (string)$aRow['pk_value'];

        if ($sTable === '' || $sPk === '' || $sPkValue === '')
            throw new Exception("log_id {$aRow['id']} has incomplete snapshot.");
        if (!$oDb->isValidFieldName($sTable) || !$oDb->isValidFieldName($sPk))
            throw new Exception("log_id {$aRow['id']} has invalid table/pk.");

        if ($sOp === 'insert')
            $this->_undoInsert($oDb, $sTable, $sPk, $sPkValue);
        else if ($sOp === 'update')
            $this->_undoUpdate($oDb, $aRow, $sTable, $sPk, $sPkValue);
        else
            throw new Exception("Cannot undo op {$sOp}.");

        $oDb->query("UPDATE `sys_agents_sql_log` SET `undone` = :ts WHERE `id` = :id", [
            'ts' => time(),
            'id' => (int)$aRow['id'],
        ]);

        return [
            'log_id' => (int)$aRow['id'],
            'op' => $sOp,
            'table' => $sTable,
            'pk' => $sPk,
            'pk_value' => $sPkValue,
        ];
    }

    protected function _undoInsert(BxDolDb $oDb, string $sTable, string $sPk, string $sPkValue): void
    {
        $aBind = ['v' => preg_match('/^\d+$/', $sPkValue) ? (int)$sPkValue : $sPkValue];
        $oDb->query("DELETE FROM `{$sTable}` WHERE `{$sPk}` = :v LIMIT 1", $aBind);
    }

    protected function _undoUpdate(BxDolDb $oDb, array $aRow, string $sTable, string $sPk, string $sPkValue): void
    {
        $aBefore = json_decode((string)$aRow['before_json'], true);
        if (!is_array($aBefore) || !$aBefore)
            throw new Exception("log_id {$aRow['id']} has no before snapshot.");

        $aCurrent = $this->_fetchRow($oDb, $sTable, $sPk, $sPkValue);
        if (!$aCurrent)
            throw new Exception("Row {$sTable}.{$sPk}={$sPkValue} is gone; cannot restore.");

        $aAfter = json_decode((string)($aRow['after_json'] ?? ''), true);
        if (is_array($aAfter) && $aAfter && !$this->_rowsClose($aCurrent, $aAfter) && !$this->_rowsClose($aCurrent, $aBefore))
            throw new Exception("Row {$sTable}.{$sPk}={$sPkValue} changed after the write; refuse undo.");

        $aSet = [];
        foreach ($aBefore as $sField => $mixedVal) {
            if (!$oDb->isValidFieldName($sField))
                throw new Exception("Invalid field {$sField} in snapshot.");
            if ($sField === $sPk)
                continue;
            $aSet[$sField] = $mixedVal;
        }
        if (!$aSet)
            throw new Exception("log_id {$aRow['id']} snapshot has nothing to restore.");

        $sSet = '';
        foreach ($aSet as $sField => $mixedVal) {
            $sSet .= ($sSet === '' ? '' : ', ') . '`' . $sField . '` = ' . ($mixedVal === null ? 'NULL' : $oDb->escape($mixedVal));
        }

        $sPkSql = preg_match('/^\d+$/', $sPkValue) ? (int)$sPkValue : $oDb->escape($sPkValue);
        $oDb->query("UPDATE `{$sTable}` SET {$sSet} WHERE `{$sPk}` = {$sPkSql} LIMIT 1");
    }

    protected function _fetchRow(BxDolDb $oDb, string $sTable, string $sPk, string $sPkValue): array|false
    {
        $aBind = ['v' => preg_match('/^\d+$/', $sPkValue) ? (int)$sPkValue : $sPkValue];
        return $oDb->getRow("SELECT * FROM `{$sTable}` WHERE `{$sPk}` = :v LIMIT 1", $aBind);
    }

    protected function _rowsClose(array $aA, array $aB): bool
    {
        foreach ($aB as $sKey => $mixedB) {
            if (!array_key_exists($sKey, $aA))
                return false;
            if ((string)($aA[$sKey] ?? '') !== (string)($mixedB ?? ''))
                return false;
        }
        return true;
    }
}
