<?php

/**
 * What API v2 tests make for themselves, so that they depend on nothing a site happens to have
 * and a fresh install runs them instead of skipping: the test user and other people (each with
 * an account of its own), an administrator, a second profile of an account, a group, a
 * notification, a conversation.
 *
 * Everything is made the way the site makes it (the account form, the modules' add services,
 * requests to the API) and removed the way the site removes it:
 * - people are kept for the class (tests clean up what they do to them, as they do with people
 *   the site already has) and deleted with their accounts and content after it, and at the end
 *   of the process if it dies before that;
 * - what one test made on top (a second profile, a group, a conversation, a follow) goes after
 *   that test.
 *
 * The tests look for nobody on the site: every person, the test user included, is made here,
 * so a run leaves the site's own members, their feeds and their uploads as they were. With
 * UNA_TEST_SITE_DATA=1 in the environment they act as the site's test user
 * (UNA_TEST_USER_EMAIL) and take the other people and groups from the site where it has them,
 * making only what is missing: for looking at a failure against real data.
 */
trait ApiV2Seeds
{
    /** Accounts made for the class: [account id => ['profile' => its person, 'admin' => bool, 'user' => bool, 'email' => its address, 'keys' => sys_keys rows made with it]] */
    protected static $_aSeedAccounts = [];
    protected static $_bSeedShutdown = false;

    /** Made by one test, removed after it. */
    protected $_aSeedProfiles = [];
    protected $_aSeedGroups = [];
    protected $_aSeedConversations = [];
    protected $_aSeedConnections = [];

    /**
     * Whether the tests make everyone they act as (the default), or may use the people and
     * groups the site has (UNA_TEST_SITE_DATA=1).
     */
    protected static function seedOnly(): bool
    {
        $s = getenv('UNA_TEST_SITE_DATA');
        if ($s === false || $s === '')
            $s = $_ENV['UNA_TEST_SITE_DATA'] ?? $_SERVER['UNA_TEST_SITE_DATA'] ?? '';
        return in_array(strtolower((string)$s), ['', '0', 'false', 'off'], true);
    }

    /**
     * The account the tests act as: one made for the class. Null when the site's own test user
     * is to be used: the tests were told to use the site's data and that account is installed
     * and acts as an active person, or there is no Persons module to make one with.
     */
    protected function seedTestUser(): ?BxDolAccount
    {
        foreach (self::$_aSeedAccounts as $iAccount => $a)
            if ($a['user'])
                return BxDolAccount::getInstance($iAccount, true) ?: null;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            return null;

        if (!self::seedOnly() && ($oAccount = BxDolAccount::getInstance($this->bxTestEmail('user'), true))) {
            $oProfile = BxDolProfile::getInstanceByAccount($oAccount->id(), true);
            if ($oProfile && $oProfile->getModule() === 'bx_persons' && $oProfile->getStatus() === BX_PROFILE_STATUS_ACTIVE)
                return null;
        }

        $iProfile = $this->seedPerson('user', false, true);
        return BxDolAccount::getInstance((int)BxDolProfile::getInstance($iProfile)->getAccountId(), true);
    }

