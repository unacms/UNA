<?php
/**
 * Akeeba Engine
 *
 * @package   akeebaengine
 * @copyright Copyright (c)2006-2026 Nicholas K. Dionysopoulos / Akeeba Ltd
 * @license   GNU General Public License version 3, or later
 */

namespace Akeeba\S3;

// Protection against direct access
defined('AKEEBAENGINE') || die();

/**
 * Holds the Amazon S3 confiugration credentials
 */
class Configuration
{
	/**
	 * Access Key
	 *
	 * @var  string
	 */
	protected $access = '';

	/**
	 * Secret Key
	 *
	 * @var  string
	 */
	protected $secret = '';

	/**
	 * Security token. This is only required with temporary credentials provisioned by an EC2 instance.
	 *
	 * @var  string
	 */
	protected $token = '';

	/**
	 * Signature calculation method ('v2' or 'v4')
	 *
	 * @var  string
	 */
	protected $signatureMethod = 'v2';

	/**
	 * AWS region, used for v4 signatures
	 *
	 * @var  string
	 */
	protected $region = 'us-east-1';

	/**
	 * Should I use SSL (HTTPS) to communicate to Amazon S3?
	 *
	 * @var  bool
	 */
	protected $useSSL = true;

	/**
	 * Should I use SSL (HTTPS) to communicate to Amazon S3?
	 *
	 * @var  bool
	 */
	protected $useDualstackUrl = false;

	/**
	 * Should I use legacy, path-style access to the bucket? When it's turned off (default) we use virtual hosting style
	 * paths which are RECOMMENDED BY AMAZON per http://docs.aws.amazon.com/AmazonS3/latest/API/APIRest.html
	 *
	 * @var  bool
	 */
	protected $useLegacyPathStyle = false;

	/**
	 * Amazon S3 endpoint. You can use a custom endpoint with v2 signatures to access third party services which offer
	 * S3 compatibility, e.g. OwnCloud, Google Storage etc.
	 *
	 * @var  string
	 */
	protected $endpoint = 's3.amazonaws.com';

	/**
	 * Should I use an alternative date header format (D, d M Y H:i:s T instead of D, d M Y H:i:s O) for non-Amazon,
	 * S3-compatible services?
	 *
	 * This is enabled by default.
	 *
	 * @var  bool
	 */
	protected $alternateDateHeaderFormat = true;

	/**
	 * Should I use the standard HTTP Date header instead of the X-Amz-Date header?
	 *
	 * @var  bool
	 */
	protected $useHTTPDateHeader = false;

	/**
	 * Should pre-signed URLs include the bucket name in the URL? Only applies to v4 signatures.
	 *
	 * Amazon S3 and most implementations need this turned off (default). LocalStack seems to not work properly with the
	 * bucket name as a subdomain, hence the need for this flag.
	 *
	 * @var  bool
	 */
	protected $preSignedBucketInURL = false;

	/**
	 * Maximum time, in seconds, to wait while trying to establish the connection to the S3 endpoint. A value of 0
	 * (default) means no explicit limit, i.e. cURL's own default is used.
	 *
	 * @var  int
	 */
	protected $connectTimeout = 0;

	/**
	 * Maximum time, in seconds, allowed for the entire request to complete. A value of 0 (default) means no explicit
	 * limit, i.e. the request is allowed to run for as long as it takes.
	 *
	 * @var  int
	 */
	protected $requestTimeout = 0;

	/**
	 * Public constructor
	 *
	 * @param   string  $access           Amazon S3 Access Key
	 * @param   string  $secret           Amazon S3 Secret Key
	 * @param   string  $signatureMethod  Signature method (v2 or v4)
	 * @param   string  $region           Region, only required for v4 signatures
	 */
	function __construct(string $access, string $secret, string $signatureMethod = 'v2', string $region = '')
	{
		$this->setAccess($access);
		$this->setSecret($secret);
		$this->setSignatureMethod($signatureMethod);
		$this->setRegion($region);
	}

	/**
	 * Get the Amazon access key
	 *
	 * @return  string
	 */
	public function getAccess(): string
	{
		return $this->access;
	}

	/**
	 * Set the Amazon access key
	 *
	 * @param   string  $access  The access key to set
	 *
	 * @throws  Exception\InvalidAccessKey
	 */
	public function setAccess(string $access): void
	{
		if (empty($access))
		{
			throw new Exception\InvalidAccessKey;
		}

		$this->access = $access;
	}

	/**
	 * Get the Amazon secret key
	 *
	 * @return string
	 */
	public function getSecret(): string
	{
		return $this->secret;
	}

