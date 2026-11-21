<?php

/**
 * Share (owner decision D7): on a phone the system share sheet, else the Share popup, whose services are rows with
 * their brand mark and name; Twitter is X. Likes, saves and features fill their icon while they are on (M31), and
 * the scripts that change an action's icon draw the new one.
 */
class ShareAndActionStateTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testPhonesUseTheShareSheetAndFallBackToThePopup(): void
    {
        $s = self::read('inc/js/classes/BxDolPage.js');

        $this->assertStringContainsString('if(this._isPhone() && navigator.share) {', $s);
        $this->assertStringContainsString("navigator.share({url: sLink, title: document.title})", $s);
        $this->assertStringContainsString("if(!oError || oError.name != 'AbortError')", $s, 'Closing the sheet opens nothing else.');
        $this->assertStringContainsString('$this.sharePopup(oLink, sUrl);', $s);
    }

    public function testThePopupListsServicesAsRows(): void
    {
        $this->assertStringContainsString('$oMenu->setTemplateById(6); // menu_vertical.html', self::read('template/scripts/BxBasePage.php'));
    }

    public function testTwitterIsX(): void
    {
        $sSql = self::read('install/sql/system.sql');
        $this->assertStringContainsString("'social-sharing-twitter', '_sys_menu_item_title_system_social_sharing_twitter', '_sys_menu_item_title_social_sharing_twitter', 'https://x.com/intent/post?url={url_encoded}', '', '_blank', 'brand-x',", $sSql);

        foreach (['_sys_menu_item_title_social_sharing_twitter', '_sys_menu_item_title_system_social_sharing_twitter'] as $sKey) {
            $this->assertStringContainsString('<string name="' . $sKey . '"><![CDATA[Share on X]]></string>', self::read('modules/boonex/english/data/langs/system/en.xml'));
            $this->assertStringNotContainsString('Twitter', (string)_t($sKey));
        }
    }

    public function testActionsThatAreOnFillTheirIcon(): void
    {
        $this->assertStringContainsString("return \$bVoted ? 'thumbs-up sys-icon-filled' : 'thumbs-up';", self::read('inc/classes/BxDolVoteLikes.php'));
        $this->assertStringContainsString("return \$bPerformed ? 'bookmark sys-icon-filled' : 'bookmark';", self::read('inc/classes/BxDolFavorite.php'));
        $this->assertStringContainsString("return \$bPerformed ? 'star sys-icon-filled' : 'star';", self::read('inc/classes/BxDolFeature.php'));

        $this->assertMatchesRegularExpression('/\.sys-icon\.sys-icon-filled \{\s*fill: currentColor;\s*\}/', self::read('template/css/icons_lucide.css'));
        $this->assertSame('thumbs-up', BxBaseIconsetLucide::getCodeName('thumbs-up sys-icon-filled'), 'The class is no name.');
    }

    public function testScriptsDrawAnActionsNewIcon(): void
    {
        $this->assertStringContainsString('function bx_set_icon(oIcons, sClasses, sHtml)', self::read('inc/js/functions.js'));

        foreach (['BxDolVoteLikes', 'BxDolVoteReactions', 'BxDolFavorite', 'BxDolFeature', 'BxDolReport', 'BxDolScore'] as $sClass) {
            $s = self::read('inc/js/classes/' . $sClass . '.js');
            $this->assertStringContainsString('bx_set_icon(', $s, $sClass);
            $this->assertDoesNotMatchRegularExpression("/\.sys-icon'\)\.attr\('class'/", $s, $sClass . ' changes the classes of a drawn icon, which changes nothing on screen.');
        }

        foreach (['BxDolVote', 'BxDolFavorite', 'BxDolReport', 'BxDolVoteReactions'] as $sClass)
            $this->assertStringNotContainsString('.html(oData.countf);', self::read('inc/js/classes/' . $sClass . '.js'), $sClass . ': a new counter has an icon to draw.');
    }
}
