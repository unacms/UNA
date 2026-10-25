<?php

/**
 * BxDolModuleConfig reads `enabled` from the module row. Some module arrays are built in code without it
 * (Profiler's $GLOBALS['bx_profiler_module'], created on every request): those must not raise a warning,
 * which display_errors prints into API responses and breaks NEO's JSON.
 */
class BxDolModuleConfigTest extends \PHPUnit\Framework\TestCase
{
    private static function module(array $aExtra = []): array
    {
        return array_merge([
            'id' => 0,
            'name' => 'bx_test',
            'vendor' => 'Test',
            'class_prefix' => 'BxTest',
            'db_prefix' => 'bx_test_',
            'path' => 'boonex/test/',
            'uri' => 'test',
        ], $aExtra);
    }

    public function testMissingEnabledRaisesNoWarningAndMeansNotEnabled(): void
    {
        $aWarnings = [];
        set_error_handler(function ($iNo, $sStr) use (&$aWarnings) {
            $aWarnings[] = $sStr;
            return true;
        });
        try {
            $oConfig = new BxDolModuleConfig(self::module());
        } finally {
            restore_error_handler();
        }

        $this->assertSame([], $aWarnings);
        $this->assertFalse($oConfig->isEnabled());
    }

    public function testEnabledFollowsTheModuleRow(): void
    {
        $this->assertTrue((new BxDolModuleConfig(self::module(['enabled' => '1'])))->isEnabled());
        $this->assertFalse((new BxDolModuleConfig(self::module(['enabled' => '0'])))->isEnabled());
    }
}
