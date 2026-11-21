<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The default /robots.txt names /sitemap.xml, and the sitemap lists only what a guest can open: the guests' menu
 * links without pages that ask not to be indexed, and public, active entries (BxDolSitemap).
 */
#[Group('integration')]
class SitemapTest extends BxDolIntegrationTestCase
{
    private array $_aPosts = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aPosts as $iId) {
            BxDolPage::deleteSeoLink('bx_posts', 'bx_posts', $iId);
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iId]);
        }

        parent::tearDown();
    }

    public function testRobotsTxtNamesTheSitemap(): void
    {
        $sRobots = BxDolSitemap::getInstance()->getRobotsTxt();

        $this->assertStringStartsWith("User-agent: *\n", $sRobots);
        $this->assertStringContainsString("\nSitemap: " . BX_DOL_URL_ROOT . "sitemap.xml\n", $sRobots);
        $this->assertStringContainsString('Disallow: ' . rtrim((string)parse_url(BX_DOL_URL_ROOT, PHP_URL_PATH), '/') . '/' . BX_DOL_STUDIO_FOLDER . '/', $sRobots);
    }

    public function testRewriteRulesServeRobotsAndSitemap(): void
    {
        $aServices = [];
        foreach (BxDolRewriteRulesQuery::getActiveRules() as $a)
            foreach (['robots.txt', 'sitemap.xml'] as $sPath)
                if (preg_match('#' . $a['preg'] . '#i', $sPath))
                    $aServices[$sPath] = unserialize($a['service'])['method'] ?? '';

        $this->assertSame(['robots.txt' => 'robots_txt', 'sitemap.xml' => 'sitemap_xml'], $aServices);
        $this->assertFalse((bool)preg_match('#^robots\.txt$#i', 'robots-txt'), 'the dot is escaped');
    }

    public function testSitemapListsOnlyPublicContent(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts is not installed.');

        $iPublic = $this->_addPost('SitemapTest public post', BX_DOL_PG_ALL);
        $iFriends = $this->_addPost('SitemapTest friends post', '5');
        $iHidden = $this->_addPost('SitemapTest hidden post', BX_DOL_PG_ALL, ['status' => 'hidden']);
        $iPending = $this->_addPost('SitemapTest pending post', BX_DOL_PG_ALL, ['status_admin' => 'pending']);

        $aLinks = array_column(BxDolSitemap::getInstance()->getUrls(), 'loc');
        $fUrl = fn(int $iId) => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=view-post&id=' . $iId));

        $this->assertContains(BX_DOL_URL_ROOT, $aLinks);
        $this->assertContains($fUrl($iPublic), $aLinks);
        foreach ([$iFriends, $iHidden, $iPending] as $iId)
            $this->assertNotContains($fUrl($iId), $aLinks);

        // Sign in and Sign up are in the guests' menus but ask not to be indexed.
        foreach (['login', 'create-account'] as $sUri)
            $this->assertNotContains(bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $sUri)), $aLinks);

        $this->assertSame(count($aLinks), count(array_unique($aLinks)), 'no link twice');
    }

    public function testSitemapXmlIsValid(): void
    {
        $sXml = BxDolSitemap::getInstance()->getSitemapXml(false);

        $oXml = simplexml_load_string($sXml);
        $this->assertNotFalse($oXml);
        $this->assertSame('urlset', $oXml->getName());
        $this->assertSame('http://www.sitemaps.org/schemas/sitemap/0.9', $oXml->getNamespaces()[''] ?? '');
        $this->assertGreaterThan(0, count($oXml->children()));
    }

    private function _addPost(string $sTitle, string $sAllowView, array $aFields = []): int
    {
        $iNow = time();
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_posts_posts` SET " . $oDb->arrayToSQL(array_merge([
            'author' => 1, 'added' => $iNow, 'changed' => $iNow, 'published' => $iNow,
            'thumb' => 0, 'thumb_data' => '', 'title' => $sTitle, 'cat' => 0, 'multicat' => '',
            'abstract' => '', 'text' => '<p>' . $sTitle . '</p>', 'labels' => '', 'location' => '',
            'allow_view_to' => $sAllowView, 'status' => 'active', 'status_admin' => 'active',
        ], $aFields)));

        return $this->_aPosts[] = (int)$oDb->lastId();
    }
}
