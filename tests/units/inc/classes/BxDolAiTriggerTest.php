<?php

/**
 * Operators see the provider's own error. The log keeps the full HTTP text.
 */
class BxDolAiTriggerTest extends \PHPUnit\Framework\TestCase
{
    public function testAuthenticationErrorIsTheProviderMessage()
    {
        $o = new Exception('HTTP 401 error during POST chat/completions: {"error":{"message":"Unauthorized","type":"authentication_error"}}');

        $this->assertSame('Unauthorized', BxDolAiTrigger::visibleError($o));
    }

    public function testPlainExceptionStaysIntact()
    {
        $o = new Exception('Vector store 9 has no embedding model');

        $this->assertSame('Vector store 9 has no embedding model', BxDolAiTrigger::visibleError($o));
    }
}
