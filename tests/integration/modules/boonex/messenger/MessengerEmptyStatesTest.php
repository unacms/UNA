<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Messenger's empty lists are the site's empty state (MsgBox with icon, title, text and an action): the inbox, a list
 * of one kind, the conversation pane and the people finder. "New message" opens the new talk form in place and
 * keeps Messenger's page as its link.
 */
#[Group('integration')]
class MessengerEmptyStatesTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger'))
            $this->markTestSkipped('Messenger is not installed.');
    }

    protected function bxTemplate()
    {
        return BxDolModule::getInstance('bx_messenger')->_oTemplate;
    }

    public function testInboxOffersANewMessage(): void
    {
        $this->bxLoginAsAdmin();
        $iProfileId = bx_get_logged_profile_id();
        if (BxDolModule::getInstance('bx_messenger')->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_TALKS, $iProfileId) !== true)
            $this->markTestSkipped('The test operator may not create talks.');

        $sHtml = $this->bxTemplate()->getEmptyState('inbox', $iProfileId);
        $this->assertStringContainsString('bx-msg-box-state', $sHtml);
        $this->assertStringContainsString(bx_process_output(_t('_bx_messenger_empty_inbox_title')), $sHtml);
        $this->assertStringContainsString(_t('_bx_messenger_empty_action_new'), $sHtml);
        $this->assertStringContainsString('onclick="' . bx_html_attribute("if (typeof oMessenger !== 'undefined') { oMessenger.createList(); return false; }") . '"', $sHtml, 'The button opens the form in place.');
        $this->assertStringContainsString('href="' . BX_DOL_URL_ROOT, $sHtml, 'It keeps a link.');
    }

    public function testListOfOneKindHasNoAction(): void
    {
        $this->bxLoginAsAdmin();

        $sHtml = $this->bxTemplate()->getEmptyState('list');
        $this->assertStringContainsString(bx_process_output(_t('_bx_messenger_empty_list_text')), $sHtml);
        $this->assertStringNotContainsString('bx-btn', $sHtml);

        $this->assertStringNotContainsString('bx-btn', $this->bxTemplate()->getEmptyState('people'));
    }

    public function testStateButtonsWithoutOnclickStayPlainLinks(): void
    {
        $sHtml = MsgBox(['icon' => 'star', 'title' => 'T', 'text' => 'X', 'buttons' => [['title' => 'Go', 'link' => 'page.php?i=home']]]);
        $this->assertMatchesRegularExpression('#<a class="bx-btn bx-btn-primary" href="[^"]+">Go</a>#', $sHtml);
    }
}
