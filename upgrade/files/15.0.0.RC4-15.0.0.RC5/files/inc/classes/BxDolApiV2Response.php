<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * A response with a status other than 200, or with headers. An endpoint that returns a plain
 * array answers 200 with it as JSON.
 */
class BxDolApiV2Response
{
    public $iStatus;
    public $mBody;
    public $aHeaders;
    /** A streamed body (stream()): called with a writer once the headers are out. */
    public $fStream = null;

    public function __construct($iStatus, $mBody = null, $aHeaders = [])
    {
        $this->iStatus = (int)$iStatus;
        $this->mBody = $mBody;
        $this->aHeaders = $aHeaders;
    }

    /**
     * 201 with the new resource and where it lives.
     * @param string $sPath path under /api/v2, e.g. '/feed-posts/12'
     */
    public static function created($aBody, $sPath = '')
    {
        return new static(201, $aBody, $sPath ? ['Location' => BxDolApiV2Router::getBaseUrl() . $sPath] : []);
    }

    public static function noContent()
    {
        return new static(204);
    }

    public static function accepted($aBody = null)
    {
        return new static(202, $aBody);
    }

    /**
     * 200 with a body written as it is made (Server-Sent Events: an agent's reply). $fWrite
     * gets a writer, `function (string $s)`, that sends and flushes each piece at once. Such an
     * answer has no ETag and is never kept for Idempotency-Key repeats.
     */
    public static function stream(callable $fWrite, $sContentType = 'text/event-stream; charset=utf-8')
    {
        $o = new static(200, null, [
            'Content-Type' => $sContentType,
            'Cache-Control' => 'no-cache, no-transform',
            'X-Accel-Buffering' => 'no',
        ]);
        $o->fStream = $fWrite;
        return $o;
    }
}

/** @} */
