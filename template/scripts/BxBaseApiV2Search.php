<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: the site's search (GET /search: the search window's, BxDolSearchUnified) and people search
 * (GET /search/profiles). Content search is the Timeline's (its hits
 * are Items) and group search the Groups module's, so each is there only while its module is.
 */
class BxBaseApiV2Search
{
    #[BxDolApiV2Operation(
        method: 'GET', path: '/search/profiles', id: 'searchProfiles', tag: 'search', limit: 'search',
        summary: 'People and organizations whose name or handle matches, best match first',
        description: "Up to `limit` (20 by default) active profiles of the profile modules (persons, organizations) that the viewer may see, found by each module's own quick search (its name fields, as the site's people search; most recently active first) and ranked: the profile whose handle or whole name is `q` first, then names that start with it, then names with a word that does, then the rest. A profile the viewer may not open is left out, unless only its privacy refused and leaves it partly visible, as the site shows such a page with its name and picture (a person for friends only), to a viewer whose membership level may view the module's profiles; one for members only is not found by guests. GET /profiles/{id} answers 403 for a partly visible one. Groups are GET /search/groups.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Part of a name, or a handle'],
            'limit' => ['in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50, 'default' => 20]],
        ],
        responses: [200 => 'array:Profile', 422 => null],
    )]
    public function searchProfiles(BxDolApiV2Request $oReq)
    {
        $sQuery = BxDolApiV2Search::query($oReq);

        $aModules = [];
        foreach (bx_srv('system', 'get_modules_by_type', ['profile']) as $aModule)
            $aModules[] = $aModule['name'];

        return BxDolApiV2Search::profiles($sQuery, $aModules, $oReq->limit());
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/search', id: 'search', tag: 'search', limit: 'search',
        summary: 'The site\'s search: every module the viewer may see, one module, or what is posted in a context',
        description: "The search window's query and results, as the site and the apps show them. Without `section` or `tab`: a few hits of every searched module (Studio > Search) with how many each has, counted up to 10 (`count_more`: more). With one `section` (the module scope) or a `tab`: that module's hits, a page at a time (`cursor`), counted up to 50 on the first page. `context` limits hits to what is posted in a group, an event or another context the viewer may see. Every hit is one the viewer may open, and counts only count those. `scope` has the chips the query can have: the module's own search fields among them.",
        params: [
            'q' => ['in' => 'query', 'schema' => ['type' => 'string', 'maxLength' => 200], 'description' => 'What to look for; may be left out when another filter is set'],
            'section' => ['in' => 'query', 'schema' => ['type' => 'string'], 'description' => 'Module names, comma separated; one is the module scope'],
            'tab' => ['in' => 'query', 'schema' => ['type' => 'string'], 'description' => 'One module of the scope, its hits alone'],
            'context' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A context profile: what is posted in it'],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Created by this profile'],
            'title_only' => ['in' => 'query', 'schema' => ['type' => 'boolean']],
            'date_from' => ['in' => 'query', 'schema' => ['type' => 'string', 'format' => 'date']],
            'date_to' => ['in' => 'query', 'schema' => ['type' => 'string', 'format' => 'date']],
            'date_field' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['created', 'starts', 'ends']]],
            'timezone' => ['in' => 'query', 'schema' => ['type' => 'string']],
            'filters' => ['in' => 'query', 'schema' => ['type' => 'string'], 'description' => 'JSON object of the module\'s search fields and their values (module scope only)'],
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['best', 'new'], 'default' => 'best']],
            'cursor' => ['in' => 'query', 'schema' => ['type' => 'string']],
            'limit' => ['in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50, 'default' => 12]],
        ],
        responses: [200 => 'SearchResults'],
    )]
    public function search(BxDolApiV2Request $oReq)
    {
        $aIn = [];
        foreach (['section', 'tab', 'context', 'author', 'date_from', 'date_to', 'date_field', 'timezone', 'filters', 'sort', 'cursor'] as $sName)
            if (($s = $oReq->query($sName)) !== null)
                $aIn[$sName] = $s;
        $aIn['keyword'] = (string)$oReq->query('q', '');
        $aIn['title_only'] = $oReq->queryBool('title_only') ? 1 : 0;
        $aIn['per_page'] = $oReq->limit();

        // the modules the site searches for its apps (sys_api_search_sections), as GET /search/content does
        $oSearch = BxDolSearchUnified::getInstance();
        $oSearch->setApiSections(true);
        $aQuery = BxDolApiV2Search::isolated(function () use ($oSearch, $aIn) {
            return $oSearch->normalize($aIn);
        });

        $aScope = $oSearch->getScope($aQuery);
        $aResults = $oSearch->search($aQuery, 'hits');
        $aGroups = isset($aResults['group']) ? [$aResults['group']] : $aResults['groups'];
        foreach ($aGroups as &$aGroup) {
            $aGroup['next_cursor'] = $aGroup['cursor'] !== '' ? $aGroup['cursor'] : null;
            unset($aGroup['cursor']);
        }

        return [
            'query' => (object)$oSearch->toUrlParams($aQuery),
            'scope' => $aScope['scope'],
            'context' => $aScope['context'] ? ['id' => (string)$aScope['context']['id'], 'title' => $aScope['context']['title']] : null,
            'chips' => $aScope['chips'],
            'groups' => $aGroups,
            'total' => isset($aResults['group']) ? $aResults['group']['count'] : $aResults['total'],
            'total_more' => isset($aResults['group']) ? $aResults['group']['count_more'] : $aResults['total_more'],
        ];
    }

    public static function schemas()
    {
        return [
            'SearchHit' => [
                'type' => 'object',
                'required' => ['kind', 'module', 'id', 'title', 'url', 'date'],
                'properties' => [
                    'kind' => ['type' => 'string', 'enum' => ['content', 'comment', 'profile', 'page']],
                    'module' => ['type' => 'string'],
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'title' => ['type' => 'string'],
                    'url' => ['type' => 'string', 'format' => 'uri'],
                    'date' => ['type' => 'integer', 'description' => 'Unix time it was added or changed'],
                ],
            ],
            'SearchGroup' => [
                'type' => 'object',
                'required' => ['name', 'title', 'icon', 'count', 'count_more', 'items', 'next_cursor'],
                'properties' => [
                    'name' => ['type' => 'string', 'description' => 'The module'],
                    'title' => ['type' => 'string'],
                    'icon' => ['type' => 'string', 'description' => 'Lucide icon name'],
                    'count' => ['type' => 'integer'],
                    'count_more' => ['type' => 'boolean', 'description' => 'There are more than `count`'],
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/SearchHit']],
                    'next_cursor' => ['type' => ['string', 'null']],
                ],
            ],
            'SearchResults' => [
                'type' => 'object',
                'required' => ['query', 'scope', 'context', 'chips', 'groups', 'total', 'total_more'],
                'properties' => [
                    'query' => ['type' => 'object', 'description' => 'The query as the results page\'s URL params', 'additionalProperties' => true],
                    'scope' => ['type' => 'string', 'enum' => ['global', 'module', 'context']],
                    'context' => ['type' => ['object', 'null'], 'properties' => ['id' => ['$ref' => '#/components/schemas/Id'], 'title' => ['type' => 'string']]],
                    'chips' => ['type' => 'array', 'items' => ['type' => 'object', 'additionalProperties' => true], 'description' => 'name, type (scope, toggle, profile, date_range, options), caption, value; options and fields where they apply'],
                    'groups' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/SearchGroup']],
                    'total' => ['type' => 'integer'],
                    'total_more' => ['type' => 'boolean'],
                ],
            ],
        ];
    }
}

/** @} */
