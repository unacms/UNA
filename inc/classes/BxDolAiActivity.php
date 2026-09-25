<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Human-readable activity of agents: what an alert / scheduler / webhook agent
 * actually did (posted a comment, changed content, ran SQL...). One row per
 * write tool call, stored in `sys_agents_activity`, written by
 * BxDolAiActivityObserver and shown in Studio and in the App.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiActivity
{
    const TABLE = 'sys_agents_activity';
    const SUMMARY_MAX = 300;
    const DETAILS_MAX = 20000;

    /**
     * tool name → action key. Tools not listed here are read-only and are not recorded.
     */
    const TOOL_ACTIONS = [
        'comments_add' => 'comment_add',
        'comments_update' => 'comment_update',
        'comments_delete' => 'comment_delete',
        'content_add' => 'content_add',
        'content_update' => 'content_update',
        'content_delete' => 'content_delete',
        'mysql_write' => 'db_write',
        'mysql_write_safe' => 'db_write',
        'mysql_undo' => 'db_undo',
        'email_send' => 'email',
        'polyglot' => 'lang',
        'agent_create' => 'agent',
        'mockup_upsert' => 'mockup',
    ];

    public static function isTableReady(): bool
    {
        static $bReady = null;
        if ($bReady === null)
            $bReady = BxDolDb::getInstance()->isTableExists(self::TABLE);
        return $bReady;
    }

    /**
     * Record one tool call of an agent. $mixedResult is whatever the tool returned
     * (array or string); a "Tool ... failed:" string means the call threw.
     */
    public static function record(array $aAgent, array $aParams, string $sTool, array $aInputs, $mixedResult): int
    {
        if (!self::isTableReady())
            return 0;

        $sAction = self::TOOL_ACTIONS[$sTool] ?? '';
        if ($sAction === '')
            return 0;
        if ($sTool === 'agent_create' && !in_array(strtolower((string)($aInputs['action'] ?? '')), ['create', 'update'], true))
            return 0;
        if ($sTool === 'mockup_upsert' && !empty($aInputs['dry_run']))
            return 0;

        $aResult = is_array($mixedResult) ? $mixedResult : [];
        $sResultText = is_string($mixedResult) ? $mixedResult : '';
        if ($sResultText !== '' && ($aDecoded = json_decode($sResultText, true)) && is_array($aDecoded))
            $aResult = $aDecoded;

        $bOk = true;
        if (preg_match('/^Tool "[^"]*" failed:/', $sResultText))
            $bOk = false;
        elseif (isset($aResult['ok']) && !(int)$aResult['ok'])
            $bOk = false;
        elseif (isset($aResult['code']) && (int)$aResult['code'] >= 400)
            $bOk = false;
        elseif ($sTool === 'email_send' && $mixedResult === false)
            $bOk = false;

        $aRow = self::describeCall($sAction, $sTool, $aInputs, $aResult);

        $sThreadId = '';
        try {
            $sThreadId = (string)BxDolAiChat::threadId($aAgent, $aParams);
        } catch (Throwable $o) {
        }

        $aDetails = [
            'inputs' => self::clipArray($aInputs),
            'result' => $aResult ?: ($sResultText !== '' ? mb_substr($sResultText, 0, 2000) : null),
        ];
        $sDetails = json_encode($aDetails, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($sDetails === false)
            $sDetails = '';
        if (strlen($sDetails) > self::DETAILS_MAX)
            $sDetails = substr($sDetails, 0, self::DETAILS_MAX);

        $oDb = BxDolDb::getInstance();
        $aSet = [
            'agent_id' => (int)($aAgent['id'] ?? 0),
            'profile_id' => (int)($aAgent['profile_id'] ?? 0),
            'trigger' => (string)($aAgent['trigger'] ?? ''),
            'thread_id' => $sThreadId,
            'tool' => $sTool,
            'action' => $sAction,
            'unit' => (string)$aRow['unit'],
            'object_id' => (int)$aRow['object_id'],
            'object_url' => (string)$aRow['object_url'],
            'object_title' => mb_substr((string)$aRow['object_title'], 0, 255),
            'summary' => (string)$aRow['summary'],
            'details' => $sDetails,
            'ok' => $bOk ? 1 : 0,
            'added' => time(),
        ];
        // the table may predate object_title
        foreach (array_keys($aSet) as $sField) {
            if (!$oDb->isFieldExists(self::TABLE, $sField))
                unset($aSet[$sField]);
        }
        $oDb->query("INSERT INTO `" . self::TABLE . "` SET " . $oDb->arrayToSQL($aSet));
        return (int)$oDb->lastId();
    }

    /**
     * unit / object_id / object_url / summary for one call — what the row is about.
     */
    protected static function describeCall(string $sAction, string $sTool, array $aInputs, array $aResult): array
    {
        $sUnit = '';
        $iObject = 0;
        $sUrl = '';
        $sTitle = '';
        $sSummary = '';

        $fText = function ($m, $iMax = self::SUMMARY_MAX) {
            $s = trim(strip_tags(html_entity_decode((string)$m, ENT_QUOTES, 'UTF-8')));
            $s = preg_replace('/\s+/u', ' ', $s);
            return mb_strlen($s) > $iMax ? mb_substr($s, 0, $iMax - 1) . '…' : $s;
        };

        switch ($sAction) {
            case 'comment_add':
            case 'comment_update':
            case 'comment_delete':
                $sUnit = (string)($aInputs['module'] ?? '');
                $iObject = (int)($aInputs['content_id'] ?? 0);
                $iCmt = (int)($aResult['id'] ?? $aInputs['comment_id'] ?? 0);
                $sSummary = $fText($aInputs['comment_text'] ?? '');
                $aTarget = self::commentTarget($sUnit, $iObject, $iCmt);
                $sTitle = $fText($aTarget['title'], 255);
                $sUrl = $aTarget['url'];
                break;

            case 'content_add':
            case 'content_update':
            case 'content_delete':
                $sUnit = (string)($aInputs['module'] ?? '');
                $iObject = (int)($aInputs['content_id'] ?? $aResult['id'] ?? $aResult['content_id'] ?? 0);
                $aData = is_array($aInputs['data'] ?? null) ? $aInputs['data'] : [];
                // deleted content has no title to fetch any more — keep what the tool was given
                $sTitle = $fText(self::contentTitle($sUnit, $iObject), 255);
                if ($sTitle === '')
                    $sTitle = $fText($aData['title'] ?? $aData['name'] ?? '', 255);
                $sSummary = $fText($aData['text'] ?? $aData['description'] ?? '');
                if ($sAction !== 'content_delete')
                    $sUrl = self::contentUrl($sUnit, $iObject);
                break;

            case 'db_write':
                $sQuery = trim((string)($aInputs['query'] ?? ''));
                if (preg_match('/^\s*(insert\s+into|update)\s+`?([a-z0-9_]+)`?/i', $sQuery, $m))
                    $sUnit = $m[2];
                $iObject = (int)($aResult['id'] ?? $aResult['pk_value'] ?? $aResult['insert_id'] ?? 0);
                $sSummary = $fText($sQuery);
                // a row of a content module's data table is content: link it like content_update
                $aTarget = self::contentByTable($sUnit, $iObject);
                if ($aTarget) {
                    $sTitle = $fText($aTarget['title'], 255);
                    $sUrl = $aTarget['url'];
                }
                break;

            case 'db_undo':
                $sSummary = 'scope=' . (string)($aInputs['scope'] ?? 'last');
                if (!empty($aResult['undone']) && is_array($aResult['undone']))
                    $sSummary .= ', ' . count($aResult['undone']) . ' rows';
                break;

            case 'email':
                $sUnit = (string)($aInputs['email'] ?? '');
                $sSummary = $fText($aInputs['subject'] ?? '');
                break;

            case 'lang':
                $sUnit = (string)($aInputs['key'] ?? '');
                $sSummary = $fText($aInputs['string'] ?? '');
                $sUrl = bx_absolute_url('studio/polyglot.php?page=keys');
                break;

            case 'agent':
                $sUnit = strtolower((string)($aInputs['action'] ?? 'create'));
                $iObject = (int)($aResult['id'] ?? $aInputs['agent_id'] ?? 0);
                $sSummary = $fText($aInputs['title'] ?? ($aResult['name'] ?? ''));
                $sUrl = !empty($aResult['studio']) ? bx_absolute_url((string)$aResult['studio']) : '';
                break;

            case 'mockup':
                $sUnit = 'block';
                $iObject = (int)($aInputs['block_id'] ?? 0);
                $sSummary = $fText($aResult['summary'] ?? '');
                $aBlock = self::pageBlock($iObject);
                $sTitle = $fText($aBlock['title'] ?? '', 255);
                $sUrl = (string)($aBlock['url'] ?? '');
                break;
        }

        return ['unit' => $sUnit, 'object_id' => $iObject, 'object_url' => $sUrl, 'object_title' => $sTitle, 'summary' => $sSummary];
    }

    /**
     * Rows for one agent, newest first, with the text a person reads.
     */
    public static function listForAgent(int $iAgentId, int $iStart = 0, int $iLimit = 50): array
    {
        if (!self::isTableReady() || $iAgentId <= 0)
            return [];
        $iLimit = max(1, min(200, $iLimit));
        $iStart = max(0, $iStart);
        $aRows = BxDolDb::getInstance()->getAll("SELECT * FROM `" . self::TABLE . "` WHERE `agent_id` = :a ORDER BY `id` DESC LIMIT {$iStart}, {$iLimit}", ['a' => $iAgentId]);
        $aOut = [];
        foreach ($aRows as $aRow)
            $aOut[] = self::formatRow($aRow);
        return $aOut;
    }

    /**
     * agent_id → ['count' => n, 'last' => ts] for the agents grid.
     */
    public static function statsByAgent(): array
    {
        if (!self::isTableReady())
            return [];
        $aRows = BxDolDb::getInstance()->getAll("SELECT `agent_id`, COUNT(*) AS `count`, MAX(`added`) AS `last` FROM `" . self::TABLE . "` GROUP BY `agent_id`");
        $aOut = [];
        foreach ($aRows as $aRow)
            $aOut[(int)$aRow['agent_id']] = ['count' => (int)$aRow['count'], 'last' => (int)$aRow['last']];
        return $aOut;
    }

    public static function deleteForAgent(int $iAgentId): void
    {
        if (!self::isTableReady() || $iAgentId <= 0)
            return;
        BxDolDb::getInstance()->query("DELETE FROM `" . self::TABLE . "` WHERE `agent_id` = :a", ['a' => $iAgentId]);
    }

    /**
     * @return array id, action, tool, ok, text (human sentence), summary, unit, object_id, url, added, added_formatted, thread_id
     */
    public static function formatRow(array $aRow): array
    {
        $iAdded = (int)($aRow['added'] ?? 0);
        $aRow = self::resolveTarget($aRow);
        return [
            'id' => (int)($aRow['id'] ?? 0),
            'action' => (string)($aRow['action'] ?? ''),
            'tool' => (string)($aRow['tool'] ?? ''),
            'ok' => (int)($aRow['ok'] ?? 1),
            'text' => self::describe($aRow),
            'summary' => (string)($aRow['summary'] ?? ''),
            'unit' => (string)($aRow['unit'] ?? ''),
            'object_id' => (int)($aRow['object_id'] ?? 0),
            'url' => (string)($aRow['object_url'] ?? ''),
            'title' => (string)($aRow['object_title'] ?? ''),
            'thread_id' => (string)($aRow['thread_id'] ?? ''),
            'added' => $iAdded,
            'added_formatted' => $iAdded ? date('d.m.Y H:i', $iAdded) : '',
        ];
    }

    /**
     * "Posted a comment on Post #45", "Updated bx_events #3", ... Language keys
     * `_sys_agents_activity_<action>` take {unit}, {object}; the English text below is
     * the fallback while the keys are not compiled.
     */
    public static function describe(array $aRow): string
    {
        $sAction = (string)($aRow['action'] ?? '');
        $sUnit = (string)($aRow['unit'] ?? '');
        $iObject = (int)($aRow['object_id'] ?? 0);
        $bOk = (int)($aRow['ok'] ?? 1) === 1;

        $aFallback = [
            'comment_add' => 'Posted a comment on {target}',
            'comment_update' => 'Edited a comment on {target}',
            'comment_delete' => 'Deleted a comment on {target}',
            'content_add' => 'Created {target}',
            'content_update' => 'Updated {target}',
            'content_delete' => 'Deleted {target}',
            'db_write' => 'Changed {target}',
            'db_undo' => 'Rolled back changes',
            'email' => 'Sent an email to {unit}',
            'lang' => 'Changed language key {unit}',
            'agent' => 'Agent {unit}: #{object}',
            'mockup' => 'Updated page block #{object}',
        ];
        $sKey = '_sys_agents_activity_' . $sAction;
        $sTpl = _t($sKey);
        if ($sTpl === $sKey)
            $sTpl = $aFallback[$sAction] ?? ucfirst(str_replace('_', ' ', $sAction));

        $sUnitName = self::unitTitle($sUnit);
        $sObjectTitle = trim((string)($aRow['object_title'] ?? ''));
        // «Title» when it is known, otherwise "Unit #id"
        $sTarget = $sObjectTitle !== ''
            ? ($sUnitName !== '' ? $sUnitName . ': ' : '') . '«' . $sObjectTitle . '»'
            : trim($sUnitName . ($iObject ? ' #' . $iObject : ''));
        if ($sAction === 'db_write' && $sObjectTitle === '')
            $sTarget = 'table ' . $sUnit;
        // a language string compiled from the first version knows only {unit} #{object}: still show the title
        if ($sObjectTitle !== '' && strpos($sTpl, '{target}') === false && strpos($sTpl, '{title}') === false)
            $sTpl .= ': «{title}»';
        $sText = str_replace(['{target}', '{unit}', '{object}', '{title}'], [$sTarget, $sUnitName, (string)$iObject, $sObjectTitle], $sTpl);
        $sText = trim(str_replace(' #0', '', $sText));
        if (!$bOk) {
            $sFailed = _t('_sys_agents_activity_failed');
            if ($sFailed === '_sys_agents_activity_failed')
                $sFailed = 'failed';
            $sText .= ' (' . $sFailed . ')';
        }
        return $sText;
    }

    protected static function unitTitle(string $sUnit): string
    {
        if ($sUnit === '')
            return '';
        if (preg_match('/^bx_[a-z0-9_]+$/', $sUnit)) {
            $s = _t('_' . $sUnit);
            if ($s !== '_' . $sUnit)
                return $s;
            $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sUnit);
            if ($aModule && !empty($aModule['title']))
                return $aModule['title'];
        }
        return $sUnit;
    }

    /**
     * Fill url / title for rows recorded before they were stored. Cheap when nothing is missing.
     */
    protected static function resolveTarget(array $aRow): array
    {
        $sAction = (string)($aRow['action'] ?? '');
        $sUnit = (string)($aRow['unit'] ?? '');
        $iObject = (int)($aRow['object_id'] ?? 0);
        $bContent = in_array($sAction, ['comment_add', 'comment_update', 'comment_delete', 'content_add', 'content_update'], true);
        if (!$bContent || $sUnit === '' || $iObject <= 0)
            return $aRow;
        $bComment = strpos($sAction, 'comment_') === 0;
        if (empty($aRow['object_title'])) {
            $sTitle = $bComment ? self::commentTarget($sUnit, $iObject, 0)['title'] : self::contentTitle($sUnit, $iObject);
            $aRow['object_title'] = mb_substr(trim(strip_tags($sTitle)), 0, 255);
        }
        if (empty($aRow['object_url']))
            $aRow['object_url'] = $bComment ? self::commentTarget($sUnit, $iObject, 0)['url'] : self::contentUrl($sUnit, $iObject);
        return $aRow;
    }

    /**
     * A row in a content module's entries table (bx_posts_data, bx_forum_discussions...)
     * is that module's content → [title, url], else null.
     */
    protected static function contentByTable(string $sTable, int $iId): ?array
    {
        if ($sTable === '' || $iId <= 0 || !preg_match('/^(bx_[a-z0-9]+)_/', $sTable, $m))
            return null;
        $sModule = $m[1];
        try {
            $oModule = BxDolModule::getInstance($sModule);
            if (!$oModule || empty($oModule->_oConfig->CNF['TABLE_ENTRIES']) || $oModule->_oConfig->CNF['TABLE_ENTRIES'] !== $sTable)
                return null;
        } catch (Throwable $o) {
            return null;
        }
        $sUrl = self::contentUrl($sModule, $iId);
        if ($sUrl === '')
            return null;
        return ['title' => self::contentTitle($sModule, $iId), 'url' => $sUrl];
    }

    /** Page block → [title, url of its page] for mockup rows. */
    protected static function pageBlock(int $iBlockId): array
    {
        if ($iBlockId <= 0)
            return [];
        try {
            $oDb = BxDolDb::getInstance();
            $aBlock = $oDb->getRow("SELECT b.`title`, b.`object`, p.`uri` FROM `sys_pages_blocks` b LEFT JOIN `sys_pages` p ON p.`object` = b.`object` WHERE b.`id` = :id LIMIT 1", ['id' => $iBlockId]);
            if (!$aBlock)
                return [];
            $sTitle = (string)$aBlock['title'];
            if ($sTitle !== '' && $sTitle[0] === '_')
                $sTitle = _t($sTitle);
            $sUrl = !empty($aBlock['uri']) ? bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $aBlock['uri'])) : '';
            return ['title' => $sTitle, 'url' => $sUrl];
        } catch (Throwable $o) {
            return [];
        }
    }

    protected static function contentUrl(string $sModule, int $iId): string
    {
        if ($sModule === '' || $iId <= 0)
            return '';
        try {
            if (!BxDolRequest::serviceExists($sModule, 'get_link'))
                return '';
            $s = BxDolService::call($sModule, 'get_link', [$iId]);
            return is_string($s) ? $s : '';
        } catch (Throwable $o) {
            return '';
        }
    }

    protected static function contentTitle(string $sModule, int $iId): string
    {
        if ($sModule === '' || $iId <= 0)
            return '';
        try {
            if (!BxDolRequest::serviceExists($sModule, 'get_title'))
                return '';
            $s = BxDolService::call($sModule, 'get_title', [$iId]);
            return is_string($s) ? $s : '';
        } catch (Throwable $o) {
            return '';
        }
    }

    /**
     * Title and link of the content a comment belongs to: the comments object knows
     * both (trigger table, base_url) whatever the module, and the comment itself when
     * the system supports comment permalinks. Falls back to the module's get_title / get_link.
     */
    protected static function commentTarget(string $sSystem, int $iContentId, int $iCmtId): array
    {
        $aOut = ['title' => '', 'url' => ''];
        if ($sSystem === '' || $iContentId <= 0)
            return $aOut;

        $sModule = $sSystem;
        try {
            $o = BxDolCmts::getObjectInstance($sSystem, $iContentId);
            if ($o) {
                $sModule = (string)($o->getModule() ?: $sSystem);
                $aOut['title'] = (string)$o->getObjectTitle($iContentId);
                if ($iCmtId > 0)
                    $aOut['url'] = (string)$o->getViewUrl($iCmtId);
                if ($aOut['url'] === '') {
                    $sBase = (string)$o->getBaseUrl();
                    if ($sBase !== '' && strpos($sBase, '{') === false)
                        $aOut['url'] = $sBase;
                }
            }
        } catch (Throwable $e) {
        }

        if ($aOut['title'] === '')
            $aOut['title'] = self::contentTitle($sModule, $iContentId);
        if ($aOut['url'] === '')
            $aOut['url'] = self::contentUrl($sModule, $iContentId);
        return $aOut;
    }

    protected static function clipArray(array $a, int $iMax = 2000): array
    {
        $aOut = [];
        foreach ($a as $k => $v) {
            if (is_string($v) && mb_strlen($v) > $iMax)
                $v = mb_substr($v, 0, $iMax) . '…';
            elseif (is_array($v))
                $v = self::clipArray($v, $iMax);
            $aOut[$k] = $v;
        }
        return $aOut;
    }
}

/** @} */
