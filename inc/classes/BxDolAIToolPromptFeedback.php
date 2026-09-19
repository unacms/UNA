<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\ToolProperty;

class BxDolAIToolPromptFeedback extends BxDolAITool
{
    public const TABLE = 'sys_agents_prompt_feedback';

    protected const CLIP_FIELD = 20000;
    protected const CLIP_TURN = 1500;
    protected const EXCERPT_TURNS = 8;

    public function __construct()
    {
        parent::__construct(
            'prompt_feedback',
            'Log a wrong answer. Call when the user says you were wrong, corrects you, or you notice you broke a rule. Fill error_reason, expected_behavior, suggested_prompt_rule as reusable prompt text — not an apology. Question and wrong reply are taken from this chat if omitted.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'error_reason',
                type: PropertyType::STRING,
                description: 'Why the previous answer was wrong. Be specific: what fact, policy, tone, or missing step failed.',
                required: true
            ),
            new ToolProperty(
                name: 'expected_behavior',
                type: PropertyType::STRING,
                description: 'What the agent should have said or done instead. Include the correct answer when it is known.',
                required: true
            ),
            new ToolProperty(
                name: 'suggested_prompt_rule',
                type: PropertyType::STRING,
                description: 'One concise instruction to add or change in the system prompt so this failure does not repeat. Write it as a rule the agent can follow, not a description of this chat.',
                required: true
            ),
            new ToolProperty(
                name: 'category',
                type: PropertyType::STRING,
                description: 'hallucination | wrong_policy | wrong_tone | missing_info | tool_misuse | language | other',
                required: false
            ),
            new ToolProperty(
                name: 'severity',
                type: PropertyType::STRING,
                description: 'low | medium | high. high = wrong fact, leaked private data, or a broken business rule.',
                required: false
            ),
            new ToolProperty(
                name: 'user_question',
                type: PropertyType::STRING,
                description: 'Optional override of the user question that got the wrong answer. Leave empty to take it from chat history.',
                required: false
            ),
            new ToolProperty(
                name: 'wrong_answer',
                type: PropertyType::STRING,
                description: 'Optional override of the wrong assistant reply. Leave empty to take it from chat history.',
                required: false
            ),
            new ToolProperty(
                name: 'user_correction',
                type: PropertyType::STRING,
                description: 'Optional override of the user message that flagged the error. Leave empty to take the latest user line.',
                required: false
            ),
        ];
    }

    public function __invoke(
        string $error_reason,
        string $expected_behavior,
        string $suggested_prompt_rule,
        ?string $category = null,
        ?string $severity = null,
        ?string $user_question = null,
        ?string $wrong_answer = null,
        ?string $user_correction = null
    ): array {
        $oDb = BxDolDb::getInstance();
        self::ensureTable($oDb);

        $sReason = self::clip(trim((string)$error_reason), self::CLIP_FIELD);
        $sExpected = self::clip(trim((string)$expected_behavior), self::CLIP_FIELD);
        $sRule = self::clip(trim((string)$suggested_prompt_rule), self::CLIP_FIELD);
        if ($sReason === '' || $sExpected === '' || $sRule === '')
            throw new Exception('error_reason, expected_behavior and suggested_prompt_rule are required.');

        $aCtx = self::currentContext();
        $aTurns = self::turnsFromHistory($oDb, $aCtx['thread_id']);
        $aCase = self::extractCase($aTurns, [
            'user_question' => $user_question,
            'wrong_answer' => $wrong_answer,
            'user_correction' => $user_correction,
        ]);

        $iAdded = time();
        $sCategory = self::normalizeCategory($category);
        $sSeverity = self::normalizeSeverity($severity);
        $sExcerpt = self::excerpt($aTurns);
        $sMarkdown = self::caseMarkdown([
            'added' => $iAdded,
            'agent_id' => $aCtx['agent_id'],
            'agent_name' => $aCtx['agent_name'],
            'category' => $sCategory,
            'severity' => $sSeverity,
            'prompt_hash' => $aCtx['prompt_hash'],
            'prompt_system' => $aCtx['prompt_system'],
            'prompt_steps' => $aCtx['prompt_steps'],
            'prompt_output' => $aCtx['prompt_output'],
            'user_question' => $aCase['user_question'],
            'wrong_answer' => $aCase['wrong_answer'],
            'user_correction' => $aCase['user_correction'],
            'error_reason' => $sReason,
            'expected_behavior' => $sExpected,
            'suggested_prompt_rule' => $sRule,
            'conversation_excerpt' => $sExcerpt,
        ]);

        $oDb->query("INSERT INTO `" . self::TABLE . "` SET " . $oDb->arrayToSQL([
            'agent_id' => $aCtx['agent_id'],
            'agent_name' => $aCtx['agent_name'],
            'profile_id' => $aCtx['profile_id'],
            'thread_id' => $aCtx['thread_id'],
            'history_id' => $aCtx['history_id'],
            'category' => $sCategory,
            'severity' => $sSeverity,
            'user_question' => $aCase['user_question'],
            'wrong_answer' => $aCase['wrong_answer'],
            'user_correction' => $aCase['user_correction'],
            'error_reason' => $sReason,
            'expected_behavior' => $sExpected,
            'suggested_prompt_rule' => $sRule,
            'conversation_excerpt' => $sExcerpt,
            'prompt_system' => $aCtx['prompt_system'],
            'prompt_hash' => $aCtx['prompt_hash'],
            'markdown' => $sMarkdown,
            'added' => $iAdded,
        ]));

        return [
            'ok' => 1,
            'id' => (int)$oDb->lastId(),
            'agent_id' => $aCtx['agent_id'],
            'category' => $sCategory,
            'severity' => $sSeverity,
            'msg' => 'Logged. Do not mention the log to the user. Acknowledge the correction and continue with the expected behavior.',
        ];
    }

    public static function ensureTable(BxDolDb $oDb): void
    {
        if (!$oDb->isTableExists(self::TABLE)) {
            $oDb->query("CREATE TABLE IF NOT EXISTS `" . self::TABLE . "` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `agent_id` int(11) NOT NULL DEFAULT 0,
                `agent_name` varchar(255) NOT NULL DEFAULT '',
                `profile_id` int(11) NOT NULL DEFAULT 0,
                `thread_id` varchar(255) NOT NULL DEFAULT '',
                `history_id` int(11) NOT NULL DEFAULT 0,
                `category` varchar(32) NOT NULL DEFAULT 'other',
                `severity` varchar(16) NOT NULL DEFAULT 'medium',
                `user_question` mediumtext NOT NULL,
                `wrong_answer` mediumtext NOT NULL,
                `user_correction` mediumtext NOT NULL,
                `error_reason` mediumtext NOT NULL,
                `expected_behavior` mediumtext NOT NULL,
                `suggested_prompt_rule` mediumtext NOT NULL,
                `conversation_excerpt` mediumtext DEFAULT NULL,
                `prompt_system` mediumtext DEFAULT NULL,
                `prompt_hash` varchar(64) NOT NULL DEFAULT '',
                `markdown` mediumtext NOT NULL,
                `added` int(11) NOT NULL DEFAULT 0,
                PRIMARY KEY (`id`),
                KEY `agent_id` (`agent_id`),
                KEY `thread_id` (`thread_id`(191)),
                KEY `added` (`added`),
                KEY `prompt_hash` (`prompt_hash`)
            )");
            return;
        }

        if (!$oDb->isFieldExists(self::TABLE, 'markdown'))
            $oDb->query("ALTER TABLE `" . self::TABLE . "` ADD `markdown` mediumtext NOT NULL");
    }

    /**
     * Paste-ready case: dump `markdown` into an AI to improve the prompt.
     */
    public static function caseMarkdown(array $a): string
    {
        $sWhen = !empty($a['added']) ? gmdate('Y-m-d H:i', (int)$a['added']) . ' UTC' : '';
        $sName = (string)($a['agent_name'] ?? '');
        $iId = (int)($a['agent_id'] ?? 0);
        $sAgent = $sName !== '' ? '`' . $sName . '` (id ' . $iId . ')' : 'id ' . $iId;

        $aOut = [];
        $aOut[] = 'Improve this agent prompt from a real failure. Keep correct behavior. Add a concise testable rule. Do not invent product facts.';
        $aOut[] = '';
        $aOut[] = 'Agent: ' . $sAgent;
        $aOut[] = 'When: ' . $sWhen;
        $aOut[] = 'Category: ' . ($a['category'] ?? 'other') . ' / ' . ($a['severity'] ?? 'medium');
        $aOut[] = 'Prompt hash: ' . ($a['prompt_hash'] ?? '');
        $aOut[] = '';
        $aOut[] = '## Failure';
        $aOut[] = '';
        $aOut[] = 'User asked:';
        $aOut[] = self::mdBlock($a['user_question'] ?? '');
        $aOut[] = '';
        $aOut[] = 'Agent answered (wrong):';
        $aOut[] = self::mdBlock($a['wrong_answer'] ?? '');
        $aOut[] = '';
        $aOut[] = 'User correction:';
        $aOut[] = self::mdBlock($a['user_correction'] ?? '');
        $aOut[] = '';
        $aOut[] = 'Why it was wrong:';
        $aOut[] = self::mdBlock($a['error_reason'] ?? '');
        $aOut[] = '';
        $aOut[] = 'Expected behavior / correct answer:';
        $aOut[] = self::mdBlock($a['expected_behavior'] ?? '');
        $aOut[] = '';
        $aOut[] = 'Suggested prompt rule:';
        $aOut[] = self::mdBlock($a['suggested_prompt_rule'] ?? '');
        $aOut[] = '';
        $aOut[] = '## Conversation excerpt';
        $aOut[] = '';
        $aOut[] = self::mdBlock($a['conversation_excerpt'] ?? '');
        $aOut[] = '';
        $aOut[] = '## Prompt at the time of failure';
        $aOut[] = '';
        $aOut[] = 'prompt_system:';
        $aOut[] = self::mdBlock($a['prompt_system'] ?? '');
        $aOut[] = '';
        $aOut[] = 'prompt_steps:';
        $aOut[] = self::mdBlock($a['prompt_steps'] ?? '');
        $aOut[] = '';
        $aOut[] = 'prompt_output:';
        $aOut[] = self::mdBlock($a['prompt_output'] ?? '');

        return implode("\n", $aOut);
    }

    /**
     * @return array{agent_id:int,agent_name:string,profile_id:int,thread_id:string,history_id:int,prompt_system:string,prompt_hash:string,prompt_steps:string,prompt_output:string,prompt_tools:string}
     */
    public static function currentContext(): array
    {
        $oDb = BxDolDb::getInstance();

        $iAgentId = 0;
        $sThread = '';
        $iProfile = (int)bx_get_logged_profile_id();
        $aAgent = [];

        $iHistory = (int)BxDolAiChat::getInstance()->getCurrentChatHistoryId();

        if ($iHistory > 0) {
            $aRow = $oDb->getRow("SELECT `thread_id` FROM `sys_agents_chat_history` WHERE `id` = :id", ['id' => $iHistory]);
            $sThread = (string)($aRow['thread_id'] ?? '');
            $aParts = explode(':', $sThread);
            $iAgentId = (int)($aParts[1] ?? 0);
        }

        if ($iAgentId > 0)
            $aAgent = BxDolAiQuery::getAgentObject($iAgentId) ?: [];

        $sSystem = (string)($aAgent['prompt_system'] ?? '');
        $sSteps = (string)($aAgent['prompt_steps'] ?? '');
        $sOutput = (string)($aAgent['prompt_output'] ?? '');
        $sTools = (string)($aAgent['prompt_tools'] ?? '');

        return [
            'agent_id' => $iAgentId,
            'agent_name' => (string)($aAgent['name'] ?? ''),
            'profile_id' => $iProfile,
            'thread_id' => $sThread,
            'history_id' => $iHistory,
            'prompt_system' => self::clip($sSystem, self::CLIP_FIELD),
            'prompt_hash' => sha1($sSystem . "\n" . $sSteps . "\n" . $sOutput . "\n" . $sTools),
            'prompt_steps' => self::clip($sSteps, self::CLIP_FIELD),
            'prompt_output' => self::clip($sOutput, self::CLIP_FIELD),
            'prompt_tools' => self::clip($sTools, self::CLIP_FIELD),
        ];
    }

    /**
     * @return array<int, array{role:string,text:string}>
     */
    public static function turnsFromHistory(BxDolDb $oDb, string $sThread): array
    {
        if ($sThread === '')
            return [];

        $sJson = (string)$oDb->getOne("SELECT `messages` FROM `sys_agents_chat_history` WHERE `thread_id` = :t", [
            't' => $sThread,
        ]);
        $aStored = json_decode($sJson, true);
        if (!is_array($aStored))
            return [];

        $aTurns = [];
        foreach ($aStored as $aMessage) {
            if (!is_array($aMessage))
                continue;
            $sType = (string)($aMessage['type'] ?? '');
            if ($sType === 'tool_call' || $sType === 'tool_call_result')
                continue;
            $sRole = (string)($aMessage['role'] ?? '');
            if ($sRole === 'model')
                $sRole = 'assistant';
            if ($sRole !== 'user' && $sRole !== 'assistant')
                continue;
            $sText = self::textFromContent($aMessage['content'] ?? '');
            if ($sText === '')
                continue;
            $aTurns[] = ['role' => $sRole, 'text' => $sText];
        }
        return $aTurns;
    }

    /**
     * @param array<int, array{role:string,text:string}> $aTurns
     * @param array{user_question?:?string,wrong_answer?:?string,user_correction?:?string} $aOverride
     * @return array{user_question:string,wrong_answer:string,user_correction:string}
     */
    public static function extractCase(array $aTurns, array $aOverride = []): array
    {
        $sQuestion = self::clip(trim((string)($aOverride['user_question'] ?? '')), self::CLIP_FIELD);
        $sWrong = self::clip(trim((string)($aOverride['wrong_answer'] ?? '')), self::CLIP_FIELD);
        $sCorrection = self::clip(trim((string)($aOverride['user_correction'] ?? '')), self::CLIP_FIELD);

        $sLastUser = '';
        $sLastAssistant = '';
        $sPrevUser = '';
        for ($i = count($aTurns) - 1; $i >= 0; $i--) {
            $sRole = $aTurns[$i]['role'];
            $sText = $aTurns[$i]['text'];
            if ($sRole === 'user' && $sLastUser === '') {
                $sLastUser = $sText;
                continue;
            }
            if ($sRole === 'assistant' && $sLastAssistant === '' && $sLastUser !== '') {
                $sLastAssistant = $sText;
                continue;
            }
            if ($sRole === 'user' && $sLastAssistant !== '' && $sPrevUser === '') {
                $sPrevUser = $sText;
                break;
            }
        }

        if ($sCorrection === '')
            $sCorrection = self::clip($sLastUser, self::CLIP_FIELD);
        if ($sWrong === '')
            $sWrong = self::clip($sLastAssistant, self::CLIP_FIELD);
        if ($sQuestion === '')
            $sQuestion = self::clip($sPrevUser !== '' ? $sPrevUser : $sLastUser, self::CLIP_FIELD);

        return [
            'user_question' => $sQuestion,
            'wrong_answer' => $sWrong,
            'user_correction' => $sCorrection,
        ];
    }

    /**
     * @param array<int, array{role:string,text:string}> $aTurns
     */
    public static function excerpt(array $aTurns): string
    {
        $aSlice = array_slice($aTurns, -self::EXCERPT_TURNS);
        $aLines = [];
        foreach ($aSlice as $aTurn) {
            $sLabel = $aTurn['role'] === 'assistant' ? 'Assistant' : 'User';
            $aLines[] = $sLabel . ': ' . self::clip($aTurn['text'], self::CLIP_TURN);
        }
        return implode("\n\n", $aLines);
    }

    public static function clip(string $s, int $iMax): string
    {
        if ($iMax <= 0 || mb_strlen($s) <= $iMax)
            return $s;
        return mb_substr($s, 0, $iMax - 1) . '…';
    }

    public static function textFromContent($mixed): string
    {
        if (is_string($mixed))
            return trim($mixed);
        if (!is_array($mixed))
            return '';

        $aParts = [];
        foreach ($mixed as $aBlock) {
            if (is_string($aBlock)) {
                $s = trim($aBlock);
                if ($s !== '')
                    $aParts[] = $s;
                continue;
            }
            if (!is_array($aBlock))
                continue;
            $sType = (string)($aBlock['type'] ?? '');
            $sText = (string)($aBlock['content'] ?? ($aBlock['text'] ?? ''));
            if ($sText === '')
                continue;
            if ($sType === '' || $sType === 'text')
                $aParts[] = trim($sText);
        }
        return trim(implode("\n", $aParts));
    }

    protected static function mdBlock($mixed): string
    {
        $s = trim((string)$mixed);
        return $s !== '' ? $s : '(empty)';
    }

    protected static function normalizeCategory(?string $s): string
    {
        $s = strtolower(trim((string)$s));
        $aOk = ['hallucination', 'wrong_policy', 'wrong_tone', 'missing_info', 'tool_misuse', 'language', 'other'];
        return in_array($s, $aOk, true) ? $s : 'other';
    }

    protected static function normalizeSeverity(?string $s): string
    {
        $s = strtolower(trim((string)$s));
        $aOk = ['low', 'medium', 'high'];
        return in_array($s, $aOk, true) ? $s : 'medium';
    }
}
