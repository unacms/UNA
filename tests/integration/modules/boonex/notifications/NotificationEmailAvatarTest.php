<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The notification email shows the actor's picture, or a letter avatar when the actor has none:
 * the no-picture image is an SVG that email clients refuse to show.
 */
#[Group('integration')]
class NotificationEmailAvatarTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach (['bx_notifications', 'bx_persons'] as $sModule)
            if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
                $this->markTestSkipped("$sModule is not installed.");
    }

    protected function personId(bool $bWithPicture): int
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT `p`.`id` FROM `sys_profiles` AS `p` INNER JOIN `bx_persons_data` AS `d` ON `d`.`id` = `p`.`content_id` WHERE `p`.`type` = 'bx_persons' AND `p`.`status` = 'active' AND `d`.`picture` " . ($bWithPicture ? '<>' : '=') . " 0 ORDER BY `p`.`id` LIMIT 1");
    }

    protected function email(int $iAuthor): string
    {
        $oProfile = BxDolProfile::getInstance($iAuthor);
        $aEvent = [
            'id' => 0,
            'type' => 'bx_test_no_etemplate',
            'action' => 'test',
            'author_id' => $iAuthor,
            'owner_id' => $iAuthor,
            'date' => time(),
            'content' => [
                'author_icon' => $oProfile->getThumb(),
                'owner_icon' => $oProfile->getThumb(),
                'entry_url' => 'page.php?i=home',
            ],
            'content_parsed' => 'Someone reacted to a post',
        ];

        $aEmail = BxDolModule::getInstance('bx_notifications')->_oTemplate->getNotificationEmail($iAuthor, $aEvent);
        return $aEmail['content'];
    }

    public function testActorWithoutPictureGetsALetterAvatar(): void
    {
        if (!($iProfile = $this->personId(false)))
            $this->markTestSkipped('No person without a picture.');

        $oProfile = BxDolProfile::getInstance($iProfile);
        $sBody = $this->email($iProfile);

        $this->assertStringNotContainsString('<img', $sBody);
        $this->assertStringNotContainsString('.svg', $sBody);
        $this->assertStringContainsString(BxTemplFunctions::getInstance()->getEmailLetterAvatar($oProfile), $sBody);

        $sLetter = mb_strtoupper(mb_substr(trim(html_entity_decode($oProfile->getDisplayName(), ENT_QUOTES | ENT_HTML5, 'UTF-8')), 0, 1));
        $this->assertStringContainsString('>' . htmlspecialchars($sLetter, ENT_QUOTES, 'UTF-8') . '</td>', $sBody);
    }

    public function testActorWithPictureKeepsTheImage(): void
    {
        if (!($iProfile = $this->personId(true)))
            $this->markTestSkipped('No person with a picture.');

        $sThumb = BxDolProfile::getInstance($iProfile)->getThumb();
        $sBody = $this->email($iProfile);

        $this->assertStringContainsString('<img style="width: 48px; height: 48px; line-height: 48px; border-radius: 80px;" src="' . $sThumb . '" />', $sBody);
        $this->assertStringNotContainsString('<td', $sBody);
    }
}
