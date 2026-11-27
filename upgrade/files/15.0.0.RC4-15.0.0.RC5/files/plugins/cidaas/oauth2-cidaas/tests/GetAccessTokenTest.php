<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use Cidaas\OAuth2\Client\Provider\Cidaas;
use Cidaas\OAuth2\Client\Provider\GrantType;
use Dotenv\Dotenv;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use function PHPUnit\Framework\assertArrayHasKey;
use function PHPUnit\Framework\assertStringContainsString;
use function PHPUnit\Framework\assertEquals;

final class GetAccessTokenTest extends AbstractCidaasTestParent {
    private static $REFRESH_TOKEN2 = '3e457b00-00a5-4274-82ab-c1955aadb38d';
    private static $getAccessTokenInvalidGrantResponse = '{"error":"invalid_grant","error_description":"The provided authorization grant is invalid : invalid code or expired or already used or revoked"}';

    private static function accessTokenFromRefreshTokenResponse() {
        return '{"token_type":"Bearer","sub":"df838cf7-dc95-44de-a1cc-5c0eafb0f6db","expires_in":86400,"id_token_expires_in":86400,"access_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MTVmNzk5LWYzZmMtNDM0ZS04NDEyLWUxYWJjMzdhZWZlOSJ9.eyJ1YV9oYXNoIjoiZDViNWI4NDJiOGUxOTM4YzIzNDJmMGY5ZTdjMzI0ZWEiLCJzaWQiOiJjMmIxNjM2My1iN2E5LTQxN2ItYWVlYS01MzAxMzhlYmFiMGIiLCJzdWIiOiJkZjgzOGNmNy1kYzk1LTQ0ZGUtYTFjYy01YzBlYWZiMGY2ZGIiLCJpc3ViIjoiM2Y5NTU1ZjktYWMwMy00ZDMzLTljZGItNDMyZTFiY2UxNDBmIiwiYXVkIjoiN2Q1YWJkYmMtODE4Ni00YzgyLTk5NDMtZjcxNTA2YWFmNzAwIiwiaWF0IjoxNjAzMzU4MDcxLCJhdXRoX3RpbWUiOjE2MDMzNTgwNzEsImlzcyI6Imh0dHBzOi8vbmlnaHRseWJ1aWxkLmNpZGFhcy5kZSIsImp0aSI6Ijc2YWUxNmExLTZhNTctNDRjYi1iNzkyLTJhNDA0ZWY0NTQ3OSIsInNjb3BlcyI6WyJhOnJlYWQiLCJkZXN0aW5hdGlvbjpzdWJzY3JpYmUiLCJkZXN0aW5hdGlvbjpzZW5kIiwibWFuYWdlIiwiTGVnYWwgYmFzaXMiLCJUaXRsZWZpZWxkdGVzdCIsIkhBUjAzIiwiVGVzdHNjb3BlIiwiU2NvcGU2NCIsIlNjb3BlMTkxIiwiRGF0YSBTdG9yYWdlIFBlcmlvZCIsIlBlcnNvbmFsIGRhdGEiLCJTY29wZTQ1MiIsIlNjb3BlOTMiLCJTY29wZTQ4NSIsIlNjb3BlMjQ1IiwiU2NvcGU0OSIsIlNjb3BlMjAxIiwiU2NvcGUzMTEiLCJTY29wZTE3OSIsImNpZGFhczppZF92YWxpZGF0b3JfZnJhdWRfcmVwb3J0IiwiU2NvcGUzNDEiLCJTY29wZTI0MCIsIlNjb3BlNDQ0IiwiU2NvcGU0MjgiLCJTY29wZTIwOSIsIlNjb3BlMzA3IiwiU2NvcGU2NSIsIlNjb3BlMzYwIiwiU2NvcGUxMzIiLCJTY29wZTI2NSIsInByb2ZpbGUiLCJvcGVuaWQiLCJlbWFpbCIsIlNjb3BlMjQ3IiwiY2lkYWFzOmNvbW11bmljYXRpb25fc2VuZCIsImNpZGFhczppdnJfc2VuZCIsImNpZGFhczpzbXNfc2VuZCIsImNpZGFhczplbWFpbF9zZW5kIiwiY2lkYWFzOnBhc3N3b3JkbGVzc19jcmVhdGUiLCJjaWRhYXM6dXNlcmluZm8iLCJjaWRhYXM6aWRwcyIsImNpZGFhczpzaW5nbGVfZmFjdG9yX2F1dGhfZmFjZSIsImNpZGFhczp0ZW5hbnRfZG9jc19yZWFkIiwiY2lkYWFzOnRlbmFudF9kb2NzX2RlbGV0ZSIsImNpZGFhczp0ZW5hbnRfZG9jc193cml0ZSIsImNpZGFhczp1c2VydXBkYXRlIiwiY2lkYWFzOmRlbGV0ZXVzZXIiLCJjaWRhYXM6Y3VzdG9tX3NlY3VyaXR5X2tleV9yZWFkIiwiY2lkYWFzOmRlbGV0ZSIsImNpZGFhczpkZXZpY2VzX3JlYWQiLCJjaWRhYXM6ZGV2aWNlc193cml0ZSIsImNpZGFhczpjdXN0b21fc2VjdXJpdHlfa2V5X2RlbGV0ZSIsImNpZGFhczpjdXN0b21fc2VjdXJpdHlfa2V5X3dyaXRlIiwiY2lkYWFzOmFwcF9kZXZlbG9wZXJzIiwiY2lkYWFzOndyaXRlIiwiY2lkYWFzOnJlYWQiLCJjaWRhYXM6cHVyZ2V1c2VyIiwicGhvbmUiLCJjaWRhYXM6YWRtaW5fcmVhZCIsImFkZHJlc3MiLCJjaWRhYXM6Z3JvdXBzX2RlbGV0ZSIsImNpZGFhczp0ZW5hbnRfY29uc2VudF9kZWxldGUiLCJjaWRhYXM6dGVuYW50X2NvbnNlbnRfd3JpdGUiLCJjaWRhYXM6dGVuYW50X2NvbnNlbnRfcmVhZCIsImNpZGFhczpyZXBvcnRzX2RlbGV0ZSIsImNpZGFhczpyZXBvcnRzX3dyaXRlIiwiY2lkYWFzOnJlcG9ydHNfcmVhZCIsImNpZGFhczp2ZXJpZmljYXRpb25fZGVsZXRlIiwiY2lkYWFzOnZlcmlmaWNhdGlvbl93cml0ZSIsImNpZGFhczp2ZXJpZmljYXRpb25fcmVhZCIsImNpZGFhczpob3N0ZWRfcGFnZXNfZGVsZXRlIiwiY2lkYWFzOmhvc3RlZF9wYWdlc193cml0ZSIsImNpZGFhczpob3N0ZWRfcGFnZXNfcmVhZCIsImNpZGFhczpncm91cHNfdXNlcl9tYXBfZGVsZXRlIiwiY2lkYWFzOmdyb3Vwc191c2VyX21hcF93cml0ZSIsImNpZGFhczpncm91cHNfdXNlcl9tYXBfcmVhZCIsImNpZGFhczpncm91cHNfd3JpdGUiLCJjaWRhYXM6Z3JvdXBzX3JlYWQiLCJjaWRhYXM6Z3JvdXBfdHlwZV9kZWxldGUiLCJjaWRhYXM6Z3JvdXBfdHlwZV93cml0ZSIsImNpZGFhczpncm91cF90eXBlX3JlYWQiLCJjaWRhYXM6b3B0aW5fZGVsZXRlIiwiY2lkYWFzOm9wdGluX3dyaXRlIiwiY2lkYWFzOm9wdGluX3JlYWQiLCJjaWRhYXM6Y2FwdGNoYV9kZWxldGUiLCJjaWRhYXM6Y2FwdGNoYV93cml0ZSIsImNpZGFhczpjYXB0Y2hhX3JlYWQiLCJjaWRhYXM6d2ViaG9va19kZWxldGUiLCJjaWRhYXM6d2ViaG9va193cml0ZSIsImNpZGFhczp3ZWJob29rX3JlYWQiLCJjaWRhYXM6cGFzc3dvcmRfcG9saWN5X2RlbGV0ZSIsImNpZGFhczpwYXNzd29yZF9wb2xpY3lfd3JpdGUiLCJjaWRhYXM6cGFzc3dvcmRfcG9saWN5X3JlYWQiLCJjaWRhYXM6dGVtcGxhdGVzX2RlbGV0ZSIsImNpZGFhczp0ZW1wbGF0ZXNfd3JpdGUiLCJjaWRhYXM6dGVtcGxhdGVzX3JlYWQiLCJjaWRhYXM6cmVnaXN0cmF0aW9uX3NldHVwX2RlbGV0ZSIsImNpZGFhczpyZWdpc3RyYXRpb25fc2V0dXBfd3JpdGUiLCJjaWRhYXM6cmVnaXN0cmF0aW9uX3NldHVwX3JlYWQiLCJjaWRhYXM6cHJvdmlkZXJzX2RlbGV0ZSIsImNpZGFhczpwcm92aWRlcnNfd3JpdGUiLCJjaWRhYXM6cHJvdmlkZXJzX3JlYWQiLCJjaWRhYXM6cm9sZXNfZGVsZXRlIiwiY2lkYWFzOnJvbGVzX3dyaXRlIiwiY2lkYWFzOnJvbGVzX3JlYWQiLCJjaWRhYXM6dXNlcnNfc2VhcmNoIiwiY2lkYWFzOnVzZXJzX2ludml0ZSIsImNpZGFhczp1c2Vyc19kZWxldGUiLCJjaWRhYXM6dXNlcnNfd3JpdGUiLCJjaWRhYXM6dXNlcnNfcmVhZCIsImNpZGFhczpzZWN1cml0eV9rZXlfZGVsZXRlIiwiY2lkYWFzOnNlY3VyaXR5X2tleV93cml0ZSIsImNpZGFhczpzZWN1cml0eV9rZXlfcmVhZCIsImNpZGFhczpzY29wZXNfZGVsZXRlIiwiY2lkYWFzOnNjb3Blc193cml0ZSIsImNpZGFhczpzY29wZXNfcmVhZCIsImNpZGFhczphcHBzX2RlbGV0ZSIsImNpZGFhczphcHBzX3dyaXRlIiwiY2lkYWFzOmFwcHNfcmVhZCIsImNpZGFhczphZG1pbl9kZWxldGUiLCJjaWRhYXM6YWRtaW5fd3JpdGUiLCJjaWRhYXM6cmVnaXN0ZXIiLCJpZGVudGl0aWVzIiwiZ3JvdXBzIiwicm9sZXMiLCJvZmZsaW5lX2FjY2VzcyJdLCJyb2xlcyI6WyJVU0VSIl0sImdyb3VwcyI6W3siZ3JvdXBJZCI6IkNJREFBU19BRE1JTlMiLCJyb2xlcyI6WyJTRUNPTkRBUllfQURNSU4iXX1dLCJleHAiOjE2MDM0NDQ0NzF9.YHbDY-aQGUWps5b3BPN4TkAbbbzy3eI7KOc1zvz7h57VfrbYTFUwn-yzpRh8hgWbN7rMVe2o_LfSVLNQ1Hg6yFtn5dpMkEwb1Y6OvBaOFsKq3ZE3jjCJfRUaE3q3WwJn74Auk_8wOxh3lZSUUosE8LO0JrNw_8BguA7ewqkLClM","id_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjA2MTVmNzk5LWYzZmMtNDM0ZS04NDEyLWUxYWJjMzdhZWZlOSJ9.eyJ1YV9oYXNoIjoiZDViNWI4NDJiOGUxOTM4YzIzNDJmMGY5ZTdjMzI0ZWEiLCJzaWQiOiJjMmIxNjM2My1iN2E5LTQxN2ItYWVlYS01MzAxMzhlYmFiMGIiLCJzdWIiOiJkZjgzOGNmNy1kYzk1LTQ0ZGUtYTFjYy01YzBlYWZiMGY2ZGIiLCJpc3ViIjoiM2Y5NTU1ZjktYWMwMy00ZDMzLTljZGItNDMyZTFiY2UxNDBmIiwiYXVkIjoiN2Q1YWJkYmMtODE4Ni00YzgyLTk5NDMtZjcxNTA2YWFmNzAwIiwiaWF0IjoxNjAzMzU4MDcxLCJhdXRoX3RpbWUiOjE2MDMzNTgwNzEsImlzcyI6Imh0dHBzOi8vbmlnaHRseWJ1aWxkLmNpZGFhcy5kZSIsImp0aSI6Ijc2YWUxNmExLTZhNTctNDRjYi1iNzkyLTJhNDA0ZWY0NTQ3OSIsInNjb3BlcyI6WyJhOnJlYWQiLCJkZXN0aW5hdGlvbjpzdWJzY3JpYmUiLCJkZXN0aW5hdGlvbjpzZW5kIiwibWFuYWdlIiwiTGVnYWwgYmFzaXMiLCJUaXRsZWZpZWxkdGVzdCIsIkhBUjAzIiwiVGVzdHNjb3BlIiwiU2NvcGU2NCIsIlNjb3BlMTkxIiwiRGF0YSBTdG9yYWdlIFBlcmlvZCIsIlBlcnNvbmFsIGRhdGEiLCJTY29wZTQ1MiIsIlNjb3BlOTMiLCJTY29wZTQ4NSIsIlNjb3BlMjQ1IiwiU2NvcGU0OSIsIlNjb3BlMjAxIiwiU2NvcGUzMTEiLCJTY29wZTE3OSIsImNpZGFhczppZF92YWxpZGF0b3JfZnJhdWRfcmVwb3J0IiwiU2NvcGUzNDEiLCJTY29wZTI0MCIsIlNjb3BlNDQ0IiwiU2NvcGU0MjgiLCJTY29wZTIwOSIsIlNjb3BlMzA3IiwiU2NvcGU2NSIsIlNjb3BlMzYwIiwiU2NvcGUxMzIiLCJTY29wZTI2NSIsInByb2ZpbGUiLCJvcGVuaWQiLCJlbWFpbCIsIlNjb3BlMjQ3IiwiY2lkYWFzOmNvbW11bmljYXRpb25fc2VuZCIsImNpZGFhczppdnJfc2VuZCIsImNpZGFhczpzbXNfc2VuZCIsImNpZGFhczplbWFpbF9zZW5kIiwiY2lkYWFzOnBhc3N3b3JkbGVzc19jcmVhdGUiLCJjaWRhYXM6dXNlcmluZm8iLCJjaWRhYXM6aWRwcyIsImNpZGFhczpzaW5nbGVfZmFjdG9yX2F1dGhfZmFjZSIsImNpZGFhczp0ZW5hbnRfZG9jc19yZWFkIiwiY2lkYWFzOnRlbmFudF9kb2NzX2RlbGV0ZSIsImNpZGFhczp0ZW5hbnRfZG9jc193cml0ZSIsImNpZGFhczp1c2VydXBkYXRlIiwiY2lkYWFzOmRlbGV0ZXVzZXIiLCJjaWRhYXM6Y3VzdG9tX3NlY3VyaXR5X2tleV9yZWFkIiwiY2lkYWFzOmRlbGV0ZSIsImNpZGFhczpkZXZpY2VzX3JlYWQiLCJjaWRhYXM6ZGV2aWNlc193cml0ZSIsImNpZGFhczpjdXN0b21fc2VjdXJpdHlfa2V5X2RlbGV0ZSIsImNpZGFhczpjdXN0b21fc2VjdXJpdHlfa2V5X3dyaXRlIiwiY2lkYWFzOmFwcF9kZXZlbG9wZXJzIiwiY2lkYWFzOndyaXRlIiwiY2lkYWFzOnJlYWQiLCJjaWRhYXM6cHVyZ2V1c2VyIiwicGhvbmUiLCJjaWRhYXM6YWRtaW5fcmVhZCIsImFkZHJlc3MiLCJjaWRhYXM6Z3JvdXBzX2RlbGV0ZSIsImNpZGFhczp0ZW5hbnRfY29uc2VudF9kZWxldGUiLCJjaWRhYXM6dGVuYW50X2NvbnNlbnRfd3JpdGUiLCJjaWRhYXM6dGVuYW50X2NvbnNlbnRfcmVhZCIsImNpZGFhczpyZXBvcnRzX2RlbGV0ZSIsImNpZGFhczpyZXBvcnRzX3dyaXRlIiwiY2lkYWFzOnJlcG9ydHNfcmVhZCIsImNpZGFhczp2ZXJpZmljYXRpb25fZGVsZXRlIiwiY2lkYWFzOnZlcmlmaWNhdGlvbl93cml0ZSIsImNpZGFhczp2ZXJpZmljYXRpb25fcmVhZCIsImNpZGFhczpob3N0ZWRfcGFnZXNfZGVsZXRlIiwiY2lkYWFzOmhvc3RlZF9wYWdlc193cml0ZSIsImNpZGFhczpob3N0ZWRfcGFnZXNfcmVhZCIsImNpZGFhczpncm91cHNfdXNlcl9tYXBfZGVsZXRlIiwiY2lkYWFzOmdyb3Vwc191c2VyX21hcF93cml0ZSIsImNpZGFhczpncm91cHNfdXNlcl9tYXBfcmVhZCIsImNpZGFhczpncm91cHNfd3JpdGUiLCJjaWRhYXM6Z3JvdXBzX3JlYWQiLCJjaWRhYXM6Z3JvdXBfdHlwZV9kZWxldGUiLCJjaWRhYXM6Z3JvdXBfdHlwZV93cml0ZSIsImNpZGFhczpncm91cF90eXBlX3JlYWQiLCJjaWRhYXM6b3B0aW5fZGVsZXRlIiwiY2lkYWFzOm9wdGluX3dyaXRlIiwiY2lkYWFzOm9wdGluX3JlYWQiLCJjaWRhYXM6Y2FwdGNoYV9kZWxldGUiLCJjaWRhYXM6Y2FwdGNoYV93cml0ZSIsImNpZGFhczpjYXB0Y2hhX3JlYWQiLCJjaWRhYXM6d2ViaG9va19kZWxldGUiLCJjaWRhYXM6d2ViaG9va193cml0ZSIsImNpZGFhczp3ZWJob29rX3JlYWQiLCJjaWRhYXM6cGFzc3dvcmRfcG9saWN5X2RlbGV0ZSIsImNpZGFhczpwYXNzd29yZF9wb2xpY3lfd3JpdGUiLCJjaWRhYXM6cGFzc3dvcmRfcG9saWN5X3JlYWQiLCJjaWRhYXM6dGVtcGxhdGVzX2RlbGV0ZSIsImNpZGFhczp0ZW1wbGF0ZXNfd3JpdGUiLCJjaWRhYXM6dGVtcGxhdGVzX3JlYWQiLCJjaWRhYXM6cmVnaXN0cmF0aW9uX3NldHVwX2RlbGV0ZSIsImNpZGFhczpyZWdpc3RyYXRpb25fc2V0dXBfd3JpdGUiLCJjaWRhYXM6cmVnaXN0cmF0aW9uX3NldHVwX3JlYWQiLCJjaWRhYXM6cHJvdmlkZXJzX2RlbGV0ZSIsImNpZGFhczpwcm92aWRlcnNfd3JpdGUiLCJjaWRhYXM6cHJvdmlkZXJzX3JlYWQiLCJjaWRhYXM6cm9sZXNfZGVsZXRlIiwiY2lkYWFzOnJvbGVzX3dyaXRlIiwiY2lkYWFzOnJvbGVzX3JlYWQiLCJjaWRhYXM6dXNlcnNfc2VhcmNoIiwiY2lkYWFzOnVzZXJzX2ludml0ZSIsImNpZGFhczp1c2Vyc19kZWxldGUiLCJjaWRhYXM6dXNlcnNfd3JpdGUiLCJjaWRhYXM6dXNlcnNfcmVhZCIsImNpZGFhczpzZWN1cml0eV9rZXlfZGVsZXRlIiwiY2lkYWFzOnNlY3VyaXR5X2tleV93cml0ZSIsImNpZGFhczpzZWN1cml0eV9rZXlfcmVhZCIsImNpZGFhczpzY29wZXNfZGVsZXRlIiwiY2lkYWFzOnNjb3Blc193cml0ZSIsImNpZGFhczpzY29wZXNfcmVhZCIsImNpZGFhczphcHBzX2RlbGV0ZSIsImNpZGFhczphcHBzX3dyaXRlIiwiY2lkYWFzOmFwcHNfcmVhZCIsImNpZGFhczphZG1pbl9kZWxldGUiLCJjaWRhYXM6YWRtaW5fd3JpdGUiLCJjaWRhYXM6cmVnaXN0ZXIiLCJpZGVudGl0aWVzIiwiZ3JvdXBzIiwicm9sZXMiLCJvZmZsaW5lX2FjY2VzcyJdLCJyb2xlcyI6WyJVU0VSIl0sImdyb3VwcyI6W3siZ3JvdXBJZCI6IkNJREFBU19BRE1JTlMiLCJyb2xlcyI6WyJTRUNPTkRBUllfQURNSU4iXX1dLCJleHAiOjE2MDM0NDQ0NzEsImF0X2hhc2giOiI0bnZiZXlyUzJXOTVrUmdlUktPak9RIiwibGFzdF91c2VkX2lkZW50aXR5X2lkIjoiM2Y5NTU1ZjktYWMwMy00ZDMzLTljZGItNDMyZTFiY2UxNDBmIiwiX2lkIjoiM2Y5NTU1ZjktYWMwMy00ZDMzLTljZGItNDMyZTFiY2UxNDBmIiwiY2xhc3NOYW1lIjoiZGUuY2lkYWFzLmNvcmUuZGIuRW50ZXJuYWxTb2NpYWxJZGVudGl0eSIsInByb3ZpZGVyIjoic2VsZiIsImJpcnRoZGF0ZSI6IjE5NzgtMDUtMDIiLCJlbWFpbCI6ImpvZXJnLmtub2Jsb2NoQHdpZGFzLmRlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZhbWlseV9uYW1lIjoiS25vYmxvY2giLCJnaXZlbl9uYW1lIjoiSm9lcmciLCJsb2NhbGUiOiJlbi11cyIsIm1vYmlsZV9udW1iZXIiOiIiLCJtb2JpbGVfbnVtYmVyX3ZlcmlmaWVkIjpmYWxzZSwid2Vic2l0ZSI6IiIsImNyZWF0ZWRUaW1lIjoiMjAyMC0xMC0xMlQxMTo1MTozNC4xNTlaIiwidXBkYXRlZFRpbWUiOiIyMDIwLTEwLTIyVDA5OjE0OjI4LjgzNloiLCJfX3JlZiI6IjE2MDMzNTgwNjY3NDAtZjBjYjBjZjMtZDliMC00N2IwLWJmODItMmNjY2QwODI4Nzg2IiwiYWRkcmVzcyI6eyJjbGFzc05hbWUiOiJkZS5jaWRhYXMubWFuYWdlbWVudC5kYi5Vc2VyQWRkcmVzcyIsInJlZ2lvbiI6IiIsInBvc3RhbF9jb2RlIjoiIiwiY291bnRyeSI6IiIsInN0cmVldF9hZGRyZXNzIjoiIiwiX19yZWYiOiIxNjAzMjc5NDUxMjE3LWEyN2JkYWUwLTRiOTMtNDk3Mi04YzAwLWE4NzdmNDgyYjAzMSIsImlkIjpudWxsfSwiaWQiOiIzZjk1NTVmOS1hYzAzLTRkMzMtOWNkYi00MzJlMWJjZTE0MGYiLCJuYW1lIjoiSm9lcmcgS25vYmxvY2giLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJqb2VyZy5rbm9ibG9jaEB3aWRhcy5kZSIsIm5pY2tuYW1lIjoiSm9lcmciLCJ1cGRhdGVkX2F0IjoxNjAzMzU4MDY4LCJ1c2VyX3N0YXR1cyI6IlZFUklGSUVEIiwibGFzdF9hY2Nlc3NlZF9hdCI6MTYwMzM1ODA2OCwiaWRlbnRpdGllcyI6W3sicHJvdmlkZXIiOiJzZWxmIiwiaWRlbnRpdHlJZCI6IjNmOTU1NWY5LWFjMDMtNGQzMy05Y2RiLTQzMmUxYmNlMTQwZiIsImVtYWlsIjoiam9lcmcua25vYmxvY2hAd2lkYXMuZGUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibW9iaWxlX251bWJlciI6IiIsIm1vYmlsZV9udW1iZXJfdmVyaWZpZWQiOmZhbHNlfSx7ImlkZW50aXR5SWQiOiI2M2ZmZDUyYS04MmNiLTQ0NmEtYmI5OC1mMDQ2OTE4MTk1YTYiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX1dLCJjdXN0b21GaWVsZHMiOnsic2FsdXRhdGlvbiI6Ik1yIiwicGluY29kZSI6IiIsIkdlbmRlciI6IkhlcnIiLCJUZXh0YXJlYSI6IiIsImNoZWNrT3B0aW9uIjpbXSwiY2hlY2tNdWx0aSI6W10sImNvbXBhbnkiOiIiLCJwaG9uZV9udW1iZXIiOiIiLCJJRFBFbWFpbCI6IiIsImNpdHkiOiIiLCJjb3VudHJ5X2NvZGUiOiJERSIsImFjY291bnQtaWQiOiIiLCJpbW11dGFibGVpZCI6IiIsInRlc3RfbmlkIjoiIiwic3dfY3JlZCI6IiIsImJpbGxpbmdfYWRkcmVzc19zdHJlZXQiOiIiLCJiaWxsaW5nX2FkZHJlc3NfemlwY29kZSI6IiIsImJpbGxpbmdfYWRkcmVzc19jaXR5IjoiIiwiYmlsbGluZ19hZGRyZXNzX2NvdW50cnkiOiIiLCJjdXN0b21lcl9udW1iZXIiOiIiLCJzb3J0YWJsZSI6IiIsIkNfTk8iOiIiLCJyb2xsX25vIjoiIiwiZW1wX251bWJlciI6IiIsIlN0cmVldF9hZGRyMSI6IiIsImRlbW9maWVsZHMiOiIiLCJwaW5jb2RlMSI6IiIsIkFyZWFfTmFtZSI6IiIsIkNyb3NzTnVtYmVyIjoiIiwiTm9vZkZsb29yIjoiIiwiRmxvb3JMZXZlbDAxMiI6IiIsIkZsb29yU3RhdHVzIjoiIiwic2VsZWN0aW9uX2RlbW8iOiIiLCJzc2NfY3VzdG9tIjoiIiwibG95YWx0eV9jYXJkMDFfTUQiOiIiLCJ0ZXN0IjoiIiwiT3duZXJfSW5mbyI6IiIsIkJ1aWxkaW5nSW5mbyI6IiIsInJhZGlvT3B0aW9uIjoiIiwic2Vjb25kYWRkcmVzcyI6IiIsIkZsb3JpYW5TVGVzdEZlbGQiOiIifX0.VqO7_ZEgS92XN_WbFTy8mmNoTffCzwx9KUMjle0LKurUmtYH358epPsq4jdTTxWkuZlKn4NlULq4PMniDE__ZvwjTzx8m96eEM0WwKAT9bFiIJc--fVPAQv4v2OIZLsAC5ANhFjuNH_i2RDFW8t8QIdk4Uh8858IYyZgkAEBQo4","refresh_token":"' . self::$REFRESH_TOKEN2 . '","identity_id":"3f9555f9-ac03-4d33-9cdb-432e1bce140f"}';
    }

