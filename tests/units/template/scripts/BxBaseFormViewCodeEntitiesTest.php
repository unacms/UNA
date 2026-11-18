<?php

/**
 * A code field (Studio > Designer > Splash, Injections) shows the code as it is stored. An entity in the code was
 * printed into the <textarea> as it is, so the browser showed its character and the save stored the character:
 * "&copy;" became the copyright sign and "&lt;" became "<".
 */
class BxBaseFormViewCodeEntitiesTest extends BxDolTestCase
{
    private const CODE = "<p class=\"a\">&copy; {site_title} &lt;b&gt; &amp;amp; it's</p>\r\n<bx_text:_sys_txt_splash_title />";

    /**
     * What the browser puts in the field: the text of the <textarea>, entities read once.
     */
    private function shownInField(array $aInput): string
    {
        $oForm = new BxTemplFormView(['form_attrs' => ['id' => 'phpunit-code-form', 'method' => 'post'], 'inputs' => []]);
        $aInput += ['type' => 'textarea', 'name' => 'code', 'value' => self::CODE];

        $sHtml = $oForm->genInputTextarea($aInput);
        if (!preg_match('/<textarea\b[^>]*>(.*)<\/textarea>/s', $sHtml, $aMatch))
            $this->fail('No <textarea> in the field.');

        return html_entity_decode($aMatch[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    public function testCodeFieldShowsTheCodeAsItIsStored(): void
    {
        $this->assertSame(self::CODE, $this->shownInField(['code' => true]));
    }

    public function testCodeFieldKeepsAnEntityAsAnEntity(): void
    {
        $s = $this->shownInField(['code' => true]);

        $this->assertStringContainsString('&copy;', $s);
        $this->assertStringContainsString('&lt;b&gt;', $s);
        $this->assertStringNotContainsString("\u{00A9}", $s);
    }

    public function testCodeFieldCannotCloseItsTextarea(): void
    {
        $oForm = new BxTemplFormView(['form_attrs' => ['id' => 'phpunit-code-form', 'method' => 'post'], 'inputs' => []]);
        $aInput = ['type' => 'textarea', 'name' => 'code', 'code' => true, 'value' => '</textarea><script>alert(1)</script>'];

        $sHtml = $oForm->genInputTextarea($aInput);

        $this->assertSame(1, substr_count($sHtml, '</textarea>'));
        $this->assertStringNotContainsString('<script>alert(1)</script>', $sHtml);
    }
}
