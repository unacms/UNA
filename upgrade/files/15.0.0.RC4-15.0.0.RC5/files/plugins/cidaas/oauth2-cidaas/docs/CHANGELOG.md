## [2.0.2](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/compare/v2.0.1...v2.0.2) (2026-11-03)


### Bug Fixes

* address GitLab Duo review on MR !41 ([e13e784](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/commit/e13e784328502bcb4baffb346a3cab1ff473ace8))
* address GitLab Duo review on MR !42 ([5b0b2b3](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/commit/5b0b2b31b54e6b243a09b8911acebbbf45e88b60))
* harden state, PKCE, session and logout handling from MR !40 review ([ad0cf83](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/commit/ad0cf835acf0f500d02ae23e7e0cd771ac13cfb2))
* remove breakings, enhance readme ([3cb95d5](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/commit/3cb95d55bd86ea7c0583de01836e54fa594d15e7))
* update to PKCE and state check ([abe3865](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/commit/abe3865c60f44d6a9bd1597df3b4abc975baa5a1))

## Unreleased

### Features

* Allow empty client secret for public / PKCE clients (`authorization_code` and `refresh_token`); `client_credentials` still requires a secret.

### Security

* Remove real client secrets and passwords from committed `tests/testconfig.env` (placeholders only).
* Add OAuth `state` to `loginWithBrowser` / `registerWithBrowser` and validate it in `loginCallback`. A callback with a `code` but no stored state is rejected (login CSRF); `loginCallback(false)` opts out for externally built authorization URLs.
* Prevent caller `queryParameters` from overriding `client_id`, `redirect_uri`, `response_type`, `state` and PKCE params; `nonce`, `scope` and `view_type` stay overridable.
* Harden PKCE: dedicated session keys, verifier sent automatically when stored (mandatory with `$pkceEnabled`), cleared after use and on non-PKCE logins; PKCE also available on `registerWithBrowser`.
* Use cryptographically secure nonces instead of `time()`.
* URL-encode path segments for profile/social redirects; keep initiateMFA type-unrestricted (legacy behaviour), validate authenticateMFA types against the documented allowlist.
* Throw `LogicException` in web requests when the PHP session cannot be started instead of silently losing state/verifier (in-memory fallback only on CLI).
* Send logout `access_token_hint` as a JSON POST body instead of the query string.

### Bug Fixes

* Guard missing `requestId` in auth request responses and failed `json_encode` bodies.
* Throw `UnexpectedValueException` instead of a `TypeError` when an API response is valid JSON but not an object/array (e.g. `null`).
* `getAccessToken` resumes an existing PHP session to find a stored `code_verifier` even when `loginCallback` was not called first.
* Default unit-test debug mode to `false`.
* CI: drop `roave/security-advisories` (it now conflicts with the PHP runtime and broke `composer install`); rely on Composer's built-in insecure-package blocking plus `composer audit`.

## [2.0.1](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/compare/v2.0.0...v2.0.1) (2026-06-19)


### Bug Fixes

* update versions in changelog ([26960d0](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/commit/26960d0a52d6942b13bc87620c5b7843a93120d6))
* update versions in changelog ([211c2fd](https://gitlab.widas.de/cidaas-public-devkits/cidaas-public-sdks/cidaas-sdk-php/commit/211c2fd03cf1e940a9ff428d8730df235d6de7bc))

## 2.0.0

### BREAKING CHANGES

* Minimum supported PHP version raised from 7.4 to **8.2**. PHP 7.4, 8.0, and 8.1 are no longer supported.
* PHPUnit upgraded from 9.x to **10.5** (dev dependency; requires PHP 8.1+).

### Features

* Build hosted login and registration redirect URLs with `http_build_query` so `redirect_uri` and custom query parameters are URL-encoded correctly (`loginWithBrowser`, `registerWithBrowser`).
* Run GitHub Actions CI on PHP **8.2** and **8.3** for pushes and pull requests to `master`, `main`, `develop`, and `development`.
* Document branching strategy and PHP 8.2 requirement in README.

### Bug Fixes

* Remove unused `$client` variable in `loginWithBrowser`.

### Tests

* Add regression tests for encoded redirect URIs and query parameters in `LoginWithBrowserTest`.
* Update PHPUnit configuration for PHPUnit 10.

## 1.3.4

### Bug Fixes

* #143 code coverage added
* #143 Failing Badges on some Projects issue fixes

## 1.3.3

### Bug Fixes

* cidaas v3 password reset flow support
* update endpoint for cidaas v3

## 1.3.2

### Bug Fixes

* add default value to func param pkceEnabled

## 1.3.1

### Bug Fixes

* add pkce feature
* update readme with pkce flow

## 1.3.0

### Bug Fixes

* skip code coverage

### Features

* php sdk enhancement

## 1.2.2

### Bug Fixes

* create tag on master
