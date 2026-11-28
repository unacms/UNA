<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * The OpenAPI 3.1 document of API v2, built from the operations the router dispatches on, so
 * it lists exactly what this site serves (system endpoints plus those of enabled modules).
 */
class BxDolApiV2Spec
{
    protected $_oRouter;

    protected static $_aStatusText = [
        200 => 'OK', 201 => 'Created', 202 => 'Accepted', 204 => 'No Content', 304 => 'Not Modified',
        400 => 'The request is malformed', 401 => 'Not signed in, or the token is invalid',
        403 => 'Not allowed for this profile', 404 => 'Not found', 409 => 'Conflicts with the current state',
        413 => 'Too large', 415 => 'Unsupported media type', 422 => 'Invalid fields', 429 => 'Too many requests',
    ];

    protected static $_aTagDescriptions = [
        'system' => 'Discovery and this document',
        'me' => 'The signed-in account and the profile it acts as',
        'profiles' => 'Persons, organizations, groups and other profiles',
        'graph' => 'Follows and friends between profiles, and the profiles the site suggests',
        'layout' => 'Pages as the site\'s Pages builder sets them up: their layout and the blocks the viewer may see',
        'navigation' => 'The apps\' sidebar, from the site\'s Apps Sidebar menu (Studio > Navigation)',
        'agents' => 'The site\'s AI agents the viewer may chat with (Studio > Agents), the viewer\'s chats with them, and a reply streamed as it is written',
        'feeds' => 'Lists of activities, newest first',
        'activities' => 'One activity, and posting to a feed',
        'content' => 'What an activity shows: a feed post, or content of another module',
        'comments' => 'Comments on what an activity shows',
        'reactions' => 'Reactions to what an activity shows',
        'notifications' => 'What happened around the viewer',
        'conversations' => 'Private conversations between profiles',
        'uploads' => 'Photos and videos uploaded for a post before it is sent, and pictures for a text',
        'editor' => 'What a rich text editor asks the site for: hashtags to suggest and a link\'s preview card',
        'search' => 'People, groups, content and discussions found by words',
        'groups' => 'Groups: browsing, joining and leaving them, and their members',
        'spaces' => 'Spaces: contexts like groups that may be inside other spaces; browsing, subspaces, joining and leaving them, and their members',
        'discussions' => 'Discussions (forum topics): browsing, starting and editing them; their replies are the comments of their Item',
        'videos' => 'Videos: uploads the site converts, and links to videos on other sites; browsing, adding, editing and deleting them; their comments and reactions are those of their Item',
    ];

    public function __construct(BxDolApiV2Router $oRouter)
    {
        $this->_oRouter = $oRouter;
    }

