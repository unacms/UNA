<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/BxDolAccountTestCase.php';

/**
 * Records the alerts that keep Mass Mailer, Mailchimp and Intercom in sync with the account's newsletter flag.
 */
class BxTestNewsletterAlertsResponse extends BxDolAlertsResponse
{
    public static $aAlerts = [];

    public function response($oAlert)
    {
        if ($oAlert->sUnit !== 'account' || !in_array($oAlert->sAction, ['change_receive_news', 'edited'], true))
            return;

        // What a handler like Mailchimp's reads from the account object at that moment.
        $iAccountId = $oAlert->sAction === 'edited' ? (int)$oAlert->iObject : (int)$oAlert->aExtras['account_id'];
        $oAccount = BxDolAccount::getInstance($iAccountId);

        self::$aAlerts[] = [
            'action' => $oAlert->sAction,
            'object' => (int)$oAlert->iObject,
            'extras' => $oAlert->aExtras,
            'receive_news_seen' => $oAccount ? (int)$oAccount->getInfo()['receive_news'] : null,
        ];
    }
}

/**
 * Newsletter consent (`sys_accounts.receive_news`) is opt-in. The join form doesn't ask, new accounts aren't
 * subscribed, and the profile creation step that follows joining asks with an unticked switch. Accounts are
 * created through the API join form, as NEO does, with generated @example.test emails, and deleted afterwards.
 * Options are set in the param cache only.
 */
#[Group('integration')]
class NewsletterConsentTest extends BxDolAccountTestCase
{
    protected $_aGetBackup;

    protected $_sAutoProfileBackup;

    protected $_sProfileModule = '';

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aGetBackup = $_GET;
        $this->_sAutoProfileBackup = getParam('sys_account_auto_profile_creation');

