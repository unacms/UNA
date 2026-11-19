<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Personal access tokens: keys an account makes for itself in account settings > Connectors (and an
 * operator in Studio > Agents > Connectors), for API v2 and its MCP server (/api/mcp). Sent as
 * `Authorization: Bearer <token>`, a token acts as its account's current profile, like the site's
 * session and an OAuth token do (BxDolApiV2Auth). It can't be handed to another account: it is the
 * account's own, and the account revokes it.
 *
 * A token is PREFIX followed by 40 hex characters. Only its sha256 is kept, with its last characters
 * (the hint) to tell tokens apart, so it is shown once, when it is made.
 */
class BxDolApiTokens
{
    const PREFIX = 'una_pat_';

    /** Lifetimes offered when a token is made, in days; 0 is never. */
    const LIFETIMES = [30, 90, 365, 0];

    const TITLE_MAX = 64;

    /** Tokens an account may have at once. */
    const MAX_PER_ACCOUNT = 20;

    const HINT_LENGTH = 4;

    /**
     * Whether a bearer credential is a personal access token (and not an OAuth access token).
     */
    public static function isToken($sToken)
    {
        return is_string($sToken) && (bool)preg_match('/^' . preg_quote(self::PREFIX, '/') . '[0-9a-f]{40}\z/', $sToken);
    }

    public static function hash($sToken)
    {
        return hash('sha256', (string)$sToken);
    }

    /**
     * Make a token for an account.
     * @param int $iDays lifetime in days, 0 for never (one of LIFETIMES)
     * @return array|string ['id' => ..., 'token' => the token, shown once] or an error message
     */
    public static function create($iAccountId, $sTitle, $iDays, $iNow = null)
    {
        $iAccountId = (int)$iAccountId;
        if ($iAccountId <= 0 || !BxDolAccount::getInstance($iAccountId))
            return _t('_sys_txt_access_denied');

        $sTitle = trim((string)$sTitle);
        if ($sTitle === '' || get_mb_len($sTitle) > self::TITLE_MAX)
            return _t('_sys_api_tokens_err_title', self::TITLE_MAX);

        $iDays = (int)$iDays;
        if (!in_array($iDays, self::LIFETIMES, true))
            return _t('_sys_api_tokens_err_expires');

        $oQuery = BxDolApiQuery::getInstance();
        if (count($oQuery->getTokensByAccount($iAccountId)) >= self::MAX_PER_ACCOUNT)
            return _t('_sys_api_tokens_err_too_many', self::MAX_PER_ACCOUNT);

        $iNow = $iNow === null ? time() : (int)$iNow;
        $sToken = self::PREFIX . bin2hex(random_bytes(20));
        $iId = $oQuery->addToken($iAccountId, $sTitle, self::hash($sToken), substr($sToken, -self::HINT_LENGTH), $iNow, $iDays ? $iNow + $iDays * 86400 : 0);
        if (!$iId)
            return _t('_sys_txt_error_occured');

        return ['id' => $iId, 'token' => $sToken];
    }

    /**
     * The token's row while it can be used: known and not expired. Notes its use.
     * @return array|false
     */
    public static function find($sToken, $iNow = null)
    {
        if (!self::isToken($sToken))
            return false;

        $oQuery = BxDolApiQuery::getInstance();
        $aToken = $oQuery->getTokenByHash(self::hash($sToken));
        if (empty($aToken))
            return false;

        $iNow = $iNow === null ? time() : (int)$iNow;
        if ((int)$aToken['expires'] && (int)$aToken['expires'] <= $iNow)
            return false;

        $oQuery->touchToken($aToken['id'], $iNow);

        return $aToken;
    }

    /**
     * @return bool whether the account had the token
     */
    public static function revoke($iId, $iAccountId)
    {
        return BxDolApiQuery::getInstance()->deleteToken($iId, $iAccountId);
    }

    public static function revokeAll($iAccountId)
    {
        return BxDolApiQuery::getInstance()->deleteTokensByAccount($iAccountId);
    }

