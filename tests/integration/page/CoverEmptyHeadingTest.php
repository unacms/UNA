<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A page without a cover gets a hidden <h1> with its title from the empty cover (BxBaseCover::displayEmpty), unless
 * the page says its content has the heading (BxDolCover::setPageHasHeading): the splash, with its own title.
 */
#[Group('integration')]
class CoverEmptyHeadingTest extends BxDolIntegrationTestCase
{
    protected $_sSavedHeader;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_sSavedHeader = BxDolTemplate::getInstance()->getPageHeader();
        BxDolTemplate::getInstance()->setPageHeader('Welcome to the <b>test</b> site');
    }

    protected function tearDown(): void
    {
        BxDolCover::getInstance()->setPageHasHeading(false);
        BxDolTemplate::getInstance()->setPageHeader($this->_sSavedHeader);

        parent::tearDown();
    }

    public function testAPageWithoutACoverHasAHiddenHeading(): void
    {
        $s = BxDolCover::getInstance()->displayEmpty();

        $this->assertStringContainsString('<h1 class="sr-only">Welcome to the test site</h1>', $s);
    }

    public function testAPageWithItsOwnHeadingHasNoHiddenOne(): void
    {
        BxDolCover::getInstance()->setPageHasHeading();

        $s = BxDolCover::getInstance()->displayEmpty();

        $this->assertStringNotContainsString('<h1', $s);
        $this->assertStringContainsString('bx-menu-toolbar-padding', $s, 'The room for the fixed header stays.');
    }
}