    private $responsePromise;

    protected function setUp(): void {
        $this->setUpCidaas();

        $this->mock->append(new Response(200, [], self::loginSuccessfulResponse()));

        $this->responsePromise = $this->provider->getRequestId('openid offline_access')->then(function ($requestId) {
            return $this->provider->loginWithCredentials($_ENV['USER_NAME'], $_ENV['USERNAME_TYPE'], $_ENV['PASSWORD'], $requestId);
        });
    }

    public function test_getAccessToken_withGrantTypeAuthorizationCodeAndCode_serverCalledWithClientIdSecretAndCode() {
        $this->mock->append(new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        $this->responsePromise->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->wait();

        $request = $this->mock->getLastRequest();
        $body = $request->getBody();

        assertStringContainsString('client_id=' . urlencode($_ENV['CIDAAS_CLIENT_ID']), $body);
        assertStringContainsString('client_secret=' . urlencode($_ENV['CIDAAS_CLIENT_SECRET']), $body);
        assertStringContainsString('redirect_uri=' . urlencode($_ENV['CIDAAS_REDIRECT_URI']), $body);
        assertStringContainsString('grant_type=' . urlencode(GrantType::AuthorizationCode), $body);
        assertStringContainsString('code=' . urlencode(self::$CODE), $body);
    }

    public function test_getAccessToken_withGrantTypeRefreshTokenAndRefreshToken_serverCalledWithClientIdSecretAndToken() {
        $this->mock->append(new Response(200, [], self::getAccessTokenSuccessfulResponse()), new Response(200, [], self::accessTokenFromRefreshTokenResponse()));

        $this->responsePromise->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->then(function ($accessTokenResponse) {
            $refreshToken = $accessTokenResponse['refresh_token'];
            return $this->provider->getAccessToken(GrantType::RefreshToken, '', $refreshToken);
        })->wait();

        $request = $this->mock->getLastRequest();
        $body = $request->getBody();

        assertStringContainsString('client_id=' . urlencode($_ENV['CIDAAS_CLIENT_ID']), $body);
        assertStringContainsString('client_secret=' . urlencode($_ENV['CIDAAS_CLIENT_SECRET']), $body);
        assertStringContainsString('grant_type=' . urlencode(GrantType::RefreshToken), $body);
        assertStringContainsString('refresh_token=' . urlencode(self::$REFRESH_TOKEN), $body);
    }

    public function test_getAccessToken_withGrantTypeRefreshTokenAndRefreshToken_returnsResultFromRefreshToken() {
        $this->mock->append(new Response(200, [], self::getAccessTokenSuccessfulResponse()), new Response(200, [], self::accessTokenFromRefreshTokenResponse()));

        $response = $this->responsePromise->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->then(function ($accessTokenResponse) {
            $refreshToken = $accessTokenResponse['refresh_token'];
            return $this->provider->getAccessToken(GrantType::RefreshToken, '', $refreshToken);
        })->wait();

        assertArrayHasKey('access_token', $response);
        assertEquals(self::$REFRESH_TOKEN2, $response['refresh_token']);
    }

    public function test_getAccessToken_withGrantTypeClientCredentials_serverCalledWithClientIdAndSecret() {
        $this->mock->append(new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        $this->responsePromise->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::ClientCredentials);
        })->wait();

