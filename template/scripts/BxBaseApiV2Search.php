<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: people search (GET /search/profiles). Content search is the Timeline's (its hits
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
}

/** @} */
