<?php

namespace Cidaas\OAuth2\Client\Provider;

/**
 * Defines grant types to be used with {@see Cidaas::getAccessToken()}.
 * @package Cidaas\OAuth2\Client\Provider
 */
interface GrantType {
    /**
     * To be used, if an authorization code from login is given.
     */
    const AuthorizationCode = 'authorization_code';

    /**
     * To be used, if a refresh token is given.
     */
    const RefreshToken = 'refresh_token';

    /**
     * To be used, if client credentials are given.
     */
    const ClientCredentials = 'client_credentials';
}