<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Likes can always be taken back, whatever the vote object's IsUndo setting;
 * poll answer votes, which are likes only in form, keep that setting.
 */
#[Group('integration')]
class LikesUndoTest extends BxDolIntegrationTestCase
{
    public function testLikeObjectsAreUndoableWhateverIsUndo(): void
    {
        $aObjects = BxDolDb::getInstance()->getColumn("SELECT `Name` FROM `sys_objects_vote` WHERE `IsUndo` = 0 AND `Name` IN ('sys_cmts', 'bx_timeline', 'bx_posts', 'bx_persons')");
        if (empty($aObjects))
            $this->markTestSkipped('No like objects with IsUndo = 0 are installed.');

        foreach ($aObjects as $sName) {
            $oVote = BxDolVote::getObjectInstance($sName, 1, false);
            if (!$oVote instanceof BxDolVoteLikes)
                continue;

            $this->assertTrue($oVote->isUndo(), $sName . ' likes should be undoable.');
        }
    }

    public function testPollAnswerVotesKeepIsUndo(): void
    {
        $aRows = BxDolDb::getInstance()->getAll("SELECT `Name`, `IsUndo` FROM `sys_objects_vote` WHERE `Name` LIKE '%\\_poll\\_answers' OR `Name` = 'bx_polls_subentries'");
        if (empty($aRows))
            $this->markTestSkipped('No poll answer vote objects are installed.');

        foreach ($aRows as $aRow) {
            $oVote = BxDolVote::getObjectInstance($aRow['Name'], 1, false);
            if (!$oVote)
                continue;

            $this->assertSame((int)$aRow['IsUndo'] === 1, $oVote->isUndo(), $aRow['Name'] . ' should follow IsUndo.');
        }
    }

    public function testMemberCanLikeAndTakeItBack(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $iEventId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `bx_timeline_events` WHERE `active` = 1 ORDER BY `id` DESC LIMIT 1");
        if (!$iEventId)
            $this->markTestSkipped('There are no timeline events to like.');

        $this->bxLoginAsUser();

        $oVote = BxDolVote::getObjectInstance('bx_timeline', $iEventId);
        $this->assertInstanceOf(BxDolVoteLikes::class, $oVote);
        if (!$oVote->isAllowedVote())
            $this->markTestSkipped('The test user may not like timeline events.');

        $iProfileId = bx_get_logged_profile_id();
        $bVotedBefore = (bool)$oVote->isPerformed($iEventId, $iProfileId);

        try {
            $aFirst = $oVote->vote(['value' => 1]);
            $this->assertSame(0, (int)($aFirst['code'] ?? 0), 'First vote failed: ' . json_encode($aFirst));
            $this->assertSame(!$bVotedBefore, $aFirst['api']['is_voted']);

            // Before IsUndo was ignored for likes, this second vote was refused as a duplicate.
            $aSecond = $oVote->vote(['value' => 1]);
            $this->assertSame(0, (int)($aSecond['code'] ?? 0), 'Second vote failed: ' . json_encode($aSecond));
            $this->assertSame($bVotedBefore, $aSecond['api']['is_voted']);
        }
        finally {
            // Leave the member's vote as it was, even when an assertion above failed.
            if ((bool)$oVote->isPerformed($iEventId, $iProfileId) !== $bVotedBefore)
                $oVote->vote(['value' => 1]);
        }
    }
}
