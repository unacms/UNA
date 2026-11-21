<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Every icon the system and the starter modules store (menu items, grid actions, page blocks, statistics, levels,
 * Studio pages and widgets, mime types) names an icon that draws itself: a Lucide icon or one of the brand marks
 * (`brand-x`), with no Font Awesome classes (`far`) and not a Font Awesome name that the Lucide set maps to another
 * icon. The apps read these names as they are, so a name only the site's map knows draws nothing there.
 *
 * Images, inline SVG, HTML and emoji are left alone. TemplateIconNamesTest checks the templates and code.
 */
#[Group('integration')]
class StoredIconNamesTest extends BxDolIntegrationTestCase
{
    /**
     * The system and the installer's starter set (BxDolInstallSiteConfig::$aStarterModules, which
     * TemplateIconNamesTest compares with this list), plus Accounts.
     */
    public const MODULES = [
        'system', 'bx_persons', 'bx_organizations',
        'bx_timeline', 'bx_posts', 'bx_photos', 'bx_videos', 'bx_albums',
        'bx_forum', 'bx_groups', 'bx_events',
        'bx_notifications', 'bx_messenger',
        'bx_antispam', 'bx_editor', 'bx_analytics',
        'bx_accounts',
    ];

    public static function isIconCode(string $sCode): bool
    {
        return preg_match('/^[A-Za-z][A-Za-z0-9 _-]*$/', trim($sCode)) === 1;
    }

    /**
     * Why an icon code does not draw itself, '' when it does.
     */
    public static function problem(BxBaseIconsetLucide $oIconset, string $sCode): string
    {
        $aParts = preg_split('/\s+/', mb_strtolower(trim($sCode)));
        if (array_intersect($aParts, ['fa', 'fas', 'far', 'fab', 'fa-fw']))
            return 'has Font Awesome classes';

        $sName = BxBaseIconsetLucide::getCodeName($sCode);
        if ($sName === '')
            return 'names no icon';

        $sDrawn = $oIconset->getLucideName($sCode);
        if ($sDrawn === false)
            return 'is no Lucide icon or brand mark';
        if ($sDrawn !== $sName)
            return 'is a Font Awesome name, drawn as ' . $sDrawn;

        return '';
    }

    public static function iconset(): BxBaseIconsetLucide
    {
        $oIconset = BxDolIconset::getObjectInstance('sys_lucide');
        self::assertInstanceOf(BxBaseIconsetLucide::class, $oIconset);

        return $oIconset;
    }

    /**
     * Rows as [where, icon code]: by module where the table says it, by object prefix for grid actions.
     */
    protected function storedIcons(): array
    {
        $oDb = BxDolDb::getInstance();
        $aModules = array_values(array_intersect(self::MODULES, array_merge(['system'], $oDb->getColumn("SELECT `name` FROM `sys_modules`"))));
        $sIn = "'" . implode("', '", $aModules) . "'"; // names from the list above

        $aQueries = [
            "SELECT CONCAT('sys_menu_items ', `set_name`, ':', `name`) AS `w`, `icon` FROM `sys_menu_items` WHERE `module` IN ($sIn)",
            "SELECT CONCAT('sys_pages_blocks ', `object`, ':', `title`) AS `w`, `icon` FROM `sys_pages_blocks` WHERE `module` IN ($sIn)",
            "SELECT CONCAT('sys_pages_blocks ', `object`, ':', `title`, ' header') AS `w`, `header_icon` FROM `sys_pages_blocks` WHERE `module` IN ($sIn)",
            "SELECT CONCAT('sys_statistics ', `name`) AS `w`, `icon` FROM `sys_statistics` WHERE `module` IN ($sIn)",
            "SELECT CONCAT('sys_std_widgets ', `caption`) AS `w`, `icon` FROM `sys_std_widgets` WHERE `module` IN ($sIn)",
            "SELECT CONCAT('sys_std_pages ', `name`) AS `w`, `icon` FROM `sys_std_pages`",
            "SELECT CONCAT('sys_acl_levels ', `Name`) AS `w`, `Icon` FROM `sys_acl_levels`",
            "SELECT CONCAT('sys_options_types ', `name`) AS `w`, `icon` FROM `sys_options_types`",
            "SELECT CONCAT('sys_storage_mime_types ', `ext`) AS `w`, `icon_font` FROM `sys_storage_mime_types`",
        ];

        $aRows = [];
        foreach ($aQueries as $sQuery)
            foreach ($oDb->getAll($sQuery) as $a)
                $aRows[] = array_map('strval', array_values($a));

        $aPrefixes = array_map(fn($s) => $s . '_', array_diff($aModules, ['system']));
        $aPrefixes[] = 'sys_';
        foreach ($oDb->getAll("SELECT `object`, `type`, `name`, `icon` FROM `sys_grid_actions`") as $a)
            foreach ($aPrefixes as $sPrefix)
                if (strncmp($a['object'], $sPrefix, strlen($sPrefix)) === 0) {
                    $aRows[] = ['sys_grid_actions ' . $a['object'] . ':' . $a['type'] . ':' . $a['name'], (string)$a['icon']];
                    break;
                }

        return $aRows;
    }

