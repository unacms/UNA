<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 rate limits over real HTTP: a bucket lets its limit through and refuses the next
 * request with 429 and Retry-After; guests are counted by address and members by profile; the
 * switch and a limit of 0 let everything through; and the counter itself, window by window.
 * Each test sets the limits it needs and puts the site's own back.
 */
#[Group('integration')]
class ApiV2RateLimitTest extends ApiV2TestCase
{
    protected $_aOptions = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->forgetCounts();
    }

    protected function tearDown(): void
    {
        foreach ($this->_aOptions as $sName => $sValue)
            if ((string)getParam($sName) !== $sValue)
                setParam($sName, $sValue);
        $this->forgetCounts();
        parent::tearDown();
    }

    /**
     * Switch the limits on with these, requests a minute by bucket; the other buckets keep
     * the site's own.
     */
    protected function limits(array $aLimits, bool $bOn = true): void
    {
        $aOptions = [BxDolApiV2RateLimit::OPTION => $bOn ? 'on' : ''];
        foreach ($aLimits as $sBucket => $iLimit)
            $aOptions[BxDolApiV2RateLimit::optionOf($sBucket)] = (string)$iLimit;

        foreach ($aOptions as $sName => $sValue) {
            if (!isset($this->_aOptions[$sName]))
                $this->_aOptions[$sName] = (string)getParam($sName);
            setParam($sName, $sValue);
        }
    }

    protected function forgetCounts(): void
    {
        BxDolDb::getInstance()->query("DELETE FROM `sys_api_rate_limits`");
    }

    /**
     * Windows are minutes of the clock: a test whose requests would run into the next one
     * waits for it to start, so all of them are counted together.
     */
    protected function waitForRoomInTheWindow(int $iSeconds = 8): void
    {
        $iLeft = BxDolApiV2RateLimit::retryAfter(time());
        if ($iLeft <= $iSeconds)
            sleep($iLeft);
        $this->forgetCounts();
    }

    protected function assertRefused(array $a, string $sMessage = ''): void
    {
        $this->assertSame(429, $a['status'], $sMessage);
        $this->assertSchema('Problem', $a['json']);
        $this->assertSame('rate_limited', $a['json']['code']);
        $this->assertSame('urn:una:problem:rate_limited', $a['json']['type']);
        $this->assertSame(429, $a['json']['status']);
        $this->assertStringStartsWith('application/problem+json', (string)BxDolTestPhpServer::header($a, 'content-type'));
        $this->assertSame('no-store', BxDolTestPhpServer::header($a, 'cache-control'));

        $sRetry = (string)BxDolTestPhpServer::header($a, 'retry-after');
        $this->assertMatchesRegularExpression('/^[1-9][0-9]*$/', $sRetry, 'Retry-After is seconds');
        $this->assertLessThanOrEqual(BxDolApiV2RateLimit::WINDOW, (int)$sRetry);
        $this->assertStringContainsString('Retry-After', (string)BxDolTestPhpServer::header($a, 'access-control-expose-headers'), 'a page of another origin may read it');
    }

    public function testABucketLetsItsLimitThroughAndRefusesTheNext(): void
    {
        $this->limits(['search' => 3, 'general' => 1000]);
        $this->waitForRoomInTheWindow();

        for ($i = 1; $i <= 3; $i++)
            $this->assertSame(200, $this->http('GET', 'hashtags?q=te')['status'], 'request ' . $i . ' of 3');
        $this->assertRefused($this->http('GET', 'hashtags?q=te'), 'the fourth');
        $this->assertRefused($this->http('GET', 'search/profiles?q=te'), 'another operation of the same bucket');
        $this->assertSame(429, $this->http('HEAD', 'hashtags?q=te')['status'], 'HEAD is counted as GET');

        $this->assertSame(200, $this->http('GET', '')['status'], 'another bucket has its own count');
        $this->assertSame(204, $this->http('OPTIONS', 'hashtags')['status'], 'a preflight is never counted');
    }

    public function testGuestsAreCountedByAddressAndMembersByProfile(): void
    {
        list($iUser, $sToken) = $this->userToken();
        $sOtherToken = $this->profileToken($this->ordinaryProfileIdOtherThan([$iUser]));
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $aOther = ['Authorization' => 'Bearer ' . $sOtherToken];
        // the test server is asked from this machine, whose address the site takes the forwarded one from
        $aGuest = ['X-Forwarded-For' => '203.0.113.5'];
        $aGuestElsewhere = ['X-Forwarded-For' => '203.0.113.6'];

        $this->limits(['search' => 2]);
        $this->waitForRoomInTheWindow();

        $this->assertSame(200, $this->http('GET', 'hashtags?q=te', $aGuest)['status']);
        $this->assertSame(200, $this->http('GET', 'hashtags?q=te', $aGuest)['status']);
        $this->assertRefused($this->http('GET', 'hashtags?q=te', $aGuest), 'a guest over the limit');
        $this->assertSame(200, $this->http('GET', 'hashtags?q=te', $aGuestElsewhere)['status'], 'a guest at another address');
        $this->assertSame(200, $this->http('GET', 'hashtags?q=te')['status'], 'a guest at this machine\'s address');

        $this->assertSame(200, $this->http('GET', 'hashtags?q=te', $aMember + $aGuest)['status'], 'a member is not counted with the guests of the address');
        $this->assertSame(200, $this->http('GET', 'hashtags?q=te', $aMember)['status']);
        $this->assertRefused($this->http('GET', 'hashtags?q=te', $aMember), 'a member over the limit');
        $this->assertRefused($this->http('GET', 'hashtags?q=te', $aMember + $aGuestElsewhere), 'wherever the member asks from');
        $this->assertSame(200, $this->http('GET', 'hashtags?q=te', $aOther)['status'], 'another member');
    }

    public function testWritesAreCountedApartFromReads(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        $this->limits(['write' => 2, 'general' => 1000]);
        $this->waitForRoomInTheWindow();

        // a write that changes nothing: its body is refused, after it was counted
        $this->assertSame(422, $this->http('PUT', 'me/active-profile', $aJson, '{}')['status']);
        $this->assertSame(422, $this->http('PUT', 'me/active-profile', $aJson, '{}')['status']);
        $this->assertRefused($this->http('PUT', 'me/active-profile', $aJson, '{}'), 'a third write');
        $this->assertSame(200, $this->http('GET', 'me', $aAuth)['status'], 'reads go on');

        // a refused write claims no Idempotency-Key: the same key works once the limit lets it through
        $sKey = 'ApiV2RateLimitTest-' . bin2hex(random_bytes(8));
        $this->assertRefused($this->http('PUT', 'me/active-profile', $aJson + ['Idempotency-Key' => $sKey], '{}'));
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_api_idempotency` WHERE `key` = :k", ['k' => $sKey]));
    }

    public function testSwitchedOffOrWithoutALimitEverythingGoesThrough(): void
    {
        $this->limits(['search' => 1], false);
        $this->waitForRoomInTheWindow();
        for ($i = 1; $i <= 4; $i++)
            $this->assertSame(200, $this->http('GET', 'hashtags?q=te')['status'], 'switched off, request ' . $i);
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_api_rate_limits`"), 'nothing is counted while it is off');

        $this->limits(['search' => 0]);
        for ($i = 1; $i <= 4; $i++)
            $this->assertSame(200, $this->http('GET', 'hashtags?q=te')['status'], 'no limit for the bucket, request ' . $i);

        $this->limits(['search' => 1]);
        $this->waitForRoomInTheWindow();
        $this->assertSame(200, $this->http('GET', 'hashtags?q=te')['status']);
        $this->assertRefused($this->http('GET', 'hashtags?q=te'), 'switched on again');
    }

    public function testCountsStartAgainWithEachWindow(): void
    {
        $sSubject = 'test:' . bin2hex(random_bytes(8));
        $sOther = 'test:' . bin2hex(random_bytes(8));
        $iNow = 1800000000; // the first second of a minute
        $fHits = function (string $sSubject, string $sBucket) {
            return (int)BxDolDb::getInstance()->getOne("SELECT `hits` FROM `sys_api_rate_limits` WHERE `subject` = UNHEX(:s) AND `bucket` = :b", [
                's' => hash_hmac('sha256', $sSubject, BX_DOL_SECRET), 'b' => $sBucket,
            ]);
        };

        $this->assertSame(0, BxDolApiV2RateLimit::hit($sSubject, 'general', 2, $iNow));
        $this->assertSame(0, BxDolApiV2RateLimit::hit($sSubject, 'general', 2, $iNow + 10));
        $this->assertSame(45, BxDolApiV2RateLimit::hit($sSubject, 'general', 2, $iNow + 15), 'the third waits for the next minute');
        $this->assertSame(1, BxDolApiV2RateLimit::hit($sSubject, 'general', 2, $iNow + 59));
        $this->assertSame(3, $fHits($sSubject, 'general'), 'counting stops one over the limit');

        $this->assertSame(0, BxDolApiV2RateLimit::hit($sSubject, 'write', 2, $iNow + 15), 'another bucket');
        $this->assertSame(0, BxDolApiV2RateLimit::hit($sOther, 'general', 2, $iNow + 15), 'another subject');

        $this->assertSame(0, BxDolApiV2RateLimit::hit($sSubject, 'general', 2, $iNow + 60), 'the next window starts from one');
        $this->assertSame(1, $fHits($sSubject, 'general'));

        // a web server whose clock is a minute behind counts in the window the others are in
        $this->assertSame(0, BxDolApiV2RateLimit::hit($sSubject, 'general', 2, $iNow + 30));
        $this->assertSame(2, $fHits($sSubject, 'general'));
        $this->assertGreaterThan(0, BxDolApiV2RateLimit::hit($sSubject, 'general', 2, $iNow + 61));

        $this->assertGreaterThanOrEqual(3, BxDolApiV2RateLimit::prune($iNow + 120), 'counts of windows that passed');
        $this->assertSame(0, $fHits($sSubject, 'general'));
    }

    public function testEveryOperationDocumentsTheRefusal(): void
    {
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router()))->build();

        $this->assertSame('integer', $aSpec['components']['headers']['retryAfter']['schema']['type']);
        foreach ($aSpec['paths'] as $sPath => $aOps)
            foreach ($aOps as $sMethod => $aOp) {
                $this->assertArrayHasKey(429, $aOp['responses'], "$sMethod $sPath");
                $this->assertSame('#/components/headers/retryAfter', $aOp['responses'][429]['headers']['Retry-After']['$ref'], "$sMethod $sPath");
                $this->assertSame('#/components/schemas/Problem', $aOp['responses'][429]['content']['application/problem+json']['schema']['$ref'], "$sMethod $sPath");
            }
    }

    public function testTheSitesOwnLimitsAreSetUp(): void
    {
        // the tests above change these and put them back: here they are as the site has them
        foreach (BxDolApiV2RateLimit::buckets() as $sBucket) {
            $this->assertTrue(BxDolDb::getInstance()->isParam(BxDolApiV2RateLimit::optionOf($sBucket)), $sBucket . ' has its setting');
            $this->assertGreaterThanOrEqual(0, BxDolApiV2RateLimit::limitOf($sBucket));
        }
        $this->assertTrue(BxDolDb::getInstance()->isParam(BxDolApiV2RateLimit::OPTION));
        $this->assertFalse(BxDolApiV2RateLimit::isEnabled(), 'off while an API test class runs');
    }
}
