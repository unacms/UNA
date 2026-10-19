<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Client errors before they are stored: what is kept of a message and a stack (no query
 * strings, no tokens, no addresses), the fingerprint that groups repeats of one error, and
 * the route a page belongs to.
 *
 * Messages and stacks come from visitors' browsers and apps, so everything here treats them
 * as untrusted text: control characters go, lengths are capped, and reports escape them.
 */
class BxAnalyticsErrors
{
    /**
     * Kinds a client may send: uncaught JS errors, unhandled promise rejections, React render
     * errors (error boundaries), native app errors (the RN global handler), failed requests
     * (status 500 and up), and scripts or styles that failed to load.
     */
    const KINDS = ['js', 'promise', 'react', 'native', 'http', 'resource'];

    /**
     * The catch-all group for errors past the new groups limit.
     */
    const KIND_OVERFLOW = 'overflow';

    const MAX_MESSAGE_INPUT = 500;
    const MAX_MESSAGE = 255;
    const MAX_SOURCE = 255;
    const MAX_STACK_INPUT = 8000;
    const MAX_STACK = 4000;
    const MAX_FRAMES = 30;

    const REDACTED = '<redacted>';

    /**
     * Text without control characters, secrets, query strings or the site's own host in
     * URLs, cut to a length.
     *
     * @param string $s the text
     * @param int $iMax characters kept
     * @param array $aOwnHosts the site's hosts, removed from URLs (other hosts stay)
     * @param bool $bLines keep line breaks (stacks)
     */
    public static function sanitize($s, $iMax, $aOwnHosts = [], $bLines = false)
    {
        $s = (string)$s;
        if($s === '')
            return '';

        if(!mb_check_encoding($s, 'UTF-8'))
            $s = mb_convert_encoding($s, 'UTF-8', 'UTF-8');

        $s = str_replace("\r\n", "\n", $s);
        $s = preg_replace($bLines ? '/[\x00-\x09\x0B-\x1F\x7F]+/u' : '/[\x00-\x1F\x7F]+/u', ' ', $s);

        $aHosts = array_map('mb_strtolower', array_filter((array)$aOwnHosts));

        // URLs: no query string or fragment, and no host when it is the site's own; a
        // stack frame's :line:column after the URL stays
        $s = preg_replace_callback('~\b(?:https?|wss?)://[^\s()<>"\'`]+~i', function($aMatch) use ($aHosts) {
            $sUrl = $aMatch[0];
            $sPosition = '';
            if(preg_match('/^(.*?)((?::\d+){1,2})$/su', $sUrl, $aPosition)) {
                $sUrl = $aPosition[1];
                $sPosition = $aPosition[2];
            }

            $sUrl = preg_replace('/[?#].*$/s', '', $sUrl);

            if(preg_match('~^[a-z]+://([^/:]+)(:\d+)?(/.*)?$~i', $sUrl, $aParts) && in_array(mb_strtolower($aParts[1]), $aHosts, true))
                $sUrl = isset($aParts[3]) && $aParts[3] !== '' ? $aParts[3] : '/';

            return $sUrl . $sPosition;
        }, $s);

        // a site's own relative URLs (an http error's "HTTP 502 /page.php?i=x&id=5"): only
        // the page parameters stay of their query strings
        $s = preg_replace_callback('~(?<![\w.:/-])/[^\s()<>"\'`?#]*\?[^\s()<>"\'`#:]*~u', function($aMatch) {
            return self::getCleanPath($aMatch[0], false);
        }, $s);

        $s = self::redact($s);

        if($bLines)
            $s = preg_replace('/[ ]+\n/u', "\n", $s);

        return trim(get_mb_substr(trim($s), 0, $iMax));
    }

    /**
     * Tokens, passwords, emails and long random strings replaced.
     */
    public static function redact($s)
    {
        $aPatterns = [
            // JSON web tokens
            '/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/' => self::REDACTED,
            '/\b(Bearer|Basic)\s+[^\s"\'`,;]+/i' => '$1 ' . self::REDACTED,
            // values of names that hold secrets: token=..., api_key=..., "password":"...",
            // otp: ... (a serialized object or form in a message)
            '/(["\']?)\b([A-Za-z_]*(?:token|key|secret|password|passwd|pass|pwd|auth|sid|session|otp))\1(\s*[:=]\s*)(?:"[^"]*"|\'[^\']*\'|[^&\s"\'`,;}]+)/i' => '$1$2$1$3' . self::REDACTED,
            '/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/' => self::REDACTED,
            // long hex (hashes, ids) and long base64-like runs with digits and both cases
            '/(?<![A-Za-z0-9])[0-9a-fA-F]{24,}(?![A-Za-z0-9])/' => self::REDACTED,
            '/(?<![A-Za-z0-9+_-])(?=[A-Za-z0-9+_-]*[0-9])(?=[A-Za-z0-9+_-]*[A-Z])(?=[A-Za-z0-9+_-]*[a-z])[A-Za-z0-9+_-]{24,}={0,2}/' => self::REDACTED,
        ];

        foreach($aPatterns as $sPattern => $sReplacement) {
            $sResult = preg_replace($sPattern, $sReplacement, $s);
            if($sResult !== null)
                $s = $sResult;
        }

        return $s;
    }

