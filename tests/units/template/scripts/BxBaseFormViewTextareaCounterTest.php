<?php

/**
 * A plain textarea with a length limit (maxlength, or the maximum of its Length checker) counts its characters under
 * it: "12 / 160", described by the field for screen readers. A field without a limit, a code field and a field with a
 * rich text editor have no counter.
 */
class BxBaseFormViewTextareaCounterTest extends BxDolTestCase
{
    private function field(array $aInput): string
    {
        $oForm = new BxTemplFormView(['form_attrs' => ['id' => 'phpunit-textarea-form', 'method' => 'post'], 'inputs' => []]);
        $aInput += ['type' => 'textarea', 'name' => 'about', 'value' => ''];

        return $oForm->genInputTextarea($aInput);
    }

    public function testLengthCheckerMaximumGivesACounter(): void
    {
        $sHtml = $this->field(['checker' => ['func' => 'Length', 'params' => ['min' => 0, 'max' => 160]], 'value' => 'Hello']);

        $this->assertMatchesRegularExpression('/<div id="(bx-form-input-counter-[A-Za-z0-9]+)" class="bx-form-input-counter[^"]*" data-bx-max="160"/', $sHtml);
        preg_match('/<div id="(bx-form-input-counter-[A-Za-z0-9]+)"/', $sHtml, $a);
        $this->assertStringContainsString('aria-describedby="' . $a[1] . '"', $sHtml);
        $this->assertStringContainsString('data-bx-counter="' . $a[1] . '"', $sHtml);
        $this->assertStringContainsString('>5 / 160<', $sHtml);
        $this->assertStringContainsString('role="status"', $sHtml, 'reaching the limit is said to screen readers');
    }

    public function testMaxlengthGivesACounterAndCountsCharactersNotBytes(): void
    {
        $sHtml = $this->field(['attrs' => ['maxlength' => 40], 'value' => "Привет, мир"]);

        $this->assertStringContainsString('data-bx-max="40"', $sHtml);
        $this->assertStringContainsString('>11 / 40<', $sHtml);
    }

    public function testCounterKeepsAnExistingDescription(): void
    {
        $sHtml = $this->field(['attrs' => ['maxlength' => 40, 'aria-describedby' => 'about-info']]);

        $this->assertMatchesRegularExpression('/aria-describedby="about-info bx-form-input-counter-[A-Za-z0-9]+"/', $sHtml);
    }

    public function testNoLimitNoCounter(): void
    {
        $this->assertStringNotContainsString('bx-form-input-counter', $this->field([]));
        $this->assertStringNotContainsString('bx-form-input-counter', $this->field(['checker' => ['func' => 'Avail']]));
    }

    public function testCodeFieldHasNoCounter(): void
    {
        $this->assertStringNotContainsString('bx-form-input-counter', $this->field(['code' => true, 'attrs' => ['maxlength' => 40]]));
    }

    public function testRichTextFieldHasNoCounter(): void
    {
        if (!BxDolEditor::getObjectInstance(false))
            $this->markTestSkipped('No HTML editor is installed.');

        $this->assertStringNotContainsString('bx-form-input-counter', $this->field(['html' => BX_EDITOR_STANDARD, 'checker' => ['func' => 'Length', 'params' => [0, 160]]]));
    }
}
