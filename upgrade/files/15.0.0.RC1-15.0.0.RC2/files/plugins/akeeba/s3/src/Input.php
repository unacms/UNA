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
 * Defines an input source for PUT/POST requests to Amazon S3
 */
class Input
{
	/**
	 * Input type: resource
	 */
	public const INPUT_RESOURCE = 1;

	/**
	 * Input type: file
	 */
	public const INPUT_FILE = 2;

	/**
	 * Input type: raw data
	 */
	public const INPUT_DATA = 3;

	/**
	 * File pointer, in case we have a resource
	 *
	 * @var  resource
	 */
	private $fp = null;

	/**
	 * Absolute filename to the file
	 *
	 * @var  string
	 */
	private $file = null;

	/**
	 * Data to upload, as a string
	 *
	 * @var  string
	 */
	private $data = null;

	/**
	 * Length of the data to upload
	 *
	 * @var  int
	 */
	private $size = -1;

	/**
	 * Content type (MIME type)
	 *
	 * @var  string|null
	 */
	private $type = '';

	/**
	 * MD5 sum of the data to upload, as base64 encoded string. If it's false no MD5 sum will be returned.
	 *
	 * @var  string|null
	 */
	private $md5sum = null;

	/**
	 * SHA-256 sum of the data to upload, as lowercase hex string.
	 *
	 * @var  string|null
	 */
	private $sha256 = null;

	/**
	 * The Upload Session ID used for multipart uploads
	 *
	 * @var  string|null
	 */
	private $UploadID = null;

	/**
	 * The part number used in multipart uploads
	 *
	 * @var  int|null
	 */
	private $PartNumber = null;

	/**
	 * The list of ETags used when finalising a multipart upload
	 *
	 * @var  string[]
	 */
	private $etags = [];

	/**
	 * Create an input object from a file (also: any valid URL wrapper)
	 *
	 * @param   string       $file       Absolute file path or any valid URL fopen() wrapper
	 * @param   null|string  $md5sum     The MD5 sum. null to auto calculate, empty string to never calculate.
	 * @param   null|string  $sha256sum  The SHA256 sum. null to auto calculate.
	 *
	 * @return  Input
	 */
	public static function createFromFile(string $file, ?string $md5sum = null, ?string $sha256sum = null): self
	{
		$input = new Input();

		$input->setFile($file);
		$input->setMd5sum($md5sum);
		$input->setSha256($sha256sum);

		return $input;
	}

	/**
	 * Create an input object from a stream resource / file pointer.
	 *
	 * Please note that the contentLength cannot be calculated automatically unless you have a seekable stream resource.
	 *
	 * @param   resource     $resource       The file pointer or stream resource
	 * @param   int          $contentLength  The length of the content in bytes. Set to -1 for auto calculation.
	 * @param   null|string  $md5sum         The MD5 sum. null to auto calculate, empty string to never calculate.
	 * @param   null|string  $sha256sum      The SHA256 sum. null to auto calculate.
	 *
	 * @return  Input
	 */
	public static function createFromResource(&$resource, int $contentLength, ?string $md5sum = null, ?string $sha256sum = null): self
	{
		$input = new Input();

		$input->setFp($resource);
		$input->setSize($contentLength);
		$input->setMd5sum($md5sum);
		$input->setSha256($sha256sum);

		return $input;
	}

	/**
	 * Create an input object from raw data.
	 *
	 * Please bear in mind that the data is being duplicated in memory. Therefore you'll need at least 2xstrlen($data)
	 * of free memory when you are using this method. You can instantiate an object and use assignData to work around
	 * this limitation when handling large amounts of data which may cause memory outages (typically: over 10Mb).
	 *
	 * @param   string       $data       The data to use.
	 * @param   null|string  $md5sum     The MD5 sum. null to auto calculate, empty string to never calculate.
	 * @param   null|string  $sha256sum  The SHA256 sum. null to auto calculate.
	 *
	 * @return  Input
	 */
	public static function createFromData(string &$data, ?string $md5sum = null, ?string $sha256sum = null): self
	{
		$input = new Input();

		$input->setData($data);
		$input->setMd5sum($md5sum);
		$input->setSha256($sha256sum);

		return $input;
	}

	/**
	 * Destructor.
	 */
	function __destruct()
	{
		if (is_resource($this->fp))
		{
			try
			{
				@fclose($this->fp);
			}
			catch (\Throwable $e)
			{
			}
		}
	}

