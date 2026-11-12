<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Photos (bx_photos, BxPhotosApiV2 on the files base), over real HTTP: photos each test
 * makes through POST /uploads (purpose `photo`) and POST /photos, and deletes after. One photo per
 * upload, in order; the original only for its owner; privacy, secret groups, lists, edits,
 * search and the paths only with the module. Skips without bx_photos.
 */
#[Group('integration')]
class ApiV2PhotosTest extends ApiV2TestCase
{
    /** Photos a test made, deleted after it through the module. */
    protected $_aPhotos = [];
    /** The groups a test made, deleted after it. */
    protected $_aGroups = [];

    protected function tearDown(): void
    {
        if ($this->_aPhotos && BxDolModuleQuery::getInstance()->isEnabledByName('bx_photos')) {
            BxDolDb::getInstance()->cleanMemoryAll();
            $oModule = BxDolModule::getInstance('bx_photos');
            foreach ($this->_aPhotos as $iId)
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

    /** An upload of purpose `photo`: its Media id. */
    protected function uploadPhoto(array $aAuth, string $sName = 'photo.png'): string
    {
        $a = $this->upload($aAuth, $sName, self::png(6, 4), ['purpose' => 'photo']);
        $this->assertSame(201, $a['status'], $a['body']);
        return $a['json']['id'];
    }

    /** Photos of the token's profile from new uploads: their FileItems. */
    protected function makePhotos(array $aAuth, array $aNames, array $aBody = []): array
    {
        $aIds = array_map(fn($s) => $this->uploadPhoto($aAuth, $s), $aNames);
        $a = $this->http('POST', 'photos', $aAuth + ['Content-Type' => 'application/json'], json_encode(['media_ids' => $aIds] + $aBody));
        $this->assertSame(201, $a['status'], $a['body']);
        foreach ($a['json'] as $aItem)
            $this->_aPhotos[] = (int)$aItem['id'];
        return $a['json'];
    }

    protected function requireAdding(array $aAuth): void
    {
        $this->requireModule('bx_photos');
        $a = $this->upload($aAuth, 'probe.png', self::png(2, 2), ['purpose' => 'photo']);
        if ($a['status'] === 403)
            $this->markTestSkipped('The test user may not add photos here.');
        $this->assertSame(201, $a['status'], $a['body']);
        $this->http('DELETE', 'uploads/' . $a['json']['id'], $aAuth);
    }

    public function testPhotoPathsOnlyWhilePhotosIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/photos', '/photos/{id}', '/search/photos'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_photos']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxPhotosApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Photos');
        $this->assertArrayNotHasKey('NewPhotos', $aSpec['components']['schemas']);

        $this->requireModule('bx_photos');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxPhotosApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Photos');
        $this->assertEqualsCanonicalizing(['get', 'patch', 'delete'], array_keys($aSpec['paths']['/photos/{id}']));
        $this->assertSame(['listPhotos', 'createPhotos'], [$aSpec['paths']['/photos']['get']['operationId'] ?? null, $aSpec['paths']['/photos']['post']['operationId'] ?? null]);
        $this->assertSame(['type' => 'array', 'items' => ['$ref' => '#/components/schemas/FileItem']], $aSpec['paths']['/photos']['post']['responses'][201]['content']['application/json']['schema'], 'POST answers the photos it made');

        $a = $this->http('GET', '');
        $this->assertSame(200, $a['status'], $a['body']);
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_photos', 'tag' => 'photos', 'kind' => 'photo'], array_diff_key($aModules['bx_photos'] ?? [], ['title' => 1, 'audiences' => 1]));
        $this->assertSame((new BxPhotosApiV2())->apiV2ModuleInfo()['audiences'], $aModules['bx_photos']['audiences'], 'the audiences the site offers');

        $this->assertSame('photo', (new BxPhotosApiV2())->apiV2ItemKind('bx_photos'));
        $this->assertNull((new BxPhotosApiV2())->apiV2ItemKind('bx_videos'));
    }

