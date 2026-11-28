<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseFile Base classes for file modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 for file modules (Videos, Photos, later Files), on the text base: an entry is a
 * FileItem, a photo, a video or a file with a title, a text, an author and an audience, and the
 * media of the upload it was made from. A module's own `<Prefix>ApiV2` class extends this one,
 * puts the operation attributes on its paths (/videos, /photos ...), says how its entry's media
 * is read (_media, _primeMedia) and makes new entries from uploads.
 *
 * Lists, reads, edits and deletes are the text base's (the module's search result, view check,
 * forms). The original upload goes only to its owner: everyone else gets the copies the site
 * shows (BxDolApiV2Map::media). New entries are made from the viewer's uploads (POST /uploads
 * with the module's purpose) through the module's add form, so its checks, alerts, the Timeline
 * and the ACL counters are the site's.
 */
class BxBaseModFilesApiV2 extends BxBaseModTextApiV2
{
    /** FileItem.kind: photo, video or file. */
    const API_FILE_KIND = 'file';

    /*
     * Mapping
     */

    /**
     * The media of an entry and its video link: [Media or null, embed_url or null, links], by the
     * module's own fields.
     */
    protected function _media($aContent)
    {
        return [null, null, []];
    }

    /**
     * A FileItem, with module, content_id (the Item whose comments and
     * reactions are this entry's), url and, for a video on another site, embed_player_url.
     */
    protected function _item($aContent, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $iAuthorId = (int)$aContent[$CNF['FIELD_AUTHOR']];
        $iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $sHtml = (string)$aContent[$CNF['FIELD_TEXT']];
        $iItemId = $this->_itemId($iId);
        list($aMedia, $sEmbedUrl, $aLinks, $sPlayerUrl) = array_pad($this->_media($aContent), 4, null);

        $iChars = !empty($CNF['PARAM_CHARS_SUMMARY_PLAIN']) ? (int)getParam($CNF['PARAM_CHARS_SUMMARY_PLAIN']) : 0;
        $iAdded = (int)$aContent[$CNF['FIELD_ADDED']];
        $iChanged = !empty($CNF['FIELD_CHANGED']) ? (int)$aContent[$CNF['FIELD_CHANGED']] : 0;

        return [
            'id' => BxDolApiV2Map::id($iId),
            'kind' => static::API_FILE_KIND,
            'module' => $this->_oModule->getName(),
            // the form keeps the title as typed: it is text
            'title' => trim((string)$aContent[$CNF['FIELD_TITLE']]),
            'excerpt' => BxDolApiV2Map::text($sHtml, $iChars > 0 ? $iChars : self::SUMMARY_LENGTH),
            'text_html' => $this->_bFull ? $sHtml : null,
            'media' => $aMedia,
            'embed_url' => $sEmbedUrl,
            'embed_player_url' => $sPlayerUrl,
            'album_id' => null,
            // an anonymous entry keeps its author as a negative id: never named
            'author' => $iAuthorId > 0 ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'audience' => $this->_audience($iPrivacy),
            'context_id' => BxDolApiV2Map::idOrNull($iPrivacy < 0 ? -$iPrivacy : 0),
            'state' => $this->_state($aContent),
            'moderation' => $this->_moderation($aContent),
            'links' => $aLinks ?: [],
            'comments_enabled' => !empty($CNF['OBJECT_COMMENTS']),
            'featured' => !empty($CNF['FIELD_FEATURED']) ? (int)($aContent[$CNF['FIELD_FEATURED']] ?? 0) > 0 : (int)($aContent['featured'] ?? 0) > 0,
            'stats' => [
                'comments' => (int)($aContent[$CNF['FIELD_COMMENTS']] ?? 0),
                'reactions' => $this->_reactionCount($aContent),
                'views' => (int)($aContent[$CNF['FIELD_VIEWS']] ?? 0),
            ],
            'content_id' => BxDolApiV2Map::idOrNull($iItemId),
            'url' => $this->_entryUrl($iId),
            'viewer' => $iViewerId ? $this->_itemViewer($aContent) : null,
            'published_at' => BxDolApiV2Map::date($iAdded),
            'created_at' => BxDolApiV2Map::date($iAdded),
            'updated_at' => BxDolApiV2Map::date(max($iAdded, $iChanged)),
        ];
    }

