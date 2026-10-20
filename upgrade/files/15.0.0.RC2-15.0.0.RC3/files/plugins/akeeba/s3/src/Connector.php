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
use Akeeba\S3\Exception\CannotDeleteFile;
use Akeeba\S3\Exception\CannotGetBucket;
use Akeeba\S3\Exception\CannotGetFile;
use Akeeba\S3\Exception\CannotListBuckets;
use Akeeba\S3\Exception\CannotOpenFileForWrite;
use Akeeba\S3\Exception\CannotPutFile;
use Akeeba\S3\Response\Error;

defined('AKEEBAENGINE') || die();

class Connector
{
	/**
	 * Amazon S3 configuration object
	 *
	 * @var  Configuration
	 */
	private $configuration = null;

	/**
	 * Connector constructor.
	 *
	 * @param   Configuration  $configuration  The configuration object to use
	 */
	public function __construct(Configuration $configuration)
	{
		$this->configuration = $configuration;
	}

	/**
	 * Put an object to Amazon S3, i.e. upload a file. If the object already exists it will be overwritten.
	 *
	 * @param   Input   $input           Input object
	 * @param   string  $bucket          Bucket name. If you're using v4 signatures it MUST be on the region defined.
	 * @param   string  $uri             Object URI. Think of it as the absolute path of the file in the bucket.
	 * @param   string  $acl             ACL constant, by default the object is private (visible only to the uploading
	 *                                   user)
	 * @param   array   $requestHeaders  Array of request headers
	 *
	 * @return  void
	 *
	 * @throws CannotPutFile If the upload is not possible
	 */
	public function putObject(Input $input, string $bucket, string $uri, string $acl = Acl::ACL_PRIVATE, array $requestHeaders = []): void
	{
		$request = new Request('PUT', $bucket, $uri, $this->configuration);
		$request->setInput($input);

		// Custom request headers (Content-Type, Content-Disposition, Content-Encoding)
		if (count($requestHeaders))
		{
			foreach ($requestHeaders as $h => $v)
			{
				if (strtolower(substr($h, 0, 6)) == 'x-amz-')
				{
					$request->setAmzHeader(strtolower($h), $v);
				}
				else
				{
					$request->setHeader($h, $v);
				}
			}
		}

		if (isset($requestHeaders['Content-Type']))
		{
			$input->setType($requestHeaders['Content-Type']);
		}

		if (($input->getSize() <= 0) || (($input->getInputType() == Input::INPUT_DATA) && (!strlen($input->getDataReference()))))
		{
			if (substr($uri, -1) !== '/')
			{
				throw new CannotPutFile('Missing input parameters', 0);
			}
		}

		// We need to post with Content-Length and Content-Type, MD5 is optional
		$request->setHeader('Content-Type', $input->getType());
		$request->setHeader('Content-Length', $input->getSize());

		if ($input->getMd5sum())
		{
			$request->setHeader('Content-MD5', $input->getMd5sum());
		}

		$request->setAmzHeader('x-amz-acl', $acl);

		$response = $request->getResponse();

		if ($response->code !== 200)
		{
			if (!$response->error->isError())
			{
				throw new CannotPutFile("Unexpected HTTP status {$response->code}", $response->code);
			}

			if (is_object($response->body) && ($response->body instanceof \SimpleXMLElement) && (strpos($input->getSize(), ',') === false))
			{
				// For some reason, trying to single part upload files on some hosts comes back with an inexplicable
				// error from Amazon that we need to set Content-Length:5242880,5242880 instead of
				// Content-Length:5242880 which is AGAINST Amazon's documentation. In this case we pass the header
				// 'workaround-braindead-error-from-amazon' and retry. Uh, OK?
				if (isset($response->body->CanonicalRequest))
				{
					$amazonsCanonicalRequest = (string) $response->body->CanonicalRequest;
					$lines                   = explode("\n", $amazonsCanonicalRequest);

					foreach ($lines as $line)
					{
						if (substr($line, 0, 15) != 'content-length:')
						{
							continue;
						}

						[$junk, $stupidAmazonDefinedContentLength] = explode(":", $line);

						if (strpos($stupidAmazonDefinedContentLength, ',') !== false)
						{
							if (!isset($requestHeaders['workaround-braindead-error-from-amazon']))
							{
								$requestHeaders['workaround-braindead-error-from-amazon'] = 'you can\'t fix stupid';

								$this->putObject($input, $bucket, $uri, $acl, $requestHeaders);

								return;
							}
						}
					}
				}
			}
		}


		if ($response->error->isError())
		{
			throw new CannotPutFile(
				sprintf(__METHOD__ . "(): [%s] %s%s", $response->error->getCode(), $response->error->getMessage(), $this->debugInfo($response->body))
			);
		}
	}

