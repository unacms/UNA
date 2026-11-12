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

/*
 * Module database queries
 */
class BxCnvDb extends BxBaseModTextDb
{
    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    public function conversationToFolder($iConversationId, $iFolderId, $iProfileCollaborator, $iReadCommentsNum = -1)
    {
        $sQuery = $this->prepare("INSERT IGNORE INTO `" . $this->getPrefix() . "conv2folder` SET `conv_id` = ?, `folder_id` = ?, `collaborator` = ?, `read_comments` = ?", $iConversationId, $iFolderId, $iProfileCollaborator, $iReadCommentsNum);
        return $this->query($sQuery);
    }

    public function getFolder($iFolderId)
    {
        $sQuery = $this->prepare("SELECT `id`, `author`, `name` FROM `" . $this->getPrefix() . "folders` WHERE `id` = ?", $iFolderId);
        return $this->getRow($sQuery);
    }

    public function getConversationFolder($iConversationId, $iProfileCollaborator)
    {
        $sQuery = $this->prepare("SELECT `folder_id` FROM `" . $this->getPrefix() . "conv2folder` WHERE `conv_id` = ? AND `collaborator` = ?", $iConversationId, $iProfileCollaborator);
        return $this->getOne($sQuery);
    }

    public function removeCollaborator($iConversationId, $iProfileId) 
    {
        $sQuery = $this->prepare("DELETE FROM `" . $this->getPrefix() . "conv2folder` WHERE `conv_id` = ? AND `collaborator` = ?", $iConversationId, $iProfileId);
        return $this->query($sQuery);
    }

    /**
     * Remove collaborator from all conversations (when profile is deleted)
     * @param $iProfileId profile id to remove
     * @return number of deletions
     */
    public function removeCollaboratorFromAllConversations($iProfileId)
    {
        $aConvos = $this->getColumn("SELECT `conv_id` FROM `" . $this->getPrefix() . "conv2folder` WHERE `collaborator` = ?", array($iProfileId));
        if (!($iRet = $this->query("DELETE FROM `" . $this->getPrefix() . "conv2folder` WHERE `collaborator` = ?", array($iProfileId))))
            return 0;

        foreach ($aConvos as $iConversationId) {
            if (!$this->getCollaborators($iConversationId))
                $this->deleteConvo($iConversationId);
        }
        return $iRet;
    }
    
    public function getCollaborators($iConversationId)
    {
        $sQuery = $this->prepare("SELECT `collaborator`, `read_comments` FROM `" . $this->getPrefix() . "conv2folder` WHERE `conv_id` = ?", $iConversationId);
        return $this->getPairs($sQuery, 'collaborator', 'read_comments');
    }

    public function updateReadComments($iProfileId, $iConversationId, $iReadComments)
    {
        $sQuery = $this->prepare("UPDATE `" . $this->getPrefix() . "conv2folder` SET `read_comments` = ? WHERE `conv_id` = ? AND `collaborator` = ?", $iReadComments, $iConversationId, $iProfileId);
        return $this->query($sQuery);
    }

    public function updateLastCommentTimeProfile($iConversationId, $iProfileId, $iCommentId, $iTimestamp)
    {
        $sQuery = $this->prepare("UPDATE `" . $this->getPrefix() . "conversations` SET `last_reply_profile_id` = ?, `last_reply_timestamp` = ?, `last_reply_comment_id` = ? WHERE `id` = ?", $iProfileId, $iTimestamp, $iCommentId, $iConversationId);
        return $this->query($sQuery);
    }

    public function moveConvo($iConversationId, $iProfileId, $iFolderId)
    {
        $sQuery = $this->prepare("SELECT `folder_id` FROM `" . $this->getPrefix() . "conv2folder` WHERE `conv_id` = ? AND `collaborator` = ?", $iConversationId, $iProfileId);
        $iFolderIdOld = $this->getOne($sQuery);
        if (BX_CNV_FOLDER_TRASH == $iFolderIdOld) // if convo is already in trash folder - delete it
            return '' === $this->deleteConvo($iConversationId, $iProfileId) ? true : false;

        $sQuery = $this->prepare("UPDATE `" . $this->getPrefix() . "conv2folder` SET `folder_id` = ? WHERE `conv_id` = ? AND `collaborator` = ?", $iFolderId, $iConversationId, $iProfileId);
        return $this->query($sQuery);
    }

    public function deleteConvo($iConversationId, $iProfileId = 0)
    {
        $aContentInfo = $this->getContentInfoById ($iConversationId);
        if (!$aContentInfo)
            return '';

        // delete convo
        $aBindings = array(
        	'conv_id' => $iConversationId
        );

        $sWhere = '';
        if ($iProfileId) {
        	$aBindings['collaborator'] = $iProfileId;

            $sWhere = " AND `collaborator` = :collaborator";
        }

        $sQuery = "DELETE FROM `" . $this->getPrefix() . "conv2folder` WHERE `conv_id` = :conv_id" . $sWhere;
        $this->query($sQuery, $aBindings);

        // delete whole conversation if there is no refencences to the conversation in conv2folder table
        if ($this->getCollaborators($iConversationId))
            return '';
            
        $sQuery = $this->prepare("SELECT `id` FROM `" . $this->getPrefix() . "conv2folder` WHERE `conv_id` = ?", $iConversationId);
        if (!$this->getOne($sQuery)) {
            $CNF = &$this->_oConfig->CNF;
            $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD']);
            return $oForm->delete((int)$iConversationId, $aContentInfo) ? '' : _t('_sys_txt_error_occured');
        }

        return '';
    }

