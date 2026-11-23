<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Files Files
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxFilesDb extends BxBaseModFilesDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }
	
    public function updateFileId ($iContentId, $iFileId)
    {
		return $this->updateEntries(array('file_id' => $iFileId, 'data' => '', 'data_processed' => 0), array('id' => $iContentId));
    }
    
    public function updateFileData ($iContentId, $sData, $iDataProcessed = 1)
    {
		return $this->updateEntries(array('data' => $sData, 'data_processed' => $iDataProcessed), array('id' => $iContentId));
    }

    public function getNotProcessedFiles ($iLimit)
    {
        $sQuery = $this->prepare ("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` WHERE `data_processed` = 0 ORDER BY `added` ASC LIMIT ?", $iLimit);
        return $this->getAll($sQuery);
    }

    public function bookmarkFile($iContentId, $iProfileId) {
        if ($this->isFileBookmarked($iContentId, $iProfileId)) {
            $this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_BOOKMARKS'] . "` WHERE `object_id` = :id AND `profile_id` = :profile_id", [
                'id' => $iContentId,
                'profile_id' => $iProfileId
            ]);
        } else {
            $this->query("INSERT INTO `" . $this->_oConfig->CNF['TABLE_BOOKMARKS'] . "` (`object_id`, `profile_id`) VALUES (:id, :profile_id)", [
                'id' => $iContentId,
                'profile_id' => $iProfileId
            ]);
        }
    }

    public function deleteFileBookmarks($iContentId) {
        $this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_BOOKMARKS'] . "` WHERE `object_id` = :id", [
            'id' => $iContentId,
        ]);
    }

    public function deleteProfileBookmarks($iProfileId) {
        $this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_BOOKMARKS'] . "` WHERE `profile_id` = :profile_id", [
            'profile_id' => $iProfileId,
        ]);
    }

    public function isFileBookmarked($iContentId, $iProfileId) {
        return $this->getOne("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_BOOKMARKS'] . "` WHERE `object_id` = :id AND `profile_id` = :profile_id", [
            'id' => $iContentId,
            'profile_id' => $iProfileId
        ]);
    }

    public function updateEntryTitle($iContentId, $sNewTitle) {
        $this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` SET `" . $this->_oConfig->CNF['FIELD_TITLE'] . "` = :title WHERE `" . $this->_oConfig->CNF['FIELD_ID'] . "` = :id", [
            'id' => $iContentId,
            'title' => $sNewTitle,
        ]);

        $iFileId = $this->getOne("SELECT `file_id` FROM `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` WHERE `" . $this->_oConfig->CNF['FIELD_ID'] . "` = :id", [
            'id' => $iContentId,
        ]);

        if ($iFileId)
            $this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_FILES'] . "` SET `file_name` = :title WHERE `id` = :id", [
                'id' => $iFileId,
                'title' => $sNewTitle,
            ]);
    }

    public function createFolder($iParentFolder, $iAuthor, $iContext, $sTitle) {
        $CNF = &$this->_oConfig->CNF;

        $this->query("
            INSERT INTO `" . $CNF['TABLE_ENTRIES'] . "` 
            (`{$CNF['FIELD_AUTHOR']}`, `{$CNF['FIELD_ADDED']}`, `{$CNF['FIELD_CHANGED']}`, `{$CNF['FIELD_TITLE']}`, `data_processed`, `{$CNF['FIELD_ALLOW_VIEW_TO']}`, `type`, `parent_folder_id`)
            VALUES (:author, :when, :when, :title, 1, :context, 'folder', :parent_folder_id)", [
                'author' => $iAuthor,
                'when' => time(),
                'title' => $sTitle,
                'context' => $iContext,
                'parent_folder_id' => $iParentFolder,
        ]);
    }

    public function moveFilesToFolder($aFiles, $iFolder) {
        $CNF = &$this->_oConfig->CNF;
        $aFiles = array_map('intval', $aFiles);
        if (!$aFiles) return;
        $this->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `parent_folder_id` = :folder WHERE `" . $CNF['FIELD_ID'] . "` IN (" . $this->implode_escape($aFiles) . ")", [
            'folder' => (int)$iFolder,
        ]);
    }

    /**
     * Moves in one context take turns, so two moves can't each put a folder into the other.
     */
    public function lockFolderMoves($iContext, $iTimeout = 10) {
        return (int)$this->getOne("SELECT GET_LOCK(:name, :timeout)", [
            'name' => 'bx_files_move_' . (int)$iContext,
            'timeout' => (int)$iTimeout,
        ]) === 1;
    }

    public function unlockFolderMoves($iContext) {
        $this->getOne("SELECT RELEASE_LOCK(:name)", [
            'name' => 'bx_files_move_' . (int)$iContext,
        ]);
    }

    public function getParentFolderId($iFolder) {
        $CNF = &$this->_oConfig->CNF;
        return $this->getOne("SELECT `parent_folder_id` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_ID'] . "` = :folder", [
            'folder' => $iFolder,
        ]);
    }

    public function getFolderFiles($iFolder) {
        $CNF = &$this->_oConfig->CNF;
        return $this->getColumn("SELECT `{$CNF['FIELD_ID']}` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `parent_folder_id` = :folder", [
            'folder' => $iFolder,
        ]);
    }

    public function getFolderFilesEx($mFile, $sType = 'folder') {
        $CNF = &$this->_oConfig->CNF;

        $sQuery = "
            SELECT `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_ID']}`, `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_FILE_ID']}`, `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_AUTHOR']}`, `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_TITLE']}`, `{$CNF['TABLE_ENTRIES']}`.`type`, `{$CNF['TABLE_FILES']}`.`path`, `{$CNF['TABLE_FILES']}`.`ext`, `{$CNF['TABLE_FILES']}`.`size` 
            FROM `{$CNF['TABLE_ENTRIES']}` 
            LEFT JOIN `{$CNF['TABLE_FILES']}` ON `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_FILE_ID']}` = `{$CNF['TABLE_FILES']}`.`{$CNF['FIELD_ID']}`
        ";

        if ($sType == 'mixed') {
            if (!is_array($mFile) || empty($mFile)) return false;
            $aIDs = [];
            foreach ($mFile as $iFile) $aIDs[] = intval($iFile);

            return $this->getAll($sQuery. "WHERE `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_ID']}` IN (".implode(',', $aIDs).")");
        } else {
            return $this->getAll($sQuery. "
                WHERE `{$CNF['TABLE_ENTRIES']}`.`".($sType == 'folder' ? 'parent_folder_id' : $CNF['FIELD_ID'])."` = :file                
                ", [
                    'file' => $mFile,
                ]
            );
        }
    }

    public function getFolderNestingLevel($iFolder) {
        $iLevel = 1;

        while($iParentFolder = $this->getParentFolderId($iFolder)) {
            $iLevel++;
            $iFolder = $iParentFolder;
        }

        return $iLevel;
    }

    public function getFolderPath($iFolder) {
        $CNF = &$this->_oConfig->CNF;

        $aPath = [];

        $aFolder = $this->getContentInfoById($iFolder);
        if (!$aFolder) return $aPath;

        // stops at a folder it has seen already, so a loop in the parents can't hang the page
        $aSeen = [];
        do {
            $aSeen[(int)$aFolder[$CNF['FIELD_ID']]] = true;
            $aPath[] = [
                'folder' => $aFolder[$CNF['FIELD_ID']],
                'name' => $aFolder[$CNF['FIELD_TITLE']],
            ];

            if (!$aFolder['parent_folder_id'] || isset($aSeen[(int)$aFolder['parent_folder_id']])) break;
            $aFolder = $this->getContentInfoById($aFolder['parent_folder_id']);
        } while ($aFolder);

        return array_reverse($aPath);
    }

    public function getFoldersInContext($iContext) {
        $CNF = &$this->_oConfig->CNF;
        $sIdent = $iContext > 0 ? $CNF['FIELD_AUTHOR'] : $CNF['FIELD_ALLOW_VIEW_TO'];
        $aFolders = $this->getAll("SELECT `{$CNF['FIELD_ID']}`, `parent_folder_id`, `{$CNF['FIELD_TITLE']}` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `{$sIdent}` = :context AND `type` = 'folder'", [
            'context' => $iContext,
        ]);

        if (!$aFolders) return [];

        return [
            0 => [
                $CNF['FIELD_ID'] => 0,
                $CNF['FIELD_TITLE'] => _t('_bx_files_txt_folder_root'),
                'subfolders' => $this->getSubfoldersOf($aFolders, 0),
            ]
        ];
    }

    public function getSubfoldersOf(&$aFolders, $iParent) {
        $CNF = &$this->_oConfig->CNF;

        $aResult = [];
        foreach ($aFolders as $aFolder) {
            if ($aFolder['parent_folder_id'] == $iParent) {
                $aFolder['subfolders'] = $this->getSubfoldersOf($aFolders, $aFolder[$CNF['FIELD_ID']]);
                $aResult[] = $aFolder;
            }
        }

        return $aResult;
    }

    public function createDownloadingJob($aFiles, $sZipFileName, $iOwner) {
        $this->query("INSERT INTO `bx_files_downloading_jobs` (`name`, `owner`, `files`, `started`) VALUES (:name, :owner, :files, UNIX_TIMESTAMP())", [
            'files' => serialize($aFiles),
            'owner' => $iOwner,
            'name' => $sZipFileName
        ]);
        return $this->lastId();
    }

    public function getDownloadingJob($iJob) {
        $aJob = $this->getRow("SELECT * FROM `bx_files_downloading_jobs` WHERE `id` = :id", ['id' => $iJob]);
        if ($aJob && $aJob['files']) $aJob['files'] = unserialize($aJob['files']);
        return $aJob;
    }

    public function updateDownloadingJob($iJob, $aFiles, $sZipFilePath) {
        $this->query("UPDATE `bx_files_downloading_jobs` SET `result` = :result, `files` = :files WHERE `id` = :id", [
            'result' => $sZipFilePath,
            'files' => serialize($aFiles),
            'id' => $iJob
        ]);
    }

    public function deleteOldDownloadingJobs() {
        $aFiles = $this->getColumn("SELECT `result` FROM `bx_files_downloading_jobs` WHERE UNIX_TIMESTAMP() - `started` > 24*3600");

        if ($aFiles)
            $this->query("DELETE FROM `bx_files_downloading_jobs` WHERE UNIX_TIMESTAMP() - `started` > 24*3600");
        return $aFiles;
    }

    public function setStorageAllowedExtensions($sExtensions) {
        $CNF = &$this->_oConfig->CNF;

        $aExtensions = explode(',', $sExtensions);
        if ($aExtensions) foreach ($aExtensions as $iKey => $sExtension) {
            $aExtensions[$iKey] = trim($sExtension, ' .');
        }

        $sExtensionsSet = implode(',', $aExtensions);

        $this->query("UPDATE `sys_objects_storage` SET `ext_mode` = :ext_mode, `ext_allow` = :extensions WHERE `sys_objects_storage`.`object` = :storage_object", [
            'extensions' => $sExtensionsSet,
            'ext_mode' => empty($sExtensionsSet) ? 'deny-allow' : 'allow-deny',
            'storage_object' => $CNF['OBJECT_STORAGE'],
        ]);
    }
}

/** @} */
