<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/../../../account/BxDolAccountTestCase.php';

/**
 * Messenger on a new site: an account without a profile gets "Create a profile first" (the site's denial state) in
 * place of an empty inbox, on the site and in the apps; without a Jot server URL the page says in the informer that
 * new messages show after a reload, and an operator gets a button to Messenger's settings in Studio.
 *
 * The account without a profile is a throwaway one, deleted afterwards.
 */
#[Group('integration')]
class MessengerFirstRunTest extends BxDolAccountTestCase
{
    protected $_sServerUrlBackup;

    protected $_mixedRequestUriBackup;

    protected function setUp(): void
    {
        parent::setUp();

        // the page reads the request's address, which the command line has none of
        $this->_mixedRequestUriBackup = $_SERVER['REQUEST_URI'] ?? null;
        $_SERVER['REQUEST_URI'] = '/page.php?i=messenger';

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger'))
            $this->markTestSkipped('Messenger is not installed.');

        $this->_sServerUrlBackup = $this->bxModule()->_oConfig->CNF['SERVER_URL'];
    }

    protected function tearDown(): void
    {
        if ($this->_sServerUrlBackup !== null)
            $this->bxModule()->_oConfig->CNF['SERVER_URL'] = $this->_sServerUrlBackup;

        BxDolInformer::getInstance()->remove('bx-messenger-no-server');

        if ($this->_mixedRequestUriBackup === null)
            unset($_SERVER['REQUEST_URI']);
        else
            $_SERVER['REQUEST_URI'] = $this->_mixedRequestUriBackup;

        parent::tearDown();
    }

    public function testAccountWithoutProfileIsAskedToCreateOne(): void
    {
        $this->bxSignInMemberWithoutProfile();

        $sPage = BxDolService::call('bx_messenger', 'get_main_messenger_page');
        $this->assertStringContainsString('bx-msg-box-state', $sPage, 'The page shows the state, not an empty inbox.');
        $this->assertStringContainsString(_t('_sys_txt_account_profile_system_action'), $sPage);
        $this->assertNull($this->bxInformerMessage(), 'No Jot notice above a page that has no messages.');

        $aBlock = BxDolService::call('bx_messenger', 'get_block_main', [], 'Services');
        $this->assertSame('msg', $aBlock[0]['type'], 'The apps get a message block.');
        $this->assertSame(_t('_sys_acl_state_account_title'), $aBlock[0]['empty_state']['title']);
        $this->assertSame([_t('_sys_txt_account_profile_system_action')], array_column($aBlock[0]['empty_state']['buttons'], 'title'));
    }

    public function testMemberWithProfileGetsMessenger(): void
    {
        $this->bxLoginAsUser();
        if (BxDolProfile::getInstance()->getModule() == 'system')
            $this->markTestSkipped('The test member has no profile.');

        $this->assertFalse($this->bxModule()->getNoProfileMessage());

        $aBlock = BxDolService::call('bx_messenger', 'get_block_main', [], 'Services');
        $this->assertSame('messenger_main_page', $aBlock[0]['type']);
    }

    public function testNoJotServerIsExplainedInTheInformer(): void
    {
        $this->bxLoginAsUser();
        if (BxDolProfile::getInstance()->getModule() == 'system')
            $this->markTestSkipped('The test member has no profile.');

        $this->bxModule()->_oConfig->CNF['SERVER_URL'] = '';
        BxDolService::call('bx_messenger', 'get_main_messenger_page');

        $aMsg = $this->bxInformerMessage();
        $this->assertNotNull($aMsg, 'The page says that messages do not arrive live.');
        $this->assertSame(_t('_bx_messenger_informer_no_server'), $aMsg['msg']);
        $this->assertSame('', $aMsg['action_url'], 'A member gets no link to Studio.');
    }

    public function testNoJotServerOffersOperatorTheSettings(): void
    {
        $this->bxLoginAsAdmin();
        if (BxDolProfile::getInstance()->getModule() == 'system')
            $this->markTestSkipped('The test operator has no profile.');

        $this->bxModule()->_oConfig->CNF['SERVER_URL'] = '';
        BxDolService::call('bx_messenger', 'get_main_messenger_page');

        $aMsg = $this->bxInformerMessage();
        $this->assertNotNull($aMsg);
        $this->assertSame(_t('_bx_messenger_informer_no_server_operator'), $aMsg['msg']);
        $this->assertSame(BX_DOL_URL_STUDIO . 'module.php?name=bx_messenger&page=settings', $aMsg['action_url']);
        $this->assertSame(_t('_bx_messenger_informer_no_server_action'), $aMsg['action_title']);
    }

    public function testJotServerUrlNeedsNoNotice(): void
    {
        $this->bxLoginAsUser();
        if (BxDolProfile::getInstance()->getModule() == 'system')
            $this->markTestSkipped('The test member has no profile.');

        $this->bxModule()->_oConfig->CNF['SERVER_URL'] = 'http://localhost:5555';
        BxDolService::call('bx_messenger', 'get_main_messenger_page');

        $this->assertNull($this->bxInformerMessage());
    }

    protected function bxModule(): BxMessengerModule
    {
        return BxDolModule::getInstance('bx_messenger');
    }

    protected function bxInformerMessage(): ?array
    {
        $aMessages = (fn() => $this->_aMessages)->call(BxDolInformer::getInstance());
        return $aMessages['bx-messenger-no-server'] ?? null;
    }

    protected function bxSignInMemberWithoutProfile(): BxDolAccount
    {
        $sAutoProfile = getParam('sys_account_auto_profile_creation');
        $this->bxSetParamCache('sys_account_auto_profile_creation', '');

        $sEmail = 'messenger-first-run-' . bin2hex(random_bytes(4)) . '@example.test';
        $this->_aCreatedEmails[] = $sEmail;
        try {
            $aResult = (new BxTemplAccountForms())->createAccount([
                'name' => 'Messenger First Run',
                'email' => $sEmail,
                'password' => 'UnaTest1a',
            ], BX_PROFILE_ACTION_EXTERNAL, false);
        }
        finally {
            $this->bxSetParamCache('sys_account_auto_profile_creation', $sAutoProfile);
        }
        $this->assertArrayHasKey('account_id', $aResult, $aResult['error'] ?? '');

        $oAccount = BxDolAccount::getInstance((int)$aResult['account_id'], true);
        $aInfo = bx_login($oAccount->id());
        $this->bxSyncSessionCookie();
        $this->bxSetLoggedFlags((int)$aInfo['role']);

        return $oAccount;
    }
}