    /**
     * A new active person with an account of its own, made as a member who signs up and adds a
     * person: the account form, then the Persons module's add service.
     * @return int its profile id
     */
    protected function seedPerson(string $sName = 'person', bool $bAdmin = false, bool $bUser = false): int
    {
        $this->requireModule('bx_persons');
        self::seedGuard();

        $oDb = BxDolDb::getInstance();
        $aKeysBefore = $oDb->getColumn("SELECT `key` FROM `sys_keys`");

        BxDolForm::unSetObjectInstance('sys_account', 'sys_account_create');
        $sTag = bin2hex(random_bytes(4));
        $sEmail = 'apiv2test-' . $sTag . '@example.com';
        $aResult = bx_instance('BxTemplAccountForms')->createAccount([
            'name' => 'ApiV2Test ' . $sName . ' ' . $sTag,
            'email' => $sEmail,
            'password' => $this->bxTestPassword('user'),
        ], BX_PROFILE_ACTION_AUTO, false);
        $iAccount = (int)($aResult['account_id'] ?? 0);
        $this->assertGreaterThan(0, $iAccount, 'an account was made: ' . json_encode($aResult['error'] ?? ''));
        // on the list at once: whatever fails from here on, the account is removed
        self::$_aSeedAccounts[$iAccount] = ['profile' => 0, 'admin' => $bAdmin, 'user' => $bUser, 'email' => $sEmail, 'keys' => []];
        self::$_aSeedAccounts[$iAccount]['keys'] = array_values(array_diff($oDb->getColumn("SELECT `key` FROM `sys_keys`"), $aKeysBefore));

        $oAccount = BxDolAccount::getInstance($iAccount, true);
        if (!$oAccount->isConfirmedEmail())
            $oAccount->updateEmailConfirmed(true, false);
        if ($bAdmin)
            BxDolAccountQuery::getInstance()->_updateField($iAccount, 'role', BX_DOL_ROLE_MEMBER | BX_DOL_ROLE_ADMIN);

        $iAuthor = (int)$aResult['profile_id'];
        $aFields = BxDolService::call('bx_persons', 'prepare_fields', [['author' => $iAuthor, 'name' => 'ApiV2Test ' . $sName . ' ' . $sTag]]);
        $a = BxDolService::call('bx_persons', 'entity_add_forcedly', [$iAuthor, $aFields]);
        $this->assertSame(0, (int)($a['code'] ?? 1), 'a person was made: ' . json_encode($a['message'] ?? $a['errors'] ?? ''));

        // the add approves it after the profile was read: ask the database
        $oDb->cleanMemoryAll();
        $iProfile = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($iAccount, true);
        $aProfile = BxDolProfileQuery::getInstance()->getInfoById($iProfile);
        $this->assertSame('bx_persons', $aProfile['type'] ?? '', 'the person is the account\'s current profile');
        if (($aProfile['status'] ?? '') !== BX_PROFILE_STATUS_ACTIVE) {
            // a site that approves new people by hand: as its administrator would
            BxDolProfile::getInstance($iProfile)->approve(BX_PROFILE_ACTION_MANUAL, 0, false);
            $oDb->cleanMemoryAll();
            $this->assertSame(BX_PROFILE_STATUS_ACTIVE, BxDolProfileQuery::getInstance()->getInfoById($iProfile)['status'] ?? '', 'the person is active');
        }
        self::$_aSeedAccounts[$iAccount]['profile'] = $iProfile;

        if ($bAdmin) {
            BxDolAcl::getInstance()->setMembership($iProfile, MEMBERSHIP_ID_ADMINISTRATOR, 0, true);
            $oDb->cleanMemoryAll();
        }

        self::$_aSeedAccounts[$iAccount]['keys'] = array_values(array_diff($oDb->getColumn("SELECT `key` FROM `sys_keys`"), $aKeysBefore));
        BxDolAccount::getInstance($iAccount, true);
        self::seedRefresh($iProfile);
        return $iProfile;
    }

    /**
     * A person made for the class that this test can use: the first one that fits, or a new
     * one. The test user is never one of them.
     * @param callable|null $fnFits (profile id) => bool
     */
    protected function seedPooledPerson(?callable $fnFits = null, bool $bAdmin = false): int
    {
        foreach (self::$_aSeedAccounts as $a)
            if ($a['profile'] && !$a['user'] && $a['admin'] === $bAdmin && (!$fnFits || $fnFits((int)$a['profile'])))
                return (int)$a['profile'];

        $iProfile = $this->seedPerson($bAdmin ? 'admin' : 'person', $bAdmin);
        if ($fnFits && !$fnFits($iProfile))
            $this->fail('A new person does not fit what the test asks of one.');
        return $iProfile;
    }

