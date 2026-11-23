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

/**
 * Files module
 */
class BxFilesModule extends BxBaseModFilesModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function serviceMyEntriesActions ($iProfileId = 0)
    {
        if (!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        if (!$this->serviceIsAllowedAddContentToContext($iProfileId))
            return false;

        $oMenu = BxTemplMenu::getObjectInstance($this->_oConfig->CNF['OBJECT_MENU_ACTIONS_MY_ENTRIES']);
        return $oMenu ? $oMenu->getCode() : false;
    }

    public function checkAllowedSetThumb ($iContentId = 0)
    {
        return _t('_sys_txt_access_denied');
    }

    public function actionDownload($sToken = '', $iContentId = 0, $sBulk = '')
    {
        $CNF = $this->_oConfig->CNF;

        $aFilesToDownload = [$iContentId];
        if (!empty($sBulk)) {
            $aFilesToDownload = json_decode($sBulk);
        }

        if (!is_array($aFilesToDownload)) {
            $this->_oTemplate->displayPageNotFound();
            return;
        }

        $iContentId = reset($aFilesToDownload);

        $aData = $this->_oDb->getContentInfoById((int)$iContentId);
        if (!$aData) {
            $this->_oTemplate->displayPageNotFound();
            return;
        }

        if (CHECK_ACTION_RESULT_ALLOWED !== $this->checkAllowedView($aData)) {
            $this->_oTemplate->displayAccessDenied();
            return;
        }

        if ($aData['type'] == 'folder' || $aFilesToDownload && count($aFilesToDownload) > 1) {
            bx_import('BulkDownloader', $this->_aModule);
            $oDownloader = new BxFilesBulkDownloader($this);
            $aResult = $oDownloader->createDownloadingJob($aFilesToDownload, $aData[$CNF['FIELD_TITLE']]);

            switch ($aResult['status']) {
                case BX_FILES_DOWNLOADER_STATUS_TOO_LARGE:
                    $this->_oTemplate->displayMsg(_t('_bx_files_txt_max_size_reached', _t_format_size(intval(getParam('bx_files_max_bulk_download_size')) * 1024 * 1024)));
                    break;
                case BX_FILES_DOWNLOADER_STATUS_DOWNLOADING:
                    $this->_oTemplate->addJsTranslation('_bx_files_txt_status_downloading_ready_msg');
                    $this->_oTemplate->displayMsg(['title' => _t('_bx_files_txt_status_downloading'), 'content' => $this->_oTemplate->parseHtmlByName('bulk_downloader_process.html', [
                        'timeout' => BX_FILES_DOWNLOADER_TIMEOUT_REQUESTS,
                        'action_url' => BX_DOL_URL_ROOT.$this->_oConfig->getBaseUri().'process_download/'.$aResult['job'],
                    ])]);
                    break;
                case BX_FILES_DOWNLOADER_STATUS_READY:
                    bx_smart_readfile($aResult['file'], $aResult['filename'], 'application/zip');
                    break;
                case BX_FILES_DOWNLOADER_STATUS_EMPTY:
                default:
                    $this->_oTemplate->displayPageNotFound();
                    break;
            }
            exit;
        }

        $aFile = $this->getContentFile($aData);
        if (!$aFile) {
            $this->_oTemplate->displayPageNotFound();
            return;
        }

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if (!$oStorage) {
            $this->_oTemplate->displayErrorOccured();
            return;
        }

        if (!$oStorage->download($aFile['remote_id'], $sToken, true)) {
            $this->_oTemplate->displayErrorOccured();
            return;
        }
        
        exit;   
    }

    public function actionProcessDownload($iDownloadingJobId) {
        if (!$iDownloadingJobId) die;

        $aJob = $this->_oDb->getDownloadingJob($iDownloadingJobId);
        if (!$aJob || $aJob['owner'] != bx_get_logged_profile_id()) die;

        if ($aJob['result']) {
            bx_smart_readfile($aJob['result'], $aJob['name'], 'application/zip');
            exit;
        }

        bx_import('BulkDownloader', $this->_aModule);
        $oDownloader = new BxFilesBulkDownloader($this);

        $mRes = $oDownloader->processDownloading($aJob['files']);
        if ($mRes === BX_FILES_DOWNLOADER_STATUS_DOWNLOADING) {
            $this->_oDb->updateDownloadingJob($iDownloadingJobId, $aJob['files'], '');
            echoJson([
                'status' => 'downloading',
            ]);
        } else {
            $this->_oDb->updateDownloadingJob($iDownloadingJobId, $aJob['files'], $mRes);
            echoJson([
                'status' => 'ready',
            ]);
        }
    }
    
    public function getContentFile($aData) 
    {
        $CNF = $this->_oConfig->CNF;

        if (!isset($aData[$CNF['FIELD_AUTHOR']]) || !isset($aData[$CNF['FIELD_ID']]))
            return false;

        if (isset($aData['type']) && $aData['type'] == 'folder') {
            return [
                'id' => $aData[$CNF['FIELD_ID']],
                'profile_id' => $aData[$CNF['FIELD_AUTHOR']],
                'remote_id' => 0,
                'path' => '',
                'file_name' => $aData[$CNF['FIELD_TITLE']],
                'mime_type' => '',
                'ext' => '',
                'size' => 0,
                'added' => $aData[$CNF['FIELD_ADDED']],
                'modified' => 0,
                'private' => false,
                'is_image' => false,
            ];
        }

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if (!$oStorage)
            return false;

        if (isset($aData[$CNF['FIELD_FILE_ID']]) && $aData[$CNF['FIELD_FILE_ID']])
            return $this->_addFileFields($oStorage->getFile($aData[$CNF['FIELD_FILE_ID']]));
        
        $aGhostFiles = $oStorage->getGhosts ($aData[$CNF['FIELD_AUTHOR']], $aData[$CNF['FIELD_ID']]);
        if (!$aGhostFiles)
            return false;

        return $this->_addFileFields(array_pop($aGhostFiles));
    }
    
    public function getDownloadLink($mixedData) 
    {
        $CNF = &$this->_oConfig->CNF;

        if(!is_array($mixedData))
            $mixedData = $this->_oDb->getContentInfoById((int)$mixedData);
        if(empty($mixedData) || !is_array($mixedData))
            return false;
        
        $aFile = $this->getContentFile($mixedData);
        if($aFile === false)
            return false;

        $sFileExt = !empty($aFile['ext']) ? $aFile['ext'] : '';

        $aMarkers = array_merge([
            'content_id' => $mixedData[$CNF['FIELD_ID']]
        ], ($aFile['private'] && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])) ? [
            'file_download_token' => $oStorage->genToken($aFile['id']),
            'file_ext' => $sFileExt
        ] : [
            'file_download_token' => '0',
            'file_ext' => $sFileExt,
        ]));

        return bx_replace_markers(BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($CNF['URL_DOWNLOAD']), $aMarkers);
    }

    protected function _addFileFields($aFile) 
    {
        if (is_array($aFile))
            $aFile['is_image'] = in_array($aFile['ext'], array('jpg', 'jpeg', 'png', 'gif', /* when ImageMagick is used - 'tif', 'tiff', 'bmp', 'ico', 'psd' */));
        return $aFile;
    }

    public function serviceEntityFilePreview($iContentId = 0)
    {
        return $this->_serviceTemplateFunc ('entryFilePreview', $iContentId);
    }

    public function serviceProcessFilesData($iNumberOfFilesToProcessAtOnce = 3)
    {
        $CNF = $this->_oConfig->CNF;
        
        if (!defined('BX_SYSTEM_JAVA') || !constant('BX_SYSTEM_JAVA'))
            return;
        
        $a = $this->_oDb->getNotProcessedFiles($iNumberOfFilesToProcessAtOnce);
        if (!$a)
            return;

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if (!$oStorage)
            return false;
        
        foreach ($a as $aContentInfo) {
            $aFile = $this->getContentFile($aContentInfo);
            if (!$aFile) {
                $this->_oDb->updateFileData ($aContentInfo[$CNF['FIELD_ID']], '');
                continue;
            }

            $sFileUrl = $oStorage->getFileUrlById($aFile['id']);
            $sFilePath = BX_DIRECTORY_PATH_TMP . $aFile['remote_id'] . '.' . $aFile['ext'];
            @file_put_contents($sFilePath, file_get_contents($sFileUrl));
            if (!file_exists($sFilePath)) {
                $this->_oDb->updateFileData ($aContentInfo[$CNF['FIELD_ID']], '');
                continue;
            }
            
            $sCommand = '"' . constant('BX_SYSTEM_JAVA') . '" -Djava.awt.headless=true -jar "' . $this->_oConfig->getHomePath() . 'data/tika-app.jar" --encoding=UTF-8 --text "' . $sFilePath . '"';
            $sData = shell_exec($sCommand);
            @unlink($sFilePath);

            $this->_oDb->updateFileData ($aContentInfo[$CNF['FIELD_ID']], $sData);
        }
    }

    /**
     * The Studio Dashboard's Queues block: archive download jobs. Clearing removes the jobs older than an hour (finished or
     * abandoned), the module's own cron prunes them after a day.
     */
    public function serviceGetDashboardQueues()
    {
        return array(
            'downloads' => array(
                'name' => '_bx_files_queue_downloads',
                'icon' => 'download',
                'all' => "SELECT COUNT(*) FROM `bx_files_downloading_jobs`",
                'action' => "DELETE FROM `bx_files_downloading_jobs` WHERE UNIX_TIMESTAMP() - `started` > 3600"
            )
        );
    }

    public function servicePruneDownloadingJobs()
    {
        $aFiles = $this->_oDb->deleteOldDownloadingJobs();
        if ($aFiles) foreach ($aFiles as $sFile) @unlink($sFile);
    }

    protected function _getFilesForTimelinePost($aEvent, $aContentInfo, $sUrl, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aFile = $this->getContentFile($aContentInfo);
        if(!$aFile || $aFile['is_image'])
            return [];

        $sIconSrc = '';
        if(($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])) !== false)
            $sIconSrc = $this->_oTemplate->getIconUrl($oStorage->getIconNameByFileName($aFile['file_name']));

        return [[
            'id' => $aFile['id'],
            'src' => $sIconSrc,
            'src_medium' => $sIconSrc,
            'src_orig' => '',
            'url' => $sUrl,
            'title' => $aFile['file_name']
        ]];
    }

    protected function _getImagesForTimelinePost($aEvent, $aContentInfo, $sUrl, $aBrowseParams = array())
    {
        $aFile = $this->getContentFile($aContentInfo);
        if (!$aFile)
            return [];

        if (!$aFile['is_image'])
            return [];

        $sPhotoThumb = '';
        if ($oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($this->_oConfig->CNF['OBJECT_IMAGES_TRANSCODER_GALLERY']))
            $sPhotoThumb = $oImagesTranscoder->getFileUrl($aFile['id']);

        return [[
            'id' => $aFile['id'], 
            'url' => $sUrl, 
            'src' => $sPhotoThumb
        ]];
    }

    public function actionBookmark($iContentId) {
        if (!$this->isLogged() || !$this->isActionRequestValid()) return;

        $iProfileId = bx_get_logged_profile_id();
        foreach ($this->getActionContentIds($iContentId) as $iContentId) {
            $aData = $this->_oDb->getContentInfoById($iContentId);
            if (!$aData || $this->checkAllowedView($aData) !== CHECK_ACTION_RESULT_ALLOWED) continue;

            $this->_oDb->bookmarkFile($iContentId, $iProfileId);
        }
    }

    public function actionEntryPreview($iContentId) {
        $aData = $this->_oDb->getContentInfoById((int)$iContentId);

        $sJsCss = '';

        $sPreviewCode = $this->_serviceTemplateFunc ('entryFilePreview', $iContentId);

        // various init scripts could be there, which fail to work properly
        // because of a fact that it is inside a popup which is at the moment is hidden
        // so we need a way to postpone that initialization
        $aScripts = [];
        $sPreviewCode = preg_replace_callback('/<script>(.*)<\/script>/s', function($aMatch) use (&$aScripts) {
            $aScripts[] = ['code' => $aMatch[1]];
            return '';
        }, $sPreviewCode);

        // if there is a script then most likely it is a text + codemirror initialization, so include it here.
        if ($aScripts) {
            $sJsCss .= $this->_oTemplate->addJs('codemirror/codemirror-ext.min.js', true);
            $sJsCss .= $this->_oTemplate->addCss(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'codemirror/|codemirror.css', true);
        }

        $sJsCss .= $this->_oTemplate->addCss('file_handler.css', true);

        $sPopupCode = $this->_oTemplate->parseHtmlByName('entry-popup.html', [
            'content' => $sPreviewCode,
            'bx_repeat:init_scripts' => $aScripts,
        ]);

        echoJson([
            'popup' => [
                'html' => PopupBox('bx-files-popup', bx_process_output($aData['title']), $sJsCss.$sPopupCode),
                'options' => [
                    'onShow' => 'bx_files_popup_init()',
                ],
            ],
        ]);
    }

    public function actionEntryInfo($iContentId) {
        $aData = $this->_oDb->getContentInfoById((int)$iContentId);

        if (CHECK_ACTION_RESULT_ALLOWED !== $this->checkAllowedView($aData)) {
            echoJson([
                'popup' => [
                    'html' => PopupBox('bx-files-popup', _t('_Access denied'), _t('_Access denied')),
                ],
            ]);
            return;
        }

        echoJson([
            'popup' => [
                'html' => PopupBox('bx-files-popup', bx_process_output($aData['title']), $this->_oTemplate->entryInfoPopup($aData)),
            ],
        ]);
    }

    public function actionEntryEditTitle($iContentId) {
        $iContentId = intval($iContentId);
        $aData = $this->_oDb->getContentInfoById($iContentId);

        $CNF = &$this->_oConfig->CNF;

        if (!$aData) {
            echoJson(['message' => _t('_bx_files_txt_error')]);
            exit;
        }

        if ($this->checkAllowedEdit($aData, false) !== CHECK_ACTION_RESULT_ALLOWED) {
            echoJson(['message' => _t('_bx_files_txt_permission_denied')]);
            exit;
        }

        setlocale(LC_ALL,'C.UTF-8'); //otherwise pathinfo returns empty string on a non-latin characters filenames

        if (isset($_POST['title'])) {
            if (!$this->isActionRequestValid()) exit;

            if ($sNewTitle = bx_get('title')) {
                $sExt = pathinfo($aData[$CNF['FIELD_TITLE']], PATHINFO_EXTENSION);
                if ($sExt) $sExt = '.'.$sExt;

                $this->_oDb->updateEntryTitle($iContentId, $sNewTitle.$sExt);
                $aData = $this->_oDb->getContentInfoById($iContentId);
                echo bx_process_output($aData[$CNF['FIELD_TITLE']]);
            }
            exit;
        }


        $sActionUrl = BX_DOL_URL_ROOT.$this->_oConfig->getBaseUri();
        $sCsrfToken = bx_js_string((string)BxDolForm::getCsrfToken());
        echoJson([
            'eval' => "bx_prompt('"._t('_bx_files_form_entry_input_title')."', '".bx_js_string(pathinfo($aData[$CNF['FIELD_TITLE']], PATHINFO_FILENAME))."', function(val) {                
                $.post('{$sActionUrl}entry_edit_title/{$iContentId}', {title: val.getValue(), csrf_token: '{$sCsrfToken}'}, function(sTitle) {
                    if (sTitle)
                        $('.bx-file-entry[file_id=".$aData[$CNF['FIELD_ID']]."] .bx-files-filename a').html(sTitle);
                });                
            })",
        ]);
    }

    public function actionEntryDelete($iContentId) {
        if (!$this->isActionRequestValid()) {
            echoJson(['message' => _t('_sys_txt_form_submission_error_csrf_expired')]);
            exit;
        }

        $bBulk = isset($_POST['bulk']);
        foreach ($this->getActionContentIds($iContentId) as $iContentId) {
            $aData = $this->_oDb->getContentInfoById($iContentId);
            if (!$aData) {
                echoJson(['message' => _t('_bx_files_txt_error')]);
                exit;
            }

            if ($this->checkAllowedDelete($aData, false) !== CHECK_ACTION_RESULT_ALLOWED) {
                continue;
            }

            $this->serviceDeleteEntity($iContentId);
        }

        if (!$bBulk) {
            $iContentId = (int)$iContentId;
            echoJson([
                'eval' => "
                    $('.bx-file-entry[file_id={$iContentId}]').fadeOut();
                    $(window).trigger('files_browser.update');
                ",
            ]);
        } else {
            echoJson([]);
        }
    }

    public function actionClearGhosts() {
        if (!isLogged() || !$this->isActionRequestValid()) die;

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->CNF['OBJECT_STORAGE']);
        if ($oStorage) {
            $aFiles = $oStorage->getGhosts(bx_get_logged_profile_id(), 0);

            if ($aFiles) foreach ($aFiles as $aFile) {
                $oStorage->deleteFile($aFile['id']);
            }
        }
    }

    public function actionUploadCompleted() {
        $iContext = intval(bx_get('context'));
        $iFolder = intval(bx_get('folder'));

        if (!isLogged() || !$this->isActionRequestValid()) {
            echoJson(['message' => _t('_Access denied')]);
            exit;
        }

        if ($this->checkAllowedAdd() != CHECK_ACTION_RESULT_ALLOWED || $iContext && !$this->serviceIsAllowedAddContentToContext($iContext)) {
            echoJson(['message' => _t('_Access denied')]);
            exit;
        }

        // new files may go only into a folder of the context they are uploaded to
        if (!$this->isAllowedFolderInContext($iFolder, $iContext)) {
            echoJson(['message' => _t('_Access denied')]);
            exit;
        }

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->CNF['OBJECT_STORAGE']);
        if ($oStorage) {
            $iAuthorProfile = bx_get_logged_profile_id();
            $aFiles = $oStorage->getGhosts($iAuthorProfile, 0);

            if ($aFiles) {
                $aFilesIDs = [];
                foreach($aFiles as $aFile) {
                    $aFilesIDs[] = $aFile['id'];
                    bx_set('title-'.$aFile['id'], $aFile['file_name'], 'post');
                }
                bx_set('attachments', $aFilesIDs, 'post');
                bx_set('profile_id', $iAuthorProfile, 'post');
                bx_set('allow_view_to', !$iContext ? BX_DOL_PG_ALL : -$iContext, 'post');
                bx_set('cf', 1, 'post');

                $oForm = BxDolForm::getObjectInstance($this->_oConfig->CNF['OBJECT_FORM_ENTRY_UPLOAD'], $this->_oConfig->CNF['OBJECT_FORM_ENTRY_DISPLAY_UPLOAD']);
                $aFiles = $oForm->insert();

                if ($iFolder != 0 && !empty($aFiles))
                    $this->_oDb->moveFilesToFolder($aFiles, $iFolder);

                if (!empty($aFiles))
                foreach ($aFiles as $iContentId) {
                    $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
                    $this->alertAfterAdd($aContentInfo);
                }
            }
        }

        echoJson(['success' => true]);
    }

    public function actionCreateFolder() {
        $iContext = intval(bx_get('context'));
        $iFolder = intval(bx_get('current_folder'));
        $sName = trim(bx_get('name'));

        if (!isLogged() || !$this->isActionRequestValid()) {
            echoJson(['message' => _t('_Access denied')]);
            exit;
        }

        if ($this->checkAllowedAdd() != CHECK_ACTION_RESULT_ALLOWED || $iContext && !$this->serviceIsAllowedAddContentToContext($iContext) || !$this->isAllowedFolderInContext($iFolder, $iContext)) {
            echoJson(['message' => _t('_Access denied')]);
            exit;
        }

        if (!empty($sName)) {
            $iAuthor = bx_get_logged_profile_id();
            // in case it is posted to context make the context profile as an author of an entry
            // to leave folder in case creator is removed
            // and to delete folder when context profile is being deleted
            $this->_oDb->createFolder($iFolder, $iContext ? $iContext : $iAuthor, !$iContext || $iAuthor == $iContext ? BX_DOL_PG_ALL : -$iContext, $sName);
        }

        echoJson([]);
        exit;
    }

    public function actionMoveFiles() {
        if (!$this->isActionRequestValid()) {
            echoJson(['message' => _t('_sys_txt_form_submission_error_csrf_expired')]);
            exit;
        }

        $aFilesToMove = $this->getActionContentIds(intval(bx_get('file')));
        if (!$aFilesToMove) {
            echoJson(['message' => _t('_bx_files_txt_error')]);
            exit;
        }

        $CNF = &$this->_oConfig->CNF;

        // every file must exist, be one the viewer may move, and sit in the same context as the first one
        $iContext = false;
        foreach ($aFilesToMove as $iFile) {
            $aData = $this->_oDb->getContentInfoById($iFile);
            if (!$aData) {
                echoJson(['message' => _t('_bx_files_txt_error')]);
                exit;
            }

            $iFileContext = $this->getFileContext($aData);
            if ($iContext === false)
                $iContext = $iFileContext;

            if ($iFileContext != $iContext || !$this->isAllowedMove($aData)) {
                echoJson(['message' => _t('_Access denied')]);
                exit;
            }
        }

        if (isset($_POST['move_to'])) {
            $iMoveTo = intval(bx_get('move_to'));
            if ($iMoveTo) {
                $aDataMoveTo = $this->_oDb->getContentInfoById($iMoveTo);
                if (!$aDataMoveTo || $aDataMoveTo['type'] != 'folder') {
                    echoJson(['message' => _t('_bx_files_txt_error')]);
                    exit;
                }

                if ($this->getFileContext($aDataMoveTo) != $iContext || !$this->isAllowedMove($aDataMoveTo)) {
                    echoJson(['message' => _t('_Access denied')]);
                    exit;
                }

                // a folder can't go into itself or into one of its subfolders
                $aSeen = [];
                for ($iParent = $iMoveTo; $iParent > 0 && !isset($aSeen[$iParent]); $iParent = (int)$this->_oDb->getParentFolderId($iParent)) {
                    if (in_array($iParent, $aFilesToMove)) {
                        echoJson(['message' => _t('_bx_files_txt_error')]);
                        exit;
                    }
                    $aSeen[$iParent] = true;
                }
            }

            $this->_oDb->moveFilesToFolder($aFilesToMove, $iMoveTo);

            echoJson([
                'eval' => "                        
                    $(window).trigger('files_browser.update');
                ",
            ]);
            exit;
        }

        $aFolders = $this->_oDb->getFoldersInContext($iContext);
        if (!$aFolders) {
            echoJson(['message' => _t('_bx_files_txt_move_to_nowhere')]);
            exit;
        }

        echoJson([
            'popup' => [
                'html' => PopupBox('bx-files-popup', _t('_bx_files_txt_move_to'), $this->_oTemplate->getJsTree($aFilesToMove, $aFolders)),
                'options' => [],
            ],
        ]);
    }

    /**
     * Ids of the files an action works on: the one in the URL, or the posted bulk list.
     * Each id is an integer above zero, and each appears once.
     */
    public function getActionContentIds($iContentId = 0, $mixedBulk = null)
    {
        $iContentId = (int)$iContentId;
        if ($iContentId > 0)
            return [$iContentId];

        if ($mixedBulk === null)
            $mixedBulk = isset($_POST['bulk']) ? $_POST['bulk'] : [];

        if (!is_array($mixedBulk))
            return [];

        $aResult = [];
        foreach ($mixedBulk as $mixedId) {
            if (!is_scalar($mixedId)) continue;
            $iId = (int)$mixedId;
            if ($iId > 0) $aResult[$iId] = $iId;
        }

        return array_values($aResult);
    }

    /**
     * The profile a file belongs to: its context (group, space...) or its author.
     */
    public function getFileContext($aData)
    {
        $CNF = &$this->_oConfig->CNF;
        return (int)$aData[$CNF['FIELD_ALLOW_VIEW_TO']] < 0 ? -(int)$aData[$CNF['FIELD_ALLOW_VIEW_TO']] : (int)$aData[$CNF['FIELD_AUTHOR']];
    }

    /**
     * Whether the viewer may move this file or folder, or move files into it:
     * the author or a moderator, or anyone who may add files to the context it is in.
     */
    public function isAllowedMove($aData)
    {
        if (isAdmin() || $this->checkAllowedEdit($aData) === CHECK_ACTION_RESULT_ALLOWED)
            return true;

        $CNF = &$this->_oConfig->CNF;
        if ((int)$aData[$CNF['FIELD_ALLOW_VIEW_TO']] >= 0)
            return false;

        return $this->checkAllowedAdd() === CHECK_ACTION_RESULT_ALLOWED && $this->serviceIsAllowedAddContentToContext($this->getFileContext($aData));
    }

    /**
     * Whether the viewer may put files into this folder of a context (0 is the context's root).
     * Without a context, files go into the viewer's own folders.
     */
    public function isAllowedFolderInContext($iFolder, $iContext)
    {
        if ((int)$iFolder == 0)
            return true;

        $aFolder = $this->_oDb->getContentInfoById((int)$iFolder);
        if (!$aFolder || $aFolder['type'] != 'folder')
            return false;

        if ($this->getFileContext($aFolder) != ((int)$iContext ? (int)$iContext : (int)bx_get_logged_profile_id()))
            return false;

        return $this->isAllowedMove($aFolder);
    }

    /**
     * File actions that change something take a POST with a valid CSRF token.
     */
    protected function isActionRequestValid()
    {
        return isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'POST' && BxDolForm::isCsrfTokenValid((string)bx_get('csrf_token', 'post'), false);
    }

    public function serviceDeleteEntitiesByAuthor ($iProfileId) {
        $this->_oDb->deleteProfileBookmarks($iProfileId);
        return parent::serviceDeleteEntitiesByAuthor ($iProfileId);
    }

    public function serviceDeleteEntity ($iContentId, $sFuncDelete = 'deleteData') {
        $aData = $this->_oDb->getContentInfoById($iContentId);
        if ($aData['type'] == 'folder') {
            $aNestedFiles = $this->_oDb->getFolderFiles($aData[$this->_oConfig->CNF['FIELD_ID']]);
            if ($aNestedFiles)
                foreach ($aNestedFiles as $iFile) {
                    $this->serviceDeleteEntity($iFile);
                }
        }
        parent::serviceDeleteEntity($iContentId, $sFuncDelete);
    }

    public function serviceBrowseContext ($iProfileId = 0, $aParams = array()) {
        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if (!$iProfileId)
            return;
        // do not show files in context block for persons profiles
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if ($oProfile && $oProfile->getModule() == 'bx_persons') return;

        return parent::serviceBrowseContext($iProfileId, $aParams);
    }

    public function serviceGetFile ($iContentId, $aParams = []) 
    {
        $aResult = parent::serviceGetFile ($iContentId, $aParams);
        if(!$aResult)
            return $aResult;

        $aResult['url_download'] = $this->getDownloadLink($iContentId);
        return $aResult;
    }
}

/** @} */
