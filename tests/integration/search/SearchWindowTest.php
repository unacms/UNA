<?php

require_once __DIR__ . '/../api/ApiV2TestCase.php';

/**
 * The one search (BxDolSearchUnified): the window, the results page, the apps' search_window service and GET /search
 * read one query and show only what the viewer may open, in every scope and through every chip.
 */
class SearchWindowTest extends ApiV2TestCase
{
    protected $_aPosts = [];
    protected $_aCmts = [];
    protected $_mForced;
    protected $_mLogged;

    protected function setUp(): void
    {
        parent::setUp();
        $this->requireModule('bx_posts');
        $this->_mForced = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $this->_mLogged = $GLOBALS['logged'] ?? null;
    }

    protected function tearDown(): void
    {
        BxDolSearchUnified::getInstance()->setApiSections(false);
        unset($GLOBALS['bxDolClasses']['BxDolAiSearchParser']);
        $this->asViewer(0);
        $GLOBALS['glForceCurrentProfileId'] = $this->_mForced;
        $GLOBALS['logged'] = $this->_mLogged;

        $oPosts = BxDolModule::getInstance('bx_posts');
        foreach ($this->_aPosts as $iId)
            $oPosts->serviceDeleteEntity($iId);
        $this->_aPosts = [];

        parent::tearDown();
    }

