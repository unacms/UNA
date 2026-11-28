<?php

namespace Cidaas\OAuth2\Client\Provider;

use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use Cidaas\OAuth2\Client\Provider\Cidaas;
use Dotenv\Dotenv;
use GuzzleHttp\Handler\MockHandler;

function header($header) {
    array_push(AbstractCidaasTestParent::$headers, $header);
}

abstract class AbstractCidaasTestParent extends TestCase {
    protected static $REQUEST_ID = '758d173b-89fb-4d37-84b4-e52a0ce63a78';
    protected static $CODE = '8c306345-f67f-4535-8388-e609df78a190';
    protected static $SUB = 'df838cf7-dc95-44de-a1cc-5c0eafb0f6db';
    protected static $ACCESS_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MTVmNzk5LWYzZmMtNDM0ZS04NDEyLWUxYWJjMzdhZWZlOSJ9.eyJhbXIiOlsiMiJdLCJ1YV9oYXNoIjoiZDViNWI4NDJiOGUxOTM4YzIzNDJmMGY5ZTdjMzI0ZWEiLCJzaWQiOiJiNWJkY2ZkMS00MzU3LTRiNTQtOGIxMS1iZDZiYzhhNmY3ZGEiLCJzdWIiOiJkZjgzOGNmNy1kYzk1LTQ0ZGUtYTFjYy01YzBlYWZiMGY2ZGIiLCJpc3ViIjoiM2Y5NTU1ZjktYWMwMy00ZDMzLTljZGItNDMyZTFiY2UxNDBmIiwiYXVkIjoiN2Q1YWJkYmMtODE4Ni00YzgyLTk5NDMtZjcxNTA2YWFmNzAwIiwiaWF0IjoxNjAzMzU3MDA2LCJhdXRoX3RpbWUiOjE2MDMzNTcwMDUsImlzcyI6Imh0dHBzOi8vbmlnaHRseWJ1aWxkLmNpZGFhcy5kZSIsImp0aSI6ImY1ZTNlOTc4LWM2OTUtNGE2MC1iMWEwLTU0MmIyYWRiYjhmMSIsIm5vbmNlIjoiMTYwMzM1NzAwMSIsInNjb3BlcyI6WyJvcGVuaWQiLCJvZmZsaW5lX2FjY2VzcyJdLCJyb2xlcyI6WyJVU0VSIl0sImdyb3VwcyI6W3siZ3JvdXBJZCI6IkNJREFBU19BRE1JTlMiLCJyb2xlcyI6WyJTRUNPTkRBUllfQURNSU4iXX1dLCJleHAiOjE2MDM0NDM0MDZ9.qicaxBYHkLNjoHTUTWxwaNyv96377-lB_NQ-fXwxSSTrk1RnJkBpyfd4TKd2L5DNwO4xaNc_8NjAUZsiPPrEpr2s5QGWai_-DdLkvpxAY0fVy0WBUxzlLUURfboBdnBfl40jsx6wPXy4lbGcBr-famG3p30UbXQse3517tC5ebo';
    protected static $REFRESH_TOKEN = '892149d7-17c9-4b63-a3e7-aa8999f96a96';

    protected static function getRequestIdResponse() {
        return '{"success": true, "status": 200, "data": {"groupname": "default", "lang": "", "view_type": "login", "requestId": "' . self::$REQUEST_ID . '"}}';
    }

    protected static function loginSuccessfulResponse() {
        return '{"success":true,"status":200,"data":{"code":"' . self::$CODE . '","viewtype":"login","grant_type":"login"}}';
    }

