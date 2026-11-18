<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Designer > Settings > Corners: what the page head carries for each corner size, with and without
 * smooth corners (BxBaseFunctions::getInjHeadDesignRadius).
 */
#[Group('integration')]
class DesignRadiusHeadTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['sys_design_radius', 'sys_design_radius_smooth', 'sys_design_radius_smooth_factor'];

    private array $_aOptionsBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
    }

    protected function tearDown(): void
    {
        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        parent::tearDown();
    }

    private function head(string $sSize, string $sSmooth, string $sFactor): string
    {
        setParam('sys_design_radius', $sSize);
        setParam('sys_design_radius_smooth', $sSmooth);
        setParam('sys_design_radius_smooth_factor', $sFactor);

        $oMethod = new ReflectionMethod(BxTemplFunctions::class, 'getInjHeadDesignRadius');

        return (string)$oMethod->invoke(BxTemplFunctions::getInstance());
    }

    public function testTheDesignsOwnCornersPrintNothing(): void
    {
        $this->assertSame('', $this->head('large', '', '1.5'));
        $this->assertSame('', $this->head('unknown', '', '1.5'), 'An unknown size is the default one.');
    }

    public static function sizes(): array
    {
        return [['small', '0.75'], ['none', '0']];
    }

    #[DataProvider('sizes')]
    public function testSizeIsAFactorOfTheRadii(string $sSize, string $sFactor): void
    {
        $s = $this->head($sSize, '', '1.5');

        $this->assertStringContainsString('--bx-radius-size: ' . $sFactor . ';', $s);
        $this->assertStringNotContainsString('corner-shape', $s);
    }

    public static function factors(): array
    {
        return [['1.75', '1.75'], ['1.5', '1.5'], ['2', '2'], ['1.25', '1.25'], ['0', '1'], ['9', '3'], ['abc', '1']];
    }

    #[DataProvider('factors')]
    public function testSmoothCornersMultiplyTheRadiiWhereSupported(string $sSaved, string $sPrinted): void
    {
        $s = $this->head('large', 'on', $sSaved);

        $this->assertStringContainsString('--bx-radius-size: 1;', $s);
        $this->assertMatchesRegularExpression('/@supports \(corner-shape: squircle\) \{\s*:root \{\s*--bx-radius-smooth: ' . preg_quote($sPrinted, '/') . ';/', $s);
        $this->assertStringContainsString('corner-shape: squircle;', $s);
    }

    public function testNoCornersAreNeverSmooth(): void
    {
        $s = $this->head('none', 'on', '1.5');

        $this->assertStringContainsString('--bx-radius-size: 0;', $s);
        $this->assertStringNotContainsString('corner-shape', $s);
    }

    public function testDesignerOffersTheSizes(): void
    {
        $o = new BxTemplStudioDesigner();

        $this->assertSame(['large', 'small', 'none'], array_keys($o->getSettingsRadiusList()));
    }
}
