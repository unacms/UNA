<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Files (bx_files, BxFilesApiV2 on the files base), over real HTTP: files each test
 * makes through POST /uploads (purpose `file`) and POST /files, and deletes after. One file per
 * upload, of any type; the original (its download) for everyone who may see it, as the site's
 * download; folders never; privacy, secret groups, lists, edits, search and the paths only with
 * the module. Skips without bx_files.
 */
#[Group('integration')]
class ApiV2FilesTest extends ApiV2TestCase
{
    /** Files (and folders) a test made, deleted after it through the module. */
    protected $_aFiles = [];
    /** The groups a test made, deleted after it. */
    protected $_aGroups = [];

    protected function tearDown(): void
    {
        if ($this->_aFiles && BxDolModuleQuery::getInstance()->isEnabledByName('bx_files')) {
            BxDolDb::getInstance()->cleanMemoryAll();
            $oModule = BxDolModule::getInstance('bx_files');
            foreach ($this->_aFiles as $iId)
                if (($aContent = $oModule->_oDb->getContentInfoById($iId))) {
                    if (($aContent['type'] ?? 'file') === 'folder')
                        BxDolDb::getInstance()->query("DELETE FROM `bx_files_main` WHERE `id` = :id AND `type` = 'folder'", ['id' => $iId]);
                    else
                        $oModule->serviceDeleteEntity($iId);
                }
        }
        if ($this->_aGroups)
            BxDolDb::getInstance()->cleanMemoryAll();
        foreach ($this->_aGroups as $iProfileId)
            if (($oProfile = BxDolProfile::getInstance($iProfileId)))
                $oProfile->delete(false, true, true);
        parent::tearDown();
    }

    /** A small PDF of one blank page. */
    protected static function pdf(): string
    {
        return "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
    }

    /** An upload of purpose `file`: its Media. */
    protected function uploadFile(array $aAuth, string $sName = 'notes.txt', ?string $sData = null): array
    {
        $a = $this->upload($aAuth, $sName, $sData ?? "Notes for the meeting\n", ['purpose' => 'file']);
        $this->assertSame(201, $a['status'], $a['body']);
        return $a['json'];
    }

    /** Files of the token's profile from new uploads: their FileItems. */
    protected function makeFiles(array $aAuth, array $aNames, array $aBody = []): array
    {
        $aIds = array_map(fn($s) => $this->uploadFile($aAuth, $s)['id'], $aNames);
        $a = $this->http('POST', 'files', $aAuth + ['Content-Type' => 'application/json'], json_encode(['media_ids' => $aIds] + $aBody));
        $this->assertSame(201, $a['status'], $a['body']);
        foreach ($a['json'] as $aItem)
            $this->_aFiles[] = (int)$aItem['id'];
        return $a['json'];
    }

    protected function requireAdding(array $aAuth): void
    {
        $this->requireModule('bx_files');
        $a = $this->upload($aAuth, 'probe.txt', 'probe', ['purpose' => 'file']);
        if ($a['status'] === 403)
            $this->markTestSkipped('The test user may not add files here.');
        $this->assertSame(201, $a['status'], $a['body']);
        $this->http('DELETE', 'uploads/' . $a['json']['id'], $aAuth);
    }

    /** The bytes a storage link of the site gives (its /s/ address is storage.php's, which the test server has no rewrite for). */
    protected function download(string $sUrl): array
    {
        $aUrl = parse_url($sUrl);
        $this->assertMatchesRegularExpression('#^/s/([a-zA-Z0-9_]+)/([a-zA-Z0-9.]+)$#', (string)$aUrl['path']);
        preg_match('#^/s/([a-zA-Z0-9_]+)/([a-zA-Z0-9.]+)$#', $aUrl['path'], $m);
        if (!self::$_oServer)
            $this->http('GET', '');
        return $this->raw('GET', '/storage.php?o=' . $m[1] . '&f=' . $m[2] . (isset($aUrl['query']) ? '&' . $aUrl['query'] : ''));
    }

    public function testFilePathsOnlyWhileFilesIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/files', '/files/{id}', '/search/files'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_files']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxFilesApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Files');
        $this->assertArrayNotHasKey('NewFiles', $aSpec['components']['schemas']);

        $this->requireModule('bx_files');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxFilesApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Files');
        $this->assertEqualsCanonicalizing(['get', 'patch', 'delete'], array_keys($aSpec['paths']['/files/{id}']));
        $this->assertSame(['listFiles', 'createFiles', 'getFileItem', 'updateFileItem', 'deleteFileItem'], [
            $aSpec['paths']['/files']['get']['operationId'] ?? null, $aSpec['paths']['/files']['post']['operationId'] ?? null,
            $aSpec['paths']['/files/{id}']['get']['operationId'] ?? null, $aSpec['paths']['/files/{id}']['patch']['operationId'] ?? null, $aSpec['paths']['/files/{id}']['delete']['operationId'] ?? null,
        ], 'the operation ids');

        $a = $this->http('GET', '');
        $this->assertSame(200, $a['status'], $a['body']);
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_files', 'tag' => 'files', 'kind' => 'file'], array_diff_key($aModules['bx_files'] ?? [], ['title' => 1, 'audiences' => 1]));

        $this->assertSame('file', (new BxFilesApiV2())->apiV2ItemKind('bx_files'));
        $this->assertNull((new BxFilesApiV2())->apiV2ItemKind('bx_photos'));
    }

    public function testOneFilePerUploadAndItsDownloadForWhoeverSeesIt(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        // an upload of any type the storage takes: a document is `file`, an image `image` with its previews
        $aPdf = $this->uploadFile($aAuth, 'Agenda.pdf', self::pdf());
        $this->assertSchema('Media', $aPdf);
        $this->assertSame(['file', 'application/pdf', 'ready', 'Agenda.pdf', strlen(self::pdf())], [$aPdf['kind'], $aPdf['mime'], $aPdf['state'], $aPdf['original_name'], $aPdf['size']]);
        $this->assertEquals(new stdClass(), (object)$aPdf['variants'], 'the site makes no still of a PDF');
        $aPng = $this->uploadFile($aAuth, 'Plan.png', self::png(6, 4));
        $this->assertSame('image', $aPng['kind']);
        $this->assertSame(['thumb', 'medium'], array_keys($aPng['variants']), 'the module\'s preview and gallery copies');
        // an image that is not one is refused, as for every purpose
        $a = $this->upload($aAuth, 'fake.png', 'not a picture', ['purpose' => 'file']);
        $this->assertSame(415, $a['status'], $a['body']);

        // the same upload twice, none, comments off: 422; guests add nothing
        foreach ([['media_ids' => [$aPdf['id'], $aPdf['id']]], ['media_ids' => []], ['media_ids' => [$aPdf['id']], 'comments_enabled' => false]] as $aBody) {
            $a = $this->http('POST', 'files', $aJson, json_encode($aBody));
            $this->assertSame(422, $a['status'], json_encode($aBody) . ': ' . $a['body']);
        }
        $this->assertSame(401, $this->http('POST', 'files', ['Content-Type' => 'application/json'], json_encode(['media_ids' => [$aPdf['id']]]))['status']);

        // one file for each upload, in their order, titled with their names
        $a = $this->http('POST', 'files', $aJson, json_encode(['media_ids' => [$aPng['id'], $aPdf['id']], 'text_html' => "For Saturday\nBring a pen"]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertCount(2, $a['json']);
        foreach ($a['json'] as $aItem) {
            $this->assertSchema('FileItem', $aItem);
            $this->_aFiles[] = (int)$aItem['id'];
        }
        $this->assertSame(['Plan', 'Agenda'], array_column($a['json'], 'title'), 'in the order given, each its file name');
        $this->assertSame([$aPng['id'], $aPdf['id']], array_column(array_column($a['json'], 'media'), 'id'));
        list($aPlan, $aAgenda) = $a['json'];
        $this->assertSame(['file', 'bx_files', 'published', 'public', (string)$iViewer], [$aAgenda['kind'], $aAgenda['module'], $aAgenda['state'], $aAgenda['audience'], $aAgenda['author']['id']]);
        $this->assertStringContainsString('<p>For Saturday</p>', (string)$aAgenda['text_html']);
        $this->assertNotNull($aAgenda['content_id'], 'its Item in the feeds');
        $this->assertTrue($aAgenda['viewer']['can_edit']);

        // an upload goes into one file only
        $a = $this->http('POST', 'files', $aJson, json_encode(['media_ids' => [$aPdf['id']]]));
        $this->assertSame([422, 'media_ids[0]'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], $a['body']);

        // others and guests get the file itself, as the site's download gives it: its name, size and bytes
        foreach ([$aOther, []] as $aHeaders) {
            $a = $this->http('GET', 'files/' . $aAgenda['id'], $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('FileItem', $a['json']);
            $m = $a['json']['media'];
            $this->assertSame(['Agenda.pdf', strlen(self::pdf()), 'application/pdf'], [$m['original_name'], $m['size'], $m['mime']]);
            $this->assertSame($m['url'], $m['download_url']);
            $this->assertStringContainsString('/bx_files_files/', $m['download_url']);
            $b = $this->download($m['download_url']);
            $this->assertSame(200, $b['status']);
            $this->assertSame(self::pdf(), $b['body'], 'the bytes uploaded');
            $this->assertStringContainsString('Agenda.pdf', (string)BxDolTestPhpServer::header($b, 'content-disposition'), 'under the name it was uploaded with');
        }
        // an image's previews go with it
        $a = $this->http('GET', 'files/' . $aPlan['id']);
        $this->assertSame(['image', ['thumb', 'medium']], [$a['json']['media']['kind'], array_keys($a['json']['media']['variants'])]);

        // listed by its author, newest first; a list item has no text
        $a = $this->http('GET', 'files?author=' . $iViewer . '&limit=50', $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_FileItem', $a['json']);
        $aIds = array_column($a['json']['items'], 'id');
        $this->assertContains($aAgenda['id'], $aIds);
        $this->assertNull($a['json']['items'][array_search($aAgenda['id'], $aIds)]['text_html']);

        // edits: the title, the description, the audience; not someone else's
        $a = $this->http('PATCH', 'files/' . $aAgenda['id'], $aOther + ['Content-Type' => 'application/json'], json_encode(['title' => 'Not mine']));
        $this->assertSame(403, $a['status'], $a['body']);
        $a = $this->http('PATCH', 'files/' . $aAgenda['id'], $aJson, json_encode(['title' => 'Agenda, Saturday', 'audience' => 'private']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['Agenda, Saturday', 'private', $aPdf['id']], [$a['json']['title'], $a['json']['audience'], $a['json']['media']['id']], 'the file stays');
        $this->assertSame(403, $this->http('GET', 'files/' . $aAgenda['id'], $aOther)['status'], 'private now');
        $this->assertNotContains($aAgenda['id'], array_column($this->http('GET', 'files?author=' . $iViewer . '&limit=50', $aOther)['json']['items'], 'id'));
        $this->assertSame(422, $this->http('PATCH', 'files/' . $aAgenda['id'], $aJson, json_encode(['title' => '']))['status']);

        // deleting: not someone else's; then it is gone
        $this->assertContains($this->http('DELETE', 'files/' . $aPlan['id'], $aOther)['status'], [403, 404]);
        $this->assertSame(204, $this->http('DELETE', 'files/' . $aPlan['id'], $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'files/' . $aPlan['id'], $aAuth)['status']);
    }

    public function testFoldersAreNoFiles(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $oDb = BxDolDb::getInstance();

        // a folder as the site's file manager makes one, and a file in it
        BxDolModule::getInstance('bx_files')->_oDb->createFolder(0, $iViewer, BX_DOL_PG_ALL, 'ApiV2FilesTest folder');
        $iFolder = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iFolder);
        $this->_aFiles[] = $iFolder;
        list($aFile) = $this->makeFiles($aAuth, ['inside.txt']);
        BxDolModule::getInstance('bx_files')->_oDb->moveFilesToFolder([(int)$aFile['id']], $iFolder);

        $this->assertSame(404, $this->http('GET', 'files/' . $iFolder, $aAuth)['status'], 'a folder is not a file');
        $aIds = array_column($this->http('GET', 'files?author=' . $iViewer . '&limit=50', $aAuth)['json']['items'], 'id');
        $this->assertNotContains((string)$iFolder, $aIds, 'nor listed');
        $this->assertContains($aFile['id'], $aIds, 'a file in a folder is listed with the others');
        $this->assertNotContains((string)$iFolder, array_column($this->http('GET', 'files?limit=50', $aAuth)['json']['items'], 'id'));
    }

    public function testListsBySortAndPage(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        list($aA, $aB, $aC) = $this->makeFiles($aAuth, ['a.txt', 'b.txt', 'c.txt']);
        $oDb = BxDolDb::getInstance();
        foreach ([[$aA, 978307200, 5, 0], [$aB, 978393600, 50, 0], [$aC, 978480000, 1, time()]] as list($aItem, $iAdded, $iViews, $iFeatured))
            $oDb->query("UPDATE `bx_files_main` SET `added` = :a, `changed` = :a, `views` = :v, `featured` = :f WHERE `id` = :id", ['a' => $iAdded, 'v' => $iViews, 'f' => $iFeatured, 'id' => (int)$aItem['id']]);
        $aMine = [$aA['id'], $aB['id'], $aC['id']];

        $fOrder = function (string $sQuery) use ($aAuth, $aMine, $iViewer) {
            $aIds = [];
            $sBase = 'files?author=' . $iViewer . '&limit=1' . $sQuery;
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
        $this->assertSame(422, $this->http('GET', 'files?sort=oldest', $aAuth)['status']);
        $a = $this->http('GET', 'files?context=' . $iViewer, $aAuth);
        $this->assertSame([422, 'context'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], 'a person is no context: ' . $a['body']);
    }

    public function testFilesInASecretGroup(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        if (BxDolModule::getInstance('bx_files')->serviceCheckAllowedAddInContext('bx_groups') !== CHECK_ACTION_RESULT_ALLOWED)
            $this->markTestSkipped('This site keeps no files in groups.');
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];

        $iSecret = $this->makeGroup($iOwner, 's');
        list($aFile) = $this->makeFiles($aOwner, ['secret.txt'], ['context_id' => (string)$iSecret]);
        $this->assertSame(['context', (string)$iSecret], [$aFile['audience'], $aFile['context_id']]);

        foreach ([$aAuth, []] as $aHeaders) {
            $this->assertSame(404, $this->http('GET', 'files/' . $aFile['id'], $aHeaders)['status'], 'as if there were none');
            $this->assertNotContains($aFile['id'], array_column($this->http('GET', 'files?author=' . $iOwner . '&limit=50', $aHeaders)['json']['items'], 'id'));
            $a = $this->http('GET', 'files?context=' . $iSecret, $aHeaders);
            $this->assertSame([422, 'not_found'], [$a['status'], $a['json']['errors'][0]['code'] ?? null], $a['body']);
        }
        $this->assertSame(404, $this->http('DELETE', 'files/' . $aFile['id'], $aAuth)['status']);

        // adding into it from outside is as if it were not there
        $sUpload = $this->uploadFile($aAuth)['id'];
        $a = $this->http('POST', 'files', $aAuth + ['Content-Type' => 'application/json'], json_encode(['media_ids' => [$sUpload], 'context_id' => (string)$iSecret]));
        $this->assertSame([422, 'context_id'], [$a['status'], $a['json']['errors'][0]['field'] ?? null], $a['body']);
        $this->http('DELETE', 'uploads/' . $sUpload, $aAuth);

        $this->assertSame([$aFile['id']], array_column($this->http('GET', 'files?context=' . $iSecret, $aOwner)['json']['items'], 'id'), 'its members list it');
        $this->assertContains($aFile['id'], array_column($this->http('GET', 'files?author=' . $iOwner . '&limit=50', $aOwner)['json']['items'], 'id'), 'its author lists it with their files in contexts');
    }

    private function makeGroup(int $iOwner, string $sView): int
    {
        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, [
                'group_name' => 'ApiV2FilesTest group ' . bin2hex(random_bytes(3)),
                'group_desc' => '<p>Made by ApiV2FilesTest</p>',
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

    /**
     * A video file is `processing` while the converter has it queued (POST /files queues it),
     * `failed` when converting it failed, and `ready` with no copies when nothing converts it:
     * the file is there to download.
     */
    public function testAVideoFileSaysWhetherItIsBeingConverted(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $sMp4 = (string)(BxDolModule::getInstance('bx_files')->_oConfig->CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4'] ?? '');
        if ($sMp4 === '' || !BxDolTranscoder::getObjectInstance($sMp4))
            $this->markTestSkipped('This site converts no video files.');

        $aUpload = $this->uploadFile($aAuth, 'clip.mp4', "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom" . str_repeat("\x00", 64));
        $this->assertSame('video', $aUpload['kind']);
        $a = $this->http('POST', 'files', $aAuth + ['Content-Type' => 'application/json'], json_encode(['media_ids' => [$aUpload['id']]]));
        $this->assertSame(201, $a['status'], $a['body']);
        $sId = $a['json'][0]['id'];
        $this->_aFiles[] = (int)$sId;
        $iFile = (int)BxDolModule::getInstance('bx_files')->_oDb->getContentInfoById((int)$sId)['file_id'];
        $oDb = BxDolDb::getInstance();
        try {
            $this->assertSame('processing', $a['json'][0]['media']['state'], 'queued as it was added');
            $this->assertArrayNotHasKey('mp4', (array)$a['json'][0]['media']['variants']);
            $a = $this->http('GET', 'files?author=' . $a['json'][0]['author']['id'] . '&limit=50', $aAuth);
            $aListed = array_column($a['json']['items'], null, 'id')[$sId] ?? null;
            $this->assertSame('processing', $aListed['media']['state'] ?? null, 'in lists too');

            $oDb->query("UPDATE `sys_transcoder_queue` SET `status` = 'failed' WHERE `transcoder_object` = :o AND `file_id_source` = :f", ['o' => $sMp4, 'f' => (string)$iFile]);
            $this->assertSame('failed', $this->http('GET', 'files/' . $sId, $aAuth)['json']['media']['state']);

            $oDb->query("DELETE FROM `sys_transcoder_queue` WHERE `transcoder_object` = :o AND `file_id_source` = :f", ['o' => $sMp4, 'f' => (string)$iFile]);
            $a = $this->http('GET', 'files/' . $sId, $aAuth);
            $this->assertSame(['ready', 'video'], [$a['json']['media']['state'], $a['json']['media']['kind']], 'nothing converts it: a download');
            $this->assertArrayNotHasKey('mp4', (array)$a['json']['media']['variants']);
            $this->assertNotEmpty($a['json']['media']['download_url']);
        }
        finally {
            $oDb->query("DELETE FROM `sys_transcoder_queue` WHERE `transcoder_object` LIKE 'bx\\_files\\_%' AND `file_id_source` = :f", ['f' => (string)$iFile]);
        }
    }

    /**
     * A page's contexts: the admins, their roles and fan connections, and a profile's
     * invitations are read for all of them at the first check that asks (a query each), and are
     * what reading them one by one gives; an invitation that changes is read again.
     */
    public function testContextReadsOfAPageAreReadOnceForAll(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer) = $this->userToken();
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aGroups = [$this->makeGroup($iOwner, 'p'), $this->makeGroup($iOwner, 'p')];
        $oModule = BxDolModule::getInstance('bx_groups');
        $oDb = $oModule->_oDb;
        $oFans = BxDolConnection::getObjectInstance($oModule->_oConfig->CNF['OBJECT_CONNECTIONS']);
        $iInvite = $oDb->insertInvite('apiv2-' . bin2hex(random_bytes(4)), $aGroups[1], $iOwner, $iViewer);

        // one by one, as the site reads them
        $aExpected = [];
        foreach ($aGroups as $iGroup) {
            $aAdmins = $oDb->getAdmins($iGroup);
            $aExpected[$iGroup] = [
                array_map('intval', $aAdmins),
                array_map(fn($i) => $oDb->getRole($iGroup, $i), $aAdmins),
                array_map(fn($i) => $oFans->isConnected($i, $iGroup, true), $aAdmins),
                (int)($oDb->getInviteByInvited($iViewer, $iGroup)['id'] ?? 0),
            ];
        }
        $this->assertContains($iOwner, $aExpected[$aGroups[0]][0], 'its author manages it');
        $this->assertSame([0, $iInvite], [$aExpected[$aGroups[0]][3], $aExpected[$aGroups[1]][3]]);
        BxDolDb::getInstance()->cleanMemoryAll();

        $oDbConn = BxDolDb::getInstance();
        $fQueries = fn() => (int)$oDbConn->getRow("SHOW SESSION STATUS LIKE 'Questions'")['Value'];
        BxDolApiV2Targets::primeContexts($aGroups);
        $iBefore = $fQueries();
        $aPrimed = [];
        foreach ($aGroups as $iGroup) {
            $aAdmins = $oDb->getAdmins($iGroup);
            $aPrimed[$iGroup] = [
                array_map('intval', $aAdmins),
                array_map(fn($i) => $oDb->getRole($iGroup, $i), $aAdmins),
                array_map(fn($i) => $oFans->isConnected($i, $iGroup, true), $aAdmins),
                (int)($oDb->getInviteByInvited($iViewer, $iGroup)['id'] ?? 0),
            ];
        }
        $this->assertSame($aExpected, $aPrimed);
        // admins with their roles, their fan connections, the invitations (and the count itself)
        $this->assertSame(3, $fQueries() - $iBefore - 1, 'a query each for both contexts');

        $oDb->deleteInvite($iInvite);
        $this->assertSame([], $oDb->getInviteByInvited($iViewer, $aGroups[1]), 'a changed invitation is read again');
    }

    public function testSearchAndContextContent(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        $sWord = 'apiv2file' . bin2hex(random_bytes(4));
        list($aPublic) = $this->makeFiles($aAuth, ['p.txt'], ['title' => 'ApiV2Test ' . $sWord]);
        list($aPrivate) = $this->makeFiles($aAuth, ['q.txt'], ['title' => 'ApiV2Test private ' . $sWord, 'audience' => 'private']);

        $a = $this->http('GET', 'search/files?q=' . $sWord, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_FileItem', $a['json']);
        $this->assertEqualsCanonicalizing([$aPublic['id'], $aPrivate['id']], array_column($a['json']['items'], 'id'));
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $a = $this->http('GET', 'search/files?q=' . $sWord, ['Authorization' => 'Bearer ' . $this->profileToken($iOther)]);
        $this->assertSame([$aPublic['id']], array_column($a['json']['items'], 'id'), 'not the private one');

        $oFiles = new BxFilesApiV2();
        foreach (['bx_groups', 'bx_spaces', 'bx_events'] as $sContext)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sContext))
                $this->assertSame(BxDolModule::getInstance('bx_files')->serviceCheckAllowedAddInContext($sContext) === CHECK_ACTION_RESULT_ALLOWED ? 'files' : null, $oFiles->apiV2ContextContent($sContext), $sContext);
    }
}
