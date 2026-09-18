<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Operator tool: create / update / catalog Studio agents (sys_agents_agents).
 * mysql_write_safe cannot touch that table — use this instead.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\ToolProperty;

class BxDolAIToolAgentCreate extends BxDolAITool
{
    protected const TRIGGERS = ['alert', 'scheduler', 'webhook', 'manual', 'agent', 'message', 'form-input'];
    protected const PRESETS = ['comment_reply', 'manual', 'message', 'custom'];
    protected const COMMENT_ACTIONS = ['commentPost', 'comment_added', 'commentAdded', 'cmt_post'];
    protected const FORBIDDEN_TOOL_TYPES = ['mysql_write'];
    protected const CLIP = 20000;
    protected const PROFILE_NAME_MAX = 40;
    protected const VERSION = 4;

    protected const MODULE_ALIASES = [
        'discussions' => 'bx_forum',
        'discussion' => 'bx_forum',
        'forum' => 'bx_forum',
        'forums' => 'bx_forum',
        'дискуссии' => 'bx_forum',
        'дискуссия' => 'bx_forum',
        'форум' => 'bx_forum',
        'posts' => 'bx_posts',
        'post' => 'bx_posts',
        'публикации' => 'bx_posts',
        'timeline' => 'bx_timeline',
        'feed' => 'bx_timeline',
        'лента' => 'bx_timeline',
        'groups' => 'bx_groups',
        'группы' => 'bx_groups',
        'events' => 'bx_events',
        'события' => 'bx_events',
        'photos' => 'bx_photos',
        'фото' => 'bx_photos',
        'videos' => 'bx_videos',
        'видео' => 'bx_videos',
        'wiki' => 'bx_wiki',
        'market' => 'bx_market',
        'магазин' => 'bx_market',
        'spaces' => 'bx_spaces',
        'persons' => 'bx_persons',
        'orgs' => 'bx_organizations',
        'organizations' => 'bx_organizations',
        'polls' => 'bx_polls',
        'опросы' => 'bx_polls',
    ];

    protected const COMMENT_TOOLS = ['comments_get', 'comments_add', 'comment_get', 'content_get'];

    protected const COMMENT_PROMPT_TOOLS = "You run on a UNA commentPost alert. The user message is JSON: object_id, sender_profile_id, extra (comment id/text/system).\nIf sender_profile_id or extra.author / extra.author_id equals this agent's profile_id, do nothing — never reply to yourself (prevents loops).\nRead context with comments_get / content_get. Post at most one reply with comments_add on the same object. Then stop.\nMatch the comment language. Do not mention that you are an agent unless asked.";

    public function __construct()
    {
        parent::__construct(
            'agent_create',
            'Create or update a Studio agent (sys_agents_agents). Do NOT use mysql_write on that table. '
            . 'Never ask the user for a numeric profile_id. action=catalog returns profiles and profile_buttons — call chat_buttons with exactly those labels. '
            . 'Existing: profile=display name or id. New bot: profile_new=Name (creates a Persons profile under the preset Robot account, sys_profile_bot). create without profile/profile_new is refused. '
            . 'preset=comment_reply for “reply to every comment”: trigger=alert, async=1, comments_* tools. '
            . 'Pass module (bx_forum or “discussions”) or alert as unit:action (bx_forum:commentPost). '
            . 'Show the plan, wait for Да via chat_buttons, then create. Prompt goes in prompt_system.'
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty('action', PropertyType::STRING, 'catalog | create | update. catalog = list alerts/tools/models/agents. create = insert. update = change prompt/tools/alert/active of agent_id.', true),
            new ToolProperty('preset', PropertyType::STRING, 'comment_reply | manual | message | custom. comment_reply = alert agent that replies to comments.', false),
            new ToolProperty('title', PropertyType::STRING, 'Human title. Required for create.', false),
            new ToolProperty('name', PropertyType::STRING, 'Unique machine name. Auto from title if empty.', false),
            new ToolProperty('description', PropertyType::STRING, 'Operator notes.', false),
            new ToolProperty('prompt_system', PropertyType::STRING, 'System / role prompt. Required for create. This is what the new agent will follow.', false),
            new ToolProperty('prompt_steps', PropertyType::STRING, 'Optional steps prompt.', false),
            new ToolProperty('prompt_output', PropertyType::STRING, 'Optional output prompt.', false),
            new ToolProperty('prompt_tools', PropertyType::STRING, 'Optional extra tool rules. comment_reply appends loop-prevention rules.', false),
            new ToolProperty('trigger', PropertyType::STRING, 'alert | scheduler | webhook | manual | agent | message | form-input. Default from preset (comment_reply → alert).', false),
            new ToolProperty('alert', PropertyType::STRING, 'unit:action from sys_alerts_log, e.g. bx_forum:commentPost. Required for trigger=alert unless module is set.', false),
            new ToolProperty('module', PropertyType::STRING, 'Module name or alias to pick the alert: bx_forum, discussions, posts, timeline, groups…', false),
            new ToolProperty('tools', PropertyType::STRING, 'CSV of tool types or ids (comments_add,comments_get). comment_reply fills comments_* if empty.', false),
            new ToolProperty('model_id', PropertyType::INTEGER, 'Chat model id. Default = operator agent / sys_agents_model.', false),
            new ToolProperty('profile_id', PropertyType::INTEGER, 'Numeric profile id. Prefer profile (name) or profile_new. Do not ask the user for this number.', false),
            new ToolProperty('profile', PropertyType::STRING, 'Existing profile the agent acts as: display name, @uri, or id. From catalog.profiles. Do not ask the user for a number.', false),
            new ToolProperty('profile_new', PropertyType::STRING, 'Short display name for a NEW Persons profile, like a person name: 1–3 words, max 40 chars. Examples: Отвечатор, Posts Bot. NEVER a prompt, sentence, or agent instructions.', false),
            new ToolProperty('vector_store_id', PropertyType::INTEGER, 'Knowledge store id. Default = operator / first active store / 0.', false),
            new ToolProperty('async', PropertyType::INTEGER, '1 = delayed (use for alert comment replies so the post is not blocked). Default 1 for alert.', false),
            new ToolProperty('active', PropertyType::INTEGER, '1 = run immediately. Default 1.', false),
            new ToolProperty('scheduler_cron', PropertyType::STRING, 'CRON string for trigger=scheduler.', false),
            new ToolProperty('webhook_key', PropertyType::STRING, 'Bearer key for trigger=webhook.', false),
            new ToolProperty('message_profile_id', PropertyType::INTEGER, 'Accepted sender for trigger=message. 0 = any.', false),
            new ToolProperty('form_object', PropertyType::STRING, 'Form object for trigger=form-input.', false),
            new ToolProperty('form_input', PropertyType::STRING, 'Form input name for trigger=form-input.', false),
            new ToolProperty('agent_id', PropertyType::INTEGER, 'Existing sys_agents_agents.id for update.', false),
            new ToolProperty('query', PropertyType::STRING, 'catalog filter: alert unit/action, tool type, agent name.', false),
            new ToolProperty('dry_run', PropertyType::BOOLEAN, 'If true, validate and return the row without writing.', false),
        ];
    }

