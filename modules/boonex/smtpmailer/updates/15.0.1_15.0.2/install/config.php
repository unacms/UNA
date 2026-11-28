<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'SMTP Mailer',
    'version_from' => '15.0.1',
    'version_to' => '15.0.2',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/smtpmailer/updates/update_15.0.1_15.0.2/',
    'home_uri' => 'smtpmailer_update_1501_1502',

    'module_dir' => 'boonex/smtpmailer/',
    'module_uri' => 'smtpmailer',

    'db_prefix' => 'bx_smtp_',
    'class_prefix' => 'BxSMTP',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'update_files' => 1,
        'execute_sql' => 1,
        'update_languages' => 0,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => 'SMTP Mailer',

    /**
     * Files Section
     */
    'delete_files' => array(
        'composer.json',
        'composer.lock',
        'vendor/autoload.php',
        'vendor/composer/ClassLoader.php',
        'vendor/composer/InstalledVersions.php',
        'vendor/composer/LICENSE',
        'vendor/composer/autoload_classmap.php',
        'vendor/composer/autoload_namespaces.php',
        'vendor/composer/autoload_psr4.php',
        'vendor/composer/autoload_real.php',
        'vendor/composer/autoload_static.php',
        'vendor/composer/installed.json',
        'vendor/composer/installed.php',
        'vendor/composer/platform_check.php',
        'vendor/firebase/php-jwt/CHANGELOG.md',
        'vendor/firebase/php-jwt/LICENSE',
        'vendor/firebase/php-jwt/README.md',
        'vendor/firebase/php-jwt/composer.json',
        'vendor/firebase/php-jwt/src/BeforeValidException.php',
        'vendor/firebase/php-jwt/src/CachedKeySet.php',
        'vendor/firebase/php-jwt/src/ExpiredException.php',
        'vendor/firebase/php-jwt/src/JWK.php',
        'vendor/firebase/php-jwt/src/JWT.php',
        'vendor/firebase/php-jwt/src/JWTExceptionWithPayloadInterface.php',
        'vendor/firebase/php-jwt/src/Key.php',
        'vendor/firebase/php-jwt/src/SignatureInvalidException.php',
    ),
);
