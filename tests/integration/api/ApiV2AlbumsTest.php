<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Albums (bx_albums, BxAlbumsApiV2 on the text base), over real HTTP: albums each test
 * makes through POST /uploads (purpose `album`) and POST /albums, and deletes after. An album's
 * previews and count, its items in its order page by page, adding at its end, the original only
 * for its owner, privacy the items share with their album, secret groups, edits, deletes, search
 * and the paths only with the module. Skips without bx_albums.
 */
#[Group('integration')]
class ApiV2AlbumsTest extends ApiV2TestCase
{
    /** Albums a test made, deleted after it through the module. */
    protected $_aAlbums = [];
    /** The groups a test made, deleted after it. */
    protected $_aGroups = [];

    protected function tearDown(): void
    {
        if ($this->_aAlbums && BxDolModuleQuery::getInstance()->isEnabledByName('bx_albums')) {
            BxDolDb::getInstance()->cleanMemoryAll();
            $oModule = BxDolModule::getInstance('bx_albums');
            foreach ($this->_aAlbums as $iId)
                if ($oModule->_oDb->getContentInfoById($iId))
                    $oModule->serviceDeleteEntity($iId);
        }
        if ($this->_aGroups)
            BxDolDb::getInstance()->cleanMemoryAll();
        foreach ($this->_aGroups as $iProfileId)
            if (($oProfile = BxDolProfile::getInstance($iProfileId)))
                $oProfile->delete(false, true, true);
        parent::tearDown();
    }

    /** An upload of purpose `album`: its Media id. */
    protected function uploadPhoto(array $aAuth, string $sName = 'photo.png'): string
    {
        $a = $this->upload($aAuth, $sName, self::png(5, 5), ['purpose' => 'album']);
        $this->assertSame(201, $a['status'], $a['body']);
        return $a['json']['id'];
    }

    /** An album of the token's profile with photos of these names: its Album. */
    protected function makeAlbum(array $aAuth, string $sTitle, array $aNames = [], array $aBody = []): array
    {
        $aIds = array_map(fn($s) => $this->uploadPhoto($aAuth, $s), $aNames);
        $a = $this->http('POST', 'albums', $aAuth + ['Content-Type' => 'application/json'], json_encode(['title' => $sTitle, 'media_ids' => $aIds] + $aBody));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aAlbums[] = (int)$a['json']['id'];
        return $a['json'];
    }

    /** All of an album's items, page by page: their titles. */
    protected function itemTitles(string $sId, array $aHeaders, int $iLimit = 2): array
    {
        $aTitles = [];
        $sPath = 'albums/' . $sId . '/items?limit=' . $iLimit;
        for ($i = 0; $i < 30 && $sPath; $i++) {
            $a = $this->http('GET', $sPath, $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_FileItem', $a['json']);
            $this->assertArrayHasKey('next_cursor', $a['json']);
            $aTitles = array_merge($aTitles, array_column($a['json']['items'], 'title'));
            $sPath = $a['json']['next_cursor'] !== null ? 'albums/' . $sId . '/items?limit=' . $iLimit . '&cursor=' . rawurlencode($a['json']['next_cursor']) : '';
        }
        return $aTitles;
    }

    protected function requireAdding(array $aAuth): void
    {
        $this->requireModule('bx_albums');
        $a = $this->upload($aAuth, 'probe.png', self::png(2, 2), ['purpose' => 'album']);
        if ($a['status'] === 403)
            $this->markTestSkipped('The test user may not make albums here.');
        $this->assertSame(201, $a['status'], $a['body']);
        $this->http('DELETE', 'uploads/' . $a['json']['id'], $aAuth);
    }

    public function testAlbumPathsOnlyWhileAlbumsIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/albums', '/albums/{id}', '/albums/{id}/items', '/search/albums'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_albums']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxAlbumsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Albums');
        $this->assertArrayNotHasKey('Album', $aSpec['components']['schemas']);

