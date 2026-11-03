<?php

/**
 * A CAPTCHA field shows only while a CAPTCHA is configured. A fresh install has none (no reCAPTCHA keys),
 * and its forms (Forgot password) showed a required "Security Image" reading "CAPTCHA not available";
 * the form check lets such a form through anyway (BxDolFormCheckerHelper::checkCaptcha).
 */
class BxBaseFormViewCaptchaTest extends BxDolTestCase
{
    private const KEYS = ['sys_recaptcha_key_public', 'sys_recaptcha_key_private'];

    private array $_aPrior = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (self::KEYS as $sName)
            $this->_aPrior[$sName] = getParam($sName);
        $this->forgetCaptcha();
    }

    protected function tearDown(): void
    {
        foreach ($this->_aPrior as $sName => $sValue)
            setParam($sName, $sValue);
        $this->forgetCaptcha();

        parent::tearDown();
    }

    private function forgetCaptcha(): void
    {
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (strpos($sKey, 'BxDolCaptcha!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
    }

    private function captchaRow(): string
    {
        $oForm = new BxTemplFormView(['form_attrs' => ['id' => 'phpunit-captcha-form', 'method' => 'post'], 'inputs' => []]);
        $aInput = ['type' => 'captcha', 'name' => 'captcha', 'caption' => _t('_sys_form_account_input_captcha'), 'required' => true];

        return $oForm->genRow($aInput);
    }

    public function testNoRowWithoutACaptcha(): void
    {
        foreach (self::KEYS as $sName)
            setParam($sName, '');

        $this->assertFalse(BxDolCaptcha::getObjectInstance(), 'No keys, no CAPTCHA.');
        $this->assertSame('', $this->captchaRow());
        $this->assertTrue(BxDolFormCheckerHelper::checkCaptcha(''), 'And the form check passes without it.');
    }

    public function testRowWithACaptcha(): void
    {
        foreach (self::KEYS as $sName)
            setParam($sName, 'phpunit-key');

        $this->assertNotFalse(BxDolCaptcha::getObjectInstance(), 'reCAPTCHA with both keys is available.');
        $sRow = $this->captchaRow();
        $this->assertStringContainsString('bx-form-input-captcha', $sRow);
        $this->assertStringNotContainsString(_t('_sys_txt_captcha_not_available'), $sRow);
    }
}
