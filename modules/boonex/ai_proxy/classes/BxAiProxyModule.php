<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AIProxy AI Proxy
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAiProxyModule extends BxDolModule
{
    function __construct($aModule)
    {
        parent::__construct($aModule);
    }

    public function serviceGetModelOptions()
    {
        $aResult = [
            ['key' => '', 'value' => _t('_Select_one')],
        ];

        $aModels = (new BxDolAiQuery())->getModelsBy([
            'sample' => 'all_pairs',
            'active' => 1,
            'capabilities' => ['chatvlm', 'chatllm'],
            'type_not' => 'una-proxy',
        ]);
        if (!is_array($aModels))
            return $aResult;

        foreach ($aModels as $iId => $sTitle)
            $aResult[] = ['key' => (int)$iId, 'value' => (string)$sTitle];

        return $aResult;
    }

    public function completions(): void
    {
        bx_import('Auth', $this->_aModule);
        bx_import('Completion', $this->_aModule);

        $sBody = file_get_contents('php://input');
        if ($sBody === false)
            $sBody = '';

        $aAuth = (new BxAiProxyAuth())->authenticateRequest(
            $this->requestHeader('X-Una-Key'),
            $this->requestHeader('X-Una-Sign'),
            $sBody
        );
        if (empty($aAuth['ok']))
            $this->jsonError(401, 'Unauthorized', 'authentication_error');

        $aBody = json_decode($sBody, true);
        if (!is_array($aBody))
            $this->jsonError(400, 'Bad request', 'invalid_request_error');

        $bStarted = false;
        try {
            $iId = (int)getParam('bx_ai_proxy_model');
            $this->assertChatModel($iId);
            $fFactory = static function (int $iModelId) {
                return BxDolAIModelFactory::getModelInstance($iModelId);
            };
            $oCompletion = new BxAiProxyCompletion();
            if (!empty($aBody['stream'])) {
                $oCompletion->run($aBody, $iId, $fFactory, function (string $sEvent) use (&$bStarted) {
                    if (!$bStarted) {
                        header('Content-Type: text/event-stream; charset=utf-8');
                        header('Cache-Control: no-cache');
                        header('X-Accel-Buffering: no');
                        $bStarted = true;
                    }
                    echo $sEvent;
                    if (ob_get_level())
                        ob_flush();
                    flush();
                });
                return;
            }

            $sJson = $oCompletion->run($aBody, $iId, $fFactory);
            header('Content-Type: application/json; charset=utf-8');
            echo (string)$sJson;
        }
        catch (BxAiProxyException $oException) {
            if ($bStarted || headers_sent())
                return;
            $sType = 'server_error';
            if ($oException->httpCode() === 400)
                $sType = 'invalid_request_error';
            elseif ($oException->httpCode() === 401)
                $sType = 'authentication_error';
            $this->jsonError($oException->httpCode(), $oException->getMessage(), $sType);
        }
        catch (Throwable $oException) {
            bx_log('sys_agents', 'AI proxy failed: ' . $oException->getMessage(), BX_LOG_ERR);
            if ($bStarted || headers_sent())
                return;
            $this->jsonError(503, 'The proxy model is not available', 'server_error');
        }
    }

    public function requestHeader(string $sName): string
    {
        $sServer = 'HTTP_' . strtoupper(str_replace('-', '_', $sName));
        foreach ([$sServer, 'REDIRECT_' . $sServer] as $sKey) {
            if (isset($_SERVER[$sKey]) && (string)$_SERVER[$sKey] !== '')
                return trim((string)$_SERVER[$sKey]);
        }

        if (function_exists('getallheaders')) {
            $aHeaders = getallheaders();
            if (is_array($aHeaders)) {
                foreach ($aHeaders as $sHeader => $sValue) {
                    if (strcasecmp((string)$sHeader, $sName) === 0)
                        return trim((string)$sValue);
                }
            }
        }

        return '';
    }

    protected function assertChatModel(int $iId): void
    {
        bx_import('Completion', $this->_aModule);

        if ($iId <= 0)
            throw new BxAiProxyException(503, 'The proxy model is not available');

        $aModel = BxDolAiQuery::getModelObject($iId);
        if (!is_array($aModel) || empty($aModel['active']))
            throw new BxAiProxyException(503, 'The proxy model is not available');
        if (!in_array((string)($aModel['capabilities'] ?? ''), ['chatllm', 'chatvlm'], true))
            throw new BxAiProxyException(503, 'The proxy model is not available');
        if ((string)($aModel['type'] ?? '') === 'una-proxy')
            throw new BxAiProxyException(503, 'The proxy model is not available');
    }

    protected function jsonError(int $iCode, string $sMessage, string $sType): void
    {
        http_response_code($iCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => [
                'message' => $sMessage,
                'type' => $sType,
            ],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/** @} */
