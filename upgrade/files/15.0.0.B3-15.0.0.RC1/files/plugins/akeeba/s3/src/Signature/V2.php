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

/**
 * Implements the Amazon AWS v2 signatures
 *
 * @see http://docs.aws.amazon.com/AmazonS3/latest/dev/RESTAuthentication.html
 */
class V2 extends Signature
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
		// No pre-processing required for V2 signatures
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

		$expires = time() + $lifetime;
		$this->request->setHeader('Expires', $expires);

		$bucket    = $this->request->getBucket();
		$uri       = $this->request->getResource();
		$headers   = $this->request->getHeaders();
		$accessKey = $this->request->getConfiguration()->getAccess();
		$protocol  = $https ? 'https' : 'http';
		$signature = $this->getAuthorizationHeader();

		// NOTE: Pre-signed URLs are always generated through Connector::getAuthenticatedURL(), which forces path-style
		// access. Therefore $uri (the request resource) already starts with "/{bucket}" and matches the resource that
		// getAuthorizationHeader() signed. We must NOT add the bucket to the path again, or the URL path will not match
		// the signature and the request will be rejected with a 403 SignatureDoesNotMatch.

		$queryParameters = array_merge($this->request->getParameters(), [
			'AWSAccessKeyId' => $accessKey,
			'Expires'        => sprintf('%u', $expires),
			'Signature'      => $signature,
		]);

		$query = http_build_query($queryParameters);

		// fix authenticated url for Google Cloud Storage - https://cloud.google.com/storage/docs/access-control/create-signed-urls-program
		if ($this->request->getConfiguration()->getEndpoint() === "storage.googleapis.com")
		{
			// replace host with endpoint
			$headers['Host'] = 'storage.googleapis.com';
			// replace "AWSAccessKeyId" with "GoogleAccessId"
			$query = str_replace('AWSAccessKeyId', 'GoogleAccessId', $query);
			// NOTE: the bucket is NOT added to the path here. $uri already begins with "/{bucket}" (see the note above),
			// so prepending it again would produce "/{bucket}/{bucket}/..." which no longer matches the signed resource
			// and Google Cloud Storage rejects it with 403 SignatureDoesNotMatch.
		}

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

		$amz       = [];
		$amzString = '';

		// Collect AMZ headers for signature
		foreach ($amzHeaders as $header => $value)
		{
			if (strlen($value) > 0)
			{
				$amz[] = strtolower($header) . ':' . $value;
			}
		}

		// AMZ headers must be sorted and sent as separate lines
		if (count($amz) > 0)
		{
			sort($amz);
			$amzString = "\n" . implode("\n", $amz);
		}

		// If the Expires query string parameter is set up we're pre-signing a download URL. The string to sign is a bit
		// different in this case; it does not include the Date, it includes the Expires.
		// See http://docs.aws.amazon.com/AmazonS3/latest/dev/RESTAuthentication.html#RESTAuthenticationQueryStringAuth
		if (isset($headers['Expires']))
		{
			if (isset($headers['Date']))
			{
				$headers['Date'] = $headers['Expires'];
			}
			else
			{
				$amzHeaders['x-amz-date'] = $headers['Expires'];
			}

			unset ($headers['Expires']);

			$isPresignedURL = true;
		}

		/**
		 * The resource path in S3 V2 signatures must ALWAYS contain the bucket name if a bucket is defined, even if we
		 * are not using path-style access to the resource
		 */
		if (!empty($bucket) && !$this->request->getConfiguration()->getUseLegacyPathStyle())
		{
			$resourcePath = '/' . $bucket . $resourcePath;
		}

		$stringToSign = $verb . "\n" .
			($headers['Content-MD5'] ?? '') . "\n" .
			($headers['Content-Type'] ?? '') . "\n" .
			($headers['Date'] ?? '') .
			$amzString . "\n" .
			$resourcePath;

		// CloudFront only requires a date to be signed
		if ($headers['Host'] == 'cloudfront.amazonaws.com')
		{
			$stringToSign = $headers['Date'] ?? $amzHeaders['x-amz-date'] ?? '';
		}

		$amazonV2Hash = $this->amazonV2Hash($stringToSign);

		// For presigned URLs we only return the Base64-encoded signature without the AWS format specifier and the
		// public access key.
		if ($isPresignedURL)
		{
			return $amazonV2Hash;
		}

		return 'AWS ' .
			$this->request->getConfiguration()->getAccess() . ':' .
			$amazonV2Hash;
	}

	/**
	 * Creates a HMAC-SHA1 hash. Uses the hash extension if present, otherwise falls back to slower, manual calculation.
	 *
	 * @param   string  $stringToSign  String to sign
	 *
	 * @return  string
	 */
	private function amazonV2Hash(string $stringToSign): string
	{
		$secret = $this->request->getConfiguration()->getSecret();

		if (extension_loaded('hash'))
		{
			$raw = hash_hmac('sha1', $stringToSign, $secret, true);

			return base64_encode($raw);
		}

		$raw = pack('H*', sha1(
				(str_pad($secret, 64, chr(0x00)) ^ (str_repeat(chr(0x5c), 64))) .
				pack('H*', sha1(
						(str_pad($secret, 64, chr(0x00)) ^ (str_repeat(chr(0x36), 64))) . $stringToSign
					)
				)
			)
		);

		return base64_encode($raw);
	}

}
