<?php
/**
 * Akeeba Engine
 *
 * @package   akeebaengine
 * @copyright Copyright (c)2006-2026 Nicholas K. Dionysopoulos / Akeeba Ltd
 * @license   GNU General Public License version 3, or later
 */

namespace Akeeba\S3;

use Akeeba\S3\Response\Error;

// Protection against direct access
defined('AKEEBAENGINE') || die();


class Request
{
	/**
	 * The HTTP verb to use
	 *
	 * @var  string
	 */
	private $verb = 'GET';

	/**
	 * The bucket we are using
	 *
	 * @var  string
	 */
	private $bucket = '';

	/**
	 * The object URI, relative to the bucket's root
	 *
	 * @var  string
	 */
	private $uri = '';

	/**
	 * The remote resource we are querying
	 *
	 * @var  string
	 */
	private $resource = '';

	/**
	 * Query string parameters
	 *
	 * @var  array
	 */
	private $parameters = [];

	/**
	 * Amazon-specific headers to pass to the request
	 *
	 * @var  array
	 */
	private $amzHeaders = [];

	/**
	 * Regular HTTP headers to send in the request
	 *
	 * @var  array
	 */
	private $headers = [
		'Host'         => '',
		'Date'         => '',
		'Content-MD5'  => '',
		'Content-Type' => '',
	];

	/**
	 * Input data for the request
	 *
	 * @var  Input
	 */
	private $input = null;

	/**
	 * The file resource we are writing data to
	 *
	 * @var  resource|null
	 */
	private $fp = null;

	/**
	 * The Amazon S3 configuration object
	 *
	 * @var Configuration
	 */
	private $configuration = null;

	/**
	 * The response object
	 *
	 * @var  Response
	 */
	private $response = null;

	/**
	 * The location of the CA certificate cache. It can be a file or a directory. If it's not specified, the location
	 * set in AKEEBA_CACERT_PEM will be used
	 *
	 * @var  string|null
	 */
	private $caCertLocation = null;

	/**
	 * Constructor
	 *
	 * @param   string         $verb           HTTP verb, e.g. 'POST'
	 * @param   string         $bucket         Bucket name, e.g. 'example-bucket'
	 * @param   string         $uri            Object URI
	 * @param   Configuration  $configuration  The Amazon S3 configuration object to use
	 *
	 * @return  void
	 */
	function __construct(string $verb, string $bucket, string $uri, Configuration $configuration)
	{
		$this->verb          = $verb;
		$this->bucket        = $bucket;
		$this->uri           = '/';
		$this->configuration = $configuration;

		if (!empty($uri))
		{
			$this->uri = '/' . str_replace('%2F', '/', rawurlencode($uri));
		}

		$this->headers['Host'] = $this->getHostName($configuration, $this->bucket);
		$this->resource        = $this->uri;

		if (($this->bucket !== '') && $configuration->getUseLegacyPathStyle())
		{
			$this->resource = '/' . $this->bucket . $this->uri;

			$this->uri = $this->resource;
		}

		// The date must always be added as a header
		$this->headers['Date'] = gmdate('D, d M Y H:i:s O');

		// S3-"compatible" services use a different date format. Because why not?
		if ($this->configuration->getAlternateDateHeaderFormat() && strpos($this->headers['Host'], '.amazonaws.com') === false)
		{
			$this->headers['Date'] = gmdate('D, d M Y H:i:s T');
		}

		// If there is a security token we need to set up the X-Amz-Security-Token header
		$token = $this->configuration->getToken();

		if (!empty($token))
		{
			$this->setAmzHeader('x-amz-security-token', $token);
		}

		// Initialize the response object
		$this->response = new Response();
	}

	/**
	 * Get the input object
	 *
	 * @return  Input|null
	 */
	public function getInput(): ?Input
	{
		return $this->input;
	}

	/**
	 * Set the input object
	 *
	 * @param   Input  $input
	 *
	 * @return  void
	 */
	public function setInput(Input $input): void
	{
		$this->input = $input;
	}

	/**
	 * Set a request parameter
	 *
	 * @param   string       $key    The parameter name
	 * @param   string|null  $value  The parameter value
	 *
	 * @return  void
	 */
	public function setParameter(string $key, ?string $value): void
	{
		$this->parameters[$key] = $value;
	}

