<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Workspaces: a member who joins the context module set in `bx_workspaces_context_module` joins as a
 * workspace profile of their own account, made on the first join and kept for that context.
 */
#[Group('integration')]
class WorkspacesJoinTest extends BxDolIntegrationTestCase
{
    private array $_aAccounts = [];
    private array $_aGroups = [];
    private ?string $_sContextBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        $oModules = BxDolModuleQuery::getInstance();
        foreach (['bx_workspaces', 'bx_groups', 'bx_persons'] as $sModule)
            if (!$oModules->isEnabledByName($sModule))
                $this->markTestSkipped($sModule . ' is not enabled.');

        class_exists('BxDolPrivacy');
        $this->_sContextBackup = getParam('bx_workspaces_context_module');
        $this->setContext('bx_groups');
    }

    protected function tearDown(): void
    {
        $GLOBALS['glForceCurrentProfileId'] = 0;
        foreach ($this->_aGroups as $iContentId)
            bx_srv('bx_groups', 'delete_entity', [$iContentId]);
        foreach ($this->_aAccounts as $iAccountId)
            if (($oAccount = BxDolAccount::getInstance($iAccountId, true)))
                $oAccount->delete(true);
        if ($this->_sContextBackup !== null)
            $this->setContext($this->_sContextBackup);
        $this->bxBecomeGuest();
        parent::tearDown();
    }

    private function setContext(string $sModule): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams['bx_workspaces_context_module'] = $sModule;
        $oProp->setValue(null, $aParams);
    }

    /** A new account with a person profile: [account id, person profile id]. */
    private function member(string $sName): array
    {
        $sEmail = 'ws-' . bin2hex(random_bytes(4)) . '@example.test';
        $a = (new BxTemplAccountForms())->createAccount(['name' => $sName, 'email' => $sEmail, 'password' => 'UnaTest1a'], BX_PROFILE_ACTION_EXTERNAL, false);
        $this->assertArrayHasKey('account_id', $a, $a['error'] ?? '');
        $this->_aAccounts[] = (int)$a['account_id'];
        BxDolAccount::getInstance((int)$a['account_id'], true)->updateEmailConfirmed(true, false);

        $this->actAs((int)$a['account_id'], 0);
        $iProfile = 0;
        foreach (BxDolAccount::getInstance((int)$a['account_id'], true)->getProfiles(false) as $iId => $aProfile)
            if ($aProfile['type'] == 'bx_persons')
                $iProfile = (int)$iId;
        if (!$iProfile) {
            $r = bx_srv('bx_persons', 'entity_add_forcedly', [(int)$a['profile_id'], ['fullname' => $sName, 'allow_view_to' => BX_DOL_PG_ALL]]);
            $this->assertNotEmpty($r['content']['profile_id'] ?? null, json_encode($r));
            $iProfile = (int)$r['content']['profile_id'];
        }
        foreach ([$iProfile, (int)$a['profile_id']] as $iId)
            if (($oProfile = BxDolProfile::getInstance($iId)) && $oProfile->getStatus() != BX_PROFILE_STATUS_ACTIVE)
                $oProfile->activate(BX_PROFILE_ACTION_AUTO, $iId, false);
        BxDolAccount::getInstance((int)$a['account_id'], true)->updateProfileContext($iProfile);
        // The profile row and BxDolAcl's level are kept from before the profile was activated.
        BxDolDb::getInstance()->cleanMemoryAll();
        foreach ([$iProfile, (int)$a['profile_id']] as $iId)
            unset($GLOBALS['bxDolClasses']['BxDolProfile_' . $iId]);
        (new ReflectionProperty(BxDolAcl::class, '_aCacheData'))->setValue(null, []);

        return [(int)$a['account_id'], $iProfile];
    }

    /** A public group without join confirmation, owned by a member of its own: its profile id. */
    private function group(): int
    {
        [$iAccount, $iOwner] = $this->member('Group Owner');
        $this->actAs($iAccount, $iOwner);
        $r = bx_srv('bx_groups', 'entity_add_forcedly', [$iOwner, ['group_name' => 'Workspace test ' . bin2hex(random_bytes(2)), 'group_cat' => 1, 'join_confirmation' => 0, 'allow_view_to' => BX_DOL_PG_ALL, 'allow_post_to' => 'p']]);
        $this->assertNotEmpty($r['content']['profile_id'] ?? null, json_encode($r));
        $this->_aGroups[] = (int)$r['content']['id'];

        return (int)$r['content']['profile_id'];
    }

    private function actAs(int $iAccountId, int $iProfileId): void
    {
        bx_login($iAccountId, false);
        $GLOBALS['logged']['member'] = true;
        $GLOBALS['glForceCurrentProfileId'] = $iProfileId;
    }

    private function workspaces(int $iAccountId): array
    {
        return array_map('intval', BxDolDb::getInstance()->getColumn("SELECT `id` FROM `sys_profiles` WHERE `type` = 'bx_workspaces' AND `account_id` = :a ORDER BY `id`", ['a' => $iAccountId]));
    }

    private function join(int $iProfileId, int $iGroup): void
    {
        $r = BxDolConnection::getObjectInstance('bx_groups_fans')->actionAdd($iGroup, $iProfileId);
        $this->assertFalse($r['err'] ?? true, json_encode($r));
    }

    private function activeProfile(int $iAccountId): int
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT `profile_id` FROM `sys_accounts` WHERE `id` = :a", ['a' => $iAccountId]);
    }

    public function testJoiningMakesAWorkspaceAndActsAsIt(): void
    {
        $iGroup = $this->group();
        [$iAccount, $iPerson] = $this->member('Ella Workspace');
        $this->actAs($iAccount, $iPerson);

        $this->join($iPerson, $iGroup);

        $aWs = $this->workspaces($iAccount);
        $this->assertCount(1, $aWs);
        $oWs = BxDolProfile::getInstance($aWs[0]);
        $aData = BxDolModule::getInstance('bx_workspaces')->_oDb->getContentInfoById($oWs->getContentId());
        $this->assertSame($iPerson, (int)$aData['author']);
        $this->assertSame((string)-$iGroup, (string)$aData['allow_view_to'], 'A workspace belongs to the group it is visible to.');
        $this->assertSame(BX_PROFILE_STATUS_ACTIVE, $oWs->getStatus());
        $this->assertSame('Ella Workspace', $oWs->getDisplayName(), 'A workspace shows the name of the profile it was made from.');

        $oFans = BxDolConnection::getObjectInstance('bx_groups_fans');
        $this->assertTrue((bool)$oFans->isConnected($aWs[0], $iGroup, true), 'The workspace is the member.');
        $this->assertFalse((bool)$oFans->isConnected($iPerson, $iGroup), 'The person is not.');
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_groups_fans` WHERE (`initiator` = 0 AND `content` = :g) OR (`initiator` = :g AND `content` = 0)", ['g' => $iGroup]), 'Nobody joins as profile 0.');
        $this->assertSame($aWs[0], $this->activeProfile($iAccount), 'Whoever joined acts as their workspace.');
    }

    public function testLeavingActsAsThePersonAndRejoiningKeepsTheWorkspace(): void
    {
        $iGroup = $this->group();
        [$iAccount, $iPerson] = $this->member('Leave Rejoin');
        $this->actAs($iAccount, $iPerson);
        $this->join($iPerson, $iGroup);
        [$iWs] = $this->workspaces($iAccount);

        $this->actAs($iAccount, $iWs);
        $r = BxDolConnection::getObjectInstance('bx_groups_fans')->actionRemove($iGroup, $iWs);
        $this->assertFalse($r['err'] ?? true, json_encode($r));
        $this->assertSame($iPerson, $this->activeProfile($iAccount), 'Leaving switches back to the person.');

        $this->actAs($iAccount, $iPerson);
        $this->join($iPerson, $iGroup);
        $this->assertSame([$iWs], $this->workspaces($iAccount), 'Rejoining uses the same workspace.');
        $this->assertSame($iWs, $this->activeProfile($iAccount));
    }

    public function testAWorkspacePerGroup(): void
    {
        $iGroupA = $this->group();
        $iGroupB = $this->group();
        [$iAccount, $iPerson] = $this->member('Two Groups');

        $this->actAs($iAccount, $iPerson);
        $this->join($iPerson, $iGroupA);
        [$iWsA] = $this->workspaces($iAccount);
        $this->assertSame($iWsA, $this->activeProfile($iAccount));

        // Still acting as group A's workspace, the member joins group B.
        $this->actAs($iAccount, $iWsA);
        $this->join($iWsA, $iGroupB);

        $aWs = $this->workspaces($iAccount);
        $this->assertCount(2, $aWs, 'Group B gets a workspace of its own.');
        $iWsB = $aWs[1];
        $oFans = BxDolConnection::getObjectInstance('bx_groups_fans');
        $this->assertTrue((bool)$oFans->isConnected($iWsB, $iGroupB, true));
        $this->assertFalse((bool)$oFans->isConnected($iWsA, $iGroupB), "Group A's workspace doesn't join group B.");
        $aDataB = BxDolModule::getInstance('bx_workspaces')->_oDb->getContentInfoById(BxDolProfile::getInstance($iWsB)->getContentId());
        $this->assertSame($iPerson, (int)$aDataB['author'], 'Made from the person, not from the other workspace.');
        $this->assertSame($iWsB, $this->activeProfile($iAccount));
    }

    public function testAddedBySomeoneElseMakesTheWorkspaceForTheMember(): void
    {
        $iGroup = $this->group();
        [$iAccount, $iPerson] = $this->member('Added Member');
        [$iOtherAccount, $iOther] = $this->member('Someone Else');

        // Someone else's request adds the member (as an admin confirming or inviting would).
        $this->actAs($iOtherAccount, $iOther);
        $this->assertTrue((bool)BxDolConnection::getObjectInstance('bx_groups_fans')->addConnection($iPerson, $iGroup));

        $this->assertCount(1, $this->workspaces($iAccount), 'The workspace belongs to the member.');
        $this->assertSame([], $this->workspaces($iOtherAccount), 'Not to whoever is signed in.');
        $this->assertSame($iPerson, $this->activeProfile($iAccount), 'Nobody is switched behind their back.');
        $this->assertSame($iOther, $this->activeProfile($iOtherAccount));
    }

    public function testWithoutAContextModuleMembersJoinAsThemselves(): void
    {
        $iGroup = $this->group();
        [$iAccount, $iPerson] = $this->member('No Context');
        $this->setContext('');

        $this->actAs($iAccount, $iPerson);
        $this->join($iPerson, $iGroup);

        $this->assertSame([], $this->workspaces($iAccount));
        $this->assertTrue((bool)BxDolConnection::getObjectInstance('bx_groups_fans')->isConnected($iPerson, $iGroup, true));
    }
}
