<?php

/**
 * Defaults a fresh install gets from install/sql/system.sql. Read from the SQL itself, so a site whose admin
 * changed a setting in Studio does not fail the suite.
 */
class SystemSqlDefaultsTest extends \PHPUnit\Framework\TestCase
{
    private static function systemSql(): string
    {
        $sSql = file_get_contents(__DIR__ . '/../../../install/sql/system.sql');
        if ($sSql === false)
            self::fail('install/sql/system.sql is not readable.');

        return $sSql;
    }

    public function testHomeCreatePostBlockIsACardWithTitle(): void
    {
        // The home page's create-post block: designbox_id follows object, cell, module, title_system and title.
        $bFound = preg_match("/\\('sys_home', \\d+, 'system', '_sys_page_block_title_sys_create_post', '_sys_page_block_title_create_post', (\\d+),/", self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound, 'system.sql adds the create-post block to the home page.');
        $this->assertSame(11, (int)$aMatch[1], 'On the site it is the "Add new..." card: content, title, background and padding (BX_DB_PADDING_DEF).');
    }

    public function testHomeCreatePostBlockInAppHasNoTitle(): void
    {
        // NEO draws the composer row straight in the block. Its App config keeps the background and padding
        // and drops the design box's title. Blocks and the feed's cards share one fill, so no `solid` key.
        $sSql = file_get_contents(__DIR__ . '/../../../modules/system/install/sql/enable-app-pages.sql');
        $bFound = preg_match("/UPDATE `sys_pages_blocks` SET `config_api`='([^']*)' WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_create_post';/", (string)$sSql, $aMatch);

        $this->assertSame(1, $bFound, 'enable-app-pages.sql sets the App config of the home create-post block.');
        $aConfig = json_decode($aMatch[1], true);
        $this->assertSame(['bg' => true, 'padding' => true, 'title' => false], $aConfig['designbox'] ?? null);
    }

    public function testHomepageSubmenuHasAnIconInTheApp(): void
    {
        // NEO shows a section's title with an icon: a module's own icon, else the `icon` of the submenu's App
        // config. Explore, Updates and Trends belong to no module, so their submenu carries the icon.
        $sSql = file_get_contents(__DIR__ . '/../../../modules/system/install/sql/enable-app-menus.sql');
        $bFound = preg_match("/UPDATE `sys_objects_menu` SET `config_api`='([^']*)' WHERE `object`='sys_homepage_submenu';/", (string)$sSql, $aMatch);

        $this->assertSame(1, $bFound, 'enable-app-menus.sql sets the App config of the homepage submenu.');
        $aConfig = json_decode($aMatch[1], true);
        $this->assertSame('compass', $aConfig['icon'] ?? null, 'The Explore item\'s own icon, as in the site menu.');
    }

    public function testPoweredByBadgeFollowsTheFooterColour(): void
    {
        $bFound = preg_match("/\\('sys_footer', 'system', 'powered_by', [^\\n]*?'_blank', '(<svg.*?<\\/svg>)'/", self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound, 'system.sql adds the powered-by badge to the footer menu.');
        $this->assertStringContainsString('fill="currentColor"', $aMatch[1], 'The badge draws in the footer link colour, so it reads in light and dark.');
        $this->assertDoesNotMatchRegularExpression('/(fill|stroke)="#/', $aMatch[1], 'No fixed colour that would vanish on one of the two schemes.');
    }

    public function testHomeRecommendedFriendsShowsAnEmptyState(): void
    {
        $bFound = preg_match("/\\('sys_home', 4, 'system', '_sys_page_block_title_sys_recom_friends', [^\\n]*?'service', '([^\\n]*?)', /", self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound, 'system.sql adds Recommended friends to the right column of the home page.');
        $aContent = unserialize(stripslashes($aMatch[1]));
        $this->assertSame('browse_recommendations_friends', $aContent['method']);
        $this->assertTrue($aContent['params'][1]['empty_state'] ?? false, 'With nothing to suggest, the block explains why instead of leaving the column blank.');
    }

