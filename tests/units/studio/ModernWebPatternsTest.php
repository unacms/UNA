<?php

/**
 * Patterns Chrome's Modern Web Guidance scan asks for, kept on the files it found them missing in: sign-in fields
 * that say what they are to password managers, an Enter handler that leaves an input method's composition alone,
 * and the current DOM and array methods.
 */
class ModernWebPatternsTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testStudioSignInFieldsNameThemselvesForPasswordManagers(): void
    {
        $s = self::read('studio/template/login_form.html');

        $this->assertMatchesRegularExpression('/<input id="admin_email"[^>]*\sautocomplete="username"/', $s);
        $this->assertMatchesRegularExpression('/<input id="admin_password"[^>]*\sautocomplete="current-password"/', $s);
    }

    public function testEditorsEnterHandlerSkipsComposition(): void
    {
        $s = self::read('inc/js/editor.quill.js');

        $iGuard = strpos($s, 'if (event.isComposing || event.keyCode === 229)');
        $iEnter = strpos($s, "if (event.key === 'Enter' || event.keyCode === 13)");
        $this->assertNotFalse($iGuard);
        $this->assertNotFalse($iEnter);
        $this->assertLessThan($iEnter, $iGuard, 'The guard comes before the Enter test.');
    }

    public function testStudioScriptsUseCurrentMethods(): void
    {
        $this->assertStringNotContainsString("innerHTML = ''", self::read('studio/js/agents.js'));
        $this->assertSame(3, substr_count(self::read('studio/js/agents.js'), 'el.replaceChildren();'));
        $this->assertStringContainsString('aItems.toSorted(function(a, b) { return b.bytes - a.bytes; })', self::read('studio/js/dashboard.js'));
    }
}