    public function __invoke(
        $action = 'catalog',
        $preset = '',
        $title = '',
        $name = '',
        $description = '',
        $prompt_system = '',
        $prompt_steps = '',
        $prompt_output = '',
        $prompt_tools = '',
        $trigger = '',
        $alert = '',
        $module = '',
        $tools = '',
        $model_id = 0,
        $profile_id = 0,
        $vector_store_id = 0,
        $async = null,
        $active = 1,
        $scheduler_cron = '',
        $webhook_key = '',
        $message_profile_id = 0,
        $form_object = '',
        $form_input = '',
        $agent_id = 0,
        $query = '',
        $profile = '',
        $profile_new = '',
        $dry_run = false
    ): array {
        $sAction = strtolower(trim((string)$action));
        if ($sAction === 'list')
            $sAction = 'catalog';
        if (!in_array($sAction, ['catalog', 'create', 'update'], true))
            return ['ok' => 0, 'error' => 'action must be catalog, create, or update'];

        try {
            if ($sAction === 'catalog')
                return $this->_catalog((string)$query, (string)$preset, (string)$module);
            if ($sAction === 'update')
                return $this->_update((int)$agent_id, [
                    'title' => $title,
                    'description' => $description,
                    'prompt_system' => $prompt_system,
                    'prompt_steps' => $prompt_steps,
                    'prompt_output' => $prompt_output,
                    'prompt_tools' => $prompt_tools,
                    'tools' => $tools,
                    'alert' => $alert,
                    'module' => $module,
                    'async' => $async,
                    'active' => $active,
                    'preset' => $preset,
                    'profile' => $profile,
                    'profile_id' => $profile_id,
                    'profile_new' => $profile_new,
                ], $this->_isDry($dry_run));

            return $this->_create([
                'preset' => $preset,
                'title' => $title,
                'name' => $name,
                'description' => $description,
                'prompt_system' => $prompt_system,
                'prompt_steps' => $prompt_steps,
                'prompt_output' => $prompt_output,
                'prompt_tools' => $prompt_tools,
                'trigger' => $trigger,
                'alert' => $alert,
                'module' => $module,
                'tools' => $tools,
                'model_id' => $model_id,
                'profile_id' => $profile_id,
                'vector_store_id' => $vector_store_id,
                'async' => $async,
                'active' => $active,
                'scheduler_cron' => $scheduler_cron,
                'webhook_key' => $webhook_key,
                'message_profile_id' => $message_profile_id,
                'form_object' => $form_object,
                'form_input' => $form_input,
                'profile' => $profile,
                'profile_new' => $profile_new,
            ], $this->_isDry($dry_run));
        } catch (Throwable $o) {
            return ['ok' => 0, 'error' => $o->getMessage()];
        }
    }

    protected function _isDry($dry_run): bool
    {
        return $dry_run === true || $dry_run === 1 || $dry_run === '1' || $dry_run === 'true';
    }

    protected function _catalog(string $sQuery, string $sPreset, string $sModule): array
    {
        $oDb = BxDolDb::getInstance();
        $sQ = mb_strtolower(trim($sQuery));
        $sMod = $this->_resolveModule($sModule !== '' ? $sModule : $sQuery);

        $aAlerts = [];
        if ($oDb->isTableExists('sys_alerts_log')) {
            $aRows = $oDb->getAll("SELECT `unit`, `action`, `counter_24h` FROM `sys_alerts_log` ORDER BY `counter_24h` DESC, `unit`, `action` LIMIT 400");
            foreach ($aRows as $aRow) {
                $sKey = $aRow['unit'] . ':' . $aRow['action'];
                $sHay = mb_strtolower($sKey . ' ' . ($aRow['unit'] ?? '') . ' ' . ($aRow['action'] ?? ''));
                $bComment = in_array($aRow['action'], self::COMMENT_ACTIONS, true);
                if ($sQ !== '' && strpos($sHay, $sQ) === false && !($sMod && $aRow['unit'] === $sMod) && !($sPreset === 'comment_reply' && $bComment))
                    continue;
                if ($sPreset === 'comment_reply' && $sQ === '' && $sModule === '' && !$bComment)
                    continue;
                if ($sMod && $aRow['unit'] !== $sMod && strpos($sHay, $sQ) === false)
                    continue;
                $aAlerts[] = [
                    'alert' => $sKey,
                    'fired_24h' => (int)$aRow['counter_24h'],
                    'desc' => method_exists('BxDolAiQuery', 'getAlertDesc') ? (string)BxDolAiQuery::getAlertDesc($sKey) : '',
                ];
                if (count($aAlerts) >= 40)
                    break;
            }
        }

        $aTools = [];
        $aToolRows = $oDb->getAll("SELECT `id`, `type`, `title`, `active` FROM `sys_agents_tools` ORDER BY `type` ASC");
        foreach ($aToolRows as $aRow) {
            $sHay = mb_strtolower($aRow['id'] . ' ' . $aRow['type'] . ' ' . $aRow['title']);
            if ($sQ !== '' && strpos($sHay, $sQ) === false && $sPreset !== 'comment_reply')
                continue;
            if ($sPreset === 'comment_reply' && $sQ === '' && !in_array($aRow['type'], self::COMMENT_TOOLS, true))
                continue;
            $aTools[] = [
                'id' => (int)$aRow['id'],
                'type' => $aRow['type'],
                'title' => $aRow['title'],
                'active' => (int)$aRow['active'],
            ];
        }

        $aModels = $oDb->getAll("SELECT `id`, `type`, `model`, `title`, `capabilities`, `active` FROM `sys_agents_models` WHERE `active` = 1 AND (`capabilities` LIKE '%chatllm%' OR `capabilities` LIKE '%chatvlm%') ORDER BY `title` ASC LIMIT 30");
        $aStores = $oDb->isTableExists('sys_agents_vector_store')
            ? $oDb->getAll("SELECT `id`, `title`, `type`, `active` FROM `sys_agents_vector_store` WHERE `active` = 1 ORDER BY `title` ASC LIMIT 20")
            : [];
        $aAgents = $oDb->getAll("SELECT `id`, `name`, `title`, `trigger`, `alert`, `active`, `profile_id`, `model_id` FROM `sys_agents_agents` ORDER BY `id` DESC LIMIT 30");
        if ($sQ !== '') {
            $aAgents = array_values(array_filter($aAgents, function ($aRow) use ($sQ) {
                $sHay = mb_strtolower(($aRow['name'] ?? '') . ' ' . ($aRow['title'] ?? '') . ' ' . ($aRow['alert'] ?? '') . ' ' . ($aRow['trigger'] ?? ''));
                return strpos($sHay, $sQ) !== false;
            }));
        }

        $aDefaults = $this->_defaults();
        $aProfiles = $this->_listProfiles('');
        $sSuggest = $this->_preset($sPreset) === 'comment_reply' ? 'Комментатор' : 'Бот';

        return [
            'ok' => 1,
            'version' => self::VERSION,
            'action' => 'catalog',
            'profiles' => $aProfiles,
            'profiles_count' => count($aProfiles),
            'suggested_new_name' => $sSuggest,
            'profile_buttons' => $this->_profileButtons($aProfiles, $sSuggest),
            'profile_hint' => 'Call chat_buttons now with exactly profile_buttons as reply labels (one per line, no other text). Tap on a name → profile=<name>; tap on «Новый: ' . $sSuggest . '» → profile_new=' . $sSuggest . '. create without profile/profile_new is refused.',
            'defaults' => $aDefaults,
            'presets' => self::PRESETS,
            'comment_reply_hint' => 'Pick an alert like bx_forum:commentPost (module=discussions). Tools: comments_get,comments_add,comment_get,content_get. async=1.',
            'alerts' => $aAlerts,
            'tools' => $aTools,
            'models' => $aModels,
            'vector_stores' => $aStores,
            'agents' => $aAgents,
        ];
    }

