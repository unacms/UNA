<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The login and join forms tell the browser and password managers what each field holds (WCAG 1.3.5), and every
 * required field says so to screen readers as well as with the caption's star.
 */
#[Group('integration')]
class FormFieldsAccessibilityTest extends BxDolIntegrationTestCase
{
    private function formHtml(string $sObject, string $sDisplay): string
    {
        $oForm = BxDolForm::getObjectInstance($sObject, $sDisplay);
        $this->assertNotFalse($oForm, $sObject . ' ' . $sDisplay);

        return $oForm->getCode();
    }

    private function inputTag(string $sHtml, string $sName): string
    {
        $this->assertSame(1, preg_match('/<input[^>]*\sname="' . preg_quote($sName, '/') . '"[^>]*>/', $sHtml, $aMatch), $sName);

        return $aMatch[0];
    }

    public function testLoginFieldsSayWhatTheyHold(): void
    {
        $sHtml = $this->formHtml('sys_login', 'sys_login');

        $this->assertStringContainsString('autocomplete="username"', $this->inputTag($sHtml, 'ID'));
        $this->assertStringContainsString('autocomplete="current-password"', $this->inputTag($sHtml, 'Password'));
    }

    public function testJoinFieldsSayWhatTheyHold(): void
    {
        $sHtml = $this->formHtml('sys_account', 'sys_account_create');

        $this->assertStringContainsString('autocomplete="email"', $this->inputTag($sHtml, 'email'));
        $this->assertStringContainsString('autocomplete="new-password"', $this->inputTag($sHtml, 'password'), 'A new password, so managers offer to make one.');
    }

    public function testRequiredFieldsSaySoToScreenReaders(): void
    {
        $sHtml = $this->formHtml('sys_login', 'sys_login');

        foreach (['ID', 'Password'] as $sName)
            $this->assertStringContainsString('aria-required="true"', $this->inputTag($sHtml, $sName), $sName);

        $this->assertStringNotContainsString('aria-required', $this->inputTag($sHtml, 'relocate'), 'Hidden inputs have no state to announce.');
        $this->assertStringNotContainsString(' required', $this->inputTag($sHtml, 'ID'), 'Not the native attribute: the form checker reports what is missing.');
    }
}
