<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * An API v2 error, sent as an RFC 9457 problem document (`application/problem+json`).
 * `code` is stable and meant for programs; `title` and `detail` are for people and may change.
 * Throw it from an endpoint; the router turns it into the response.
 */
class BxDolApiV2Problem extends Exception
{
    protected $_iStatus;
    protected $_sCode;
    protected $_sDetail;
    protected $_aErrors;
    protected $_aHeaders;

    protected static $_aTitles = [
        400 => 'Bad Request',
        401 => 'Unauthorized',
        403 => 'Forbidden',
        404 => 'Not Found',
        405 => 'Method Not Allowed',
        406 => 'Not Acceptable',
        409 => 'Conflict',
        413 => 'Content Too Large',
        415 => 'Unsupported Media Type',
        422 => 'Unprocessable Content',
        429 => 'Too Many Requests',
        500 => 'Internal Server Error',
        503 => 'Service Unavailable',
    ];

    /**
     * @param int $iStatus HTTP status
     * @param string $sCode stable machine code, snake_case, e.g. `not_found`, `validation_failed`
     * @param string $sDetail human explanation of this occurrence
     * @param array $aErrors field errors: [['field' => 'body', 'code' => 'required', 'message' => '...']]
     * @param array $aHeaders extra response headers, e.g. ['WWW-Authenticate' => 'Bearer']
     */
    public function __construct($iStatus, $sCode, $sDetail = '', $aErrors = [], $aHeaders = [])
    {
        parent::__construct($sDetail ?: $sCode, (int)$iStatus);
        $this->_iStatus = (int)$iStatus;
        $this->_sCode = $sCode;
        $this->_sDetail = $sDetail;
        $this->_aErrors = $aErrors;
        $this->_aHeaders = $aHeaders;
    }

    public static function notFound($sWhat = '')
    {
        return new static(404, 'not_found', $sWhat ? $sWhat . ' was not found' : '');
    }

    public static function unauthorized($sDetail = 'Sign in to do this')
    {
        return new static(401, 'unauthorized', $sDetail, [], ['WWW-Authenticate' => 'Bearer realm="api"']);
    }

    public static function forbidden($sDetail = '')
    {
        return new static(403, 'forbidden', $sDetail);
    }

    public static function validation($aErrors, $sDetail = 'The request has invalid fields')
    {
        return new static(422, 'validation_failed', $sDetail, $aErrors);
    }

    /**
     * The problem type of a code: `urn:una:problem:<code>`, the code as it is.
     */
    public static function type($sCode)
    {
        return 'urn:una:problem:' . $sCode;
    }

    public function getStatus()
    {
        return $this->_iStatus;
    }

    public function getHeaders()
    {
        return $this->_aHeaders;
    }

    public function toArray()
    {
        $a = [
            'type' => self::type($this->_sCode),
            'title' => self::$_aTitles[$this->_iStatus] ?? 'Error',
            'status' => $this->_iStatus,
            'code' => $this->_sCode,
        ];
        if ($this->_sDetail !== '')
            $a['detail'] = $this->_sDetail;
        if ($this->_aErrors)
            $a['errors'] = $this->_aErrors;
        return $a;
    }
}

/** @} */