    protected function _create(array $aIn, bool $bDry): array
    {
        $sPreset = $this->_preset($aIn['preset'] ?? '');
        $sTitle = trim((string)($aIn['title'] ?? ''));
        if ($sTitle === '')
            return ['ok' => 0, 'error' => 'title is required'];

        $sPrompt = $this->_clip((string)($aIn['prompt_system'] ?? ''));
        if (trim($sPrompt) === '')
            return ['ok' => 0, 'error' => 'prompt_system is required — this is what the new agent will do'];

        $sTrigger = strtolower(trim((string)($aIn['trigger'] ?? '')));
        if ($sTrigger === '')
            $sTrigger = $this->_triggerForPreset($sPreset);
        if (!in_array($sTrigger, self::TRIGGERS, true))
            return ['ok' => 0, 'error' => 'unknown trigger. Use: ' . implode(', ', self::TRIGGERS)];

        $aDefaults = $this->_defaults();
        $iModel = (int)($aIn['model_id'] ?? 0) ?: (int)$aDefaults['model_id'];
        $sProfileIn = trim((string)($aIn['profile'] ?? ''));
        $sProfileNewIn = trim((string)($aIn['profile_new'] ?? ''));
        if ($sProfileIn === '' && $sProfileNewIn === '' && (int)($aIn['profile_id'] ?? 0) <= 0) {
            // never fall back to the operator's own profile silently — the user must pick a name or a new one
            $aProfiles = $this->_listProfiles('');
            $sSuggest = $sPreset === 'comment_reply' ? 'Комментатор' : 'Бот';
            return [
                'ok' => 0,
                'error' => 'profile is required. Show chat_buttons with profile_buttons, then pass profile=<tapped name> or profile_new=<name> (for «Новый: …»).',
                'profiles' => $aProfiles,
                'suggested_new_name' => $sSuggest,
                'profile_buttons' => $this->_profileButtons($aProfiles, $sSuggest),
            ];
        }

        $aProf = $this->_resolveProfile($sProfileIn, $aIn['profile_id'] ?? 0, $sProfileNewIn, $bDry);
        if (!empty($aProf['error']))
            return ['ok' => 0, 'error' => $aProf['error'], 'candidates' => $aProf['candidates'] ?? []];
        $iProfile = (int)($aProf['profile_id'] ?? 0);
        $iStore = (int)($aIn['vector_store_id'] ?? 0) ?: (int)$aDefaults['vector_store_id'];

        if ($iModel <= 0)
            return ['ok' => 0, 'error' => 'no chat model. Pass model_id or activate a chatllm model.'];
        if ($iProfile <= 0 && empty($aProf['dry_create']))
            return ['ok' => 0, 'error' => 'profile could not be resolved. Pass profile=<name from catalog.profiles> or profile_new=<name>.'];

        $oDb = BxDolDb::getInstance();
        if (!$oDb->getRow("SELECT `id` FROM `sys_agents_models` WHERE `id` = :id AND `active` = 1 LIMIT 1", ['id' => $iModel]))
            return ['ok' => 0, 'error' => "model_id {$iModel} is missing or inactive"];

        $sAlert = '';
        $aAlertPick = null;
        if ($sTrigger === 'alert') {
            $aAlertPick = $this->_resolveAlert((string)($aIn['alert'] ?? ''), (string)($aIn['module'] ?? ''), $sPreset);
            if (!empty($aAlertPick['error']))
                return ['ok' => 0, 'error' => $aAlertPick['error'], 'candidates' => $aAlertPick['candidates'] ?? []];
            $sAlert = $aAlertPick['alert'];
        }

        $sToolsCsv = $this->_resolveToolsCsv((string)($aIn['tools'] ?? ''), $sPreset);
        if (is_array($sToolsCsv) && isset($sToolsCsv['error']))
            return $sToolsCsv;

        if ($sTrigger === 'message') {
            $aDup = $oDb->getRow("SELECT `id`, `name` FROM `sys_agents_agents` WHERE `trigger` = 'message' AND `profile_id` = :p LIMIT 1", ['p' => $iProfile]);
            if ($aDup)
                return ['ok' => 0, 'error' => "profile_id {$iProfile} already has message-agent {$aDup['id']} ({$aDup['name']}). One message-agent per profile."];
        }

        if ($sTrigger === 'scheduler' && trim((string)($aIn['scheduler_cron'] ?? '')) === '')
            return ['ok' => 0, 'error' => 'scheduler_cron is required for trigger=scheduler'];
        if ($sTrigger === 'webhook' && trim((string)($aIn['webhook_key'] ?? '')) === '')
            return ['ok' => 0, 'error' => 'webhook_key is required for trigger=webhook'];
        if ($sTrigger === 'form-input' && (trim((string)($aIn['form_object'] ?? '')) === '' || trim((string)($aIn['form_input'] ?? '')) === ''))
            return ['ok' => 0, 'error' => 'form_object and form_input are required for trigger=form-input'];

        $iAsync = $aIn['async'];
        if ($iAsync === null || $iAsync === '')
            $iAsync = in_array($sTrigger, ['alert', 'webhook', 'message'], true) ? 1 : 0;
        $iAsync = (int)$iAsync ? 1 : 0;
        if (in_array($sTrigger, ['manual', 'scheduler'], true))
            $iAsync = 0;

        $iActive = isset($aIn['active']) && $aIn['active'] !== '' && $aIn['active'] !== null
            ? ((int)$aIn['active'] ? 1 : 0)
            : 1;

        $sName = $this->_uniqueName((string)($aIn['name'] ?? ''), $sTitle);
        $sPromptTools = $this->_clip((string)($aIn['prompt_tools'] ?? ''));
        if ($sPreset === 'comment_reply') {
            $sPromptTools = trim($sPromptTools . "\n\n" . self::COMMENT_PROMPT_TOOLS);
        }

        $sPromptSteps = $this->_clip((string)($aIn['prompt_steps'] ?? ''));
        if ($sPreset === 'comment_reply' && $sPromptSteps === '') {
            $sPromptSteps = "1. Parse the alert JSON.\n2. Skip if the comment author is this agent's profile_id.\n3. Read the parent object and recent comments.\n4. Write one reply with comments_add.\n5. Stop. Do not loop.";
        }

        $aRow = [
            'title' => $this->_clip($sTitle, 255),
            'name' => $sName,
            'description' => $this->_clip((string)($aIn['description'] ?? ''), 2000),
            'icon' => '',
            'model_id' => $iModel,
            'profile_id' => $iProfile,
            'acl_levels' => 0,
            'trigger' => $sTrigger,
            'async' => $iAsync,
            'alert' => $sAlert,
            'scheduler_cron' => trim((string)($aIn['scheduler_cron'] ?? '')),
            'webhook_key' => trim((string)($aIn['webhook_key'] ?? '')),
            'message_profile_id' => (int)($aIn['message_profile_id'] ?? 0),
            'form_object' => trim((string)($aIn['form_object'] ?? '')),
            'form_input' => trim((string)($aIn['form_input'] ?? '')),
            'max_turns' => 40,
            'chat_ttl_min' => 0,
            'max_input_chars' => 2000,
            'max_tokens' => 1024,
            'max_sessions_per_hour' => 3,
            'max_sessions_per_day' => 10,
            'vector_store_id' => $iStore,
            'chat_history_context' => $sTrigger === 'alert' ? 0 : 50000,
            'tools' => $sToolsCsv,
            'tools_max_run' => $sPreset === 'comment_reply' ? 8 : 10,
            'prompt_system' => $sPrompt,
            'prompt_steps' => $sPromptSteps,
            'prompt_output' => $this->_clip((string)($aIn['prompt_output'] ?? '')),
            'prompt_tools' => $sPromptTools,
            'added' => time(),
            'active' => $iActive,
        ];

        $aRow = $this->_onlyExistingColumns($oDb, 'sys_agents_agents', $aRow);

        $aOut = [
            'ok' => 1,
            'action' => $bDry ? 'dry_run' : 'create',
            'preset' => $sPreset,
            'studio' => '/studio/agents.php?page=agents',
            'row' => [
                'name' => $aRow['name'],
                'title' => $aRow['title'],
                'trigger' => $aRow['trigger'],
                'alert' => $aRow['alert'] ?? '',
                'async' => (int)($aRow['async'] ?? 0),
                'active' => (int)$aRow['active'],
                'model_id' => (int)$aRow['model_id'],
                'profile_id' => (int)$aRow['profile_id'],
                'profile_name' => $aProf['name'] ?? '',
                'profile_created' => (int)($aProf['created'] ?? 0),
                'vector_store_id' => (int)($aRow['vector_store_id'] ?? 0),
                'tools' => $aRow['tools'],
                'prompt_system_chars' => strlen($aRow['prompt_system']),
            ],
        ];
        if (!empty($aAlertPick['warning']))
            $aOut['warning'] = $aAlertPick['warning'];

        if ($bDry)
            return $aOut;

        $mixed = $oDb->query("INSERT INTO `sys_agents_agents` SET " . $oDb->arrayToSQL($aRow));
        if ($mixed === false)
            return ['ok' => 0, 'error' => 'INSERT failed'];

        $iId = (int)$oDb->lastId();
        $oDb->cleanCache('sys_agents_with_alert');
        $this->_logSql('insert', 'sys_agents_agents', 'id', (string)$iId, 'INSERT agent ' . $aRow['name'], null, $aRow);

        $aOut['id'] = $iId;
        $aOut['row']['id'] = $iId;
        $aOut['next'] = $iActive
            ? 'Agent is active. Test the event (post a comment) or open Studio Agents grid.'
            : 'Created inactive. action=update agent_id=' . $iId . ' active=1 to turn on.';
        return $aOut;
    }

