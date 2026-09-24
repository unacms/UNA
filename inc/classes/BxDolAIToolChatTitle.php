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

/**
 * `chat_title` tool: the agent names the conversation it is in, once, as part of
 * its own reply — no second model request, no settings. Goes into
 * `sys_agents_chat_history`.`title` for the current thread (BxDolAiChat::setCurrentChatThreadTitle)
 * and shows up in the "Chats" history panel and the Studio chat popup.
 *
 * Without the tool (or when the agent never calls it) the lists fall back to the
 * first thing the person typed.
 */
class BxDolAIToolChatTitle extends BxDolAITool
{
    const MAX_WORDS = 6;
    const MAX_CHARS = 80;

    public function __construct()
    {
        parent::__construct(
            'chat_title',
            'Name THIS conversation: 3 to 6 words saying what it is about, in the language the user writes in. Call it once, in your first reply after the user\'s first real message (not after "[page opened…"). Do not mention the title to the user.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty('title', PropertyType::STRING, 'Conversation title, 3-6 words, no quotes, no trailing period. Example: "Счётчик комментариев поста 291"', true),
        ];
    }

    public function __invoke($title): string
    {
        $sTitle = self::clean($title);
        if ($sTitle === '')
            return 'ignored: empty title';

        $iSet = BxDolAiChat::getInstance()->setCurrentChatThreadTitle($sTitle);
        if ($iSet === 0)
            return 'This conversation already has a title. Continue your reply.';

        return $iSet > 0
            ? 'Title saved. Continue your reply without mentioning it.'
            : 'ignored';
    }

    /**
     * One line, quotes and trailing punctuation gone, at most MAX_WORDS words and
     * MAX_CHARS characters.
     */
    public static function clean($mixed)
    {
        $s = strip_tags(is_string($mixed) ? $mixed : '');
        $s = preg_split('/\r\n|\r|\n/', trim($s))[0] ?? '';
        $s = trim($s, " \t\"'«»“”‘’`");
        $s = preg_replace('/\s+/u', ' ', $s);
        $s = rtrim($s, " .!。");
        if ($s === '')
            return '';

        $aWords = explode(' ', $s);
        if (count($aWords) > self::MAX_WORDS)
            $s = implode(' ', array_slice($aWords, 0, self::MAX_WORDS));
        if (get_mb_len($s) > self::MAX_CHARS)
            $s = rtrim(get_mb_substr($s, 0, self::MAX_CHARS - 1)) . '…';

        return $s;
    }
}

/** @} */
