<?php

namespace Cidaas\OAuth2\Client\Provider;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Promise\PromiseInterface;
use GuzzleHttp\RequestOptions;
use Psr\Http\Message\ResponseInterface;
use UnexpectedValueException;

/**
 * Cidaas connector.
 * @package Cidaas\OAuth2\Client\Provider
 */
class Cidaas
{
    private const SESSION_OAUTH_STATE = 'cidaas_oauth_state';
    private const SESSION_CODE_VERIFIER = 'cidaas_code_verifier';
    /** Authorization request params that caller-supplied query parameters must not override. */
    private const LOCKED_AUTH_PARAMS = [
        'client_id',
        'redirect_uri',
        'response_type',
        'state',
        'code_challenge',
        'code_challenge_method',
    ];

    private static string $well_known_uri = "/.well-known/openid-configuration";
    private static string $requestIdUri = '/authz-srv/authrequest/authz/generate';
    private static string $getRegistrationSetupUri = '/registration-setup-srv/public/list';
    private static string $registerSdkUri = '/users-srv/register';
    private static string $loginSdkUri = '/login-srv/login/sdk';
    private static string $changePasswordUri = '/users-srv/changepassword';
    private static string $updateProfileUriPrefix = '/users-srv/user/profile/';
    private static string $initiateResetPasswordUri = '/users-srv/resetpassword/initiate';
    private static string $handleResetPasswordUri = '/users-srv/resetpassword/validatecode';
    private static string $resetPasswordUri = '/users-srv/resetpassword/accept';
    private static string $tokenUri = '/token-srv/token';

    /** @var array<string, mixed> */
    private array $openid_config = [];
    private string $baseUrl = "";
    private string $clientId = "";
    private string $clientSecret = "";
    private string $redirectUri = "";
    private ?HandlerStack $handler = null;
    private bool $debug = false;
    /** @var bool has the init method already been called? */
    private bool $init = false;

    /**
     * Cidaas constructor.
     * @param string $baseUrl of cidaas server
     * @param string $clientId of cidaas application
     * @param string $clientSecret of cidaas application (optional for public/PKCE clients)
     * @param string $redirectUri to redirect to after login
     * @param HandlerStack|null $handler (optional) for http requests
     * @param bool $debug (optional) to enable debugging
     */
    public function __construct(string $baseUrl, string $clientId, string $clientSecret, string $redirectUri, ?HandlerStack $handler = null, bool $debug = false)
    {
        $this->validate($baseUrl, 'Base URL');
        $this->validate($clientId, 'Client-ID');
        // Client secret is optional (public / PKCE clients). Pass '' when unused.
        $this->validate($redirectUri, 'Redirect URL');

        $this->baseUrl = rtrim($baseUrl, "/");
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->redirectUri = $redirectUri;
        if ($handler !== null) {
            $this->handler = $handler;
        }
        $this->debug = $debug;
    }

    /**
     * loads the OpenID config from the server the first time the client is used.
     *
     * @return void
     */
    private function initClient()
    {
        if ($this->init) {
            return;
        }
        $this->openid_config = $this->loadOpenIdConfig();
        $this->init = true;
    }


