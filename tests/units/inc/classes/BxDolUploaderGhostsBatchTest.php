<?php

/**
 * BxDolUploader::getGhostsForMany answers storage_uploader.php?a=restore_ghosts_batch: one request
 * restores the ghosts of all uploaders of a page instead of one request per uploader.
 */
class BxDolUploaderGhostsBatchTest extends BxDolTestCase
{
    public function testNotAListGivesNothing()
    {
        $this->assertSame([], BxDolUploader::getGhostsForMany('x', 1));
        $this->assertSame([], BxDolUploader::getGhostsForMany(null, 1));
    }

    public function testOneResultPerItemInOrder()
    {
        $aValid = ['uo' => 'sys_html5', 'so' => 'sys_images', 'uid' => 'abc123', 'img_trans' => '', 'c' => '', 'm' => 1, 'l' => 0];

        $aResult = BxDolUploader::getGhostsForMany([
            $aValid,
            ['uo' => 'sys_html5', 'so' => 'sys_images'], // no uid
            ['uo' => 'sys_html5', 'so' => 'sys_images', 'uid' => 'a"b'], // uid with other characters
            ['uo' => 'no_such_uploader', 'so' => 'sys_images', 'uid' => 'abc'],
            ['uo' => 'sys_html5', 'so' => 'no_such_storage', 'uid' => 'abc'],
            ['uo' => ['x'], 'so' => 'sys_images', 'uid' => 'abc'],
            'not an item',
        ], 0);

        $this->assertCount(7, $aResult);
        foreach ($aResult as $mixedGhosts)
            $this->assertIsArray($mixedGhosts);

        for ($i = 1; $i < 7; $i++)
            $this->assertSame([], $aResult[$i], 'item ' . $i);
    }

    public function testNumberOfItemsIsBounded()
    {
        $aItems = array_fill(0, BxDolUploader::GHOSTS_BATCH_MAX + 5, ['uo' => 'no_such_uploader', 'so' => 'sys_images', 'uid' => 'abc']);

        $this->assertCount(BxDolUploader::GHOSTS_BATCH_MAX, BxDolUploader::getGhostsForMany($aItems, 1));
    }

    public function testValidItemGivesTheSameAsASingleRequest()
    {
        $oUploader = BxDolUploader::getObjectInstance('sys_html5', 'sys_images', 'abc123');
        if (!$oUploader)
            $this->markTestSkipped('sys_html5 uploader is not available');

        $iProfileId = 999999999; // no ghosts
        $mixedSingle = $oUploader->getGhostsWithOrder($iProfileId, 'array', '', false);

        $aResult = BxDolUploader::getGhostsForMany([['uo' => 'sys_html5', 'so' => 'sys_images', 'uid' => 'abc123', 'c' => '', 'm' => 1]], $iProfileId);

        $this->assertSame([is_array($mixedSingle) ? $mixedSingle : []], $aResult);
    }
}
