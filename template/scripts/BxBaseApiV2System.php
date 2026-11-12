<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: discovery and the OpenAPI document, plus the schemas every endpoint shares.
 */
class BxBaseApiV2System
{
    #[BxDolApiV2Operation(
        method: 'GET', path: '/', id: 'getApiInfo', tag: 'system', auth: 'none',
        summary: 'What this API is and how to sign in',
        description: 'A client that only knows the site URL starts here: it finds the OpenAPI document, the OAuth endpoints and which modules this site\'s API has (`modules`), so it shows a section only where the site has one.',
        responses: [200 => 'ApiInfo'],
    )]
    public function getApiInfo(BxDolApiV2Request $oReq)
    {
        $aInfo = [
            'name' => getParam('site_title'),
            'url' => BX_DOL_URL_ROOT,
            'api_version' => BxDolApiV2Router::VERSION,
            'openapi_url' => BxDolApiV2Router::getBaseUrl() . '/openapi.json',
            'oauth' => null,
            'branding' => static::branding(),
            'modules' => static::modules(),
        ];

        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth'))
            $aInfo['oauth'] = [
                'authorization_endpoint' => BX_DOL_URL_ROOT . 'm/oauth2/auth',
                'token_endpoint' => BX_DOL_URL_ROOT . 'm/oauth2/token',
                'revocation_endpoint' => BX_DOL_URL_ROOT . 'm/oauth2/revoke',
                'scope' => BxDolApiV2Auth::SCOPE,
                'code_challenge_methods_supported' => ['S256'],
            ];

        return $aInfo;
    }

    /**
     * The modules with endpoints in this site's API, as each one's endpoint class says
     * (apiV2ModuleInfo): only enabled modules have an endpoint class, so nothing is listed here
     * by name. In the order of the endpoint classes (module names).
     */
    public static function modules()
    {
        $aModules = [];
        foreach (BxDolApiV2Router::hooks('apiV2ModuleInfo') as $oEndpoint) {
            $a = $oEndpoint->apiV2ModuleInfo();
            if (is_array($a) && !empty($a['module']))
                $aModules[] = $a;
        }
        return $aModules;
    }

    /**
     * Inline SVG above this many characters is left out (null): a client then shows `icon`.
     */
    const BRANDING_SVG_MAX = 65536;

    /**
     * How the community presents itself: its names and colour from Studio > Designer > PWA, and
     * its mark, logo and icon as the site's own header and meta tags pick them (the template >
     * Designer > SVG code > built-in chain of BxDolDesigns::getLogoSources). Nothing here is
     * private: guests and members get the same block.
     */
    public static function branding()
    {
        $oDesigns = BxDolDesigns::getInstance();
        $oTemplate = BxDolTemplate::getInstance();
        $aPwa = BxDolDesigns::getPwaSettings();

        $aSources = $oDesigns->getSiteLogoSources(function ($sFile) use ($oTemplate) {
            return $oTemplate->getImageUrl($sFile);
        });

        $sDescription = BxDolApiV2Map::text((string)$aPwa['description']['used']);

        // the logo's proportions, from the sizes Designer keeps for an uploaded logo
        $fAspect = null;
        if (in_array($aSources['logo']['source'], [BxDolDesigns::LOGO_SOURCE_TEMPLATE, BxDolDesigns::LOGO_SOURCE_SYSTEM], true)) {
            $iWidth = (int)$oDesigns->getSiteLogoWidth();
            $iHeight = (int)$oDesigns->getSiteLogoHeight();
            if ($iWidth > 0 && $iHeight > 0)
                $fAspect = round($iWidth / $iHeight, 4);
        }

        // the 180x180 home screen icon, as BxBaseFunctions::getMetaIcons picks it
        $sIcon = '';
        if (($iIcon = (int)getParam('sys_site_icon_apple')) && ($oTranscoder = BxDolTranscoderImage::getObjectInstance(BX_DOL_TRANSCODER_OBJ_ICON_APPLE)))
            $sIcon = (string)$oTranscoder->getFileUrl($iIcon);
        if ($sIcon === '')
            $sIcon = (string)$oTemplate->getIconUrl('apple-touch-icon.png');

        return [
            'name' => (string)$aPwa['name']['used'],
            'short_name' => (string)$aPwa['short_name']['used'],
            'description' => $sDescription !== '' ? $sDescription : null,
            'mark' => static::brandingImage($aSources['mark']),
            'mark_dark' => static::brandingImage($aSources['mark_dark']),
            'logo' => static::brandingImage($aSources['logo']),
            'logo_dark' => static::brandingImage($aSources['logo_dark']),
            'logo_aspect' => $fAspect,
            'icon' => BxDolApiV2Map::absoluteUrl($sIcon),
            // Designer's own colour only: the template's theme-color (Artificer's slate, Ocean's
            // near-white) colours the browser's title bar and is no brand colour of the site's
            'accent' => static::brandingColour((string)$aPwa['theme_color']['value']),
        ];
    }

    /**
     * One logo image as a URL: the file's, or SVG code as a data: URI (an <img> never runs its
     * scripts); null when there is none, when it is only the template's built-in image (UNA's
     * generic logo and mark, no image of the community's own), or when the code is too big to
     * send with every discovery.
     */
    protected static function brandingImage($aSource)
    {
        if ($aSource['source'] == BxDolDesigns::LOGO_SOURCE_BUILTIN)
            return null;

        if ($aSource['source'] == BxDolDesigns::LOGO_SOURCE_INLINE) {
            $sSvg = trim((string)$aSource['code']);
            if ($sSvg === '' || get_mb_len($sSvg) > static::BRANDING_SVG_MAX || !preg_match('/<svg[\s>]/i', $sSvg))
                return null;
            return 'data:image/svg+xml;base64,' . base64_encode($sSvg);
        }

        return $aSource['url'] !== '' ? BxDolApiV2Map::absoluteUrl($aSource['url']) : null;
    }

    /**
     * A CSS hex colour as #RRGGBB (the alpha of #RGBA and #RRGGBBAA dropped), or null.
     */
    public static function brandingColour($sColour)
    {
        if (!preg_match('/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i', trim($sColour), $m))
            return null;
        $sHex = mb_strtoupper($m[1]);
        if (get_mb_len($sHex) <= 4)
            $sHex = preg_replace('/^(.)(.)(.).?$/', '$1$1$2$2$3$3', $sHex);
        return '#' . get_mb_substr($sHex, 0, 6);
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/openapi.json', id: 'getOpenApi', tag: 'system', auth: 'none',
        summary: 'This API as an OpenAPI 3.1 document',
        description: 'Built from the endpoints this site serves, so modules that are not installed are not in it.',
        responses: [200 => null],
    )]
    public function getOpenApi(BxDolApiV2Request $oReq)
    {
        return (new BxDolApiV2Spec(new BxDolApiV2Router()))->build();
    }

    public static function schemas()
    {
        return [
            'Id' => [
                'type' => 'string',
                'pattern' => '^[1-9][0-9]*$',
                'description' => 'Identifier, encoded in JSON as a decimal string.',
                'example' => '42',
            ],
            'Problem' => [
                'type' => 'object',
                'description' => 'RFC 9457 problem document. `code` is stable and meant for programs.',
                'required' => ['type', 'title', 'status', 'code'],
                'properties' => [
                    'type' => ['type' => 'string', 'format' => 'uri', 'description' => 'URI of the problem type, `urn:una:problem:<code>`', 'example' => 'urn:una:problem:validation_failed'],
                    'title' => ['type' => 'string', 'description' => 'Short summary of the status, in English'],
                    'status' => ['type' => 'integer'],
                    'detail' => ['type' => ['string', 'null'], 'description' => 'Explanation of this occurrence, in English. Not for end users.'],
                    'code' => ['type' => 'string', 'example' => 'validation_failed', 'description' => 'Stable machine-readable code; clients localize from it'],
                    'errors' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/FieldError'], 'description' => 'Field-level validation errors'],
                ],
            ],
            'FieldError' => [
                'type' => 'object',
                'required' => ['field', 'code', 'message'],
                'properties' => [
                    'field' => ['type' => 'string', 'example' => 'body'],
                    'code' => ['type' => 'string', 'example' => 'required'],
                    'message' => ['type' => 'string'],
                ],
            ],
            'ProfileKind' => ['type' => 'string', 'enum' => ['person', 'organization', 'group']],
            'ProfileStatus' => ['type' => 'string', 'enum' => ['active', 'pending', 'suspended']],
            'Profile' => BxDolApiV2Map::profileSchema(),
            'ProfileBadge' => BxDolApiV2Map::badgeSchema(),
            'ApiInfo' => [
                'type' => 'object',
                'required' => ['name', 'url', 'api_version', 'openapi_url', 'oauth', 'branding', 'modules'],
                'properties' => [
                    'name' => ['type' => 'string'],
                    'url' => ['type' => 'string', 'format' => 'uri'],
                    'api_version' => ['type' => 'string'],
                    'openapi_url' => ['type' => 'string', 'format' => 'uri'],
                    'oauth' => [
                        'type' => ['object', 'null'],
                        'description' => 'Null when the site has no OAuth 2 server; then only the site\'s own pages can sign in. An app signs in with its own public client id (authorization code with PKCE), registered in the OAuth module; this API has no client of its own.',
                        'required' => ['authorization_endpoint', 'token_endpoint', 'revocation_endpoint', 'scope', 'code_challenge_methods_supported'],
                        'properties' => [
                            'authorization_endpoint' => ['type' => 'string', 'format' => 'uri'],
                            'token_endpoint' => ['type' => 'string', 'format' => 'uri'],
                            'revocation_endpoint' => ['type' => 'string', 'format' => 'uri'],
                            'scope' => ['type' => 'string'],
                            'code_challenge_methods_supported' => ['type' => 'array', 'items' => ['type' => 'string']],
                        ],
                    ],
                    'branding' => ['$ref' => '#/components/schemas/Branding'],
                    'modules' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/ModuleInfo'], 'description' => 'The modules this site\'s API has paths for (v2 only): a client shows a section (Discussions, Spaces) only for a module listed here, and routes a profile of kind `group` by its `module` to the paths of the module listed with it'],
                ],
            ],
            'ModuleInfo' => [
                'type' => 'object',
                'description' => 'A module of the site with paths in this API (v2 only)',
                'required' => ['module', 'tag', 'title', 'kind'],
                'properties' => [
                    'module' => ['type' => 'string', 'description' => 'The UNA module, as `Profile.module` and `Notification.module` name it', 'example' => 'bx_spaces'],
                    'tag' => ['type' => 'string', 'description' => 'The tag of its operations in this document, and the first part of its paths', 'example' => 'spaces'],
                    'title' => ['type' => 'string', 'description' => 'What the site calls it, in the viewer\'s language', 'example' => 'Spaces'],
                    'kind' => ['type' => 'string', 'description' => 'What one of its entries is: `group`, `space`, `discussion`, `conversation`, `notification`, `activity`; a newer site may send others', 'example' => 'space'],
                    'audiences' => ['type' => 'array', 'items' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private']], 'description' => 'The audiences a new entry of it may have: those of the privacy groups the site has turned on, in its order (another one is 422). Left out for a module whose entries have none (contexts, conversations)', 'example' => ['public', 'friends', 'private']],
                ],
            ],
            'Branding' => [
                'type' => 'object',
                'description' => 'How the community presents itself, from Studio > Designer (Logo and PWA). The same for guests and members.',
                'required' => ['name', 'short_name', 'description', 'mark', 'mark_dark', 'logo', 'logo_dark', 'logo_aspect', 'icon', 'accent'],
                'properties' => [
                    'name' => ['type' => 'string', 'description' => 'The app name: the PWA name, else the site title, else the host'],
                    'short_name' => ['type' => 'string', 'description' => 'At most about 12 characters, for tight places'],
                    'description' => ['type' => ['string', 'null'], 'description' => 'Plain text; null when the site has none'],
                    'mark' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The square mark: an image URL, or SVG code as a data:image/svg+xml URI. Null when the site has none of its own (only the template\'s built-in image, UNA\'s generic one) or its code is over ' . self::BRANDING_SVG_MAX . ' characters'],
                    'mark_dark' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The mark for dark backgrounds; null when the site has no dark variant'],
                    'logo' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The wide logo, as `mark`'],
                    'logo_dark' => ['type' => ['string', 'null'], 'format' => 'uri'],
                    'logo_aspect' => ['type' => ['number', 'null'], 'description' => 'Width / height of an uploaded logo, when Designer has its size'],
                    'icon' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The 180x180 home screen icon (the site\'s, else the template\'s). Until the site has made the icon\'s size, this is a transcoder link that changes with every call, so it is no stable cache key then'],
                    'accent' => ['type' => ['string', 'null'], 'pattern' => '^#[0-9A-F]{6}$', 'description' => 'The theme colour set in Studio > Designer > PWA, as #RRGGBB; null when none is set (the template\'s theme-color is not sent) or it is not a hex colour. A client derives readable shades from it'],
                ],
            ],
        ];
    }
}

/** @} */
