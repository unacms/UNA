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

class BxDolAIToolMysqlWrite extends BxDolAITool
{
    protected $_aDenyTables = [
        'sys_accounts',
        'sys_profiles',
        'sys_sessions',
        'sys_cron_jobs',
        'sys_modules',
        'sys_agents_sql_log',
        'sys_agents_chat_history',
        'sys_agents_tools',
        'sys_agents_agents',
        'sys_agents_prompt_feedback',
    ];

    public function __construct()
    {
        parent::__construct(
            'mysql_write',
            'INSERT or UPDATE one row. DELETE/DROP/TRUNCATE/ALTER are forbidden. UPDATE WHERE must identify exactly one row (prefer primary key: WHERE id = N). Snapshots are stored automatically. Prefer mysql_schema and mysql_select first. '
            . 'Call with dry_run=true first: it returns a plain-language summary (table, row, field: old → new) — show that to the person, never the SQL.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'query',
                type: PropertyType::STRING,
                description: 'Single INSERT or UPDATE. UPDATE needs WHERE that matches one row, e.g. WHERE `id` = 12. Table.column and extra AND conditions are ok. No DELETE. No multiple statements.',
                required: true
            ),
            new ToolProperty(
                name: 'dry_run',
                type: PropertyType::BOOLEAN,
                description: 'true = validate and return summary / changes (field: old → new) without writing. Use it before asking the person to confirm.',
                required: false
            ),
        ];
    }

    public function __invoke(string $query, $dry_run = false): array
    {
        $oDb = BxDolDb::getInstance();
        $sSql = $this->_normalize($query);
        $sBare = $this->_stripLiterals($sSql);
        $bDry = $dry_run === true || $dry_run === 1 || $dry_run === '1' || $dry_run === 'true';

        $this->_assertSafe($sBare);

        if (preg_match('/^insert\b/i', $sSql))
            $sOp = 'insert';
        else if (preg_match('/^update\b/i', $sSql))
            $sOp = 'update';
        else
            throw new Exception('Only INSERT or UPDATE is allowed.');

        $sTable = $this->_tableName($sSql, $sOp);
        $this->_assertTable($sTable);

        $sPk = $this->_primaryKey($oDb, $sTable);

        $sBefore = null;
        $sPkValue = '';
        if ($sOp === 'update') {
            $sPkValue = $this->_wherePkValue($sSql, $sPk, $oDb, $sTable);
            $aBefore = $this->_fetchRow($oDb, $sTable, $sPk, $sPkValue);
            if (!$aBefore)
                throw new Exception("Row not found: {$sTable}.{$sPk} = {$sPkValue}");
            $sBefore = json_encode($aBefore, JSON_UNESCAPED_UNICODE);
        }

        if ($bDry) {
            $aAssign = $this->_parseAssignments($sSql, $sOp);
            $aChanges = $this->_changes($sOp === 'update' ? ($aBefore ?? []) : null, $aAssign, $sOp === 'update');
            return [
                'ok' => 1,
                'dry_run' => 1,
                'op' => $sOp,
                'table' => $sTable,
                'pk' => $sPk,
                'pk_value' => $sPkValue,
                'changes' => $aChanges,
                'summary' => $this->_summary($sOp, $sTable, $sPkValue, $aChanges),
            ];
        }

        $mixedRes = $oDb->query($sSql);
        if ($mixedRes === false)
            throw new Exception('Query failed.');

        if ($sOp === 'insert') {
            $sPkValue = (string)$oDb->lastId();
            if ($sPkValue === '' || $sPkValue === '0')
                $sPkValue = $this->_insertedPkFromSql($sSql, $sPk);
            if ($sPkValue === '')
                throw new Exception('INSERT succeeded but primary key is unknown.');
        }

        $aAfter = $this->_fetchRow($oDb, $sTable, $sPk, $sPkValue);
        $iLogId = $this->_log($sOp, $sTable, $sPk, $sPkValue, $sSql, $sBefore, $aAfter ? json_encode($aAfter, JSON_UNESCAPED_UNICODE) : null);

        // exact diff from the snapshots (the dry run only had the parsed SET clause)
        $aChanges = $sOp === 'update'
            ? $this->_changes($aBefore ?? [], $aAfter ?: [], true)
            : $this->_changes(null, $this->_parseAssignments($sSql, $sOp), false);

        return [
            'ok' => 1,
            'op' => $sOp,
            'table' => $sTable,
            'pk' => $sPk,
            'pk_value' => $sPkValue,
            'log_id' => $iLogId,
            'affected' => is_numeric($mixedRes) ? (int)$mixedRes : 1,
            'changes' => $aChanges,
            'summary' => $this->_summary($sOp, $sTable, $sPkValue, $aChanges),
        ];
    }

    /**
     * column => literal from the SET clause (UPDATE / INSERT ... SET) or the
     * (columns) VALUES (...) pair. Expressions that are not plain literals
     * (NOW(), col + 1) are kept as their SQL text.
     */
    protected function _parseAssignments(string $sSql, string $sOp): array
    {
        $aOut = [];
        if (preg_match('/\bset\b(.+?)(?:\bwhere\b.*)?$/is', $sSql, $aM)) {
            foreach ($this->_splitTopLevel($aM[1]) as $sPair) {
                if (preg_match('/^\s*(?:`?[a-zA-Z0-9_]+`?\s*\.\s*)?`?([a-zA-Z0-9_]+)`?\s*=\s*(.+)$/s', trim($sPair), $aP))
                    $aOut[$aP[1]] = $this->_literal(trim($aP[2]));
            }
            return $aOut;
        }
        if ($sOp === 'insert' && preg_match('/^insert\s+into\s+`?[a-zA-Z0-9_]+`?\s*\((.+?)\)\s*values\s*\((.+)\)\s*$/is', $sSql, $aM)) {
            $aCols = array_map(fn($c) => trim($c, " `\t\n\r"), $this->_splitTopLevel($aM[1]));
            $aVals = $this->_splitTopLevel($aM[2]);
            foreach ($aCols as $i => $sCol) {
                if ($sCol !== '' && array_key_exists($i, $aVals))
                    $aOut[$sCol] = $this->_literal(trim($aVals[$i]));
            }
        }
        return $aOut;
    }

    /** Split on commas that are outside quotes and parentheses. */
    protected function _splitTopLevel(string $s): array
    {
        $aOut = [];
        $sCur = '';
        $iDepth = 0;
        $sQuote = '';
        $iLen = strlen($s);
        for ($i = 0; $i < $iLen; $i++) {
            $c = $s[$i];
            if ($sQuote !== '') {
                $sCur .= $c;
                if ($c === '\\' && $i + 1 < $iLen) {
                    $sCur .= $s[++$i];
                } elseif ($c === $sQuote) {
                    if ($i + 1 < $iLen && $s[$i + 1] === $sQuote)
                        $sCur .= $s[++$i];
                    else
                        $sQuote = '';
                }
                continue;
            }
            if ($c === "'" || $c === '"') {
                $sQuote = $c;
                $sCur .= $c;
            } elseif ($c === '(') {
                $iDepth++;
                $sCur .= $c;
            } elseif ($c === ')') {
                $iDepth--;
                $sCur .= $c;
            } elseif ($c === ',' && $iDepth === 0) {
                $aOut[] = $sCur;
                $sCur = '';
            } else {
                $sCur .= $c;
            }
        }
        if (trim($sCur) !== '')
            $aOut[] = $sCur;
        return $aOut;
    }

    /** SQL literal → PHP value; anything else stays as the expression text. */
    protected function _literal(string $s)
    {
        if (preg_match('/^null$/i', $s))
            return null;
        if (preg_match('/^-?\d+(\.\d+)?$/', $s))
            return $s + 0;
        $iLen = strlen($s);
        if ($iLen >= 2 && ($s[0] === "'" || $s[0] === '"') && $s[$iLen - 1] === $s[0]) {
            $q = $s[0];
            $sInner = substr($s, 1, -1);
            $sInner = str_replace($q . $q, $q, $sInner);
            return stripcslashes($sInner);
        }
        return $s;
    }

    /**
     * [{field, before, after}] — for an update only the fields whose value
     * actually changes; for an insert every given field (before = null).
     */
    protected function _changes(?array $aBefore, array $aAfter, bool $bDiff): array
    {
        $aOut = [];
        foreach ($aAfter as $sField => $mixedAfter) {
            $mixedBefore = $aBefore[$sField] ?? null;
            if ($bDiff && (string)$mixedBefore === (string)$mixedAfter)
                continue;
            $aOut[] = [
                'field' => $sField,
                'before' => $bDiff ? $this->_short($mixedBefore) : null,
                'after' => $this->_short($mixedAfter),
            ];
        }
        return $aOut;
    }

    protected function _short($mixed): ?string
    {
        if ($mixed === null)
            return null;
        $s = trim(strip_tags((string)$mixed));
        $s = preg_replace('/\s+/u', ' ', $s);
        return mb_strlen($s) > 120 ? mb_substr($s, 0, 119) . '…' : $s;
    }

    /** "sys_menu_items #12: active: 0 → 1; title: «Old» → «New»" */
    protected function _summary(string $sOp, string $sTable, string $sPkValue, array $aChanges): string
    {
        $fQ = fn($v) => $v === null || $v === '' ? '—' : (is_numeric($v) ? (string)$v : '«' . $v . '»');
        $aParts = [];
        foreach ($aChanges as $aC)
            $aParts[] = $aC['field'] . ': ' . ($sOp === 'update' ? $fQ($aC['before']) . ' → ' : '') . $fQ($aC['after']);
        $sHead = $sTable . ($sPkValue !== '' ? ' #' . $sPkValue : '');
        if (!$aParts)
            return $sHead . ($sOp === 'update' ? ': no changes' : ': new row');
        return ($sOp === 'insert' ? 'new row in ' : '') . $sHead . ': ' . implode('; ', $aParts);
    }

    protected function _normalize(string $s): string
    {
        $s = preg_replace('~/\*.*?\*/~s', ' ', $s);
        $s = preg_replace('/--[^\n]*/', ' ', $s);
        $s = preg_replace('/#[^\n]*/', ' ', $s);
        $s = trim($s);
        $s = rtrim($s, "; \t\n\r");
        if ($s === '')
            throw new Exception('Empty query.');
        if (strpos($s, ';') !== false)
            throw new Exception('Multiple statements are not allowed.');
        return $s;
    }

    protected function _stripLiterals(string $s): string
    {
        $s = preg_replace("/'([^'\\\\]|\\\\.)*'/s", "''", $s);
        $s = preg_replace('/"([^"\\\\]|\\\\.)*"/s', '""', $s);
        return $s;
    }

    protected function _assertSafe(string $sBare): void
    {
        if (preg_match('/\b(delete|drop|truncate|alter|replace|create|grant|revoke|call|handler|load|outfile|dumpfile|into\s+outfile|lock\s+tables|unlock\s+tables)\b/i', $sBare))
            throw new Exception('Forbidden SQL keyword.');
        if (preg_match('/\bon\s+duplicate\s+key\b/i', $sBare))
            throw new Exception('ON DUPLICATE KEY is not allowed.');
        if (preg_match('/^insert\b/i', $sBare) && preg_match('/\bselect\b/i', $sBare))
            throw new Exception('INSERT ... SELECT is not allowed.');
    }

    protected function _tableName(string $sSql, string $sOp): string
    {
        if ($sOp === 'insert' && preg_match('/^insert\s+into\s+`?([a-zA-Z0-9_]+)`?/i', $sSql, $aM))
            return $aM[1];
        if ($sOp === 'update' && preg_match('/^update\s+(?:low_priority\s+|ignore\s+)*`?([a-zA-Z0-9_]+)`?/i', $sSql, $aM))
            return $aM[1];
        throw new Exception('Cannot parse table name.');
    }

    protected function _assertTable(string $sTable): void
    {
        $sTable = strtolower($sTable);
        if (in_array($sTable, $this->_aDenyTables, true))
            throw new Exception("Table {$sTable} is not writable by this tool.");
        if (preg_match('/^(mysql|information_schema|performance_schema|sys)\./', $sTable))
            throw new Exception("Table {$sTable} is not writable by this tool.");
    }

    protected function _primaryKey(BxDolDb $oDb, string $sTable): string
    {
        $aKeys = $oDb->getAll("SHOW KEYS FROM `" . str_replace('`', '', $sTable) . "` WHERE `Key_name` = 'PRIMARY'");
        if (!$aKeys)
            throw new Exception("Table {$sTable} has no PRIMARY KEY.");
        if (count($aKeys) > 1)
            throw new Exception("Composite primary keys are not supported.");
        return $aKeys[0]['Column_name'];
    }

    protected function _wherePkValue(string $sSql, string $sPk, BxDolDb $oDb, string $sTable): string
    {
        if (!preg_match('/\bwhere\b(.+)$/is', $sSql, $aM))
            throw new Exception('UPDATE requires WHERE primary_key = value.');

        $sWhere = trim($aM[1]);
        $sWhere = preg_replace('/\s+(limit|order\s+by|offset)\b.*$/is', '', $sWhere);
        $sWhere = trim($sWhere, " \t\n\r;");
        if ($sWhere === '')
            throw new Exception('UPDATE requires WHERE primary_key = value.');

        $sWhereBare = $this->_stripLiterals($sWhere);
        if (preg_match('/\b(or|in\s*\(|between|like|exists|select)\b/i', $sWhereBare))
            throw new Exception('UPDATE WHERE must be a simple equality (no OR / IN / LIKE).');

        $sPkRe = preg_quote($sPk, '/');
        $sTableRe = preg_quote($sTable, '/');
        $sIdent = '(?:`?' . $sTableRe . '`?\s*\.\s*)?`?' . $sPkRe . '`?';
        if (preg_match('/(?:^|\band\s+)\s*\(?\s*' . $sIdent . '\s*=\s*(\d+|\'[^\']*\'|"[^"]*")/i', $sWhere, $aV))
            return trim($aV[1], "\"'");

        $sTableSafe = str_replace('`', '', $sTable);
        $sPkSafe = str_replace('`', '', $sPk);
        $aRows = $oDb->getAll("SELECT `{$sPkSafe}` FROM `{$sTableSafe}` WHERE {$sWhere} LIMIT 2");
        if (!$aRows)
            throw new Exception("No rows match UPDATE WHERE. Use `{$sPk}` = value.");
        if (count($aRows) > 1)
            throw new Exception("UPDATE WHERE matched more than one row. Use `{$sPk}` = value.");

        return (string)$aRows[0][$sPkSafe];
    }

    protected function _insertedPkFromSql(string $sSql, string $sPk): string
    {
        $sPkRe = preg_quote($sPk, '/');
        if (preg_match('/`' . $sPkRe . '`\s*=\s*(\d+|\'[^\']*\'|"[^"]*")/i', $sSql, $aM))
            return trim($aM[1], "\"'");
        if (preg_match('/\b' . $sPkRe . '\b\s*=\s*(\d+|\'[^\']*\'|"[^"]*")/i', $sSql, $aM))
            return trim($aM[1], "\"'");
        return '';
    }

    protected function _fetchRow(BxDolDb $oDb, string $sTable, string $sPk, string $sPkValue): array|false
    {
        $sTable = str_replace('`', '', $sTable);
        $sPk = str_replace('`', '', $sPk);
        if (preg_match('/^\d+$/', $sPkValue))
            return $oDb->getRow("SELECT * FROM `{$sTable}` WHERE `{$sPk}` = :v LIMIT 1", ['v' => (int)$sPkValue]);
        return $oDb->getRow("SELECT * FROM `{$sTable}` WHERE `{$sPk}` = :v LIMIT 1", ['v' => $sPkValue]);
    }

    public static function currentLogContext(): array
    {
        $oDb = BxDolDb::getInstance();
        $oAi = BxDolAi::getInstance();
        $iAgentId = 0;
        $sThread = '';
        $iProfile = is_object($oAi) ? (int)$oAi->getProfileId() : 0;
        $iHist = (int)BxDolAiChat::getInstance()->getCurrentChatHistoryId();
        if ($iHist > 0) {
            $aRow = $oDb->getRow("SELECT `thread_id` FROM `sys_agents_chat_history` WHERE `id` = :id", ['id' => $iHist]);
            $sThread = $aRow['thread_id'] ?? '';
            $aParts = explode(':', $sThread);
            $iAgentId = (int)($aParts[1] ?? 0);
        }

        return [
            'agent_id' => $iAgentId,
            'profile_id' => $iProfile,
            'thread_id' => $sThread,
        ];
    }

    protected function _log(string $sOp, string $sTable, string $sPk, string $sPkValue, string $sSql, ?string $sBefore, ?string $sAfter): int
    {
        $oDb = BxDolDb::getInstance();
        $aCtx = self::currentLogContext();

        $oDb->query("INSERT INTO `sys_agents_sql_log` SET " . $oDb->arrayToSQL([
            'agent_id' => $aCtx['agent_id'],
            'profile_id' => $aCtx['profile_id'],
            'thread_id' => $aCtx['thread_id'],
            'op' => $sOp,
            'table_name' => $sTable,
            'pk_name' => $sPk,
            'pk_value' => $sPkValue,
            'sql_text' => $sSql,
            'before_json' => $sBefore,
            'after_json' => $sAfter,
            'added' => time(),
        ]));

        return (int)$oDb->lastId();
    }
}
