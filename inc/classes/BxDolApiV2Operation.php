<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * One API v2 operation, put on the endpoint method that handles it. The router and the
 * OpenAPI document both read it, so the code and the spec can't disagree about a route.
 *
 * @code
 * #[BxDolApiV2Operation(
 *     method: 'GET', path: '/profiles/{id}', id: 'getProfile', tag: 'profiles',
 *     summary: 'A profile', responses: [200 => 'Profile', 404 => null],
 * )]
 * public function getProfile(BxDolApiV2Request $oReq): array
 * @endcode
 */
#[Attribute(Attribute::TARGET_METHOD)]
class BxDolApiV2Operation
{
    /**
     * @param string $method HTTP method
     * @param string $path path under /api/v2, with {name} for path params (each one is an Id unless $params says otherwise)
     * @param string $id operationId, camelCase, unique across the API (MCP tools and generated clients use it as the name)
     * @param string $summary one line for docs and tool lists
     * @param string $tag group in the docs
     * @param string $auth 'none' (no identity used), 'optional' (guests get a guest view) or 'required'
     * @param string|null $body component schema of a JSON request body
     * @param bool $bodyRequired false for a body a client may leave out: an empty body is then read as {} and checked against the schema
     * @param array $responses status => component schema name, 'array:<name>' (a JSON type's name, as 'array:string', or a component's) or null for no body; 4xx/5xx always use Problem
     * @param array $params query and path params: name => ['in' => 'query', 'schema' => [...], 'required' => bool, 'description' => '']
     * @param string $description longer Markdown description
     * @param bool $paged adds `cursor` and `limit` query params
     * @param string|null $limit the rate limit bucket its requests are counted in (BxDolApiV2RateLimit): 'search', 'preview', 'agent' or 'upload'; left out, writes are counted as 'write' and everything else as 'general'
     */
    public function __construct(
        public string $method,
        public string $path,
        public string $id,
        public string $summary,
        public string $tag = 'system',
        public string $auth = 'optional',
        public ?string $body = null,
        public bool $bodyRequired = true,
        public array $responses = [200 => null],
        public array $params = [],
        public string $description = '',
        public bool $paged = false,
        public ?string $limit = null,
    ) {
    }
}

/** @} */
