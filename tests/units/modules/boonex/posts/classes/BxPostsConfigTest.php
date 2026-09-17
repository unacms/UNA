<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Content-module config as implemented by Posts (CNF, prefixes, URLs, attach flags).
 */
class BxPostsConfigTest extends BxPostsTestCase
{
    public function testCnfKeysForContentModule()
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        $this->assertSame('bx_posts_posts', $CNF['TABLE_ENTRIES']);
        $this->assertSame('id', $CNF['FIELD_ID']);
        $this->assertSame('author', $CNF['FIELD_AUTHOR']);
        $this->assertSame('title', $CNF['FIELD_TITLE']);
        $this->assertSame('text', $CNF['FIELD_TEXT']);
        $this->assertSame('published', $CNF['FIELD_PUBLISHED']);
        $this->assertSame('allow_comments', $CNF['FIELD_ALLOW_COMMENTS']);
        $this->assertSame('view-post', $CNF['URI_VIEW_ENTRY']);
        $this->assertSame('create-post', $CNF['URI_ADD_ENTRY']);
        $this->assertSame('edit-post', $CNF['URI_EDIT_ENTRY']);
        $this->assertTrue($CNF['PARAM_LINKS_ENABLED']);
        $this->assertTrue($CNF['PARAM_MULTICAT_ENABLED']);
        $this->assertTrue($CNF['PARAM_POLL_ENABLED']);
    }

    public function testAttachLinksAndTimelineAttachments()
    {
        $oConfig = $this->_oModule->_oConfig;

        $this->assertTrue($oConfig->isAttachLinks());
        $this->assertTrue($oConfig->isAttachmentsInTimeline());
        $this->assertTrue($oConfig->isAutoApprove());
        $this->assertSame(3600, $oConfig->getDpnTime());
    }

    public function testPrefixesAndJsObjects()
    {
        $oConfig = $this->_oModule->_oConfig;

        $this->assertSame('bx-posts', $oConfig->getPrefix('style'));
        $this->assertSame('BxPostsPolls', $oConfig->getJsClass('poll'));
        $this->assertSame('oBxPostsPolls', $oConfig->getJsObject('poll'));
        $this->assertSame('oBxPostsPollsAdd', $oConfig->getJsObjectPoll(0));
        $this->assertSame('oBxPostsPollsEdit12', $oConfig->getJsObjectPoll(12));
        $this->assertSame('bx_posts_common', $oConfig->getGridObject('common'));
        $this->assertSame('bx_posts_administration', $oConfig->getGridObject('administration'));
        $this->assertSame('', $oConfig->getGridObject('missing'));
        $this->assertSame('', $oConfig->getJsClass('missing'));
    }

    public function testHtmlIds()
    {
        $oConfig = $this->_oModule->_oConfig;

        $this->assertSame('bx-posts-attach-link-popup', $oConfig->getHtmlIds('attach_link_popup'));
        $this->assertSame('bx-posts-add-poll-popup', $oConfig->getHtmlIds('add_poll_popup'));
        $this->assertSame('', $oConfig->getHtmlIds('missing'));
        $this->assertIsArray($oConfig->getHtmlIds());
    }

    #[DataProvider('providerForEqualUrls')]
    public function testIsEqualUrls($sLeft, $sRight, $bOut)
    {
        $this->assertSame($bOut, $this->_oModule->_oConfig->isEqualUrls($sLeft, $sRight));
    }

    static public function providerForEqualUrls()
    {
        return [
            ['page.php?i=view-post', 'page.php?i=view-post', true],
            ['page.php?i=view-post/', 'page.php?i=view-post', true],
            ['page.php?i=view-post', 'page.php?i=view-post&id=1', true],
            ['page.php?i=view-post', 'page.php?i=posts-home', false],
        ];
    }

    #[DataProvider('providerForEntryUri')]
    public function testGetEntryUri($sAction, $sUri)
    {
        $this->assertSame($sUri, $this->_oModule->_oConfig->getEntryUri($sAction));
    }

    static public function providerForEntryUri()
    {
        return [
            ['view', 'view-post'],
            ['add', 'create-post'],
            ['edit', 'edit-post'],
            ['missing', ''],
        ];
    }

    public function testGetViewEntryUrl()
    {
        $oConfig = $this->_oModule->_oConfig;

        $this->assertSame('', $oConfig->getViewEntryUrl('x'));
        $this->assertSame('', $oConfig->getViewEntryUrl([]));

        $sFromId = $oConfig->getViewEntryUrl(15);
        $sFromRow = $oConfig->getViewEntryUrl(['id' => 15]);
        $this->assertNotSame('', $sFromId);
        $this->assertSame($sFromId, $sFromRow);
    }

    public function testGetImageUrlEmpty()
    {
        $this->assertSame('', $this->_oModule->_oConfig->getImageUrl(0, ['OBJECT_IMAGES_TRANSCODER_PREVIEW']));
        $this->assertSame('', $this->_oModule->_oConfig->getImageUrl(1, []));
    }

    public function testPregPatterns()
    {
        $oConfig = $this->_oModule->_oConfig;

        $this->assertSame(1, preg_match($oConfig->getPregPattern('meta_title'), '<title>Hello</title>', $a));
        $this->assertSame('Hello', $a[1]);

        $this->assertSame(1, preg_match($oConfig->getPregPattern('url'), 'https://example.com/path?q=1'));
    }
}
