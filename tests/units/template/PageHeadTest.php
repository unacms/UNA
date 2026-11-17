<?php

/**
 * What every page's <head> must keep, checked on the files:
 * - no page template sets its own viewport: all take the site's one (`sys_viewport_meta_tag`), which leaves zoom to
 *   the visitor (WCAG 1.4.4), where a hard-coded `maximum-scale=1.0` took it away;
 * - the agent chat's script (plugins_public/bundle.js) is not a system script, loaded by every page: the chat block
 *   and Studio > Agents add it, and a chat block that arrives without it loads it itself.
 */
class PageHeadTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public static function pageTemplates(): array
    {
        $a = [];
        foreach (glob(__DIR__ . '/../../../template/*.html') as $sFile)
            if (strpos((string)file_get_contents($sFile), 'name="viewport"') !== false)
                $a[basename($sFile)] = ['template/' . basename($sFile)];

        return $a;
    }

    public function testThePageTemplatesWithAViewportAreFound(): void
    {
        $a = array_keys(self::pageTemplates());
        foreach (['_header.html', 'page_2.html', 'page_22.html', 'page_44.html', 'page_150.html'] as $sFile)
            $this->assertContains($sFile, $a);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('pageTemplates')]
    public function testViewportIsTheSitesOne(string $sPath): void
    {
        $s = self::read($sPath);

        $this->assertSame(1, preg_match_all('/<meta name="viewport"[^>]*>/', $s, $aMatches));
        $this->assertSame('<meta name="viewport" content="__page_viewport__" />', $aMatches[0][0]);
        $this->assertStringNotContainsString('maximum-scale', $s);
        $this->assertStringNotContainsString('user-scalable', $s);
    }

    public function testTheSitesViewportLeavesZoomToTheVisitor(): void
    {
        $this->assertSame(1, preg_match("/'sys_viewport_meta_tag', '[^']*', '([^']*)'/", self::read('install/sql/system.sql'), $aMatch));
        $this->assertStringNotContainsString('maximum-scale', $aMatch[1]);
        $this->assertStringNotContainsString('user-scalable', $aMatch[1]);
    }

    public function testTheChatScriptIsNotASystemScript(): void
    {
        $this->assertDoesNotMatchRegularExpression("/'js_system', 'bundle\.js'/", self::read('install/sql/system.sql'));
    }

    public function testTheChatsPagesAddItsScript(): void
    {
        $this->assertMatchesRegularExpression('/aPageJs = array_merge\(\$this->aPageJs, \[[^\]]*\'bundle\.js\'/', self::read('studio/template/scripts/BxBaseStudioAgents.php'));
        $this->assertStringContainsString("addJs([BX_DOL_URL_ROOT . 'plugins_public/bundle.js'])", self::read('template/scripts/BxBaseServices.php'));

        $s = self::read('template/agent_ai_chat.html');
        $this->assertStringContainsString("bx_get_scripts(['__bundle_url__']", $s, 'A chat block without the script on its page loads it.');
        $this->assertStringContainsString('window.una && window.una.Chat', $s);
    }
}
