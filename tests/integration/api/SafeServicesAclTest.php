<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A logged-in member may call every safe service. These cases are the ones that used to
 * trust an account, profile, or content id from the request. Each one is called as the
 * standard member and must stop where the page would stop.
 */
#[Group('integration')]
class SafeServicesAclTest extends BxDolIntegrationTestCase
{
    private const MARK = 'SafeServicesAclTest';
    private const OPTIONS = [
        'sys_account_activation_2fa_enable',
        'sys_account_activation_2fa_lifetime',
        'sys_sms_default',
    ];

    protected $_aGetBackup;
    protected $_aOptionsBackup = [];
    protected $_iPostId = 0;
    protected $_iGroupId = 0;
    protected $_iGroupProfileId = 0;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();

        if ($this->_iGroupProfileId) {
            $oDb->query("DELETE FROM `bx_groups_fans` WHERE `content` = :id", ['id' => $this->_iGroupProfileId]);
            $oDb->query("DELETE FROM `sys_profiles` WHERE `id` = :id", ['id' => $this->_iGroupProfileId]);
        }
        if ($this->_iGroupId)
            $oDb->query("DELETE FROM `bx_groups_data` WHERE `id` = :id", ['id' => $this->_iGroupId]);

        if ($this->_iPostId) {
            BxDolPage::deleteSeoLink('bx_posts', 'bx_posts', $this->_iPostId);
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $this->_iPostId]);
        }

        foreach ($this->_aOptionsBackup as $sName => $mixedValue)
            $this->bxSetParamCache($sName, $mixedValue);

        BxTemplServiceLogin::reset2faLogin();
        unset(
            $GLOBALS['bxDolClasses']['BxDolGrid!bx_posts_common'],
            $GLOBALS['bxDolClasses']['BxDolGrid!bx_groups_fans'],
            $GLOBALS['bxDolClasses']['BxPostsModule'],
            $GLOBALS['bxDolClasses']['BxGroupsModule']
        );

        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    public function testAccountSettingsStayOnTheLoggedInAccount(): void
    {
        $this->bxLoginAsUser();
        $oAdmin = $this->bxAccount('admin');
        $sEmail = $oAdmin->getEmail();
        $iAdminId = (int)$oAdmin->id();

        $mixedEdit = BxDolAccount::isAllowedEdit(bx_get_logged_profile_id(), ['id' => $iAdminId]);
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $mixedEdit);

        // The form itself refuses another account before it draws anything.
        $oForms = new BxTemplAccountForms();
        $mixedDenied = $oForms->editAccountEmailSettingsForm($iAdminId);
        $this->assertIsString($mixedDenied);
        $this->assertStringNotContainsString($sEmail, $mixedDenied);

        // The service drops the caller id and opens the logged-in account. Drawing that form
        // stores a key; a database without the key scope column stops there, after the check.
        $oService = new BxTemplServiceAccount();
        try {
            $mixedForm = $oService->serviceAccountSettingsEmail($iAdminId);
        } catch (PDOException $oException) {
            $mixedForm = null;
            if (!str_contains($oException->getMessage(), 'scope'))
                throw $oException;
        }
        if (is_string($mixedForm))
            $this->assertStringNotContainsString($sEmail, $mixedForm);

        $oAdmin = BxDolAccount::getInstance($iAdminId, true);
        $this->assertSame($sEmail, $oAdmin->getEmail());
    }

    public function testFriendRequestsOfAnotherProfileAreHidden(): void
    {
        $this->bxLoginAsUser();
        $iAdmin = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();

        $oService = new BxTemplServiceProfiles();
        $this->assertSame('', $oService->serviceBrowseFriendRequests($iAdmin));
        $this->assertSame('', $oService->serviceBrowseFriendRequested($iAdmin));
    }

    public function testConnectionAsAnotherProfileIsDenied(): void
    {
        $this->bxLoginAsUser();
        $iUser = (int)bx_get_logged_profile_id();
        $iAdmin = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $oConn = BxDolConnection::getObjectInstance('sys_profiles_friends');
        $this->assertNotFalse($oConn);

        $bBefore = (bool)$oConn->isConnected($iAdmin, $iUser);
        $oService = new BxTemplServiceConnections();
        $aResult = $oService->servicePerform([
            'o' => 'sys_profiles_friends',
            'a' => 'add',
            'iid' => $iAdmin,
            'cid' => $iUser,
        ]);

        $this->assertSame(3, $aResult['code'] ?? null);
        $this->assertSame($bBefore, (bool)$oConn->isConnected($iAdmin, $iUser));

        $bMutual = (bool)$oConn->isConnected($iUser, $iAdmin, true);
        $oProfiles = new BxTemplServiceProfiles();
        $oProfiles->serviceBefriend(json_encode(['profile_id' => $iAdmin, 'action' => 'add']));
        $this->assertSame($bMutual, (bool)$oConn->isConnected($iUser, $iAdmin, true));

        if (!$bMutual && $oConn->isConnected($iUser, $iAdmin))
            $oConn->removeConnection($iUser, $iAdmin);
    }

    public function testCommonGridEnableOfAnotherPostIsDenied(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');

        $this->bxLoginAsUser();
        $iPost = $this->addPost();

        unset($GLOBALS['bxDolClasses']['BxDolGrid!bx_posts_common'], $GLOBALS['bxDolClasses']['BxPostsModule']);
        $_GET['api'] = 1;
        $_GET['ids'] = [$iPost];

        $oGrid = BxDolGrid::getObjectInstance('bx_posts_common');
        $this->assertNotFalse($oGrid);

        $aAffected = $oGrid->performActionEnable(0);
        $this->assertSame([], $aAffected);

        $sStatus = BxDolDb::getInstance()->getOne("SELECT `status` FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iPost]);
        $this->assertSame('active', $sStatus);
    }

    public function testEditEntityCannotEditAnotherMembersContent(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');

        $this->bxLoginAsUser();
        $iPost = $this->addPost();
        $oModule = BxDolModule::getInstance('bx_posts');

        $sResult = $oModule->serviceEditEntity($iPost, ['title' => self::MARK . ' changed']);
        $this->assertNotSame('', $sResult);

        $sTitle = (string)BxDolDb::getInstance()->getOne("SELECT `title` FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iPost]);
        $this->assertSame(self::MARK . ' post', $sTitle);
    }

    public function testFansGridDeleteIsDenied(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_groups'))
            $this->markTestSkipped('Groups are not installed.');

        $this->bxLoginAsUser();
        $iUser = (int)bx_get_logged_profile_id();
        $iGroupProfile = $this->addGroup();

        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_groups_fans` SET `initiator` = :initiator, `content` = :content, `mutual` = 1, `added` = :added", [
            'initiator' => $iUser,
            'content' => $iGroupProfile,
            'added' => time(),
        ]);

        unset($GLOBALS['bxDolClasses']['BxDolGrid!bx_groups_fans'], $GLOBALS['bxDolClasses']['BxGroupsModule']);
        $_GET['api'] = 1;
        $_GET['profile_id'] = $iGroupProfile;
        $_GET['ids'] = [$iUser];

        $oGrid = BxDolGrid::getObjectInstance('bx_groups_fans');
        $this->assertNotFalse($oGrid);

        $aResult = $oGrid->performActionDelete();
        $this->assertIsArray($aResult);
        $this->assertSame(_t('_sys_txt_access_denied'), $aResult['msg'] ?? '');

        $iFans = (int)$oDb->getOne("SELECT COUNT(*) FROM `bx_groups_fans` WHERE `initiator` = :initiator AND `content` = :content", [
            'initiator' => $iUser,
            'content' => $iGroupProfile,
        ]);
        $this->assertSame(1, $iFans);
    }

    public function testReportAuthorsAreHidden(): void
    {
        $this->bxLoginAsUser();

        $sObject = (string)BxDolDb::getInstance()->getOne("SELECT `name` FROM `sys_objects_report` WHERE `is_on` = 1 LIMIT 1");
        if ($sObject === '')
            $this->markTestSkipped('No report object is installed.');

        $oService = new BxTemplReportServices();
        $aResult = $oService->serviceGetPerformedBy(['s' => $sObject, 'o' => 1]);

        $this->assertSame(BX_DOL_OBJECT_ERR_ACCESS_DENIED, $aResult['code'] ?? null);
        $this->assertArrayNotHasKey('performed_by', $aResult);
    }

    public function testLoginWithTwoFactorDoesNotSignIn(): void
    {
        $this->bxBecomeGuest();
        $this->bxSetParamCache('sys_account_activation_2fa_enable', 'on');
        $this->bxSetParamCache('sys_account_activation_2fa_lifetime', '0');
        $this->bxSetParamCache('sys_sms_default', 'test');

        $oAccount = $this->bxAccount('user');
        $_GET['api'] = 1;
        $this->bxSubmitLoginForm($oAccount->getEmail(), $this->bxTestPassword('user'));

        $oService = new BxTemplServiceLogin();
        $mixed = $oService->serviceLoginForm();

        $this->assertSame(0, (int)getLoggedId());
        $this->assertSame((int)$oAccount->id(), (int)BxDolSession::getInstance()->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID));
        $this->assertIsArray($mixed);
        $this->assertSame('redirect', $mixed[0]['type'] ?? '');
    }

    public function testRawContentInfoOverApiIsForAdminsOnly(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');

        $this->bxLoginAsUser();
        $iPost = $this->addPost();
        $this->assertTrue(BxDolService::call('bx_posts', 'is_safe_service', ['get_info']));

        // A member and a guest reach the service, but get searchable fields only.
        foreach (['user', 'guest'] as $sWho) {
            if ($sWho == 'guest')
                $this->bxBecomeGuest();

            $a = BxDolService::callExternal('bx_posts', 'get_info', [$iPost, false]);
            $this->assertIsArray($a, $sWho);
            $this->assertArrayNotHasKey('status_admin', $a, $sWho);
            $this->assertArrayNotHasKey('allow_view_to', $a, $sWho);

            $mixed = BxDolService::callExternal('bx_posts', 'get_info', [$iPost, 'status_admin']);
            $this->assertIsArray($mixed, $sWho);
            $this->assertArrayNotHasKey('status_admin', $mixed, $sWho);
        }

        // The same call from code keeps the whole row, whatever the request cached before.
        $a = BxDolService::call('bx_posts', 'get_info', [$iPost, false]);
        $this->assertArrayHasKey('status_admin', $a);

        $this->bxLoginAsAdmin();
        $a = BxDolService::callExternal('bx_posts', 'get_info', [$iPost, false]);
        $this->assertArrayHasKey('status_admin', $a);
    }

    public function testAnonymousPostApiDataHidesRealAuthor(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');

        $this->bxLoginAsUser();
        $iPost = $this->addPost();
        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        BxDolDb::getInstance()->query("UPDATE `bx_posts_posts` SET `author` = :author WHERE `id` = :id", ['author' => -$iAuthor, 'id' => $iPost]);

        $oModule = BxDolModule::getInstance('bx_posts');
        $aInfo = $oModule->_oDb->getContentInfoById($iPost);

        $aData = $oModule->decodeDataAPI($aInfo);
        $this->assertSame(0, $aData['author']);
        $this->assertNotSame($iAuthor, (int)($aData['author_data']['id'] ?? 0));

        $this->bxLoginAsAdmin();
        $aData = $oModule->decodeDataAPI($aInfo);
        $this->assertSame(-$iAuthor, $aData['author']);
    }

    public function testMemberAuthCodeIgnoresCallerButtons(): void
    {
        $this->bxLoginAsUser();

        $oService = new BxTemplServiceLogin();
        $sHtml = (string)$oService->serviceMemberAuthCode([[
            'Name' => 'evil',
            'Title' => 'Evil',
            'Link' => '',
            'OnClick' => 'alert(1)',
            'Icon' => '',
            'Style' => 'not-a-serialized-value',
        ]]);

        $this->assertStringNotContainsString('alert(1)', $sHtml);
        $this->assertStringNotContainsString('evil', $sHtml);
    }

    protected function addPost(): int
    {
        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $iNow = time();
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_posts_posts` SET " . $oDb->arrayToSQL([
            'author' => $iAuthor,
            'added' => $iNow,
            'changed' => $iNow,
            'published' => $iNow,
            'thumb' => 0,
            'thumb_data' => '',
            'title' => self::MARK . ' post',
            'cat' => 0,
            'multicat' => '',
            'abstract' => '',
            'text' => '<p>' . self::MARK . '</p>',
            'labels' => '',
            'location' => '',
            'allow_view_to' => BX_DOL_PG_ALL,
            'status' => 'active',
            'status_admin' => 'active',
        ]));
        $this->_iPostId = (int)$oDb->lastId();

        return $this->_iPostId;
    }

    protected function addGroup(): int
    {
        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $iNow = time();
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_groups_data` SET " . $oDb->arrayToSQL([
            'author' => $iAuthor,
            'added' => $iNow,
            'changed' => $iNow,
            'picture' => 0,
            'cover' => 0,
            'cover_data' => '',
            'group_name' => self::MARK . ' group',
            'group_cat' => 0,
            'group_desc' => '',
            'labels' => '',
            'location' => '',
            'allow_view_to' => (string)BX_DOL_PG_ALL,
            'status' => 'active',
            'status_admin' => 'active',
            'stg_tabs' => '',
        ]));
        $this->_iGroupId = (int)$oDb->lastId();
        $this->_iGroupProfileId = (int)BxDolProfileQuery::getInstance()->insertProfile($this->bxAccount('admin')->id(), $this->_iGroupId, 'active', 'bx_groups');
        $this->assertGreaterThan(0, $this->_iGroupProfileId);

        return $this->_iGroupProfileId;
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }
}
