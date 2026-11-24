<?php

/**
 * Studio > Forms > Labels creates `new BxDolStudioFormsLabels(...)` (forms_labels.html), so the page loads the script that
 * defines it; without it the page threw "BxDolStudioFormsLabels is not defined".
 */
class FormsLabelsScriptTest extends BxDolTestCase
{
    public function testTheLabelsPageLoadsItsScript(): void
    {
        $sRoot = __DIR__ . '/../../../';

        $this->assertStringContainsString('new BxDolStudioFormsLabels(', file_get_contents($sRoot . 'studio/template/forms_labels.html'));
        $this->assertStringContainsString('function BxDolStudioFormsLabels(oOptions)', file_get_contents($sRoot . 'studio/js/forms_labels.js'));
        $this->assertStringContainsString("'forms_labels.js'", file_get_contents($sRoot . 'studio/template/scripts/BxBaseStudioFormsLabels.php'));
    }
}