	/**
	 * Get (download) an object
	 *
	 * @param   string                $bucket  Bucket name
	 * @param   string                $uri     Object URI
	 * @param   string|resource|null  $saveTo  Filename or resource to write to
	 * @param   int|null              $from    Start of the download range, null to download the entire object
	 * @param   int|null              $to      End of the download range, null to download the entire object
	 *
	 * @return  string|null  No return if $saveTo is specified; data as string otherwise
	 *
	 */
	public function getObject(string $bucket, string $uri, $saveTo = null, ?int $from = null, ?int $to = null): ?string
	{
		$request = new Request('GET', $bucket, $uri, $this->configuration);

		$fp = null;

		if (!is_resource($saveTo) && is_string($saveTo))
		{
			$fp = @fopen($saveTo, 'w');

			if ($fp === false)
			{
				throw new CannotOpenFileForWrite($saveTo);
			}
		}

		if (is_resource($saveTo))
		{
			$fp = $saveTo;
		}

		if (is_resource($fp))
		{
			$request->setFp($fp);
		}

		// Set the range header
		if ((!empty($from) && !empty($to)) || (!is_null($from) && !empty($to)))
		{
			$request->setHeader('Range', "bytes=$from-$to");
		}

		$response = $request->getResponse(true);

		if (!$response->error->isError() && (($response->code !== 200) && ($response->code !== 206)))
		{
			$response->error = new Error(
				$response->code,
				"Unexpected HTTP status {$response->code}"
			);
		}

		if ($response->error->isError())
		{
			throw new CannotGetFile(
				sprintf(
					__METHOD__ . "({%s}, {%s}): [%s] %s%s",
					$bucket,
					$uri,
					$response->error->getCode(),
					$response->error->getMessage(),
					$this->debugInfo($response->body)
				)
			);
		}

		if (!is_resource($fp))
		{
			return $response->body;
		}

		return null;
	}

	/**
	 * Get information about an object.
	 *
	 * @param   string  $bucket  Bucket name
	 * @param   string  $uri     Object URI
	 *
	 * @return  array  The headers returned by Amazon S3
	 *
	 * @throws  CannotGetFile  If the file does not exist
	 * @see     https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
	 */
	public function headObject(string $bucket, string $uri): array
	{
		$request = new Request('HEAD', $bucket, $uri, $this->configuration);

		$response = $request->getResponse();

		if (!$response->error->isError() && (($response->code !== 200) && ($response->code !== 206)))
		{
			$response->error = new Error(
				$response->code,
				"Unexpected HTTP status {$response->code}"
			);
		}

		if ($response->error->isError())
		{
			throw new CannotGetFile(
				sprintf(
					__METHOD__ . "({%s}, {%s}): [%s] %s%s",
					$bucket,
					$uri,
					$response->error->getCode(),
					$response->error->getMessage(),
					$this->debugInfo($response->body)
				)
			);
		}

		return $response->getHeaders();
	}


	/**
	 * Delete an object
	 *
	 * @param   string  $bucket  Bucket name
	 * @param   string  $uri     Object URI
	 *
	 * @return  void
	 */
	public function deleteObject(string $bucket, string $uri): void
	{
		$request  = new Request('DELETE', $bucket, $uri, $this->configuration);
		$response = $request->getResponse();

		if (!$response->error->isError() && ($response->code !== 204))
		{
			$response->error = new Error(
				$response->code,
				"Unexpected HTTP status {$response->code}"
			);
		}

		if ($response->error->isError())
		{
			throw new CannotDeleteFile(
				sprintf(
					__METHOD__ . "({%s}, {%s}): [%s] %s",
					$bucket,
					$uri,
					$response->error->getCode(),
					$response->error->getMessage()
				)
			);
		}
	}