    /*
     * Adding from uploads (Photos, Files: the module's upload form makes one entry per upload)
     */

    /**
     * POST of a module whose upload form makes an entry for each upload (Photos, Files): each of
     * `media_ids` (up to $iMax of the viewer's uploads in $sStorage that nothing took, of a type
     * starting with $sMimePrefix: '' for any) becomes an entry, in their order, with `title`
     * (each upload's file name when absent), `text_html`, `audience` or `context_id`. 201 with
     * the entries made: the form stops at the membership level's limit, so the uploads no entry's
     * `media.id` is stay the viewer's.
     */
    protected function _createFromUploads(BxDolApiV2Request $oReq, $sStorage, $sMimePrefix, $iMax, $sPurpose)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_refuse($this->_oModule->checkAllowedAdd(), 'The viewer may not add ' . static::API_NOUN_PLURAL);

        $aMediaIds = isset($aBody['media_ids']) && is_array($aBody['media_ids']) ? array_values($aBody['media_ids']) : [];
        if (!$aMediaIds)
            throw BxDolApiV2Problem::validation([['field' => 'media_ids', 'code' => 'required', 'message' => 'Send the uploads (POST /uploads with purpose ' . $sPurpose . ') to add']]);
        if (count($aMediaIds) > $iMax)
            throw BxDolApiV2Problem::validation([['field' => 'media_ids', 'code' => 'too_many', 'message' => 'Up to ' . $iMax . ' at a time']]);
        if (($aBody['comments_enabled'] ?? null) === false)
            throw BxDolApiV2Problem::validation([['field' => 'comments_enabled', 'code' => 'unsupported', 'message' => 'This site does not turn comments off']]);

        $iPrivacy = $this->_newPrivacy($aBody);
        $sTitle = trim((string)($aBody['title'] ?? ''));
        $sHtml = $this->_cleanHtml((string)($aBody['text_html'] ?? ''));

        list($aFileIds, $aTitles) = $this->_takeUploads($aMediaIds, $iViewerId, $sStorage, $sTitle, $sMimePrefix);
        // the form makes them in its uploads' order
        if (($oStorage = BxDolStorage::getObjectInstance($sStorage)))
            $oStorage->reorderGhosts($iViewerId, 0, $aFileIds);

        $aValues = [
            $CNF['FIELD_PHOTO'] => $aFileIds,
            $CNF['FIELD_ALLOW_VIEW_TO'] => $iPrivacy,
            'do_submit' => 1,
        ];
        if (($iCategory = $this->_defaultCategory()))
            $aValues[$CNF['FIELD_CATEGORY']] = $iCategory;
        foreach ($aFileIds as $i => $iFileId)
            $aValues['title-' . $iFileId] = $aTitles[$i];

        $aIds = $this->_withPost([], function () use ($iViewerId, $aValues, $sHtml) {
            return $this->_addFromUploads($iViewerId, $aValues, $sHtml);
        });

        // in the order of the uploads (the form adds them in their ghosts' order)
        $aByFile = [];
        foreach ($this->_contentRows($aIds) as $aContent)
            $aByFile[(int)$aContent[$CNF['FIELD_FOR_STORING_FILE_ID']]] = $aContent;
        $aContents = [];
        foreach ($aFileIds as $iFileId)
            if (isset($aByFile[$iFileId]))
                $aContents[] = $aByFile[$iFileId];
        $this->_afterAddFromUploads($aContents);
        $aItems = $this->_items($aContents, $iViewerId, true);

