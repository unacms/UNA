<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A content item's card in a gallery (unit_gallery.html of posts, ads, polls, albums, videos, photos, files, market,
 * snipcart) is drawn as the apps draw it (modules/base/general/template/css/unit_content_card.css; NEO:
 * UnitContentCard): the picture where the item has one and no empty box where it has none, the title, the summary,
 * and the byline (the snippet meta menu) with the author's avatar before the name. Away from a card the author stays
 * a plain name.
 *
 * The apps get the card's data without the site's markup: a menu item drawn as HTML (a line break, polls' switcher)
 * is left out, and a price comes as the site's text, in the seller's currency (`price_text`).
 */
#[Group('integration')]
class ContentCardTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();

        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts is not installed.');

        $this->_aGetBackup = $_GET;
        unset($_GET['api']);
        unset($GLOBALS['bxDolClasses']['BxDolMenu!bx_posts_snippet_meta']);
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup ?? [];
        unset($GLOBALS['bxDolClasses']['BxDolMenu!bx_posts_snippet_meta'], $GLOBALS['bxDolClasses']['BxDolMenu!bx_polls_snippet_meta']);

        parent::tearDown();
    }

    /** The newest public post without and with a picture: [content id or 0, content id or 0]. */
    protected function posts(): array
    {
        $oModule = BxDolModule::getInstance('bx_posts');
        $CNF = $oModule->_oConfig->CNF;

        $iText = $iPicture = 0;
        foreach(BxDolDb::getInstance()->getColumn("SELECT `id` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_STATUS'] . "` = 'active' AND `" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` = '" . BX_DOL_PG_ALL . "' ORDER BY `id` DESC LIMIT 50") as $iId) {
            $aData = $oModule->_oDb->getContentInfoById((int)$iId);
            if(!$aData)
                continue;
            if(empty($aData[$CNF['FIELD_THUMB']]) && !$iText)
                $iText = (int)$iId;
            if(!empty($aData[$CNF['FIELD_THUMB']]) && !$iPicture)
                $iPicture = (int)$iId;
        }

        return [$iText, $iPicture];
    }

    protected function unit(int $iContentId, string $sTemplate): string
    {
        unset($GLOBALS['bxDolClasses']['BxDolMenu!bx_posts_snippet_meta']);

        $oModule = BxDolModule::getInstance('bx_posts');
        $aData = $oModule->_oDb->getContentInfoById($iContentId);
        $this->assertIsArray($aData);

        return (string)$oModule->_oTemplate->unit($aData, true, $sTemplate);
    }

    public function testATextPostIsATextCard(): void
    {
        list($iText) = $this->posts();
        if(!$iText)
            $this->markTestSkipped('The site has no public post without a picture.');

        $this->bxBecomeGuest();
        $sCard = $this->unit($iText, 'unit_gallery.html');

        $this->assertStringContainsString('bx-base-content-card', $sCard);
        $this->assertStringContainsString('class="bx-base-content-card-title"', $sCard);
        $this->assertStringNotContainsString('bx-base-content-card-media', $sCard, 'No empty box in the picture\'s place.');
        $this->assertStringNotContainsString('bx-base-text-unit-no-thumb', $sCard);
    }

    public function testAPictureIsTheCardsMedia(): void
    {
        list(, $iPicture) = $this->posts();
        if(!$iPicture)
            $this->markTestSkipped('The site has no public post with a picture.');

        $this->bxBecomeGuest();
        $sCard = $this->unit($iPicture, 'unit_gallery.html');

        $this->assertStringContainsString('bx-base-content-card-media', $sCard);
        $this->assertMatchesRegularExpression('/bx-base-content-card-img" style="background-image:url\(https?:/', $sCard);
    }

    public function testTheBylineHasTheAuthorsAvatarOnACardOnly(): void
    {
        list($iText, $iPicture) = $this->posts();
        $iId = $iText ?: $iPicture;
        if(!$iId)
            $this->markTestSkipped('The site has no public post.');

        $this->bxBecomeGuest();

        $sCard = $this->unit($iId, 'unit_gallery.html');
        if(strpos($sCard, 'bx-base-text-unit-author') === false)
            $this->markTestSkipped('The posts\' snippet meta menu has no author item.');
        $this->assertStringContainsString('bx-base-content-card-author-ava', $sCard);
        $this->assertDoesNotMatchRegularExpression('/<a [^>]*bx-base-content-card-author[^>]*>(?:(?!<\/a>).)*<a /s', $sCard, 'No link inside the author\'s link.');

        $sExtended = $this->unit($iId, 'unit.html');
        $this->assertStringNotContainsString('bx-base-content-card-author-ava', $sExtended, 'Away from a card the author stays a plain name.');
    }

    public function testTheAppsGetNoSiteMarkupInAMenu(): void
    {
        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_polls'))
            $this->markTestSkipped('Polls is not installed.');

        $oModule = BxDolModule::getInstance('bx_polls');
        $iId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `" . $oModule->_oConfig->CNF['TABLE_ENTRIES'] . "` ORDER BY `id` DESC LIMIT 1");
        if(!$iId)
            $this->markTestSkipped('The site has no poll.');

        $_GET['api'] = 1;
        unset($GLOBALS['bxDolClasses']['BxDolMenu!bx_polls_snippet_meta']);
        $oMenu = BxDolMenu::getObjectInstance('bx_polls_snippet_meta');
        $oMenu->setContentId($iId);

        foreach((array)($oMenu->getCodeAPI()['items'] ?? []) as $mixedItem)
            $this->assertIsArray($mixedItem, 'An item the apps get is data, never the site\'s markup: ' . (is_string($mixedItem) ? substr(trim($mixedItem), 0, 60) : gettype($mixedItem)));
    }

    public function testPricesComeAsTheSitesText(): void
    {
        $oQuery = BxDolModuleQuery::getInstance();
        if($oQuery->isEnabledByName('bx_market')) {
            $oModule = BxDolModule::getInstance('bx_market');
            $CNF = $oModule->_oConfig->CNF;
            $aFree = [$CNF['FIELD_AUTHOR'] => 1, $CNF['FIELD_PRICE_SINGLE'] => 0, $CNF['FIELD_PRICE_RECURRING'] => 0, $CNF['FIELD_DURATION_RECURRING'] => 'month'];
            $this->assertSame(_t('_bx_market_txt_price_free'), $oModule->getPriceText($aFree));
            $sSingle = $oModule->getPriceText(array_merge($aFree, [$CNF['FIELD_PRICE_SINGLE'] => 12]), '€');
            $this->assertStringContainsString('€', $sSingle);
            $this->assertStringContainsString('12', $sSingle);
            $sRecurring = $oModule->getPriceText(array_merge($aFree, [$CNF['FIELD_PRICE_SINGLE'] => 12, $CNF['FIELD_PRICE_RECURRING'] => 5]), '€');
            $this->assertStringContainsString('5', $sRecurring, 'The recurring price wins.');
            $this->assertStringNotContainsString('12', $sRecurring);
        }

        if($oQuery->isEnabledByName('bx_ads')) {
            $oModule = BxDolModule::getInstance('bx_ads');
            $CNF = $oModule->_oConfig->CNF;
            $this->assertSame(_t('_bx_ads_txt_free'), $oModule->getPriceText([$CNF['FIELD_AUTHOR'] => 1, $CNF['FIELD_PRICE'] => 0]));
            $this->assertStringContainsString('30', $oModule->getPriceText([$CNF['FIELD_AUTHOR'] => 1, $CNF['FIELD_PRICE'] => 30]));
        }

        if(!$oQuery->isEnabledByName('bx_market') && !$oQuery->isEnabledByName('bx_ads'))
            $this->markTestSkipped('Neither Market nor Ads is installed.');
    }

    /** Courses, channels and jobs are contexts: their gallery card is the context card (GroupsCardTest). */
    public function testContextsUseTheContextCard(): void
    {
        $oCard = new ReflectionMethod(BxBaseModProfileTemplate::class, '_isUnitCard');
        $iChecked = 0;

        foreach(['bx_courses', 'bx_channels', 'bx_jobs'] as $sModule) {
            if(!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
                continue;

            $oTemplate = BxDolModule::getInstance($sModule)->_oTemplate;
            if($oTemplate instanceof BxDolModuleProxy)
                $oTemplate = (new ReflectionProperty(BxDolModuleProxy::class, '_oProxifiedObject'))->getValue($oTemplate);

            $this->assertTrue($oCard->invoke($oTemplate, 'unit.html'), $sModule);
            $this->assertNotSame('_' . $sModule . '_txt_unit_view', _t('_' . $sModule . '_txt_unit_view'), $sModule . ': its "View" string');
            $iChecked++;
        }

        if(!$iChecked)
            $this->markTestSkipped('No course, channel or job module is installed.');
    }
}
