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
JUnit report: `logs/junit.xml`.

Unit tests only:
```
phing test-units
```
or:
```
composer test-units
```
JUnit report: `logs/junit-units.xml`.

Integration tests only:
```
phing test-integration
```
or:
```
composer test-integration
```
JUnit report: `logs/junit-integration.xml`.

Integration tests read `tests/.env` when present (`cp tests/.env.example tests/.env`). Without that file they use installer defaults. Tests skip an account that is not installed.
