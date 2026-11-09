# Breaking changes

This document records breaking changes in the library and how to address them.

## Version 2.0

Version 2.0 of the library (released November 2020) dropped support for PHP 5.3 to 7.0 inclusive.

The most significant change in this version is that all methods use scalar type hints for parameters and return values. This _may_ break existing consumers which relied on implicit type conversion.

## Version 2.3

Up to and including version 2.2 of the library, the namespace was `\Akeeba\Engine\Postproc\Connector\S3v4`.

Version 2.3 of the library (released September 2023) the namespace has changed to `\Akeeba\S3`.

The library automatically registers aliases of the old classes to the new ones, thus ensuring updating the library will not introduce backwards incompatible changes. This is why it's not a major version update. Aliases will remain in place until at least version 3.0 of the library.

> [!IMPORTANT]
> If you are using this library in a Joomla! extension or WordPress plugin please use a custom namespace when using this library to avoid namespace clashes with our own software such as Akeeba Backup. You can do that semi-automatically using `coenjacobs/mozart` or `humbug/php-scoper`.

## Version 2.4

Version 2.4 of the library (released October 2025) dropped support for PHP 7.1 to 7.3 inclusive.

The most significant change in this version is compatibility with PHP 8.5. This necessitated dropping support for anything older than PHP 7.4.

## Version 2.6

We moved away from our testing framework (`minitest`) to PHPUnit. Please consult [TESTING.md](../TESTING.md) for testing instructions.