    protected function _update(int $iId, array $aIn, bool $bDry): array
    {
        if ($iId <= 0)
            return ['ok' => 0, 'error' => 'agent_id is required for update'];

        $oDb = BxDolDb::getInstance();
        $aBefore = $oDb->getRow("SELECT * FROM `sys_agents_agents` WHERE `id` = :id LIMIT 1", ['id' => $iId]);
        if (!$aBefore)
            return ['ok' => 0, 'error' => "agent {$iId} not found"];

        $aSet = [];
        foreach (['title', 'description', 'prompt_system', 'prompt_steps', 'prompt_output', 'prompt_tools'] as $sF) {
            if (isset($aIn[$sF]) && $aIn[$sF] !== '' && $aIn[$sF] !== null)
                $aSet[$sF] = $this->_clip((string)$aIn[$sF], $sF === 'title' ? 255 : self::CLIP);
        }

        if (isset($aIn['tools']) && $aIn['tools'] !== '' && $aIn['tools'] !== null) {
            $sCsv = $this->_resolveToolsCsv((string)$aIn['tools'], $this->_preset($aIn['preset'] ?? ''));
            if (is_array($sCsv) && isset($sCsv['error']))
                return $sCsv;
            $aSet['tools'] = $sCsv;
        }

        if ((isset($aIn['alert']) && $aIn['alert'] !== '') || (isset($aIn['module']) && $aIn['module'] !== '')) {
            $aAlertPick = $this->_resolveAlert((string)($aIn['alert'] ?? ''), (string)($aIn['module'] ?? ''), $this->_preset($aIn['preset'] ?? 'comment_reply'));
            if (!empty($aAlertPick['error']))
                return ['ok' => 0, 'error' => $aAlertPick['error'], 'candidates' => $aAlertPick['candidates'] ?? []];
            $aSet['alert'] = $aAlertPick['alert'];
            $aSet['trigger'] = 'alert';
        }

        if ($aIn['async'] !== null && $aIn['async'] !== '')
            $aSet['async'] = (int)$aIn['async'] ? 1 : 0;
        if ($aIn['active'] !== null && $aIn['active'] !== '')
            $aSet['active'] = (int)$aIn['active'] ? 1 : 0;

        $bWantProfile = (isset($aIn['profile']) && $aIn['profile'] !== '' && $aIn['profile'] !== null)
            || (isset($aIn['profile_new']) && $aIn['profile_new'] !== '' && $aIn['profile_new'] !== null)
            || !empty($aIn['profile_id']);
        $aProf = ['name' => '', 'created' => 0];
        if ($bWantProfile) {
            $aProf = $this->_resolveProfile($aIn['profile'] ?? '', $aIn['profile_id'] ?? 0, $aIn['profile_new'] ?? '', $bDry);
            if (!empty($aProf['error']))
                return ['ok' => 0, 'error' => $aProf['error'], 'candidates' => $aProf['candidates'] ?? []];
            if (!empty($aProf['profile_id']))
                $aSet['profile_id'] = (int)$aProf['profile_id'];
        }

        if (!$aSet)
            return ['ok' => 0, 'error' => 'nothing to update'];

        $aSet = $this->_onlyExistingColumns($oDb, 'sys_agents_agents', $aSet);

        if ($bDry) {
            return ['ok' => 1, 'action' => 'dry_run', 'id' => $iId, 'set' => array_keys($aSet)];
        }

        $b = $oDb->query("UPDATE `sys_agents_agents` SET " . $oDb->arrayToSQL($aSet) . " WHERE `id` = :id", ['id' => $iId]);
        if ($b === false)
            return ['ok' => 0, 'error' => 'UPDATE failed'];

        $oDb->cleanCache('sys_agents_with_alert');
        $aAfter = $oDb->getRow("SELECT * FROM `sys_agents_agents` WHERE `id` = :id LIMIT 1", ['id' => $iId]);
        $this->_logSql('update', 'sys_agents_agents', 'id', (string)$iId, 'UPDATE agent ' . $iId, $aBefore, $aAfter ?: null);

        return [
            'ok' => 1,
            'action' => 'update',
            'id' => $iId,
            'name' => $aAfter['name'] ?? $aBefore['name'],
            'changed' => array_keys($aSet),
            'active' => (int)($aAfter['active'] ?? 0),
            'profile_id' => (int)($aAfter['profile_id'] ?? $aBefore['profile_id'] ?? 0),
            'profile_name' => $aProf['name'] ?? '',
            'profile_created' => (int)($aProf['created'] ?? 0),
            'studio' => '/studio/agents.php?page=agents',
        ];
    }