	/**
	 * Returns the input type (resource, file or data)
	 *
	 * @return  int
	 */
	public function getInputType(): int
	{
		if (!empty($this->file))
		{
			return self::INPUT_FILE;
		}

		if (!empty($this->fp))
		{
			return self::INPUT_RESOURCE;
		}

		return self::INPUT_DATA;
	}

	/**
	 * Return the file pointer to the data, or null if this is not a resource input
	 *
	 * @return  resource|null
	 */
	public function getFp()
	{
		if (!is_resource($this->fp))
		{
			return null;
		}

		return $this->fp;
	}

	/**
	 * Set the file pointer (or, generally, stream resource)
	 *
	 * @param   resource  $fp
	 */
	public function setFp($fp): void
	{
		if (!is_resource($fp))
		{
			throw new Exception\InvalidFilePointer('$fp is not a file resource');
		}

		$this->fp = $fp;
	}

	/**
	 * Get the absolute path to the input file, or null if this is not a file input
	 *
	 * @return  string|null
	 */
	public function getFile(): ?string
	{
		if (empty($this->file))
		{
			return null;
		}

		return $this->file;
	}

	/**
	 * Set the absolute path to the input file
	 *
	 * @param   string  $file
	 */
	public function setFile(string $file): void
	{
		$this->file = $file;
		$this->data = null;

		if (is_resource($this->fp))
		{
			try
			{
				@fclose($this->fp);
			}
			catch (\Throwable $e)
			{
			}
		}

		$this->fp = @fopen($file, 'r');

		if ($this->fp === false)
		{
			throw new Exception\CannotOpenFileForRead($file);
		}
	}

	/**
	 * Return the raw input data, or null if this is a file or stream input
	 *
	 * @return  string|null
	 */
	public function getData(): ?string
	{
		if (empty($this->data) && ($this->getInputType() != self::INPUT_DATA))
		{
			return null;
		}

		return $this->data;
	}

	/**
	 * Set the raw input data
	 *
	 * @param   string  $data
	 */
	public function setData(string $data): void
	{
		$this->data = $data;

		if (is_resource($this->fp))
		{
			try
			{
				@fclose($this->fp);
			}
			catch (\Throwable $e)
			{
			}
		}

		$this->file = null;
		$this->fp   = null;
	}

	/**
	 * Return a reference to the raw input data
	 *
	 * @return  string|null
	 */
	public function &getDataReference(): ?string
	{
		if (empty($this->data) && ($this->getInputType() != self::INPUT_DATA))
		{
			$this->data = null;
		}

		return $this->data;
	}

	/**
	 * Set the raw input data by doing an assignment instead of memory copy. While this conserves memory you cannot use
	 * this with hardcoded strings, method results etc without going through a variable first.
	 *
	 * @param   string  $data
	 */
	public function assignData(string &$data): void
	{
		$this->data = $data;

		if (is_resource($this->fp))
		{
			try
			{
				@fclose($this->fp);
			}
			catch (\Throwable $e)
			{
			}
		}

		$this->file = null;
		$this->fp   = null;
	}

	/**
	 * Returns the size of the data to be uploaded, in bytes. If it's not already specified it will try to guess.
	 *
	 * @return  int
	 */
	public function getSize(): int
	{
		if ($this->size < 0)
		{
			$this->size = $this->getInputSize();
		}

		return $this->size;
	}

	/**
	 * Set the size of the data to be uploaded.
	 *
	 * @param   int  $size
	 */
	public function setSize(int $size)
	{
		$this->size = $size;
	}

	/**
	 * Get the MIME type of the data
	 *
	 * @return  string|null
	 */
	public function getType(): ?string
	{
		if (empty($this->type))
		{
			$this->type = 'application/octet-stream';

			if ($this->getInputType() == self::INPUT_FILE)
			{
				$this->type = $this->getMimeType($this->file);
			}
		}

		return $this->type;
	}

	/**
	 * Set the MIME type of the data
	 *
	 * @param   string|null  $type
	 */
	public function setType(?string $type)
	{
		$this->type = $type;
	}

	/**
	 * Get the MD5 sum of the content
	 *
	 * @return  null|string
	 */
	public function getMd5sum(): ?string
	{
		if ($this->md5sum === '')
		{
			return null;
		}

		if (is_null($this->md5sum))
		{
			$this->md5sum = $this->calculateMd5();
		}

		return $this->md5sum;
	}

