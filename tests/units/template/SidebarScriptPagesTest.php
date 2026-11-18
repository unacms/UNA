<?php

/**
 * modules/base/template/js/sidebar.js works the application page type's own sidebar (pt_application.html: #sidebar,
 * #toggleSidebar...). The templates add it to pages of that type only; it was a request of every page.
 */
class SidebarScriptPagesTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public static function templates(): array
    {
        return [
            'Artificer' => ['modules/boonex/artificer/classes/BxArtificerTemplate.php'],
            'Decorous' => ['modules/boonex/decorous/classes/BxDecorousModule.php'],
            'Protean' => ['modules/boonex/protean/classes/BxProteanModule.php'],
            'Lucid' => ['modules/boonex/lucid/data/template/system/scripts/BxTemplFunctions.php'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('templates')]
    public function testTheScriptIsAddedOnApplicationPagesOnly(string $sPath): void
    {
        $s = self::read($sPath);

        $this->assertSame(1, substr_count($s, "sidebar.js'"), $sPath);
        $iCheck = strpos($s, 'BX_PAGE_TYPE_APPLICATION');
        $this->assertNotFalse($iCheck, 'The page type is checked.');
        $this->assertLessThan(strpos($s, "sidebar.js'"), $iCheck, 'The check comes before the script is added.');
    }

    public function testTheScriptsElementsAreInTheApplicationPageOnly(): void
    {
        $this->assertStringContainsString("getElementById('sidebar')", self::read('modules/base/template/js/sidebar.js'));

        foreach (glob(__DIR__ . '/../../../modules/boonex/artificer/data/template/system/*.html') as $sFile)
            if (basename($sFile) != 'pt_application.html')
                $this->assertStringNotContainsString('id="sidebar"', (string)file_get_contents($sFile), basename($sFile));

        $this->assertStringContainsString('id="sidebar"', self::read('modules/boonex/artificer/data/template/system/pt_application.html'));
    }
}