	/**
	 * Set a request header
	 *
	 * @param   string  $key    The header name
	 * @param   string  $value  The header value
	 *
	 * @return  void
	 */
	public function setHeader(string $key, string $value): void
	{
		$this->headers[$key] = $value;
	}

	/**
	 * Set an x-amz-meta-* header
	 *
	 * @param   string  $key    The header name
	 * @param   string  $value  The header value
	 *
	 * @return  void
	 */
	public function setAmzHeader(string $key, string $value): void
	{
		$this->amzHeaders[$key] = $value;
	}

	/**
	 * Get the HTTP verb of this request
	 *
	 * @return  string
	 */
	public function getVerb(): string
	{
		return $this->verb;
	}

	/**
	 * Get the S3 bucket's name
	 *
	 * @return  string
	 */
	public function getBucket(): string
	{
		return $this->bucket;
	}

	/**
	 * Get the absolute URI of the resource we're accessing
	 *
	 * @return  string
	 */
	public function getResource(): string
	{
		return $this->resource;
	}

	/**
	 * Get the parameters array
	 *
	 * @return  array
	 */
	public function getParameters(): array
	{
		return $this->parameters;
	}

	/**
	 * Get the Amazon headers array
	 *
	 * @return  array
	 */
	public function getAmzHeaders(): array
	{
		return $this->amzHeaders;
	}

	/**
	 * Get the other headers array
	 *
	 * @return  array
	 */
	public function getHeaders(): array
	{
		return $this->headers;
	}

	/**
	 * Get a reference to the Amazon configuration object
	 *
	 * @return  Configuration
	 */
	public function getConfiguration(): Configuration
	{
		return $this->configuration;
	}

	/**
	 * Get the file pointer resource (for PUT and POST requests)
	 *
	 * @return  resource|null
	 */
	public function &getFp()
	{
		return $this->fp;
	}

	/**
	 * Set the data resource as a file pointer
	 *
	 * @param   resource  $fp
	 */
	public function setFp($fp): void
	{
		$this->fp = $fp;
	}

	/**
	 * Get the certificate authority location
	 *
	 * @return  string|null
	 */
	public function getCaCertLocation(): ?string
	{
		if (!empty($this->caCertLocation))
		{
			return $this->caCertLocation;
		}

		if (defined('AKEEBA_CACERT_PEM'))
		{
			return AKEEBA_CACERT_PEM;
		}

		return null;
	}

	/**
	 * @param   null|string  $caCertLocation
	 */
	public function setCaCertLocation(?string $caCertLocation): void
	{
		if (empty($caCertLocation))
		{
			$caCertLocation = null;
		}

		if (!is_null($caCertLocation) && !is_file($caCertLocation) && !is_dir($caCertLocation))
		{
			$caCertLocation = null;
		}

		$this->caCertLocation = $caCertLocation;
	}

	/**
	 * Get a pre-signed URL for the request.
	 *
	 * Typically used to pre-sign GET requests to objects, i.e. give shareable pre-authorized URLs for downloading
	 * private or otherwise inaccessible files from S3.
	 *
	 * @param   int|null  $lifetime  Lifetime in seconds
	 * @param   bool      $https     Use HTTPS ($hostBucket should be false for SSL verification)?
	 *
	 * @return  string  The authenticated URL, complete with signature
	 */
	public function getAuthenticatedURL(?int $lifetime = null, bool $https = false): string
	{
		$this->processParametersIntoResource();
		$signer = Signature::getSignatureObject($this, $this->configuration->getSignatureMethod());

		return $signer->getAuthenticatedURL($lifetime, $https);
	}

	/**
	 * Get the S3 response
	 *
	 * @return  Response
	 */
	public function getResponse(bool $rawResponse = false): Response
	{
		$this->processParametersIntoResource();

		$schema = 'http://';

		if ($this->configuration->isSSL())
		{
			$schema = 'https://';
		}

		// Very special case. IF the URI ends in /?location AND the region is us-east-1 (Host is
		// s3-external-1.amazonaws.com) THEN the host MUST become s3.amazonaws.com for the request to work. This is case
		// of us not knowing the region of the bucket, therefore having to use a special endpoint which lets us query
		// the region of the bucket without knowing its region. See
		// http://stackoverflow.com/questions/27091816/retrieve-buckets-objects-without-knowing-buckets-region-with-aws-s3-rest-api
		if ((substr($this->uri, -10) == '/?location') && ($this->headers['Host'] == 's3-external-1.amazonaws.com'))
		{
			$this->headers['Host'] = 's3.amazonaws.com';
		}

		$url = $schema . $this->headers['Host'] . $this->uri;

		// Basic setup
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_USERAGENT, 'AkeebaBackupProfessional/S3PostProcessor');

