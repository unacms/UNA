<?php

require_once __DIR__ . '/ApiV2Seeds.php';

/**
 * What API v2 test classes share: PHP's built-in server in front of api_v2.php (one per class),
 * requests to it, schema checks against the published document, the test user's tokens and
 * people to act as. A test that makes notifications (alerts in the server process) calls
 * forgetNotificationsFromNowOn() first; they are deleted after it, last, with its tokens.
 * Rate limits are off while a class runs (its tests send more in a minute than a client may);
 * the tests of the limits switch them on themselves.
 * People the site does not have are made for the class and removed after it (ApiV2Seeds).
 */
abstract class ApiV2TestCase extends BxDolIntegrationTestCase
{
    use ApiV2Seeds;

    protected static $_oServer;
    /** The site's rate limit switch as it was before the class ran. */
    protected static $_sRateLimit = null;

    protected $_aTokens = [];
    protected $_iNotificationsFrom = null;
    protected $_sApiEnable;
    protected $_sApiV2Enable;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_sApiEnable = getParam('sys_api_enable');
        if ($this->_sApiEnable !== 'on')
            setParam('sys_api_enable', 'on');
        // v2 is off as installed (a preview): on for the test, put back after
        $this->_sApiV2Enable = getParam(BxDolApiV2Router::OPTION_ENABLE);
        if ($this->_sApiV2Enable !== 'on')
            setParam(BxDolApiV2Router::OPTION_ENABLE, 'on');
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        // first what the test made on top of the class's people; a failure there must not keep
        // the rest from being removed
        try {
            $this->seedRemoveTestData();
        } catch (Throwable $e) {
            fwrite(STDERR, static::class . ': ' . $e->getMessage() . "\n");
        }
        if ($this->_iNotificationsFrom !== null)
            $oDb->query("DELETE FROM `bx_notifications_events` WHERE `id` > :i", ['i' => $this->_iNotificationsFrom]);
        foreach ($this->_aTokens as $sToken)
            $oDb->query("DELETE FROM `bx_oauth_access_tokens` WHERE `access_token` = :t", ['t' => $sToken]);
        if (getParam('sys_api_enable') !== $this->_sApiEnable)
            setParam('sys_api_enable', $this->_sApiEnable);
        if (getParam(BxDolApiV2Router::OPTION_ENABLE) !== $this->_sApiV2Enable)
            setParam(BxDolApiV2Router::OPTION_ENABLE, $this->_sApiV2Enable);
        parent::tearDown();
    }

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();
        self::$_sRateLimit = (string)getParam(BxDolApiV2RateLimit::OPTION);
        if (self::$_sRateLimit !== '')
            setParam(BxDolApiV2RateLimit::OPTION, '');
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$_oServer) {
            self::$_oServer->stop();
            self::$_oServer = null;
        }
        self::seedRemovePeople();
        if (self::$_sRateLimit !== null && (string)getParam(BxDolApiV2RateLimit::OPTION) !== self::$_sRateLimit)
            setParam(BxDolApiV2RateLimit::OPTION, self::$_sRateLimit);
        self::$_sRateLimit = null;
        parent::tearDownAfterClass();
    }

    /**
     * The test user's account: one made for the class (ApiV2Seeds::seedTestUser()), or, with
     * UNA_TEST_SITE_DATA=1, the site's own (UNA_TEST_USER_EMAIL) when it is installed and acts
     * as an active person.
     */
    protected function bxAccount(string $sKind = 'admin'): BxDolAccount
    {
        if ($sKind === 'user' && ($oAccount = $this->seedTestUser()))
            return $oAccount;
        return parent::bxAccount($sKind);
    }

    /**
     * The people the site has, for the helpers that look for one: none unless the tests were
     * told to use the site's data (UNA_TEST_SITE_DATA), and never one made for the class.
     * @return array rows of sys_profiles: id, account_id
     */
    protected function sitePeople(string $sWhere = "`type` = 'bx_persons'", int $iLimit = 200): array
    {
        if (self::seedOnly())
            return [];
        $aOwn = array_keys(self::$_aSeedAccounts);
        return array_values(array_filter(
            BxDolDb::getInstance()->getAll("SELECT `id`, `account_id` FROM `sys_profiles` WHERE " . $sWhere . " AND `status` = 'active' ORDER BY `id` LIMIT " . (int)$iLimit),
            fn($aRow) => !in_array((int)$aRow['account_id'], $aOwn, true)
        ));
    }

    /**
     * An active ordinary person (no admin or moderator powers) of an account none of these
     * profiles belongs to: one the site has, or one made for the class.
     */
    protected function ordinaryProfileIdOtherThan(array $aProfiles): int
    {
        $aAccounts = [];
        foreach ($aProfiles as $iProfile)
            $aAccounts[] = (int)BxDolProfile::getInstance($iProfile)->getAccountId();
        foreach ($this->sitePeople() as $aRow)
            if (!in_array((int)$aRow['account_id'], $aAccounts, true) && !isAdmin((int)$aRow['account_id']) && !bx_acl_is_advanced((int)$aRow['id']))
                return (int)$aRow['id'];
        return $this->seedPooledPerson(fn($i) => !in_array((int)BxDolProfile::getInstance($i)->getAccountId(), $aAccounts, true));
    }

    /** An administrator's profile on another account than these profiles': one the site has, or one made for the class. */
    protected function adminProfileIdOtherThan(array $aProfiles): int
    {
        $aAccounts = array_map(fn($i) => (int)BxDolProfile::getInstance($i)->getAccountId(), $aProfiles);
        foreach ($this->sitePeople() as $aRow)
            if (!in_array((int)$aRow['account_id'], $aAccounts, true) && isAdmin((int)$aRow['account_id']))
                return (int)$aRow['id'];
        return $this->seedPooledPerson(fn($i) => !in_array((int)BxDolProfile::getInstance($i)->getAccountId(), $aAccounts, true), true);
    }

    /**
     * Notification events made from here on are deleted after the test (the site's alerts
     * make them in the server process).
     */
    protected function forgetNotificationsFromNowOn(): void
    {
        $this->_iNotificationsFrom = (int)BxDolDb::getInstance()->getOne("SELECT MAX(`id`) FROM `bx_notifications_events`");
    }

    /**
     * @return array [profile id, access token]
     */
    protected function userToken(string $sScope = 'api'): array
    {
        $this->requireModule('bx_oauth');
        $oAccount = $this->bxAccount('user');
        $oProfile = BxDolProfile::getInstanceByAccount($oAccount->id());
        // only on a site with no Persons module: with it, an account that has no person gets one made
        if (!$oProfile)
            $this->markTestSkipped('The test user has no profile.');

        return [$oProfile->id(), $this->profileToken($oProfile->id(), $sScope)];
    }

    /**
     * An access token of the desktop client for any profile.
     */
    protected function profileToken(int $iProfileId, string $sScope = 'api'): string
    {
        $this->requireModule('bx_oauth');
        $sToken = bin2hex(random_bytes(20));
        BxDolDb::getInstance()->query("INSERT INTO `bx_oauth_access_tokens` (`access_token`, `client_id`, `user_id`, `expires`, `scope`) VALUES (:t, 'una-desktop', :u, :e, :s)", [
            't' => $sToken, 'u' => $iProfileId, 'e' => date('Y-m-d H:i:s', time() + 600), 's' => $sScope,
        ]);
        $this->_aTokens[] = $sToken;
        return $sToken;
    }

    protected function requireModule(string $sName): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sName))
            $this->markTestSkipped($sName . ' is not installed.');
    }

    protected function http(string $sMethod, string $sPath, array $aHeaders = [], string $sBody = ''): array
    {
        if (!self::$_oServer) {
            $aUrl = parse_url(BX_DOL_URL_ROOT);
            self::$_oServer = new BxDolTestPhpServer(BX_DIRECTORY_PATH_ROOT, null, $aUrl['host'] . (empty($aUrl['port']) ? '' : ':' . $aUrl['port']));
        }

        $a = explode('?', $sPath, 2);
        return $this->raw($sMethod, '/api_v2.php?_q=' . rawurlencode($a[0]) . (isset($a[1]) ? '&' . $a[1] : ''), $aHeaders, $sBody);
    }

    /**
     * POST /uploads with one file (and other form fields), as multipart/form-data. An upload
     * that a test leaves is a ghost, which the site deletes after its ghost lifetime.
     */
    protected function upload(array $aHeaders, string $sName, string $sData, array $aFields = []): array
    {
        $sBoundary = 'ApiV2Test' . bin2hex(random_bytes(8));
        $sBody = '';
        foreach ($aFields as $sKey => $sValue)
            $sBody .= '--' . $sBoundary . "\r\nContent-Disposition: form-data; name=\"" . $sKey . "\"\r\n\r\n" . $sValue . "\r\n";
        $sBody .= '--' . $sBoundary . "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" . $sName . "\"\r\nContent-Type: application/octet-stream\r\n\r\n" . $sData . "\r\n--" . $sBoundary . "--\r\n";
        return $this->http('POST', 'uploads', $aHeaders + ['Content-Type' => 'multipart/form-data; boundary=' . $sBoundary], $sBody);
    }

    /**
     * A red PNG of this size, made without GD.
     */
    protected static function png(int $iWidth, int $iHeight): string
    {
        $fChunk = function ($sType, $sData) {
            return pack('N', strlen($sData)) . $sType . $sData . pack('N', crc32($sType . $sData));
        };
        $sRaw = str_repeat("\x00" . str_repeat("\xff\x00\x00", $iWidth), $iHeight);
        return "\x89PNG\r\n\x1a\n" . $fChunk('IHDR', pack('NNCCCCC', $iWidth, $iHeight, 8, 2, 0, 0, 0)) . $fChunk('IDAT', gzcompress($sRaw)) . $fChunk('IEND', '');
    }

    protected function raw(string $sMethod, string $sUri, array $aHeaders = [], string $sBody = ''): array
    {
        $aResponse = self::$_oServer->request($sMethod, $sUri, $aHeaders, $sBody);
        $aResponse['body'] = self::dechunk($aResponse);
        $aResponse['json'] = json_decode($aResponse['body'], true);
        return $aResponse;
    }

    protected static function dechunk(array $a): string
    {
        if (stripos((string)BxDolTestPhpServer::header($a, 'transfer-encoding'), 'chunked') === false)
            return $a['body'];

        $sOut = '';
        $s = $a['body'];
        while (($i = strpos($s, "\r\n")) !== false) {
            $iLen = hexdec(substr($s, 0, $i));
            if ($iLen === 0)
                break;
            $sOut .= substr($s, $i + 2, $iLen);
            $s = substr($s, $i + 2 + $iLen + 2);
        }
        return $sOut;
    }

    protected function assertSchema(string $sName, $mValue): void
    {
        static $aComponents = null;
        if ($aComponents === null)
            $aComponents = (new BxDolApiV2Router())->getSchemas();

        $aErrors = (new BxDolApiV2Validator($aComponents))->validate($mValue, ['$ref' => '#/components/schemas/' . $sName]);
        $this->assertSame([], $aErrors, $sName . ' does not match its schema: ' . json_encode($aErrors));
    }
}
