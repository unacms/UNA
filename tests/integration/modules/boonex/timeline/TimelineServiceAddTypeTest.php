<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A post added through the module's `add` service (values given to the post form, not a
 * submitted request) is a common post like one written on the site: its type carries the
 * module's common-post prefix. The service used to store the type as it was given (`post`),
 * because the prefixed type was written to the request while the form read its given values.
 *
 * The test adds its own post as the administrator and deletes it.
 */
#[Group('integration')]
class TimelineServiceAddTypeTest extends BxDolIntegrationTestCase
{
    protected $_aEventIds = [];
    protected $_mProfileIdBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $this->bxLoginAsAdmin();

        // a module keeps the profile it was created for, which an earlier test may have logged in as
        $this->_mProfileIdBackup = BxDolModule::getInstance('bx_timeline')->setProfileId((int)bx_get_logged_profile_id());
    }

    protected function tearDown(): void
    {
        if ($this->_aEventIds) {
            $oModule = BxDolModule::getInstance('bx_timeline');
            foreach ($this->_aEventIds as $iId)
                if (($aEvent = $oModule->_oDb->getEvents(['browse' => 'id', 'value' => $iId])))
                    $oModule->deleteEvent($aEvent);
        }
        if ($this->_mProfileIdBackup !== null)
            BxDolModule::getInstance('bx_timeline')->setProfileId($this->_mProfileIdBackup);

        parent::tearDown();
    }

    public function testAPostAddedThroughTheServiceIsACommonPost(): void
    {
        $iProfile = (int)bx_get_logged_profile_id();
        $this->assertGreaterThan(0, $iProfile);

        $oModule = BxDolModule::getInstance('bx_timeline');
        $aResult = $oModule->serviceAdd([
            'type' => 'post',
            'text' => '<p>TimelineServiceAddTypeTest ' . uniqid() . '</p>',
            // the site's own feed: on a fresh install the administrator acts as the account's own
            // profile, whose timeline nothing is posted on
            'owner_id' => 0,
            'object_privacy_view' => BX_DOL_PG_ALL,
        ]);

        $this->assertIsArray($aResult);
        $this->assertNotEmpty($aResult['id'] ?? 0, 'the post is added: ' . json_encode(array_keys($aResult)));
        $iId = (int)$aResult['id'];
        $this->_aEventIds[] = $iId;

        $sPrefix = $oModule->_oConfig->getPrefix('common_post');
        $this->assertNotSame('', $sPrefix);
        $sType = (string)BxDolDb::getInstance()->getOne("SELECT `type` FROM `bx_timeline_events` WHERE `id` = :id", ['id' => $iId]);
        $this->assertSame($sPrefix . 'post', $sType);

        // and it is read as one: a common event of the module, not another module's
        $aEvent = $oModule->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
        $this->assertNotEmpty($aEvent);
        $this->assertTrue($oModule->_oConfig->isCommon($aEvent['type'], $aEvent['action']));
    }
}