    /**
     * A stack trace (and a React component stack after it) sanitized, at most 30 frames.
     */
    public static function sanitizeStack($sStack, $sComponentStack = '', $aOwnHosts = [])
    {
        $sStack = self::_frames(self::sanitize(get_mb_substr((string)$sStack, 0, self::MAX_STACK_INPUT), self::MAX_STACK_INPUT, $aOwnHosts, true));

        $sComponentStack = self::_frames(self::sanitize(get_mb_substr((string)$sComponentStack, 0, self::MAX_STACK_INPUT), self::MAX_STACK_INPUT, $aOwnHosts, true));
        if($sComponentStack !== '')
            $sStack .= ($sStack !== '' ? "\n--\n" : '') . $sComponentStack;

        return get_mb_substr($sStack, 0, self::MAX_STACK);
    }

    /**
     * Noise that is never stored: "Script error." without a stack (a cross-origin script
     * the browser hides), and errors of browser extensions.
     */
    public static function isNoise($sMessage, $sStack, $sSource)
    {
        if($sStack === '' && preg_match('/^Script error\.?$/i', trim($sMessage)))
            return true;

        $aFrame = self::getTopFrame($sStack);
        foreach([$sSource, $aFrame ? $aFrame['file'] : ''] as $sFile)
            if(preg_match('~^[a-z-]*extension://~i', (string)$sFile))
                return true;

        return false;
    }

    /**
     * Whether a message matches one of the ignore patterns (* for any characters, case
     * doesn't matter).
     */
    public static function isIgnored($sMessage, $aPatterns)
    {
        foreach($aPatterns as $sPattern) {
            $sPattern = trim((string)$sPattern);
            if($sPattern === '')
                continue;

            if(preg_match('/^' . str_replace('\*', '.*', preg_quote($sPattern, '/')) . '$/isu', trim($sMessage)))
                return true;
        }

        return false;
    }

    /**
     * The message with what changes between repeats replaced: UUIDs, hex and numbers,
     * quoted values. Line breaks and runs of spaces become one space.
     */
    public static function normalizeMessage($sMessage)
    {
        $s = (string)$sMessage;
        $s = preg_replace('/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i', '<uuid>', $s);
        $s = preg_replace('/\b0x[0-9a-f]+\b/i', '0x0', $s);
        $s = preg_replace('/\b(?=[0-9a-f]*[0-9])(?=[0-9a-f]*[a-f])[0-9a-f]{8,}\b/i', '<hex>', $s);
        // quotes that open a value, not an apostrophe inside a word
        $s = preg_replace('/(?<![\p{L}\p{N}])(["\'`])[^"\'`\n]*\1/u', '""', $s);
        $s = preg_replace('/\d+(\.\d+)?/', '0', $s);

        return trim(preg_replace('/\s+/u', ' ', $s));
    }

    /**
     * The top frame of a stack in the Chrome/V8/Hermes (`at fn (file:1:2)`) or the
     * Firefox/Safari (`fn@file:1:2`) format.
     *
     * @return array|null with `function`, `file`, `line`, `col`
     */
    public static function getTopFrame($sStack)
    {
        foreach(explode("\n", (string)$sStack) as $sLine) {
            $sLine = trim($sLine);
            if($sLine === '' || $sLine === '--')
                continue;

            if(preg_match('/^at\s+(?:(.+?)\s+\()?(.+?)(?::(\d+))?(?::(\d+))?\)?$/', $sLine, $a) && (isset($a[3]) && $a[3] !== '' || bx_mb_strpos($a[2], '/') !== false))
                return self::_frame(isset($a[1]) ? $a[1] : '', $a[2], isset($a[3]) ? $a[3] : 0, isset($a[4]) ? $a[4] : 0);

            if(preg_match('/^([^@\s]*)@(.+?)(?::(\d+))?(?::(\d+))?$/', $sLine, $a))
                return self::_frame($a[1], $a[2], isset($a[3]) ? $a[3] : 0, isset($a[4]) ? $a[4] : 0);
        }

        return null;
    }

    /**
     * A script's path with what changes between deployments replaced by *: the content
     * hashes of Next.js chunks (app/[...path]/page-*.js, 5123-*.js and *.js keep apart) and
     * of UNA's combined files and other bundles.
     */
    public static function normalizeFile($sFile)
    {
        $s = preg_replace('/[?#].*$/s', '', trim((string)$sFile));
        $s = preg_replace('~(?<=[/._-])(?=[0-9a-z]*[0-9])[0-9a-z]{8,}(?=\.m?js$)~i', '*', $s);
        $s = preg_replace('/(?<=[._-])(?=[0-9a-z]*[0-9])[0-9a-z]{8,}(?=[._-])/i', '*', $s);
        $s = str_replace(self::REDACTED, '*', $s);

        return $s;
    }

