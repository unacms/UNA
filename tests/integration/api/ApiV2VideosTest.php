<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Videos (bx_videos, BxVideosApiV2 on the files base), over real HTTP: videos each test
 * makes through POST /uploads (purpose `video`) and POST /videos, and deletes after; a new
 * upload is `processing` until the site converts it (a test never waits for the cron: it makes
 * a video published by its row where it needs one). Lists by sort, author and context, privacy,
 * links to videos elsewhere, editing, deleting, search and the paths only with the module.
 * Skips without bx_videos.
 */
#[Group('integration')]
class ApiV2VideosTest extends ApiV2TestCase
{
    /** Videos a test made, deleted after it through the module. */
    protected $_aVideos = [];
    /** The files a test uploaded, whose places in the transcoders' queue go after it. */
    protected $_aFiles = [];
    /** The groups a test made, deleted after it. */
    protected $_aGroups = [];

    protected function tearDown(): void
    {
        if ($this->_aVideos && BxDolModuleQuery::getInstance()->isEnabledByName('bx_videos')) {
            BxDolDb::getInstance()->cleanMemoryAll();
            $oModule = BxDolModule::getInstance('bx_videos');
            foreach ($this->_aVideos as $iId)
                if ($oModule->_oDb->getContentInfoById($iId))
                    $oModule->serviceDeleteEntity($iId);
        }
        if ($this->_aGroups)
            BxDolDb::getInstance()->cleanMemoryAll();
        foreach ($this->_aGroups as $iProfileId)
            if (($oProfile = BxDolProfile::getInstance($iProfileId)))
                $oProfile->delete(false, true, true);
        // the cron would only find the files gone
        if ($this->_aFiles)
            BxDolDb::getInstance()->query("DELETE FROM `sys_transcoder_queue` WHERE `transcoder_object` LIKE 'bx\\_videos\\_%' AND `file_id_source` IN (" . BxDolDb::getInstance()->implode_escape(array_map('strval', $this->_aFiles)) . ")");
        parent::tearDown();
    }

    /** POST /uploads of a video, its file kept for tearDown. */
    protected function upload(array $aHeaders, string $sName, string $sData, array $aFields = []): array
    {
        $a = parent::upload($aHeaders, $sName, $sData, $aFields);
        if ($a['status'] === 201 && ($aFields['purpose'] ?? '') === 'video')
            $this->_aFiles[] = BxDolApiV2Map::uploadParts($a['json']['id'])[1];
        return $a;
    }

    /** The start of an MP4 file: enough for the site to take it as a video. */
    protected static function mp4(): string
    {
        return "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom" . str_repeat("\x00", 64);
    }

    /**
     * A video of the token's profile from a new upload: its FileItem.
     */
    protected function makeVideo(array $aAuth, array $aBody = [], string $sName = 'clip.mp4'): array
    {
        $a = $this->upload($aAuth, $sName, self::mp4(), ['purpose' => 'video']);
        $this->assertSame(201, $a['status'], $a['body']);
        $a = $this->http('POST', 'videos', $aAuth + ['Content-Type' => 'application/json'], json_encode(['media_id' => $a['json']['id']] + $aBody));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aVideos[] = (int)$a['json']['id'];
        return $a['json'];
    }

    /** A video's row as the site would have it once its copies were made: active. */
    protected function publish(string $sId, array $aMore = []): void
    {
        BxDolDb::getInstance()->query("UPDATE `bx_videos_entries` SET " . implode(', ', array_map(fn($k) => "`$k` = :$k", array_keys(['status' => 1] + $aMore))) . " WHERE `id` = :id", ['status' => 'active'] + $aMore + ['id' => (int)$sId]);
    }

    protected function requireAdding(array $aAuth): void
    {
        $this->requireModule('bx_videos');
        $a = $this->upload($aAuth, 'probe.mp4', self::mp4(), ['purpose' => 'video']);
        if ($a['status'] === 403)
            $this->markTestSkipped('The test user may not add videos here.');
        $this->assertSame(201, $a['status'], $a['body']);
        $this->http('DELETE', 'uploads/' . $a['json']['id'], $aAuth);
    }

    public function testVideoPathsOnlyWhileVideosIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/videos', '/videos/{id}', '/search/videos'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_videos']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxVideosApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Videos');
        $this->assertArrayNotHasKey('NewVideo', $aSpec['components']['schemas']);

        $this->requireModule('bx_videos');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxVideosApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Videos');
        $this->assertEqualsCanonicalizing(['get', 'patch', 'delete'], array_keys($aSpec['paths']['/videos/{id}']));
        $this->assertSame(['listVideos', 'createVideo'], [$aSpec['paths']['/videos']['get']['operationId'] ?? null, $aSpec['paths']['/videos']['post']['operationId'] ?? null]);

        $a = $this->http('GET', '');
        $this->assertSame(200, $a['status'], $a['body']);
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_videos', 'tag' => 'videos', 'kind' => 'video'], array_diff_key($aModules['bx_videos'] ?? [], ['title' => 1, 'audiences' => 1]));
        $this->assertSame((new BxVideosApiV2())->apiV2ModuleInfo()['audiences'], $aModules['bx_videos']['audiences'], 'the audiences the site offers');

        // a video's Item is of kind `video`
        $this->assertSame('video', (new BxVideosApiV2())->apiV2ItemKind('bx_videos'));
        $this->assertNull((new BxVideosApiV2())->apiV2ItemKind('bx_forum'));
    }

    public function testANewUploadIsProcessingForItsAuthorOnly(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];

        // the upload: a video in the module's storage, being converted
        $a = $this->upload($aAuth, 'Harbour at dawn.mp4', self::mp4(), ['purpose' => 'video']);
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Media', $a['json']);
        $this->assertSame(['video', 'processing'], [$a['json']['kind'], $a['json']['state']]);
        $this->assertEquals(new stdClass(), (object)$a['json']['variants'], 'no copies yet');
        $sUpload = $a['json']['id'];
        $a = $this->http('GET', 'uploads/' . $sUpload, $aAuth);
        $this->assertSame([200, 'processing'], [$a['status'], $a['json']['state'] ?? null], $a['body']);

        // a photo is not a video
        $a = $this->upload($aAuth, 'still.png', self::png(4, 4), ['purpose' => 'video']);
        $this->assertSame(415, $a['status'], $a['body']);

        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        $a = $this->http('POST', 'videos', $aJson, json_encode(['media_id' => $sUpload, 'text_html' => "Boats coming in\nand gulls"]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('FileItem', $a['json']);
        $this->_aVideos[] = (int)$a['json']['id'];
        $sId = $a['json']['id'];
        $this->assertSame('/api/v2/videos/' . $sId, parse_url((string)BxDolTestPhpServer::header($a, 'location'), PHP_URL_PATH));
        $this->assertSame(['video', 'bx_videos', 'Harbour at dawn', 'processing', 'public'], [$a['json']['kind'], $a['json']['module'], $a['json']['title'], $a['json']['state'], $a['json']['audience']], 'the title is the file name');
        $this->assertSame('processing', $a['json']['media']['state']);
        $this->assertEquals(new stdClass(), (object)$a['json']['media']['variants']);
        $this->assertStringContainsString('<p>Boats coming in</p>', (string)$a['json']['text_html'], 'plain text becomes paragraphs');
        $this->assertSame((string)$iViewer, $a['json']['author']['id']);
        $this->assertTrue($a['json']['viewer']['can_edit']);

        // its author sees it; nobody else does while it is converted
        $this->assertSame(200, $this->http('GET', 'videos/' . $sId, $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'videos/' . $sId, $aOther)['status']);
        $this->assertSame(404, $this->http('GET', 'videos/' . $sId)['status']);

        // an upload goes into one video only, and only its owner's
        $a = $this->http('POST', 'videos', $aJson, json_encode(['media_id' => $sUpload, 'title' => 'Again']));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('media_id', $a['json']['errors'][0]['field'] ?? null);
        $a = $this->upload($aOther, 'theirs.mp4', self::mp4(), ['purpose' => 'video']);
        if ($a['status'] === 201) {
            $b = $this->http('POST', 'videos', $aJson, json_encode(['media_id' => $a['json']['id'], 'title' => 'Not mine']));
            $this->assertSame([422, 'media_id'], [$b['status'], $b['json']['errors'][0]['field'] ?? null], $b['body']);
            $this->http('DELETE', 'uploads/' . $a['json']['id'], $aOther);
        }

        // one of an upload and a link; comments can't be turned off; guests add nothing
        foreach ([[], ['media_id' => $sUpload, 'embed_url' => 'https://example.com/v'], ['embed_url' => 'ftp://example.com/v', 'title' => 'x']] as $aBody) {
            $a = $this->http('POST', 'videos', $aJson, json_encode($aBody));
            $this->assertSame(422, $a['status'], json_encode($aBody) . ': ' . $a['body']);
        }
        $a = $this->upload($aAuth, 'more.mp4', self::mp4(), ['purpose' => 'video']);
        $b = $this->http('POST', 'videos', $aJson, json_encode(['media_id' => $a['json']['id'], 'comments_enabled' => false]));
        $this->assertSame([422, 'comments_enabled'], [$b['status'], $b['json']['errors'][0]['field'] ?? null], $b['body']);
        $this->http('DELETE', 'uploads/' . $a['json']['id'], $aAuth);
        $this->assertSame(401, $this->http('POST', 'videos', ['Content-Type' => 'application/json'], json_encode(['embed_url' => 'https://example.com/v']))['status']);

        // deleting it: its own author's, then it is gone
        $a = $this->http('DELETE', 'videos/' . $sId, $aOther);
        $this->assertContains($a['status'], [403, 404], $a['body']);
        $a = $this->http('DELETE', 'videos/' . $sId, $aAuth);
        $this->assertSame(204, $a['status'], $a['body']);
        $this->assertSame(404, $this->http('GET', 'videos/' . $sId, $aAuth)['status']);
    }

    public function testPublishedVideosByPrivacyAndTheOriginalForItsOwnerOnly(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];

        $aPublic = $this->makeVideo($aAuth, ['title' => 'ApiV2Test public video']);
        $aPrivate = $this->makeVideo($aAuth, ['title' => 'ApiV2Test private video', 'audience' => 'private']);
        $this->publish($aPublic['id']);
        $this->publish($aPrivate['id']);

        // published to all; the original only for its owner
        $a = $this->http('GET', 'videos/' . $aPublic['id'], $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('FileItem', $a['json']);
        $this->assertSame('public', $a['json']['audience']);
        $sOriginal = $this->http('GET', 'videos/' . $aPublic['id'], $aAuth)['json']['media']['url'];
        $this->assertNotSame('', $sOriginal);
        $this->assertNotSame($sOriginal, $a['json']['media']['url'], 'others never get the original upload');
        // nor its name or size
        $this->assertSame(['', 0], [$a['json']['media']['original_name'], $a['json']['media']['size']], 'the original\'s name and size are its owner\'s');
        $aOwn = $this->http('GET', 'videos/' . $aPublic['id'], $aAuth)['json']['media'];
        $this->assertSame('clip.mp4', $aOwn['original_name']);
        $this->assertGreaterThan(0, $aOwn['size']);
        $aGuest = $this->http('GET', 'videos/' . $aPublic['id'])['json']['media'];
        $this->assertSame(['', 0], [$aGuest['original_name'], $aGuest['size']], 'nor a guest\'s');
        $this->assertSame(200, $this->http('GET', 'videos/' . $aPublic['id'])['status'], 'guests see a public one');

        // a private one: its author only, never in others' lists
        $this->assertSame(200, $this->http('GET', 'videos/' . $aPrivate['id'], $aAuth)['status']);
        $this->assertSame(403, $this->http('GET', 'videos/' . $aPrivate['id'], $aOther)['status']);
        $aIds = array_column($this->http('GET', 'videos?author=' . $iViewer . '&limit=50', $aOther)['json']['items'], 'id');
        $this->assertContains($aPublic['id'], $aIds);
        $this->assertNotContains($aPrivate['id'], $aIds);
        $aIds = array_column($this->http('GET', 'videos?author=' . $iViewer . '&limit=50', $aAuth)['json']['items'], 'id');
        $this->assertContains($aPrivate['id'], $aIds, 'its author lists it');

        // editing: the title, the text, the audience; others may not
        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        $a = $this->http('PATCH', 'videos/' . $aPublic['id'], $aOther + ['Content-Type' => 'application/json'], json_encode(['title' => 'Not mine']));
        $this->assertSame(403, $a['status'], $a['body']);
        $a = $this->http('PATCH', 'videos/' . $aPublic['id'], $aJson, json_encode(['title' => 'ApiV2Test renamed', 'text_html' => '<p>New <b>text</b></p>', 'audience' => 'friends']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('FileItem', $a['json']);
        // its copies are not made in a test: a published row whose upload is not converted is `processing`
        $this->assertSame(['ApiV2Test renamed', 'friends', 'processing'], [$a['json']['title'], $a['json']['audience'], $a['json']['state']]);
        $this->assertSame('active', BxDolDb::getInstance()->getOne("SELECT `status` FROM `bx_videos_entries` WHERE `id` = :id", ['id' => (int)$aPublic['id']]), 'an edit does not take it back for converting');
        $this->assertStringContainsString('<b>text</b>', (string)$a['json']['text_html']);
        $this->assertSame($aPublic['media']['id'], $a['json']['media']['id'], 'the upload stays');
        $this->assertSame(403, $this->http('GET', 'videos/' . $aPublic['id'])['status'], 'members only now');
        $a = $this->http('PATCH', 'videos/' . $aPublic['id'], $aJson, json_encode(['comments_enabled' => false]));
        $this->assertSame(422, $a['status'], $a['body']);
        $a = $this->http('PATCH', 'videos/' . $aPublic['id'], $aJson, json_encode(['title' => '']));
        $this->assertSame(422, $a['status'], $a['body']);
    }

    public function testListsBySortAuthorAndPage(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        // three of the viewer's, 2001 and 2002 so the site's own are newer
        $aA = $this->makeVideo($aAuth, ['title' => 'ApiV2Test A']);
        $aB = $this->makeVideo($aAuth, ['title' => 'ApiV2Test B']);
        $aC = $this->makeVideo($aAuth, ['title' => 'ApiV2Test C']);
        $this->publish($aA['id'], ['added' => 978307200, 'changed' => 1009843200, 'views' => 5]);
        $this->publish($aB['id'], ['added' => 978393600, 'changed' => 978393600, 'views' => 50]);
        $this->publish($aC['id'], ['added' => 978480000, 'changed' => 978480000, 'views' => 1, 'featured' => time()]);
        $aMine = [$aA['id'], $aB['id'], $aC['id']];

        $fOrder = function (string $sQuery) use ($aAuth, $aMine, $iViewer) {
            $aIds = [];
            $sPath = 'videos?author=' . $iViewer . '&limit=1' . $sQuery;
            for ($i = 0; $i < 60 && $sPath; $i++) {
                $a = $this->http('GET', $sPath, $aAuth);
                $this->assertSame(200, $a['status'], $a['body']);
                $this->assertSchema('Page_FileItem', $a['json']);
                $this->assertArrayHasKey('next_cursor', $a['json']);
                $aIds = array_merge($aIds, array_column($a['json']['items'], 'id'));
                $sPath = $a['json']['next_cursor'] !== null ? 'videos?author=' . $iViewer . '&limit=1' . $sQuery . '&cursor=' . rawurlencode($a['json']['next_cursor']) : '';
            }
            $this->assertSame(count($aIds), count(array_unique($aIds)), 'no page repeats one');
            return array_values(array_intersect($aIds, $aMine));
        };

        $this->assertSame([$aC['id'], $aB['id'], $aA['id']], $fOrder(''), 'recent: newest first');
        $this->assertSame([$aA['id'], $aC['id'], $aB['id']], $fOrder('&sort=updated'), 'updated: the latest change first');
        $this->assertSame([$aB['id'], $aA['id'], $aC['id']], $fOrder('&sort=popular'), 'popular: most viewed first');
        $this->assertSame([$aC['id']], $fOrder('&sort=featured'), 'featured ones only');
        $this->assertEqualsCanonicalizing($aMine, $fOrder('&sort=top'), 'top: all of them, page by page with none twice');

        $this->assertSame(422, $this->http('GET', 'videos?sort=oldest', $aAuth)['status']);
        $this->assertSame(422, $this->http('GET', 'videos?author=999999999', $aAuth)['status']);
        $a = $this->http('GET', 'videos?context=' . $iViewer, $aAuth);
        $this->assertSame([422, 'context'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], 'a person is no context: ' . $a['body']);

        // a list item has no text and reads no reaction; a single answer has both
        $a = $this->http('GET', 'videos?author=' . $iViewer . '&limit=50', $aAuth);
        $aItem = array_column($a['json']['items'], null, 'id')[$aB['id']];
        $this->assertNull($aItem['text_html']);
        $this->assertFalse($aItem['viewer']['can_comment']);
    }

    public function testItsAuthorListsAVideoStillBeingConverted(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];

        $aNew = $this->makeVideo($aAuth, ['title' => 'ApiV2Test converting']);
        $this->assertSame('awaiting', BxDolDb::getInstance()->getOne("SELECT `status` FROM `bx_videos_entries` WHERE `id` = :id", ['id' => (int)$aNew['id']]), 'not converted in a test');

        // the newest of the author's own list, as the app shows it after adding one
        $a = $this->http('GET', 'videos?author=' . $iViewer . '&limit=5', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame($aNew['id'], $a['json']['items'][0]['id'] ?? null, 'the author lists it first');
        $this->assertSame('processing', $a['json']['items'][0]['state']);

        // nobody else lists it, nor does the public list
        foreach ([$aOther, []] as $aHeaders) {
            $this->assertNotContains($aNew['id'], array_column($this->http('GET', 'videos?author=' . $iViewer . '&limit=50', $aHeaders)['json']['items'], 'id'));
            $this->assertNotContains($aNew['id'], array_column($this->http('GET', 'videos?limit=50', $aHeaders)['json']['items'], 'id'));
        }
        $this->assertNotContains($aNew['id'], array_column($this->http('GET', 'videos?limit=50', $aAuth)['json']['items'], 'id'), 'only the author\'s own list has it');
    }

    public function testAnIdempotencyKeyAddsAVideoOnce(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        $a = $this->upload($aAuth, 'once.mp4', self::mp4(), ['purpose' => 'video']);
        $this->assertSame(201, $a['status'], $a['body']);
        $aHeaders = $aAuth + ['Content-Type' => 'application/json', 'Idempotency-Key' => 'ApiV2VideosTest-' . bin2hex(random_bytes(8))];
        $sTitle = 'ApiV2Test once ' . bin2hex(random_bytes(4));
        $sBody = json_encode(['media_id' => $a['json']['id'], 'title' => $sTitle]);

        $a = $this->http('POST', 'videos', $aHeaders, $sBody);
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aVideos[] = (int)$a['json']['id'];
        $aAgain = $this->http('POST', 'videos', $aHeaders, $sBody);
        $this->assertSame(201, $aAgain['status'], $aAgain['body']);
        $this->assertSame('true', BxDolTestPhpServer::header($aAgain, 'idempotent-replayed'));
        $this->assertSame($a['json']['id'], $aAgain['json']['id'], 'the same video, not a second one');
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_videos_entries` WHERE `title` = :t", ['t' => $sTitle]));
    }

    public function testVideosInSecretAndClosedGroups(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        if (BxDolModule::getInstance('bx_videos')->serviceCheckAllowedAddInContext('bx_groups') !== CHECK_ACTION_RESULT_ALLOWED)
            $this->markTestSkipped('This site keeps no videos in groups.');
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];

        $iSecret = $this->makeGroup($iOwner, 's');
        $iClosed = $this->makeGroup($iOwner, 'c');
        $iOpen = $this->makeGroup($iOwner, BX_DOL_PG_ALL);
        $aInSecret = $this->makeVideo($aOwner, ['title' => 'ApiV2Test in a secret group', 'context_id' => (string)$iSecret]);
        $aInClosed = $this->makeVideo($aOwner, ['title' => 'ApiV2Test in a closed group', 'context_id' => (string)$iClosed]);
        $this->publish($aInSecret['id']);
        $this->publish($aInClosed['id']);
        $this->assertSame(['context', (string)$iSecret], [$aInSecret['audience'], $aInSecret['context_id']]);

        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        foreach ([$aAuth, []] as $aHeaders) {
            $sWho = $aHeaders ? 'a member outside' : 'a guest';
            // one in a secret group is as if there were none
            $a = $this->http('GET', 'videos/' . $aInSecret['id'], $aHeaders);
            $this->assertSame(404, $a['status'], $sWho . ': ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
            // one in a closed group is refused: the group may be known
            $this->assertSame(403, $this->http('GET', 'videos/' . $aInClosed['id'], $aHeaders)['status'], $sWho);

            // neither is listed, by author or anywhere
            $aIds = array_column($this->http('GET', 'videos?author=' . $iOwner . '&limit=50', $aHeaders)['json']['items'], 'id');
            $this->assertNotContains($aInSecret['id'], $aIds, $sWho);
            $this->assertNotContains($aInClosed['id'], $aIds, $sWho);

            // a secret group is no context to them; a closed one is known, its content not seen
            foreach (['context', 'context_id'] as $sParam) {
                $a = $this->http('GET', 'videos?' . $sParam . '=' . $iSecret, $aHeaders);
                $this->assertSame([422, $sParam, 'not_found'], [$a['status'], $a['json']['errors'][0]['field'] ?? null, $a['json']['errors'][0]['code'] ?? null], $sWho . ': ' . $a['body']);
                $this->assertSame(403, $this->http('GET', 'videos?' . $sParam . '=' . $iClosed, $aHeaders)['status'], $sWho);
            }
        }
        foreach (['PATCH' => '{"title":"Not mine"}', 'DELETE' => ''] as $sMethod => $sBody) {
            $this->assertSame(404, $this->http($sMethod, 'videos/' . $aInSecret['id'], $aJson, $sBody)['status'], $sMethod . ' in a secret group');
            $this->assertSame(403, $this->http($sMethod, 'videos/' . $aInClosed['id'], $aJson, $sBody)['status'], $sMethod . ' in a closed group');
        }

        // adding into a group: none the viewer may not know of, none they may not post in
        $a = $this->upload($aAuth, 'outsider.mp4', self::mp4(), ['purpose' => 'video']);
        $this->assertSame(201, $a['status'], $a['body']);
        $sUpload = $a['json']['id'];
        $a = $this->http('POST', 'videos', $aJson, json_encode(['media_id' => $sUpload, 'context_id' => (string)$iSecret]));
        $this->assertSame([422, 'context_id', 'not_found'], [$a['status'], $a['json']['errors'][0]['field'] ?? null, $a['json']['errors'][0]['code'] ?? null], $a['body']);
        $this->assertSame(403, $this->http('POST', 'videos', $aJson, json_encode(['media_id' => $sUpload, 'context_id' => (string)$iClosed]))['status'], 'a closed group from outside');
        $a = $this->http('POST', 'videos', $aJson, json_encode(['media_id' => $sUpload, 'context_id' => (string)$iOpen]));
        $this->assertSame(403, $a['status'], 'an open group whose members alone post: ' . $a['body']);
        $a = $this->http('POST', 'videos', $aJson, json_encode(['media_id' => $sUpload, 'context_id' => (string)$iOwner]));
        $this->assertSame([422, 'context_id'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], 'a person is no context: ' . $a['body']);
        $this->http('DELETE', 'uploads/' . $sUpload, $aAuth);

        // the group's members see both, listed in their group
        $this->assertSame(200, $this->http('GET', 'videos/' . $aInSecret['id'], $aOwner)['status']);
        $this->assertSame([$aInSecret['id']], array_column($this->http('GET', 'videos?context=' . $iSecret, $aOwner)['json']['items'], 'id'));
        $this->assertSame([$aInClosed['id']], array_column($this->http('GET', 'videos?context_id=' . $iClosed, $aOwner)['json']['items'], 'id'));
    }

    private function makeGroup(int $iOwner, string $sView): int
    {
        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, [
                'group_name' => 'ApiV2VideosTest group ' . bin2hex(random_bytes(3)),
                'group_desc' => '<p>Made by ApiV2VideosTest</p>',
                'group_cat' => (string)(array_key_last(is_array($aCats) ? $aCats : []) ?? ''),
                'allow_view_to' => $sView,
                'allow_post_to' => 'p',
                'join_confirmation' => 0,
            ]);
        }
        finally {
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
        $this->assertSame(0, $a['code'] ?? null, 'the group was made: ' . json_encode($a['errors'] ?? $a['message'] ?? ''));
        $iProfileId = (int)BxDolProfile::getInstanceByContentAndType((int)$a['content']['id'], 'bx_groups')->id();
        $this->_aGroups[] = $iProfileId;
        BxDolDb::getInstance()->cleanMemoryAll();
        return $iProfileId;
    }

    public function testALinkToAVideoElsewhere(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        $a = $this->http('POST', 'videos', $aJson, json_encode(['embed_url' => 'https://www.youtube.com/watch?v=aqz-KE-bpKQ']));
        if ($a['status'] === 422 && ($a['json']['errors'][0]['code'] ?? '') === 'unsupported_link')
            $this->markTestSkipped('The site could not read the link (no network, or no embed provider).');
        $this->assertSame([422, 'title'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], 'a link needs a title: ' . $a['body']);

        $a = $this->http('POST', 'videos', $aJson, json_encode(['embed_url' => 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'title' => 'ApiV2Test link']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aVideos[] = (int)$a['json']['id'];
        $this->assertSchema('FileItem', $a['json']);
        $this->assertNull($a['json']['media']);
        $this->assertSame('https://www.youtube.com/watch?v=aqz-KE-bpKQ', $a['json']['embed_url']);
        $this->assertStringStartsWith('https://', (string)$a['json']['embed_player_url']);
        $this->assertSame(['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'www.youtube.com'], [$a['json']['links'][0]['url'] ?? null, $a['json']['links'][0]['host'] ?? null]);
        $this->assertSame('published', $a['json']['state']);

        // an edit keeps the link
        $a = $this->http('PATCH', 'videos/' . $a['json']['id'], $aJson, json_encode(['title' => 'ApiV2Test link renamed']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['ApiV2Test link renamed', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'], [$a['json']['title'], $a['json']['embed_url']]);

        $a = $this->http('POST', 'videos', $aJson, json_encode(['embed_url' => 'https://example.com/not-a-video', 'title' => 'x']));
        $this->assertSame([422, 'unsupported_link'], [$a['status'], $a['json']['errors'][0]['code'] ?? null], $a['body']);
    }

    public function testSearchAndContextContent(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        $sWord = 'apiv2video' . bin2hex(random_bytes(4));
        $aVideo = $this->makeVideo($aAuth, ['title' => 'ApiV2Test ' . $sWord]);
        $aPrivate = $this->makeVideo($aAuth, ['title' => 'ApiV2Test private ' . $sWord, 'audience' => 'private']);
        $this->publish($aVideo['id']);
        $this->publish($aPrivate['id']);

        $a = $this->http('GET', 'search/videos?q=' . $sWord, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_FileItem', $a['json']);
        $this->assertEqualsCanonicalizing([$aVideo['id'], $aPrivate['id']], array_column($a['json']['items'], 'id'));
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $a = $this->http('GET', 'search/videos?q=' . $sWord, ['Authorization' => 'Bearer ' . $this->profileToken($iOther)]);
        $this->assertSame([$aVideo['id']], array_column($a['json']['items'], 'id'), 'not the private one');
        $this->assertSame(422, $this->http('GET', 'search/videos', $aAuth)['status']);

        // contexts of a module the site lets videos into list `videos` among their content kinds
        $oVideos = new BxVideosApiV2();
        foreach (['bx_groups', 'bx_spaces', 'bx_events'] as $sContext)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sContext))
                $this->assertSame(BxDolModule::getInstance('bx_videos')->serviceCheckAllowedAddInContext($sContext) === CHECK_ACTION_RESULT_ALLOWED ? 'videos' : null, $oVideos->apiV2ContextContent($sContext), $sContext);
    }
}
