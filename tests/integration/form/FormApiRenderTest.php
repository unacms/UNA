<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API forms skip the HTML nobody reads: getCodeAPI builds no uploaders and no HTML editor,
 * guest forms aren't rendered as HTML before getCodeAPI (one CSRF key, not two), and the
 * upload limit comes from the membership level without reading the quota row.
 */
#[Group('integration')]
class FormApiRenderTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup = [];
    protected $_aClassesBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aGetBackup = $_GET;
        $this->_aClassesBackup = $GLOBALS['bxDolClasses'] ?? [];
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;

        // Drop the objects the test made or replaced (forms, the ACL stub, Invites in API mode).
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (!array_key_exists($sKey, $this->_aClassesBackup))
                unset($GLOBALS['bxDolClasses'][$sKey]);
        foreach ($this->_aClassesBackup as $sKey => $o)
            $GLOBALS['bxDolClasses'][$sKey] = $o;

        parent::tearDown();
    }

    /**
     * A form with an HTML textarea and a files input that counts the editors and uploaders it builds.
     */
    protected function spyForm()
    {
        $aForm = [
            'form_attrs' => ['id' => 'phpunit_form_api_render', 'name' => 'phpunit_form_api_render', 'method' => 'post', 'action' => ''],
            'params' => ['db' => ['submit_name' => 'do_submit']],
            'inputs' => [
                'text' => ['type' => 'textarea', 'name' => 'text', 'caption' => 'Text', 'html' => 3],
                'pictures' => ['type' => 'files', 'name' => 'pictures', 'caption' => 'Pictures', 'storage_object' => 'sys_images', 'uploaders' => ['sys_html5'], 'multiple' => true],
                'do_submit' => ['type' => 'submit', 'name' => 'do_submit', 'value' => 'Submit'],
            ],
        ];

        return new class($aForm) extends BxTemplFormView {
            public int $iEditors = 0;
            public int $iUploaders = 0;

            function addHtmlEditor($iViewMode, &$aInput, $sUniq)
            {
                $this->iEditors++;
                return parent::addHtmlEditor($iViewMode, $aInput, $sUniq);
            }

            protected function genGhostTemplate(&$aInput)
            {
                $this->iUploaders++;
                return parent::genGhostTemplate($aInput);
            }
        };
    }

    /**
     * Runs $fCall and returns the statements it sent that contain $sNeedle.
     */
    protected function queriesWith(string $sNeedle, callable $fCall): array
    {
        $oRecorder = new class {
            public array $aQueries = [];
            public function beginQuery($sSql) { $this->aQueries[] = $sSql; }
            public function __call($sName, $aArgs) { return null; }
        };

        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $fCall();
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        return array_values(array_filter($oRecorder->aQueries, fn($s) => stripos($s, $sNeedle) !== false));
    }

    protected function requireCsrfTokens(): void
    {
        if (getParam('sys_security_form_token_enable') != 'on')
            $this->markTestSkipped('Form tokens are off, so forms write no keys.');
    }

    public function testApiFormBuildsNoUploadersOrEditor(): void
    {
        $_GET['api'] = 1;
        $oForm = $this->spyForm();

        $aForm = $oForm->getCodeAPI();

        $this->assertSame(0, $oForm->iEditors, 'No HTML editor is attached.');
        $this->assertSame(0, $oForm->iUploaders, 'No uploader is built.');
        $this->assertArrayHasKey('text', $aForm['inputs']);
        $this->assertSame('files', $aForm['inputs']['pictures']['type'] ?? null);
        if (getParam('sys_security_form_token_enable') == 'on')
            $this->assertArrayHasKey('csrf_token', $aForm['inputs'], 'genForm still completes the inputs.');
    }

    public function testHtmlFormStillBuildsThemAfterApiCode(): void
    {
        if (BxDolEditor::getObjectInstance() === false)
            $this->markTestSkipped('No HTML editor is installed.');

        $oForm = $this->spyForm();
        $oForm->getCodeAPI();

        $sCode = $oForm->getCode();

        $this->assertSame(1, $oForm->iEditors, 'The page form gets its editor.');
        $this->assertSame(1, $oForm->iUploaders, 'The page form gets its uploader.');
        $this->assertStringContainsString('phpunit_form_api_render', $sCode);
    }

    public function testJoinFormInApiWritesOneKey(): void
    {
        $this->requireCsrfTokens();
        $this->bxBecomeGuest();
        $_GET['api'] = 1;

        $mixedResult = null;
        $aKeys = $this->queriesWith('INSERT INTO `sys_keys`', function () use (&$mixedResult) {
            $mixedResult = BxDolService::call('system', 'create_account_form', [], 'TemplServiceAccount', true);
        });

        if (($mixedResult[0]['type'] ?? null) !== 'form' || empty($mixedResult[0]['data']['inputs']))
            $this->markTestSkipped('Sign-up shows no form on this site.');

        $this->assertCount(1, $aKeys, 'The form is built once, for the API.');
        $this->assertArrayHasKey('csrf_token', $mixedResult[0]['data']['inputs']);
    }

    public function testForgotPasswordInApiWritesOneKey(): void
    {
        $this->requireCsrfTokens();
        $this->bxBecomeGuest();
        $_GET['api'] = 1;

        $mixedResult = null;
        $aKeys = $this->queriesWith('INSERT INTO `sys_keys`', function () use (&$mixedResult) {
            $mixedResult = (new BxTemplServiceAccount())->serviceForgotPassword();
        });

        $this->assertSame('form', $mixedResult[0]['type'] ?? null);
        $this->assertCount(1, $aKeys, 'The form is built once, for the API.');
    }

    public function testForgotPasswordPageStillShowsTheForm(): void
    {
        $this->bxBecomeGuest();
        unset($_GET['api']);

        $sCode = (new BxTemplServiceAccount())->serviceForgotPassword();

        $this->assertIsString($sCode);
        $this->assertStringContainsString('<form', $sCode);
    }

    public function testInvitationRequestInApiWritesOneKey(): void
    {
        $this->requireCsrfTokens();
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_invites'))
            $this->markTestSkipped('Invites are not installed.');

        $this->bxBecomeGuest();
        $_GET['api'] = 1;
        unset($GLOBALS['bxDolClasses']['BxInvModule']);
        $oModule = BxDolModule::getInstance('bx_invites');

        $mixedResult = null;
        $aKeys = $this->queriesWith('INSERT INTO `sys_keys`', function () use ($oModule, &$mixedResult) {
            $mixedResult = $oModule->_oTemplate->getBlockFormRequest();
        });

        $this->assertSame('form', $mixedResult[0]['type'] ?? null);
        $this->assertCount(1, $aKeys, 'The form is built once, for the API.');
    }

    public function testUploadLimitComesFromTheMembershipLevel(): void
    {
        $oStorage = BxDolStorage::getObjectInstance('sys_images');
        if (!$oStorage)
            $this->markTestSkipped('The sys_images storage is not installed.');

        $GLOBALS['bxDolClasses']['BxDolAcl'] = new class extends BxTemplAcl {
            function getMemberMembershipInfo($iProfileId, $iTime = 0, $bClearCache = 0)
            {
                return ['id' => 2, 'quota_max_file_size' => 1234];
            }
        };

        $iSize = 0;
        $aQuotaReads = $this->queriesWith('sys_storage_user_quotas', function () use ($oStorage, &$iSize) {
            $iSize = $oStorage->getMaxUploadFileSize(1);
        });

        $this->assertSame(1234, $iSize);
        $this->assertSame([], $aQuotaReads, 'The quota row has no max file size, so it is not read.');
    }
}