    public function testStoredIconsDrawThemselves(): void
    {
        $oIconset = self::iconset();

        $iChecked = 0;
        $aProblems = [];
        foreach ($this->storedIcons() as [$sWhere, $sIcon]) {
            if (!self::isIconCode($sIcon))
                continue;

            $iChecked++;
            if (($sProblem = self::problem($oIconset, $sIcon)) !== '')
                $aProblems[] = $sWhere . ': "' . $sIcon . '" ' . $sProblem;
        }

        $this->assertGreaterThan(500, $iChecked, 'The stored icons are found.');
        $this->assertSame([], $aProblems);
    }

    public function testFontAwesomeNamesFromElsewhereStillDraw(): void
    {
        $oIconset = self::iconset();

        // third-party data keeps working through the map
        $this->assertSame('settings', $oIconset->getLucideName('cog'));
        $this->assertSame('file-text', $oIconset->getLucideName('far file-alt'));
        $this->assertSame('info', $oIconset->getLucideName('info-circle col-blue3-dark'));
        $this->assertSame('badge', $oIconset->getLucideName('fa-certificate'));
        $this->assertSame('star', $oIconset->getLucideName('fas fa-star'));
        $this->assertSame('chevron-left', $oIconset->getLucideName('angle-left'));
        $this->assertSame('bot', $oIconset->getLucideName('robot'));
        $this->assertSame('brand-x', $oIconset->getLucideName('fab twitter'));
        $this->assertSame('brand-facebook', $oIconset->getLucideName('fab facebook-f'));
        $this->assertSame('brand-linkedin', $oIconset->getLucideName('fab linkedin-in'));
        $this->assertFalse($oIconset->getLucideName('brand-myspace'));
        $this->assertFalse($oIconset->getLucideName('<svg></svg>'));
    }

    public function testBrandMarksDrawInline(): void
    {
        $oIconset = self::iconset();

        foreach (BxBaseIconsetLucide::$aBrands as $sBrand) {
            $sSvg = $oIconset->getIconHtml('brand-' . $sBrand, ['class' => 'extra']);
            $this->assertIsString($sSvg, $sBrand);
            $this->assertStringStartsWith('<svg class="sys-icon extra sys-icon-brand"', $sSvg, $sBrand);
            $this->assertStringContainsString('fill="currentColor"', $sSvg, $sBrand);
        }
    }

    public function testTheScriptDrawsBrandMarks(): void
    {
        $oIconset = self::iconset();

        $this->assertSame('<svg class="sys-icon-brand"', substr((string)$oIconset->getSvg('brand-x'), 0, 27));
        $this->assertStringContainsString("oSvg.setAttribute('class', (bBrand ? 'sys-icon-brand ' : 'lucide lucide-' + sName + ' ') + el.getAttribute('class'));", $oIconset->getCode());
    }
}