    protected static function getAccessTokenSuccessfulResponse() {
        return '{"token_type":"Bearer","sub":"' . self::$SUB . '","expires_in":86400,"id_token_expires_in":86400,"access_token":"' . self::$ACCESS_TOKEN . '","id_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MTVmNzk5LWYzZmMtNDM0ZS04NDEyLWUxYWJjMzdhZWZlOSJ9.eyJhbXIiOlsiMiJdLCJ1YV9oYXNoIjoiZDViNWI4NDJiOGUxOTM4YzIzNDJmMGY5ZTdjMzI0ZWEiLCJzaWQiOiJiNWJkY2ZkMS00MzU3LTRiNTQtOGIxMS1iZDZiYzhhNmY3ZGEiLCJzdWIiOiJkZjgzOGNmNy1kYzk1LTQ0ZGUtYTFjYy01YzBlYWZiMGY2ZGIiLCJpc3ViIjoiM2Y5NTU1ZjktYWMwMy00ZDMzLTljZGItNDMyZTFiY2UxNDBmIiwiYXVkIjoiN2Q1YWJkYmMtODE4Ni00YzgyLTk5NDMtZjcxNTA2YWFmNzAwIiwiaWF0IjoxNjAzMzU3MDA2LCJhdXRoX3RpbWUiOjE2MDMzNTcwMDUsImlzcyI6Imh0dHBzOi8vbmlnaHRseWJ1aWxkLmNpZGFhcy5kZSIsImp0aSI6ImY1ZTNlOTc4LWM2OTUtNGE2MC1iMWEwLTU0MmIyYWRiYjhmMSIsIm5vbmNlIjoiMTYwMzM1NzAwMSIsInNjb3BlcyI6WyJvcGVuaWQiLCJvZmZsaW5lX2FjY2VzcyJdLCJyb2xlcyI6WyJVU0VSIl0sImdyb3VwcyI6W3siZ3JvdXBJZCI6IkNJREFBU19BRE1JTlMiLCJyb2xlcyI6WyJTRUNPTkRBUllfQURNSU4iXX1dLCJleHAiOjE2MDM0NDM0MDYsImF0X2hhc2giOiIwOHdwZlVfYXFmSVF3ME9XUHhkSlFBIiwiY19oYXNoIjoiSUJvUTJDTW1hMHh6MkJ0RTRnWXR3dyIsImVtYWlsIjoiam9lcmcua25vYmxvY2hAd2lkYXMuZGUifQ.QfAMz80vkzQt3DdJqOJNPY14D1tGspjQrT5XjECyjKJrrO52QC6KAkxx1dLkQE5ZfGIkDGG0dxstsB6JH3eS02KRxTAVlr6K5yoRNVsUgFGKYdn9cbqaFhY9mrkbvcTP_Kbwi4dA4eq_j8NvyB4AeF5lT6TyyuEJyhZchFfo1B4","refresh_token":"' . self::$REFRESH_TOKEN . '","identity_id":"3f9555f9-ac03-4d33-9cdb-432e1bce140f"}';
    }

    protected $provider;
    protected $mock;
    public static $headers = [];