        $sModule = getParam('sys_account_default_profile_type');
        if (!$sModule || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule) || !bx_srv($sModule, 'act_as_profile'))
            $this->markTestSkipped('No default profile type which acts as profile.');
        $this->_sProfileModule = $sModule;

        $this->bxInstallNewsletterAlertsRecorder();
        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        $this->bxUnsetProfileAddForm();
        $this->bxSetParamCache('sys_account_auto_profile_creation', $this->_sAutoProfileBackup);
        $_GET = $this->_aGetBackup ?? [];

        parent::tearDown();
    }

    public function testJoinFormDoesNotAsk(): void
    {
        $oForm = $this->bxAccountForm('sys_account_create');

        $this->assertArrayNotHasKey('receive_news', $oForm->aInputs, 'The join form stays minimal: the question moved to profile creation.');
    }

    public function testJoinDoesNotSubscribe(): void
    {
        // A client which still sends the old switch doesn't subscribe anybody either.
        $aAccount = $this->bxJoinApi(false, ['receive_news' => '1']);

        $this->assertSame(0, $this->bxReceiveNews($aAccount['id']));
        $this->assertSame([], BxTestNewsletterAlertsResponse::$aAlerts);
    }

    public function testCreateAccountWithoutTheFieldDoesNotSubscribe(): void
    {
        // Paths that create accounts from values, like social sign-in and imports.
        $sEmail = $this->bxNewEmail();
        $aResult = (new BxTemplAccountForms())->createAccount([
            'name' => 'Newsletter Import',
            'email' => $sEmail,
            'password' => 'UnaTest1a',
        ], BX_PROFILE_ACTION_EXTERNAL, false);

        $this->assertArrayHasKey('account_id', $aResult, $aResult['error'] ?? '');
        $this->assertSame(0, $this->bxReceiveNews((int)$aResult['account_id']));
    }

    public function testFirstProfileAsksWithAnUntickedSwitch(): void
    {
        $this->bxJoinApi(false);

        $oForm = $this->bxProfileAddForm();
        $this->assertArrayHasKey('receive_news', $oForm->aInputs);

        $aInput = $oForm->aInputs['receive_news'];
        $this->assertSame('switcher', $aInput['type']);
        $this->assertFalse($aInput['checked']);
        $this->assertSame(_t('_sys_form_profile_input_receive_news', getParam('site_title')), $aInput['caption']);
        $this->assertArrayNotHasKey('db', $aInput, 'It is saved to the account, not to the profile table.');

        $aKeys = array_keys($oForm->aInputs);
        $sNext = $aKeys[array_search('receive_news', $aKeys) + 1] ?? '';
        $this->assertContains($oForm->aInputs[$sNext]['type'] ?? '', ['submit', 'input_set'], 'It sits right above the submit button.');

        $aApi = $this->bxProfileAddFormApi();
        $this->assertSame('switcher', $aApi['inputs']['receive_news']['type'] ?? null, 'NEO gets the switch too.');
        $this->assertFalse($aApi['inputs']['receive_news']['checked']);
    }

    public function testFirstProfileWithTheSwitchOnSubscribes(): void
    {
        $aAccount = $this->bxJoinApi(false);

        $this->bxSubmitProfileAddFormApi(['receive_news' => '1']);

        $this->assertSame(1, $this->bxReceiveNews($aAccount['id']));

        $aChange = $this->bxAlerts('change_receive_news');
        $this->assertCount(1, $aChange);
        $this->assertSame($aAccount['id'], (int)$aChange[0]['extras']['account_id']);
        $this->assertSame(0, (int)$aChange[0]['extras']['old_value']);
        $this->assertSame(1, (int)$aChange[0]['extras']['new_value']);
        $this->assertSame($aAccount['email'], $aChange[0]['extras']['email']);
        $this->assertSame(1, $aChange[0]['receive_news_seen']);

        $aEdited = array_values(array_filter($this->bxAlerts('edited'), function ($a) {
            return ($a['extras']['action'] ?? '') === 'change_receive_news';
        }));
        $this->assertCount(1, $aEdited, 'account/edited lets Mailchimp update the subscription.');
        $this->assertSame(1, $aEdited[0]['receive_news_seen'], 'Mailchimp reads the new value from the account object.');
    }

    public function testFirstProfileWithTheSwitchOffDoesNotSubscribe(): void
    {
        $aAccount = $this->bxJoinApi(false);

        // NEO sends 0 for a switch which is off.
        $this->bxSubmitProfileAddFormApi(['receive_news' => '0']);

        $this->assertSame(1, BxDolAccount::getInstance($aAccount['id'], true)->getProfilesNumber());
        $this->assertSame(0, $this->bxReceiveNews($aAccount['id']));
        $this->assertSame([], $this->bxAlerts('change_receive_news'));
    }

    public function testAnotherProfileDoesNotAsk(): void
    {
        $this->bxJoinApi(false);
        $this->bxSubmitProfileAddFormApi(['receive_news' => '0']);

        $this->assertArrayNotHasKey('receive_news', $this->bxProfileAddForm()->aInputs, 'Only the first profile asks.');
    }

    public function testSubscribedAccountIsNotAskedAgain(): void
    {
        $aAccount = $this->bxJoinApi(false);
        $this->assertTrue($aAccount['account']->updateReceiveNews(true));

        $this->assertArrayNotHasKey('receive_news', $this->bxProfileAddForm()->aInputs);
    }

    public function testSiteWhichAsksOnJoinDoesNotAskAgain(): void
    {
        $this->bxJoinApi(false);

        // As if an admin made the join form's switch active again in Studio > Forms.
        $oJoin = BxDolForm::getObjectInstance('sys_account', 'sys_account_create');
        $oJoin->aInputs['receive_news'] = ['type' => 'switcher', 'name' => 'receive_news', 'value' => 1, 'checked' => false];

        $this->assertArrayNotHasKey('receive_news', $this->bxProfileAddForm()->aInputs);
    }

    public function testAutoProfileCreationDoesNotSubscribeOrAsk(): void
    {
        $aAccount = $this->bxJoinApi(true);

        $oAccount = BxDolAccount::getInstance($aAccount['id'], true);
        $this->assertSame(1, $oAccount->getProfilesNumber(), 'The profile is created with the account.');
        $this->assertSame(0, $this->bxReceiveNews($aAccount['id']));
        $this->assertArrayNotHasKey('receive_news', $this->bxProfileAddForm()->aInputs);

        // Members choose in account settings then.
        $oSettings = $this->bxAccountForm('sys_account_settings_email');
        $this->assertArrayHasKey('receive_news', $oSettings->aInputs);
        $oSettings->initChecker($oAccount->getInfo());
        $this->assertFalse((bool)$oSettings->aInputs['receive_news']['checked']);
    }

    public function testUpdateReceiveNewsAlertsOnlyOnChange(): void
    {
        $aAccount = $this->bxJoinApi(true);
        $oAccount = $aAccount['account'];
        $this->assertSame(0, (int)$oAccount->getInfo()['receive_news'], 'The account info is cached before the change.');

        $this->assertTrue($oAccount->updateReceiveNews(false));
        $this->assertSame([], BxTestNewsletterAlertsResponse::$aAlerts, 'Nothing changed, nothing to sync.');

        $this->assertTrue($oAccount->updateReceiveNews(true));
        $this->assertSame(1, (int)$oAccount->getInfo()['receive_news'], 'The cached account info is refreshed.');

        $this->assertTrue($oAccount->updateReceiveNews(false));
        $this->assertSame(0, $this->bxReceiveNews($aAccount['id']));

        $aValues = array_map(function ($a) {
            return [(int)$a['extras']['old_value'], (int)$a['extras']['new_value']];
        }, $this->bxAlerts('change_receive_news'));
        $this->assertSame([[0, 1], [1, 0]], $aValues);

        $aSeen = array_column($this->bxAlerts('edited'), 'receive_news_seen');
        $this->assertSame([1, 0], $aSeen, 'Handlers of account/edited read the new value, not the cached old one.');
    }

    /**
     * Joins through the API join form, as NEO does, and logs in as the new account.
     */
    protected function bxJoinApi(bool $bAutoProfile, array $aExtra = []): array
    {
        $this->bxSetParamCache('sys_account_auto_profile_creation', $bAutoProfile ? 'on' : '');
        $_GET['api'] = 1;

        $sEmail = $this->bxNewEmail();
        BxDolForm::unSetObjectInstance('sys_account', 'sys_account_create');
        $_POST = array_merge([
            'name' => 'Newsletter Tester',
            'email' => $sEmail,
            'password' => 'UnaTest1a',
            'do_publish' => '1',
        ], $aExtra);

        $mixedResult = (new BxTemplAccountForms())->createAccountForm();
        $this->assertTrue($mixedResult === true, 'The join form should create the account: ' . json_encode($mixedResult));

        $oAccount = BxDolAccount::getInstance($sEmail, true);
        $this->assertInstanceOf(BxDolAccount::class, $oAccount);
        $this->_iCreatedAccountId = $oAccount->id();

        $this->bxSyncSessionCookie();
        $this->bxSetLoggedFlags((int)$oAccount->getInfo()['role']);
        $this->assertSame($oAccount->id(), (int)getLoggedId());

        $_POST = [];
        BxTestNewsletterAlertsResponse::$aAlerts = [];

        return [
            'id' => $oAccount->id(),
            'email' => $sEmail,
            'account' => $oAccount,
        ];
    }

    protected function bxNewEmail(): string
    {
        $sEmail = 'newsletter-' . bin2hex(random_bytes(4)) . '@example.test';
        $this->_aCreatedEmails[] = $sEmail;

        return $sEmail;
    }

    /**
     * The module again, since it keeps the profile which was logged in when it was created.
     */
    protected function bxProfileModule(): BxBaseModProfileModule
    {
        if (($oModule = BxDolModule::getInstance($this->_sProfileModule)))
            unset($GLOBALS['bxDolClasses'][get_class($oModule)]);

        $oModule = BxDolModule::getInstance($this->_sProfileModule);
        $this->assertInstanceOf(BxBaseModProfileModule::class, $oModule);

        return $oModule;
    }

    protected function bxUnsetProfileAddForm(): void
    {
        if (!$this->_sProfileModule || !($oModule = BxDolModule::getInstance($this->_sProfileModule)))
            return;

        $CNF = &$oModule->_oConfig->CNF;
        BxDolForm::unSetObjectInstance($CNF['OBJECT_FORM_ENTRY'], $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD']);
    }

    protected function bxProfileAddForm(): BxBaseModProfileFormEntry
    {
        $this->bxUnsetProfileAddForm();

        $oForm = $this->bxProfileModule()->getFormsHelper()->getObjectFormAdd();
        $this->assertInstanceOf(BxBaseModProfileFormEntry::class, $oForm);

        return $oForm;
    }

    /**
     * The profile creation form as the API sends it to NEO.
     */
    protected function bxProfileAddFormApi(): array
    {
        $this->bxUnsetProfileAddForm();
        $_GET['api'] = 1;
        $_POST = [];

        $aResult = $this->bxProfileModule()->getFormsHelper()->addDataForm();
        $aBlock = is_array($aResult) ? ($aResult[0] ?? $aResult) : [];
        $aForm = $aBlock['data'] ?? $aBlock;
        $this->assertArrayHasKey('inputs', $aForm, 'The API should return the profile creation form: ' . json_encode($aResult));

        return $aForm;
    }

    /**
     * Submits the profile creation form through the API, with the values the module prepares on its own.
     */
    protected function bxSubmitProfileAddFormApi(array $aExtra): void
    {
        $oAccount = BxDolAccount::getInstance(getLoggedId(), true);
        $aFields = bx_srv($this->_sProfileModule, 'prepare_fields', [[
            'author' => $oAccount->getInfo()['profile_id'],
            'name' => 'Newsletter Tester',
        ]]);

        $this->bxUnsetProfileAddForm();
        $_GET['api'] = 1;
        $_POST = array_merge($aFields, $aExtra, ['do_submit' => '1']);

        $aResult = $this->bxProfileModule()->getFormsHelper()->addDataForm();
        $_POST = [];

        $this->assertSame(1, BxDolAccount::getInstance($oAccount->id(), true)->getProfilesNumber(), 'The profile should be created: ' . json_encode($aResult));
    }

    protected function bxReceiveNews(int $iAccountId): int
    {
        return (int)BxDolAccountQuery::getInstance()->getInfoById($iAccountId)['receive_news'];
    }

    protected function bxAlerts(string $sAction): array
    {
        return array_values(array_filter(BxTestNewsletterAlertsResponse::$aAlerts, function ($a) use ($sAction) {
            return $a['action'] === $sAction;
        }));
    }

    protected function bxInstallNewsletterAlertsRecorder(): void
    {
        BxTestNewsletterAlertsResponse::$aAlerts = [];

        $oProp = new ReflectionProperty(BxDolAlerts::class, '_aCacheData');
        $aCache = $oProp->getValue();

        $sId = 'phpunit_newsletter';
        $aCache['handlers'][$sId] = [
            'name' => $sId,
            'class' => BxTestNewsletterAlertsResponse::class,
            'file' => 'tests/integration/account/NewsletterConsentTest.php',
            'service_call' => '',
            'active' => 1,
        ];
        foreach (['change_receive_news', 'edited'] as $sAction)
            $aCache['alerts']['account'][$sAction][] = $sId;

        $oProp->setValue(null, $aCache);
    }
}
