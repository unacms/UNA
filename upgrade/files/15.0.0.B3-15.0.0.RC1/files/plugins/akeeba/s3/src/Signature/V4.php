<?php
/**
 * Akeeba Engine
 *
 * @package   akeebaengine
 * @copyright Copyright (c)2006-2026 Nicholas K. Dionysopoulos / Akeeba Ltd
 * @license   GNU General Public License version 3, or later
 */

namespace Akeeba\S3\Signature;

// Protection against direct access
defined('AKEEBAENGINE') || die();

use Akeeba\S3\Signature;
use DateTime;

/**
 * Implements the Amazon AWS v4 signatures
 *
 * @see http://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
 */
class V4 extends Signature
{
	/**
	 * Pre-process the request headers before we convert them to cURL-compatible format. Used by signature engines to
	 * add custom headers, e.g. x-amz-content-sha256
	 *
	 * @param   array  $headers     The associative array of headers to process
	 * @param   array  $amzHeaders  The associative array of amz-* headers to process
	 *
	 * @return  void
	 */
	public function preProcessHeaders(array &$headers, array &$amzHeaders): void
	{
		// Do we already have an SHA-256 payload hash?
		if (isset($amzHeaders['x-amz-content-sha256']))
		{
			return;
		}

		// Set the payload hash header
		$input = $this->request->getInput();

		if (is_object($input))
		{
			$requestPayloadHash = $input->getSha256();
		}
		else
		{
			$requestPayloadHash = hash('sha256', '', false);
		}

		$amzHeaders['x-amz-content-sha256'] = $requestPayloadHash;
	}

	/**
	 * Get a pre-signed URL for the request. Typically used to pre-sign GET requests to objects, i.e. give shareable
	 * pre-authorized URLs for downloading files from S3.
	 *
	 * @param   integer|null  $lifetime  Lifetime in seconds. NULL for default lifetime.
	 * @param   bool          $https     Use HTTPS ($hostBucket should be false for SSL verification)?
	 *
	 * @return  string  The presigned URL
	 */
	public function getAuthenticatedURL(?int $lifetime = null, bool $https = false): string
	{
		// Set the Expires header
		if (is_null($lifetime))
		{
			$lifetime = 10;
		}

		/**
		 * Authenticated URLs must always go through the generic regional endpoint, not the virtual hosting-style domain
		 * name. This means that if you have a bucket "example" in the EU West 1 (Ireland) region we have to go through
		 * http://s3-eu-west-1.amazonaws.com/example instead of http://example.amazonaws.com/ for all authenticated URLs
		 */
		$region   = $this->request->getConfiguration()->getRegion();
		$bucket   = $this->request->getBucket();
		$hostname = $this->getPresignedHostnameForRegion($region);

		if (!$this->request->getConfiguration()->getPreSignedBucketInURL() && $this->isValidBucketName($bucket))
		{
			$hostname = $bucket . '.' . $hostname;
		}

		$this->request->setHeader('Host', $hostname);

		// Set the expiration time in seconds
		$this->request->setHeader('Expires', (int) $lifetime);

		// Get the query parameters, including the calculated signature
		$uri              = $this->request->getResource();
		$headers          = $this->request->getHeaders();
		$protocol         = $https ? 'https' : 'http';
		$serialisedParams = $this->getAuthorizationHeader();

		// The query parameters are returned serialized; unserialize them, then build and return the URL.
		$queryParameters = unserialize($serialisedParams);

		// This should be toggleable
		if (
			!$this->request->getConfiguration()->getPreSignedBucketInURL()
			&& $this->isValidBucketName($bucket)
			&& strpos($uri, '/' . $bucket) === 0)
		{
			$uri = substr($uri, strlen($bucket) + 1);
		}

		$query = http_build_query($queryParameters);

		$url = $protocol . '://' . $headers['Host'] . $uri;
		$url .= (strpos($uri, '?') !== false) ? '&' : '?';
		$url .= $query;

		return $url;
	}

