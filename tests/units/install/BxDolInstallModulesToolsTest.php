<?php

/**
 * Module selection of the installer: which URIs are installed and in which order.
 */
class BxDolInstallModulesToolsTest extends \PHPUnit\Framework\TestCase
{
    private static function tools(): BxDolInstallModulesTools
    {
        if (!defined('BX_DOL_INSTALL'))
            define('BX_DOL_INSTALL', true);
        if (!defined('BX_INSTALL_DIR_MODULES'))
            define('BX_INSTALL_DIR_MODULES', dirname(__DIR__, 3) . '/modules/');

        require_once dirname(__DIR__, 3) . '/install/classes/BxDolInstallModulesTools.php';

        return new BxDolInstallModulesTools();
    }

    private static function module(string $sUri, array $aDependencies = []): array
    {
        return array('name' => 'bx_' . $sUri, 'home_uri' => $sUri, 'dependencies' => $aDependencies);
    }

    private static function uris(array $aModules): array
    {
        return array_column($aModules, 'home_uri');
    }

    public function testParseUrisAcceptsArrayAndCommaSeparatedString(): void
    {
        $o = self::tools();

        $this->assertSame(array('persons', 'timeline'), $o->parseUris(array('', 'persons', ' timeline ', 'persons')));
        $this->assertSame(array('persons', 'timeline'), $o->parseUris('persons, timeline,,persons'));
        $this->assertSame(array(), $o->parseUris(array('')));
        $this->assertSame(array(), $o->parseUris(''));
    }

    public function testInstallOrderDropsUnknownModulesAndKeepsSelectionOrder(): void
    {
        $aModules = array(self::module('persons'), self::module('timeline'), self::module('notifications'));

        $aOrder = self::tools()->getInstallOrder($aModules, 'notifications,missing,timeline');

        $this->assertSame(array('notifications', 'timeline'), self::uris($aOrder));
    }

    public function testInstallOrderPutsFirstModuleFirst(): void
    {
        $aModules = array(self::module('persons'), self::module('timeline'), self::module('notifications'));

        $aOrder = self::tools()->getInstallOrder($aModules, array('timeline', 'notifications', 'persons'), 'persons');

        $this->assertSame(array('persons', 'timeline', 'notifications'), self::uris($aOrder));
    }

    public function testInstallOrderAddsDependenciesBeforeDependentsByUriOrName(): void
    {
        $aModules = array(
            self::module('api', array('oauth2' => 'OAuth2')),
            self::module('oauth2'),
            self::module('hosting', array('bx_market' => 'Market')),
            self::module('market'),
        );

        $aOrder = self::tools()->getInstallOrder($aModules, array('api', 'hosting'));

        $this->assertSame(array('oauth2', 'api', 'market', 'hosting'), self::uris($aOrder));
    }

    public function testInstallOrderSurvivesCircularDependencies(): void
    {
        $aModules = array(
            self::module('a', array('b' => 'B')),
            self::module('b', array('a' => 'A')),
        );

        $this->assertSame(array('b', 'a'), self::uris(self::tools()->getInstallOrder($aModules, 'a')));
    }

    public function testRealModulesAreListedAndApiFollowsOauth2(): void
    {
        $o = self::tools();
        $aModules = $o->getModules('module');

        $this->assertArrayHasKey('bx_persons', $aModules);
        $this->assertArrayHasKey('bx_timeline', $aModules);
        $this->assertArrayHasKey('bx_notifications', $aModules);
        $this->assertArrayNotHasKey('bx_en', $aModules, 'Languages have their own selector.');
        $this->assertArrayNotHasKey('bx_artificer', $aModules, 'Templates have their own selector.');

        $aUris = self::uris($o->getInstallOrder($aModules, array('timeline', 'api', 'persons', 'notifications'), 'persons'));

        $this->assertSame('persons', $aUris[0]);
        $this->assertContains('oauth2', $aUris, 'A dependency is installed even when it is not selected.');
        $this->assertLessThan(array_search('api', $aUris), array_search('oauth2', $aUris));
    }
}
