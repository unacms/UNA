<?php

class BxDolStudioStoreTestProxy extends BxTemplStudioStore
{
    private $aRemoteProduct;
    private $aLocalProduct;

    public function __construct($mixedRemoteProduct, array $aLocalProduct)
    {
        $this->aRemoteProduct = $mixedRemoteProduct;
        $this->aLocalProduct = $aLocalProduct;
    }

    public function getProductResult($sModuleName)
    {
        return $this->getProduct($sModuleName);
    }

    protected function loadProduct($sModuleName)
    {
        return $this->aRemoteProduct;
    }

    protected function loadLocalProduct($sModuleName)
    {
        return $this->aLocalProduct;
    }
}

class BxDolStudioStoreTest extends BxDolTestCase
{
    public function testDownloadedModuleMetadataBacksProductPopupWhenMarketLookupFails()
    {
        $oStore = new BxDolStudioStoreTestProxy(array(), array(
            'name' => 'my_una_module_doctor',
            'title' => 'My UNA Module Doctor',
            'vendor' => 'My UNA World',
            'version' => '0.1.1',
            'note' => 'Studio-only compatibility and repair tooling.',
        ));

        $aResult = $oStore->getProductResult('my_una_module_doctor');

        $this->assertSame(BX_DOL_STUDIO_IU_RC_SUCCESS, $aResult['code']);
        $this->assertSame(0, $aResult['screenshots']);
        $this->assertStringContainsString('My UNA Module Doctor', $aResult['popup']);
        $this->assertStringContainsString('My UNA World', $aResult['popup']);
        $this->assertStringContainsString('0.1.1', $aResult['popup']);
        $this->assertStringContainsString(
            'Studio-only compatibility and repair tooling.',
            $aResult['popup']
        );
    }

    public function testMarketTransportFailureIsNotHiddenByLocalMetadata()
    {
        $oStore = new BxDolStudioStoreTestProxy(false, array(
            'name' => 'my_una_module_doctor',
            'title' => 'My UNA Module Doctor',
            'vendor' => 'My UNA World',
            'version' => '0.1.1',
            'note' => 'Studio-only compatibility and repair tooling.',
        ));

        $aResult = $oStore->getProductResult('my_una_module_doctor');

        $this->assertSame(BX_DOL_STUDIO_IU_RC_FAILED, $aResult['code']);
        $this->assertArrayNotHasKey('popup', $aResult);
    }

    public function testMissingMarketAndLocalMetadataKeepsNoProductError()
    {
        $oStore = new BxDolStudioStoreTestProxy(array(), array());

        $aResult = $oStore->getProductResult('missing_module');

        $this->assertSame(BX_DOL_STUDIO_IU_RC_FAILED, $aResult['code']);
        $this->assertArrayNotHasKey('popup', $aResult);
    }
}