	/**
	 * Returns the authorization header for the request
	 *
	 * @return  string
	 */
	public function getAuthorizationHeader(): string
	{
		$verb           = strtoupper($this->request->getVerb());
		$resourcePath   = $this->request->getResource();
		$headers        = $this->request->getHeaders();
		$amzHeaders     = $this->request->getAmzHeaders();
		$parameters     = $this->request->getParameters();
		$bucket         = $this->request->getBucket();
		$isPresignedURL = false;

		// See the Connector class for the explanation behind this ugly workaround
		$amazonIsBraindead = isset($headers['workaround-braindead-error-from-amazon']);

		if ($amazonIsBraindead)
		{
			unset ($headers['workaround-braindead-error-from-amazon']);
		}

		// Get the credentials scope
		$signatureDate = new DateTime($headers['Date'] ?? $amzHeaders['x-amz-date']);

		$credentialScope = $signatureDate->format('Ymd') . '/' .
		                   $this->request->getConfiguration()->getRegion() . '/' .
		                   's3/aws4_request';

		/**
		 * If the Expires header is set up we're pre-signing a download URL. The string to sign is a bit
		 * different in this case and we have to pass certain headers as query string parameters.
		 *
		 * @see http://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
		 */
		if (isset($headers['Expires']))
		{
			$gmtDate = clone $signatureDate;
			$gmtDate->setTimezone(new \DateTimeZone('GMT'));

			$parameters['X-Amz-Algorithm']  = "AWS4-HMAC-SHA256";
			$parameters['X-Amz-Credential'] = $this->request->getConfiguration()->getAccess() . '/' . $credentialScope;
			$parameters['X-Amz-Date']       = $gmtDate->format('Ymd\THis\Z');
			$parameters['X-Amz-Expires']    = sprintf('%u', $headers['Expires']);
			$token                          = $this->request->getConfiguration()->getToken();

			if (!empty($token))
			{
				$parameters['x-amz-security-token'] = $token;
			}

			unset($headers['Expires']);
			unset($headers['Date']);
			unset($headers['Content-MD5']);
			unset($headers['Content-Type']);

			$isPresignedURL = true;
		}

		// ========== Step 1: Create a canonical request ==========
		// See http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html

		$canonicalHeaders   = "";
		$signedHeadersArray = [];

		// Calculate the canonical headers and the signed headers
		if ($isPresignedURL)
		{
			// Presigned URLs use UNSIGNED-PAYLOAD instead
			unset($amzHeaders['x-amz-content-sha256']);
		}

		$allHeaders = array_merge($headers, $amzHeaders);
		ksort($allHeaders);

		foreach ($allHeaders as $k => $v)
		{
			$lowercaseHeaderName = strtolower($k);

			if ($amazonIsBraindead && ($lowercaseHeaderName == 'content-length'))
			{
				/**
				 * I know it looks crazy. It is. Somehow Amazon requires me to do this and only on _some_ servers, mind
				 * you. This is something undocumented and which is not covered by their official SDK. I had to write
				 * my own library because of that and the official SDK's inability to upload large files without using
				 * at least as much memory as the file itself (which doesn't fly well for files around 2Gb, let me tell
				 * you that!).
				 */
				$v = "$v,$v";
			}

			$canonicalHeaders     .= $lowercaseHeaderName . ':' . trim($v) . "\n";
			$signedHeadersArray[] = $lowercaseHeaderName;
		}

		$signedHeaders = implode(';', $signedHeadersArray);

		if ($isPresignedURL)
		{
			$parameters['X-Amz-SignedHeaders'] = $signedHeaders;
		}

		// The canonical URI is the resource path
		$canonicalURI     = $resourcePath;
		$bucketResource   = '/' . $bucket . '/';
		$regionalHostname = ($headers['Host'] != 's3.amazonaws.com')
		                    && ($headers['Host'] != $bucket . '.s3.amazonaws.com');

		/**
		 * Yet another special case for third party, S3-compatible services, when using pre-signed URLs.
		 *
		 * Given a bucket `example` and filepath `foo/bar.txt` the canonical URI to sign is supposed to be
		 * /example/foo/bar.txt regardless of whether we are using path style or subdomain hosting style access to the
		 * bucket.
		 *
		 * When calculating a pre-signed URL, the URL we will be accessing will be something to the tune of
		 * example.endpoint.com/foo/bar.txt. Amazon S3 proper allows us to use EITHER the nominal canonical URI
		 * /foo/bar.txt OR the /example/foo/bar.txt canonical URI for consistency. Some third party providers, like
		 * Wasabi, will choke on the former and complain about the signature being invalid.
		 *
		 * To address this issue we check if all the following conditions are met:
		 * - We are calculating a signature for a pre-signed URL.
		 * - The service is NOT Amazon S3 proper.
		 * - The domain name starts with the bucket name.
		 * In this case, and this case only, we set $regionalHostname to false. This triggers an if-block further down
		 * which strips the `/bucketName/` prefix from the canonical URI, converting it to `/`. Therefore, the canonical
		 * URI in the signature becomes the nominal URI we will be accessing in the bucket, solving the problem with
		 * those third party services.
		 *
		 * IMPORTANT: this stripping is only correct when the bucket is NOT part of the URL path we will actually request,
		 * i.e. when the bucket lives in the hostname (virtual-hosting style). When getPreSignedBucketInURL() is true we
		 * deliberately keep the bucket as the first path component of the pre-signed URL (path-style access — required by
		 * S3-compatible services reached through a host:port endpoint with no per-bucket DNS, such as a local MinIO). In
		 * that case the bucket IS in the requested path, so the canonical URI must keep it too; stripping it here would
		 * sign `/object` while requesting `/bucket/object`, which strict services reject with SignatureDoesNotMatch.
		 */
		// Figuring out whether it's a regional hostname DOES NOT work above if it's not AWS S3 proper. Let's fix that.
		if ($isPresignedURL
		    && !$this->request->getConfiguration()->getPreSignedBucketInURL()
		    && strpos($headers['Host'], 'amazonaws.com') === false
		    && !strpos($headers['Host'], $bucket . '.'))
		{
			$regionalHostname = false;
		}

		// Special case: if the canonical URI ends in /?location the bucket name DOES count as part of the canonical URL
		// even though the Host is s3.amazonaws.com (in which case it normally shouldn't count). Yeah, I know, it makes
		// no sense!!!
		if (!$regionalHostname && ($headers['Host'] == 's3.amazonaws.com')
		    && (substr($canonicalURI, -10) == '/?location'))
		{
			$regionalHostname = true;
		}

		if (!$regionalHostname && (strpos($canonicalURI, $bucketResource) === 0 || strpos($canonicalURI, substr($bucketResource, 0, -1)) === 0))
		{
			if ($canonicalURI === substr($bucketResource, 0, -1))
			{
				$canonicalURI = '/';
			}
			else
			{
				$canonicalURI = substr($canonicalURI, strlen($bucketResource) - 1);
			}
		}

		// If the resource path has a query yank it and parse it into the parameters array
		$questionMarkPos = strpos($canonicalURI, '?');

		if ($questionMarkPos !== false)
		{
			$canonicalURI = substr($canonicalURI, 0, $questionMarkPos);
			$queryString  = @substr($canonicalURI, $questionMarkPos + 1);
			@parse_str($queryString, $extraQuery);

			if (count($extraQuery))
			{
				$parameters = array_merge($parameters, $extraQuery);
			}
		}

		// The canonical query string is the string representation of $parameters, alpha sorted by key
		ksort($parameters);

		// We build the query the hard way because http_build_query in PHP 5.3 does NOT have the fourth parameter
		// (encoding type), defaulting to RFC 1738 encoding whereas S3 expects RFC 3986 encoding
		$canonicalQueryString = '';

		if (!empty($parameters))
		{
			$temp = [];

			foreach ($parameters as $k => $v)
			{
				$temp[] = $this->urlencode($k) . '=' . $this->urlencode($v);
			}

			$canonicalQueryString = implode('&', $temp);
		}

		// Get the payload hash
		$requestPayloadHash = 'UNSIGNED-PAYLOAD';

		if (isset($amzHeaders['x-amz-content-sha256']))
		{
			$requestPayloadHash = $amzHeaders['x-amz-content-sha256'];
		}

		// Calculate the canonical request
		$canonicalRequest = $verb . "\n" .
		                    $canonicalURI . "\n" .
		                    $canonicalQueryString . "\n" .
		                    $canonicalHeaders . "\n" .
		                    $signedHeaders . "\n" .
		                    $requestPayloadHash;

		$hashedCanonicalRequest = hash('sha256', $canonicalRequest);

		// ========== Step 2: Create a string to sign ==========
		// See http://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html

		if (!isset($headers['Date']))
		{
			$headers['Date'] = '';
		}

		/**
		 * The Date in the String-to-Sign is a messy situation.
		 *
		 * Amazon's documentation says it must be in ISO 8601 format: `Ymd\THis\Z`. Unfortunately, Amazon's
		 * documentation is actually wrong :troll_face: The actual Amazon S3 service expects the date to be formatted as
		 * per RFC1123.
		 *
		 * Most third party implementations have caught up to the fact that Amazon has documented the v4 signatures
		 * wrongly (naughty AWS!) and accept either format.
		 *
		 * Some other third party implementations, which never bothered to validate their implementations against Amazon
		 * S3 proper, only expect what Amazon has documented as "ISO 8601". Therefore, we detect third party services
		 * and switch to the as-documented date format.
		 *
		 * Some other third party services, like Wasabi, are broken in yet a different way. They will only use the date
		 * from the x-amz-date header, WITHOUT falling back to the Date header if the former is not present. This is
		 * the opposite of Amazon S3 proper which does expect the Date header. That's why the Request class sets both
		 * headers if the request is made to a service _other_ than Amazon S3 proper.
		 */
		$dateToSignFor = strpos($headers['Host'], '.amazonaws.com') !== false
			? (($headers['Date'] ?? null) ?: ($amzHeaders['x-amz-date'] ?? null) ?: $signatureDate->format('Ymd\THis\Z'))
			: $signatureDate->format('Ymd\THis\Z');

		$stringToSign = "AWS4-HMAC-SHA256\n" .
		                $dateToSignFor . "\n" .
		                $credentialScope . "\n" .
		                $hashedCanonicalRequest;

		if ($isPresignedURL)
		{
			$stringToSign = "AWS4-HMAC-SHA256\n" .
			                $parameters['X-Amz-Date'] . "\n" .
			                $credentialScope . "\n" .
			                $hashedCanonicalRequest;
		}

		// ========== Step 3: Calculate the signature ==========
		// See http://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
		$kSigning = $this->getSigningKey($signatureDate);

		$signature = hash_hmac('sha256', $stringToSign, $kSigning, false);

		// ========== Step 4: Add the signing information to the Request ==========
		// See http://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html

		$authorization = 'AWS4-HMAC-SHA256 Credential=' .
		                 $this->request->getConfiguration()->getAccess() . '/' . $credentialScope . ', ' .
		                 'SignedHeaders=' . $signedHeaders . ', ' .
		                 'Signature=' . $signature;

		// For presigned URLs we only return the Base64-encoded signature without the AWS format specifier and the
		// public access key.
		if ($isPresignedURL)
		{
			$parameters['X-Amz-Signature'] = $signature;

			return serialize($parameters);
		}

		return $authorization;
	}

