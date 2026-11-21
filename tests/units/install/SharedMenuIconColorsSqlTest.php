<?php

/**
 * A module's items in the site's shared menus (the header toolbar, account and profile menus, the homepage apps) have
 * plain icons, as the system's own items there do: a "col-*" class made Messenger's header icon green and Chat+'s
 * homepage tile blue. Menus whose system items are tinted (the account dashboard, the application menu) keep tints.
 * Read from the install SQL.
 */
class SharedMenuIconColorsSqlTest extends \PHPUnit\Framework\TestCase
{
    private const ROOT = __DIR__ . '/../../../';

    /**
     * Menu items of the system's sets in a file: set => [[name, icon], ...]. An icon is the quoted value with a
     * "col-*" class in it.
     */
    private static function items(string $sFile): array
    {
        $aResult = [];
        foreach (file(self::ROOT . $sFile) as $sLine) {
            if (!preg_match("/^\\('(sys_[a-z_]+)',\\s*[^,]+,\\s*'([^']+)'/", $sLine, $aMatch))
                continue;

            $sIcon = preg_match("/'([a-z0-9-]+ col-[a-z0-9-]+)'/", $sLine, $aIcon) ? $aIcon[1] : '';
            $aResult[$aMatch[1]][] = [$aMatch[2], $sIcon];
        }
        return $aResult;
    }

    public function testModulesUsePlainIconsInSharedMenus(): void
    {
        $aTinted = [];
        foreach (self::items('install/sql/system.sql') as $sSet => $aItems)
            foreach ($aItems as [$sName, $sIcon])
                if ($sIcon !== '')
                    $aTinted[$sSet] = true;

        $aFiles = glob(self::ROOT . 'modules/*/*/install/sql/enable*.sql');
        $this->assertNotEmpty($aFiles);

        $aWrong = [];
        foreach ($aFiles as $sPath) {
            $sFile = substr($sPath, strlen(self::ROOT));
            foreach (self::items($sFile) as $sSet => $aItems)
                foreach ($aItems as [$sName, $sIcon])
                    if ($sIcon !== '' && empty($aTinted[$sSet]))
                        $aWrong[] = $sFile . ': ' . $sSet . ' ' . $sName . ' "' . $sIcon . '"';
        }

        $this->assertSame([], $aWrong, 'The system\'s items in these menus have no colour, so the modules\' have none either.');
    }
}