    protected function _preset($s): string
    {
        $s = strtolower(trim((string)$s));
        if ($s === '' || $s === 'custom')
            return 'custom';
        if (in_array($s, self::PRESETS, true))
            return $s;
        return 'custom';
    }

    protected function _triggerForPreset(string $sPreset): string
    {
        if ($sPreset === 'comment_reply')
            return 'alert';
        if ($sPreset === 'message')
            return 'message';
        if ($sPreset === 'manual')
            return 'manual';
        return 'alert';
    }

    protected function _resolveModule(string $s): string
    {
        $s = trim($s);
        if ($s === '')
            return '';
        $sLow = mb_strtolower($s);
        if (isset(self::MODULE_ALIASES[$sLow]))
            return self::MODULE_ALIASES[$sLow];
        if (preg_match('/^[a-z0-9_]+$/i', $s))
            return $s;
        return '';
    }

    protected function _resolveAlert(string $sAlert, string $sModule, string $sPreset): array
    {
        $sAlert = trim($sAlert);
        $sAlert = str_replace([' ', '/', '|'], ':', $sAlert);
        $sAlert = preg_replace('/:+/', ':', $sAlert);

        if ($sAlert !== '' && preg_match('/^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+$/', $sAlert)) {
            $aWarn = $this->_alertInLog($sAlert) ? '' : 'Alert is not in sys_alerts_log yet (never fired). It will run once that unit:action happens.';
            return ['alert' => $sAlert, 'warning' => $aWarn];
        }

        $sMod = $this->_resolveModule($sModule !== '' ? $sModule : $sAlert);
        $aCandidates = $this->_commentAlerts($sMod);

        if ($sPreset === 'comment_reply' || $sMod !== '') {
            if (count($aCandidates) === 1)
                return ['alert' => $aCandidates[0]['alert']];
            if (count($aCandidates) > 1)
                return ['error' => 'Several comment alerts match. Pass alert=unit:action.', 'candidates' => $aCandidates];
            if ($sMod !== '')
                return ['error' => "No comment alert for module {$sMod} in sys_alerts_log. Someone must post a comment once, then retry, or pass alert explicitly (e.g. {$sMod}:commentPost).", 'candidates' => []];
        }

        return ['error' => 'Pass alert as unit:action (bx_forum:commentPost) or module=discussions / bx_forum. action=catalog preset=comment_reply to list.', 'candidates' => $aCandidates];
    }

    protected function _commentAlerts(string $sMod): array
    {
        $oDb = BxDolDb::getInstance();
        if (!$oDb->isTableExists('sys_alerts_log'))
            return [];

        $aParams = [];
        $sWhere = "`action` IN (" . $oDb->implode_escape(self::COMMENT_ACTIONS) . ")";
        if ($sMod !== '') {
            $sWhere .= " AND `unit` = :u";
            $aParams['u'] = $sMod;
        }
        $aRows = $oDb->getAll("SELECT `unit`, `action`, `counter_24h` FROM `sys_alerts_log` WHERE {$sWhere} ORDER BY `counter_24h` DESC LIMIT 20", $aParams);
        $aOut = [];
        foreach ($aRows as $aRow) {
            $aOut[] = [
                'alert' => $aRow['unit'] . ':' . $aRow['action'],
                'fired_24h' => (int)$aRow['counter_24h'],
            ];
        }
        return $aOut;
    }

    protected function _alertInLog(string $sAlert): bool
    {
        $oDb = BxDolDb::getInstance();
        if (!$oDb->isTableExists('sys_alerts_log'))
            return false;
        $a = explode(':', $sAlert, 2);
        $s = $oDb->getOne("SELECT CONCAT(`unit`, ':', `action`) FROM `sys_alerts_log` WHERE `unit` = :u AND `action` = :a LIMIT 1", [
            'u' => $a[0] ?? '',
            'a' => $a[1] ?? '',
        ]);
        return (bool)$s;
    }

