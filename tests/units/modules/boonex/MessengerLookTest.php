<?php

/**
 * Messenger looks like the rest of the site: Lucide icons of UNA's iconset (`<i class="sys-icon ...">`) instead of
 * its own inline SVGs, standard small buttons in its column headers, and one header height for every column, with
 * or without buttons, so the dividers under them line up.
 */
class MessengerLookTest extends \PHPUnit\Framework\TestCase
{
    private const ROOT = __DIR__ . '/../../../../modules/boonex/messenger/';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(self::ROOT . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r", '', $s);
    }

    public function testTemplatesUseTheIconset(): void
    {
        foreach (glob(self::ROOT . 'template/*.html') as $sFile)
            $this->assertStringNotContainsString('<svg', (string)file_get_contents($sFile), basename($sFile) . ' draws its own icon.');
    }

    public function testHeaderButtonsAreStandard(): void
    {
        $sList = self::read('template/lots-list.html');
        preg_match('#<div class="bx-messenger-talks-list-header bx-db-header">.*?<nav#s', $sList, $m);
        $this->assertNotEmpty($m);
        preg_match_all('#<a [^>]*class="([^"]*)"#', $m[0], $aLinks);
        foreach ($aLinks[1] as $sClass) {
            if (strpos($sClass, 'bx-btn') === false)
                continue;
            $this->assertStringContainsString('bx-btn bx-btn-small', $sClass);
        }
        $this->assertGreaterThanOrEqual(4, substr_count($m[0], 'bx-btn bx-btn-small'), 'Menu, search, new talk and starred.');
        $this->assertStringContainsString('class="bx-db-title', $m[0], 'The title is a standard block title.');

        $this->assertStringContainsString('<a class="bx-btn bx-btn-small __name__"', self::read('template/menu_messenger_talk_header_hor.html'));
    }

    public function testColumnHeadersShareOneHeight(): void
    {
        $sCss = self::read('template/css/tailwind/components/talks-list.css') . self::read('template/css/tailwind/components/history-header.css');
        $this->assertSame(2, preg_match_all('/^\.bx-messenger-(talks-list|history-block)-header \{\n    @apply [^;]*\bp-4\b[^;]*min-h-\[4\.25rem\];/m', $sCss));
        $this->assertDoesNotMatchRegularExpression('/-header(-title| \.bx-db-title)\s*\{[^}]*text-(xl|2xl)/', $sCss, 'Titles take the block title size.');
    }

    public function testEmptyStatesAreTheSitesOwn(): void
    {
        $sTemplate = self::read('classes/BxMessengerTemplate.php');
        $this->assertMatchesRegularExpression("/function getLotsList\\(.*?getEmptyState\\('inbox'/s", $sTemplate, 'The inbox.');
        $this->assertStringNotContainsString("MsgBox(_t('_bx_messenger_empty_history'))", $sTemplate);
        $this->assertStringContainsString("getEmptyState('inbox'", $sTemplate);
        $this->assertStringContainsString("getEmptyState('history'", $sTemplate);
    }

    public function testLeftColumnIconsTakeTheTextColour(): void
    {
        preg_match_all("/^\(CONCAT\(@sName, '_nav_menu'\), @sName, '([a-z_]+)',.*$/m", self::read('install/sql/enable.sql'), $aItems, PREG_SET_ORDER);
        $this->assertNotEmpty($aItems);
        foreach ($aItems as $aItem)
            $this->assertDoesNotMatchRegularExpression("/'[a-z-]+ col-[a-z0-9-]+'/", $aItem[0], $aItem[1] . ' has a colour of its own.');
    }

    public function testDirectMessagesHaveNoTitle(): void
    {
        // the title field is hidden until a new talk has two people or more (oMessenger.updateTalkTitleField)
        $this->assertMatchesRegularExpression('/<input [^>]*id="bx-messenger-talk-title"[^>]*style="display:none"/', self::read('template/text-area.html'));
        $sJs = self::read('js/messenger.js');
        $this->assertStringContainsString('bGroup = this.getParticipantsList().length > 1;', $sJs);
        $this->assertSame(2, substr_count($sJs, '_oMessenger.updateTalkTitleField();'), 'Adding and removing a person.');
    }

    public function testSearchPlaceholderHasNoDots(): void
    {
        $this->assertStringContainsString('<string name="_bx_messenger_title_search"><![CDATA[Search]]></string>', self::read('install/langs/en.xml'));
    }
}
