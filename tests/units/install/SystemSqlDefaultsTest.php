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

    public function testProfileIsNotRequiredByDefault(): void
    {
        // An account without a profile of its own gets the "create a profile" informer and uses the site; "Require a
        // profile" sends it to profile creation instead, on the site and in the apps, once an admin turns it on.
        $bFound = preg_match("/\\(@iCategoryId, 'sys_account_require_profile', '_adm_stg_cpt_option_sys_account_require_profile', '([^']*)', 'checkbox',/", self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound, 'system.sql adds the "Require a profile" option to the Account settings.');
        $this->assertSame('', $aMatch[1], 'Off on a fresh install.');
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

    public function testDashboardBlockInAppHasNoBackgroundOnPhones(): void
    {
        // The dashboard block is already a stack of cards, so on phones NEO draws it straight on the page, with the
        // block's padding; tablets and desktops keep the background.
        $sSql = file_get_contents(__DIR__ . '/../../../modules/system/install/sql/enable-app-pages.sql');
        $bFound = preg_match("/UPDATE `sys_pages_blocks` SET `active_api`=1, `config_api`='([^']*)' WHERE `object`='sys_dashboard' AND `module`='system' AND `title_system`='_sys_page_block_title_dash_stats';/", (string)$sSql, $aMatch);

        $this->assertSame(1, $bFound, 'enable-app-pages.sql sets the App config of the dashboard block.');
        $aConfig = json_decode($aMatch[1], true);
        $this->assertSame(['bg' => ['tablet', 'desktop']], $aConfig['designbox'] ?? null);
    }

    public function testProfileIsTheLastMemberTab(): void
    {
        // The member tab bar ends with the profile, drawn as the viewer's avatar in NEO; the dashboard comes before it.
        $sSql = self::systemSql();
        $aOrder = [];
        foreach (['home', 'friends', 'profile', 'dashboard'] as $sName) {
            $bFound = preg_match("/\\('sys_tabbar', 'system', '" . $sName . "', [^\\n]*?, (\\d+)\\)[,;]/", $sSql, $aMatch);
            $this->assertSame(1, $bFound, "system.sql adds the {$sName} tab.");
            $aOrder[$sName] = (int)$aMatch[1];
        }

        $this->assertLessThan($aOrder['profile'], $aOrder['dashboard'], 'The dashboard tab comes before the profile.');
        $this->assertSame(max($aOrder), $aOrder['profile'], 'No core member tab comes after the profile.');
    }

    public function testFooterHasThemeAndSoundsSwitchers(): void
    {
        // Icon-only items (no title) that open their menus above them: BxBaseMenuFooter renders the menus and shows
        // the Theme item only where the template has a colour scheme, the Sounds item where sounds play on the site.
        foreach (['color_scheme' => 'adjust', 'sounds' => 'volume-up'] as $sName => $sIcon) {
            $bFound = preg_match("/\\('sys_footer', 'system', '" . $sName . "', '_sys_menu_item_title_system_" . $sName . "', '', 'javascript:void\\(0\\);', '([^']|'')*', '', '([a-z-]+)',/", self::systemSql(), $aMatch);

            $this->assertSame(1, $bFound, "system.sql adds the footer's " . $sName . ' item.');
            $this->assertStringContainsString("bx_menu_popup_inline(''#bx-menu-footer-" . str_replace('_', '-', $sName) . "'', this, {pointer: {flip: true}});", $aMatch[0]);
            $this->assertSame($sIcon, $aMatch[2]);
        }
    }

    public function testFooterCopyrightIsTextAfterTheLinks(): void
    {
        // No link and no script: BxBaseMenuFooter shows it as text ("(c) 2026 Site. All rights reserved."), after
        // About, Terms and Privacy and before the tools. The apps get it too, as a text item.
        $sSql = self::systemSql();
        $aOrder = [];
        foreach (['copyright', 'switch_language', 'switch_template', 'color_scheme', 'sounds'] as $sName) {
            $this->assertSame(1, preg_match("/\\('sys_footer', 'system', '" . $sName . "', '[^']*', '[^']*', '((?:[^']|'')*)', '((?:[^']|'')*)', [^\\n]*, (\\d+)\\),?\\r?\\n/", $sSql, $aMatch), 'system.sql adds the footer\'s ' . $sName . ' item.');
            $aOrder[$sName] = (int)$aMatch[3];

            if ($sName == 'switch_language')
                $this->assertSame("bx_menu_popup(''sys_switch_language_popup'', this, {pointer: {flip: true}});", $aMatch[2], 'The language menu opens at the footer item, above it like Theme and Sounds.');

            if ($sName == 'copyright') {
                $this->assertSame('', $aMatch[1], 'The copyright notice has no link.');
                $this->assertSame('', $aMatch[2], 'Nor a script: no popup.');
            }
        }

        $this->assertSame(4, $aOrder['copyright'], 'Right after Privacy (3).');
        $aTools = $aOrder;
        unset($aTools['copyright']);
        $this->assertGreaterThan($aOrder['copyright'], min($aTools), 'The tools come after it.');

        $sApp = file_get_contents(__DIR__ . '/../../../modules/system/install/sql/enable-app-menus.sql');
        $this->assertStringContainsString("UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='copyright';", (string)$sApp);
        $this->assertStringContainsString("UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='powered_by';", (string)$sApp, 'The apps show the badge too.');
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

    public function testPoweredByBadgeIsTheLogoAlone(): void
    {
        $bFound = preg_match("/\\('sys_footer', 'system', 'powered_by', [^\\n]*?'_blank', '(<svg.*?<\\/svg>)'/", self::systemSql(), $aMatch);

        $this->assertSame(1, $bFound);
        $this->assertStringContainsString('viewBox="91 0 67 28"', $aMatch[1], 'The UNA mark and wordmark, at the size they had in the old badge.');
        $this->assertStringNotContainsString('<rect', $aMatch[1], 'No outline around it.');
        $this->assertStringNotContainsString('M9.54 18.5', $aMatch[1], 'No "Powered by" lettering, which no language could translate: the name is a language string (_sys_txt_powered_by_una).');
        $this->assertStringContainsString("('sys_footer', 'system', 'powered_by', '_sys_menu_item_title_system_powered_by', '', 'https://unacms.com', ", self::systemSql(), 'It links to unacms.com.');
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

    public function testSiteMenuReachesTheAppsAsOnTheSite(): void
    {
        // The guest menu in the apps (NEO) is UNA's site menu: what Studio marks "Active (for App)". By default it
        // matches the site: Home, About, and each module's own item from every module that is ready for the apps
        // (ships enable-app.sql). Search opens the site's search panel, so it stays off.
        $sSystem = (string)file_get_contents(__DIR__ . '/../../../modules/system/install/sql/enable-app-menus.sql');
        foreach (['home', 'about'] as $sName)
            $this->assertStringContainsString("SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='" . $sName . "';", $sSystem, $sName);

        $iChecked = 0;
        foreach (glob(__DIR__ . '/../../../modules/boonex/*/install/sql/enable.sql') as $sEnable) {
            $sApp = dirname($sEnable) . '/enable-app.sql';
            if (!file_exists($sApp))
                continue;
            preg_match_all("/\\('sys_site', '([^']+)', '([^']+)'/", (string)file_get_contents($sEnable), $aItems, PREG_SET_ORDER);
            $sAppSql = (string)file_get_contents($sApp);
            foreach ($aItems as $aItem) {
                $this->assertStringContainsString("SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='" . $aItem[1] . "' AND `name`='" . $aItem[2] . "';", $sAppSql, $aItem[1] . ' ' . $aItem[2]);
                $iChecked++;
            }
        }
        $this->assertGreaterThan(10, $iChecked, 'The modules with a site menu item were found.');
    }

    public function testSiteMenuPutsModulesFirstAndGuestsGetLogInAndSignUpOnPhones(): void
    {
        // The site menu (the phone menu and the desktop navbar, on the site and in the apps): modules' items first,
        // then About, then Log in and Sign up for guests on phones, and More last. Home is the logo on phones.
        preg_match_all("/\\('sys_site', 'system', '([^']+)', '[^']*', '[^']*', '[^']*', '(?:[^'\\\\]|\\\\.)*', '[^']*', '[^']*', '[^']*', (\\d+), '([^']*)', \\d, \\d, (\\d+)\\)/", self::systemSql(), $aRows, PREG_SET_ORDER);
        $aItems = [];
        foreach ($aRows as $aRow)
            $aItems[$aRow[1]] = ['levels' => (int)$aRow[2], 'hidden_on' => $aRow[3], 'order' => (int)$aRow[4]];

        foreach (['home', 'about', 'login', 'create-account', 'more-auto'] as $sName)
            $this->assertArrayHasKey($sName, $aItems, $sName);

        $this->assertSame('1', $aItems['home']['hidden_on'], 'Home is hidden on phones (BX_DB_HIDDEN_PHONE).');

        // A module adds its item after the last one below 9999 (enable.sql), so About and the rest stay under it.
        $this->assertGreaterThanOrEqual(9999, $aItems['about']['order']);
        $this->assertStringContainsString("`set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999", (string)file_get_contents(__DIR__ . '/../../../modules/boonex/persons/install/sql/enable.sql'));

        foreach (['login', 'create-account'] as $sName) {
            $this->assertSame(1, $aItems[$sName]['levels'], $sName . ' is for guests only.');
            $this->assertSame('6', $aItems[$sName]['hidden_on'], $sName . ' is hidden on tablets and desktops, where the header has Log in and Sign up.');
        }
        $this->assertTrue($aItems['about']['order'] < $aItems['login']['order'] && $aItems['login']['order'] < $aItems['create-account']['order'], 'About, Log in, Sign up.');
        $this->assertGreaterThan($aItems['create-account']['order'], $aItems['more-auto']['order'], 'More is last.');

        $sApp = (string)file_get_contents(__DIR__ . '/../../../modules/system/install/sql/enable-app-menus.sql');
        foreach (['login', 'create-account'] as $sName)
            $this->assertStringContainsString("SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='" . $sName . "';", $sApp, $sName . ' reaches the apps.');
    }

    public function testSignUpUsesTheLogInLayout(): void
    {
        // Sign up, Log in and Forgot password share the thin one-column layout (id 18), one card width on the site and in the apps.
        $sSql = self::systemSql();
        foreach (['sys_create_account', 'sys_login', 'sys_forgot_password'] as $sObject) {
            $bFound = preg_match("/\\('" . $sObject . "', '[^']+', '[^']+', '[^']+', 'system', \\d+, (\\d+),/", $sSql, $aMatch);
            $this->assertSame(1, $bFound, $sObject);
            $this->assertSame(18, (int)$aMatch[1], $sObject);
        }

        $this->assertStringContainsString('w-full max-w-md mx-auto', (string)file_get_contents(__DIR__ . '/../../../template/_row_1_column_thin.html'), 'The thin column is 448px (max-w-md), as NEO\'s.');
    }

    public function testScreenSizeColumns(): void
    {
        // Studio's per-screen-size switches, empty (shown everywhere) on a fresh install.
        $sSql = self::systemSql();
        $this->assertMatchesRegularExpression("/CREATE TABLE IF NOT EXISTS `sys_objects_page` \\([^;]*`cover_hidden_on` varchar\\(255\\) NOT NULL DEFAULT ''/s", $sSql);
        foreach (['title_hidden_on', 'bg_hidden_on', 'padding_hidden_on'] as $sColumn)
            $this->assertMatchesRegularExpression("/CREATE TABLE IF NOT EXISTS `sys_pages_blocks` \\([^;]*`" . $sColumn . "` varchar\\(255\\) NOT NULL DEFAULT ''/s", $sSql, $sColumn);
    }
}
