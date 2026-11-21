<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Inner pages' <title> names the site ("Posts · Site"), a title that names the site already is kept, and pages that
 * show a message (not found, no access) ask not to be indexed.
 */
#[Group('integration')]
class PageTitleWithSiteTest extends BxDolIntegrationTestCase
{
    private string $_sSiteTitle = '';

    protected function setUp(): void
    {
        parent::setUp();
        $this->_sSiteTitle = (string)getParam('site_title');
        setParam('site_title', 'Harbor Club');
    }

    protected function tearDown(): void
    {
        setParam('site_title', $this->_sSiteTitle);
        parent::tearDown();
    }

    public function testTitleNamesTheSite(): void
    {
        $oTemplate = BxDolTemplate::getInstance();

        $this->assertSame(_t('_sys_page_title_with_site', 'Posts', 'Harbor Club'), $oTemplate->getPageTitleWithSite('Posts'));
        $this->assertStringContainsString('Posts', $oTemplate->getPageTitleWithSite('Posts'));
        $this->assertStringContainsString('Harbor Club', $oTemplate->getPageTitleWithSite('Posts'));

        // The home page's "Welcome to Harbor Club" names it already, in any case.
        $this->assertSame('Welcome to harbor club', $oTemplate->getPageTitleWithSite('Welcome to harbor club'));
        $this->assertSame('Harbor Club: rules', $oTemplate->getPageTitleWithSite('Harbor Club: rules'));
        $this->assertSame('Harbor Club', $oTemplate->getPageTitleWithSite(''));

        // A word that only starts like the site's name doesn't count.
        setParam('site_title', 'UNA');
        $this->assertSame(_t('_sys_page_title_with_site', 'Unanswered questions', 'UNA'), $oTemplate->getPageTitleWithSite('Unanswered questions'));
        $this->assertSame('UNA', $oTemplate->getPageTitleWithSite('  '));
    }

    public function testAuthPagesAskNotToBeIndexed(): void
    {
        foreach (['sys_login', 'sys_create_account', 'sys_forgot_password'] as $sObject) {
            $aObject = BxDolPageQuery::getPageObject($sObject);
            $this->assertIsArray($aObject, $sObject);
            $this->assertStringContainsString('noindex', $aObject['meta_robots'], $sObject);
            // One layout: no cover, the block's title is the page's heading.
            $this->assertSame(0, (int)$aObject['cover'], $sObject);
        }
    }
}
