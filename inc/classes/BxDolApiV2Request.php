<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * An API v2 request as an endpoint sees it: method, path params, query, the JSON body
 * (already checked against the operation's schema) and who is asking.
 */
class BxDolApiV2Request
{
    const LIMIT_DEFAULT = 20;
    const LIMIT_MAX = 50;
    const OFFSET_MAX = 100000;

    protected $_sMethod;
    protected $_aPathParams;
    protected $_aQuery;
    protected $_mBody;
    protected $_aFiles;
    protected $_oAuth;

    public function __construct($sMethod, $aPathParams, $aQuery, $mBody, $aFiles, BxDolApiV2Auth $oAuth)
    {
        $this->_sMethod = $sMethod;
        $this->_aPathParams = $aPathParams;
        $this->_aQuery = $aQuery;
        $this->_mBody = $mBody;
        $this->_aFiles = $aFiles;
        $this->_oAuth = $oAuth;
    }

    public function getMethod()
    {
        return $this->_sMethod;
    }

    /**
     * A path param that is an Id: a positive integer, given as a decimal string.
     */
    public function id($sName = 'id')
    {
        $s = $this->_aPathParams[$sName] ?? '';
        if (!preg_match('/^[1-9][0-9]{0,18}$/', $s))
            throw BxDolApiV2Problem::notFound();
        return (int)$s;
    }

    public function path($sName)
    {
        return $this->_aPathParams[$sName] ?? null;
    }

    public function query($sName, $mDefault = null)
    {
        $m = $this->_aQuery[$sName] ?? null;
        return is_string($m) && $m !== '' ? $m : $mDefault;
    }

    public function queryBool($sName, $bDefault = false)
    {
        $s = $this->query($sName);
        if ($s === null)
            return $bDefault;
        if (in_array($s, ['true', '1'], true))
            return true;
        if (in_array($s, ['false', '0'], true))
            return false;
        throw BxDolApiV2Problem::validation([['field' => $sName, 'code' => 'invalid_type', 'message' => 'Use true or false']]);
    }

    /**
     * The JSON body as an array (an empty array when there is none).
     */
    public function body()
    {
        return is_array($this->_mBody) ? $this->_mBody : [];
    }

    public function file($sName)
    {
        $a = $this->_aFiles[$sName] ?? null;
        return is_array($a) && isset($a['tmp_name']) && is_uploaded_file($a['tmp_name']) ? $a : null;
    }

    /**
     * PHP's upload error (UPLOAD_ERR_*) of a multipart file field, or null when the request
     * has no such field: file() is null for a file that did not arrive, and this says why.
     */
    public function fileError($sName)
    {
        $a = $this->_aFiles[$sName] ?? null;
        return is_array($a) && isset($a['error']) && is_int($a['error']) ? $a['error'] : null;
    }

    public function auth()
    {
        return $this->_oAuth;
    }

    /**
     * The viewer's profile id, 0 for a guest.
     */
    public function viewerId()
    {
        return $this->_oAuth->getProfileId();
    }

    /**
     * The viewer's profile id; a guest gets 401.
     */
    public function requireViewer()
    {
        if (!($iProfileId = $this->viewerId()))
            throw BxDolApiV2Problem::unauthorized();
        return $iProfileId;
    }

    public function limit()
    {
        $s = $this->query('limit');
        if ($s === null)
            return self::LIMIT_DEFAULT;
        // a number out of range is clamped into it (0 is 1, 500 is the most); only a non-number is refused
        if (!preg_match('/^[0-9]{1,9}$/', $s))
            throw BxDolApiV2Problem::validation([['field' => 'limit', 'code' => 'out_of_range', 'message' => 'limit must be 1-' . self::LIMIT_MAX]]);
        return max(1, min((int)$s, self::LIMIT_MAX));
    }

    /**
     * Where a page starts. Cursors are opaque to clients; today they hold an offset, which lets
     * an endpoint move to keyset paging later without any change for clients.
     */
    public function cursorOffset()
    {
        $s = $this->query('cursor');
        if ($s === null)
            return 0;

        $a = self::decodeCursor($s);
        if (!is_array($a) || !isset($a['o']) || !is_int($a['o']) || $a['o'] < 0 || $a['o'] > self::OFFSET_MAX)
            throw BxDolApiV2Problem::validation([['field' => 'cursor', 'code' => 'invalid_cursor', 'message' => 'Pass back a next_cursor from a previous page']]);

        return $a['o'];
    }

    /**
     * A page of items: one extra item fetched past the limit says whether there is a next page.
     * @param array $aItems up to limit + 1 items, already mapped
     */
    public function page($aItems, $iOffset, $iLimit)
    {
        $bMore = count($aItems) > $iLimit;
        return [
            'items' => array_values(array_slice($aItems, 0, $iLimit)),
            'next_cursor' => $bMore && $iOffset + $iLimit <= self::OFFSET_MAX ? self::encodeCursor(['o' => $iOffset + $iLimit]) : null,
        ];
    }

    /**
     * A page whose endpoint knows where the next one starts (a row offset of its own source,
     * which can be past more rows than items shown when some were left out).
     * @param int|null $iNextOffset null on the last page
     */
    public function pageAt($aItems, $iNextOffset)
    {
        return [
            'items' => array_values($aItems),
            'next_cursor' => $iNextOffset !== null && $iNextOffset <= self::OFFSET_MAX ? self::encodeCursor(['o' => (int)$iNextOffset]) : null,
        ];
    }

    /**
     * Keyset paging: the id a page continues before (0 on the first page).
     */
    public function cursorBefore()
    {
        $s = $this->query('cursor');
        if ($s === null)
            return 0;

        $a = self::decodeCursor($s);
        if (!is_array($a) || !isset($a['b']) || !is_int($a['b']) || $a['b'] < 1)
            throw BxDolApiV2Problem::validation([['field' => 'cursor', 'code' => 'invalid_cursor', 'message' => 'Pass back a next_cursor from a previous page']]);

        return $a['b'];
    }

    /**
     * A keyset page: up to limit + 1 items, newest first; the next page starts before the last one shown.
     * @param callable $fnKey returns an item's key (its id)
     */
    public function pageBefore($aItems, $iLimit, $fnKey)
    {
        $aItems = array_values($aItems);
        return $this->pageBeforeAt(array_slice($aItems, 0, $iLimit), count($aItems) > $iLimit && $iLimit > 0 ? (int)$fnKey($aItems[$iLimit - 1]) : 0);
    }

    /**
     * A keyset page whose endpoint knows where the next one starts: the next page has what is
     * older than $iBefore (an id it scanned to, which can be past the last item shown).
     * @param int $iBefore 0 on the last page
     */
    public function pageBeforeAt($aItems, $iBefore)
    {
        return [
            'items' => array_values($aItems),
            'next_cursor' => $iBefore > 0 ? self::encodeCursor(['b' => (int)$iBefore]) : null,
        ];
    }

    public static function encodeCursor($a)
    {
        return rtrim(strtr(base64_encode(json_encode($a)), '+/', '-_'), '=');
    }

    public static function decodeCursor($s)
    {
        if (!preg_match('/^[A-Za-z0-9_-]{1,200}$/', $s))
            return null;
        $sJson = base64_decode(strtr($s, '-_', '+/'), true);
        return $sJson === false ? null : json_decode($sJson, true);
    }
}

/** @} */
