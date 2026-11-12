<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 over real HTTP (PHP's built-in server in front of api_v2.php): the OpenAPI document is
 * consistent, and responses match the schemas it publishes.
 *
 * Member cases need the test user (UNA_TEST_USER_EMAIL) with a profile and the OAuth2 server
 * module; they skip otherwise. Tokens are written straight to the OAuth tables and removed after.
 */
#[Group('integration')]
class ApiV2Test extends ApiV2TestCase
{
    protected $_aEvents = [];
    protected $_aClients = [];
    protected $_aCodes = [];
    protected $_aNotifications = [];
    protected $_aConnections = [];
    protected $_aGroups = [];
    protected $_aConversations = [];
    protected $_aDiscussions = [];
    protected $_aBadges = [];
    protected $_aIdempotencyScopes = [];

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aCodes as $sCode)
            $oDb->query("DELETE FROM `bx_oauth_authorization_codes` WHERE `authorization_code` = :c", ['c' => $sCode]);
        foreach ($this->_aClients as $sClientId)
            $oDb->query("DELETE FROM `bx_oauth_clients` WHERE `client_id` = :c", ['c' => $sClientId]);
        foreach ($this->_aNotifications as $iId)
            $oDb->query("DELETE FROM `bx_notifications_events` WHERE `id` = :i", ['i' => $iId]);
        foreach ($this->_aIdempotencyScopes as $sScope)
            $oDb->query("DELETE FROM `sys_api_idempotency` WHERE `scope` = UNHEX(:s)", ['s' => $sScope]);

        // follows and friend requests a test left, both ways, through the objects (counters, alerts);
        // the server process made them, so this process's memory of the rows is stale
        if ($this->_aConnections)
            $oDb->cleanMemoryAll();
        foreach ($this->_aConnections as list($iA, $iB))
            foreach (['sys_profiles_friends', 'sys_profiles_subscriptions'] as $sObject)
                if (($oConnection = BxDolConnection::getObjectInstance($sObject)))
                    foreach ([[$iA, $iB], [$iB, $iA]] as list($i, $c))
                        if ($oConnection->isConnected($i, $c))
                            $oConnection->removeConnection($i, $c);

        if ($this->_aEvents && BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $oTimeline = BxDolModule::getInstance('bx_timeline');
            foreach ($this->_aEvents as $iId)
                if (($aEvent = $oTimeline->_oDb->getEvents(['browse' => 'id', 'value' => $iId])))
                    $oTimeline->deleteEvent($aEvent);
        }

        // discussions a test started, with their replies, as the module deletes one; before the
        // groups they may be in (deleting one in a group that is gone fails on the group's name)
        if ($this->_aDiscussions && BxDolModuleQuery::getInstance()->isEnabledByName('bx_forum')) {
            $oDb->cleanMemoryAll();
            $oForum = BxDolModule::getInstance('bx_forum');
            foreach ($this->_aDiscussions as $iId)
                if ($oForum->_oDb->getContentInfoById($iId))
                    $oForum->serviceDeleteEntity($iId);
        }

        // groups a test made, with their content and memberships, as the site deletes a group
        if ($this->_aGroups)
            $oDb->cleanMemoryAll();
        foreach ($this->_aGroups as $iGroup)
            if (($oGroup = BxDolProfile::getInstance($iGroup)))
                $oGroup->delete(false, true, true);

        // conversations a test started, for everyone, with their messages and files
        if ($this->_aConversations && BxDolModuleQuery::getInstance()->isEnabledByName('bx_convos')) {
            $oDb->cleanMemoryAll();
            $oConvos = BxDolModule::getInstance('bx_convos');
            foreach ($this->_aConversations as $iId)
                $oConvos->_oDb->deleteConvo($iId);
        }

        // badges a test made, with whoever it gave them to
        foreach ($this->_aBadges as $iBadge) {
            BxDolBadges::getInstance()->delete(['type' => 'id', 'id' => $iBadge]);
            $oDb->query("DELETE FROM `sys_badges` WHERE `id` = :i", ['i' => $iBadge]);
        }
        if ($this->_aBadges)
            BxDolApiV2Map::reset();

        // last (in ApiV2TestCase): the notifications, the tokens and the API switch
        parent::tearDown();
    }

    public function testSpecIsConsistent(): void
    {
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router()))->build();

        $this->assertSame('3.1.0', $aSpec['openapi']);
        $this->assertNotEmpty($aSpec['paths']);

        $aIds = [];
        foreach ($aSpec['paths'] as $sPath => $aOps) {
            preg_match_all('/\{([a-z_]+)\}/', $sPath, $m);
            foreach ($aOps as $sMethod => $aOp) {
                $this->assertMatchesRegularExpression('/^[a-z][A-Za-z0-9]+$/', $aOp['operationId'], "$sMethod $sPath");
                $aIds[] = $aOp['operationId'];

                $aPathParams = array_column(array_filter($aOp['parameters'] ?? [], function ($a) { return ($a['in'] ?? '') === 'path'; }), 'name');
                $this->assertSame($m[1], $aPathParams, "path params of $sMethod $sPath");
                $this->assertArrayHasKey('default', $aOp['responses'], "$sMethod $sPath has an error response");
            }
        }
        $this->assertSame(count($aIds), count(array_unique($aIds)), 'operationIds are unique');

        // every $ref points at something that exists
        $aRefs = [];
        array_walk_recursive($aSpec, function ($v, $k) use (&$aRefs) {
            if ($k === '$ref')
                $aRefs[] = $v;
        });
        foreach (array_unique($aRefs) as $sRef) {
            $a = explode('/', substr($sRef, 2));
            $this->assertArrayHasKey($a[2], $aSpec[$a[0]][$a[1]], 'unresolved ' . $sRef);
        }

        // the agreed shapes
        $aPaths = $aSpec['paths'];
        $this->assertSame(['204', '401', '403', '404', '422', '429', 'default'], array_map('strval', array_keys($aPaths['/me/active-profile']['put']['responses'])));
        $this->assertArrayNotHasKey('content', $aPaths['/me/active-profile']['put']['responses'][204]);
        $this->assertSame(['type' => 'array', 'items' => ['type' => 'string']], $aPaths['/reactions']['get']['responses'][200]['content']['application/json']['schema']);
        $this->assertSame('ReactionKinds', basename($aPaths['/reactions/details']['get']['responses'][200]['content']['application/json']['schema']['$ref']));
        if (isset($aPaths['/me/groups'])) {
            $this->assertSame(['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Group']], $aPaths['/me/groups']['get']['responses'][200]['content']['application/json']['schema']);
            $this->assertNotContains('cursor', array_column($aPaths['/me/groups']['get']['parameters'] ?? [], 'name'));
            $this->assertFalse($aPaths['/groups/{id}/membership']['post']['requestBody']['required'], 'JoinRequest may be left out');
            $this->assertSame('#/components/schemas/JoinRequest', $aPaths['/groups/{id}/membership']['post']['requestBody']['content']['application/json']['schema']['$ref']);
        }
        $aSchemas = $aSpec['components']['schemas'];
        $this->assertArrayNotHasKey('ProfileSummary', $aSchemas, 'embedded profiles are Profiles');
        $this->assertSame(['id', 'kind', 'display_name', 'about', 'status', 'created_at'], $aSchemas['Profile']['required'], 'the Profile');
        $this->assertContains('version', $aSchemas['Activity']['required']);
        $this->assertSame(['id', 'kind', 'mime', 'size', 'state', 'original_name', 'url', 'download_url', 'variants'], $aSchemas['Media']['required'], 'the Media');
    }

    public function testDiscoveryAndErrorsOverHttp(): void
    {
        $a = $this->http('GET', '');
        $this->assertSame(200, $a['status']);
        $this->assertSchema('ApiInfo', $a['json']);
        $this->assertSame('*', BxDolTestPhpServer::header($a, 'access-control-allow-origin'));

        $a = $this->http('GET', 'openapi.json');
        $this->assertSame(200, $a['status']);
        $this->assertSame('3.1.0', $a['json']['openapi']);

        $a = $this->http('GET', 'no/such/thing');
        $this->assertSame(404, $a['status']);
        $this->assertStringStartsWith('application/problem+json', BxDolTestPhpServer::header($a, 'content-type'));
        $this->assertSchema('Problem', $a['json']);
        $this->assertSame('no_such_endpoint', $a['json']['code']);
        $this->assertSame('urn:una:problem:no_such_endpoint', $a['json']['type'], 'the problem types');
        $this->assertNull(BxDolTestPhpServer::header($a, 'etag'), 'errors carry no ETag');
        $this->assertSame('no-store', BxDolTestPhpServer::header($a, 'cache-control'));

        $a = $this->http('DELETE', 'me');
        $this->assertSame(405, $a['status']);
        $this->assertSame('GET', BxDolTestPhpServer::header($a, 'allow'));

        $a = $this->http('GET', 'me');
        $this->assertSame(401, $a['status']);
        $this->assertNotNull(BxDolTestPhpServer::header($a, 'www-authenticate'));

        $a = $this->http('GET', 'me', ['Authorization' => 'Bearer ' . str_repeat('f', 40)]);
        $this->assertSame(401, $a['status']);
        $this->assertSame('invalid_token', $a['json']['code']);

        $a = $this->http('OPTIONS', 'feeds/public', ['Origin' => 'https://elsewhere.example', 'Access-Control-Request-Method' => 'GET']);
        $this->assertSame(204, $a['status']);
        $this->assertNull(BxDolTestPhpServer::header($a, 'access-control-allow-credentials'), 'no cookies across origins');
        $this->assertStringContainsString('Idempotency-Key', BxDolTestPhpServer::header($a, 'access-control-allow-headers'));
        $this->assertStringContainsString('Idempotent-Replayed', BxDolTestPhpServer::header($a, 'access-control-expose-headers'));
    }

    public function testBrandingIsTheSitesOwn(): void
    {
        $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');
        // the options this test changes: Designer's marks and logos, every template's own (which
        // win over them), the icon and the theme colour
        $aOptions = BxDolDb::getInstance()->getColumn("SELECT `name` FROM `sys_options` WHERE `name` REGEXP '_site_(mark|logo)(_dark)?(_inline)?$'");
        $aOptions[] = 'sys_site_icon_apple';
        $aOptions[] = 'sys_pwa_manifest_theme_color';
        $aWas = [];
        foreach ($aOptions as $sOption)
            $aWas[$sOption] = getParam($sOption);
        $iFileId = 0;

        try {
            foreach ($aOptions as $sOption)
                if ($sOption !== 'sys_pwa_manifest_theme_color')
                    setParam($sOption, str_ends_with($sOption, '_inline') ? '' : '0');

            // nothing uploaded: still a name, and the template's icon
            $a = $this->http('GET', '');
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('ApiInfo', $a['json']);
            $aBranding = $a['json']['branding'];
            $this->assertNotSame('', $aBranding['name']);
            $this->assertNotSame('', $aBranding['short_name']);
            $this->assertMatchesRegularExpression('#^https?://.+/apple-touch-icon\.png$#', (string)$aBranding['icon']);
            // the template's built-in images are UNA's generic ones, not the community's
            foreach (['mark', 'mark_dark', 'logo', 'logo_dark'] as $sKey)
                $this->assertNull($aBranding[$sKey], $sKey . ' is not the built-in image');

            // the same for a guest and a member
            if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth') && getenv('UNA_TEST_USER_EMAIL')) {
                list(, $sToken) = $this->userToken();
                $aMember = $this->http('GET', '', ['Authorization' => 'Bearer ' . $sToken]);
                $this->assertSame($aBranding, $aMember['json']['branding']);
            }

            // SVG code as the mark: a data: URI, with no dark variant beside it
            $sSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#0f766e"/></svg>';
            setParam('sys_site_mark_inline', $sSvg);
            $aBranding = $this->http('GET', '')['json']['branding'];
            $this->assertSame('data:image/svg+xml;base64,' . base64_encode($sSvg), $aBranding['mark']);
            $this->assertNull($aBranding['mark_dark']);

            // code too big to send with every discovery, or not SVG at all, is left out
            setParam('sys_site_mark_inline', '<svg xmlns="http://www.w3.org/2000/svg">' . str_repeat(' ', BxBaseApiV2System::BRANDING_SVG_MAX) . '</svg>');
            $this->assertNull($this->http('GET', '')['json']['branding']['mark']);
            setParam('sys_site_mark_inline', 'not an image');
            $this->assertNull($this->http('GET', '')['json']['branding']['mark']);
            setParam('sys_site_mark_inline', '');

            // an uploaded mark: the storage's absolute URL, as the site's header shows it
            $sPath = tempnam(sys_get_temp_dir(), 'mark') . '.png';
            file_put_contents($sPath, self::png(8, 8));
            $iFileId = (int)$oStorage->storeFileFromPath($sPath, false, 0, 0);
            @unlink($sPath);
            $this->assertGreaterThan(0, $iFileId, 'the mark was stored');
            setParam('sys_site_mark', (string)$iFileId);
            $aBranding = $this->http('GET', '')['json']['branding'];
            $this->assertSame(bx_absolute_url($oStorage->getFileUrlById($iFileId)), $aBranding['mark']);
            $this->assertMatchesRegularExpression('#^https?://#', $aBranding['mark']);
            $this->assertSame(200, $this->raw('GET', parse_url($aBranding['mark'], PHP_URL_PATH) . (parse_url($aBranding['mark'], PHP_URL_QUERY) ? '?' . parse_url($aBranding['mark'], PHP_URL_QUERY) : ''))['status'], 'it serves');

            // the theme colour as #RRGGBB, or null
            foreach (['#0f766e' => '#0F766E', '#AbC' => '#AABBCC', '#0f766e80' => '#0F766E', 'teal' => null, '' => null] as $sColour => $mAccent) {
                setParam('sys_pwa_manifest_theme_color', $sColour);
                $aJson = $this->http('GET', '')['json'];
                $this->assertSchema('ApiInfo', $aJson);
                // '' is null, not the template's theme-color (Artificer's #283c50 would be a slate accent)
                $this->assertSame($mAccent, $aJson['branding']['accent'], $sColour === '' ? 'none set in Designer' : $sColour);
            }
        } finally {
            foreach ($aWas as $sOption => $sValue)
                setParam($sOption, $sValue);
            if ($iFileId)
                $oStorage->deleteFile($iFileId);
        }
    }

    public function testTheApiCanBeTurnedOff(): void
    {
        setParam('sys_api_enable', ''); // the HTTP server reads it from the database
        $a = $this->http('GET', '');
        $this->assertSame(503, $a['status']);
        $this->assertSame('api_disabled', $a['json']['code']);
    }

    public function testV2HasItsOwnSwitch(): void
    {
        setParam(BxDolApiV2Router::OPTION_ENABLE, ''); // as installed: v2 is a preview
        foreach (['', 'openapi.json', 'feeds/home'] as $sPath) {
            $a = $this->http('GET', $sPath);
            $this->assertSame(503, $a['status'], $sPath);
            $this->assertSame('api_v2_disabled', $a['json']['code'], $sPath);
        }

        // no CORS while it is off: a page of another origin can't read the answer, and a preflight is no 204
        $aOrigin = ['Origin' => 'https://elsewhere.example', 'Access-Control-Request-Method' => 'GET'];
        foreach (['GET', 'OPTIONS'] as $sMethod) {
            $a = $this->http($sMethod, 'feeds/public', $aOrigin);
            $this->assertSame(503, $a['status'], $sMethod);
            foreach (['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers', 'access-control-expose-headers', 'access-control-max-age'] as $sHeader)
                $this->assertNull(BxDolTestPhpServer::header($a, $sHeader), $sMethod . ' ' . $sHeader);
        }
    }

    public function testGuestFeedMatchesTheSchemaAndPages(): void
    {
        $this->requireModule('bx_timeline');

        $a = $this->http('GET', 'feeds/public?limit=1');
        $this->assertSame(200, $a['status']);
        $this->assertSchema('Page_Activity', $a['json']);

        $sEtag = BxDolTestPhpServer::header($a, 'etag');
        $this->assertNotNull($sEtag);
        $this->assertMatchesRegularExpression('/^W\/"[0-9a-f]+"$/', $sEtag);
        $this->assertSame('private, no-cache', BxDolTestPhpServer::header($a, 'cache-control'), 'guests too: an answer depends on who asks');
        $this->assertStringContainsString('Authorization, Cookie', BxDolTestPhpServer::header($a, 'vary'));
        $this->assertArrayHasKey('next_cursor', $a['json']);
        if ($a['json']['items']) {
            $aActivity = $a['json']['items'][0];
            $this->assertNull($aActivity['viewer'], 'a guest has no viewer state');
            $this->assertNull($aActivity['object']['viewer']);
            $this->assertMatchesRegularExpression('/^[0-9a-f]{24}$/', $aActivity['version']);
            $this->assertMatchesRegularExpression('/^[0-9a-f]{24}$/', $aActivity['object']['version']);
        }

        // If-None-Match: weak comparison, a list and *; a match is 304 with no body
        foreach ([$sEtag, substr($sEtag, 2), '"nope", ' . $sEtag, '*'] as $sWanted) {
            $a304 = $this->http('GET', 'feeds/public?limit=1', ['If-None-Match' => $sWanted]);
            $this->assertSame(304, $a304['status'], $sWanted);
            $this->assertSame('', $a304['body']);
            $this->assertNull(BxDolTestPhpServer::header($a304, 'content-type'), 'no Content-Type on a 304');
            $this->assertSame($sEtag, BxDolTestPhpServer::header($a304, 'etag'));
            $this->assertSame('private, no-cache', BxDolTestPhpServer::header($a304, 'cache-control'));
        }
        $this->assertSame(200, $this->http('GET', 'feeds/public?limit=1', ['If-None-Match' => 'W/"nope"'])['status']);

        // a last page still says so: next_cursor is there, null
        $a = $this->http('GET', 'search/content?q=' . rawurlencode('ApiV2Test nothing ' . bin2hex(random_bytes(4))));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Hit', $a['json']);
        $this->assertSame([], $a['json']['items']);
        $this->assertArrayHasKey('next_cursor', $a['json']);
        $this->assertNull($a['json']['next_cursor']);

        $this->assertSame(422, $this->http('GET', 'feeds/public?cursor=nope!')['status']);
        $this->assertSame(401, $this->http('GET', 'feeds/home')['status']);

        // reactions: names, the default first; their details apart
        $a = $this->http('GET', 'reactions');
        $this->assertSame(200, $a['status']);
        $this->assertTrue(array_is_list($a['json']));
        $this->assertSame(array_values(array_unique($a['json'])), $a['json'], 'no duplicate kinds');
        $this->assertNotContains('default', $a['json'], 'not the placeholder');
        foreach ($a['json'] as $sName)
            $this->assertIsString($sName);
        $aNames = $a['json'];
        $oReactions = BxDolVote::getObjectInstance(BxDolModule::getInstance('bx_timeline')->_oConfig->getObject('reaction'), 0);
        if ($oReactions instanceof BxDolVoteReactions && $aNames) {
            $aList = $oReactions->getReactions(true);
            $this->assertSame($aList[$oReactions->getDefault()]['name'] ?? $aNames[0], $aNames[0], 'the default first');
        }

        $a = $this->http('GET', 'reactions/details');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('ReactionKinds', $a['json']);
        $this->assertSame($aNames, array_column($a['json']['kinds'], 'name'), 'the same kinds in the same order');
        $this->assertContains($a['json']['display'], ['icon', 'emoji']);
        if ($oReactions instanceof BxDolVoteReactions && $aNames) {
            // each kind's icon and colour are the site's, mapped; display follows the list's `use`
            $aList = $oReactions->getReactions(true);
            $iIcons = 0;
            foreach ($a['json']['kinds'] as $aKind) {
                $aRow = $aList[$aKind['name']];
                $this->assertSame(BxDolApiV2Map::reactionIcon($aRow['icon']), $aKind['icon'], $aKind['name']);
                $this->assertSame(BxDolApiV2Map::reactionColor($aRow['color']), $aKind['color'], $aKind['name']);
                $this->assertSame((string)$aRow['emoji'], $aKind['emoji']);
                $iIcons += in_array($aRow['use'], ['icon', 'image'], true) ? 1 : 0;
            }
            $this->assertSame($iIcons * 2 > count($aNames) ? 'icon' : 'emoji', $a['json']['display']);
        }
    }

    /**
     * How a reaction's icon and colour codes of the site become a Lucide name and hex: UNA's
     * default reactions all have a Lucide face, and its colour classes are hex.
     */
    public function testReactionIconsAndColours(): void
    {
        $aDefaults = ['fa-thumbs-up' => 'thumbs-up', 'fa-heart' => 'heart', 'fa-laugh-squint' => 'laugh', 'fa-surprise' => 'smile', 'fa-sad-tear' => 'frown', 'fa-angry' => 'angry', 'fa-smile' => 'smile'];
        foreach ($aDefaults as $sIcon => $sLucide)
            $this->assertSame($sLucide, BxDolApiV2Map::reactionIcon($sIcon), $sIcon);
        $this->assertSame('laugh', BxDolApiV2Map::reactionIcon('far fa-laugh-squint col-red3'), 'with its classes');
        $this->assertSame('frown', BxDolApiV2Map::reactionIcon('frown'), 'a Lucide name');
        foreach (['', '12', "\u{1F44D}", '<svg></svg>', 'fa-no-such-face'] as $s)
            $this->assertNull(BxDolApiV2Map::reactionIcon($s), $s);

        $this->assertSame('#d80960', BxDolApiV2Map::reactionColor('sys-colored col-red1'));
        $this->assertSame('#616161', BxDolApiV2Map::reactionColor('sys-colored col-gray'));
        $this->assertSame('#2563eb', BxDolApiV2Map::reactionColor('blue-600'), 'a badge colour');
        $this->assertSame('#abc', BxDolApiV2Map::reactionColor('#ABC'));
        foreach (['', 'sys-colored', 'sys-colored col-nope', 'blue'] as $s)
            $this->assertNull(BxDolApiV2Map::reactionColor($s), $s);
    }

    public function testIdempotencyKeyReplaysTheFirstAnswer(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $sScope = BxDolApiV2Idempotency::scope(BxDolApiV2Auth::MODE_TOKEN, $sToken);
        $this->_aIdempotencyScopes[] = $sScope;
        $oDb = BxDolDb::getInstance();
        $fRows = function () use ($oDb, $sScope) {
            return (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_api_idempotency` WHERE `scope` = UNHEX(:s)", ['s' => $sScope]);
        };

        $this->assertSame(400, $this->http('POST', 'feed-posts', $aAuth + ['Idempotency-Key' => 'two words'], '{}')['status']);
        $a = $this->http('POST', 'feed-posts', $aAuth + ['Idempotency-Key' => str_repeat('k', 256)], '{}');
        $this->assertSame(400, $a['status']);
        $this->assertSame('invalid_idempotency_key', $a['json']['code']);

        $sKey = 'ApiV2Test-' . bin2hex(random_bytes(8));
        $sBody = json_encode(['body_html' => '<p>ApiV2Test idempotent</p>', 'audience' => 'public']);
        $a = $this->http('POST', 'feed-posts', $aAuth + ['Idempotency-Key' => $sKey], $sBody);
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $this->assertNull(BxDolTestPhpServer::header($a, 'idempotent-replayed'));
        $this->assertNull(BxDolTestPhpServer::header($a, 'etag'), 'writes carry no ETag');
        $this->assertSame(1, $fRows());

        // the same key and request: the first answer again, nothing posted twice
        $aAgain = $this->http('POST', 'feed-posts', $aAuth + ['Idempotency-Key' => $sKey], $sBody);
        $this->assertSame(201, $aAgain['status'], $aAgain['body']);
        $this->assertSame('true', BxDolTestPhpServer::header($aAgain, 'idempotent-replayed'));
        $this->assertSame($a['body'], $aAgain['body']);
        $this->assertSame(BxDolTestPhpServer::header($a, 'location'), BxDolTestPhpServer::header($aAgain, 'location'));
        foreach (['cache-control', 'vary'] as $sHeader)
            $this->assertSame(BxDolTestPhpServer::header($a, $sHeader), BxDolTestPhpServer::header($aAgain, $sHeader), $sHeader . ' as on the first answer');
        $this->assertStringStartsWith('application/json', BxDolTestPhpServer::header($aAgain, 'content-type'));

        // the same key for another request
        $a = $this->http('POST', 'feed-posts', $aAuth + ['Idempotency-Key' => $sKey], json_encode(['body_html' => '<p>ApiV2Test other</p>', 'audience' => 'public']));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('idempotency_key_reused', $a['json']['code']);

        // a problem is an answer too: replayed
        $sBadKey = 'ApiV2Test-' . bin2hex(random_bytes(8));
        $sBad = json_encode(['body_html' => '<p>x</p>', 'unknown' => 1]);
        $this->assertSame(422, $this->http('POST', 'feed-posts', $aAuth + ['Idempotency-Key' => $sBadKey], $sBad)['status']);
        $a = $this->http('POST', 'feed-posts', $aAuth + ['Idempotency-Key' => $sBadKey], $sBad);
        $this->assertSame([422, 'true', 'unknown_field'], [$a['status'], BxDolTestPhpServer::header($a, 'idempotent-replayed'), $a['json']['errors'][0]['code']]);
        $this->assertStringStartsWith('application/problem+json', BxDolTestPhpServer::header($a, 'content-type'));
        $this->assertSame('no-store', BxDolTestPhpServer::header($a, 'cache-control'), 'a replayed problem is not kept either');

        // a 204 too, with no body
        $sItem = $this->http('GET', 'activities/' . $this->_aEvents[0], $aAuth)['json']['object']['id'];
        $sReactKey = 'ApiV2Test-' . bin2hex(random_bytes(8));
        $sLike = json_encode(['kind' => 'like']);
        $this->assertSame(204, $this->http('PUT', 'content/' . $sItem . '/reaction', $aAuth + ['Idempotency-Key' => $sReactKey], $sLike)['status']);
        $a = $this->http('PUT', 'content/' . $sItem . '/reaction', $aAuth + ['Idempotency-Key' => $sReactKey], $sLike);
        $this->assertSame([204, 'true', ''], [$a['status'], BxDolTestPhpServer::header($a, 'idempotent-replayed'), $a['body']]);

        // one still running: 409 with Retry-After; one that died over a minute ago runs again
        $sPendingKey = 'ApiV2Test-' . bin2hex(random_bytes(8));
        $sDelete = 'DELETE';
        $sPrint = BxDolApiV2Idempotency::fingerprint($sDelete, '/content/' . $sItem . '/reaction', '', '');
        $oDb->query("INSERT INTO `sys_api_idempotency` (`scope`, `key`, `fingerprint`, `added`) VALUES (UNHEX(:s), :k, UNHEX(:f), :a)", ['s' => $sScope, 'k' => $sPendingKey, 'f' => $sPrint, 'a' => time()]);
        $a = $this->http($sDelete, 'content/' . $sItem . '/reaction', ['Authorization' => 'Bearer ' . $sToken, 'Idempotency-Key' => $sPendingKey]);
        $this->assertSame(409, $a['status'], $a['body']);
        $this->assertSame('idempotency_in_progress', $a['json']['code']);
        $this->assertSame('1', BxDolTestPhpServer::header($a, 'retry-after'));
        $oDb->query("UPDATE `sys_api_idempotency` SET `added` = :a WHERE `scope` = UNHEX(:s) AND `key` = :k", ['s' => $sScope, 'k' => $sPendingKey, 'a' => time() - 61]);
        $a = $this->http($sDelete, 'content/' . $sItem . '/reaction', ['Authorization' => 'Bearer ' . $sToken, 'Idempotency-Key' => $sPendingKey]);
        $this->assertSame(204, $a['status'], $a['body']);
        $this->assertNull(BxDolTestPhpServer::header($a, 'idempotent-replayed'), 'it ran');
        $this->assertSame(0, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_api_idempotency` WHERE `scope` = UNHEX(:s) AND `key` = :k AND `status` IS NULL", ['s' => $sScope, 'k' => $sPendingKey]), 'and its answer is kept');

        // keys are pruned after a day
        $oDb->query("UPDATE `sys_api_idempotency` SET `added` = :a WHERE `scope` = UNHEX(:s) AND `key` = :k", ['s' => $sScope, 'k' => $sKey, 'a' => time() - 86401]);
        $iBefore = $fRows();
        $this->assertGreaterThanOrEqual(1, BxDolApiV2Idempotency::prune());
        $this->assertSame($iBefore - 1, $fRows());

        // guests' keys are ignored; so are uploads (multipart), whose bodies are not read
        $iBefore = $fRows();
        $this->assertSame(401, $this->http('POST', 'feed-posts', ['Content-Type' => 'application/json', 'Idempotency-Key' => $sKey], $sBody)['status']);
        $this->assertSame(401, $this->http('POST', 'feed-posts', ['Content-Type' => 'application/json', 'Idempotency-Key' => 'two words'], $sBody)['status'], 'a guest\'s key is not even read');
        $sUploadKey = 'ApiV2Test-' . bin2hex(random_bytes(8));
        $aUploadAuth = ['Authorization' => 'Bearer ' . $sToken, 'Idempotency-Key' => $sUploadKey];
        $a1 = $this->upload($aUploadAuth, 'a.png', self::png(2, 2));
        $a2 = $this->upload($aUploadAuth, 'a.png', self::png(2, 2));
        $this->assertSame([201, 201], [$a1['status'], $a2['status']], $a1['body']);
        $this->assertNotSame($a1['json']['id'], $a2['json']['id'], 'each upload ran');
        $this->assertNull(BxDolTestPhpServer::header($a2, 'idempotent-replayed'));
        $this->assertSame($iBefore, $fRows(), 'nothing kept for them');
        foreach ([$a1, $a2] as $aUpload)
            $this->http('DELETE', 'uploads/' . $aUpload['json']['id'], ['Authorization' => 'Bearer ' . $sToken]);
    }

    public function testTokenActsAsTheProfile(): void
    {
        list($iProfileId, $sToken) = $this->userToken();

        $a = $this->http('GET', 'me', ['Authorization' => 'Bearer ' . $sToken]);
        $this->assertSame(200, $a['status']);
        $this->assertSchema('Me', $a['json']);
        $this->assertSame((string)$iProfileId, $a['json']['active_profile_id']);
        $this->assertStringContainsString('private', BxDolTestPhpServer::header($a, 'cache-control'));

        $a = $this->http('GET', 'profiles/' . $iProfileId);
        $this->assertSame(200, $a['status']);
        $this->assertSchema('Profile', $a['json']);
    }

    public function testTokenFollowsTheAccountsCurrentProfile(): void
    {
        list($iProfileId, $sToken) = $this->userToken();
        $oAccount = $this->bxAccount('user');
        $aOther = self::seedOnly() ? [] : array_values(array_diff(array_map('intval', $oAccount->getProfilesIds(false)), [$iProfileId]));
        if (!$aOther)
            $aOther = [$this->seedSecondProfile($oAccount)];

        // the token was issued for one profile; the account switches to another on the site
        $oAccount->updateProfileContext($aOther[0]);
        try {
            $a = $this->http('GET', 'me', ['Authorization' => 'Bearer ' . $sToken]);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Me', $a['json']);
            $this->assertSame((string)$aOther[0], $a['json']['active_profile_id'], 'the token acts as the profile the account uses now, as documented');
        } finally {
            $oAccount->updateProfileContext($iProfileId);
        }
    }

    public function testTokenWithoutTheApiScopeIsRefused(): void
    {
        list(, $sToken) = $this->userToken('basic');

        $a = $this->http('GET', 'me', ['Authorization' => 'Bearer ' . $sToken]);
        $this->assertSame(403, $a['status']);
        $this->assertSame('insufficient_scope', $a['json']['code']);
    }

    public function testCookieSessionCannotWriteFromAnotherSite(): void
    {
        $this->requireModule('bx_timeline');
        $oAccount = $this->bxAccount('user');
        if (!BxDolProfile::getInstanceByAccount($oAccount->id()))
            $this->markTestSkipped('The test user has no profile.');

        bx_login($oAccount->id());
        $sSession = BxDolSession::getInstance()->getId();

        $a = $this->http('POST', 'feed-posts', [
            'Cookie' => BX_DOL_SESSION_COOKIE . '=' . $sSession,
            'Origin' => 'https://evil.example',
            'Content-Type' => 'application/json',
        ], json_encode(['body_html' => '<p>csrf</p>']));

        $this->assertSame(403, $a['status']);
        $this->assertSame('origin_not_allowed', $a['json']['code']);
    }

    public function testPostCommentReactAndDelete(): void
    {
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test</p>', 'audience' => 'members']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Activity', $a['json']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $sItem = $a['json']['object']['id'];
        $this->assertSame('feed_post', $a['json']['object']['kind']);
        $this->assertSame('members', $a['json']['object']['audience']);
        $this->assertStringEndsWith('/activities/' . $a['json']['id'], BxDolTestPhpServer::header($a, 'location'));

        $a2 = $this->http('GET', 'activities/' . $a['json']['id']);
        $this->assertSame(403, $a2['status'], 'members only: a guest may not see it');
        $this->assertSame('forbidden', $a2['json']['code']);
        $this->assertSame(403, $this->http('GET', 'content/' . $sItem)['status']);

        $a2 = $this->http('GET', 'content/' . $sItem, $aAuth);
        $this->assertSame(200, $a2['status'], $a2['body']);
        $this->assertSchema('Item', $a2['json']);
        $this->assertSame($sItem, $a2['json']['id']);
        $this->assertSame(404, $this->http('GET', 'content/999999999', $aAuth)['status']);

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>x</p>', 'unknown' => 1]));
        $this->assertSame(422, $a['status']);
        $this->assertSame('unknown_field', $a['json']['errors'][0]['code']);

        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body' => 'A comment']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Comment', $a['json']);

        $sComment = $a['json']['id'];
        $this->assertSchema('Profile', $a['json']['author']);
        $this->assertSame('', $a['json']['author']['about'], 'an embedded author has no description');
        $this->assertNull($a['json']['author']['cover']);

        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body' => 'A reply', 'parent_id' => $sComment]));
        $this->assertSame(201, $a['status'], $a['body']);
        $sReply = $a['json']['id'];

        $a = $this->http('GET', 'content/' . $sItem . '/comments', $aAuth);
        $this->assertSame(200, $a['status']);
        $this->assertSchema('Page_Comment', $a['json']);
        $this->assertSame([$sComment], array_column($a['json']['items'], 'id'), 'top-level comments only');
        $this->assertSame(1, $a['json']['items'][0]['replies']);

        $a = $this->http('GET', 'comments/' . $sComment . '/replies', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Comment', $a['json']);
        $this->assertSame([$sReply], array_column($a['json']['items'], 'id'), 'the replies to the comment');
        $this->assertSame($sComment, $a['json']['items'][0]['parent_id']);
        $this->assertSame(404, $this->http('GET', 'comments/999999999/replies', $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'comments/x/replies', $aAuth)['status'], 'not an id: no such path');

        $aBefore = $this->http('GET', 'activities/' . $this->_aEvents[0], $aAuth)['json'];
        $this->assertSchema('Activity', $aBefore);
        $this->assertSame($aBefore['version'], $this->http('GET', 'activities/' . $this->_aEvents[0], $aAuth)['json']['version'], 'the same activity, the same version');
        $this->assertFalse($aBefore['object']['viewer']['favorited'], 'feed posts have no favorites');
        $this->assertFalse($aBefore['viewer']['reposted']);
        $this->assertIsBool($aBefore['viewer']['can_repost']);
        $aItem = $this->http('GET', 'content/' . $sItem, $aAuth)['json'];
        $this->assertSame($aBefore['object']['version'], $aItem['version'], 'an item has the same version alone and in its activity');

        $this->assertSame(204, $this->http('PUT', 'content/' . $sItem . '/reaction', $aAuth, json_encode(['kind' => 'like']))['status']);
        $this->assertSame(204, $this->http('PUT', 'content/' . $sItem . '/reaction', $aAuth, json_encode(['kind' => 'like']))['status'], 'idempotent');
        $a = $this->http('GET', 'activities/' . $this->_aEvents[0], $aAuth);
        $this->assertSame('like', $a['json']['object']['viewer']['reaction']);
        $this->assertSame(1, $a['json']['object']['stats']['reactions']);
        $this->assertNotSame($aBefore['version'], $a['json']['version'], 'a reaction changes the version');
        $this->assertNotSame($aBefore['object']['version'], $a['json']['object']['version']);

        $this->assertSame(204, $this->http('DELETE', 'content/' . $sItem . '/reaction', $aAuth)['status']);
        $a = $this->http('GET', 'activities/' . $this->_aEvents[0], $aAuth);
        $this->assertNull($a['json']['object']['viewer']['reaction']);

        $this->assertSame(204, $this->http('DELETE', 'activities/' . $this->_aEvents[0], $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'activities/' . $this->_aEvents[0], $aAuth)['status']);
    }

    public function testActivityViewerSaysWhatTheViewerReposted(): void
    {
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test repost</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $iPost = (int)$a['json']['id'];
        $this->_aEvents[] = $iPost;
        $this->assertSame(['reposted' => false, 'can_repost' => $a['json']['viewer']['can_repost']], $a['json']['viewer']);
        $sVersion = $a['json']['version'];

        // reposted to the viewer's own timeline, as the site's repost button does
        $oTimeline = BxDolModule::getInstance('bx_timeline');
        $iRepost = (int)$oTimeline->repost($iProfileId, $iProfileId, $oTimeline->_oConfig->getPrefix('common_post') . 'post', '', $iPost, false, true);
        $this->assertGreaterThan(0, $iRepost, 'the repost was made');
        $this->_aEvents[] = $iRepost;
        $iEvents = (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_timeline_events`");

        $a = $this->http('GET', 'activities/' . $iPost, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Activity', $a['json']);
        $this->assertTrue($a['json']['viewer']['reposted']);
        $this->assertNotSame($sVersion, $a['json']['version'], 'the viewer\'s own state is part of the version');

        $a = $this->http('GET', 'activities/' . $iRepost, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('reposted', $a['json']['verb']);
        $this->assertTrue($a['json']['viewer']['reposted'], 'a repost of what the viewer reposted');

        $a = $this->http('GET', 'activities/' . $iPost);
        $this->assertNull($a['json']['viewer'], 'a guest');
        $this->assertSame($iEvents, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_timeline_events`"), 'reading writes no events');
    }

    public function testCommentThreadRepliesEditAndDelete(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $iOtherId = $this->ordinaryForeignProfileId($this->bxAccount('user'));
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOtherId), 'Content-Type' => 'application/json'];

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test thread</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $sItem = $a['json']['object']['id'];

        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body' => 'Top']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sTop = $a['json']['id'];

        // the id is UNA's unique comment id, not the row of the Timeline's comments table
        $aInfo = BxDolCmtsQuery::getInfoByUniqId((int)$sTop);
        $this->assertSame('bx_timeline', $aInfo['system_name']);
        $this->assertSame($sItem, (string)$aInfo['cmt_object_id']);

        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body' => 'Reply', 'parent_id' => $sTop]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Comment', $a['json']);
        $sReply = $a['json']['id'];
        $this->assertSame($sTop, $a['json']['parent_id']);
        $this->assertSame($sItem, $a['json']['target_id']);
        $this->assertSame(1, $a['json']['depth']);
        $this->assertTrue($a['json']['viewer']['can_edit']);

        // another member answers the reply: on the Timeline it is shown, and listed, under the top comment
        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aOther, json_encode(['body' => 'Answer', 'parent_id' => $sReply]));
        $this->assertSame(201, $a['status'], $a['body']);
        $sAnswer = $a['json']['id'];
        $this->assertSame($sReply, $a['json']['parent_id']);

        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body' => 'x', 'parent_id' => '999999999']));
        $this->assertSame(422, $a['status']);
        $this->assertSame('parent_id', $a['json']['errors'][0]['field']);

        // the reply has an answer: its author may not delete it now (only a moderator could), and says so
        $a = $this->http('GET', 'comments/' . $sTop . '/replies', $aAuth);
        $this->assertSame($sReply, $a['json']['items'][0]['id']);
        $this->assertTrue($a['json']['items'][0]['viewer']['can_edit']);
        $this->assertFalse($a['json']['items'][0]['viewer']['can_delete'], 'a comment with replies');

        $a = $this->http('GET', 'comments/' . $sTop . '/replies', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Comment', $a['json']);
        $this->assertSame([$sReply, $sAnswer], array_column($a['json']['items'], 'id'), 'oldest first');
        $this->assertSame([$sTop, $sReply], array_column($a['json']['items'], 'parent_id'));

        $a = $this->http('GET', 'comments/' . $sTop . '/replies?limit=1', $aAuth);
        $this->assertSame([$sReply], array_column($a['json']['items'], 'id'));
        $this->assertNotNull($a['json']['next_cursor']);
        $a = $this->http('GET', 'comments/' . $sTop . '/replies?limit=1&cursor=' . rawurlencode($a['json']['next_cursor']), $aAuth);
        $this->assertSame([$sAnswer], array_column($a['json']['items'], 'id'));

        // someone else may neither edit nor delete the test user's reply
        $a = $this->http('PATCH', 'comments/' . $sReply, $aOther, json_encode(['body' => 'Not mine']));
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSame('forbidden', $a['json']['code']);
        $this->assertSame('application/problem+json', strtok((string)BxDolTestPhpServer::header($a, 'content-type'), ';'));
        $a = $this->http('DELETE', 'comments/' . $sReply, $aOther);
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSame('forbidden', $a['json']['code']);
        $a = $this->http('GET', 'comments/' . $sTop . '/replies', $aOther);
        $this->assertFalse($a['json']['items'][0]['viewer']['can_edit']);
        $this->assertFalse($a['json']['items'][0]['viewer']['can_delete']);

        // the viewer is an ItemViewer: a reaction, no favorites, may react, may reply; null for guests
        $aViewer = $a['json']['items'][0]['viewer'];
        $this->assertSchema('ItemViewer', $aViewer);
        $this->assertSame([null, false, true], [$aViewer['reaction'], $aViewer['favorited'], $aViewer['can_comment']], 'they may answer it');
        $this->assertIsBool($aViewer['can_react']);
        $oReactions = BxDolCmts::getObjectInstance('bx_timeline', (int)$sItem, false);
        $oReactions = $oReactions ? $oReactions->getReactionObject((int)$sReply) : false;
        if ($oReactions instanceof BxDolVoteReactions) {
            $oDb = BxDolDb::getInstance();
            $sTrack = (string)(BxDolVote::getSystems()[$oReactions->getSystemName()]['table_track'] ?? '');
            $this->assertNotSame('', $sTrack);
            $sReaction = (string)$oReactions->getDefaultReaction();
            $oDb->query("INSERT INTO `{$sTrack}` (`object_id`, `author_id`, `author_nip`, `reaction`, `value`, `date`) VALUES (:o, :a, 0, :r, 1, :d)", ['o' => (int)$sReply, 'a' => $iOtherId, 'r' => $sReaction, 'd' => time()]);
            try {
                $a = $this->http('GET', 'comments/' . $sTop . '/replies', $aOther);
                $this->assertSame($sReaction, $a['json']['items'][0]['viewer']['reaction'], 'their reaction to it');
                $this->assertNull($a['json']['items'][1]['viewer']['reaction'] ?? null);
            } finally {
                $oDb->query("DELETE FROM `{$sTrack}` WHERE `object_id` = :o AND `author_id` = :a", ['o' => (int)$sReply, 'a' => $iOtherId]);
            }
        }
        $a = $this->http('GET', 'comments/' . $sTop . '/replies');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertNull($a['json']['items'][0]['viewer'], 'a guest has no viewer state');

        $this->assertSame(401, $this->http('PATCH', 'comments/' . $sReply, ['Content-Type' => 'application/json'], json_encode(['body' => 'Guest']))['status']);
        $this->assertSame(422, $this->http('PATCH', 'comments/' . $sReply, $aAuth, json_encode(['body' => '']))['status']);

        $a = $this->http('PATCH', 'comments/' . $sReply, $aAuth, json_encode(['body' => 'Edited reply']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Comment', $a['json']);
        $this->assertSame('Edited reply', $a['json']['body']);
        $this->assertSame($sTop, $a['json']['parent_id'], 'an edit keeps the comment where it is');

        $a = $this->http('GET', 'comments/' . $sTop . '/replies', $aAuth);
        $this->assertSame('Edited reply', $a['json']['items'][0]['body']);

        // a comment with replies stays until its replies go (for anyone but a moderator)
        $a = $this->http('DELETE', 'comments/' . $sReply, $aAuth);
        $this->assertSame(409, $a['status'], $a['body']);
        $this->assertSame('has_replies', $a['json']['code']);

        $this->assertSame(204, $this->http('DELETE', 'comments/' . $sAnswer, $aOther)['status'], 'one\'s own comment');
        $a = $this->http('GET', 'comments/' . $sTop . '/replies', $aAuth);
        $this->assertTrue($a['json']['items'][0]['viewer']['can_delete'], 'no replies left');
        $this->assertSame(204, $this->http('DELETE', 'comments/' . $sReply, $aAuth)['status']);
        $a = $this->http('PATCH', 'comments/' . $sReply, $aAuth, json_encode(['body' => 'Gone']));
        $this->assertSame(404, $a['status']);
        $this->assertSame('not_found', $a['json']['code']);
        $this->assertSame(404, $this->http('DELETE', 'comments/' . $sReply, $aAuth)['status']);

        $a = $this->http('GET', 'comments/' . $sTop . '/replies', $aAuth);
        $this->assertSame([], $a['json']['items']);
        $a = $this->http('GET', 'content/' . $sItem . '/comments', $aAuth);
        $this->assertSame(0, $a['json']['items'][0]['replies']);
    }

    public function testCommentBodyIsPlainText(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test plain comments</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $sItem = $a['json']['object']['id'];

        // a literal tag stays text, and each line is a paragraph
        $sText = "1 < 2 & <b>not bold</b>\nSecond line";
        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body' => $sText]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Comment', $a['json']);
        $sId = $a['json']['id'];
        $this->assertSame($sText, $a['json']['body']);
        $this->assertStringNotContainsString('<b>', $a['json']['body_html']);
        $this->assertStringContainsString('&lt;b&gt;', $a['json']['body_html']);
        $this->assertSame(2, substr_count($a['json']['body_html'], '<p>'));
        $this->assertTrue($a['json']['viewer']['can_edit']);

        // an edit with the text it got back keeps the comment as it was
        $sHtml = $a['json']['body_html'];
        $a = $this->http('PATCH', 'comments/' . $sId, $aAuth, json_encode(['body' => $a['json']['body'] . ' (edited)']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame($sText . ' (edited)', $a['json']['body']);
        $this->assertSame(str_replace('line</p>', 'line (edited)</p>', $sHtml), $a['json']['body_html']);

        // a comment written on the site with a link: a plain-text edit would lose the link
        $oCmts = BxDolCmts::getObjectInstance('bx_timeline', (int)$sItem);
        $aInfo = BxDolCmtsQuery::getInfoByUniqId((int)$sId);
        BxDolDb::getInstance()->query("UPDATE `" . $oCmts->getCommentsTableName() . "` SET `cmt_text` = :t WHERE `cmt_id` = :i", [
            't' => '<p>See <a href="https://example.com/">this</a></p>', 'i' => (int)$aInfo['cmt_id'],
        ]);
        $a = $this->http('GET', 'content/' . $sItem . '/comments', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('See this', $a['json']['items'][0]['body']);
        $this->assertTrue($a['json']['items'][0]['viewer']['can_edit'], 'body_html edits it, markup and all');
        $this->assertTrue($a['json']['items'][0]['viewer']['can_delete']);

        $a = $this->http('PATCH', 'comments/' . $sId, $aAuth, json_encode(['body' => 'See this']));
        $this->assertSame(409, $a['status'], $a['body']);
        $this->assertSame('formatted_text', $a['json']['code'], 'a plain-text edit would lose the link');
        $this->assertStringContainsString('<a href="https://example.com/"', $this->http('GET', 'content/' . $sItem . '/comments', $aAuth)['json']['items'][0]['body_html']);
    }

    public function testCommentsOfWhatTheViewerMayNotSee(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($this->ordinaryForeignProfileId($this->bxAccount('user'))), 'Content-Type' => 'application/json'];

        $aItems = [];
        $aComments = [];
        foreach (['members', 'private', 'public'] as $sAudience) {
            $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test ' . $sAudience . ' comments</p>', 'audience' => $sAudience]));
            $this->assertSame(201, $a['status'], $a['body']);
            $this->_aEvents[] = (int)$a['json']['id'];
            $aItems[$sAudience] = $a['json']['object']['id'];

            $a = $this->http('POST', 'content/' . $aItems[$sAudience] . '/comments', $aAuth, json_encode(['body' => 'On a ' . $sAudience . ' post']));
            $this->assertSame(201, $a['status'], $a['body']);
            $aComments[$sAudience] = $a['json']['id'];
        }

        // a guest may not see a members-only post, nor its comments by id
        $a = $this->http('GET', 'comments/' . $aComments['members'] . '/replies');
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSame('forbidden', $a['json']['code']);
        $this->assertSame(200, $this->http('GET', 'comments/' . $aComments['members'] . '/replies', $aAuth)['status'], 'its author may');

        // another member may not see a private post: nothing of its comments
        $this->assertSame(403, $this->http('GET', 'comments/' . $aComments['private'] . '/replies', $aOther)['status']);
        $this->assertSame(403, $this->http('PATCH', 'comments/' . $aComments['private'], $aOther, json_encode(['body' => 'x']))['status']);
        $this->assertSame(403, $this->http('DELETE', 'comments/' . $aComments['private'], $aOther)['status']);
        $this->assertSame(403, $this->http('POST', 'content/' . $aItems['private'] . '/comments', $aOther, json_encode(['body' => 'x']))['status']);
        $this->assertSame(200, $this->http('GET', 'comments/' . $aComments['private'] . '/replies', $aAuth)['status'], 'its author may');

        // a reply goes under a comment of the same item
        $a = $this->http('POST', 'content/' . $aItems['public'] . '/comments', $aAuth, json_encode(['body' => 'x', 'parent_id' => $aComments['members']]));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('parent_id', $a['json']['errors'][0]['field']);

        // a comment held for moderation is there for its author only
        BxDolDb::getInstance()->query("UPDATE `sys_cmts_ids` SET `status_admin` = 'pending' WHERE `id` = :i", ['i' => (int)$aComments['public']]);
        $this->assertSame(404, $this->http('GET', 'comments/' . $aComments['public'] . '/replies', $aOther)['status']);
        $a = $this->http('POST', 'content/' . $aItems['public'] . '/comments', $aOther, json_encode(['body' => 'x', 'parent_id' => $aComments['public']]));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('parent_id', $a['json']['errors'][0]['field']);
        $this->assertSame(404, $this->http('PATCH', 'comments/' . $aComments['public'], $aOther, json_encode(['body' => 'x']))['status']);
        $this->assertSame(200, $this->http('GET', 'comments/' . $aComments['public'] . '/replies', $aAuth)['status'], 'its author sees it');
    }

    public function testCommentIdsOfOtherCommentSystemsAreNotTimelineComments(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];

        // a conversation message is a comment of bx_convos, which no timeline item shows
        $sMessages = "SELECT `ti`.`id` FROM `sys_cmts_ids` AS `ti` INNER JOIN `sys_objects_cmts` AS `to` ON `ti`.`system_id` = `to`.`ID` WHERE `to`.`Name` = 'bx_convos'";
        $iId = self::seedOnly() ? 0 : (int)BxDolDb::getInstance()->getOne($sMessages . " LIMIT 1");
        if (!$iId) {
            // two people made for the class write to each other; the test user is in neither's conversation
            $this->requireModule('bx_convos');
            $iFrom = $this->seedPooledPerson();
            $iTo = $this->seedPooledPerson(fn($i) => $i !== $iFrom);
            $iConvo = $this->seedConversation($iFrom, $iTo);
            $a = $this->http('POST', 'conversations/' . $iConvo . '/messages', ['Authorization' => 'Bearer ' . $this->profileToken($iTo), 'Content-Type' => 'application/json'], json_encode(['body' => '<p>ApiV2Test seed reply</p>']));
            $this->assertSame(201, $a['status'], $a['body']);
            $iId = (int)BxDolDb::getInstance()->getOne($sMessages . " ORDER BY `ti`.`id` DESC LIMIT 1");
            $this->assertGreaterThan(0, $iId, 'the message has an id among the site\'s comments');
        }

        $this->assertSame(404, $this->http('GET', 'comments/' . $iId . '/replies', $aAuth)['status']);
        $this->assertSame(404, $this->http('PATCH', 'comments/' . $iId, $aAuth, json_encode(['body' => 'x']))['status']);
        $this->assertSame(404, $this->http('DELETE', 'comments/' . $iId, $aAuth)['status']);
    }

    public function testOAuthConsentIsExplicitForThePublicClient(): void
    {
        list($oAccount, $sCookie) = $this->signedInUser();
        $aOwn = array_map('intval', $oAccount->getProfilesIds());
        $iForeign = $this->foreignProfileId($oAccount);

        $sRedirect = 'http://127.0.0.1:47011/callback';
        $sXss = '"><script>alert(1)</script>';
        $aQuery = ['client_id' => 'una-desktop', 'response_type' => 'code', 'scope' => 'api', 'redirect_uri' => $sRedirect,
            'state' => $sXss, 'code_challenge' => str_repeat('a', 43), 'code_challenge_method' => 'S256'];

        // a GET shows the consent page and never approves, whatever profile_id it names
        $a = $this->oauthAuth('GET', $aQuery + ['profile_id' => (string)$iForeign], $sCookie);
        $this->assertSame(200, $a['status']);
        $this->assertNull(BxDolTestPhpServer::header($a, 'location'));
        $this->assertStringNotContainsString('<script>alert(1)', $a['body'], 'state is escaped');
        $this->assertStringContainsString('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;', $a['body']);
        $aForm = $this->consentForm($a['body']);
        $this->assertNotEmpty($aForm['csrf_token'] ?? '');
        $this->assertSame($sXss, $aForm['state'], 'the escaped state comes back unchanged');
        $this->assertSame('0', $aForm['profile_id'], 'nothing is chosen until the person clicks');
        $this->assertStringContainsString("val('" . $aOwn[0] . "')", $a['body'], 'the page offers the account\'s profile');
        $this->assertStringNotContainsString("val('" . $iForeign . "')", $a['body'], 'and not the one in the query');

        // a POST needs the consent form's token (the module's: tied to the account and its session)
        foreach (['no token' => ['csrf_token' => null], 'wrong token' => ['csrf_token' => str_repeat('0', 64)]] as $sCase => $aChange) {
            $aPost = array_filter(array_merge($aForm, ['profile_id' => (string)$aOwn[0]], $aChange), function ($v) { return $v !== null; });
            $a = $this->oauthAuth('POST', $aPost, $sCookie);
            $this->assertStringNotContainsString('code=', (string)BxDolTestPhpServer::header($a, 'location'), $sCase);
        }

        // only a profile of the signed-in account
        $a = $this->oauthAuth('POST', array_merge($aForm, ['profile_id' => (string)$iForeign]), $sCookie);
        $this->assertSame(302, $a['status']);
        $sLocation = (string)BxDolTestPhpServer::header($a, 'location');
        $this->assertStringContainsString('error=access_denied', $sLocation);
        $this->assertStringNotContainsString('code=', $sLocation);

        $a = $this->oauthAuth('POST', array_merge($aForm, ['profile_id' => (string)$aOwn[0]]), $sCookie);
        $this->assertSame(302, $a['status'], $a['body']);
        $sLocation = (string)BxDolTestPhpServer::header($a, 'location');
        $this->assertStringStartsWith($sRedirect . '?', $sLocation);
        parse_str((string)parse_url($sLocation, PHP_URL_QUERY), $aBack);
        $this->assertSame($sXss, $aBack['state']);
        $this->_aCodes[] = $aBack['code'];
        $this->assertSame($aOwn[0], (int)BxDolDb::getInstance()->getOne("SELECT `user_id` FROM `bx_oauth_authorization_codes` WHERE `authorization_code` = :c", ['c' => $aBack['code']]));

        // having connected once doesn't skip the page for a public client
        $a = $this->oauthAuth('GET', $aQuery, $sCookie);
        $this->assertSame(200, $a['status']);
        $this->assertNull(BxDolTestPhpServer::header($a, 'location'));
    }

    public function testOAuthConsentKeepsTemplateMarkersInTheState(): void
    {
        list($oAccount, $sCookie) = $this->signedInUser();
        $aOwn = array_map('intval', $oAccount->getProfilesIds());

        // __page_charset__ is a key the template engine fills in; the state must come back as sent
        $sState = 'x__page_charset__y';
        $sRedirect = 'http://127.0.0.1:47012/callback';
        $aQuery = ['client_id' => 'una-desktop', 'response_type' => 'code', 'scope' => 'api', 'redirect_uri' => $sRedirect,
            'state' => $sState, 'code_challenge' => str_repeat('b', 43), 'code_challenge_method' => 'S256'];

        $a = $this->oauthAuth('GET', $aQuery, $sCookie);
        $this->assertSame(200, $a['status']);
        $aForm = $this->consentForm($a['body']);
        $this->assertSame($sState, $aForm['state']);

        $a = $this->oauthAuth('POST', array_merge($aForm, ['profile_id' => (string)$aOwn[0]]), $sCookie);
        $this->assertSame(302, $a['status'], $a['body']);
        $sLocation = (string)BxDolTestPhpServer::header($a, 'location');
        $this->assertStringStartsWith($sRedirect . '?', $sLocation);
        parse_str((string)parse_url($sLocation, PHP_URL_QUERY), $aBack);
        $this->assertNotEmpty($aBack['code'] ?? '', $sLocation);
        $this->_aCodes[] = $aBack['code'];
        $this->assertSame($sState, $aBack['state']);
    }

    public function testOAuthConfidentialClientKeepsItsShortcut(): void
    {
        list($oAccount, $sCookie) = $this->signedInUser();
        $aOwn = array_map('intval', $oAccount->getProfilesIds());
        $iForeign = $this->foreignProfileId($oAccount);

        $sClientId = 'apiv2test' . bin2hex(random_bytes(4));
        BxDolDb::getInstance()->query("INSERT INTO `bx_oauth_clients` (`title`, `client_id`, `client_secret`, `redirect_uri`, `grant_types`, `scope`) VALUES ('ApiV2Test', :c, :s, 'https://client.example/cb', 'authorization_code', 'basic')", [
            'c' => $sClientId, 's' => bin2hex(random_bytes(16)),
        ]);
        $this->_aClients[] = $sClientId;

        $aQuery = ['client_id' => $sClientId, 'response_type' => 'code', 'scope' => 'basic', 'redirect_uri' => 'https://client.example/cb', 'state' => 'x', 'profile_id' => (string)$iForeign];
        $a = $this->oauthAuth('GET', $aQuery, $sCookie);

        if (count($aOwn) !== 1) {
            $this->assertSame(200, $a['status'], 'several profiles: the page asks which one');
            return;
        }

        // one profile: approved without the page, for that profile and never the one in the query
        $this->assertSame(302, $a['status'], $a['body']);
        parse_str((string)parse_url((string)BxDolTestPhpServer::header($a, 'location'), PHP_URL_QUERY), $aBack);
        $this->assertNotEmpty($aBack['code'] ?? '');
        $this->_aCodes[] = $aBack['code'];
        $this->assertSame($aOwn[0], (int)BxDolDb::getInstance()->getOne("SELECT `user_id` FROM `bx_oauth_authorization_codes` WHERE `authorization_code` = :c", ['c' => $aBack['code']]));
    }

    public function testOtherAuthorizationSchemesAreNotTokens(): void
    {
        $this->requireModule('bx_timeline');
        $a = $this->http('GET', 'feeds/public?limit=1', ['Authorization' => 'Basic dTpw']);
        $this->assertSame(200, $a['status'], 'HTTP Basic in front of a site is not an API credential');

        $a = $this->http('GET', 'feeds/public?limit=1', ['Authorization' => 'Bearer ' . str_repeat('f', 40)]);
        $this->assertSame(401, $a['status']);
    }

    public function testCookieSessionOriginNeedsTheSameSchemeHostAndPort(): void
    {
        $this->requireModule('bx_notifications');
        list(, $sCookie) = $this->signedInUser();

        $aSite = parse_url(BX_DOL_URL_ROOT);
        $sHost = $aSite['host'];
        $iPort = (int)($aSite['port'] ?? ($aSite['scheme'] === 'https' ? 443 : 80));
        $sOtherScheme = $aSite['scheme'] === 'https' ? 'http' : 'https';
        foreach ([$aSite['scheme'] . '://' . $sHost . ':' . ($iPort + 1), $sOtherScheme . '://' . $sHost . ':' . $iPort] as $sOrigin) {
            $a = $this->http('POST', 'notifications/read', ['Cookie' => $sCookie, 'Origin' => $sOrigin]);
            $this->assertSame(403, $a['status'], $sOrigin);
            $this->assertSame('origin_not_allowed', $a['json']['code']);
        }

        $a = $this->http('POST', 'notifications/read', ['Cookie' => $sCookie, 'Origin' => BxDolApiV2Auth::origin(BX_DOL_URL_ROOT)]);
        $this->assertSame(204, $a['status'], $a['body']);
    }

    public function testActiveProfileStaysWithinTheAccount(): void
    {
        list(, $sToken) = $this->userToken();
        $oAccount = $this->bxAccount('user');
        $iForeign = $this->foreignProfileId($oAccount);

        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $a = $this->http('PUT', 'me/active-profile', $aAuth, json_encode(['profile_id' => (string)$iForeign]));
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSchema('Problem', $a['json']);

        // one's own profile: 204 with no body; GET /me then says which
        $sActive = $this->http('GET', 'me', $aAuth)['json']['active_profile_id'];
        $a = $this->http('PUT', 'me/active-profile', $aAuth, json_encode(['profile_id' => $sActive]));
        $this->assertSame(204, $a['status'], $a['body']);
        $this->assertSame('', $a['body']);
        $this->assertNull(BxDolTestPhpServer::header($a, 'content-type'));
        $this->assertSame($sActive, $this->http('GET', 'me', $aAuth)['json']['active_profile_id']);

        // another profile of the account, and back
        $aOwn = array_values(array_diff(array_map('intval', $oAccount->getProfilesIds()), [(int)$sActive]));
        if ($aOwn) {
            try {
                $a = $this->http('PUT', 'me/active-profile', $aAuth, json_encode(['profile_id' => (string)$aOwn[0]]));
                $this->assertSame(204, $a['status'], $a['body']);
                $this->assertSame('', $a['body']);
                $this->assertSame((string)$aOwn[0], $this->http('GET', 'me', $aAuth)['json']['active_profile_id']);
            }
            finally {
                $this->assertSame(204, $this->http('PUT', 'me/active-profile', $aAuth, json_encode(['profile_id' => $sActive]))['status']);
            }
        }
        $this->assertSame(404, $this->http('PUT', 'me/active-profile', $aAuth, json_encode(['profile_id' => '999999999']))['status']);
    }

    public function testPostingWhereTheViewerMayNotIsForbidden(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        // a timeline of another account the test user may not post on (friends may post on each other's)
        $iAccount = (int)$this->bxAccount('user')->id();
        $aCandidates = array_column($this->sitePeople("`account_id` <> " . $iAccount . " AND `type` <> 'system'", 20), 'id');
        // and a person made for the class, who is nobody's friend
        $aCandidates[] = $this->seedPooledPerson();
        $a = null;
        foreach ($aCandidates as $iCandidate) {
            $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test context</p>', 'context_id' => (string)$iCandidate]));
            if ($a['status'] !== 201)
                break;
            $this->_aEvents[] = (int)$a['json']['id'];
        }
        if (!$a || $a['status'] === 201)
            $this->markTestSkipped('The test user may post on every other timeline.');

        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSame('forbidden', $a['json']['code']);

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>x</p>', 'context_id' => '999999999']));
        $this->assertSame(422, $a['status']);
        $this->assertSame('context_id', $a['json']['errors'][0]['field']);
    }

    public function testFeedPagesPastHiddenEvents(): void
    {
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];

        // newest first: public, private (a guest doesn't see it), public
        $aIds = [];
        foreach (['public', 'private', 'public'] as $i => $sAudience) {
            $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test paging ' . $i . '</p>', 'audience' => $sAudience]));
            $this->assertSame(201, $a['status'], $a['body']);
            $this->_aEvents[] = (int)$a['json']['id'];
            $aIds[$sAudience . $i] = $a['json']['id'];
        }

        // one item per page: the hidden one between them must not end the list
        $aSeen = [];
        $sCursor = null;
        for ($iPage = 0; $iPage < 100; ++$iPage) {
            $a = $this->http('GET', 'profiles/' . $iProfileId . '/timeline?limit=1' . ($sCursor ? '&cursor=' . $sCursor : ''));
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Activity', $a['json']);
            $this->assertLessThanOrEqual(1, count($a['json']['items']));
            foreach ($a['json']['items'] as $aItem)
                $aSeen[] = $aItem['id'];
            if (in_array($aIds['public0'], $aSeen, true) || !($sCursor = $a['json']['next_cursor']))
                break;
        }

        $this->assertContains($aIds['public2'], $aSeen);
        $this->assertContains($aIds['public0'], $aSeen, 'paging went on past the hidden event');
        $this->assertNotContains($aIds['private1'], $aSeen);
        $this->assertSame(count($aSeen), count(array_unique($aSeen)), 'no item twice');
        $this->assertSame([$aIds['public2'], $aIds['public0']], array_slice($aSeen, 0, 2));
    }

    public function testAnonymousPostsDontShowTheirAuthor(): void
    {
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();

        $a = $this->http('POST', 'feed-posts', ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test anonymous</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $iId = (int)$a['json']['id'];
        $this->_aEvents[] = $iId;

        // the way modules store an anonymous author: a negative id (a feed post keeps its author in object_id)
        BxDolDb::getInstance()->query("UPDATE `bx_timeline_events` SET `object_id` = :o, `object_owner_id` = :o WHERE `id` = :i", ['o' => -$iProfileId, 'i' => $iId]);

        $a = $this->http('GET', 'activities/' . $iId);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Activity', $a['json']);
        $this->assertNull($a['json']['actor']);
        $this->assertNull($a['json']['owner_id'], 'the author\'s own timeline would give the author away');
        $this->assertNull($a['json']['object']['author']);
        $this->assertTrue($a['json']['object']['anonymous']);
        $this->assertStringNotContainsString('"id":"' . $iProfileId . '"', $a['body']);

        // nor does the author's timeline list it, for a guest or another member; the author still sees it there
        $sOther = $this->profileToken($this->ordinaryForeignProfileId($this->bxAccount('user')));
        foreach (['guest' => [], 'another member' => ['Authorization' => 'Bearer ' . $sOther], 'the author' => ['Authorization' => 'Bearer ' . $sToken]] as $sCase => $aHeaders) {
            $a = $this->http('GET', 'profiles/' . $iProfileId . '/timeline?limit=50', $aHeaders);
            $this->assertSame(200, $a['status'], $sCase . ': ' . $a['body']);
            $this->assertSchema('Page_Activity', $a['json']);
            $bListed = in_array((string)$iId, array_column($a['json']['items'], 'id'), true);
            $this->assertSame($sCase === 'the author', $bListed, $sCase);
        }
    }

    public function testEmbeddedProfilesHaveNoDescription(): void
    {
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();

        $a = $this->http('POST', 'feed-posts', ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test summary</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];

        $a = $this->http('GET', 'activities/' . $a['json']['id']);
        $this->assertSame(200, $a['status']);
        foreach ([$a['json']['actor'], $a['json']['object']['author']] as $aProfile) {
            // a Profile, with module and url
            $this->assertSchema('Profile', $aProfile);
            // `badges` only when the profile has any
            $this->assertSame(['id', 'kind', 'module', 'handle', 'display_name', 'about', 'status', 'avatar', 'cover', 'url', 'created_at'], array_values(array_diff(array_keys($aProfile), ['badges'])));
            $this->assertSame('', $aProfile['about'], 'no description: only GET /profiles/{id} shows it');
            $this->assertNull($aProfile['cover']);
            $this->assertMatchesRegularExpression('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/', $aProfile['created_at']);
        }

        $a = $this->http('GET', 'profiles/' . $iProfileId);
        $this->assertSame(200, $a['status']);
        $this->assertSchema('Profile', $a['json']);
        $this->assertArrayHasKey('about', $a['json'], 'the profile itself is the full Profile');
    }

    public function testFollowAndUnfollow(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $iOther = $this->unrelatedProfileId($iMe);
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $this->_aConnections[] = [$iMe, $iOther];

        $a = $this->http('POST', 'profiles/' . $iOther . '/follow');
        $this->assertSame(401, $a['status']);
        $this->assertSchema('Problem', $a['json']);

        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Connections', $a['json']);
        $this->assertFalse($a['json']['viewer']['following']);
        $this->assertTrue($a['json']['viewer']['can_follow']);
        $iFollowers = $a['json']['followers'];

        $a = $this->http('GET', 'profiles/' . $iOther . '/connections');
        $this->assertSame(200, $a['status']);
        $this->assertSchema('Connections', $a['json']);
        $this->assertNull($a['json']['viewer'], 'a guest has no relation');

        $this->assertSame(204, $this->http('POST', 'profiles/' . $iOther . '/follow', $aAuth)['status']);
        $this->assertSame(204, $this->http('POST', 'profiles/' . $iOther . '/follow', $aAuth)['status'], 'following again is not an error');

        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertTrue($a['json']['viewer']['following']);
        $this->assertFalse($a['json']['viewer']['can_follow']);
        $this->assertFalse($a['json']['viewer']['friends']);
        $this->assertSame($iFollowers + 1, $a['json']['followers']);

        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aOther);
        $this->assertNull($a['json']['viewer'], 'no relation to one\'s own profile');
        $a = $this->http('GET', 'profiles/' . $iMe . '/connections', $aOther);
        $this->assertTrue($a['json']['viewer']['followed_by']);
        $this->assertFalse($a['json']['viewer']['following']);

        // one's own following list is always open, and lists the new follow first
        $a = $this->http('GET', 'profiles/' . $iMe . '/following', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Connected', $a['json']);
        $this->assertSame((string)$iOther, $a['json']['items'][0]['profile']['id']);
        $this->assertSchema('Profile', $a['json']['items'][0]['profile']);
        $this->assertSame('', $a['json']['items'][0]['profile']['about'], 'embedded: no description');

        // whom someone follows, and who follows them, are the site's to open or not
        $a = $this->http('GET', 'profiles/' . $iMe . '/connections', $aOther);
        $bPublic = $a['json']['lists']['following'];
        $a = $this->http('GET', 'profiles/' . $iMe . '/following', $aOther);
        $this->assertSame($bPublic ? 200 : 403, $a['status'], $a['body']);
        $a = $this->http('GET', 'profiles/' . $iMe . '/following');
        $this->assertSame($bPublic ? 200 : 403, $a['status'], $a['body']);
        $this->assertSchema($bPublic ? 'Page_Connected' : 'Problem', $a['json']);

        $a = $this->http('GET', 'profiles/' . $iOther . '/followers', $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame((string)$iMe, $a['json']['items'][0]['profile']['id']);
        $a = $this->http('GET', 'profiles/' . $iOther . '/followers?limit=1', $aOther);
        $this->assertCount(1, $a['json']['items']);

        // the followed profile's own DELETE is about its own follow, so the test user's stays
        $this->assertSame(409, $this->http('DELETE', 'profiles/' . $iOther . '/follow', $aOther)['status']);
        $this->assertSame(204, $this->http('DELETE', 'profiles/' . $iMe . '/follow', $aOther)['status']);
        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertTrue($a['json']['viewer']['following']);

        $this->assertSame(204, $this->http('DELETE', 'profiles/' . $iOther . '/follow', $aAuth)['status']);
        $this->assertSame(204, $this->http('DELETE', 'profiles/' . $iOther . '/follow', $aAuth)['status'], 'not following is not an error');
        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertFalse($a['json']['viewer']['following']);
        $this->assertSame($iFollowers, $a['json']['followers']);

        $a = $this->http('POST', 'profiles/' . $iMe . '/follow', $aAuth);
        $this->assertSame(409, $a['status']);
        $this->assertSame('own_profile', $a['json']['code']);
        $this->assertSame(404, $this->http('POST', 'profiles/999999999/follow', $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'profiles/999999999/connections')['status']);
    }

    public function testFriendRequestAcceptAndEnd(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $iOther = $this->unrelatedProfileId($iMe);
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $this->_aConnections[] = [$iMe, $iOther];

        $this->assertSame(401, $this->http('POST', 'profiles/' . $iOther . '/friend')['status']);
        $this->assertSame(401, $this->http('GET', 'me/friend-requests')['status']);

        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        if (!$a['json']['viewer']['can_befriend'])
            $this->markTestSkipped('Friends are off for these profiles.');
        $iFriends = $a['json']['friends'];

        $a = $this->http('POST', 'profiles/' . $iOther . '/friend', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('FriendResult', $a['json']);
        $this->assertSame('requested', $a['json']['status']);
        $a = $this->http('POST', 'profiles/' . $iOther . '/friend', $aAuth);
        $this->assertSame('requested', $a['json']['status'], 'asking again is not an error');

        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertTrue($a['json']['viewer']['request_sent']);
        $this->assertFalse($a['json']['viewer']['can_befriend']);
        $this->assertFalse($a['json']['viewer']['friends']);

        // the request waits for the other profile, and only for it
        $a = $this->http('GET', 'me/friend-requests', $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Connected', $a['json']);
        $this->assertContains((string)$iMe, array_column(array_column($a['json']['items'], 'profile'), 'id'));
        $a = $this->http('GET', 'me/friend-requests', $aAuth);
        $this->assertNotContains((string)$iOther, array_column(array_column($a['json']['items'], 'profile'), 'id'));

        $a = $this->http('GET', 'profiles/' . $iMe . '/connections', $aOther);
        $this->assertTrue($a['json']['viewer']['request_received']);
        $this->assertTrue($a['json']['viewer']['can_befriend'], 'accepting');

        // the other profile accepts: friends, who follow each other
        $a = $this->http('POST', 'profiles/' . $iMe . '/friend', $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('friends', $a['json']['status']);

        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertTrue($a['json']['viewer']['friends']);
        $this->assertFalse($a['json']['viewer']['request_sent']);
        $this->assertTrue($a['json']['viewer']['following']);
        $this->assertTrue($a['json']['viewer']['followed_by']);
        $this->assertSame($iFriends + 1, $a['json']['friends']);
        $this->assertSame('friends', $this->http('POST', 'profiles/' . $iOther . '/friend', $aAuth)['json']['status']);

        $a = $this->http('GET', 'me/friend-requests', $aOther);
        $this->assertNotContains((string)$iMe, array_column(array_column($a['json']['items'], 'profile'), 'id'), 'accepted');

        $a = $this->http('GET', 'profiles/' . $iOther . '/friends');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Connected', $a['json']);
        $this->assertSame((string)$iMe, $a['json']['items'][0]['profile']['id'], 'newest friendship first, for guests too');

        // ending it ends the follows too
        $this->assertSame(204, $this->http('DELETE', 'profiles/' . $iOther . '/friend', $aAuth)['status']);
        $this->assertSame(204, $this->http('DELETE', 'profiles/' . $iOther . '/friend', $aAuth)['status'], 'no friendship is not an error');
        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertFalse($a['json']['viewer']['friends']);
        $this->assertFalse($a['json']['viewer']['following']);
        $this->assertSame($iFriends, $a['json']['friends']);

        // a request can be declined by the one it waits for
        $this->assertSame('requested', $this->http('POST', 'profiles/' . $iOther . '/friend', $aAuth)['json']['status']);
        $this->assertSame(204, $this->http('DELETE', 'profiles/' . $iMe . '/friend', $aOther)['status']);
        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertFalse($a['json']['viewer']['request_sent']);
        $a = $this->http('GET', 'me/friend-requests', $aOther);
        $this->assertNotContains((string)$iMe, array_column(array_column($a['json']['items'], 'profile'), 'id'), 'declined');

        $a = $this->http('POST', 'profiles/' . $iMe . '/friend', $aAuth);
        $this->assertSame(409, $a['status']);
        $this->assertSame('own_profile', $a['json']['code']);
    }

    public function testSentFriendRequests(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $iOther = $this->unrelatedProfileId($iMe);
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $this->_aConnections[] = [$iMe, $iOther];

        $this->assertSame(401, $this->http('GET', 'me/friend-requests/sent')['status'], 'guests have none');

        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        if (!$a['json']['viewer']['can_befriend'])
            $this->markTestSkipped('Friends are off for these profiles.');

        $fIds = function (array $a) {
            return array_column(array_column($a['json']['items'], 'profile'), 'id');
        };

        $this->assertSame('requested', $this->http('POST', 'profiles/' . $iOther . '/friend', $aAuth)['json']['status']);

        // the sender's list has it, newest first, with when it was sent
        $a = $this->http('GET', 'me/friend-requests/sent', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Connected', $a['json']);
        $this->assertArrayHasKey('next_cursor', $a['json']);
        $this->assertSame((string)$iOther, $a['json']['items'][0]['profile']['id']);

        // the other profile's own sent list does not: it received the request; and nothing names
        // a profile other than the viewer's, so another profile's sent requests are not readable
        $a = $this->http('GET', 'me/friend-requests/sent', $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertNotContains((string)$iMe, $fIds($a));
        $this->assertContains((string)$iMe, $fIds($this->http('GET', 'me/friend-requests', $aOther)));
        $this->assertNotContains((string)$iOther, $fIds($this->http('GET', 'me/friend-requests', $aAuth)), 'a sent request is not a received one');
        $this->assertSame(404, $this->http('GET', 'profiles/' . $iMe . '/friend-requests/sent', $aOther)['status']);

        // paging: one row a page, the cursor goes on from it
        $a = $this->http('GET', 'me/friend-requests/sent?limit=1', $aAuth);
        $this->assertCount(1, $a['json']['items']);

        // DELETE /friend cancels it: gone from both lists
        $this->assertSame(204, $this->http('DELETE', 'profiles/' . $iOther . '/friend', $aAuth)['status']);
        $this->assertNotContains((string)$iOther, $fIds($this->http('GET', 'me/friend-requests/sent', $aAuth)), 'cancelled');
        $this->assertNotContains((string)$iMe, $fIds($this->http('GET', 'me/friend-requests', $aOther)), 'cancelled for the other side too');
        $a = $this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth);
        $this->assertFalse($a['json']['viewer']['request_sent']);

        // an accepted one is a friendship, no longer a request
        $this->assertSame('requested', $this->http('POST', 'profiles/' . $iOther . '/friend', $aAuth)['json']['status']);
        $this->assertSame('friends', $this->http('POST', 'profiles/' . $iMe . '/friend', $aOther)['json']['status']);
        $this->assertNotContains((string)$iOther, $fIds($this->http('GET', 'me/friend-requests/sent', $aAuth)), 'accepted');
        $this->assertNotContains((string)$iMe, $fIds($this->http('GET', 'me/friend-requests/sent', $aOther)), 'the accepting side sent nothing');
    }

    public function testGroupsHaveNoFriends(): void
    {
        $this->requireModule('bx_groups');
        list(, $sToken) = $this->userToken();
        $iGroup = $this->seedAnyPublicGroup();

        $a = $this->http('POST', 'profiles/' . $iGroup . '/friend', ['Authorization' => 'Bearer ' . $sToken]);
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSame('friends_unavailable', $a['json']['code']);

        $a = $this->http('GET', 'profiles/' . $iGroup . '/connections', ['Authorization' => 'Bearer ' . $sToken]);
        if ($a['status'] === 200) {
            $this->assertSchema('Connections', $a['json']);
            $this->assertFalse($a['json']['viewer']['can_befriend']);
            $this->assertFalse($a['json']['lists']['friends']);
        }
    }

    public function testFollowingListsPeopleNotGroups(): void
    {
        $this->requireModule('bx_groups');
        list($iMe, $sToken) = $this->userToken();
        $iOther = $this->unrelatedProfileId($iMe);
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $iGroup = $this->seedAnyPublicGroup();

        // joining a group follows it; a secret group's members are not for others to learn
        $oFollows = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        if (!$oFollows->isConnected($iMe, $iGroup)) {
            $this->assertNotFalse($oFollows->addConnection($iMe, $iGroup));
            $this->_aConnections[] = [$iMe, $iGroup];
        }

        // the persons module can make whom a person follows public
        $sOption = BxDolProfile::getInstance($iMe)->getModule() === 'bx_persons' ? 'bx_persons_public_subscriptions' : null;
        $sWas = $sOption ? getParam($sOption) : null;
        if ($sOption)
            setParam($sOption, 'on');
        try {
            foreach (['own' => $aAuth, 'member' => $aOther, 'guest' => []] as $sWho => $aHeaders) {
                $a = $this->http('GET', 'profiles/' . $iMe . '/connections', $aHeaders);
                $this->assertSame(200, $a['status'], $a['body']);
                if ($sWho === 'own' || $sOption)
                    $this->assertTrue($a['json']['lists']['following'], $sWho);
                if (!$a['json']['lists']['following'])
                    continue;
                $iCount = $a['json']['following'];

                $a = $this->http('GET', 'profiles/' . $iMe . '/following?limit=100', $aHeaders);
                $this->assertSame(200, $a['status'], $a['body']);
                $this->assertSchema('Page_Connected', $a['json']);
                $aIds = array_column(array_column($a['json']['items'], 'profile'), 'id');
                $this->assertNotContains((string)$iGroup, $aIds, $sWho . ': groups followed are not listed');
                $this->assertSame([], array_diff(array_column(array_column($a['json']['items'], 'profile'), 'kind'), ['person', 'organization']), $sWho);
                if ($a['json']['next_cursor'] === null)
                    $this->assertCount($iCount, $a['json']['items'], $sWho . ': the count is of the same list');
            }
        }
        finally {
            if ($sOption)
                setParam($sOption, $sWas);
        }
    }

    public function testProfileByHandle(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $a = $this->http('GET', 'profiles/' . $iMe, ['Authorization' => 'Bearer ' . $sToken]);
        $this->assertSame(200, $a['status'], $a['body']);
        $sHandle = $a['json']['handle'];
        if ($sHandle === null)
            $this->markTestSkipped('The site has no SEO links.');

        $a = $this->http('GET', 'profiles/by-handle/' . rawurlencode(mb_strtoupper($sHandle)));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Profile', $a['json']);
        $this->assertSame((string)$iMe, $a['json']['id']);
        $this->assertSame($sHandle, $a['json']['handle']);

        $a = $this->http('GET', 'profiles/by-handle/no-such-handle-' . bin2hex(random_bytes(4)));
        $this->assertSame(404, $a['status']);
        $this->assertSchema('Problem', $a['json']);
    }

    public function testUpdateProfile(): void
    {
        $this->requireModule('bx_persons');
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $oProfile = BxDolProfile::getInstance($iProfileId);
        $this->assertSame('bx_persons', $oProfile->getModule(), 'the test user acts as a person');
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        $iOther = $this->ordinaryForeignProfileId($this->bxAccount('user'));
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther), 'Content-Type' => 'application/json'];

        $oDb = BxDolDb::getInstance();
        $oPersons = BxDolModule::getInstance('bx_persons');
        $CNF = &$oPersons->_oConfig->CNF;
        $iContent = (int)$oProfile->getContentId();
        $aBefore = $oPersons->_oDb->getContentInfoById($iContent, true);
        $sStatus = $oProfile->getStatus();
        $iEventsFrom = (int)$oDb->getOne("SELECT IFNULL(MAX(`id`), 0) FROM `bx_timeline_events`");
        $iFilesFrom = (int)$oDb->getOne("SELECT IFNULL(MAX(`id`), 0) FROM `bx_persons_pictures`");

        try {
            $sBody = json_encode(['display_name' => 'ApiV2Test Name']);
            $a = $this->http('PATCH', 'profiles/' . $iProfileId, ['Content-Type' => 'application/json'], $sBody);
            $this->assertSame(401, $a['status'], 'a guest edits nothing');
            $this->assertSchema('Problem', $a['json']);
            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aOther, $sBody);
            $this->assertSame(403, $a['status'], 'another member may not edit it: ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
            $a = $this->http('PATCH', 'profiles/' . $iOther, $aJson, $sBody);
            $this->assertSame(403, $a['status'], 'nor the test user someone else\'s: ' . $a['body']);
            $this->assertSame(404, $this->http('PATCH', 'profiles/999999999', $aJson, $sBody)['status']);
            $this->assertSame($aBefore[$CNF['FIELD_NAME']], $oPersons->_oDb->getContentInfoById($iContent, true)[$CNF['FIELD_NAME']], 'nothing changed');

            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, '{}');
            $this->assertSame(422, $a['status'], 'nothing to change');
            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['handle' => 'x']));
            $this->assertSame(422, $a['status'], 'UNA has no handles to set');
            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['display_name' => '@someone']));
            $this->assertSame(422, $a['status'], 'the form\'s own name check: ' . $a['body']);
            $this->assertSame('display_name', $a['json']['errors'][0]['field']);

            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['display_name' => ' ApiV2Test Name ', 'about' => "Line one\nLine <two>"]));
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Profile', $a['json']);
            $this->assertSame('ApiV2Test Name', $a['json']['display_name']);
            $this->assertSame("Line one\nLine <two>", $a['json']['about']);
            $aNow = $oPersons->_oDb->getContentInfoById($iContent, true);
            $this->assertSame('<p>Line one</p><p>Line &lt;two&gt;</p>', $aNow[$CNF['FIELD_TEXT']], 'plain text, kept as written');
            $a = $this->http('GET', 'profiles/' . $iProfileId, $aAuth);
            $this->assertSame('ApiV2Test Name', $a['json']['display_name']);
            // the same again changes nothing and is fine
            $this->assertSame(200, $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['display_name' => 'ApiV2Test Name']))['status']);

            // photos for the picture and the cover
            $aA = $this->upload($aAuth, 'a.png', self::png(8, 8), ['purpose' => 'profile']);
            $this->assertSame(201, $aA['status'], $aA['body']);
            $this->assertSchema('Media', $aA['json']);
            $aB = $this->upload($aAuth, 'b.png', self::png(16, 9), ['purpose' => 'profile']);
            $this->assertSame(201, $aB['status'], $aB['body']);
            $this->assertSame(401, $this->upload([], 'c.png', self::png(2, 2), ['purpose' => 'profile'])['status']);

            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['avatar_id' => '999999999999']));
            $this->assertSame(422, $a['status'], 'not an upload');
            $this->assertSame('avatar_id', $a['json']['errors'][0]['field']);
            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aOther, json_encode(['avatar_id' => $aA['json']['id']]));
            $this->assertSame(403, $a['status'], 'another member may not use it here either');

            // another account's upload on one's own profile: not one of the account's
            $aMila = $this->upload(['Authorization' => $aOther['Authorization']], 'm.png', self::png(5, 5), ['purpose' => 'profile']);
            $this->assertSame(201, $aMila['status'], $aMila['body']);
            try {
                $sPictureWas = (string)$oPersons->_oDb->getContentInfoById($iContent, true)[$CNF['FIELD_PICTURE']];
                $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['avatar_id' => $aMila['json']['id']]));
                $this->assertSame(422, $a['status'], 'someone else\'s photo: ' . $a['body']);
                $this->assertSchema('Problem', $a['json']);
                $this->assertSame('avatar_id', $a['json']['errors'][0]['field']);
                $this->assertSame($sPictureWas, (string)$oPersons->_oDb->getContentInfoById($iContent, true)[$CNF['FIELD_PICTURE']], 'the picture is unchanged');
            } finally {
                $this->http('DELETE', 'uploads/' . $aMila['json']['id'], ['Authorization' => $aOther['Authorization']]);
            }

            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['avatar_id' => $aA['json']['id'], 'cover_id' => $aB['json']['id']]));
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Profile', $a['json']);
            $this->assertNotNull($a['json']['avatar']);
            $this->assertNotNull($a['json']['avatar_large'], 'the large picture comes with the small one');
            $this->assertNotSame($a['json']['avatar'], $a['json']['avatar_large']);
            $this->assertNotNull($a['json']['cover']);
            $aNow = $oPersons->_oDb->getContentInfoById($iContent, true);
            $this->assertSame((int)$aA['json']['id'] & 0xFFFFFFFF, (int)$aNow[$CNF['FIELD_PICTURE']]);
            $this->assertSame((int)$aB['json']['id'] & 0xFFFFFFFF, (int)$aNow[$CNF['FIELD_COVER']]);
            $a = $this->http('DELETE', 'uploads/' . $aB['json']['id'], $aAuth);
            $this->assertSame(409, $a['status'], 'the profile has it now');
            $iFileA = (int)$aA['json']['id'] & 0xFFFFFFFF;
            $oPictures = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
            $aPictureEvents = $oDb->getColumn("SELECT `id` FROM `bx_timeline_events` WHERE `id` > :i AND `type` = 'bx_persons' AND `object_id` = :f", ['i' => $iEventsFrom, 'f' => $iFileA]);
            $this->assertNotEmpty($aPictureEvents, 'setting the picture posted "changed picture"');

            // another picture: the one before stays, and so does its "changed picture" post
            $aC = $this->upload($aAuth, 'c.png', self::png(6, 6), ['purpose' => 'profile']);
            $this->assertSame(201, $aC['status'], $aC['body']);
            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['avatar_id' => $aC['json']['id']]));
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertNotEmpty($oPictures->getFile($iFileA), 'the earlier picture is kept');
            $oTimeline = BxDolModule::getInstance('bx_timeline');
            foreach ($aPictureEvents as $iEvent) {
                $aEvent = $oTimeline->_oDb->getEvents(['browse' => 'id', 'value' => (int)$iEvent]);
                $this->assertNotFalse($oPersons->serviceGetTimelineProfilePicture($aEvent), 'the earlier "changed picture" post still shows');
            }

            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['avatar_id' => null, 'cover_id' => null]));
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertNull($a['json']['avatar']);
            $this->assertNull($a['json']['avatar_large'], 'hidden exactly when the small one is');
            $this->assertNull($a['json']['cover']);

            // an about with links written on the site: plain text would lose them
            $oPersons->_oDb->updateEntriesBy([$CNF['FIELD_TEXT'] => '<p>See <a href="https://example.com">this</a></p>'], [$CNF['FIELD_ID'] => $iContent]);
            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['about' => 'Something else']));
            $this->assertSame(409, $a['status'], $a['body']);
            $this->assertSame('formatted_text', $a['json']['code']);
            $this->assertSame(200, $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['display_name' => 'ApiV2Test Name 2']))['status'], 'the name alone is fine');
            $this->assertNotEmpty($oPictures->getFile($iFileA), 'a picture taken off is kept too');

            // a description longer than Profile.about carries: the client has only its start
            $sLong = str_repeat('<p>' . str_repeat('Long text ', 50) . '</p>', 3);
            $oPersons->_oDb->updateEntriesBy([$CNF['FIELD_TEXT'] => $sLong], [$CNF['FIELD_ID'] => $iContent]);
            $a = $this->http('GET', 'profiles/' . $iProfileId, $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Profile', $a['json']);
            $this->assertTrue($a['json']['about_truncated']);
            $this->assertLessThanOrEqual(BxDolApiV2Map::ABOUT_LENGTH, mb_strlen($a['json']['about']));
            $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['about' => $a['json']['about'] . ' fixed']));
            $this->assertSame(409, $a['status'], $a['body']);
            $this->assertSchema('Problem', $a['json']);
            $this->assertSame('too_long', $a['json']['code']);
            $this->assertSame($sLong, $oPersons->_oDb->getContentInfoById($iContent, true)[$CNF['FIELD_TEXT']], 'nothing of it is lost');

            // a last name kept apart: the name the site shows is two fields, not one to set
            if (!empty($CNF['FIELD_LAST_NAME'])) {
                $oPersons->_oDb->updateEntriesBy([$CNF['FIELD_LAST_NAME'] => 'Lastname'], [$CNF['FIELD_ID'] => $iContent]);
                bx_content_cache_del_by_prefix('sprofile_unit_vars:' . $iProfileId . ':');
                $a = $this->http('GET', 'profiles/' . $iProfileId, $aAuth);
                $sShown = $a['json']['display_name'];
                $this->assertSame('ApiV2Test Name 2 Lastname', $sShown);
                $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['display_name' => 'Other Name']));
                $this->assertSame(422, $a['status'], $a['body']);
                $this->assertSchema('Problem', $a['json']);
                $this->assertSame('not_editable', $a['json']['errors'][0]['code']);
                $a = $this->http('PATCH', 'profiles/' . $iProfileId, $aJson, json_encode(['display_name' => $sShown]));
                $this->assertSame(200, $a['status'], 'the name as shown is no change: ' . $a['body']);
                $this->assertSame('ApiV2Test Name 2', $oPersons->_oDb->getContentInfoById($iContent, true)[$CNF['FIELD_NAME']], 'the first name is not rewritten');
            }
        } finally {
            // back as it was: the fields, the files this test stored and the "changed picture" posts
            $oPersons->_oDb->updateEntriesBy(array_intersect_key($aBefore, array_flip(array_filter([$CNF['FIELD_NAME'], $CNF['FIELD_LAST_NAME'] ?? '', $CNF['FIELD_TEXT'], $CNF['FIELD_PICTURE'], $CNF['FIELD_COVER']]))), [$CNF['FIELD_ID'] => $iContent]);
            $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
            foreach ($oDb->getColumn("SELECT `id` FROM `bx_persons_pictures` WHERE `id` > :i AND `profile_id` = :p", ['i' => $iFilesFrom, 'p' => $iProfileId]) as $iFile)
                $oStorage->deleteFile((int)$iFile);
            $oTimeline = BxDolModule::getInstance('bx_timeline');
            foreach ($oDb->getColumn("SELECT `id` FROM `bx_timeline_events` WHERE `id` > :i AND `type` = 'bx_persons' AND `owner_id` = :p", ['i' => $iEventsFrom, 'p' => $iProfileId]) as $iEvent)
                if (($aEvent = $oTimeline->_oDb->getEvents(['browse' => 'id', 'value' => (int)$iEvent])))
                    $oTimeline->deleteEvent($aEvent);
            $oDb->cleanMemoryAll();
            // the "changed picture" check above read the profile's name then (kept per process)
            BxDolService::cleanMemoryCache();
            if (BxDolProfile::getInstance($iProfileId)->getStatus() !== $sStatus)
                BxDolProfileQuery::getInstance()->changeStatus($iProfileId, $sStatus);
            bx_content_cache_del_by_prefix('sprofile_unit_vars:' . $iProfileId . ':');
        }
    }

    public function testMediaCarriesItsSize(): void
    {
        $this->requireModule('bx_timeline');
        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is needed to make a test photo.');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];

        $a = $this->http('POST', 'feed-posts', $aAuth + ['Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test photo</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $iId = (int)$a['json']['id'];
        $this->_aEvents[] = $iId;
        $this->assertSame([], $a['json']['object']['media']);

        // a photo attached the way the post form attaches one: a file in the timeline's photo
        // storage, linked to the event (deleting the event in tearDown deletes the file)
        $oTimeline = BxDolModule::getInstance('bx_timeline');
        $sPath = sys_get_temp_dir() . '/apiv2-' . bin2hex(random_bytes(6)) . '.png';
        imagepng(imagecreatetruecolor(40, 30), $sPath);
        $oStorage = BxDolStorage::getObjectInstance($oTimeline->_oConfig->getObject('storage_photos'));
        $iFileId = (int)$oStorage->storeFileFromPath($sPath, false, $iProfileId, $iId);
        @unlink($sPath);
        $this->assertGreaterThan(0, $iFileId, 'the photo was stored');
        $oStorage->afterUploadCleanup($iFileId, $iProfileId, $iId);
        $this->assertTrue($oTimeline->_oDb->saveMedia($oTimeline->_oConfig->CNF['FIELD_PHOTO'], $iId, $iFileId));

        $a = $this->http('GET', 'activities/' . $iId, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Activity', $a['json']);
        $this->assertCount(1, $a['json']['object']['media'], $a['body']);
        $aMedia = $a['json']['object']['media'][0];
        $this->assertSchema('Media', $aMedia);
        $this->assertSame('image', $aMedia['kind']);
        $this->assertSame([40, 30], [$aMedia['width'], $aMedia['height']], 'the size of the original');
        $this->assertSame('image/png', $aMedia['mime']);
        $this->assertGreaterThan(0, $aMedia['size']);
        $this->assertNotSame('', $aMedia['url'], 'the original');
        $this->assertSame($aMedia['url'], $aMedia['download_url']);
        $this->assertNull($aMedia['duration_ms']);
        $this->assertArrayNotHasKey('thumb_url', $aMedia);
        $this->assertArrayNotHasKey('large_url', $aMedia);
        $this->assertSame(['thumb', 'medium', 'large'], array_keys($aMedia['variants']));
        foreach ($aMedia['variants'] as $sName => $aVariant) {
            $this->assertSchema('Variant', $aVariant);
            $this->assertSame([40, 30], [$aVariant['width'], $aVariant['height']], $sName . ': a small photo is not enlarged');
        }

        // and the same in a feed page
        $a = $this->http('GET', 'profiles/' . $iProfileId . '/timeline?limit=10', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Activity', $a['json']);
        $aItems = array_values(array_filter($a['json']['items'], function ($aItem) use ($iId) { return $aItem['id'] === (string)$iId; }));
        $this->assertCount(1, $aItems);
        $this->assertSame([40, 30], [$aItems[0]['object']['media'][0]['width'], $aItems[0]['object']['media'][0]['height']]);
    }

    /**
     * A post's private photo, as the post form stores them: the owner gets the original with a
     * token that is reused for a while, so repeated GETs have the same body, ETag and version
     * and write no token rows; everyone else gets the largest copy as `url` and no token at all.
     */
    public function testPrivatePhotosKeepTheirLinksAndEtag(): void
    {
        $this->requireModule('bx_timeline');
        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is needed to make a test photo.');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($this->ordinaryForeignProfileId($this->bxAccount('user')))];

        $a = $this->http('POST', 'feed-posts', $aAuth + ['Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test private photo</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $iId = (int)$a['json']['id'];
        $this->_aEvents[] = $iId;

        $oTimeline = BxDolModule::getInstance('bx_timeline');
        $sStorage = $oTimeline->_oConfig->getObject('storage_photos');
        $sPath = sys_get_temp_dir() . '/apiv2-' . bin2hex(random_bytes(6)) . '.png';
        imagepng(imagecreatetruecolor(40, 30), $sPath);
        $oStorage = BxDolStorage::getObjectInstance($sStorage);
        $iFileId = (int)$oStorage->storeFileFromPath($sPath, true, $iProfileId, $iId);
        @unlink($sPath);
        $this->assertGreaterThan(0, $iFileId, 'the photo was stored');
        $oStorage->afterUploadCleanup($iFileId, $iProfileId, $iId);
        $this->assertTrue($oTimeline->_oDb->saveMedia($oTimeline->_oConfig->CNF['FIELD_PHOTO'], $iId, $iFileId));

        $oDb = BxDolDb::getInstance();
        $fTokens = function () use ($oDb, $iFileId, $sStorage) {
            return (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_storage_tokens` WHERE `id` = :id AND `object` = :o", ['id' => $iFileId, 'o' => $sStorage]);
        };

        // the owner: the original, with a token, the same one again
        $a = $this->http('GET', 'activities/' . $iId, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $aMedia = $a['json']['object']['media'][0] ?? null;
        $this->assertNotNull($aMedia, $a['body']);
        $this->assertMatchesRegularExpression('/[?&]t=[0-9a-f]{32}/', $aMedia['url'], 'the owner gets the original');
        $iTokens = $fTokens();
        $sEtag = (string)BxDolTestPhpServer::header($a, 'etag');
        sleep(1);
        $aAgain = $this->http('GET', 'activities/' . $iId, $aAuth);
        $this->assertSame($a['body'], $aAgain['body'], 'a second later, the same body');
        $this->assertSame($sEtag, BxDolTestPhpServer::header($aAgain, 'etag'));
        $this->assertSame($a['json']['version'], $aAgain['json']['version']);
        $this->assertSame(304, $this->http('GET', 'activities/' . $iId, $aAuth + ['If-None-Match' => $sEtag])['status']);
        $this->assertSame($iTokens, $fTokens(), 'no token row per GET');

        // a guest and another member: no original, so no token; the largest copy instead
        foreach (['a guest' => [], 'another member' => $aOther] as $sWho => $aHeaders) {
            $a = $this->http('GET', 'activities/' . $iId, $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            $aMedia = $a['json']['object']['media'][0];
            $this->assertSchema('Media', $aMedia);
            $this->assertDoesNotMatchRegularExpression('/[?&]t=[0-9a-f]{32}/', $aMedia['url'], $sWho . ': not the original');
            $this->assertSame($aMedia['variants']['large']['url'], $aMedia['url'], $sWho . ': the largest copy');
            $this->assertSame($aMedia['url'], $aMedia['download_url']);
            // the first look counts as a view (stats.views is in the body); from then on the same answer
            $a = $this->http('GET', 'activities/' . $iId, $aHeaders);
            $aAgain = $this->http('GET', 'activities/' . $iId, $aHeaders + ['If-None-Match' => (string)BxDolTestPhpServer::header($a, 'etag')]);
            $this->assertSame(304, $aAgain['status'], $sWho . ': the same answer again');
        }
        $this->assertSame($iTokens, $fTokens(), 'nobody else made a token');

        // and in a feed page, which polls with If-None-Match
        $a = $this->http('GET', 'profiles/' . $iProfileId . '/timeline?limit=5');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(304, $this->http('GET', 'profiles/' . $iProfileId . '/timeline?limit=5', ['If-None-Match' => (string)BxDolTestPhpServer::header($a, 'etag')])['status']);
    }

    public function testUploadsGoIntoPosts(): void
    {
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($this->ordinaryForeignProfileId($this->bxAccount('user')))];

        $this->assertSame(401, $this->upload([], 'a.png', self::png(4, 3))['status'], 'a guest uploads nothing');

        $a = $this->upload($aAuth, 'a.png', self::png(4, 3));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Media', $a['json']);
        $sUpload = $a['json']['id'];
        $this->assertSame('image', $a['json']['kind']);
        $this->assertSame('ready', $a['json']['state']);
        $this->assertSame('image/png', $a['json']['mime']);
        $this->assertSame([4, 3], [$a['json']['width'], $a['json']['height']]);
        $this->assertSame('a.png', $a['json']['original_name']);
        $this->assertSame(strlen(self::png(4, 3)), $a['json']['size']);
        $this->assertSame(['thumb', 'medium', 'large'], array_keys($a['json']['variants']));
        $this->assertStringEndsWith('/uploads/' . $sUpload, BxDolTestPhpServer::header($a, 'location'));
        $iFileId = (int)$sUpload & 0xFFFFFFFF;
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_storage_ghosts` WHERE `object` = 'bx_timeline_photos' AND `id` = :i AND `profile_id` = :p AND `content_id` = 0", ['i' => $iFileId, 'p' => $iProfileId]), 'a ghost of the viewer, as the site\'s uploader leaves');

        $a = $this->http('GET', 'uploads/' . $sUpload, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Media', $a['json']);
        $this->assertSame(404, $this->http('GET', 'uploads/' . $sUpload, $aOther)['status'], 'another member\'s upload is not there for them');
        $this->assertSame(401, $this->http('GET', 'uploads/' . $sUpload)['status']);

        // someone else's upload, an unknown id: 422, and nothing is posted
        $a = $this->http('POST', 'feed-posts', $aOther + ['Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test foreign</p>', 'media_ids' => [$sUpload]]));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('media_ids[0]', $a['json']['errors'][0]['field']);
        $this->assertSame('not_found', $a['json']['errors'][0]['code']);
        $a = $this->http('POST', 'feed-posts', $aJson, json_encode(['body_html' => '<p>ApiV2Test unknown</p>', 'media_ids' => ['999999999999']]));
        $this->assertSame(422, $a['status'], $a['body']);
        $a = $this->http('POST', 'feed-posts', $aJson, json_encode(['media_ids' => []]));
        $this->assertSame(422, $a['status'], 'neither text nor media');
        $this->assertSame('body_html', $a['json']['errors'][0]['field']);

        // a post of the photo alone
        $a = $this->http('POST', 'feed-posts', $aJson, json_encode(['media_ids' => [$sUpload], 'audience' => 'members']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Activity', $a['json']);
        $iEvent = (int)$a['json']['id'];
        $this->_aEvents[] = $iEvent;
        $this->assertCount(1, $a['json']['object']['media'], $a['body']);
        $this->assertSame($sUpload, $a['json']['object']['media'][0]['id'], 'the post shows the upload by its id');
        $this->assertSame([4, 3], [$a['json']['object']['media'][0]['width'], $a['json']['object']['media'][0]['height']]);

        $a = $this->http('POST', 'feed-posts', $aJson, json_encode(['body_html' => '<p>ApiV2Test again</p>', 'media_ids' => [$sUpload]]));
        $this->assertSame(422, $a['status'], 'a post took it already');
        $a = $this->http('DELETE', 'uploads/' . $sUpload, $aAuth);
        $this->assertSame(409, $a['status'], $a['body']);
        $this->assertSame('attached', $a['json']['code']);

        // deleting the post deletes its photo, as on the site
        $this->assertSame(204, $this->http('DELETE', 'activities/' . $iEvent, $aAuth)['status']);
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_timeline_photos` WHERE `id` = :i", ['i' => $iFileId]), 'the file went with the post');
        $this->assertSame(404, $this->http('GET', 'uploads/' . $sUpload, $aAuth)['status']);

        // an upload taken off a post being written
        $a = $this->upload($aAuth, 'b.png', self::png(2, 2));
        $this->assertSame(201, $a['status'], $a['body']);
        $sUpload = $a['json']['id'];
        $this->assertSame(404, $this->http('DELETE', 'uploads/' . $sUpload, $aOther)['status']);
        $this->assertSame(204, $this->http('DELETE', 'uploads/' . $sUpload, $aAuth)['status']);
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_timeline_photos` WHERE `id` = :i", ['i' => (int)$sUpload & 0xFFFFFFFF]));
    }

    public function testUploadsTheSiteRefuses(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];

        $a = $this->upload($aAuth, 'notes.txt', 'plain text');
        $this->assertSame(415, $a['status'], $a['body']);
        $this->assertSame('unsupported_media_type', $a['json']['code']);

        $a = $this->upload($aAuth, 'fake.png', 'not a picture');
        $this->assertSame(415, $a['status'], 'the content must be what the name says');

        $a = $this->upload($aAuth, 'a.png', self::png(2, 2), ['alt' => 'x']);
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('unknown_field', $a['json']['errors'][0]['code']);

        $a = $this->http('POST', 'uploads', $aAuth + ['Content-Type' => 'application/json'], '{}');
        $this->assertSame(415, $a['status'], 'multipart only');

        // the storage's own size limit (the HTTP server reads it from the database)
        $oDb = BxDolDb::getInstance();
        $iWas = (int)$oDb->getOne("SELECT `max_file_size` FROM `sys_objects_storage` WHERE `object` = 'bx_timeline_photos'");
        $oDb->query("UPDATE `sys_objects_storage` SET `max_file_size` = 10 WHERE `object` = 'bx_timeline_photos'");
        $oDb->cleanCache('sys_objects_storage_bx_timeline_photos');
        try {
            $a = $this->upload($aAuth, 'big.png', self::png(40, 40));
            $this->assertSame(413, $a['status'], $a['body']);
            $this->assertSame('file_too_big', $a['json']['code']);
        }
        finally {
            $oDb->query("UPDATE `sys_objects_storage` SET `max_file_size` = :s WHERE `object` = 'bx_timeline_photos'", ['s' => $iWas]);
            $oDb->cleanCache('sys_objects_storage_bx_timeline_photos');
        }
    }

    public function testEditFeedPost(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($this->ordinaryForeignProfileId($this->bxAccount('user'))), 'Content-Type' => 'application/json'];

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test before</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sId = $a['json']['id'];
        $this->_aEvents[] = (int)$sId;
        $this->assertTrue($a['json']['object']['viewer']['can_edit']);

        $a = $this->http('PATCH', 'feed-posts/' . $sId, $aAuth, json_encode(['body_html' => '<p>ApiV2Test after</p>', 'audience' => 'friends']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Activity', $a['json']);
        $this->assertSame('ApiV2Test after', $a['json']['object']['card']['text'], 'the answer is the post as it is now');
        $this->assertSame('friends', $a['json']['object']['audience']);

        $a = $this->http('PATCH', 'feed-posts/' . $sId, $aAuth, json_encode(['audience' => 'public']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('ApiV2Test after', $a['json']['object']['card']['text'], 'the text stays');
        $this->assertSame('public', $a['json']['object']['audience']);

        $a = $this->http('PATCH', 'feed-posts/' . $sId, $aOther, json_encode(['body_html' => '<p>ApiV2Test not mine</p>']));
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSame('forbidden', $a['json']['code']);
        $a = $this->http('GET', 'activities/' . $sId, $aOther);
        $this->assertSame(200, $a['status']);
        $this->assertFalse($a['json']['object']['viewer']['can_edit']);
        $this->assertSame('ApiV2Test after', $a['json']['object']['card']['text']);

        $this->assertSame(401, $this->http('PATCH', 'feed-posts/' . $sId, ['Content-Type' => 'application/json'], json_encode(['audience' => 'members']))['status']);
        $a = $this->http('PATCH', 'feed-posts/' . $sId, $aAuth, '{}');
        $this->assertSame(422, $a['status']);
        $a = $this->http('PATCH', 'feed-posts/' . $sId, $aAuth, json_encode(['media_ids' => []]));
        $this->assertSame(422, $a['status']);
        $this->assertSame('unknown_field', $a['json']['errors'][0]['code']);
        $this->assertSame(404, $this->http('PATCH', 'feed-posts/999999999', $aAuth, json_encode(['audience' => 'members']))['status']);
    }

    /**
     * An edit of a post's text or audience keeps what the edit form would otherwise drop when it
     * is not given: the photos (the form unlinks media it is not handed) and the location (the
     * form reads it from the request, which an API edit does not carry).
     */
    public function testEditFeedPostKeepsMediaAndLocation(): void
    {
        $this->requireModule('bx_timeline');
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        $a = $this->upload($aAuth, 'kept.png', self::png(4, 3));
        $this->assertSame(201, $a['status'], $a['body']);
        $sUpload = $a['json']['id'];
        $iFileId = (int)$sUpload & 0xFFFFFFFF;

        $a = $this->http('POST', 'feed-posts', $aJson, json_encode(['body_html' => '<p>ApiV2Test photo before</p>', 'media_ids' => [$sUpload]]));
        $this->assertSame(201, $a['status'], $a['body']);
        $iEvent = (int)$a['json']['id'];
        $this->_aEvents[] = $iEvent;
        $this->assertCount(1, $a['json']['object']['media']);

        // a location, as the site's post form stores it
        $oTimeline = BxDolModule::getInstance('bx_timeline');
        $oMetatags = BxDolMetatags::getObjectInstance($oTimeline->_oConfig->getObject('metatags'));
        $bLocations = $oMetatags && $oMetatags->locationsIsEnabled();
        if ($bLocations)
            $oMetatags->locationsAdd($iEvent, '51.5', '-0.12', 'GB', '', 'London');

        $a = $this->http('PATCH', 'feed-posts/' . $iEvent, $aJson, json_encode(['body_html' => '<p>ApiV2Test photo after</p>', 'audience' => 'members']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Activity', $a['json']);
        $this->assertSame('ApiV2Test photo after', $a['json']['object']['card']['text']);
        $this->assertSame('members', $a['json']['object']['audience']);
        $this->assertCount(1, $a['json']['object']['media'], 'the photo stays: ' . $a['body']);
        $this->assertSame($sUpload, $a['json']['object']['media'][0]['id']);
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_timeline_photos` WHERE `id` = :i", ['i' => $iFileId]), 'the file is still there');

        $a = $this->http('PATCH', 'feed-posts/' . $iEvent, $aJson, json_encode(['audience' => 'public']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertCount(1, $a['json']['object']['media'], 'an audience change keeps the photo too');

        if ($bLocations) {
            $aLocation = BxDolDb::getInstance()->getRow("SELECT `lat`, `lng`, `country`, `city` FROM `bx_timeline_meta_locations` WHERE `object_id` = :i", ['i' => $iEvent]);
            $this->assertNotEmpty($aLocation, 'the location stays through the edits');
            $this->assertSame(['GB', 'London'], [$aLocation['country'], $aLocation['city']]);
            $this->assertEqualsWithDelta(51.5, (float)$aLocation['lat'], 0.001);
        }
    }

    public function testNotificationsPagePastHiddenOnes(): void
    {
        $this->requireModule('bx_notifications');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];

        $a = $this->http('GET', 'notifications?limit=2', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        if (!$a['json']['items']) {
            $this->seedNotification($iProfileId);
            $a = $this->http('GET', 'notifications?limit=2', $aAuth);
            $this->assertNotEmpty($a['json']['items'], 'a follow made a notification: ' . $a['body']);
        }
        $aNewest = array_column($a['json']['items'], 'id');

        // newer notifications with nothing to show (processed, no content): the checks leave them out
        $oDb = BxDolDb::getInstance();
        $aRow = $oDb->getRow("SELECT * FROM `bx_notifications_events` WHERE `id` = :i", ['i' => (int)$aNewest[0]]);
        unset($aRow['id']);
        $aRow['object_id'] = '999999999';
        $aRow['content'] = '';
        $aRow['processed'] = 1;
        $aRow['source'] = '';
        $aRow['date'] = time();
        for ($i = 0; $i < 8; ++$i) {
            $oDb->query("INSERT INTO `bx_notifications_events` SET " . $oDb->arrayToSQL($aRow));
            $this->_aNotifications[] = (int)$oDb->lastId();
        }

        $aSeen = [];
        $sCursor = null;
        for ($iPage = 0; $iPage < 20 && count($aSeen) < count($aNewest); ++$iPage) {
            $a = $this->http('GET', 'notifications?limit=1' . ($sCursor ? '&cursor=' . $sCursor : ''), $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Notification', $a['json']);
            foreach ($a['json']['items'] as $aItem)
                $aSeen[] = $aItem['id'];
            if (!($sCursor = $a['json']['next_cursor']))
                break;
        }

        foreach ($this->_aNotifications as $iHidden)
            $this->assertNotContains((string)$iHidden, $aSeen);
        $this->assertSame($aNewest, array_slice($aSeen, 0, count($aNewest)), 'the hidden ones did not end the list');
    }

    public function testUnreadNotificationsPastAReadOneDatedLater(): void
    {
        $this->requireModule('bx_notifications');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];

        $a = $this->http('GET', 'notifications?limit=1', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        if (!$a['json']['items']) {
            $this->seedNotification($iProfileId);
            $a = $this->http('GET', 'notifications?limit=1', $aAuth);
            $this->assertNotEmpty($a['json']['items'], 'a follow made a notification: ' . $a['body']);
        }

        // two copies of the newest one: the older (read: the marker is on it) dated after the newer (unread)
        $oDb = BxDolDb::getInstance();
        $aRow = $oDb->getRow("SELECT * FROM `bx_notifications_events` WHERE `id` = :i", ['i' => (int)$a['json']['items'][0]['id']]);
        unset($aRow['id']);
        $aRow['source'] = '';
        $aIds = [];
        foreach ([time(), time() - 60] as $iDate) {
            $aRow['date'] = $iDate;
            $oDb->query("INSERT INTO `bx_notifications_events` SET " . $oDb->arrayToSQL($aRow));
            $this->_aNotifications[] = $aIds[] = (int)$oDb->lastId();
        }
        list($iRead, $iUnread) = $aIds;

        $oNtfs = BxDolModule::getInstance('bx_notifications');
        $iMarker = $oNtfs->_oDb->getLastRead($iProfileId);
        try {
            $oNtfs->_oDb->markAsRead($iProfileId, $iRead);

            $a = $this->http('GET', 'notifications?limit=10', $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $aAll = array_column($a['json']['items'], 'read', 'id');
            $this->assertSame([(string)$iRead, (string)$iUnread], array_slice(array_map('strval', array_keys($aAll)), 0, 2), 'listed by date');
            $this->assertTrue($aAll[$iRead]);
            $this->assertFalse($aAll[$iUnread]);

            $a = $this->http('GET', 'notifications?limit=10&unread_only=true', $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Notification', $a['json']);
            $this->assertSame([(string)$iUnread], array_column($a['json']['items'], 'id'), 'the read one does not end the unread list');
            $this->assertNull($a['json']['next_cursor']);
            $this->assertSame(1, $this->http('GET', 'notifications/unread-count', $aAuth)['json']['unread'], 'the count is what the list shows');
        } finally {
            if ($iMarker > 0)
                $oNtfs->_oDb->markAsRead($iProfileId, $iMarker);
            else
                $oDb->query("DELETE FROM `bx_notifications_read` WHERE `user_id` = :u", ['u' => $iProfileId]);
        }
    }

    public function testNotificationsSayWhatTheyAreAbout(): void
    {
        $this->requireModule('bx_notifications');
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $iOtherId = $this->ordinaryForeignProfileId($this->bxAccount('user'));
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOtherId), 'Content-Type' => 'application/json'];
        $this->forgetNotificationsFromNowOn();

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test notification targets</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $sItem = $a['json']['object']['id'];

        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aAuth, json_encode(['body' => 'Mine']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sTop = $a['json']['id'];

        // another member comments on the post, answers the comment and reacts to the post
        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aOther, json_encode(['body' => 'Theirs']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sTheirs = $a['json']['id'];
        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aOther, json_encode(['body' => 'Answer', 'parent_id' => $sTop]));
        $this->assertSame(201, $a['status'], $a['body']);
        $sAnswer = $a['json']['id'];
        $this->assertSame(204, $this->http('PUT', 'content/' . $sItem . '/reaction', $aOther, json_encode(['kind' => 'like']))['status']);

        $a = $this->http('GET', 'notifications?limit=30', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Notification', $a['json']);
        $aByObject = [];
        $aKinds = [];
        $aReaction = null;
        foreach ($a['json']['items'] as $aItem) {
            if (($aItem['actor']['id'] ?? '') !== (string)$iOtherId)
                continue;
            // a comment of the social kinds is about the Item, the new comment in data; an `other` one about the comment
            $sComment = in_array($aItem['kind'], ['social.comment', 'social.reply'], true) ? ($aItem['data']['comment_id'] ?? null) : ($aItem['object_kind'] === 'comment' ? $aItem['object_id'] : null);
            if ($sComment !== null) {
                $aByObject[$sComment] = $aItem;
                $aKinds[$sComment][$aItem['source']] = [$aItem['kind'], $aItem['data']];
            }
            if ($aItem['source'] === 'bx_timeline_reactions.doVote')
                $aReaction = $aReaction ?? $aItem;
        }

        // the comment on the post (commentPost), the answer (commentPost for the post's author, replyPost for the comment's):
        // about the Item as object_id, with the comment it is listed under for a reply
        $this->assertArrayHasKey($sTheirs, $aByObject, 'a comment on the post');
        $aComment = $aByObject[$sTheirs];
        $this->assertSame(['content', $sItem, $sItem, null], [$aComment['object_kind'], $aComment['object_id'], $aComment['item_id'], $aComment['thread_id']]);

        $this->assertArrayHasKey($sAnswer, $aByObject, 'an answer to the comment');
        $aReply = $aByObject[$sAnswer];
        $this->assertSame(['content', $sItem, $sItem, $sTop], [$aReply['object_kind'], $aReply['object_id'], $aReply['item_id'], $aReply['thread_id']], 'a reply names the comment it is listed under');

        if ($aReaction) {
            $this->assertSame(['content', $sItem, null], [$aReaction['object_kind'], $aReaction['object_id'], $aReaction['item_id']]);
            $this->assertSame(['social.reacted', ['kind' => 'like']], [$aReaction['kind'], $aReaction['data']], 'a reaction to the viewer\'s post, with the reaction');
        }

        // the social kinds, the new comment in data: a comment on the viewer's post, and the answer
        // to the viewer's comment both as a comment on the post and as a reply to the comment
        $this->assertSame(['social.comment', ['comment_id' => $sTheirs]], $aKinds[$sTheirs]['bx_timeline.commentPost'] ?? null);
        $this->assertSame(['social.reply', ['comment_id' => $sAnswer]], $aKinds[$sAnswer]['bx_timeline.replyPost'] ?? null);
        if (isset($aKinds[$sAnswer]['bx_timeline.commentPost']))
            $this->assertSame(['social.comment', ['comment_id' => $sAnswer]], $aKinds[$sAnswer]['bx_timeline.commentPost']);

        // one event each: one actor, one date; `data` is an object even when empty
        foreach ($a['json']['items'] as $aItem) {
            $this->assertSame(1, $aItem['actors']);
            $this->assertSame($aItem['created_at'], $aItem['updated_at']);
            $this->assertSame($aItem['module'], explode('.', $aItem['source'])[0]);
        }
        $this->assertMatchesRegularExpression('/"data":\{/', $a['body'], 'data is a JSON object');
        $this->assertDoesNotMatchRegularExpression('/"data":\[/', $a['body']);

        // the others' targets are as the schema says; an `other` has no id
        foreach ($a['json']['items'] as $aItem)
            if ($aItem['object_kind'] === 'other')
                $this->assertNull($aItem['object_id']);
            else
                $this->assertNotNull($aItem['object_id'], $aItem['kind']);
    }

    public function testFollowNotificationsAreAboutTheFollower(): void
    {
        $this->requireModule('bx_notifications');
        list($iProfileId, $sToken) = $this->userToken();
        $iOtherId = $this->unrelatedProfileId($iProfileId);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOtherId), 'Content-Type' => 'application/json'];
        $this->_aConnections[] = [$iProfileId, $iOtherId];
        $this->forgetNotificationsFromNowOn();

        $a = $this->http('POST', 'profiles/' . $iProfileId . '/follow', $aOther);
        $this->assertSame(204, $a['status'], $a['body']);

        $a = $this->http('GET', 'notifications?limit=10', ['Authorization' => 'Bearer ' . $sToken]);
        $aFollow = null;
        foreach ($a['json']['items'] as $aItem)
            if ($aItem['source'] === 'sys_profiles_subscriptions.connection_added' && ($aItem['actor']['id'] ?? '') === (string)$iOtherId)
                $aFollow = $aItem;
        $this->assertNotNull($aFollow, 'the follow is notified');
        $this->assertSchema('Notification', $aFollow);
        $this->assertSame(['profile', (string)$iOtherId], [$aFollow['object_kind'], $aFollow['object_id']], 'the follower, not the one followed');
        $this->assertSame(['graph.followed', [], 1, (string)$iOtherId], [$aFollow['kind'], $aFollow['data'], $aFollow['actors'], $aFollow['actor']['id'] ?? null], 'the follower is the actor');
    }

    public function testFriendNotificationsAreRequestedThenBefriended(): void
    {
        $this->requireModule('bx_notifications');
        list($iMe, $sToken) = $this->userToken();
        $iOther = $this->unrelatedProfileId($iMe);
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $this->_aConnections[] = [$iMe, $iOther];
        if (!$this->http('GET', 'profiles/' . $iOther . '/connections', $aAuth)['json']['viewer']['can_befriend'])
            $this->markTestSkipped('Friends are off for these profiles.');
        $this->forgetNotificationsFromNowOn();

        $fFind = function ($aHeaders, $iActor) {
            $a = $this->http('GET', 'notifications?limit=20', $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            foreach ($a['json']['items'] as $aItem)
                if ($aItem['source'] === 'sys_profiles_friends.connection_added' && ($aItem['actor']['id'] ?? '') === (string)$iActor)
                    return $aItem;
            return null;
        };

        $this->assertSame('requested', $this->http('POST', 'profiles/' . $iOther . '/friend', $aAuth)['json']['status'] ?? null);
        $aRequest = $fFind($aOther, $iMe);
        $this->assertNotNull($aRequest, 'the request is notified');
        $this->assertSchema('Notification', $aRequest);
        $this->assertSame(['graph.friend_requested', [], 'profile', (string)$iMe, (string)$iMe], [$aRequest['kind'], $aRequest['data'], $aRequest['object_kind'], $aRequest['object_id'], $aRequest['actor']['id'] ?? null], 'the one asking is the actor');

        $this->assertSame('friends', $this->http('POST', 'profiles/' . $iMe . '/friend', $aOther)['json']['status'] ?? null);
        $aAccepted = $fFind($aAuth, $iOther);
        $this->assertNotNull($aAccepted, 'the acceptance is notified');
        $this->assertSame(['graph.befriended', [], 'profile', (string)$iOther, (string)$iOther], [$aAccepted['kind'], $aAccepted['data'], $aAccepted['object_kind'], $aAccepted['object_id'], $aAccepted['actor']['id'] ?? null], 'the new friend is the actor');
    }

    public function testARepostOfTheViewersPostIsTimelineReposted(): void
    {
        $this->requireModule('bx_notifications');
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $iOther = $this->ordinaryForeignProfileId($this->bxAccount('user'));
        $this->forgetNotificationsFromNowOn();

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test reposted</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $iPost = (int)$a['json']['id'];
        $this->_aEvents[] = $iPost;

        // another member reposts it to their own timeline, as the site's repost button does
        $oTimeline = BxDolModule::getInstance('bx_timeline');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOther;
        try {
            $iRepost = (int)$oTimeline->repost($iOther, $iOther, $oTimeline->_oConfig->getPrefix('common_post') . 'post', '', $iPost, false, true);
        }
        finally {
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
        $this->assertGreaterThan(0, $iRepost, 'the repost was made');
        $this->_aEvents[] = $iRepost;

        $a = $this->http('GET', 'notifications?limit=20', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $aReposted = array_values(array_filter($a['json']['items'], function ($n) { return $n['source'] === 'bx_timeline.repost'; }));
        $this->assertNotEmpty($aReposted, 'the author is notified of the repost');
        $this->assertSchema('Notification', $aReposted[0]);
        $this->assertSame(['timeline.reposted', ['activity_id' => (string)$iRepost], (string)$iOther], [$aReposted[0]['kind'], $aReposted[0]['data'], $aReposted[0]['actor']['id'] ?? null]);
    }

    /**
     * The kinds say what happened to the recipient: events UNA sends about what someone else
     * owns are `other`, and so are likes and actions with no kind (BxNtfsApiV2::_kind, read
     * in-process with made-up events).
     */
    public function testNotificationKindsAreForTheRecipient(): void
    {
        $this->requireModule('bx_notifications');
        bx_import('ApiV2', 'bx_notifications');
        $oApi = new BxNtfsApiV2();
        $fKind = function ($sSource, $iObjectOwner, $aExtra = []) use ($oApi) {
            list($sUnit, $sAction) = explode('.', $sSource);
            $m = new ReflectionMethod($oApi, '_kind');
            return $m->invoke($oApi, $aExtra + ['type' => $sUnit, 'action' => $sAction, 'object_id' => 1, 'object_owner_id' => $iObjectOwner, 'subobject_id' => 0, 'content' => []], null, 7);
        };

        $this->assertSame(['kind' => 'graph.followed', 'data' => []], $fKind('sys_profiles_subscriptions.connection_added', 7));
        $this->assertSame('other', $fKind('sys_profiles_subscriptions.connection_added', 8)['kind'], 'someone followed someone else');
        $this->assertSame('graph.friend_requested', $fKind('sys_profiles_friends.connection_added', 7, ['content' => ['request' => 1]])['kind']);
        $this->assertSame('graph.befriended', $fKind('sys_profiles_friends.connection_added', 7, ['content' => ['request' => 0]])['kind']);
        $this->assertSame('social.mentioned', $fKind('meta_mention.added', 7)['kind']);
        $this->assertSame('social.mentioned', $fKind('meta_mention.added', -7)['kind'], 'an anonymous owner is still the owner');
        $this->assertSame('other', $fKind('meta_mention.added', 8)['kind']);
        $this->assertSame('other', $fKind('comment.added', 7)['kind'], 'the "also commented" notice has no kind');
        $this->assertSame('other', $fKind('bx_posts.added', 7)['kind']);
        if (BxDolVote::getObjectInstance('bx_timeline', 1, false) && !BxDolVote::getObjectInstance('bx_timeline', 1, false) instanceof BxDolVoteReactions)
            $this->assertSame('other', $fKind('bx_timeline.doVote', 7)['kind'], 'a like is not a reaction');
        $aCmts = BxDolCmts::getSystems();
        if (isset($aCmts['bx_timeline']))
            $this->assertSame('other', $fKind('bx_timeline.commentPost', 7, ['subobject_id' => 0])['kind'], 'a comment that is gone');
    }

    /**
     * A profile's badges (Studio > Badges, given to its entry) are in its Profile, full and
     * embedded, the same for guests, in the site's order (oldest badge first); a profile with
     * none has no `badges`. A page reads its profiles' badges in one query (primeBadges).
     */
    public function testProfilesCarryTheirBadges(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $oMe = BxDolProfile::getInstance($iMe);
        $sModule = $oMe->getModule();
        $iBare = $this->profileWithoutBadges([$iMe]);

        // made in the opposite order to the one they show in: by when the badge was made
        $iFounder = $this->makeBadge($sModule, 'ApiV2Test Founder', "\u{1F389}", 'rgb(220, 38, 38)', time());
        $iModerator = $this->makeBadge($sModule, 'ApiV2Test Moderator', 'shield-alt', 'blue-600', time() - 60);
        $this->makeBadge($sModule, 'ApiV2Test Unused', 'star', '', time()); // given to no one
        BxDolBadges::getInstance()->add($iFounder, $oMe->getContentId(), $sModule);
        BxDolBadges::getInstance()->add($iModerator, $oMe->getContentId(), $sModule);

        $aExpected = [
            ['id' => (string)$iModerator, 'name' => 'ApiV2Test Moderator', 'icon' => 'shield', 'color' => '#2563eb'],
            ['id' => (string)$iFounder, 'name' => 'ApiV2Test Founder', 'icon' => null, 'color' => '#dc2626'],
        ];
        $fOurs = function ($aBadges) {
            return array_values(array_filter((array)$aBadges, function ($b) { return strpos($b['name'], 'ApiV2Test') === 0; }));
        };

        $a = $this->http('GET', 'profiles/' . $iMe, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Profile', $a['json']);
        $this->assertSame($aExpected, $fOurs($a['json']['badges'] ?? []));

        $a = $this->http('GET', 'profiles/' . $iBare, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Profile', $a['json']);
        $this->assertArrayNotHasKey('badges', $a['json'], 'no badges, no field');

        // embedded: the author of a post, to a member and to a guest
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test badges</p>', 'audience' => 'public']));
            $this->assertSame(201, $a['status'], $a['body']);
            $this->_aEvents[] = (int)$a['json']['id'];
            $this->assertSame($aExpected, $fOurs($a['json']['actor']['badges'] ?? []));

            foreach ([$aAuth, []] as $aHeaders) {
                $a = $this->http('GET', 'profiles/' . $iMe . '/timeline?limit=5', $aHeaders);
                if (!$aHeaders && $a['status'] !== 200)
                    continue; // guests may not see profiles on this site
                $this->assertSame(200, $a['status'], $a['body']);
                $aPost = array_values(array_filter($a['json']['items'], function ($x) { return ($x['object']['card']['text'] ?? '') === 'ApiV2Test badges'; }));
                $this->assertNotEmpty($aPost, 'the post is in its author\'s feed');
                $this->assertSchema('Activity', $aPost[0]);
                $this->assertSame($aExpected, $fOurs($aPost[0]['actor']['badges'] ?? []));
                $this->assertSame($aExpected, $fOurs($aPost[0]['object']['author']['badges'] ?? []));
            }
        }

        $a = $this->http('GET', 'profiles/' . $iMe);
        if ($a['status'] === 200)
            $this->assertSame($aExpected, $fOurs($a['json']['badges'] ?? []), 'the same for guests');

        // a page's profiles are read at once: taking a badge away after the read changes nothing in this request
        BxDolApiV2Map::reset();
        BxDolApiV2Map::primeBadges([$iMe, $iBare]);
        BxDolBadges::getInstance()->delete(['type' => 'by_module&object&badge', 'module' => $sModule, 'object_id' => $oMe->getContentId(), 'badge_id' => $iModerator]);
        $this->assertSame($aExpected, $fOurs(BxDolApiV2Map::profileBadges($iMe)));
        $this->assertSame([], BxDolApiV2Map::profileBadges($iBare));
        BxDolApiV2Map::reset();
        $this->assertSame([$aExpected[1]], $fOurs(BxDolApiV2Map::profileBadges($iMe)), 'read again after a reset');
    }

    /**
     * A badge whose icon is a picture uploaded in Studio (a sys_images file, its id in the
     * badge's icon) has `image`: the absolute URL of a display copy, never the upload, the same
     * from one request to the next, and no `icon`. An icon-only badge has `icon_only` and keeps
     * its `name`. Neither field is there otherwise, and an upload that is gone has no `image`.
     */
    public function testBadgeImageAndIconOnly(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $oMe = BxDolProfile::getInstance($iMe);
        $sModule = $oMe->getModule();

        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
        $sPath = tempnam(sys_get_temp_dir(), 'badge') . '.png';
        file_put_contents($sPath, self::png(40, 30));
        $iFileId = (int)$oStorage->storeFileFromPath($sPath, false, 0, 0);
        @unlink($sPath);
        $this->assertGreaterThan(0, $iFileId, 'the picture was stored');
        $iSource = $iFileId;
        $oTranscoder = BxDolTranscoderImage::getObjectInstance(BxDolApiV2Map::BADGE_IMAGE_TRANSCODER);

        try {
            $iPicture = $this->makeBadge($sModule, 'ApiV2Test Pictured', (string)$iFileId, 'teal-600', time() - 120);
            $iCompact = $this->makeBadge($sModule, 'ApiV2Test Compact', 'star', 'amber-600', time() - 60, true);
            $iPlain = $this->makeBadge($sModule, 'ApiV2Test Plain', 'shield-check', 'blue-600', time());
            foreach ([$iPicture, $iCompact, $iPlain] as $iBadge)
                BxDolBadges::getInstance()->add($iBadge, $oMe->getContentId(), $sModule);
            $fOurs = function ($aBadges) {
                return array_values(array_filter((array)$aBadges, function ($b) { return strpos($b['name'], 'ApiV2Test') === 0; }));
            };

            $a = $this->http('GET', 'profiles/' . $iMe, $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Profile', $a['json']);
            $aBadges = $fOurs($a['json']['badges'] ?? []);
            $this->assertCount(3, $aBadges);
            list($aPicture, $aCompact, $aPlain) = $aBadges;

            // the picture: a copy's absolute URL, never the upload's, and no icon
            $this->assertSame(['id', 'name', 'icon', 'color', 'image'], array_keys($aPicture));
            $this->assertSame([(string)$iPicture, 'ApiV2Test Pictured', null, '#0d9488'], [$aPicture['id'], $aPicture['name'], $aPicture['icon'], $aPicture['color']]);
            $sImage = $aPicture['image'];
            $this->assertMatchesRegularExpression('#^https?://#', $sImage);
            $this->assertNotSame(bx_absolute_url((string)$oStorage->getFileUrlById($iFileId)), $sImage, 'not the upload');
            $sCopy = bx_absolute_url((string)$oTranscoder->getFileUrl($iFileId));
            $this->assertSame(BxDolApiV2Map::stableUrl($sCopy), $sImage, 'the display copy');
            $this->assertDoesNotMatchRegularExpression('#[?&]t=#', $sImage, 'nothing that changes per request');
            $this->assertSame($sImage, $fOurs($this->http('GET', 'profiles/' . $iMe, $aAuth)['json']['badges'] ?? [])[0]['image'] ?? null, 'the same next time');
            $aServed = $this->raw('GET', parse_url($sImage, PHP_URL_PATH) . (parse_url($sImage, PHP_URL_QUERY) ? '?' . parse_url($sImage, PHP_URL_QUERY) : ''));
            $this->assertContains($aServed['status'], [200, 302], 'it serves');
            // once the copy is made the link is the copy's own file, still no upload
            $aBadges = $fOurs($this->http('GET', 'profiles/' . $iMe, $aAuth)['json']['badges'] ?? []);
            $sCopy = bx_absolute_url((string)$oTranscoder->getFileUrl($iFileId));
            $this->assertSame($sCopy, $aBadges[0]['image'] ?? null);
            $this->assertNotSame(bx_absolute_url((string)$oStorage->getFileUrlById($iFileId)), $sCopy, 'not the upload');

            // `api` in the query, the site's API mode, where transcoders link the uploads: dropped,
            // so the links stay the copies, the avatar's and cover's too
            $aPlainProfile = $this->http('GET', 'profiles/' . $iMe, $aAuth)['json'];
            $a = $this->http('GET', 'profiles/' . $iMe . '?api=1', $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSame($sCopy, $fOurs($a['json']['badges'] ?? [])[0]['image'] ?? null, 'the copy with api=1');
            foreach (['avatar', 'avatar_large', 'cover'] as $sField)
                $this->assertSame($aPlainProfile[$sField] ?? null, $a['json'][$sField] ?? null, $sField . ' with api=1');

            // icon only: the flag, with the name still there
            $this->assertSame(['id' => (string)$iCompact, 'name' => 'ApiV2Test Compact', 'icon' => 'star', 'color' => '#d97706', 'icon_only' => true], $aCompact);
            // neither: neither field
            $this->assertSame(['id' => (string)$iPlain, 'name' => 'ApiV2Test Plain', 'icon' => 'shield-check', 'color' => '#2563eb'], $aPlain);

            // embedded profiles carry them too
            if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
                $a = $this->http('POST', 'feed-posts', $aAuth + ['Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test badge pictures</p>', 'audience' => 'public']));
                $this->assertSame(201, $a['status'], $a['body']);
                $this->_aEvents[] = (int)$a['json']['id'];
                $this->assertSchema('Activity', $a['json']);
                $this->assertSame($aBadges, $fOurs($a['json']['actor']['badges'] ?? []));
            }

            // an upload that is gone has no image, in-process as on the next request
            $this->assertTrue((bool)$oStorage->deleteFile($iFileId, 0), 'the picture was deleted');
            $iFileId = 0;
            BxDolApiV2Map::reset();
            $aPicture = $fOurs(BxDolApiV2Map::profileBadges($iMe))[0];
            $this->assertSame((string)$iPicture, $aPicture['id']);
            $this->assertArrayNotHasKey('image', $aPicture);
            $this->assertNull($aPicture['icon']);
            $this->assertNull(BxDolApiV2Map::badgeImage('0'));
            $this->assertNull(BxDolApiV2Map::badgeImage('star'));

            // an SVG has no resized copy, and the upload itself is never linked: no image
            $sPath = tempnam(sys_get_temp_dir(), 'badge') . '.svg';
            file_put_contents($sPath, '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="8" fill="#0d9488"/></svg>');
            $iSvgId = (int)$oStorage->storeFileFromPath($sPath, false, 0, 0);
            @unlink($sPath);
            $this->assertGreaterThan(0, $iSvgId, 'the SVG was stored');
            $this->assertTrue($oStorage->isMimeTypeSvg((string)$oStorage->getFile($iSvgId)['mime_type']), 'stored as an SVG');
            $this->assertNull(BxDolApiV2Map::badgeImage((string)$iSvgId));
        } finally {
            if ($iFileId)
                $oStorage->deleteFile($iFileId, 0);
            if (!empty($iSvgId))
                $oStorage->deleteFile($iSvgId, 0);
            // the copy: a site may have no handlers that delete a system transcoder's copies with the upload
            if (($iCopy = (int)$oTranscoder->getDb()->getFileIdByHandler($iSource))) {
                $oTranscoder->getStorage()->deleteFile($iCopy, 0);
                $oTranscoder->getDb()->deleteFileTraces($iCopy);
            }
        }
    }

    /**
     * A page reads its profiles' badges in one query: the conversations inbox (every
     * participant, not only authors and last repliers) and notifications (a join request's
     * actor is the one asking, subobject_id), counted in-process.
     */
    public function testPagesReadTheirBadgesInOneQuery(): void
    {
        list($iProfileId, , $iOther, , $aJson) = $this->conversationPeople();
        $iThird = $this->ordinaryProfileIdOtherThan([$iProfileId, $iOther]);
        $this->startConversation($aJson, [$iOther, $iThird], 'ApiV2Test badges three');
        $this->startConversation($aJson, [$iThird], 'ApiV2Test badges two');

        $fCount = function (callable $f) {
            $oBefore = BxDolBadges::getInstance();
            $oCounting = new class extends BxDolBadges {
                public $iCalls = 0;
                public function __construct() { parent::__construct(); }
                public function getByProfileIds($aProfileIds) { $this->iCalls++; return parent::getByProfileIds($aProfileIds); }
            };
            $GLOBALS['bxDolClasses']['BxDolBadges'] = $oCounting;
            BxDolApiV2Map::reset();
            try {
                $f();
            } finally {
                $GLOBALS['bxDolClasses']['BxDolBadges'] = $oBefore;
                BxDolApiV2Map::reset();
            }
            return $oCounting->iCalls;
        };
        $oAuth = new class($iProfileId) extends BxDolApiV2Auth {
            public function __construct($i) { $this->_iProfileId = (int)$i; }
        };

        // the module acts as the viewer, as it does in a signed-in request
        bx_import('ApiV2', 'bx_convos');
        $oConvos = BxDolModule::getInstance('bx_convos');
        $iWas = $oConvos->setProfileId($iProfileId);
        $aPage = null;
        try {
            $iCalls = $fCount(function () use ($oAuth, &$aPage) {
                $aPage = (new BxCnvApiV2())->listConversations(new BxDolApiV2Request('GET', [], ['limit' => '10'], null, [], $oAuth));
            });
        } finally {
            $oConvos->setProfileId($iWas);
        }
        $this->assertSame(1, $iCalls, 'the inbox: one query');
        $aIds = [];
        foreach ($aPage['items'] as $aConvo)
            foreach ($aConvo['participants'] as $aP)
                $aIds[] = (int)$aP['id'];
        $this->assertContains($iThird, $aIds, 'a participant who neither started nor last replied is on the page');

        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_notifications')) {
            bx_import('ApiV2', 'bx_notifications');
            $oNtfs = new BxNtfsApiV2();
            $this->assertSame(1, $fCount(function () use ($oNtfs, $iProfileId, $iOther, $iThird) {
                (new ReflectionMethod($oNtfs, '_prefetch'))->invoke($oNtfs, [
                    ['type' => 'bx_timeline', 'action' => 'commentPost', 'author_id' => $iOther, 'owner_id' => $iOther, 'subobject_id' => 0],
                    ['type' => 'bx_groups', 'action' => 'join_request', 'author_id' => 0, 'owner_id' => $iProfileId, 'subobject_id' => $iThird],
                ]);
                foreach ([$iOther, $iProfileId, $iThird] as $i)
                    BxDolApiV2Map::profileBadges($i);
            }), 'notifications: one query, the join request\'s asker included');
        }
    }

    /**
     * How a badge's icon and colour codes of the site become a Lucide name and hex.
     */
    public function testBadgeIconsAndColours(): void
    {
        $this->assertSame('shield', BxDolApiV2Map::badgeIcon('shield-alt'), 'a Font Awesome name the Lucide set maps');
        $this->assertSame('star', BxDolApiV2Map::badgeIcon('fas fa-star col-red'), 'with its classes');
        $this->assertSame('shield-check', BxDolApiV2Map::badgeIcon('shield-check'), 'a Lucide name');
        foreach (['', '12', '<svg></svg>', "\u{1F389}", 'a:bell', 'no-such-icon-anywhere', 'https://example.com/i.png'] as $s)
            $this->assertNull(BxDolApiV2Map::badgeIcon($s), $s);

        $this->assertSame('#9333ea', BxDolApiV2Map::badgeColor(''), 'none: the site draws purple-600');
        $this->assertSame('#2563eb', BxDolApiV2Map::badgeColor('blue-600'));
        $this->assertSame('#0a0b0c', BxDolApiV2Map::badgeColor('rgb(10, 11, 12)'));
        $this->assertSame('#abc', BxDolApiV2Map::badgeColor('#ABC'));
        foreach (['blue', 'rgb(300, 0, 0)', 'red; x', 'blue-650'] as $s)
            $this->assertNull(BxDolApiV2Map::badgeColor($s), $s);
    }

    /**
     * groups.* carry the group in data.group_id and keep it as object_id (a profile); the
     * actor of groups.join_requested is the one asking (made-up events, read in-process).
     */
    public function testGroupNotificationsCarryTheGroup(): void
    {
        $this->requireModule('bx_notifications');
        list($iViewer) = $this->userToken();
        $iOwner = $this->groupOwnerId($iViewer);
        $iGroup = $this->makeGroup($iOwner, 'p', false);
        $iContent = (int)BxDolProfile::getInstance($iGroup)->getContentId();

        bx_import('ApiV2', 'bx_notifications');
        $oApi = new BxNtfsApiV2();
        $fRead = function ($sAction, $iObjectOwner, $iSubobject, $iRecipient) use ($oApi, $iContent, $iGroup) {
            $aEvent = ['type' => 'bx_groups', 'action' => $sAction, 'object_id' => $iContent, 'object_owner_id' => $iObjectOwner, 'subobject_id' => $iSubobject, 'owner_id' => $iGroup, 'author_id' => $iGroup, 'content' => []];
            $aTarget = (new ReflectionMethod($oApi, '_target'))->invoke($oApi, $aEvent);
            $aKind = (new ReflectionMethod($oApi, '_kind'))->invoke($oApi, $aEvent, $aTarget, $iRecipient);
            $aFields = (new ReflectionMethod($oApi, '_targetFields'))->invoke($oApi, $aTarget, $aKind['kind']);
            return [$aKind['kind'], $aKind['data'], $aFields['object_kind'], $aFields['object_id'], $aKind['actor_id'] ?? null];
        };

        $aGroup = ['group_id' => (string)$iGroup];
        $this->assertSame(['groups.invited', $aGroup, 'profile', (string)$iGroup, null], $fRead('join_invitation_notif', $iViewer, 0, $iViewer));
        $this->assertSame(['groups.approved', $aGroup, 'profile', (string)$iGroup, null], $fRead('fan_added', $iGroup, $iViewer, $iViewer));
        $this->assertSame(['groups.join_requested', $aGroup, 'profile', (string)$iGroup, $iViewer], $fRead('join_request', $iOwner, $iViewer, $iOwner));
        $this->assertSame('other', $fRead('fan_added', $iGroup, $iViewer, $iOwner)[0], 'someone else joined');
    }

    public function testSyncBadgesAreTheUnreadCountsAndRepeatsAre304(): void
    {
        $this->requireModule('bx_notifications');
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOtherId = $this->ordinaryForeignProfileId($this->bxAccount('user'));
        $sOtherToken = $this->profileToken($iOtherId);
        $aOther = ['Authorization' => 'Bearer ' . $sOtherToken, 'Content-Type' => 'application/json'];
        $this->forgetNotificationsFromNowOn();

        $this->assertSame(401, $this->http('GET', 'sync')['status'], 'guests have no badges');
        $this->assertSame(422, $this->http('GET', 'sync?cursor=bogus', $aAuth)['status']);

        $a = $this->http('GET', 'sync', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('SyncResponse', $a['json']);
        $this->assertSame([], $a['json']['changes'], 'the first sync only starts a cursor');
        $this->assertSame([], $a['json']['lists'], 'no list heads in GET /sync');
        $this->assertMatchesRegularExpression('/"lists":\{\}/', $a['body'], 'lists is an object');
        $this->assertFalse($a['json']['more']);
        $this->assertFalse($a['json']['reset']);
        $aBadges = $a['json']['badges'];

        $this->assertSame($this->http('GET', 'notifications/unread-count', $aAuth)['json']['unread'], $aBadges['notifications']);
        $aRequests = $this->http('GET', 'me/friend-requests?limit=50', $aAuth)['json'];
        if ($aRequests['next_cursor'] === null)
            $this->assertSame(count($aRequests['items']), $aBadges['friend_requests']);
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_convos'))
            $this->assertSame($this->http('GET', 'conversations/unread-count', $aAuth)['json']['unread'], $aBadges['messages']);
        else
            $this->assertArrayNotHasKey('messages', $aBadges, 'no Conversations, no messages badge');

        // the answer stays the same until something changes: a repeat with its ETag is 304
        $sCursor = $a['json']['cursor'];
        $a = $this->http('GET', 'sync?cursor=' . $sCursor, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $sEtag = (string)BxDolTestPhpServer::header($a, 'etag');
        $this->assertNotSame('', $sEtag);
        $this->assertSame($sCursor, $a['json']['cursor'], 'nothing new, the same cursor');
        $a = $this->http('GET', 'sync?cursor=' . $sCursor, $aAuth + ['If-None-Match' => $sEtag]);
        $this->assertSame(304, $a['status']);
        $this->assertSame('', $a['body']);

        // something new: another member comments on the viewer's post
        $a = $this->http('POST', 'feed-posts', $aAuth + ['Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test sync</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $sItem = $a['json']['object']['id'];
        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aOther, json_encode(['body' => 'Hello']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sComment = $a['json']['id'];

        $a = $this->http('GET', 'sync?cursor=' . $sCursor, $aAuth + ['If-None-Match' => $sEtag]);
        $this->assertSame(200, $a['status'], 'changed: no 304');
        $this->assertSchema('SyncResponse', $a['json']);
        $this->assertNotSame($sCursor, $a['json']['cursor']);
        // new notifications are changes: type, id, version, the Notification
        $aEntries = $a['json']['changes'];
        $this->assertNotEmpty($aEntries);
        $this->assertFalse($a['json']['more']);
        $this->assertSame('notification', $aEntries[0]['type']);
        $aNew = array_values(array_filter($aEntries, function ($e) use ($sComment) { return ($e['data']['data']['comment_id'] ?? null) === $sComment; }));
        $this->assertCount(1, $aNew, 'the comment is in the new notifications');
        $this->assertSame([$aNew[0]['data']['id'], 'content', $sItem, $sItem, false], [$aNew[0]['id'], $aNew[0]['data']['object_kind'], $aNew[0]['data']['object_id'], $aNew[0]['data']['item_id'], $aNew[0]['data']['read']]);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{24}$/', $aNew[0]['version']);
        $this->assertSchema('Notification', $aNew[0]['data']);
        $this->assertSame($this->http('GET', 'notifications/unread-count', $aAuth)['json']['unread'], $a['json']['badges']['notifications']);

        // the next sync from there has nothing new
        $a = $this->http('GET', 'sync?cursor=' . $a['json']['cursor'], $aAuth);
        $this->assertSame([], $a['json']['changes']);

        // the account's other profile, or another account: a cursor of another profile starts over
        $sForeignCursor = $this->http('GET', 'sync', ['Authorization' => 'Bearer ' . $sOtherToken])['json']['cursor'];
        $a = $this->http('GET', 'sync?cursor=' . $sForeignCursor, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertTrue($a['json']['reset']);
        $this->assertSame([], $a['json']['changes']);
    }

    /**
     * More notifications than one answer takes come in parts, each answer saying `more`, and
     * none is skipped (BxNtfsApiV2::_sync with one per answer, in-process as the viewer).
     */
    public function testSyncSendsManyNotificationsInParts(): void
    {
        $this->requireModule('bx_notifications');
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $iOtherId = $this->ordinaryForeignProfileId($this->bxAccount('user'));
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOtherId), 'Content-Type' => 'application/json'];
        $this->forgetNotificationsFromNowOn();

        bx_import('ApiV2', 'bx_notifications');
        $oApi = new BxNtfsApiV2();
        $mSync = new ReflectionMethod($oApi, '_sync');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iProfileId;
        try {
            $fSync = function ($aCursor) use ($oApi, $mSync, $iProfileId) {
                BxDolDb::getInstance()->cleanMemoryAll();
                return $mSync->invoke($oApi, $iProfileId, $aCursor, false, 1);
            };
            $aHead = $fSync([])['cursor'];

            $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test sync in parts</p>', 'audience' => 'public']));
            $this->assertSame(201, $a['status'], $a['body']);
            $this->_aEvents[] = (int)$a['json']['id'];
            $aComments = [];
            foreach (['One', 'Two', 'Three'] as $sBody) {
                $a = $this->http('POST', 'content/' . $a['json']['object']['id'] . '/comments', $aOther, json_encode(['body' => $sBody]));
                $this->assertSame(201, $a['status'], $a['body']);
                $aComments[] = $a['json']['id'];
                $a = ['json' => ['object' => ['id' => $a['json']['target_id']]]];
            }

            $aSeen = [];
            $aCursor = $aHead;
            for ($i = 0; $i < 10; $i++) {
                $aAnswer = $fSync($aCursor);
                $this->assertLessThanOrEqual(1, count($aAnswer['changes']));
                foreach ($aAnswer['changes'] as $aChange)
                    $aSeen[] = ((array)$aChange['data']['data'])['comment_id'] ?? null; // data is an object in-process
                $aCursor = $aAnswer['cursor'];
                if (!$aAnswer['more'])
                    break;
                $this->assertArrayHasKey('b', $aCursor, 'a part goes on below what it sent');
            }
            $this->assertGreaterThanOrEqual(2, $i, 'three notifications, one per answer: three answers at least');
            foreach ($aComments as $sComment)
                $this->assertContains($sComment, $aSeen, 'none is skipped');
            $this->assertArrayNotHasKey('b', $aCursor, 'the round is over');
            $this->assertSame([], $fSync($aCursor)['changes'], 'and nothing is sent twice');
        } finally {
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
    }

    public function testLinksResolveToWhatShowsThem(): void
    {
        $this->requireModule('bx_timeline');
        list($iProfileId, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $fResolve = function ($sUrl, $aHeaders) {
            return $this->http('GET', 'links/resolve?url=' . rawurlencode($sUrl), $aHeaders);
        };

        $a = $this->http('POST', 'feed-posts', $aAuth + ['Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test link</p>', 'audience' => 'public']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $sItem = $a['json']['object']['id'];

        // the post's own link, as the site writes it, and as page.php
        $sPostUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=item', ['id' => $sItem]);
        foreach ([bx_absolute_url($sPostUrl), BX_DOL_URL_ROOT . 'page.php?i=item&id=' . $sItem, BX_DOL_URL_ROOT . 'page.php?i=item&id=' . $sItem . '#comments'] as $sUrl) {
            $a = $fResolve($sUrl, $aAuth);
            $this->assertSame(200, $a['status'], $sUrl . ': ' . $a['body']);
            $this->assertSchema('LinkTarget', $a['json']);
            $this->assertSame(['content', $sItem], [$a['json']['kind'], $a['json']['id']], $sUrl);
        }

        // a profile's link, for a guest too (opening the profile checks who may see it)
        $sProfileUrl = BxDolProfile::getInstance($iProfileId)->getUrl();
        foreach ([$aAuth, []] as $aHeaders) {
            $a = $fResolve($sProfileUrl, $aHeaders);
            $this->assertSame(200, $a['status'], $sProfileUrl . ': ' . $a['body']);
            $this->assertSame(['profile', (string)$iProfileId], [$a['json']['kind'], $a['json']['id']]);
        }

        // a group is a group
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_groups')) {
            $iGroup = $this->seedAnyPublicGroup();
            $a = $fResolve(BxDolProfile::getInstance($iGroup)->getUrl(), $aAuth);
            $this->assertSame(['group', (string)$iGroup], [$a['json']['kind'] ?? null, $a['json']['id'] ?? null], $a['body']);
        }

        // a post for members only: a guest is told nothing about it, as about a post that is gone
        $a = $this->http('POST', 'feed-posts', $aAuth + ['Content-Type' => 'application/json'], json_encode(['body_html' => '<p>ApiV2Test members link</p>', 'audience' => 'members']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $sMembersUrl = BX_DOL_URL_ROOT . 'page.php?i=item&id=' . $a['json']['object']['id'];
        $this->assertSame(200, $fResolve($sMembersUrl, $aAuth)['status']);
        $a = $fResolve($sMembersUrl, []);
        $this->assertSame(404, $a['status'], $a['body']);
        $this->assertSchema('Problem', $a['json']);

        // a conversation exists only for those in it: for anyone else, guests too, its link is
        // the same 404 as a link to a conversation that never was
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_convos')) {
            $oDb = BxDolDb::getInstance();
            $sConvoUrl = function ($iId) {
                return BX_DOL_URL_ROOT . 'page.php?i=view-convo&id=' . $iId;
            };
            $aMissing = $fResolve($sConvoUrl(999999999), $aAuth);
            $this->assertSame(404, $aMissing['status']);

            $iIn = (int)$oDb->getOne("SELECT `conv_id` FROM `bx_convos_conv2folder` WHERE `collaborator` = :p ORDER BY `conv_id` LIMIT 1", ['p' => $iProfileId]);
            if ($iIn) {
                $a = $fResolve($sConvoUrl($iIn), $aAuth);
                $this->assertSame(200, $a['status'], $a['body']);
                $this->assertSchema('LinkTarget', $a['json']);
                $this->assertSame(['conversation', (string)$iIn], [$a['json']['kind'], $a['json']['id']]);
                $this->assertSame(404, $fResolve($sConvoUrl($iIn), [])['status'], 'a guest');
            }

            $iOut = (int)$oDb->getOne("SELECT `c`.`id` FROM `bx_convos_conversations` AS `c` WHERE NOT EXISTS (SELECT 1 FROM `bx_convos_conv2folder` AS `f` WHERE `f`.`conv_id` = `c`.`id` AND `f`.`collaborator` = :p) ORDER BY `c`.`id` LIMIT 1", ['p' => $iProfileId]);
            if ($iOut) {
                foreach ([$aAuth, []] as $aHeaders) {
                    $a = $fResolve($sConvoUrl($iOut), $aHeaders);
                    $this->assertSame(404, $a['status'], $a['body']);
                    $this->assertSchema('Problem', $a['json']);
                    $this->assertSame($aMissing['json']['detail'] ?? null, $a['json']['detail'] ?? null, 'the same answer as for a missing one');
                }
            }
        }

        // what no entry page shows, a post that is gone, another site, not a link
        $this->assertSame(404, $fResolve(BX_DOL_URL_ROOT . 'page.php?i=item&id=999999999', $aAuth)['status']);
        $this->assertSame(404, $fResolve(BX_DOL_URL_ROOT . 'page.php?i=home', $aAuth)['status']);
        $this->assertSame(404, $fResolve('https://example.com/page.php?i=item&id=' . $sItem, $aAuth)['status']);
        $this->assertSame(422, $fResolve('javascript:alert(1)', $aAuth)['status']);
        $a = $this->http('GET', 'links/resolve', $aAuth);
        $this->assertSame(422, $a['status']);
        $this->assertSchema('Problem', $a['json']);
    }

    public function testSearchProfilesPutsTheNameFirst(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $oMe = BxDolProfile::getInstance($iMe);
        $sName = $oMe->getDisplayName();

        // the whole name, in another case, is first for members and guests alike
        foreach ([$aAuth, []] as $aHeaders) {
            $a = $this->http('GET', 'search/profiles?q=' . rawurlencode(mb_strtoupper($sName)), $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            foreach ($a['json'] as $aProfile)
                $this->assertSchema('Profile', $aProfile);
            $this->assertNotEmpty($a['json']);
            $this->assertSame((string)$iMe, $a['json'][0]['id'], 'the seeded name is first');
        }

        // part of a name finds it too, and only active people and organizations
        $sPart = mb_substr($sName, 0, max(2, (int)floor(mb_strlen($sName) / 2)));
        $a = $this->http('GET', 'search/profiles?q=' . rawurlencode($sPart) . '&limit=50', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertContains((string)$iMe, array_column($a['json'], 'id'));
        foreach ($a['json'] as $aProfile) {
            $this->assertSame('active', $aProfile['status']);
            $this->assertNotSame('group', $aProfile['kind'], 'groups are GET /search/groups');
        }

        // the handle exactly
        $sHandle = BxDolApiV2Map::profileHandle($oMe);
        if ($sHandle !== null) {
            $a = $this->http('GET', 'search/profiles?q=' . rawurlencode($sHandle), $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSame((string)$iMe, $a['json'][0]['id'] ?? null, 'the handle is first');
        }

        foreach (['', '%20%20', rawurlencode(str_repeat('x', 101))] as $sQuery) {
            $a = $this->http('GET', 'search/profiles?q=' . $sQuery);
            $this->assertSame(422, $a['status'], $a['body']);
            $this->assertSchema('Problem', $a['json']);
            $this->assertSame('q', $a['json']['errors'][0]['field']);
        }
    }

    public function testSearchProfilesLeavesOutWhomTheViewerMayNotSee(): void
    {
        list($iMe, $sToken) = $this->userToken();
        $oMe = BxDolProfile::getInstance($iMe);
        $aContent = BxDolApiV2Map::profileContent($oMe);
        $CNF = BxDolApiV2Map::profileCnf($oMe->getModule());
        if (empty($CNF['FIELD_ALLOW_VIEW_TO']) || !isset($aContent[$CNF['FIELD_ALLOW_VIEW_TO']]) || empty($CNF['TABLE_ENTRIES']))
            $this->markTestSkipped('The profile module has no view privacy.');

        // members only for a while: guests don't find the profile, members do
        $oDb = BxDolDb::getInstance();
        $sOld = (string)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $sQuery = "UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` = :v WHERE `id` = :i";
        $oDb->query($sQuery, ['v' => BX_DOL_PG_MEMBERS, 'i' => $oMe->getContentId()]);
        try {
            $sName = rawurlencode($oMe->getDisplayName());
            $a = $this->http('GET', 'search/profiles?q=' . $sName);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertNotContains((string)$iMe, array_column($a['json'], 'id'), 'a guest does not find a profile for members');

            // (whether another member may depends on the membership levels' view action)
            $a = $this->http('GET', 'search/profiles?q=' . $sName, ['Authorization' => 'Bearer ' . $sToken]);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertContains((string)$iMe, array_column($a['json'], 'id'), 'the profile itself does');
        }
        finally {
            $oDb->query($sQuery, ['v' => $sOld, 'i' => $oMe->getContentId()]);
        }
    }

    public function testSearchProfilesListsPartlyVisibleOnesOnlyToALevelThatMayView(): void
    {
        list($iMe) = $this->userToken();
        $oMe = BxDolProfile::getInstance($iMe);
        $sModule = $oMe->getModule();
        $aContent = BxDolApiV2Map::profileContent($oMe);
        $CNF = BxDolApiV2Map::profileCnf($sModule);
        if (empty($CNF['FIELD_ALLOW_VIEW_TO']) || !isset($aContent[$CNF['FIELD_ALLOW_VIEW_TO']]) || empty($CNF['TABLE_ENTRIES']) || empty($CNF['OBJECT_PRIVACY_VIEW']))
            $this->markTestSkipped('The profile module has no view privacy.');
        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']);
        if (!$oPrivacy || !method_exists($oPrivacy, 'isPartiallyVisible') || !$oPrivacy->isPartiallyVisible(BX_DOL_PG_FRIENDS))
            $this->markTestSkipped('Friends only is not partly visible in this module.');

        $oDb = BxDolDb::getInstance();
        $aGuestView = $oDb->getRow("SELECT `m`.* FROM `sys_acl_matrix` AS `m` INNER JOIN `sys_acl_actions` AS `a` ON `a`.`ID` = `m`.`IDAction` WHERE `a`.`Module` = :m AND `a`.`Name` = 'view entry' AND `m`.`IDLevel` = :l", ['m' => $sModule, 'l' => MEMBERSHIP_ID_NON_MEMBER]);
        if (!$aGuestView)
            $this->markTestSkipped('Guests may not view ' . $sModule . ' here.');

        // friends only for a while: the site shows guests its name and picture, so search lists it
        $sOld = (string)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $sQuery = "UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` = :v WHERE `id` = :i";
        $oDb->query($sQuery, ['v' => BX_DOL_PG_FRIENDS, 'i' => $oMe->getContentId()]);
        $sPath = 'search/profiles?q=' . rawurlencode($oMe->getDisplayName()) . '&limit=50';
        try {
            $a = $this->http('GET', $sPath);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertContains((string)$iMe, array_column($a['json'], 'id'), 'a guest finds a profile for friends');

            // a level without 'view entry' sees no profile of the module, partly visible or not
            $oDb->query("DELETE FROM `sys_acl_matrix` WHERE `IDLevel` = :l AND `IDAction` = :a", ['l' => $aGuestView['IDLevel'], 'a' => $aGuestView['IDAction']]);
            try {
                $a = $this->http('GET', $sPath);
                $this->assertSame(200, $a['status'], $a['body']);
                foreach ($a['json'] as $aProfile)
                    $this->assertSchema('Profile', $aProfile);
                $this->assertNotContains((string)$iMe, array_column($a['json'], 'id'), 'a level that may not view profiles does not find one for friends');
                $this->assertNotContains($sModule, array_column($a['json'], 'module'), 'nor any other profile of the module');
            }
            finally {
                $oDb->query("INSERT INTO `sys_acl_matrix` SET " . implode(', ', array_map(function ($s) {
                    return '`' . $s . '` = :' . $s;
                }, array_keys($aGuestView))), $aGuestView);
            }
        }
        finally {
            $oDb->query($sQuery, ['v' => $sOld, 'i' => $oMe->getContentId()]);
        }
    }

    public function testSearchGroups(): void
    {
        $this->requireModule('bx_groups');
        $aPaths = (new BxDolApiV2Spec(new BxDolApiV2Router()))->build()['paths'];
        $this->assertArrayHasKey('/search/groups', $aPaths);

        $iGroup = $this->seedAnyPublicGroup();
        $sName = BxDolProfile::getInstance($iGroup)->getDisplayName();

        $a = $this->http('GET', 'search/groups?q=' . rawurlencode($sName));
        $this->assertSame(200, $a['status'], $a['body']);
        foreach ($a['json'] as $aGroup) {
            $this->assertSchema('Profile', $aGroup);
            $this->assertSame('bx_groups', $aGroup['module']);
        }
        $this->assertSame((string)$iGroup, $a['json'][0]['id'] ?? null, 'the group named so is first');
        $this->assertSame('group', $a['json'][0]['kind']);

        $this->assertSame(422, $this->http('GET', 'search/groups')['status']);
    }

    public function testSearchContentShowsOnlyWhatTheViewerMaySee(): void
    {
        $this->requireModule('bx_timeline');
        if (!array_key_exists('bx_timeline', BxDolApiV2Search::contentSections()))
            $this->markTestSkipped('The timeline is not a search section for the API.');

        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($this->ordinaryForeignProfileId($this->bxAccount('user')))];

        $sWord = 'Srch' . bin2hex(random_bytes(5));
        $aItems = [];
        foreach (['public', 'members', 'private'] as $sAudience) {
            $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>' . $sWord . ' ' . $sAudience . ' post</p>', 'audience' => $sAudience]));
            $this->assertSame(201, $a['status'], $a['body']);
            $this->_aEvents[] = (int)$a['json']['id'];
            $aItems[$sAudience] = $a['json']['object']['id'];
        }
        $aAll = [$aItems['private'], $aItems['members'], $aItems['public']];

        $fFound = function (array $aHeaders, string $sExtra = '') use ($sWord) {
            $a = $this->http('GET', 'search/content?q=' . $sWord . $sExtra, $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Hit', $a['json']);
            foreach ($a['json']['items'] as $aHit) {
                // a Hit, from the Item; the module and the activity besides
                $this->assertSame($aHit['id'], $aHit['activity']['object']['id']);
                $this->assertSame($aHit['id'], $aHit['content_id']);
                $this->assertSame('feed_post', $aHit['kind']);
                $this->assertSame($aHit['activity']['object']['card'], $aHit['card']);
                $this->assertSame($aHit['activity']['object']['author'], $aHit['author']);
                $this->assertSame($aHit['activity']['object']['published_at'], $aHit['published_at']);
                $this->assertSame('bx_timeline', $aHit['module']);
            }
            return array_column($a['json']['items'], 'content_id');
        };

        // the author finds all three, newest first
        $this->assertSame($aAll, $fFound($aAuth));
        $this->assertSame($aAll, $fFound($aAuth, '&kind=bx_timeline'));

        // a guest only the public one, never the members-only or private one
        $this->assertSame([$aItems['public']], $fFound([]));

        // another member never the private one
        $aFound = $fFound($aOther);
        $this->assertContains($aItems['public'], $aFound);
        $this->assertNotContains($aItems['private'], $aFound);

        // a page at a time, as far as the cursor goes, and nothing twice
        $fWalk = function (string $sExtra = '') use ($sWord, $aAuth) {
            $aSeen = [];
            $sCursor = null;
            for ($i = 0; $i < 10; $i++) {
                $a = $this->http('GET', 'search/content?q=' . $sWord . '&limit=1' . $sExtra . ($sCursor ? '&cursor=' . $sCursor : ''), $aAuth);
                $this->assertSame(200, $a['status'], $a['body']);
                $this->assertSchema('Page_Hit', $a['json']);
                $aSeen = array_merge($aSeen, array_column($a['json']['items'], 'content_id'));
                if (!($sCursor = $a['json']['next_cursor']))
                    break;
            }
            return $aSeen;
        };
        $this->assertSame($aAll, $fWalk());

        // the site's search params in the query change nothing: not a section's page size, start,
        // order or owner, nor the API mode
        $sStray = '&per_page=1&start=2&ownerName=nobody&userID=1&bx_timeline_mode=rand&bx_posts_mode=popular&api=1';
        $this->assertSame($aAll, $fFound($aAuth, $sStray));
        $this->assertSame($aAll, $fWalk($sStray));

        // posts of the same second: the id keeps their order from page to page
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `bx_timeline_events` SET `date` = :d WHERE `id` IN (" . $oDb->implode_escape($this->_aEvents) . ")", ['d' => time()]);
        $this->assertSame($aAll, $fFound($aAuth));
        $this->assertSame($aAll, $fWalk());

        // refusals: no words, a kind that is not searched (profiles are not content), a made-up cursor
        foreach (['?q=', '?q=' . $sWord . '&kind=no_such_module', '?q=' . $sWord . '&kind=bx_persons', '?q=' . $sWord . '&cursor=x'] as $sQuery) {
            $a = $this->http('GET', 'search/content' . $sQuery);
            $this->assertSame(422, $a['status'], $sQuery . ': ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
        }
    }

    /**
     * The site's code under the endpoints reads the request itself (bx_get): the router hands it
     * an empty one, so the params the site's own pages take change no list here.
     */
    public function testTheSitesOwnRequestParamsChangeNoList(): void
    {
        list(, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $sStray = 'start=1&per_page=1&page=2&ownerName=nobody&userID=1&owner_id=1&profile_id=1&name=x&modules=x&filter_type=x'
            . '&CmtStart=1&CmtPerView=1&CmtBrowse=head&CmtFilter=friends&CmtParent=1&bx_timeline_mode=rand&bx_posts_mode=popular&api=1';
        $fIds = function (array $a) {
            return array_map(function ($aItem) {
                return $aItem['id'] ?? ($aItem['profile']['id'] ?? json_encode($aItem));
            }, $a['json']['items'] ?? (array)$a['json']);
        };

        $iChecked = 0;
        foreach (['feeds/public', 'feeds/home', 'notifications', 'conversations', 'persons', 'groups', 'spaces', 'events', 'posts', 'discussions', 'photos', 'albums', 'videos', 'files', 'polls', 'me/tasks', 'me/groups', 'me/friend-requests'] as $sPath) {
            $aPlain = $this->http('GET', $sPath, $aAuth);
            // a module that is not installed has no such path
            if ($aPlain['status'] === 404)
                continue;
            $this->assertSame(200, $aPlain['status'], $sPath . ': ' . $aPlain['body']);
            // between two reads of the same list: a list that other tests' leftovers are still
            // changing (a feed's caches) is read again until it holds still
            for ($i = 0; $i < 3; $i++) {
                $aStray = $this->http('GET', $sPath . '?' . $sStray, $aAuth);
                $this->assertSame(200, $aStray['status'], $sPath . ': ' . $aStray['body']);
                $aAgain = $this->http('GET', $sPath, $aAuth);
                if ($fIds($aAgain) === $fIds($aPlain))
                    break;
                $aPlain = $aAgain;
            }
            $this->assertSame($fIds($aPlain), $fIds($aAgain), $sPath . ' holds still');
            $this->assertSame($fIds($aPlain), $fIds($aStray), $sPath);
            $iChecked++;

            // an item's comments, where the list has one that takes them
            foreach ($aPlain['json']['items'] ?? [] as $aItem) {
                $sContent = $aItem['content_id'] ?? ($aItem['object']['id'] ?? null);
                if (!$sContent)
                    continue;
                $aCmts = $this->http('GET', 'content/' . $sContent . '/comments', $aAuth);
                if ($aCmts['status'] !== 200)
                    continue;
                $this->assertSame($fIds($aCmts), $fIds($this->http('GET', 'content/' . $sContent . '/comments?' . $sStray, $aAuth)), 'comments of ' . $sContent);
                break;
            }
        }
        $this->assertGreaterThan(0, $iChecked);
    }

    public function testGroupPathsOnlyWhileGroupsIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aGroupPaths = ['/me/groups', '/groups', '/groups/{id}', '/groups/{id}/membership', '/groups/{id}/members', '/search/groups'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_groups']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxGroupsApiV2', $aClasses);
        $aPaths = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build()['paths'];
        foreach ($aGroupPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aPaths, $sPath . ' without Groups');
        $this->assertArrayHasKey('/profiles/{id}', $aPaths, 'the rest of the API stays');

        if (!isset($aEnabled['bx_groups']))
            return;
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxGroupsApiV2', $aClasses);
        $aPaths = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build()['paths'];
        foreach ($aGroupPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aPaths, $sPath . ' with Groups');
        $this->assertSame(array_keys((new BxDolApiV2Spec(new BxDolApiV2Router()))->build()['paths']), array_keys($aPaths), 'the site\'s own API');
    }

    /** The operations on uploads, comments and reactions, by the system class that serves each. */
    private const SHARED_OPERATIONS = [
        'BxBaseApiV2Uploads' => ['POST /uploads' => 'upload', 'GET /uploads/{id}' => 'getUpload', 'DELETE /uploads/{id}' => 'deleteUpload'],
        'BxBaseApiV2Comments' => [
            'GET /content/{id}/comments' => 'listComments', 'POST /content/{id}/comments' => 'createComment', 'GET /comments/{id}/replies' => 'listReplies',
            'PATCH /comments/{id}' => 'editComment', 'DELETE /comments/{id}' => 'deleteComment',
        ],
        'BxBaseApiV2Reactions' => [
            'GET /reactions' => 'listReactionKinds', 'GET /reactions/details' => 'listReactionDetails',
            'PUT /content/{id}/reaction' => 'react', 'DELETE /content/{id}/reaction' => 'unreact',
        ],
    ];

    public function testUploadsCommentsAndReactionsAreSystemEndpoints(): void
    {
        // read from the three classes alone: no module's class is needed to list them
        $aByClass = [];
        foreach ((new BxDolApiV2Router(array_keys(self::SHARED_OPERATIONS)))->getOperations() as $aOp)
            $aByClass[$aOp['class']][$aOp['attr']->method . ' ' . $aOp['attr']->path] = $aOp['attr']->id;
        foreach (self::SHARED_OPERATIONS as $sClass => $aExpected) {
            ksort($aExpected);
            ksort($aByClass[$sClass]);
            $this->assertSame($aExpected, $aByClass[$sClass], $sClass);
        }

        // on the site each is served by its system class, and a module's class serves none of them
        $aServedBy = [];
        foreach ((new BxDolApiV2Router())->getOperations() as $aOp)
            $aServedBy[$aOp['attr']->id][] = $aOp['class'];
        foreach (self::SHARED_OPERATIONS as $sClass => $aExpected)
            foreach ($aExpected as $sId)
                $this->assertSame([$sClass], $aServedBy[$sId] ?? [], $sId);

        // the limits they are counted in are theirs still
        $aLimits = [];
        foreach ((new BxDolApiV2Router(array_keys(self::SHARED_OPERATIONS)))->getOperations() as $aOp)
            $aLimits[$aOp['attr']->id] = $aOp['attr']->limit;
        $this->assertSame('upload', $aLimits['upload']);
        $this->assertSame(['upload' => 'upload'], array_filter($aLimits), 'only POST /uploads names a bucket of its own');
    }

    public function testUploadsCommentsAndReactionsStayInTheDocumentWithoutTheTimeline(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithout = $aEnabled;
        unset($aWithout['bx_timeline']);

        $aClasses = BxDolApiV2Router::classesFor($aWithout, array_keys($aEnabled));
        $this->assertNotContains('BxTimelineApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();

        foreach (self::SHARED_OPERATIONS as $aExpected)
            foreach ($aExpected as $sOperation => $sId) {
                list($sMethod, $sPath) = explode(' ', $sOperation);
                $this->assertSame($sId, $aSpec['paths'][$sPath][strtolower($sMethod)]['operationId'] ?? null, $sOperation . ' without the Timeline');
            }
        foreach (['/feeds/public', '/feed-posts', '/activities/{id}', '/content/{id}'] as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' is the Timeline\'s');

        // every schema the document names is in it
        $aMissing = [];
        $fWalk = function ($m) use (&$fWalk, &$aMissing, $aSpec) {
            if (!is_array($m))
                return;
            if (isset($m['$ref']) && is_string($m['$ref']) && str_starts_with($m['$ref'], '#/components/schemas/') && !isset($aSpec['components']['schemas'][substr($m['$ref'], 21)]))
                $aMissing[$m['$ref']] = true;
            array_map($fWalk, $m);
        };
        $fWalk($aSpec);
        $this->assertSame([], array_keys($aMissing));
    }

    public function testWithoutAModuleThatShowsItemsThereAreNoneToCommentOnOrReactTo(): void
    {
        // the site's table without the hooks of the Timeline's class: what a site answers while the module is off
        BxDolApiV2Router::reset();
        (new BxDolApiV2Router())->getOperations();
        $oSite = new ReflectionProperty('BxDolApiV2Router', '_aSite');
        $aTable = $oSite->getValue();
        $this->assertIsArray($aTable);

        $oUploads = new BxBaseApiV2Uploads();
        $aPurposes = array_values(array_unique(array_column($oUploads->storages(), 'purpose')));

        foreach ($aTable['hooks'] as $sMethod => $aClasses)
            $aTable['hooks'][$sMethod] = array_values(array_diff($aClasses, ['BxTimelineApiV2']));
        try {
            BxDolApiV2Router::reset();
            $oSite->setValue(null, $aTable);

            $this->assertNull(BxDolApiV2Targets::findItem(1));
            $this->assertSame([], BxDolApiV2Targets::itemIdsByComments('sys_cmts_notes', 1));
            try {
                BxDolApiV2Targets::item(1);
                $this->fail('An Item was found with no module to show it.');
            }
            catch (BxDolApiV2Problem $e) {
                $this->assertSame(404, $e->getStatus());
            }

            $oReq = new BxDolApiV2Request('GET', [], [], null, [], new BxDolApiV2Auth());
            $oReactions = new BxBaseApiV2Reactions();
            $this->assertSame([], $oReactions->listReactionKinds($oReq));
            $this->assertSame(['kinds' => [], 'display' => 'emoji', 'per_user' => 1, 'any_emoji' => false], $oReactions->listReactionDetails($oReq));

            // uploads for the other modules' purposes are taken as before; only a feed post's have nowhere to go
            $aLeft = array_values(array_unique(array_column((new BxBaseApiV2Uploads())->storages(), 'purpose')));
            $this->assertSame(array_values(array_diff($aPurposes, ['post'])), $aLeft);
        }
        finally {
            BxDolApiV2Router::reset();
        }
    }

    public function testJoinAnOpenGroupMakesAMemberListedInMyGroups(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->groupOwnerId($iViewer);
        $iGroup = $this->makeGroup($iOwner, BX_DOL_PG_ALL, false);

        $a = $this->http('GET', 'groups/' . $iGroup, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Group', $a['json']);
        $this->assertSame('public', $a['json']['visibility']);
        $this->assertSame('open', $a['json']['join_policy']);
        $this->assertTrue($a['json']['content_visible']);
        $this->assertSame(1, $a['json']['member_count'], 'the owner');
        $this->assertSame('none', $a['json']['viewer']['status']);
        $this->assertTrue($a['json']['viewer']['can_join']);
        $this->assertFalse($a['json']['viewer']['can_post'], 'only members post here');

        // the body (JoinRequest) may be left out; a bad token is refused, and nothing joined
        $a = $this->http('POST', 'groups/' . $iGroup . '/membership', $aAuth + ['Content-Type' => 'application/json'], json_encode(['token' => str_repeat('x', 256)]));
        $this->assertSame(422, $a['status'], 'a token is at most 255 characters');
        $this->assertSame('none', $this->http('GET', 'groups/' . $iGroup, $aAuth)['json']['viewer']['status'], 'nothing joined');

        $a = $this->http('POST', 'groups/' . $iGroup . '/membership', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('JoinResult', $a['json']);
        $this->assertSame('active', $a['json']['status']);
        // fields JoinRequest does not have are ignored
        foreach (['{}', json_encode(['token' => null]), json_encode(['token' => 'bogus']), json_encode(['message' => 'hi'])] as $sBody)
            $this->assertSame('active', $this->http('POST', 'groups/' . $iGroup . '/membership', $aAuth + ['Content-Type' => 'application/json'], $sBody)['json']['status'] ?? null, 'joining again with ' . $sBody);

        $a = $this->http('GET', 'me/groups', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertTrue(array_is_list($a['json']), 'a plain array');
        foreach ($a['json'] as $aGroup)
            $this->assertSchema('Group', $aGroup);
        $this->assertSame((string)$iGroup, $a['json'][0]['id'] ?? null, 'the group joined last comes first');
        $this->assertSame('member', $a['json'][0]['viewer']['role']);

        $a = $this->http('GET', 'groups/' . $iGroup, $aAuth);
        $this->assertSame('active', $a['json']['viewer']['status']);
        $this->assertTrue($a['json']['viewer']['can_post']);
        $this->assertTrue($a['json']['viewer']['can_leave']);
        $this->assertSame(2, $a['json']['member_count']);

        $a = $this->http('GET', 'groups/' . $iGroup . '/members');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Member', $a['json']);
        $aRoles = array_column(array_map(function ($a) { return ['id' => $a['profile']['id'], 'role' => $a['role']]; }, $a['json']['items']), 'role', 'id');
        $this->assertSame(['member', 'owner'], [$aRoles[(string)$iViewer] ?? null, $aRoles[(string)$iOwner] ?? null]);
        $a = $this->http('GET', 'groups/' . $iGroup . '/members?limit=1');
        $this->assertCount(1, $a['json']['items']);
        $this->assertSame((string)$iViewer, $a['json']['items'][0]['profile']['id'], 'newest member first');
        $this->assertNotNull($a['json']['next_cursor']);

        $a = $this->http('DELETE', 'groups/' . $iGroup . '/membership', $aAuth);
        $this->assertSame(204, $a['status'], $a['body']);
        $this->assertSame(204, $this->http('DELETE', 'groups/' . $iGroup . '/membership', $aAuth)['status'], 'leaving again');
        $this->assertSame('none', $this->http('GET', 'groups/' . $iGroup, $aAuth)['json']['viewer']['status'] ?? null);
        $this->assertNotContains((string)$iGroup, array_column($this->http('GET', 'me/groups', $aAuth)['json'], 'id'));
        $this->assertFalse(BxDolConnection::getObjectInstance('sys_profiles_subscriptions')->isConnected($iViewer, $iGroup), 'leaving stops the follow joining made');

        foreach (['POST', 'DELETE'] as $sMethod) {
            $a = $this->http($sMethod, 'groups/' . $iGroup . '/membership');
            $this->assertSame(401, $a['status'], $sMethod . ' as a guest');
            $this->assertSchema('Problem', $a['json']);
        }
        $this->assertSame(401, $this->http('GET', 'me/groups')['status']);
        $this->assertSame(404, $this->http('GET', 'groups/' . $iViewer, $aAuth)['status'], 'a person is no group');
        $this->assertSame(404, $this->http('POST', 'groups/999999999/membership', $aAuth)['status']);
    }

    public function testJoinAClosedGroupAsksItsAdmins(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->groupOwnerId($iViewer);
        $iGroup = $this->makeGroup($iOwner, 'c', true);

        $a = $this->http('GET', 'groups/' . $iGroup, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Group', $a['json']);
        $this->assertSame('closed', $a['json']['visibility']);
        $this->assertSame('approval', $a['json']['join_policy']);
        $this->assertFalse($a['json']['content_visible']);
        $this->assertSame('', $a['json']['about'], 'a closed group shows its name and picture only');
        $this->assertNull($a['json']['cover']);
        foreach (['groups/' . $iGroup . '/members', 'profiles/' . $iGroup . '/timeline'] as $sPath) {
            $a = $this->http('GET', $sPath, $aAuth);
            $this->assertSame(403, $a['status'], $sPath);
            $this->assertSchema('Problem', $a['json']);
        }

        $a = $this->http('POST', 'groups/' . $iGroup . '/membership', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('pending', $a['json']['status']);
        $this->assertSame('pending', $this->http('POST', 'groups/' . $iGroup . '/membership', $aAuth)['json']['status'] ?? null, 'asking again');

        // its admins are told: groups.join_requested, by the one asking, about the group
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_notifications')) {
            $a = $this->http('GET', 'notifications?limit=20', ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)]);
            $aAsked = array_values(array_filter($a['json']['items'] ?? [], function ($n) { return $n['source'] === 'bx_groups.join_request'; }));
            $this->assertNotEmpty($aAsked, 'the owner is notified: ' . $a['body']);
            $this->assertSchema('Notification', $aAsked[0]);
            $this->assertSame(['groups.join_requested', ['group_id' => (string)$iGroup], (string)$iViewer], [$aAsked[0]['kind'], $aAsked[0]['data'], $aAsked[0]['actor']['id'] ?? null]);
            $this->assertSame(['profile', (string)$iGroup], [$aAsked[0]['object_kind'], $aAsked[0]['object_id']], 'the group is the object too');
        }

        $a = $this->http('GET', 'groups/' . $iGroup, $aAuth);
        $this->assertSame('pending', $a['json']['viewer']['status']);
        $this->assertFalse($a['json']['viewer']['can_join']);
        $this->assertTrue($a['json']['viewer']['can_leave'], 'a request can be withdrawn');
        $this->assertFalse($a['json']['content_visible'], 'still outside');
        $this->assertNotContains((string)$iGroup, array_column($this->http('GET', 'me/groups', $aAuth)['json'], 'id'), 'requests are not memberships');

        $this->assertSame(204, $this->http('DELETE', 'groups/' . $iGroup . '/membership', $aAuth)['status']);
        $this->assertSame('none', $this->http('GET', 'groups/' . $iGroup, $aAuth)['json']['viewer']['status'] ?? null);

        $a = $this->http('GET', 'groups/' . $iGroup);
        $this->assertContains($a['status'], [200, 403], 'a guest sees its name, or nothing where guests may not view groups');
        if ($a['status'] === 200) {
            $this->assertSchema('Group', $a['json']);
            $this->assertNull($a['json']['viewer']);
            $this->assertFalse($a['json']['content_visible']);
        }
    }

    public function testPostIntoAGroupReachesItsFeedAndOnlyFromMembers(): void
    {
        $this->requireModule('bx_timeline');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $iOwner = $this->groupOwnerId($iViewer);
        $iOpen = $this->makeGroup($iOwner, BX_DOL_PG_ALL, false);
        $iClosed = $this->makeGroup($iOwner, 'c', true);

        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test outside</p>', 'context_id' => (string)$iOpen]));
        $this->assertSame(403, $a['status'], 'not a member yet: ' . $a['body']);
        $this->assertSchema('Problem', $a['json']);

        $this->assertSame('active', $this->http('POST', 'groups/' . $iOpen . '/membership', $aAuth)['json']['status'] ?? null);
        $a = $this->http('POST', 'feed-posts', $aAuth, json_encode(['body_html' => '<p>ApiV2Test in a group</p>', 'context_id' => (string)$iOpen]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Activity', $a['json']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $this->assertSame((string)$iOpen, $a['json']['object']['context_id']);
        $this->assertSame('context', $a['json']['object']['audience']);

        foreach ([$aAuth, []] as $aHeaders) {
            $a2 = $this->http('GET', 'profiles/' . $iOpen . '/timeline', $aHeaders);
            $this->assertSame(200, $a2['status'], $a2['body']);
            $this->assertSchema('Page_Activity', $a2['json']);
            $this->assertContains($a['json']['id'], array_column($a2['json']['items'], 'id'), 'the group\'s feed has the post');
        }

        // a member of another account outside the closed group, and the test user, who asked only
        $iOutsider = $this->ordinaryProfileIdOtherThan([$iViewer, $iOwner]);
        $aOutsider = ['Authorization' => 'Bearer ' . $this->profileToken($iOutsider), 'Content-Type' => 'application/json'];
        $this->assertSame('pending', $this->http('POST', 'groups/' . $iClosed . '/membership', $aAuth)['json']['status'] ?? null);
        foreach ([$aOutsider, $aAuth] as $aHeaders) {
            $a = $this->http('POST', 'feed-posts', $aHeaders, json_encode(['body_html' => '<p>ApiV2Test closed</p>', 'context_id' => (string)$iClosed]));
            $this->assertSame(403, $a['status'], $a['body']);
            $this->assertSchema('Problem', $a['json']);
            if (!empty($a['json']['id']))
                $this->_aEvents[] = (int)$a['json']['id'];
        }
        $this->assertFalse($this->http('GET', 'groups/' . $iClosed, $aOutsider)['json']['viewer']['can_post'] ?? true);
        $this->assertSame(401, $this->http('POST', 'feed-posts', ['Content-Type' => 'application/json'], json_encode(['body_html' => '<p>x</p>', 'context_id' => (string)$iOpen]))['status']);
    }

    public function testSecretGroupsExistOnlyForTheirMembers(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->groupOwnerId($iViewer);
        $iSecret = $this->makeGroup($iOwner, 's', true);

        foreach ([$aAuth, []] as $aHeaders) {
            foreach ([['GET', 'groups/' . $iSecret], ['GET', 'groups/' . $iSecret . '/members']] as list($sMethod, $sPath)) {
                $a = $this->http($sMethod, $sPath, $aHeaders);
                $this->assertSame(404, $a['status'], $sPath . ': ' . $a['body']);
                $this->assertSchema('Problem', $a['json']);
            }
            $this->assertNotContains((string)$iSecret, array_column($this->http('GET', 'groups?limit=50', $aHeaders)['json']['items'], 'id'));
        }
        $this->assertSame(404, $this->http('POST', 'groups/' . $iSecret . '/membership', $aAuth)['status']);
        $this->assertSame(404, $this->http('DELETE', 'groups/' . $iSecret . '/membership', $aAuth)['status']);
        // nor do the profile paths say it exists: the same answer as for an id that is no profile
        foreach ([$aAuth, []] as $aHeaders)
            foreach (['profiles/' . $iSecret, 'profiles/' . $iSecret . '/timeline', 'profiles/' . $iSecret . '/connections'] as $sPath) {
                $a = $this->http('GET', $sPath, $aHeaders);
                $this->assertSame(404, $a['status'], $sPath . ': ' . $a['body']);
                $this->assertSchema('Problem', $a['json']);
            }

        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];
        $a = $this->http('GET', 'groups/' . $iSecret, $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('secret', $a['json']['visibility']);
        $this->assertSame('owner', $a['json']['viewer']['role']);
        $this->assertContains((string)$iSecret, array_column($this->http('GET', 'me/groups', $aOwner)['json'], 'id'), 'its owner finds it');
    }

    public function testAnInvitationIsAcceptedOrDeclinedByTheInviteeOnly(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->groupOwnerId($iViewer);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer, $iOwner]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $iSecret = $this->makeGroup($iOwner, 's', true);

        // the owner invites both, as the group's Invite form does (a row of the invites table)
        $oGroups = BxDolModule::getInstance('bx_groups');
        foreach ([$iViewer, $iOther] as $iInvited)
            $oGroups->serviceAddInvitation($iSecret, $iInvited, $iOwner);
        $fInvite = function (int $iInvited) use ($oGroups, $iSecret) {
            BxDolDb::getInstance()->cleanMemoryAll();
            $a = $oGroups->_oDb->getInviteByInvited($iInvited, $iSecret);
            return is_array($a) && !empty($a['key']) ? $a['key'] : '';
        };
        $sOtherKey = $fInvite($iOther);
        $this->assertNotSame('', $fInvite($iViewer));
        $this->assertNotSame('', $sOtherKey);

        $iStranger = $this->ordinaryProfileIdOtherThan([$iViewer, $iOwner, $iOther]);
        $a = $this->http('GET', 'groups/' . $iSecret, ['Authorization' => 'Bearer ' . $this->profileToken($iStranger)]);
        $this->assertSame(404, $a['status'], 'not invited: ' . $a['body']);
        $this->assertSame(404, $this->http('GET', 'groups/' . $iSecret)['status'], 'a guest');

        // someone else's key (or a stray one) changes nothing: each invitee has their own
        foreach (['', '?key=' . rawurlencode($sOtherKey), '?key=bogus'] as $sQuery) {
            $a = $this->http('GET', 'groups/' . $iSecret . $sQuery, $aAuth);
            $this->assertSame(200, $a['status'], $sQuery . ': ' . $a['body']);
            $this->assertSchema('Group', $a['json']);
            $this->assertTrue($a['json']['content_visible'], 'an invitee sees the group');
            $this->assertSame('invited', $a['json']['viewer']['status']);
            $this->assertTrue($a['json']['viewer']['can_join']);
            $this->assertTrue($a['json']['viewer']['can_leave']);
        }

        // a stranger with the other invitee's key as a JoinRequest token gets nothing
        $a = $this->http('POST', 'groups/' . $iSecret . '/membership', ['Authorization' => 'Bearer ' . $this->profileToken($iStranger), 'Content-Type' => 'application/json'], json_encode(['token' => $sOtherKey]));
        $this->assertSame(404, $a['status'], 'a token is no invitation: ' . $a['body']);
        $this->assertSame($sOtherKey, $fInvite($iOther), 'the other invitation is untouched');

        // the viewer's own invitation is used whatever the token (or query key) says
        $a = $this->http('POST', 'groups/' . $iSecret . '/membership?key=' . rawurlencode($sOtherKey), $aAuth + ['Content-Type' => 'application/json'], json_encode(['token' => $sOtherKey]));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('JoinResult', $a['json']);
        $this->assertSame('active', $a['json']['status'], 'accepting joins at once, even a group that asks its admins');
        $this->assertSame('', $fInvite($iViewer), 'the invitation is used up');
        $this->assertSame($sOtherKey, $fInvite($iOther), 'the other invitation is untouched');
        $this->assertContains((string)$iSecret, array_column($this->http('GET', 'me/groups', $aAuth)['json'], 'id'));

        $a = $this->http('GET', 'groups/' . $iSecret, $aOther);
        $this->assertSame('invited', $a['json']['viewer']['status'] ?? null, $a['body']);
        $a = $this->http('DELETE', 'groups/' . $iSecret . '/membership', $aOther);
        $this->assertSame(204, $a['status'], $a['body']);
        $this->assertSame('', $fInvite($iOther), 'declined');
        $this->assertSame(404, $this->http('GET', 'groups/' . $iSecret, $aOther)['status'], 'a secret group is gone for one who declined');
        $this->assertSame(404, $this->http('POST', 'groups/' . $iSecret . '/membership', $aOther)['status']);
    }

    public function testAGroupThatIsNotActiveIsHidden(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->groupOwnerId($iViewer);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer, $iOwner]);
        $iGroup = $this->makeGroup($iOwner, BX_DOL_PG_ALL, false);
        $this->assertSame('active', $this->http('POST', 'groups/' . $iGroup . '/membership', $aAuth)['json']['status'] ?? null);

        // an admin suspends it, as Studio's or the moderation page's Suspend does
        BxDolProfile::getInstance($iGroup)->suspend(BX_PROFILE_ACTION_MANUAL, 0, false);
        BxDolDb::getInstance()->cleanMemoryAll();
        $this->assertSame(BX_PROFILE_STATUS_SUSPENDED, BxDolProfileQuery::getInstance()->getInfoById($iGroup)['status'] ?? '');

        $aWho = ['a member' => $aAuth, 'another person' => ['Authorization' => 'Bearer ' . $this->profileToken($iOther)], 'a guest' => []];
        foreach ($aWho as $sWho => $aHeaders) {
            foreach (['groups/' . $iGroup, 'groups/' . $iGroup . '/members', 'profiles/' . $iGroup, 'profiles/' . $iGroup . '/timeline'] as $sPath) {
                $a = $this->http('GET', $sPath, $aHeaders);
                $this->assertSame(404, $a['status'], $sWho . ', ' . $sPath . ': ' . $a['body']);
                $this->assertSchema('Problem', $a['json']);
            }
            $this->assertNotContains((string)$iGroup, array_column($this->http('GET', 'groups?limit=50', $aHeaders)['json']['items'], 'id'), $sWho);
        }
        $this->assertSame(404, $this->http('POST', 'groups/' . $iGroup . '/membership', $aWho['another person'])['status'], 'no joining it');
        BxDolDb::getInstance()->cleanMemoryAll();
        $this->assertFalse((bool)BxDolModule::getInstance('bx_groups')->serviceGetFansConnectionObject()->isConnected($iOther, $iGroup));
        $this->assertNotContains((string)$iGroup, array_column($this->http('GET', 'me/groups', $aAuth)['json'], 'id'));

        // those who may edit any group still see it, as on the site
        $a = $this->http('GET', 'groups/' . $iGroup, ['Authorization' => 'Bearer ' . $this->profileToken($this->adminProfileIdOtherThan([]))]);
        $this->assertSame(200, $a['status'], 'an administrator: ' . $a['body']);
        $this->assertSchema('Group', $a['json']);
    }

    public function testBrowseGroupsPageByPage(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->groupOwnerId($iViewer);
        $iOpen = $this->makeGroup($iOwner, BX_DOL_PG_ALL, false);
        $iClosed = $this->makeGroup($iOwner, 'c', true);

        foreach ([$aAuth, []] as $aHeaders) {
            $aSeen = [];
            $sCursor = null;
            for ($i = 0; $i < 100; $i++) {
                $a = $this->http('GET', 'groups?limit=1' . ($sCursor ? '&cursor=' . rawurlencode($sCursor) : ''), $aHeaders);
                $this->assertSame(200, $a['status'], $a['body']);
                $this->assertSchema('Page_Group', $a['json']);
                foreach ($a['json']['items'] as $aGroup) {
                    $this->assertContains($aGroup['visibility'], ['public', 'members', 'closed']);
                    $aSeen[] = $aGroup['id'];
                }
                if (!($sCursor = $a['json']['next_cursor']))
                    break;
            }
            $this->assertSame(count($aSeen), count(array_unique($aSeen)), 'no group twice');
            $this->assertContains((string)$iOpen, $aSeen);
            $this->assertContains((string)$iClosed, $aSeen, 'closed groups are found');
            $this->assertSame(array_column($this->http('GET', 'groups?limit=50', $aHeaders)['json']['items'], 'id'), array_slice($aSeen, 0, 50), 'pages of one are the same list');
        }

        $a = $this->http('GET', 'groups?cursor=nonsense');
        $this->assertSame(422, $a['status']);
        $this->assertSchema('Problem', $a['json']);
    }

    public function testDiscussionPathsOnlyWhileDiscussionsIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aForumPaths = ['/discussions', '/discussions/categories', '/discussions/{id}', '/search/discussions'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_forum']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxForumApiV2', $aClasses);
        $aPaths = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build()['paths'];
        foreach ($aForumPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aPaths, $sPath . ' without Discussions');

        if (!isset($aEnabled['bx_forum']))
            return;
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxForumApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aForumPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Discussions');
        $this->assertEqualsCanonicalizing(['get', 'patch', 'delete'], array_keys($aSpec['paths']['/discussions/{id}']));
    }

    public function testStartEditReplyToAndDeleteADiscussion(): void
    {
        $this->requireModule('bx_forum');
        $this->requireModule('bx_timeline');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $this->forgetNotificationsFromNowOn();

        $a = $this->http('GET', 'discussions/categories', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('DiscussionCategories', $a['json']);
        if (!$a['json']['can_create'] || !$a['json']['categories'])
            $this->markTestSkipped('The test user may not start discussions here.');
        $sCategory = $a['json']['categories'][0]['id'];
        $this->assertFalse($this->http('GET', 'discussions/categories')['json']['can_create'], 'guests start none');

        $sWord = 'apiv2forum' . bin2hex(random_bytes(4));
        $a = $this->http('POST', 'discussions', $aAuth, json_encode(['title' => 'ApiV2Test <discussion> ' . $sWord, 'body' => "First line\nA <b> stays text", 'category_id' => $sCategory]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Discussion', $a['json']);
        $this->_aDiscussions[] = (int)$a['json']['id'];
        $sId = $a['json']['id'];
        $this->assertStringEndsWith('/discussions/' . $sId, (string)BxDolTestPhpServer::header($a, 'location'));
        $this->assertSame('ApiV2Test <discussion> ' . $sWord, $a['json']['title'], 'the title is text as typed');
        $this->assertSame("First line\nA <b> stays text", $a['json']['body']);
        $this->assertSame('<p>First line</p><p>A &lt;b&gt; stays text</p>', $a['json']['body_html']);
        $this->assertSame((string)$iViewer, $a['json']['author']['id']);
        $this->assertSame('public', $a['json']['audience']);
        $this->assertSame($sCategory, $a['json']['category']['id']);
        $this->assertSame(0, $a['json']['stats']['replies']);
        $this->assertNull($a['json']['last_reply_at']);
        $this->assertSame(['can_edit' => true, 'can_edit_text' => true, 'can_delete' => true, 'can_reply' => true], $a['json']['viewer']);
        $this->assertNotNull($a['json']['content_id'], 'the Timeline shows it');
        $sItem = $a['json']['content_id'];
        $a = $this->http('GET', 'content/' . $sItem, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['discussion', 'bx_forum', []], [$a['json']['kind'], $a['json']['module'], $a['json']['links']], 'the kind; the module says which');

        // newest started first, as a guest sees it too
        $a = $this->http('GET', 'discussions?sort=new&limit=5');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Discussion', $a['json']);
        $this->assertSame($sId, $a['json']['items'][0]['id'] ?? null);
        $this->assertNull($a['json']['items'][0]['viewer']);
        $a = $this->http('GET', 'discussions?category=' . $sCategory . '&limit=50', $aAuth);
        $this->assertContains($sId, array_column($a['json']['items'], 'id'), 'in its category');

        // its replies are the comments of its Item
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther), 'Content-Type' => 'application/json'];
        $a = $this->http('POST', 'content/' . $sItem . '/comments', $aOther, json_encode(['body' => 'A reply from ApiV2Test']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Comment', $a['json']);
        $sReply = $a['json']['id'];

        // its author is told: discussions.reply, with the reply and the title
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_notifications')) {
            $aNotified = array_values(array_filter($this->http('GET', 'notifications?limit=20', $aAuth)['json']['items'] ?? [], function ($n) { return $n['source'] === 'bx_forum.commentPost'; }));
            $this->assertNotEmpty($aNotified, 'the author is notified of the reply');
            $this->assertSchema('Notification', $aNotified[0]);
            $this->assertSame(['discussions.reply', ['comment_id' => $sReply, 'title' => 'ApiV2Test <discussion> ' . $sWord], (string)$iOther], [$aNotified[0]['kind'], $aNotified[0]['data'], $aNotified[0]['actor']['id'] ?? null]);
        }
        $a = $this->http('GET', 'discussions/' . $sId, $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Discussion', $a['json']);
        $this->assertSame(1, $a['json']['stats']['replies']);
        $this->assertSame((string)$iOther, $a['json']['last_reply_by']['id'] ?? null);
        $this->assertNotNull($a['json']['last_reply_at']);
        $this->assertFalse($a['json']['viewer']['can_edit'], 'someone else\'s');
        $this->assertTrue($a['json']['viewer']['can_reply']);
        $this->assertGreaterThanOrEqual(1, $a['json']['stats']['views'], 'opening it is a view');
        $this->assertSame($sId, $this->http('GET', 'discussions?limit=5', $aAuth)['json']['items'][0]['id'] ?? null, 'the latest reply first');

        // only its author (or a moderator) edits or deletes it
        $a = $this->http('PATCH', 'discussions/' . $sId, $aOther, json_encode(['title' => 'Not mine']));
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSchema('Problem', $a['json']);
        $this->assertSame(403, $this->http('DELETE', 'discussions/' . $sId, $aOther)['status']);

        $a = $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode(['title' => 'ApiV2Test edited ' . $sWord, 'body' => 'Changed text']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Discussion', $a['json']);
        $this->assertSame('ApiV2Test edited ' . $sWord, $a['json']['title']);
        $this->assertSame('Changed text', $a['json']['body']);
        $this->assertSame(422, $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode([]))['status'], 'nothing to change');
        $this->assertSame(422, $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode(['audience' => 'public']))['status'], 'who sees it does not change here');

        // formatted text is edited on the site
        BxDolDb::getInstance()->query("UPDATE `bx_forum_discussions` SET `text` = '<p>A <a href=\"https://una.io\">link</a></p>' WHERE `id` = :id", ['id' => (int)$sId]);
        $a = $this->http('GET', 'discussions/' . $sId, $aAuth);
        $this->assertFalse($a['json']['viewer']['can_edit_text']);
        $this->assertTrue($a['json']['viewer']['can_edit']);
        $a = $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode(['body' => 'Plain']));
        $this->assertSame(409, $a['status'], $a['body']);
        $this->assertSame('formatted_text', $a['json']['code']);
        $this->assertSame(200, $this->http('PATCH', 'discussions/' . $sId, $aAuth, json_encode(['title' => 'ApiV2Test title only ' . $sWord]))['status'], 'its title still changes');

        $a = $this->http('DELETE', 'discussions/' . $sId, $aAuth);
        $this->assertSame(204, $a['status'], $a['body']);
        $this->assertSame(404, $this->http('GET', 'discussions/' . $sId, $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'content/' . $sItem, $aAuth)['status'], 'its activity goes with it');
        $this->assertNotContains($sId, array_column($this->http('GET', 'discussions?sort=new&limit=50')['json']['items'], 'id'));
    }

    public function testNewDiscussionsAreChecked(): void
    {
        $this->requireModule('bx_forum');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];

        $a = $this->http('POST', 'discussions', ['Content-Type' => 'application/json'], json_encode(['title' => 'x', 'body' => 'x']));
        $this->assertSame(401, $a['status']);
        $this->assertSchema('Problem', $a['json']);

        foreach ([
            [['title' => 'ApiV2Test', 'body' => " \n "], 'body'],
            [['title' => '   ', 'body' => 'Text'], 'title'],
            [['title' => 'ApiV2Test', 'body' => 'Text', 'category_id' => '999999'], 'category_id'],
            [['title' => 'ApiV2Test', 'body' => 'Text', 'audience' => 'everyone'], 'audience'],
            [['title' => 'ApiV2Test', 'body' => 'Text', 'audience' => 'public', 'context_id' => (string)$iViewer], 'audience'],
            [['title' => 'ApiV2Test', 'body' => 'Text', 'context_id' => (string)$iViewer], 'context_id'],
            [['title' => 'ApiV2Test', 'body' => 'Text', 'unknown' => 1], 'unknown'],
        ] as list($aBody, $sField)) {
            $a = $this->http('POST', 'discussions', $aAuth, json_encode($aBody));
            if (!empty($a['json']['id']))
                $this->_aDiscussions[] = (int)$a['json']['id'];
            $this->assertSame(422, $a['status'], json_encode($aBody) . ': ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
            $this->assertSame($sField, $a['json']['errors'][0]['field'] ?? null, json_encode($aBody));
        }

        foreach (['sort=oldest', 'category=999999', 'category=abc', 'context_id=' . $iViewer] as $sQuery) {
            $a = $this->http('GET', 'discussions?' . $sQuery, $aAuth);
            $this->assertSame(422, $a['status'], $sQuery . ': ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
        }
        $this->assertSame(404, $this->http('GET', 'discussions/999999999')['status']);
        $this->assertSame(401, $this->http('DELETE', 'discussions/999999999')['status']);
    }

    public function testDiscussionsInAGroupFollowTheGroup(): void
    {
        $this->requireModule('bx_forum');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $iOwner = $this->groupOwnerId($iViewer);
        $iOpen = $this->makeGroup($iOwner, BX_DOL_PG_ALL, false);
        $iClosed = $this->makeGroup($iOwner, 'c', true);
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner), 'Content-Type' => 'application/json'];

        $aNew = ['title' => 'ApiV2Test in a group', 'body' => 'For the members', 'context_id' => (string)$iOpen];
        $a = $this->http('POST', 'discussions', $aAuth, json_encode($aNew));
        if (!empty($a['json']['id']))
            $this->_aDiscussions[] = (int)$a['json']['id'];
        $this->assertSame(403, $a['status'], 'not a member yet: ' . $a['body']);
        $this->assertSchema('Problem', $a['json']);

        $this->assertSame('active', $this->http('POST', 'groups/' . $iOpen . '/membership', $aAuth)['json']['status'] ?? null);
        $a = $this->http('POST', 'discussions', $aAuth, json_encode($aNew));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Discussion', $a['json']);
        $this->_aDiscussions[] = (int)$a['json']['id'];
        $this->assertSame('context', $a['json']['audience']);
        $this->assertSame((string)$iOpen, $a['json']['context_id']);

        foreach ([$aAuth, []] as $aHeaders) {
            $a2 = $this->http('GET', 'discussions?context_id=' . $iOpen, $aHeaders);
            $this->assertSame(200, $a2['status'], $a2['body']);
            $this->assertSchema('Page_Discussion', $a2['json']);
            $this->assertSame([$a['json']['id']], array_column($a2['json']['items'], 'id'), 'the open group\'s discussions');
        }

        // the closed group's discussions are for its members only
        $a = $this->http('POST', 'discussions', $aOwner, json_encode(['title' => 'ApiV2Test closed', 'body' => 'Members only', 'context_id' => (string)$iClosed]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aDiscussions[] = (int)$a['json']['id'];
        $sClosed = $a['json']['id'];
        $this->assertSame([$sClosed], array_column($this->http('GET', 'discussions?context_id=' . $iClosed, $aOwner)['json']['items'], 'id'));
        foreach ([$aAuth, []] as $aHeaders) {
            $this->assertSame(403, $this->http('GET', 'discussions?context_id=' . $iClosed, $aHeaders)['status']);
            $this->assertSame(403, $this->http('GET', 'discussions/' . $sClosed, $aHeaders)['status']);
            $this->assertNotContains($sClosed, array_column($this->http('GET', 'discussions?sort=new&limit=50', $aHeaders)['json']['items'], 'id'));
        }
    }

    public function testADiscussionWhoseGroupIsGoneIsGone(): void
    {
        $this->requireModule('bx_forum');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $iOther = $this->groupOwnerId($iViewer);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther), 'Content-Type' => 'application/json'];
        $sWord = 'apiv2gone' . bin2hex(random_bytes(4));

        $a = $this->http('POST', 'discussions', $aAuth, json_encode(['title' => 'ApiV2Test ' . $sWord, 'body' => 'Its group goes']));
        $this->assertSame(201, $a['status'], $a['body']);
        $iId = (int)$a['json']['id'];
        $this->_aDiscussions[] = $iId;

        // deleting a group leaves its discussions behind, with the group's id as their privacy:
        // the same as a group that is no more, without deleting one (whose discussions the
        // module then can't delete either)
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `bx_forum_discussions` SET `allow_view_to` = :p WHERE `id` = :id", ['p' => -2147480000, 'id' => $iId]);
        try {
            foreach ([$aOther, $aAuth, []] as $i => $aHeaders) {
                $a2 = $this->http('GET', 'discussions/' . $iId, $aHeaders);
                $this->assertSame(404, $a2['status'], 'viewer ' . $i . ': ' . $a2['body']);
                $this->assertSchema('Problem', $a2['json']);
                $a2 = $this->http('GET', 'search/discussions?q=' . $sWord, $aHeaders);
                $this->assertSame(200, $a2['status'], 'viewer ' . $i . ': ' . $a2['body']);
                $this->assertSame([], $a2['json']['items']);
                $a2 = $this->http('GET', 'discussions?sort=new&limit=50', $aHeaders);
                $this->assertSame(200, $a2['status'], 'viewer ' . $i . ': ' . $a2['body']);
                $this->assertNotContains((string)$iId, array_column($a2['json']['items'], 'id'));
            }
            $this->assertSame(404, $this->http('PATCH', 'discussions/' . $iId, $aAuth, json_encode(['title' => 'x']))['status']);
        } finally {
            $oDb->query("UPDATE `bx_forum_discussions` SET `allow_view_to` = :p WHERE `id` = :id", ['p' => BX_DOL_PG_ALL, 'id' => $iId]);
        }
    }

    public function testSearchDiscussions(): void
    {
        $this->requireModule('bx_forum');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken, 'Content-Type' => 'application/json'];
        $sWord = 'apiv2find' . bin2hex(random_bytes(4));

        $a = $this->http('POST', 'discussions', $aAuth, json_encode(['title' => 'ApiV2Test ' . $sWord, 'body' => 'Found by its title']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aDiscussions[] = (int)$a['json']['id'];
        $a2 = $this->http('POST', 'discussions', $aAuth, json_encode(['title' => 'ApiV2Test private ' . $sWord, 'body' => 'Only mine', 'audience' => 'private']));
        $this->assertSame(201, $a2['status'], $a2['body']);
        $this->_aDiscussions[] = (int)$a2['json']['id'];
        $this->assertSame('private', $a2['json']['audience']);

        $a3 = $this->http('GET', 'search/discussions?q=' . $sWord, $aAuth);
        $this->assertSame(200, $a3['status'], $a3['body']);
        $this->assertSchema('Page_Discussion', $a3['json']);
        $this->assertEqualsCanonicalizing([$a2['json']['id'], $a['json']['id']], array_column($a3['json']['items'], 'id'), 'one\'s own private one too');

        $a3 = $this->http('GET', 'search/discussions?q=' . $sWord);
        $this->assertSame([$a['json']['id']], array_column($a3['json']['items'], 'id'), 'a guest does not find the private one');

        $a3 = $this->http('GET', 'search/discussions?q=' . $sWord . '&limit=1', $aAuth);
        $this->assertCount(1, $a3['json']['items']);
        $this->assertNotNull($a3['json']['next_cursor']);
        $a4 = $this->http('GET', 'search/discussions?q=' . $sWord . '&limit=1&cursor=' . $a3['json']['next_cursor'], $aAuth);
        $this->assertCount(1, $a4['json']['items'], 'the next page');
        $this->assertNotSame($a3['json']['items'][0]['id'], $a4['json']['items'][0]['id']);

        $this->assertSame(422, $this->http('GET', 'search/discussions?q=')['status']);
    }

    public function testConversationMessagesNewestFirst(): void
    {
        list($iProfileId, $sToken, $iOther, $aAuth, $aJson) = $this->conversationPeople();
        $iId = $this->startConversation($aJson, [$iOther], 'ApiV2Test newest first');

        $aSent = [];
        for ($i = 0; $i < 5; $i++) {
            $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aJson, json_encode(['body' => '<p>ApiV2Test reply ' . $i . '</p>']));
            $this->assertSame(201, $a['status'], $a['body']);
            $this->assertSchema('Message', $a['json']);
            $this->assertSame([], $a['json']['media']);
            $aSent[] = $a['json']['id'];
        }

        // the first page holds the newest replies, newest first
        $a = $this->http('GET', 'conversations/' . $iId . '/messages?limit=2', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Message', $a['json']);
        $this->assertSame([$aSent[4], $aSent[3]], array_column($a['json']['items'], 'id'));
        $this->assertNotNull($a['json']['next_cursor']);
        $sCursor = $a['json']['next_cursor'];

        // a reply that comes meanwhile shifts nothing: the cursor is where the page ended
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aJson, json_encode(['body' => '<p>ApiV2Test meanwhile</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sNewest = $a['json']['id'];

        $a = $this->http('GET', 'conversations/' . $iId . '/messages?limit=2&cursor=' . $sCursor, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([$aSent[2], $aSent[1]], array_column($a['json']['items'], 'id'));
        $a = $this->http('GET', 'conversations/' . $iId . '/messages?limit=2&cursor=' . $a['json']['next_cursor'], $aAuth);
        $this->assertSame([$aSent[0]], array_column($a['json']['items'], 'id'));
        $this->assertNull($a['json']['next_cursor'], 'the last page; the first message is the conversation\'s body');

        // before: older than a message one knows
        $a = $this->http('GET', 'conversations/' . $iId . '/messages?limit=3&before=' . $aSent[3], $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([$aSent[2], $aSent[1], $aSent[0]], array_column($a['json']['items'], 'id'));
        $this->assertNull($a['json']['next_cursor']);
        $a = $this->http('GET', 'conversations/' . $iId . '/messages?limit=1', $aAuth);
        $this->assertSame([$sNewest], array_column($a['json']['items'], 'id'));
        $this->assertSame(422, $this->http('GET', 'conversations/' . $iId . '/messages?before=abc', $aAuth)['status']);
        $this->assertSame(422, $this->http('GET', 'conversations/' . $iId . '/messages?cursor=bogus', $aAuth)['status']);

        // unread, read and unread again
        $aTheirs = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $a = $this->http('GET', 'conversations/' . $iId, $aTheirs);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Conversation', $a['json']);
        $this->assertSame(7, $a['json']['unread'], 'six replies and the first message');
        $this->assertFalse($a['json']['can_add_participants'], 'only who started it');
        $this->assertSame(204, $this->http('POST', 'conversations/' . $iId . '/read', $aTheirs)['status']);
        $this->assertSame(0, $this->http('GET', 'conversations/' . $iId, $aTheirs)['json']['unread']);
        $this->assertSame(204, $this->http('DELETE', 'conversations/' . $iId . '/read', $aTheirs)['status']);
        $this->assertSame(7, $this->http('GET', 'conversations/' . $iId, $aTheirs)['json']['unread']);
        $this->assertSame(204, $this->http('DELETE', 'conversations/' . $iId . '/read', $aTheirs)['status'], 'unread already: done, not refused');
        $this->assertSame(7, $this->http('GET', 'conversations/' . $iId, $aTheirs)['json']['unread']);

        // for anyone else it doesn't exist
        $aStranger = ['Authorization' => 'Bearer ' . $this->profileToken($this->ordinaryProfileIdOtherThan([$iProfileId, $iOther]))];
        foreach ([['GET', 'conversations/' . $iId . '/messages'], ['GET', 'conversations/' . $iId . '/messages?before=' . $aSent[3]], ['POST', 'conversations/' . $iId . '/read'], ['DELETE', 'conversations/' . $iId . '/read']] as list($sMethod, $sPath)) {
            $a = $this->http($sMethod, $sPath, $aStranger);
            $this->assertSame(404, $a['status'], $sMethod . ' ' . $sPath . ' ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
            $this->assertSame(401, $this->http($sMethod, $sPath)['status'], 'a guest');
        }
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aStranger + ['Content-Type' => 'application/json'], json_encode(['body' => '<p>ApiV2Test stranger</p>']));
        $this->assertSame(404, $a['status'], $a['body']);
        $this->assertSame(401, $this->http('POST', 'conversations/' . $iId . '/messages', ['Content-Type' => 'application/json'], json_encode(['body' => '<p>x</p>']))['status']);
    }

    public function testConversationMessagesWithPhotos(): void
    {
        list($iProfileId, $sToken, $iOther, $aAuth, $aJson) = $this->conversationPeople();
        $this->requireModule('bx_timeline');

        // a photo for the first message, in the module's own storage
        $a = $this->upload($aAuth, 'first.png', self::png(6, 4), ['purpose' => 'conversation']);
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Media', $a['json']);
        $sFirst = $a['json']['id'];
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_storage_ghosts` WHERE `object` = 'bx_convos_files' AND `id` = :i AND `profile_id` = :p AND `content_id` = 0", ['i' => (int)$sFirst & 0xFFFFFFFF, 'p' => $iProfileId]));

        $a = $this->upload($aAuth, 'clip.mp4', "\x00\x00\x00\x18ftypmp42", ['purpose' => 'message']);
        $this->assertSame(415, $a['status'], 'messages take photos only');
        $a = $this->upload($aAuth, 'a.png', self::png(2, 2), ['purpose' => 'no-such']);
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('purpose', $a['json']['errors'][0]['field']);
        $this->assertSame(401, $this->upload([], 'a.png', self::png(2, 2), ['purpose' => 'message'])['status']);

        // a feed post's upload is not one for a conversation
        $a = $this->upload($aAuth, 'post.png', self::png(2, 2));
        $this->assertSame(201, $a['status'], $a['body']);
        $sPost = $a['json']['id'];
        $a = $this->http('POST', 'conversations', $aJson, json_encode(['recipients' => [(string)$iOther], 'body' => '<p>ApiV2Test wrong upload</p>', 'media_ids' => [$sPost]]));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('media_ids[0]', $a['json']['errors'][0]['field']);
        $this->assertSame(204, $this->http('DELETE', 'uploads/' . $sPost, $aAuth)['status']);

        $iId = $this->startConversation($aJson, [$iOther], 'ApiV2Test with a photo', [$sFirst]);
        $a = $this->http('GET', 'conversations/' . $iId, $aAuth);
        $this->assertSchema('Conversation', $a['json']);
        $this->assertSame([$sFirst], array_column($a['json']['media'], 'id'), 'the first message shows its photo by the upload\'s id');
        $this->assertSame('image/png', $a['json']['media'][0]['mime']);

        // a reply's photo goes where the site's reply form puts it
        $a = $this->upload($aAuth, 'reply.png', self::png(4, 3), ['purpose' => 'message']);
        $this->assertSame(201, $a['status'], $a['body']);
        $sReply = $a['json']['id'];
        $this->assertSame([4, 3], [$a['json']['width'], $a['json']['height']]);

        // someone else's upload, or one taken already, is not this reply's
        $aTheirs = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aTheirs + ['Content-Type' => 'application/json'], json_encode(['body' => '<p>ApiV2Test foreign photo</p>', 'media_ids' => [$sReply]]));
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('not_found', $a['json']['errors'][0]['code']);
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aJson, json_encode(['body' => '<p>ApiV2Test first photo again</p>', 'media_ids' => [$sFirst]]));
        $this->assertSame(422, $a['status'], 'the first message took it');

        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aJson, json_encode(['body' => '<p>ApiV2Test reply with a photo</p>', 'media_ids' => [$sReply]]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Message', $a['json']);
        $this->assertSame([$sReply], array_column($a['json']['media'], 'id'));
        $sMessage = $a['json']['id'];

        $a = $this->http('GET', 'conversations/' . $iId . '/messages', $aTheirs);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Message', $a['json']);
        $this->assertSame($sMessage, $a['json']['items'][0]['id']);
        $this->assertSame([$sReply], array_column($a['json']['items'][0]['media'], 'id'), 'the other participant sees it too');
        $this->assertFalse($a['json']['items'][0]['mine']);

        $a = $this->http('DELETE', 'uploads/' . $sReply, $aAuth);
        $this->assertSame(409, $a['status'], 'a message has it');
        $this->assertSame(404, $this->http('GET', 'uploads/' . $sReply, $aTheirs)['status'], 'someone else\'s upload');
    }

    public function testConversationLastMessage(): void
    {
        list($iProfileId, $sToken, $iOther, $aAuth, $aJson) = $this->conversationPeople();
        $aTheirs = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $aTheirsJson = $aTheirs + ['Content-Type' => 'application/json'];
        $fInbox = function (array $aHeaders, int $iId) {
            $a = $this->http('GET', 'conversations?limit=50', $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Conversation', $a['json']);
            foreach ($a['json']['items'] as $aItem)
                if ($aItem['id'] === (string)$iId)
                    return $aItem;
            $this->fail('conversation ' . $iId . ' is not in the inbox');
        };

        // no replies: the first message, whitespace collapsed into one line
        $a = $this->http('POST', 'conversations', $aJson, json_encode(['recipients' => [(string)$iOther], 'body' => "<p>ApiV2Test last   message</p><p>second\tline</p>"]));
        $this->assertSame(201, $a['status'], $a['body']);
        $iId = (int)$a['json']['id'];
        $this->_aConversations[] = $iId;
        $aLast = $a['json']['last_message'];
        $this->assertSame('ApiV2Test last message second line', $aLast['text']);
        $this->assertFalse($aLast['has_media']);
        $this->assertNull($aLast['media_kind']);
        $this->assertSame((string)$iProfileId, $aLast['by']['id'], 'the viewer\'s own message is theirs too');
        $this->assertSame($a['json']['created_at'], $aLast['created_at']);
        $this->assertSame($aLast, $fInbox($aAuth, $iId)['last_message'], 'the inbox has the same');
        $this->assertSame($aLast, $fInbox($aTheirs, $iId)['last_message'], 'and so has the other one\'s');

        // a reply from the other one is the newest
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aTheirsJson, json_encode(['body' => '<p>ApiV2Test their reply</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $aTheir = $fInbox($aAuth, $iId)['last_message'];
        $this->assertSame('ApiV2Test their reply', $aTheir['text']);
        $this->assertSame((string)$iOther, $aTheir['by']['id']);
        $this->assertSame($a['json']['created_at'], $aTheir['created_at']);
        $this->assertSame($aTheir, $this->http('GET', 'conversations/' . $iId, $aAuth)['json']['last_message'], 'one conversation reads it as the inbox does');

        // then one's own
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aJson, json_encode(['body' => '<p>ApiV2Test my reply</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $aMine = $fInbox($aTheirs, $iId)['last_message'];
        $this->assertSame('ApiV2Test my reply', $aMine['text']);
        $this->assertSame((string)$iProfileId, $aMine['by']['id']);

        // a long text with multibyte characters: 200 characters at most, cut on a character
        $sLong = str_repeat("\u{3042}", 150) . "\n" . str_repeat("\u{00e9}", 150);
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aTheirsJson, json_encode(['body' => '<p>' . $sLong . '</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $sText = $fInbox($aAuth, $iId)['last_message']['text'];
        $this->assertTrue(mb_check_encoding($sText, 'UTF-8'));
        $this->assertSame(200, mb_strlen($sText));
        $this->assertSame(str_repeat("\u{3042}", 150) . ' ' . str_repeat("\u{00e9}", 48) . "\u{2026}", $sText);

        // a photo without text (the site takes none without text: the text is taken away after)
        $a = $this->upload($aAuth, 'last.png', self::png(3, 3), ['purpose' => 'message']);
        $this->assertSame(201, $a['status'], $a['body']);
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aJson, json_encode(['body' => '<p>ApiV2Test photo</p>', 'media_ids' => [$a['json']['id']]]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSame(1, (int)BxDolDb::getInstance()->query("UPDATE `bx_convos_cmts` SET `cmt_text` = '<p>&nbsp;</p>' WHERE `cmt_id` = :id", ['id' => (int)$a['json']['id']]));
        $aPhoto = $fInbox($aTheirs, $iId)['last_message'];
        $this->assertSame('', $aPhoto['text']);
        $this->assertTrue($aPhoto['has_media']);
        $this->assertSame('photo', $aPhoto['media_kind']);
        $this->assertSame((string)$iProfileId, $aPhoto['by']['id']);

        // the first message's photo, in a conversation without replies
        $a = $this->upload($aAuth, 'first-last.png', self::png(3, 3), ['purpose' => 'conversation']);
        $this->assertSame(201, $a['status'], $a['body']);
        $iPhoto = $this->startConversation($aJson, [$iOther], 'ApiV2Test first with a photo', [$a['json']['id']]);
        $aFirst = $fInbox($aTheirs, $iPhoto)['last_message'];
        $this->assertSame('ApiV2Test first with a photo', $aFirst['text']);
        $this->assertTrue($aFirst['has_media']);
        $this->assertSame('photo', $aFirst['media_kind']);
    }

    public function testConversationLastMessageSkipsWhatTheViewerCannotSee(): void
    {
        list($iProfileId, $sToken, $iOther, $aAuth, $aJson) = $this->conversationPeople();
        $aTheirs = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $aTheirsJson = $aTheirs + ['Content-Type' => 'application/json'];
        $fLast = function (array $aHeaders, int $iId) {
            $a = $this->http('GET', 'conversations?limit=50', $aHeaders);
            $this->assertSame(200, $a['status'], $a['body']);
            foreach ($a['json']['items'] as $aItem)
                if ($aItem['id'] === (string)$iId)
                    return $aItem['last_message'];
            $this->fail('conversation ' . $iId . ' is not in the inbox');
        };

        $iId = $this->startConversation($aJson, [$iOther], 'ApiV2Test hidden first');
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aTheirsJson, json_encode(['body' => '<p>ApiV2Test their visible reply</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $a = $this->http('POST', 'conversations/' . $iId . '/messages', $aJson, json_encode(['body' => '<p>ApiV2Test my held reply</p>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $iHeld = (int)$a['json']['id'];
        $iSystemId = (int)BxDolCmts::getObjectInstance('bx_convos', $iId)->getSystemId();

        foreach (['pending', 'hidden'] as $sStatus) {
            // a reply waiting for approval (auto-approve off) or hidden by a moderator
            $this->assertSame(1, (int)BxDolDb::getInstance()->query("UPDATE `sys_cmts_ids` SET `status_admin` = :status WHERE `system_id` = :system_id AND `cmt_id` = :cmt_id", ['status' => $sStatus, 'system_id' => $iSystemId, 'cmt_id' => $iHeld]), $sStatus);

            // the other one does not see it in the conversation, so not in its row either
            $aMessages = $this->http('GET', 'conversations/' . $iId . '/messages', $aTheirs);
            $this->assertSame(200, $aMessages['status'], $aMessages['body']);
            $this->assertNotContains((string)$iHeld, array_column($aMessages['json']['items'], 'id'), $sStatus . ': the conversation hides it');
            $aTheir = $fLast($aTheirs, $iId);
            $this->assertSame('ApiV2Test their visible reply', $aTheir['text'], $sStatus . ': the row has the reply before it');
            $this->assertSame((string)$iOther, $aTheir['by']['id']);
            $this->assertSame($aTheir, $this->http('GET', 'conversations/' . $iId, $aTheirs)['json']['last_message'], $sStatus . ': one conversation reads it as the inbox does');

            // who wrote it still sees their own
            $this->assertSame('ApiV2Test my held reply', $fLast($aAuth, $iId)['text'], $sStatus . ': the author sees their own');
        }
    }

    public function testConversationSnippetOfInvalidUtf8(): void
    {
        $this->requireModule('bx_convos');
        bx_import('ApiV2', 'bx_convos');
        // a /u pattern refuses invalid UTF-8: the text still comes, its whitespace collapsed
        $this->assertSame("a b\xff c", BxCnvApiV2::snippet("<p>a \n b\xff</p><p>c</p>"));
        $this->assertSame('', BxCnvApiV2::snippet('<p>&nbsp;</p>'));
    }

    public function testQueryParamsAreCheckedBeforeTheEndpointRuns(): void
    {
        // a required one left out, by its name
        $a = $this->http('GET', 'layout/resolve');
        $this->assertSame(422, $a['status']);
        $this->assertSame('validation_failed', $a['json']['code']);
        $this->assertSame([['path', 'required']], array_map(function ($a) { return [$a['field'], $a['code']]; }, $a['json']['errors']));

        // one described by a schema of its own (Platform): not one of its values
        $a = $this->http('GET', 'layout/resolve?path=%2F&platform=tv');
        $this->assertSame(422, $a['status']);
        $this->assertSame([['platform', 'invalid_value']], array_map(function ($a) { return [$a['field'], $a['code']]; }, $a['json']['errors']));

        // a list where one value goes; every error comes in one answer
        $a = $this->http('GET', 'layout/resolve?path[]=%2F&platform=tv');
        $this->assertSame(422, $a['status']);
        $this->assertSame([['path', 'invalid_type'], ['platform', 'invalid_value']], array_map(function ($a) { return [$a['field'], $a['code']]; }, $a['json']['errors']));

        // a param the operation does not declare is ignored, and a limit out of range is brought into it
        $a = $this->http('GET', 'hashtags?q=a&limit=999&utm_source=x');
        $this->assertSame(200, $a['status'], $a['body']);
    }

    public function testConversationParticipants(): void
    {
        list($iProfileId, $sToken, $iOther, $aAuth, $aJson) = $this->conversationPeople();
        $iThird = $this->ordinaryProfileIdOtherThan([$iProfileId, $iOther]);
        $iId = $this->startConversation($aJson, [$iOther], 'ApiV2Test participants');

        $a = $this->http('GET', 'conversations/' . $iId, $aAuth);
        $this->assertTrue($a['json']['can_add_participants'], $a['body']);
        $this->assertTrue($a['json']['can_leave']);

        // only who started it adds or takes out
        $aTheirs = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $a = $this->http('POST', 'conversations/' . $iId . '/participants', $aTheirs + ['Content-Type' => 'application/json'], json_encode(['profile_ids' => [(string)$iThird]]));
        $this->assertSame(403, $a['status'], $a['body']);
        $this->assertSchema('Problem', $a['json']);
        $this->assertSame(403, $this->http('DELETE', 'conversations/' . $iId . '/participants/' . $iProfileId, $aTheirs)['status']);

        // a conversation just received is unread already; marking it unread is no refusal
        $this->assertSame(204, $this->http('DELETE', 'conversations/' . $iId . '/read', $aTheirs)['status']);

        // the other one has it read and in the trash: adding someone leaves their row as it is
        $this->assertSame(204, $this->http('POST', 'conversations/' . $iId . '/read', $aTheirs)['status']);
        $this->requireModule('bx_convos');
        $oConvos = BxDolModule::getInstance('bx_convos');
        $this->assertNotEmpty($oConvos->_oDb->moveConvo($iId, $iOther, BX_CNV_FOLDER_TRASH));
        $sRows = "SELECT `folder_id`, `read_comments` FROM `bx_convos_conv2folder` WHERE `conv_id` = :c AND `collaborator` = :p";
        $aOtherRows = BxDolDb::getInstance()->getAll($sRows, ['c' => $iId, 'p' => $iOther]);
        $aMyRows = BxDolDb::getInstance()->getAll($sRows, ['c' => $iId, 'p' => $iProfileId]);
        $this->assertCount(1, $aOtherRows);
        $this->assertSame(BX_CNV_FOLDER_TRASH, (int)$aOtherRows[0]['folder_id']);

        $aThird = ['Authorization' => 'Bearer ' . $this->profileToken($iThird)];
        $this->assertSame(404, $this->http('GET', 'conversations/' . $iId, $aThird)['status'], 'not in it yet');
        $a = $this->http('POST', 'conversations/' . $iId . '/participants', $aThird + ['Content-Type' => 'application/json'], json_encode(['profile_ids' => [(string)$iThird]]));
        $this->assertSame(404, $a['status'], 'nobody outside adds themselves');
        $this->assertSame(401, $this->http('POST', 'conversations/' . $iId . '/participants', ['Content-Type' => 'application/json'], json_encode(['profile_ids' => [(string)$iThird]]))['status']);

        $a = $this->http('POST', 'conversations/' . $iId . '/participants', $aJson, json_encode(['profile_ids' => ['999999999']]));
        $this->assertSame(422, $a['status'], $a['body']);

        $a = $this->http('POST', 'conversations/' . $iId . '/participants', $aJson, json_encode(['profile_ids' => [(string)$iThird]]));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Conversation', $a['json']);
        $this->assertEqualsCanonicalizing([(string)$iProfileId, (string)$iOther, (string)$iThird], array_column($a['json']['participants'], 'id'));
        $a = $this->http('GET', 'conversations/' . $iId, $aThird);
        $this->assertSame(200, $a['status'], 'added: the conversation is theirs too');
        $this->assertSame(1, $a['json']['unread'], 'the first message, unread');
        $this->assertSame($aOtherRows, BxDolDb::getInstance()->getAll($sRows, ['c' => $iId, 'p' => $iOther]), 'still one row, in the trash, read');
        $this->assertSame($aMyRows, BxDolDb::getInstance()->getAll($sRows, ['c' => $iId, 'p' => $iProfileId]), 'who started it keeps their row too');

        // taken out again by who started it
        $this->assertSame(204, $this->http('DELETE', 'conversations/' . $iId . '/participants/' . $iThird, $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'conversations/' . $iId, $aThird)['status']);
        $this->assertSame(404, $this->http('DELETE', 'conversations/' . $iId . '/participants/' . $iThird, $aAuth)['status'], 'not in it');

        // the other one leaves
        $this->assertSame(204, $this->http('DELETE', 'conversations/' . $iId . '/participants/' . $iOther, $aTheirs)['status']);
        $this->assertSame(404, $this->http('GET', 'conversations/' . $iId, $aTheirs)['status']);
        $a = $this->http('GET', 'conversations/' . $iId, $aAuth);
        $this->assertSame([(string)$iProfileId], array_column($a['json']['participants'], 'id'));
    }

    /*
     * Helpers
     */

    /**
     * The test user and another ordinary person, for conversations.
     * @return array [profile id, token, the other's profile id, auth headers, JSON headers]
     */
    private function conversationPeople(): array
    {
        $this->requireModule('bx_convos');
        list($iProfileId, $sToken) = $this->userToken();
        $iOther = $this->ordinaryProfileIdOtherThan([$iProfileId]);
        $this->forgetNotificationsFromNowOn();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        return [$iProfileId, $sToken, $iOther, $aAuth, $aAuth + ['Content-Type' => 'application/json']];
    }

    /**
     * A conversation the test user starts; deleted for everyone after the test.
     */
    private function startConversation(array $aJson, array $aRecipients, string $sText, array $aMedia = []): int
    {
        $aBody = ['recipients' => array_map('strval', $aRecipients), 'body' => '<p>' . $sText . '</p>'];
        if ($aMedia)
            $aBody['media_ids'] = $aMedia;
        $a = $this->http('POST', 'conversations', $aJson, json_encode($aBody));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Conversation', $a['json']);
        $this->_aConversations[] = (int)$a['json']['id'];
        return (int)$a['json']['id'];
    }

    /**
     * A group made through the Groups module's own add service, as its owner made it on the site
     * (alerts, the owner's membership); deleted with its content after the test.
     * @param string $sView allow_view_to: BX_DOL_PG_ALL, 'c' (closed) or 's' (secret)
     */
    private function makeGroup(int $iOwner, string $sView, bool $bApproval): int
    {
        return $this->seedGroup($iOwner, $sView, $bApproval);
    }

    /**
     * Who owns the groups a test makes: an ordinary person of another account.
     */
    /**
     * A badge of the module (Studio > Badges), deleted after the test with its assignments.
     */
    private function makeBadge(string $sModule, string $sText, string $sIcon, string $sColor, int $iAdded, bool $bIconOnly = false): int
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_badges` (`added`, `module`, `text`, `icon`, `color`, `fontcolor`, `is_icon_only`) VALUES (:a, :m, :t, :i, :c, '', :o)", [
            'a' => $iAdded, 'm' => $sModule, 't' => $sText, 'i' => $sIcon, 'c' => $sColor, 'o' => $bIconOnly ? 1 : 0,
        ]);
        $iId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iId);
        $this->_aBadges[] = $iId;
        return $iId;
    }

    /**
     * An active person with no badges, other than these profiles.
     */
    private function profileWithoutBadges(array $aExcept): int
    {
        $aRows = array_map('intval', array_column($this->sitePeople("`type` = 'bx_persons'", 100), 'id'));
        $aBadges = $aRows ? BxDolBadges::getInstance()->getByProfileIds($aRows) : [];
        foreach ($aRows as $iId)
            if (!in_array($iId, $aExcept, true) && empty($aBadges[$iId]))
                return $iId;
        return $this->seedPooledPerson(fn($i) => !in_array($i, $aExcept, true) && !BxDolBadges::getInstance()->getByProfileIds([$i]));
    }

    private function groupOwnerId(int $iViewer): int
    {
        return $this->ordinaryProfileIdOtherThan([$iViewer]);
    }

    /**
     * The test user signed in with a session, for the site's own pages.
     * @return array [account, Cookie header value]
     */
    private function signedInUser(): array
    {
        $this->requireModule('bx_oauth');
        $oAccount = $this->bxAccount('user');
        // only on a site with no Persons module: with it, the test user is given a person
        if (!BxDolProfile::getInstanceByAccount($oAccount->id()) || !$oAccount->getProfilesIds())
            $this->markTestSkipped('The test user has no profile.');

        bx_login($oAccount->id());
        return [$oAccount, BX_DOL_SESSION_COOKIE . '=' . BxDolSession::getInstance()->getId()];
    }

    private function foreignProfileId(BxDolAccount $oAccount): int
    {
        $iAccount = (int)$oAccount->id();
        foreach ($this->sitePeople("`account_id` <> " . $iAccount . " AND `type` <> 'system'", 1) as $aRow)
            return (int)$aRow['id'];
        return $this->seedPooledPerson(fn($i) => (int)BxDolProfile::getInstance($i)->getAccountId() !== $iAccount);
    }

    /**
     * A profile of another account that is neither an admin nor a moderator.
     */
    private function ordinaryForeignProfileId(BxDolAccount $oAccount): int
    {
        $iAccount = (int)$oAccount->id();
        foreach ($this->sitePeople("`account_id` <> " . $iAccount . " AND `type` <> 'system'", 50) as $aRow)
            if (!isAdmin((int)$aRow['account_id']) && !bx_acl_is_advanced((int)$aRow['id']))
                return (int)$aRow['id'];
        return $this->seedPooledPerson(fn($i) => (int)BxDolProfile::getInstance($i)->getAccountId() !== $iAccount);
    }

    /**
     * An ordinary active person of another account with no follow and no friendship either
     * way with the profile, and no admin or moderator powers.
     */
    private function unrelatedProfileId(int $iProfileId): int
    {
        $oFollows = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        $oFriends = BxDolConnection::getObjectInstance('sys_profiles_friends');
        $iAccount = (int)BxDolProfile::getInstance($iProfileId)->getAccountId();
        $fnUnrelated = fn($i) => !$oFollows->isConnected($iProfileId, $i) && !$oFollows->isConnected($i, $iProfileId) && !$oFriends->isConnected($iProfileId, $i) && !$oFriends->isConnected($i, $iProfileId);
        foreach ($this->sitePeople("`account_id` <> " . $iAccount . " AND `type` = 'bx_persons'", 100) as $aRow) {
            $i = (int)$aRow['id'];
            if (isAdmin((int)$aRow['account_id']) || bx_acl_is_advanced($i))
                continue;
            if ($fnUnrelated($i))
                return $i;
        }
        BxDolDb::getInstance()->cleanMemoryAll();
        return $this->seedPooledPerson(fn($i) => (int)BxDolProfile::getInstance($i)->getAccountId() !== $iAccount && $fnUnrelated($i));
    }

    /**
     * The OAuth authorize endpoint, as /m/oauth2/auth (modules/index.php routes it).
     */
    private function oauthAuth(string $sMethod, array $aParams, string $sCookie): array
    {
        $this->http('GET', ''); // starts the server
        $aHeaders = ['Cookie' => $sCookie];
        if ($sMethod === 'GET')
            return $this->raw('GET', '/modules/index.php?r=oauth2/auth&' . http_build_query($aParams), $aHeaders);

        $aHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        return $this->raw('POST', '/modules/index.php?r=oauth2/auth', $aHeaders, http_build_query($aParams));
    }

    /**
     * The hidden fields of the consent form, values decoded as a browser would.
     */
    private function consentForm(string $sHtml): array
    {
        $this->assertSame(1, preg_match('#<div id="bx-auth-form".*?</form>#s', $sHtml, $m), 'the consent form');
        preg_match_all('#<input type="hidden" name="([^"]+)"[^>]*value="([^"]*)"#', $m[0], $aInputs, PREG_SET_ORDER);
        $aForm = [];
        foreach ($aInputs as $a)
            $aForm[$a[1]] = html_entity_decode($a[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return $aForm;
    }
}