    public function build()
    {
        $bOAuth = BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth');

        $aPaths = [];
        $aTags = [];
        foreach ($this->_oRouter->getOperations() as $aOp) {
            $oOp = $aOp['attr'];
            $aPaths[$oOp->path][strtolower($oOp->method)] = $this->_operation($oOp, $bOAuth);
            $aTags[$oOp->tag] = true;
        }
        ksort($aPaths);

        $aSecuritySchemes = [
            'session' => [
                'type' => 'apiKey',
                'in' => 'cookie',
                'name' => 'memberSession',
                'description' => 'The site\'s own session cookie, for pages of the site itself. Requests that change something must come from the site\'s origin.',
            ],
        ];
        if ($bOAuth)
            $aSecuritySchemes['oauth2'] = [
                'type' => 'oauth2',
                'description' => 'OAuth 2 authorization code flow with PKCE (S256). Native apps use a public client and a loopback redirect (RFC 8252); the port may vary.',
                'flows' => [
                    'authorizationCode' => [
                        'authorizationUrl' => BX_DOL_URL_ROOT . 'm/oauth2/auth',
                        'tokenUrl' => BX_DOL_URL_ROOT . 'm/oauth2/token',
                        'refreshUrl' => BX_DOL_URL_ROOT . 'm/oauth2/token',
                        'scopes' => [BxDolApiV2Auth::SCOPE => 'Act as the signed-in profile through API v2'],
                    ],
                ],
            ];

        $aSchemas = $this->_oRouter->getSchemas();
        ksort($aSchemas);

        return [
            'openapi' => '3.1.0',
            'info' => [
                'title' => getParam('site_title') . ' API',
                'version' => BxDolApiV2Router::VERSION,
                'summary' => 'REST API v2 of a UNA community site.',
                'description' => implode("\n\n", [
                    'Preview: API v2 is not ready for production. Shapes and paths may still change, and a site turns it on in Studio > API > Settings (off as installed).',
                    'Resource URLs, HTTP methods, JSON bodies and real status codes.',
                    'Errors are RFC 9457 problem documents (`application/problem+json`) with a stable `code`, `type` `urn:una:problem:<code>`; `errors` lists invalid fields.',
                    'Lists are `{items, next_cursor}` with cursor paging: pass `next_cursor` back as `cursor`; it is always there, `null` on the last page. Ids are decimal strings.',
                    'JSON answers of 200 to GET up to 1 MiB carry a weak ETag (`W/"<hex>"`, a digest of the body) with `Cache-Control: private, no-cache`; send it back as `If-None-Match` (compared weakly; a list and `*` work too) to get 304 with no body while nothing changed. Errors and writes carry none.',
                    'Requests are rate limited by kind (reads, writes, searches, link previews, messages to agents, uploads), a signed-in one by its profile and a guest\'s by its address: one over the limit is 429 `rate_limited` with `Retry-After`, the seconds until it may be sent again.',
                    'Signed-in writes (POST, PUT, PATCH, DELETE) honour `Idempotency-Key` (1 to 255 visible ASCII characters): a repeat with the same key and request gets the first answer again, with `Idempotent-Replayed: true`, for a day; the same key with another request is 422 `idempotency_key_reused`, and one while the first still runs 409 `idempotency_in_progress`. Uploads (multipart) and guests\' requests ignore it.',
                    'The previous API (`api.php`, v1) is unchanged.',
                ]),
                'license' => ['name' => 'MIT', 'identifier' => 'MIT'],
            ],
            'servers' => [['url' => BxDolApiV2Router::getBaseUrl()]],
            'tags' => array_map(function ($s) {
                return ['name' => $s, 'description' => self::$_aTagDescriptions[$s] ?? ucfirst(str_replace('-', ' ', $s))];
            }, array_keys($aTags)),
            'paths' => $aPaths,
            'components' => [
                'schemas' => $aSchemas,
                'securitySchemes' => $aSecuritySchemes,
                'headers' => [
                    'retryAfter' => ['description' => 'Seconds to wait before sending the request again', 'schema' => ['type' => 'integer', 'minimum' => 1]],
                ],
                'parameters' => [
                    'idempotencyKey' => ['name' => BxDolApiV2Idempotency::HEADER, 'in' => 'header', 'required' => false, 'description' => 'Any unique string (a UUID) for this write; send the same one again to retry it safely: the first answer comes back for a day', 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 255, 'pattern' => '^[\\x21-\\x7e]+$']],
                    'cursor' => ['name' => 'cursor', 'in' => 'query', 'required' => false, 'description' => '`next_cursor` of the previous page', 'schema' => ['type' => 'string']],
                    'limit' => ['name' => 'limit', 'in' => 'query', 'required' => false, 'description' => 'Items per page', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => BxDolApiV2Request::LIMIT_MAX, 'default' => BxDolApiV2Request::LIMIT_DEFAULT]],
                ],
            ],
        ];
    }

    protected function _operation(BxDolApiV2Operation $oOp, $bOAuth)
    {
        $a = [
            'operationId' => $oOp->id,
            'summary' => $oOp->summary,
            'tags' => [$oOp->tag],
        ];
        if ($oOp->description !== '')
            $a['description'] = $oOp->description;

        $aSecure = $bOAuth ? [['oauth2' => [BxDolApiV2Auth::SCOPE]], ['session' => []]] : [['session' => []]];
        if ($oOp->auth === 'none')
            $a['security'] = [];
        elseif ($oOp->auth === 'optional')
            $a['security'] = array_merge([new stdClass()], $aSecure); // {}: no credentials needed (an empty PHP array would be [])
        else
            $a['security'] = $aSecure;

        $aParams = [];
        if (preg_match_all('/\{([a-z_]+)\}/', $oOp->path, $m))
            foreach ($m[1] as $sName)
                $aParams[] = array_merge(['name' => $sName, 'in' => 'path', 'required' => true, 'schema' => ['$ref' => '#/components/schemas/Id']], $oOp->params[$sName] ?? []);
        foreach ($oOp->params as $sName => $aParam)
            if (($aParam['in'] ?? 'query') === 'query')
                $aParams[] = array_merge(['name' => $sName, 'in' => 'query', 'required' => false], $aParam);
        if ($oOp->paged) {
            $aParams[] = ['$ref' => '#/components/parameters/cursor'];
            $aParams[] = ['$ref' => '#/components/parameters/limit'];
        }
        // signed-in writes honour Idempotency-Key; multipart uploads and guests' requests don't
        if (BxDolApiV2Idempotency::isWrite($oOp->method) && $oOp->auth !== 'none' && ($oOp->body === null || !str_starts_with($oOp->body, 'multipart:')))
            $aParams[] = ['$ref' => '#/components/parameters/idempotencyKey'];
        if ($aParams)
            $a['parameters'] = $aParams;

        if ($oOp->body !== null) {
            $bMultipart = str_starts_with($oOp->body, 'multipart:');
            $sSchema = $bMultipart ? substr($oOp->body, strlen('multipart:')) : $oOp->body;
            $a['requestBody'] = [
                'required' => $bMultipart || $oOp->bodyRequired,
                'content' => [($bMultipart ? 'multipart/form-data' : 'application/json') => ['schema' => ['$ref' => '#/components/schemas/' . $sSchema]]],
            ];
        }

        $aResponses = [];
        foreach ($oOp->responses as $iStatus => $mSchema) {
            if ($iStatus >= 400) {
                $aResponses[$iStatus] = $this->_problem($iStatus);
                continue;
            }
            $aResponse = ['description' => self::$_aStatusText[$iStatus] ?? 'OK'];
            if ($mSchema !== null) {
                $fSchema = function ($sName) {
                    // JSON types by their own name (array:string), component schemas by theirs
                    return in_array($sName, ['string', 'integer', 'number', 'boolean'], true) ? ['type' => $sName] : ['$ref' => '#/components/schemas/' . $sName];
                };
                // `sse:<schema>`: Server-Sent Events, each event's data one of that schema (BxDolApiV2Response::stream)
                if (str_starts_with($mSchema, 'sse:')) {
                    $sEvent = substr($mSchema, strlen('sse:'));
                    // each event's data is JSON of that schema (JSON Schema's contentSchema: 3.1 has no
                    // other way to say it of a stream)
                    $aResponse['content'] = ['text/event-stream' => [
                        'schema' => ['type' => 'string', 'description' => 'Events `data: <JSON>` separated by a blank line, each JSON one ' . $sEvent, 'contentMediaType' => 'application/json', 'contentSchema' => ['$ref' => '#/components/schemas/' . $sEvent]],
                    ]];
                    $aResponses[$iStatus] = $aResponse;
                    continue;
                }
                $aSchema = str_starts_with($mSchema, 'array:')
                    ? ['type' => 'array', 'items' => $fSchema(substr($mSchema, strlen('array:')))]
                    : $fSchema($mSchema);
                $aResponse['content'] = ['application/json' => ['schema' => $aSchema]];
            }
            $aResponses[$iStatus] = $aResponse;
        }

        // errors every operation of this kind can give
        if ($oOp->auth === 'required')
            $aResponses[401] = $aResponses[401] ?? $this->_problem(401);
        if (strpos($oOp->path, '{') !== false)
            $aResponses[404] = $aResponses[404] ?? $this->_problem(404);
        if ($oOp->body !== null || $oOp->paged || $oOp->params)
            $aResponses[422] = $aResponses[422] ?? $this->_problem(422);
        // any request may be one too many (BxDolApiV2RateLimit), also where the site has limits off
        $aResponses[429] = ($aResponses[429] ?? $this->_problem(429)) + ['headers' => ['Retry-After' => ['$ref' => '#/components/headers/retryAfter']]];
        $aResponses['default'] = ['description' => 'Error', 'content' => ['application/problem+json' => ['schema' => ['$ref' => '#/components/schemas/Problem']]]];

        ksort($aResponses, SORT_STRING);
        $a['responses'] = $aResponses;

        return $a;
    }

    protected function _problem($iStatus)
    {
        return [
            'description' => self::$_aStatusText[$iStatus] ?? 'Error',
            'content' => ['application/problem+json' => ['schema' => ['$ref' => '#/components/schemas/Problem']]],
        ];
    }
}

/** @} */
