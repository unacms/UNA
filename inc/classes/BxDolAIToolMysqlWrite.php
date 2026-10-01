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
            'INSERT one row, or UPDATE one row by its primary key. DELETE/DROP/TRUNCATE/ALTER and subqueries are forbidden. UPDATE must be `UPDATE table SET ... WHERE pk = value`: one table, and nothing but the primary key in WHERE. Snapshots are stored automatically. Use mysql_schema and mysql_select first to find the primary key. '
            . 'Call with dry_run=true first: it returns a plain-language summary (table, row, field: old → new) — show that to the person, never the SQL.',
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
        $sMask = $this->_maskLiterals($sSql);
        $bDry = $dry_run === true || $dry_run === 1 || $dry_run === '1' || $dry_run === 'true';

        $this->_assertSafe($sMask);

        $sOp = $this->_operation($sMask);
        $sTable = $this->_tableName($sMask, $sOp);
        $this->_assertTable($sTable);

        $sPk = $this->_primaryKey($oDb, $sTable);

        $sBefore = null;
        $aBefore = null;
        $sPkValue = '';
        if ($sOp === 'update') {
            list($sSql, $sPkValue, $sBefore) = $this->_prepareUpdate($oDb, $sSql, $sMask, $sTable, $sPk);
            $aBefore = json_decode((string)$sBefore, true);
        }
        else
            $this->_assertSingleRowInsert($sMask, $sTable);

        if ($bDry) {
            $aAssign = $this->_parseAssignments($sSql, $sOp);
            $aChanges = $this->_changes($sOp === 'update' ? (is_array($aBefore) ? $aBefore : []) : null, $aAssign, $sOp === 'update');
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
            throw new BxDolAIToolException('Query failed.');

        if ($sOp === 'insert') {
            $sPkValue = (string)$oDb->lastId();
            if ($sPkValue === '' || $sPkValue === '0')
                $sPkValue = $this->_insertedPkFromSql($sSql, $sPk);
            if ($sPkValue === '')
                throw new BxDolAIToolException('INSERT succeeded but primary key is unknown.');
        }

        $aAfter = $this->_fetchRow($oDb, $sTable, $sPk, $sPkValue);
        $iLogId = $this->_log($sOp, $sTable, $sPk, $sPkValue, $sSql, $sBefore, $aAfter ? json_encode($aAfter, JSON_UNESCAPED_UNICODE) : null);

        // exact diff from the snapshots (the dry run only had the parsed SET clause)
        $aChanges = $sOp === 'update'
            ? $this->_changes(is_array($aBefore) ? $aBefore : [], $aAfter ?: [], true)
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

    protected function _operation(string $sMask): string
    {
        if (preg_match('/^insert\b/i', $sMask))
            return 'insert';
        if (preg_match('/^update\b/i', $sMask))
            return 'update';
        throw new BxDolAIToolException('Only INSERT or UPDATE is allowed.');
    }

    /**
     * The UPDATE that runs is rebuilt from the parsed parts: one table, and a WHERE
     * on the primary key alone, so it can never touch another row.
     *
     * @return array{0:string,1:string,2:string} SQL to run, primary key value, JSON of the row before
     */
    protected function _prepareUpdate(BxDolDb $oDb, string $sSql, string $sMask, string $sTable, string $sPk): array
    {
        list($sSet, $sPkValue) = $this->_parseUpdate($sSql, $sMask, $sTable, $sPk);
        $aBefore = $this->_fetchRow($oDb, $sTable, $sPk, $sPkValue);
        if (!$aBefore)
            throw new BxDolAIToolException("Row not found: {$sTable}.{$sPk} = {$sPkValue}");

        $sPkSql = preg_match('/^\d+$/', $sPkValue) ? (string)(int)$sPkValue : $oDb->escape($sPkValue);
        return [
            "UPDATE `{$sTable}` SET {$sSet} WHERE `{$sPk}` = {$sPkSql} LIMIT 1",
            $sPkValue,
            json_encode($aBefore, JSON_UNESCAPED_UNICODE),
        ];
    }

    /**
     * column => literal from the SET clause (UPDATE / INSERT ... SET) or the
     * (columns) VALUES (...) pair. Expressions that are not plain literals
     * (NOW(), col + 1) are kept as their SQL text.
     *
     * SET and WHERE are located on a copy with quoted literals blanked
     * (same length as $sSql) so a value cannot end the clause.
     */
    protected function _parseAssignments(string $sSql, string $sOp): array
    {
        $aOut = [];
        $sBare = $this->_maskLiterals($sSql, true);
        if (preg_match('/\bset\b/i', $sBare, $aSet, PREG_OFFSET_CAPTURE)) {
            $iFrom = $aSet[0][1] + strlen($aSet[0][0]);
            $sClause = substr($sSql, $iFrom);
            if (preg_match('/\bwhere\b/i', substr($sBare, $iFrom), $aWhere, PREG_OFFSET_CAPTURE))
                $sClause = substr($sSql, $iFrom, $aWhere[0][1]);
            foreach ($this->_splitTopLevel($sClause) as $sPair) {
                if (preg_match('/^\s*(?:`?[a-zA-Z0-9_]+`?\s*\.\s*)?`?([a-zA-Z0-9_]+)`?\s*=\s*(.+)$/s', trim($sPair), $aP))
                    $aOut[$aP[1]] = $this->_literal(trim($aP[2]));
            }
            return $aOut;
        }
        if ($sOp === 'insert' && preg_match('/^insert\s+(?:(?:low_priority|high_priority|delayed|ignore)\s+)*into\s+`?[a-zA-Z0-9_]+`?\s*\((.+?)\)\s*values?\s*\((.+)\)\s*$/is', $sSql, $aM)) {
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

    /**
     * Trim and drop a trailing `;`. Nothing inside the query is removed: string
     * literals may contain `#`, `--` or `/*`.
     */
    protected function _normalize(string $s): string
    {
        $s = rtrim(trim($s), "; \t\n\r");
        if ($s === '')
            throw new BxDolAIToolException('Empty query.');
        return $s;
    }

    /**
     * Copy of $s with the inside of quoted literals replaced by spaces.
     * Length and quote marks stay, so keyword offsets still point into $s.
     * Quote rules match _splitTopLevel() (backslash and doubled quotes).
     * $bIdents also blanks `identifiers`, so a column named where/set is not a clause boundary.
     */
    protected function _maskLiterals(string $s, bool $bIdents = false): string
    {
        $iLen = strlen($s);
        $sQuote = '';
        for ($i = 0; $i < $iLen; $i++) {
            $c = $s[$i];
            if ($sQuote !== '') {
                if ($sQuote !== '`' && $c === '\\' && $i + 1 < $iLen) {
                    $s[$i] = ' ';
                    $s[++$i] = ' ';
                } elseif ($c === $sQuote) {
                    if ($i + 1 < $iLen && $s[$i + 1] === $sQuote) {
                        $s[$i] = ' ';
                        $s[++$i] = ' ';
                    } else {
                        $sQuote = '';
                    }
                } else {
                    $s[$i] = ' ';
                }
                continue;
            }
            if ($c === "'" || $c === '"' || ($bIdents && $c === '`'))
                $sQuote = $c;
        }
        return $s;
    }

    protected function _assertSafe(string $sMask): void
    {
        if (strpos($sMask, ';') !== false)
            throw new BxDolAIToolException('Multiple statements are not allowed.');
        if (preg_match('~#|--|/\*~', $sMask))
            throw new BxDolAIToolException('SQL comments are not allowed.');
        if (preg_match('/\b(delete|drop|truncate|alter|replace|create|grant|revoke|call|handler|load)\b/i', $sMask)
            || preg_match('/\b(outfile|dumpfile|lock\s+tables|unlock\s+tables|select|sleep|benchmark)\b/i', $sMask))
            throw new BxDolAIToolException('Forbidden SQL keyword.');
        if (preg_match('/\bon\s+duplicate\s+key\b/i', $sMask))
            throw new BxDolAIToolException('ON DUPLICATE KEY is not allowed.');
    }

    protected function _tableName(string $sMask, string $sOp): string
    {
        if ($sOp === 'insert' && preg_match('/^insert\s+(?:(?:low_priority|high_priority|delayed|ignore)\s+)*into\s+(`?)(\w+)\1(?=[\s(]|$)/i', $sMask, $aM))
            return $aM[2];
        if ($sOp === 'update' && preg_match('/^update\s+(?:(?:low_priority|ignore)\s+)*(`?)(\w+)\1\s+set\s/i', $sMask, $aM))
            return $aM[2];
        throw new BxDolAIToolException($sOp === 'update'
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
                throw new BxDolAIToolException("Table {$sTable} is not writable by this tool.");
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
        if (!preg_match('/^update\s+(?:(?:low_priority|ignore)\s+)*`?\w+`?\s+set\s/i', $sMask, $aM))
            throw new BxDolAIToolException('UPDATE must name exactly one table: UPDATE `table` SET ... WHERE `pk` = value.');

        $iSet = strlen($aM[0]);
        $iWhere = $this->_findTopLevelWhere($sMask, $iSet);
        if ($iWhere < 0)
            throw new BxDolAIToolException("UPDATE requires WHERE `{$sPk}` = value.");

        $sSet = trim(substr($sSql, $iSet, $iWhere - $iSet));
        if ($sSet === '')
            throw new BxDolAIToolException('UPDATE has nothing to SET.');

        $iAfter = $iWhere + 5;
        $sTableRe = preg_quote($sTable, '/');
        $sPkRe = preg_quote($sPk, '/');
        $sRe = '/^\s*\(?\s*(?:`?' . $sTableRe . '`?\s*\.\s*)?`?' . $sPkRe . '`?\s*=\s*(\d+|\'[^\'\\\\]*\'|"[^"\\\\]*")\s*\)?\s*(?:limit\s+1\s*)?$/i';
        if (!preg_match($sRe, substr($sMask, $iAfter), $aV, PREG_OFFSET_CAPTURE))
            throw new BxDolAIToolException("UPDATE WHERE must be exactly `{$sPk}` = value (the primary key, nothing else).");

        $sValue = substr($sSql, $iAfter + $aV[1][1], strlen($aV[1][0]));
        if ($sValue[0] === '\'' || $sValue[0] === '"')
            $sValue = substr($sValue, 1, -1);
        if (strpbrk($sValue, '\'"\\') !== false)
            throw new BxDolAIToolException('Unsupported primary key value.');

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
            elseif ($c === ')')
                $iDepth--;
            elseif ($iDepth === 0 && ($c === 'w' || $c === 'W') && preg_match('/\s/', $sMask[$i - 1] ?? '') && preg_match('/\Gwhere\b/i', $sMask, $aM, 0, $i))
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
            throw new BxDolAIToolException('INSERT must be INSERT INTO `table` (...) VALUES (...) or INSERT INTO `table` SET ...');

        $sRest = rtrim(substr($sMask, strlen($aM[0])));
        $iDepth = 0;
        for ($i = 0, $iLen = strlen($sRest); $i < $iLen; $i++) {
            if ($sRest[$i] === '(')
                $iDepth++;
            elseif ($sRest[$i] === ')')
                $iDepth--;
            if ($iDepth === 0 && $i < $iLen - 1)
                throw new BxDolAIToolException('INSERT one row at a time: a single VALUES (...) group.');
        }
        if ($iDepth !== 0 || $sRest === '' || $sRest[0] !== '(')
            throw new BxDolAIToolException('INSERT one row at a time: a single VALUES (...) group.');
    }

    protected function _primaryKey(BxDolDb $oDb, string $sTable): string
    {
        $aKeys = $oDb->getAll("SHOW KEYS FROM `" . str_replace('`', '', $sTable) . "` WHERE `Key_name` = 'PRIMARY'");
        if (!$aKeys)
            throw new BxDolAIToolException("Table {$sTable} has no PRIMARY KEY.");
        if (count($aKeys) > 1)
            throw new BxDolAIToolException("Composite primary keys are not supported.");
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