    /**
     * Common setup method for Cidaas-Tests.
     * @param bool $integrationTest {@code true} for integration testing, {@code false} for unit testing
     * @param bool $debug {@code true} to enable debugging, {@code false} to disable debugging
     */
    protected function setUpCidaas($integrationTest = false, $debug = false): void {
        Dotenv::createImmutable(__DIR__, 'testconfig.env')->load();
        self::$headers = [];
        // OAuth state / PKCE verifier live in the process-wide $_SESSION; isolate each test.
        unset($_SESSION['cidaas_oauth_state'], $_SESSION['cidaas_code_verifier']);

        $this->mock = new MockHandler([
            new Response(200, [], '{"issuer":"https://nightlybuild.cidaas.de","userinfo_endpoint":"https://nightlybuild.cidaas.de/users-srv/userinfo","authorization_endpoint":"https://nightlybuild.cidaas.de/authz-srv/authz","introspection_endpoint":"https://nightlybuild.cidaas.de/token-srv/introspect","introspection_async_update_endpoint":"https://nightlybuild.cidaas.de/token-srv/introspect/async/tokenusage","revocation_endpoint":"https://nightlybuild.cidaas.de/token-srv/revoke","token_endpoint":"https://nightlybuild.cidaas.de/token-srv/token","jwks_uri":"https://nightlybuild.cidaas.de/.well-known/jwks.json","check_session_iframe":"https://nightlybuild.cidaas.de/session/check_session","end_session_endpoint":"https://nightlybuild.cidaas.de/session/end_session","social_provider_token_resolver_endpoint":"https://nightlybuild.cidaas.de/login-srv/social/token","device_authorization_endpoint":"https://nightlybuild.cidaas.de/authz-srv/device/authz","subject_types_supported":["public"],"scopes_supported":["openid","profile","email","phone","address","offline_access","identities","roles","groups"],"response_types_supported":["code","token","id_token","code token","code id_token","token id_token","code token id_token"],"response_modes_supported":["query","fragment","form_post"],"grant_types_supported":["implicit","authorization_code","refresh_token","password","client_credentials"],"id_token_signing_alg_values_supported":["HS256","RS256"],"id_token_encryption_alg_values_supported":["RS256"],"id_token_encryption_enc_values_supported":["A128CBC-HS256"],"userinfo_signing_alg_values_supported":["HS256","RS256"],"userinfo_encryption_alg_values_supported":["RS256"],"userinfo_encryption_enc_values_supported":["A128CBC-HS256"],"request_object_signing_alg_values_supported":["HS256","RS256"],"request_object_encryption_alg_values_supported":["RS256"],"request_object_encryption_enc_values_supported":["A128CBC-HS256"],"token_endpoint_auth_methods_supported":["client_secret_basic","client_secret_post","client_secret_jwt","private_key_jwt"],"token_endpoint_auth_signing_alg_values_supported":["HS256","RS256"],"claims_supported":["aud","auth_time","created_at","email","email_verified","exp","family_name","given_name","iat","identities","iss","mobile_number","name","nickname","phone_number","picture","sub"],"claims_parameter_supported":false,"claim_types_supported":["normal"],"service_documentation":"https://docs.cidaas.de/","claims_locales_supported":["en-US"],"ui_locales_supported":["en-US","de-DE"],"display_values_supported":["page","popup"],"code_challenge_methods_supported":["plain","S256"],"request_parameter_supported":true,"request_uri_parameter_supported":true,"require_request_uri_registration":false,"op_policy_uri":"https://www.cidaas.com/privacy-policy/","op_tos_uri":"https://www.cidaas.com/terms-of-use/","scim_endpoint":"https://nightlybuild.cidaas.de/users-srv/scim/v2"}'),
            new Response(200, [], self::getRequestIdResponse())]);

        if ($integrationTest) {
            // Real credentials belong in the gitignored integration-testconfig.local.env
            // (copy from testconfig.env.example); the committed file only holds placeholders.
            $integrationConfig = file_exists(__DIR__ . '/integration-testconfig.local.env')
                ? 'integration-testconfig.local.env'
                : 'integration-testconfig.env';
            echo "Integration testing active. Please make sure credentials at " . $integrationConfig . " are correct and proxy is running at " . $_ENV['CIDAAS_BASE_URL_WITH_PROXY'];
            Dotenv::createMutable(__DIR__, $integrationConfig)->load();

            $this->provider = new Cidaas($_ENV['CIDAAS_BASE_URL_WITH_PROXY'], $_ENV['CIDAAS_CLIENT_ID'], $_ENV['CIDAAS_CLIENT_SECRET'], $_ENV['CIDAAS_REDIRECT_URI'], null, $debug);
        } else {
            $this->provider = new Cidaas($_ENV['CIDAAS_BASE_URL'], $_ENV['CIDAAS_CLIENT_ID'], $_ENV['CIDAAS_CLIENT_SECRET'], $_ENV['CIDAAS_REDIRECT_URI'], HandlerStack::create($this->mock), $debug);
        }
    }
}