        // the form stops making them once the membership level's limit is reached (its check of
        // each upload): the uploads it did not take stay the viewer's, to send again later or
        // delete, and are the ones no entry of the answer has as its `media.id`
        return BxDolApiV2Response::created($aItems, $aItems ? '/' . static::API_TAG . '/' . $aItems[0]['id'] : '');
    }

    /**
     * What a module does with its new entries' files once they are made (Files queues a video's
     * copies, as the site's page does when it first shows one).
     */
    protected function _afterAddFromUploads($aContents)
    {
    }

    /**
     * The uploads a POST takes, each one of the viewer's in $sStorage that nothing took, once:
     * their file ids and the titles they get (the given one, or the file's name without its
     * extension).
     * @return array [file ids, titles]
     */
    protected function _takeUploads(array $aMediaIds, $iViewerId, $sStorage, $sTitle, $sMimePrefix)
    {
        $aFileIds = $aTitles = [];
        $aSeen = [];
        foreach ($aMediaIds as $i => $mId) {
            $sField = 'media_ids[' . $i . ']';
            if (!is_scalar($mId) || isset($aSeen[(string)$mId]))
                throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'duplicate', 'message' => 'Is given twice']]);
            $aSeen[(string)$mId] = true;
            list($iFileId, $aFile) = $this->_takeUpload((string)$mId, $iViewerId, $sStorage, $sField, $sMimePrefix);
            $aFileIds[] = (int)$iFileId;
            $aTitles[] = $sTitle !== '' ? $sTitle : $this->_titleFromFileName($aFile['file_name']);
        }
        return [$aFileIds, $aTitles];
    }

    /**
     * Adds an entry for each upload through the module's upload form, as its add page does: the
     * form's checks, one entry per upload (each counted in the ACL), the text of each, then the
     * form's after-add work and the module's alert for each. The new entries' ids.
     */
    protected function _addFromUploads($iViewerId, array $aValues, $sHtml)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oHelper = $this->_oModule->getFormsHelper();
        $oForm = $oHelper->getObjectFormAdd();
        if (!$oForm)
            throw new BxDolApiV2Problem(503, 'form_unavailable', 'The site\'s upload form is not there');

        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        $oForm->initChecker([], $aValues);
        if (!$oForm->isSubmittedAndValid()) {
            $aErrors = [];
            foreach ($oForm->aInputs as $sKey => $aInput)
                if (!empty($aInput['error']))
                    $aErrors[$sKey] = $aInput['error'];
            throw BxDolApiV2Problem::validation($this->_formErrors(['errors' => $aErrors], [
                $CNF['FIELD_PHOTO'] => 'media_ids',
                $CNF['FIELD_ALLOW_VIEW_TO'] => 'audience',
                $CNF['FIELD_CATEGORY'] => 'category',
            ]), 'They were not added');
        }

        $aIds = $oForm->insert([]);
        if (!is_array($aIds) || !$aIds)
            throw BxDolApiV2Problem::validation([['field' => 'media_ids', 'code' => 'rejected', 'message' => BxDolApiV2Map::text(_t('_sys_txt_error_entry_creation'))]], 'They were not added');

        $iAccountId = (int)BxDolProfile::getInstance($iViewerId)->getAccountId();
        foreach ($aIds as $iId) {
            // the text the edit form would keep (its text field filters user HTML so)
            if ($sHtml !== '')
                $this->_oModule->_oDb->updateEntries([$CNF['FIELD_TEXT'] => bx_process_input($sHtml, BX_DATA_HTML)], [$CNF['FIELD_ID'] => (int)$iId]);
            $oHelper->onDataAddAfter($iAccountId, (int)$iId);
            if (($aContent = $this->_oModule->_oDb->getContentInfoById((int)$iId)))
                $this->_oModule->alertAfterAdd($aContent);
        }
        return array_map('intval', $aIds);
    }

    /*
     * Schemas
     */

    /**
     * FileItem and the shapes it uses, for a module whose class answers with them (Albums'
     * items are FileItems too).
     */
    public static function fileSchemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aIdOrNull = ['oneOf' => [$aId, ['type' => 'null']]];
        $aCount = ['type' => 'integer', 'minimum' => 0];

        return [
            'Audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'context', 'private']],
            'ContentState' => BxDolApiV2Map::contentStateSchema(),
            'Moderation' => BxDolApiV2Map::moderationSchema(),
            'ItemViewer' => BxDolApiV2Map::itemViewerSchema(),
            'LinkPreview' => BxDolApiV2Map::linkPreviewSchema(),
            'LinkImage' => BxDolApiV2Map::linkImageSchema(),
            'Media' => BxDolApiV2Map::mediaSchema(),
            'Variant' => BxDolApiV2Map::variantSchema(),
            'FileStats' => [
                'type' => 'object',
                'required' => ['comments', 'reactions', 'views'],
                'properties' => ['comments' => $aCount, 'reactions' => $aCount, 'views' => $aCount],
            ],
            'FileItem' => [
                'type' => 'object',
                'description' => 'A photo, a video or a file, with `module`, `content_id`, `url` and `embed_player_url`. Its comments and reactions are those of the Item `content_id` (GET and POST /content/{content_id}/comments, PUT /content/{content_id}/reaction).',
                'required' => ['id', 'kind', 'module', 'title', 'excerpt', 'text_html', 'media', 'embed_url', 'embed_player_url', 'album_id', 'author', 'audience', 'context_id', 'state', 'moderation', 'links', 'comments_enabled', 'featured', 'stats', 'content_id', 'url', 'viewer', 'published_at', 'created_at', 'updated_at'],
                'properties' => [
                    'id' => $aId,
                    'kind' => ['type' => 'string', 'enum' => ['photo', 'video', 'file'], 'description' => '`photo`, `video` or `file`'],
                    'module' => ['type' => 'string', 'description' => 'The UNA module (v2 only)', 'example' => 'bx_videos'],
                    'title' => ['type' => 'string'],
                    'excerpt' => ['type' => 'string', 'description' => 'The start of the text, as plain text'],
                    'text_html' => ['type' => ['string', 'null'], 'description' => 'The text as the site keeps it (user HTML the site filtered: sanitize it again before showing it). Only on single answers (GET, POST and PATCH of one); null in lists'],
                    'media' => ['oneOf' => [['$ref' => '#/components/schemas/Media'], ['type' => 'null']], 'description' => 'The upload, as copies (`variants`); null for a video that is a link. Its original (`url`) only for its owner: everyone else gets the largest copy there'],
                    'embed_url' => ['type' => ['string', 'null'], 'description' => 'A video on another site; its preview is in `links`'],
                    'embed_player_url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'v2 only: the https address of that site\'s player, to show in a frame; null when the site gave none'],
                    'album_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'The album it is in, for an album\'s item (GET /albums/{id}/items, whose `id` is the item\'s own, not a photo\'s or a video\'s); null for the photos and videos of their own modules, which this site keeps apart from albums'],
                    'author' => BxDolApiV2Map::profileOrNullSchema() + ['description' => 'Null for an anonymous entry, or an author who is gone'],
                    'audience' => ['$ref' => '#/components/schemas/Audience'],
                    'context_id' => $aIdOrNull + ['description' => 'The group or other context it is in'],
                    'state' => ['$ref' => '#/components/schemas/ContentState', 'description' => '`processing` while a video is converted (seen by its author and moderators only)'],
                    'moderation' => ['$ref' => '#/components/schemas/Moderation'],
                    'links' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/LinkPreview'], 'description' => 'The preview of a video\'s link (an embed); the site keeps no previews of links in the text of these'],
                    'comments_enabled' => ['type' => 'boolean', 'description' => 'The module takes comments (the site can\'t turn them off for one entry)'],
                    'featured' => ['type' => 'boolean'],
                    'stats' => ['$ref' => '#/components/schemas/FileStats'],
                    'content_id' => $aIdOrNull + ['description' => 'v2 only: the Item that shows it in the feeds, whose comments and reactions are its; null when the Timeline shows none'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'v2 only: its page on the site'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/ItemViewer'], ['type' => 'null']], 'description' => 'What the viewer did and may do; null for guests. `reaction`, `favorited`, `can_react` and `can_comment` are read on single answers only (null and false in lists)'],
                    'published_at' => ['type' => ['string', 'null'], 'format' => 'date-time', 'description' => 'When it was added: this site publishes entries at once'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Page_FileItem' => BxDolApiV2Map::pageSchema('FileItem'),
            'FileItemChanges' => [
                'type' => 'object',
                'additionalProperties' => false,
                'description' => 'Fields to change; omitted ones (and nulls) stay. The upload itself can\'t be replaced: add a new one instead.',
                'properties' => [
                    'title' => ['type' => ['string', 'null'], 'minLength' => 1, 'maxLength' => 255],
                    'text_html' => ['type' => ['string', 'null'], 'maxLength' => 50000, 'description' => 'Replaces the whole text: user HTML the site filters, or plain text (each line a paragraph)'],
                    'audience' => ['oneOf' => [['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private']], ['type' => 'null']], 'description' => 'Not for one in a context (422)'],
                    'comments_enabled' => ['type' => ['boolean', 'null'], 'description' => 'false is 422: the site can\'t turn comments off'],
                ],
            ],
        ];
    }
}

/** @} */