	/**
	 * Get a query string authenticated URL
	 *
	 * @param   string    $bucket    Bucket name
	 * @param   string    $uri       Object URI
	 * @param   int|null  $lifetime  Lifetime in seconds
	 * @param   bool      $https     Use HTTPS ($hostBucket should be false for SSL verification)?
	 *
	 * @return  string
	 */
	public function getAuthenticatedURL(string $bucket, string $uri, ?int $lifetime = null, bool $https = false): string
	{
		// Get a request from the URI and bucket
		$questionmarkPos = strpos($uri, '?');
		$query           = '';

		if ($questionmarkPos !== false)
		{
			$query = substr($uri, $questionmarkPos + 1);
			$uri   = substr($uri, 0, $questionmarkPos);
		}


		/**
		 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		 * !!!!             DO NOT TOUCH THIS CODE. YOU WILL BREAK PRE-SIGNED URLS WITH v4 SIGNATURES.              !!!!
		 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		 *
		 * The following two lines seem weird and possibly extraneous at first glance. However, they are VERY important.
		 * If you remove them pre-signed URLs for v4 signatures will break! That's because pre-signed URLs with v4
		 * signatures follow different rules than with v2 signatures.
		 *
		 * Authenticated (pre-signed) URLs are always made against the generic S3 region endpoint, not the bucket's
		 * virtual-hosting-style domain name. The bucket is always the first component of the path.
		 *
		 * For example, given a bucket called foobar, and an object baz.txt in it, we are pre-signing the URL
		 * https://s3-eu-west-1.amazonaws.com/foobar/baz.txt, not
		 * https://foobar.s3-eu-west-1.amazonaws.com/foobar/baz.txt (as we'd be doing with v2 signatures).
		 *
		 * The problem is that the Request object needs to be created before we can convey the intent (regular request
		 * or generation of a pre-signed URL). As a result its constructor creates the (immutable) request URI solely
		 * based on whether the Configuration object's getUseLegacyPathStyle() returns false or not.
		 *
		 * Since we want to request URI to contain the bucket name we need to tell the Request object's constructor that
		 * we are creating a Request object for path-style access, i.e. the useLegacyPathStyle flag in the Configuration
		 * object is true. Naturally, the default behavior being virtual-hosting-style access to buckets, this flag is
		 * most likely **false**.
		 *
		 * Therefore, we need to clone the Configuration object, set the flag to true and create a Request object using
		 * the falsified Configuration object.
		 *
		 * Note that v2 signatures are not affected. In v2 we are always appending the bucket name to the path, despite
		 * the fact that we include the bucket name in the domain name.
		 *
		 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		 * !!!!             DO NOT TOUCH THIS CODE. YOU WILL BREAK PRE-SIGNED URLS WITH v4 SIGNATURES.              !!!!
		 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		 */
		$newConfig = clone $this->configuration;
		$newConfig->setUseLegacyPathStyle(true);

		/**
		 * The clone above hides whether the caller chose path-style access, and the v4 signer decides where the
		 * bucket goes from getPreSignedBucketInURL() alone. Honour the caller's choice: with path-style access the
		 * bucket stays in the path of the pre-signed URL, as the signer already supports. Without this, a v4
		 * pre-signed URL for a path-style connection named a host such as bucket.endpoint, which S3-compatible
		 * servers without per-bucket DNS never answer.
		 */
		if ($this->configuration->getUseLegacyPathStyle())
		{
			$newConfig->setPreSignedBucketInURL(true);
		}

		// Create the request object.
		$request = new Request('GET', $bucket, $uri, $newConfig);

		if ($query)
		{
			parse_str($query, $parameters);

			if (count($parameters))
			{
				foreach ($parameters as $k => $v)
				{
					$request->setParameter($k, $v);
				}
			}
		}

		// Get the signed URI from the Request object
		return $request->getAuthenticatedURL($lifetime, $https);
	}

