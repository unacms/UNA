<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * API v2 building blocks: the schema validator, cursors, problem documents, and the loopback
 * redirect rules of the OAuth server for native apps.
 */
class ApiV2PartsTest extends BxDolTestCase
{
    private function validator(): BxDolApiV2Validator
    {
        return new BxDolApiV2Validator([
            'Id' => ['type' => 'string', 'pattern' => '^[1-9][0-9]*$'],
            'Thing' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['id', 'name'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'name' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 5],
                    'kind' => ['type' => 'string', 'enum' => ['a', 'b']],
                    'parent' => ['oneOf' => [['$ref' => '#/components/schemas/Id'], ['type' => 'null']]],
                    'tags' => ['type' => 'array', 'maxItems' => 2, 'items' => ['type' => 'string']],
                    'note' => ['type' => ['string', 'null']],
                ],
            ],
        ]);
    }

    public static function invalidThings(): array
    {
        return [
            'missing field' => [['id' => '1'], 'name', 'required'],
            'unknown field' => [['id' => '1', 'name' => 'x', 'extra' => 1], 'extra', 'unknown_field'],
            'wrong type' => [['id' => 1, 'name' => 'x'], 'id', 'invalid_type'],
            'pattern' => [['id' => '01', 'name' => 'x'], 'id', 'invalid_format'],
            'empty string' => [['id' => '1', 'name' => ''], 'name', 'required'],
            'too long' => [['id' => '1', 'name' => 'abcdef'], 'name', 'too_long'],
            'enum' => [['id' => '1', 'name' => 'x', 'kind' => 'c'], 'kind', 'invalid_value'],
            'oneOf' => [['id' => '1', 'name' => 'x', 'parent' => 5], 'parent', 'invalid_value'],
            'too many items' => [['id' => '1', 'name' => 'x', 'tags' => ['a', 'b', 'c']], 'tags', 'too_long'],
            'item type' => [['id' => '1', 'name' => 'x', 'tags' => [1]], 'tags[0]', 'invalid_type'],
        ];
    }

    #[DataProvider('invalidThings')]
    public function testValidatorReportsTheField(array $aValue, string $sField, string $sCode): void
    {
        $aErrors = $this->validator()->validate($aValue, ['$ref' => '#/components/schemas/Thing']);

        $this->assertNotEmpty($aErrors);
        $this->assertSame($sField, $aErrors[0]['field']);
        $this->assertSame($sCode, $aErrors[0]['code']);
    }

    public function testValidatorAcceptsAValidValue(): void
    {
        $aValue = ['id' => '12', 'name' => 'héllo', 'kind' => 'a', 'parent' => null, 'tags' => ['x'], 'note' => null];
        $this->assertSame([], $this->validator()->validate($aValue, ['$ref' => '#/components/schemas/Thing']));
    }

    public function testCursorsRoundTripAndAreOpaque(): void
    {
        $s = BxDolApiV2Request::encodeCursor(['o' => 40]);
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]+$/', $s);
        $this->assertSame(['o' => 40], BxDolApiV2Request::decodeCursor($s));
        $this->assertNull(BxDolApiV2Request::decodeCursor('not a cursor!'));
    }

    public function testPageSaysWhetherThereIsMore(): void
    {
        $oReq = $this->request(['limit' => '2']);

        $aPage = $oReq->page([1, 2, 3], 0, 2);
        $this->assertSame([1, 2], $aPage['items']);
        $this->assertSame(['o' => 2], BxDolApiV2Request::decodeCursor($aPage['next_cursor']));

        $this->assertNull($oReq->page([1, 2], 0, 2)['next_cursor']);
    }

    public function testKeysetPageContinuesBeforeTheLastItem(): void
    {
        $aPage = $this->request([])->pageBefore([['id' => 9], ['id' => 7], ['id' => 4]], 2, function ($a) { return $a['id']; });
        $this->assertSame(['b' => 7], BxDolApiV2Request::decodeCursor($aPage['next_cursor']));
        $this->assertSame([['id' => 9], ['id' => 7]], $aPage['items']);

        $this->assertNull($this->request([])->pageBefore([['id' => 9]], 2, function ($a) { return $a['id']; })['next_cursor']);
    }

    public function testPagesWhoseEndpointKnowsWhereTheNextStarts(): void
    {
        $oReq = $this->request([]);

        // a short page (hidden rows were skipped) still goes on from the row the scan reached
        $aPage = $oReq->pageAt([1], 7);
        $this->assertSame([1], $aPage['items']);
        $this->assertSame(['o' => 7], BxDolApiV2Request::decodeCursor($aPage['next_cursor']));
        $this->assertNull($oReq->pageAt([1, 2], null)['next_cursor']);
        $this->assertNull($oReq->pageAt([], BxDolApiV2Request::OFFSET_MAX + 1)['next_cursor']);

        // even an empty page can continue: the scan stopped at its row budget
        $aPage = $oReq->pageBeforeAt([], 120);
        $this->assertSame([], $aPage['items']);
        $this->assertSame(['b' => 120], BxDolApiV2Request::decodeCursor($aPage['next_cursor']));
        $this->assertNull($oReq->pageBeforeAt([['id' => 3]], 0)['next_cursor']);
    }

    public static function origins(): array
    {
        return [
            'default https port' => ['https://Community.example', 'https://community.example'],
            'explicit default port' => ['https://community.example:443/path?q=1', 'https://community.example'],
            'other port' => ['https://community.example:8443', 'https://community.example:8443'],
            'http' => ['http://community.example', 'http://community.example'],
            'http default port' => ['http://community.example:80/', 'http://community.example'],
            'not http' => ['ftp://community.example', null],
            'no host' => ['null', null],
            'empty' => ['', null],
        ];
    }

    #[DataProvider('origins')]
    public function testOriginsCompareSchemeHostAndPort(string $sUrl, ?string $sOrigin): void
    {
        $this->assertSame($sOrigin, BxDolApiV2Auth::origin($sUrl));
    }

    public function testOnlyTheBearerSchemeIsAToken(): void
    {
        $this->assertTrue(BxDolApiV2Auth::isBearer('Bearer abc'));
        $this->assertTrue(BxDolApiV2Auth::isBearer('bearer abc'));
        $this->assertTrue(BxDolApiV2Auth::isBearer('Bearer'), 'a Bearer header without a token is still a (bad) token');
        $this->assertFalse(BxDolApiV2Auth::isBearer('Basic dTpw'));
        $this->assertFalse(BxDolApiV2Auth::isBearer('Bearerish abc'));
        $this->assertFalse(BxDolApiV2Auth::isBearer(''));
    }

    public function testBadCursorAndLimitAreValidationProblems(): void
    {
        foreach ([['cursor' => 'x!'], ['cursor' => BxDolApiV2Request::encodeCursor(['o' => -1])]] as $aQuery) {
            try {
                $this->request($aQuery)->cursorOffset();
                $this->fail('A bad cursor was accepted');
            } catch (BxDolApiV2Problem $e) {
                $this->assertSame(422, $e->getStatus());
            }
        }

        // a number out of range is clamped; only a non-number is refused
        $this->assertSame(BxDolApiV2Request::LIMIT_MAX, $this->request(['limit' => '999'])->limit());
        $this->assertSame(1, $this->request(['limit' => '0'])->limit());
        $this->expectException(BxDolApiV2Problem::class);
        $this->request(['limit' => '-1'])->limit();
    }

    public function testProblemDocumentShape(): void
    {
        $a = BxDolApiV2Problem::validation([['field' => 'body', 'code' => 'required', 'message' => 'Is required']])->toArray();

        $this->assertSame(422, $a['status']);
        $this->assertSame('validation_failed', $a['code']);
        $this->assertSame('Unprocessable Content', $a['title']);
        $this->assertSame('urn:una:problem:validation_failed', $a['type'], 'the problem type: the code as it is');
        $this->assertSame('urn:una:problem:not_found', BxDolApiV2Problem::notFound()->toArray()['type']);
        $this->assertSame('body', $a['errors'][0]['field']);
    }

    public static function storedDimensions(): array
    {
        return [
            'width x height' => ['640x480', [640, 480]],
            'spaces and capital X' => [' 1200 X 800 ', [1200, 800]],
            'empty' => ['', [null, null]],
            'zero side' => ['0x480', [null, null]],
            'not a size' => ['640', [null, null]],
            'negative' => ['-640x480', [null, null]],
            'not a string' => [null, [null, null]],
        ];
    }

    #[DataProvider('storedDimensions')]
    public function testMediaDimensionsFromAStorageRow($mDimensions, array $aExpected): void
    {
        $this->assertSame($aExpected, BxDolApiV2Map::dimensions($mDimensions));
    }

    public function testPlainTextBecomesEscapedParagraphsAndBack(): void
    {
        $sText = "1 < 2 & <b>x</b> \"q\" 'a'\r\n\r\nGrüße 日本\nlast  ";
        $sHtml = BxDolApiV2Map::htmlFromText($sText);
        $this->assertSame('<p>1 &lt; 2 &amp; &lt;b&gt;x&lt;/b&gt; &quot;q&quot; &#039;a&#039;</p><p>Grüße 日本</p><p>last</p>', $sHtml);
        $this->assertSame("1 < 2 & <b>x</b> \"q\" 'a'\nGrüße 日本\nlast", BxDolApiV2Map::text($sHtml), 'blank lines go, the rest comes back');
        $this->assertSame($sHtml, BxDolApiV2Map::htmlFromText(BxDolApiV2Map::text($sHtml)), 'stable once round');
        $this->assertSame('', BxDolApiV2Map::htmlFromText(" \n\t\n"));
    }

    public static function commentHtml(): array
    {
        return [
            'paragraphs' => ['<p>a</p><p>b &lt;c&gt;</p>', true],
            'line breaks' => ['a<br />b<br>c<BR/>', true],
            'text only' => ['plain', true],
            'link' => ['<p>See <a href="https://x/">this</a></p>', false],
            'mention' => ['<p><a class="bx-mention" href="/u/1">@Lily</a></p>', false],
            'bold' => ['<p><b>x</b></p>', false],
            'paragraph with a style' => ['<p style="text-align:center">x</p>', false],
            'image' => ['<img src="x">', false],
        ];
    }

    #[DataProvider('commentHtml')]
    public function testPlainHtmlIsOnlyParagraphsAndLineBreaks(string $sHtml, bool $bPlain): void
    {
        $this->assertSame($bPlain, BxDolApiV2Map::isPlainHtml($sHtml));
    }

    public static function loopbackRedirects(): array
    {
        $sReg = 'http://127.0.0.1/callback';
        return [
            'any port' => [$sReg, 'http://127.0.0.1:53682/callback', true],
            'no port' => [$sReg, 'http://127.0.0.1/callback', true],
            'ipv6' => ['http://[::1]/callback', 'http://[::1]:4000/callback', true],
            'other path' => [$sReg, 'http://127.0.0.1:53682/other', false],
            'longer path' => [$sReg, 'http://127.0.0.1:53682/callback/x', false],
            'userinfo trick' => [$sReg, 'http://127.0.0.1:80@evil.example/callback', false],
            'localhost name' => [$sReg, 'http://localhost:53682/callback', false],
            'https' => [$sReg, 'https://127.0.0.1:53682/callback', false],
            'query' => [$sReg, 'http://127.0.0.1:53682/callback?x=1', false],
            'fixed port kept' => ['http://127.0.0.1:8000/callback', 'http://127.0.0.1:8001/callback', false],
        ];
    }

    #[DataProvider('loopbackRedirects')]
    public function testLoopbackRedirectRules(string $sRegistered, string $sInput, bool $bMatches): void
    {
        $this->loadOAuthController();
        $this->assertTrue(BxOAuthAuthorizeController::isLoopbackUri($sRegistered));
        $this->assertSame($bMatches, BxOAuthAuthorizeController::isSameLoopbackUri($sInput, $sRegistered));
    }

    public static function siteLinks(): array
    {
        // relative to the site's own root, whatever it is on the machine running the tests
        return [
            'page link' => ['{root}page.php?i=item&id=5', 'page.php?i=item&id=5'],
            'permalink' => ['{root}item?id=5', 'item?id=5'],
            'seo link' => ['{root}view-persons-profile/lily', 'view-persons-profile/lily'],
            'fragment dropped' => ['{root}page.php?i=item&id=5#cmt-1', 'page.php?i=item&id=5'],
            'the other scheme' => ['{other-scheme}item?id=5', 'item?id=5'],
            'host case' => ['{upper-host}item?id=5', 'item?id=5'],
            'root itself' => ['{root}', ''],
            'another host' => ['https://example.com/item?id=5', null],
            'a host that only starts like it' => ['{longer-host}item?id=5', null],
            'not http' => ['ftp://example.com/x', null],
            'user info' => ['{userinfo}item?id=5', null],
            'not a link' => ['item?id=5', null],
        ];
    }

    #[DataProvider('siteLinks')]
    public function testLinksToThisSiteAreReadRelativeToItsRoot(string $sLink, ?string $sRelative): void
    {
        $a = parse_url(BX_DOL_URL_ROOT);
        $sHostPort = $a['host'] . (isset($a['port']) ? ':' . $a['port'] : '');
        $sPath = $a['path'] ?? '/';
        $sLink = strtr($sLink, [
            '{root}' => BX_DOL_URL_ROOT,
            '{other-scheme}' => ($a['scheme'] === 'https' ? 'http' : 'https') . '://' . $sHostPort . $sPath,
            '{upper-host}' => $a['scheme'] . '://' . mb_strtoupper($a['host']) . (isset($a['port']) ? ':' . $a['port'] : '') . $sPath,
            '{longer-host}' => $a['scheme'] . '://' . $a['host'] . '.example.com' . $sPath,
            '{userinfo}' => $a['scheme'] . '://me@' . $sHostPort . $sPath,
        ]);
        $this->assertSame($sRelative, BxDolApiV2Targets::relativeUrl($sLink), $sLink);
    }

    public function testTargetsHaveAKindAndIds(): void
    {
        $this->assertSame(['kind' => 'comment', 'id' => 7, 'item_id' => 3, 'thread_id' => 0], BxDolApiV2Targets::make(BxDolApiV2Targets::COMMENT, '7', '3'));
    }

    public function testSearchRanksTheNameFirst(): void
    {
        $aCandidates = [
            ['id' => 1, 'name' => 'Ann Lilyson'],
            ['id' => 2, 'name' => 'Lilyana Moss'],
            ['id' => 3, 'name' => 'lily'],
            ['id' => 4, 'name' => 'Tom Lily-Ward'],
            ['id' => 5, 'name' => 'Philly Lane'],
            ['id' => 6, 'name' => 'Someone', 'exact' => true],
        ];
        // the whole name in any case, starts with, a word starts with, the rest
        $aNoHandle = array_slice($aCandidates, 0, 5);
        $aNoHandle[] = ['id' => 6, 'name' => 'Someone'];
        $this->assertSame([3, 2, 1, 4, 5, 6], BxDolApiV2Search::rank(' LILY ', $aNoHandle));
        // the exact handle ranks with the whole name, in the order they came
        $this->assertSame([6, 3, 2, 1, 4, 5], BxDolApiV2Search::rank('lily', [$aCandidates[5], $aCandidates[0], $aCandidates[1], $aCandidates[2], $aCandidates[3], $aCandidates[4]]));

        // multibyte names, and the order of equals stays as it came
        $this->assertSame([12, 10, 11], BxDolApiV2Search::rank('ÉLO', [['id' => 10, 'name' => 'Éloïse Durand'], ['id' => 11, 'name' => 'Anne Éloïse'], ['id' => 12, 'name' => 'élo']]));
        $this->assertSame([7, 8], BxDolApiV2Search::rank('x', [['id' => 7, 'name' => 'ab'], ['id' => 8, 'name' => 'cd']]));
        $this->assertSame([], BxDolApiV2Search::rank('x', []));
    }

    public function testSearchMergesSectionsNewestFirst(): void
    {
        $aQueues = [
            0 => [['id' => 1, 'date' => 50], ['id' => 2, 'date' => 30], ['id' => 3, 'date' => 10]],
            1 => [['id' => 7, 'date' => 40], ['id' => 8, 'date' => 30]],
            2 => [],
        ];
        list($aPage, $aTaken) = BxDolApiV2Search::merge($aQueues, 4);
        // a tie goes to the earlier section; what each gives is the start of its rows
        $this->assertSame([[0, 1], [1, 7], [0, 2], [1, 8]], array_map(function ($a) { return [$a[0], $a[1]['id']]; }, $aPage));
        $this->assertSame([0 => 2, 1 => 2, 2 => 0], $aTaken);

        list($aPage, $aTaken) = BxDolApiV2Search::merge($aQueues, 10);
        $this->assertCount(5, $aPage);
        $this->assertSame([0 => 3, 1 => 2, 2 => 0], $aTaken);
    }

    public function testGroupVisibilityFromItsViewPrivacy(): void
    {
        $aCases = [
            BX_DOL_PG_ALL => 'public',
            BX_DOL_PG_MEMBERS => 'members',
            'c' => 'closed',
            's' => 'secret',
            '-13' => 'context',
            BX_DOL_PG_MEONLY => 'other',
            BX_DOL_PG_CUSTOM => 'other',
            '' => 'other',
        ];
        foreach ($aCases as $sView => $sVisibility)
            $this->assertSame($sVisibility, BxBaseModGroupsApiV2::visibility((string)$sView), 'allow_view_to ' . var_export($sView, true));

        $aEnum = BxBaseModGroupsApiV2::schemas()['GroupVisibility']['enum'];
        $this->assertSame([], array_diff(array_values($aCases), $aEnum), 'every answer is in the schema');
    }

    public function testRouterTakesTheRequestParamsAwayFromTheSitesCode(): void
    {
        $aKeep = [$_GET, $_POST, $_REQUEST];
        try {
            $_GET = ['limit' => '5', 'per_page' => '1000'];
            $_POST = ['purpose' => 'post'];
            $_REQUEST = $_GET + $_POST;
            $this->assertSame([['limit' => '5', 'per_page' => '1000'], ['purpose' => 'post']], BxDolApiV2Router::takeRequest());
            $this->assertSame([[], [], []], [$_GET, $_POST, $_REQUEST]);
            // what the site's code reads the request with
            $this->assertFalse(bx_get('per_page'));
        }
        finally {
            list($_GET, $_POST, $_REQUEST) = $aKeep;
        }
    }

    public function testRouterListsOnlyEnabledModulesEndpoints(): void
    {
        $aModule = ['name' => 'bx_groups', 'path' => 'boonex/groups/', 'class_prefix' => 'BxGroups'];
        $aWithout = BxDolApiV2Router::classesFor([], ['bx_groups']);
        $this->assertNotContains('BxGroupsApiV2', $aWithout, 'named as having a file, but not enabled');
        $this->assertContains('BxBaseApiV2Profiles', $aWithout, 'system endpoints stay');

        $this->assertContains('BxGroupsApiV2', BxDolApiV2Router::classesFor(['bx_groups' => $aModule], ['bx_groups']));
        $this->assertNotContains('BxGroupsApiV2', BxDolApiV2Router::classesFor(['bx_groups' => $aModule], []), 'no file listed');
        $this->assertNotContains('BxNoSuchApiV2', BxDolApiV2Router::classesFor(['bx_nosuch' => ['name' => 'bx_nosuch', 'path' => 'boonex/nosuch/', 'class_prefix' => 'BxNoSuch']], ['bx_nosuch']), 'a file that is gone');
    }

    public function testKeptRouteTableIsTheOneReadFromTheClasses(): void
    {
        BxDolApiV2Router::reset();
        try {
            // the site's own router keeps its table (or reads the kept one); one given its classes never does
            $oSite = new BxDolApiV2Router();
            $aSite = $oSite->getOperations();
            $aClasses = $oSite->endpointClasses();
            $aRead = (new BxDolApiV2Router($aClasses))->getOperations();

            $this->assertNotEmpty($aRead);
            $this->assertInstanceOf(BxDolApiV2Operation::class, $aSite[0]['attr']);
            $this->assertEquals($aRead, $aSite);
            $this->assertEquals((new BxDolApiV2Router($aClasses))->getSchemas(), $oSite->getSchemas());

            if (!getParam('sys_db_cache_enable'))
                return;

            $aModules = array_column(BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]), 'name');
            $aKept = BxDolDb::getInstance()->getCache(BxDolApiV2Router::tableCacheName($aModules, getParam('sys_revision')), 'getAll');
            $this->assertTrue(BxDolApiV2Router::isFresh($aKept), 'the table is kept, and its files are as they were');

            $aBuilt = BxDolApiV2Router::buildTable($aClasses);
            $this->assertSame($aBuilt['operations'], $aKept['operations']);
            $this->assertSame($aBuilt['hooks'], $aKept['hooks']);
            $this->assertSame($aBuilt['files'], $aKept['files']);
            $this->assertSame($aClasses, array_keys($aKept['classes']));

            // the next request reads the kept table and serves the same operations
            BxDolApiV2Router::reset();
            $this->assertEquals($aRead, (new BxDolApiV2Router())->getOperations());
        }
        finally {
            BxDolApiV2Router::reset();
        }
    }

    public function testRouteTableIsKeptPerSetOfModulesAndRevision(): void
    {
        $sName = BxDolApiV2Router::tableCacheName(['bx_posts', 'bx_groups'], '10');
        $this->assertSame($sName, BxDolApiV2Router::tableCacheName(['bx_groups', 'bx_posts'], '10'), 'the order of the modules does not matter');
        $this->assertNotSame($sName, BxDolApiV2Router::tableCacheName(['bx_posts'], '10'), 'a module was disabled');
        $this->assertNotSame($sName, BxDolApiV2Router::tableCacheName(['bx_posts', 'bx_groups', 'bx_polls'], '10'), 'a module was enabled');
        $this->assertNotSame($sName, BxDolApiV2Router::tableCacheName(['bx_posts', 'bx_groups'], '11'), 'an update');
    }

    public function testKeptRouteTableIsBuiltAgainWhenAFileChanged(): void
    {
        $aTable = BxDolApiV2Router::buildTable(['BxBaseApiV2System']) + ['classes' => ['BxBaseApiV2System' => '']];
        $this->assertTrue(BxDolApiV2Router::isFresh($aTable));
        $this->assertArrayHasKey((new ReflectionClass('BxBaseApiV2System'))->getFileName(), $aTable['files']);

        $this->assertFalse(BxDolApiV2Router::isFresh(false), 'nothing kept');
        $this->assertFalse(BxDolApiV2Router::isFresh(null), 'nothing kept');
        $this->assertFalse(BxDolApiV2Router::isFresh(['format' => BxDolApiV2Router::TABLE_FORMAT + 1] + $aTable), 'another format');
        $this->assertFalse(BxDolApiV2Router::isFresh(array_diff_key($aTable, ['classes' => 1])), 'a part is missing');

        $sFile = tempnam(sys_get_temp_dir(), 'apiv2');
        try {
            $aWithFile = $aTable;
            $iModified = filemtime($sFile);
            $aWithFile['files'][$sFile] = BxDolApiV2Router::fileStamp($sFile);
            $this->assertTrue(BxDolApiV2Router::isFresh($aWithFile));

            touch($sFile, $iModified + 5);
            clearstatcache();
            $this->assertFalse(BxDolApiV2Router::isFresh($aWithFile), 'a file changed');

            file_put_contents($sFile, '<?php // edited');
            touch($sFile, $iModified);
            clearstatcache();
            $this->assertFalse(BxDolApiV2Router::isFresh($aWithFile), 'a file edited within the same second');

            unlink($sFile);
            clearstatcache();
            $this->assertFalse(BxDolApiV2Router::isFresh($aWithFile), 'a file is gone');
        }
        finally {
            if (is_file($sFile))
                unlink($sFile);
        }
    }

    public function testRouterOfGivenClassesServesOnlyThose(): void
    {
        $oRouter = new BxDolApiV2Router(['BxBaseApiV2System']);
        $aOperations = $oRouter->getOperations();

        $this->assertNotEmpty($aOperations);
        $this->assertSame(['BxBaseApiV2System'], array_values(array_unique(array_column($aOperations, 'class'))));
        $this->assertSame(['BxBaseApiV2System'], $oRouter->endpointClasses());
        $this->assertArrayHasKey('Problem', $oRouter->getSchemas());
        $this->assertSame([], (new BxDolApiV2Router([]))->getOperations());
    }

    public function testQueryRulesHoldTheSchemasTheParamsReferTo(): void
    {
        $aSchemas = [
            'Id' => ['type' => 'string', 'pattern' => '^[1-9][0-9]{0,18}$'],
            'Kind' => ['$ref' => '#/components/schemas/KindName'],
            'KindName' => ['type' => 'string', 'enum' => ['a', 'b']],
            'Loop' => ['$ref' => '#/components/schemas/Loop'],
        ];
        $oOp = new BxDolApiV2Operation('GET', '/things/{id}', 'listThings', 'Things', 'Things', paged: true, params: [
            'id' => ['in' => 'path', 'schema' => ['type' => 'string']],
            'owner_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id']],
            'kind' => ['schema' => ['$ref' => '#/components/schemas/Kind'], 'required' => true],
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['new', 'old'], 'default' => 'new']],
            'limit' => ['in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 20]],
            'nowhere' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Missing']],
            'loop' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Loop']],
            'bare' => ['in' => 'query'],
        ]);

        $this->assertSame([
            'owner_id' => ['required' => false, 'schema' => ['type' => 'string', 'pattern' => '^[1-9][0-9]{0,18}$']],
            // a reference to a reference; a param with no `in` is a query param
            'kind' => ['required' => true, 'schema' => ['type' => 'string', 'enum' => ['a', 'b']]],
            'sort' => ['required' => false, 'schema' => ['type' => 'string', 'enum' => ['new', 'old'], 'default' => 'new']],
            // a reference that leads nowhere, or back to itself, is not checked
            'nowhere' => ['required' => false, 'schema' => null],
            'loop' => ['required' => false, 'schema' => null],
            'bare' => ['required' => false, 'schema' => null],
        ], BxDolApiV2Router::queryRules($oOp, $aSchemas), 'the path param and the paging params (cursor, limit) are not the router\'s to check');
    }

    public static function queries(): array
    {
        $aRules = [
            'q' => ['required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 5]],
            'sort' => ['required' => false, 'schema' => ['type' => 'string', 'enum' => ['new', 'old'], 'default' => 'new']],
            'owner_id' => ['required' => false, 'schema' => ['type' => 'string', 'pattern' => '^[1-9][0-9]{0,18}$']],
            'count' => ['required' => false, 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50]],
            'counts' => ['required' => false, 'schema' => ['type' => 'boolean', 'default' => false]],
            'free' => ['required' => false, 'schema' => null],
        ];
        return [
            'all valid' => [$aRules, ['q' => 'tea', 'sort' => 'old', 'owner_id' => '12', 'count' => '50', 'counts' => 'true', 'free' => 'x'], []],
            'only what is required' => [$aRules, ['q' => 'tea'], []],
            'an empty value is a param left out' => [$aRules, ['q' => 'tea', 'sort' => '', 'count' => ''], []],
            'an undeclared param is ignored' => [$aRules, ['q' => 'tea', 'utm_source' => 'x', 'other' => ['a']], []],
            'required and missing' => [$aRules, [], [['q', 'required']]],
            'required and empty' => [$aRules, ['q' => ''], [['q', 'required']]],
            'too long' => [$aRules, ['q' => 'oolong'], [['q', 'too_long']]],
            'counted in characters' => [$aRules, ['q' => "\u{0447}\u{0430}\u{0439}\u{0447}\u{0430}"], []],
            'not one of the values' => [$aRules, ['q' => 'tea', 'sort' => 'best'], [['sort', 'invalid_value']]],
            'not an id' => [$aRules, ['q' => 'tea', 'owner_id' => '0'], [['owner_id', 'invalid_format']]],
            'not a number' => [$aRules, ['q' => 'tea', 'count' => 'ten'], [['count', 'invalid_type']]],
            'a fraction' => [$aRules, ['q' => 'tea', 'count' => '1.5'], [['count', 'invalid_type']]],
            'a number out of range' => [$aRules, ['q' => 'tea', 'count' => '51'], [['count', 'out_of_range']]],
            'a negative number' => [$aRules, ['q' => 'tea', 'count' => '-1'], [['count', 'out_of_range']]],
            'booleans as 1 and 0' => [$aRules, ['q' => 'tea', 'counts' => '0'], []],
            'not a boolean' => [$aRules, ['q' => 'tea', 'counts' => 'yes'], [['counts', 'invalid_type']]],
            'a list where one value goes' => [$aRules, ['q' => ['tea', 'mate']], [['q', 'invalid_type']]],
            'every error at once' => [$aRules, ['sort' => 'best', 'count' => '0'], [['q', 'required'], ['sort', 'invalid_value'], ['count', 'out_of_range']]],
            'no rules' => [[], ['q' => ['a']], []],
        ];
    }

    #[DataProvider('queries')]
    public function testRouterChecksTheDeclaredQueryParams(array $aRules, array $aQuery, array $aExpected): void
    {
        $aErrors = BxDolApiV2Router::checkQuery($aRules, $aQuery);
        $this->assertSame($aExpected, array_map(function ($a) { return [$a['field'], $a['code']]; }, $aErrors));
        foreach ($aErrors as $aError)
            $this->assertNotSame('', (string)$aError['message']);
    }

    public function testEveryQueryParamOfTheSiteHasItsSchemaKept(): void
    {
        BxDolApiV2Router::reset();
        try {
            $oRouter = new BxDolApiV2Router();
            $aSchemas = $oRouter->getSchemas();
            $iChecked = 0;
            foreach ($oRouter->getOperations() as $aOp) {
                $sWhere = $aOp['attr']->method . ' ' . $aOp['attr']->path;
                // what is kept with the route table is what the classes say now
                $this->assertSame(BxDolApiV2Router::queryRules($aOp['attr'], $aSchemas), $aOp['query'], $sWhere);
                foreach ($aOp['query'] as $sName => $aRule) {
                    if (!isset($aOp['attr']->params[$sName]['schema']))
                        continue;
                    $this->assertIsArray($aRule['schema'], $sWhere . ' ?' . $sName . ': its schema refers to one that is not there');
                    $this->assertStringNotContainsString('$ref', json_encode($aRule['schema']), $sWhere . ' ?' . $sName);
                    $iChecked++;
                }
            }
            $this->assertGreaterThan(20, $iChecked);
        } finally {
            BxDolApiV2Router::reset();
        }
    }

    public function testHooksAreTheClassesThatHaveTheMethod(): void
    {
        BxDolApiV2Router::reset();
        try {
            $aClasses = (new BxDolApiV2Router())->endpointClasses();
            foreach (['apiV2ModuleInfo', 'apiV2Sync', 'apiV2ContentTarget'] as $sMethod) {
                $aExpected = array_values(array_filter($aClasses, function ($sClass) use ($sMethod) {
                    return method_exists($sClass, $sMethod);
                }));
                $this->assertSame($aExpected, array_map('get_class', BxDolApiV2Router::hooks($sMethod)), $sMethod);
            }
            $this->assertSame([], BxDolApiV2Router::hooks('apiV2NoSuchHook'));
        }
        finally {
            BxDolApiV2Router::reset();
        }
    }

    public function testRateLimitWindowsAreMinutesOfTheClock(): void
    {
        $this->assertSame(60, BxDolApiV2RateLimit::WINDOW);

        $this->assertSame(120, BxDolApiV2RateLimit::windowStart(120));
        $this->assertSame(120, BxDolApiV2RateLimit::windowStart(179));
        $this->assertSame(180, BxDolApiV2RateLimit::windowStart(180));
        $this->assertSame(1000, BxDolApiV2RateLimit::windowStart(1007, 10), 'a window of another length');

        $this->assertSame(60, BxDolApiV2RateLimit::retryAfter(120), 'a whole window at its start');
        $this->assertSame(15, BxDolApiV2RateLimit::retryAfter(165));
        $this->assertSame(1, BxDolApiV2RateLimit::retryAfter(179), 'never 0: the next window is always ahead');
        $this->assertSame(3, BxDolApiV2RateLimit::retryAfter(1007, 10));
    }

    public function testRateLimitRefusesWhatIsOverTheLimit(): void
    {
        $this->assertSame(0, BxDolApiV2RateLimit::waitFor(1, 3, 130));
        $this->assertSame(0, BxDolApiV2RateLimit::waitFor(3, 3, 130), 'the limit itself goes through');
        $this->assertSame(50, BxDolApiV2RateLimit::waitFor(4, 3, 130), 'until the next minute');
        $this->assertSame(1, BxDolApiV2RateLimit::waitFor(4, 3, 179));

        $oProblem = BxDolApiV2RateLimit::problem(50);
        $this->assertSame(429, $oProblem->getStatus());
        $this->assertSame('50', $oProblem->getHeaders()['Retry-After']);
        $this->assertSame('rate_limited', $oProblem->toArray()['code']);
        $this->assertSame('urn:una:problem:rate_limited', $oProblem->toArray()['type']);
    }

    public function testRateLimitCountsMembersByProfileAndGuestsByAddress(): void
    {
        $this->assertSame('profile:12', BxDolApiV2RateLimit::subject(12, '203.0.113.9'), 'a member, wherever from');
        $this->assertSame('ip:203.0.113.9', BxDolApiV2RateLimit::subject(0, '203.0.113.9'));
        $this->assertNotSame(BxDolApiV2RateLimit::subject(0, '203.0.113.9'), BxDolApiV2RateLimit::subject(0, '203.0.113.10'));

        $this->assertSame('ip:2001:db8:1:2::/64', BxDolApiV2RateLimit::subject(0, '2001:db8:1:2:3:4:5:6'));
        $this->assertSame(BxDolApiV2RateLimit::subject(0, '2001:db8:1:2::1'), BxDolApiV2RateLimit::subject(0, '2001:db8:1:2:ffff::9'), 'one /64 is one connection');
        $this->assertNotSame(BxDolApiV2RateLimit::subject(0, '2001:db8:1:2::1'), BxDolApiV2RateLimit::subject(0, '2001:db8:1:3::1'));

        $this->assertNull(BxDolApiV2RateLimit::subject(0, '0.0.0.0'), 'an address nobody knows is not one visitor');
        $this->assertNull(BxDolApiV2RateLimit::subject(0, 'not an address'));
        $this->assertNull(BxDolApiV2RateLimit::subject(0, '203.0.113.9, 198.51.100.1'));
    }

    public function testRateLimitBucketOfAnOperation(): void
    {
        $fOperation = function (string $sMethod, ?string $sLimit = null) {
            return new BxDolApiV2Operation(method: $sMethod, path: '/things', id: 'things', summary: 'Things', limit: $sLimit);
        };

        $this->assertSame('general', BxDolApiV2RateLimit::bucketOf($fOperation('GET')));
        foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $sMethod)
            $this->assertSame('write', BxDolApiV2RateLimit::bucketOf($fOperation($sMethod)), $sMethod);
        foreach (['search', 'preview', 'agent', 'upload'] as $sBucket)
            $this->assertSame($sBucket, BxDolApiV2RateLimit::bucketOf($fOperation('GET', $sBucket)));
        $this->assertSame('write', BxDolApiV2RateLimit::bucketOf($fOperation('POST', 'no-such-bucket')), 'a name that is not a bucket');

        foreach (BxDolApiV2RateLimit::buckets() as $sBucket)
            $this->assertStringStartsWith('sys_api_v2_rate_limit_', BxDolApiV2RateLimit::optionOf($sBucket));
        $this->assertNull(BxDolApiV2RateLimit::optionOf('no-such-bucket'));
        $this->assertSame(0, BxDolApiV2RateLimit::limitOf('no-such-bucket'));
    }

    public function testEveryOperationIsCountedInABucketOfItsKind(): void
    {
        $aBuckets = [];
        foreach ((new BxDolApiV2Router())->getOperations() as $aOp) {
            $oOp = $aOp['attr'];
            if ($oOp->limit !== null)
                $this->assertContains($oOp->limit, BxDolApiV2RateLimit::buckets(), $oOp->id . ' names a bucket');

            $sBucket = BxDolApiV2RateLimit::bucketOf($oOp);
            $aBuckets[$oOp->id] = $sBucket;
            if ($oOp->tag === 'search')
                $this->assertSame('search', $sBucket, $oOp->id);
            if ($oOp->body !== null && str_starts_with($oOp->body, 'multipart:'))
                $this->assertSame('upload', $sBucket, $oOp->id);
        }

        $this->assertSame('general', $aBuckets['getApiInfo']);
        $this->assertSame('write', $aBuckets['setActiveProfile']);
        $this->assertSame('search', $aBuckets['searchProfiles']);
        $this->assertSame('search', $aBuckets['suggestHashtags']);
        $this->assertSame('preview', $aBuckets['previewLink']);
        $this->assertSame('agent', $aBuckets['sendAgentMessage']);
        $this->assertSame('upload', $aBuckets['uploadInline']);
    }

    public function testUploadIdsHoldTheStorageAndTheFile(): void
    {
        $sId = BxDolApiV2Map::uploadId(32, 7);
        $this->assertSame((string)((32 << 32) | 7), $sId);
        $this->assertSame([32, 7], BxDolApiV2Map::uploadParts($sId));
        $this->assertSame([4, 4294967295], BxDolApiV2Map::uploadParts(BxDolApiV2Map::uploadId(4, 4294967295)), 'the largest file id stays in its half');
        $this->assertNotSame(BxDolApiV2Map::uploadId(27, 1), BxDolApiV2Map::uploadId(29, 1), 'the same file id of two storages');

        foreach (['', '0', '-5', '12abc', '1.5', ['1'], null, '99999999999999999999'] as $mBad)
            $this->assertSame([0, 0], BxDolApiV2Map::uploadParts($mBad), json_encode($mBad));
    }

    public function testVersionIgnoresViewsAndFileTokens(): void
    {
        $aActivity = [
            'id' => '1',
            'object' => ['id' => '1', 'stats' => ['views' => 3, 'reactions' => 0], 'media' => [['url' => 'http://x/s/a.jpg?t=' . md5('a')]], 'version' => 'old'],
            'version' => 'old',
        ];
        $sVersion = BxDolApiV2Map::version($aActivity);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{24}$/', $sVersion);

        $aSame = $aActivity;
        $aSame['object']['stats']['views'] = 99;
        $aSame['object']['media'][0]['url'] = 'http://x/s/a.jpg?t=' . md5('b');
        $aSame['version'] = $aSame['object']['version'] = 'other';
        $this->assertSame($sVersion, BxDolApiV2Map::version($aSame), 'views, a new file token and the old version change nothing');

        $aChanged = $aActivity;
        $aChanged['object']['stats']['reactions'] = 1;
        $this->assertNotSame($sVersion, BxDolApiV2Map::version($aChanged));

        // a copy not made yet: its link has the time of the request in it
        $fPending = function ($iTime) use ($aActivity) {
            $a = $aActivity;
            $a['object']['media'][0]['variants'] = ['thumb' => ['url' => 'http://x/image_transcoder.php?o=bx_timeline_photos_view&h=5&dpx=1&t=' . $iTime . '&s=abc', 'width' => 0, 'height' => 0]];
            return $a;
        };
        $this->assertSame(BxDolApiV2Map::version($fPending(1762430000)), BxDolApiV2Map::version($fPending(1762430001)), 'a second later, the same version');

        // an Item alone
        $aItem = $aActivity['object'];
        $this->assertSame(BxDolApiV2Map::version($aItem), BxDolApiV2Map::version(array_merge($aItem, ['stats' => ['views' => 0, 'reactions' => 0]])));
    }

    public function testLinksOfCopiesNotMadeYetAreTheSameFromRequestToRequest(): void
    {
        $sBase = 'http://x/image_transcoder.php?o=bx_timeline_photos_view&h=5&dpx=1';
        $this->assertSame($sBase . '&s=abc', BxDolApiV2Map::stableUrl($sBase . '&t=1762430000&s=abc'), 'the time is left out');
        $this->assertSame($sBase, BxDolApiV2Map::stableUrl($sBase . '&t=1762430001'), 'at the end too');
        $this->assertSame(BxDolApiV2Map::absoluteUrl($sBase . '&t=1&s=abc'), BxDolApiV2Map::absoluteUrl($sBase . '&t=2&s=abc'), 'absoluteUrl, which every link goes through');
        $this->assertSame('http://x/s/a.jpg?t=' . md5('a'), BxDolApiV2Map::stableUrl('http://x/s/a.jpg?t=' . md5('a')), 'a storage token is not the transcoder\'s time');
        $this->assertSame($sBase . '&st=1', BxDolApiV2Map::stableUrl($sBase . '&st=1'), 'only the t parameter');
    }

    public function testVariantsAreTheOriginalFittedIntoTheCopysBox(): void
    {
        if (!BxDolTranscoder::getObjectInstance('bx_timeline_photos_medium'))
            $this->markTestSkipped('The Timeline\'s transcoders are not installed.');

        $this->assertSame([600, 400], BxDolApiV2Map::variantSize('bx_timeline_photos_medium', 1200, 800), 'w 600');
        $this->assertSame([40, 30], BxDolApiV2Map::variantSize('bx_timeline_photos_medium', 40, 30), 'never enlarged');
        $this->assertSame([667, 1000], BxDolApiV2Map::variantSize('bx_timeline_photos_big', 1000, 1500), 'into a 1000x1000 box');
        $this->assertSame([100, 100], BxDolApiV2Map::variantSize('bx_timeline_photos_preview', 0, 0), 'a square copy has its box\'s size');
        $this->assertSame([0, 0], BxDolApiV2Map::variantSize('bx_timeline_photos_medium', 0, 0), 'the original\'s size not known');
        $this->assertSame([0, 0], BxDolApiV2Map::variantSize('', 1200, 800), 'no transcoder');
    }

    public function testMediaOfAFileOfNoKnownStorage(): void
    {
        $a = BxDolApiV2Map::media('7', 'image', 'ready', '', 0, ['medium' => ['http://x/m.jpg', ''], 'thumb' => [null, '']], 'http://x/o.jpg');
        $this->assertSame(['id', 'kind', 'mime', 'size', 'state', 'original_name', 'url', 'download_url', 'variants', 'width', 'height', 'duration_ms'], array_keys($a));
        $this->assertSame(['application/octet-stream', 0, '', 'http://x/o.jpg', 'http://x/o.jpg'], [$a['mime'], $a['size'], $a['original_name'], $a['url'], $a['download_url']]);
        $this->assertSame(['medium' => ['url' => 'http://x/m.jpg', 'width' => 0, 'height' => 0]], $a['variants'], 'a copy without a url is left out');

        $a = BxDolApiV2Map::media('8', 'video', 'processing', '', 0, []);
        $this->assertSame('{}', json_encode($a['variants']), 'no copies is an empty object');
    }

    public function testPagesAlwaysSayWhereTheNextStarts(): void
    {
        $a = BxDolApiV2Map::pageSchema('Thing');
        $this->assertSame(['items', 'next_cursor'], $a['required'], 'next_cursor is always there, null on the last page');
        $this->assertSame(['string', 'null'], $a['properties']['next_cursor']['type']);
    }

    public static function ifNoneMatch(): array
    {
        $sTag = 'W/"abc123"';
        return [
            'the same tag' => [$sTag, $sTag, true],
            'strong form of the weak tag' => ['"abc123"', $sTag, true],
            'in a list' => ['"zzz", W/"abc123" , "yyy"', $sTag, true],
            'any' => ['*', $sTag, true],
            'another tag' => ['W/"abc124"', $sTag, false],
            'a list without it' => ['"a", "b"', $sTag, false],
            'empty' => ['', $sTag, false],
            'a tag inside another' => ['W/"abc1234"', $sTag, false],
        ];
    }

    #[DataProvider('ifNoneMatch')]
    public function testIfNoneMatchIsComparedWeakly(string $sHeader, string $sTag, bool $bMatches): void
    {
        $this->assertSame($bMatches, BxDolApiV2Router::etagMatches($sHeader, $sTag));
    }

    public function testOnlyJsonOkAnswersToGetCarryAnEtag(): void
    {
        $oOk = new BxDolApiV2Response(200, ['items' => [], 'next_cursor' => null]);

        $a = BxDolApiV2Router::answer($oOk, 'GET');
        $this->assertSame(200, $a['status']);
        $this->assertMatchesRegularExpression('/^W\/"[0-9a-f]+"$/', $a['headers']['ETag']);
        $this->assertSame(BxDolApiV2Router::etag($a['body']), $a['headers']['ETag'], 'a digest of the body');
        $this->assertSame('private, no-cache', $a['headers']['Cache-Control']);
        $this->assertStringContainsString('Authorization, Cookie', $a['headers']['Vary']);
        $this->assertStringStartsWith('application/json', $a['headers']['Content-Type']);

        // a match: 304, no body and no Content-Type, the ETag, Cache-Control and Vary kept
        $a304 = BxDolApiV2Router::answer($oOk, 'GET', '"other", ' . $a['headers']['ETag']);
        $this->assertSame(304, $a304['status']);
        $this->assertNull($a304['body']);
        $this->assertArrayNotHasKey('Content-Type', $a304['headers']);
        $this->assertSame([$a['headers']['ETag'], 'private, no-cache', $a['headers']['Vary']], [$a304['headers']['ETag'], $a304['headers']['Cache-Control'], $a304['headers']['Vary']]);
        $this->assertSame(304, BxDolApiV2Router::answer($oOk, 'HEAD', '*')['status'], 'HEAD is answered as GET');

        $this->assertArrayNotHasKey('ETag', BxDolApiV2Router::answer($oOk, 'POST', '*')['headers'], 'writes');
        $this->assertSame(200, BxDolApiV2Router::answer($oOk, 'POST', '*')['status']);
        $this->assertArrayNotHasKey('ETag', BxDolApiV2Router::answer(new BxDolApiV2Response(201, ['id' => '1']), 'GET')['headers'], 'another status');
        $this->assertNull(BxDolApiV2Router::answer(BxDolApiV2Response::noContent(), 'PUT')['body']);
        $this->assertArrayNotHasKey('ETag', BxDolApiV2Router::answer(BxDolApiV2Response::noContent(), 'GET')['headers'], 'no body');

        // more than 1 MiB of JSON (bytes, not characters): no ETag, so no 304 either
        $aBig = BxDolApiV2Router::answer(new BxDolApiV2Response(200, ['s' => str_repeat("\u{00e9}", 600000)]), 'GET', '*');
        $this->assertGreaterThan(BxDolApiV2Router::ETAG_MAX_BYTES, strlen($aBig['body']));
        $this->assertSame(200, $aBig['status']);
        $this->assertArrayNotHasKey('ETag', $aBig['headers']);

        // problems: no ETag, never stored by caches
        $aProblem = BxDolApiV2Router::problemAnswer(BxDolApiV2Problem::notFound());
        $this->assertArrayNotHasKey('ETag', $aProblem['headers']);
        $this->assertSame('no-store', $aProblem['headers']['Cache-Control']);
        $this->assertStringStartsWith('application/problem+json', $aProblem['headers']['Content-Type']);
    }

    public static function idempotencyKeys(): array
    {
        return [
            'a uuid' => ['3f1e2a4c-9b7d-4e21-a0c3-7d5e9f1b2c3d', true],
            'one character' => ['x', true],
            'visible punctuation' => ['!~"#$%', true],
            '255 characters' => [str_repeat('k', 255), true],
            'empty' => ['', false],
            '256 characters' => [str_repeat('k', 256), false],
            'a space' => ['a b', false],
            'a tab' => ["a\tb", false],
            'a line break at the end' => ["abc\n", false],
            'not ASCII' => ["cl\u{00e9}", false],
        ];
    }

    #[DataProvider('idempotencyKeys')]
    public function testIdempotencyKeysAreVisibleAscii(string $sKey, bool $bValid): void
    {
        $this->assertSame($bValid, BxDolApiV2Idempotency::isValidKey($sKey));
    }

    public function testIdempotencyIsPerCredentialAndRequest(): void
    {
        $this->assertNull(BxDolApiV2Idempotency::scope(BxDolApiV2Auth::MODE_GUEST, ''), 'guests have no keys');
        $this->assertNull(BxDolApiV2Idempotency::scope(BxDolApiV2Auth::MODE_TOKEN, ''));
        $sToken = BxDolApiV2Idempotency::scope(BxDolApiV2Auth::MODE_TOKEN, 'abc');
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $sToken);
        $this->assertNotSame($sToken, BxDolApiV2Idempotency::scope(BxDolApiV2Auth::MODE_TOKEN, 'abd'));
        $this->assertNotSame($sToken, BxDolApiV2Idempotency::scope(BxDolApiV2Auth::MODE_SESSION, 'abc'), 'a token and a session never share keys');

        $sPrint = BxDolApiV2Idempotency::fingerprint('POST', '/feed-posts', '', '{"a":1}');
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $sPrint);
        $this->assertNotSame($sPrint, BxDolApiV2Idempotency::fingerprint('PUT', '/feed-posts', '', '{"a":1}'));
        $this->assertNotSame($sPrint, BxDolApiV2Idempotency::fingerprint('POST', '/feed-posts/1', '', '{"a":1}'));
        $this->assertNotSame($sPrint, BxDolApiV2Idempotency::fingerprint('POST', '/feed-posts', 'x=1', '{"a":1}'));
        $this->assertNotSame($sPrint, BxDolApiV2Idempotency::fingerprint('POST', '/feed-posts', '', '{"a":2}'));
        $this->assertNotSame(BxDolApiV2Idempotency::fingerprint('POST', '/a', 'b', ''), BxDolApiV2Idempotency::fingerprint('POST', '/a', '', 'b'), 'the parts are kept apart');

        $this->assertSame(BxDolApiV2Router::queryString(['b' => '2', 'a' => '1']), BxDolApiV2Router::queryString(['a' => '1', 'b' => '2']), 'the order of the query does not matter');

        $this->assertTrue(BxDolApiV2Idempotency::isWrite('POST'));
        $this->assertTrue(BxDolApiV2Idempotency::isWrite('DELETE'));
        $this->assertFalse(BxDolApiV2Idempotency::isWrite('GET'));
        $this->assertFalse(BxDolApiV2Idempotency::isWrite('HEAD'));
    }

    public function testOnlyFinalAnswersAreKeptForRepeats(): void
    {
        $fAnswer = function (int $iStatus, string $sBody = '{}') {
            return ['status' => $iStatus, 'headers' => [], 'body' => $sBody];
        };
        foreach ([200, 201, 204, 400, 403, 404, 422] as $iStatus)
            $this->assertTrue(BxDolApiV2Idempotency::isStorable($fAnswer($iStatus), false), (string)$iStatus);
        foreach ([408, 409, 425, 429, 500, 503] as $iStatus)
            $this->assertFalse(BxDolApiV2Idempotency::isStorable($fAnswer($iStatus), false), (string)$iStatus . ' can be retried');
        $this->assertFalse(BxDolApiV2Idempotency::isStorable($fAnswer(200), true), 'an answer that sets a cookie');
        $this->assertTrue(BxDolApiV2Idempotency::isStorable(['status' => 204, 'headers' => [], 'body' => null], false));
        $this->assertFalse(BxDolApiV2Idempotency::isStorable($fAnswer(200, str_repeat('x', BxDolApiV2Idempotency::MAX_STORED + 1)), false), 'larger than 1 MiB');
    }

    private function request(array $aQuery): BxDolApiV2Request
    {
        return new BxDolApiV2Request('GET', [], $aQuery, null, [], new BxDolApiV2Auth());
    }

    private function loadOAuthController(): void
    {
        if (!class_exists('BxOAuthAuthorizeController', false))
            require_once(BX_DIRECTORY_PATH_MODULES . 'boonex/oauth2/classes/BxOAuthAuthorizeController.php');
    }
}
