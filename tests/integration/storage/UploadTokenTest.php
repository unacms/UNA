<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Upload tokens of BxDolUploader: one form render serves several uploads, so a token is checked, not consumed,
 * and is bound to its action, storage, uploader and session. Guests and direct uploads must present one,
 * a logged in profile uploading through the app proxy doesn't have to.
 */
#[Group('integration')]
class UploadTokenTest extends BxDolIntegrationTestCase
{
    private const STORAGE = 'sys_images_editor';
    private const UPLOADER = 'sys_html5';

    private array $_aOptionsBackup = [];
    private array $_aGetBackup = [];
    private array $_aTokens = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['sys_security_upload_token_enable', 'sys_security_upload_token_lifetime'] as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
        setParam('sys_security_upload_token_enable', 'on');
        setParam('sys_security_upload_token_lifetime', '900');
        BxDolDb::getInstance()->cleanMemoryAll();

        $this->_aGetBackup = $_GET;
        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        foreach ($this->_aTokens as $sToken)
            BxDolKey::getInstance()->removeKey($sToken);

        $_GET = $this->_aGetBackup;

        foreach ($this->_aOptionsBackup as $sName => $mixedValue)
            setParam($sName, $mixedValue);
        BxDolDb::getInstance()->cleanMemoryAll();

