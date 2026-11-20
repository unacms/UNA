<?php

/**
 * The Studio login page (BxBaseStudioFunctions::getLoginForm, a clear page: studio/template/page_2.html) shows its form as a card on
 * every screen: a phone gets the device width and the same card, not the full screen sheet media-phone.css makes of other popups.
 */
class LoginPageTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testClearPageHasTheViewport(): void
    {
        // without it a phone lays the page out 980px wide and zooms it out
        $this->assertStringContainsString('<meta name="viewport" content="__page_viewport__" />', self::read('studio/template/page_2.html'));
    }

    public function testLoginBoxIsNotAFullScreenPopup(): void
    {
        // dolPopup marks every popup responsive, and media-phone.css stretches responsive popups over the screen
        $this->assertStringContainsString("}).removeClass('bx-popup-responsive');", self::read('studio/js/login.js'));
        $this->assertStringContainsString('.bx-media-phone .bx-popup-responsive .bx-popup-box {', self::read('template/css/media-phone.css'));
    }

    public function testLoginCardFitsAPhone(): void
    {
        $s = self::read('studio/template/css/login.css');

        $this->assertMatchesRegularExpression('/div\.bx-std-login-form \{[^}]*width: 28\.75rem;[^}]*max-width: calc\(100vw - 2rem\);/', $s);
        $this->assertMatchesRegularExpression('/#bx-std-login-form-box \.bx-popup-close-wrapper \{\s*display: none;/', $s, 'Closing the only box on the page would leave it blank.');
        $this->assertMatchesRegularExpression('/@media \(max-height: 32rem\) \{\s*body > #bx-std-login-form-box \{\s*max-height: 100dvh;\s*overflow-y: auto;/', $s, 'A short screen scrolls the box: the page behind it is locked.');
    }

    public function testFieldsHaveLabelsAndAutocomplete(): void
    {
        $s = self::read('studio/template/login_form.html');

        // a caption that is not a label leaves the field without an accessible name
        $this->assertStringContainsString('<label for="admin_email" class="bx-form-caption', $s);
        $this->assertStringContainsString('<label for="admin_password" class="bx-form-caption', $s);
        $this->assertMatchesRegularExpression('/<input id="admin_email" [^>]*autocomplete="username"[^>]*inputmode="email"[^>]*required/', $s);
        $this->assertMatchesRegularExpression('/<input id="admin_password" type="password" [^>]*autocomplete="current-password"[^>]*required/', $s);
        $this->assertDoesNotMatchRegularExpression('/tabindex="[1-9]/', $s, 'A positive tabindex takes the fields out of the page order.');
    }

    public function testEveryStopHasAFocusRing(): void
    {
        $s = self::read('studio/template/css/login.css');

        // the password input has no border: its frame shows the ring; the buttons had no ring at all
        $this->assertStringContainsString('#bx-std-login-form-box .bx-form-input-wrapper-password:has(.bx-form-input-password:focus-visible)', $s);
        $this->assertMatchesRegularExpression('/#bx-std-login-form-box \.bx-btn:focus-visible \{\s*outline: 2px solid #2563eb;\s*outline-offset: 2px;/', $s);
        $this->assertStringContainsString('outline-color: Highlight;', $s);
    }
}
