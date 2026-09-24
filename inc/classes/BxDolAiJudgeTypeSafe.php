<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * TypeSafe.ai judge (Jev / "System One" models) - https://docs.typesafe.ai
 *
 * Model row: type = typesafe, capabilities = judge, model = jev-latest | jev-preview | jev-1.13.0,
 * key = API key, params JSON:
 *   baseUri  - API root, default https://api.typesafe.ai/v1
 *   timeout  - request timeout in seconds, default 15
 *   retries  - how many times to retry on 429 / 529 / network error, default 2
 *
 * Limits (as of Jev 1.13): 64k tokens per request, 32k for state + longest question,
 * choice up to 255 options, score 2..10 levels, text only.
 */
class BxDolAiJudgeTypeSafe extends BxDolAiJudge
{
    const BASE_URI = 'https://api.typesafe.ai/v1';
    const ENDPOINT = '/systemone';

    protected $_sBaseUri;
    protected $_iTimeout;
    protected $_iRetries;

    public function __construct(array $aModel, array $aParams)
    {
        parent::__construct($aModel, $aParams);

        $this->_sBaseUri = rtrim(!empty($aParams['baseUri']) ? $aParams['baseUri'] : self::BASE_URI, '/');
        $this->_iTimeout = (int)($aParams['timeout'] ?? 15);
        $this->_iRetries = (int)($aParams['retries'] ?? 2);
    }

    public function ask($mixedState, array $aQuestions): array
    {
        if (!$aQuestions)
            throw new Exception('No questions');

        foreach ($aQuestions as $sId => $aQuestion)
            $this->_validateQuestion($sId, $aQuestion);

        $aRequest = [
            'state' => $mixedState,
            'model' => $this->_aModel['model'],
            'questions' => $aQuestions,
        ];
        $this->_aLastRequest = $aRequest;
        $this->_aLastAnswers = [];

        $aHeaders = [
            'Authorization: Bearer ' . trim($this->_aModel['key']),
            'Accept: application/json',
        ];

        $sUrl = $this->_sBaseUri . self::ENDPOINT;
        $iAttempt = 0;
        while (true) {
            $sHttpCode = 0;
            $sResponse = bx_file_get_contents($sUrl, $aRequest, 'post-json', $aHeaders, $sHttpCode, [], $this->_iTimeout);
            $iHttpCode = (int)$sHttpCode;

            if ($iHttpCode == 200 && $sResponse !== '' && $sResponse !== false)
                break;

            $bRetry = $iAttempt < $this->_iRetries && ($iHttpCode == 0 || $iHttpCode == 429 || $iHttpCode >= 500);
            if (!$bRetry)
                throw new Exception("TypeSafe API error: HTTP {$iHttpCode} " . $this->_errorFromResponse($sResponse));

            $iAttempt++;
            usleep(500000 * $iAttempt); // 0.5s, 1s, ...
        }

        $aResponse = json_decode($sResponse, true);
        if (!is_array($aResponse) || !isset($aResponse['answers']) || !is_array($aResponse['answers']))
            throw new Exception('TypeSafe API error: unexpected response ' . substr((string)$sResponse, 0, 300));

        $this->_aLastUsage = isset($aResponse['usage']) && is_array($aResponse['usage']) ? $aResponse['usage'] : [];
        $this->_sLastModel = (string)($aResponse['model'] ?? '');
        $this->_aLastAnswers = $aResponse['answers'];

        return $aResponse['answers'];
    }

    protected function _validateQuestion($sId, $aQuestion)
    {
        if (!is_array($aQuestion) || empty($aQuestion['type']) || !isset($aQuestion['instructions']))
            throw new Exception("Question '{$sId}' is malformed, use BxDolAiJudge::noul/choice/score");

        switch ($aQuestion['type']) {
            case self::Q_NOUL:
                break;
            case self::Q_CHOICE:
                $iOptions = isset($aQuestion['criteria']) && is_array($aQuestion['criteria']) ? count($aQuestion['criteria']) : 0;
                if ($iOptions < 2 || $iOptions > 255)
                    throw new Exception("Question '{$sId}': choice needs 2..255 options");
                break;
            case self::Q_SCORE:
                $iLevels = isset($aQuestion['criteria']) && is_array($aQuestion['criteria']) ? count($aQuestion['criteria']) : 0;
                if ($iLevels < 2 || $iLevels > 10)
                    throw new Exception("Question '{$sId}': score needs 2..10 levels");
                break;
            default:
                throw new Exception("Question '{$sId}': unknown type {$aQuestion['type']}");
        }
    }

    protected function _errorFromResponse($sResponse): string
    {
        if (!$sResponse)
            return '(empty response)';

        $a = json_decode($sResponse, true);
        if (is_array($a)) {
            if (!empty($a['error']))
                return is_array($a['error']) ? json_encode($a['error']) : (string)$a['error'];
            if (!empty($a['detail']))
                return is_array($a['detail']) ? json_encode($a['detail']) : (string)$a['detail'];
            if (!empty($a['message']))
                return (string)$a['message'];
        }

        return substr((string)$sResponse, 0, 300);
    }
}

/** @} */