	/**
	 * Get the location (region) of a bucket. You need this to use the V4 API on that bucket!
	 *
	 * @param   string  $bucket  Bucket name
	 *
	 * @return  string
	 */
	public function getBucketLocation(string $bucket): string
	{
		$request = new Request('GET', $bucket, '', $this->configuration);
		$request->setParameter('location', null);

		$response = $request->getResponse();

		if (!$response->error->isError() && $response->code !== 200)
		{
			$response->error = new Error(
				$response->code,
				"Unexpected HTTP status {$response->code}"
			);
		}

		if ($response->error->isError())
		{
			throw new CannotGetBucket(
				sprintf(__METHOD__ . "(): [%s] %s", $response->error->getCode(), $response->error->getMessage())
			);
		}

		$result = 'us-east-1';

		if ($response->hasBody())
		{
			$result = (string) $response->body;
		}

		switch ($result)
		{
			// "EU" is an alias for 'eu-west-1', however the canonical location name you MUST use is 'eu-west-1'
			case 'EU':
			case 'eu':
				$result = 'eu-west-1';
				break;

			// If the bucket location is 'us-east-1' you get an empty string. @#$%^&*()!!
			case '':
				$result = 'us-east-1';
				break;
		}

		return $result;
	}

	/**
	 * Get the contents of a bucket
	 *
	 * If maxKeys is null this method will loop through truncated result sets
	 *
	 * @param   string       $bucket                Bucket name
	 * @param   string|null  $prefix                Prefix (directory)
	 * @param   string|null  $marker                Marker (last file listed)
	 * @param   int|null     $maxKeys               Maximum number of keys ("files" and "directories") to return
	 * @param   string       $delimiter             Delimiter, typically "/"
	 * @param   bool         $returnCommonPrefixes  Set to true to return CommonPrefixes
	 *
	 * @return  array
	 */
	public function getBucket(string $bucket, ?string $prefix = null, ?string $marker = null, ?int $maxKeys = null, string $delimiter = '/', bool $returnCommonPrefixes = false): array
	{
		$internalResult = $this->internalGetBucket($bucket, $prefix, $marker, $maxKeys, $delimiter, $returnCommonPrefixes);

		/**
		 * @var array   $objects
		 * @var ?string $nextMarker
		 */
		extract($internalResult);
		unset($internalResult);

		// Loop through truncated results if maxKeys isn't specified or we don't have enough object records yet.
		if ($nextMarker !== null && ($maxKeys === null || count($objects) < $maxKeys))
		{
			do
			{
				$internalResult = $this->internalGetBucket($bucket, $prefix, $nextMarker, $maxKeys, $delimiter, $returnCommonPrefixes);

				$nextMarker = $internalResult['nextMarker'];
				$objects    = array_merge($objects, $internalResult['objects']);

				unset($internalResult);

				// If the last call did not return a nextMarker I am done iterating.
				if ($nextMarker === null)
				{
					break;
				}

				// If we have maxKeys AND the number of objects is at least this many I am done iterating.
				if ($maxKeys !== null && count($objects) >= $maxKeys)
				{
					break;
				}
			} while (true);
		}

		if ($maxKeys !== null)
		{
			return array_splice($objects, 0, $maxKeys);
		}

		return $objects;
	}

	/**
	 * Get a list of buckets
	 *
	 * @param   bool  $detailed  Returns detailed bucket list when true
	 *
	 * @return  array
	 */
	public function listBuckets(bool $detailed = false): array
	{
		// When listing buckets with the AWSv4 signature method we MUST set the region to us-east-1. Don't ask...
		$configuration = clone $this->configuration;
		$configuration->setRegion('us-east-1');

		$request  = new Request('GET', '', '', $configuration);
		$response = $request->getResponse();

		if (!$response->error->isError() && (($response->code !== 200)))
		{
			$response->error = new Error(
				$response->code,
				"Unexpected HTTP status {$response->code}"
			);
		}

		if ($response->error->isError())
		{
			throw new CannotListBuckets(
				sprintf(__METHOD__ . "(): [%s] %s", $response->error->getCode(), $response->error->getMessage())
			);
		}

		$results = [];

		if (!isset($response->body->Buckets))
		{
			return $results;
		}

		if ($detailed)
		{
			if (isset($response->body->Owner, $response->body->Owner->ID, $response->body->Owner->DisplayName))
			{
				$results['owner'] = [
					'id'   => (string) $response->body->Owner->ID,
					'name' => (string) $response->body->Owner->DisplayName,
				];
			}

			$results['buckets'] = [];

			foreach ($response->body->Buckets->Bucket as $b)
			{
				$results['buckets'][] = [
					'name' => (string) $b->Name,
					'time' => strtotime((string) $b->CreationDate),
				];
			}
		}
		else
		{
			foreach ($response->body->Buckets->Bucket as $b)
			{
				$results[] = (string) $b->Name;
			}
		}

		return $results;
	}