        $this->requireModule('bx_albums');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxAlbumsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Albums');
        $this->assertEqualsCanonicalizing(['get', 'post'], array_keys($aSpec['paths']['/albums/{id}/items']));
        $this->assertSame(['listAlbumItems', 'addToAlbum'], [$aSpec['paths']['/albums/{id}/items']['get']['operationId'], $aSpec['paths']['/albums/{id}/items']['post']['operationId']]);
        // the items are FileItems even on a site without Photos and Videos
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router(BxDolApiV2Router::classesFor(array_diff_key($aEnabled, ['bx_photos' => 1, 'bx_videos' => 1]), $aWithFile))))->build();
        $this->assertArrayHasKey('FileItem', $aSpec['components']['schemas']);

        $a = $this->http('GET', '');
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_albums', 'tag' => 'albums', 'kind' => 'album'], array_diff_key($aModules['bx_albums'] ?? [], ['title' => 1, 'audiences' => 1]));
        $this->assertSame((new BxAlbumsApiV2())->apiV2ModuleInfo()['audiences'], $aModules['bx_albums']['audiences'], 'the audiences the site offers');
        $this->assertSame('album', (new BxAlbumsApiV2())->apiV2ItemKind('bx_albums'));
    }

    public function testAnAlbumWithItsPhotosInItsOrder(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        // a title is needed, the form's rules apply, comments can't be off; guests make none
        $this->assertSame([422, 'title'], (function ($a) { return [$a['status'], $a['json']['errors'][0]['field'] ?? null]; })($this->http('POST', 'albums', $aJson, json_encode(['title' => ' ']))));
        $this->assertSame(422, $this->http('POST', 'albums', $aJson, json_encode(['title' => 'ab']))['status'], 'shorter than the form takes');
        $this->assertSame(422, $this->http('POST', 'albums', $aJson, json_encode(['title' => 'ApiV2Test', 'comments_enabled' => false]))['status']);
        $this->assertSame(401, $this->http('POST', 'albums', ['Content-Type' => 'application/json'], json_encode(['title' => 'ApiV2Test']))['status']);
        // a photo upload of another purpose is no upload for an album
        $a = $this->upload($aAuth, 'other.png', self::png(2, 2), ['purpose' => 'post']);
        if ($a['status'] === 201) {
            $b = $this->http('POST', 'albums', $aJson, json_encode(['title' => 'ApiV2Test', 'media_ids' => [$a['json']['id']]]));
            $this->assertSame([422, 'media_ids[0]'], [$b['status'], $b['json']['errors'][0]['field'] ?? null], $b['body']);
            $this->http('DELETE', 'uploads/' . $a['json']['id'], $aAuth);
        }

        $aAlbum = $this->makeAlbum($aAuth, 'ApiV2Test seaside', ['Pier.png', 'Gulls.png', 'Boats.png'], ['text_html' => 'Three days by the sea']);
        $this->assertSchema('Album', $aAlbum);
        $this->assertSame(['bx_albums', 'ApiV2Test seaside', 'public', 'published', 3], [$aAlbum['module'], $aAlbum['title'], $aAlbum['audience'], $aAlbum['state'], $aAlbum['stats']['items']]);
        $this->assertCount(3, $aAlbum['preview']);
        $this->assertStringContainsString('<p>Three days by the sea</p>', (string)$aAlbum['text_html']);
        $this->assertNotNull($aAlbum['content_id'], 'its Item in the feeds');
        $this->assertTrue($aAlbum['viewer']['can_edit']);

        // its items in its order, page by page
        $this->assertSame(['Pier', 'Gulls', 'Boats'], $this->itemTitles($aAlbum['id'], $aAuth));
        $a = $this->http('GET', 'albums/' . $aAlbum['id'] . '/items', $aAuth);
        $aItem = $a['json']['items'][0];
        $this->assertSchema('FileItem', $aItem);
        $this->assertSame(['photo', 'bx_albums', $aAlbum['id'], null], [$aItem['kind'], $aItem['module'], $aItem['album_id'], $aItem['content_id']]);
        $this->assertSame($aAlbum['preview'][0]['id'], $aItem['media']['id'], 'the first is its cover');
        $this->assertSame(['thumb', 'medium', 'large'], array_keys($aItem['media']['variants']));
        $this->assertSame('Pier.png', $aItem['media']['original_name'], 'the original for its owner');

        // adding: at its end, in the order given, only by who may edit it
        $sMore = $this->uploadPhoto($aAuth, 'Lighthouse.png');
        $sLast = $this->uploadPhoto($aAuth, 'Sunset.png');
        $a = $this->http('POST', 'albums/' . $aAlbum['id'] . '/items', $aOther + ['Content-Type' => 'application/json'], json_encode(['media_ids' => [$sMore]]));
        $this->assertSame(403, $a['status'], $a['body']);
        $a = $this->http('POST', 'albums/' . $aAlbum['id'] . '/items', $aJson, json_encode(['media_ids' => [$sLast, $sMore]]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSame(['Sunset', 'Lighthouse'], array_column($a['json'], 'title'));
        $this->assertSame(['Pier', 'Gulls', 'Boats', 'Sunset', 'Lighthouse'], $this->itemTitles($aAlbum['id'], $aAuth, 3));
        $this->assertSame(5, $this->http('GET', 'albums/' . $aAlbum['id'], $aAuth)['json']['stats']['items']);
        $a = $this->http('POST', 'albums/' . $aAlbum['id'] . '/items', $aJson, json_encode(['media_ids' => [$sMore]]));
        $this->assertSame(422, $a['status'], 'an upload goes in once: ' . $a['body']);

        // others and guests see it and its items, as copies only
        foreach ([$aOther, []] as $aHeaders) {
            $a = $this->http('GET', 'albums/' . $aAlbum['id'], $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSame(['', 0], [$a['json']['preview'][0]['original_name'], $a['json']['preview'][0]['size']]);
            $a = $this->http('GET', 'albums/' . $aAlbum['id'] . '/items', $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSame('', $a['json']['items'][0]['media']['original_name']);
            $this->assertStringNotContainsString('/bx_albums_files/', $a['json']['items'][0]['media']['url'], 'a copy, not the upload');
        }

        // the items are seen by whom the album is
        $a = $this->http('PATCH', 'albums/' . $aAlbum['id'], $aJson, json_encode(['title' => 'ApiV2Test seaside, private', 'audience' => 'private']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Album', $a['json']);
        $this->assertSame(['ApiV2Test seaside, private', 'private'], [$a['json']['title'], $a['json']['audience']]);
        $this->assertSame(403, $this->http('GET', 'albums/' . $aAlbum['id'], $aOther)['status']);
        $this->assertSame(403, $this->http('GET', 'albums/' . $aAlbum['id'] . '/items', $aOther)['status']);
        $this->assertSame(403, $this->http('GET', 'albums/' . $aAlbum['id'] . '/items')['status']);
        $this->assertSame('private', $this->http('GET', 'albums/' . $aAlbum['id'] . '/items', $aAuth)['json']['items'][0]['audience']);
        $this->assertSame(403, $this->http('PATCH', 'albums/' . $aAlbum['id'], $aOther + ['Content-Type' => 'application/json'], json_encode(['title' => 'Not mine']))['status']);

        // deleting: its own author's, then it is gone with its items
        $this->assertContains($this->http('DELETE', 'albums/' . $aAlbum['id'], $aOther)['status'], [403, 404]);
        $this->assertSame(204, $this->http('DELETE', 'albums/' . $aAlbum['id'], $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'albums/' . $aAlbum['id'], $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'albums/' . $aAlbum['id'] . '/items', $aAuth)['status']);
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_albums_files2albums` WHERE `content_id` = :id", ['id' => (int)$aAlbum['id']]));
    }

    public function testListsWithPreviewsAndAnEmptyAlbum(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        $aEmpty = $this->makeAlbum($aAuth, 'ApiV2Test empty');
        $this->assertSame([0, []], [$aEmpty['stats']['items'], $aEmpty['preview']]);
        $aFull = $this->makeAlbum($aAuth, 'ApiV2Test five', ['1.png', '2.png', '3.png', '4.png', '5.png']);
        $this->assertCount(4, $aFull['preview'], 'four at most');

        $a = $this->http('GET', 'albums?author=' . $iViewer . '&limit=50', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Album', $a['json']);
        $aById = array_column($a['json']['items'], null, 'id');
        $this->assertSame([5, 4], [$aById[$aFull['id']]['stats']['items'], count($aById[$aFull['id']]['preview'])]);
        $this->assertSame([0, []], [$aById[$aEmpty['id']]['stats']['items'], $aById[$aEmpty['id']]['preview']]);
        $this->assertNull($aById[$aFull['id']]['text_html'], 'no text in lists');
        $this->assertSame([$aFull['id'], $aEmpty['id']], array_values(array_intersect(array_column($a['json']['items'], 'id'), [$aFull['id'], $aEmpty['id']])), 'newest first');
        $this->assertSame(['items' => [], 'next_cursor' => null], $this->http('GET', 'albums/' . $aEmpty['id'] . '/items', $aAuth)['json']);
    }

    public function testAnEditsTextGoesThroughTheSitesFilter(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $aAlbum = $this->makeAlbum($aAuth, 'ApiV2Test filtered');
        $a = $this->http('PATCH', 'albums/' . $aAlbum['id'], $aAuth + ['Content-Type' => 'application/json'], json_encode(['text_html' => '<p>ok</p><script>alert(1)</script><img src="x" onerror="alert(2)">']));
        $this->assertSame(200, $a['status'], $a['body']);
        BxDolDb::getInstance()->cleanMemoryAll();
        $oModule = BxDolModule::getInstance('bx_albums');
        $sStored = (string)$oModule->_oDb->getContentInfoById((int)$aAlbum['id'])[$oModule->_oConfig->CNF['FIELD_TEXT']];
        foreach ([(string)$a['json']['text_html'], $sStored] as $sHtml) {
            $this->assertStringContainsString('<p>ok</p>', $sHtml);
            $this->assertDoesNotMatchRegularExpression('/<script|onerror/i', $sHtml);
        }
    }

    public function testAnAlbumInASecretGroup(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        if (BxDolModule::getInstance('bx_albums')->serviceCheckAllowedAddInContext('bx_groups') !== CHECK_ACTION_RESULT_ALLOWED)
            $this->markTestSkipped('This site keeps no albums in groups.');
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];

        $iSecret = $this->makeGroup($iOwner, 's');
        $aAlbum = $this->makeAlbum($aOwner, 'ApiV2Test secret album', ['s.png'], ['context_id' => (string)$iSecret]);
        $this->assertSame(['context', (string)$iSecret], [$aAlbum['audience'], $aAlbum['context_id']]);

        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        foreach ([$aAuth, []] as $aHeaders) {
            $this->assertSame(404, $this->http('GET', 'albums/' . $aAlbum['id'], $aHeaders)['status']);
            $this->assertSame(404, $this->http('GET', 'albums/' . $aAlbum['id'] . '/items', $aHeaders)['status']);
            $this->assertNotContains($aAlbum['id'], array_column($this->http('GET', 'albums?author=' . $iOwner . '&limit=50', $aHeaders)['json']['items'], 'id'));
        }
        $sUpload = $this->uploadPhoto($aAuth);
        $this->assertSame(404, $this->http('POST', 'albums/' . $aAlbum['id'] . '/items', $aJson, json_encode(['media_ids' => [$sUpload]]))['status']);
        $this->http('DELETE', 'uploads/' . $sUpload, $aAuth);
        $this->assertSame(['ApiV2Test secret album'], array_column($this->http('GET', 'albums?context=' . $iSecret, $aOwner)['json']['items'], 'title'), 'its members list it');
    }

    private function makeGroup(int $iOwner, string $sView): int
    {
        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, [
                'group_name' => 'ApiV2AlbumsTest group ' . bin2hex(random_bytes(3)),
                'group_desc' => '<p>Made by ApiV2AlbumsTest</p>',
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

    public function testSearchAndContextContent(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        $sWord = 'apiv2album' . bin2hex(random_bytes(4));
        $aPublic = $this->makeAlbum($aAuth, 'ApiV2Test ' . $sWord);
        $aPrivate = $this->makeAlbum($aAuth, 'ApiV2Test private ' . $sWord, [], ['audience' => 'private']);

        $a = $this->http('GET', 'search/albums?q=' . $sWord, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Album', $a['json']);
        $this->assertEqualsCanonicalizing([$aPublic['id'], $aPrivate['id']], array_column($a['json']['items'], 'id'));
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $a = $this->http('GET', 'search/albums?q=' . $sWord, ['Authorization' => 'Bearer ' . $this->profileToken($iOther)]);
        $this->assertSame([$aPublic['id']], array_column($a['json']['items'], 'id'), 'not the private one');

        $oAlbums = new BxAlbumsApiV2();
        foreach (['bx_groups', 'bx_spaces', 'bx_events'] as $sContext)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sContext))
                $this->assertSame(BxDolModule::getInstance('bx_albums')->serviceCheckAllowedAddInContext($sContext) === CHECK_ACTION_RESULT_ALLOWED ? 'albums' : null, $oAlbums->apiV2ContextContent($sContext), $sContext);
    }

    /** An active administrator of an account none of these profiles belongs to, or a skip. */
    public function testOnlyItsAuthorAddsAndRefusedUploadsStayTheViewers(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iAdmin = $this->adminProfileIdOtherThan([$iViewer]);
        $aAdmin = ['Authorization' => 'Bearer ' . $this->profileToken($iAdmin)];
        $aAlbum = $this->makeAlbum($aAuth, 'ApiV2Test not the admin\'s', ['Mine.png']);
        $this->assertTrue($this->http('GET', 'albums/' . $aAlbum['id'], $aAdmin)['json']['viewer']['can_edit'], 'an administrator may edit it');

        // the site's form takes only its author's uploads: refused before anything changes
        $sUpload = $this->uploadPhoto($aAdmin, 'Theirs.png');
        $a = $this->http('POST', 'albums/' . $aAlbum['id'] . '/items', $aAdmin + ['Content-Type' => 'application/json'], json_encode(['media_ids' => [$sUpload]]));
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSame(['Mine'], $this->itemTitles($aAlbum['id'], $aAuth));
        // the upload is still theirs, taken by nothing: it makes an album of their own
        $a = $this->http('POST', 'albums', $aAdmin + ['Content-Type' => 'application/json'], json_encode(['title' => 'ApiV2Test the admin\'s own', 'media_ids' => [$sUpload]]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aAlbums[] = (int)$a['json']['id'];
        $this->assertSame(1, $a['json']['stats']['items']);
    }

    public function testOnlyTheAudiencesTheSiteOffers(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        $aOffered = array_column($this->http('GET', '')['json']['modules'], null, 'module')['bx_albums']['audiences'];
        $this->assertContains('public', $aOffered);
        $bMembers = (int)BxDolDb::getInstance()->getOne("SELECT `active` FROM `sys_privacy_groups` WHERE `id` = :id", ['id' => (int)BX_DOL_PG_MEMBERS]) === 1;
        $this->assertSame($bMembers, in_array('members', $aOffered, true), 'members only while the site has that group on');

        $aPublic = $this->makeAlbum($aAuth, 'ApiV2Test audiences');
        foreach (['public', 'members', 'friends', 'private'] as $sAudience) {
            $a = $this->http('POST', 'albums', $aJson, json_encode(['title' => 'ApiV2Test ' . $sAudience, 'audience' => $sAudience]));
            $b = $this->http('PATCH', 'albums/' . $aPublic['id'], $aJson, json_encode(['audience' => $sAudience]));
            if ($a['status'] === 201)
                $this->_aAlbums[] = (int)$a['json']['id'];
            if (in_array($sAudience, $aOffered, true)) {
                $this->assertSame([201, $sAudience], [$a['status'], $a['json']['audience'] ?? null], $a['body']);
                $this->assertSame([200, $sAudience], [$b['status'], $b['json']['audience'] ?? null], $b['body']);
            }
            else {
                $this->assertSame([422, 'audience'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], 'nobody could see it: ' . $a['body']);
                $this->assertSame([422, 'audience'], [$b['status'], $b['json']['errors'][0]['field'] ?? null], $b['body']);
            }
        }
    }
}
