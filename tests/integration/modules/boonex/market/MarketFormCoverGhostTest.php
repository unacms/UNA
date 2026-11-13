<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Market adds Header Image ("cover") to its forms in API only, and the text modules' base form
 * renders the ghost template of any cover field. Market named no template for it, so every API
 * form of a signed-in member raised "Undefined property: BxMarketFormEntry::$_sGhostTemplateCover"
 * and a deprecation from the null template name. With display_errors on they were printed before
 * the JSON of a product page, which the app could not parse.
 */
#[Group('integration')]
class MarketFormCoverGhostTest extends BxDolIntegrationTestCase
{
    protected $_bApiBackup = false;
    protected $_iProfileIdBackup = 0;
    protected $_mixedApiGetBackup = null;
    protected $_iContentId = 0;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_market'))
            $this->markTestSkipped('Market is not installed.');

        $this->_mixedApiGetBackup = $_GET['api'] ?? null;
        $this->_bApiBackup = $this->moduleApi();
        $this->_iProfileIdBackup = (int)$this->moduleProfile()->getValue(BxDolModule::getInstance('bx_market'));
    }

    protected function tearDown(): void
    {
        if ($this->_mixedApiGetBackup === null)
            unset($_GET['api']);
        else
            $_GET['api'] = $this->_mixedApiGetBackup;

        if ($this->_iContentId)
            BxDolDb::getInstance()->query("DELETE FROM `bx_market_products` WHERE `id` = :id", ['id' => $this->_iContentId]);

        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_market')) {
            $this->moduleApi($this->_bApiBackup);
            $this->moduleProfile()->setValue(BxDolModule::getInstance('bx_market'), $this->_iProfileIdBackup);
            $this->unsetForms();
        }

        parent::tearDown();
    }

    /**
     * BxDolModule keeps one instance per process with the mode and the profile it was made with.
     */
    protected function moduleApi(?bool $bSet = null): bool
    {
        $oProperty = new ReflectionProperty(BxBaseModGeneralModule::class, '_bIsApi');
        $oModule = BxDolModule::getInstance('bx_market');

        $bResult = (bool)$oProperty->getValue($oModule);
        if ($bSet !== null)
            $oProperty->setValue($oModule, $bSet);

        return $bResult;
    }

    protected function moduleProfile(): ReflectionProperty
    {
        return new ReflectionProperty(BxBaseModGeneralModule::class, '_iProfileId');
    }

    protected function unsetForms(): void
    {
        foreach (['bx_market_entry_add', 'bx_market_entry_edit'] as $sDisplay)
            BxDolForm::unSetObjectInstance('bx_market', $sDisplay);
    }

    /**
     * The form as an API request of the signed-in admin gets it, with everything PHP reported
     * while it was made and its values were set.
     *
     * @return array{0: BxMarketFormEntry, 1: list<string>}
     */
    protected function apiForm(string $sDisplay, array $aValues = []): array
    {
        $this->bxLoginAsAdmin();

        $_GET['api'] = 1;
        $this->moduleApi(true);
        $this->moduleProfile()->setValue(BxDolModule::getInstance('bx_market'), (int)bx_get_logged_profile_id());
        $this->unsetForms();

        // PHPUnit lowers error_reporting() while a test runs, so the handler takes its own mask.
        $aReported = [];
        set_error_handler(function ($iLevel, $sMessage, $sFile, $iLine) use (&$aReported) {
            $aReported[] = $sMessage . ' in ' . $sFile . ':' . $iLine;
            return true;
        }, E_WARNING | E_NOTICE | E_DEPRECATED);

        try {
            $oForm = BxDolForm::getObjectInstance('bx_market', $sDisplay);
            $this->assertInstanceOf(BxMarketFormEntry::class, $oForm);

            $oForm->initChecker($aValues);
        }
        finally {
            restore_error_handler();
        }

        return [$oForm, $aReported];
    }

    public function testTextModulesFormNamesCoverGhostTemplate(): void
    {
        $oClass = new ReflectionClass(BxBaseModTextFormEntry::class);

        $this->assertTrue($oClass->hasProperty('_sGhostTemplateCover'), 'A text module with a cover field and no template of its own takes the base one.');
        $this->assertSame('form_ghost_template_cover.html', $oClass->getDefaultProperties()['_sGhostTemplateCover']);
    }

    public function testApiAddFormCoverRaisesNothing(): void
    {
        [$oForm, $aReported] = $this->apiForm('bx_market_entry_add');

        $this->assertSame([], $aReported);
        $this->assertArrayHasKey('cover', $oForm->aInputs, 'Header Image is in the API form of a member allowed to set it.');
        $this->assertStringContainsString('bx-uploader-ghost', (string)$oForm->aInputs['cover']['ghost_template'], 'The cover ghost is the text modules\' base template.');
    }

    public function testApiEditFormCoverRaisesNothing(): void
    {
        // The test makes its own product and removes it, so it runs on a site with no products.
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_market_products` SET `author` = :author, `added` = :now, `changed` = :now, `thumb` = 0, `cover` = 0, `cover_raw` = '', `name` = :name, `title` = 'MarketFormCoverGhostTest product', `text` = '', `notes` = '', `notes_purchased` = '', `cat` = 0, `labels` = '', `location` = ''", [
            'author' => (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('admin')->id()),
            'now' => time(),
            'name' => 'market-form-cover-ghost-test-' . uniqid(),
        ]);
        $this->_iContentId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $this->_iContentId, 'The fixture product was not created.');

        $aProduct = $oDb->getRow("SELECT * FROM `bx_market_products` WHERE `id` = :id", ['id' => $this->_iContentId]);

        [$oForm, $aReported] = $this->apiForm('bx_market_entry_edit', $aProduct);

        $this->assertSame([], $aReported);
        $this->assertArrayHasKey('cover', $oForm->aInputs);
        $this->assertSame((int)$aProduct['id'], (int)$oForm->aInputs['cover']['content_id']);
        $this->assertStringContainsString('bx-uploader-ghost', (string)$oForm->aInputs['cover']['ghost_template']);
    }
}