	/**
	 * Start a multipart upload of an object
	 *
	 * @param   Input   $input           Input data
	 * @param   string  $bucket          Bucket name
	 * @param   string  $uri             Object URI
	 * @param   string  $acl             ACL constant
	 * @param   array   $requestHeaders  Array of request headers
	 *
	 * @return  string  The upload session ID (UploadId)
	 */
	public function startMultipart(Input $input, string $bucket, string $uri, string $acl = Acl::ACL_PRIVATE, array $requestHeaders = []): string
	{
		$request = new Request('POST', $bucket, $uri, $this->configuration);
		$request->setParameter('uploads', '');

		// Custom request headers (Content-Type, Content-Disposition, Content-Encoding)
		if (is_array($requestHeaders))
		{
			foreach ($requestHeaders as $h => $v)
			{
				if (strtolower(substr($h, 0, 6)) == 'x-amz-')
				{
					$request->setAmzHeader(strtolower($h), $v);
				}
				else
				{
					$request->setHeader($h, $v);
				}
			}
		}

		$request->setAmzHeader('x-amz-acl', $acl);

		if (isset($requestHeaders['Content-Type']))
		{
			$input->setType($requestHeaders['Content-Type']);
		}

		$request->setHeader('Content-Type', $input->getType());

		$response = $request->getResponse();

		if (!$response->error->isError() && ($response->code !== 200))
		{
			$response->error = new Error(
				$response->code,
				"Unexpected HTTP status {$response->code}"
			);
		}

		if ($response->error->isError())
		{
			throw new CannotPutFile(
				sprintf(
					__METHOD__ . "(): [%s] %s%s",
					$response->error->getCode(),
					$response->error->getMessage(),
					$this->debugInfo($response->body)
				)
			);
		}

		return (string) $response->body->UploadId;
	}

