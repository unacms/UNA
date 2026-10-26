<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Pending queue rows of a transcoder that isn't registered any more (its module was
 * uninstalled) are skipped by the queue runner, so they can't take its places. They stay
 * in the queue. The test adds one such row and deletes it.
 */
#[Group('integration')]
class TranscoderQueueOrphansTest extends BxDolIntegrationTestCase
{
    private int $_iOrphanId = 0;

    protected function tearDown(): void
    {
        if ($this->_iOrphanId)
            BxDolDb::getInstance()->query("DELETE FROM `sys_transcoder_queue` WHERE `id` = :id", ['id' => $this->_iOrphanId]);

        parent::tearDown();
    }

    public function testRowsOfAnUnregisteredTranscoderAreSkipped(): void
    {
        $oDb = BxDolDb::getInstance();
        if ((int)$oDb->getOne("SELECT COUNT(*) FROM `sys_transcoder_queue` WHERE `server` = :server AND `status` = 'processing'", ['server' => gethostname()]))
            $this->markTestSkipped('A file is being transcoded on this server.');

        $oDb->query("INSERT INTO `sys_transcoder_queue` SET `transcoder_object` = 'phpunit_unregistered_transcoder', `profile_id` = 0, `file_url_source` = '', `file_id_source` = 'phpunit', `file_url_result` = '', `file_ext_result` = '', `file_id_result` = 0, `server` = '', `status` = 'pending', `added` = 1, `changed` = 1, `log` = ''");
        $this->_iOrphanId = (int)$oDb->lastId();

        $aRows = BxDolTranscoderQuery::getNextInQueue(gethostname(), 1000);

        $this->assertNotContains($this->_iOrphanId, array_map('intval', array_column($aRows, 'id')), 'The oldest pending row is skipped.');

        $aRegistered = $oDb->getColumn("SELECT `object` FROM `sys_objects_transcoder`");
        foreach ($aRows as $aRow)
            $this->assertContains($aRow['transcoder_object'], $aRegistered);

        $this->assertSame('pending', $oDb->getOne("SELECT `status` FROM `sys_transcoder_queue` WHERE `id` = :id", ['id' => $this->_iOrphanId]), 'The row is kept.');
    }
}
