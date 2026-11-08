<?php

/**
 * Previous/next page buttons are named, a disabled one is not a link, and a page changed by
 * JavaScript still links to a real address that search engines can follow.
 */
class BxBasePaginateLinksTest extends BxDolTestCase
{
    protected $_aServerBackup;

    protected function setUp(): void
    {
        $this->_aServerBackup = $_SERVER;
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->_aServerBackup;
    }

    protected function paginate(array $aParams = []): string
    {
        $o = new BxTemplPaginate(array_merge([
            'start' => 0,
            'per_page' => 12,
            'num' => 13,
        ], $aParams));

        return $o->getPaginate();
    }

    protected function buttons(string $s): array
    {
        preg_match_all('/<a class="bx-btn bx-paginate-btn[^>]*>/', $s, $a);
        return $a[0];
    }

    public function testButtonsAreNamedAndDisabledOneIsNotALink()
    {
        $aButtons = $this->buttons($this->paginate(['page_url' => BX_DOL_URL_ROOT . 'posts-home?start={start}&per_page={per_page}']));
        $this->assertCount(2, $aButtons);

        list($sPrev, $sNext) = $aButtons;
        $this->assertStringContainsString('aria-label="' . bx_html_attribute(_t('_sys_paginate_prev')) . '"', $sPrev);
        $this->assertStringContainsString('role="link"', $sPrev, 'aria-label needs a role on an anchor without href');
        $this->assertStringContainsString('aria-disabled="true"', $sPrev);
        $this->assertStringNotContainsString('href=', $sPrev, 'a disabled button is not a link');

        $this->assertStringContainsString('aria-label="' . bx_html_attribute(_t('_sys_paginate_next')) . '"', $sNext);
        $this->assertStringContainsString('href="' . bx_html_attribute(BX_DOL_URL_ROOT . 'posts-home?start=12&per_page=12') . '"', $sNext);
        $this->assertStringNotContainsString('javascript:', $sNext);
    }

    public function testJavascriptPageGetsTheAddressOfThePage()
    {
        $_SERVER['REQUEST_URI'] = $this->path() . 'posts-home?dynamic=tab&pageBlock=179&_r=0.5&start=12&per_page=12&filter=x';

        $aButtons = $this->buttons($this->paginate([
            'start' => 12,
            'page_url' => 'javascript:void(0);',
            'on_change_page' => "return !loadDynamicBlockAutoPaginate(this, '{start}', '{per_page}');",
        ]));

        $this->assertCount(2, $aButtons);
        $this->assertStringContainsString('href="' . bx_html_attribute($this->root() . 'posts-home?filter=x&start=0&per_page=12') . '"', $aButtons[0]);
        $this->assertStringContainsString('href="' . bx_html_attribute($this->root() . 'posts-home?filter=x&start=24&per_page=12') . '"', $aButtons[1]);
        $this->assertStringContainsString("onclick=\"javascript:return !loadDynamicBlockAutoPaginate(this, '24', '12');", $aButtons[1]);
    }

    public function testKeywordSearchResultsLinkToTheSearchPage()
    {
        $_SERVER['REQUEST_URI'] = $this->path() . 'searchKeywordContent.php?searchMode=ajax&section%5B%5D=bx_posts&keyword=garden&start=3&per_page=3';

        $aButtons = $this->buttons($this->paginate([
            'start' => 3,
            'per_page' => 3,
            'num' => 4,
            'page_url' => 'javascript:void(0);',
            'on_change_page' => "return !loadDynamicBlockAuto(this, 'x');",
        ]));

        $this->assertStringContainsString('href="' . bx_html_attribute($this->root() . 'searchKeyword.php?section%5B0%5D=bx_posts&keyword=garden&start=6&per_page=3') . '"', $aButtons[1]);
    }

    public function testJavascriptPageWithoutHandlerStaysAsItIs()
    {
        $aButtons = $this->buttons($this->paginate(['page_url' => 'javascript:void(0);']));

        $this->assertStringContainsString('href="javascript:void(0);"', $aButtons[1]);
    }

    protected function root(): string
    {
        $a = parse_url(BX_DOL_URL_ROOT);
        $sPort = empty($a['port']) || 80 == $a['port'] || 443 == $a['port'] ? '' : ':' . $a['port'];
        return $a['scheme'] . '://' . $a['host'] . $sPort . $this->path();
    }

    protected function path(): string
    {
        $sPath = parse_url(BX_DOL_URL_ROOT, PHP_URL_PATH);
        return $sPath ? $sPath : '/';
    }
}
