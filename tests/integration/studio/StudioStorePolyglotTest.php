<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > App Store opens on the Storefront and keeps Delete out of the way of Install; Studio > Polyglot opens on the
 * installed languages and names language categories by their modules ("English", not "BoonEx English").
 */
#[Group('integration')]
class StudioStorePolyglotTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->bxSetLoggedFlags(BX_DOL_ROLE_MEMBER | BX_DOL_ROLE_ADMIN); // Studio grids are for operators only; tearDown restores the flags
    }

    protected function call(object $o, string $sMethod, array $aArgs = [])
    {
        return (new ReflectionMethod($o, $sMethod))->invokeArgs($o, $aArgs);
    }

    protected function prop(object $o, string $sName)
    {
        return (new ReflectionProperty($o, $sName))->getValue($o);
    }

    public function testStoreOpensOnTheStorefront(): void
    {
        $oStore = new BxTemplStudioStore('');
        $this->assertSame('goodies', $this->prop($oStore, 'sPage'));
        $this->assertTrue($this->prop($oStore, 'bPageDefault'));

        $oStore = new BxTemplStudioStore('downloaded');
        $this->assertSame('downloaded', $this->prop($oStore, 'sPage'));
        $this->assertFalse($this->prop($oStore, 'bPageDefault'));
    }

    public function testDownloadedCardsHaveDeleteInTheMoreMenu(): void
    {
        $sHtml = $this->call(new BxTemplStudioStore('downloaded'), 'getDownloadedList');
        if (strpos($sHtml, 'bx-std-product-gallery') === false)
            $this->markTestSkipped('No downloaded packages.');

        // No Delete button on a card: each card has a More button that opens the one shared menu.
        $this->assertStringNotContainsString(".remove('", $sHtml);
        $this->assertStringContainsString('data-bx-context-menu="#bx-std-str-downloaded-menu"', $sHtml);
        $this->assertStringContainsString('aria-haspopup="menu"', $sHtml);

        // The menu: one destructive item, Delete, for the card whose More button opened it.
        $this->assertSame(1, substr_count($sHtml, 'id="bx-std-str-downloaded-menu"'));
        $this->assertMatchesRegularExpression('/class="bx-std-cm-item bx-std-cm-danger" role="menuitem"[^>]*oBxDolStudioContextMenu\.oTrigger/', $sHtml);
        $this->assertStringContainsString('>' . _t('_adm_btn_delete_submit') . '</span>', $sHtml);
    }

    /**
     * Without a market session the Storefront it lands on says so with a link; only a page the operator picked goes to
     * the market's sign-in page. With no key and secret it says where to enter them.
     */
    public function testAuthorizeWithoutRedirect(): void
    {
        $oClass = new ReflectionClass('BxDolStudioOAuthOAuth2');
        $oOAuth = $oClass->newInstanceWithoutConstructor();
        foreach ([
            'oSession' => BxDolSession::getInstance(),
            'sErrorCode' => 'oauth_err_code',
            'sErrorMessage' => 'oauth_err_message',
            'sSessionKeyStateToken' => 'bx_studio_store_state_token',
            'sSessionKeyCsrfToken' => 'bx_studio_store_csrf_token',
            'sSessionKeyCsrfTokenTime' => 'bx_studio_store_csrf_token_time',
            'sKey' => '',
            'sSecret' => '',
            'sApiUrl' => 'https://market.invalid/m/oauth2/',
            'sScope' => 'market',
            'sPageHandle' => BX_DOL_URL_STUDIO . 'store.php?page=goodies',
        ] as $sName => $mixedValue)
            if ($oClass->hasProperty($sName))
                (new ReflectionProperty($oOAuth, $sName))->setValue($oOAuth, $mixedValue);

        $sResult = $oOAuth->doAuthorize(false);
        $this->assertIsString($sResult);
        $this->assertStringContainsString(bx_html_attribute(BX_DOL_URL_STUDIO . 'settings.php?page=system&category=general'), $sResult);

        if (BxDolStudioOAuth::isAuthorizedClient())
            $this->markTestSkipped('This session is signed in to the market.');

        (new ReflectionProperty($oOAuth, 'sKey'))->setValue($oOAuth, 'test-key');
        (new ReflectionProperty($oOAuth, 'sSecret'))->setValue($oOAuth, 'test-secret');
        $sResult = $oOAuth->doAuthorize(false);
        $this->assertIsString($sResult);
        $this->assertStringContainsString('https://market.invalid/m/oauth2/auth', $sResult);
    }

    public function testPolyglotOpensOnLanguages(): void
    {
        $oPolyglot = new BxTemplStudioPolyglot('');
        $this->assertSame('pgt_languages', $this->prop($oPolyglot, 'sPage'));

        $aBlock = $this->call($oPolyglot, 'getPgtLanguages');
        $this->assertSame('_adm_lmi_cpt_pgt_languages', $aBlock['caption']);
        $this->assertSame(BX_DOL_URL_STUDIO . 'store.php', $aBlock['actions'][0]['url']);

        $sLang = getParam('lang_default');
        $aLanguage = BxDolDb::getInstance()->getRow("SELECT * FROM `sys_localization_languages` WHERE `Name` = :name", ['name' => $sLang]);
        $this->assertNotEmpty($aLanguage);
        // The classic grid prints its rows in the block; a grid drawn by AG Grid sends them as data, cell by cell.
        $sRows = $aBlock['content'];
        if (str_contains($sRows, 'bx-grid-ag-wrap')) {
            $aCells = [];
            $aData = $this->call(BxDolGrid::getObjectInstance('sys_studio_lang_languages'), '_getDataAg');
            array_walk_recursive($aData, function ($mixedValue) use (&$aCells) {
                if (is_string($mixedValue))
                    $aCells[] = $mixedValue;
            });
            $sRows = implode("
", $aCells);
        }

        $this->assertStringContainsString(bx_process_output($aLanguage['Title']), $sRows);
        // The status is a cell's whole text: between the cell's tags in the classic grid, a value of its own for AG Grid.
        $this->assertMatchesRegularExpression('/(^|>|
)' . preg_quote(_t('_adm_pgt_txt_status_default'), '/') . '(<|
|$)/', $sRows);

        $sModule = BxDolDb::getInstance()->getOne("SELECT `name` FROM `sys_modules` WHERE `type` = 'language' AND `uri` = :uri", ['uri' => $sLang]);
        if ($sModule)
            $this->assertStringContainsString('href="' . bx_html_attribute(BX_DOL_URL_STUDIO . 'language.php?name=' . $sModule) . '"', $sRows);
    }

    public function testLanguagesGridStatus(): void
    {
        $oGrid = BxDolGrid::getObjectInstance('sys_studio_lang_languages');
        $this->assertInstanceOf('BxTemplStudioPolyglotLanguages', $oGrid);

        $sDefault = getParam('lang_default');
        $this->assertSame('_adm_pgt_txt_status_default', $oGrid->getStatusKey(['name' => $sDefault, 'enabled' => 1]));
        $this->assertSame('_adm_pgt_txt_status_on', $oGrid->getStatusKey(['name' => $sDefault . 'x', 'enabled' => 1]));
        $this->assertSame('_adm_pgt_txt_status_off', $oGrid->getStatusKey(['name' => $sDefault . 'x', 'enabled' => 0]));
        $this->assertSame(BX_DOL_URL_STUDIO . 'language.php?name=bx_en', $oGrid->getLanguageUrl(['module' => 'bx_en']));
        $this->assertSame('', $oGrid->getLanguageUrl(['module' => null]));
    }

    public function testLanguageCategoriesShowModuleTitles(): void
    {
        $oDb = BxDolDb::getInstance();
        $aTitles = (new BxDolStudioPolyglotQuery())->getCategoryTitles();

        $iSystem = (int)$oDb->getOne("SELECT `ID` FROM `sys_localization_categories` WHERE `Name` = 'System'");
        $iCustom = (int)$oDb->getOne("SELECT `ID` FROM `sys_localization_categories` WHERE `Name` = 'Custom'");
        $this->assertSame('System', $aTitles[$iSystem]);
        $this->assertSame('Custom', $aTitles[$iCustom]);

        $aModules = $oDb->getAll("SELECT `tm`.`title`, `tc`.`ID` AS `category_id` FROM `sys_modules` AS `tm` INNER JOIN `sys_localization_categories` AS `tc` ON `tc`.`Name` = `tm`.`lang_category` WHERE `tm`.`name` IN ('bx_en', 'bx_artificer')");
        if (empty($aModules))
            $this->markTestSkipped('English and Artificer are not installed.');

        foreach ($aModules as $aModule)
            $this->assertSame($aModule['title'], $aTitles[$aModule['category_id']]);
        $this->assertNotContains('BoonEx English', $aTitles);
        $this->assertNotContains('Boonex Artificer Template', $aTitles);

        // A key of the English module's category names the module in Text Keys, and the grid sorts by that.
        $iKey = (int)$oDb->getOne("SELECT `tk`.`ID` FROM `sys_localization_keys` AS `tk` INNER JOIN `sys_localization_categories` AS `tc` ON `tc`.`ID` = `tk`.`IDCategory` WHERE `tc`.`Name` = 'BoonEx English' LIMIT 1");
        if ($iKey) {
            $aKey = (new BxDolStudioPolyglotQuery())->getKeyFullInfo($iKey);
            $this->assertSame('English', $aKey['module']);
        }

        $sSource = $oDb->getOne("SELECT `source` FROM `sys_objects_grid` WHERE `object` = 'sys_studio_lang_keys'");
        $this->assertStringContainsString('`tm`.`lang_category`=`tlc`.`Name`', $sSource);
    }
}
