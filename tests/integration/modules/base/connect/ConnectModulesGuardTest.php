<?php

use PHPUnit\Framework\Attributes\Group;

if (!function_exists('MsgBox'))
    require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';

/**
 * Generic guard over every installed connect module. A service which a guest may call (the safe-listed ones)
 * must not sign anybody in because the request says who the user is. Forged remote profiles are sent with no
 * access token to every safe-listed service of every module which extends BxBaseModConnectModule:
 *  - one names the remote ID of an account which is linked to the module (the member signs in by this ID),
 *  - one names the email of an existing account (the member would be linked by the email),
 *  - one is a new identity.
 * The modules are found through BxDolModuleQuery, so a new connect module which copies the old pattern fails here
 * without being listed.
 */
#[Group('integration')]
class ConnectModulesGuardTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;

    /** @var array module name => [BxBaseModConnectModule, local profile id] of the remote links which this test created */
    protected $_aLinks = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->_aLinks = [];
        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        foreach ($this->_aLinks as $aLink)
            $aLink[0]->_oDb->deleteRemoteAccount($aLink[1]);
        $this->_aLinks = [];

        $this->bxBecomeGuest();
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function bxConnectModules(): array
    {
        $aResult = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule) {
            $sDir = BX_DIRECTORY_PATH_MODULES . $aModule['path'];
            $sPath = $sDir . 'classes/' . $aModule['class_prefix'] . 'Module.php';
            if (!is_file($sPath) || !preg_match('/extends\s+BxBaseModConnectModule\b/', (string)file_get_contents($sPath)))
                continue;

            // a module can be enabled while its composer packages are not installed
            if (is_file($sDir . 'composer.json') && !is_file($sDir . 'vendor/autoload.php'))
                continue;

            $oModule = BxDolModule::getInstance($aModule['name']);
            if ($oModule instanceof BxBaseModConnectModule)
                $aResult[$aModule['name']] = $oModule;
        }
        return $aResult;
    }

    /**
     * Make sure that a member (the test user, or the test admin) is linked to the module by a remote ID.
     *
     * @return array [local profile id, remote ID]
     */
    protected function bxVictim(string $sName, BxBaseModConnectModule $oModule): array
    {
        $oAccount = BxDolAccount::getInstance($this->bxTestEmail('user'), true) ?: BxDolAccount::getInstance($this->bxTestEmail('admin'), true);
        if (!$oAccount) {
            // the seeded test accounts are not installed, any member with a profile can be the victim
            $iAccountId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_accounts` WHERE `profile_id` > 0 ORDER BY `id` ASC LIMIT 1");
            $oAccount = $iAccountId ? BxDolAccount::getInstance($iAccountId, true) : false;
        }
        if (!$oAccount)
            $this->markTestSkipped('No account is installed.');

        $oProfile = BxDolProfile::getInstanceByAccount($oAccount->id(), true);
        if (!$oProfile)
            $this->markTestSkipped('The account has no profile.');

        $iProfileId = (int)$oProfile->id();
        $sRemoteId = (string)$oModule->_oDb->getRemoteProfileId($iProfileId);
        if ($sRemoteId === '') {
            $sRemoteId = (string)random_int(700000000, 799999999);
            $oModule->_oDb->saveRemoteId($iProfileId, $sRemoteId);
            $this->_aLinks[$sName] = [$oModule, $iProfileId];
        }

        return [$iProfileId, $sRemoteId, $oAccount->getEmail()];
    }

    protected function bxForgedProfiles(string $sVictimRemoteId, string $sVictimEmail): array
    {
        $sNewId = (string)random_int(800000000, 899999999);
        $aForged = [];
        foreach ([
            [$sVictimRemoteId, 'attacker-' . $sNewId . '@example.com'],
            [$sNewId, $sVictimEmail],
            [$sNewId, $sNewId . '@example.com'],
        ] as [$sId, $sEmail]) {
            $aForged[] = [
                'id' => $sId, 'sub' => $sId, 'uid' => $sId, 'email' => $sEmail, 'mail' => $sEmail,
                'email_verified' => true, 'verified_email' => true, 'name' => 'Forged', 'given_name' => 'Forged',
                'picture' => 'http://127.0.0.1/forged.png',
            ];
        }
        return $aForged;
    }

    protected function bxCallSafeServices(string $sName, BxBaseModConnectModule $oModule, array $aForged, callable $fAfter): int
    {
        $this->bxSetProtected($oModule, '_bIsApi', true, BxBaseModGeneralModule::class);

        $iCalls = 0;
        foreach (array_keys($oModule->serviceGetSafeServices()) as $sService) {
            $sMethod = 'service' . $sService;
            if (!method_exists($oModule, $sMethod))
                continue;

            foreach ($aForged as $aProfile) {
                foreach ([json_encode($aProfile), $aProfile] as $mParams) {
                    try {
                        $oModule->$sMethod($mParams);
                    } catch (\Throwable $e) {
                        // a refusal by exception is not a sign in
                    }

                    $fAfter("$sName::$sMethod");
                    $this->bxBecomeGuest();
                    $iCalls++;
                }
            }
        }
        return $iCalls;
    }

    public function testSafeListedServicesDoNotTrustForgedRemoteProfile(): void
    {
        $aModules = $this->bxConnectModules();
        if (!$aModules)
            $this->markTestSkipped('No connect module is installed.');

        $iChecked = 0;
        foreach ($aModules as $sName => $oModule) {
            [, $sRemoteId, $sEmail] = $this->bxVictim($sName, $oModule);

            $iChecked += $this->bxCallSafeServices($sName, $oModule, $this->bxForgedProfiles($sRemoteId, $sEmail), function ($sWhere) {
                $this->assertFalse(isLogged(), "$sWhere signed in a forged remote profile.");
                $this->assertSame(0, (int)BxDolSession::getInstance()->getUserId(), "$sWhere started a session for a forged remote profile.");
            });
        }

        if (!$iChecked)
            $this->markTestSkipped('No connect module has a safe-listed service.');
        $this->assertGreaterThan(0, $iChecked);
    }

    public function testNoForgedAccountIsCreated(): void
    {
        $aModules = $this->bxConnectModules();
        if (!$aModules)
            $this->markTestSkipped('No connect module is installed.');

        $sNewId = (string)random_int(800000000, 899999999);
        $sEmail = $sNewId . '@example.com';
        $aForged = [['id' => $sNewId, 'sub' => $sNewId, 'uid' => $sNewId, 'email' => $sEmail, 'mail' => $sEmail, 'email_verified' => true, 'verified_email' => true, 'name' => 'Forged', 'given_name' => 'Forged']];

        foreach ($aModules as $sName => $oModule)
            $this->bxCallSafeServices($sName, $oModule, $aForged, function () {});

        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_accounts` WHERE `email` = :email", ['email' => $sEmail]), 'A safe-listed service created an account from a forged profile.');
    }
}
