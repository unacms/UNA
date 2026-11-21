<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/../BxDolIntegrationTestCase.php';

/**
 * Shared feedback patterns: a success is a toast, an empty list is the standard empty state, a guest on a
 * members-only page gets the "Sign in to continue" card, and a grid cell without data is empty.
 */
#[Group('integration')]
class FeedbackPatternsTest extends BxDolIntegrationTestCase
{
    public function testNothingHereYetIsAnEmptyStateNotAPlate(): void
    {
        foreach (['_Empty', '_sys_txt_empty'] as $sKey) {
            $sBox = MsgBox(_t($sKey));
            $this->assertStringContainsString('bx-msg-box-state', $sBox, "$sKey is shown as a state.");
            $this->assertStringContainsString(_t('_Empty'), $sBox, 'Every empty list says the same line.');
            $this->assertStringContainsString('lucide-inbox', $sBox, 'The state has its icon.');
            $this->assertStringNotContainsString('bg-gray-200', $sBox, 'No grey plate that looks like a button.');
        }

        $sNotice = MsgBox(_t('_sys_txt_access_denied_text'));
        $this->assertStringNotContainsString('lucide-inbox', $sNotice, 'Other notices are not empty states.');
    }

    public function testEmptyStateActionWithoutAddressIsAButton(): void
    {
        $sBox = BxTemplFunctions::getInstance()->emptyState('No badges yet', ['title' => 'Add badge', 'onclick' => "alert('x')"]);

        $this->assertStringContainsString('No badges yet', $sBox);
        $this->assertMatchesRegularExpression('/<button type="button" class="bx-btn bx-btn-primary" onclick="[^"]+">Add badge<\/button>/', $sBox);
        $this->assertStringNotContainsString('href="' . BX_DOL_URL_ROOT . '"', $sBox, 'No link to the site root as a stand-in.');

        $sLink = BxTemplFunctions::getInstance()->emptyState('', ['title' => 'Write a post', 'link' => 'page.php?i=create-post']);
        $this->assertStringContainsString('<a class="bx-btn bx-btn-primary" href="' . BX_DOL_URL_ROOT, $sLink);
    }

    public function testGuestDenialStateAsksToSignInOrSignUp(): void
    {
        $aState = BxDolAcl::getDenialStateByLevel(MEMBERSHIP_ID_NON_MEMBER, 'text');

        $this->assertSame(_t('_sys_acl_state_unauthenticated_title'), $aState['title']);
        $this->assertSame('text', $aState['text']);
        $this->assertSame(['page.php?i=login', 'page.php?i=create-account'], array_column($aState['buttons'], 'link'));
    }

    public function testGuestOnMembersOnlyPageGetsTheSignInCard(): void
    {
        $this->bxBecomeGuest();

        $oPage = BxDolPage::getObjectInstanceByURI('dashboard');
        if (!$oPage)
            $this->markTestSkipped('The dashboard page is not installed.');

        $oMethod = new ReflectionMethod($oPage, '_getPageAccessDeniedMsg');
        $sCode = $oMethod->invoke($oPage, _t('_Access denied'));

        $this->assertStringContainsString('bx-msg-box-state', $sCode);
        $this->assertStringContainsString(_t('_sys_txt_access_denied_guest_page'), $sCode);
        $this->assertStringContainsString(BxDolPermalinks::getInstance()->permalink('page.php?i=login'), $sCode, 'Sign in is offered.');
        $this->assertStringContainsString('bx-db-container', $sCode, 'The state is shown in a block, as on /create-post.');
    }

    public function testStudioReplyCarriesATranslatedToast(): void
    {
        require_once BX_DOL_DIR_STUDIO_INC . 'utils.inc.php';

        $s = bx_get_js_result(['code' => 0, 'toast' => '_adm_stg_scs_save', 'redirect' => false]);
        $this->assertStringContainsString('"toast":' . json_encode(_t('_adm_stg_scs_save')), $s);
        $this->assertStringNotContainsString('"message"', $s, 'A success opens no dialog.');
    }

    public function testCellWithoutDataIsEmpty(): void
    {
        // the cell reads only its arguments: no grid object or permission is needed
        $oGrid = (new ReflectionClass('BxTemplGrid'))->newInstanceWithoutConstructor();

        $oMethod = new ReflectionMethod($oGrid, '_getCellData');
        $this->assertSame('', $oMethod->invoke($oGrid, 'no_such_field', [], []));
    }

    public function testSuccessMessagesDoNotSaySuccessfully(): void
    {
        foreach (['_adm_stg_scs_save', '_adm_dsg_scs_save', '_adm_dbd_msg_c_clean_success', '_sys_account_settings_email_successfully_submitted'] as $sKey)
            $this->assertStringNotContainsStringIgnoringCase('successfully', _t($sKey), $sKey);
    }
}
