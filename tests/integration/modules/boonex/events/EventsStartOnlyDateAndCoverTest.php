<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Events with a start date only (date_end = 0) render their form, timeline post and unit vars
 * without throwing or falling back to 1970-01-01, and the cover input is active on Add/Edit Event.
 */
#[Group('integration')]
class EventsStartOnlyDateAndCoverTest extends BxDolIntegrationTestCase
{
    private array $_aCreatedEventIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_events'))
            $this->markTestSkipped('Events module is not installed.');
    }

    protected function tearDown(): void
    {
        try {
            if (!empty($this->_aCreatedEventIds) && BxDolModuleQuery::getInstance()->isEnabledByName('bx_events')) {
                $oModule = BxDolModule::getInstance('bx_events');
                foreach ($this->_aCreatedEventIds as $iId) {
                    $oModule->serviceDeleteEntity($iId);
                }
            }
        }
        finally {
            $this->_aCreatedEventIds = [];
            parent::tearDown();
        }
    }

    public function testStartOnlyEventRendersWithoutFatalOrEpochEndDate(): void
    {
        $this->bxLoginAsAdmin();
        $iAdminProfileId = (int)bx_get_logged_profile_id();
        if (!$iAdminProfileId)
            $this->markTestSkipped('Admin profile is not available.');

        $oModule = BxDolModule::getInstance('bx_events');
        $iStart = time() + 5 * 86400;
        $aAdded = $oModule->serviceEntityAddForcedly($iAdminProfileId, [
            'event_name' => 'Start-only test ' . bin2hex(random_bytes(4)),
            'event_desc' => 'Integration test event with no end date.',
            'event_cat' => 1,
            'date_start' => date('Y-m-d H:i:s', $iStart),
            'date_end' => '',
            'timezone' => 'UTC',
            'join_confirmation' => 0,
            'allow_view_to' => BX_DOL_PG_ALL,
            'allow_post_to' => 'p',
        ]);

        $this->assertIsArray($aAdded);
        $this->assertSame(0, (int)($aAdded['code'] ?? 1));
        $iEventId = (int)($aAdded['content']['id'] ?? 0);
        $this->assertGreaterThan(0, $iEventId);
        $this->_aCreatedEventIds[] = $iEventId;

        // View form renders without throwing on empty date_end.
        $oForm = BxDolForm::getObjectInstance('bx_event', 'bx_event_view');
        $this->assertNotFalse($oForm);
        $aContentInfo = $oModule->_oDb->getContentInfoById($iEventId);
        $this->assertSame(0, (int)$aContentInfo['date_end']);

        $oForm->initChecker($aContentInfo);
        $sHtml = $oForm->getCode();
        $this->assertIsString($sHtml);
        $this->assertNotEmpty($sHtml);

        $aDateStartInput = $oForm->aInputs['date_start'];
        $aDateEndInput = $oForm->aInputs['date_end'];
        $this->assertNotEmpty($oForm->genViewRowValue($aDateStartInput));
        $this->assertNull($oForm->genViewRowValue($aDateEndInput));

        // Timeline post omits date_end instead of returning 0.
        $aTimelinePost = $oModule->serviceGetTimelinePost([
            'id' => 0,
            'object_id' => $iEventId,
            'owner_id' => $iAdminProfileId,
            'date' => time(),
            'content' => '',
            'title' => '',
            'description' => '',
            'action' => 'added',
        ]);
        $this->assertIsArray($aTimelinePost);
        $this->assertArrayHasKey('date_start', $aTimelinePost['content']);
        $this->assertArrayNotHasKey('date_end', $aTimelinePost['content']);

        // Unit vars leave date_end_f empty instead of formatting Unix epoch 0.
        $aUnitVars = $oModule->_oTemplate->unitVars($aContentInfo);
        $this->assertNotEmpty($aUnitVars['date_start_f']);
        $this->assertSame('', $aUnitVars['date_end']);
        $this->assertSame('', $aUnitVars['date_end_f']);
    }

    public function testCoverInputEnabledOnEventAddAndEditForms(): void
    {
        $oDb = BxDolDb::getInstance();
        $aRows = $oDb->getAll(
            "SELECT `display_name`, `active` FROM `sys_form_display_inputs` WHERE `display_name` IN ('bx_event_add', 'bx_event_edit') AND `input_name` = 'cover' ORDER BY `display_name`"
        );
        $this->assertCount(2, $aRows);
        foreach ($aRows as $aRow) {
            $this->assertSame(1, (int)$aRow['active'], "Expected cover to be active on {$aRow['display_name']}");
        }
    }
}