	/**
	 * Set the MD5 sum of the content as a base64 encoded string of the raw MD5 binary value.
	 *
	 * WARNING: Do not set a binary MD5 sum or a hex-encoded MD5 sum, it will result in an invalid signature error!
	 *
	 * Set to null to automatically calculate it from the raw data. Set to an empty string to force it to never be
	 * calculated and no value for it set either.
	 *
	 * @param   string|null  $md5sum
	 */
	public function setMd5sum(?string $md5sum): void
	{
		$this->md5sum = $md5sum;
	}

	/**
	 * Get the SHA-256 hash of the content
	 *
	 * @return  string
	 */
	public function getSha256(): string
	{
		if (empty($this->sha256))
		{
			$this->sha256 = $this->calculateSha256();
		}

		return $this->sha256;
	}

	/**
	 * Set the SHA-256 sum of the content. It must be a lowercase hexadecimal encoded string.
	 *
	 * Set to null to automatically calculate it from the raw data.
	 *
	 * @param   string|null  $sha256
	 */
	public function setSha256(?string $sha256): void
	{
		$this->sha256 = is_null($sha256) ? null : strtolower($sha256);
	}

	/**
	 * Get the Upload Session ID for multipart uploads
	 *
	 * @return  string|null
	 */
	public function getUploadID(): ?string
	{
		return $this->UploadID;
	}

	/**
	 * Set the Upload Session ID for multipart uploads
	 *
	 * @param   string|null  $UploadID
	 */
	public function setUploadID(?string $UploadID): void
	{
		$this->UploadID = $UploadID;
	}

	/**
	 * Get the part number for multipart uploads.
	 *
	 * Returns null if the part number has not been set yet.
	 *
	 * @return  int|null
	 */
	public function getPartNumber(): ?int
	{
		return $this->PartNumber;
	}

	/**
	 * Set the part number for multipart uploads
	 *
	 * @param   int  $PartNumber
	 */
	public function setPartNumber(int $PartNumber): void
	{
		// Clamp the part number to integers greater than zero.
		$this->PartNumber = max(1, (int) $PartNumber);
	}

	/**
	 * Get the list of ETags for multipart uploads
	 *
	 * @return  string[]
	 */
	public function getEtags(): array
	{
		return $this->etags;
	}

	/**
	 * Set the list of ETags for multipart uploads
	 *
	 * @param   string[]  $etags
	 */
	public function setEtags(array $etags): void
	{
		$this->etags = $etags;
	}

	/**
	 * Calculates the upload size from the input source. For data it's the entire raw string length. For a file resource
	 * it's the entire file's length. For seekable stream resources it's the remaining data from the current seek
	 * position to EOF.
	 *
	 * WARNING: You should never try to specify files or resources over 2Gb minus 1 byte otherwise 32-bit versions of
	 * PHP (anything except Linux x64 builds) will fail in unpredictable ways: the internal int representation in PHP
	 * depends on the target platform and is typically a signed 32-bit integer.
	 *
	 * @return  int
	 */
	private function getInputSize(): int
	{
		switch ($this->getInputType())
		{
			case self::INPUT_DATA:
				return function_exists('mb_strlen') ? mb_strlen($this->data ?? '', '8bit') : strlen($this->data ?? '');
				break;

			case self::INPUT_FILE:
				clearstatcache(true, $this->file);

				$filesize = @filesize($this->file);

				return ($filesize === false) ? 0 : $filesize;
				break;

			case self::INPUT_RESOURCE:
				$meta = stream_get_meta_data($this->fp);

				if ($meta['seekable'])
				{
					$pos    = ftell($this->fp);
					$endPos = fseek($this->fp, 0, SEEK_END);
					fseek($this->fp, $pos, SEEK_SET);

					return $endPos - $pos + 1;
				}

				break;
		}

		return 0;
	}

