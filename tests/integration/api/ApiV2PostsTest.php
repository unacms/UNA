<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Posts (bx_posts, BxPostsApiV2 on the text base), over real HTTP: posts each test
 * writes through POST /posts and deletes after. Writing (a title of 3 to 160, text, a summary, a
 * category, a cover from an upload, what is not taken here), reading (the text and the cover's
 * copies, the original for its owner only), editing and deleting by whom the module lets, the
 * feeds' Item naming the post (`entry_id`), a secret group's post, lists, /me/posts, search, and
 * the paths only with the module. Skips without bx_posts.
 */
#[Group('integration')]
class ApiV2PostsTest extends ApiV2TestCase
{
    /** Posts a test wrote, deleted after it through the module. */
    protected $_aPosts = [];
    /** The groups a test made, deleted after it. */
    protected $_aGroups = [];
    /** The categories GET /posts/categories lists (_withCategory). */
    protected $_aCategories = null;

    protected function tearDown(): void
    {
        if ($this->_aPosts && BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts')) {
            BxDolDb::getInstance()->cleanMemoryAll();
            $oModule = BxDolModule::getInstance('bx_posts');
            foreach ($this->_aPosts as $iId)
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

    /** The body with the site's first category when it names none (the site's form requires one). */
    protected function withCategory(array $aBody): array
    {
        if ($this->_aCategories === null)
            $this->_aCategories = (array)$this->http('GET', 'posts/categories')['json'];
        if (!array_key_exists('category_id', $aBody) && $this->_aCategories)
            $aBody['category_id'] = $this->_aCategories[0]['id'];
        return $aBody;
    }

    /** A post of the token's profile: its Post. */
    protected function makePost(array $aAuth, string $sTitle, array $aBody = []): array
    {
        $a = $this->http('POST', 'posts', $aAuth + ['Content-Type' => 'application/json'], json_encode($this->withCategory($aBody + ['title' => $sTitle, 'body_html' => '<p>Written by ApiV2PostsTest.</p>'])));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aPosts[] = (int)$a['json']['id'];
        return $a['json'];
    }

    protected function requireAdding(array $aAuth): void
    {
        $this->requireModule('bx_posts');
        $a = $this->http('POST', 'posts', $aAuth + ['Content-Type' => 'application/json'], json_encode($this->withCategory(['title' => 'ApiV2Test probe', 'body_html' => 'probe'])));
        if ($a['status'] === 403)
            $this->markTestSkipped('The test user may not write posts here.');
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aPosts[] = (int)$a['json']['id'];
    }

    public function testANewPostAttachesLinksAsItsFormDoes(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        if (!BxDolModule::getInstance('bx_posts')->_oConfig->isAttachLinks())
            $this->markTestSkipped('Posts take no links on this site.');

        $a = $this->http('POST', 'posts', $aAuth + ['Content-Type' => 'application/json'], json_encode($this->withCategory(['title' => 'ApiV2Test private link', 'body_html' => '<p>x</p>', 'links' => ['http://192.168.1.1/']])));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame(['links[0]', 'not_allowed'], [$a['json']['errors'][0]['field'], $a['json']['errors'][0]['code']]);

        $aPost = $this->makePost($aAuth, 'ApiV2Test with a link', ['links' => ['https://example.com/']]);
        $this->assertSame(['https://example.com'], array_column($aPost['links'], 'url'), 'the site reads it and links it to the post');
    }

    public function testPostPathsOnlyWhilePostsIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/posts', '/posts/{id}', '/posts/categories', '/me/posts', '/search/posts'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_posts']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxPostsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Posts');
        $this->assertArrayNotHasKey('NewPost', $aSpec['components']['schemas']);

        $this->requireModule('bx_posts');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxPostsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Posts');
        $this->assertEqualsCanonicalizing(['get', 'patch', 'delete'], array_keys($aSpec['paths']['/posts/{id}']));
        $this->assertSame('listMyPosts', $aSpec['paths']['/me/posts']['get']['operationId']);

        $a = $this->http('GET', '');
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_posts', 'tag' => 'posts', 'kind' => 'post'], array_diff_key($aModules['bx_posts'] ?? [], ['title' => 1, 'audiences' => 1]));
        $oPosts = new BxPostsApiV2();
        $this->assertSame('post', $oPosts->apiV2ItemKind('bx_posts'));
        $this->assertTrue($oPosts->apiV2ItemEntry('bx_posts'));
        $this->assertFalse($oPosts->apiV2ItemEntry('bx_timeline'));
        $this->assertSame(['post_cover'], array_column($oPosts->apiV2UploadStorages(), 'purpose'));

        $a = $this->http('GET', 'posts/categories');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('PostCategoryList', $a['json']);
    }

