<?php

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;

/**
 * Content-module form helper and entry-form methods via Posts.
 */
#[AllowMockObjectsWithoutExpectations]
class BxPostsFormsTest extends BxPostsTestCase
{
    public function testPrepareResponsePlainAndJson()
    {
        $o = new BxPostsFormsEntryHelper($this->_oModule);

        $this->assertSame('ok', $this->bxCallProtected($o, 'prepareResponse', 'ok', false));
        $this->assertSame(
            ['msg' => 'ok', '_dt' => 'json'],
            $this->bxCallProtected($o, 'prepareResponse', 'ok', true)
        );
        $this->assertSame(
            ['code' => 1, '_dt' => 'json', 'reload' => 1],
            $this->bxCallProtected($o, 'prepareResponse', 1, true, 'code', ['reload' => 1])
        );
    }

    public function testRedirectFromContextWhenPublicPrivacy()
    {
        $o = new BxPostsFormsEntryHelper($this->_oModule);
        $aPost = $this->bxSamplePost(['allow_view_to' => 3]);

        $this->assertFalse($this->bxCallProtected($o, '_getRedirectFromContext', 'add', $aPost));
    }

    public function testPrepareCustomRedirectUrlReplacesMarkers()
    {
        $o = new BxPostsFormsEntryHelper($this->_oModule);
        $s = $this->bxCallProtected($o, 'prepareCustomRedirectUrl', 'page.php?i=view-post&id={content_id}&m={module}', $this->bxSamplePost());

        $this->assertStringNotContainsString('{content_id}', $s);
        $this->assertStringNotContainsString('{module}', $s);
        $this->assertStringContainsString('bx_posts', $s);
    }

    public function testViewDataTextMissingContent()
    {
        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->method('getContentInfoById')->willReturn(false);
        $this->bxReplaceDb($oDb);

        $o = new BxPostsFormsEntryHelper($this->_oModule);
        [$oProfile, $aContent] = $this->bxCallProtected($o, '_getProfileAndContentData', 15);
        $this->assertFalse($oProfile);
        $this->assertFalse($aContent);
    }

    public function testProcessLinksSkipsMissingField()
    {
        $oForm = $this->bxFormDouble();
        $oForm->aInputs = [];

        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->expects($this->never())->method('saveLink');
        $this->bxReplaceDb($oDb);

        $this->assertTrue($oForm->processLinks('link', 15));
    }

    public function testProcessLinksSavesEachId()
    {
        $oForm = $this->bxFormDouble(['1', '2']);
        $oForm->aInputs = ['link' => ['name' => 'link']];

        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->expects($this->exactly(2))->method('saveLink')->willReturnCallback(function ($iContentId, $iLinkId) {
            $this->assertSame(15, $iContentId);
            $this->assertContains((string)$iLinkId, ['1', '2']);
            return true;
        });
        $this->bxReplaceDb($oDb);

        $oForm->processLinks('link', 15);
    }

    public function testCoverGhostTemplateVars()
    {
        $oForm = $this->bxFormDouble();
        $oForm->aInputs = [
            'covers' => [
                'name' => 'covers',
                'content_id' => 15,
            ],
        ];

        $a = $this->bxCallProtected($oForm, '_getCoverGhostTmplVars', $this->bxSamplePost(['thumb' => 9]));
        $this->assertSame('covers', $a['name']);
        $this->assertSame(15, $a['content_id']);
        $this->assertSame('post-text', $a['editor_id']);
        $this->assertSame(9, $a['thumb_id']);
        $this->assertSame('thumb', $a['name_thumb']);
    }

    protected function bxFormDouble($mixedClean = null): BxPostsFormEntry
    {
        $oForm = new class($this->_oModule) extends BxPostsFormEntry {
            public $mixedCleanValue;

            public function __construct($oModule)
            {
                $this->MODULE = 'bx_posts';
                $this->_oModule = $oModule;
                $this->aInputs = [];
            }

            public function getCleanValue($sName)
            {
                return $this->mixedCleanValue;
            }
        };
        $oForm->mixedCleanValue = $mixedClean;
        return $oForm;
    }
}