        parent::tearDown();
    }

    private function newToken(string $sAction = 'upload', string $sStorage = self::STORAGE, string $sUploader = self::UPLOADER): string
    {
        $sToken = BxDolUploader::getUploadToken($sAction, $sStorage, $sUploader);
        $this->assertIsString($sToken);
        $this->_aTokens[] = $sToken;

        return $sToken;
    }

    private function callService(array $aGet): mixed
    {
        $_GET = $aGet;

        return (new BxBaseUploaderServices())->serviceGetDataApi();
    }

    public function testTokenWorksForSeveralUploads(): void
    {
        $sToken = $this->newToken();

        for ($i = 0; $i < 3; $i++) {
            $aData = BxDolUploader::checkUploadToken($sToken, 'upload', self::STORAGE, self::UPLOADER);
            $this->assertIsArray($aData, 'Upload ' . ($i + 1) . ' with the same token must pass.');
            $this->assertArrayHasKey('profile_id', $aData);
        }
    }

    public function testTokenIsBoundToItsScope(): void
    {
        $sToken = $this->newToken();

        $this->assertFalse(BxDolUploader::checkUploadToken($sToken, 'upload_inline', self::STORAGE, self::UPLOADER), 'Other action.');
        $this->assertFalse(BxDolUploader::checkUploadToken($sToken, 'upload', 'sys_images', self::UPLOADER), 'Other storage.');
        $this->assertFalse(BxDolUploader::checkUploadToken($sToken, 'upload', self::STORAGE, 'sys_crop'), 'Other uploader.');
        $this->assertFalse(BxDolUploader::checkUploadToken('', 'upload', self::STORAGE, self::UPLOADER), 'No token.');
        $this->assertFalse(BxDolUploader::checkUploadToken('nosuchtoken', 'upload', self::STORAGE, self::UPLOADER), 'Unknown token.');
    }

    public function testTokenOfAnotherSessionIsRefused(): void
    {
        $sToken = BxDolKey::getInstance()->getNewKey([
            'action' => 'upload',
            'storage' => self::STORAGE,
            'uploader' => self::UPLOADER,
            'session' => 'some-other-session-id',
            'profile_id' => 0,
            'transcoders' => [],
        ], 900, BxDolUploader::UPLOAD_TOKEN_SALT);
        $this->_aTokens[] = $sToken;

        $this->assertFalse(BxDolUploader::checkUploadToken($sToken, 'upload', self::STORAGE, self::UPLOADER));
    }

    public function testExpiredTokenIsRefused(): void
    {
        $sToken = $this->newToken();
        BxDolDb::getInstance()->query("UPDATE `sys_keys` SET `expire` = :expire WHERE `key` = :key", [
            'expire' => time() - 10,
            'key' => $sToken,
        ]);

        $this->assertFalse(BxDolUploader::checkUploadToken($sToken, 'upload', self::STORAGE, self::UPLOADER));
    }

    public function testTokenLifetimeFollowsTheOption(): void
    {
        // A long draft keeps uploading: the token lives as long as the option says.
        setParam('sys_security_upload_token_lifetime', '21600');
        BxDolDb::getInstance()->cleanMemoryAll();

        $sToken = $this->newToken();
        $iExpire = (int)BxDolDb::getInstance()->getOne("SELECT `expire` FROM `sys_keys` WHERE `key` = :key", ['key' => $sToken]);

        $this->assertEqualsWithDelta(time() + 21600, $iExpire, 5);
        $this->assertIsArray(BxDolUploader::checkUploadToken($sToken, 'upload', self::STORAGE, self::UPLOADER));
    }

    public function testNothingPassesWhenTokensAreDisabled(): void
    {
        $sToken = $this->newToken();
        setParam('sys_security_upload_token_enable', '');
        BxDolDb::getInstance()->cleanMemoryAll();

        $this->assertFalse(BxDolUploader::checkUploadToken($sToken, 'upload', self::STORAGE, self::UPLOADER));
    }

    public function testGuestNeedsTokenForUpload(): void
    {
        $aGet = ['uo' => self::UPLOADER, 'so' => self::STORAGE, 'uid' => 'abc12345', 'a' => 'upload'];

        $this->assertSame(403, $this->callService($aGet)['code'] ?? null, 'Guest without a token.');
        $this->assertSame(403, $this->callService($aGet + ['ut' => 'nosuchtoken'])['code'] ?? null, 'Guest with a wrong token.');

        $sToken = $this->newToken();
        for ($i = 0; $i < 2; $i++)
            $this->assertNull($this->callService($aGet + ['ut' => $sToken]), 'Guest with a valid token passes the check (no file sent).');
    }

    public function testGuestNeedsTokenForInlineUploadOfItsStorage(): void
    {
        $aGet = ['uo' => self::UPLOADER, 'so' => self::STORAGE, 'uid' => 'abc12345', 'a' => 'upload_inline', 'o' => self::STORAGE];

        $this->assertSame(403, $this->callService($aGet)['code'] ?? null, 'Guest without a token.');

        $sToken = $this->newToken('upload_inline');
        $this->assertSame(403, $this->callService(array_merge($aGet, ['ut' => $sToken, 'o' => 'sys_images']))['code'] ?? null, 'Token is bound to its storage.');
        $this->assertSame(403, $this->callService(array_merge($aGet, ['ut' => $this->newToken('upload')]))['code'] ?? null, 'Token of another action.');
    }

    public function testInlineUploadRefusesForeignTranscoderBeforeStoring(): void
    {
        $sToken = $this->newToken('upload_inline');
        $_FILES['file'] = ['name' => 'a.png', 'type' => 'image/png', 'tmp_name' => '/nonexistent', 'error' => 0, 'size' => 1];

        try {
            $aResult = $this->callService([
                'uo' => self::UPLOADER, 'so' => self::STORAGE, 'uid' => 'abc12345', 'a' => 'upload_inline',
                'o' => self::STORAGE, 'ut' => $sToken, 't' => 'sys_images_editor_no_such_transcoder',
            ]);
        } finally {
            unset($_FILES['file']);
        }

        $this->assertSame(403, $aResult['code'] ?? null);
    }

    public function testLoggedInProfileUploadsThroughProxyWithoutToken(): void
    {
        $this->bxLoginAsUser();

        $aGet = ['uo' => self::UPLOADER, 'so' => self::STORAGE, 'uid' => 'abc12345', 'a' => 'upload'];
        $this->assertNull($this->callService($aGet), 'No token, but the profile owns the upload.');

        $this->assertSame(403, $this->callService($aGet + ['ut' => 'nosuchtoken'])['code'] ?? null, 'A token that is sent must be valid.');
    }

    public function testUploadTokenServiceIssuesTokenOfRequestedAction(): void
    {
        $_GET = ['uo' => self::UPLOADER, 'so' => self::STORAGE, 'a' => 'upload_inline'];
        $aResult = (new BxBaseUploaderServices())->serviceGetUploadToken();

        $this->assertIsArray($aResult);
        $this->assertNotEmpty($aResult['token'] ?? '');
        $this->_aTokens[] = $aResult['token'];

        $this->assertIsArray(BxDolUploader::checkUploadToken($aResult['token'], 'upload_inline', self::STORAGE, self::UPLOADER));
        $this->assertFalse(BxDolUploader::checkUploadToken($aResult['token'], 'upload', self::STORAGE, self::UPLOADER));

        $_GET = ['uo' => self::UPLOADER, 'so' => self::STORAGE];
        $aResult = (new BxBaseUploaderServices())->serviceGetUploadToken();
        $this->_aTokens[] = $aResult['token'];
        $this->assertIsArray(BxDolUploader::checkUploadToken($aResult['token'], 'upload', self::STORAGE, self::UPLOADER), 'Defaults to upload.');
    }
}