    /**
     * Retrieve the requestId for a given scope in order to start an oidc interaction.
     * @param string $scope for the requestId
     * @param string $responseType for the response type
     * @param string $acceptLanguage for the language. defaults to "en-GB"
     * @return PromiseInterface promise with the requestId or error
     */
    public function getRequestId(string $scope = 'openid', string $responseType = 'code', string $acceptLanguage = 'en-GB'): PromiseInterface
    {
        $client = $this->createClient();

        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            "response_type" => $responseType,
            "scope" => $scope,
            "nonce" => $this->createSecureNonce()
        ];
        $postBody = $this->encodeJson($params);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json',
                'Accept' => '*/*',
                'accept-language' => $acceptLanguage
            ]
        ];
        $url = $this->baseUrl . self::$requestIdUri;
        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            $parsedBody = $this->parseJson($body);
            if (!isset($parsedBody['data']['requestId'])) {
                throw new UnexpectedValueException('Missing requestId in auth request response');
            }
            return $parsedBody['data']['requestId'];
        });
    }

    /**
     * Retrieves registration data for dynamic implementation of registration page.
     * @param string $requestId for retrieving registration data
     * @param string $locale for registration data
     * @return PromiseInterface promise with registration data or error
     */
    public function getRegistrationSetup(string $requestId, string $locale): PromiseInterface
    {
        $client = $this->createClient();

        $url = $this->baseUrl . self::$getRegistrationSetupUri;
        $params = [
            'requestId' => $requestId,
            'acceptlanguage' => $locale
        ];
        $options = [
            RequestOptions::QUERY => $params
        ];

        $responsePromise = $client->getAsync($url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Register new user.
     * @param array $registrationFields containing user data according to {@see getRegistrationSetup()}
     * @param string $requestId for user registration
     * @param string $acceptLanguage for the language. defaults to "en-GB"
     * @return PromiseInterface promise with user data or error
     */
    public function register(array $registrationFields, string $requestId, string $acceptLanguage = 'en-GB'): PromiseInterface
    {
        $client = $this->createClient();

        $url = $this->baseUrl . self::$registerSdkUri;
        if (!isset($registrationFields['provider'])) {
            $registrationFields['provider'] = 'self';
        }
        $postBody = $this->encodeJson($registrationFields);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json',
                'requestId' => $requestId,
                'accept-language' => $acceptLanguage
            ],
        ];

        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Performs a login with the given credentials.
     * @param string $username for login
     * @param string $username_type of $username
     * @param string $password for login
     * @param string $requestId for login request
     * @return PromiseInterface promise with code or error
     */
    public function loginWithCredentials(string $username, string $username_type, string $password, string $requestId): PromiseInterface
    {
        $client = $this->createClient();
        $url = $this->baseUrl . self::$loginSdkUri;
        $params = [
            'username' => $username,
            'password' => $password,
            'username_type' => $username_type,
            'requestId' => $requestId
        ];
        $postBody = $this->encodeJson($params);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json'
            ]
        ];

        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Performs a redirect to the hosted login page.
     * @param string $scope for login
     * @param array $queryParameters (optional) additional query parameters; cannot override client_id, redirect_uri, response_type, state or PKCE params
     * @param bool $pkceEnabled enable PKCE (S256); stores code_verifier in the PHP session
     */
    public function loginWithBrowser(string $scope = 'openid profile offline_access', array $queryParameters = array(), bool $pkceEnabled = false)
    {
        $this->createClient();
        $params = [
            'client_id' => $this->clientId,
            'response_type' => 'code',
            'scope' => $scope,
            'redirect_uri' => $this->redirectUri,
            'nonce' => $this->createSecureNonce(),
            'state' => $this->createAndStoreOAuthState(),
            'view_type' => 'login',
        ];

        if ($pkceEnabled) {
            $params = array_merge($params, $this->createAndStorePkceParams());
        } else {
            unset($_SESSION[self::SESSION_CODE_VERIFIER]);
        }

        $params = $this->mergeAuthQueryParams($params, $queryParameters);
        $loginUrl = $this->openid_config['authorization_endpoint'] . '?' . http_build_query($params);
        header('Location: ' . $loginUrl);
    }

    /**
     * Performs a redirect to the hosted registration page.
     * @param string $scope for registration
     * @param array $queryParameters (optional) additional query parameters; cannot override client_id, redirect_uri, response_type, state or PKCE params
     * @param bool $pkceEnabled enable PKCE (S256); stores code_verifier in the PHP session
     */
    public function registerWithBrowser(string $scope = 'openid profile offline_access', array $queryParameters = array(), bool $pkceEnabled = false)
    {
        $this->createClient();
        $params = [
            'client_id' => $this->clientId,
            'response_type' => 'code',
            'scope' => $scope,
            'redirect_uri' => $this->redirectUri,
            'nonce' => $this->createSecureNonce(),
            'state' => $this->createAndStoreOAuthState(),
            'view_type' => 'register',
        ];

        if ($pkceEnabled) {
            $params = array_merge($params, $this->createAndStorePkceParams());
        } else {
            unset($_SESSION[self::SESSION_CODE_VERIFIER]);
        }

        $params = $this->mergeAuthQueryParams($params, $queryParameters);
        $registerUrl = $this->openid_config['authorization_endpoint'] . '?' . http_build_query($params);
        header('Location: ' . $registerUrl);
    }

    /**
     * Returns query parameters from the callback request and validates the OAuth `state`
     * parameter against the value stored by loginWithBrowser / registerWithBrowser.
     *
     * A callback carrying a `code` without a stored state is rejected (login CSRF protection).
     * Pass $requireState = false only if the authorization request was built outside this SDK.
     * Error callbacks (`error`, `error_description`) are returned as-is for the caller to handle.
     *
     * @param bool $requireState reject a `code` callback when no state was stored in the session
     * @return array with $_GET
     * @throws UnexpectedValueException if state is missing or does not match
     */
    public function loginCallback(bool $requireState = true): array
    {
        $this->ensureSession();
        $params = $_GET;

        if (isset($_SESSION[self::SESSION_OAUTH_STATE])) {
            $expectedState = (string)$_SESSION[self::SESSION_OAUTH_STATE];
            unset($_SESSION[self::SESSION_OAUTH_STATE]);
            if (!isset($params['state']) || !hash_equals($expectedState, (string)$params['state'])) {
                throw new UnexpectedValueException('Invalid or missing OAuth state');
            }
        } else if ($requireState && isset($params['code'])) {
            throw new UnexpectedValueException('No OAuth state stored in session; start the flow with loginWithBrowser/registerWithBrowser');
        }

        return $params;
    }

    /**
     * Change a password of a given identity.
     *
     * @param string $oldPassword of the identity
     * @param string $newPassword of the identity
     * @param string $confirmPassword to match with newPassword above
     * @param string $identityId to identify user
     * @param string $accessToken for access to password change api
     * @return PromiseInterface with promise containing success or error message
     */
    public function changePassword(string $oldPassword, string $newPassword, string $confirmPassword, string $identityId, string $accessToken)
    {
        $client = $this->createClient();

        $params = [
            'old_password' => $oldPassword,
            'new_password' => $newPassword,
            'confirm_password' => $confirmPassword,
            'identityId' => $identityId
        ];
        $postBody = $this->encodeJson($params);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $accessToken
            ]
        ];
        $url = $this->baseUrl . self::$changePasswordUri;

        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Retrieve access token for api access.
     * @param string $grantType for accessToken {@see GrantType}
     * @param string $code only required for {@see GrantType::$AuthorizationCode}
     * @param string $refreshToken only required for {@see GrantType::$RefreshToken}
     * @return PromiseInterface promise with access token or error
     */
    public function getAccessToken(string $grantType, string $code = '', string $refreshToken = '', bool $pkceEnabled = false): PromiseInterface
    {
        if ($grantType === GrantType::AuthorizationCode) {
            if (empty($code)) {
                throw new \InvalidArgumentException('code must not be empty in authorization_code flow');
            }

            $params = [
                'client_id' => $this->clientId,
                'redirect_uri' => $this->redirectUri,
                'grant_type' => 'authorization_code',
                'code' => $code,
            ];
            $this->appendClientSecretIfPresent($params);

            // A verifier stored by loginWithBrowser/registerWithBrowser is always sent;
            // $pkceEnabled additionally makes it mandatory.
            $codeVerifier = $this->consumeCodeVerifier($pkceEnabled);
            if ($codeVerifier !== null) {
                $params['code_verifier'] = $codeVerifier;
            }
        } else if ($grantType === GrantType::RefreshToken) {
            if (empty($refreshToken)) {
                throw new \InvalidArgumentException('refreshToken must not be empty in refresh_token flow');
            }
            $params = [
                'client_id' => $this->clientId,
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken,
            ];
            $this->appendClientSecretIfPresent($params);
        } else if ($grantType === GrantType::ClientCredentials) {
            if ($this->clientSecret === '') {
                throw new \InvalidArgumentException('client secret is required for client_credentials flow');
            }
            $params = [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'grant_type' => 'client_credentials',
            ];
        } else {
            throw new \InvalidArgumentException('invalid grant type');
        }

        $client = $this->createClient();
        $url = $this->baseUrl . self::$tokenUri;
        $responsePromise = $client->requestAsync('POST', $url, ['form_params' => $params]);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Retrieve user profile of current user or a given sub.
     * @param string $accessToken to access api
     * @param string $sub (optional) for user profile to retrieve
     * @return PromiseInterface promise with user profile or error
     */
    public function getUserProfile(string $accessToken, string $sub = ""): PromiseInterface
    {
        $client = $this->createClient();
        $url = $this->openid_config["userinfo_endpoint"];
        if (!empty($sub)) {
            $url .= "/" . rawurlencode($sub);
        }

        $responsePromise = $client->requestAsync('POST', $url, [
            "headers" => [
                "Authorization" => "Bearer " . $accessToken,
                'Content-Type' => 'application/json',
            ],
        ]);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Start a password reset process.
     * @param string $email address for password reset
     * @param string $requestId for api access
     * @return PromiseInterface promise with resetRequestId or error
     */
    public function initiateResetPassword(string $email, string $requestId): PromiseInterface
    {
        // TODO andere Medien statt email?
        $client = $this->createClient();

        $params = [
            'email' => $email,
            'processingType' => 'CODE',
            'resetMedium' => 'email',
            'requestId' => $requestId
        ];
        $postBody = $this->encodeJson($params);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json'
            ]
        ];
        $url = $this->baseUrl . self::$initiateResetPasswordUri;

        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Verify code sent during {@see self::initiateResetPassword()}.
     * @param string $code sent by password reset method
     * @param string $resetRequestId retrieved from {@see self::initiateResetPassword()}
     * @return PromiseInterface promise with exchangeId and resetRequestId or error
     */
    public function handleResetPassword(string $code, string $resetRequestId, $version = "v2"): PromiseInterface
    {
        $url = $this->baseUrl . self::$handleResetPasswordUri;
        if ($version == "v3") {
            $url = $this->baseUrl . "/password-srv/resetpassword?action=validatecode";
        }

        $client = $this->createClient();

        $params = [
            'code' => $code,
            'resetRequestId' => $resetRequestId
        ];
        $postBody = $this->encodeJson($params);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json'
            ]
        ];

        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Perform password reset.
     * @param string $password to set
     * @param string $confirmPassword to confirm $password
     * @param string $exchangeId from {@see self::handleResetPassword()}
     * @param string $resetRequestId from {@see self::handleResetPassword()}
     * @return PromiseInterface promise with success or error message
     */
    public function resetPassword(string $password, string $confirmPassword, string $exchangeId, string $resetRequestId, $version = "v2"): PromiseInterface
    {
        $url = $this->baseUrl . self::$resetPasswordUri;
        if ($version == "v3") {
            $url = $this->baseUrl . "/password-srv/resetpassword?action=acceptreset";
        }
        $client = $this->createClient();
        $params = [
            'password' => $password,
            'confirmPassword' => $confirmPassword,
            'exchangeId' => $exchangeId,
            'resetRequestId' => $resetRequestId
        ];
        $postBody = $this->encodeJson($params);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json'
            ]
        ];
        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Update user profile.
     * @param string $sub of profile to be updated
     * @param array $fields to update
     * @param string $accessToken for api access
     * @param string $provider of identity profile
     * @return PromiseInterface promise with success or error message
     */
    public function updateProfile(string $sub, array $fields, string $accessToken, string $provider = 'self'): PromiseInterface
    {
        $client = $this->createClient();

        $fields['provider'] = $provider;
        $postBody = $this->encodeJson($fields);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $accessToken
            ]
        ];
        $url = $this->baseUrl . self::$updateProfileUriPrefix . rawurlencode($sub);

        $responsePromise = $client->requestAsync('PUT', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Validates a given access token.
     * @param string $accessTokenToValidate to validate
     * @param string $accessTokenForApiAccess to access api
     * @return PromiseInterface with success or error message
     */
    public function validateAccessToken(string $accessTokenToValidate, $accessTokenForApiAccess = ""): PromiseInterface
    {
        $client = $this->createClient();

        $params = [
            'token_type_hint' => 'access_token',
            'token' => $accessTokenToValidate
        ];
        $postBody = $this->encodeJson($params);
        $headers = ['Content-Type' => 'application/json'];
        if (empty($accessTokenForApiAccess)) {
            if ($this->clientSecret === '') {
                throw new \InvalidArgumentException('client secret or accessTokenForApiAccess is required to introspect tokens');
            }
            $headers['Authorization'] = 'Basic ' . base64_encode($this->clientId . ":" . $this->clientSecret);
        } else {
            $headers['Authorization'] = 'Bearer ' . $accessTokenForApiAccess;
        }
        $options = [
            RequestOptions::HEADERS => $headers,
            RequestOptions::BODY => $postBody
        ];
        $url = $this->openid_config["introspection_endpoint"];

        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Perform logout at server. Please note, that this method does not perform a redirect to logout page, but returns the response, if logout is completed.
     * @param string $accessToken for api access
     * @param string $postLogoutUri (optional) to redirect to after logout
     * @return PromiseInterface promise with success (redirect) or error message
     */
    public function logout(string $accessToken, string $postLogoutUri = ""): PromiseInterface
    {
        $client = $this->createClient();
        $url = $this->openid_config["end_session_endpoint"];
        $params = [
            'access_token_hint' => $accessToken,
        ];
        if (!empty($postLogoutUri)) {
            $params['post_logout_redirect_uri'] = $postLogoutUri;
        }

        // Send token in the POST body to avoid leaking it via URL/query logs and Referer headers.
        // JSON, not form-encoded: end_session binds the body via json tags only.
        return $client->requestAsync('POST', $url, [
            RequestOptions::BODY => $this->encodeJson($params),
            RequestOptions::HEADERS => ['Content-Type' => 'application/json'],
            'allow_redirects' => false,
        ]);
    }

    /**
     * Performs a redirect to the login page of the social provider
     * @param string $provider_name name of the social provider. e.g: google
     * @param string $request_id the request_id of the oidc session. once can generate a request_id by calling the function getRequestId
     * @param array $queryParameters (optional) optionally adds more query parameters to the url.
     */
    public function loginWithSocial(string $provider_name, string $request_id, array $queryParameters = array())
    {
        $url = $this->baseUrl . "/login-srv/social/login/"
            . rawurlencode(strtolower($provider_name)) . "/"
            . rawurlencode($request_id);
        if ($queryParameters !== []) {
            $url .= '?' . http_build_query($queryParameters);
        }
        header('Location: ' . $url);
    }

    /**
     * Performs a redirect to the register page of the social provider
     * @param string $provider_name name of the social provider. e.g: google
     * @param string $request_id the request_id of the oidc session. once can generate a request_id by calling the function getRequestId
     * @param array $queryParameters (optional) optionally adds more query parameters to the url.
     */
    public function registerWithSocial($provider_name, $request_id, array $queryParameters = array())
    {
        $url = $this->baseUrl . "/login-srv/social/register/"
            . rawurlencode(strtolower((string)$provider_name)) . "/"
            . rawurlencode((string)$request_id);
        if ($queryParameters !== []) {
            $url .= '?' . http_build_query($queryParameters);
        }
        header('Location: ' . $url);
    }

    /**
     * Initiates multi factor authentication.
     * No type allowlist (any type string is accepted, matching previous SDK behaviour).
     * @param string $type MFA type, e.g. email, sms, totp, push
     * @param array $params an associate array with the params that api accepts as request body
     */
    public function initiateMFA($type, $params)
    {
        $normalizedType = strtolower((string)$type);
        $url = $this->baseUrl . "/verification-srv/v2/authenticate/initiate/" . rawurlencode($normalizedType);
        return $this->makeRequest($params, $url);
    }

    /**
     * @deprecated Use {@see self::initiateMFA()} instead. Kept for backward compatibility (typo in original name).
     */
    public function intiateMFA($type, $params)
    {
        return $this->initiateMFA($type, $params);
    }

    /**
     * Validates multi factor authentication.
     * @param string $exchange_id the exchange_id received in the response body while initiating mfa
     * @param string $sub the sub received in the response body while initiating mfa
     * @param string $pass_code the verification code recieved to the prefered mfa type
     * @param string $type MFA type (validated against documented allowlist)
     */
    public function authenticateMFA(string $exchange_id, string $sub, string $pass_code, string $type)
    {
        $normalizedType = $this->assertMfaType($type);
        $url = $this->baseUrl . "/verification-srv/v2/authenticate/authenticate/" . rawurlencode($normalizedType);
        $params = [
            'exchange_id' => $exchange_id,
            'sub' => $sub,
            'type' => strtoupper($normalizedType),
            'pass_code' => $pass_code
        ];
        return $this->makeRequest($params, $url);
    }

    /**
     * Initiates account verification
     * @param array $params an associate array with the params that api accepts as request body
     */
    public function initiateAccountVerification($params, $version = "v2")
    {
        $url = $this->baseUrl . "/verification-srv/account/initiate";
        if ($version == "v3") {
            $url = $url . "/sdk";
        }
        return $this->makeRequest($params, $url);
    }

    /**
     * Verify account
     * @param string $accvid accvid recieved when initiating the account verification
     * @param string $code code received to the users account to verify after registration
     */
    public function verifyAccount(string $accvid, string $code)
    {
        $url = $this->baseUrl . "/verification-srv/account/verify";
        $params = [
            'accvid' => $accvid,
            'code' => $code
        ];
        return $this->makeRequest($params, $url);
    }

    /**
     * Initiates progressive registration for missing required registration fields after an account is created in cidaas system
     * @param string $requestId the request_id of the oidc session. once can generate a request_id by calling the function getRequestId
     * @param string $trackId the track_id recieved of the oidc session
     * @param array $params an associate array with the params that api accepts as request body
     * @param string $acceptLanguage the locale
     */
    public function progressiveRegistration($requestId, $trackId, $params, $acceptLanguage = 'en-US')
    {
        $url = $this->baseUrl . "/login-srv/progressive/update/user";
        $headers = [
            'Content-type' => 'application/json',
            'requestId' => $requestId,
            'trackId' => $trackId,
            'acceptlanguage' => $acceptLanguage
        ];
        return $this->makeRequest($params, $url, $headers);
    }

    /**
     * Provides the details of an consent
     * @param string $consent_id the id of the consent
     * @param string $consent_version_id the version of the consent
     * @param string $sub the sub
     */
    public function getConsentDetails($consent_id, $consent_version_id, $sub)
    {
        $url = $this->baseUrl . "/consent-management-srv/v2/consent/usage/public/info";
        $params = [
            'consent_id' => $consent_id,
            'consent_version_id' => $consent_version_id,
            'sub' => $sub
        ];
        return $this->makeRequest($params, $url);
    }

    /**
     * To accept a consent
     * @param array $params an associate array with the params that api accepts as request body
     */
    public function acceptConsent($params)
    {
        $url = $this->baseUrl . "/consent-management-srv/v2/consent/usage/accept";
        return $this->makeRequest($params, $url);
    }

    /**
     * Get the list of the mfa configured for an user. One of email,mobile_number,username or sub must be provided
     * @param string $request_id the request_id of the oidc session. once can generate a request_id by calling the function getRequestId
     * @param string $email (optional) the email of the user
     * @param string $mobile_number (optional) the mobile number of the user
     * @param string $username (optional) the username of the user
     * @param string $sub (optional) the uniqe identified of the user
     */
    public function getMFAList(string $request_id, string $email = '', string $mobile_number = '', string $username = '', string $sub = '')
    {
        $url = $this->baseUrl . "/verification-srv/v2/setup/public/configured/list";
        $params = [
            'request_id' => $request_id,
            'sub' => $sub,
            'email' => $email,
            'mobile_number' => $mobile_number,
            'username' => $username
        ];
        return $this->makeRequest($params, $url);
    }

    /**
     * Perform login without password. E.g: totp, backupcode
     * @param string $request_id the request_id of the oidc session. once can generate a request_id by calling the function getRequestId
     * @param string $email the email of the user
     * @param string $medium_id the medium id of the preferred type. E.g: for type totp the medium id is "TOTP"
     * @param string $type the preferred type of passwordless login. E.g: email, totp, push etc.
     */
    public function initiatePasswordlessLogin(string $request_id, string $type, string $email, string $medium_id)
    {
        $allowed_types = ["email", "totp", "push", "backup_code", "password"];
        $normalizedType = strtolower($type);
        if (!in_array($normalizedType, $allowed_types, true)) {
            throw new \InvalidArgumentException('invalid type');
        }
        $url = $this->baseUrl . "/verification-srv/v2/authenticate/initiate/" . $normalizedType;
        $params = [
            'usage_type' => "PASSWORDLESS_AUTHENTICATION",
            'request_id' => $request_id,
            'type' => $normalizedType,
            'email' => $email,
            'medium_id' => $medium_id
        ];
        return $this->makeRequest($params, $url);
    }

    /**
     * Perform login without password. E.g: totp, backupcode
     * @param string $requestId the request_id of the oidc session. once can generate a request_id by calling the function getRequestId
     * @param string $pass_code the verification code to validate the login flow
     * @param string $exchange_id the exchage id receieved in the response payload when password login was initiated
     * @param string $type the preferred type of passwordless login. E.g: email, totp, push etc.
     */
    public function verifyPasswordlessLogin(string $type, string $exchange_id, string $pass_code, string $requestId)
    {
        $allowed_types = ["email", "totp", "push", "backup_code", "password"];
        $normalizedType = strtolower($type);
        if (!in_array($normalizedType, $allowed_types, true)) {
            throw new \InvalidArgumentException('invalid type');
        }
        $url = $this->baseUrl . "/verification-srv/v2/authenticate/authenticate/" . $normalizedType;
        $params = [
            'exchange_id' => $exchange_id,
            'pass_code' => $pass_code,
            'type' => $normalizedType,
            'requestId' => $requestId,
        ];
        return $this->makeRequest($params, $url);
    }

    private function createClient(): Client
    {
        $this->initClient();
        return $this->__createClient();
    }

    private function __createClient(): Client
    {
        if ($this->handler !== null) {
            return new Client(['handler' => $this->handler, 'debug' => $this->debug]);
        }
        return new Client(['debug' => $this->debug]);
    }

    private function parseJson($content): array
    {
        $content = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new UnexpectedValueException(sprintf("Failed to parse JSON response: %s", json_last_error_msg()));
        }
        if (!is_array($content)) {
            throw new UnexpectedValueException(sprintf("Expected JSON object or array in response, got %s", gettype($content)));
        }

        return $content;
    }

    /**
     * @param array<mixed> $data
     */
    private function encodeJson(array $data): string
    {
        $encoded = json_encode($data, JSON_UNESCAPED_SLASHES);
        if ($encoded === false) {
            throw new UnexpectedValueException(sprintf('Failed to encode JSON request body: %s', json_last_error_msg()));
        }
        return $encoded;
    }

    private function validate($param, $name)
    {
        if (empty($param)) {
            throw new \InvalidArgumentException($name . ' is not specified');
        }
    }

    private function loadOpenIdConfig(): array
    {
        $openid_configuration_url = $this->baseUrl . self::$well_known_uri;
        $client = $this->__createClient();
        return $client->getAsync($openid_configuration_url)->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        })->wait();
    }

    private function makeRequest($params, $url, $headers = ['Content-Type' => 'application/json'])
    {
        $client = $this->createClient();
        $postBody = $this->encodeJson($params);
        $options = [
            RequestOptions::BODY => $postBody,
            RequestOptions::HEADERS => $headers
        ];
        $responsePromise = $client->requestAsync('POST', $url, $options);
        return $responsePromise->then(function (ResponseInterface $response) {
            $body = $response->getBody();
            return $this->parseJson($body);
        });
    }

    /**
     * Starts the PHP session that holds OAuth state and PKCE verifier between redirect and callback.
     *
     * @throws \LogicException in web requests where no session can be started; an in-memory
     *                         fallback there would silently drop state/verifier after the redirect
     */
    private function ensureSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            session_start();
            return;
        }
        if (PHP_SAPI !== 'cli') {
            throw new \LogicException(session_status() === PHP_SESSION_DISABLED
                ? 'PHP sessions are disabled; they are required to store OAuth state and PKCE verifier'
                : 'Cannot start PHP session because headers were already sent; call the SDK before any output');
        }
        // CLI (e.g. PHPUnit): keep an in-memory $_SESSION for this process.
        if (!isset($_SESSION) || !is_array($_SESSION)) {
            $_SESSION = [];
        }
    }

    private function createSecureNonce(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function createAndStoreOAuthState(): string
    {
        $this->ensureSession();
        $state = bin2hex(random_bytes(16));
        $_SESSION[self::SESSION_OAUTH_STATE] = $state;
        return $state;
    }

    /**
     * @return array{code_challenge: string, code_challenge_method: string}
     */
    private function createAndStorePkceParams(): array
    {
        $this->ensureSession();
        $codeVerifier = bin2hex(random_bytes(64));
        $_SESSION[self::SESSION_CODE_VERIFIER] = $codeVerifier;
        $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
        return [
            'code_challenge' => $codeChallenge,
            'code_challenge_method' => 'S256',
        ];
    }

    /**
     * Returns the stored PKCE code_verifier and removes it from the session.
     *
     * @param bool $required throw if no verifier is stored
     * @throws \InvalidArgumentException if $required and no verifier is stored
     */
    private function consumeCodeVerifier(bool $required): ?string
    {
        if ($required) {
            $this->ensureSession();
        } elseif (session_status() === PHP_SESSION_NONE && !headers_sent() && isset($_COOKIE[session_name()])) {
            // Resume an existing session so a stored verifier is found, without failing when none is possible.
            session_start();
        }
        $codeVerifier = $_SESSION[self::SESSION_CODE_VERIFIER] ?? null;
        if (empty($codeVerifier)) {
            if ($required) {
                throw new \InvalidArgumentException('PKCE code_verifier missing from session; call loginWithBrowser/registerWithBrowser with pkceEnabled first');
            }
            return null;
        }
        unset($_SESSION[self::SESSION_CODE_VERIFIER]);
        return (string)$codeVerifier;
    }

    /**
     * Merges caller query parameters into the authorization request. Protocol-critical params
     * (LOCKED_AUTH_PARAMS) always keep the SDK value; others such as nonce, scope or view_type
     * may be overridden by the caller.
     *
     * @param array<string, mixed> $sdkParams
     * @param array<string, mixed> $queryParameters
     * @return array<string, mixed>
     */
    private function mergeAuthQueryParams(array $sdkParams, array $queryParameters): array
    {
        $locked = array_intersect_key($sdkParams, array_flip(self::LOCKED_AUTH_PARAMS));
        return array_merge($sdkParams, $queryParameters, $locked);
    }

    /**
     * Normalize and validate MFA types for authenticateMFA.
     */
    private function assertMfaType(string $type): string
    {
        $normalizedType = strtolower(trim($type));
        $allowedTypes = [
            'email',
            'sms',
            'ivr',
            'backupcode',
            'security_question',
            'totp',
            'pattern',
            'push',
            'face',
            'touchid',
            'fido2',
            'password',
        ];
        if (!in_array($normalizedType, $allowedTypes, true)) {
            throw new \InvalidArgumentException('invalid mfa type');
        }
        return $normalizedType;
    }

    /**
     * @param array<string, mixed> $params
     */
    private function appendClientSecretIfPresent(array &$params): void
    {
        if ($this->clientSecret !== '') {
            $params['client_secret'] = $this->clientSecret;
        }
    }
}
