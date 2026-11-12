<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: pages as the Pages builder (Studio > Pages) sets them up
 * (`GET /layout/resolve`, `ResolvedPage`): the page for a path on the site, its layout and the
 * blocks the viewer may see on a platform, each as a kind of block with the GET route that
 * feeds it, so an app draws a page's complementary blocks (Friends, Friend Suggestions,
 * Featured Posts ...) beside its main content as the site does.
 *
 * A block is one of the page's blocks shown in the apps (`active_api`, Studio's "Active in
 * API"), in a cell of the page's layout, for the viewer's membership level (its "Visible for"),
 * from enabled modules. Only blocks whose content the API serves as data are given: a service
 * block whose call an endpoint class maps to a kind and a route (the `apiV2PageBlock` hook, so
 * modules say which of their blocks they feed, and a disabled module's blocks are left out
 * with its class), and whose route this site's API serves to this viewer; a menu block (a
 * module's Categories) is mapped the same way by its menu object; a text block (a language
 * string or HTML written in Studio: About, Terms, Privacy) is `text.html`, its content read from
 * GET /layout/blocks/{id}/text. Raw code, forms and blocks no class maps are left out. Its design is UNA's: the screens it is hidden on
 * ("Hidden on"), and those its title, background and padding are hidden on.
 *
 * The page's data is not read here: each block names its route (`endpoint`) and the app reads
 * it, so resolving a page costs a few queries whatever its blocks are.
 */
class BxBaseApiV2Layout
{
    /** The layouts of a page's columns. */
    const LAYOUTS = ['single', 'sidebar_right', 'sidebar_left', 'three_columns'];
    /** UNA's screens ("Hidden on"), as BxBasePage::getHiddenOnNamesAPI names them. */
    const SCREENS = ['phone', 'tablet', 'desktop', 'mobile-app'];
    /**
     * The kinds of client a page or menu is drawn for, as "Hidden on" sees them: the web (its
     * three screens), a mobile app (`mobile-app`, as the screen of that name) and a desktop app
     * (the desktop screen).
     */
    const PLATFORMS = ['web', 'mobile-app', 'desktop-app'];

    /** Items in the first page of a block outside the page's main cell, unless its block says. */
    const SIDE_LIMIT = 5;

    /** Block types whose content is text written in Studio: a language string, or HTML. */
    const TEXT_TYPES = ['lang', 'html'];

