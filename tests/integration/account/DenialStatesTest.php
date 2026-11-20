<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/BxDolAccountTestCase.php';

/**
 * A denied action says why and what to do (BxDolAcl::getDenialState): a guest is asked to log in or sign up, an
 * account without a profile to create one. The message box shows it as a state (icon, title, text, buttons), the
 * API sends it as `empty_state` beside the message. Context modules (groups, events...) need a profile to create
 * one, as Posts does, and Timeline's own feed of an account without a profile asks for one instead of denying the
 * whole page.
 *
 * The member is a throwaway account made without a profile and deleted afterwards.
 */
#[Group('integration')]
class DenialStatesTest extends BxDolAccountTestCase
{
    /** Context modules whose entries are profiles owned by their author. */
    const CONTEXT_MODULES = ['bx_groups', 'bx_events', 'bx_spaces', 'bx_courses', 'bx_jobs'];

    public function testGuestIsAskedToLogInOrSignUp(): void
    {
        $this->bxBecomeGuest();
        $sMsg = $this->bxDeniedMessage(0, 'bx_posts');

        $aState = BxDolAcl::getDenialState($sMsg);
        $this->assertSame(_t('_sys_acl_state_unauthenticated_title'), $aState['title']);
        $this->assertSame($sMsg, $aState['text']);
        $this->assertSame([_t('_sys_menu_item_title_login'), _t('_sys_menu_item_title_join')], array_column($aState['buttons'], 'title'));

        $sBox = MsgBox($sMsg);
        $this->assertStringContainsString('bx-msg-box-state', $sBox, 'The message box shows the state.');
        $this->assertStringContainsString('class="bx-btn bx-btn-primary" href="' . BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=login') . '"', $sBox, 'Log in is the primary action.');
        $this->assertStringContainsString(_t('_sys_menu_item_title_join'), $sBox);

        $aApi = bx_api_get_msg($sMsg);
        $this->assertSame('msg', $aApi['type']);
        $this->assertSame($sMsg, $aApi['data']);
        $this->assertSame(_t('_sys_acl_state_unauthenticated_title'), $aApi['empty_state']['title'], 'The apps get the same reason.');
        $this->assertSame(['primary', 'secondary'], array_column($aApi['empty_state']['buttons'], 'style'));
        $this->assertStringStartsWith('/', $aApi['empty_state']['buttons'][0]['link']);
    }

    public function testAccountWithoutProfileIsAskedToCreateOne(): void
    {
        $this->bxSignInMemberWithoutProfile();
        $iProfileId = bx_get_logged_profile_id();
        $this->assertSame('system', BxDolProfile::getInstance($iProfileId)->getModule(), 'An account without a profile acts as its system profile.');

        $sMsg = $this->bxDeniedMessage($iProfileId, 'bx_posts');
        $aState = BxDolAcl::getDenialState($sMsg);
        $this->assertSame(_t('_sys_acl_state_account_title'), $aState['title']);
        $this->assertSame([_t('_sys_txt_account_profile_system_action')], array_column($aState['buttons'], 'title'));
        $this->assertSame(BxDolPage::getProfileRequiredUrl(), $aState['buttons'][0]['link']);

        $aApi = bx_api_get_msg($sMsg);
        $this->assertSame([_t('_sys_txt_account_profile_system_action')], array_column($aApi['empty_state']['buttons'], 'title'));
    }

    public function testContextModulesNeedAProfileToCreate(): void
    {
        $this->bxSignInMemberWithoutProfile();
        $iProfileId = bx_get_logged_profile_id();

        $iChecked = 0;
        foreach (self::CONTEXT_MODULES as $sModule) {
            if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
                continue;

            $sMsg = $this->bxDeniedMessage($iProfileId, $sModule);
            $this->assertSame(_t('_sys_acl_state_account_title'), BxDolAcl::getDenialState($sMsg)['title'], "$sModule asks for a profile first.");
            $iChecked++;
        }
        if (!$iChecked)
            $this->markTestSkipped('No context module is installed.');

        foreach (['bx_persons', 'bx_organizations'] as $sModule) {
            if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
                continue;

            $aCheck = checkActionModule($iProfileId, 'create entry', $sModule);
            $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $aCheck[CHECK_ACTION_RESULT], "$sModule creates the profile itself, so it stays open.");
        }
    }

    public function testTimelineOwnFeedAsksForAProfile(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $this->bxSignInMemberWithoutProfile();

        $aPost = BxDolService::call('bx_timeline', 'get_block_post');
        $this->assertStringContainsString('bx-msg-box-state', $aPost['content'] ?? '', 'The post block asks for a profile.');
        $this->assertStringContainsString(_t('_sys_txt_account_profile_system_action'), $aPost['content']);

        $this->assertSame([], BxDolService::call('bx_timeline', 'get_block_view'), 'The feed block is left out, not an "Access denied" page.');
    }

    public function testOtherMessagesStayPlain(): void
    {
        $this->assertNull(BxDolAcl::getDenialState('Some message'));
        $this->assertStringNotContainsString('bx-msg-box-state', MsgBox('Some message'));
        $this->assertArrayNotHasKey('empty_state', bx_api_get_msg('Some message'));

        $sState = MsgBox(['icon' => 'lock', 'title' => 'Title <b>', 'text' => 'Text', 'buttons' => [['title' => 'Go', 'link' => 'page.php?i=home']]]);
        $this->assertStringContainsString('Title &lt;b&gt;', $sState, 'A state title is escaped.');
        $this->assertStringContainsString('bx-btn bx-btn-primary', $sState);
    }

    /** The message checkAction gives for "create entry" of the module, which must be denied. */
    protected function bxDeniedMessage(int $iProfileId, string $sModule): string
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            $this->markTestSkipped("$sModule is not installed.");

        $aCheck = checkActionModule($iProfileId, 'create entry', $sModule);
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $aCheck[CHECK_ACTION_RESULT], "$sModule: 'create entry' is denied.");

        return $aCheck[CHECK_ACTION_MESSAGE];
    }

    protected function bxSignInMemberWithoutProfile(): BxDolAccount
    {
        $sAutoProfile = getParam('sys_account_auto_profile_creation');
        $this->bxSetParamCache('sys_account_auto_profile_creation', '');

        $sEmail = 'denial-states-' . bin2hex(random_bytes(4)) . '@example.test';
        $this->_aCreatedEmails[] = $sEmail;
        try {
            $aResult = (new BxTemplAccountForms())->createAccount([
                'name' => 'Denial States',
                'email' => $sEmail,
                'password' => 'UnaTest1a',
            ], BX_PROFILE_ACTION_EXTERNAL, false);
        }
        finally {
            $this->bxSetParamCache('sys_account_auto_profile_creation', $sAutoProfile);
        }
        $this->assertArrayHasKey('account_id', $aResult, $aResult['error'] ?? '');

        $oAccount = BxDolAccount::getInstance((int)$aResult['account_id'], true);
        $this->assertSame([], $oAccount->getProfilesIds(false));

        $aInfo = bx_login($oAccount->id());
        $this->bxSyncSessionCookie();
        $this->bxSetLoggedFlags((int)$aInfo['role']);

        return $oAccount;
    }
}
