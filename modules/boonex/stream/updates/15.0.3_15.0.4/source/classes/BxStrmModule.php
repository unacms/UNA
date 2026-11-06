<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stream Stream
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Stream module
 */
class BxStrmModule extends BxBaseModTextModule
{
    protected $_oEngine;

    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $CNF = &$this->_oConfig->CNF;
        $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, [
            $CNF['FIELD_ANONYMOUS'],
            $CNF['FIELD_ALLOW_COMMENTS']
        ]);
    }

    public function getStreamEngine ()
    {
        if ($this->_oEngine)
            return $this->_oEngine;

        $sEngine = getParam('bx_stream_engine');
        bx_import('Engine' . $sEngine, $this->_aModule);
        $sClass = 'BxStrmEngine' . $sEngine;
        $this->_oEngine = new $sClass;
        return $this->_oEngine;
    }

    public function actionNginxOnRecordDone()
    {
	    $CNF = &$this->_oConfig->CNF;

        $sKey = bx_get('name');
        $sSecret = bx_get('s');
        $sPath = bx_get('path');
	    $sBasePath = rtrim(getParam('bx_stream_server_nginx_recording_base_path'), '/');

        if (empty($sBasePath) || empty($sPath) || empty($sKey) || empty($sSecret) || 'NGINX' != getParam('bx_stream_engine')) {
	        header('HTTP/1.0 400 Bad Request');
	        return;
	    }

        if ($sSecret != base_convert(substr(md5(BX_DOL_SECRET . $sKey), -4), 16, 36)) {
            header('HTTP/1.0 401 Unauthorized');
            return;
        }

	    $aContentInfo = $this->_oDb->getEntriesBy(['type' => 'conditions', 'conditions' => ['key' => $sKey]]);
	    if (!$aContentInfo) {
	        header('HTTP/1.0 404 Not Found');
            return;
	    }

	    $aContentInfo = array_pop($aContentInfo);

        if (CHECK_ACTION_RESULT_ALLOWED !== $this->checkAllowedRecord(true, $aContentInfo[$CNF['FIELD_AUTHOR']])) {
            header('HTTP/1.0 403 Forbidden');
            return;
	    }

        $sBaseUrl = rtrim(getParam('bx_stream_recordings_url'), '/');
        $iBaseLen = get_mb_len($sBasePath);
        $sRest = get_mb_substr($sPath, $iBaseLen, get_mb_len($sPath) - $iBaseLen);
        $sBaseTail = $iBaseLen > 0 ? get_mb_substr($sBasePath, $iBaseLen - 1, 1) : '';
        $sRestHead = $sRest === '' ? '' : get_mb_substr($sRest, 0, 1);
        if ($sBaseUrl === '' || bx_mb_strpos($sPath, $sBasePath) !== 0 || ($sRest !== '' && $sRestHead !== '/' && $sBaseTail !== '/')) {
            header('HTTP/1.0 400 Bad Request');
            return;
        }
        $sUrl = $sBaseUrl . $sRest;
        $sBaseHost = parse_url($sBaseUrl, PHP_URL_HOST);
        $sUrlHost = parse_url($sUrl, PHP_URL_HOST);
        if (!preg_match('#^https?://#i', $sUrl) || !$sBaseHost || !$sUrlHost || strcasecmp($sBaseHost, $sUrlHost) !== 0) {
            header('HTTP/1.0 400 Bad Request');
            return;
        }
        if ($oStorage = BxDolStorage::getObjectInstance('bx_stream_recordings')) {
            $iFileId = $oStorage->storeFileFromUrl($sUrl, true, $aContentInfo[$CNF['FIELD_AUTHOR']], $aContentInfo['id'], true);
            if (!$iFileId)
                bx_log('bx_stream', "Store recording from URL(" . $sUrl . ") failed for content id({$aContentInfo['id']})", BX_LOG_ERR);
        }
    }

    public function actionNginxOnPublish()
    {
        $sKey = bx_get('name');
        $sSecret = bx_get('s');
        if (empty($sKey) || empty($sSecret) || !($aContentInfo = $this->_oDb->getEntriesBy(['type' => 'conditions', 'conditions' => ['key' => $sKey]]))) {
            header('HTTP/1.0 404 Not Found');
        }
        elseif ($sSecret != base_convert(substr(md5(BX_DOL_SECRET . $sKey), -4), 16, 36)) {
            header('HTTP/1.0 403 Forbidden');
        }
        else {
            header('HTTP/1.0 201 Created');
        }
        exit;
    }

    public function actionEmbed($iContentId, $sUnitTemplate = '', $sAddCode = '')
    {
        return $this->_serviceTemplateFunc ('embedStream', $iContentId);
    }

    public function actionEmbedStream($iContentId = 0)
    {
        header("Location:" . BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'embed/' . $iContentId . '/', true, 301);
        exit;
    }

    public function actionStreamViewers ($iContentId = 0)
    {
        header('Content-Type:text/javascript; charset=utf-8');
     
        $CNF = &$this->_oConfig->CNF;
        $mixedContent = $this->_getContent($iContentId, 'getContentInfoById');
        if ($mixedContent === false) {
            echo json_encode(['viewers' => _t('_sys_txt_error_occured')]);
            exit;
        }
        list($iContentId, $aContentInfo) = $mixedContent;

        $iNum = $this->getStreamEngine()->getViewersNum($aContentInfo[$CNF['FIELD_KEY']]);
        if (false === $iNum)
            $this->onStreamStopped($iContentId, $aContentInfo);
        else
            $this->onStreamStarted($iContentId, $aContentInfo);
        
        echo json_encode(['viewers' => $iNum !== false ? _t('_bx_stream_txt_viewers', (int)$iNum) : _t('_bx_stream_txt_wait_for_stream'), 'num' => $iNum]);
    }

    public function serviceStreamBroadcast ($iContentId = 0)
    {
        return $this->_serviceTemplateFunc ('entryStreamBroadcast', $iContentId);
    }
    public function serviceStreamViewers ($iContentId = 0)
    {
        return $this->_serviceTemplateFunc ('entryStreamViewers', $iContentId);
    }

    public function serviceStreamPlayer ($iContentId = 0)
    {
        return $this->_serviceTemplateFunc ('entryStreamPlayer', $iContentId);
    }

    public function serviceStreamRecordings ($iContentId = 0)
    {
        $oGrid = BxDolGrid::getObjectInstance('bx_stream_recordings');
        return $oGrid ? $oGrid->getCode() : false;
    }

    public function serviceStreamRtmpSettings ($iContentId = 0)
    {
        $CNF = &$this->_oConfig->CNF;
        $mixedContent = $this->_getContent($iContentId, 'getContentInfoById');
        if ($mixedContent === false)
            return false;
        list($iContentId, $aContentInfo) = $mixedContent;

        $mixedMsg = $this->checkAllowedAdd (false);
        if ($mixedMsg !== CHECK_ACTION_RESULT_ALLOWED)
            return MsgBox($mixedMsg);

        if ($aContentInfo[$CNF['FIELD_AUTHOR']] !== bx_get_logged_profile_id() && !isAdmin()) 
            return false;

        $a = $this->getStreamEngine()->getRtmpSettings($aContentInfo[$CNF['FIELD_KEY']]);
        if (!$a)
            return false;

        $aForm = array(
            'form_attrs' => array(
                'name' => 'bx-stream-stmp-settings',
            ),
            'inputs' => array(
                'url' => array(
                    'type' => 'text',
                    'name' => 'url'.time(),
                    'caption' => _t('_bx_stream_form_entry_input_server'),
                    'value' => $a['server'],
                    'attrs' => array('readonly' => 'readonly'),
                ),
                'key' => array(
                    'type' => 'password',
                    'name' => 'key'.time(),
                    'caption' => _t('_bx_stream_form_entry_input_stream_key'),
                    'value' => $a['key'],
                    'attrs' => array('readonly' => 'readonly'),
                ),
            ),
        );

        if ($this->getStreamEngine()->isSreamFromBrowser()) {
            $sUrl = 'page.php?i=broadcast-stream&id=' . (int)$iContentId;
            $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($sUrl));
            $aForm['inputs']['header_div'] = array (
                'type' => 'custom',
                'content' => _t('_bx_stream_manual_settings_or_stream_from_webcam'),
            );
            $aForm['inputs']['stream-from-webcam'] = array (
                'type' => 'submit',
                'name' => 'submit',
                'value' => _t('_bx_stream_from_webcam'),
                'attrs' => array('onclick' => 'document.location="' . bx_html_attribute($sUrl) . '"; return false;'),
            );
        }

        $oForm = new BxTemplFormView ($aForm);
        return $oForm->getCode();
    }

    public function serviceCheckAllowedCommentsPost($iContentId, $sObjectComments) 
    {
        $CNF = &$this->_oConfig->CNF;
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if ($aContentInfo && $aContentInfo[$CNF['FIELD_ALLOW_COMMENTS']] == 0)
            return false;
        
        return parent::serviceCheckAllowedCommentsPost($iContentId, $sObjectComments);
    }
	
	public function serviceCheckAllowedCommentsView($iContentId, $sObjectComments) 
    {
        $CNF = &$this->_oConfig->CNF;
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if ($aContentInfo && $aContentInfo[$CNF['FIELD_ALLOW_COMMENTS']] == 0)
            return false;

        return parent::serviceCheckAllowedCommentsView($iContentId, $sObjectComments);
    }

    public function checkAllowedSetThumb ($iContentId = 0)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function serviceGetBadges($iContentId,  $bIsSingle = false, $bIsCompact  = false)
    {
        $CNF = &$this->_oConfig->CNF;
        $s = parent::serviceGetBadges($iContentId,  $bIsSingle, $bIsCompact);
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if (!$aContentInfo)
            return $s;
        return $s . $this->_oTemplate->getLiveBadge($aContentInfo);
    }

    public function onStreamStarted($iContentId, $aContentInfo = array())
    {
        $CNF = &$this->_oConfig->CNF;
        if (!$aContentInfo)
            $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if (!$aContentInfo || $aContentInfo[$CNF['FIELD_STATUS']] != 'awaiting')
            return;

        if(!$this->_oDb->updateEntriesBy(array($CNF['FIELD_STATUS'] => 'active'), array($CNF['FIELD_ID'] => $iContentId))) 
            return;

        if (CHECK_ACTION_RESULT_ALLOWED === $this->checkAllowedRecord(false, $aContentInfo[$CNF['FIELD_AUTHOR']]) && 'OvenMediaEngine' == getParam('bx_stream_engine')) {
            $iRecordingId = $this->_oDb->getNewRecordingId($iContentId);
            $this->getStreamEngine()->startRecording($iRecordingId, $aContentInfo[$CNF['FIELD_KEY']]);
            BxDolSession::getInstance()->setValue('bx-stream-rec-' . $iContentId, $iRecordingId);
        }

        $this->onPublished($iContentId);

        /**
         * @hooks
         * @hookdef hook-bx_stream-publish_succeeded 'bx_stream', 'publish_succeeded' - hook on stream published succeeded
         * - $unit_name - equals `bx_stream`
         * - $action - equals `publish_succeeded` 
         * - $object_id - stream id
         * - $sender_id - profile_id of stream's author
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_author_id` - [int] stream's author
         *      - `privacy_view` - [int] BX_DOL_PG_ALL
         * @hook @ref hook-bx_stream-publish_succeeded
         */
        bx_alert($this->getName(), 'publish_succeeded', $aContentInfo[$CNF['FIELD_ID']], $aContentInfo[$CNF['FIELD_AUTHOR']], array(
            'object_author_id' => $aContentInfo[$CNF['FIELD_AUTHOR']],
            'privacy_view' => BX_DOL_PG_ALL,
        ));
    }

    public function onStreamStopped($iContentId, $aContentInfo = array())
    {
        $CNF = &$this->_oConfig->CNF;

        if (!$aContentInfo)
            $aContentInfo = $this->_oDb->getContentInfoById($iContentId);

        if (!$aContentInfo || $aContentInfo[$CNF['FIELD_STATUS']] != 'active')
            return;

        if (!$this->_oDb->updateEntriesBy(array($CNF['FIELD_STATUS'] => 'awaiting'), array($CNF['FIELD_ID'] => $iContentId)))
            return;

        if (CHECK_ACTION_RESULT_ALLOWED === $this->checkAllowedRecord(true, $aContentInfo[$CNF['FIELD_AUTHOR']]) && 'OvenMediaEngine' == getParam('bx_stream_engine')) {
            $iRecordingId = BxDolSession::getInstance()->getValue('bx-stream-rec-' . $iContentId);
            if (!$iRecordingId)
                $iRecordingId = $this->_oDb->getRecordingId($iContentId);
            if ($iRecordingId) {

                $aRecordings = $this->getStreamEngine()->stopRecording($iRecordingId);
                // $this->getStreamEngine()->processRecordings($iRecordingId, $aContentInfo, $this); // this line is commented to process recordings later upon cron run to make sure long recording are processed properly
                BxDolSession::getInstance()->unsetValue('bx-stream-rec-' . $iContentId);

            }
            else {
                bx_log('bx_stream', "No recording ID defined for content ID($iContentId)", BX_LOG_ERR);
            }
        }

        if (BxDolRequest::serviceExists('bx_timeline', 'get_all')) {
            $a = BxDolService::call('bx_timeline', 'get_all', array(array(
                'type' => 'conditions', 
                'conditions' => array(
                    'type' => 'bx_stream', 
                    'action' => 'added', 
                    'object_id' => $iContentId
                )
            )));

            if ($a) {
                $oTimeline = BxDolModule::getInstance('bx_timeline');
                if ($oTimeline) {
                    foreach ($a as $r) {
                        // $oTimeline->deleteEvent($r); 
                        // $oTimeline->_oDb->deleteCache(array('event_id' => $r['id']));
                        BxDolService::call('bx_timeline', 'delete_entity', array($r['id']));
                    }
                }
            }
        }
    }

    public function checkAllowedRecord ($isPerformAction = false, $iProfileId = false)
    {
        if (!getParam('bx_stream_recordings_url'))
            return _t('_sys_txt_access_denied');

        // check ACL
        $aCheck = checkActionModule(false === $iProfileId ? $this->_iProfileId : $iProfileId, 'record', $this->getName(), $isPerformAction);
        if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return $aCheck[CHECK_ACTION_MESSAGE];
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    protected function _getImagesForTimelinePost($aEvent, $aContentInfo, $sUrl, $aBrowseParams = [])
    {
        $aImages = parent::_getImagesForTimelinePost($aEvent, $aContentInfo, $sUrl, $aBrowseParams);
        if(!empty($aImages) && is_array($aImages))
            foreach($aImages as $iIndex => $aImage)
                $aImages[$iIndex]['onclick'] = '';

        return $aImages;
    }
}

/** @} */
