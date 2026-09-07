ABOUT
=====

Unit tests for UNA.

INSTALLATION
============

1. Get composer.

http://getcomposer.org/doc/00-intro.md#installation-nix


2. Install dependences.

Run the following from the script root folder (includes test tools from `require-dev`):
```
composer.phar install
```
or:
```
composer install
```

Alternatively:
```
phing prepare
```

Production / package installs should omit test tools:
```
composer install --no-dev
```


USING
=====

Run the following command from the script root folder after installation:
```
./plugins/bin/phpunit -c tests/phpunit.xml
```
or:
```
composer test
```

Alternatively:
```
phing test
```