    protected function _listProfiles(string $sQuery = ''): array
    {
        $aOut = [];
        $aSeen = [];
        $oDb = BxDolDb::getInstance();

        // each source is isolated: one failing query must not empty the whole list
        $aDefaults = $this->_defaults();
        $this->_pushProfile($aOut, $aSeen, (int)$aDefaults['profile_id'], '', 'default');

        try {
            // profiles of the preset Robot account (sys_profile_bot) go first — new profiles are created there
            $iBotAccount = $this->_botAccount();
            if ($iBotAccount > 0) {
                $aRows = $oDb->getAll("SELECT `id` FROM `sys_profiles` WHERE `account_id` = :a AND `status` = 'active' ORDER BY `id` ASC LIMIT 50", ['a' => $iBotAccount]);
                foreach ($aRows as $aRow)
                    $this->_pushProfile($aOut, $aSeen, (int)$aRow['id'], '', 'robot');
            }
        } catch (Throwable $o) {
            bx_log('sys_agents', 'agent_create profiles (robot account): ' . $o->getMessage(), BX_LOG_WARN);
        }

        try {
            $iOpAccount = (int)$oDb->getOne("SELECT `account_id` FROM `sys_profiles` WHERE `id` = :id LIMIT 1", ['id' => (int)$aDefaults['profile_id']]);
            if ($iOpAccount > 0) {
                $aRows = $oDb->getAll("SELECT `id` FROM `sys_profiles` WHERE `account_id` = :a AND `status` = 'active' ORDER BY `id` ASC LIMIT 50", ['a' => $iOpAccount]);
                foreach ($aRows as $aRow)
                    $this->_pushProfile($aOut, $aSeen, (int)$aRow['id'], '', 'operator');
            }
        } catch (Throwable $o) {
            bx_log('sys_agents', 'agent_create profiles (account): ' . $o->getMessage(), BX_LOG_WARN);
        }

        try {
            if (function_exists('bx_srv')) {
                $aOpts = bx_srv('system', 'get_options_agents_profile', [false], 'TemplServices');
                if (is_array($aOpts)) {
                    foreach ($aOpts as $aOpt)
                        $this->_pushProfile($aOut, $aSeen, (int)($aOpt['key'] ?? 0), (string)($aOpt['value'] ?? ''), 'operator');
                }
            }
        } catch (Throwable $o) {
            bx_log('sys_agents', 'agent_create profiles (service): ' . $o->getMessage(), BX_LOG_WARN);
        }

        try {
            $iRoleAdmin = defined('BX_DOL_ROLE_ADMIN') ? (int)BX_DOL_ROLE_ADMIN : 2;
            $aRows = $oDb->getAll("SELECT p.`id` FROM `sys_profiles` p INNER JOIN `sys_accounts` a ON a.`id` = p.`account_id` WHERE (a.`role` & :r) AND p.`status` = 'active' ORDER BY p.`id` ASC LIMIT 50", [
                'r' => $iRoleAdmin,
            ]);
            foreach ($aRows as $aRow)
                $this->_pushProfile($aOut, $aSeen, (int)$aRow['id'], '', 'operator');
        } catch (Throwable $o) {
            bx_log('sys_agents', 'agent_create profiles (admins): ' . $o->getMessage(), BX_LOG_WARN);
        }

        try {
            $aUsed = $oDb->getColumn("SELECT DISTINCT `profile_id` FROM `sys_agents_agents` WHERE `profile_id` > 0 ORDER BY `profile_id` DESC LIMIT 30");
            foreach ($aUsed as $iId)
                $this->_pushProfile($aOut, $aSeen, (int)$iId, '', 'agent');
        } catch (Throwable $o) {
            bx_log('sys_agents', 'agent_create profiles (agents): ' . $o->getMessage(), BX_LOG_WARN);
        }

        $sQ = trim($sQuery);
        if ($sQ !== '' && mb_strlen($sQ) <= 80 && $oDb->isTableExists('bx_persons_data')) {
            $aRows = $oDb->getAll("SELECT p.`id`, d.`fullname` FROM `sys_profiles` p INNER JOIN `bx_persons_data` d ON d.`id` = p.`content_id` AND p.`type` = 'bx_persons' WHERE d.`fullname` LIKE :q AND p.`status` = 'active' ORDER BY d.`fullname` ASC LIMIT 20", [
                'q' => '%' . $sQ . '%',
            ]);
            foreach ($aRows as $aRow)
                $this->_pushProfile($aOut, $aSeen, (int)$aRow['id'], (string)$aRow['fullname'], 'search');
        }

        return $aOut;
    }

    protected function _profileButtons(array $aProfiles, string $sSuggest): array
    {
        $aOut = [];
        foreach ($aProfiles as $aP) {
            $s = (string)($aP['name'] ?? '');
            if ($s !== '' && !in_array($s, $aOut, true))
                $aOut[] = $s;
        }
        $aOut[] = 'Новый: ' . $sSuggest;
        return $aOut;
    }

    protected function _pushProfile(array &$aOut, array &$aSeen, int $iId, string $sFallback, string $sSource): void
    {
        if ($iId <= 0 || isset($aSeen[$iId]))
            return;
        try {
            $sName = $this->_profileDisplayName($iId, $sFallback);
        } catch (Throwable $o) {
            $sName = $sFallback;
        }
        if ($sName === '')
            $sName = '#' . $iId;
        $aOut[] = ['id' => $iId, 'name' => $sName, 'source' => $sSource];
        $aSeen[$iId] = 1;
    }

    protected function _shortDisplayName(string $s): array
    {
        $s = trim(preg_replace('/\s+/u', ' ', $s));
        $s = preg_replace('/^новый\s*:\s*/iu', '', $s);
        $s = trim($s);
        if ($s === '')
            return ['error' => 'profile name is empty'];

        $iWords = count(preg_split('/\s+/u', $s, -1, PREG_SPLIT_NO_EMPTY));
        if (mb_strlen($s) > self::PROFILE_NAME_MAX || $iWords > 3 || preg_match('/[\r\n.!?—–;:]/u', $s)) {
            return ['error' => 'profile_new must be a short display name (1–3 words, like a person): «Отвечатор», «Комментатор», «Posts Bot». Not a prompt or sentence. catalog.suggested_new_name is the default.'];
        }

        return ['name' => $s];
    }

    protected function _profileDisplayName(int $iId, string $sFallback = ''): string
    {
        $o = class_exists('BxDolProfile') ? BxDolProfile::getInstance($iId) : false;
        if ($o)
            return $o->getDisplayName();
        if ($sFallback !== '')
            return $sFallback;
        return '#' . $iId;
    }