    /**
     * One more active person of an account that has one; the account goes on acting as the
     * profile it acted as. Deleted after the test.
     * @return int its profile id
     */
    protected function seedSecondProfile(BxDolAccount $oAccount): int
    {
        $this->requireModule('bx_persons');
        $iAccount = (int)$oAccount->id();
        $oDb = BxDolDb::getInstance();
        $iCurrent = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($iAccount, true);
        $aBefore = array_map('intval', $oAccount->getProfilesIds(false));

        $aFields = BxDolService::call('bx_persons', 'prepare_fields', [['author' => $iCurrent, 'name' => 'ApiV2Test second ' . bin2hex(random_bytes(3))]]);
        $a = BxDolService::call('bx_persons', 'entity_add_forcedly', [$iCurrent, $aFields]);
        $this->assertSame(0, (int)($a['code'] ?? 1), 'a second person was made: ' . json_encode($a['message'] ?? $a['errors'] ?? ''));

        $oDb->cleanMemoryAll();
        $oAccount = BxDolAccount::getInstance($iAccount, true);
        $aNew = array_values(array_diff(array_map('intval', $oAccount->getProfilesIds(false)), $aBefore));
        $this->assertCount(1, $aNew, 'the account has one more profile');
        $this->_aSeedProfiles[] = [$aNew[0], $iAccount, $iCurrent];

        if (($aStatus = BxDolProfileQuery::getInstance()->getInfoById($aNew[0])) && $aStatus['status'] !== BX_PROFILE_STATUS_ACTIVE)
            BxDolProfile::getInstance($aNew[0])->approve(BX_PROFILE_ACTION_MANUAL, 0, false);
        // adding a profile makes it the current one
        $oAccount->updateProfileContext($iCurrent);
        $oDb->cleanMemoryAll();
        self::seedRefresh($aNew[0]);
        return $aNew[0];
    }