	/**
	 * Uploads a part of a multipart object upload
	 *
	 * @param   Input   $input           Input data. You MUST specify the UploadID and PartNumber
	 * @param   string  $bucket          Bucket name
	 * @param   string  $uri             Object URI
	 * @param   array   $requestHeaders  Array of request headers or content type as a string
	 * @param   int     $chunkSize       Size of each upload chunk, in bytes. It cannot be less than 5242880 bytes (5Mb)
	 *
	 * @return  null|string  The ETag of the upload part of null if we have ran out of parts to upload
	 */
	public function uploadMultipart(Input $input, string $bucket, string $uri, array $requestHeaders = [], int $chunkSize = 5242880): ?string
	{
		if ($chunkSize < 5242880)
		{
			$chunkSize = 5242880;
		}

		// We need a valid UploadID and PartNumber
		$UploadID   = $input->getUploadID();
		$PartNumber = $input->getPartNumber();

		if (empty($UploadID))
		{
			throw new CannotPutFile(
				__METHOD__ . '(): No UploadID specified'
			);
		}

		if (empty($PartNumber))
		{
			throw new CannotPutFile(
				__METHOD__ . '(): No PartNumber specified'
			);
		}

		//$UploadID   = urlencode($UploadID);
		$PartNumber = (int) $PartNumber;

		$request = new Request('PUT', $bucket, $uri, $this->configuration);
		$request->setParameter('partNumber', $PartNumber);
		$request->setParameter('uploadId', $UploadID);
		$request->setInput($input);

		// Full data length
		$totalSize = $input->getSize();

		// No Content-Type for multipart uploads
		$input->setType(null);

		// Calculate part offset
		$partOffset = $chunkSize * ($PartNumber - 1);

		if ($partOffset > $totalSize)
		{
			// This is to signify that we ran out of parts ;)
			return null;
		}

		// How many parts are there?
		$totalParts = floor($totalSize / $chunkSize);

		if ($totalParts * $chunkSize < $totalSize)
		{
			$totalParts++;
		}

		// Calculate Content-Length
		$size = $chunkSize;

		if ($PartNumber >= $totalParts)
		{
			$size = $totalSize - ($PartNumber - 1) * $chunkSize;
		}

		if ($size <= 0)
		{
			// This is to signify that we ran out of parts ;)
			return null;
		}

		$input->setSize($size);

		switch ($input->getInputType())
		{
			case Input::INPUT_DATA:
				$input->setData(substr($input->getData(), ($PartNumber - 1) * $chunkSize, $input->getSize()));
				break;

			case Input::INPUT_FILE:
			case Input::INPUT_RESOURCE:
				$fp = $input->getFp();
				fseek($fp, ($PartNumber - 1) * $chunkSize);
				break;
		}

		// Custom request headers (Content-Type, Content-Disposition, Content-Encoding)
		if (is_array($requestHeaders))
		{
			foreach ($requestHeaders as $h => $v)
			{
				if (strtolower(substr($h, 0, 6)) == 'x-amz-')
				{
					$request->setAmzHeader(strtolower($h), $v);
				}
				else
				{
					$request->setHeader($h, $v);
				}
			}
		}

		$request->setHeader('Content-Length', $input->getSize());

		if ($input->getInputType() === Input::INPUT_DATA)
		{
			$request->setHeader('Content-Type', "application/x-www-form-urlencoded");
		}

		$response = $request->getResponse();

		if ($response->code !== 200)
		{
			if (!$response->error->isError())
			{
				$response->error = new Error(
					$response->code,
					"Unexpected HTTP status {$response->code}"
				);
			}

			if (is_object($response->body) && ($response->body instanceof \SimpleXMLElement) && (strpos($input->getSize(), ',') === false))
			{
				// For some moronic reason, trying to multipart upload files on some hosts comes back with a crazy
				// error from Amazon that we need to set Content-Length:5242880,5242880 instead of
				// Content-Length:5242880 which is AGAINST Amazon's documentation. In this case we pass the header
				// 'workaround-broken-content-length' and retry. Whatever.
				if (isset($response->body->CanonicalRequest))
				{
					$amazonsCanonicalRequest = (string) $response->body->CanonicalRequest;
					$lines                   = explode("\n", $amazonsCanonicalRequest);

					foreach ($lines as $line)
					{
						if (substr($line, 0, 15) != 'content-length:')
						{
							continue;
						}

						[$junk, $stupidAmazonDefinedContentLength] = explode(":", $line);

						if (strpos($stupidAmazonDefinedContentLength, ',') !== false)
						{
							if (!isset($requestHeaders['workaround-broken-content-length']))
							{
								$requestHeaders['workaround-broken-content-length'] = true;

								// This is required to reset the input size to its default value. If you don't do that
								// only one part will ever be uploaded. Oops!
								$input->setSize(-1);

								return $this->uploadMultipart($input, $bucket, $uri, $requestHeaders, $chunkSize);
							}
						}
					}
				}

			}

			throw new CannotPutFile(
				sprintf(__METHOD__ . "(): [%s] %s%s", $response->error->getCode(), $response->error->getMessage(), $this->debugInfo($response->body))
			);
		}

		// Return the ETag header
		return $response->headers['hash'];
	}

	/**
	 * Finalizes the multi-part upload. The $input object should contain two keys, etags an array of ETags of the
	 * uploaded parts and UploadID the multipart upload ID.
	 *
	 * @param   Input   $input   The array of input elements
	 * @param   string  $bucket  The bucket where the object is being stored
	 * @param   string  $uri     The key (path) to the object
	 *
	 * @return  void
	 */
	public function finalizeMultipart(Input $input, string $bucket, string $uri): void
	{
		$etags    = $input->getEtags();
		$UploadID = $input->getUploadID();

		if (empty($etags))
		{
			throw new CannotPutFile(
				__METHOD__ . '(): No ETags array specified'
			);
		}

		if (empty($UploadID))
		{
			throw new CannotPutFile(
				__METHOD__ . '(): No UploadID specified'
			);
		}

		// Create the message
		$message = "<CompleteMultipartUpload>\n";
		$part    = 0;

		foreach ($etags as $etag)
		{
			$part++;
			$message .= "\t<Part>\n\t\t<PartNumber>$part</PartNumber>\n\t\t<ETag>\"$etag\"</ETag>\n\t</Part>\n";
		}

		$message .= "</CompleteMultipartUpload>";

		// Get a request query
		$reqInput = Input::createFromData($message);

		$request = new Request('POST', $bucket, $uri, $this->configuration);
		$request->setParameter('uploadId', $UploadID);
		$request->setInput($reqInput);

		// Do post
		$request->setHeader('Content-Type', 'application/xml'); // Even though the Amazon API doc doesn't mention it, it's required... :(
		$response = $request->getResponse();

		if (!$response->error->isError() && ($response->code != 200))
		{
			$response->error = new Error(
				$response->code,
				"Unexpected HTTP status {$response->code}"
			);
		}

		if ($response->error->isError())
		{
			if ($response->error->getCode() == 'RequestTimeout')
			{
				return;
			}

			throw new CannotPutFile(
				sprintf(__METHOD__ . "(): [%s] %s%s", $response->error->getCode(), $response->error->getMessage(), $this->debugInfo($response->body))
			);
		}
	}

