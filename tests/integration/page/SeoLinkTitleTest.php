<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Content info of the 'home' page for SeoLinkTitleTest: counts title reads and gives out a set title.
 */
class SeoLinkTitleSpyContentInfo extends BxDolContentInfo
{
    public int $iTitleCalls = 0;
    public string $sTitle = '';

    public function __construct()
    {
        parent::__construct('');
    }

    public function getContentTitle ($iContentId)
    {
        ++$this->iTitleCalls;
        return $this->sTitle;
    }
}

/**
 * BxDolPage::transformSeoLink needs the content title (or the profile name) only to make the URI
 * of a new SEO link. A link that is in sys_seo_links already is given out without reading it.
 *
 * The core 'home' page is used, so no module has to be installed: its content info object
 * ('system') is replaced by a spy, and the SEO links option is turned on in memory only.
 * Every row the test makes is for that page and is deleted in tearDown.
 */
#[Group('integration')]
class SeoLinkTitleTest extends BxDolIntegrationTestCase
{
    private const CONTENT_INFO_KEY = 'BxDolContentInfo!system';
    private const OPTION = 'permalinks_seo_links';

    private ?SeoLinkTitleSpyContentInfo $_oSpy = null;
    private bool $_bContentInfoSet = false;
    private $_oContentInfoBackup = null;
    private array $_aOptionsBackup = [];
    private array $_aValues = [];
    private string $_sHome = 'home';

    protected function setUp(): void
    {
        parent::setUp();

        if (defined('BX_MULTISITE_MODULE'))
            $this->markTestSkipped('SEO links of a multisite install are checked by the multisite module.');

        $this->_aOptionsBackup[self::OPTION] = getParam(self::OPTION);
        $this->bxSetParamCache(self::OPTION, 'on');

        $this->_bContentInfoSet = isset($GLOBALS['bxDolClasses'][self::CONTENT_INFO_KEY]);
        $this->_oContentInfoBackup = $this->_bContentInfoSet ? $GLOBALS['bxDolClasses'][self::CONTENT_INFO_KEY] : null;
        $this->_oSpy = new SeoLinkTitleSpyContentInfo();
        $GLOBALS['bxDolClasses'][self::CONTENT_INFO_KEY] = $this->_oSpy;

        $aRewrites = BxDolPageQuery::getSeoUriRewrites();
        $this->_sHome = isset($aRewrites['home']) ? $aRewrites['home'] : 'home';
    }

    protected function tearDown(): void
    {
        foreach ($this->_aValues as $sValue)
            $this->deleteLink($sValue);

        if ($this->_oSpy) {
            if ($this->_bContentInfoSet)
                $GLOBALS['bxDolClasses'][self::CONTENT_INFO_KEY] = $this->_oContentInfoBackup;
            else
                unset($GLOBALS['bxDolClasses'][self::CONTENT_INFO_KEY]);
        }

        foreach ($this->_aOptionsBackup as $sName => $mixedValue)
            $this->bxSetParamCache($sName, $mixedValue);

        parent::tearDown();
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    /**
     * A param value no real link has, so neither sys_seo_links nor the memory of transformSeoLink knows it.
     */
    private function newValue(): string
    {
        $sValue = (string)(2000000000 + random_int(0, 99999999));
        $this->_aValues[] = $sValue;
        return $sValue;
    }

    private function deleteLink(string $sValue): void
    {
        BxDolDb::getInstance()->query("DELETE FROM `sys_seo_links` WHERE `module` = 'system' AND `page_uri` = 'home' AND `param_value` = :value", [
            'value' => $sValue,
        ]);
    }

    private function transform(string $sParam, string $sValue)
    {
        return BxDolPage::transformSeoLink('page.php?i=home&' . $sParam . '=' . $sValue, BX_DOL_URL_ROOT);
    }

    public function testExistingLinkDoesNotFetchTitle(): void
    {
        $sId = $this->newValue();
        BxDolPageQuery::insertSeoLink('system', 'home', 'id', $sId, 'seo-title-test-' . $sId);

        $this->assertSame(BX_DOL_URL_ROOT . $this->_sHome . '/seo-title-test-' . $sId, $this->transform('id', $sId));
        $this->assertSame(0, $this->_oSpy->iTitleCalls);
    }

    public function testNewLinkUsesTitle(): void
    {
        $sId = $this->newValue();
        $this->_oSpy->sTitle = 'Seo Title Test ' . $sId;

        $sLink = $this->transform('id', $sId);

        $aRow = BxDolPageQuery::getSeoLink('system', 'home', ['param_value' => $sId]);
        $this->assertNotEmpty($aRow);
        $this->assertSame(1, $this->_oSpy->iTitleCalls);
        $this->assertSame(BX_DOL_URL_ROOT . $this->_sHome . '/' . $aRow['uri'], $sLink);
        $this->assertStringStartsWith(uriFilter('Seo Title Test ' . $sId), $aRow['uri']);
    }

    public function testNewLinkWithEmptyTitleUsesHash(): void
    {
        $sId = $this->newValue();
        $this->_oSpy->sTitle = '';

        $this->transform('id', $sId);

        $aRow = BxDolPageQuery::getSeoLink('system', 'home', ['param_value' => $sId]);
        $this->assertNotEmpty($aRow);
        $this->assertSame(1, $this->_oSpy->iTitleCalls);
        $this->assertStringStartsWith(base_convert((string)sprintf('%u', crc32($sId . BX_DOL_SECRET)), 10, 36), $aRow['uri']);
    }

    public function testNewProfileLinkUsesDisplayName(): void
    {
        $oProfile = BxDolProfile::getInstanceByAccount($this->bxAccount('admin')->id());
        if (!$oProfile)
            $this->markTestSkipped('The admin account has no profile.');

        $sProfileId = (string)$oProfile->id();
        if (BxDolPageQuery::getSeoLink('system', 'home', ['param_value' => $sProfileId]))
            $this->markTestSkipped('A home page SEO link with this param value exists already.');
        $this->_aValues[] = $sProfileId;

        $sLink = $this->transform('profile_id', $sProfileId);

        $aRow = BxDolPageQuery::getSeoLink('system', 'home', ['param_value' => $sProfileId]);
        $this->assertNotEmpty($aRow);
        $this->assertSame('profile_id', $aRow['param_name']);
        $this->assertSame(BX_DOL_URL_ROOT . $this->_sHome . '/' . $aRow['uri'], $sLink);
        $this->assertStringStartsWith(uriFilter(BxTemplFunctions::getInstance()->getStringWithLimitedLength($oProfile->getDisplayName(), 45)), $aRow['uri']);
        $this->assertSame(0, $this->_oSpy->iTitleCalls);
    }
}