    public function testOnePhotoPerUploadAndTheOriginalForItsOwnerOnly(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        // an upload is a photo in the module's storage, its copies at once
        $a = $this->upload($aAuth, 'Harbour.png', self::png(6, 4), ['purpose' => 'photo']);
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Media', $a['json']);
        $this->assertSame(['image', 'ready'], [$a['json']['kind'], $a['json']['state']]);
        $sFirst = $a['json']['id'];
        $sSecond = $this->uploadPhoto($aAuth, 'Lighthouse.png');
        // a video is not a photo
        $a = $this->upload($aAuth, 'clip.mp4', "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom" . str_repeat("\x00", 64), ['purpose' => 'photo']);
        $this->assertSame(415, $a['status'], $a['body']);

        // the same upload twice, none, comments off: 422; guests add nothing
        foreach ([['media_ids' => [$sFirst, $sFirst]], ['media_ids' => []], ['media_ids' => [$sFirst], 'comments_enabled' => false]] as $aBody) {
            $a = $this->http('POST', 'photos', $aJson, json_encode($aBody));
            $this->assertSame(422, $a['status'], json_encode($aBody) . ': ' . $a['body']);
        }
        $this->assertSame(401, $this->http('POST', 'photos', ['Content-Type' => 'application/json'], json_encode(['media_ids' => [$sFirst]]))['status']);

        // one photo for each upload, in their order, titled with their names
        $a = $this->http('POST', 'photos', $aJson, json_encode(['media_ids' => [$sSecond, $sFirst], 'text_html' => "By the sea\nat dusk"]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertCount(2, $a['json']);
        foreach ($a['json'] as $aItem) {
            $this->assertSchema('FileItem', $aItem);
            $this->_aPhotos[] = (int)$aItem['id'];
        }
        $this->assertSame(['Lighthouse', 'Harbour'], array_column($a['json'], 'title'), 'in the order given, each its file name');
        $this->assertSame([$sSecond, $sFirst], array_column(array_column($a['json'], 'media'), 'id'));
        list($aLighthouse, $aHarbour) = $a['json'];
        $this->assertSame(['photo', 'bx_photos', 'published', 'public', (string)$iViewer], [$aHarbour['kind'], $aHarbour['module'], $aHarbour['state'], $aHarbour['audience'], $aHarbour['author']['id']]);
        $this->assertStringContainsString('<p>By the sea</p>', (string)$aHarbour['text_html'], 'plain text becomes paragraphs, the text each one\'s');
        $this->assertSame(['thumb', 'medium', 'large'], array_keys($aHarbour['media']['variants']));
        $this->assertTrue($aHarbour['viewer']['can_edit']);
        $this->assertNotNull($aHarbour['content_id'], 'its Item in the feeds');
        $this->assertNull($aHarbour['album_id']);

        // an upload goes into one photo only
        $a = $this->http('POST', 'photos', $aJson, json_encode(['media_ids' => [$sFirst]]));
        $this->assertSame([422, 'media_ids[0]'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], $a['body']);

        // others and guests see it, as the module's copies: never the original, its name or size
        $sOriginal = $this->http('GET', 'photos/' . $aHarbour['id'], $aAuth)['json']['media']['url'];
        foreach ([$aOther, []] as $aHeaders) {
            $a = $this->http('GET', 'photos/' . $aHarbour['id'], $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('FileItem', $a['json']);
            $this->assertNotSame($sOriginal, $a['json']['media']['url']);
            $this->assertSame(['', 0], [$a['json']['media']['original_name'], $a['json']['media']['size']]);
            $this->assertStringNotContainsString('/bx_photos_photos/', $a['json']['media']['url'], 'a copy, not the upload');
        }
        $this->assertSame('Harbour.png', $this->http('GET', 'photos/' . $aHarbour['id'], $aAuth)['json']['media']['original_name']);

        // listed by its author, newest first; a list item has no text
        $a = $this->http('GET', 'photos?author=' . $iViewer . '&limit=50', $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_FileItem', $a['json']);
        $aIds = array_column($a['json']['items'], 'id');
        $this->assertContains($aHarbour['id'], $aIds);
        $this->assertNull($a['json']['items'][array_search($aHarbour['id'], $aIds)]['text_html']);

        // edits: the title, the text, the audience; not someone else's
        $a = $this->http('PATCH', 'photos/' . $aHarbour['id'], $aOther + ['Content-Type' => 'application/json'], json_encode(['title' => 'Not mine']));
        $this->assertSame(403, $a['status'], $a['body']);
        $a = $this->http('PATCH', 'photos/' . $aHarbour['id'], $aJson, json_encode(['title' => 'Harbour at dusk', 'audience' => 'private']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['Harbour at dusk', 'private', $sFirst], [$a['json']['title'], $a['json']['audience'], $a['json']['media']['id']], 'the picture stays');
        $this->assertSame(403, $this->http('GET', 'photos/' . $aHarbour['id'], $aOther)['status'], 'private now');
        $this->assertNotContains($aHarbour['id'], array_column($this->http('GET', 'photos?author=' . $iViewer . '&limit=50', $aOther)['json']['items'], 'id'));
        $this->assertSame(422, $this->http('PATCH', 'photos/' . $aHarbour['id'], $aJson, json_encode(['title' => '']))['status']);

        // deleting: not someone else's; then it is gone
        $this->assertContains($this->http('DELETE', 'photos/' . $aLighthouse['id'], $aOther)['status'], [403, 404]);
        $this->assertSame(204, $this->http('DELETE', 'photos/' . $aLighthouse['id'], $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'photos/' . $aLighthouse['id'], $aAuth)['status']);
    }

    public function testListsBySortAndPage(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        list($aA, $aB, $aC) = $this->makePhotos($aAuth, ['a.png', 'b.png', 'c.png']);
        $oDb = BxDolDb::getInstance();
        foreach ([[$aA, 978307200, 5, 0], [$aB, 978393600, 50, 0], [$aC, 978480000, 1, time()]] as list($aItem, $iAdded, $iViews, $iFeatured))
            $oDb->query("UPDATE `bx_photos_entries` SET `added` = :a, `changed` = :a, `views` = :v, `featured` = :f WHERE `id` = :id", ['a' => $iAdded, 'v' => $iViews, 'f' => $iFeatured, 'id' => (int)$aItem['id']]);
        $aMine = [$aA['id'], $aB['id'], $aC['id']];

        $fOrder = function (string $sQuery) use ($aAuth, $aMine, $iViewer) {
            $aIds = [];
            $sBase = 'photos?author=' . $iViewer . '&limit=1' . $sQuery;
            $sPath = $sBase;
            for ($i = 0; $i < 60 && $sPath; $i++) {
                $a = $this->http('GET', $sPath, $aAuth);
                $this->assertSame(200, $a['status'], $a['body']);
                $this->assertArrayHasKey('next_cursor', $a['json']);
                $aIds = array_merge($aIds, array_column($a['json']['items'], 'id'));
                $sPath = $a['json']['next_cursor'] !== null ? $sBase . '&cursor=' . rawurlencode($a['json']['next_cursor']) : '';
            }
            $this->assertSame(count($aIds), count(array_unique($aIds)), 'no page repeats one');
            return array_values(array_intersect($aIds, $aMine));
        };
        $this->assertSame([$aC['id'], $aB['id'], $aA['id']], $fOrder(''), 'recent: newest first');
        $this->assertSame([$aB['id'], $aA['id'], $aC['id']], $fOrder('&sort=popular'), 'popular: most viewed first');
        $this->assertSame([$aC['id']], $fOrder('&sort=featured'), 'featured ones only');
        $this->assertSame(422, $this->http('GET', 'photos?sort=oldest', $aAuth)['status']);
        $a = $this->http('GET', 'photos?context=' . $iViewer, $aAuth);
        $this->assertSame([422, 'context'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], 'a person is no context: ' . $a['body']);
    }

    public function testPhotosInASecretGroup(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        if (BxDolModule::getInstance('bx_photos')->serviceCheckAllowedAddInContext('bx_groups') !== CHECK_ACTION_RESULT_ALLOWED)
            $this->markTestSkipped('This site keeps no photos in groups.');
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];

        $iSecret = $this->makeGroup($iOwner, 's');
        list($aPhoto) = $this->makePhotos($aOwner, ['secret.png'], ['context_id' => (string)$iSecret]);
        $this->assertSame(['context', (string)$iSecret], [$aPhoto['audience'], $aPhoto['context_id']]);

        foreach ([$aAuth, []] as $aHeaders) {
            $this->assertSame(404, $this->http('GET', 'photos/' . $aPhoto['id'], $aHeaders)['status'], 'as if there were none');
            $this->assertNotContains($aPhoto['id'], array_column($this->http('GET', 'photos?author=' . $iOwner . '&limit=50', $aHeaders)['json']['items'], 'id'));
            $a = $this->http('GET', 'photos?context=' . $iSecret, $aHeaders);
            $this->assertSame([422, 'not_found'], [$a['status'], $a['json']['errors'][0]['code'] ?? null], $a['body']);
        }
        $this->assertSame(404, $this->http('DELETE', 'photos/' . $aPhoto['id'], $aAuth)['status']);

        // adding into it from outside is as if it were not there
        $sUpload = $this->uploadPhoto($aAuth);
        $a = $this->http('POST', 'photos', $aAuth + ['Content-Type' => 'application/json'], json_encode(['media_ids' => [$sUpload], 'context_id' => (string)$iSecret]));
        $this->assertSame([422, 'context_id'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], $a['body']);
        $this->http('DELETE', 'uploads/' . $sUpload, $aAuth);

        $this->assertSame([$aPhoto['id']], array_column($this->http('GET', 'photos?context=' . $iSecret, $aOwner)['json']['items'], 'id'), 'its members list it');
    }

    private function makeGroup(int $iOwner, string $sView): int
    {
        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, [
                'group_name' => 'ApiV2PhotosTest group ' . bin2hex(random_bytes(3)),
                'group_desc' => '<p>Made by ApiV2PhotosTest</p>',
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

        $sWord = 'apiv2photo' . bin2hex(random_bytes(4));
        list($aPublic) = $this->makePhotos($aAuth, ['p.png'], ['title' => 'ApiV2Test ' . $sWord]);
        list($aPrivate) = $this->makePhotos($aAuth, ['q.png'], ['title' => 'ApiV2Test private ' . $sWord, 'audience' => 'private']);

        $a = $this->http('GET', 'search/photos?q=' . $sWord, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_FileItem', $a['json']);
        $this->assertEqualsCanonicalizing([$aPublic['id'], $aPrivate['id']], array_column($a['json']['items'], 'id'));
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $a = $this->http('GET', 'search/photos?q=' . $sWord, ['Authorization' => 'Bearer ' . $this->profileToken($iOther)]);
        $this->assertSame([$aPublic['id']], array_column($a['json']['items'], 'id'), 'not the private one');

        $oPhotos = new BxPhotosApiV2();
        foreach (['bx_groups', 'bx_spaces', 'bx_events'] as $sContext)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sContext))
                $this->assertSame(BxDolModule::getInstance('bx_photos')->serviceCheckAllowedAddInContext($sContext) === CHECK_ACTION_RESULT_ALLOWED ? 'photos' : null, $oPhotos->apiV2ContextContent($sContext), $sContext);
    }

    public function testPhotosPastTheLevelsLimitStayUploads(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $oDb = BxDolDb::getInstance();
        $iAction = (int)$oDb->getOne("SELECT `ID` FROM `sys_acl_actions` WHERE `Module` = 'bx_photos' AND `Name` = 'create entry'");
        $aLevel = BxDolAcl::getInstance()->getMemberMembershipInfo($iViewer);
        $iLevel = (int)($aLevel['id'] ?? 0);
        $aMatrix = $oDb->getRow("SELECT * FROM `sys_acl_matrix` WHERE `IDLevel` = :l AND `IDAction` = :a", ['l' => $iLevel, 'a' => $iAction]);
        if (!$iAction || !$aMatrix)
            $this->markTestSkipped('The test user\'s level has no photo limit to set.');
        $aTrack = $oDb->getRow("SELECT * FROM `sys_acl_actions_track` WHERE `IDAction` = :a AND `IDMember` = :m", ['a' => $iAction, 'm' => $iViewer]);

        $sFirst = $this->uploadPhoto($aAuth, 'Taken.png');
        $sSecond = $this->uploadPhoto($aAuth, 'Left.png');
        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        // the level allows one more photo: the form makes the first and stops
        $oDb->query("UPDATE `sys_acl_matrix` SET `AllowedCount` = 1 WHERE `IDLevel` = :l AND `IDAction` = :a", ['l' => $iLevel, 'a' => $iAction]);
        $oDb->query("DELETE FROM `sys_acl_actions_track` WHERE `IDAction` = :a AND `IDMember` = :m", ['a' => $iAction, 'm' => $iViewer]);
        try {
            $a = $this->http('POST', 'photos', $aJson, json_encode(['media_ids' => [$sFirst, $sSecond]]));
            $this->assertSame(201, $a['status'], $a['body']);
            foreach ($a['json'] as $aItem)
                $this->_aPhotos[] = (int)$aItem['id'];
            $this->assertSame([$sFirst], array_column(array_column($a['json'], 'media'), 'id'), 'the upload not taken is the one no photo has');
            $this->assertSame(403, $this->http('POST', 'photos', $aJson, json_encode(['media_ids' => [$sSecond]]))['status'], 'no more now');
        }
        finally {
            $oDb->query("UPDATE `sys_acl_matrix` SET `AllowedCount` = :c WHERE `IDLevel` = :l AND `IDAction` = :a", ['c' => $aMatrix['AllowedCount'], 'l' => $iLevel, 'a' => $iAction]);
            $oDb->query("DELETE FROM `sys_acl_actions_track` WHERE `IDAction` = :a AND `IDMember` = :m", ['a' => $iAction, 'm' => $iViewer]);
            if ($aTrack)
                $oDb->query("INSERT INTO `sys_acl_actions_track` SET `IDAction` = :a, `IDMember` = :m, `ActionsLeft` = :l, `ValidSince` = :v", ['a' => $iAction, 'm' => $iViewer, 'l' => $aTrack['ActionsLeft'], 'v' => $aTrack['ValidSince']]);
        }

        // the one left is still the viewer's upload, taken by nothing: it can be sent again
        $a = $this->http('POST', 'photos', $aJson, json_encode(['media_ids' => [$sSecond]]));
        $this->assertSame(201, $a['status'], $a['body']);
        foreach ($a['json'] as $aItem)
            $this->_aPhotos[] = (int)$aItem['id'];
        $this->assertSame(['Left'], array_column($a['json'], 'title'));
    }

    public function testAnOwnersOriginalsAreTheSameReusedLinksAloneAndOnAPage(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $aPhoto = $this->makePhotos($aAuth, ['Single.png'])[0];

        // a single answer and the owner's own page (whose tokens are read at once) give the same link
        $a = $this->http('GET', 'photos/' . $aPhoto['id'], $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('FileItem', $a['json']);
        $this->assertSame(['Single.png', 'Single'], [$a['json']['media']['original_name'], $a['json']['title']]);
        $fMine = function () use ($iViewer, $aAuth, $aPhoto) {
            $b = $this->http('GET', 'photos?author=' . $iViewer . '&limit=50', $aAuth);
            $this->assertSame(200, $b['status'], $b['body']);
            return array_column($b['json']['items'], null, 'id')[$aPhoto['id']]['media']['url'] ?? null;
        };
        $sUrl = $fMine();
        $this->assertSame($a['json']['media']['url'], $sUrl, 'the same reused link on a page as alone');
        $this->assertStringContainsString('t=', (string)$sUrl, 'a private original is a token link');
        $this->assertSame($sUrl, $fMine(), 'and the same next time');
    }
}
