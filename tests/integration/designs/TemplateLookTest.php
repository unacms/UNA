<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * How Studio > Designer > Template sketches a template (BxDolStudioDesigner::getTemplateLook): its style options with its
 * default mix over them, safe values only (they go into a style attribute), and defaults for templates without styles.
 */
#[Group('integration')]
class TemplateLookTest extends BxDolIntegrationTestCase
{
    private const PREFIX = 'bx_looktest';

    protected function tearDown(): void
    {
        BxDolDb::getInstance()->query("DELETE FROM `sys_options` WHERE `name` LIKE :prefix", ['prefix' => self::PREFIX . '\_%']);
        BxDolDb::getInstance()->cacheParams(true, true);

        parent::tearDown();
    }

    public function testStylesBecomeTheSketchColors(): void
    {
        $this->addStyles([
            'body_bg_color' => 'rgb(1, 2, 3)',
            'header_bg_color' => 'rgba(255, 255, 255, 0.9)',
            'block_border_radius' => '6px',
            'font_family' => 'Inter, "Helvetica Neue", sans-serif',
            'button_nlp_bg_color' => '#1d4ed8',
        ]);

        $aVars = $this->look()['vars'];

        $this->assertSame('rgb(1, 2, 3)', $aVars['page']);
        $this->assertSame('rgba(255, 255, 255, 0.9)', $aVars['header']);
        $this->assertSame('#18181b', $aVars['header-ink'], 'dark text on a light header the styles give no text color for');
        $this->assertSame('6px', $aVars['radius']);
        $this->assertSame('Inter, "Helvetica Neue", sans-serif', $aVars['font']);
        $this->assertSame('#1d4ed8', $aVars['accent']);
    }

    public function testUnsafeValuesFallBack(): void
    {
        $this->addStyles([
            'body_bg_color' => 'red; } body { display: none',
            'block_border_radius' => 'expression(alert(1))',
            'font_family' => 'Arial; background: url(x)',
        ]);

        $aVars = $this->look()['vars'];

        $this->assertSame('#f4f4f5', $aVars['page']);
        $this->assertSame('12px', $aVars['radius']);
        $this->assertSame('system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', $aVars['font']);
        foreach ($aVars as $sKey => $sValue)
            $this->assertDoesNotMatchRegularExpression('/[;{}<>]/', $sValue, $sKey);
    }

    public function testATemplateWithoutStylesTakesItsThemeColorForTheHeader(): void
    {
        $aVars = $this->look()['vars'];

        $this->assertSame('#f4f4f5', $aVars['page']);
        $this->assertMatchesRegularExpression('/^#[0-9a-f]{3,8}$/', $aVars['header'], 'the theme color of the template meta');
        $this->assertSame('', $this->look()['mix']);
    }

    public function testTheDefaultMixWins(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_protean'))
            $this->markTestSkipped('Protean is not installed.');

        $iMix = (int)getParam('bx_protean_default_mix');
        if (!$iMix)
            $this->markTestSkipped('Protean has no default mix.');

        $sMixed = BxDolDb::getInstance()->getOne("SELECT `value` FROM `sys_options_mixes2options` WHERE `mix_id`=:mix AND `option`='bx_protean_body_bg_color'", ['mix' => $iMix]);
        if ($sMixed === false || $sMixed === '')
            $this->markTestSkipped('The default mix leaves the page color alone.');

        $aLook = $this->look(BxDolModuleQuery::getInstance()->getModuleByName('bx_protean'));

        $this->assertSame(trim($sMixed), $aLook['vars']['page']);
        $this->assertNotSame('', $aLook['mix'], 'the sketch names the preset');
    }

    private function addStyles(array $aStyles): void
    {
        foreach ($aStyles as $sKey => $sValue)
            BxDolDb::getInstance()->query("INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`) VALUES (0, :name, '', :value, 'digit')", [
                'name' => self::PREFIX . '_' . $sKey,
                'value' => $sValue,
            ]);
    }

    private function look(array $aModule = []): array
    {
        if (empty($aModule))
            $aModule = ['name' => self::PREFIX, 'path' => 'boonex/artificer/'];

        $oMethod = new ReflectionMethod('BxDolStudioDesigner', 'getTemplateLook');
        return $oMethod->invoke(new BxTemplStudioDesigner(BX_DOL_STUDIO_DSG_TYPE_GENERAL), $aModule);
    }
}