    protected function _resolveProfile($sProfile, $mixedId, $sNew, bool $bDry): array
    {
        $sNew = trim((string)$sNew);
        if ($sNew !== '')
            return $this->_createPersonProfile($sNew, $bDry);

        $sProfile = trim((string)$sProfile);
        $iId = (int)$mixedId;
        if ($sProfile !== '' && preg_match('/^\d+$/', $sProfile))
            $iId = (int)$sProfile;

        if ($iId > 0) {
            $o = class_exists('BxDolProfile') ? BxDolProfile::getInstance($iId) : false;
            if (!$o)
                return ['error' => "profile {$iId} not found"];
            return ['profile_id' => $iId, 'name' => $o->getDisplayName(), 'created' => 0];
        }

        if ($sProfile === '')
            return ['profile_id' => 0, 'name' => '', 'created' => 0];

        $sProfile = ltrim($sProfile, '@');
        $aHits = [];
        foreach ($this->_listProfiles($sProfile) as $aP) {
            if (mb_strtolower((string)$aP['name']) === mb_strtolower($sProfile) || (string)$aP['id'] === $sProfile)
                $aHits[(int)$aP['id']] = $aP;
        }

        $oDb = BxDolDb::getInstance();
        if ($oDb->isTableExists('bx_persons_data')) {
            $aRows = $oDb->getAll("SELECT p.`id`, d.`fullname` FROM `sys_profiles` p INNER JOIN `bx_persons_data` d ON d.`id` = p.`content_id` AND p.`type` = 'bx_persons' WHERE d.`fullname` = :n AND p.`status` = 'active' LIMIT 10", [
                'n' => $sProfile,
            ]);
            foreach ($aRows as $aRow)
                $aHits[(int)$aRow['id']] = ['id' => (int)$aRow['id'], 'name' => $aRow['fullname']];

            if (!$aHits) {
                $aRows = $oDb->getAll("SELECT p.`id`, d.`fullname` FROM `sys_profiles` p INNER JOIN `bx_persons_data` d ON d.`id` = p.`content_id` AND p.`type` = 'bx_persons' WHERE d.`fullname` LIKE :n AND p.`status` = 'active' ORDER BY d.`fullname` ASC LIMIT 10", [
                    'n' => '%' . $sProfile . '%',
                ]);
                foreach ($aRows as $aRow)
                    $aHits[(int)$aRow['id']] = ['id' => (int)$aRow['id'], 'name' => $aRow['fullname']];
            }
        }

        $aList = array_values($aHits);
        if (count($aList) === 1)
            return ['profile_id' => (int)$aList[0]['id'], 'name' => $aList[0]['name'], 'created' => 0];
        if (count($aList) > 1)
            return ['error' => 'Several profiles match. Pass profile=exact name from catalog.profiles.', 'candidates' => $aList];

        return ['error' => 'No profile named «' . $sProfile . '». Pick from catalog.profiles or pass profile_new=' . $sProfile . '.'];
    }

    protected function _createPersonProfile(string $sName, bool $bDry): array
    {
        $aName = $this->_shortDisplayName($sName);
        if (!empty($aName['error']))
            return $aName;
        $sName = $aName['name'];

        $oDb = BxDolDb::getInstance();
        if (!$oDb->isTableExists('bx_persons_data'))
            return ['error' => 'bx_persons_data is missing — cannot create a Persons profile'];

        // new bot profiles always live under the preset Robot account (sys_profile_bot), not under the operator
        $iAccount = $this->_botAccount();
        if ($iAccount <= 0)
            return ['error' => 'Robot account not found: set sys_profile_bot (Studio → Settings → Bot profile) or sys_agents_profile, then retry.'];

        $aExist = $oDb->getRow("SELECT p.`id` FROM `sys_profiles` p INNER JOIN `bx_persons_data` d ON d.`id` = p.`content_id` AND p.`type` = 'bx_persons' WHERE p.`account_id` = :a AND d.`fullname` = :n LIMIT 1", [
            'a' => $iAccount,
            'n' => $sName,
        ]);
        if ($aExist)
            return ['profile_id' => (int)$aExist['id'], 'name' => $sName, 'created' => 0];

        if ($bDry)
            return ['profile_id' => 0, 'name' => $sName, 'created' => 1, 'dry_create' => 1];

        $iNow = time();
        $iPublic = defined('BX_DOL_PG_ALL') ? BX_DOL_PG_ALL : 3;
        $aPerson = $this->_onlyExistingColumns($oDb, 'bx_persons_data', [
            'author' => $iAccount,
            'added' => $iNow,
            'changed' => $iNow,
            'fullname' => $sName,
            'last_name' => '',
            'allow_view_to' => $iPublic,
            'allow_post_to' => $iPublic,
            'allow_contact_to' => $iPublic,
        ]);
        $mixed = $oDb->query("INSERT INTO `bx_persons_data` SET " . $oDb->arrayToSQL($aPerson));
        if ($mixed === false)
            return ['error' => 'failed to insert bx_persons_data'];

        $iContent = (int)$oDb->lastId();
        $this->_logSql('insert', 'bx_persons_data', 'id', (string)$iContent, 'INSERT person ' . $sName, null, array_merge($aPerson, ['id' => $iContent]));

        $iAction = defined('BX_PROFILE_ACTION_AUTO') ? BX_PROFILE_ACTION_AUTO : 0;
        $iProfile = (int)BxDolProfile::add($iAction, $iAccount, $iContent, 'active', 'bx_persons');
        if ($iProfile <= 0)
            return ['error' => 'person row created but sys_profiles insert failed', 'content_id' => $iContent];

        $this->_logSql('insert', 'sys_profiles', 'id', (string)$iProfile, 'INSERT profile ' . $sName, null, [
            'id' => $iProfile,
            'account_id' => $iAccount,
            'content_id' => $iContent,
            'type' => 'bx_persons',
            'status' => 'active',
        ]);

        return ['profile_id' => $iProfile, 'name' => $sName, 'created' => 1];
    }

