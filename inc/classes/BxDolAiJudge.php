<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * "Judge" AI models (capabilities = judge).
 *
 * Unlike chat (chatllm/chatvlm) and embeddings models a judge does not generate text.
 * It evaluates typed questions against a state (string / array) and returns structured,
 * machine-readable answers: booleans as probabilities (noul), a choice from a fixed list
 * with a probability distribution (choice) or a score on a rubric (score).
 *
 * Judge models are NOT NeuronAI providers and can not be assigned to agents;
 * use them from code: moderation, guardrails, intent routing, search query parsing, etc.
 *
 * Usage:
 * @code
 *  $oJudge = BxDolAiJudge::getInstance(); // default (first active) judge model, or getInstance($iModelId)
 *  $aAnswers = $oJudge->ask($sText, [
 *      'spam' => BxDolAiJudge::noul('Is this message unsolicited advertising?'),
 *      'topic' => BxDolAiJudge::choice('What is the message about?', ['billing' => 'Payments', 'support' => 'Bugs, help requests', 'other' => 'Anything else']),
 *      'anger' => BxDolAiJudge::score('How angry is the author?', ['Calm', 'Irritated', 'Furious']),
 *  ]);
 *  // $aAnswers['spam']['noul'] => 0.93
 *  // $aAnswers['topic']['choice'] => 'support', ['confidence'] => 0.81, ['probabilities'] => [...]
 *  // $aAnswers['anger']['score'] => 1, ['confidence'] => 0.9
 * @endcode
 */
abstract class BxDolAiJudge extends BxDolFactory
{
    const CAPABILITY = 'judge';

    const Q_NOUL = 'noul';
    const Q_CHOICE = 'choice';
    const Q_SCORE = 'score';

    protected $_aModel;
    protected $_aParams;
    protected $_aLastUsage = [];
    protected $_sLastModel = '';
    protected $_sLastError = '';
    protected $_aLastRequest = [];
    protected $_aLastAnswers = [];

    public function __construct(array $aModel, array $aParams)
    {
        $this->_aModel = $aModel;
        $this->_aParams = $aParams;
    }

    /**
     * Get judge instance by model id; when id is empty the first active judge model is used.
     * Returns false when no judge model is configured/active (errors are logged).
     */
    public static function getInstance(int $iModelId = 0)
    {
        if (!$iModelId)
            $iModelId = self::getDefaultModelId();

        if (!$iModelId) {
            bx_log('sys_agents', "No active judge AI model is configured", BX_LOG_WARN);
            return false;
        }

        try {
            return BxDolAIModelFactory::getJudgeInstance($iModelId);
        }
        catch (Exception $oException) {
            bx_log('sys_agents', "Judge AI model {$iModelId} can't be instantiated: " . $oException->getMessage(), BX_LOG_ERR);
            return false;
        }
    }

    /**
     * Id of the first active model with capabilities = judge, 0 if none.
     */
    public static function getDefaultModelId(): int
    {
        $aPairs = BxDolAi::getInstance()->getModels(['active' => true, 'capabilities' => self::CAPABILITY]);
        if (empty($aPairs) || !is_array($aPairs))
            return 0;

        reset($aPairs);
        return (int)key($aPairs);
    }

    public function getModel(): array
    {
        return $this->_aModel;
    }

    public function getModelId(): int
    {
        return (int)$this->_aModel['id'];
    }

    /**
     * Token usage reported by the provider for the last ask() call: ['input_tokens' => N, 'output_tokens' => N]
     */
    public function getLastUsage(): array
    {
        return $this->_aLastUsage;
    }

    /**
     * Exact model version reported by the provider for the last ask() call (e.g. jev-1.13.0)
     */
    public function getLastModel(): string
    {
        return $this->_sLastModel;
    }

    /**
     * Request body sent to the provider by the last ask() call (for debugging)
     */
    public function getLastRequest(): array
    {
        return $this->_aLastRequest;
    }

    /**
     * Raw answers returned by the provider for the last ask() call (for debugging)
     */
    public function getLastAnswers(): array
    {
        return $this->_aLastAnswers;
    }

