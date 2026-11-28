<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: comments on an Item (/content/{id}/comments, /comments/{id}), through the site's
 * comments objects (BxDolCmts), so they work for the content of every module an Item shows.
 *
 * The Item knows which comments object and which entry of it are its own (`comments` of its
 * row, BxDolApiV2Targets::item): /content/{id}/comments reads and writes those.
 *
 * Comment ids: a Comment's id is UNA's unique comment id (sys_cmts_ids.id), not the row id in
 * one module's comments table, so /comments/{id} finds a comment of any comments object. Such a
 * request finds the comment's object, then the Item that shows it
 * (BxDolApiV2Targets::itemIdsByComments), and checks that this Item's comments are that object
 * and that the viewer may see the Item.
 */
class BxBaseApiV2Comments
{
    /** "comments object:unique id" => the viewer's reaction or null, for the comments of a page. */
    protected $_aCommentReactions = [];

    #[BxDolApiV2Operation(method: 'GET', path: '/content/{id}/comments', id: 'listComments', tag: 'comments', paged: true,
        summary: 'Top-level comments of an item, pinned first, then oldest first',
        description: 'Replies are listed by GET /comments/{id}/replies. 409 comments_disabled when the item takes no comments.',
        responses: [200 => 'Page_Comment', 403 => null, 409 => null])]
    public function listComments(BxDolApiV2Request $oReq)
    {
        $aItem = BxDolApiV2Targets::item($oReq->id());
        $oCmts = self::objectOf($aItem);
        $this->_checkCommentsView($oCmts);

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();
        $aCmts = $oCmts->getCommentsArray(0, '', [], $iOffset, $iLimit + 1);

        return $oReq->page($this->_comments($oCmts, $aCmts, (int)$aItem['id']), $iOffset, $iLimit);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/content/{id}/comments', id: 'createComment', tag: 'comments', auth: 'required',
        summary: 'Comment on an item, or reply to a comment of it',
        description: 'Send `body` (plain text: the site keeps it as written, a literal `<` included) or `body_html` (HTML as the site\'s comment editor writes it: paragraphs, line breaks, links, mentions and hashtags; the site filters it as its comment form does, and indexes its mentions and hashtags), not both. A comments object that keeps text only stores `body_html` as its text. 409 comments_disabled when the item takes no comments.',
        body: 'NewComment', responses: [201 => 'Comment', 403 => null, 409 => null])]
    public function createComment(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aItem = BxDolApiV2Targets::item($oReq->id());
        $oCmts = self::objectOf($aItem);
        $aBody = $oReq->body();

        $iParentId = 0;
        if (isset($aBody['parent_id'])) {
            // a comment id is global (sys_cmts_ids); the parent must be one of this item's comments
            $aInfo = BxDolCmtsQuery::getInfoByUniqId((int)$aBody['parent_id']);
            if (empty($aInfo['cmt_id']) || $aInfo['system_name'] !== $oCmts->getSystemName() || (int)$aInfo['cmt_object_id'] !== (int)$oCmts->getId() || !$this->_visibleComment($oCmts, (int)$aInfo['cmt_id']))
                throw BxDolApiV2Problem::validation([['field' => 'parent_id', 'code' => 'not_found', 'message' => 'No such comment on this item']]);
            $iParentId = (int)$aInfo['cmt_id'];
        }

        if ($iParentId ? !$oCmts->isReplyAllowed($iParentId) : !$oCmts->isPostAllowed())
            throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($iParentId ? $oCmts->msgErrReplyAllowed() : $oCmts->msgErrPostAllowed()));

        list($sText, $sField) = $this->_commentBody($oCmts, $aBody);
        $mResult = $oCmts->add(['cmt_text' => $sText, 'cmt_parent_id' => $iParentId]);
        if (empty($mResult['id']))
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'rejected', 'message' => isset($mResult['message']) ? BxDolApiV2Map::text(_t($mResult['message'])) : 'The comment was not saved']]);

        $aCmt = $oCmts->getQueryObject()->getComment($oCmts->getId(), (int)$mResult['id']);
        return BxDolApiV2Response::created($this->_comment($oCmts, $aCmt, (int)$aItem['id']));
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/comments/{id}/replies', id: 'listReplies', tag: 'comments', paged: true,
        summary: 'Replies to a comment, oldest first',
        description: 'The replies shown under the comment. A site nests replies a set number of levels deep (the Timeline: one): the replies to a comment at the deepest level are shown, and listed, under its parent, so this lists the whole thread under a top-level comment. `parent_id` of each one says which comment it answers. 409 comments_disabled when the item takes no comments.',
        responses: [200 => 'Page_Comment', 403 => null, 409 => null])]
    public function listReplies(BxDolApiV2Request $oReq)
    {
        list($oCmts, $aCmt, $aItem) = $this->_commentById($oReq->id());
        $this->_checkCommentsView($oCmts);

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();
        $aCmts = $oCmts->getCommentsArray((int)$aCmt['cmt_id'], '', ['by' => BX_CMT_ORDER_BY_DATE, 'way' => BX_CMT_ORDER_WAY_ASC], $iOffset, $iLimit + 1);

        return $oReq->page($this->_comments($oCmts, $aCmts, (int)$aItem['id']), $iOffset, $iLimit);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/comments/{id}', id: 'editComment', tag: 'comments', auth: 'required',
        summary: 'Edit a comment: one\'s own, or any for moderators',
        description: '`body` (plain text) or `body_html` (as in NewComment) replaces the whole comment. A plain-text `body` would lose a comment\'s links, mentions or formatting, so for such a comment it answers 409 formatted_text: send `body_html`. 409 comments_disabled when the item takes no comments.',
        body: 'EditComment', responses: [200 => 'Comment', 403 => null, 409 => null])]
    public function editComment(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        list($oCmts, $aCmt, $aItem) = $this->_commentById($oReq->id());
        $aBody = $oReq->body();

        if (!$oCmts->isEditAllowed($aCmt))
            throw BxDolApiV2Problem::forbidden(abs((int)$aCmt['cmt_author_id']) === (int)bx_get_logged_profile_id() ? BxDolApiV2Map::text($oCmts->msgErrEditAllowed()) : 'Only its author may edit this comment');

        list($sText, $sField) = $this->_commentBody($oCmts, $aBody);
        if ($sField === 'body' && !$this->_editableAsText($oCmts, $aCmt))
            throw new BxDolApiV2Problem(409, 'formatted_text', 'This comment has links, mentions or formatting that a plain-text edit would lose; send body_html');

        $iCmtId = (int)$aCmt['cmt_id'];
        // the edit form saves its reply-to field too: keep the comment where it is
        $mResult = $oCmts->edit(['cmt_text' => $sText, 'cmt_parent_id' => (int)$aCmt['cmt_parent_id']], $iCmtId);
        if (empty($mResult['id']))
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'rejected', 'message' => isset($mResult['message']) ? BxDolApiV2Map::text(_t($mResult['message'])) : 'The comment was not saved']]);

        $oCmts->isEditAllowed($aCmt, true); // counts the action, as the site's edit form does

        return $this->_comment($oCmts, $oCmts->getQueryObject()->getComment($oCmts->getId(), $iCmtId), (int)$aItem['id']);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/comments/{id}', id: 'deleteComment', tag: 'comments', auth: 'required',
        summary: 'Delete a comment: its author, the author of the item it is on, or a moderator',
        description: 'A comment with replies can be deleted only by a moderator, and its replies go with it; others get 409.',
        responses: [204 => null, 403 => null, 409 => null])]
    public function deleteComment(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        list($oCmts, $aCmt) = $this->_commentById($oReq->id());

        if (!$oCmts->isRemoveAllowed($aCmt))
            throw BxDolApiV2Problem::forbidden('The viewer may not delete this comment');

        if ((int)$aCmt['cmt_replies'] > 0 && !$oCmts->isModerator())
            throw new BxDolApiV2Problem(409, 'has_replies', BxDolApiV2Map::text(_t('_Can not delete comments with replies')));

        $aResult = $oCmts->remove((int)$aCmt['cmt_id']);
        if (!empty($aResult['msg']))
            throw new BxDolApiV2Problem(409, 'not_deleted', BxDolApiV2Map::text($aResult['msg']));

        return BxDolApiV2Response::noContent();
    }

    /**
     * The comments object of an Item (`comments` of its row), or a problem (or null with
     * $bRequired = false).
     */
    public static function objectOf($aItem, $bRequired = true)
    {
        $o = !empty($aItem['comments']['system']) ? BxDolCmts::getObjectInstance($aItem['comments']['system'], (int)$aItem['comments']['object_id']) : false;
        if ($o && $o->isEnabled())
            return $o;
        if ($bRequired)
            throw new BxDolApiV2Problem(409, 'comments_disabled', 'This item takes no comments');
        return null;
    }

    /**
     * A comment by its id, which is UNA's unique comment id (sys_cmts_ids), with the
     * comments object it is in and the row of the Item it is on. The Item must show that
     * comments object, and the viewer must see the Item and the comment.
     * @return array [comments object, comment row, Item row]
     */
    protected function _commentById($iUniqId)
    {
        $aInfo = BxDolCmtsQuery::getInfoByUniqId((int)$iUniqId);
        if (empty($aInfo['cmt_id']) || empty($aInfo['system_name']) || empty($aInfo['cmt_object_id']))
            throw BxDolApiV2Problem::notFound('The comment');

        $sSystem = $aInfo['system_name'];
        $iObjectId = (int)$aInfo['cmt_object_id'];
        $bForbidden = false;
        foreach (BxDolApiV2Targets::itemIdsByComments($sSystem, $iObjectId) as $iItemId) {
            $aItem = BxDolApiV2Targets::findItem($iItemId);
            if (!$aItem) {
                $bForbidden = $bForbidden || $aItem === false;
                continue;
            }
            if (($aItem['comments']['system'] ?? '') !== $sSystem || (int)($aItem['comments']['object_id'] ?? 0) !== $iObjectId)
                continue;

            $oCmts = self::objectOf($aItem);
            $aCmt = $this->_visibleComment($oCmts, (int)$aInfo['cmt_id']);
            if (!$aCmt)
                break;
            return [$oCmts, $aCmt, $aItem];
        }

        if ($bForbidden)
            throw BxDolApiV2Problem::forbidden('The viewer may not see what this comment is on');
        throw BxDolApiV2Problem::notFound('The comment');
    }

    /**
     * A comment row of the comments object, or false when there is none or the viewer may not
     * see it: one held for moderation is shown only to its author and moderators, as in the
     * comments list (BxDolCmtsQuery::getCommentsCheckStatus).
     */
    protected function _visibleComment($oCmts, $iCmtId)
    {
        $aCmt = $oCmts->getQueryObject()->getComment($oCmts->getId(), $iCmtId);
        if (empty($aCmt) || !is_array($aCmt))
            return false;

        $sStatus = $aCmt['cmt_status_admin'] ?? null;
        if ($sStatus === null || $sStatus === BX_CMT_STATUS_ACTIVE || $oCmts->isModerator())
            return $aCmt;
        $iViewerId = (int)bx_get_logged_profile_id();
        return $iViewerId && abs((int)$aCmt['cmt_author_id']) === $iViewerId ? $aCmt : false;
    }

    protected function _checkCommentsView($oCmts)
    {
        // CHECK_ACTION_RESULT_ALLOWED is 0, a refusal is its message
        if (($mCheck = $oCmts->isViewAllowed()) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : 'The comments of this item are not visible to the viewer');
    }

    /**
     * Comments of one comments object as Comment, for a page that asked one row more ($aCmts
     * keeps it; the page drops it).
     */
    protected function _comments($oCmts, $aCmts, $iItemId)
    {
        // a reply's parent is often on the same page
        $aUniqIds = [];
        foreach ($aCmts as $aCmt)
            if (!empty($aCmt['cmt_unique_id']))
                $aUniqIds[(int)$aCmt['cmt_id']] = (int)$aCmt['cmt_unique_id'];

        BxDolApiV2Map::primeBadges(array_column($aCmts, 'cmt_author_id'));

        // the viewer's reactions to the page's comments, in one query
        $iViewerId = (int)bx_get_logged_profile_id();
        if ($iViewerId && $aCmts && ($oReactions = $oCmts->getReactionObject(0)) !== false) {
            $aIds = [];
            foreach ($aCmts as $aCmt)
                $aIds[] = $this->_uniqId($oCmts, $aCmt['cmt_id'], $aUniqIds);
            $aGiven = $oReactions->getQueryObject()->getFirstReactionsByObjects($aIds, $iViewerId);
            foreach ($aIds as $iId)
                $this->_aCommentReactions[$oCmts->getSystemName() . ':' . $iId] = $aGiven[$iId] ?? null;
        }

        $aItems = [];
        foreach ($aCmts as $aCmt)
            $aItems[] = $this->_comment($oCmts, $aCmt, $iItemId, $aUniqIds);
        return $aItems;
    }

    /**
     * The unique id (sys_cmts_ids) of a comment of the comments object. UNA gives every new
     * comment one; for an older comment without, it is made now, as the site does.
     */
    protected function _uniqId($oCmts, $iCmtId, &$aKnown = [])
    {
        $iCmtId = (int)$iCmtId;
        if (!isset($aKnown[$iCmtId])) {
            $aRow = $oCmts->getQueryObject()->getComment($oCmts->getId(), $iCmtId);
            $aKnown[$iCmtId] = !empty($aRow['cmt_unique_id']) ? (int)$aRow['cmt_unique_id'] : (int)$oCmts->getCommentUniqId($iCmtId, (int)($aRow['cmt_author_id'] ?? 0));
        }
        return $aKnown[$iCmtId];
    }

    protected function _comment($oCmts, $aCmt, $iItemId, &$aUniqIds = [])
    {
        $iAuthorId = (int)$aCmt['cmt_author_id'];
        $sHtml = (string)$aCmt['cmt_text'];
        // what the site's robot wrote where the comments object shows text its own way (Tasks'
        // activity log keeps a language key and its markers) is given as the site shows it: a
        // line of activity ("Eric Novak completed the task") with no author, as the site shows
        // it with no header and no actions
        $bAutomated = $iAuthorId > 0 && $iAuthorId === (int)getParam('sys_profile_bot') && self::_ownViewText($oCmts);
        if ($bAutomated)
            $sHtml = (string)$oCmts->getViewText($aCmt);

        if (!empty($aCmt['cmt_unique_id']))
            $aUniqIds[(int)$aCmt['cmt_id']] = (int)$aCmt['cmt_unique_id'];
        $iParentId = (int)$aCmt['cmt_parent_id'];
        $iUniqId = $this->_uniqId($oCmts, $aCmt['cmt_id'], $aUniqIds);

        return [
            'id' => BxDolApiV2Map::id($iUniqId),
            'target_id' => BxDolApiV2Map::id($iItemId),
            'parent_id' => $iParentId ? BxDolApiV2Map::id($this->_uniqId($oCmts, $iParentId, $aUniqIds)) : null,
            'depth' => (int)$aCmt['cmt_level'],
            'author' => $iAuthorId > 0 && !$bAutomated ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'automated' => $bAutomated,
            'body' => $this->_commentText($oCmts, $sHtml),
            'body_html' => $sHtml,
            'replies' => (int)$aCmt['cmt_replies'],
            'pinned' => (int)$aCmt['cmt_pinned'] > 0,
            'created_at' => BxDolApiV2Map::date($aCmt['cmt_time']),
            'viewer' => $this->_commentViewer($oCmts, $aCmt, $iUniqId, $bAutomated),
        ];
    }

    /** Whether the comments object's class shows comments' text its own way (getViewText). */
    protected static function _ownViewText($oCmts)
    {
        static $aKnown = [];
        $sClass = get_class($oCmts);
        if (!isset($aKnown[$sClass]))
            $aKnown[$sClass] = (new ReflectionMethod($oCmts, 'getViewText'))->getDeclaringClass()->getName() !== 'BxDolCmts';
        return $aKnown[$sClass];
    }

    /**
     * What the viewer did with a comment and may do, as an ItemViewer; null for guests.
     * `can_comment` is whether they may reply; comments are never favorites.
     */
    protected function _commentViewer($oCmts, $aCmt, $iUniqId, $bAutomated = false)
    {
        $iViewerId = (int)bx_get_logged_profile_id();
        if (!$iViewerId)
            return null;
        // a line of activity is not answered, reacted to, edited or deleted, as on the site
        if ($bAutomated)
            return ['reaction' => null, 'favorited' => false, 'can_react' => false, 'can_comment' => false, 'can_edit' => false, 'can_delete' => false];

        $oReactions = $oCmts->getReactionObject($iUniqId);
        $sKey = $oCmts->getSystemName() . ':' . $iUniqId;
        $sReaction = null;
        if ($oReactions !== false)
            $sReaction = array_key_exists($sKey, $this->_aCommentReactions) ? $this->_aCommentReactions[$sKey] : ($oReactions->getReactionsBy($iUniqId, $iViewerId)[0] ?? null);

        return [
            'reaction' => $sReaction,
            'favorited' => false,
            'can_react' => $oReactions !== false && (bool)$oReactions->isAllowedVote(),
            'can_comment' => (bool)$oCmts->isReplyAllowed($aCmt),
            // PATCH with body_html: any comment the viewer may edit
            'can_edit' => $oCmts->isEditAllowed($aCmt),
            // the same conditions as deleteComment: one with replies goes only by a moderator
            'can_delete' => $oCmts->isRemoveAllowed($aCmt) && ((int)$aCmt['cmt_replies'] === 0 || $oCmts->isModerator()),
        ];
    }

    /**
     * What a client's plain-text `body` is stored as. The site keeps the comments of an HTML
     * comments object as HTML; a text-only one escapes the text itself when it saves it.
     */
    protected function _commentHtml($oCmts, $sText)
    {
        return $oCmts->isHtml() ? BxDolApiV2Map::htmlFromText($sText) : (string)$sText;
    }

    /**
     * What a NewComment or EditComment stores: `body` (plain text) or `body_html` (the site's
     * comment form filters it, as it filters what its editor sends), one of them.
     * @return array [the comment's text, the field it came from]
     */
    protected function _commentBody($oCmts, $aBody)
    {
        $bText = isset($aBody['body']);
        $bHtml = isset($aBody['body_html']);
        if ($bText === $bHtml)
            throw BxDolApiV2Problem::validation([['field' => $bText ? 'body_html' : 'body', 'code' => $bText ? 'conflict' : 'required', 'message' => 'Send body or body_html']]);
        if ($bText)
            return [$this->_commentHtml($oCmts, $aBody['body']), 'body'];

        $sHtml = (string)$aBody['body_html'];
        if (BxDolApiV2Map::text($sHtml) === '' && !preg_match('/<img\b/i', $sHtml))
            throw BxDolApiV2Problem::validation([['field' => 'body_html', 'code' => 'required', 'message' => 'A comment needs text']]);
        // a text-only comments object keeps text: the HTML's text, as it would escape a body
        return [$oCmts->isHtml() ? $sHtml : BxDolApiV2Map::text($sHtml), 'body_html'];
    }

    /**
     * A comment's text as plain text. A text-only comments object stores it escaped, with
     * `<br />` before each line break.
     */
    protected function _commentText($oCmts, $sHtml)
    {
        if (!$oCmts->isHtml())
            $sHtml = preg_replace('/<br\s*\/?>(\r?\n)?/i', "\n", (string)$sHtml);
        return BxDolApiV2Map::text($sHtml);
    }

    /**
     * Whether an edit with plain text keeps all of the comment: false when it has links,
     * mentions or formatting.
     */
    protected function _editableAsText($oCmts, $aCmt)
    {
        return !$oCmts->isHtml() || BxDolApiV2Map::isPlainHtml($aCmt['cmt_text'] ?? '');
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aProfileOrNull = BxDolApiV2Map::profileOrNullSchema();

        return [
            'ItemViewer' => BxDolApiV2Map::itemViewerSchema(),
            'Comment' => [
                'type' => 'object',
                'description' => 'A comment on an item. Its id is unique across the site\'s comment systems (UNA\'s unique comment id), for /comments/{id}.',
                'required' => ['id', 'target_id', 'depth', 'body', 'body_html', 'replies', 'pinned', 'created_at', 'viewer'],
                'properties' => [
                    'id' => $aId,
                    'target_id' => $aId + ['description' => 'The Item it is on (/content/{id})'],
                    'parent_id' => ['type' => ['string', 'null'], 'description' => 'The comment it answers; null for a top-level comment'],
                    'depth' => ['type' => 'integer', 'description' => '0 for a top-level comment, 1 for a reply, and so on'],
                    'author' => $aProfileOrNull + ['description' => 'Who wrote it; null for an automated one'],
                    'automated' => ['type' => 'boolean', 'description' => 'True for a line the site wrote itself, such as a task\'s activity ("Eric Novak completed the task"): no author, and the viewer may not reply to, react to, edit or delete it, as on the site; false otherwise'],
                    'body' => ['type' => 'string', 'description' => 'Plain text: one line per paragraph or line break'],
                    'body_html' => ['type' => 'string', 'description' => 'The text as HTML, filtered by the site; sanitize it again before display'],
                    'replies' => ['type' => 'integer', 'description' => 'How many comments answer this one'],
                    'pinned' => ['type' => 'boolean'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/ItemViewer'], ['type' => 'null']], 'description' => 'What the viewer did with the comment and may do: `reaction` theirs, `favorited` always false, `can_react`, `can_comment` (may reply), `can_edit` (PATCH /comments/{id} with `body_html` would be accepted: the viewer may edit it) and `can_delete` (DELETE /comments/{id} would be accepted: a comment with replies only for moderators). Null for guests'],
                ],
            ],
            'Page_Comment' => BxDolApiV2Map::pageSchema('Comment'),
            'NewComment' => [
                'type' => 'object',
                'additionalProperties' => false,
                'description' => 'One of `body` and `body_html`.',
                'properties' => [
                    'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 10000, 'description' => 'Plain text, kept as written (a literal `<` stays text); each line is a paragraph'],
                    'body_html' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 20000, 'description' => 'HTML as the site\'s comment editor writes it (paragraphs, line breaks, links, mentions as `<a class="bx-mention-link" data-profile-id>`, hashtags); the site filters it as its comment form does'],
                    'parent_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'Reply to this comment of the item (a Comment id)'],
                ],
            ],
            'EditComment' => [
                'type' => 'object',
                'additionalProperties' => false,
                'description' => 'One of `body` and `body_html`; it replaces the whole comment.',
                'properties' => [
                    'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 10000, 'description' => 'Plain text, as in NewComment (409 formatted_text for a comment with markup it would lose)'],
                    'body_html' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 20000, 'description' => 'HTML, as in NewComment'],
                ],
            ],
        ];
    }
}

/** @} */
