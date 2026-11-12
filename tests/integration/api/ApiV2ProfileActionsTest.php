<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2's More of a profile's or a context's page, over real HTTP: GET /profiles/{id}/actions
 * (the site's view actions menus, of what the apps do: edit, report) and POST
 * /profiles/{id}/report. A report the test makes is taken out after it: its row and track row,
 * the counter on the content, the moderators' note (a comment of the report's comments object),
 * the audit row and the notifications.
 */
#[Group('integration')]
class ApiV2ProfileActionsTest extends ApiV2TestCase
{
    /** [report system, content id, the main row before, the counter before, the ids it had before] */
    protected $_aReports = [];

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aReports as list($aSystem, $iContentId, $aMain, $iCount, $aMax)) {
            $oDb->query("DELETE FROM `" . $aSystem['table_track'] . "` WHERE `object_id` = :o AND `id` > :i", ['o' => $iContentId, 'i' => $aMax['track']]);
            if ($aMain)
                $oDb->query("UPDATE `" . $aSystem['table_main'] . "` SET `count` = :c WHERE `object_id` = :o", ['c' => (int)$aMain['count'], 'o' => $iContentId]);
            else
                $oDb->query("DELETE FROM `" . $aSystem['table_main'] . "` WHERE `object_id` = :o", ['o' => $iContentId]);
            $oDb->query("UPDATE `" . $aSystem['trigger_table'] . "` SET `" . $aSystem['trigger_field_count'] . "` = :c WHERE `" . $aSystem['trigger_field_id'] . "` = :o", ['c' => $iCount, 'o' => $iContentId]);
            if ($aMax['cmts'] !== null) {
                $aCmts = $this->notesObject($aSystem);
                $oDb->query("DELETE FROM `sys_cmts_ids` WHERE `system_id` = :s AND `cmt_id` > :i", ['s' => (int)$aCmts['ID'], 'i' => $aMax['cmts']]);
                $oDb->query("DELETE FROM `" . $aCmts['Table'] . "` WHERE `cmt_id` > :i", ['i' => $aMax['cmts']]);
            }
            $oDb->query("DELETE FROM `sys_audit` WHERE `id` > :i", ['i' => $aMax['audit']]);
        }
        if ($this->_aReports)
            $oDb->cleanMemoryAll();
        parent::tearDown();
    }

    public function testOwnProfileOffersItsEditorAndAGuestNothing(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];

        $a = $this->http('GET', 'profiles/' . $iMe . '/actions', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertIsArray($a['json']);
        foreach ($a['json'] as $aItem)
            $this->assertSchema('ProfileAction', $aItem);
        $aEdit = array_values(array_filter($a['json'], fn($x) => $x['action'] === 'edit'));
        if (!$aEdit)
            $this->markTestSkipped('The site\'s More of a person offers no Edit profile in the apps.');
        $this->assertMatchesRegularExpression('/^edit-[a-z0-9-]+-profile$/', $aEdit[0]['name']);
        $this->assertNotSame('', $aEdit[0]['title']);
        $this->assertNull($aEdit[0]['choices']);
        $this->assertNotContains('report', array_column($a['json'], 'action'), 'one\'s own profile is not reported');

        $a = $this->http('GET', 'profiles/' . $iMe . '/actions');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([], $a['json'], 'a guest gets none');

        // the hero's commands and what the apps don't do are left out
        foreach ($this->http('GET', 'profiles/' . $iMe . '/actions', $aAuth)['json'] as $aItem)
            $this->assertContains($aItem['action'], ['edit', 'report']);

        $this->assertSame(404, $this->http('GET', 'profiles/999999999/actions', $aAuth)['status']);
    }

    public function testAnotherPersonsEditorIsNotOffered(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $iOther = $this->ordinaryProfileIdOtherThan([$iMe]);
        $a = $this->http('GET', 'profiles/' . $iOther . '/actions', ['Authorization' => 'Bearer ' . $sToken]);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertNotContains('edit', array_column($a['json'], 'action'), 'an ordinary member edits no one else\'s profile');
    }

    public function testReportAGroupOnce(): void
    {
        $this->requireModule('bx_groups');
        list($iMe, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iGroup = $this->reportableGroup($iMe, $aAuth);
        $oGroup = BxDolProfile::getInstance($iGroup);
        $iContentId = (int)$oGroup->getContentId();
        $aSystem = BxDolReport::getSystems()['bx_groups'];

        $a = $this->http('GET', 'profiles/' . $iGroup . '/actions', $aAuth);
        $aReport = array_values(array_filter($a['json'], fn($x) => $x['action'] === 'report'))[0];
        $this->assertSchema('ProfileAction', $aReport);
        $this->assertSame('report', $aReport['name']);
        $this->assertFalse($aReport['done']);
        $this->assertNotEmpty($aReport['choices']);
        $this->assertSame(array_keys(BxDolForm::getDataItems('sys_report_types')), array_column($aReport['choices'], 'name'), 'the site\'s reasons, in its order');
        $sType = $aReport['choices'][0]['name'];

        $a = $this->http('POST', 'profiles/' . $iGroup . '/report', ['Content-Type' => 'application/json'], json_encode(['type' => $sType]));
        $this->assertSame(401, $a['status'], $a['body']);
        $a = $this->http('POST', 'profiles/' . $iGroup . '/report', $aAuth + ['Content-Type' => 'application/json'], json_encode(['type' => 'no-such-reason']));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSchema('Problem', $a['json']);
        $a = $this->http('POST', 'profiles/' . $iMe . '/report', $aAuth + ['Content-Type' => 'application/json'], json_encode(['type' => $sType]));
        $this->assertSame(409, $a['status'], $a['body']);
        $this->assertSame('own_profile', $a['json']['code']);

        $this->rememberReport($aSystem, $iContentId);
        $this->forgetNotificationsFromNowOn();
        $a = $this->http('POST', 'profiles/' . $iGroup . '/report', $aAuth + ['Content-Type' => 'application/json'], json_encode(['type' => $sType, 'text' => 'Test report from the apps']));
        $this->assertSame(204, $a['status'], $a['body']);

        BxDolDb::getInstance()->cleanMemoryAll();
        $aRow = BxDolDb::getInstance()->getRow("SELECT * FROM `" . $aSystem['table_track'] . "` WHERE `object_id` = :o AND `author_id` = :a ORDER BY `id` DESC LIMIT 1", ['o' => $iContentId, 'a' => $iMe]);
        $this->assertNotEmpty($aRow, 'the site\'s report track has it');
        $this->assertSame($sType, $aRow['type']);
        $this->assertSame('Test report from the apps', $aRow['text']);

        $a = $this->http('GET', 'profiles/' . $iGroup . '/actions', $aAuth);
        $aReport = array_values(array_filter($a['json'], fn($x) => $x['action'] === 'report'))[0];
        $this->assertTrue($aReport['done'], 'reported');

        $a = $this->http('POST', 'profiles/' . $iGroup . '/report', $aAuth + ['Content-Type' => 'application/json'], json_encode(['type' => $sType]));
        $this->assertSame(409, $a['status'], $a['body']);
        $this->assertSame('already_reported', $a['json']['code']);
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `" . $aSystem['table_track'] . "` WHERE `object_id` = :o AND `author_id` = :a", ['o' => $iContentId, 'a' => $iMe]), 'not taken back, as the site\'s second press would');
    }

    /** A group of another account that the test user sees and the site lets them report (skips without one). */
    protected function reportableGroup(int $iMe, array $aAuth): int
    {
        $iAccount = (int)BxDolProfile::getInstance($iMe)->getAccountId();
        $aSystem = BxDolReport::getSystems()['bx_groups'] ?? null;
        if (!$aSystem)
            $this->markTestSkipped('Groups have no report object.');
        $aGroups = self::seedOnly() ? [] : BxDolDb::getInstance()->getColumn("SELECT `id` FROM `sys_profiles` WHERE `type` = 'bx_groups' AND `status` = 'active' AND `account_id` <> :a ORDER BY `id` LIMIT 20", ['a' => $iAccount]);
        // and, last, a group made for the test by a person of another account
        $aGroups[] = 0;
        foreach ($aGroups as $iGroup) {
            if (!$iGroup)
                $iGroup = $this->seedGroup($this->ordinaryProfileIdOtherThan([$iMe]));
            $oGroup = BxDolProfile::getInstance((int)$iGroup);
            if (BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `" . $aSystem['table_track'] . "` WHERE `object_id` = :o AND `author_id` = :a", ['o' => (int)$oGroup->getContentId(), 'a' => $iMe]))
                continue;
            $a = $this->http('GET', 'profiles/' . $iGroup . '/actions', $aAuth);
            if ($a['status'] === 200 && in_array('report', array_column($a['json'], 'action'), true))
                return (int)$iGroup;
        }
        $this->markTestSkipped('No group the test user may report (the site\'s Report of a group is not active in the apps?).');
    }

    protected function rememberReport(array $aSystem, int $iContentId): void
    {
        $oDb = BxDolDb::getInstance();
        $aCmts = $this->notesObject($aSystem);
        $this->_aReports[] = [
            $aSystem,
            $iContentId,
            $oDb->getRow("SELECT * FROM `" . $aSystem['table_main'] . "` WHERE `object_id` = :o", ['o' => $iContentId]),
            (int)$oDb->getOne("SELECT `" . $aSystem['trigger_field_count'] . "` FROM `" . $aSystem['trigger_table'] . "` WHERE `" . $aSystem['trigger_field_id'] . "` = :o", ['o' => $iContentId]),
            [
                'track' => (int)$oDb->getOne("SELECT IFNULL(MAX(`id`), 0) FROM `" . $aSystem['table_track'] . "`"),
                'cmts' => $aCmts ? (int)$oDb->getOne("SELECT IFNULL(MAX(`cmt_id`), 0) FROM `" . $aCmts['Table'] . "`") : null,
                'audit' => (int)$oDb->getOne("SELECT IFNULL(MAX(`id`), 0) FROM `sys_audit`"),
            ],
        ];
    }

    /** The comments object the report's notes go to (`object_comment`), as its row. */
    protected function notesObject(array $aSystem): ?array
    {
        if (empty($aSystem['object_comment']))
            return null;
        $a = BxDolDb::getInstance()->getRow("SELECT `ID`, `Table` FROM `sys_objects_cmts` WHERE `Name` = :n", ['n' => $aSystem['object_comment']]);
        return $a ?: null;
    }
}