    /**
     * Error message of the last failed askSafe() call, '' when it succeeded
     */
    public function getLastError(): string
    {
        return $this->_sLastError;
    }

    // question builders ------------------------

    /**
     * Yes/no question, answered as a probability 0..1
     * @param $mixedInstructions string|array question text (or structured instructions)
     * @param $aCriteria optional ['true' => 'what counts as yes', 'false' => 'what counts as no']
     */
    public static function noul($mixedInstructions, array $aCriteria = []): array
    {
        $a = ['type' => self::Q_NOUL, 'instructions' => $mixedInstructions];
        if ($aCriteria)
            $a['criteria'] = $aCriteria;
        return $a;
    }

    /**
     * Pick one option, answered as choice + probabilities + confidence
     * @param $mixedInstructions string|array question text
     * @param $aCriteria ['option_key' => 'description', ...] (2..255 options)
     */
    public static function choice($mixedInstructions, array $aCriteria): array
    {
        return ['type' => self::Q_CHOICE, 'instructions' => $mixedInstructions, 'criteria' => $aCriteria];
    }

    /**
     * Rate on a rubric, answered as score (index of level, 0-based) + probabilities + confidence
     * @param $mixedInstructions string|array question text
     * @param $aCriteria list of 2..10 level descriptions, from lowest to highest
     */
    public static function score($mixedInstructions, array $aCriteria): array
    {
        return ['type' => self::Q_SCORE, 'instructions' => $mixedInstructions, 'criteria' => array_values($aCriteria)];
    }

    // shortcuts ------------------------

    /**
     * Ask a single yes/no question.
     * @return float|null probability 0..1 or null on failure
     */
    public function isTrue($mixedState, $mixedInstructions, array $aCriteria = [])
    {
        $aAnswers = $this->askSafe($mixedState, ['q' => self::noul($mixedInstructions, $aCriteria)]);
        return isset($aAnswers['q']['noul']) ? (float)$aAnswers['q']['noul'] : null;
    }

    /**
     * Ask a single choice question.
     * @return array|null ['choice' => key, 'confidence' => 0..1, 'probabilities' => [...]] or null on failure
     */
    public function pick($mixedState, $mixedInstructions, array $aCriteria)
    {
        $aAnswers = $this->askSafe($mixedState, ['q' => self::choice($mixedInstructions, $aCriteria)]);
        return isset($aAnswers['q']['choice']) ? $aAnswers['q'] : null;
    }

    /**
     * Ask a single score question.
     * @return array|null ['score' => int, 'confidence' => 0..1, 'probabilities' => [...], 'legend' => [...]] or null on failure
     */
    public function rate($mixedState, $mixedInstructions, array $aCriteria)
    {
        $aAnswers = $this->askSafe($mixedState, ['q' => self::score($mixedInstructions, $aCriteria)]);
        return isset($aAnswers['q']['score']) ? $aAnswers['q'] : null;
    }

    /**
     * Same as ask() but never throws: logs the error and returns empty array.
     */
    public function askSafe($mixedState, array $aQuestions): array
    {
        $this->_sLastError = '';
        try {
            return $this->ask($mixedState, $aQuestions);
        }
        catch (Exception $oException) {
            $this->_sLastError = $oException->getMessage();
            bx_log('sys_agents', "Judge AI model {$this->getModelId()} ask failed: " . $this->_sLastError, BX_LOG_ERR);
            return [];
        }
    }

    /**
     * Evaluate questions against the state.
     * @param $mixedState string|array text or structured data to evaluate
     * @param $aQuestions ['question_id' => question built with noul()/choice()/score(), ...]
     * @return array ['question_id' => answer, ...] where answer is
     *   noul:   ['type' => 'noul', 'noul' => 0..1]
     *   choice: ['type' => 'choice', 'choice' => key, 'confidence' => 0..1, 'probabilities' => [key => 0..1]]
     *   score:  ['type' => 'score', 'score' => int, 'confidence' => 0..1, 'probabilities' => [level => 0..1], 'legend' => [level => text]]
     * @throws Exception on transport / provider errors
     */
    abstract public function ask($mixedState, array $aQuestions): array;
}

/** @} */
