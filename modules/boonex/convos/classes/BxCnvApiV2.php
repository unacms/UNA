<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Convos Convos
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Conversations: private conversations between profiles. A conversation
 * starts with a message (its text) and continues with replies (its comments).
 *
 * Only participants see a conversation; for anyone else it does not exist (404).
 */
class BxCnvApiV2
{
    /** The most characters of a conversation's `last_message.text`, its ellipsis included. */
    const PREVIEW_LENGTH = 200;

    protected $_oModule;
    protected $_aCmtsFiles = null;

    public function __construct()
    {
        $this->_oModule = BxDolModule::getInstance('bx_convos');
    }

    /**
     * GET /api/v2 `modules`: this module is here, with the tag of its paths.
     */
    public function apiV2ModuleInfo()
    {
        return BxDolApiV2Map::moduleInfo($this->_oModule->getName(), 'conversations', 'conversation');
    }

    /**
     * GET /navigation: an item of this module that goes to its folders (the apps' menu's Messages, the
     * Member Menu's Unread messages) opens the conversations, the section of this module's tag.
     */
    public function apiV2NavigationTarget(array $aItem, array $aPage)
    {
        if ($aItem['module'] !== $this->_oModule->getName() || strpos((string)($aItem['link_code'] ?? ''), 'r=convos/folder') === false)
            return null;
        return ['kind' => BxBaseApiV2Navigation::TARGET_SECTION, 'section' => 'conversations'];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/conversations', id: 'listConversations', tag: 'conversations', auth: 'required', paged: true,
        summary: 'The viewer\'s inbox, latest reply first', responses: [200 => 'Page_Conversation'])]
    public function listConversations(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();

        // every profile the page shows (authors, last repliers, all participants) has its badges
        // read in one query before any conversation is mapped, and the newest replies of the
        // page's conversations come in one query too
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aContents = $aCollaborators = [];
        $aProfileIds = [$iViewerId];
        foreach ($this->_oModule->_oDb->getMessagesPreviews($iViewerId, $iOffset, $iLimit + 1, BX_CNV_FOLDER_INBOX) as $aRow)
            if (($aContent = $this->_oModule->_oDb->getContentInfoById((int)$aRow['id']))) {
                $iId = (int)$aContent['id'];
                $aContents[] = $aContent;
                $aCollaborators[$iId] = $this->_oModule->_oDb->getCollaborators($iId);
                array_push($aProfileIds, (int)$aContent[$CNF['FIELD_AUTHOR']], (int)$aContent['last_reply_profile_id'], ...array_keys($aCollaborators[$iId]));
            }
        $aLastReplies = $this->_lastReplies(array_column($aContents, 'id'), $iViewerId);
        array_push($aProfileIds, ...array_map('intval', array_column($aLastReplies, 'cmt_author_id')));
        BxDolApiV2Map::primeBadges($aProfileIds);

        $aItems = [];
        foreach ($aContents as $aContent)
            $aItems[] = $this->_conversation($aContent, $iViewerId, $aCollaborators[(int)$aContent['id']], $aLastReplies[(int)$aContent['id']] ?? null);

        return $oReq->page($aItems, $iOffset, $iLimit);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/conversations/unread-count', id: 'getUnreadMessagesCount', tag: 'conversations', auth: 'required',
        summary: 'How many messages in the inbox the viewer has not read', responses: [200 => 'UnreadCount'])]
    public function getUnreadMessagesCount(BxDolApiV2Request $oReq)
    {
        return ['unread' => max(0, (int)$this->_oModule->_oDb->getUnreadMessagesNum($oReq->requireViewer()))];
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/conversations', id: 'createConversation', tag: 'conversations', auth: 'required',
        summary: 'Start a conversation',
        description: 'Recipients the viewer may not contact are left out, as on the site (422 when that leaves nobody). `media_ids` are the viewer\'s uploads of purpose `conversation` (POST /uploads), shown with the first message in the order given; anything else is 422 on `media_ids[i]`. Find recipients with GET /search/profiles.',
        body: 'NewConversation', responses: [201 => 'Conversation', 403 => null])]
    public function createConversation(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aRecipients = array_values(array_unique(array_map('intval', $aBody['recipients'])));
        foreach ($aRecipients as $i => $iRecipient)
            if (!BxDolProfile::getInstance($iRecipient))
                throw BxDolApiV2Problem::validation([['field' => 'recipients[' . $i . ']', 'code' => 'not_found', 'message' => 'No such profile']]);

        if (($mCheck = $this->_oModule->checkAllowedAdd()) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');

        $aFileIds = $this->_takeUploads($aBody['media_ids'] ?? [], $iViewerId, 'conversation');

        $aValues = ['text' => $aBody['body'], 'recipients' => $aRecipients];

        // The form's submit button is inside an input set, where the forms helper doesn't look,
        // so the form wouldn't see itself submitted: pass the submit name it expects.
        $oForm = $this->_oModule->getFormsHelper()->getObjectFormAdd();
        foreach ((array)($oForm ? $oForm->aParams['db']['submit_name'] ?? [] : []) as $sSubmitName)
            $aValues[$sSubmitName] = 1;

        $a = $this->_oModule->serviceEntityAdd($iViewerId, $aValues);
        if (!isset($a['code']) || (int)$a['code'] !== 0 || empty($a['content']['id'])) {
            $aErrors = [];
            foreach ((array)($a['errors'] ?? []) as $sField => $sError)
                $aErrors[] = ['field' => $sField === 'text' ? 'body' : $sField, 'code' => 'rejected', 'message' => BxDolApiV2Map::text($sError)];
            throw BxDolApiV2Problem::validation($aErrors ?: [['field' => '(body)', 'code' => 'rejected', 'message' => 'The conversation was not started']]);
        }
        $iId = (int)$a['content']['id'];

        // the attachments, as the add form's own files step takes them (the form's helper reads
        // them from the request after the insert, which an API request does not carry)
        if ($aFileIds && !empty($CNF['FIELD_PHOTO']) && ($oFiles = $this->_oModule->getFormsHelper()->getObjectFormAdd())) {
            $oFiles->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
            $oFiles->setSpecificValue($CNF['FIELD_PHOTO'], $aFileIds);
            if (($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])))
                $oStorage->reorderGhosts($iViewerId, 0, $aFileIds);
            $oFiles->processFiles($CNF['FIELD_PHOTO'], $iId, true);
        }

        $aContent = $this->_oModule->_oDb->getContentInfoById($iId);
        return BxDolApiV2Response::created($this->_conversation($aContent, $iViewerId), '/conversations/' . $iId);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/conversations/{id}', id: 'getConversation', tag: 'conversations', auth: 'required',
        summary: 'A conversation of the viewer', responses: [200 => 'Conversation'])]
    public function getConversation(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        return $this->_conversation($this->_ownConversation($oReq->id(), $iViewerId), $iViewerId);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/conversations/{id}/messages', id: 'listMessages', tag: 'conversations', auth: 'required', paged: true,
        summary: 'Replies in a conversation, newest first',
        description: 'The first page holds the newest replies; each next page the ones before it (a keyset cursor, so replies that come meanwhile shift nothing). `before` (a message id) starts a page before that message, for a client that knows one. The message that started the conversation is its `body`; this lists what came after it. A message\'s id grows with time.',
        params: ['before' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only replies older than this message; `cursor`, when given, wins']],
        responses: [200 => 'Page_Message'])]
    public function listMessages(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aContent = $this->_ownConversation($oReq->id(), $iViewerId);
        $oCmts = $this->_cmts($aContent);

        $iLimit = $oReq->limit();
        $iBefore = $oReq->query('cursor') !== null ? $oReq->cursorBefore() : $this->_before($oReq->query('before'));

        $aCmts = $oCmts->getCommentsArray(-1, '', ['by' => BX_CMT_ORDER_BY_DATE, 'way' => BX_CMT_ORDER_WAY_DESC, 'before' => $iBefore], 0, $iLimit + 1);
        BxDolApiV2Map::primeBadges(array_column(array_slice($aCmts, 0, $iLimit), 'cmt_author_id'));
        $aItems = [];
        foreach (array_slice($aCmts, 0, $iLimit) as $aCmt)
            $aItems[] = $this->_message($aCmt, $iViewerId, $oCmts);

        return $oReq->pageBeforeAt($aItems, count($aCmts) > $iLimit ? (int)$aCmts[$iLimit - 1]['cmt_id'] : 0);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/conversations/{id}/messages', id: 'sendMessage', tag: 'conversations', auth: 'required',
        summary: 'Reply in a conversation',
        description: '`media_ids` are the viewer\'s uploads of purpose `message` (POST /uploads), shown with the message in the order given; anything else is 422 on `media_ids[i]`. The site needs text with every message.',
        body: 'NewMessage', responses: [201 => 'Message', 403 => null])]
    public function sendMessage(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aContent = $this->_ownConversation($oReq->id(), $iViewerId);
        $oCmts = $this->_cmts($aContent);
        $aBody = $oReq->body();

        if (!$oCmts->isPostAllowed())
            throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($oCmts->msgErrPostAllowed()));

        $aFileIds = $this->_takeUploads($aBody['media_ids'] ?? [], $iViewerId, 'message');

        $mResult = $oCmts->add(['cmt_text' => $aBody['body'], 'cmt_parent_id' => 0]);
        if (empty($mResult['id']))
            throw BxDolApiV2Problem::validation([['field' => 'body', 'code' => 'rejected', 'message' => isset($mResult['message']) ? BxDolApiV2Map::text(_t($mResult['message'])) : 'The message was not sent']]);
        $iCmtId = (int)$mResult['id'];

        // the photos, as the comment form takes its images (BxBaseCmtsForm::_associalImageWithContent)
        if ($aFileIds && ($oStorage = BxDolStorage::getObjectInstance($oCmts->getStorageObjectName()))) {
            $iUniqId = (int)$oCmts->getCommentUniqId($iCmtId);
            foreach ($aFileIds as $iFileId) {
                $oStorage->updateGhostsContentId($iFileId, $iViewerId, $iUniqId, $oCmts->isAdmin($iViewerId));
                $oCmts->getQueryObject()->saveImages($oCmts->getSystemId(), $iCmtId, $iFileId);
            }
        }

        $this->_markRead((int)$aContent['id'], $iViewerId);
        return BxDolApiV2Response::created($this->_message($oCmts->getCommentRow($iCmtId), $iViewerId, $oCmts));
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/conversations/{id}/messages/{message_id}', id: 'editMessage', tag: 'conversations', auth: 'required',
        summary: 'Edit one\'s own reply in a conversation',
        description: '`body` replaces the whole text: HTML as the site\'s message editor writes it (paragraphs, line breaks, links, mentions), which the site filters as its form does. Only the reply\'s author, and only where the site lets them edit it (the conversation\'s own edit check, which lets administrators alone edit messages on a site as installed; `can_edit` says): 403 otherwise. Its photos stay. The message that started the conversation is the conversation\'s text, not a reply: it is not edited here. A message of another conversation, or none, is 404.',
        body: 'MessageChanges', responses: [200 => 'Message', 403 => null, 404 => null])]
    public function editMessage(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aContent = $this->_ownConversation($oReq->id(), $iViewerId);
        $oCmts = $this->_cmts($aContent);
        $aBody = $oReq->body();

        $iCmtId = (int)$oReq->id('message_id');
        $aCmt = $iCmtId ? $oCmts->getCommentRow($iCmtId) : [];
        if (empty($aCmt) || (int)$aCmt['cmt_object_id'] !== (int)$aContent['id'])
            throw BxDolApiV2Problem::notFound('No such message in this conversation');

        if ((int)$aCmt['cmt_author_id'] !== (int)$iViewerId)
            throw BxDolApiV2Problem::forbidden('Only its author may edit a message');
        if (!$oCmts->isEditAllowed($aCmt))
            throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($oCmts->msgErrEditAllowed()) ?: 'The site does not let you edit this message');

        $sHtml = (string)$aBody['body'];
        if (BxDolApiV2Map::text($sHtml) === '')
            throw BxDolApiV2Problem::validation([['field' => 'body', 'code' => 'required', 'message' => 'The site needs text with every message']]);

        // the edit form saves its reply-to field too: keep the message where it is
        $mResult = $oCmts->edit(['cmt_text' => $sHtml, 'cmt_parent_id' => (int)$aCmt['cmt_parent_id']], $iCmtId);
        if (empty($mResult['id']))
            throw BxDolApiV2Problem::validation([['field' => 'body', 'code' => 'rejected', 'message' => isset($mResult['message']) ? BxDolApiV2Map::text(_t($mResult['message'])) : 'The message was not saved']]);

        $oCmts->isEditAllowed($aCmt, true); // counts the action, as the site's edit form does

        return $this->_message($oCmts->getCommentRow($iCmtId), $iViewerId, $oCmts);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/conversations/{id}/read', id: 'markConversationRead', tag: 'conversations', auth: 'required',
        summary: 'Mark every message of a conversation as read', responses: [204 => null])]
    public function markConversationRead(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $this->_markRead((int)$this->_ownConversation($oReq->id(), $iViewerId)['id'], $iViewerId);
        return BxDolApiV2Response::noContent();
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/conversations/{id}/read', id: 'markConversationUnread', tag: 'conversations', auth: 'required',
        summary: 'Mark a conversation as unread, as the site\'s Mark unread does',
        description: 'Every message of it counts as unread for the viewer again, the first one too. One that is unread already (a conversation just received) stays so: 204 again.',
        responses: [204 => null, 403 => null])]
    public function markConversationUnread(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aContent = $this->_ownConversation($oReq->id(), $iViewerId);
        $iId = (int)$aContent['id'];
        // markUnread reports an error when its update changes no row, which is the case for a
        // conversation that is unread already; that is done, not refused
        if (($sError = $this->_oModule->markUnread($iId)) !== '' && (int)($this->_oModule->_oDb->getCollaborators($iId)[$iViewerId] ?? 0) !== -1)
            throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($sError));
        return BxDolApiV2Response::noContent();
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/conversations/{id}/participants', id: 'addParticipants', tag: 'conversations', auth: 'required',
        summary: 'Add people to a conversation',
        description: 'Only who started it may, where the site lets them edit it (`can_add_participants`), as the site\'s edit form has the recipients for the author only (403 otherwise). People the viewer may not contact are left out, as when starting one; 422 when that leaves nobody new. Those added see the whole conversation, unread.',
        body: 'NewParticipants', responses: [200 => 'Conversation', 403 => null])]
    public function addParticipants(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aContent = $this->_ownConversation($oReq->id(), $iViewerId);
        $iId = (int)$aContent['id'];
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (!$this->_canEditParticipants($aContent, $iViewerId))
            throw BxDolApiV2Problem::forbidden('Only who started the conversation may add people to it');

        $aNew = array_values(array_unique(array_map('intval', $oReq->body()['profile_ids'])));
        foreach ($aNew as $i => $iProfileId)
            if (!BxDolProfile::getInstance($iProfileId))
                throw BxDolApiV2Problem::validation([['field' => 'profile_ids[' . $i . ']', 'code' => 'not_found', 'message' => 'No such profile']]);

        $aBefore = $this->_oModule->_oDb->getCollaborators($iId);

        // the edit form's own step (BxCnvFormEntry::update), with the recipients it would get
        // from the form: those in it now and the new ones (it leaves out whom the viewer may not
        // contact), and the author's own folder; those in it already keep their folder and count
        $oForm = $this->_oModule->getFormsHelper()->getObjectFormEdit();
        if (!$oForm)
            throw new BxDolApiV2Problem(500, 'not_changed', 'The conversation could not be changed');
        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->setSpecificValue('recipients', array_values(array_unique(array_merge(array_map('intval', array_keys($aBefore)), $aNew))));
        $iFolder = (int)$this->_oModule->_oDb->getConversationFolder($iId, $iViewerId);
        $oForm->updateParticipants($iId, $iFolder ?: BX_CNV_FOLDER_INBOX, $iFolder === BX_CNV_FOLDER_DRAFTS);

        $aAfter = $this->_oModule->_oDb->getCollaborators($iId);
        if (!array_diff_key($aAfter, $aBefore) && array_diff($aNew, array_keys($aBefore)))
            throw BxDolApiV2Problem::validation([['field' => 'profile_ids', 'code' => 'not_contactable', 'message' => 'You may not contact anyone of them']]);

        return $this->_conversation($this->_oModule->_oDb->getContentInfoById($iId), $iViewerId);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/conversations/{id}/participants/{profile_id}', id: 'removeParticipant', tag: 'conversations', auth: 'required',
        summary: 'Leave a conversation, or take someone out of one',
        description: 'The viewer\'s own id leaves it (`can_leave`, the site\'s delete check), as deleting it from the trash does on the site: it is gone from the viewer\'s inbox for good, and once nobody is left the conversation is deleted. Another participant can be taken out only by who started it, where the site lets them edit it (403 otherwise). As on the site, a reply brings who started it back in. One who is not in it is 404.',
        params: ['profile_id' => ['in' => 'path', 'description' => 'A profile in the conversation']],
        responses: [204 => null, 403 => null])]
    public function removeParticipant(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aContent = $this->_ownConversation($oReq->id(), $iViewerId);
        $iId = (int)$aContent['id'];
        $iProfileId = $oReq->id('profile_id');

        if (!array_key_exists($iProfileId, $this->_oModule->_oDb->getCollaborators($iId)))
            throw BxDolApiV2Problem::notFound('The participant');

        if ($iProfileId === (int)$iViewerId) {
            if (($mCheck = $this->_oModule->checkAllowedDelete($aContent)) !== CHECK_ACTION_RESULT_ALLOWED)
                throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');
            if (($sError = $this->_oModule->_oDb->deleteConvo($iId, $iViewerId)) !== '')
                throw new BxDolApiV2Problem(500, 'not_changed', BxDolApiV2Map::text($sError));
            return BxDolApiV2Response::noContent();
        }

        if (!$this->_canEditParticipants($aContent, $iViewerId))
            throw BxDolApiV2Problem::forbidden('Only who started the conversation may take people out of it');

        $this->_oModule->_oDb->removeCollaborator($iId, $iProfileId);
        return BxDolApiV2Response::noContent();
    }

    /*
     * Uploads (POST /uploads), targets and sync (BxDolApiV2Targets, GET /sync)
     */

    /**
     * Where a message's photos go: a reply's to the comments object's storage, as the site's
     * reply form puts them, the first message's to the module's own storage, as its add form.
     */
    public function apiV2UploadStorages()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aResult = [];

        $oCmts = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], 0);
        if ($oCmts && ($sStorage = (string)$oCmts->getStorageObjectName()) !== '') {
            $aInput = $oCmts->getFormObject()->aInputs['cmt_image'] ?? [];
            $aResult[] = ['purpose' => 'message', 'object' => $sStorage, 'thumb' => (string)$oCmts->getTranscoderPreviewName(), 'uploader' => (string)(((array)($aInput['uploaders'] ?? []))[0] ?? '')];
        }

        if (!empty($CNF['OBJECT_STORAGE']) && !empty($CNF['FIELD_PHOTO']))
            $aResult[] = ['purpose' => 'conversation', 'object' => $CNF['OBJECT_STORAGE'], 'thumb' => (string)$CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'], 'uploader' => (string)($CNF['OBJECT_UPLOADERS'][0] ?? '')];

        return $aResult;
    }

    /**
     * Who may upload a message's photo: who may start a conversation, or post replies.
     * @return true|string
     */
    public function apiV2UploadAllowed($sPurpose)
    {
        if ($sPurpose === 'conversation') {
            $mCheck = $this->_oModule->checkAllowedAdd();
            return $mCheck === CHECK_ACTION_RESULT_ALLOWED ? true : (string)$mCheck;
        }

        $oCmts = BxDolCmts::getObjectInstance($this->_oModule->_oConfig->CNF['OBJECT_COMMENTS'], 0);
        if (!$oCmts)
            return 'This site takes no replies';
        return $oCmts->checkAction('comments post') ? true : (string)$oCmts->checkActionErrorMsg('comments post');
    }

    /**
     * A conversation is its content entry; its messages are comments on it, so a link to it
     * or a notification about a message opens the conversation.
     */
    public function apiV2ContentTarget($sModule, $iContentId)
    {
        if ($sModule !== $this->_oModule->getName() || !$this->_oModule->_oDb->getContentInfoById((int)$iContentId))
            return null;
        return BxDolApiV2Targets::make(BxDolApiV2Targets::CONVERSATION, $iContentId);
    }

    /**
     * A conversation is visible to those who take part in it, as GET /conversations/{id} says:
     * for anyone else, guests too, it doesn't exist.
     */
    public function apiV2TargetVisible($aTarget)
    {
        if (($aTarget['kind'] ?? '') !== BxDolApiV2Targets::CONVERSATION)
            return null;
        $iViewerId = (int)bx_get_logged_profile_id();
        return $iViewerId > 0 && array_key_exists($iViewerId, $this->_oModule->_oDb->getCollaborators((int)$aTarget['id']));
    }

    /**
     * The messages badge: the same count as GET /conversations/unread-count.
     */
    public function apiV2Sync($iViewerId, $aCursor, $bReset)
    {
        return ['badges' => ['messages' => max(0, (int)$this->_oModule->_oDb->getUnreadMessagesNum($iViewerId))]];
    }

    /*
     * Mapping
     */

    /**
     * The conversation when the viewer takes part in it; otherwise it doesn't exist for them.
     */
    protected function _ownConversation($iId, $iViewerId)
    {
        $aContent = $this->_oModule->_oDb->getContentInfoById($iId);
        $aCollaborators = $aContent ? $this->_oModule->_oDb->getCollaborators($iId) : [];
        if (!$aContent || !array_key_exists($iViewerId, $aCollaborators))
            throw BxDolApiV2Problem::notFound('The conversation');
        return $aContent;
    }

    /**
     * Who started it, where the site lets them edit it: the edit form has the recipients for
     * the author only (BxCnvFormEntry::update, initChecker).
     */
    protected function _canEditParticipants($aContent, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return (int)$aContent[$CNF['FIELD_AUTHOR']] === (int)$iViewerId && $this->_oModule->checkAllowedEdit($aContent) === CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * The `before` query param: a message id, or 0 without one.
     */
    protected function _before($mValue)
    {
        if ($mValue === null)
            return 0;
        if (!is_string($mValue) || !preg_match('/^[1-9][0-9]{0,18}$/', $mValue))
            throw BxDolApiV2Problem::validation([['field' => 'before', 'code' => 'invalid', 'message' => 'A message id']]);
        return (int)$mValue;
    }

    /**
     * The uploads a message takes: each must be one of the viewer's uploads of this purpose
     * that nothing took yet, in the order given.
     * @return array file ids of the purpose's storage
     */
    protected function _takeUploads($aIds, $iViewerId, $sPurpose)
    {
        $aIds = array_values((array)$aIds);
        if (!$aIds)
            return [];

        $sStorage = '';
        foreach ($this->apiV2UploadStorages() as $a)
            if ($a['purpose'] === $sPurpose)
                $sStorage = $a['object'];
        $aObject = $sStorage !== '' ? BxDolStorageQuery::getStorageObject($sStorage) : null;
        $oStorage = !empty($aObject['id']) ? BxDolStorage::getObjectInstance($sStorage) : null;

        $aFileIds = [];
        $aErrors = [];
        foreach ($aIds as $i => $sId) {
            $sField = 'media_ids[' . $i . ']';
            list($iStorageId, $iFileId) = BxDolApiV2Map::uploadParts($sId);
            if ($iFileId && in_array($iFileId, $aFileIds, true) && $iStorageId === (int)($aObject['id'] ?? 0)) {
                $aErrors[] = ['field' => $sField, 'code' => 'duplicate', 'message' => 'Is given twice'];
                continue;
            }
            $aGhost = $oStorage && $iFileId && $iStorageId === (int)$aObject['id'] ? $oStorage->getGhost($iFileId) : null;
            if (empty($aGhost) || !is_array($aGhost) || (int)$aGhost['profile_id'] !== (int)$iViewerId || (int)$aGhost['content_id'] !== 0 || !BxDolApiV2Map::fileRow($sStorage, $iFileId)) {
                $aErrors[] = ['field' => $sField, 'code' => 'not_found', 'message' => 'No upload of yours for a ' . ($sPurpose === 'message' ? 'reply' : 'new conversation') . ' that nothing took'];
                continue;
            }
            $aFileIds[] = $iFileId;
        }
        if ($aErrors)
            throw BxDolApiV2Problem::validation($aErrors, 'Some media are not uploads of yours');
        return $aFileIds;
    }

    protected function _markRead($iConversationId, $iViewerId)
    {
        $aContent = $this->_oModule->_oDb->getContentInfoById($iConversationId);
        $this->_oModule->_oDb->updateReadComments($iViewerId, $iConversationId, (int)$aContent['comments']);
    }

    /**
     * The newest reply of each of these conversations that the viewer may see, as GET
     * /conversations/{id}/messages lists them (BxCnvDb::getLastReplies: approved, or the
     * viewer's own, or any for a moderator; its author active; past the content filter), keyed
     * by the conversation id: one query for them all, with their files counted.
     */
    protected function _lastReplies($aConversationIds, $iViewerId)
    {
        $oCmts = BxDolCmts::getObjectInstance($this->_oModule->_oConfig->CNF['OBJECT_COMMENTS'], 0);
        if (!$oCmts || !$aConversationIds)
            return [];
        return $this->_oModule->_oDb->getLastReplies($aConversationIds, [
            'cmts' => $oCmts->getCommentsTableName(),
            'ids' => BxDolCmts::$sTableIds,
            'files2entries' => $oCmts->getTableNameImages2Entries(),
            'files' => $oCmts->getTableNameImages(),
        ], (int)$oCmts->getSystemId(), (int)$iViewerId, $oCmts->isModerator(), $oCmts->getObjectContentFilter());
    }

    /**
     * Plain text of a message for a one-line preview: whitespace (line breaks, no-break spaces)
     * collapsed, at most PREVIEW_LENGTH characters with an ellipsis where it is cut. Text that is
     * not valid UTF-8 (which a `/u` pattern refuses) has its ASCII whitespace collapsed instead;
     * the response's JSON substitutes the bad bytes.
     */
    public static function snippet($sHtml)
    {
        $sText = BxDolApiV2Map::text($sHtml);
        $s = preg_replace('/[\s\p{Z}]+/u', ' ', $sText);
        if ($s === null)
            $s = preg_replace('/\s+/', ' ', $sText);
        $s = trim((string)$s);
        if (get_mb_len($s) > self::PREVIEW_LENGTH)
            $s = rtrim(get_mb_substr($s, 0, self::PREVIEW_LENGTH - 1)) . '…';
        return $s;
    }

    /**
     * What a message's files are, for the preview: `photo` when all of them are images, `file`
     * when any is not, null without files.
     */
    protected static function _mediaKind($iFiles, $iOtherFiles)
    {
        if ($iFiles <= 0)
            return null;
        return $iOtherFiles > 0 ? 'file' : 'photo';
    }

    /**
     * A conversation as the API sends it. $aCollaborators is its getCollaborators() when the
     * caller has read it already (the inbox reads a page's at once), null to read it here.
     * $mLastReply is its newest reply as _lastReplies() reads it when the caller has read it
     * (null: it has none), false to read it here.
     */
    protected function _conversation($aContent, $iViewerId, $aCollaborators = null, $mLastReply = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent['id'];
        if ($aCollaborators === null)
            $aCollaborators = $this->_oModule->_oDb->getCollaborators($iId);
        if ($mLastReply === false)
            $mLastReply = $this->_lastReplies([$iId], $iViewerId)[$iId] ?? null;

        BxDolApiV2Map::primeBadges(array_merge(array_keys($aCollaborators), [(int)$aContent[$CNF['FIELD_AUTHOR']], (int)$aContent['last_reply_profile_id'], (int)($mLastReply['cmt_author_id'] ?? 0)]));
        $aParticipants = [];
        foreach (array_keys($aCollaborators) as $iProfileId)
            if (($a = BxDolApiV2Map::profileSummary($iProfileId)) !== null)
                $aParticipants[] = $a;

        $iRead = (int)($aCollaborators[$iViewerId] ?? 0);
        $iComments = (int)$aContent['comments'];

        $sUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iId);

        // the first message's photos, as the entry's attachments block shows them
        $aMedia = [];
        $iFiles = $iOtherFiles = 0;
        $oStorage = !empty($CNF['OBJECT_STORAGE']) ? BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']) : null;
        foreach (($oStorage ? (array)$oStorage->getGhosts((int)$aContent[$CNF['FIELD_AUTHOR']], $iId) : []) as $aFile) {
            $iFiles++;
            if (!str_starts_with((string)($aFile['mime_type'] ?? ''), 'image/'))
                $iOtherFiles++;
            if (($a = BxDolApiV2Map::imageMedia($CNF['OBJECT_STORAGE'], (int)$aFile['id'], (string)$CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'])))
                $aMedia[] = $a;
        }

        // the newest message: the newest reply, or the first message when it has none
        if ($mLastReply) {
            $sLastKind = self::_mediaKind((int)$mLastReply['files'], (int)$mLastReply['other_files']);
            $aLast = [
                'text' => self::snippet($mLastReply['cmt_text']),
                'has_media' => $sLastKind !== null,
                'media_kind' => $sLastKind,
                'created_at' => BxDolApiV2Map::date($mLastReply['cmt_time']),
                'by' => BxDolApiV2Map::profileSummary((int)$mLastReply['cmt_author_id']),
            ];
        } else {
            $sLastKind = self::_mediaKind($iFiles, $iOtherFiles);
            $aLast = [
                'text' => self::snippet($aContent[$CNF['FIELD_TEXT']]),
                'has_media' => $sLastKind !== null,
                'media_kind' => $sLastKind,
                'created_at' => BxDolApiV2Map::date($aContent[$CNF['FIELD_ADDED']]),
                'by' => BxDolApiV2Map::profileSummary((int)$aContent[$CNF['FIELD_AUTHOR']]),
            ];
        }

        $aDelete = $aContent;
        return [
            'id' => BxDolApiV2Map::id($iId),
            'author' => BxDolApiV2Map::profileSummary((int)$aContent[$CNF['FIELD_AUTHOR']]),
            'participants' => $aParticipants,
            'body' => BxDolApiV2Map::text($aContent[$CNF['FIELD_TEXT']]),
            'body_html' => (string)$aContent[$CNF['FIELD_TEXT']],
            'media' => $aMedia,
            'replies' => $iComments,
            'unread' => $iRead < 0 ? $iComments + 1 : max(0, $iComments - $iRead),
            'last_reply_at' => (int)$aContent['last_reply_timestamp'] > 0 ? BxDolApiV2Map::date($aContent['last_reply_timestamp']) : null,
            'last_reply_by' => (int)$aContent['last_reply_profile_id'] > 0 ? BxDolApiV2Map::profileSummary((int)$aContent['last_reply_profile_id']) : null,
            'last_message' => $aLast,
            'url' => BxDolApiV2Map::absoluteUrl(BX_DOL_URL_ROOT . $sUrl),
            'created_at' => BxDolApiV2Map::date($aContent[$CNF['FIELD_ADDED']]),
            'can_add_participants' => $this->_canEditParticipants($aContent, $iViewerId),
            'can_leave' => array_key_exists($iViewerId, $aCollaborators) && $this->_oModule->checkAllowedDelete($aDelete) === CHECK_ACTION_RESULT_ALLOWED,
        ];
    }

    protected function _message($aCmt, $iViewerId, $oCmts)
    {
        $sHtml = (string)$aCmt['cmt_text'];

        // the comment form's storage and preview, read once (each read builds the form)
        if ($this->_aCmtsFiles === null)
            $this->_aCmtsFiles = [(string)$oCmts->getStorageObjectName(), (string)$oCmts->getTranscoderPreviewName()];
        list($sStorage, $sThumb) = $this->_aCmtsFiles;

        $aMedia = [];
        foreach ((array)$oCmts->getQueryObject()->getFiles($oCmts->getSystemId(), (int)$aCmt['cmt_id']) as $aFile)
            if (($a = BxDolApiV2Map::imageMedia($sStorage, (int)$aFile['image_id'], $sThumb)))
                $aMedia[] = $a;

        return [
            'id' => BxDolApiV2Map::id($aCmt['cmt_id']),
            'author' => BxDolApiV2Map::profileSummary((int)$aCmt['cmt_author_id']),
            'mine' => (int)$aCmt['cmt_author_id'] === (int)$iViewerId,
            // as editMessage checks it: one's own, where the site lets one edit it
            'can_edit' => (int)$aCmt['cmt_author_id'] === (int)$iViewerId && (bool)$oCmts->isEditAllowed($aCmt),
            'body' => BxDolApiV2Map::text($sHtml),
            'body_html' => $sHtml,
            'media' => $aMedia,
            'created_at' => BxDolApiV2Map::date($aCmt['cmt_time']),
        ];
    }

    protected function _cmts($aContent)
    {
        $oCmts = BxDolCmts::getObjectInstance($this->_oModule->_oConfig->CNF['OBJECT_COMMENTS'], (int)$aContent['id']);
        if (!$oCmts || !$oCmts->isEnabled())
            throw new BxDolApiV2Problem(409, 'replies_disabled', 'This conversation takes no replies');
        return $oCmts;
    }

    public static function schemas()
    {
        $aProfileOrNull = BxDolApiV2Map::profileOrNullSchema();
        $aMediaIds = ['type' => 'array', 'maxItems' => 20, 'items' => ['$ref' => '#/components/schemas/Id']];

        return [
            'Conversation' => [
                'type' => 'object',
                'required' => ['id', 'participants', 'body', 'body_html', 'media', 'replies', 'unread', 'last_message', 'created_at', 'can_add_participants', 'can_leave'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'author' => $aProfileOrNull,
                    'participants' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Profile'], 'description' => 'Everyone in it, the viewer too'],
                    'body' => ['type' => 'string', 'description' => 'The first message, as plain text'],
                    'body_html' => ['type' => 'string'],
                    'media' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Media'], 'description' => 'Photos of the first message (other files attached on the site are not listed)'],
                    'replies' => ['type' => 'integer'],
                    'unread' => ['type' => 'integer', 'description' => 'Messages the viewer has not read, the first one included: the newest this many (of the replies, then the first message) are unread'],
                    'last_reply_at' => ['type' => ['string', 'null'], 'format' => 'date-time'],
                    'last_reply_by' => $aProfileOrNull,
                    'last_message' => ['$ref' => '#/components/schemas/LastMessage'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'can_add_participants' => ['type' => 'boolean', 'description' => 'POST /conversations/{id}/participants would be accepted (who started it, where the site lets them edit it)'],
                    'can_leave' => ['type' => 'boolean', 'description' => 'DELETE /conversations/{id}/participants/{own id} would be accepted'],
                ],
            ],
            'LastMessage' => [
                'type' => 'object',
                'description' => 'The newest message of a conversation, for its row in a list: the newest reply that GET /conversations/{id}/messages lists to the viewer, or the first message when there is none.',
                'required' => ['text', 'has_media', 'media_kind', 'created_at', 'by'],
                'properties' => [
                    'text' => ['type' => 'string', 'maxLength' => self::PREVIEW_LENGTH, 'description' => 'Its plain text in one line (whitespace collapsed), cut to ' . self::PREVIEW_LENGTH . ' characters with an ellipsis; empty when it has no text'],
                    'has_media' => ['type' => 'boolean', 'description' => 'It has photos or other files'],
                    'media_kind' => ['type' => ['string', 'null'], 'enum' => ['photo', 'file', null], 'description' => '`photo` when all its files are images, `file` when any is not, null without files'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time', 'description' => 'When it was sent: the time for the row (`last_reply_at` keeps the time of a reply that was deleted since)'],
                    'by' => $aProfileOrNull,
                ],
            ],
            'Page_Conversation' => BxDolApiV2Map::pageSchema('Conversation'),
            'Message' => [
                'type' => 'object',
                'required' => ['id', 'mine', 'can_edit', 'body', 'body_html', 'media', 'created_at'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'author' => $aProfileOrNull,
                    'mine' => ['type' => 'boolean', 'description' => 'Sent by the viewer'],
                    'can_edit' => ['type' => 'boolean', 'description' => 'PATCH /conversations/{id}/messages/{message_id} would be accepted: the viewer\'s own, where the site lets them edit it'],
                    'body' => ['type' => 'string', 'description' => 'Plain text'],
                    'body_html' => ['type' => 'string'],
                    'media' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Media'], 'description' => 'Photos, in the order they were attached'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Page_Message' => BxDolApiV2Map::pageSchema('Message'),
            // also declared by the Timeline, which a site may not have
            'Media' => BxDolApiV2Map::mediaSchema(),
            'Variant' => BxDolApiV2Map::variantSchema(),
            // also declared by Notifications, which a site may not have
            'UnreadCount' => [
                'type' => 'object',
                'required' => ['unread'],
                'properties' => ['unread' => ['type' => 'integer']],
            ],
            'NewConversation' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['recipients', 'body'],
                'properties' => [
                    'recipients' => ['type' => 'array', 'minItems' => 1, 'maxItems' => 50, 'items' => ['$ref' => '#/components/schemas/Id']],
                    'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 50000],
                    'media_ids' => $aMediaIds + ['description' => 'Uploads of purpose `conversation`, in display order'],
                ],
            ],
            'NewMessage' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['body'],
                'properties' => [
                    'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 10000],
                    'media_ids' => $aMediaIds + ['description' => 'Uploads of purpose `message`, in display order'],
                ],
            ],
            'MessageChanges' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['body'],
                'properties' => [
                    'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 10000, 'description' => 'HTML that replaces the whole text; the site filters it'],
                ],
            ],
            'NewParticipants' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['profile_ids'],
                'properties' => [
                    'profile_ids' => ['type' => 'array', 'minItems' => 1, 'maxItems' => 50, 'items' => ['$ref' => '#/components/schemas/Id']],
                ],
            ],
        ];
    }
}

/** @} */
