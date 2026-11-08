<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Services whose guest answers browsers and shared caches may keep (bx_api_cache_response): menus and
 * the analytics tracker settings, and nothing that depends on the viewer.
 */
#[Group('integration')]
class CacheableServicesTest extends BxDolIntegrationTestCase
{
    public function testSystemMenusAreCacheable(): void
    {
        $this->assertTrue(BxDolService::call('system', 'is_cacheable_service', ['get_menu'], 'TemplServices'));
    }

    public function testViewerServicesAreNotCacheable(): void
    {
        foreach (['get_page_by_request', 'login_form', 'get_data_search_api', 'get_create_post_form'] as $sMethod)
            $this->assertFalse(BxDolService::call('system', 'is_cacheable_service', [$sMethod], 'TemplServices'), $sMethod);
    }

    public function testModuleBrowseIsNotCacheable(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('bx_posts is not installed.');

        $this->assertFalse(BxDolService::call('bx_posts', 'is_cacheable_service', ['browse']));
    }

    public function testTrackerConfigIsCacheable(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed.');

        $this->assertTrue(BxDolService::call('bx_analytics', 'is_cacheable_service', ['get_tracker_config']));
        $this->assertFalse(BxDolService::call('bx_analytics', 'is_cacheable_service', ['get_report']));
    }
}
