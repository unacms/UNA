<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

if (!file_exists("./inc/header.inc.php")) {
    // this is dynamic page - send headers to not cache this page
    $now = gmdate('D, d M Y H:i:s') . ' GMT';
    header("Expires: $now");
    header("Last-Modified: $now");
    header("Cache-Control: no-cache, must-revalidate");
    header("Pragma: no-cache");

    $bHasInstaller = file_exists("install/index.php");
    $sTitle = $bHasInstaller ? 'Initiating Installation' : 'Installation files are missing';
    header('Content-Type: text/html; charset=utf-8');
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo htmlspecialchars($sTitle, ENT_QUOTES, 'UTF-8'); ?></title>
<?php if ($bHasInstaller): ?>
    <meta http-equiv="refresh" content="2;url=install/index.php" />
<?php endif; ?>
    <style>
        :root {
            --bx-flash-bg: #f4f5f7;
            --bx-flash-text: #111827;
            --bx-flash-muted: #6b7280;
            --bx-flash-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        html, body {
            margin: 0;
            height: 100%;
        }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bx-flash-bg);
            font-family: var(--bx-flash-font);
            color: var(--bx-flash-text);
            -webkit-font-smoothing: antialiased;
        }
        .bx-install-flash {
            text-align: center;
            padding: 24px;
        }
        .bx-install-flash img {
            display: block;
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            border-radius: 16px;
        }
        .bx-install-flash p {
            margin: 0;
            font-size: 16px;
            font-weight: 550;
            letter-spacing: -0.01em;
            color: var(--bx-flash-muted);
        }
        .bx-install-flash-pulse {
            animation: bx-install-flash-pulse 1.4s ease-in-out infinite;
        }
        @keyframes bx-install-flash-pulse {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="bx-install-flash">
        <img src="install/img/logo.svg" alt="UNA" />
        <p class="bx-install-flash-pulse"><?php echo htmlspecialchars($sTitle, ENT_QUOTES, 'UTF-8'); ?></p>
    </div>
<?php if ($bHasInstaller): ?>
    <script>setTimeout(function () { location.href = 'install/index.php'; }, 1400);</script>
<?php endif; ?>
</body>
</html>
    <?php
    exit;
}

// php -S ignores .htaccess. Apache rewrites missing paths to r.php?_q=$1
// (and /m/, /page/, /s/). When this file is the built-in-server 404 fallback
// or router, do the same. Existing files stay files (return false as router).
$sPhpSPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (false === $sPhpSPath || null === $sPhpSPath || '' === $sPhpSPath)
    $sPhpSPath = '/';
$sPhpSPath = rawurldecode($sPhpSPath);
$sPhpSScript = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/index.php');
if ('/' !== $sPhpSPath && '/index.php' !== $sPhpSPath && $sPhpSScript !== $sPhpSPath) {
    $sPhpSRoot = rtrim(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT'] ?? __DIR__), '/');
    $sPhpSFile = $sPhpSRoot . $sPhpSPath;
    if ('cli-server' === PHP_SAPI && is_file($sPhpSFile))
        return false;

    if (preg_match('#^/m/(.*)$#', $sPhpSPath, $aPhpS)) {
        $_GET['r'] = $aPhpS[1];
        require_once('./modules/index.php');
        exit;
    }
    if (preg_match('#^/page/(.*)$#', $sPhpSPath, $aPhpS)) {
        $_GET['i'] = $aPhpS[1];
        require_once('./page.php');
        exit;
    }
    if (preg_match('#^/s/([a-zA-Z0-9_]+)/([a-zA-Z0-9.]+)#', $sPhpSPath, $aPhpS)) {
        $_GET['o'] = $aPhpS[1];
        $_GET['f'] = $aPhpS[2];
        require_once('./storage.php');
        exit;
    }

    $_GET['_q'] = ltrim($sPhpSPath, '/');
    require_once('./r.php');
    exit;
}

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "profiles.inc.php");

if (!isLogged() && getParam('sys_site_splash_enabled') && false === strpos($_SERVER['HTTP_USER_AGENT'], 'UNAMobileApp')) {
    require_once("./splash.php");
    exit;
}

$_GET['i'] = 'home';
require_once("./page.php");

/** @} */