    /**
     * A group made through the Groups module's own add service, as its owner made it on the
     * site; deleted with its content after the test.
     * @param string $sView allow_view_to: BX_DOL_PG_ALL, 'c' (closed) or 's' (secret)
     * @return int its profile id
     */
    protected function seedGroup(int $iOwner, $sView = BX_DOL_PG_ALL, bool $bApproval = false): int
    {
        $this->requireModule('bx_groups');
        if ($this->_iNotificationsFrom === null)
            $this->forgetNotificationsFromNowOn();

        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, [
                'group_name' => 'ApiV2Test group ' . bin2hex(random_bytes(3)),
                'group_desc' => '<p>Made by ApiV2Test</p>',
                'group_cat' => (string)(array_key_last(is_array($aCats) ? $aCats : []) ?? ''),
                'allow_view_to' => $sView,
                'allow_post_to' => 'p', // BX_BASE_MOD_GROUPS_PG_PARTICIPANTS: members
                'join_confirmation' => $bApproval ? 1 : 0,
            ]);
        }
        finally {
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
        $this->assertSame(0, $a['code'] ?? null, 'the group was made: ' . json_encode($a['errors'] ?? $a['message'] ?? ''));

        $oProfile = BxDolProfile::getInstanceByContentAndType((int)$a['content']['id'], 'bx_groups');
        $this->_aSeedGroups[] = (int)$oProfile->id();
        // the add approves it after the profile was read: ask the database
        BxDolDb::getInstance()->cleanMemoryAll();
        $sStatus = BxDolProfileQuery::getInstance()->getInfoById((int)$oProfile->id())['status'] ?? '';
        if ($sStatus !== BX_PROFILE_STATUS_ACTIVE)
            $this->markTestSkipped('New groups wait for approval on this site (' . $sStatus . ').');
        return (int)$oProfile->id();
    }

    /**
     * An active group anyone may see: one the site has, or a new one of a person made here.
     * @return int its profile id
     */
    protected function seedAnyPublicGroup(): int
    {
        $this->requireModule('bx_groups');
        if (!self::seedOnly()) {
            $iGroup = (int)BxDolDb::getInstance()->getOne("SELECT `p`.`id` FROM `sys_profiles` AS `p` INNER JOIN `bx_groups_data` AS `d` ON `d`.`id` = `p`.`content_id` WHERE `p`.`type` = 'bx_groups' AND `p`.`status` = 'active' AND `d`.`allow_view_to` = :all ORDER BY `p`.`id` LIMIT 1", ['all' => (string)BX_DOL_PG_ALL]);
            if ($iGroup)
                return $iGroup;
        }
        return $this->seedGroup($this->seedPooledPerson());
    }

    /**
     * Something for the profile's notifications: another person follows it, through the API,
     * and the site's own alerts make the notification. The follow is taken back after the test,
     * the notification with it (forgetNotificationsFromNowOn()).
     * @param int $iAgo how long ago it happened, in seconds: the notification is dated back,
     *        for a test that puts newer ones before it
     * @return int the follower's profile id
     */
    protected function seedNotification(int $iProfileId, int $iAgo = 3600): int
    {
        $this->requireModule('bx_notifications');
        if ($this->_iNotificationsFrom === null)
            $this->forgetNotificationsFromNowOn();
        $oDb = BxDolDb::getInstance();
        $iFrom = (int)$oDb->getOne("SELECT MAX(`id`) FROM `bx_notifications_events`");

        $oFollows = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        $iFollower = $this->seedPooledPerson(function ($i) use ($iProfileId, $oFollows) {
            return $i !== $iProfileId && !$oFollows->isConnected($i, $iProfileId);
        });
        $this->_aSeedConnections[] = [$iFollower, $iProfileId];
        $a = $this->http('POST', 'profiles/' . $iProfileId . '/follow', ['Authorization' => 'Bearer ' . $this->profileToken($iFollower)]);
        $this->assertContains($a['status'], [200, 201, 204], 'a person followed the profile: ' . $a['body']);
        if ($iAgo > 0)
            // only what these two made: the site may be in use while the tests run
            $oDb->query("UPDATE `bx_notifications_events` SET `date` = `date` - :ago WHERE `id` > :from AND (`owner_id` IN (:f, :p) OR `object_owner_id` IN (:f2, :p2))", ['ago' => $iAgo, 'from' => $iFrom, 'f' => $iFollower, 'p' => $iProfileId, 'f2' => $iFollower, 'p2' => $iProfileId]);
        $oDb->cleanMemoryAll();
        return $iFollower;
    }

    /**
     * A conversation between two profiles, started through the API by the first; deleted for
     * everyone after the test.
     * @return int its id
     */
    protected function seedConversation(int $iFrom, int $iTo, string $sText = 'ApiV2Test seed'): int
    {
        $this->requireModule('bx_convos');
        $a = $this->http('POST', 'conversations', ['Authorization' => 'Bearer ' . $this->profileToken($iFrom), 'Content-Type' => 'application/json'], json_encode([
            'recipients' => [(string)$iTo], 'body' => '<p>' . $sText . '</p>',
        ]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aSeedConversations[] = (int)$a['json']['id'];
        BxDolDb::getInstance()->cleanMemoryAll();
        return (int)$a['json']['id'];
    }

    /**
     * After a test: what it made on top of the class's people, the newest first.
     */
    protected function seedRemoveTestData(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_aSeedConnections || $this->_aSeedGroups || $this->_aSeedConversations || $this->_aSeedProfiles)
            $oDb->cleanMemoryAll();

        foreach (array_reverse($this->_aSeedConnections) as list($iA, $iB))
            foreach (['sys_profiles_friends', 'sys_profiles_subscriptions'] as $sObject)
                if (($oConnection = BxDolConnection::getObjectInstance($sObject)))
                    foreach ([[$iA, $iB], [$iB, $iA]] as list($i, $c))
                        if ($oConnection->isConnected($i, $c))
                            $oConnection->removeConnection($i, $c);
        $this->_aSeedConnections = [];

        if ($this->_aSeedConversations && BxDolModuleQuery::getInstance()->isEnabledByName('bx_convos')) {
            $oConvos = BxDolModule::getInstance('bx_convos');
            foreach (array_reverse($this->_aSeedConversations) as $iId)
                $oConvos->_oDb->deleteConvo($iId);
        }
        $this->_aSeedConversations = [];

        // as the site deletes a group: with its content and memberships
        foreach (array_reverse($this->_aSeedGroups) as $iGroup)
            if (($oGroup = BxDolProfile::getInstance($iGroup)))
                $oGroup->delete(false, true, true);
        self::seedForget($this->_aSeedGroups);
        $this->_aSeedGroups = [];

        foreach (array_reverse($this->_aSeedProfiles) as list($iProfile, $iAccount, $iCurrent)) {
            if (($oAccount = BxDolAccount::getInstance($iAccount, true)) && (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($iAccount, true) !== $iCurrent)
                $oAccount->updateProfileContext($iCurrent);
            self::seedDeleteUploads([$iProfile]);
            if (($oProfile = BxDolProfile::getInstance($iProfile)))
                $oProfile->delete(false, true, true);
            self::seedForget([$iProfile]);
        }
        if ($this->_aSeedProfiles)
            $oDb->cleanMemoryAll();
        $this->_aSeedProfiles = [];
    }

    /**
     * After the class (and at the end of the process, should it die first): the people made
     * for it, each with its account, profiles and content, as the site deletes an account.
     */
    protected static function seedRemovePeople(): void
    {
        if (!self::$_aSeedAccounts)
            return;

        $oDb = BxDolDb::getInstance();
        $oDb->cleanMemoryAll();
        foreach (array_reverse(self::$_aSeedAccounts, true) as $iAccount => $a) {
            $aProfiles = array_map('intval', $oDb->getColumn("SELECT `id` FROM `sys_profiles` WHERE `account_id` = :a", ['a' => $iAccount]));
            self::seedDeleteUploads($aProfiles);
            if (($oAccount = BxDolAccount::getInstance($iAccount, true)))
                $oAccount->delete(true);
            self::seedForget($aProfiles);
            // the keys of its confirmation mails, and the mails still waiting to be sent to it
            foreach ($a['keys'] as $sKey)
                $oDb->query("DELETE FROM `sys_keys` WHERE `key` = :k", ['k' => $sKey]);
            foreach ([serialize(['account_id' => $iAccount]), serialize(['account_id' => (string)$iAccount])] as $sData)
                $oDb->query("DELETE FROM `sys_keys` WHERE `data` = :d", ['d' => $sData]);
            $oDb->query("DELETE FROM `sys_queue_email` WHERE `email` = :e", ['e' => $a['email']]);
            unset(self::$_aSeedAccounts[$iAccount]);
        }
        $oDb->cleanMemoryAll();
    }

    /**
     * The files these profiles uploaded that are still theirs (uploads a test left unused, and
     * files of content the site deleted without them): each through its storage, which also
     * removes it from the list of uploads. Deleting an account does not do this.
     */
    protected static function seedDeleteUploads(array $aProfiles): void
    {
        $aProfiles = array_filter(array_map('intval', $aProfiles));
        if (!$aProfiles)
            return;

        foreach (BxDolDb::getInstance()->getAll("SELECT `id`, `profile_id`, `object` FROM `sys_storage_ghosts` WHERE `profile_id` IN (" . implode(',', $aProfiles) . ")") as $aGhost)
            if (($oStorage = BxDolStorage::getObjectInstance($aGhost['object'])))
                $oStorage->deleteFile((int)$aGhost['id'], (int)$aGhost['profile_id']);
    }

    /**
     * What the site keeps of profiles it deleted, in tables it only ever adds to: the
     * Attendant's events about them, the recommendations worked out for them (and the jobs
     * waiting to work them out), their reputation, their upload quota, their tokens.
     */
    protected static function seedForget(array $aProfiles): void
    {
        $aProfiles = array_filter(array_map('intval', $aProfiles));
        if (!$aProfiles)
            return;

        $oDb = BxDolDb::getInstance();
        $sIds = implode(',', $aProfiles);
        foreach ([
            ['bx_attendant_events', 'profile_id'], ['sys_recommendation_data', 'profile_id'], ['sys_storage_user_quotas', 'profile_id'],
            ['bx_reputation_profiles', 'profile_id'], ['bx_reputation_profiles_levels', 'profile_id'], ['bx_reputation_events', 'owner_id'],
            ['sys_storage_ghosts', 'profile_id'], ['bx_oauth_access_tokens', 'user_id'], ['bx_oauth_refresh_tokens', 'user_id'],
        ] as list($sTable, $sField))
            if ($oDb->isTableExists($sTable))
                $oDb->query("DELETE FROM `" . $sTable . "` WHERE `" . $sField . "` IN (" . $sIds . ")");

        // the one-off jobs that would work out recommendations for them at the next cron run
        foreach ($aProfiles as $iProfile)
            $oDb->query("DELETE FROM `sys_cron_jobs` WHERE `time` = 'transient' AND `name` = :n", ['n' => 'recommendations_for_' . $iProfile]);
    }

    /**
     * This process read the profile while it was being made (not yet approved): its object and
     * its membership level are read again, so that a test sees the member it is now.
     */
    protected static function seedRefresh(int $iProfile): void
    {
        unset($GLOBALS['bxDolClasses']['BxDolProfile_' . $iProfile]);
        BxDolProfile::getInstance($iProfile, true);
        BxDolAcl::getInstance()->getMemberMembershipInfo($iProfile, 0, true);
    }

    protected static function seedGuard(): void
    {
        if (self::$_bSeedShutdown)
            return;
        self::$_bSeedShutdown = true;
        register_shutdown_function(function () {
            try {
                self::seedRemovePeople();
            } catch (Throwable $e) {
                fwrite(STDERR, "ApiV2Seeds: people made for the tests were not all removed: " . $e->getMessage() . "\n");
            }
        });
    }
}
