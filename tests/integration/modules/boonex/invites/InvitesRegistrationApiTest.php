<?php

use PHPUnit\Framework\Attributes\Group;

if (!function_exists('MsgBox'))
    require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';

/**
 * The join form in the app when Invites allows registration by invitation only. The API used to send an empty
 * message block, so NEO's sign-up page was a blank card. It now says why and shows the request form under the
 * message, and still shows the join form to people who follow an invitation link.
 *
 * The options are set in the param cache and the module is created again for every test, so nothing is saved
 * on the site.
 */
#[Group('integration')]
class InvitesRegistrationApiTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aParamsBackup = [];
    protected $_iInviteId = 0;
    protected $_sKey = '';

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_invites'))
            $this->markTestSkipped('Invites are not installed.');

        foreach (['bx_invites_enable_reg_by_inv', 'bx_invites_enable_request_invite'] as $sName)
            $this->_aParamsBackup[$sName] = getParam($sName);

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        if ($this->_sKey !== '') {
            BxDolDb::getInstance()->query("DELETE FROM `bx_inv_invites` WHERE `id` = :id", ['id' => $this->_iInviteId]);
            BxDolKey::getInstance()->removeKey($this->_sKey);
        }

        if (isset($GLOBALS['bxDolClasses']['BxInvModule']))
            $GLOBALS['bxDolClasses']['BxInvModule']->_oConfig->unsetKey();
        unset($GLOBALS['bxDolClasses']['BxInvModule']);

        foreach ($this->_aParamsBackup as $sName => $mixedValue)
            $this->bxSetParamCache($sName, $mixedValue);

        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    /**
     * Sets the options and creates the module again, so its config and API mode follow them.
     */
    protected function bxInvites(bool $bByInvitation, bool $bRequest, bool $bApi = true): BxInvModule
    {
        $this->bxSetParamCache('bx_invites_enable_reg_by_inv', $bByInvitation ? 'on' : '');
        $this->bxSetParamCache('bx_invites_enable_request_invite', $bRequest ? 'on' : '');

        if ($bApi)
            $_GET['api'] = 1;
        else
            unset($_GET['api']);

        unset($GLOBALS['bxDolClasses']['BxInvModule']);
        $oModule = BxDolModule::getInstance('bx_invites');
        $this->assertInstanceOf(BxInvModule::class, $oModule);

        return $oModule;
    }

    /**
     * @return array the items of the sign-up block
     */
    protected function bxCreateAccountFormApi(): array
    {
        // BxDolService keeps results in memory for the request; every test needs a fresh one.
        $aResult = BxDolService::call('system', 'create_account_form', [], 'TemplServiceAccount', true);
        $this->assertIsArray($aResult);
        $this->assertNotEmpty($aResult);

        return $aResult;
    }

    protected function bxAssertRequestForm(array $aItem): void
    {
        $this->assertSame('form', $aItem['type']);
        $this->assertSame('bx_invites_request_send', $aItem['data']['params']['display'] ?? null, 'NEO tells the request form from the join form by its display.');
        $this->assertSame('/api.php?r=bx_invites/get_block_form_request', $aItem['request']['url'] ?? null, 'It is sent to the Invites request flow.');
    }

    public function testInvitationOnlyShowsTheMessageAndTheRequestForm(): void
    {
        $this->bxInvites(true, true);

        $aItems = $this->bxCreateAccountFormApi();

        $this->assertCount(2, $aItems);
        $this->assertSame('msg', $aItems[0]['type']);
        $this->assertSame(_t('_bx_invites_txt_request_block_text'), $aItems[0]['data']);
        $this->bxAssertRequestForm($aItems[1]);
    }

    public function testInvitationOnlyWithoutRequestsShowsTheMessageOnly(): void
    {
        $this->bxInvites(true, false);

        $aItems = $this->bxCreateAccountFormApi();

        $this->assertCount(1, $aItems);
        $this->assertSame('msg', $aItems[0]['type']);
        $this->assertSame(_t('_bx_invites_txt_request_block_text'), $aItems[0]['data']);
    }

    public function testUsedInvitationLinkIsExplained(): void
    {
        $this->bxInvites(true, true);
        $_GET['icode'] = 'phpunit-' . bin2hex(random_bytes(8));

        $aItems = $this->bxCreateAccountFormApi();

        $this->assertCount(2, $aItems);
        $this->assertSame(_t('_bx_invites_err_used') . ' ' . _t('_bx_invites_txt_request_block_text'), $aItems[0]['data']);
        $this->bxAssertRequestForm($aItems[1]);
    }

    public function testUsedInvitationLinkWithOpenRegistrationKeepsTheSiteMessage(): void
    {
        // Same as the site: a dead invitation link replaces the form with the message.
        $this->bxInvites(false, true);
        $_GET['icode'] = 'phpunit-' . bin2hex(random_bytes(8));

        $aItems = $this->bxCreateAccountFormApi();

        $this->assertCount(1, $aItems);
        $this->assertSame('msg', $aItems[0]['type']);
        $this->assertSame(_t('_bx_invites_err_used'), $aItems[0]['data']);
    }

    public function testSocialSignInGetsPlainText(): void
    {
        // BxBaseModConnectModule::_createProfileRaw sends a string from this service as an API message, and NEO's
        // Google sign-in shows it as the error. A list of blocks there would read as a successful sign-in.
        $oModule = $this->bxInvites(true, true);

        $mixedResult = $oModule->serviceAccountAddFormCheck();

        $this->assertSame(_t('_bx_invites_txt_request_block_text'), $mixedResult);
    }

    public function testInvitationLinkShowsTheFormWithTheInvitedEmail(): void
    {
        $oModule = $this->bxInvites(true, true);

        $sEmail = 'invited-' . bin2hex(random_bytes(4)) . '@example.com';
        $this->_sKey = BxDolKey::getInstance()->getNewKey(false, 3600);
        $this->_iInviteId = (int)$oModule->_oDb->insertInvite([
            'account_id' => 0,
            'profile_id' => 0,
            'key' => $this->_sKey,
            'email' => $sEmail,
            'email_use' => 1,
            'date' => time(),
        ]);
        $this->assertGreaterThan(0, $this->_iInviteId);
        $_GET[$oModule->_oConfig->getKeyCode()] = $this->_sKey;

        $aItems = $this->bxCreateAccountFormApi();

        $this->assertCount(1, $aItems);
        $this->assertSame('form', $aItems[0]['type']);
        $this->assertSame('sys_account_create', $aItems[0]['data']['params']['display'] ?? null);
        $aEmail = $aItems[0]['data']['inputs']['email'];
        $this->assertSame($sEmail, $aEmail['value']);
        $this->assertSame('readonly', $aEmail['attrs']['readonly'] ?? null, 'The invitation is for this email only.');
    }

    protected function bxInsertInvite(BxInvModule $oModule, array $aFields = []): void
    {
        $this->_sKey = BxDolKey::getInstance()->getNewKey(false, 3600);
        $this->_iInviteId = (int)$oModule->_oDb->insertInvite(array_merge([
            'account_id' => 0,
            'profile_id' => 0,
            'key' => $this->_sKey,
            'email' => 'invited-' . bin2hex(random_bytes(4)) . '@example.com',
            'email_use' => 0,
            'date' => time(),
        ], $aFields));
        $this->assertGreaterThan(0, $this->_iInviteId);
    }

    /**
     * Runs the Invites handler of 'account add_form_check', which the join form fires on every request, a submit too.
     */
    protected function bxFireAddFormCheck(): void
    {
        $oForm = (new BxTemplAccountForms())->getObjectFormAdd();
        $this->assertNotEmpty($oForm);

        // Alert handlers are loaded by the alerts, not by the class loader.
        if (!class_exists('BxInvResponse', false))
            require_once BX_DIRECTORY_PATH_MODULES . 'boonex/invites/classes/BxInvResponse.php';

        (new BxInvResponse())->response(new BxDolAlerts('account', 'add_form_check', 0, 0, [
            'form_object' => &$oForm,
        ]));
    }

    public function testInvitationLinkFormCarriesTheKey(): void
    {
        // NEO renders the join page on the server, where the session cookie with the key never reaches the browser,
        // and sends the form to the API without the page's URL params. The form carries the key instead.
        $oModule = $this->bxInvites(false, true);
        $this->bxInsertInvite($oModule);
        $sKeyCode = $oModule->_oConfig->getKeyCode();
        $_GET[$sKeyCode] = $this->_sKey;

        $aItems = $this->bxCreateAccountFormApi();

        $this->assertSame('form', $aItems[0]['type']);
        $aKey = $aItems[0]['data']['inputs'][$sKeyCode] ?? null;
        $this->assertIsArray($aKey, 'The join form has the key as a hidden input.');
        $this->assertSame('hidden', $aKey['type']);
        $this->assertSame($this->_sKey, $aKey['value']);
    }

    public function testSubmittedKeyIsKeptForTheNewAccount(): void
    {
        // The submit comes in a request of its own, with an empty session: 'account added' finds the key there.
        $oModule = $this->bxInvites(false, true);
        $this->bxInsertInvite($oModule, ['aj_action' => 'invite_to_context', 'aj_params' => '1']);
        $oModule->_oConfig->unsetKey();
        $_GET[$oModule->_oConfig->getKeyCode()] = $this->_sKey;

        $this->bxFireAddFormCheck();

        $this->assertSame($this->_sKey, $oModule->_oConfig->getKey());
    }

    public function testSubmittedUnknownKeyIsNotKept(): void
    {
        $oModule = $this->bxInvites(false, true);
        $oModule->_oConfig->unsetKey();
        $_GET[$oModule->_oConfig->getKeyCode()] = 'phpunit-' . bin2hex(random_bytes(8));

        $this->bxFireAddFormCheck();

        $this->assertFalse($oModule->_oConfig->getKey());
    }

    public function testOpenRegistrationShowsTheForm(): void
    {
        $this->bxInvites(false, true);

        $aItems = $this->bxCreateAccountFormApi();

        $this->assertCount(1, $aItems);
        $this->assertSame('form', $aItems[0]['type']);
        $this->assertSame('sys_account_create', $aItems[0]['data']['params']['display'] ?? null);
    }

    public function testRequestFormFollowsApiModeAfterTheModuleWasBuilt(): void
    {
        // The module is created once per process. An earlier site call builds it, then the home page
        // asks for this block in the API. It used to print the form and exit, which ended the test run.
        $this->bxSetParamCache('bx_invites_enable_request_invite', 'on');
        unset($_GET['api']);
        unset($GLOBALS['bxDolClasses']['BxInvModule']);
        $oModule = BxDolModule::getInstance('bx_invites');
        $this->assertInstanceOf(BxInvModule::class, $oModule);

        $sHtml = $oModule->_oTemplate->getBlockFormRequest();
        $this->assertIsString($sHtml, 'Built for the site, before the API call.');

        $_GET['api'] = 1;
        $mixedResult = $oModule->serviceGetBlockFormRequest();

        $this->assertIsArray($mixedResult);
        $this->bxAssertRequestForm($mixedResult[0]);
    }

    public function testSiteStillShowsTheRequestBlock(): void
    {
        $this->bxInvites(true, true, false);

        $sCode = (new BxTemplAccountForms())->createAccountForm();

        $this->assertIsString($sCode);
        $this->assertStringContainsString(_t('_bx_invites_txt_request_block_text'), $sCode);
        $this->assertStringContainsString('invites-request', $sCode, 'The Request Invitation button opens the request form.');
        $this->assertStringNotContainsString('name="email"', $sCode, 'The join form is replaced.');
    }
}
