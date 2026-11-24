<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAdminLog
{
    const MASK = '********';
    const JSON_MAX = 200000;
    const REQUEST_VALUE_MAX = 2000;

    /**
     * Rows written in this request: a Studio page action that already wrote its own row is not written again.
     */
    protected static $iRecorded = 0;

    public static function enabled(): bool
    {
        return self::param('sys_admin_log_enable') === 'on';
    }

    public static function daysBeforeExpire(): int
    {
        return (int)self::param('sys_admin_log_days_before_expire');
    }

    /**
     * A key added by a migration is missing from the params cache until it is rebuilt.
     * Read it once from the database, which also stores it for the rest of the request.
     */
    protected static function param(string $sName)
    {
        $mixed = getParam($sName);
        if ($mixed === false && !BxDolDb::getInstance()->isParamInCache($sName))
            $mixed = getParam($sName, false);

        return $mixed;
    }

    /**
     * @param bool $bForce write even when the switch is off (the switch itself being turned off)
     */
    public static function record(array $a, bool $bForce = false): int
    {
        if (!$bForce && !self::enabled())
            return 0;

        try {
            $iProfile = array_key_exists('profile_id', $a) ? (int)$a['profile_id'] : (int)bx_get_logged_profile_id();

            self::$iRecorded++;

            return BxDolAdminLogQuery::getInstance()->add([
                'profile_id' => $iProfile,
                'source' => (string)($a['source'] ?? 'studio'),
                'agent_id' => (int)($a['agent_id'] ?? 0),
                'thread_id' => (string)($a['thread_id'] ?? ''),
                'object_type' => (string)($a['object_type'] ?? ''),
                'object_id' => (string)($a['object_id'] ?? ''),
                'action' => (string)($a['action'] ?? ''),
                'before' => self::encode($a['before'] ?? ''),
                'after' => self::encode($a['after'] ?? ''),
                'ip' => (string)getVisitorIP(),
            ]);
        }
        catch (Throwable $e) {
            bx_log('sys_audit', $e->getMessage(), BX_LOG_ERR);
            return 0;
        }
    }

    public static function recordSql(array $aContext, string $sOp, string $sTable, string $sPkValue, ?string $sBefore, ?string $sAfter): void
    {
        [$sType, $sId] = self::sqlObject($sTable, $sPkValue, $sBefore, $sAfter);

        self::record([
            'source' => 'agent',
            'agent_id' => (int)($aContext['agent_id'] ?? 0),
            'profile_id' => self::callerProfile((int)($aContext['profile_id'] ?? 0)),
            'thread_id' => (string)($aContext['thread_id'] ?? ''),
            'object_type' => $sType,
            'object_id' => $sId,
            'action' => $sOp,
            'before' => $sBefore,
            'after' => $sAfter,
        ]);
    }

    public static function moduleObjectType(array $aModule): string
    {
        $sType = (string)($aModule['type'] ?? '');
        if ($sType === BX_DOL_MODULE_TYPE_LANGUAGE)
            return 'language';
        if ($sType === BX_DOL_MODULE_TYPE_TEMPLATE)
            return 'template';

        return 'module';
    }

    /**
     * The installed module a Studio Store path stands for: a module's own folder, or an update package of it.
     */
    public static function moduleByPath(string $sPath): array
    {
        $aConfig = BxDolInstallerUtils::getModuleConfig(['path' => $sPath]);
        if (!$aConfig)
            return [];

        $oQuery = BxDolModuleQuery::getInstance();
        if (!empty($aConfig['module_uri']))
            $aModule = $oQuery->getModuleByUri($aConfig['module_uri'], false);
        else if (!empty($aConfig['name']))
            $aModule = $oQuery->getModuleByName($aConfig['name'], false);
        else
            $aModule = [];

        return is_array($aModule) ? $aModule : [];
    }

    public static function runGrid($oGrid, string $sAction, bool $bStudioRequest, callable $fn): void
    {
        if (!self::shouldLogGrid($oGrid, $sAction, $bStudioRequest)) {
            $fn();
            return;
        }

        // The grid's on/off switch is one action, 'enable', with checked=0 when it turns a row off.
        if ($sAction === 'enable' && bx_get('checked') !== false && !(int)bx_get('checked'))
            $sAction = 'disable';

        $aSubject = $oGrid->getSourceOptions();
        $bCanSnapshot = self::canSnapshot($aSubject);
        $aIdsBefore = self::gridIds($oGrid);
        $aBefore = [];
        if ($bCanSnapshot && $aIdsBefore) {
            try {
                $aBefore = BxDolAdminLogQuery::getInstance()->getRows($aSubject['table'], $aSubject['field_id'], $aIdsBefore);
            }
            catch (Throwable $e) {
                bx_log('sys_audit', $e->getMessage(), BX_LOG_ERR);
                $aBefore = [];
            }
        }

        // The action answers with JSON: keep a copy of it to tell a refused or failed action from one that changed something.
        $iLevel = ob_get_level();
        ob_start();

        $bWrote = false;
        $fnWrite = function () use (&$bWrote, $iLevel, $sAction, $aSubject, $aIdsBefore, $aBefore, $bCanSnapshot, $oGrid) {
            if ($bWrote)
                return;
            $bWrote = true;

            $sOutput = ob_get_level() > $iLevel ? (string)ob_get_contents() : '';
            $aResult = json_decode($sOutput, true);

            // An add has no id in the request. The answer's blink (or id) is the row that was just inserted.
            $aIds = self::gridIds($oGrid);
            if (!$aIds)
                $aIds = self::idsFromResult($aResult);

            $aAfter = [];
            if ($bCanSnapshot && $aIds) {
                try {
                    $aAfter = BxDolAdminLogQuery::getInstance()->getRows($aSubject['table'], $aSubject['field_id'], $aIds);
                }
                catch (Throwable $e) {
                    bx_log('sys_audit', $e->getMessage(), BX_LOG_ERR);
                    $aAfter = [];
                }
            }

            $bSnapshot = $bCanSnapshot && ($aIdsBefore || $aIds);
            // A saved translation can leave this table the same and change the language string instead.
            if (!self::gridChanged($bSnapshot, $aBefore, $aAfter, $aResult))
                return;

            self::record([
                'source' => 'studio',
                'object_type' => 'grid:' . $aSubject['object'],
                'object_id' => implode(',', $aIds ?: $aIdsBefore),
                'action' => $sAction,
                'before' => $bSnapshot ? $aBefore : '',
                'after' => $bSnapshot ? $aAfter : '',
            ]);
        };

        // An action that exits still reaches the shutdown function, which PHP runs before it flushes the output buffers.
        register_shutdown_function($fnWrite);
        try {
            $fn();
            $fnWrite();
        }
        finally {
            if (ob_get_level() > $iLevel)
                ob_end_flush();
        }
    }

    /**
     * An action of a Studio page (BxDolStudioTemplate::displayPage): page, menu and form builders, and the rest
     * that answer a '*_action' parameter. A row is written for an action that succeeded and did not write its own.
     */
    public static function runStudioAction($oPage, callable $fn)
    {
        $iRecorded = self::$iRecorded;
        $mixedResult = $fn();
        if (!is_array($mixedResult) || self::$iRecorded > $iRecorded || !self::enabled())
            return $mixedResult;

        try {
            [$sParam, $sAction] = self::requestAction();
            // A Studio page answers a save with nothing when there is nothing to redraw (page settings with the same layout).
            if ($sAction === '' || self::isReadAction($sAction) || ($mixedResult && self::isFailedResult($mixedResult)))
                return $mixedResult;

            self::record([
                'source' => 'studio',
                'object_type' => 'studio:' . self::pageType($oPage),
                'object_id' => self::requestObjectId(),
                'action' => $sAction,
                'before' => '',
                'after' => ['request' => self::requestParams($sParam)],
            ]);
        }
        catch (Throwable $e) {
            bx_log('sys_audit', $e->getMessage(), BX_LOG_ERR);
        }

        return $mixedResult;
    }

    /**
     * An answer that shows a form or an error has changed nothing: a popup (the form, or the form again with its
     * errors), a non-zero code, a lone message, or nothing.
     */
    public static function isFailedResult($mixed): bool
    {
        if (!is_array($mixed))
            return false;
        if (!$mixed)
            return true;
        if (isset($mixed['popup']))
            return true;
        if (isset($mixed['code']) && (int)$mixed['code'] !== 0)
            return true;
        if (array_keys($mixed) === ['msg'] || array_keys($mixed) === ['message'])
            return true;

        return false;
    }

    /**
     * A form or an error changed nothing. A success did, even when this grid's own row is unchanged,
     * because the edit may have been a translation stored in the language tables.
     */
    public static function gridChanged(bool $bSnapshot, array $aBefore, array $aAfter, $mixedResult): bool
    {
        if (self::isFailedResult($mixedResult) && (!$bSnapshot || $aBefore == $aAfter))
            return false;

        return true;
    }

    public static function mask($mixed)
    {
        if (!is_array($mixed))
            return $mixed;

        if (array_is_list($mixed)) {
            foreach ($mixed as $i => $mValue)
                $mixed[$i] = self::mask($mValue);

            return $mixed;
        }

        $sType = isset($mixed['type']) ? (string)$mixed['type'] : '';
        $bSecretRow = $sType === 'secret' || $sType === 'secret_text';
        foreach ($mixed as $sKey => $mValue) {
            if (is_array($mValue)) {
                $mixed[$sKey] = self::mask($mValue);
                continue;
            }
            if ($sKey === 'type')
                continue;
            if (($bSecretRow && $sKey === 'value') || self::isSecretKey((string)$sKey))
                $mixed[$sKey] = self::MASK;
        }

        return $mixed;
    }

    public static function encode($mixed): string
    {
        if ($mixed === null || $mixed === '')
            return '';

        if (is_string($mixed)) {
            $a = json_decode($mixed, true);
            if (!is_array($a))
                return self::clip(self::maskText($mixed));
            $mixed = $a;
        }

        if (is_array($mixed))
            $mixed = self::mask($mixed);

        $s = json_encode($mixed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($s === false)
            return '';

        return self::clip($s);
    }

    /**
     * @return array{0:string,1:string}
     */
    public static function sqlObject(string $sTable, string $sPkValue, ?string $sBefore, ?string $sAfter): array
    {
        $sType = $sTable;
        $sId = $sPkValue;
        $aRow = self::firstRow($sBefore);
        if (!$aRow)
            $aRow = self::firstRow($sAfter);

        switch ($sTable) {
            case 'sys_options':
                $sType = 'option';
                if (!empty($aRow['name']))
                    $sId = (string)$aRow['name'];
                break;
            case 'sys_modules':
                $sType = 'module';
                if (!empty($aRow['name']))
                    $sId = (string)$aRow['name'];
                break;
            case 'sys_menu_items':
                $sType = 'menu_item';
                break;
            case 'sys_pages_blocks':
                $sType = 'page_block';
                break;
            default:
                if (str_starts_with($sTable, 'sys_form') || str_starts_with($sTable, 'sys_objects_form'))
                    $sType = 'form';
        }

        return [$sType, $sId];
    }

    protected static function shouldLogGrid($oGrid, string $sAction, bool $bStudioRequest): bool
    {
        if (!self::enabled())
            return false;
        // The Studio skin parameter is only a hint anyone can add to a request: only an administrator's action is Studio's.
        if (!isAdmin())
            return false;
        if (!$bStudioRequest && !($oGrid instanceof BxDolStudioGrid))
            return false;
        if (in_array($sAction, ['display', 'load_more', 'data_ag', 'view', 'show_stat'], true))
            return false;
        if ($oGrid->getObject() === 'sys_admin_log_administration')
            return false;

        return true;
    }

    protected static function canSnapshot(array $aSubject): bool
    {
        return ($aSubject['source_type'] ?? '') === 'Sql'
            && ($aSubject['table'] ?? '') !== ''
            && ($aSubject['field_id'] ?? '') !== '';
    }

    protected static function gridIds($oGrid): array
    {
        $a = [];
        $m = bx_get('ids');
        if (is_array($m))
            $a = $m;
        elseif ($m !== false && $m !== '' && $m !== null)
            $a = [$m];

        // Studio edit forms post the row as a hidden input named id, not as ids[].
        $mOne = bx_get('id');
        if (!is_array($mOne) && $mOne !== false && $mOne !== '' && $mOne !== null && (string)$mOne !== '0')
            $a[] = $mOne;

        $mRow = bx_get($oGrid->getObject() . '_row');
        if (is_array($mRow))
            $a = array_merge($a, $mRow);

        $aOut = [];
        foreach ($a as $mId) {
            if ($mId === '' || $mId === null || $mId === false || is_array($mId))
                continue;
            $aOut[] = (string)$mId;
        }

        return array_values(array_unique($aOut));
    }

    /**
     * The id a grid action reports after it has created a row: blink, or id.
     */
    protected static function idsFromResult($mixed): array
    {
        if (!is_array($mixed))
            return [];

        $m = $mixed['blink'] ?? ($mixed['id'] ?? null);
        if (is_array($m))
            $a = $m;
        elseif ($m !== null && $m !== false && $m !== '' && (string)$m !== '0')
            $a = [$m];
        else
            return [];

        $aOut = [];
        foreach ($a as $mId) {
            if ($mId === '' || $mId === null || $mId === false || is_array($mId) || (string)$mId === '0')
                continue;
            $aOut[] = (string)$mId;
        }

        return array_values(array_unique($aOut));
    }

    protected static function firstRow(?string $sJson): array
    {
        if ($sJson === null || $sJson === '')
            return [];

        $a = json_decode($sJson, true);
        if (!is_array($a))
            return [];
        if (array_is_list($a))
            $a = $a[0] ?? [];

        return is_array($a) ? $a : [];
    }

    protected static function requestAction(): array
    {
        foreach ([$_POST, $_GET] as $a)
            foreach ($a as $sKey => $mValue)
                if (is_string($sKey) && is_string($mValue) && $mValue !== '' && preg_match('/^[a-z0-9]+_action$/', $sKey))
                    return [$sKey, (string)bx_process_input($mValue)];

        return ['', ''];
    }

    /**
     * Actions that only read: a list, a preview, a form opened for editing is answered with a popup anyway.
     */
    protected static function isReadAction(string $sAction): bool
    {
        return (bool)preg_match('/^(get|show|browse|load|search|view|preview|check)([_-]|$)/i', $sAction);
    }

    protected static function requestObjectId(): string
    {
        foreach (['id', 'ids', 'name', 'object', 'value', 'str_value'] as $sKey) {
            $m = bx_get($sKey);
            if (is_array($m))
                $m = implode(',', array_filter($m, 'is_scalar'));
            if (is_scalar($m) && (string)$m !== '')
                return (string)bx_process_input((string)$m);
        }

        return '';
    }

    protected static function requestParams(string $sActionParam): array
    {
        $aOut = [];
        foreach (array_merge($_GET, $_POST) as $sKey => $mValue) {
            if (!is_string($sKey) || $sKey === $sActionParam || in_array($sKey, ['csrf_token', '_', BX_DOL_STUDIO_TEMPLATE_CODE_KEY], true))
                continue;

            $aOut[$sKey] = self::requestValue($mValue);
        }

        return $aOut;
    }

    protected static function requestValue($mValue)
    {
        if (is_array($mValue))
            return array_map([self::class, 'requestValue'], $mValue);

        $s = (string)$mValue;

        return get_mb_len($s) > self::REQUEST_VALUE_MAX ? get_mb_substr($s, 0, self::REQUEST_VALUE_MAX) : $s;
    }

    /**
     * BxTemplStudioBuilderPage -> builder_page; a module's own Studio page keeps its class name.
     */
    protected static function pageType($oPage): string
    {
        $sClass = get_class($oPage);
        $sName = preg_replace('/^Bx(Templ|Base|Dol)Studio/', '', $sClass);
        if ($sName === $sClass || $sName === '')
            return $sClass;

        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $sName));
    }

    protected static function isSecretKey(string $sKey): bool
    {
        // sys_agents_models.key is the provider credential. A language key is the column Key, so the match is exact.
        if ($sKey === 'key')
            return true;

        return (bool)preg_match('/password|passwd|secret|token|salt|api_key|apikey|private_key|client_secret|access_key/i', $sKey);
    }

    /**
     * The person who asked: an MCP operator or member, ahead of the bot profile a tool acts as.
     */
    public static function callerProfile(int $iFallback = 0): int
    {
        $iCaller = BxDolAITool::getCallerProfile();
        if ($iCaller <= 0)
            $iCaller = BxDolAITool::getMemberScope();

        return $iCaller > 0 ? $iCaller : $iFallback;
    }

    public static function maskText(string $s): string
    {
        $sMasked = preg_replace('/((?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*)\S+/iu', '$1' . self::MASK, $s);

        return is_string($sMasked) ? $sMasked : $s;
    }

    protected static function clip(string $s): string
    {
        if (get_mb_len($s) <= self::JSON_MAX)
            return $s;

        return get_mb_substr($s, 0, self::JSON_MAX);
    }
}

/** @} */