    public function testWritingReadingEditingAndDeleting(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        // a title of 3 to 160 and some text; what is not taken here; guests write nothing
        $fField = function ($a) { return [$a['status'], $a['json']['errors'][0]['field'] ?? null]; };
        $this->assertSame([422, 'title'], $fField($this->http('POST', 'posts', $aJson, json_encode(['title' => 'ab', 'body_html' => 'Text']))));
        $this->assertSame([422, 'title'], $fField($this->http('POST', 'posts', $aJson, json_encode(['title' => str_repeat('é', 161), 'body_html' => 'Text']))));
        $this->assertSame([422, 'body_html'], $fField($this->http('POST', 'posts', $aJson, json_encode(['title' => 'A title', 'body_html' => '<p> </p>']))));
        $this->assertSame([422, 'status'], $fField($this->http('POST', 'posts', $aJson, json_encode(['title' => 'A title', 'body_html' => 'Text', 'status' => 'scheduled']))));
        $this->assertSame([422, 'anonymous'], $fField($this->http('POST', 'posts', $aJson, json_encode(['title' => 'A title', 'body_html' => 'Text', 'anonymous' => true]))));
        $this->assertSame([422, 'category_id'], $fField($this->http('POST', 'posts', $aJson, json_encode(['title' => 'A title', 'body_html' => 'Text', 'category_id' => '999999']))));
        $this->assertSame(401, $this->http('POST', 'posts', ['Content-Type' => 'application/json'], json_encode(['title' => 'A title', 'body_html' => 'Text']))['status']);

        // with a cover from an upload of purpose post_cover, a summary and a category
        $a = $this->upload($aAuth, 'cover.png', self::png(8, 5), ['purpose' => 'post_cover']);
        $this->assertSame(201, $a['status'], $a['body']);
        $sCover = $a['json']['id'];
        $this->assertSame(415, $this->upload($aAuth, 'notes.txt', 'just text', ['purpose' => 'post_cover'])['status'], 'a cover is a photo');
        $this->assertSame([422, 'cover_media_id'], $fField($this->http('POST', 'posts', $aJson, json_encode($this->withCategory(['title' => 'A title', 'body_html' => 'Text', 'cover_media_id' => '12345'])))));
        $aCategories = $this->http('GET', 'posts/categories')['json'];
        $aBody = ['summary' => 'The short version.', 'cover_media_id' => $sCover];
        if ($aCategories)
            $aBody['category_id'] = $aCategories[count($aCategories) - 1]['id'];
        $aPost = $this->makePost($aAuth, 'ApiV2Test a long read', ['body_html' => "First paragraph.\nSecond paragraph."] + $aBody);
        $this->assertSchema('Post', $aPost);
        $this->assertSame(['ApiV2Test a long read', 'The short version.', 'public', 'published', 'approved', false, 1], [$aPost['title'], $aPost['summary'], $aPost['audience'], $aPost['state'], $aPost['moderation'], $aPost['anonymous'], $aPost['revision']]);
        $this->assertSame('<p>First paragraph.</p><p>Second paragraph.</p>', $aPost['body_html'], 'plain text becomes paragraphs');
        $this->assertSame((string)$iViewer, $aPost['author']['id']);
        if ($aCategories)
            $this->assertSame($aBody['category_id'], $aPost['category']['id'] ?? null);
        $this->assertNotNull($aPost['cover'], 'the cover the upload was');
        $this->assertSame($sCover, $aPost['cover']['id']);
        $this->assertNotEmpty((array)$aPost['cover']['variants']);
        $this->assertGreaterThan(0, $aPost['cover']['size'], 'its owner gets the original');
        $this->assertSame(['can_edit' => true, 'can_delete' => true], array_intersect_key($aPost['viewer'], ['can_edit' => 1, 'can_delete' => 1]));
        $this->assertNotNull($aPost['content_id'], 'the feeds show it');
        // an upload a post took is taken
        $this->assertSame(422, $this->http('POST', 'posts', $aJson, json_encode($this->withCategory(['title' => 'A title', 'body_html' => 'Text', 'cover_media_id' => $sCover])))['status']);

        // what others see: the copies of the cover, never its original
        $a = $this->http('GET', 'posts/' . $aPost['id'], $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Post', $a['json']);
        $this->assertSame([0, ''], [$a['json']['cover']['size'], $a['json']['cover']['original_name']]);
        $this->assertContains($a['json']['cover']['url'], array_column((array)$a['json']['cover']['variants'], 'url'));
        $this->assertSame([false, false], [$a['json']['viewer']['can_edit'], $a['json']['viewer']['can_delete']]);
        $a = $this->http('GET', 'posts/' . $aPost['id']);
        $this->assertSame([200, null], [$a['status'], $a['json']['viewer']]);
        // in lists: no text
        $aRows = array_column($this->http('GET', 'posts?author=' . $iViewer . '&limit=50', $aOther)['json']['items'], null, 'id');
        $aRow = $aRows[$aPost['id']] ?? [];
        $this->assertSame([true, null, [], []], [array_key_exists('body_html', $aRow), $aRow['body_html'] ?? null, $aRow['media'] ?? null, $aRow['links'] ?? null]);

        // the feeds' Item names it
        if ($aPost['content_id'] !== null) {
            $a = $this->http('GET', 'content/' . $aPost['content_id'], $aOther);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Item', $a['json']);
            $this->assertSame(['post', 'bx_posts', $aPost['id']], [$a['json']['kind'], $a['json']['module'], $a['json']['entry_id'] ?? null]);
        }

        // edits by its author, through the site's form; others are refused
        $aPatch = $aAuth + ['Content-Type' => 'application/json'];
        $this->assertSame(403, $this->http('PATCH', 'posts/' . $aPost['id'], $aOther + ['Content-Type' => 'application/json'], json_encode(['title' => 'Not mine']))['status']);
        $this->assertSame([422, 'title'], $fField($this->http('PATCH', 'posts/' . $aPost['id'], $aPatch, json_encode(['title' => 'x']))));
        $this->assertSame([422, 'cover_media_id'], $fField($this->http('PATCH', 'posts/' . $aPost['id'], $aPatch, json_encode(['cover_media_id' => $sCover]))));
        $a = $this->http('PATCH', 'posts/' . $aPost['id'], $aPatch, json_encode(['title' => 'ApiV2Test a longer read', 'body_html' => '<p>Changed.</p>', 'audience' => 'friends']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['ApiV2Test a longer read', '<p>Changed.</p>', 'friends', 'The short version.'], [$a['json']['title'], $a['json']['body_html'], $a['json']['audience'], $a['json']['summary']]);
        $a = $this->http('PATCH', 'posts/' . $aPost['id'], $aPatch, json_encode(['title' => 'ApiV2Test a longer read']));
        $this->assertSame(200, $a['status'], 'the same again is no change: ' . $a['body']);

        // only its author (or an administrator) deletes it
        $this->assertSame(403, $this->http('DELETE', 'posts/' . $aPost['id'], $aOther)['status']);
        $this->assertSame(204, $this->http('DELETE', 'posts/' . $aPost['id'], $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'posts/' . $aPost['id'], $aAuth)['status']);
        $this->assertSame(404, $this->http('PATCH', 'posts/' . $aPost['id'], $aPatch, json_encode(['title' => 'Gone']))['status']);
    }

    public function testMyPostsInEveryState(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $CNF = &BxDolModule::getInstance('bx_posts')->_oConfig->CNF;

        $aPublished = $this->makePost($aAuth, 'ApiV2Test mine published');
        $aScheduled = $this->makePost($aAuth, 'ApiV2Test mine scheduled');
        $aHidden = $this->makePost($aAuth, 'ApiV2Test mine hidden');
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `" . $CNF['FIELD_STATUS'] . "` = 'awaiting', `" . $CNF['FIELD_PUBLISHED'] . "` = :t WHERE `" . $CNF['FIELD_ID'] . "` = :i", ['t' => time() + 86400, 'i' => (int)$aScheduled['id']]);
        $oDb->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `" . $CNF['FIELD_STATUS'] . "` = 'hidden' WHERE `" . $CNF['FIELD_ID'] . "` = :i", ['i' => (int)$aHidden['id']]);
        BxDolDb::getInstance()->cleanMemoryAll();

        $fIds = function ($sQuery) use ($aAuth) {
            $a = $this->http('GET', 'me/posts?limit=50' . $sQuery, $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Post', $a['json']);
            return array_column($a['json']['items'], 'state', 'id');
        };
        $aAll = $fIds('');
        $this->assertSame(['published', 'scheduled', 'hidden'], [$aAll[$aPublished['id']] ?? null, $aAll[$aScheduled['id']] ?? null, $aAll[$aHidden['id']] ?? null]);
        $this->assertArrayHasKey($aScheduled['id'], $fIds('&state=scheduled'));
        $this->assertArrayNotHasKey($aPublished['id'], $fIds('&state=scheduled'));
        $this->assertArrayHasKey($aHidden['id'], $fIds('&state=hidden'));
        $this->assertArrayHasKey($aPublished['id'], $fIds('&state=published'));
        $this->assertSame([], $fIds('&state=draft'), 'the site keeps no drafts');
        $this->assertSame(422, $this->http('GET', 'me/posts?state=soon', $aAuth)['status']);
        $this->assertSame(401, $this->http('GET', 'me/posts')['status']);

        // a scheduled post: its time to come, not published yet, and seen by its author only
        $a = $this->http('GET', 'posts/' . $aScheduled['id'], $aAuth);
        $this->assertSame(['scheduled', null], [$a['json']['state'], $a['json']['published_at']]);
        $this->assertNotNull($a['json']['publish_at']);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $this->assertSame(404, $this->http('GET', 'posts/' . $aScheduled['id'], ['Authorization' => 'Bearer ' . $this->profileToken($iOther)])['status']);
        $this->assertNotContains($aScheduled['id'], array_column($this->http('GET', 'posts?author=' . $iViewer . '&limit=50')['json']['items'], 'id'));
    }

    public function testAPostInASecretGroup(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        if (BxDolModule::getInstance('bx_posts')->serviceCheckAllowedAddInContext('bx_groups') !== CHECK_ACTION_RESULT_ALLOWED)
            $this->markTestSkipped('This site keeps no posts in groups.');
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];

        $iSecret = $this->makeGroup($iOwner, 's');
        $aPost = $this->makePost($aOwner, 'ApiV2Test secret post', ['context_id' => (string)$iSecret]);
        $this->assertSame(['context', (string)$iSecret], [$aPost['audience'], $aPost['context_id']]);
        $this->assertSame(422, $this->http('POST', 'posts', $aOwner + ['Content-Type' => 'application/json'], json_encode($this->withCategory(['title' => 'A title', 'body_html' => 'Text', 'context_id' => (string)$iSecret, 'audience' => 'public'])))['status'], 'not both');
        $this->assertSame(422, $this->http('PATCH', 'posts/' . $aPost['id'], $aOwner + ['Content-Type' => 'application/json'], json_encode(['audience' => 'public']))['status'], 'its audience is the context\'s');

        foreach ([$aAuth, []] as $aHeaders) {
            $this->assertSame(404, $this->http('GET', 'posts/' . $aPost['id'], $aHeaders)['status']);
            $this->assertNotContains($aPost['id'], array_column($this->http('GET', 'posts?author=' . $iOwner . '&limit=50', $aHeaders)['json']['items'], 'id'));
        }
        $this->assertSame(422, $this->http('GET', 'posts?context=' . $iSecret, $aAuth)['status'], 'a context the viewer may not know of');
        $this->assertContains($this->http('POST', 'posts', $aAuth + ['Content-Type' => 'application/json'], json_encode($this->withCategory(['title' => 'A title', 'body_html' => 'Text', 'context_id' => (string)$iSecret])))['status'], [403, 422], 'no posts from outside');
        $a = $this->http('GET', 'posts?context=' . $iSecret, $aOwner);
        $this->assertSchema('Page_Post', $a['json']);
        $this->assertSame([$aPost['id']], array_column($a['json']['items'], 'id'), 'its members list it');
    }

    public function testListsSearchAndContextContent(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        $sWord = 'apiv2post' . bin2hex(random_bytes(4));
        $aFirst = $this->makePost($aAuth, 'ApiV2Test ' . $sWord . ' first');
        $aSecond = $this->makePost($aAuth, 'ApiV2Test ' . $sWord . ' second');
        $aPrivate = $this->makePost($aAuth, 'ApiV2Test ' . $sWord . ' private', ['audience' => 'private']);

        // an author's posts page by page, newest first, next_cursor null at the end
        $aIds = [];
        $sPath = 'posts?author=' . $iViewer . '&limit=1';
        for ($i = 0; $i < 3 && $sPath; $i++) {
            $a = $this->http('GET', $sPath, $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Post', $a['json']);
            $this->assertArrayHasKey('next_cursor', $a['json']);
            $aIds = array_merge($aIds, array_column($a['json']['items'], 'id'));
            $sPath = $a['json']['next_cursor'] !== null ? 'posts?author=' . $iViewer . '&limit=1&cursor=' . rawurlencode($a['json']['next_cursor']) : '';
        }
        $this->assertSame([$aPrivate['id'], $aSecond['id'], $aFirst['id']], array_slice($aIds, 0, 3));
        $this->assertSame(422, $this->http('GET', 'posts?sort=oldest', $aAuth)['status']);

        $a = $this->http('GET', 'search/posts?q=' . $sWord, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Post', $a['json']);
        $this->assertEqualsCanonicalizing([$aFirst['id'], $aSecond['id'], $aPrivate['id']], array_column($a['json']['items'], 'id'));
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $a = $this->http('GET', 'search/posts?q=' . $sWord, $aOther);
        $this->assertEqualsCanonicalizing([$aFirst['id'], $aSecond['id']], array_column($a['json']['items'], 'id'), 'not the private one');
        $this->assertContains($this->http('GET', 'posts/' . $aPrivate['id'], $aOther)['status'], [403, 404], 'the private one is not shown to others');

        $oPosts = new BxPostsApiV2();
        foreach (['bx_groups', 'bx_spaces', 'bx_events'] as $sContext)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sContext))
                $this->assertSame(BxDolModule::getInstance('bx_posts')->serviceCheckAllowedAddInContext($sContext) === CHECK_ACTION_RESULT_ALLOWED ? 'posts' : null, $oPosts->apiV2ContextContent($sContext), $sContext);
    }

    public function testWhatTheSiteFiltersAndRefuses(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        $oModule = BxDolModule::getInstance('bx_posts');
        $CNF = &$oModule->_oConfig->CNF;
        $fField = function ($a) { return [$a['status'], $a['json']['errors'][0]['field'] ?? null, $a['json']['errors'][0]['code'] ?? null]; };

        // a category where the site's form requires one; the first is no default
        $aCategories = $this->withCategory([])['category_id'] ?? null;
        if ($aCategories !== null)
            $this->assertSame([422, 'category_id', 'required'], $fField($this->http('POST', 'posts', $aJson, json_encode(['title' => 'A title', 'body_html' => 'Text']))));

        // comments can't be turned off by a member, whose form does not show the switch
        $this->assertSame([422, 'comments_enabled', 'unsupported'], $fField($this->http('POST', 'posts', $aJson, json_encode($this->withCategory(['title' => 'A title', 'body_html' => 'Text', 'comments_enabled' => false])))));
        $aPost = $this->makePost($aAuth, 'ApiV2Test filtered');
        $this->assertTrue($aPost['comments_enabled']);
        $this->assertNull($aPost['poll']);
        $this->assertSame([422, 'comments_enabled', 'unsupported'], $fField($this->http('PATCH', 'posts/' . $aPost['id'], $aJson, json_encode(['comments_enabled' => false]))));
        $this->assertSame(200, $this->http('PATCH', 'posts/' . $aPost['id'], $aJson, json_encode(['comments_enabled' => true]))['status'], 'what it is already');

        // an edit's text goes through the site's HTML filter, as the form's own text does
        $sEvil = '<p>ok</p><script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">link</a>';
        $a = $this->http('PATCH', 'posts/' . $aPost['id'], $aJson, json_encode(['body_html' => $sEvil, 'title' => 'ApiV2Test <b>bold</b> title']));
        $this->assertSame(200, $a['status'], $a['body']);
        BxDolDb::getInstance()->cleanMemoryAll();
        $aRow = $oModule->_oDb->getContentInfoById((int)$aPost['id']);
        foreach ([$a['json']['body_html'], $this->http('GET', 'posts/' . $aPost['id'], $aAuth)['json']['body_html'], $aRow[$CNF['FIELD_TEXT']]] as $sHtml) {
            $this->assertStringContainsString('<p>ok</p>', $sHtml);
            $this->assertDoesNotMatchRegularExpression('/<script|onerror|javascript:/i', $sHtml);
        }
        $this->assertSame([422, 'body_html', 'required'], $fField($this->http('PATCH', 'posts/' . $aPost['id'], $aJson, json_encode(['body_html' => '<script>alert(1)</script>']))), 'nothing left of it');
        $this->assertSame([422, 'body_html', 'required'], $fField($this->http('POST', 'posts', $aJson, json_encode($this->withCategory(['title' => 'A title', 'body_html' => '<script>alert(1)</script>'])))));

        // an administrator, whose form shows the switch, turns comments off
        $iAdmin = $this->adminProfileIdOtherThan([$iViewer]);
        $aAdmin = ['Authorization' => 'Bearer ' . $this->profileToken($iAdmin), 'Content-Type' => 'application/json'];
        $a = $this->http('PATCH', 'posts/' . $aPost['id'], $aAdmin, json_encode(['comments_enabled' => false]));
        $this->assertSame([200, false], [$a['status'], $a['json']['comments_enabled'] ?? null], $a['body']);

        // a category of the list keeps its posts; one it does not list is 422
        if ($aCategories !== null) {
            $aIn = array_column($this->http('GET', 'posts?limit=50&author=' . $iViewer . '&category=' . $aPost['category']['id'], $aAuth)['json']['items'], 'id');
            $this->assertContains($aPost['id'], $aIn);
            $aAll = (array)$this->http('GET', 'posts/categories')['json'];
            if (count($aAll) > 1) {
                $sOther = $aAll[0]['id'] === $aPost['category']['id'] ? $aAll[1]['id'] : $aAll[0]['id'];
                $this->assertNotContains($aPost['id'], array_column($this->http('GET', 'posts?limit=50&author=' . $iViewer . '&category=' . $sOther, $aAuth)['json']['items'], 'id'));
            }
            $this->assertSame([422, 'category', 'not_found'], $fField($this->http('GET', 'posts?category=999999', $aAuth)));
        }

        // links: only http and https ones
        if ($oModule->_oConfig->isAttachLinks()) {
            $oDb = BxDolDb::getInstance();
            foreach (['javascript:alert(1)', 'file:///etc/passwd', 'https://example.com/a'] as $sUrl) {
                $oDb->query("INSERT INTO `" . $CNF['TABLE_LINKS'] . "` SET `profile_id` = :p, `url` = :u, `title` = 'ApiV2Test link', `text` = '', `added` = :t", ['p' => $iViewer, 'u' => $sUrl, 't' => time()]);
                $oDb->query("INSERT INTO `" . $CNF['TABLE_LINKS2CONTENT'] . "` SET `content_id` = :c, `link_id` = :l", ['c' => (int)$aPost['id'], 'l' => (int)$oDb->lastId()]);
            }
            $oDb->cleanMemoryAll();
            $a = $this->http('GET', 'posts/' . $aPost['id'], $aAuth);
            $this->assertSchema('Post', $a['json']);
            $this->assertSame(['https://example.com/a'], array_column($a['json']['links'], 'url'));
            $oModule->_oDb->deleteLinks((int)$aPost['id']);
        }

        // an attached photo: its copies for others, the original for its author
        $oPhotos = !empty($CNF['OBJECT_STORAGE_PHOTOS']) ? BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE_PHOTOS']) : null;
        if ($oPhotos) {
            $sFile = tempnam(sys_get_temp_dir(), 'apiv2') . '.png';
            file_put_contents($sFile, self::png(12, 9));
            $iFile = (int)$oPhotos->storeFileFromPath($sFile, false, $iViewer, (int)$aPost['id']);
            @unlink($sFile);
            $this->assertGreaterThan(0, $iFile, 'the photo was stored');
            BxDolDb::getInstance()->cleanMemoryAll();
            $aMine = $this->http('GET', 'posts/' . $aPost['id'], $aAuth)['json']['media'];
            $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
            $aTheirs = $this->http('GET', 'posts/' . $aPost['id'], ['Authorization' => 'Bearer ' . $this->profileToken($iOther)])['json']['media'];
            $this->assertCount(1, $aMine);
            $this->assertCount(1, $aTheirs);
            $this->assertGreaterThan(0, $aMine[0]['size'], 'its owner gets the original');
            $this->assertSame([0, ''], [$aTheirs[0]['size'], $aTheirs[0]['original_name']]);
            $this->assertNotSame($aMine[0]['url'], $aTheirs[0]['url'], 'not the original');
            $this->assertContains($aTheirs[0]['url'], array_column((array)$aTheirs[0]['variants'], 'url'));
        }
    }

    private function makeGroup(int $iOwner, string $sView): int
    {
        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, [
                'group_name' => 'ApiV2PostsTest group ' . bin2hex(random_bytes(3)),
                'group_desc' => '<p>Made by ApiV2PostsTest</p>',
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
}