    protected function _resolveToolsCsv(string $sTools, string $sPreset)
    {
        $oDb = BxDolDb::getInstance();
        $aWanted = [];
        $sTools = trim($sTools);
        if ($sTools !== '') {
            foreach (preg_split('/[,\s]+/', $sTools) as $sTok) {
                $sTok = trim($sTok);
                if ($sTok === '')
                    continue;
                $aWanted[] = $sTok;
            }
        } else if ($sPreset === 'comment_reply') {
            $aWanted = self::COMMENT_TOOLS;
        }

        if (!$aWanted)
            return '';

        $aIds = [];
        $aMissing = [];
        foreach ($aWanted as $sTok) {
            if (preg_match('/^\d+$/', $sTok)) {
                $aRow = $oDb->getRow("SELECT `id`, `type`, `active` FROM `sys_agents_tools` WHERE `id` = :id LIMIT 1", ['id' => (int)$sTok]);
            } else {
                $aRow = $oDb->getRow("SELECT `id`, `type`, `active` FROM `sys_agents_tools` WHERE `type` = :t ORDER BY `active` DESC, `id` ASC LIMIT 1", ['t' => $sTok]);
            }
            if (!$aRow) {
                $aMissing[] = $sTok;
                continue;
            }
            if (in_array($aRow['type'], self::FORBIDDEN_TOOL_TYPES, true))
                return ['ok' => 0, 'error' => "Refusing stock mysql_write on a created agent. Use mysql_write_safe if you really need writes."];
            $aIds[(int)$aRow['id']] = (int)$aRow['id'];
        }
        if ($aMissing)
            return ['ok' => 0, 'error' => 'Unknown tools: ' . implode(', ', $aMissing) . '. action=catalog to list types.'];

        return implode(',', array_values($aIds));
    }

    protected function _uniqueName(string $sName, string $sTitle): string
    {
        $s = $sName !== '' ? $sName : $sTitle;
        $s = strtolower($s);
        $s = preg_replace('/[^a-z0-9_]+/', '_', $s);
        $s = trim($s, '_');
        if ($s === '')
            $s = 'agent';
        if (strlen($s) > 80)
            $s = substr($s, 0, 80);

        $oDb = BxDolDb::getInstance();
        $sBase = $s;
        $i = 2;
        while ($oDb->getOne("SELECT `id` FROM `sys_agents_agents` WHERE `name` = :n LIMIT 1", ['n' => $s])) {
            $s = $sBase . '_' . $i;
            $i++;
            if ($i > 99)
                $s = $sBase . '_' . bin2hex(random_bytes(3));
        }
        return $s;
    }

    protected function _defaults(): array
    {
        $oDb = BxDolDb::getInstance();
        $aOp = null;
        $aCtx = class_exists('BxDolAIToolMysqlWrite') ? BxDolAIToolMysqlWrite::currentLogContext() : ['agent_id' => 0];
        $iFromChat = (int)($aCtx['agent_id'] ?? 0);
        if ($iFromChat > 0)
            $aOp = $oDb->getRow("SELECT `id`, `model_id`, `profile_id`, `vector_store_id` FROM `sys_agents_agents` WHERE `id` = :id LIMIT 1", ['id' => $iFromChat]);
        if (!$aOp) {
            $iOpt = (int)getParam('sys_agents_operator_agent');
            if ($iOpt > 0)
                $aOp = $oDb->getRow("SELECT `id`, `model_id`, `profile_id`, `vector_store_id` FROM `sys_agents_agents` WHERE `id` = :id LIMIT 1", ['id' => $iOpt]);
        }

        $iModel = (int)($aOp['model_id'] ?? 0) ?: (int)(getParam('sys_agents_model'));
        $iProfile = (int)($aOp['profile_id'] ?? 0) ?: (int)getParam('sys_agents_profile');
        if ($iProfile <= 0)
            $iProfile = (int)getParam('sys_profile_bot');
        $iStore = (int)($aOp['vector_store_id'] ?? 0);
        if ($iStore <= 0 && $oDb->isTableExists('sys_agents_vector_store'))
            $iStore = (int)$oDb->getOne("SELECT `id` FROM `sys_agents_vector_store` WHERE `active` = 1 ORDER BY `id` ASC LIMIT 1");

        return [
            'model_id' => $iModel,
            'profile_id' => $iProfile,
            'vector_store_id' => $iStore,
            'from_agent_id' => (int)($aOp['id'] ?? 0),
        ];
    }

    /**
     * Account of the preset Robot: owner of sys_profile_bot, then sys_agents_profile, then the operator agent's profile.
     */
    protected function _botAccount(): int
    {
        $oDb = BxDolDb::getInstance();
        $aCandidates = [
            (int)getParam('sys_profile_bot'),
            (int)getParam('sys_agents_profile'),
            (int)($this->_defaults()['profile_id'] ?? 0),
        ];
        foreach ($aCandidates as $iProfile) {
            if ($iProfile <= 0)
                continue;
            $iAccount = (int)$oDb->getOne("SELECT `account_id` FROM `sys_profiles` WHERE `id` = :id LIMIT 1", ['id' => $iProfile]);
            if ($iAccount > 0)
                return $iAccount;
        }
        return 0;
    }

    protected function _onlyExistingColumns(BxDolDb $oDb, string $sTable, array $aRow): array
    {
        $aOut = [];
        foreach ($aRow as $sK => $mixedV) {
            if ($oDb->isFieldExists($sTable, $sK))
                $aOut[$sK] = $mixedV;
        }
        return $aOut;
    }

    protected function _clip(string $s, int $iMax = 0): string
    {
        $iMax = $iMax ?: self::CLIP;
        $s = trim($s);
        if (strlen($s) <= $iMax)
            return $s;
        return substr($s, 0, $iMax);
    }

    protected function _logSql(string $sOp, string $sTable, string $sPk, string $sPkValue, string $sSql, $mixedBefore, $mixedAfter): void
    {
        $oDb = BxDolDb::getInstance();
        if (!$oDb->isTableExists('sys_agents_sql_log'))
            return;

        $aCtx = class_exists('BxDolAIToolMysqlWrite') ? BxDolAIToolMysqlWrite::currentLogContext() : [
            'agent_id' => 0,
            'profile_id' => 0,
            'thread_id' => '',
        ];
        $aSet = [
            'agent_id' => (int)($aCtx['agent_id'] ?? 0),
            'profile_id' => (int)($aCtx['profile_id'] ?? 0),
            'thread_id' => (string)($aCtx['thread_id'] ?? ''),
            'op' => $sOp,
            'table_name' => $sTable,
            'pk_name' => $sPk,
            'pk_value' => $sPkValue,
            'sql_text' => $sSql,
            'before_json' => $mixedBefore ? json_encode($mixedBefore, JSON_UNESCAPED_UNICODE) : null,
            'after_json' => $mixedAfter ? json_encode($mixedAfter, JSON_UNESCAPED_UNICODE) : null,
            'added' => time(),
        ];
        if ($oDb->isFieldExists('sys_agents_sql_log', 'undone'))
            $aSet['undone'] = 0;

        $oDb->query("INSERT INTO `sys_agents_sql_log` SET " . $oDb->arrayToSQL($aSet));
    }
}

/** @} */
