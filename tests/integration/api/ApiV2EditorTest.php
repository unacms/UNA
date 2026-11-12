<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for rich text editors, over real HTTP: hashtags to suggest (GET /hashtags), a link's
 * preview card (GET /links/preview), pictures in a text (POST /uploads/inline), comments and
 * discussions written as HTML (`body_html`), links attached to a new feed post, and editing a
 * reply in a conversation (PATCH /conversations/{id}/messages/{message_id}). Each test removes
 * what it made.
 */
#[Group('integration')]
class ApiV2EditorTest extends ApiV2TestCase
{
    protected $_aKeywords = [];
    /** Keywords put straight into a module's keywords table: table => [keyword]. */
    protected $_aKeywordTables = [];
    protected $_aEmbeds = [];
    protected $_aEditorFiles = [];
    protected $_aEvents = [];
    protected $_aDiscussions = [];
    protected $_aConversations = [];

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aKeywords as $sKeyword)
            $oDb->query("DELETE FROM `sys_cmts_meta_keywords` WHERE `keyword` = :k", ['k' => $sKeyword]);
        // a hashtag used for the first time makes a channel of that name: as the site deletes one
        if ($this->_aKeywords && BxDolModuleQuery::getInstance()->isEnabledByName('bx_channels')) {
            $oDb->cleanMemoryAll();
            foreach ($this->_aKeywords as $sKeyword)
                if (($iChannel = (int)BxDolModule::getInstance('bx_channels')->_oDb->getChannelIdByName($sKeyword)) && ($oChannel = BxDolProfile::getInstanceByContentAndType($iChannel, 'bx_channels'))) {
                    $oChannel->delete(false, true, true);
                    self::seedForget([(int)$oChannel->id()]);
                }
        }
        foreach ($this->_aKeywordTables as $sTable => $aKeywords)
            foreach ($aKeywords as $sKeyword)
                $oDb->query("DELETE FROM `" . $sTable . "` WHERE `keyword` = :k", ['k' => $sKeyword]);
        foreach ($this->_aEmbeds as $sUrl)
            $oDb->query("DELETE FROM `sys_embeded_data` WHERE `url` = :u", ['u' => $sUrl]);
        if ($this->_aEditorFiles && ($oStorage = BxDolStorage::getObjectInstance(BxBaseApiV2Editor::INLINE_STORAGE)))
            foreach ($this->_aEditorFiles as $iFileId)
                $oStorage->deleteFile($iFileId);

        $oDb->cleanMemoryAll();
        if ($this->_aEvents && BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $oTimeline = BxDolModule::getInstance('bx_timeline');
            foreach ($this->_aEvents as $iId)
                if (($aEvent = $oTimeline->_oDb->getEvents(['browse' => 'id', 'value' => $iId])))
                    $oTimeline->deleteEvent($aEvent);
        }
        if ($this->_aDiscussions && BxDolModuleQuery::getInstance()->isEnabledByName('bx_forum')) {
            $oForum = BxDolModule::getInstance('bx_forum');
            foreach ($this->_aDiscussions as $iId)
                if ($oForum->_oDb->getContentInfoById($iId))
                    $oForum->serviceDeleteEntity($iId);
        }
        if ($this->_aConversations && BxDolModuleQuery::getInstance()->isEnabledByName('bx_convos')) {
            $oConvos = BxDolModule::getInstance('bx_convos');
            foreach ($this->_aConversations as $iId)
                $oConvos->_oDb->deleteConvo($iId);
        }
        parent::tearDown();
    }

    protected function json(string $sToken): array
    {
        return ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
    }

    public function testHashtagsStartingWithTheWordsMostUsedFirst(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = $this->json($sToken);
        $sWord = 'apiv2tag' . bin2hex(random_bytes(3));
        $oDb = BxDolDb::getInstance();
        $aObject = BxDolMetatagsQuery::getMetatagsObject('bx_timeline');
        $this->assertNotEmpty($aObject['table_keywords'] ?? '');
        $sTable = $aObject['table_keywords'];

        // posts of the feed: two for everyone, one for its author alone
        $fPost = function (string $sAudience) use ($aAuth) {
            $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2EditorTest hashtags</p>', 'audience' => $sAudience]));
            $this->assertSame(201, $a['status'], $a['body']);
            $this->_aEvents[] = (int)$a['json']['id'];
            return (int)$a['json']['id'];
        };
        $iFirst = $fPost('public');
        $iSecond = $fPost('public');
        $iPrivate = $fPost('private');

        // their keywords: one used twice, and those of the private post
        foreach ([[$sWord . 'b', $iFirst], [$sWord . 'b', $iSecond], [$sWord . 'a', $iFirst], [$sWord . '_x', $iSecond], [$sWord . 'b', $iPrivate], [$sWord . 'secret', $iPrivate]] as list($sKeyword, $iObject)) {
            $oDb->query("INSERT INTO `" . $sTable . "` (`object_id`, `keyword`) VALUES (:o, :k)", ['o' => $iObject, 'k' => $sKeyword]);
            $this->_aKeywordTables[$sTable][] = $sKeyword;
        }
        // and one of a comment: whose content can't be told public from private, so it is not suggested
        $oDb->query("INSERT INTO `sys_cmts_meta_keywords` (`object_id`, `keyword`) VALUES (:o, :k)", ['o' => 990000001, 'k' => $sWord . 'cmt']);
        $this->_aKeywords[] = $sWord . 'cmt';

        // guests get them too, as the site's own suggestions
        $a = $this->http('GET', 'hashtags?q=' . rawurlencode('#' . $sWord));
        $this->assertSame(200, $a['status'], $a['body']);
        foreach ($a['json'] as $aTag)
            $this->assertSchema('Hashtag', $aTag);
        // only what public, active content has, as the site's own suggestions: nothing of the
        // private post (not its keyword, not its use of a shared one), nothing of the comment
        $this->assertSame([$sWord . 'b', $sWord . 'a', $sWord . '_x'], array_column($a['json'], 'tag'));
        $this->assertSame(2, $a['json'][0]['count']);
        // its author gets the same answer: it does not depend on the viewer
        $this->assertSame(array_column($a['json'], 'tag'), array_column($this->http('GET', 'hashtags?q=' . $sWord, $aAuth)['json'], 'tag'));
        $this->assertStringStartsWith('http', (string)$a['json'][0]['url'], 'the hashtag\'s page on the site, absolute');
        $this->assertStringContainsString(rawurlencode($sWord . 'b'), (string)$a['json'][0]['url']);

        $this->assertCount(1, $this->http('GET', 'hashtags?limit=1&q=' . $sWord)['json']);
        // LIKE wildcards are text: `_` matches only an underscore
        $this->assertSame([$sWord . '_x'], array_column($this->http('GET', 'hashtags?q=' . $sWord . '_')['json'], 'tag'));
        $this->assertSame([], $this->http('GET', 'hashtags?q=' . rawurlencode('%' . $sWord))['json']);

        // one hashtag's start only
        $a = $this->http('GET', 'hashtags?q=' . rawurlencode('two words'));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSchema('Problem', $a['json']);
        $this->assertSame(422, $this->http('GET', 'hashtags')['status']);
    }

    public function testALinksPreviewOnlyForPublicAddresses(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];

        $this->assertSame(401, $this->http('GET', 'links/preview?url=' . rawurlencode('https://example.com/'))['status'], 'members only');

        // the site's own check: loopback, private and link-local addresses, other schemes
        foreach (['http://127.0.0.1/', 'http://localhost:8080/admin', 'http://10.1.2.3/', 'http://169.254.169.254/latest/meta-data/', 'http://[::1]/'] as $sUrl) {
            $a = $this->http('GET', 'links/preview?url=' . rawurlencode($sUrl), $aAuth);
            $this->assertSame(422, $a['status'], $sUrl . ': ' . $a['body']);
            $this->assertSame('not_allowed', $a['json']['errors'][0]['code'], $sUrl);
        }
        foreach (['ftp://example.com/x', 'javascript:alert(1)', '/relative'] as $sUrl)
            $this->assertSame('invalid', $this->http('GET', 'links/preview?url=' . rawurlencode($sUrl), $aAuth)['json']['errors'][0]['code'], $sUrl);

        // what the site's embed provider read before (its kept data): no fetch here
        $oEmbed = BxDolEmbed::getObjectInstance();
        if (!$oEmbed || getParam('sys_embed_default') !== 'sys_system')
            $this->markTestSkipped('The site\'s embed provider is not the built-in one.');
        $sUrl = 'https://example.com/apiv2test-' . bin2hex(random_bytes(4));
        BxDolDb::getInstance()->query("INSERT INTO `sys_embeded_data` (`url`, `theme`, `data`, `added`) VALUES (:u, '', :d, :t)", [
            'u' => $sUrl, 't' => time(),
            'd' => json_encode(['title' => 'An <b>example</b> page', 'description' => "Its\n description", 'image' => 'https://example.com/a.png', 'url' => $sUrl, 'domain' => 'example.com']),
        ]);
        $this->_aEmbeds[] = $sUrl;

        $a = $this->http('GET', 'links/preview?url=' . rawurlencode($sUrl), $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('LinkCard', $a['json']);
        $this->assertSame([$sUrl, 'example.com', 'ready', 'An example page', 'Its description', 'example.com', 'https://example.com/a.png'], [$a['json']['url'], $a['json']['host'], $a['json']['state'], $a['json']['title'], $a['json']['description'], $a['json']['site_name'], $a['json']['image']]);
    }

    public function testPicturesForATextGoToTheEditorStorage(): void
    {
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];

        $this->assertSame(401, $this->inline([], 'a.png', self::png(4, 4))['status']);

        $a = $this->inline($aAuth, 'map.png', self::png(40, 30));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('InlineImage', $a['json']);
        $this->assertSame([40, 30, 'image/png'], [$a['json']['width'], $a['json']['height'], $a['json']['mime_type']]);
        $this->assertStringStartsWith(BX_DOL_URL_ROOT, $a['json']['url']);
        $this->assertStringContainsString('sys_images_editor', $a['json']['url']);

        // stored as upload_inline stores it: public, the viewer's, no ghost to expire
        $aFile = BxDolDb::getInstance()->getRow("SELECT * FROM `sys_images_editor` WHERE `profile_id` = :p ORDER BY `id` DESC LIMIT 1", ['p' => $iProfileId]);
        $this->assertNotEmpty($aFile);
        $this->_aEditorFiles[] = (int)$aFile['id'];
        $this->assertSame('0', (string)$aFile['private']);
        $this->assertFalse((bool)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_storage_ghosts` WHERE `id` = :i AND `object` = 'sys_images_editor'", ['i' => (int)$aFile['id']]));

        // what is no picture: by its name, and by its content
        $a = $this->inline($aAuth, 'notes.txt', 'plain words');
        $this->assertSame(415, $a['status'], $a['body']);
        $this->assertSchema('Problem', $a['json']);
        $this->assertSame(415, $this->inline($aAuth, 'fake.png', 'not a png at all')['status']);
        $this->assertSame(422, $this->inline($aAuth, 'a.png', self::png(2, 2), ['purpose' => 'post'])['status'], 'it takes a file only');
    }

    protected function inline(array $aHeaders, string $sName, string $sData, array $aFields = []): array
    {
        $sBoundary = 'ApiV2Test' . bin2hex(random_bytes(8));
        $sBody = '';
        foreach ($aFields as $sKey => $sValue)
            $sBody .= '--' . $sBoundary . "\r\nContent-Disposition: form-data; name=\"" . $sKey . "\"\r\n\r\n" . $sValue . "\r\n";
        $sBody .= '--' . $sBoundary . "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" . $sName . "\"\r\nContent-Type: application/octet-stream\r\n\r\n" . $sData . "\r\n--" . $sBoundary . "--\r\n";
        return $this->http('POST', 'uploads/inline', $aHeaders + ['Content-Type' => 'multipart/form-data; boundary=' . $sBoundary], $sBody);
    }

    public function testCommentsWrittenAsHtmlAreFilteredAndIndexed(): void
    {
        $this->requireModule('bx_timeline');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = $this->json($sToken);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $this->forgetNotificationsFromNowOn();

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2EditorTest comments</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $sItem = $a['json']['object']['id'];

        $sTag = 'apiv2cmt' . bin2hex(random_bytes(3));
        $this->_aKeywords[] = $sTag;
        $sMention = '<a href="' . BX_DOL_URL_ROOT . '" title="Someone" dchar="@" data-profile-id="' . $iOther . '" class="bx-mention-link">@Someone</a>';
        $sHtml = '<p>Hi ' . $sMention . ' about #' . $sTag . ' <a href="https://example.com/" onclick="x()">this</a><script>alert(1)</script></p>';
        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body_html' => $sHtml]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Comment', $a['json']);
        $sId = $a['json']['id'];
        $this->assertStringContainsString('data-profile-id="' . $iOther . '"', $a['json']['body_html'], 'the mention stays');
        $this->assertStringContainsString('<a href="https://example.com/"', $a['json']['body_html']);
        $this->assertStringNotContainsString('<script', $a['json']['body_html'], 'the site\'s filter, as its comment form');
        $this->assertStringNotContainsString('onclick', $a['json']['body_html']);
        $this->assertTrue($a['json']['viewer']['can_edit'], 'body_html edits a comment with markup');

        // its mention and hashtag are indexed, as a comment written on the site
        $aInfo = BxDolCmtsQuery::getInfoByUniqId((int)$sId);
        $this->assertNotEmpty($aInfo);
        $oDb = BxDolDb::getInstance();
        $this->assertSame(1, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_cmts_meta_keywords` WHERE `object_id` = :o AND `keyword` = :k", ['o' => (int)$sId, 'k' => $sTag]), 'the hashtag');
        $this->assertSame(1, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_cmts_meta_mentions` WHERE `object_id` = :o AND `profile_id` = :p", ['o' => (int)$sId, 'p' => $iOther]), 'the mention');

        // one of body and body_html
        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body' => 'x', 'body_html' => '<p>x</p>']));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame(422, $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['parent_id' => null]))['status'], 'neither');
        $this->assertSame(422, $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body_html' => '<p> </p>']))['status'], 'no text');

        // an edit as HTML keeps markup a plain-text edit would lose; a plain one is refused
        $this->assertSame('formatted_text', $this->http('PATCH', 'comments/' . $sId, $aAuth, json_encode(['body' => 'plain']))['json']['code']);
        $a = $this->http('PATCH', 'comments/' . $sId, $aAuth, json_encode(['body_html' => '<p>Edited <strong>with</strong> ' . $sMention . '</p>']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertStringContainsString('data-profile-id="' . $iOther . '"', $a['json']['body_html']);
        $this->assertStringContainsString('Edited', $a['json']['body']);

        // an edit is filtered as a new comment is
        $a = $this->http('PATCH', 'comments/' . $sId, $aAuth, json_encode(['body_html' => '<p>Edited <em>again</em> <img src="x" onerror="x()"> <a href="javascript:alert(1)">go</a></p><script>x()</script>']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertStringContainsString('<em>again</em>', $a['json']['body_html']);
        $this->assertStringNotContainsString('<script', $a['json']['body_html']);
        $this->assertStringNotContainsString('javascript:', $a['json']['body_html']);
        $this->assertStringNotContainsString('onerror', $a['json']['body_html']);

        // someone else's comment: the site's edit check
        $a = $this->http('PATCH', 'comments/' . $sId, $this->json($this->profileToken($iOther)), json_encode(['body_html' => '<p>Not mine</p>']));
        $this->assertSame(403, $a['status'], $a['body']);
    }

    public function testDiscussionsWrittenAsHtml(): void
    {
        $this->requireModule('bx_forum');
        list(, $sToken) = $this->userToken();
        $aAuth = $this->json($sToken);

        $a = $this->http('GET', 'discussions/categories', $aAuth);
        if (empty($a['json']['can_create']) || empty($a['json']['categories']))
            $this->markTestSkipped('The test user may not start discussions here.');
        $sCategory = $a['json']['categories'][0]['id'];

        $sHtml = '<h2>Plan</h2><p><strong>Bold</strong> and a <a href="https://una.io/">link</a></p><ul><li>one</li></ul><p><img src="javascript:alert(1)" onerror="x()"></p><script>x()</script>';
        $a = $this->http('POST', 'discussions', $aAuth, json_encode(['title' => 'ApiV2EditorTest html', 'body_html' => $sHtml, 'category_id' => $sCategory]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Discussion', $a['json']);
        $this->_aDiscussions[] = (int)$a['json']['id'];
        $sId = $a['json']['id'];
        $this->assertStringContainsString('<strong>Bold</strong>', $a['json']['body_html']);
        $this->assertStringContainsString('<a href="https://una.io/"', $a['json']['body_html']);
        $this->assertStringContainsString('<li>one</li>', $a['json']['body_html']);
        $this->assertStringNotContainsString('<script', $a['json']['body_html']);
        $this->assertStringNotContainsString('javascript:', $a['json']['body_html']);
        $this->assertStringNotContainsString('onerror', $a['json']['body_html']);
        $this->assertFalse($a['json']['viewer']['can_edit_text'], 'a plain-text body would lose its markup');

        $a = $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode(['body_html' => '<p>Now <em>this</em></p>']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertStringContainsString('<em>this</em>', $a['json']['body_html']);
        $this->assertSame(409, $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode(['body' => 'Plain']))['status'], 'a plain-text edit of markup');

        // an edit is filtered as a new one is: the site shows this text as it is stored
        $a = $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode(['body_html' => '<p>Edited <em>again</em> <img src="x" onerror="x()"> <a href="javascript:alert(1)">go</a></p><script>x()</script>']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertStringContainsString('<em>again</em>', $a['json']['body_html']);
        $this->assertStringNotContainsString('<script', $a['json']['body_html']);
        $this->assertStringNotContainsString('javascript:', $a['json']['body_html']);
        $this->assertStringNotContainsString('onerror', $a['json']['body_html']);
        $sStored = (string)BxDolDb::getInstance()->getOne("SELECT `text` FROM `bx_forum_discussions` WHERE `id` = :id", ['id' => (int)$sId]);
        $this->assertStringNotContainsString('<script', $sStored, 'what the site itself renders');
        $this->assertStringNotContainsString('onerror', $sStored);
        $this->assertStringNotContainsString('javascript:', $sStored);

        $this->assertSame(422, $this->http('POST', 'discussions', $aAuth, json_encode(['title' => 'ApiV2EditorTest both', 'body' => 'a', 'body_html' => '<p>a</p>', 'category_id' => $sCategory]))['status'], 'one of them');
        $this->assertSame(422, $this->http('POST', 'discussions', $aAuth, json_encode(['title' => 'ApiV2EditorTest none', 'category_id' => $sCategory]))['status'], 'some text');
        $this->assertSame(422, $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode(['body_html' => '<p><br></p>']))['status'], 'no text');
    }

    public function testFeedPostsTakeLinksToPublicAddressesOnly(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = $this->json($sToken);

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2EditorTest link</p>', 'links' => ['http://127.0.0.1/secret']]));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame(['links[0]', 'not_allowed'], [$a['json']['errors'][0]['field'], $a['json']['errors'][0]['code']]);
        $this->assertSame(422, $this->http('POST', 'feed-posts', $aAuth, json_encode(['links' => ['ftp://example.com/']]))['status']);
        $this->assertSame(422, $this->http('POST', 'feed-posts', $aAuth, json_encode(['links' => array_fill(0, 6, 'https://example.com/')]))['status'], 'at most five');

        // a link alone is a post, as on the site; the site reads the page for its preview
        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['links' => ['https://example.com/'], 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $this->assertSame(['https://example.com'], array_column($a['json']['object']['links'], 'url'));
    }

    public function testOnlyTheAuthorEditsAReplyWhereTheSiteLetsThem(): void
    {
        $this->requireModule('bx_convos');
        list($iViewer, $sToken) = $this->userToken();
        $iAdmin = $this->adminProfileIdOtherThan([$iViewer]);
        $aAdmin = $this->json($this->profileToken($iAdmin));
        $aUser = $this->json($sToken);

        $a = $this->http('POST', 'conversations', $aAdmin, json_encode(['recipients' => [(string)$iViewer], 'body' => '<p>ApiV2EditorTest conversation</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $iConvo = (int)$a['json']['id'];
        $this->_aConversations[] = $iConvo;

        $a = $this->http('POST', 'conversations/' . $iConvo . '/messages', $aAdmin, json_encode(['body' => '<p>By the admin</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Message', $a['json']);
        $sAdminMessage = $a['json']['id'];
        $this->assertTrue($a['json']['can_edit']);
        $a = $this->http('POST', 'conversations/' . $iConvo . '/messages', $aUser, json_encode(['body' => '<p>By the user</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sUserMessage = $a['json']['id'];
        // the site lets administrators alone edit messages (BxCnvCmts::isEditAllowed)
        $this->assertFalse($a['json']['can_edit']);

        $a = $this->http('PATCH', 'conversations/' . $iConvo . '/messages/' . $sUserMessage, $aUser, json_encode(['body' => '<p>Changed</p>']));
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSchema('Problem', $a['json']);
        $this->assertSame(403, $this->http('PATCH', 'conversations/' . $iConvo . '/messages/' . $sAdminMessage, $aUser, json_encode(['body' => '<p>Not mine</p>']))['status'], 'someone else\'s');
        $this->assertSame(403, $this->http('PATCH', 'conversations/' . $iConvo . '/messages/' . $sUserMessage, $aAdmin, json_encode(['body' => '<p>Not mine either</p>']))['status'], 'only its author, an administrator too');
        $this->assertSame(404, $this->http('PATCH', 'conversations/' . $iConvo . '/messages/999999999', $aAdmin, json_encode(['body' => '<p>x</p>']))['status']);

        $a = $this->http('PATCH', 'conversations/' . $iConvo . '/messages/' . $sAdminMessage, $aAdmin, json_encode(['body' => '<p>Edited <a href="https://example.com/" onclick="x()">here</a><script>x()</script></p>']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Message', $a['json']);
        $this->assertSame($sAdminMessage, $a['json']['id']);
        $this->assertStringContainsString('<a href="https://example.com/"', $a['json']['body_html']);
        // the site's filter (clear_xss) passes administrators' HTML as it is, as it does on the
        // site: clients sanitize every body_html before they show it
        $this->assertStringStartsWith('<p>Edited', $a['json']['body_html']);
        $this->assertSame(422, $this->http('PATCH', 'conversations/' . $iConvo . '/messages/' . $sAdminMessage, $aAdmin, json_encode(['body' => '<p> </p>']))['status'], 'no text');

        // a conversation one is not in: as if there were none
        $iOutsider = $this->ordinaryProfileIdOtherThan([$iViewer, $iAdmin]);
        $this->assertSame(404, $this->http('PATCH', 'conversations/' . $iConvo . '/messages/' . $sUserMessage, $this->json($this->profileToken($iOutsider)), json_encode(['body' => '<p>x</p>']))['status']);
    }
}
