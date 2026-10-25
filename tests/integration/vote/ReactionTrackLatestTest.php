<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The reaction a member's do-button shows is their newest track row for the object.
 */
#[Group('integration')]
class ReactionTrackLatestTest extends BxDolIntegrationTestCase
{
    private const SYSTEM = 'sys_cmts_reactions';
    private const OBJECT_ID = 2000000001;

    private string $_sTable = '';

    protected function tearDown(): void
    {
        if ($this->_sTable)
            BxDolDb::getInstance()->query("DELETE FROM `{$this->_sTable}` WHERE `object_id` = :object_id", ['object_id' => self::OBJECT_ID]);

        parent::tearDown();
    }

    public function testLatestReactionIsTheNewestRow(): void
    {
        $oVote = BxDolVote::getObjectInstance(self::SYSTEM, self::OBJECT_ID, false);
        if (!$oVote instanceof BxDolVoteReactions)
            $this->markTestSkipped(self::SYSTEM . ' is not installed.');

        $oQuery = $this->bxGetProtected($oVote, '_oQuery', BxDolObject::class);
        $this->_sTable = $this->bxGetProtected($oQuery, '_sTableTrack', BxDolObjectQuery::class);

        $oDb = BxDolDb::getInstance();
        foreach ([[7, 'like'], [7, 'love'], [8, 'wow'], [7, 'joy'], [8, 'sad']] as $aRow)
            $oDb->query("INSERT INTO `{$this->_sTable}` SET `object_id` = :object_id, `author_id` = :author_id, `author_nip` = 0, `reaction` = :reaction, `value` = 1, `date` = :date", [
                'object_id' => self::OBJECT_ID,
                'author_id' => $aRow[0],
                'reaction' => $aRow[1],
                'date' => time(),
            ]);

        $this->assertSame('joy', $oQuery->getTrackLatest(self::OBJECT_ID, 7)['reaction']);
        $this->assertSame('sad', $oQuery->getTrackLatest(self::OBJECT_ID, 8)['reaction']);
        $this->assertEmpty($oQuery->getTrackLatest(self::OBJECT_ID, 9));
    }
}
