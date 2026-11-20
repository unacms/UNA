<?php

/**
 * Server audit: sizes people can read, the database minimum per server kind, an outdated PHP branch,
 * and the requirements from AGENTS.md.
 */
class BxDolStudioToolsAuditChecksTest extends \PHPUnit\Framework\TestCase
{
    private static function audit(): BxDolStudioToolsAudit
    {
        require_once dirname(__DIR__, 3) . '/studio/classes/BxDolStudioToolsAudit.php';
        return (new ReflectionClass(BxDolStudioToolsAudit::class))->newInstanceWithoutConstructor();
    }

    private static function prop(object $o, string $sName)
    {
        return (new ReflectionProperty($o, $sName))->getValue($o);
    }

    public function testSizesAreReadable(): void
    {
        self::audit();
        $this->assertSame('192 MB', BxDolStudioToolsAudit::formatBytes(201326592));
        $this->assertSame('128 KB', BxDolStudioToolsAudit::formatBytes(131072));
        $this->assertSame('1.5 GB', BxDolStudioToolsAudit::formatBytes(1610612736));
        $this->assertSame('512 B', BxDolStudioToolsAudit::formatBytes(512));
    }

    public function testMariaDbHasItsOwnMinimum(): void
    {
        self::audit();
        $this->assertSame('10.2.3', BxDolStudioToolsAudit::getMinDbVersion('11.8.2-MariaDB-ubu2404', '5.7.8', '10.2.3'));
        $this->assertSame('5.7.8', BxDolStudioToolsAudit::getMinDbVersion('8.0.36', '5.7.8', '10.2.3'));
    }

    public function testPhpBranchTwoMinorReleasesBehindIsOutdated(): void
    {
        self::audit();
        $this->assertFalse(BxDolStudioToolsAudit::isPhpBranchOutdated('8.3.37', '8.4.12'));
        $this->assertTrue(BxDolStudioToolsAudit::isPhpBranchOutdated('8.3.37', '8.5.1'));
        $this->assertTrue(BxDolStudioToolsAudit::isPhpBranchOutdated('8.4.1', '9.0.0'));
        $this->assertFalse(BxDolStudioToolsAudit::isPhpBranchOutdated('8.5.0', '8.5.1'));
        $this->assertFalse(BxDolStudioToolsAudit::isPhpBranchOutdated('', '8.5.1'));
    }

    public function testRequirementsMatchAgentsMd(): void
    {
        $o = self::audit();
        (new ReflectionMethod($o, '__construct'))->invoke($o);

        $this->assertSame('8.3.0', self::prop($o, 'sMinPhpVer'));
        $this->assertSame('5.7.8', self::prop($o, 'sMinMysqlVer'));
        $this->assertSame('10.2.3', self::prop($o, 'sMinMariaDbVer'));

        $aSettings = self::prop($o, 'aPhpSettings');
        $this->assertArrayHasKey('php module: pdo_mysql', $aSettings);
        foreach (array('magic_quotes_gpc', 'register_globals', 'safe_mode', 'short_open_tag') as $sRemoved)
            $this->assertArrayNotHasKey($sRemoved, $aSettings, "$sRemoved was removed from PHP");

        $this->assertArrayHasKey('thread_cache_size', self::prop($o, 'aMysqlOptimizationSettings'));
    }
}
