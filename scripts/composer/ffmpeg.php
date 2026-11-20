<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Downloads the static ffmpeg build that matches this machine's OS and CPU into
 * plugins/ffmpeg/ffmpeg.exe (the path BX_SYSTEM_FFMPEG points to by default).
 * Composer runs it after install and update (see "fetch-ffmpeg" in composer.json).
 *
 * UNA_FFMPEG_PLATFORM overrides the detected platform, for example
 * UNA_FFMPEG_PLATFORM=linux-arm64 when building a package for arm64 servers on an x64 host.
 * UNA_FFMPEG_SKIP=1 skips the download (a server that uses its own ffmpeg).
 */

class BxComposerFfmpeg
{
    const RELEASE = 'b6.1.1';
    const URL = 'https://github.com/eugeneware/ffmpeg-static/releases/download/%s/ffmpeg-%s.gz';

    /**
     * sha256 of each release asset (the .gz file), as GitHub lists them.
     */
    const ASSETS = [
        'linux-x64' => 'bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa',
        'linux-arm64' => '754a678672298bc68156adff58aa7385a592c2b30b1d0ae8750c45c915c4bac0',
        'linux-arm' => '64b115a12f0ab77c277e3c418aae8b40ef881e75e746a0e2d066a206b9bc5172',
        'linux-ia32' => '169b27c078a8ecedb814cac67afccf15a9868d63e9d74ef86088adefaa500d00',
        'darwin-x64' => '929b375c1182d956c51f7ac25e0b2b0411fb01f6f407aa15c9758efeb4242106',
        'darwin-arm64' => '8923876afa8db5585022d7860ec7e589af192f441c56793971276d450ed3bbfa',
        'win32-x64' => '8883a3dffbd0a16cf4ef95206ea05283f78908dbfb118f73c83f4951dcc06d77',
    ];

    /**
     * The release asset for an OS family (PHP_OS_FAMILY) and a machine type (php_uname('m')),
     * or null when the release has no build for it.
     */
    public static function getPlatform(string $sOsFamily, string $sMachine): ?string
    {
        $sMachine = strtolower($sMachine);
        if (in_array($sMachine, ['x86_64', 'amd64', 'x64'], true))
            $sArch = 'x64';
        elseif (in_array($sMachine, ['aarch64', 'arm64', 'armv8', 'armv8l'], true))
            $sArch = 'arm64';
        elseif (str_starts_with($sMachine, 'armv7') || str_starts_with($sMachine, 'armv6'))
            $sArch = 'arm';
        elseif (in_array($sMachine, ['i386', 'i486', 'i586', 'i686', 'x86'], true))
            $sArch = 'ia32';
        else
            return null;

        $sOs = match ($sOsFamily) {
            'Linux' => 'linux',
            'Darwin' => 'darwin',
            'Windows' => 'win32',
            default => null,
        };
        if ($sOs === null)
            return null;

        $sPlatform = $sOs . '-' . $sArch;
        return isset(self::ASSETS[$sPlatform]) ? $sPlatform : null;
    }

    /**
     * @return int process exit code; 0 also when ffmpeg is skipped, since UNA works without it
     */
    public static function run(string $sPluginsDir): int
    {
        if (getenv('UNA_FFMPEG_SKIP')) {
            self::say('UNA_FFMPEG_SKIP is set, ffmpeg is not downloaded.');
            return 0;
        }

        $sPlatform = getenv('UNA_FFMPEG_PLATFORM') ?: self::getPlatform(PHP_OS_FAMILY, php_uname('m'));
        if (!$sPlatform || !isset(self::ASSETS[$sPlatform])) {
            self::say('No ffmpeg build for ' . PHP_OS_FAMILY . ' ' . php_uname('m') . '. Install ffmpeg on the server and set UNA_FFMPEG_PATH (or BX_SYSTEM_FFMPEG in inc/header.inc.php) to it.', true);
            return 0;
        }

        $sDir = rtrim($sPluginsDir, '/') . '/ffmpeg';
        $sTarget = $sDir . '/ffmpeg.exe';
        $sStamp = $sDir . '/.platform';
        $sWant = self::RELEASE . ' ' . $sPlatform;
        if (is_file($sTarget) && is_file($sStamp) && trim((string)file_get_contents($sStamp)) === $sWant) {
            self::say('ffmpeg ' . $sWant . ' is already in place.');
            return 0;
        }

        $sUrl = sprintf(self::URL, self::RELEASE, $sPlatform);
        self::say('Downloading ffmpeg ' . $sWant . ' from ' . $sUrl);
        $sGz = @file_get_contents($sUrl, false, stream_context_create(['http' => ['follow_location' => 1, 'timeout' => 600, 'user_agent' => 'una-composer']]));
        if ($sGz === false || $sGz === '') {
            self::say('ffmpeg download failed; video transcoding will not work until plugins/ffmpeg/ffmpeg.exe is in place.', true);
            return 0;
        }
        if (!hash_equals(self::ASSETS[$sPlatform], hash('sha256', $sGz))) {
            self::say('ffmpeg download has an unexpected checksum, discarded.', true);
            return 1;
        }

        $sBin = gzdecode($sGz);
        if ($sBin === false) {
            self::say('ffmpeg download could not be unpacked.', true);
            return 1;
        }

        if (!is_dir($sDir) && !mkdir($sDir, 0755, true)) {
            self::say('Can not create ' . $sDir, true);
            return 1;
        }

        // Write next to the target and rename, so a running transcoder never reads a half-written file.
        $sTmp = $sTarget . '.tmp';
        if (file_put_contents($sTmp, $sBin) === false || !chmod($sTmp, 0755) || !rename($sTmp, $sTarget)) {
            @unlink($sTmp);
            self::say('Can not write ' . $sTarget, true);
            return 1;
        }
        file_put_contents($sStamp, $sWant . "\n");

        // Left over by the old composer package of the x64 build.
        if (is_dir($sDir . '/ffmpeg')) {
            @unlink($sDir . '/ffmpeg/ffmpeg-linux-x64');
            @rmdir($sDir . '/ffmpeg');
        }

        self::say('ffmpeg ' . $sWant . ' saved to ' . $sTarget);
        return 0;
    }

    protected static function say(string $s, bool $bWarn = false): void
    {
        if ($bWarn)
            fwrite(STDERR, 'Warning: ' . $s . "\n");
        else
            echo $s . "\n";
    }
}

if (PHP_SAPI === 'cli' && isset($argv[0]) && realpath($argv[0]) === __FILE__)
    exit(BxComposerFfmpeg::run($argv[1] ?? dirname(__DIR__, 2) . '/plugins'));
