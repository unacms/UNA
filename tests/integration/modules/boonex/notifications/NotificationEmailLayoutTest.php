<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The notification email: the actor's picture next to the notification and its date, the text of the message or
 * post below them with its line breaks, and one button to open it. The notification is text, not a link.
 */
#[Group('integration')]
class NotificationEmailLayoutTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_notifications'))
            $this->markTestSkipped('Notifications is not installed.');
    }

    protected function email(array $aContent = []): string
    {
        $aEvent = [
            'id' => 0,
            'type' => 'bx_test_no_etemplate',
            'action' => 'test',
            'author_id' => 0,
            'owner_id' => 0,
            'date' => time(),
            'content' => array_merge(['entry_url' => 'page.php?i=home'], $aContent),
            'content_parsed' => '<b class="bx-ntfs-content-profile">Maya</b> sent you a message',
        ];

        $aEmail = BxDolModule::getInstance('bx_notifications')->_oTemplate->getNotificationEmail(0, $aEvent);
        return $aEmail['content'];
    }

    public function testNotificationIsTextAndTheButtonOpensIt(): void
    {
        $sBody = $this->email();

        $this->assertStringContainsString('<b class="bx-ntfs-content-profile">Maya</b> sent you a message', $sBody);
        $this->assertDoesNotMatchRegularExpression('#<a [^>]*>\s*<b class="bx-ntfs-content-profile">#', $sBody, 'The notification is not wrapped in a link.');

        $this->assertMatchesRegularExpression('#<a href="' . preg_quote(BX_DOL_URL_ROOT . 'page.php?i=home', '#') . '"[^>]*class="bx-email-btn"[^>]*>' . preg_quote(_t('_View'), '#') . '</a>#', $sBody);
    }

    public function testModuleNamesTheButton(): void
    {
        $sBody = $this->email(['settings' => ['email' => ['button' => 'Reply']]]);

        $this->assertMatchesRegularExpression('#class="bx-email-btn"[^>]*>Reply</a>#', $sBody);
    }

    public function testSummaryKeepsItsLineBreaks(): void
    {
        $sBody = $this->email(['subentry_summary' => "First line\nSecond &amp; last"]);

        $this->assertStringContainsString("First line<br />\nSecond &amp; last", $sBody);
    }

    public function testNoSummaryNoBlock(): void
    {
        $this->assertStringNotContainsString('margin: 20px 0 0 0', $this->email());
    }
}
