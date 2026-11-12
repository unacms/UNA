<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Polls Polls
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Polls: the router finds this class only while the module is enabled.
 *
 * A poll is an entry of the module (on the text base): a question (the entry's text) and its
 * answers (the module's subentries), shown as a Poll. Its comments and reactions are those
 * of its Item (`content_id`), and a feed item of a poll carries it as `Item.poll`
 * (apiV2ItemPolls), so a client votes in place.
 *
 * A vote goes through the module's vote object of the answer (bx_polls_subentries), so its
 * checks, counters and alerts are the site's: one answer per voter and poll, never taken back
 * (the object's IsUndo is off, and its isPerformed covers every answer of the poll), which is
 * a single `option_id`. Results are shown to everyone unless the poll hides them until
 * one has voted, as the site's results block decides.
 */
class BxPollsApiV2 extends BxBaseModTextApiV2
{
    const API_TAG = 'polls';
    const API_KIND = 'poll';
    const API_NOUN = 'poll';
    const API_NOUN_PLURAL = 'polls';

    /** How many answers a new poll may have (NewPoll: 2 to 10). */
    const MIN_OPTIONS = 2;
    const MAX_OPTIONS = 10;
    /** The longest answer the module keeps (its subentries' title column). */
    const OPTION_LENGTH = 255;
    const QUESTION_LENGTH = 5000;

    /** A page's answers (poll id => rows) and the viewer's votes (poll id => answer id): _primeMedia. */
    protected $_aOptions = [];
    protected $_aVoted = [];
    /** Whether the viewer's level may vote, once per request (the module's ACL check). */
    protected $_mCanVote = null;

    public function __construct()
    {
        parent::__construct('bx_polls');
    }

    /*
     * Hooks other endpoints ask
     */

    /**
     * Item.poll of a page of feed items that are polls (BxTimelineApiV2): poll id => Poll, read
     * at once (the polls' rows, answers, the viewer's votes, pictures); null for other modules.
     * The Timeline decided already that the viewer sees each item; a poll that is no longer
     * there (or not active) is left out.
     */
    public function apiV2ItemPolls($sModule, $aContentIds)
    {
        if ($sModule !== $this->_oModule->getName())
            return null;
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aContents = array_values(array_filter($this->_contentRows(array_values(array_unique(array_map('intval', (array)$aContentIds)))), function ($aContent) {
            return !$this->_contextGone($aContent) && $this->_oModule->isEntryActive($aContent);
        }));
        $aResult = [];
        foreach ($this->_items($aContents, (int)bx_get_logged_profile_id()) as $i => $aPoll)
            $aResult[(int)$aContents[$i][$CNF['FIELD_ID']]] = $aPoll;
        return $aResult;
    }

    /*
     * Endpoints
     */

    #[BxDolApiV2Operation(method: 'GET', path: '/polls', id: 'listPolls', tag: 'polls', paged: true,
        summary: 'Polls the viewer may see, newest first or in another order',
        description: 'As the site\'s browse pages list them: active polls, with the module\'s privacy, so a page can have fewer items than `limit` and still a `next_cursor`. `sort`: `recent` (the default, newest first), `updated`, `popular` (most viewed), `top` (most liked) or `featured` (featured ones only). `author` keeps one profile\'s polls (the Polls of a profile\'s page), `context` (or `context_id`) those in a group or other context: 422 for one that is no context or that the viewer may not know of, 403 for one whose content the viewer may not see.',
        params: [
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['recent', 'updated', 'popular', 'top', 'featured'], 'default' => 'recent']],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A profile id'],
            'context' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only polls in this group (or other context): its profile id'],
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'The same as `context`'],
        ],
        responses: [200 => 'Page_Poll', 403 => null, 422 => null])]
    public function listPolls(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/polls/{id}', id: 'getPoll', tag: 'polls',
        summary: 'A poll, with its results where the viewer may see them',
        description: 'Counts a view, as opening its page on the site does (once a day per viewer). 404 when there is none (or it is hidden or waiting for approval and the viewer is not its author or a moderator; or it is in a secret group or other context the viewer may not know of), 403 when the viewer may not see it. Its comments are GET /content/{content_id}/comments.',
        responses: [200 => 'Poll', 403 => null, 404 => null])]
    public function getPoll(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/polls', id: 'createPoll', tag: 'polls', auth: 'required',
        summary: 'Ask a question with its answers',
        description: 'Through the site\'s poll form, after its add check (403 otherwise). A poll is an entry of its own here, not something put on another item, so it takes NewPoll with who sees it: `audience` (public by default; one the site has turned off is 422), or `context_id` for a group or other context whose members may add polls there (403 otherwise; then `audience` may not be sent). `question` is plain text (each line a paragraph). `options` are 2 to 10 answers in their order, each at most 255 characters and none empty or given twice (422). `hidden_results` keeps the counts from those who have not voted. Who voted for what is kept from others as the site\'s form sets it by default. It shows in the feeds as the site\'s alerts put it there, with `Item.poll`.',
        body: 'NewPoll', responses: [201 => 'Poll', 403 => null, 422 => null])]
    public function createPoll(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_refuse($this->_oModule->checkAllowedAdd(), 'The viewer may not add polls');
        $sQuestion = trim((string)($aBody['question'] ?? ''));
        if ($sQuestion === '')
            throw BxDolApiV2Problem::validation([['field' => 'question', 'code' => 'required', 'message' => 'A poll needs a question']]);
        if (get_mb_len($sQuestion) > self::QUESTION_LENGTH)
            throw BxDolApiV2Problem::validation([['field' => 'question', 'code' => 'too_long', 'message' => 'At most ' . self::QUESTION_LENGTH . ' characters']]);
        $aOptions = $this->_optionsParam($aBody['options'] ?? null);
        $iPrivacy = $this->_newPrivacy($aBody);

        // who voted for what is hidden as the site's form starts it (its switcher, on by default)
        $oForm = $this->_oModule->getFormsHelper()->getObjectFormAdd();
        $bAnonymous = $oForm && isset($oForm->aInputs[$CNF['FIELD_ANONYMOUS_VOTING']]) ? !empty($oForm->aInputs[$CNF['FIELD_ANONYMOUS_VOTING']]['checked']) : false;

        $aValues = [
            $CNF['FIELD_TEXT'] => BxDolApiV2Map::htmlFromText($sQuestion),
            $CNF['FIELD_SUBENTRIES'] => $aOptions,
            $CNF['FIELD_ALLOW_VIEW_TO'] => $iPrivacy,
        ];
        if (($iCategory = $this->_defaultCategory()))
            $aValues[$CNF['FIELD_CATEGORY']] = $iCategory;
        if ($bAnonymous)
            $aValues[$CNF['FIELD_ANONYMOUS_VOTING']] = 1;
        if (!empty($aBody['hidden_results']))
            $aValues[$CNF['FIELD_HIDDEN_RESULTS']] = 1;

        $aContent = $this->_add($iViewerId, $aValues, [], [
            $CNF['FIELD_TEXT'] => 'question',
            $CNF['FIELD_SUBENTRIES'] => 'options',
            $CNF['FIELD_ALLOW_VIEW_TO'] => 'audience',
            $CNF['FIELD_CATEGORY'] => '(body)',
        ]);
        return BxDolApiV2Response::created($this->_one($aContent, $iViewerId), '/polls/' . (int)$aContent[$CNF['FIELD_ID']]);
    }

    #[BxDolApiV2Operation(method: 'PUT', path: '/polls/{id}/vote', id: 'votePoll', tag: 'polls', auth: 'required',
        summary: 'Vote for one of a poll\'s answers',
        description: 'Through the site\'s vote of that answer: one answer per voter, never changed or taken back (409 `already_voted`, also for the same answer again). 409 `not_open` for a poll that is not published and approved (one its author or a moderator still sees while it is pending, hidden or rejected; `viewer.can_vote` is false there). 422 `unknown_option` for an answer of another poll; 403 when the membership level may not vote in polls; 404 and 403 for the poll as GET /polls/{id}. The answer is the poll with the vote counted, its results now shown to the viewer.',
        body: 'PollVote', responses: [200 => 'Poll', 403 => null, 404 => null, 409 => null, 422 => null])]
    public function votePoll(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        // the author or a moderator still sees a pending, hidden or rejected poll: no votes there (can_vote says so too)
        if ($this->_state($aContent) !== 'published' || $this->_moderation($aContent) !== 'approved')
            throw new BxDolApiV2Problem(409, 'not_open', 'This poll is not open for votes');
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];

        $mOption = $oReq->body()['option_id'] ?? null;
        $iOption = is_scalar($mOption) && preg_match('/^[1-9]\d{0,18}$/', (string)$mOption) ? (int)$mOption : 0;
        $aOptions = $this->_oModule->_oDb->getSubentriesByEntries([$iId])[$iId] ?? [];
        if (!$iOption || !in_array($iOption, array_map('intval', array_column($aOptions, 'id')), true))
            throw new BxDolApiV2Problem(422, 'unknown_option', 'That is not an answer of this poll', [['field' => 'option_id', 'code' => 'unknown_option', 'message' => 'Use the id of one of the poll\'s options']]);

        if ($this->_oModule->_oDb->getPerformedValuesByEntries([$iId], $iViewerId))
            throw new BxDolApiV2Problem(409, 'already_voted', 'The viewer has voted in this poll');

        $oVote = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES_SUBENTRIES'], $iOption);
        if (!$oVote || !$oVote->isEnabled())
            throw BxDolApiV2Problem::forbidden('Voting in polls is off on this site');
        $oVote->setEntry($aContent);
        $a = $oVote->vote(['value' => $oVote->getValue()]);
        switch ((int)($a['code'] ?? BX_DOL_OBJECT_ERR_CANNOT_PERFORM)) {
            case 0:
                break;
            case BX_DOL_OBJECT_ERR_DUPLICATE:
                throw new BxDolApiV2Problem(409, 'already_voted', 'The viewer has voted in this poll');
            case BX_DOL_OBJECT_ERR_ACCESS_DENIED:
                throw BxDolApiV2Problem::forbidden(!empty($a['message']) ? BxDolApiV2Map::text($a['message']) : 'The viewer may not vote in polls');
            default:
                throw new BxDolApiV2Problem(409, 'not_voted', 'The vote was not counted');
        }

        return $this->_one($this->_oModule->_oDb->getContentInfoById($iId, true) ?: $aContent, $iViewerId);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/polls/{id}', id: 'deletePoll', tag: 'polls', auth: 'required',
        summary: 'Delete a poll',
        description: 'One\'s own where the membership level may delete polls, or any for administrators (the module\'s delete check; 403 otherwise). Its answers, votes, comments and activity in the feeds go with it, as on the site.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function deletePoll(BxDolApiV2Request $oReq)
    {
        return $this->_delete($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/polls', id: 'searchPolls', tag: 'search', limit: 'search', paged: true,
        summary: 'Polls whose question contains the words, newest first',
        description: "v2 only. The module's keyword search (the fields its search settings name), newest first, of the polls the viewer may see (as GET /polls/{id} decides), so a page can have fewer than `limit` and still a `next_cursor`.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
        ],
        responses: [200 => 'Page_Poll', 422 => null])]
    public function searchPolls(BxDolApiV2Request $oReq)
    {
        return $this->_search($oReq);
    }

    /*
     * Writing
     */

    /**
     * A new poll's answers: 2 to 10 strings, trimmed, none empty, too long or given twice.
     */
    protected function _optionsParam($mOptions)
    {
        if (!is_array($mOptions) || !array_is_list($mOptions))
            throw BxDolApiV2Problem::validation([['field' => 'options', 'code' => 'required', 'message' => 'Send ' . self::MIN_OPTIONS . ' to ' . self::MAX_OPTIONS . ' answers']]);
        if (count($mOptions) < self::MIN_OPTIONS || count($mOptions) > self::MAX_OPTIONS)
            throw BxDolApiV2Problem::validation([['field' => 'options', 'code' => count($mOptions) < self::MIN_OPTIONS ? 'too_few' : 'too_many', 'message' => 'A poll has ' . self::MIN_OPTIONS . ' to ' . self::MAX_OPTIONS . ' answers']]);

        $aOptions = [];
        $aSeen = [];
        foreach ($mOptions as $i => $mOption) {
            $sField = 'options[' . $i . ']';
            $sOption = is_string($mOption) ? trim($mOption) : '';
            if ($sOption === '')
                throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'required', 'message' => 'An answer needs text']]);
            if (get_mb_len($sOption) > self::OPTION_LENGTH)
                throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'too_long', 'message' => 'At most ' . self::OPTION_LENGTH . ' characters']]);
            $sKey = mb_strtolower($sOption);
            if (isset($aSeen[$sKey]))
                throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'duplicate', 'message' => 'Is given twice']]);
            $aSeen[$sKey] = true;
            $aOptions[] = $sOption;
        }
        return $aOptions;
    }

    /*
     * Mapping
     */

    /** The copies of a poll's picture: the module's preview, gallery and cover transcoders. */
    protected function _photoTranscoders()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return [
            'thumb' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'] ?? ''),
            'medium' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY'] ?? ''),
            'large' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_COVER'] ?? ''),
        ];
    }

    /**
     * A page's answers and the viewer's votes in one query each, and the pictures the polls show
     * (their rows and copies; _items opens the scopes they are kept in).
     */
    protected function _primeMedia($aContents)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aIds = array_map('intval', array_column($aContents, $CNF['FIELD_ID']));
        $this->_aOptions = $this->_oModule->_oDb->getSubentriesByEntries($aIds) + $this->_aOptions;
        $iViewerId = (int)bx_get_logged_profile_id();
        $aVoted = $this->_oModule->_oDb->getPerformedValuesByEntries($aIds, $iViewerId);
        foreach ($aIds as $iId)
            $this->_aVoted[$iId] = $aVoted[$iId] ?? 0;

        $aFiles = array_values(array_filter(array_map('intval', array_column($aContents, $CNF['FIELD_THUMB']))));
        if ($aFiles && !empty($CNF['OBJECT_STORAGE']) && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']))) {
            $oStorage->primeFileRows($aFiles);
            BxDolApiV2Map::primeOwnOriginals($CNF['OBJECT_STORAGE'], $aFiles);
            BxDolTranscoder::primeFiles(array_values(array_filter($this->_photoTranscoders())), $aFiles);
        }
    }

    /**
     * Whether the viewer may vote in this poll: signed in, not voted yet, the poll active, and
     * the membership level lets them (read once).
     */
    protected function _canVote($aContent, $iVoted, $iViewerId)
    {
        if (!$iViewerId || $iVoted || $this->_state($aContent) !== 'published' || $this->_moderation($aContent) !== 'approved')
            return false;
        if ($this->_mCanVote === null)
            $this->_mCanVote = $this->_oModule->isAllowedVote() === CHECK_ACTION_RESULT_ALLOWED;
        return $this->_mCanVote;
    }

    /**
     * A Poll, with its module, text_html, image, author, audience, context_id,
     * state, moderation, stats, url and the dates; `content_id` is null when the Timeline shows
     * no item for it.
     */
    protected function _item($aContent, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $iAuthorId = (int)$aContent[$CNF['FIELD_AUTHOR']];
        $iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $sHtml = (string)$aContent[$CNF['FIELD_TEXT']];

        // a single answer reads its own (a page's are primed)
        if (!array_key_exists($iId, $this->_aOptions))
            $this->_aOptions += $this->_oModule->_oDb->getSubentriesByEntries([$iId]);
        if (!array_key_exists($iId, $this->_aVoted))
            $this->_aVoted[$iId] = $this->_oModule->_oDb->getPerformedValuesByEntries([$iId], $iViewerId)[$iId] ?? 0;
        $iVoted = $iViewerId ? (int)$this->_aVoted[$iId] : 0;

        $bHidden = (int)($aContent[$CNF['FIELD_HIDDEN_RESULTS']] ?? 0) === 1;
        // the site's results block: shown unless they are hidden from who has not voted
        $bResults = !$bHidden || $iVoted > 0;
        $aOptions = [];
        $iVoters = 0;
        foreach ($this->_aOptions[$iId] ?? [] as $aRow) {
            $iVotes = (int)$aRow['votes'];
            $iVoters += $iVotes;
            $aOptions[] = [
                'id' => BxDolApiV2Map::id((int)$aRow['id']),
                'title' => BxDolApiV2Map::text((string)$aRow['title']),
                'votes' => $bResults ? $iVotes : null,
            ];
        }

        $iThumb = (int)($aContent[$CNF['FIELD_THUMB']] ?? 0);
        $iAdded = (int)$aContent[$CNF['FIELD_ADDED']];
        $iChanged = (int)($aContent[$CNF['FIELD_CHANGED']] ?? 0);

        return [
            'id' => BxDolApiV2Map::id($iId),
            'content_id' => BxDolApiV2Map::idOrNull($this->_itemId($iId)),
            'module' => $this->_oModule->getName(),
            'question' => BxDolApiV2Map::text($sHtml),
            'text_html' => $this->_bFull ? $sHtml : null,
            'options' => $aOptions,
            // one answer per voter: the votes are the voters
            'voters' => $iVoters,
            'hidden_results' => $bHidden,
            'results_visible' => $bResults,
            'image' => $iThumb > 0 && !empty($CNF['OBJECT_STORAGE']) ? BxDolApiV2Map::photoMedia($CNF['OBJECT_STORAGE'], $iThumb, $this->_photoTranscoders()) : null,
            'author' => $iAuthorId > 0 ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'audience' => $this->_audience($iPrivacy),
            'context_id' => BxDolApiV2Map::idOrNull($iPrivacy < 0 ? -$iPrivacy : 0),
            'state' => $this->_state($aContent),
            'moderation' => $this->_moderation($aContent),
            'stats' => [
                'comments' => (int)($aContent[$CNF['FIELD_COMMENTS']] ?? 0),
                'reactions' => $this->_reactionCount($aContent),
                'views' => (int)($aContent[$CNF['FIELD_VIEWS']] ?? 0),
            ],
            'url' => $this->_entryUrl($iId),
            'viewer' => $iViewerId ? [
                'voted' => BxDolApiV2Map::idOrNull($iVoted),
                'can_vote' => $this->_canVote($aContent, $iVoted, $iViewerId),
                'can_delete' => $this->_oModule->checkAllowedDelete($aContent) === CHECK_ACTION_RESULT_ALLOWED,
            ] : null,
            'published_at' => BxDolApiV2Map::date($iAdded),
            'created_at' => BxDolApiV2Map::date($iAdded),
            'updated_at' => BxDolApiV2Map::date(max($iAdded, $iChanged)),
        ];
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aIdOrNull = ['oneOf' => [$aId, ['type' => 'null']]];

        return BxDolApiV2Map::pollSchemas() + [
            'Page_Poll' => BxDolApiV2Map::pageSchema('Poll'),
            'PollVote' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['option_id'],
                'description' => 'A vote in a poll.',
                'properties' => [
                    'option_id' => $aId + ['description' => 'One of the poll\'s `options`'],
                ],
            ],
            'NewPoll' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['question', 'options'],
                'description' => 'A new poll, with who sees it (a poll is an entry of its own, not one put on another item).',
                'properties' => [
                    'question' => ['type' => 'string', 'minLength' => 1, 'maxLength' => self::QUESTION_LENGTH, 'description' => 'Plain text, each line a paragraph'],
                    'options' => ['type' => 'array', 'minItems' => self::MIN_OPTIONS, 'maxItems' => self::MAX_OPTIONS, 'items' => ['type' => 'string', 'minLength' => 1, 'maxLength' => self::OPTION_LENGTH], 'description' => self::MIN_OPTIONS . ' to ' . self::MAX_OPTIONS . ' answers, in display order, none given twice'],
                    'hidden_results' => ['type' => 'boolean', 'default' => false, 'description' => 'Show counts only to people who voted'],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private'], 'default' => 'public', 'description' => 'v2 only. One of GET /api/v2 `modules` `audiences`'],
                    'context_id' => $aIdOrNull + ['description' => 'v2 only. A group (or other context) to put it in; not with `audience`'],
                ],
            ],
        ];
    }
}

/** @} */
