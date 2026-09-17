<?php

/**
 * Content-module search/browse modes via Posts SearchResult.
 */
class BxPostsSearchResultTest extends BxPostsTestCase
{
    public function testPublicMode()
    {
        $o = new BxPostsSearchResult('public');

        $this->assertFalse((bool)$o->isError);
        $this->assertSame('bx_posts', $o->aCurrent['module_name']);
        $this->assertSame('bx_posts_posts', $o->aCurrent['table']);
        $this->assertSame('last', $o->aCurrent['sorting']);
        $this->assertSame('active', $o->aCurrent['restriction']['status']['value']);
        $this->assertSame('active', $o->aCurrent['restriction']['statusAdmin']['value']);
        $this->assertSame('modules/?r=posts/rss/public', $o->aCurrent['rss']['link']);
        $this->assertArrayHasKey('statusAuthor', $o->aCurrent['restriction']);
    }

    public function testFeaturedPopularTopUpdatedModes()
    {
        $oFeatured = new BxPostsSearchResult('featured');
        $this->assertFalse((bool)$oFeatured->isError);
        $this->assertSame('featured', $oFeatured->aCurrent['sorting']);
        $this->assertSame('0', $oFeatured->aCurrent['restriction']['featured']['value']);

        $oPopular = new BxPostsSearchResult('popular');
        $this->assertSame('popular', $oPopular->aCurrent['sorting']);

        $oTop = new BxPostsSearchResult('top');
        $this->assertSame('top', $oTop->aCurrent['sorting']);

        $oUpdated = new BxPostsSearchResult('updated');
        $this->assertSame('updated', $oUpdated->aCurrent['sorting']);
        $this->assertSame('modules/?r=posts/rss/updated', $oUpdated->aCurrent['rss']['link']);
    }

    public function testSearchResultsModeDropsPaginationAndRss()
    {
        $o = new BxPostsSearchResult('');

        $this->assertFalse((bool)$o->isError);
        $this->assertArrayNotHasKey('perPage', $o->aCurrent['paginate']);
        $this->assertArrayNotHasKey('rss', $o->aCurrent);
    }

    public function testUnknownModeIsError()
    {
        $o = new BxPostsSearchResult('not-a-mode');
        $this->assertTrue((bool)$o->isError);
    }

    public function testAuthorAndContextWithoutProfileAreErrors()
    {
        $oAuthor = new BxPostsSearchResult('author', ['author' => 0]);
        $this->assertTrue((bool)$oAuthor->isError);

        $oContext = new BxPostsSearchResult('context', []);
        $this->assertTrue((bool)$oContext->isError);

        $oFollowed = new BxPostsSearchResult('followed_contexts', ['author' => 0]);
        $this->assertTrue((bool)$oFollowed->isError);

        $oFavorite = new BxPostsSearchResult('favorite', ['user' => 0]);
        $this->assertTrue((bool)$oFavorite->isError);
    }

    public function testAlterOrder()
    {
        $o = new BxPostsSearchResult('public');

        $o->aCurrent['sorting'] = 'last';
        $this->assertStringContainsString('`added` DESC', $o->getAlterOrder()['order']);

        $o->aCurrent['sorting'] = 'updated';
        $this->assertStringContainsString('`changed` DESC', $o->getAlterOrder()['order']);

        $o->aCurrent['sorting'] = 'featured';
        $this->assertStringContainsString('`featured` DESC', $o->getAlterOrder()['order']);

        $o->aCurrent['sorting'] = 'popular';
        $this->assertStringContainsString('`views` DESC', $o->getAlterOrder()['order']);

        $o->aCurrent['sorting'] = 'top';
        $aTop = $o->getAlterOrder();
        $this->assertArrayHasKey('order', $aTop);
        $this->assertNotSame('', $aTop['order']);
    }

    public function testAddConditionsForFilter()
    {
        $o = new BxPostsSearchResult('public');
        $CNF = $this->_oModule->_oConfig->CNF;

        $this->bxCallProtected($o, 'addConditionsForFilter', $CNF, 'public', [
            'filter' => ['field' => 'cat', 'value' => 4, 'operator' => 'in', 'table' => 'table'],
        ]);

        $this->assertSame(4, $o->aCurrent['restriction']['filter']['value']);
        $this->assertSame('cat', $o->aCurrent['restriction']['filter']['field']);
        $this->assertSame('in', $o->aCurrent['restriction']['filter']['operator']);
        $this->assertSame('bx_posts_posts', $o->aCurrent['restriction']['filter']['table']);
    }

    public function testGalleryUnitViewSwitchesTemplate()
    {
        $sPrev = bx_get('unit_view');
        $_GET['unit_view'] = 'gallery';
        try {
            $o = new BxPostsSearchResult('public');
            $oTemplate = new ReflectionProperty($o, 'sUnitTemplate');
            $oTemplate->setAccessible(true);
            $this->assertSame('unit_gallery.html', $oTemplate->getValue($o));
        } finally {
            if ($sPrev === false)
                unset($_GET['unit_view']);
            else
                $_GET['unit_view'] = $sPrev;
        }
    }
}
