# Configuration options

The Configuration option has optional methods which can be used to enable some useful features in the connector.

You need to execute these methods against the Configuration object before passing it to the Connector's constructor. For example:

```php
$configuration = new \Akeeba\S3\Configuration(
	'YourAmazonAccessKey',
	'YourAmazonSecretKey'
);

// Use v4 signatures and Dualstack URLs
$configuration->setSignatureMethod('v4');
$configuration->setUseDualstackUrl(true);

$connector = new \Akeeba\S3\Connector($configuration);
```

## HTTPS vs plain HTTP

**It is not recommended to use plain HTTP connections to Amazon S3**. If, however, you have no other option you can tell the Configuration object to use plain HTTP URLs:

```php
$configuration->setSSL(false);
```

Caveat: HTTPS will only work if PHP can verify the TLS certificate of your endpoint. This may not be the case when using a local testing service (e.g. LocalStack), or for some buckets with dots in their names. Moreover, if you are on Windows, do note that neither PHP comes with a Certification Authority cache, nor is there a system-wide CA cache; you'll have to [download](https://curl.se/docs/caextract.html) it and configure PHP, or use [composer/ca-bundle](https://packagist.org/packages/composer/ca-bundle) in your `composer.json` file.

## Custom endpoint

You can use the Akeeba Amazon S3 Connector library with S3-compatible APIs such as DigitalOcean's Spaces by changing the endpoint URL.

If the S3-compatible API uses v4 signatures, enter the region-specific endpoint domain name, and the region when initializing the object. Setting the endpoint does not change the signature method or the region you chose. For example:

```php
// DigitalOcean Spaces using v4 signatures
// The access credentials are those used in the example at https://developers.digitalocean.com/documentation/spaces/
$configuration = new \Akeeba\S3\Configuration(
	'532SZONTQ6ALKBCU94OU',
	'zCkY83KVDXD8u83RouEYPKEm/dhPSPB45XsfnWj8fxQ',
    'v4',
    'nyc3'
);
$configuration->setEndpoint('nyc3.digitaloceanspaces.com');

$connector = new \Akeeba\S3\Connector($configuration);
```

If your S3-compatible API uses v2 signatures you do not need to specify a region.

```php
// DigitalOcean Spaces using v2 signatures
// The access credentials are those used in the example at https://developers.digitalocean.com/documentation/spaces/
$configuration = new \Akeeba\S3\Configuration(
	'532SZONTQ6ALKBCU94OU',
	'zCkY83KVDXD8u83RouEYPKEm/dhPSPB45XsfnWj8fxQ',
    'v2'
);
$configuration->setEndpoint('nyc3.digitaloceanspaces.com');

$connector = new \Akeeba\S3\Connector($configuration);
```

## Legacy path-style access

The S3 API calls made by this library will use by default the subdomain-style access. That is to say, the endpoint will be prefixed with the name of the bucket. For example, a bucket called `example` in the `eu-west-1` region will be accessed using the endpoint URL `example.s3.eu-west-1.amazonaws.com`.

If you have buckets with characters that are invalid in the context of DNS (most notably dots and uppercase characters) this will fail. You will need to use the legacy path style instead. In this case the endpoint used is the generic region specific one (`s3.eu-west-1.amazonaws.com` in our example above), and the API URL will be prefixed with the bucket name.

You need to do:
```php
$configuration->setUseLegacyPathStyle(true);
```

Caveats:
* This will not work with v2 signatures if you are using Amazon AWS S3 proper. It will very likely work with the v2 signatures if you are using a custom endpoint, though.
* With v4 signatures, pre-authorised (pre-signed) URLs follow this option too: the bucket goes in the path. On Amazon S3 proper these URLs use the bucket's regional endpoint (`s3.eu-west-1.amazonaws.com/example/…` in our example above).

## Dualstack (IPv4 and IPv6) support

Amazon S3 supports dual-stack URLs which resolve to both IPv4 and IPv6 addresses. By default they are _not_ used. If you want to enable this feature you need to do:

```php
$connector->setUseDualstackUrl(true);
```

Caveat: This option only takes effect if you are using Amazon S3 proper. It will _not_ have any effect with custom endpoints. DualStack support is deprecated by Amazon S3. We strongly advise you NOT to use it anymore.

## Alternate Date Format

By default, this library uses the standard date format `D, d M Y H:i:s O` which Amazon _incorrectly_ documents as "ISO 8601" (it's not, see the [ISO 8601 Wikipedia entry](https://en.wikipedia.org/wiki/ISO_8601) for reference). Most third party, Amazon S3-compatible services use the same and understand it just fine.

A minority of services don't understand the GMT offset at the end of the date format, and instead need the format `D, d M Y H:i:s T`. You can set a flag to enable this behaviour like so:
```php
$configuration->setAlternateDateHeaderFormat(true);
```

Caveat: Enabling this flag breaks compatibility with S3 proper.

## Using The HTTP Date Header Instead Of X-Amz-Date

Amazon documents that you should be using the standard HTTP `Date` header, and only resort to using the `X-Amz-Date` header when using the standard header is impossible, e.g. when creating pre-authorised (signed) URLs, or when your HTTP library does not let you set the standard header.

Unfortunately, some third party S3-compatible services such as Wasabi and ExoScale do _NOT_ support the standard `Date` header at all. Using it makes them falsely spit out a message about the signature being wrong. They are the reason why, by default, we are passing the request date and time using the `X-Amz-Date` header.

If you are using a third party service which for any reason does not understand the `X-Amz-Date` header you need to set a flag which forces the use of the standard `Date` header like so:
```php
$configuration->setUseHTTPDateHeader(true);
```

## Connection and request timeouts

By default, the connector does not impose any explicit time limit on its HTTP requests; the underlying cURL defaults apply. You can set two independent timeouts, both expressed in whole seconds:

```php
// Give up if the connection to the endpoint is not established within 10 seconds
$configuration->setConnectTimeout(10);

// Give up if the entire request has not completed within 120 seconds
$configuration->setRequestTimeout(120);
```

`setConnectTimeout()` limits only the time spent establishing the connection to the S3 endpoint. `setRequestTimeout()` limits the total time allowed for the whole request, including the transfer of the request and response bodies.

A value of `0` (the default) means no explicit limit is applied. Negative values are clamped to `0`.

Caveat: `setRequestTimeout()` applies to the request as a whole. When you are uploading or downloading large objects you must allow enough time for the transfer to complete, otherwise the request will be aborted mid-transfer. If in doubt, leave it at its default of `0` (no limit).

## Debug information in error messages

When S3 returns an error, the exception message contains the method, the HTTP status and S3's error code and message. You can also ask for a dump of S3's whole error response ("Debug info") to be appended:

```php
$configuration->setDebug(true);
```

This is off by default, because applications often show exception messages to their users. Even when it is on, the signed request S3 echoes back on a signature mismatch (`StringToSign`, `CanonicalRequest`, `SignatureProvided` and their hex forms) is left out, as it may contain the session token of temporary credentials.