    public function testSearchIsAnActiveMemberToolbarItem(): void
    {
        $sSql = self::systemSql();

        // Member toolbar columns: ... icon, addon, submenu_object, submenu_popup, visible_for_levels, hidden_on_pt, active, copyable, order.
        $bFound = preg_match("/\\('sys_toolbar_member', 'system', 'search', '_sys_menu_item_title_system_search', [^\\n]*?, '([^']*)', '', '', 0, (\\d+), (\\d+), (\\d+), \\d+, (\\d+)\\)/", $sSql, $aMatch);

        $this->assertSame(1, $bFound, 'system.sql adds the search button to the member toolbar, where it can be edited in Studio like its neighbours.');
        $this->assertSame('search', $aMatch[1], 'It is drawn with the Lucide search icon.');
        $this->assertSame(2147483647, (int)$aMatch[2], 'Guests and members both see it.');
        $this->assertSame(0, (int)$aMatch[3], 'It is not hidden on any page type.');
        $this->assertSame(1, (int)$aMatch[4], 'It is active on a fresh install.');
        $this->assertSame(0, (int)$aMatch[5], 'It comes first in the toolbar.');

        $this->assertStringNotContainsString("('sys_toolbar_site', 'system', 'search'", $sSql, 'One search item only: the site toolbar no longer has its own.');
    }

    public function testSearchIsActiveInTheApi(): void
    {
        $sSql = file_get_contents(__DIR__ . '/../../../modules/system/install/sql/enable-app-menus.sql');

        $this->assertStringContainsString("SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='search';", $sSql, 'The app receives the same search item.');
        $this->assertStringNotContainsString("`set_name`='sys_toolbar_site' AND `module`='system' AND `name`='search'", $sSql);
    }

    public function testNewsletterIsOptIn(): void
    {
        $sSql = self::systemSql();

        $this->assertStringContainsString("  `receive_news` tinyint(4) NOT NULL DEFAULT '0',", $sSql, 'An account created without the field is not subscribed.');

        // Form input columns: object, module, name, value, values, checked, type, ...
        $this->assertStringContainsString("('sys_account', 'system', 'receive_news', '1', '', 0, 'switcher',", $sSql, 'The switch starts unticked wherever it shows.');

        // Display input columns: display_name, input_name, visible_for_levels, active, order.
        $this->assertMatchesRegularExpression("/\\('sys_account_create', 'receive_news', 2147483647, 0, \\d+\\)/", $sSql, 'The join form does not ask; the input stays so a site can turn it on in Studio > Forms.');
        $this->assertMatchesRegularExpression("/\\('sys_account_settings_email', 'receive_news', 2147483647, 1, \\d+\\)/", $sSql, 'Members can still change it in account settings.');
    }

    public function testForgotPasswordPageIsNarrowWithATitledBlock(): void
    {
        $sSql = self::systemSql();

        // layout_id follows object, uri, title_system, title, module and cover.
        $bPage = preg_match("/\\('sys_forgot_password', 'forgot-password', '[^']*', '[^']*', 'system', \\d+, (\\d+),/", $sSql, $aPage);
        $bLogin = preg_match("/\\('sys_login', 'login', '[^']*', '[^']*', 'system', \\d+, (\\d+),/", $sSql, $aLogin);
        $this->assertSame(1, $bPage, 'system.sql adds the forgot-password page.');
        $this->assertSame(1, $bLogin, 'system.sql adds the login page.');
        $this->assertSame((int)$aLogin[1], (int)$aPage[1], 'Forgot password uses the same narrow layout as Log in.');

        $bBlock = preg_match("/\\('sys_forgot_password', 1, 'system', '', '_sys_page_block_title_forgot_password', (\\d+),/", $sSql, $aBlock);
        $this->assertSame(1, $bBlock, 'system.sql adds the forgot-password form block.');
        $this->assertSame(11, (int)$aBlock[1], 'The block shows its title (content, title, background and padding).');
    }

    public function testToolbarHasNoHardcodedSearchButton(): void
    {
        $sRoot = __DIR__ . '/../../../';
        foreach (['template/_page_toolbar.html', 'template/_page_toolbar_search.html', 'modules/boonex/artificer/template/header.html', 'modules/boonex/artificer/data/template/system/pt_application.html'] as $sFile) {
            $sHtml = file_get_contents($sRoot . $sFile);

            $this->assertStringNotContainsString('bx-ti-search-button', $sHtml, $sFile . ': the search button comes from the member toolbar menu, not from the template.');
            $this->assertStringNotContainsString('bx_site_search_show', $sHtml, $sFile);
        }
    }

    public function testMenuItemsAreKeyedBySet(): void
    {
        $bFound = preg_match('/CREATE TABLE IF NOT EXISTS `sys_menu_items` \((.*?)\n\);/s', self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound, 'system.sql creates sys_menu_items.');
        // Every menu reads its items by set; without the key each read scans the whole table.
        // The key is on the set alone: items that share an `order` keep the order they had.
        $this->assertStringContainsString('KEY `set_name` (`set_name`)', $aMatch[1]);
    }
}
