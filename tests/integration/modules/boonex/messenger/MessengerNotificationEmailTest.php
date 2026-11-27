<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The notification email of a message says who wrote and where, carries the message itself (not the 50 characters
 * of the site's line) as the summary, and labels its button Reply. Push keeps its short text.
 */
#[Group('integration')]
class MessengerNotificationEmailTest extends BxDolIntegrationTestCase
{
    protected array $aLotIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger'))
            $this->markTestSkipped('Messenger is not installed.');
    }

    protected function tearDown(): void
    {
        try {
            // PHPUnit runs tearDown after setUp skipped too, when Messenger may not be installed.
            if ($this->aLotIds) {
                $oModule = $this->bxModule();
                foreach ($this->aLotIds as $iLotId)
                    $oModule->_oDb->deleteLot($iLotId);
            }
        }
        finally {
            parent::tearDown();
        }
    }

    protected function bxModule(): BxMessengerModule
    {
        return BxDolModule::getInstance('bx_messenger');
    }

    protected function profileId(): int
    {
        $this->bxLoginAsUser();
        $iProfileId = (int)bx_get_logged_profile_id();
        if (!$iProfileId)
            $this->markTestSkipped('The test member has no profile.');

        return $iProfileId;
    }

    protected function content(string $sTitle, string $sMessage, string $sAction = 'got_jot_ntfs'): array
    {
        $iProfileId = $this->profileId();
        $oModule = $this->bxModule();

        $iLotId = (int)$oModule->_oDb->createNewLot($iProfileId, ['title' => $sTitle, 'type' => BX_IM_TYPE_PRIVATE], [$iProfileId]);
        $this->assertGreaterThan(0, $iLotId);
        $this->aLotIds[] = $iLotId;

        $iJotId = (int)$oModule->_oDb->addJot($iLotId, $sMessage, $iProfileId);
        $this->assertGreaterThan(0, $iJotId);

        return $oModule->serviceGetMessageContent([
            'action' => $sAction,
            'subobject_id' => $iJotId,
            'owner_id' => $iProfileId,
            'object_owner_id' => $iProfileId,
        ]);
    }

    public function testPrivateMessageEmailCarriesTheWholeMessage(): void
    {
        $sMessage = str_repeat('Long message text. ', 30) . "\nSecond line";
        $aContent = $this->content('', $sMessage);

        $this->assertSame('_bx_messenger_txt_email_message', $aContent['lang_key']['email']);
        $this->assertStringContainsString('{owner_name}', _t($aContent['lang_key']['email']));

        $this->assertSame(trim($sMessage), $aContent['subentry_summary'], 'The summary is the message, with its line break.');
        $this->assertSame(_t('_bx_messenger_jot_menu_reply'), $aContent['settings']['email']['button']);

        $this->assertLessThan(mb_strlen($sMessage), mb_strlen($aContent['lang_key']['push']), 'Push keeps the short text.');
    }

    public function testMessageInANamedTalkSaysWhere(): void
    {
        $aContent = $this->content('Game jam team', 'Hello');

        $this->assertSame('_bx_messenger_txt_email_message_in', $aContent['lang_key']['email']);
        $this->assertStringContainsString('{entry_caption}', _t($aContent['lang_key']['email']));
        $this->assertSame('Game jam team', $aContent['entry_caption']);
    }

    public function testMentionEmail(): void
    {
        $aContent = $this->content('Game jam team', 'Hello', 'got_mention_ntfs');

        $this->assertSame('_bx_messenger_txt_email_mention', $aContent['lang_key']['email']);
    }

    public function testLineBreakTagsBecomeLineBreaksAndTagsGo(): void
    {
        $aContent = $this->content('', 'First<br />second <b>bold</b>');

        $this->assertSame("First\nsecond bold", $aContent['subentry_summary']);
    }

    public function testALineBreakTagAndItsNewLineAreOneBreak(): void
    {
        $aContent = $this->content('', "First<br />\n<br />\nSecond<br />\n<br />\n<br />\n<br />\nThird");

        $this->assertSame("First\n\nSecond\n\nThird", $aContent['subentry_summary']);
    }
}