	/**
	 * Set the Amazon secret key
	 *
	 * @param   string  $secret  The secret key to set
	 *
	 * @throws  Exception\InvalidSecretKey
	 */
	public function setSecret(string $secret): void
	{
		if (empty($secret))
		{
			throw new Exception\InvalidSecretKey;
		}

		$this->secret = $secret;
	}

	/**
	 * Return the security token. Only for temporary credentials provisioned through an EC2 instance.
	 *
	 * @return  string
	 */
	public function getToken(): string
	{
		return $this->token;
	}

	/**
	 * Set the security token. Only for temporary credentials provisioned through an EC2 instance.
	 *
	 * @param   string  $token
	 */
	public function setToken(string $token): void
	{
		$this->token = $token;
	}

	/**
	 * Get the signature method to use
	 *
	 * @return  string
	 */
	public function getSignatureMethod(): string
	{
		return $this->signatureMethod;
	}

	/**
	 * Set the signature method to use
	 *
	 * @param   string  $signatureMethod  One of v2 or v4
	 *
	 * @throws  Exception\InvalidSignatureMethod
	 */
	public function setSignatureMethod(string $signatureMethod): void
	{
		$signatureMethod = strtolower($signatureMethod);
		$signatureMethod = trim($signatureMethod);

		if (!in_array($signatureMethod, ['v2', 'v4']))
		{
			throw new Exception\InvalidSignatureMethod;
		}

		$this->signatureMethod = $signatureMethod;

		// If you switch to v2 signatures we unset the region.
		if ($signatureMethod == 'v2')
		{
			$this->setRegion('');

			/**
			 * If we are using Amazon S3 proper (not a custom endpoint) we have to set path style access to false.
			 * Amazon S3 does not support v2 signatures with path style access at all (it returns an error telling
			 * us to use the virtual hosting endpoint BUCKETNAME.s3.amazonaws.com).
			 */
			if (strpos($this->endpoint, 'amazonaws.com') !== false)
			{
				$this->setUseLegacyPathStyle(false);
			}

		}
	}

	/**
	 * Get the Amazon S3 region
	 *
	 * @return  string
	 */
	public function getRegion(): string
	{
		return $this->region;
	}

	/**
	 * Set the Amazon S3 region
	 *
	 * @param   string  $region
	 */
	public function setRegion(string $region): void
	{
		/**
		 * You can only leave the region empty if you're using v2 signatures. Anything else gets you an exception.
		 */
		if (empty($region) && ($this->signatureMethod == 'v4'))
		{
			throw new Exception\InvalidRegion;
		}

		/**
		 * Setting a Chinese-looking region force-changes the endpoint but ONLY if you were using the original Amazon S3
		 * endpoint. If you're using a custom endpoint and provide a region with 'cn-' in its name we don't override
		 * your custom endpoint.
		 */
		if (($this->endpoint == 's3.amazonaws.com') && (substr($region, 0, 3) == 'cn-'))
		{
			$this->setEndpoint('amazonaws.com.cn');
		}

		$this->region = $region;
	}

	/**
	 * Is the connection to be made over HTTPS?
	 *
	 * @return  bool
	 */
	public function isSSL(): bool
	{
		return $this->useSSL;
	}

	/**
	 * Set the connection SSL preference
	 *
	 * @param   bool  $useSSL  True to use HTTPS
	 */
	public function setSSL(bool $useSSL): void
	{
		$this->useSSL = $useSSL ? true : false;
	}

	/**
	 * Get the Amazon S3 endpoint
	 *
	 * @return  string
	 */
	public function getEndpoint(): string
	{
		return $this->endpoint;
	}

	/**
	 * Set the Amazon S3 endpoint. Do NOT use a protocol
	 *
	 * @param   string  $endpoint  Custom endpoint, e.g. 's3.example.com' or 'www.example.com/s3api'
	 */
	public function setEndpoint(string $endpoint): void
	{
		if (stristr($endpoint, '://'))
		{
			throw new Exception\InvalidEndpoint;
		}

		/**
		 * If you set a custom endpoint we have to switch to v2 signatures since our v4 implementation only supports
		 * Amazon endpoints.
		 */
		if ((strpos($endpoint, 'amazonaws.com') === false))
		{
			$this->setSignatureMethod('v2');
		}

		$this->endpoint = $endpoint;
	}

	/**
	 * Should I use legacy, path-style access to the bucket? You should only use it with custom endpoints. Amazon itself
	 * is currently deprecating support for path-style access but has extended the migration date to an unknown
	 * time https://aws.amazon.com/blogs/aws/amazon-s3-path-deprecation-plan-the-rest-of-the-story/
	 *
	 * @return  bool
	 */
	public function getUseLegacyPathStyle(): bool
	{
		return $this->useLegacyPathStyle;
	}

