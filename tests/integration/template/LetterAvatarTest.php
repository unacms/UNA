<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Where there is no picture, the site shows the name's first letter on the name's colour (the units' letter avatar).
 * The picture URLs of accounts, profiles and deleted profiles give the same letter as an image (BxDolTemplate::getLetterAvatarUrl),
 * not the old account.svg / no-picture placeholders, and Studio's account popup shows the same avatar as the site's header.
 */
#[Group('integration')]
class LetterAvatarTest extends BxDolIntegrationTestCase
{
    private static function svg(string $sUrl): string
    {
        self::assertTrue(BxDolTemplate::isLetterAvatarUrl($sUrl), $sUrl);
        return base64_decode(substr($sUrl, strlen('data:image/svg+xml;base64,')));
    }

    public function testLetterAndColour(): void
    {
        $sSvg = self::svg(BxDolTemplate::getLetterAvatarUrl('anna', 7));

        $this->assertStringContainsString('>A</text>', $sSvg);
        $this->assertStringContainsString('fill="rgb(' . implode(', ', array_slice(BxDolTemplate::getColorCode(7), 0, 3)) . ')"', $sSvg);
        $this->assertNotFalse(simplexml_load_string($sSvg), 'The image is well-formed SVG.');
    }

    public function testAppsGetTheSameColour(): void
    {
        $aRgb = array_slice(BxDolTemplate::getColorCode(7), 0, 3);
        $this->assertSame(vsprintf('#%02x%02x%02x', $aRgb), BxDolTemplate::getColorHex(7));
        $this->assertMatchesRegularExpression('/^#[0-9a-f]{6}$/', BxDolTemplate::getColorHex(0));

        $iProfileId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_profiles` ORDER BY `id` LIMIT 1");
        if (!$iProfileId)
            $this->markTestSkipped('No profiles.');
        $this->assertSame(BxDolTemplate::getColorHex($iProfileId), BxDolProfile::getData($iProfileId)['color'], 'Profile data in the API carries the colour the site draws the letter on.');
    }

    public function testNameIsEscapedAndNeverEmpty(): void
    {
        $this->assertStringContainsString('>&lt;</text>', self::svg(BxDolTemplate::getLetterAvatarUrl('<b>', 1)));
        $this->assertStringContainsString('>&amp;</text>', self::svg(BxDolTemplate::getLetterAvatarUrl('&amp;co', 1)));
        $this->assertStringContainsString('>É</text>', self::svg(BxDolTemplate::getLetterAvatarUrl('éva', 1)));
        $this->assertStringContainsString('>?</text>', self::svg(BxDolTemplate::getLetterAvatarUrl('  ', 1)));
    }

    public function testOtherUrlsAreNotLetterAvatars(): void
    {
        $this->assertFalse(BxDolTemplate::isLetterAvatarUrl('https://example.com/a.svg'));
        $this->assertFalse(BxDolTemplate::isLetterAvatarUrl(false));
    }

    public function testAccountWithoutPicture(): void
    {
        $iAccountId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_accounts` WHERE `picture` = 0 ORDER BY `id` LIMIT 1");
        if (!$iAccountId)
            $this->markTestSkipped('Every account has a picture.');

        $oAccount = BxDolAccount::getInstance($iAccountId);
        $sLetter = mb_strtoupper(mb_substr($oAccount->getDisplayName(), 0, 1));
        foreach (['getPicture', 'getAvatarBig', 'getAvatar', 'getThumb', 'getIcon'] as $sMethod) {
            $sUrl = $oAccount->$sMethod();
            $this->assertStringNotContainsString('account.svg', $sUrl, $sMethod);
            $this->assertStringContainsString('>' . htmlspecialchars($sLetter, ENT_QUOTES | ENT_XML1) . '</text>', self::svg($sUrl), $sMethod);
        }
    }

    public function testDeletedProfile(): void
    {
        $oProfile = BxDolProfileUndefined::getInstance();
        foreach (['getPicture', 'getAvatarBig', 'getAvatar', 'getThumb', 'getIcon'] as $sMethod)
            $this->assertStringNotContainsString('account.svg', self::svg($oProfile->$sMethod()), $sMethod);
    }

    public function testPersonWithoutPicture(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        // a person of its own, without a picture, removed afterwards
        $oDb = BxDolDb::getInstance();
        $iAccountId = (int)$oDb->getOne("SELECT `id` FROM `sys_accounts` ORDER BY `id` LIMIT 1");
        $oDb->query("INSERT INTO `bx_persons_data` SET `author` = 0, `added` = UNIX_TIMESTAMP(), `changed` = UNIX_TIMESTAMP(), `picture` = 0, `cover` = 0, `cover_data` = '', `fullname` = 'Quentin LetterAvatarTest', `last_name` = '', `description` = '', `labels` = '', `location` = ''");
        $iContentId = (int)$oDb->lastId();
        $oDb->query("INSERT INTO `sys_profiles` SET `account_id` = :account, `type` = 'bx_persons', `content_id` = :content, `status` = 'active'", ['account' => $iAccountId, 'content' => $iContentId]);
        $iProfileId = (int)$oDb->lastId();

        try {
            $oProfile = BxDolProfile::getInstanceByContentAndType($iContentId, 'bx_persons');
            $this->assertSame($iProfileId, (int)$oProfile->id());

            foreach (['getThumb', 'getIcon', 'getAvatar'] as $sMethod) {
                $sSvg = self::svg($oProfile->$sMethod());
                $this->assertStringContainsString('>Q</text>', $sSvg, $sMethod);
                $this->assertStringContainsString('fill="rgb(' . implode(', ', array_slice(BxDolTemplate::getColorCode($iProfileId), 0, 3)) . ')"', $sSvg, 'The colour of the person\'s unit.');
            }
        } finally {
            $oDb->query("DELETE FROM `sys_profiles` WHERE `id` = :id", ['id' => $iProfileId]);
            $oDb->query("DELETE FROM `bx_persons_data` WHERE `id` = :id", ['id' => $iContentId]);
        }
    }

    public function testStudioAccountPopupShowsTheHeaderAvatar(): void
    {
        $this->bxLoginAsAdmin();

        $oMenu = BxDolMenu::getObjectInstance('sys_studio_account_popup', BxDolStudioTemplate::getInstance());
        $this->assertNotEmpty($oMenu, 'The sys_studio_account_popup menu is not installed.');

        $sHtml = (new ReflectionMethod($oMenu, 'getProfilePicture'))->invoke($oMenu);
        $this->assertStringStartsWith('<div class="bx-mv-picture" aria-hidden="true">', $sHtml);
        $this->assertStringNotContainsString('account.svg', $sHtml);

        $oProfile = BxDolProfile::getInstance();
        $this->assertStringContainsString($oProfile->getUnit(0, ['template' => ['name' => 'unit_wo_info_links', 'size' => 'icon']]), $sHtml);
    }
}
