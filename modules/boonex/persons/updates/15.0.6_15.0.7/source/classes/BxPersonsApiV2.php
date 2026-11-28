<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Persons Persons
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Persons: the people directory, as the module's browse pages list it
 * (People > Recent, Active, Online). The router finds this class only while the module is
 * enabled. A person is a profile: GET /profiles/{id} has one, GET /profiles/{id}/friends a
 * person's friends. The work is in BxBaseModProfileApiV2.
 */
class BxPersonsApiV2 extends BxBaseModProfileApiV2
{
    const API_TAG = 'persons';
    const API_KIND = 'person';

    /** The site menu's People (persons-home) and its submenu's Recent, Active and Online. */
    const PAGE_VIEWS = [
        'persons-home' => 'recent',
        'persons-active' => 'active',
        'persons-online' => 'online',
    ];

    public function __construct()
    {
        parent::__construct('bx_persons');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/persons', id: 'listPersons', tag: 'persons', paged: true,
        summary: 'People the site lists, in one of its browse views',
        description: 'As the site\'s People pages list them for the viewer (Recent `persons-home`, Active `persons-active`, Online `persons-online`, the module\'s browse blocks): active persons, without unconfirmed accounts where the site hides them. `view`: `recent` (the default, newest first), `active` (the most recently signed in first) or `online` (those online now, the newest session first). A person whose privacy keeps the page from the viewer is listed with the name, and the picture when the viewer may see it, as on the site; GET /profiles/{id} answers 403 for one. 403 when the module\'s browse check refuses (the site\'s `check_allowed_browse` hook). The viewer\'s friends are GET /profiles/{id}/friends.',
        params: [
            'view' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => self::VIEWS, 'default' => 'recent']],
        ],
        responses: [200 => 'Page_Profile', 403 => null, 422 => null])]
    public function listPersons(BxDolApiV2Request $oReq)
    {
        return $this->_browse($oReq);
    }
}

/** @} */
