<?php

/**
 * Profile-module search/browse modes via Persons SearchResult.
 */
class BxPersonsSearchResultTest extends BxPersonsTestCase
{
    public function testRecentMode()
    {
        $o = new BxPersonsSearchResult('recent');

        $this->assertFalse((bool)$o->isError);
        $this->assertSame('bx_persons', $o->aCurrent['module_name']);
        $this->assertSame('sys_profiles', $o->aCurrent['table']);
        $this->assertSame('bx_persons_data', $o->aCurrent['tableSearch']);
        $this->assertSame('last', $o->aCurrent['sorting']);
        $this->assertSame('active', $o->aCurrent['restriction']['perofileStatus']['value']);
        $this->assertSame('bx_persons', $o->aCurrent['restriction']['perofileType']['value']);
        $this->assertSame('modules/?r=persons/rss/recent', $o->aCurrent['rss']['link']);
        $this->assertSame('unit_with_cover.html', $this->bxUnitTemplate($o));
    }

    public function testFeaturedActiveOnlineModes()
    {
        $oFeatured = new BxPersonsSearchResult('featured');
        $this->assertFalse((bool)$oFeatured->isError);
        $this->assertSame('featured', $oFeatured->aCurrent['sorting']);
        $this->assertSame('0', $oFeatured->aCurrent['restriction']['featured']['value']);

        $oActive = new BxPersonsSearchResult('active');
        $this->assertSame('active', $oActive->aCurrent['sorting']);
        $this->assertSame('modules/?r=persons/rss/active', $oActive->aCurrent['rss']['link']);

        $oOnline = new BxPersonsSearchResult('online');
        $this->assertSame('online', $oOnline->aCurrent['sorting']);
        $this->assertNotEmpty($oOnline->aCurrent['restriction']['online']['value']);
        $this->assertArrayHasKey('session', $oOnline->aCurrent['join']);
        $this->assertStringContainsString('`sys_accounts`.`profile_id`=`sys_profiles`.`id`', $oOnline->aCurrent['restriction_sql']);
    }

    public function testRecommendedMode()
    {
        $o = new BxPersonsSearchResult('recommended');

        $this->assertFalse((bool)$o->isError);
        $this->assertSame('recommended', $o->aCurrent['sorting']);
        $this->assertTrue($this->bxRecommendedView($o));
        $this->assertNotEmpty($o->aCurrent['restriction_sql']);
        $this->assertStringContainsString('IS NULL', $o->aCurrent['restriction_sql']);
        $this->assertArrayHasKey('recommended', $o->aCurrent['join']);
    }

    public function testSearchResultsModeDropsPaginationAndRss()
    {
        $o = new BxPersonsSearchResult('');

        $this->assertFalse((bool)$o->isError);
        $this->assertArrayNotHasKey('perPage', $o->aCurrent['paginate']);
        $this->assertArrayNotHasKey('rss', $o->aCurrent);
    }

    public function testUnknownModeIsError()
    {
        $o = new BxPersonsSearchResult('not-a-mode');
        $this->assertTrue((bool)$o->isError);
    }

    public function testFavoriteWithoutProfileIsError()
    {
        $o = new BxPersonsSearchResult('favorite', ['user' => 0]);
        $this->assertTrue((bool)$o->isError);
    }

    public function testConnectionsWithoutProfileDoesNotConfigure()
    {
        $o = new BxPersonsSearchResult('connections', []);
        $this->assertFalse((bool)$o->isError);
        $this->assertSame('', $o->aCurrent['rss']['link']);
    }

    public function testAlterOrder()
    {
        $o = new BxPersonsSearchResult('recent');

        $o->aCurrent['sorting'] = 'featured';
        $this->assertStringContainsString('`bx_persons_data`.`featured` DESC', $o->getAlterOrder()['order']);

        $o->aCurrent['sorting'] = 'recommended';
        $this->assertStringContainsString('RAND()', $o->getAlterOrder()['order']);

        $o->aCurrent['sorting'] = 'none';
        $this->assertSame([], $o->getAlterOrder());

        $o->aCurrent['sorting'] = 'active';
        $this->assertStringContainsString('`sys_accounts`.`logged` DESC', $o->getAlterOrder()['order']);

        $o->aCurrent['sorting'] = 'online';
        $this->assertStringContainsString('`sys_sessions`.`date` DESC', $o->getAlterOrder()['order']);

        $o->aCurrent['sorting'] = 'last';
        $this->assertStringContainsString('`bx_persons_data`.`added` DESC', $o->getAlterOrder()['order']);
    }

    public function testUnitViewParams()
    {
        $oSimple = new BxPersonsSearchResult('recent', ['unit_view' => 'simple']);
        $this->assertSame('unit_wo_links.html', $this->bxUnitTemplate($oSimple));

        $oWoInfo = new BxPersonsSearchResult('recent', ['unit_view' => 'unit_wo_info']);
        $this->assertSame('unit_wo_info.html', $this->bxUnitTemplate($oWoInfo));

        $oShowcase = new BxPersonsSearchResult('recent', ['unit_view' => 'showcase']);
        $this->assertSame('unit_with_cover_showcase.html', $this->bxUnitTemplate($oShowcase));
        $oShowcaseView = new ReflectionProperty($oShowcase, 'bShowcaseView');
        $oShowcaseView->setAccessible(true);
        $this->assertTrue($oShowcaseView->getValue($oShowcase));
    }

    public function testGetRssUnitImageEmpty()
    {
        $o = new BxPersonsSearchResult('recent');
        $a = ['picture' => 0];
        $this->assertSame('', $o->getRssUnitImage($a, 'picture'));
        $this->assertSame('', $o->getRssUnitImage($a, ''));
    }

    public function testGetPseud()
    {
        $o = new BxPersonsSearchResult('recent');
        $a = $this->bxCallProtected($o, '_getPseud');
        $this->assertSame('id', $a['id']);
        $this->assertSame('fullname', $a['fullname']);
        $this->assertSame('picture', $a['picture']);
    }

    protected function bxUnitTemplate($o): string
    {
        $oTemplate = new ReflectionProperty($o, 'sUnitTemplate');
        $oTemplate->setAccessible(true);
        return $oTemplate->getValue($o);
    }

    protected function bxRecommendedView($o): bool
    {
        $oProp = new ReflectionProperty($o, 'bRecommendedView');
        $oProp->setAccessible(true);
        return (bool)$oProp->getValue($o);
    }
}