    /**
     * Search as this profile (0: a guest), in this process.
     */
    protected function asViewer(int $iProfileId): void
    {
        $GLOBALS['glForceCurrentProfileId'] = $iProfileId ?: null;
        $GLOBALS['logged'] = ['member' => $iProfileId > 0, 'admin' => false];
        BxDolDb::getInstance()->cleanMemoryAll();

        // module objects keep the profile they were made for: one request is one viewer on the site
        foreach (['bx_posts', 'bx_groups', 'bx_persons'] as $sModule)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sModule) && ($oModule = BxDolModule::getInstance($sModule)))
                (function ($iId) { $this->_iProfileId = $iId; })->call($oModule, $iProfileId);
    }

    protected function post(int $iAuthor, string $sTitle, $mView = BX_DOL_PG_ALL): int
    {
        $this->asViewer($iAuthor);
        $a = BxDolModule::getInstance('bx_posts')->serviceEntityAddForcedly($iAuthor, [
            'title' => $sTitle,
            'text' => '<p>' . $sTitle . '</p>',
            'cat' => (string)(array_key_first(BxDolForm::getDataItems('bx_posts_cats')) ?? ''),
            'allow_view_to' => $mView,
        ]);
        $this->assertSame(0, $a['code'] ?? null, 'a post was made: ' . json_encode($a['errors'] ?? $a['message'] ?? ''));
        $this->_aPosts[] = (int)$a['content']['id'];
        return (int)$a['content']['id'];
    }

    protected function comment(int $iAuthor, int $iPost, string $sText): int
    {
        $this->asViewer($iAuthor);
        // a fresh comment form (one an earlier test rendered keeps its CSRF field) and no request params
        $oCmts = BxDolCmts::getObjectInstance('bx_posts', $iPost);
        (function () { $this->_unsetFormObject(); })->call($oCmts);
        $a = BxDolApiV2Search::isolated(function () use ($oCmts, $iAuthor, $sText) {
            return $oCmts->add(['cmt_author_id' => $iAuthor, 'cmt_parent_id' => 0, 'cmt_text' => $sText]);
        });
        $this->assertNotEmpty($a['id'] ?? null, 'a comment was made');
        return (int)$a['id'];
    }

    /**
     * Ids of the posts' group of a search, as [posts, comments] (the comments' text).
     */
    protected function found(array $aIn, int $iViewer): array
    {
        $this->asViewer($iViewer);
        $o = BxDolSearchUnified::getInstance();
        $aRes = $o->search($o->normalize($aIn), 'hits');
        $aGroup = $aRes['group'] ?? null;
        foreach ($aRes['groups'] ?? [] as $a)
            if ($a['name'] == 'bx_posts')
                $aGroup = $a;

        $aPosts = $aCmts = [];
        foreach ($aGroup['items'] ?? [] as $aHit)
            if ($aHit['kind'] == 'comment')
                $aCmts[] = (int)$aHit['id'];
            else
                $aPosts[] = (int)$aHit['id'];

        return [$aPosts, $aCmts, $aGroup['count'] ?? 0];
    }

    public function testEveryScopeShowsOnlyWhatTheViewerMayOpen(): void
    {
        $iOwner = $this->seedPooledPerson();
        $iOther = $this->seedPooledPerson(function ($i) use ($iOwner) { return $i != $iOwner; });
        $sWord = 'srchwin' . bin2hex(random_bytes(4));

        $iPublic = $this->post($iOwner, $sWord . ' public');
        $iPrivate = $this->post($iOwner, $sWord . ' private', BX_DOL_PG_MEONLY);
        $iCmtPublic = $this->comment($iOther, $iPublic, $sWord . ' on public');
        $iCmtPrivate = $this->comment($iOwner, $iPrivate, $sWord . ' on private');

        $aSecret = null;
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_groups') && BxDolModule::getInstance('bx_posts')->serviceCheckAllowedAddInContext('bx_groups') === CHECK_ACTION_RESULT_ALLOWED) {
            $iSecret = $this->seedGroup($iOwner, 's');
            $aSecret = [$iSecret, $this->post($iOwner, $sWord . ' secret group', -$iSecret)];
        }

        // global, the module, title only: an outsider and a guest never get the private ones, nor count them
        foreach ([['keyword' => $sWord], ['keyword' => $sWord, 'section' => 'bx_posts'], ['keyword' => $sWord, 'tab' => 'bx_posts'], ['keyword' => $sWord, 'title_only' => 1]] as $aIn)
            foreach ([$iOther, 0] as $iViewer) {
                list($aPosts, $aCmts, $iCount) = $this->found($aIn, $iViewer);
                $this->assertSame([$iPublic], $aPosts, json_encode($aIn) . ' as ' . $iViewer);
                $this->assertNotContains($iCmtPrivate, $aCmts, 'no comment on a private post');
                $this->assertSame(count($aPosts) + count($aCmts), $iCount, 'the count is what may be opened');
            }

        // comments come with their module in the "All" view and its tab; the module scope is its entries only
        list(, $aCmts) = $this->found(['keyword' => $sWord, 'tab' => 'bx_posts'], $iOther);
        $this->assertSame([$iCmtPublic], $aCmts);
        // with their own date, so they take their place among the newest
        $this->asViewer($iOther);
        $aHits = BxDolSearchUnified::getInstance()->search(BxDolSearchUnified::getInstance()->normalize(['keyword' => $sWord, 'tab' => 'bx_posts', 'sort' => 'new']), 'hits')['group']['items'];
        foreach ($aHits as $aHit)
            $this->assertGreaterThan(0, $aHit['date'], $aHit['kind'] . ' ' . $aHit['id']);
        list(, $aCmts) = $this->found(['keyword' => $sWord, 'section' => 'bx_posts'], $iOther);
        $this->assertSame([], $aCmts);

        // the owner gets every one of them
        list($aPosts, $aCmts) = $this->found(['keyword' => $sWord, 'tab' => 'bx_posts'], $iOwner);
        $this->assertEqualsCanonicalizing(array_merge([$iPublic, $iPrivate], $aSecret ? [$aSecret[1]] : []), $aPosts);
        $this->assertEqualsCanonicalizing([$iCmtPublic, $iCmtPrivate], $aCmts);

        // "Created by"
        list($aPosts) = $this->found(['keyword' => $sWord, 'author' => $iOther], $iOwner);
        $this->assertSame([], $aPosts, 'not a post of theirs');

        if ($aSecret) {
            // a context the viewer may see: what is posted in it, with or without a keyword
            foreach (['', $sWord] as $sKeyword) {
                list($aPosts) = $this->found(['keyword' => $sKeyword, 'context' => $aSecret[0]], $iOwner);
                $this->assertSame([$aSecret[1]], $aPosts, 'in the group: "' . $sKeyword . '"');
            }

            // one the viewer may not see: no scope chip, no results, not even its name
            $this->asViewer($iOther);
            $o = BxDolSearchUnified::getInstance();
            $aScope = $o->getScope($o->normalize(['keyword' => $sWord, 'context' => $aSecret[0]]));
            $this->assertNull($aScope['context']);
            $this->assertNotContains('context', array_column($aScope['chips'], 'name'));
            // nor as "Created by"
            $aScope = $o->getScope($o->normalize(['keyword' => $sWord, 'author' => $aSecret[0]]));
            $aAuthor = array_values(array_filter($aScope['chips'], function ($a) { return $a['name'] == 'author'; }))[0];
            $this->assertSame([0, ''], [$aAuthor['value'], $aAuthor['value_title']]);
            $this->assertSame(0, $o->normalize(['author' => $aSecret[0]])['author'], 'and no hidden filter either');
            list($aPosts, , $iCount) = $this->found(['keyword' => $sWord, 'context' => $aSecret[0]], $iOther);
            $this->assertSame([[], 0], [$aPosts, $iCount]);
        }
    }

    public function testTheModuleScopeHasItsSearchFieldsAsChips(): void
    {
        $iOwner = $this->seedPooledPerson();
        $this->asViewer($iOwner);
        $o = BxDolSearchUnified::getInstance();

        $aScope = $o->getScope($o->normalize(['section' => 'bx_posts']));
        $this->assertSame('module', $aScope['scope']);
        $this->assertSame(['section', 'bx_posts'], [$aScope['chips'][0]['name'], $aScope['chips'][0]['value']]);
        $aNames = array_column($aScope['chips'], 'name');
        foreach (['allow_view_to', 'cf', 'author'] as $sName)
            $this->assertSame(1, count(array_keys($aNames, $sName)) + ($sName == 'author' ? 0 : 1), 'no chip of the privacy, content filter or author fields: ' . $sName);

        $aCats = array_values(array_filter($aScope['chips'], function ($a) { return $a['name'] == 'cat'; }));
        if (!$aCats)
            $this->markTestSkipped('Posts has no category search field on this site.');
        $this->assertSame('options', $aCats[0]['type']);
        $this->assertNotEmpty($aCats[0]['options']);

        // a category narrows the module's results the way its search form does
        $sWord = 'srchcat' . bin2hex(random_bytes(4));
        $iPost = $this->post($iOwner, $sWord . ' post');
        $sCat = (string)BxDolDb::getInstance()->getOne("SELECT `cat` FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iPost]);
        $sOther = '';
        foreach ($aCats[0]['options'] as $a)
            if ($a['value'] !== $sCat)
                $sOther = $a['value'];

        list($aPosts) = $this->found(['keyword' => $sWord, 'section' => 'bx_posts', 'filters' => json_encode(['cat' => [$sCat]])], $iOwner);
        $this->assertSame([$iPost], $aPosts);
        if ($sOther !== '') {
            list($aPosts) = $this->found(['keyword' => $sWord, 'section' => 'bx_posts', 'filters' => json_encode(['cat' => [$sOther]])], $iOwner);
            $this->assertSame([], $aPosts);
        }
    }

    public function testOneQueryFormat(): void
    {
        $o = BxDolSearchUnified::getInstance();

        $a = $o->normalize([
            'keyword' => ' garden ',
            'section' => 'bx_posts,no_such_module,bx_posts',
            'context' => '-5',
            'date_from' => '2026-13-45 or 1=1',
            'filters' => ['cat' => ['1', ''], 'bad name' => 'x'],
            'sort' => 'random',
            'unknown' => 'dropped',
        ]);
        $this->assertSame('garden', $a['keyword']);
        $this->assertSame(['bx_posts'], $a['section'], 'only searched modules, once each');
        $this->assertSame(0, $a['context']);
        $this->assertSame('', $a['date_from']);
        $this->assertSame(['cat' => ['1']], $a['filters']);
        $this->assertSame('best', $a['sort']);
        $this->assertArrayNotHasKey('unknown', $a);

        // field filters belong to one module
        $this->assertSame([], $o->normalize(['filters' => ['cat' => '1']])['filters']);

        // the URL params give the same query back, so a results link can be shared
        $aIn = ['keyword' => 'garden', 'section' => 'bx_posts', 'date_from' => '2026-01-01', 'date_to' => '2026-01-31', 'filters' => json_encode(['cat' => ['1']]), 'sort' => 'new', 'title_only' => 1];
        $aQuery = $o->normalize($aIn);
        $this->assertSame($aQuery, $o->normalize($o->toUrlParams($aQuery)));
        $this->assertStringContainsString('searchKeyword.php?', $o->getResultsUrl($aQuery));

        // nothing asked: no results, and no rows read
        $this->assertFalse($o->hasQuery($o->normalize([])));
        $this->assertSame(['groups' => [], 'total' => 0, 'total_more' => false], $o->search($o->normalize([])));
    }

    public function testTheApiGivesTheSameSearch(): void
    {
        $iOwner = $this->seedPooledPerson();
        $sWord = 'srchapi' . bin2hex(random_bytes(4));
        $iPublic = $this->post($iOwner, $sWord . ' public');
        $iPrivate = $this->post($iOwner, $sWord . ' private', BX_DOL_PG_MEONLY);
        $this->asViewer(0);

        // API v2, as a guest: the schema, and never the private one
        $a = $this->http('GET', 'search?q=' . $sWord . '&section=bx_posts');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('SearchResults', $a['json']);
        $this->assertSame('module', $a['json']['scope']);
        $aIds = array_column($a['json']['groups'][0]['items'] ?? [], 'id');
        $this->assertSame([(string)$iPublic], $aIds);
        $this->assertNotContains((string)$iPrivate, $aIds);

        // the apps' service (api.php)
        $_GET['api'] = 1;
        try {
            $aBlocks = bx_srv('system', 'search_window', [['params' => ['keyword' => $sWord, 'section' => 'bx_posts']]], 'TemplServicesSearch');
        }
        finally {
            unset($_GET['api']);
        }
        $aData = $aBlocks[0]['data'] ?? [];
        $this->assertSame(['keyword' => $sWord, 'section' => 'bx_posts'], $aData['query']);
        $this->assertSame('module', $aData['scope']['scope']);
        $this->assertSame([$iPublic], array_map('intval', array_column($aData['results']['group']['items'], 'id')));
    }

    public function testTheAiFillsTheModuleAndTheDatesOnlyWhenAModelIsOn(): void
    {
        $o = BxDolSearchUnified::getInstance();
        $aQuery = $o->normalize(['keyword' => 'posts about gardens in january 2026']);

        // no judge model (as installed): the words as typed
        $GLOBALS['bxDolClasses']['BxDolAiSearchParser'] = new SearchWindowTestParser(false);
        $this->assertSame($aQuery, BxTemplServicesSearch::applySearchAi($aQuery, true));

        // a model (mocked: the parser's answer for those words) fills the chips, and leaves a chosen module alone
        $GLOBALS['bxDolClasses']['BxDolAiSearchParser'] = new SearchWindowTestParser(true);
        $a = BxTemplServicesSearch::applySearchAi($aQuery, true);
        $this->assertSame(['gardens', ['bx_posts'], '2026-01-01', '2026-01-31', 'created'], [$a['keyword'], $a['section'], $a['date_from'], $a['date_to'], $a['date_field']]);
        $this->assertSame($aQuery, BxTemplServicesSearch::applySearchAi($aQuery, false), 'not asked');
        $aChosen = $o->normalize(['keyword' => 'gardens', 'section' => 'bx_posts']);
        $this->assertSame($aChosen, BxTemplServicesSearch::applySearchAi($aChosen, true));
    }

    public function testAPageSearchesItsSectionUnlessTheSectionTurnedItOff(): void
    {
        $oPage = BxDolPage::getObjectInstanceByURI('posts-home');
        if (!$oPage || $oPage->getSection() === '')
            $this->markTestSkipped('Posts home is in no section on this site.');

        $this->asViewer(0);
        $aSearch = $oPage->getSearchAction();
        $this->assertSame(['bx_posts', 0, 0], [$aSearch['section'] ?? '', $aSearch['context'] ?? 0, $aSearch['author'] ?? 0]);
        $this->assertNotSame('', $aSearch['title']);

        $sSection = $oPage->getSection();
        $aRow = BxDolPageQuery::getSection($sSection);
        try {
            BxDolPageQuery::setSection($sSection, 'bx_posts', ['search' => 0]);
            $this->assertFalse(BxDolPage::getObjectInstanceByURI('posts-home')->isSectionSearch());
            $this->assertSame([], BxDolPage::getObjectInstanceByURI('posts-home')->getSearchAction());
        }
        finally {
            if ($aRow)
                BxDolPageQuery::setSection($sSection, 'bx_posts', ['search' => (int)($aRow['search'] ?? 1)]);
            else
                BxDolDb::getInstance()->query("DELETE FROM `sys_pages_sections` WHERE `object` = :object", ['object' => $sSection]);
            BxDolDb::getInstance()->cleanMemory('sys_pages_sections');
        }
    }
}

/**
 * The search parser with a judge model or without one, answering as a model would for "posts about gardens in january 2026".
 */
class SearchWindowTestParser extends BxDolAiSearchParser
{
    protected $_bOn;

    public function __construct($bOn)
    {
        $this->_bOn = $bOn;
    }

    public function isAvailable(): bool
    {
        return $this->_bOn;
    }

    public function parse(string $sQuery, array $aOptions = []): array
    {
        return [
            'query' => $sQuery,
            'keyword' => 'gardens',
            'section' => isset($aOptions['sections']['bx_posts']) ? 'bx_posts' : '',
            'section_title' => '',
            'date' => ['field' => 'created', 'mode' => 'absolute', 'anchor' => '', 'from' => '2026-01-01', 'to' => '2026-01-31'],
            'confidence' => ['section' => 1, 'date' => 1, 'keyword' => 1],
            'judge' => ['model' => 'mock', 'ms' => 0, 'usage' => []],
        ];
    }
}
