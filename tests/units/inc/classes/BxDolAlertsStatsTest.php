<?php

/**
 * The alerts log keeps the shape of each alert's data but not secret or personal values.
 */
class BxDolAlertsStatsTest extends BxDolTestCase
{
    public function testSecretAndPersonalValuesAreReplaced(): void
    {
        $aLogged = BxDolAlertsStats::redact([
            'pwd' => 'plain text',
            'password' => 'hash',
            'password_ref' => 'hash',
            'info' => ['id' => 5, 'email' => 'a@example.com', 'salt' => 'x', 'name' => 'Ann'],
            'template_keys' => ['forgot_password_url' => 'https://example.com/r?k=1', 'site_name' => 'Site'],
            'confirmation_code' => '123456',
            'sms_text' => 'Reset: https://example.com/?key=abc',
            'sms_text_ref' => 'Code 123456',
            'conf_link' => 'https://example.com/?code=abc',
            'entry_url' => 'https://example.com/view?id=1',
            'message' => 'Hi',
            'body' => '<p>Hello</p>',
            'subject' => 'Welcome',
            'module_name' => 'bx_posts',
            'keywords' => 'kept',
            7 => 'numeric keys are kept',
        ]);

        foreach (['pwd', 'password', 'password_ref', 'confirmation_code', 'sms_text', 'sms_text_ref', 'conf_link', 'entry_url', 'message', 'body'] as $sKey)
            $this->assertSame('[redacted]', $aLogged[$sKey], $sKey);

        $this->assertSame(['id' => 5, 'email' => '[redacted]', 'salt' => '[redacted]', 'name' => 'Ann'], $aLogged['info']);
        $this->assertSame(['forgot_password_url' => '[redacted]', 'site_name' => 'Site'], $aLogged['template_keys']);
        $this->assertSame('Welcome', $aLogged['subject']);
        $this->assertSame('bx_posts', $aLogged['module_name']);
        $this->assertSame('kept', $aLogged['keywords'], 'Only whole words in a key match.');
        $this->assertSame('numeric keys are kept', $aLogged[7]);
    }

    public function testCallersVariablesAreNotChanged(): void
    {
        $sPassword = 'secret';
        $aOptions = ['token' => 'abc'];
        $aExtras = ['password_ref' => &$sPassword, 'options' => &$aOptions];

        $aLogged = BxDolAlertsStats::redact($aExtras);

        $this->assertSame('[redacted]', $aLogged['password_ref']);
        $this->assertSame(['token' => '[redacted]'], $aLogged['options']);
        $this->assertSame('secret', $sPassword);
        $this->assertSame(['token' => 'abc'], $aOptions);
    }

    public function testInputsSessionsAndRemoteDataAreReplaced(): void
    {
        $aLogged = BxDolAlertsStats::redact([
            'inputs_ref' => ['ID' => ['type' => 'text', 'name' => 'ID', 'value' => 'user@example.com'], 'Password' => ['value' => 'x']],
            'remote_profile_info' => ['id' => 5, 'userPrincipalName' => 'user@example.com'],
            'response' => ['sessid' => 'abc', 'session_name' => 'SESS1', 'user' => ['uid' => 5, 'mail' => 'user@example.com']],
            'graph' => ['mobilePhone' => '+100', 'businessPhones' => ['+200'], 'displayName' => 'Ann'],
        ]);

        $this->assertSame('[redacted]', $aLogged['inputs_ref'], 'Form inputs hold what people typed.');
        $this->assertSame('[redacted]', $aLogged['remote_profile_info'], 'Remote profile data is not ours to log.');
        $this->assertSame(['sessid' => '[redacted]', 'session_name' => '[redacted]', 'user' => ['uid' => 5, 'mail' => '[redacted]']], $aLogged['response']);
        $this->assertStringNotContainsString('user@example.com', json_encode($aLogged));
        $this->assertSame(['mobilePhone' => '[redacted]', 'businessPhones' => '[redacted]', 'displayName' => 'Ann'], $aLogged['graph'], 'camelCase keys match too.');
    }

    public function testObjectsAreLoggedByClassOnly(): void
    {
        $oForm = new ArrayObject(['password' => 'secret', 'name' => 'Ann']);

        $sLogged = json_encode(BxDolAlertsStats::redact(['form' => $oForm, 'nested' => ['object' => $oForm]]));

        $this->assertSame('{"form":"[object ArrayObject]","nested":{"object":"[object ArrayObject]"}}', $sLogged);
    }

    public function testDeepArraysAreReplacedPastTheLimit(): void
    {
        $aDeep = ['value' => 'x'];
        for ($i = 0; $i < 12; $i++)
            $aDeep = ['level' => $aDeep];

        $sLogged = json_encode(BxDolAlertsStats::redact($aDeep));
        $this->assertStringContainsString('[redacted]', $sLogged);
        $this->assertStringNotContainsString('"value"', $sLogged);
    }
}
