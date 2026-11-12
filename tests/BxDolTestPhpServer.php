<?php

/**
 * PHP built-in web server on a free local port, for tests which check real status lines and headers:
 * the CLI SAPI doesn't keep the headers a script sends.
 */
class BxDolTestPhpServer
{
    private $_rProcess;
    private $_iPort;
    private $_sHost;

    /**
     * @param $sDocRoot document root
     * @param $sRouter router script, every request goes to it when it is set
     * @param $sHost Host header to send, the scripts which load inc/header.inc.php redirect to the site host otherwise
     */
    public function __construct(string $sDocRoot, ?string $sRouter = null, ?string $sHost = null)
    {
        if (!function_exists('proc_open'))
            throw new RuntimeException('proc_open is not available.');

        $rSocket = stream_socket_server('tcp://127.0.0.1:0', $iErr, $sErr);
        if (!$rSocket)
            throw new RuntimeException('No free port: ' . $sErr);
        $this->_iPort = (int)parse_url('tcp://' . stream_socket_get_name($rSocket, false), PHP_URL_PORT);
        fclose($rSocket);

        $this->_sHost = $sHost ?: '127.0.0.1:' . $this->_iPort;

        $aCommand = [PHP_BINARY, '-d', 'xdebug.mode=off', '-S', '127.0.0.1:' . $this->_iPort, '-t', $sDocRoot];
        if ($sRouter)
            $aCommand[] = $sRouter;

        $this->_rProcess = proc_open($aCommand, [0 => ['pipe', 'r'], 1 => ['file', '/dev/null', 'a'], 2 => ['file', '/dev/null', 'a']], $aPipes, $sDocRoot);
        if (!is_resource($this->_rProcess))
            throw new RuntimeException('The server did not start.');

        for ($i = 0; $i < 100; ++$i) {
            if ($r = @stream_socket_client('tcp://127.0.0.1:' . $this->_iPort, $iErr, $sErr, 1)) {
                fclose($r);
                return;
            }
            usleep(50000);
        }

        $this->stop();
        throw new RuntimeException('The server is not listening on port ' . $this->_iPort . '.');
    }

    public function stop(): void
    {
        if (!is_resource($this->_rProcess))
            return;

        proc_terminate($this->_rProcess);
        proc_close($this->_rProcess);
        $this->_rProcess = null;
    }

    /**
     * Send a request and read the whole response.
     * @param $aHeaders header name => value
     * @param $sBody request body, sent with its Content-Length
     * @return array with 'status' (int), 'headers' (lowercase name => list of values) and 'body'
     */
    public function request(string $sMethod, string $sUri, array $aHeaders = [], string $sBody = ''): array
    {
        $r = stream_socket_client('tcp://127.0.0.1:' . $this->_iPort, $iErr, $sErr, 5);
        if (!$r)
            throw new RuntimeException('No connection: ' . $sErr);
        stream_set_timeout($r, 30);

        $s = $sMethod . ' ' . $sUri . " HTTP/1.1\r\nHost: " . $this->_sHost . "\r\nConnection: close\r\n";
        foreach ($aHeaders as $sName => $sValue)
            $s .= $sName . ': ' . $sValue . "\r\n";
        if ($sBody !== '')
            $s .= 'Content-Length: ' . strlen($sBody) . "\r\n";
        fwrite($r, $s . "\r\n" . $sBody);

        $sResponse = stream_get_contents($r);
        fclose($r);

        $aParts = explode("\r\n\r\n", $sResponse, 2);
        $aLines = explode("\r\n", $aParts[0]);
        if (!preg_match('#^HTTP/\d\.\d (\d{3})#', array_shift($aLines), $aMatches))
            throw new RuntimeException('Not an HTTP response: ' . $sResponse);

        $aResult = ['status' => (int)$aMatches[1], 'headers' => [], 'body' => isset($aParts[1]) ? $aParts[1] : ''];
        foreach ($aLines as $sLine) {
            $a = explode(':', $sLine, 2);
            $aResult['headers'][strtolower(trim($a[0]))][] = isset($a[1]) ? trim($a[1]) : '';
        }

        return $aResult;
    }

    /**
     * The value of a response header, null when the response has no such header.
     */
    public static function header(array $aResponse, string $sName): ?string
    {
        return isset($aResponse['headers'][$sName]) ? implode(', ', $aResponse['headers'][$sName]) : null;
    }
}
