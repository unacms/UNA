<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: reactions to an Item (/content/{id}/reaction) and the reactions the site offers
 * (/reactions), through the site's reactions objects (BxDolVoteReactions), so they work for
 * the content of every module an Item shows.
 *
 * The Item knows which reactions object and which entry of it are its own (`reactions` of its
 * row, BxDolApiV2Targets::item). The list of reactions is read from the reactions object the
 * module that shows Items names (apiV2ReactionsObject, BxDolApiV2Router::hooks: the Timeline's).
 */
class BxBaseApiV2Reactions
{
    #[BxDolApiV2Operation(method: 'GET', path: '/reactions', id: 'listReactionKinds', tag: 'reactions',
        summary: 'The reaction kinds this site offers, in display order; the first is the one a plain tap gives',
        description: 'The names PUT /content/{id}/reaction takes. The site\'s default reaction comes first (Studio\'s default, else the one the reaction button shows before a vote, else the first). Their titles, emoji, icons and colours are in GET /reactions/details.',
        responses: [200 => 'array:string'])]
    public function listReactionKinds(BxDolApiV2Request $oReq)
    {
        $a = $this->_reactionList();
        return $a ? array_keys($a[1]) : [];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/reactions/details', id: 'listReactionDetails', tag: 'reactions',
        summary: 'The reactions of GET /reactions with their titles, emoji, icons and colours, how the site draws them, and how many one may give',
        description: '`kinds` is in the order of GET /reactions, the default first. `display` is how the site draws its reactions (each reaction\'s Icon / Emoji / Image choice in Studio\'s reactions list, by most of them): `icon` (a kind\'s `icon`, its emoji where it has none) or `emoji`.',
        responses: [200 => 'ReactionKinds'])]
    public function listReactionDetails(BxDolApiV2Request $oReq)
    {
        $a = $this->_reactionList();
        if (!$a)
            return ['kinds' => [], 'display' => 'emoji', 'per_user' => 1, 'any_emoji' => false];

        list($oReactions, $aList) = $a;
        $aKinds = [];
        $iIcons = 0;
        foreach ($aList as $sName => $aReaction) {
            $sIcon = BxDolApiV2Map::reactionIcon((string)($aReaction['icon'] ?? ''));
            $aKinds[] = [
                'name' => $sName,
                'title' => _t($aReaction['title']),
                'emoji' => (string)$aReaction['emoji'],
                'icon' => $sIcon,
                'color' => BxDolApiV2Map::reactionColor((string)($aReaction['color'] ?? '')),
            ];
            // an image is drawn from its SVG on the site; here it is the reaction's icon
            if (in_array($aReaction['use'] ?? 'emoji', ['icon', 'image'], true))
                $iIcons++;
        }

        return [
            'kinds' => $aKinds,
            'display' => $iIcons * 2 > count($aKinds) ? 'icon' : 'emoji',
            'per_user' => (int)$oReactions->getPerUser(),
            'any_emoji' => (bool)$oReactions->isFreeEmojiAllowed(),
        ];
    }

    #[BxDolApiV2Operation(method: 'PUT', path: '/content/{id}/reaction', id: 'react', tag: 'reactions', auth: 'required',
        summary: 'Set the viewer\'s reaction to an item',
        description: 'Idempotent: setting the reaction the viewer already gave changes nothing. Where one reaction per person is allowed, a new one replaces the old one. 409 reactions_disabled when the item takes no reactions.',
        body: 'ReactRequest', responses: [204 => null, 403 => null, 409 => null])]
    public function react(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $oReactions = self::objectOf(BxDolApiV2Targets::item($oReq->id()));
        $sKind = $oReq->body()['kind'];

        $sNormalized = $oReactions->normalizeReaction($sKind);
        if ($sNormalized === false)
            throw BxDolApiV2Problem::validation([['field' => 'kind', 'code' => 'invalid_value', 'message' => 'This reaction is not available here']]);

        if (in_array($sNormalized, $oReactions->getReactionsBy($oReactions->getId(), $iViewerId), true))
            return BxDolApiV2Response::noContent();

        $aResult = $oReactions->vote(['reaction' => $sNormalized]);
        if ((int)($aResult['code'] ?? 1) !== 0)
            throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($aResult['message'] ?? ''));

        return BxDolApiV2Response::noContent();
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/content/{id}/reaction', id: 'unreact', tag: 'reactions', auth: 'required',
        summary: 'Take back the viewer\'s reactions to an item',
        description: '409 reactions_disabled when the item takes no reactions.',
        responses: [204 => null, 403 => null, 409 => null])]
    public function unreact(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $oReactions = self::objectOf(BxDolApiV2Targets::item($oReq->id()));

        // giving a reaction one already has takes it back
        foreach ($oReactions->getReactionsBy($oReactions->getId(), $iViewerId) as $sReaction) {
            $aResult = $oReactions->vote(['reaction' => $sReaction]);
            if ((int)($aResult['code'] ?? 1) !== 0)
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($aResult['message'] ?? ''));
        }

        return BxDolApiV2Response::noContent();
    }

    /**
     * The reactions object of an Item (`reactions` of its row), or a problem (or null with
     * $bRequired = false).
     */
    public static function objectOf($aItem, $bRequired = true)
    {
        $o = !empty($aItem['reactions']['system']) ? BxDolVote::getObjectInstance($aItem['reactions']['system'], (int)$aItem['reactions']['object_id']) : false;
        if ($o && $o instanceof BxDolVoteReactions && $o->isEnabled())
            return $o;
        if ($bRequired)
            throw new BxDolApiV2Problem(409, 'reactions_disabled', 'This item takes no reactions');
        return null;
    }

    /**
     * The reactions object the items' module names (apiV2ReactionsObject) and its reactions by
     * name, the default first, then the others in list order; null when no module names one, or
     * it is not a reactions object.
     * @return array|null [reactions object, name => reaction]
     */
    protected function _reactionList()
    {
        $sObject = '';
        foreach (BxDolApiV2Router::hooks('apiV2ReactionsObject') as $oEndpoint)
            if (is_string($s = $oEndpoint->apiV2ReactionsObject()) && $s !== '') {
                $sObject = $s;
                break;
            }

        $oReactions = $sObject !== '' ? BxDolVote::getObjectInstance($sObject, 0) : false;
        if (!$oReactions || !($oReactions instanceof BxDolVoteReactions))
            return null;

        $aAll = $oReactions->getReactions(true);
        // the list also holds a copy of the default under its placeholder key ('default')
        $sDefaultKey = $oReactions->getDefault();
        $aList = [];
        $sFirst = (string)($aAll[$sDefaultKey]['name'] ?? '');
        if ($sFirst !== '' && isset($aAll[$sFirst]) && $sFirst !== $sDefaultKey)
            $aList[$sFirst] = $aAll[$sFirst];
        foreach ($aAll as $sKey => $aReaction)
            if ($sKey !== $sDefaultKey && $sKey === ($aReaction['name'] ?? null) && !isset($aList[$sKey]))
                $aList[$sKey] = $aReaction;

        return [$oReactions, $aList];
    }

    public static function schemas()
    {
        return [
            'ReactionKinds' => [
                'type' => 'object',
                'required' => ['kinds', 'display', 'per_user', 'any_emoji'],
                'properties' => [
                    'kinds' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'required' => ['name', 'title', 'emoji', 'icon', 'color'],
                            'properties' => [
                                'name' => ['type' => 'string', 'example' => 'like', 'description' => 'What PUT /content/{id}/reaction takes'],
                                'title' => ['type' => 'string', 'description' => 'In the viewer\'s language; the name a screen reader says, whichever way it is drawn'],
                                'emoji' => ['type' => 'string', 'example' => '👍', 'description' => 'Empty when the reaction has none'],
                                'icon' => ['type' => ['string', 'null'], 'example' => 'thumbs-up', 'description' => 'A Lucide icon name: the reaction\'s Lucide or Font Awesome icon, and for a Font Awesome face Lucide has no icon for, the Lucide face NEO\'s web set draws (`laugh-squint` is `laugh`, `surprise` is `smile`, `sad-tear` is `frown`); null for none'],
                                'color' => ['type' => ['string', 'null'], 'example' => '#d80960', 'description' => 'The reaction\'s colour on the site as CSS hex; null for none'],
                            ],
                        ],
                    ],
                    'display' => ['type' => 'string', 'enum' => ['icon', 'emoji'], 'description' => 'How the site draws its reactions: as their icons (a kind without one as its emoji) or as emoji, by most of the reactions\' Icon / Emoji / Image choice in Studio (an image counts as an icon)'],
                    'per_user' => ['type' => 'integer', 'description' => 'How many different reactions one person may give'],
                    'any_emoji' => ['type' => 'boolean', 'description' => 'Any single emoji may be given as a reaction'],
                ],
            ],
            'ReactRequest' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['kind'],
                'properties' => [
                    'kind' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 64, 'example' => 'like', 'description' => 'A reaction name, or an emoji where the site lets people pick any'],
                ],
            ],
        ];
    }
}

/** @} */
