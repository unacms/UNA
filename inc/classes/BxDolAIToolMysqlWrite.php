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
    /**
     * Tables the tool never writes: identity and sign-in, permissions, secrets, code
     * that runs on its own (cron, alert handlers, injections), and the agents' own
     * configuration and logs. An entry ending in `*` is a prefix.
     *
     * This is a guardrail against a model's mistakes, not a security boundary: attach
     * the tool only to agents that operators talk to.
     */
    protected $_aDenyTables = [
        'sys_accounts*',
        'sys_profiles',
        'sys_sessions',
        'sys_keys',
        'sys_acl_*',
        'sys_std_roles*',
        'sys_api_*',
        'sys_agents_*',
        'sys_modules*',
        'sys_cron_jobs',
        'sys_alerts_handlers',
        'sys_injections*',
    ];

    public function __construct()
    {
        parent::__construct(
            'mysql_write',
            'INSERT one row, or UPDATE one row by its primary key. DELETE/DROP/TRUNCATE/ALTER and subqueries are forbidden. UPDATE must be `UPDATE table SET ... WHERE pk = value`: one table, and nothing but the primary key in WHERE. Snapshots are stored automatically. Use mysql_schema and mysql_select first to find the primary key.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'query',
                type: PropertyType::STRING,
                description: 'Single INSERT (one row: VALUES (...) or SET ...) or UPDATE `table` SET ... WHERE `pk` = value. No SQL comments, no subqueries, no multiple statements.',
                required: true
            ),
        ];
    }

    public function __invoke(string $query): array
    {
        $oDb = BxDolDb::getInstance();
        $sSql = $this->_normalize($query);
        $sMask = $this->_maskLiterals($sSql);

        $this->_assertSafe($sMask);

        if (preg_match('/^insert\b/i', $sMask))
            $sOp = 'insert';
        else if (preg_match('/^update\b/i', $sMask))
            $sOp = 'update';
        else
            throw new Exception('Only INSERT or UPDATE is allowed.');

        $sTable = $this->_tableName($sMask, $sOp);
        $this->_assertTable($sTable);

        $sPk = $this->_primaryKey($oDb, $sTable);

        $sBefore = null;
        $sPkValue = '';
        if ($sOp === 'update') {
            // The statement that runs is rebuilt from the parsed parts: one table, and
            // a WHERE on the primary key alone, so it can never touch another row.
            list($sSet, $sPkValue) = $this->_parseUpdate($sSql, $sMask, $sTable, $sPk);
            $aBefore = $this->_fetchRow($oDb, $sTable, $sPk, $sPkValue);
            if (!$aBefore)
                throw new Exception("Row not found: {$sTable}.{$sPk} = {$sPkValue}");
            $sBefore = json_encode($aBefore, JSON_UNESCAPED_UNICODE);

            $sPkSql = preg_match('/^\d+$/', $sPkValue) ? (string)(int)$sPkValue : $oDb->escape($sPkValue);
            $sSql = "UPDATE `{$sTable}` SET {$sSet} WHERE `{$sPk}` = {$sPkSql} LIMIT 1";
        }
        else {
            $this->_assertSingleRowInsert($sMask, $sTable);
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

        return [
            'ok' => 1,
            'op' => $sOp,
            'table' => $sTable,
            'pk' => $sPk,
            'pk_value' => $sPkValue,
            'log_id' => $iLogId,
            'affected' => is_numeric($mixedRes) ? (int)$mixedRes : 1,
        ];
    }

    /**
     * Trim and drop a trailing `;`. Nothing inside the query is removed: string
     * literals may contain `#`, `--` or `/*`.
     */
    protected function _normalize(string $s): string
    {
        $s = rtrim(trim($s), "; \t\n\r");
        if ($s === '')
            throw new Exception('Empty query.');
        return $s;
    }

    /**
     * The query with the contents of every string literal replaced by `x`, same
     * length, so offsets found in the mask are valid in the original query.
     */
    protected function _maskLiterals(string $s): string
    {
        return preg_replace_callback('/\'(?:[^\'\\\\]|\\\\.)*\'|"(?:[^"\\\\]|\\\\.)*"/s', function ($a) {
            return $a[0][0] . str_repeat('x', strlen($a[0]) - 2) . substr($a[0], -1);
        }, $s);
    }

    protected function _assertSafe(string $sMask): void
    {
        if (strpos($sMask, ';') !== false)
            throw new Exception('Multiple statements are not allowed.');
        if (preg_match('~#|--|/\*~', $sMask))
            throw new Exception('SQL comments are not allowed.');
        if (preg_match('/\b(delete|drop|truncate|alter|replace|create|grant|revoke|call|handler|load|outfile|dumpfile|lock\s+tables|unlock\s+tables|select|sleep|benchmark)\b/i', $sMask))
            throw new Exception('Forbidden SQL keyword.');
        if (preg_match('/\bon\s+duplicate\s+key\b/i', $sMask))
            throw new Exception('ON DUPLICATE KEY is not allowed.');
    }

    protected function _tableName(string $sMask, string $sOp): string
    {
        if ($sOp === 'insert' && preg_match('/^insert\s+(?:(?:low_priority|high_priority|delayed|ignore)\s+)*into\s+(`?)([a-zA-Z0-9_]+)\1(?=[\s(]|$)/i', $sMask, $aM))
            return $aM[2];
        if ($sOp === 'update' && preg_match('/^update\s+(?:(?:low_priority|ignore)\s+)*(`?)([a-zA-Z0-9_]+)\1\s+set\s/i', $sMask, $aM))
            return $aM[2];
        throw new Exception($sOp === 'update'
            ? 'UPDATE must name exactly one table: UPDATE `table` SET ... WHERE `pk` = value.'
            : 'Cannot parse table name: INSERT INTO `table` ...');
    }

    protected function _assertTable(string $sTable): void
    {
        $sTable = strtolower($sTable);
        foreach ($this->_aDenyTables as $sDeny) {
            $bPrefix = substr($sDeny, -1) === '*';
            $sDeny = rtrim($sDeny, '*');
            if ($bPrefix ? strncmp($sTable, $sDeny, strlen($sDeny)) === 0 : $sTable === $sDeny)
                throw new Exception("Table {$sTable} is not writable by this tool.");
        }
    }

    /**
     * `UPDATE t SET <set> WHERE <pk> = <value> [LIMIT 1]`: returns the SET clause as
     * written and the primary key value. Anything else in WHERE is refused.
     *
     * @return array{0:string,1:string}
     */
    protected function _parseUpdate(string $sSql, string $sMask, string $sTable, string $sPk): array
    {
        if (!preg_match('/^update\s+(?:(?:low_priority|ignore)\s+)*`?[a-zA-Z0-9_]+`?\s+set\s/i', $sMask, $aM))
            throw new Exception('UPDATE must name exactly one table: UPDATE `table` SET ... WHERE `pk` = value.');

        $iSet = strlen($aM[0]);
        $iWhere = $this->_findTopLevelWhere($sMask, $iSet);
        if ($iWhere < 0)
            throw new Exception("UPDATE requires WHERE `{$sPk}` = value.");

        $sSet = trim(substr($sSql, $iSet, $iWhere - $iSet));
        if ($sSet === '')
            throw new Exception('UPDATE has nothing to SET.');

        $iAfter = $iWhere + 5;
        $sTableRe = preg_quote($sTable, '/');
        $sPkRe = preg_quote($sPk, '/');
        $sRe = '/^\s*\(?\s*(?:`?' . $sTableRe . '`?\s*\.\s*)?`?' . $sPkRe . '`?\s*=\s*(\d+|\'[^\'\\\\]*\'|"[^"\\\\]*")\s*\)?\s*(?:limit\s+1\s*)?$/i';
        if (!preg_match($sRe, substr($sMask, $iAfter), $aV, PREG_OFFSET_CAPTURE))
            throw new Exception("UPDATE WHERE must be exactly `{$sPk}` = value (the primary key, nothing else).");

        $sValue = substr($sSql, $iAfter + $aV[1][1], strlen($aV[1][0]));
        if ($sValue[0] === '\'' || $sValue[0] === '"')
            $sValue = substr($sValue, 1, -1);
        if (strpbrk($sValue, '\'"\\') !== false)
            throw new Exception('Unsupported primary key value.');

        return [$sSet, $sValue];
    }

    /**
     * Offset of the `WHERE` keyword outside parentheses (literals are masked), -1 when none.
     */
    protected function _findTopLevelWhere(string $sMask, int $iFrom): int
    {
        $iDepth = 0;
        for ($i = $iFrom, $iLen = strlen($sMask); $i < $iLen; $i++) {
            $c = $sMask[$i];
            if ($c === '(')
                $iDepth++;
            else if ($c === ')')
                $iDepth--;
            else if ($iDepth === 0 && ($c === 'w' || $c === 'W') && preg_match('/\s/', $sMask[$i - 1] ?? '') && preg_match('/\Gwhere\b/i', $sMask, $aM, 0, $i))
                return $i;
        }
        return -1;
    }

    /**
     * One row only: `INSERT INTO t SET ...`, or `INSERT INTO t [(cols)] VALUES (...)`
     * with a single values group.
     */
    protected function _assertSingleRowInsert(string $sMask, string $sTable): void
    {
        $sHead = '/^insert\s+(?:(?:low_priority|high_priority|delayed|ignore)\s+)*into\s+`?' . preg_quote($sTable, '/') . '`?\s*';
        if (preg_match($sHead . 'set\s/i', $sMask))
            return;

        if (!preg_match($sHead . '(?:\([^()]*\)\s*)?values?\s*/i', $sMask, $aM))
            throw new Exception('INSERT must be INSERT INTO `table` (...) VALUES (...) or INSERT INTO `table` SET ...');

        $sRest = rtrim(substr($sMask, strlen($aM[0])));
        $iDepth = 0;
        for ($i = 0, $iLen = strlen($sRest); $i < $iLen; $i++) {
            if ($sRest[$i] === '(')
                $iDepth++;
            else if ($sRest[$i] === ')')
                $iDepth--;
            if ($iDepth === 0 && $i < $iLen - 1)
                throw new Exception('INSERT one row at a time: a single VALUES (...) group.');
        }
        if ($iDepth !== 0 || $sRest === '' || $sRest[0] !== '(')
            throw new Exception('INSERT one row at a time: a single VALUES (...) group.');
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
