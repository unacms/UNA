<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Encode/decode stored service-call blobs.
 * New writes are JSON. Old PHP-serialized arrays still decode.
 * Objects are never instantiated (allowed_classes => false + plain-data check).
 *
 * Writers of these blobs (inventory, 18 Aug 2026):
 * - BxDolService::getSerializedService — used by cron transient jobs, background jobs,
 *   live updates (comments/timeline), search-extended field values, ads form values_src.
 * - DB tables: sys_cron_jobs.service_call, background jobs.service_call,
 *   sys_alerts_handlers.service_call, studio widget cnt_notices, live-update service_call.
 * - Studio/admin paths write alerts + widgets. A lower-privilege INSERT into those
 *   columns is still "call any module method". This codec blocks object injection,
 *   not an authorized service call.
 */

class BxDolServiceCallCodec
{
    /**
     * JSON-encode a service-call array for new writes.
     */
    public static function encode($mixedModule, $sMethod, $aParams = array(), $sClass = '')
    {
        $aService = array(
            'module' => $mixedModule,
            'method' => $sMethod,
        );
        if (!empty($aParams))
            $aService['params'] = $aParams;
        if (!empty($sClass))
            $aService['class'] = $sClass;

        return json_encode($aService, JSON_UNESCAPED_UNICODE);
    }

    /**
     * True for a PHP-serialized array service call or a JSON object with module+method.
     */
    public static function isEncoded($s)
    {
        return false !== self::decode($s);
    }

    /**
     * Decode a stored blob. Returns an array or false.
     * Never instantiates PHP objects from the payload.
     */
    public static function decode($s)
    {
        if (!is_string($s) || $s === '')
            return false;

        $s = ltrim($s);
        if ($s === '')
            return false;

        if ($s[0] === '{') {
            $a = json_decode($s, true);
            return self::isServiceArray($a) ? $a : false;
        }

        // Historic PHP serialize of an array: a:N:{...}
        if (!preg_match('/^a:\d+:\{/', $s))
            return false;

        $a = @unserialize($s, array('allowed_classes' => false));
        return self::isServiceArray($a) ? $a : false;
    }

    /**
     * Same decode rules as BxBaseMenuSetAclLevel::getCode() AJAX profile_id.
     * Numeric string stays a string/number; otherwise json_decode. Never unserialize.
     */
    public static function decodeAclProfileId($mixedProfileId)
    {
        if (!is_string($mixedProfileId) && !is_numeric($mixedProfileId))
            return $mixedProfileId;

        $mixedProfileId = urldecode((string)$mixedProfileId);
        if (!is_numeric($mixedProfileId))
            $mixedProfileId = json_decode($mixedProfileId, true);

        return $mixedProfileId;
    }

    protected static function isServiceArray($a)
    {
        if (!is_array($a) || !isset($a['module'], $a['method']))
            return false;
        if (!is_scalar($a['module']) || !is_scalar($a['method']))
            return false;
        return self::isPlainData($a);
    }

    protected static function isPlainData($v)
    {
        if (is_scalar($v) || $v === null)
            return true;
        if (!is_array($v))
            return false;
        foreach ($v as $k => $item) {
            if (!is_int($k) && !is_string($k))
                return false;
            if (!self::isPlainData($item))
                return false;
        }
        return true;
    }
}
