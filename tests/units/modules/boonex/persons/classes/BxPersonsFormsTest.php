<?php

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Profile-module form helper and entry-form methods via Persons.
 */
#[AllowMockObjectsWithoutExpectations]
class BxPersonsFormsTest extends BxPersonsTestCase
{
    #[DataProvider('providerForAutoApproval')]
    public function testAutoApproval($sStored, $sAction, $bOut)
    {
        $o = new BxPersonsFormsEntryHelper($this->_oModule);
        $o->setAutoApproval($sStored);
        $this->assertSame($bOut, $o->isAutoApproval($sAction));
    }

    static public function providerForAutoApproval()
    {
        return [
            ['on', 'add', true],
            ['on', 'edit', true],
            [true, 'edit', true],
            ['add', 'add', true],
            ['add', 'edit', false],
            ['add', 'on', false],
            ['off', 'add', false],
        ];
    }

    public function testSetAutoApprovalTrueBecomesAlways()
    {
        $o = new BxPersonsFormsEntryHelper($this->_oModule);
        $this->assertSame(BX_DOL_PROFILE_ACTIVATE_ALWAYS, $o->setAutoApproval(true));
    }

    public function testProfileAndContentDataMissing()
    {
        $oDb = $this->createMock(BxPersonsDb::class);
        $oDb->method('getContentInfoById')->willReturn(false);
        $this->bxReplaceDb($oDb);

        $o = new BxPersonsFormsEntryHelper($this->_oModule);
        [$oProfile, $aContent] = $this->bxCallProtected($o, '_getProfileAndContentData', 15);
        $this->assertFalse($oProfile);
        $this->assertFalse($aContent);
    }

    public function testRedirectAfterAddApiDefault()
    {
        $o = new BxPersonsFormsEntryHelper($this->_oModule);
        $this->bxSetProtected($o, '_bIsApi', true, BxBaseModGeneralFormsEntryHelper::class);

        $a = $o->redirectAfterAdd($this->bxSamplePerson());
        $this->assertIsArray($a);
        $this->assertNotEmpty($a);
    }

    public function testPhotoGhostTemplateVars()
    {
        $oForm = $this->bxFormDouble();
        $oForm->aInputs = [
            'picture' => [
                'name' => 'picture',
                'content_id' => 15,
            ],
        ];

        $a = $this->bxCallProtected($oForm, '_getProfilePhotoGhostTmplVars', 'picture', $this->bxSamplePerson());
        $this->assertSame('picture', $a['name']);
        $this->assertSame(15, $a['content_id']);
        $this->assertFalse($a['bx_if:set_thumb']['condition']);
        $this->assertSame([], $a['bx_if:set_thumb']['content']);
    }

    public function testPrivacyFields()
    {
        $oForm = $this->bxFormDouble();
        $oForm->aInputs = [
            'allow_view_to' => ['name' => 'allow_view_to'],
            'allow_post_to' => ['name' => 'allow_post_to'],
            'allow_contact_to' => ['name' => 'allow_contact_to'],
        ];

        $a = $this->bxCallProtected($oForm, '_getPrivacyFields');
        $this->assertSame('bx_persons_allow_view_to', $a['allow_view_to']);
        $this->assertSame('bx_persons_allow_post_to', $a['allow_post_to']);
        $this->assertSame('bx_persons_allow_contact_to', $a['allow_contact_to']);
    }

    public function testProcessFilesFlagsApiSkipsMissingAndMultiple()
    {
        $oForm = $this->bxFormDouble();
        $oForm->aInputs = [];
        $this->assertFalse($oForm->processFilesFlagsApi('picture', 15));

        $oForm->aInputs = ['picture' => ['name' => 'picture']];
        $this->assertFalse($oForm->processFilesFlagsApi('picture', 15));
    }

    public function testCustomViewRowEmptyValues()
    {
        $oForm = $this->bxFormDouble();
        $sPrevId = bx_get('id');
        $sPrevProfile = bx_get('profile_id');
        unset($_GET['id'], $_GET['profile_id'], $_POST['id'], $_POST['profile_id']);
        try {
            $this->assertSame('', $this->bxCallProtected($oForm, 'genCustomViewRowValueProfileEmail', ['value' => '']));
            $this->assertSame('', $this->bxCallProtected($oForm, 'genCustomViewRowValueProfileIp', ['value' => '']));
            $this->assertSame('', $this->bxCallProtected($oForm, 'genCustomViewRowValueFriendsCount', ['value' => 1]));
            $this->assertSame('', $this->bxCallProtected($oForm, 'genCustomViewRowValueFollowersCount', ['value' => 1]));
            $this->assertSame('', $this->bxCallProtected($oForm, 'genCustomViewRowValueProfileStatus', ['value' => '']));
            $this->assertSame('', $this->bxCallProtected($oForm, 'genCustomViewRowValueProfileLastActive', ['value' => 0]));
        } finally {
            if ($sPrevId === false)
                unset($_GET['id']);
            else
                $_GET['id'] = $sPrevId;
            if ($sPrevProfile === false)
                unset($_GET['profile_id']);
            else
                $_GET['profile_id'] = $sPrevProfile;
        }
    }

    public function testBirthdayMaxYearOnAddDisplay()
    {
        $oForm = BxDolForm::getObjectInstance('bx_person', 'bx_person_add', $this->_oModule->_oTemplate);
        if (!$oForm || empty($oForm->aInputs['birthday']))
            $this->markTestSkipped('Persons add form or birthday field is missing.');

        $this->assertSame((string)date('Y'), $oForm->aInputs['birthday']['attrs']['max']);
    }

    protected function bxFormDouble(): BxPersonsFormEntry
    {
        return new class($this->_oModule) extends BxPersonsFormEntry {
            public function __construct($oModule)
            {
                $this->MODULE = 'bx_persons';
                $this->_oModule = $oModule;
                $this->aInputs = [];
            }
        };
    }
}