    /**
     * 16 bytes that are the same for every repeat of an error: kind, normalized message,
     * the file and function of the top frame (the source file without a stack), and the
     * HTTP status. Line and column are left out: they change with every build of a
     * minified script.
     *
     * @param array $aError with `kind`, `message`, `stack`, `source`, `status`
     */
    public static function getFingerprint($aError)
    {
        $aFrame = self::getTopFrame(isset($aError['stack']) ? $aError['stack'] : '');

        return substr(hash('sha256', implode('|', [
            isset($aError['kind']) ? $aError['kind'] : '',
            self::normalizeMessage(isset($aError['message']) ? $aError['message'] : ''),
            self::normalizeFile($aFrame ? $aFrame['file'] : (isset($aError['source']) ? $aError['source'] : '')),
            $aFrame ? $aFrame['function'] : '',
            isset($aError['status']) ? (int)$aError['status'] : 0,
        ]), true), 0, 16);
    }

    /**
     * The group past the new groups limit takes.
     */
    public static function getOverflowError()
    {
        return ['kind' => self::KIND_OVERFLOW, 'message' => '', 'source' => '', 'line' => 0, 'col' => 0, 'status' => 0, 'stack' => '', 'fatal' => 0];
    }

    /**
     * A page's path as error and vitals hits keep it: of the query string only the page
     * parameters `i` and `r` stay (the trackers send no more, this strips a client that
     * does), and tokens and emails are redacted. Report filters on the path of these hits
     * pass a pageview's path through it too.
     *
     * @param string $sPath a path with its query string, decoded
     * @param bool $bRedact also redact secrets
     */
    public static function getCleanPath($sPath, $bRedact = true)
    {
        $aParts = explode('?', preg_replace('/#.*$/s', '', (string)$sPath), 2);

        $aKeep = [];
        if(isset($aParts[1]))
            foreach(explode('&', $aParts[1]) as $sPair) {
                $aPair = explode('=', $sPair, 2);
                if(in_array($aPair[0], ['i', 'r'], true) && isset($aPair[1]) && $aPair[1] !== '' && !isset($aKeep[$aPair[0]]))
                    $aKeep[$aPair[0]] = $aPair[0] . '=' . $aPair[1];
            }
        ksort($aKeep);

        $sPath = $aParts[0] . (!empty($aKeep) ? '?' . implode('&', $aKeep) : '');

        return $bRedact ? self::redact($sPath) : $sPath;
    }

    /**
     * The page a path belongs to, so one route collects the errors and timings of all its
     * items: the query string keeps only `i` (classic pages: page.php?i=view-post), and
     * ids, UUIDs, hashes and long tokens in the path become *.
     */
    public static function getRoute($sPath)
    {
        $aParts = explode('?', (string)$sPath, 2);

        $aSegments = [];
        foreach(explode('/', $aParts[0]) as $sSegment)
            $aSegments[] = self::_isVariableSegment($sSegment) ? '*' : $sSegment;
        $sRoute = implode('/', $aSegments);
        if($sRoute === '')
            $sRoute = '/';

        if(isset($aParts[1]))
            foreach(explode('&', $aParts[1]) as $sPair) {
                $aPair = explode('=', $sPair, 2);
                if($aPair[0] === 'i' && isset($aPair[1]) && $aPair[1] !== '') {
                    $sRoute .= '?i=' . $aPair[1];
                    break;
                }
            }

        return get_mb_substr($sRoute, 0, 128);
    }

    protected static function _isVariableSegment($sSegment)
    {
        if($sSegment === '')
            return false;

        return preg_match('/^\d+$/', $sSegment)
            || preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $sSegment)
            || preg_match('/^(?=[0-9a-f]*[0-9])[0-9a-f]{12,}$/i', $sSegment)
            || (get_mb_len($sSegment) >= 20 && preg_match('/^(?=.*[0-9])[A-Za-z0-9_-]+$/', $sSegment) && preg_match('/[A-Z]/', $sSegment))
            || $sSegment === self::REDACTED;
    }

    protected static function _frame($sFunction, $sFile, $iLine, $iCol)
    {
        $sFile = trim(preg_replace('/^address at\s+/i', '', trim($sFile)));
        $sFunction = trim(preg_replace('/^(async|new)\s+/', '', trim($sFunction)));

        return ['function' => $sFunction, 'file' => $sFile, 'line' => (int)$iLine, 'col' => (int)$iCol];
    }

    protected static function _frames($sStack)
    {
        if($sStack === '')
            return '';

        $aLines = [];
        foreach(explode("\n", $sStack) as $sLine) {
            $sLine = rtrim($sLine);
            if(trim($sLine) === '')
                continue;
            $aLines[] = $sLine;
            if(count($aLines) >= self::MAX_FRAMES)
                break;
        }

        return implode("\n", $aLines);
    }
}

/** @} */