    /**
     * The block of account settings > Connectors: where to connect, and the signed-in account's tokens
     * (the grid sys_grid_api_tokens). Studio > Agents > Connectors draws its own (BxBaseStudioAgents).
     * @param BxDolTemplate|null $oTemplate the template the grid and its popups are drawn with
     */
    public static function getBlockCode($oTemplate = null)
    {
        if (!isLogged())
            return '';

        $oGrid = BxDolGrid::getObjectInstance('sys_grid_api_tokens', $oTemplate);
        if (!$oGrid)
            return '';

        // the apps the account connected with OAuth (an AI assistant that signed in, the desktop app)
        $bOAuth = BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth');
        $mixedApps = $bOAuth ? bx_srv('bx_oauth', 'connected_apps') : '';

        // the apps (NEO): what it is for and where to connect, then the grid
        if (bx_is_api())
            return array_merge([
                bx_api_get_block('msg', BxDolMcpServer::isEnabled() ? self::getInfoText() . ' ' . _t('_sys_api_tokens_txt_mcp_url') . ': ' . self::getMcpUrl() : self::getInfoText()),
                bx_api_get_block('grid', $oGrid->getCodeAPI()),
            ], is_array($mixedApps) ? $mixedApps : []);

        if (!$oTemplate)
            $oTemplate = BxDolTemplate::getInstance();

        return $oTemplate->parseHtmlByName('api_tokens_info.html', [
            'txt_info' => self::getInfoText(),
            'txt_mcp_url' => _t('_sys_api_tokens_txt_mcp_url'),
            'txt_copy' => _t('_sys_api_tokens_btn_copy'),
            'mcp_url' => bx_html_attribute(self::getMcpUrl()),
            'clients' => BxDolMcpServer::isEnabled() ? self::getMcpClientsCode($oTemplate) : '',
            'grid' => $oGrid->getCode(),
            'apps' => is_string($mixedApps) ? $mixedApps : '',
        ]);
    }

    /**
     * What Connectors says first: how to connect an assistant (an operator's tools too), or, while the MCP server is
     * off, that it is (and to an operator, where to turn it on).
     */
    public static function getInfoText()
    {
        if (!BxDolMcpServer::isEnabled())
            return _t(isAdmin() ? '_sys_api_mcp_txt_off_admin' : '_sys_api_mcp_txt_off');

        return _t(isAdmin() ? '_sys_api_tokens_txt_info_operator' : '_sys_api_tokens_txt_info');
    }

    /**
     * Where an MCP client connects.
     */
    public static function getMcpUrl()
    {
        return BX_DOL_URL_ROOT . 'api/mcp';
    }

    /**
     * The name an MCP client gives the site's server: its host, letters, digits and dashes.
     */
    public static function getMcpServerName()
    {
        $s = strtolower((string)parse_url(BX_DOL_URL_ROOT, PHP_URL_HOST));
        $s = trim(preg_replace('/[^a-z0-9]+/', '-', preg_replace('/^www\./', '', $s)), '-');
        return $s !== '' ? $s : 'una';
    }

    /**
     * Ways to add the site's MCP server to the AI clients that can be told what to add: a command to run (it then
     * opens the sign-in) or an install link. Claude and ChatGPT on the web take the URL in their settings.
     * @return array ['commands' => [title => command], 'links' => [title => URL]]
     */
    public static function getMcpClients()
    {
        $sUrl = self::getMcpUrl();
        $sName = self::getMcpServerName();

        return [
            'commands' => [
                'Claude Code' => 'claude mcp add --transport http ' . $sName . ' ' . $sUrl,
                'Codex' => 'codex mcp add ' . $sName . ' --url ' . $sUrl . ' && codex mcp login ' . $sName,
            ],
            'links' => [
                'Cursor' => 'cursor://anysphere.cursor-deeplink/mcp/install?name=' . rawurlencode($sName) . '&config=' . rawurlencode(base64_encode(json_encode(['url' => $sUrl], JSON_UNESCAPED_SLASHES))),
                'VS Code' => 'vscode:mcp/install?' . rawurlencode(json_encode(['name' => $sName, 'type' => 'http', 'url' => $sUrl], JSON_UNESCAPED_SLASHES)),
            ],
        ];
    }

    /**
     * The "Connect an assistant" part of Connectors: getMcpClients() as fields to copy and buttons.
     * @param BxDolTemplate|null $oTemplate the site's or Studio's
     */
    public static function getMcpClientsCode($oTemplate = null)
    {
        if (!$oTemplate)
            $oTemplate = BxDolTemplate::getInstance();

        $aClients = self::getMcpClients();

        $aCommands = [];
        $i = 0;
        foreach ($aClients['commands'] as $sTitle => $sCommand)
            $aCommands[] = [
                'cmd_id' => 'sys-api-mcp-client-' . (++$i),
                'cmd_title' => bx_process_output($sTitle),
                'command' => bx_html_attribute($sCommand),
                'txt_copy' => _t('_sys_api_tokens_btn_copy'),
            ];

        $aLinks = [];
        foreach ($aClients['links'] as $sTitle => $sLink)
            $aLinks[] = [
                'link_href' => bx_html_attribute($sLink),
                'link_label' => bx_process_output(_t('_sys_api_mcp_clients_btn_add_to', $sTitle)),
            ];

        return $oTemplate->parseHtmlByName('api_mcp_clients.html', [
            'txt_title' => _t('_sys_api_mcp_clients_txt_title'),
            'txt_command' => _t('_sys_api_mcp_clients_txt_command'),
            'txt_web' => _t('_sys_api_mcp_clients_txt_web'),
            'bx_repeat:commands' => $aCommands,
            'bx_repeat:links' => $aLinks,
        ]);
    }
}

/** @} */
