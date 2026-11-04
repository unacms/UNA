<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAlertsStats extends BxDol
{
    /**
     * Keys whose values are never written to the log: credentials, codes, sessions,
     * message contents or addresses, links (which can carry a reset or confirmation
     * key), form inputs (the values people typed) and remote (third-party) profile data.
     * Matched as a whole word in snake_case or camelCase keys at any depth.
     */
    private const REDACT_KEYS = '/(^|_)(pwd|pass|passwd|password|salt|secret|token|otp|key|code|sessid|sid|session|body|e?mails?|headers?|recipients?|phones?|sms|message|url|link|inputs|remote)(_|$)/i';
    private const REDACTED = '[redacted]';

    private static array $logs = [];
    private static array $stats = [];
    private static bool $registered = false;

    public static function log(object $oAlert): void
    {
        if (!self::$registered) {
            self::$registered = true;
            register_shutdown_function([self::class, 'flush']);
        }

        $s = $oAlert->sUnit . ':' . $oAlert->sAction;
        if (!isset(self::$logs[$s])) {
            self::$logs[$s] = [
                'unit' => $oAlert->sUnit,
                'action' => $oAlert->sAction,
                'object' => $oAlert->iObject,
                'sender' => $oAlert->iSender,
                'extra' => $oAlert->aExtras,
                'counter' => 1,
            ];
        }
        else {
            self::$logs[$s]['counter']++;
        }
    }

    public static function hit(string $hookName, float $timing): void
    {
        if (!self::$registered) {
            self::$registered = true;
            register_shutdown_function([self::class, 'flush']);
        }

        if (!isset(self::$stats[$hookName])) {
            self::$stats[$hookName] = [
                'count' => 0,
                'last' => time(),
                'timing' => $timing,
            ];
        }

        self::$stats[$hookName]['count']++;
        self::$stats[$hookName]['last'] = time();
        self::$stats[$hookName]['timing'] += $timing;
    }

    public static function flush(): void
    {
        self::flushStats();
        self::flushLogs();
    }

    public static function flushStats(): void
    {
        if (!self::$stats || !getParam('sys_alerts_stats'))
            return;

        foreach (self::$stats as $hookName => $data) {

            $sql = "
                UPDATE `sys_alerts_handlers`
                SET
                    `ts` = :last,
                    `timing` = :timing,
                    `call_count` = call_count + :count, 
                    `calls_per_request` = GREATEST(`calls_per_request`, :count)
                WHERE `name` = :name
            ";

            BxDolDb::getInstance()->query($sql, [
                'count' => $data['count'],
                'last' => $data['last'],
                'timing' => $data['timing'],
                'name' => $hookName,
            ]);
        }
    }

    public static function flushLogs(): void
    {
        if (!self::$logs)
            return;

        $oDb = BxDolDb::getInstance();
        if (!getParam('sys_alerts_stats'))
            $aMap = $oDb->getPairs('SELECT CONCAT(unit, ":", action) AS `key`, 1 AS `val` FROM sys_alerts_log', 'key', 'val');

        foreach (self::$logs as $s => $data) {
            $aExtraRefs = [];
            foreach($data['extra'] as $sKey => $mixedValue) {
                if (preg_match('/^(ref|override|return)_/', $sKey) || preg_match('/_(ref|override|return)$/', $sKey) || $sKey == 'result' || $sKey == 'res' || $sKey == 'return' || $sKey == 'ret' || $sKey == 'check_result') {
                    self::$logs[$s]['extra_refs'][] = $sKey;
                }
            }
            self::$logs[$s]['extra_refs'] = json_encode(self::$logs[$s]['extra_refs'] ?? []);
            self::$logs[$s]['extra'] = json_encode(self::redact($data['extra']));

            if (getParam('sys_alerts_stats')) {
                $oDb->query("
                    INSERT INTO sys_alerts_log
                    SET
                        unit = :unit,
                        action = :action,
                        object = :object,
                        sender = :sender,
                        extra = :extra,
                        extra_refs = :extra_refs,
                        ts = UNIX_TIMESTAMP(),
                        counter_total = :counter,
                        counter_24h = :counter,
                        counter_per_request = :counter
                    ON DUPLICATE KEY UPDATE
                        ts = UNIX_TIMESTAMP(),
                        counter_total = counter_total + :counter,
                        counter_24h = counter_24h + :counter,
                        counter_per_request = GREATEST(counter_per_request, :counter)
                ", self::$logs[$s]);
            } else {                
                $sKey = self::$logs[$s]['unit'] . ':' . self::$logs[$s]['action'];
                if (!isset($aMap[$sKey])) {
                    $oDb->query("
                        INSERT IGNORE INTO sys_alerts_log
                        SET
                            unit = :unit,
                            action = :action,
                            object = :object,
                            sender = :sender,
                            extra = :extra,
                            extra_refs = :extra_refs,
                            ts = 0,
                            counter_per_request = :counter
                    ", self::$logs[$s]);
                }
            }
        }
    }

    /**
     * A copy of an alert's extra data for the log, with the values of secret or
     * personal keys (REDACT_KEYS) replaced and objects named by class. The keys stay,
     * since the log is there to show the shape of each alert's data. The extras hold
     * references to the caller's variables, so they are read into a new array and
     * never changed in place.
     */
    public static function redact(array $aExtras, int $iDepth = 0): array
    {
        $aResult = [];
        foreach ($aExtras as $mixedKey => $mixedValue) {
            if (is_string($mixedKey) && preg_match(self::REDACT_KEYS, preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', $mixedKey)))
                $aResult[$mixedKey] = self::REDACTED;
            else if (is_array($mixedValue))
                $aResult[$mixedKey] = $iDepth < 10 ? self::redact($mixedValue, $iDepth + 1) : self::REDACTED;
            else if (is_object($mixedValue))
                $aResult[$mixedKey] = '[object ' . get_class($mixedValue) . ']'; // a form, for one, holds the submitted values
            else
                $aResult[$mixedKey] = $mixedValue;
        }

        return $aResult;
    }
}

/** @} */