	/**
	 * Get the MIME type of a file
	 *
	 * @param   string  $file  The absolute path to the file for which we want to get the MIME type
	 *
	 * @return  string  The MIME type of the file
	 */
	private function getMimeType(string $file): string
	{
		$type = false;

		// Fileinfo documentation says fileinfo_open() will use the
		// MAGIC env var for the magic file
		if (extension_loaded('fileinfo') && isset($_ENV['MAGIC']) &&
			($finfo = finfo_open(FILEINFO_MIME, $_ENV['MAGIC'])) !== false
		)
		{
			if (($type = finfo_file($finfo, $file)) !== false)
			{
				// Remove the charset and grab the last content-type
				$type = explode(' ', str_replace('; charset=', ';charset=', $type));
				$type = array_pop($type);
				$type = explode(';', $type);
				$type = trim(array_shift($type));
			}

			if (version_compare(PHP_VERSION, '8.5.0', 'lt'))
			{
				finfo_close($finfo);
			}
		}
		elseif (function_exists('mime_content_type'))
		{
			$type = trim(mime_content_type($file));
		}

		if ($type !== false && strlen($type) > 0)
		{
			return $type;
		}

		// Otherwise do it the old fashioned way
		static $exts = [
			'jpg'  => 'image/jpeg',
			'gif'  => 'image/gif',
			'png'  => 'image/png',
			'tif'  => 'image/tiff',
			'tiff' => 'image/tiff',
			'ico'  => 'image/x-icon',
			'swf'  => 'application/x-shockwave-flash',
			'pdf'  => 'application/pdf',
			'zip'  => 'application/zip',
			'gz'   => 'application/x-gzip',
			'tar'  => 'application/x-tar',
			'bz'   => 'application/x-bzip',
			'bz2'  => 'application/x-bzip2',
			'txt'  => 'text/plain',
			'asc'  => 'text/plain',
			'htm'  => 'text/html',
			'html' => 'text/html',
			'css'  => 'text/css',
			'js'   => 'text/javascript',
			'xml'  => 'text/xml',
			'xsl'  => 'application/xsl+xml',
			'ogg'  => 'application/ogg',
			'mp3'  => 'audio/mpeg',
			'wav'  => 'audio/x-wav',
			'avi'  => 'video/x-msvideo',
			'mpg'  => 'video/mpeg',
			'mpeg' => 'video/mpeg',
			'mov'  => 'video/quicktime',
			'flv'  => 'video/x-flv',
			'php'  => 'text/x-php',
		];

		$ext = strtolower(pathInfo($file, PATHINFO_EXTENSION));

		return $exts[$ext] ?? 'application/octet-stream';
	}

	/**
	 * Calculate the MD5 sum of the input data
	 *
	 * @return  string  Base-64 encoded MD5 sum
	 */
	private function calculateMd5(): string
	{
		switch ($this->getInputType())
		{
			case self::INPUT_DATA:
				return base64_encode(
					function_exists('hash')
						? hash('md5', $this->data, true)
						: md5($this->data, true)
				);
				break;

			case self::INPUT_FILE:
				return base64_encode(
					function_exists('hash_file')
						? hash_file('md5', $this->file, true)
						: md5_file($this->file, true)
				);
				break;

			case self::INPUT_RESOURCE:
				$ctx   = hash_init('md5');
				$pos   = ftell($this->fp);
				$size  = $this->getSize();
				$done  = 0;
				$batch = min(1048576, $size);

				while ($done < $size)
				{
					$toRead = min($batch, $done - $size);
					$data   = @fread($this->fp, $toRead);
					hash_update($ctx, $data);
					unset($data);
				}

				fseek($this->fp, $pos, SEEK_SET);

				return base64_encode(hash_final($ctx, true));

				break;
		}

		return '';
	}

	/**
	 * Calcualte the SHA256 data of the input data
	 *
	 * @return  string  Lowercase hex representation of the SHA-256 sum
	 */
	private function calculateSha256(): string
	{
		$inputType = $this->getInputType();
		switch ($inputType)
		{
			case self::INPUT_DATA:
				return hash('sha256', $this->data, false);
				break;

			case self::INPUT_FILE:
			case self::INPUT_RESOURCE:
				if ($inputType == self::INPUT_FILE)
				{
					$filesize = @filesize($this->file);
					$fPos     = @ftell($this->fp);

					if (($filesize == $this->getSize()) && ($fPos === 0))
					{
						return hash_file('sha256', $this->file, false);
					}
				}

				$ctx   = hash_init('sha256');
				$pos   = ftell($this->fp);
				$size  = $this->getSize();
				$done  = 0;
				$batch = min(1048576, $size);

				while ($done < $size)
				{
					$toRead = min($batch, $size - $done);
					$data   = @fread($this->fp, $toRead);
					$done   += $toRead;
					hash_update($ctx, $data);
					unset($data);
				}

				fseek($this->fp, $pos, SEEK_SET);

				return hash_final($ctx, false);

				break;
		}

		return '';
	}
}
