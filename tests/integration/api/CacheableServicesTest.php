<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Services whose guest answers browsers and shared caches may keep (bx_api_cache_response): menus
 * that don't read request headers, and the analytics tracker settings for a named platform.
 */
#[Group('integration')]
class CacheableServicesTest extends BxDolIntegrationTestCase
{
    protected function isCacheable($sModule, $sMethod, $aParams = [], $sClass = 'Module')
    {
        return BxDolService::call($sModule, 'is_cacheable_service', [$sMethod, $aParams], $sClass, true);
    }

    public function testSystemMenusAreCacheable(): void
    {
        $this->assertTrue($this->isCacheable('system', 'get_menu', ['{"object":"sys_site","params":null}'], 'TemplServices'));
        $this->assertTrue($this->isCacheable('system', 'get_menu', [['object' => 'sys_footer']], 'TemplServices'));
    }

    public function testMenusReadingRequestHeadersAreNotCacheable(): void
    {
        if (!BxDolMenu::getObjectInstance('sys_switch_template'))
            $this->markTestSkipped('sys_switch_template is not installed.');

        $this->assertFalse($this->isCacheable('system', 'get_menu', ['{"object":"sys_switch_template","params":null}'], 'TemplServices'));
    }

    public function testMenuRequestsWithoutAMenuAreNotCacheable(): void
    {
        $this->assertFalse($this->isCacheable('system', 'get_menu', [], 'TemplServices'));
        $this->assertFalse($this->isCacheable('system', 'get_menu', ['{"object":"no_such_menu_object"}'], 'TemplServices'));
        $this->assertFalse($this->isCacheable('system', 'get_menu', ['not json'], 'TemplServices'));
    }

    public function testViewerServicesAreNotCacheable(): void
    {
        foreach (['get_page_by_request', 'login_form', 'get_data_search_api', 'get_create_post_form'] as $sMethod)
            $this->assertFalse($this->isCacheable('system', $sMethod, [], 'TemplServices'), $sMethod);
    }

    public function testModuleBrowseIsNotCacheable(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('bx_posts is not installed.');

        $this->assertFalse($this->isCacheable('bx_posts', 'browse'));
    }

    public function testTrackerConfigIsCacheableForANamedPlatform(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed.');

        $this->assertTrue($this->isCacheable('bx_analytics', 'get_tracker_config', ['next-web']));
        // Without the platform the service reads it from the request headers.
        $this->assertFalse($this->isCacheable('bx_analytics', 'get_tracker_config', []));
        $this->assertFalse($this->isCacheable('bx_analytics', 'get_tracker_config', ['']));
        $this->assertFalse($this->isCacheable('bx_analytics', 'get_report'));
    }
}
