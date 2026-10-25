<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The picture link previews show is a public transcoded copy with its size, for the site head and for the
 * API (NEO) alike: never the original upload, which the API used to get, and never a url with a token that
 * expires in minutes, which the site icon had. A big landscape picture gets the large card, an avatar or
 * the site icon a small square one; the icon always goes through the 512px icon transcoder (Facebook shows
 * none under 200px), never its 180 and 192px copies.
 *
 * The test uploads its own images and makes its own post and feed item, and restores the site options it
 * changes, so it runs on any site with Posts and Timeline installed.
 */
#[Group('integration')]
class LinkPreviewImageTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aParamsBackup = [];
    protected $_aFiles = [];
    protected $_aPosts = [];
    protected $_aEvents = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        foreach (['sys_site_cover_common', 'sys_site_icon_android_splash', 'sys_site_icon_android', 'sys_site_icon_apple'] as $sName) {
            $this->_aParamsBackup[$sName] = getParam($sName);
            setParam($sName, '0');
        }

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        foreach ($this->_aParamsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        $oDb = BxDolDb::getInstance();
        foreach ($this->_aEvents as $iId) {
            BxDolPage::deleteSeoLink('bx_timeline', 'bx_timeline', $iId);
            BxDolModule::getInstance('bx_timeline')->_oDb->deleteEventFlags($iId);
            $oDb->query("DELETE FROM `bx_timeline_events` WHERE `id` = :id", ['id' => $iId]);
        }
        foreach ($this->_aPosts as $iId) {
            BxDolPage::deleteSeoLink('bx_posts', 'bx_posts', $iId);
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iId]);
        }
        // the transcoded copies too: the site images have no handlers which delete them with the original
        $aTranscoders = [BX_DOL_TRANSCODER_OBJ_COVER, BX_DOL_TRANSCODER_OBJ_ICON_ANDROID_SPLASH, 'bx_posts_cover'];
        foreach ($this->_aFiles as list($sStorage, $iId)) {
            foreach ($aTranscoders as $sTranscoder)
                if (($oTranscoder = BxDolTranscoder::getObjectInstance($sTranscoder)) !== false)
                    $oTranscoder->onDeleteFileOrig($iId);
            $oDb->query("DELETE FROM `sys_transcoder_images_files` WHERE `transcoder_object` IN (" . $oDb->implode_escape($aTranscoders) . ") AND `handler` = :id", ['id' => $iId]);
            BxDolStorage::getObjectInstance($sStorage)->deleteFile($iId, 0);
        }
        $oDb->cleanMemoryAll();

        BxDolTemplate::getInstance()->resetPageMeta();
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    /**
     * Upload a plain image of the given size into a storage, private as Studio stores the site images.
     */
    protected function addImage(string $sStorage, int $iWidth, int $iHeight, bool $bPrivate = true): int
    {
        $sTmp = tempnam(sys_get_temp_dir(), 'bxpreview');
        $sPath = $sTmp . '.jpg';
        $oStorage = BxDolStorage::getObjectInstance($sStorage);
        try {
            $rImage = imagecreatetruecolor($iWidth, $iHeight);
            imagefill($rImage, 0, 0, imagecolorallocate($rImage, 40, 90, 160));
            imagejpeg($rImage, $sPath, 80);
            imagedestroy($rImage);

            $iId = (int)$oStorage->storeFileFromPath($sPath, $bPrivate, 0);
        }
        finally {
            @unlink($sPath);
            @unlink($sTmp);
        }
        if (!$iId)
            $this->fail('Store the image: ' . $oStorage->getErrorString());

        $this->_aFiles[] = [$sStorage, $iId];
        BxDolDb::getInstance()->cleanMemoryAll();

        return $iId;
    }

    /**
     * A person profile of the test account: the feed hides the account's own system profile from guests.
     */
    protected function getAuthor(): int
    {
        return (int)BxDolProfile::getInstanceByAccount($this->bxAccount('admin')->id())->id();
    }

    protected function addPost(int $iThumb): int
    {
        $iAuthor = $this->getAuthor();
        $iNow = time();

        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_posts_posts` SET " . $oDb->arrayToSQL([
            'author' => $iAuthor, 'added' => $iNow, 'changed' => $iNow, 'published' => $iNow,
            'thumb' => $iThumb, 'thumb_data' => '', 'title' => 'LinkPreviewImageTest post', 'cat' => 0, 'multicat' => '',
            'abstract' => '', 'text' => '<p>LinkPreviewImageTest text.</p>', 'labels' => '', 'location' => '',
        ]));
        $iId = (int)$oDb->lastId();
        $this->_aPosts[] = $iId;
        $oDb->cleanMemoryAll();

        return $iId;
    }

    protected function getPageApi(string $sUri, int $iId = 0): array
    {
        unset($GLOBALS['bxDolClasses']['BxDolPage!' . BxDolPageQuery::getPageObjectNameByURI($sUri)]);

        $_GET['i'] = $sUri;
        $_GET['api'] = 1;
        if ($iId)
            $_GET['id'] = $iId;
        else
            unset($_GET['id']);

        $oPage = BxDolPage::getObjectInstanceByURI($sUri);
        $this->assertInstanceOf(BxDolPage::class, $oPage);

        return $oPage->getPageAPI();
    }

    protected function assertPublicCopy(string $sUrl, string $sStorage): void
    {
        $this->assertStringContainsString('/s/' . $sStorage . '_resized/', $sUrl, 'A transcoded copy, not the original.');
        $this->assertStringNotContainsString('?t=', $sUrl, 'No token which expires.');
        $this->assertStringNotContainsString('image_transcoder.php', $sUrl, 'A ready file, not the transcoding script.');
    }

    public function testTranscoderGivesPublicCopyWithSizeInApiMode(): void
    {
        $iFile = $this->addImage(BX_DOL_STORAGE_OBJ_IMAGES, 1600, 900);
        $_GET['api'] = 1;

        $aImage = BxDolTranscoder::getObjectInstance(BX_DOL_TRANSCODER_OBJ_COVER)->getFileMetaImage($iFile);

        $this->assertIsArray($aImage);
        $this->assertPublicCopy($aImage['url'], BX_DOL_STORAGE_OBJ_IMAGES);
        $this->assertSame([1280, 720], [$aImage['width'], $aImage['height']], 'sys_cover fits 1920x720 and keeps the shape.');
    }

    public function testSiteCoverIsTheDefaultImage(): void
    {
        setParam('sys_site_cover_common', (string)$this->addImage(BX_DOL_STORAGE_OBJ_IMAGES, 1600, 900));

        $aData = $this->getPageApi('about');

        $this->assertPublicCopy($aData['image'], BX_DOL_STORAGE_OBJ_IMAGES);
        $this->assertSame('summary_large_image', $aData['meta']['card']);
        $this->assertSame(1280, $aData['meta']['image_width']);
        $this->assertSame('website', $aData['meta']['og_type']);
    }

    public function testSiteIconIsASmallSquarePicture(): void
    {
        setParam('sys_site_icon_apple', (string)$this->addImage(BX_DOL_STORAGE_OBJ_IMAGES, 600, 600));

        $aData = $this->getPageApi('home');

        $this->assertPublicCopy($aData['image'], BX_DOL_STORAGE_OBJ_IMAGES);
        $this->assertSame('summary', $aData['meta']['card']);
        $this->assertSame([512, 512], [$aData['meta']['image_width'], $aData['meta']['image_height']]);
    }

    public function testCoverWinsOverIcon(): void
    {
        setParam('sys_site_icon_apple', (string)$this->addImage(BX_DOL_STORAGE_OBJ_IMAGES, 600, 600));
        setParam('sys_site_cover_common', (string)$this->addImage(BX_DOL_STORAGE_OBJ_IMAGES, 1600, 900));

        $aData = $this->getPageApi('home');

        $this->assertSame('summary_large_image', $aData['meta']['card'], 'The home page shows the site cover, not the app icon.');
    }

    public function testPostShowsItsCoverInHeadAndApi(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');

        $iPost = $this->addPost($this->addImage('bx_posts_covers', 1600, 900, false));

        $aData = $this->getPageApi('view-post', $iPost);
        $this->assertSame('LinkPreviewImageTest post', $aData['title']);
        $this->assertPublicCopy($aData['image'], 'bx_posts_photos');
        $this->assertSame('summary_large_image', $aData['meta']['card']);
        $this->assertSame('article', $aData['meta']['og_type']);
        $this->assertSame('LinkPreviewImageTest text.', $aData['description']);

        // The classic head of the same page, as the page sets it before its blocks.
        unset($_GET['api']);
        unset($GLOBALS['bxDolClasses']['BxDolPage!' . BxDolPageQuery::getPageObjectNameByURI('view-post')]);
        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->resetPageMeta();
        $oPage = BxDolPage::getObjectInstanceByURI('view-post');
        (new ReflectionMethod($oPage, '_addSysTemplateVars'))->invoke($oPage);
        $sHead = $oTemplate->getMetaInfo();

        $this->assertStringContainsString('<meta property="og:image" content="' . $aData['image'] . '" />', $sHead);
        $this->assertStringContainsString('<meta property="og:image:width" content="' . $aData['meta']['image_width'] . '" />', $sHead);
        $this->assertStringContainsString('<meta name="twitter:card" content="summary_large_image" />', $sHead);
        $this->assertStringContainsString('<meta property="og:type" content="article" />', $sHead);
        $this->assertStringContainsString('<meta property="og:site_name" content="', $sHead);
    }

    public function testFeedItemDescribesThePostItShows(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts') || !BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Posts and Timeline are not installed.');

        $iPost = $this->addPost($this->addImage('bx_posts_covers', 1600, 900, false));
        $iAuthor = $this->getAuthor();

        $oDb = BxDolDb::getInstance();
        $aEvent = [
            'owner_id' => $iAuthor, 'system' => 1, 'type' => 'bx_posts', 'action' => 'added', 'object_id' => $iPost,
            'object_owner_id' => $iAuthor, 'object_privacy_view' => BX_DOL_PG_ALL, 'content' => '', 'title' => 'LinkPreviewImageTest post',
            'description' => '', 'labels' => '', 'location' => '', 'date' => time(), 'status' => 'active', 'status_admin' => 'active',
        ];
        $oDb->query("INSERT INTO `bx_timeline_events` SET " . $oDb->arrayToSQL($aEvent));
        $iEvent = (int)$oDb->lastId();
        $this->_aEvents[] = $iEvent;

        $oDb->query("INSERT INTO `bx_timeline_events` SET " . $oDb->arrayToSQL(array_merge($aEvent, ['status_admin' => 'pending'])));
        $iEventPending = (int)$oDb->lastId();
        $this->_aEvents[] = $iEventPending;

        // A repost of the post: the API's prepared content lacks the reposted type, the stored one has it.
        $sPrefix = BxDolModule::getInstance('bx_timeline')->_oConfig->getPrefix('common_post');
        $oDb->query("INSERT INTO `bx_timeline_events` SET " . $oDb->arrayToSQL(array_merge($aEvent, ['system' => 0, 'type' => $sPrefix . 'repost', 'action' => '', 'object_id' => $iAuthor, 'title' => '', 'content' => serialize(['type' => 'bx_posts', 'action' => 'added', 'object_id' => $iPost])])));
        $iEventRepost = (int)$oDb->lastId();
        $this->_aEvents[] = $iEventRepost;
        $oDb->cleanMemoryAll();

        $aData = $this->getPageApi('item', $iEvent);
        $this->assertSame('LinkPreviewImageTest post', $aData['title'], 'The title of the post, not "Feed Item".');
        $this->assertSame('LinkPreviewImageTest text.', $aData['description']);
        $this->assertPublicCopy($aData['image'], 'bx_posts_photos');
        $this->assertSame('summary_large_image', $aData['meta']['card']);

        $aData = $this->getPageApi('item', $iEventRepost);
        $this->assertSame('LinkPreviewImageTest text.', $aData['description'], 'A repost describes the reposted entry.');
        $this->assertPublicCopy($aData['image'], 'bx_posts_photos');

        $aData = $this->getPageApi('item', $iEventPending);
        $this->assertSame(404, $aData['page_status'], 'A pending feed item is for its author and moderators.');
        $this->assertSame(getParam('site_title'), $aData['title']);
        $this->assertSame('', $aData['image']);
        $this->assertStringNotContainsString('LinkPreviewImageTest', json_encode($aData), 'Not in the blocks either.');
        $this->assertSame([], BxDolPage::getEmbedData('page.php?i=item&id=' . $iEventPending));
    }

    public function testFeedPostAndItsRepost(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $iAuthor = $this->getAuthor();
        $sPrefix = BxDolModule::getInstance('bx_timeline')->_oConfig->getPrefix('common_post');
        $oDb = BxDolDb::getInstance();

        $aPost = [
            'owner_id' => $iAuthor, 'system' => 0, 'type' => $sPrefix . 'post', 'action' => '', 'object_id' => $iAuthor,
            'object_owner_id' => $iAuthor, 'object_privacy_view' => BX_DOL_PG_ALL, 'content' => serialize(['text' => '<p>LinkPreviewImageTest feed.</p><p>Second line.</p>']),
            'title' => '', 'description' => '', 'labels' => '', 'location' => '', 'date' => time(), 'status' => 'active', 'status_admin' => 'active',
        ];
        $aIds = [];
        foreach (['active' => [], 'hidden' => ['status' => 'hidden']] as $sKey => $aFields) {
            $oDb->query("INSERT INTO `bx_timeline_events` SET " . $oDb->arrayToSQL(array_merge($aPost, $aFields)));
            $this->_aEvents[] = $aIds[$sKey] = (int)$oDb->lastId();
        }
        $oDb->query("INSERT INTO `bx_timeline_events` SET " . $oDb->arrayToSQL(array_merge($aPost, ['type' => $sPrefix . 'repost', 'content' => serialize(['type' => $sPrefix . 'post', 'action' => '', 'object_id' => $aIds['active']])])));
        $this->_aEvents[] = $aIds['repost'] = (int)$oDb->lastId();
        $oDb->cleanMemoryAll();

        $aData = $this->getPageApi('item', $aIds['active']);
        $this->assertSame('LinkPreviewImageTest feed. Second line.', $aData['description'], 'A post without a title: its text, paragraphs apart.');
        $this->assertNotSame('', $aData['title'], 'The author.');

        $aData = $this->getPageApi('item', $aIds['repost']);
        $this->assertSame('LinkPreviewImageTest feed. Second line.', $aData['description'], 'A repost shows the post.');

        $aData = $this->getPageApi('item', $aIds['hidden']);
        $this->assertSame(404, $aData['page_status'], 'A hidden post is for its author and moderators.');
        $this->assertStringNotContainsString('LinkPreviewImageTest', json_encode($aData));
    }
}
