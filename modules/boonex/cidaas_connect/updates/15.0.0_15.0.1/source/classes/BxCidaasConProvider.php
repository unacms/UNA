<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    CidaasConnect Cidaas Connect
 * @ingroup     UnaModules
 *
 * @{
 */

use Cidaas\OAuth2\Client\Provider\Cidaas;
use Cidaas\OAuth2\Client\Provider\GrantType;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Promise\PromiseInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * Cidaas SDK wrapper that allows PKCE without a client secret.
 * The upstream constructor and token request always require client_secret.
 */
class BxCidaasConProvider extends Cidaas
{
    protected $sBaseUrl;
    protected $sClientId;
    protected $sClientSecret;
    protected $sRedirectUri;
    protected $bDebug;

    public function __construct(string $baseUrl, string $clientId, string $clientSecret, string $redirectUri, ?HandlerStack $handler = null, bool $debug = false)
    {
        $this->sBaseUrl = rtrim($baseUrl, '/');
        $this->sClientId = $clientId;
        $this->sClientSecret = $clientSecret;
        $this->sRedirectUri = $redirectUri;
        $this->bDebug = $debug;

        // Upstream validate() rejects an empty secret; pass a placeholder then clear it.
        parent::__construct($baseUrl, $clientId, $clientSecret !== '' ? $clientSecret : '.', $redirectUri, $handler, $debug);

        if ($clientSecret === '') {
            $oProp = new ReflectionProperty(Cidaas::class, 'clientSecret');
            $oProp->setValue($this, '');
        }
    }

    public function getAccessToken(string $grantType, string $code = '', string $refreshToken = '', bool $pkceEnabled = false): PromiseInterface
    {
        if ($grantType === GrantType::AuthorizationCode) {
            if (empty($code))
                throw new InvalidArgumentException('code must not be empty in authorization_code flow');

            $aParams = [
                'client_id' => $this->sClientId,
                'redirect_uri' => $this->sRedirectUri,
                'grant_type' => 'authorization_code',
                'code' => $code,
            ];

            if ($this->sClientSecret !== '')
                $aParams['client_secret'] = $this->sClientSecret;

            if ($pkceEnabled)
                $aParams['code_verifier'] = $_SESSION['code-verifier'] ?? '';
        }
        else if ($grantType === GrantType::RefreshToken) {
            if (empty($refreshToken))
                throw new InvalidArgumentException('refreshToken must not be empty in refresh_token flow');

            $aParams = [
                'client_id' => $this->sClientId,
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken,
            ];

            if ($this->sClientSecret !== '')
                $aParams['client_secret'] = $this->sClientSecret;
        }
        else if ($grantType === GrantType::ClientCredentials) {
            if ($this->sClientSecret === '')
                throw new InvalidArgumentException('client secret is required for client_credentials flow');

            $aParams = [
                'client_id' => $this->sClientId,
                'client_secret' => $this->sClientSecret,
                'grant_type' => 'client_credentials',
            ];
        }
        else {
            throw new InvalidArgumentException('invalid grant type');
        }

        $oCreateClient = new ReflectionMethod(Cidaas::class, 'createClient');
        $oClient = $oCreateClient->invoke($this);

        $oParseJson = new ReflectionMethod(Cidaas::class, 'parseJson');

        return $oClient->requestAsync('POST', $this->sBaseUrl . '/token-srv/token', ['form_params' => $aParams])->then(function (ResponseInterface $oResponse) use ($oParseJson) {
            return $oParseJson->invoke($this, $oResponse->getBody());
        });
    }
}

/** @} */
