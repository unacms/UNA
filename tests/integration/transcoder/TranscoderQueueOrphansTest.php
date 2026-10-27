<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Pending queue rows of a transcoder that isn't registered any more (its module was
 * uninstalled) are skipped by the queue runner, so they can't take its places. They stay
 * in the queue, and rows of registered transcoders are still picked. The test adds its
 * rows and deletes them.
 */
#[Group('integration')]
class TranscoderQueueOrphansTest extends BxDolIntegrationTestCase
{
    private array $_aIds = [];

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("UNLOCK TABLES");
        foreach ($this->_aIds as $iId)
            $oDb->query("DELETE FROM `sys_transcoder_queue` WHERE `id` = :id", ['id' => $iId]);

        parent::tearDown();
    }

    /**
     * A pending row, older than any real one (`added` 1 or 2), so it is among the first the runner reads.
     */
    private function addPendingRow(string $sTranscoder, int $iAdded): int
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_transcoder_queue` SET `transcoder_object` = :object, `profile_id` = 0, `file_url_source` = '', `file_id_source` = 'phpunit', `file_url_result` = '', `file_ext_result` = '', `file_id_result` = 0, `server` = '', `status` = 'pending', `added` = :added, `changed` = :added, `log` = ''", [
            'object' => $sTranscoder,
            'added' => $iAdded,
        ]);
        $iId = (int)$oDb->lastId();
        $this->_aIds[] = $iId;

        return $iId;
    }

    public function testRowsOfAnUnregisteredTranscoderAreSkipped(): void
    {
        $oDb = BxDolDb::getInstance();
        $aRegistered = $oDb->getColumn("SELECT `object` FROM `sys_objects_transcoder`");
        $this->assertNotEmpty($aRegistered, 'Core registers its transcoders.');

        // The rows exist only while the queue is locked for this connection: a transcoding cron run
        // waits for the lock and never sees them (the tables are MyISAM, so a transaction wouldn't hide them).
        // getNextInQueue reads both tables under these aliases.
        $oDb->query("LOCK TABLES `sys_transcoder_queue` WRITE, `sys_transcoder_queue` AS `tq` WRITE, `sys_objects_transcoder` AS `tot` READ");
        try {
            $iOrphanId = $this->addPendingRow('phpunit_unregistered_transcoder', 1);
            $iRegisteredId = $this->addPendingRow($aRegistered[0], 2);

            // A server name of its own: the runner reads nothing while its server is transcoding,
            // and this one never is, whatever the real server is doing.
            $aRows = BxDolTranscoderQuery::getNextInQueue('phpunit-' . genRndPwd(8, false), 1000);
            $sOrphanStatus = $oDb->getOne("SELECT `status` FROM `sys_transcoder_queue` WHERE `id` = :id", ['id' => $iOrphanId]);

            foreach ($this->_aIds as $iId)
                $oDb->query("DELETE FROM `sys_transcoder_queue` WHERE `id` = :id", ['id' => $iId]);
            $this->_aIds = [];
        }
        finally {
            $oDb->query("UNLOCK TABLES");
        }

        $aIds = array_map('intval', array_column($aRows, 'id'));
        $this->assertNotContains($iOrphanId, $aIds, 'The oldest pending row is skipped.');
        $this->assertContains($iRegisteredId, $aIds, 'A row of a registered transcoder is still picked.');
        foreach ($aRows as $aRow)
            $this->assertContains($aRow['transcoder_object'], $aRegistered);

        $this->assertSame('pending', $sOrphanStatus, 'The row is kept.');
    }
}
