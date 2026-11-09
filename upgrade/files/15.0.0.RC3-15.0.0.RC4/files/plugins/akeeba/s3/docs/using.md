# Using the library

You need to define a constant before using or referencing any class in the library:

```php
defined('AKEEBAENGINE') or define('AKEEBAENGINE', 1);
```

All library files have a line similar to

```php
defined('AKEEBAENGINE') or die();
```

to prevent direct access to the libraries files. This is intentional. The primary use case for this library is mass-distributed software which gets installed in a publicly accessible subdirectory of the web root. This line prevents any accidental path disclosure from PHP error messages if someone were to access these files directly on misconfigured servers.

If you are writing a Joomla extension, especially a plugin or module, please _always_ check if the constant has already been defined before defining it yourself. Thank you!

## Get a connector object

```php
$configuration = new \Akeeba\S3\Configuration(
	'YourAmazonAccessKey',
	'YourAmazonSecretKey'
);

$connector = new \Akeeba\S3\Connector($configuration);
```

If you are running inside an Amazon EC2 instance you can fetch temporary credentials from the instance's metadata
server using the IAM Role attached to the EC2 instance. In this case you need to do this (169.254.169.254 is a fixed
IP hosting the instance's metadata cache service):

```php
$role = file_get_contents('http://169.254.169.254/latest/meta-data/iam/security-credentials/');
$jsonCredentials = file_get_contents('http://169.254.169.254/latest/meta-data/iam/security-credentials/' . $role);
$credentials = json_decode($jsonCredentials, true);
$configuration = new \Akeeba\S3\Configuration(
	$credentials['AccessKeyId'],
	$credentials['SecretAccessKey'],
	'v4',
	$yourRegion
);
$configuration->setToken($credentials['Token']);

$connector = new \Akeeba\S3\Connector($configuration);
```

where `$yourRegion` is the AWS region of your bucket, e.g. `us-east-1`. Please note that we are passing the security
token (`$credentials['Token']`) to the Configuration object. This is REQUIRED. The temporary credentials returned by
the metadata service won't work without it.

Another point worth noting is that the temporary credentials don't last forever. Check the `$credentials['Expiration']` to see
when they are about to expire. Amazon recommends that you retry fetching new credentials from the metadata service
10 minutes before your cached credentials are set to expire. The metadata service is guaranteed to provision fresh
temporary credentials by that time.

## Listing buckets

```php
$listing = $connector->listBuckets(true);
```

Returns an array like this:

```
array(2) {
  'owner' =>
  array(2) {
    'id' =>
    string(64) "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    'name' =>
    string(8) "someUserName"
  }
  'buckets' =>
  array(3) {
    [0] =>
    array(2) {
      'name' =>
      string(10) "mybucket"
      'time' =>
      int(1267730711)
    }
    [1] =>
    array(2) {
      'name' =>
      string(10) "anotherbucket"
      'time' =>
      int(1269516249)
    }
    [2] =>
    array(2) {
      'name' =>
      string(11) "differentbucket"
      'time' =>
      int(1354458048)
    }
  }
}
```

Amazon no longer sends the owner's display name, so `owner.name` is an empty string unless the service provides one.

## Listing bucket contents

```php
$listing = $connector->getBucket('mybucket', 'path/to/list/');
```

If you want to list "subdirectories" you need to do

```php
$listing = $connector->getBucket('mybucket', 'path/to/list/', null, null, '/', true);
```

The last parameter (common prefixes) controls the listing of "subdirectories"

## Uploading (small) files

From a file:

```php
$input = \Akeeba\S3\Input::createFromFile($sourceFile);   
$connector->putObject($input, 'mybucket', 'path/to/myfile.txt');
```

From a string:

```php
$input = \Akeeba\S3\Input::createFromData($sourceString);   
$connector->putObject($input, 'mybucket', 'path/to/myfile.txt');
```

From a stream resource:

```php
$input = \Akeeba\S3\Input::createFromResource($streamHandle, false);   
$connector->putObject($input, 'mybucket', 'path/to/myfile.txt');
```

In all cases the entirety of the file has to be loaded in memory.

## Uploading large file with multipart (chunked) uploads

Files are uploaded in 5Mb chunks.

```php
$input = \Akeeba\S3\Input::createFromFile($sourceFile);
$uploadId = $connector->startMultipart($input, 'mybucket', 'mypath/movie.mov');

$eTags = array();
$eTag = null;
$partNumber = 0;

do
{
	// IMPORTANT: You MUST create the input afresh before each uploadMultipart call
	$input = \Akeeba\S3\Input::createFromFile($sourceFile);
	$input->setUploadID($uploadId);
	$input->setPartNumber(++$partNumber);
	
	$eTag = $connector->uploadMultipart($input, 'mybucket', 'mypath/movie.mov');

	if (!is_null($eTag))
	{
		$eTags[] = $eTag;
	}
}
while (!is_null($eTag));

// IMPORTANT: You MUST create the input afresh before finalising the multipart upload
$input = \Akeeba\S3\Input::createFromFile($sourceFile);
$input->setUploadID($uploadId);
$input->setEtags($eTags);

$connector->finalizeMultipart($input, 'mybucket', 'mypath/movie.mov');
```

As long as you keep track of the UploadId, PartNumber and ETags you can have each uploadMultipart call in a separate
page load to prevent timeouts.

## Get presigned URLs

Allows browsers to download files directly without exposing your credentials and without going through your server:

```php
$preSignedURL = $connector->getAuthenticatedURL('mybucket', 'path/to/file.jpg', 60);
```

The last parameter controls how many seconds into the future this URL will be valid.

## Download

To a file with absolute path `$targetFile`

```php
$connector->getObject('mybucket', 'path/to/file.jpg', $targetFile);
```

To a string

```php
$content = $connector->getObject('mybucket', 'path/to/file.jpg', false);
```

## Delete an object

```php
$connector->deleteObject('mybucket', 'path/to/file.jpg');
```

## Test if an object exists

```php
try
{
    $headers = $connector->headObject('mybucket', 'path/to/file.jpg');
    $exists  = true;
}
catch (\Akeeba\S3\Exception\CannotGetFile $e)
{
    $headers = [];
    $exists  = false;
}
```

The `$headers` variable contains an array with the S3 headers returned by the [HeadObject(https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html) API call. The header keys are always in lowercase. Please note that _not all_ of the headers Amazon describes in their documentation are returned in every request.

## Notes on S3-compatible services

During our testing we found the following quirks in third-party S3-compatible services.

**Wasabi** nominally supports v4 signatures but reads the date only from `x-amz-date`; the library therefore always
sends it. Endpoint, region, and the bucket's region must match.

**Synology C2** implements Amazon's _documentation_ of how dates are using in the v4 signature method, not what Amazon _actually_ does; the library works around it. The region is the part of the endpoint before `.s3.` (`eu-002`), which Synology does not document.