	/**
	 * The "Debug info" dump of an S3 response body for an exception message, if the configuration asks for it.
	 *
	 * The signed request S3 echoes back on a signature error (StringToSign, CanonicalRequest, SignatureProvided and
	 * their hex forms) is always left out: it can carry the session token of temporary credentials, and exception
	 * messages are often shown to people.
	 *
	 * @param   mixed  $body  The response body
	 *
	 * @return  string  Empty, or the dump preceded by a blank line
	 */
	private function debugInfo($body): string
	{
		if (!$this->configuration->getDebug())
		{
			return '';
		}

		if ($body instanceof \SimpleXMLElement)
		{
			$body = simplexml_load_string($body->asXML());

			foreach (
				[
					'StringToSign', 'StringToSignBytes', 'CanonicalRequest', 'CanonicalRequestBytes',
					'SignatureProvided',
				] as $element
			)
			{
				unset($body->{$element});
			}
		}
		elseif (is_string($body))
		{
			$body = preg_replace(
				'#<(StringToSign|StringToSignBytes|CanonicalRequest|CanonicalRequestBytes|SignatureProvided)>.*?</\1>#s',
				'', $body
			);
		}

		return "\n\nDebug info:\n" . print_r($body, true);
	}

	/**
	 * Returns the configuration object
	 *
	 * @return  Configuration
	 */
	public function getConfiguration(): Configuration
	{
		return $this->configuration;
	}

	private function internalGetBucket(string $bucket, ?string $prefix = null, ?string $marker = null, ?int $maxKeys = null, string $delimiter = '/', bool $returnCommonPrefixes = false): array
	{
		$request = new Request('GET', $bucket, '', $this->configuration);

		if (!empty($prefix))
		{
			$request->setParameter('prefix', $prefix);
		}

		if (!empty($marker))
		{
			$request->setParameter('marker', $marker);
		}

		if (!empty($maxKeys))
		{
			$request->setParameter('max-keys', $maxKeys);
		}

		if (!empty($delimiter))
		{
			$request->setParameter('delimiter', $delimiter);
		}

		$response = $request->getResponse();

		if (!$response->error->isError() && $response->code !== 200)
		{
			$response->error = new Error(
				$response->code,
				"Unexpected HTTP status {$response->code}"
			);
		}

		if ($response->error->isError())
		{
			throw new CannotGetBucket(
				sprintf(__METHOD__ . "(): [%s] %s", $response->error->getCode(), $response->error->getMessage())
			);
		}

		$results = [
			'objects'    => [],
			'nextMarker' => null,
		];

		if ($response->hasBody() && isset($response->body->Contents))
		{
			foreach ($response->body->Contents as $c)
			{
				$results['objects'][(string) $c->Key] = [
					'name' => (string) $c->Key,
					'time' => strtotime((string) $c->LastModified),
					'size' => (int) $c->Size,
					'hash' => substr((string) $c->ETag, 1, -1),
				];

				$results['nextMarker'] = (string) $c->Key;
			}
		}

		if ($returnCommonPrefixes && $response->hasBody() && isset($response->body->CommonPrefixes))
		{
			foreach ($response->body->CommonPrefixes as $c)
			{
				$results['objects'][(string) $c->Prefix] = ['prefix' => (string) $c->Prefix];
			}
		}

		if ($response->hasBody() && isset($response->body->IsTruncated) &&
			((string) $response->body->IsTruncated == 'false')
		)
		{
			$results['nextMarker'] = null;

			return $results;
		}

		if ($response->hasBody() && isset($response->body->NextMarker))
		{
			$results['nextMarker'] = (string) $response->body->NextMarker;
		}

		return $results;
	}
}