    public function getUnreadMessagesNum ($iProfileId, $iFolderId = BX_CNV_FOLDER_INBOX)
    {
        $sQuery = $this->prepare("SELECT SUM(`c`.`comments` - `f`.`read_comments`)
            FROM `" . $this->getPrefix() . "conv2folder` as `f`
            INNER JOIN `" . $this->getPrefix() . "conversations` AS `c` ON (`c`.`id` = `f`.`conv_id`)
            WHERE `f`.`collaborator` = ? AND `f`.`folder_id` = ?", $iProfileId, $iFolderId);
        return $this->getOne($sQuery);
    }

    public function getMessagesPreviews ($iProfileId, $iStart = 0, $iLimit = 4, $iFolderId = BX_CNV_FOLDER_INBOX)
    {
        $sQuery = $this->prepare("SELECT `c`.`id`, `c`.`text`, `c`.`author`, `cmts`.`cmt_text`, `c`.`last_reply_profile_id`, `c`.`comments`, (`c`.`comments` - `f`.`read_comments`) AS `unread_messages`, `last_reply_timestamp`
            FROM `" . $this->getPrefix() . "conv2folder` as `f`
            INNER JOIN `" . $this->getPrefix() . "conversations` AS `c` ON (`c`.`id` = `f`.`conv_id`)
            LEFT JOIN `" . $this->getPrefix() . "cmts` AS `cmts` ON (`cmts`.`cmt_id` = `c`.`last_reply_comment_id`)
            WHERE `f`.`collaborator` = ? AND `f`.`folder_id` = ?
            ORDER BY `c`.`last_reply_timestamp` DESC
            LIMIT ?, ?", $iProfileId, $iFolderId, $iStart, $iLimit);
        return $this->getAll($sQuery);
    }

    /**
     * The newest reply of each of these conversations that the viewer may see, for a page of
     * them at once, keyed by the conversation id; a conversation without such a reply has no
     * row. A reply counts as BxDolCmtsQuery::getComments lists it: approved (`status_admin`
     * active) unless the viewer wrote it or moderates ($bModerator), its author's profile
     * active unless it has replies, and passing the content filter ($oContentFilter, false when
     * the site filters no comments). With each reply, how many files it has (`files`) and how
     * many of them are not images (`other_files`). The comments object says where its rows and
     * files are: $aTables has `cmts` (getCommentsTableName), `ids` (BxDolCmts::$sTableIds),
     * `files2entries` (getTableNameImages2Entries) and `files` (getTableNameImages).
     */
    public function getLastReplies($aConversationIds, $aTables, $iSystemId, $iViewerId, $bModerator, $oContentFilter = false)
    {
        $aConversationIds = array_values(array_unique(array_filter(array_map('intval', (array)$aConversationIds))));
        if (!$aConversationIds)
            return [];

        $aBindings = ['system_id' => (int)$iSystemId, 'ids_system_id' => (int)$iSystemId];
        $sWhere = '';
        if (!$bModerator) {
            $aBindings['viewer_id'] = (int)$iViewerId;
            $aBindings['status_active'] = BX_CMT_STATUS_ACTIVE;
            $sWhere .= " AND (`m`.`cmt_author_id` = :viewer_id OR `ti`.`status_admin` = :status_active)";
        }
        if ($oContentFilter)
            $sWhere .= $oContentFilter->getSQLParts('m', 'cmt_cf', (int)$iViewerId);

        $sTableCmts = $aTables['cmts'];
        $sQuery = "SELECT `c`.`cmt_object_id` AS `conv_id`, `c`.`cmt_id`, `c`.`cmt_author_id`, `c`.`cmt_text`, `c`.`cmt_time`,
                COUNT(`f2e`.`image_id`) AS `files`,
                SUM(`f2e`.`image_id` IS NOT NULL AND IFNULL(`f`.`mime_type`, '') NOT LIKE 'image/%') AS `other_files`
            FROM (
                SELECT `m`.`cmt_object_id`, MAX(`m`.`cmt_id`) AS `cmt_id`
                FROM `" . $sTableCmts . "` AS `m`
                LEFT JOIN `" . $aTables['ids'] . "` AS `ti` ON (`ti`.`cmt_id` = `m`.`cmt_id` AND `ti`.`system_id` = :ids_system_id)
                LEFT JOIN `sys_profiles` AS `p` ON (`p`.`id` = `m`.`cmt_author_id`)
                WHERE `m`.`cmt_object_id` IN(" . $this->implode_escape($aConversationIds) . ")
                    AND (`p`.`status` IS NULL OR `p`.`status` = 'active' OR `m`.`cmt_replies` != 0)" . $sWhere . "
                GROUP BY `m`.`cmt_object_id`
            ) AS `l`
            INNER JOIN `" . $sTableCmts . "` AS `c` ON (`c`.`cmt_id` = `l`.`cmt_id`)
            LEFT JOIN `" . $aTables['files2entries'] . "` AS `f2e` ON (`f2e`.`system_id` = :system_id AND `f2e`.`cmt_id` = `c`.`cmt_id`)
            LEFT JOIN `" . $aTables['files'] . "` AS `f` ON (`f`.`id` = `f2e`.`image_id`)
            GROUP BY `c`.`cmt_id`";
        return $this->getAllWithKey($sQuery, 'conv_id', $aBindings);
    }
}

/** @} */