    #[BxDolApiV2Operation(
        method: 'GET', path: '/layout/resolve', id: 'resolvePage', tag: 'layout',
        summary: 'The page for a path, with every block the viewer may see on this platform',
        description: 'From the site\'s Pages builder: the page a path on the site shows (`/` the home page, as the site shows it at its root to guests and members; `/page/<uri>`, `/<uri>` or `page.php?i=<uri>` another page, by its URI or an SEO rewrite of it; `/<uri>/<seo>` a page with the value an SEO link of it stands for, such as a profile\'s `url`; the query\'s other values, and that value, are the page\'s `params`), its layout and its cells in reading order, empty ones included. Blocks are the page\'s blocks for the apps (Studio\'s "Active in API"), in the order of their cell, for the viewer\'s membership level ("Visible for"), from enabled modules, that the API feeds: each names its `kind` and the GET route it reads (`endpoint`, under the API\'s base, with its query; add `cursor` for more of a `paged` one). Blocks hidden on every screen of the platform are left out; `design.hidden_on` lists the screens the others are hidden on, for the client to follow. No block carries `data` or `error` (the client reads `endpoint`), there is no `splash`, `layout` names the columns and the cells `top` and `bottom` of UNA\'s full-width rows come before and after them, `module` names the module that feeds a block, and `platform` takes `desktop`. 404 for a path no page has, or a page the viewer may not see.',
        params: [
            'path' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 2048], 'description' => 'A path on the site, such as `/` or `/page/explore`, maybe with a query string'],
            'platform' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Platform']],
        ],
        responses: [200 => 'ResolvedPage', 404 => null, 422 => null],
    )]
    public function resolvePage(BxDolApiV2Request $oReq)
    {
        $sPlatform = (string)$oReq->query('platform', 'web');
        if (!in_array($sPlatform, self::PLATFORMS, true))
            throw BxDolApiV2Problem::validation([['field' => 'platform', 'code' => 'invalid_value', 'message' => 'One of ' . implode(', ', self::PLATFORMS)]]);

        list($sUri, $aParams) = static::pageOf((string)$oReq->query('path', ''));

        $sObject = $sUri !== '' ? BxDolPageQuery::getPageObjectNameByURI($sUri, false, true) : false;
        $aPage = $sObject ? BxDolPageQuery::getPageObject($sObject) : false;
        if (!$aPage || !(isAdmin() || BxDolAcl::getInstance()->isMemberLevelInSet($aPage['visible_for_levels'])))
            throw BxDolApiV2Problem::notFound('The page');

        $aAll = BxDolPageQuery::getLayoutColumnsAll();
        list($sLayout, $aCellNames) = static::layoutOf($aAll[(int)$aPage['layout_id']] ?? [], (int)$aPage['cells_number']);

        $aCells = [];
        foreach ($aCellNames as $iIndex => $sName)
            $aCells[$iIndex] = ['name' => $sName, 'blocks' => []];

        $aContext = [
            'object' => $sObject,
            'page_module' => (string)$aPage['module'],
            'viewer' => (int)$oReq->viewerId(),
            'params' => $aParams,
        ];
        $oAcl = BxDolAcl::getInstance();
        foreach (BxDolPageQuery::getPageBlocksApi($sObject) as $aBlock) {
            $iCell = (int)$aBlock['cell_id'];
            if (!isset($aCells[$iCell]) || !$oAcl->isMemberLevelInSet($aBlock['visible_for_levels']) || static::hiddenEverywhere((int)$aBlock['hidden_on'], $sPlatform))
                continue;
            if (($a = $this->_block($aBlock, $aCells[$iCell]['name'], $aContext)) !== null)
                $aCells[$iCell]['blocks'][] = $a;
        }

        return [
            'id' => BxDolApiV2Map::id($aPage['id']),
            'uri' => $sObject === 'sys_home' ? '/' : '/page/' . $aPage['uri'],
            'layout' => $sLayout,
            'title' => static::title((string)$aPage['title']),
            'title_key' => null,
            'params' => (object)$aParams,
            'cells' => array_values($aCells),
        ];
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/layout/blocks/{id}/text', id: 'getBlockText', tag: 'layout',
        summary: 'A text block\'s content',
        description: 'The content of a page\'s text block (`kind` `text.html` in GET /layout/resolve): a block whose text is written in Studio, a language string (Studio > Pages > the block, "Language key": the site\'s About, Terms and Privacy pages) or HTML, as the site shows it, with the site\'s markers (`{site_title}` ...) and macros filled in. The HTML is the site owner\'s: a client sanitizes it as it does a post\'s. 404 for a block that is no text block shown in the apps, or one on a page or for a level the viewer may not see.',
        responses: [200 => 'BlockText', 404 => null],
    )]
    public function getBlockText(BxDolApiV2Request $oReq)
    {
        $aBlock = BxDolPageQuery::getPageBlockApi($oReq->id());
        $oAcl = BxDolAcl::getInstance();
        if (!$aBlock || !in_array($aBlock['type'], self::TEXT_TYPES, true)
            || !(isAdmin() || ($oAcl->isMemberLevelInSet($aBlock['page_visible_for_levels']) && $oAcl->isMemberLevelInSet($aBlock['visible_for_levels']))))
            throw BxDolApiV2Problem::notFound('The block');

        $s = $aBlock['type'] === 'lang' ? _t(trim((string)$aBlock['content'])) : (string)$aBlock['content'];
        // the markers BxBasePage fills in raw, HTML and language blocks
        $aMarkers = ['site_title' => getParam('site_title'), 'block_id' => (int)$aBlock['id']];
        if (isset($GLOBALS['bxReplaceableMarkersPages']) && is_array($GLOBALS['bxReplaceableMarkersPages']))
            $aMarkers = array_merge($aMarkers, $GLOBALS['bxReplaceableMarkersPages']);

        return [
            'id' => BxDolApiV2Map::id($aBlock['id']),
            'title' => static::title((string)$aBlock['title']),
            'html' => (string)bx_process_macros(bx_replace_markers($s, $aMarkers)),
        ];
    }

    /**
     * The URI of the page a path on the site shows and the values of its query: `/` (and
     * `index.php`) is `home`, the site's root page; `page.php?i=<uri>`, `page/<uri>` and
     * `<uri>` name a page. 422 for what is no path, 404 for a path no page can have.
     * @return array [uri, params]
     */
    public static function pageOf($sPath)
    {
        if ($sPath === '' || $sPath[0] !== '/' || str_starts_with($sPath, '//'))
            throw BxDolApiV2Problem::validation([['field' => 'path', 'code' => 'invalid_value', 'message' => 'A path on the site, starting with /']]);

        $aParts = explode('?', $sPath, 2);
        $sPart = trim(rawurldecode($aParts[0]), '/');
        $aQuery = [];
        if (isset($aParts[1]))
            parse_str($aParts[1], $aQuery);

        $sUri = '';
        if ($sPart === '' || $sPart === 'index.php')
            $sUri = 'home';
        else if ($sPart === 'page.php') {
            $sUri = is_string($aQuery['i'] ?? null) ? $aQuery['i'] : '';
            unset($aQuery['i']);
        }
        else if (preg_match('#^page/([A-Za-z0-9_-]+)$#', $sPart, $m))
            $sUri = $m[1];
        else if (preg_match('#^[A-Za-z0-9_-]+$#', $sPart))
            $sUri = $sPart;
        else if (preg_match('#^([A-Za-z0-9_-]+)/([^/]{1,50})$#u', $sPart, $m))
            list($sUri, $sSeo) = [$m[1], $m[2]];

        if ($sUri === '' || !preg_match('#^[A-Za-z0-9_-]{1,100}$#', $sUri))
            throw BxDolApiV2Problem::notFound('The page');

        // the page's own values (id, profile_id ...), strings only
        $aParams = [];
        foreach ($aQuery as $sKey => $mValue)
            if (is_string($sKey) && preg_match('#^[a-z][a-z0-9_]{0,31}$#', $sKey) && is_string($mValue))
                $aParams[$sKey] = get_mb_substr($mValue, 0, 200);

        // an SEO link (`/view-persons-profile/lily-carter`, a profile's or an entry's `url`): the
        // page's URI and the value its last part stands for, as the site reads it (BxDolPage::getPageBySeoLink)
        if (isset($sSeo)) {
            $sObject = BxDolPageQuery::getPageObjectNameByURI($sUri, false, true);
            $aPage = $sObject ? BxDolPageQuery::getPageObject($sObject) : false;
            $aLink = $aPage ? BxDolPageQuery::getSeoLink($aPage['module'], $aPage['uri'], ['uri' => $sSeo]) : false;
            if (!$aLink || !is_array($aLink) || !preg_match('#^[a-z][a-z0-9_]{0,31}$#', (string)$aLink['param_name']))
                throw BxDolApiV2Problem::notFound('The page');
            $aParams[$aLink['param_name']] = (string)$aLink['param_value'];
        }

        return [$sUri, $aParams];
    }

    /**
     * The profile a profile's or context's page shows (a person's, a group's ...), for the
     * blocks about it: its `profile_id`, or the content `id` of the page's module as the site's
     * pages take it (and an SEO link of the page names). 0 for none.
     */
    public static function pageProfileId($aContext)
    {
        $aParams = $aContext['params'] ?? [];
        if (isset($aParams['profile_id']) && ctype_digit((string)$aParams['profile_id']))
            return (int)$aParams['profile_id'];

        $sModule = (string)($aContext['page_module'] ?? '');
        if ($sModule === '' || $sModule === 'system' || !isset($aParams['id']) || !ctype_digit((string)$aParams['id']) || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return 0;
        $oProfile = BxDolProfile::getInstanceByContentAndType((int)$aParams['id'], $sModule);
        return $oProfile ? (int)$oProfile->id() : 0;
    }

    /**
     * The layout of a page's columns (sys_pages_layout_columns) and the name of each of
     * its cells, by cell index: the center column is `main` (the left one of a page without
     * one), a column beside it is `side`, or `left` and `right` when it has both; UNA's
     * full-width rows are `top` and `bottom`.
     * @param array $aColumns index => ['name' => top|left|center|right|bottom, ...]
     * @return array [layout, [index => cell name]]
     */
    public static function layoutOf(array $aColumns, $iCellsNumber = 1)
    {
        if (!$aColumns) {
            $aNames = [];
            for ($i = 1; $i <= max(1, (int)$iCellsNumber); ++$i)
                $aNames[$i] = $i === 1 ? 'main' : 'cell_' . $i;
            return ['single', $aNames];
        }

        ksort($aColumns);
        $aColumnNames = array_map(function ($a) { return (string)$a['name']; }, $aColumns);

        $iMain = array_search('center', $aColumnNames, true);
        if ($iMain === false)
            $iMain = array_search('left', $aColumnNames, true);
        if ($iMain === false)
            foreach ($aColumnNames as $iIndex => $sName)
                if (!in_array($sName, ['top', 'bottom'], true)) {
                    $iMain = $iIndex;
                    break;
                }
        if ($iMain === false)
            $iMain = array_key_first($aColumnNames);

        $bLeft = $bRight = false;
        foreach ($aColumnNames as $iIndex => $sName)
            if ($iIndex !== $iMain) {
                $bLeft = $bLeft || $sName === 'left';
                $bRight = $bRight || $sName === 'right';
            }
        $sLayout = $bLeft && $bRight ? 'three_columns' : ($bRight ? 'sidebar_right' : ($bLeft ? 'sidebar_left' : 'single'));

        $aNames = [];
        foreach ($aColumnNames as $iIndex => $sName) {
            if ($iIndex === $iMain)
                $aNames[$iIndex] = 'main';
            else if (in_array($sName, ['left', 'right'], true))
                $aNames[$iIndex] = $sLayout === 'three_columns' ? $sName : 'side';
            else
                $aNames[$iIndex] = $sName;
        }
        return [$sLayout, $aNames];
    }

    /**
     * Whether "Hidden on" hides a block on every screen of the platform: the site's three (the web,
     * and a desktop app, which follows them by the width of its content), or a mobile app's.
     */
    public static function hiddenEverywhere($iHiddenOn, $sPlatform)
    {
        $fBit = function ($iBit) { return (int)pow(2, $iBit - 1); };
        if ($sPlatform === 'mobile-app')
            return (bool)($iHiddenOn & $fBit(BX_DB_HIDDEN_MOBILE));
        $iAll = $fBit(BX_DB_HIDDEN_PHONE) | $fBit(BX_DB_HIDDEN_TABLET) | $fBit(BX_DB_HIDDEN_DESKTOP);
        return ($iHiddenOn & $iAll) === $iAll;
    }

    /**
     * A block as a ResolvedBlock, or null when no endpoint class feeds it here: its
     * content's service call, mapped by the first class whose apiV2PageBlock answers (the
     * class of the call's module first), to a route this site serves.
     */
    protected function _block($aBlock, $sCell, $aContext)
    {
        // text written in Studio (About, Terms, Privacy ...): read from GET /layout/blocks/{id}/text
        if (in_array($aBlock['type'], self::TEXT_TYPES, true))
            return [
                'id' => BxDolApiV2Map::id($aBlock['id']),
                'kind' => 'text.html',
                'module' => 'system',
                'title' => static::title((string)$aBlock['title']),
                'title_key' => null,
                'endpoint' => '/layout/blocks/' . (int)$aBlock['id'] . '/text',
                'paged' => false,
                'design' => static::design($aBlock),
            ];

        if ($aBlock['type'] !== 'service' && $aBlock['type'] !== 'menu')
            return null;

        $oModules = BxDolModuleQuery::getInstance();
        if (!in_array((string)$aBlock['module'], ['', 'system'], true) && !$oModules->isEnabledByName($aBlock['module']))
            return null;

        if ($aBlock['type'] === 'menu') {
            // a menu block (a module's Categories): the menu object, for the block's module to map
            if (!preg_match('#^[a-z0-9_]{1,64}$#', (string)$aBlock['content']))
                return null;
            $aCall = [
                'module' => (string)$aBlock['module'] !== '' ? (string)$aBlock['module'] : 'system',
                'method' => '',
                'params' => [],
                'class' => '',
                'menu' => (string)$aBlock['content'],
            ];
        }
        else {
            $aCall = BxDolService::decodeServiceCall((string)$aBlock['content']);
            if (!is_array($aCall) || empty($aCall['module']) || empty($aCall['method']) || !is_string($aCall['module']) || !is_string($aCall['method']))
                return null;
            if ($aCall['module'] !== 'system' && !$oModules->isEnabledByName($aCall['module']))
                return null;
            $aCall = [
                'module' => $aCall['module'],
                'method' => $aCall['method'],
                'params' => isset($aCall['params']) && is_array($aCall['params']) ? $aCall['params'] : [],
                'class' => isset($aCall['class']) && is_string($aCall['class']) ? $aCall['class'] : '',
                'menu' => '',
            ];
        }

        $aMapped = null;
        foreach (BxDolApiV2Router::hooks('apiV2PageBlock', $aCall['module']) as $oEndpoint) {
            $a = $oEndpoint->apiV2PageBlock($aCall, $aContext + ['cell' => $sCell]);
            if (is_array($a) && !empty($a['kind']) && is_string($a['kind'])) {
                $aMapped = $a;
                break;
            }
        }
        if (!$aMapped)
            return null;

        $sEndpoint = null;
        $bPaged = false;
        if (!empty($aMapped['endpoint'])) {
            $aRoute = static::route((string)$aMapped['endpoint'], isset($aMapped['query']) && is_array($aMapped['query']) ? $aMapped['query'] : [], $sCell === 'main' ? null : static::SIDE_LIMIT, $aContext['viewer'] > 0);
            if ($aRoute === null)
                return null;
            list($sEndpoint, $bPaged) = $aRoute;
        }

        return [
            'id' => BxDolApiV2Map::id($aBlock['id']),
            'kind' => $aMapped['kind'],
            'module' => isset($aMapped['module']) && is_string($aMapped['module']) ? $aMapped['module'] : $aCall['module'],
            'title' => static::title((string)$aBlock['title']),
            'title_key' => null,
            'endpoint' => $sEndpoint,
            'paged' => $bPaged,
            'design' => static::design($aBlock),
        ];
    }

    /**
     * A block's route as the app reads it: a GET path this site's API serves (to a guest only
     * when it takes guests) with a query of the parameters it declares, enum values among its
     * values; a paged route outside the main cell gets `limit` unless it has one. Null when the
     * route is not served here.
     * @param int|null $iLimit
     * @return array|null [path with its query, paged]
     */
    public static function route($sPath, array $aQuery, $iLimit, $bSignedIn)
    {
        foreach ((new BxDolApiV2Router())->getOperations() as $aOp) {
            $oAttr = $aOp['attr'];
            if ($oAttr->method !== 'GET' || !preg_match($aOp['regex'], $sPath))
                continue;
            if ($oAttr->auth === 'required' && !$bSignedIn)
                return null;

            $aParams = $oAttr->params + ($oAttr->paged ? ['cursor' => [], 'limit' => []] : []);
            foreach ($aQuery as $sName => $mValue) {
                if (!is_string($sName) || !isset($aParams[$sName]) || ($aParams[$sName]['in'] ?? 'query') !== 'query' || !is_scalar($mValue))
                    return null;
                if (isset($aParams[$sName]['schema']['enum']) && !in_array((string)$mValue, $aParams[$sName]['schema']['enum'], true))
                    return null;
            }
            if ($oAttr->paged && $iLimit !== null && !isset($aQuery['limit']))
                $aQuery['limit'] = $iLimit;

            $aQuery = array_map(function ($m) { return is_bool($m) ? ($m ? 'true' : 'false') : (string)$m; }, $aQuery);
            return [$sPath . ($aQuery ? '?' . http_build_query($aQuery, '', '&', PHP_QUERY_RFC3986) : ''), $oAttr->paged];
        }
        return null;
    }

    /**
     * The BlockDesign of a block: the parts its design box has (Frame) and the screens it,
     * and each part it has, is hidden on.
     */
    public static function design($aBlock)
    {
        $iBox = (int)$aBlock['designbox_id'];
        $aDesign = [
            'frame' => [
                'title' => BxDolPageDesignbox::hasPart($iBox, 'title'),
                'bg' => BxDolPageDesignbox::hasPart($iBox, 'bg'),
                'padding' => BxDolPageDesignbox::hasPart($iBox, 'padding'),
            ],
            'hidden_on' => BxTemplPage::getHiddenOnNamesAPI((int)$aBlock['hidden_on']),
        ];
        foreach (BxDolPageDesignbox::PARTS as $sPart)
            $aDesign[$sPart . '_hidden_on'] = $aDesign['frame'][$sPart] ? BxTemplPage::getHiddenOnNamesAPI((int)($aBlock[$sPart . '_hidden_on'] ?? 0)) : [];
        return $aDesign;
    }

    /**
     * A page's or block's title in the viewer's language, with the site's name for its marker
     * and without the markers of a page's content; empty for none, and for a language key that
     * has no text.
     */
    public static function title($sKey)
    {
        if ($sKey === '')
            return '';
        $s = _t($sKey);
        if ($s === $sKey && str_starts_with($sKey, '_'))
            return '';
        // markers of the page's content ({display_name}, {title}) the site fills from it: none here
        return trim(preg_replace('/\{[a-z_]+\}/', '', BxDolApiV2Map::text(bx_replace_markers($s, ['site_title' => getParam('site_title')]))));
    }

    public static function schemas()
    {
        $aScreens = ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Screen']];
        return [
            'Layout' => ['type' => 'string', 'enum' => self::LAYOUTS, 'description' => 'How a page\'s columns are arranged: the main one alone, with a column on the right or the left, or between two'],
            'Screen' => ['type' => 'string', 'enum' => self::SCREENS, 'description' => 'A screen a block, or a part of its frame, can be hidden on: the web\'s three widths (phone, tablet, desktop; the desktop app takes them from the width of its content) and the mobile app. UNA\'s names'],
            'Platform' => ['type' => 'string', 'enum' => self::PLATFORMS, 'default' => 'web', 'description' => 'The kind of client the page or menu is for: `web` ("Hidden on" its three screens), `mobile-app` or `desktop-app` (a desktop app, which follows the desktop screen)'],
            'Frame' => [
                'type' => 'object',
                'description' => 'The parts of a block\'s frame, as its UNA design box has them',
                'additionalProperties' => false,
                'required' => ['title', 'bg', 'padding'],
                'properties' => [
                    'title' => ['type' => 'boolean'],
                    'bg' => ['type' => 'boolean', 'description' => 'The block\'s surface (a card)'],
                    'padding' => ['type' => 'boolean'],
                ],
            ],
            'BlockDesign' => [
                'type' => 'object',
                'description' => 'How a block is drawn, per screen (Studio\'s Pages builder: "Hidden on", and the screens its title, background and padding are hidden on). A part its frame does not have lists no screens.',
                'additionalProperties' => false,
                'required' => ['frame', 'hidden_on', 'title_hidden_on', 'bg_hidden_on', 'padding_hidden_on'],
                'properties' => [
                    'frame' => ['oneOf' => [['$ref' => '#/components/schemas/Frame'], ['type' => 'null']], 'description' => 'v2 always sends its design box\'s parts'],
                    'hidden_on' => $aScreens + ['description' => 'Screens the whole block is hidden on'],
                    'title_hidden_on' => $aScreens,
                    'bg_hidden_on' => $aScreens,
                    'padding_hidden_on' => $aScreens,
                ],
            ],
            'BlockText' => [
                'type' => 'object',
                'description' => 'A text block\'s content (GET /layout/blocks/{id}/text)',
                'additionalProperties' => false,
                'required' => ['id', 'title', 'html'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'title' => ['type' => 'string', 'description' => 'Its title in the viewer\'s language; empty for none'],
                    'html' => ['type' => 'string', 'description' => 'Its content as HTML, written by the site\'s owner: sanitize it before drawing it'],
                ],
            ],
            'ResolvedBlock' => [
                'type' => 'object',
                'description' => 'A block of a page, without its data: the client reads `endpoint`.',
                'required' => ['id', 'kind', 'module', 'title', 'title_key', 'endpoint', 'paged', 'design'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'kind' => ['type' => 'string', 'description' => 'What it shows and so how it is drawn: `timeline.public`, `timeline.home`, `timeline.hot`, `timeline.for_you`, `timeline.compose` (the composer, no endpoint), `graph.friends`, `graph.friend_suggestions`, `graph.follow_suggestions`, `posts.list` and the other modules\' `<tag>.list`, `groups.joined` and the like; also `profile.info` (a profile\'s Info, GET /profiles/{id}/info), `groups.members`, `spaces.members` and `events.members` (a context\'s Members), `posts.categories` and `discussions.categories` (a module\'s categories with their counts), `text.html` (text written in Studio, a language string or HTML: GET /layout/blocks/{id}/text). Clients skip kinds they don\'t know', 'example' => 'graph.friend_suggestions'],
                    'module' => ['type' => 'string', 'description' => 'The module that feeds it (v2 only)', 'example' => 'system'],
                    'title' => ['type' => 'string', 'description' => 'Its title in the viewer\'s language; empty for none'],
                    'title_key' => ['type' => ['string', 'null'], 'description' => 'Always null in v2: `title` is translated'],
                    'endpoint' => ['type' => ['string', 'null'], 'description' => 'The GET route it reads, under the API\'s base, with its query; for a paged one add `cursor` for more. Null for one with no data (the composer)', 'example' => '/me/recommendations/friends?limit=5'],
                    'paged' => ['type' => 'boolean'],
                    'design' => ['$ref' => '#/components/schemas/BlockDesign'],
                ],
            ],
            'Cell' => [
                'type' => 'object',
                'required' => ['name', 'blocks'],
                'properties' => [
                    'name' => ['type' => 'string', 'description' => '`main`; `side` beside it, or `left` and `right` in three columns; v2 adds `top` and `bottom`, UNA\'s full-width rows above and below the columns', 'example' => 'side'],
                    'blocks' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/ResolvedBlock']],
                ],
            ],
            'ResolvedPage' => [
                'type' => 'object',
                'required' => ['id', 'uri', 'layout', 'title', 'title_key', 'params', 'cells'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'uri' => ['type' => 'string', 'description' => 'The page\'s path on the site: `/` for the home page, `/page/<uri>` for another', 'example' => '/'],
                    'layout' => ['$ref' => '#/components/schemas/Layout'],
                    'title' => ['type' => 'string'],
                    'title_key' => ['type' => ['string', 'null'], 'description' => 'Always null in v2'],
                    'params' => ['type' => 'object', 'description' => 'The values of the path\'s query', 'additionalProperties' => ['type' => 'string']],
                    'cells' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Cell'], 'description' => 'The layout\'s cells in reading order, empty ones included'],
                ],
            ],
        ];
    }
}

/** @} */
