<?php

class BxDolInstallMariaDbSqlTest extends \PHPUnit\Framework\TestCase
{
    public function testVectorTablesLiveInMariaDbSql(): void
    {
        $sSystem = file_get_contents(__DIR__ . '/../../../install/sql/system.sql');
        $sMaria = file_get_contents(__DIR__ . '/../../../install/sql/mariadb.sql');

        $this->assertIsString($sSystem);
        $this->assertIsString($sMaria);
        $this->assertDoesNotMatchRegularExpression('/CREATE TABLE[^;]*sys_agents_vector_mariadb_(1024|384)/is', $sSystem);
        $this->assertStringContainsString('CREATE TABLE IF NOT EXISTS `sys_agents_vector_mariadb_1024`', $sMaria);
        $this->assertStringContainsString('CREATE TABLE IF NOT EXISTS `sys_agents_vector_mariadb_384`', $sMaria);
    }

    public function testMariaDbSqlRunsOnlyOnSupportedMariaDb(): void
    {
        $oConfig = $this->installer();
        $oMethod = new ReflectionMethod(BxDolInstallSiteConfig::class, 'shouldRunMariaDbSql');

        $this->assertTrue($oMethod->invoke($oConfig, $this->version('11.8.2-MariaDB-ubu2404')));
        $this->assertTrue($oMethod->invoke($oConfig, $this->version('5.5.5-11.7.2-MariaDB')));
        $this->assertFalse($oMethod->invoke($oConfig, $this->version('10.11.6-MariaDB-1:10.11.6+maria~ubu2204')));
        $this->assertFalse($oMethod->invoke($oConfig, $this->version('11.6.2-MariaDB')));
        $this->assertFalse($oMethod->invoke($oConfig, $this->version('8.0.36')));
        $this->assertFalse($oMethod->invoke($oConfig, $this->version('9.0.0')));
    }

    private function installer(): BxDolInstallSiteConfig
    {
        if (!defined('BX_DOL_INSTALL'))
            define('BX_DOL_INSTALL', true);
        if (!defined('BX_INSTALL_DIR'))
            define('BX_INSTALL_DIR', dirname(__DIR__, 3) . '/install/');

        require_once dirname(__DIR__, 3) . '/install/classes/BxDolInstallSiteConfig.php';

        return (new ReflectionClass(BxDolInstallSiteConfig::class))->newInstanceWithoutConstructor();
    }

    private function version(string $sVersion): object
    {
        return new class($sVersion) {
            public function __construct(private string $sVersion)
            {
            }

            public function getOne($sQuery)
            {
                return $this->sVersion;
            }
        };
    }
}