		// Apply the optional connection and request timeouts. A value of 0 means "no explicit limit".
		$connectTimeout = $this->configuration->getConnectTimeout();
		$requestTimeout = $this->configuration->getRequestTimeout();

		if ($connectTimeout > 0)
		{
			curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, $connectTimeout);
		}

		if ($requestTimeout > 0)
		{
			curl_setopt($curl, CURLOPT_TIMEOUT, $requestTimeout);
		}

		if ($this->configuration->isSSL())
		{
			// Set the CA certificate cache location
			$caCert = $this->getCaCertLocation();

			if (!empty($caCert))
			{
				if (is_dir($caCert))
				{
					@curl_setopt($curl, CURLOPT_CAPATH, $caCert);
				}
				else
				{
					@curl_setopt($curl, CURLOPT_CAINFO, $caCert);
				}
			}

			/**
			 * Verify the host name in the certificate and the certificate itself.
			 *
			 * Caveat: if your bucket contains dots in the name we have to turn off host verification due to the way the
			 * S3 SSL certificates are set up.
			 */
			$isAmazonS3  = (substr($this->headers['Host'], -14) == '.amazonaws.com')
			               || substr(
				                  $this->headers['Host'], -16
			                  ) == 'amazonaws.com.cn';
			$tooManyDots = substr_count($this->headers['Host'], '.') > 4;

			$verifyHost = ($isAmazonS3 && $tooManyDots) ? 0 : 2;

			curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, $verifyHost);
			curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, true);
		}

		curl_setopt($curl, CURLOPT_URL, $url);

		/**
		 * Set the optional x-amz-date header instead of the standard HTTP Date header.
		 *
		 * Amazon S3 proper expects to get the date from the Date header. It also allows you to instead use the optional
		 * X-Amz-Date header as a means to resolve situations where your HTTP library does not let you control the
		 * standard Date header. In other words, it accepts both, it encourages the standard Date header, but it will
		 * give priority to the X-Amz-Date header to help you get out of a sticky situation.
		 *
		 * Unfortunately, third party services which claim to be "S3-compatible" are written by people with poor reading
		 * skills or, more likely, under unrealistic time constraints to deliver working code. They are implementing the
		 * date handling behaviout wrong. Instead of using the Date header unless the X-Amz-Date header is set, they
		 * **expect** to only ever see the X-Amz-Date header. If it's missing, they do not fall back to the standard
		 * Date header; they just spit out a message about the signature being wrong. Wasabi and ExoScale are two prime
		 * examples of that, and only when using v2 signatures.
		 *
		 * To avoid this problem, we are now defaulting to always using the X-Amz-Date header everywhere. If you want to
		 * revert to using the Date header with S3 proper please use setUseHTTPDateHeader(true) to your configuration
		 * object. In this case DO NOT set the X-Amz-Date header yourself, or you're going to have a *really* bad time.
		 */
		if (!$this->configuration->getUseHTTPDateHeader())
		{
			$this->amzHeaders['x-amz-date'] = (new \DateTime($this->headers['Date']))->format('Ymd\THis\Z');

			unset ($this->headers['Date']);
		}

		/**
		 * Remove empty headers.
		 *
		 * While Amazon S3 proper and most third party implementations have no problem with that, there a few of them
		 * (such as Synology C2) which choke on empty headers.
		 */
		$this->headers = array_filter($this->headers);

		// Get the request signature
		$signer = Signature::getSignatureObject($this, $this->configuration->getSignatureMethod());
		$signer->preProcessHeaders($this->headers, $this->amzHeaders);

		// Headers
		$headers = [];

		foreach ($this->amzHeaders as $header => $value)
		{
			if (strlen($value) > 0)
			{
				$headers[] = $header . ': ' . $value;
			}
		}

		foreach ($this->headers as $header => $value)
		{
			if (strlen($value) > 0)
			{
				$headers[] = $header . ': ' . $value;
			}
		}

		$headers[] = 'Authorization: ' . $signer->getAuthorizationHeader();

		curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
		curl_setopt($curl, CURLOPT_HEADER, false);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, false);
		curl_setopt($curl, CURLOPT_WRITEFUNCTION, [$this, '__responseWriteCallback']);
		curl_setopt($curl, CURLOPT_HEADERFUNCTION, [$this, '__responseHeaderCallback']);
		curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);

		// Request types
		switch ($this->verb)
		{
			case 'GET':
				break;

			case 'PUT':
			case 'POST':
				if (!is_object($this->input) || !($this->input instanceof Input))
				{
					$this->input = new Input();
				}

				$size = $this->input->getSize();
				$type = $this->input->getInputType();

				if ($type == Input::INPUT_DATA)
				{
					curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $this->verb);

					$data = $this->input->getDataReference();

					if (strlen($data ?? ''))
					{
						curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
					}

					if ($size > 0)
					{
						curl_setopt($curl, CURLOPT_BUFFERSIZE, $size);
					}
				}
				else
				{
					curl_setopt($curl, CURLOPT_PUT, true);
					curl_setopt($curl, CURLOPT_INFILE, $this->input->getFp());

					if ($size > 0)
					{
						curl_setopt($curl, CURLOPT_INFILESIZE, $size);
					}
				}


				break;

			case 'HEAD':
				curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'HEAD');
				curl_setopt($curl, CURLOPT_NOBODY, true);
				break;

			case 'DELETE':
				curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'DELETE');
				break;

			default:
				break;
		}

		// Execute, grab errors
		$this->response->resetBody();

		if (curl_exec($curl))
		{
			$this->response->code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
		}
		else
		{
			$this->response->error = new Error(
				curl_errno($curl),
				curl_error($curl),
				$this->resource
			);
		}

		if (version_compare(PHP_VERSION, '8.5.0', 'lt'))
		{
			@curl_close($curl);
		}

		// Set the body data
		$this->response->finaliseBody($rawResponse);

		// Clean up file resources
		if (!is_null($this->fp) && is_resource($this->fp))
		{
			try
			{
				@fclose($this->fp);
			}
			catch (\Throwable $e)
			{
			}
		}

		return $this->response;
	}


	/**
	 * cURL write callback
	 *
	 * @param   resource   &$curl  cURL resource
	 * @param   string     &$data  Data
	 *
	 * @return  int  Length in bytes
	 */
	protected function __responseWriteCallback($curl, string $data): int
	{
		if (in_array($this->response->code, [0, 200, 206]) && !is_null($this->fp) && is_resource($this->fp))
		{
			return fwrite($this->fp, $data);
		}

		$this->response->addToBody($data);

		return strlen($data);
	}

	/**
	 * cURL header callback
	 *
	 * @param   resource   $curl  cURL resource
	 * @param   string    &$data  Data
	 *
	 * @return  int  Length in bytes
	 */
	protected function __responseHeaderCallback($curl, string $data): int
	{
		if (($strlen = strlen($data)) <= 2)
		{
			return $strlen;
		}

		if (substr($data, 0, 4) == 'HTTP')
		{
			$this->response->code = (int) substr($data, 9, 3);

			return $strlen;
		}

		// Ignore malformed headers without a value.
		if (strpos($data, ':') === false)
		{
			return $strlen;
		}

		[$header, $value] = explode(':', trim($data), 2);
		$header = trim($header ?? '');
		$value  = trim($value ?? '');

		switch (strtolower($header))
		{
			case 'last-modified':
				$this->response->setHeader('time', strtotime($value));
				break;

			case 'content-length':
				$this->response->setHeader('size', (int) $value);
				break;

			case 'content-type':
				$this->response->setHeader('type', $value);
				break;

			case 'etag':
				$this->response->setHeader('hash', trim($value, '"'));
				break;

			default:
				$this->response->setHeader(strtolower($header), is_numeric($value) ? (int) $value : $value);

				if (preg_match('/^x-amz-meta-.*$/', $header))
				{
					$this->setHeader($header, is_numeric($value) ? (int) $value : $value);
				}
				break;
		}

		return $strlen;
	}

	/**
	 * Processes $this->parameters as a query string into $this->resource
	 *
	 * @return  void
	 */
	private function processParametersIntoResource(): void
	{
		if (count($this->parameters))
		{
			$query = substr($this->uri, -1) !== '?' ? '?' : '&';

			ksort($this->parameters);

			foreach ($this->parameters as $var => $value)
			{
				if ($value == null || $value == '')
				{
					$query .= $var . '&';
				}
				else
				{
					// Parameters must be URL-encoded
					$query .= $var . '=' . rawurlencode($value) . '&';
				}
			}

			$query     = substr($query, 0, -1);
			$this->uri .= $query;

			if (array_key_exists('acl', $this->parameters) || array_key_exists('location', $this->parameters)
			    || array_key_exists('torrent', $this->parameters)
			    || array_key_exists('logging', $this->parameters)
			    || array_key_exists('uploads', $this->parameters)
			    || array_key_exists('uploadId', $this->parameters)
			    || array_key_exists('partNumber', $this->parameters)
			)
			{
				$this->resource .= $query;
			}
		}
	}

	/**
	 * Get the region-specific hostname for an operation given a configuration and a bucket name. This ensures we can
	 * always use an HTTPS connection, even with buckets containing dots in their names, without SSL certificate host
	 * name validation issues.
	 *
	 * Please note that this requires the pathStyle flag to be set in Configuration because Amazon RECOMMENDS using the
	 * virtual-hosted style request where applicable. See http://docs.aws.amazon.com/AmazonS3/latest/API/APIRest.html
	 * Quoting this documentation:
	 * "Although the path-style is still supported for legacy applications, we recommend using the virtual-hosted style
	 * where applicable."
	 *
	 * @param   Configuration  $configuration
	 * @param   string         $bucket
	 *
	 * @return  string
	 */
	private function getHostName(Configuration $configuration, string $bucket): string
	{
		// http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
		$endpoint = $configuration->getEndpoint();
		$region   = $configuration->getRegion();

		// If it's a bucket in China we need to use a different endpoint
		if (($endpoint == 's3.amazonaws.com') && (substr($region, 0, 3) == 'cn-'))
		{
			$endpoint = 'amazonaws.com.cn';
		}

		/**
		 * If there is no bucket we use the default endpoint, whatever it is. For Amazon S3 this format is only used
		 * when we are making account-level, cross-region requests, e.g. list all buckets. For S3-compatible APIs it
		 * depends on the API, but generally it's just for listing available buckets.
		 */
		if (empty($bucket))
		{
			return $endpoint;
		}

		/**
		 * Are we using v2 signatures? In this case we use the endpoint defined by the user without translating it.
		 */
		if ($configuration->getSignatureMethod() != 'v4')
		{
			// Legacy path style: the hostname is the endpoint
			if ($configuration->getUseLegacyPathStyle())
			{
				return $endpoint;
			}

			// Virtual hosting style: the hostname is the bucket, dot and endpoint.
			return $bucket . '.' . $endpoint;
		}

		/**
		 * Only applies to Amazon S3 proper.
		 *
		 * When using the Amazon S3 with the v4 signature API we have to use a different hostname per region. The
		 * mapping can be found in https://docs.aws.amazon.com/general/latest/gr/s3.html#s3_region
		 *
		 * This means changing the endpoint to s3.REGION.amazonaws.com with the following exceptions:
		 * For China: s3.REGION.amazonaws.com.cn
		 *
		 * v4 signing does NOT support non-Amazon endpoints.
		 */
		if (in_array($endpoint, ['s3.amazonaws.com', 'amazonaws.com.cn']))
		{
			// Most endpoints: s3-REGION.amazonaws.com
			$regionalEndpoint = $region . '.amazonaws.com';

			// Exception: China
			if (substr($region, 0, 3) == 'cn-')
			{
				// Chinese endpoint, e.g.: s3.cn-north-1.amazonaws.com.cn
				$regionalEndpoint = $regionalEndpoint . '.cn';
			}

			// If dual-stack URLs are enabled then prepend the endpoint
			if ($configuration->getDualstackUrl())
			{
				$endpoint = 's3.dualstack.' . $regionalEndpoint;
			}
			else
			{
				$endpoint = 's3.' . $regionalEndpoint;
			}
		}

		// Legacy path style access: return just the endpoint
		if ($configuration->getUseLegacyPathStyle())
		{
			return $endpoint;
		}

		// Recommended virtual hosting access: bucket, dot, endpoint.
		return $bucket . '.' . $endpoint;
	}
}
