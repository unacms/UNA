<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Account settings show Connectors (personal access tokens) to a membership level with "use connectors" while the
 * MCP server is on, or while the account still has tokens to revoke.
 */
#[Group('integration')]
class ConnectorsVisibilityTest extends BxDolIntegrationTestCase
{
    private $_sMcpBackup;
    private array $_aTokenIds = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_sMcpBackup = getParam(BxDolMcpServer::OPTION_ENABLE);
        $this->bxLoginAsUser();
    }

    protected function tearDown(): void
    {
        $iAccountId = (int)getLoggedId();
        foreach ($this->_aTokenIds as $iId)
            BxDolApiTokens::revoke($iId, $iAccountId);
        setParam(BxDolMcpServer::OPTION_ENABLE, $this->_sMcpBackup);
        parent::tearDown();
    }

    public function testHiddenWhileMcpIsOffAndThereAreNoTokens(): void
    {
        $this->assertTrue(BxDolApiTokens::isAllowed(), 'Standard members may use connectors by default.');
        $this->assertSame([], BxDolApiQuery::getInstance()->getTokensByAccount(getLoggedId()), 'The test user starts without tokens.');

        setParam(BxDolMcpServer::OPTION_ENABLE, '');
        $this->assertFalse(BxDolApiTokens::isAvailable());
        $this->assertFalse((new BxTemplServiceAccount())->serviceIsConnectorsAvailable());

        setParam(BxDolMcpServer::OPTION_ENABLE, 'on');
        $this->assertTrue(BxDolApiTokens::isAvailable());
    }

    public function testShownWhileTheAccountHasATokenToRevoke(): void
    {
        setParam(BxDolMcpServer::OPTION_ENABLE, '');

        $mixed = BxDolApiTokens::create(getLoggedId(), 'Test token', 30);
        $this->assertIsArray($mixed);
        $this->_aTokenIds[] = (int)$mixed['id'];

        $this->assertTrue(BxDolApiTokens::isAvailable());
    }

    public function testMenuItemCarriesTheVisibilityCheck(): void
    {
        $sCustom = BxDolDb::getInstance()->getOne("SELECT `visibility_custom` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `name` = 'account-settings-connectors'");
        $this->assertStringContainsString('is_connectors_available', (string)$sCustom);
    }
}