        $request = $this->mock->getLastRequest();
        $body = $request->getBody();

        assertStringContainsString('client_id=' . urlencode($_ENV['CIDAAS_CLIENT_ID']), $body);
        assertStringContainsString('client_secret=' . urlencode($_ENV['CIDAAS_CLIENT_SECRET']), $body);
        assertStringContainsString('grant_type=' . urlencode(GrantType::ClientCredentials), $body);
    }

    public function test_getAccessToken_withGrantTypeAuthorizationCodeAndCode_returnsAccessToken() {
        $this->mock->append(new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        $promise = $this->responsePromise->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        });

        $response = $promise->wait();

        assertEquals(self::$ACCESS_TOKEN, $response['access_token']);
    }

    public function test_loginWithCredentials_withInvalidCredentialsAndKnownUsernameGiven_returnsLoginUnsuccessfulFromServer() {
        $this->mock->append(new Response(400, [], self::$getAccessTokenInvalidGrantResponse));

        $promise = $this->responsePromise->then(function ($credentialsResponse) {
            $code = 'someOtherCode';
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(400, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertEquals('invalid_grant', $response['error']);
        }
    }

    public function test_getAccessToken_withGrantTypeAuthorizationCodeAndNoCode_throwsInvalidArgumentException() {
        $this->mock->append(new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        try {
            $this->provider->getAccessToken(GrantType::AuthorizationCode);
            self::fail('getAccessToken should have thrown an InvalidArgumentException');
        } catch (InvalidArgumentException $exception) {
            assertEquals('code must not be empty in authorization_code flow', $exception->getMessage());
        }
    }

    public function test_getAccessToken_withGrantTypeRefreshTokenAndNoRefreshToken_throwsInvalidArgumentException() {
        $this->mock->append(new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        try {
            $this->provider->getAccessToken(GrantType::RefreshToken);
            self::fail('getAccessToken should have thrown an InvalidArgumentException');
        } catch (InvalidArgumentException $exception) {
            assertEquals('refreshToken must not be empty in refresh_token flow', $exception->getMessage());
        }
    }

    public function test_getAccessToken_withInvalidGrantType_throwsInvalidArgumentException() {
        $this->mock->append(new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        try {
            $this->provider->getAccessToken('invalidGrantType');
            self::fail('getAccessToken should have thrown an InvalidArgumentException');
        } catch (InvalidArgumentException $exception) {
            assertEquals('invalid grant type', $exception->getMessage());
        }
    }
}