	/**
	 * Calculate the AWS4 signing key
	 *
	 * @param   DateTime  $signatureDate  The date the signing key is good for
	 *
	 * @return  string
	 */
	private function getSigningKey(DateTime $signatureDate): string
	{
		$kSecret  = $this->request->getConfiguration()->getSecret();
		$kDate    = hash_hmac('sha256', $signatureDate->format('Ymd'), 'AWS4' . $kSecret, true);
		$kRegion  = hash_hmac('sha256', $this->request->getConfiguration()->getRegion(), $kDate, true);
		$kService = hash_hmac('sha256', 's3', $kRegion, true);
		$kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);

		return $kSigning;
	}

	private function urlencode(?string $toEncode): string
	{
		return empty($toEncode) ? '' : rawurlencode($toEncode);
	}

	/**
	 * Get the correct hostname for the given AWS region
	 *
	 * @param   string  $region
	 *
	 * @return  string
	 */
	private function getPresignedHostnameForRegion(string $region): string
	{
		$config   = $this->request->getConfiguration();
		$endpoint = $config->getEndpoint();

		if (empty($endpoint))
		{
			$endpoint = 's3.' . $region . '.amazonaws.com';
		}

		// As of October 2023, AWS does not consider DualStack signed URLs as valid. Whatever.
		$dualstackEnabled = false && $this->request->getConfiguration()->getDualstackUrl();

		// If dual-stack URLs are enabled then prepend the endpoint
		if ($dualstackEnabled)
		{
			$endpoint = 's3.dualstack.' . $region . '.amazonaws.com';
		}

		if ($region == 'cn-north-1')
		{
			return $endpoint . '.cn';
		}

		return $endpoint;
	}

	/**
	 * Is this a valid bucket name?
	 *
	 * @param   string  $bucketName   The bucket name to check
	 * @param   bool    $asSubdomain  Should I put additional restrictions for use as a subdomain?
	 *
	 * @return  bool
	 * @since   2.3.1
	 *
	 * @see     https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
	 */
	private function isValidBucketName(string $bucketName, bool $asSubdomain = true): bool
	{
		/**
		 * If there are dots in the bucket name I can't use it as a subdomain.
		 *
		 * "If you include dots in a bucket's name, you can't use virtual-host-style addressing over HTTPS, unless you
		 * perform your own certificate validation. This is because the security certificates used for virtual hosting
		 * of buckets don't work for buckets with dots in their names."
		 */
		if ($asSubdomain && strpos($bucketName, '.') !== false)
		{
			return false;
		}

		/**
		 * - Bucket names must be between 3 (min) and 63 (max) characters long.
		 * - Bucket names can consist only of lowercase letters, numbers, dots (.), and hyphens (-).
		 */
		if (!preg_match('/^[a-z0-9\-.]{3,63}$/', $bucketName))
		{
			return false;
		}

		// Bucket names must begin and end with a letter or number.
		if (!preg_match('/^[a-z0-9].*[a-z0-9]$/', $bucketName))
		{
			return false;
		}

		// Bucket names must not contain two adjacent periods.
		if (preg_match('/\.\./', $bucketName))
		{
			return false;
		}

		// Bucket names must not be formatted as an IP address (for example, 192.168.5.4).
		if (preg_match('/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/', $bucketName))
		{
			return false;
		}

		// Bucket names must not start with the prefix xn--.
		if (strpos($bucketName, 'xn--') === 0)
		{
			return false;
		}

		// Bucket names must not start with the prefix sthree- and the prefix sthree-configurator.
		if (strpos($bucketName, 'sthree-') === 0)
		{
			return false;
		}

		// Bucket names must not end with the suffix -s3alias.
		if (substr($bucketName, -8) === '-s3alias')
		{
			return false;
		}

		// Bucket names must not end with the suffix --ol-s3.
		if (substr($bucketName, -7) === '--ol-s3')
		{
			return false;
		}

		return true;
	}
}