	/**
	 * Set the flag for using legacy, path-style access to the bucket
	 *
	 * @param   bool  $useLegacyPathStyle
	 */
	public function setUseLegacyPathStyle(bool $useLegacyPathStyle): void
	{
		$this->useLegacyPathStyle = $useLegacyPathStyle;

		/**
		 * If we are using Amazon S3 proper (not a custom endpoint) we have to set path style access to false.
		 * Amazon S3 does not support v2 signatures with path style access at all (it returns an error telling
		 * us to use the virtual hosting endpoint BUCKETNAME.s3.amazonaws.com).
		 */
		if ((strpos($this->endpoint, 'amazonaws.com') !== false) && ($this->signatureMethod == 'v2'))
		{
			$this->useLegacyPathStyle = false;
		}
	}

	/**
	 * Should we use the dualstack URL (which will ship traffic over ipv6 in most cases). For more information on these
	 * endpoints please read https://docs.aws.amazon.com/AmazonS3/latest/dev/dual-stack-endpoints.html
	 *
	 * @return  bool
	 */
	public function getDualstackUrl(): bool
	{
		return $this->useDualstackUrl;
	}

	/**
	 * Set the flag for using legacy, path-style access to the bucket
	 *
	 * @param   bool  $useDualstackUrl
	 */
	public function setUseDualstackUrl(bool $useDualstackUrl): void
	{
		$this->useDualstackUrl = $useDualstackUrl;
	}

	/**
	 * Get the flag for using an alternate date format for non-Amazon, S3-compatible services.
	 *
	 * @return bool
	 */
	public function getAlternateDateHeaderFormat(): bool
	{
		return $this->alternateDateHeaderFormat;
	}

	/**
	 * Set the flag for using an alternate date format for non-Amazon, S3-compatible services.
	 *
	 * @param   bool  $alternateDateHeaderFormat
	 *
	 * @return  void
	 */
	public function setAlternateDateHeaderFormat(bool $alternateDateHeaderFormat): void
	{
		$this->alternateDateHeaderFormat = $alternateDateHeaderFormat;
	}

	/**
	 * Get the flag indicating whether to use the HTTP Date header
	 *
	 * @return  bool  Flag indicating whether to use the HTTP Date header
	 */
	public function getUseHTTPDateHeader(): bool
	{
		return $this->useHTTPDateHeader;
	}

	/**
	 * Set the flag indicating whether to use the HTTP Date header.
	 *
	 * @param   bool  $useHTTPDateHeader  Whether to use the HTTP Date header
	 *
	 * @return  void
	 */
	public function setUseHTTPDateHeader(bool $useHTTPDateHeader): void
	{
		$this->useHTTPDateHeader = $useHTTPDateHeader;
	}

	public function getPreSignedBucketInURL(): bool
	{
		return $this->preSignedBucketInURL;
	}

	public function setPreSignedBucketInURL(bool $preSignedBucketInURL): void
	{
		$this->preSignedBucketInURL = $preSignedBucketInURL;
	}

	/**
	 * Get the maximum time, in seconds, to wait while establishing the connection to the S3 endpoint.
	 *
	 * @return  int  Timeout in seconds; 0 means no explicit limit.
	 */
	public function getConnectTimeout(): int
	{
		return $this->connectTimeout;
	}

	/**
	 * Set the maximum time, in seconds, to wait while establishing the connection to the S3 endpoint.
	 *
	 * @param   int  $connectTimeout  Timeout in seconds; 0 (or any negative value, which is clamped to 0) means no
	 *                                explicit limit.
	 *
	 * @return  void
	 */
	public function setConnectTimeout(int $connectTimeout): void
	{
		$this->connectTimeout = max(0, $connectTimeout);
	}

	/**
	 * Get the maximum time, in seconds, allowed for the entire request to complete.
	 *
	 * @return  int  Timeout in seconds; 0 means no explicit limit.
	 */
	public function getRequestTimeout(): int
	{
		return $this->requestTimeout;
	}

	/**
	 * Set the maximum time, in seconds, allowed for the entire request to complete.
	 *
	 * @param   int  $requestTimeout  Timeout in seconds; 0 (or any negative value, which is clamped to 0) means no
	 *                                explicit limit.
	 *
	 * @return  void
	 */
	public function setRequestTimeout(int $requestTimeout): void
	{
		$this->requestTimeout = max(0, $requestTimeout);
	}
}
