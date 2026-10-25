<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The page head link previews read: text is escaped exactly once, and the oEmbed discovery link
 * resolves on a site installed in a sub-folder (a request uri there carries the folder, which
 * em.php couldn't resolve, so every lookup ended with 404). Needs no module.
 */
#[Group('integration')]
class LinkPreviewHeadTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_sRequestUriBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->_sRequestUriBackup = $_SERVER['REQUEST_URI'] ?? null;

        $this->bxBecomeGuest();
        BxDolTemplate::getInstance()->resetPageMeta();
    }

    protected function tearDown(): void
    {
        BxDolTemplate::getInstance()->resetPageMeta();
        BxDolTemplate::getInstance()->setPageHeader('');

        $_GET = $this->_aGetBackup ?? [];
        if ($this->_sRequestUriBackup === null)
            unset($_SERVER['REQUEST_URI']);
        else
            $_SERVER['REQUEST_URI'] = $this->_sRequestUriBackup;

        parent::tearDown();
    }

    public function testTextIsEscapedOnce(): void
    {
        unset($_GET['i']);

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageHeader('Tom &amp; "Jerry" <b>bold</b> it\'s');
        $oTemplate->setPageDescription('<p>R&amp;D "quoted" &lt;tag&gt;</p><p>Second</p>');
        $oTemplate->addPageMetaImage('https://example.com/a.jpg?x=1&y="2"');
        $sHead = $oTemplate->getMetaInfo();

        $this->assertStringContainsString('<meta property="og:title" content="Tom &amp; &quot;Jerry&quot; bold it&apos;s" />', $sHead);
        $this->assertStringContainsString('<meta property="og:description" content="R&amp;D &quot;quoted&quot; &lt;tag&gt; Second" />', $sHead);
        $this->assertStringContainsString('<meta name="description" content="R&amp;D &quot;quoted&quot; &lt;tag&gt; Second" />', $sHead);
        $this->assertStringNotContainsString('y="2"', $sHead, 'The image url doesn\'t break the attribute.');
        $this->assertStringContainsString('<meta property="og:site_name" content="', $sHead);
    }

    public function testNoEmptyDescription(): void
    {
        unset($_GET['i']);

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageHeader('LinkPreviewHeadTest');
        $sHead = $oTemplate->getMetaInfo();

        $this->assertStringNotContainsString('og:description', $sHead);
        $this->assertStringNotContainsString('name="description"', $sHead);
        $this->assertStringContainsString('<meta property="og:type" content="website" />', $sHead);
    }

    public function testOembedLinkResolvesInASubFolder(): void
    {
        $_SERVER['REQUEST_URI'] = '/una/about';
        $_GET['i'] = 'about';

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageHeader('About');
        $oTemplate->setPageUrl('page.php?i=about');
        $sHead = $oTemplate->getMetaInfo();

        $this->assertSame(1, preg_match('#em\.php\?url=([^&"]+)#', $sHead, $aMatch), 'The page has an oEmbed link.');
        $aEmbed = BxDolPage::getEmbedData(urldecode($aMatch[1]));
        $this->assertNotEmpty($aEmbed['title'] ?? '', 'em.php resolves it.');
        $this->assertStringContainsString('<meta property="og:url" content="' . BX_DOL_URL_ROOT, $sHead);
    }

    public function testHomeHasNoOembedLink(): void
    {
        $_GET['i'] = 'home';

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageHeader('Home');
        $oTemplate->setPageUrl(BX_DOL_URL_ROOT);
        $sHead = $oTemplate->getMetaInfo();

        $this->assertStringNotContainsString('application/json+oembed', $sHead, 'em.php has no page for the site root.');
        $this->assertStringContainsString('<link rel="canonical" href="' . BX_DOL_URL_ROOT . '" />', $sHead);
    }
}
