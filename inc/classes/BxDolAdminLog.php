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
            return 0;
        }
    }

    public static function recordSql(array $aContext, string $sOp, string $sTable, string $sPkValue, ?string $sBefore, ?string $sAfter): void
    {
        [$sType, $sId] = self::sqlObject($sTable, $sPkValue, $sBefore, $sAfter);

        self::record([
            'source' => 'agent',
            'agent_id' => (int)($aContext['agent_id'] ?? 0),
            'profile_id' => (int)($aContext['profile_id'] ?? 0),
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

    public static function runGrid($oGrid, string $sAction, bool $bStudioRequest, callable $fn): void
    {
        if (!self::shouldLogGrid($oGrid, $sAction, $bStudioRequest)) {
            $fn();
            return;
        }

        $aSubject = $oGrid->getSourceOptions();
        $aIds = self::gridIds($oGrid);
        $bSnapshot = self::canSnapshot($aSubject) && $aIds;
        $aBefore = [];
        if ($bSnapshot) {
            try {
                $aBefore = BxDolAdminLogQuery::getInstance()->getRows($aSubject['table'], $aSubject['field_id'], $aIds);
            }
            catch (Throwable $e) {
                $aBefore = [];
            }
        }

        $bWrote = false;
        $fnWrite = function () use (&$bWrote, $sAction, $aSubject, $aIds, $aBefore, $bSnapshot) {
            if ($bWrote)
                return;
            $bWrote = true;

            $aAfter = [];
            if ($bSnapshot) {
                try {
                    $aAfter = BxDolAdminLogQuery::getInstance()->getRows($aSubject['table'], $aSubject['field_id'], $aIds);
                }
                catch (Throwable $e) {
                    $aAfter = [];
                }
            }

            self::record([
                'source' => 'studio',
                'object_type' => 'grid:' . $aSubject['object'],
                'object_id' => implode(',', $aIds),
                'action' => $sAction,
                'before' => $bSnapshot ? $aBefore : '',
                'after' => $bSnapshot ? $aAfter : '',
            ]);
        };

        register_shutdown_function($fnWrite);
        $fn();
        $fnWrite();
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

    protected static function isSecretKey(string $sKey): bool
    {
        return (bool)preg_match('/password|passwd|secret|token|api_key|apikey|private_key|client_secret|access_key/i', $sKey);
    }

    protected static function maskText(string $s): string
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
