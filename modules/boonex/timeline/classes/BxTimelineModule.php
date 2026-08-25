<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolAcl');
bx_import('BxBaseModNotificationsModule');

/**
 * SLTMODE - Silent mode:
 * It is needed for alert sending module to tell that the alert should be ignored 
 * with Timeline module completely or partially. Available values: 
 * 1. disabled (global, value = 0) - all events are registered;
 * 2. absolute (global, value = 1) - alert isn't registered which means that event won't appear in timelines at all;
 * 3. absolute (for Timeline only, value = 21) - the same as global absolute.
 * 4. partial registration might be added in the future versions.
 * 
 * @see BxBaseModNotificationsModule and BxTimelineResponse::response - 'silent_mode' parameter in Alerts Extras array.
 */
define('BX_TIMELINE_SLTMODE_ABSOLUTE', 21);

define('BX_TIMELINE_NAME_VIEWS_DB', 'views_db'); //--- Dynamic browsing feeds.

define('BX_TIMELINE_TYPE_ITEM', 'view_item');
define('BX_TIMELINE_TYPE_OWNER_AND_CONNECTIONS', 'owner_and_connections');
define('BX_TIMELINE_TYPE_CONNECTED_CONTEXTS', 'connected_contexts'); //--- Followed contexts by type (groups, events, spaces, etc) only.
define('BX_TIMELINE_TYPE_CHANNELS', 'channels'); //--- Followed channels only.
define('BX_TIMELINE_TYPE_FEED', 'feed'); //--- Owner and followed contexts excluding channels.
define('BX_TIMELINE_TYPE_HOT', 'hot'); //--- Aggrigated hot content.
define('BX_TIMELINE_TYPE_FOR_YOU', 'feed_and_hot'); //--- Aggrigated from different timelines.
define('BX_TIMELINE_TYPE_DEFAULT', BX_BASE_MOD_NTFS_TYPE_OWNER);

define('BX_TIMELINE_VIEW_ITEM', 'item');
define('BX_TIMELINE_VIEW_TIMELINE', 'timeline');
define('BX_TIMELINE_VIEW_OUTLINE', 'outline');
define('BX_TIMELINE_VIEW_SEARCH', 'search');
define('BX_TIMELINE_VIEW_DEFAULT', BX_TIMELINE_VIEW_OUTLINE);

define('BX_TIMELINE_FILTER_ALL', 'all');
define('BX_TIMELINE_FILTER_OWNER', 'owner');
define('BX_TIMELINE_FILTER_OTHER', 'other');
define('BX_TIMELINE_FILTER_OTHER_VIEWER', 'other_viewer');
define('BX_TIMELINE_FILTER_PANEL', 'panel');
define('BX_TIMELINE_FILTER_DEFAULT', BX_TIMELINE_FILTER_ALL);

define('BX_TIMELINE_PARSE_TYPE_POST', 'post');
define('BX_TIMELINE_PARSE_TYPE_REPOST', 'repost');
define('BX_TIMELINE_PARSE_TYPE_DEFAULT', BX_TIMELINE_PARSE_TYPE_POST);

define('BX_TIMELINE_STATUS_ACTIVE', 'active');
define('BX_TIMELINE_STATUS_PENDING', 'pending');
define('BX_TIMELINE_STATUS_AWAITING', 'awaiting');
define('BX_TIMELINE_STATUS_FAILED', 'failed');
define('BX_TIMELINE_STATUS_HIDDEN', 'hidden');
define('BX_TIMELINE_STATUS_DELETED', 'deleted');

//--- Video Auto Play 
define('BX_TIMELINE_VAP_OFF', 'off');
define('BX_TIMELINE_VAP_ON_MUTE', 'on_mute');
define('BX_TIMELINE_VAP_ON', 'on');

//--- Media Layouts
define('BX_TIMELINE_ML_SINGLE', 'single');
define('BX_TIMELINE_ML_GALLERY', 'gallery');
define('BX_TIMELINE_ML_SHOWCASE', 'showcase');

//--- Default Attachments Media Layout
define('BX_TIMELINE_AML_DEFAULT', BX_TIMELINE_ML_GALLERY);

//--- Hot Feed sources
define('BX_TIMELINE_HFS_CONTENT', 'content');
define('BX_TIMELINE_HFS_COMMENT', 'comment');
define('BX_TIMELINE_HFS_VOTE', 'vote');

//--- For You Feed sources
define('BX_TIMELINE_FYFS_PUBLIC', 'public');
define('BX_TIMELINE_FYFS_FEED', 'feed');
define('BX_TIMELINE_FYFS_CHANNELS', 'channels');
define('BX_TIMELINE_FYFS_HOT', 'hot');
define('BX_TIMELINE_FYFS_RECOM_FRIENDS', 'recom_friends');
define('BX_TIMELINE_FYFS_RECOM_SUBSCRIPTIONS', 'recom_subscriptions');

class BxTimelineModule extends BxBaseModNotificationsModule implements iBxDolContentInfoService
{
    protected $_sJsPostObject;
    protected $_sJsViewObject;
    protected $_aPostElements;
    protected $_sJsOutlineObject;

    protected $_sDividerTemplate;
    protected $_sBalloonTemplate;
    protected $_sCmtPostTemplate;
    protected $_sCmtViewTemplate;
    protected $_sCmtTemplate;

    /**
     * Constructor
     */
    function __construct($aModule)
    {
        parent::__construct($aModule);
    }

    /**
     * ACTION METHODS
     */
    public function actionGetContexts($iLimit = 20)
    {
        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        if(!$oConnection)
            return echoJson(array());

        $iProfileId = bx_get_logged_profile_id();
        $aConnected = $oConnection->getConnectedContent($iProfileId);

        $sTerm = bx_get('term');
        if(!$sTerm)
            return array_slice($aConnected, 0, $iLimit);

        $aResults = array();
        $aModules = bx_srv('system', 'get_profiles_modules', array(false), 'TemplServiceProfiles');
        foreach($aModules as $aModule) {
            if(!BxDolRequest::serviceExists($aModule['name'], 'act_as_profile'))
                continue;

            $aContexts = bx_srv($aModule['name'], 'profiles_search', array($sTerm, PHP_INT_MAX));
            foreach($aContexts as $aContext) {
                if(!in_array($aContext['value'], $aConnected))
                    continue;

                $aResults[] = $aContext;
            }
        }

        usort($aResults, function($r1, $r2) {
            return strcmp($r1['label'], $r2['label']);
        });

        echoJson(array_slice($aResults, 0, $iLimit));
    }

    public function actionVideo($iEventId, $iVideoId)
    {
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iEventId));
        if(empty($aEvent) || !is_array($aEvent))
            return;

        $aData = $this->_oTemplate->getDataCached($aEvent);
        if($aData === false || !isset($aData['content']['videos'][$iVideoId]))
            return;

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->addJs(array(
            'embedly-player.min.js'
        ));
        $oTemplate->setPageNameIndex (BX_PAGE_EMBED);
        $oTemplate->setPageContent ('page_main_code', $this->_oTemplate->getVideo($aEvent, $aData['content']['videos'][$iVideoId]));
        $oTemplate->getPageCode();
    }

    public function actionPost()
    {
        $this->_iOwnerId = bx_process_input(bx_get('owner_id'), BX_DATA_INT);

        $mixedAllowed = $this->isAllowedPost(true);
        if($mixedAllowed !== true)
            return echoJson(array('message' => strip_tags($mixedAllowed)));

        if (!bx_is_api())
            echoJson($this->getFormPost());
        else
            $this->getFormPost();
    }

    public function actionEdit($iId)
    {
        $this->_iOwnerId = bx_process_input(bx_get('owner_id'), BX_DATA_INT);

        $aParams = [
            'type' => BX_TIMELINE_TYPE_DEFAULT,
            'dynamic_mode' => true
        ];

        $aBrowseParams = [];
        if(bx_get('bp') !== false) {
            $aBrowseParams = $this->_oConfig->getBrowseParams(bx_process_input(bx_get('bp')));
            $aBrowseParams = $this->_prepareParamsGet($aBrowseParams);

            $aParams['type'] = $aBrowseParams['type'];
        }

        $mixedAllowed = $this->isAllowedPost(true);
        if($mixedAllowed !== true)
            return echoJson(array('message' => strip_tags($mixedAllowed)));

        echoJson($this->getFormEdit($iId, $aParams, $aBrowseParams));
    }

    function actionPin()
    {
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);
        $aParams = $this->_prepareParamsGet();
        $this->_iOwnerId = $aParams['owner_id'];

        $a = $this->_performPin($iId);
        if ((int)$a['code'] !== 0)
            return echoJson($a);

        echoJson([
            'code' => 0,
            'id' => $a['id'],
            'eval' => $this->_oConfig->getJsObjectView($aParams) . '.onPinPost(oData)'
        ]);
    }

    function actionStick()
    {
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);
        $aParams = $this->_prepareParamsGet();
        $this->_iOwnerId = $aParams['owner_id'];

        $a = $this->_performStick($iId);
        if ((int)$a['code'] !== 0)
            return echoJson($a);

        echoJson([
            'code' => 0,
            'id' => $a['id'],
            'eval' => $this->_oConfig->getJsObjectView($aParams) . '.onStickPost(oData)'
        ]);
    }

    function actionPromote()
    {
        $this->_iOwnerId = bx_process_input(bx_get('owner_id'), BX_DATA_INT);
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);

        $a = $this->_performPromote($iId);
        if ((int)$a['code'] !== 0)
            return echoJson($a);

        echoJson([
            'code' => 0,
            'message' => _t('_bx_timeline_txt_msg_performed_action')
        ]);
    }

    function actionMarkAsRead()
    {
        $aParams = $this->_prepareParamsGet();

        $mixedId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!is_array($mixedId))
            $mixedId = [$mixedId];

        $iProcessed = 0;
        foreach($mixedId as $iId) {
            $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
            if(empty($aEvent) || !is_array($aEvent))
                continue;

            if(!$this->_oDb->markAsRead($aParams['viewer_id'], $iId))
                continue;

            $iProcessed++;
        }

        return echoJson($iProcessed != count($mixedId) ? ['code' => 1] : [
            'code' => 0, 
            'id' => $mixedId
        ]);
    }

    function actionMute()
    {
        $CNF = &$this->_oConfig->CNF;

        $this->_iOwnerId = bx_process_input(bx_get('owner_id'), BX_DATA_INT);

        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iId));

        $mixedAllowed = $this->isAllowedMute($aEvent, true);
        if($mixedAllowed !== true)
            return echoJson(array('code' => 1, 'message' => strip_tags($mixedAllowed)));

        $iAuthor = (int)$aEvent[$CNF['FIELD_OWNER_ID']];
        if(!$this->_oConfig->isSystem($aEvent['type'], $aEvent['action']))
            $iAuthor = (int)$aEvent[$CNF['FIELD_OBJECT_ID']];

        if(!$this->getConnectionMuteObject()->addConnection($this->_iProfileId, $iAuthor))
            return echoJson(array('code' => 2));

        /**
         * @hooks
         * @hookdef hook-bx_timeline-muted 'bx_timeline', 'muted' - hook after an event author was muted
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `muted`
         * - $object_id - event author profile id
         * - $sender_id - performer profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `owner_id` - [int] owner profile id
         *      - `object_id` - [int] object id
         *      - `object_author_id` - [int] object author profile id
         * @hook @ref hook-bx_timeline-muted
         */
        bx_alert($this->_oConfig->getObject('alert'), 'muted', $iAuthor, $this->_iProfileId, [
            'owner_id' => $aEvent['owner_id'],
            'object_id' => $aEvent['object_id'],
            'object_author_id' => $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? $aEvent['owner_id'] : $aEvent['object_id']
        ]);

        echoJson(array('code' => 0, 'message' => _t('_bx_timeline_txt_msg_performed_action'), 'reload' => 1));
    }

    function actionDelete()
    {
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iId));
        if(empty($aEvent) || !is_array($aEvent))
            return echoJson(array('code' => 1));

        $aParams = $this->_prepareParamsGet();
        $this->_iOwnerId = $aParams['owner_id'];

        $mixedAllowed = $this->isAllowedDelete($aEvent, true);
        if($mixedAllowed !== true)
            return echoJson(array('code' => 2, 'message' => strip_tags($mixedAllowed)));

        if(!$this->{$this->_oConfig->isHideUponDelete() ? 'hideEvent' : 'deleteEvent'}($aEvent))
            return echoJson(array('code' => 3));

        echoJson(array(
            'code' => 0, 
            'id' => $aEvent['id'], 
            'eval' => $this->_oConfig->getJsObjectView($aParams) . '.onDeletePost(oData)'
        ));
    }

    public function actionRepost()
    {
    	$iAuthorId = $this->getUserId();
        $iOwnerId = bx_process_input(bx_get('owner_id'), BX_DATA_INT);
        $sType = bx_process_input(bx_get('type'), BX_DATA_TEXT);
        $sAction = bx_process_input(bx_get('action'), BX_DATA_TEXT);
        $iObjectId = bx_process_input(bx_get('object_id'), BX_DATA_INT);

        $aResult = $this->repost($iAuthorId, $iOwnerId, $sType, $sAction, $iObjectId);
        if(!empty($aResult) && is_array($aResult))
            return echoJson($aResult);

        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return echoJson(['code' => 1, 'message' => _t('_bx_timeline_txt_err_cannot_repost')]);

        $aParams = $this->_oConfig->getRepostDefaults();

        echoJson([
            'code' => 0, 
            'message' => _t('_bx_timeline_txt_msg_success_repost'), 
            'count' => $aReposted['reposts'], 
            'countf' => (int)$aReposted['reposts'] > 0 ? $this->_oTemplate->getRepostCounterLabel($aReposted['reposts'], $aParams) : '',
            'counter' => $this->_oTemplate->getRepostCounter($aReposted, $aParams),
            'disabled' => true
        ]);
    }

    public function actionRepostWith()
    {
        if(($iReposterId = bx_get('reposter_id')) !== false)
            $iReposterId = bx_process_input($iReposterId, BX_DATA_INT);

        $iUserId = $this->getUserId();
        if(!$iReposterId || $iReposterId != $iUserId)
            $iReposterId = $iUserId;

        $iOwnerId = bx_process_input(bx_get('owner_id'), BX_DATA_INT);
        $sType = bx_process_input(bx_get('type'), BX_DATA_TEXT);
        $sAction = bx_process_input(bx_get('action'), BX_DATA_TEXT);
        $iObjectId = bx_process_input(bx_get('object_id'), BX_DATA_INT);

        $oForm = BxDolForm::getObjectInstance($this->_oConfig->getObject('form_repost'), $this->_oConfig->getObject('form_display_repost_with'));
        $oForm->initChecker([
            'reposter_id' => $iReposterId,
            'owner_id' => $iOwnerId,
            'type' => $sType,
            'action' => $sAction, 
            'object_id' => $iObjectId
        ]);

        if($oForm->isSubmitted()) {
            if(!$oForm->isValid())
                return echoJson(['popup' => [
                    'html' => BxTemplFunctions::getInstance()->transBox($this->_oConfig->getHtmlIds('repost', 'with_popup'), $this->_oTemplate->getRepostWith($oForm)), 
                    'options' => ['closeOnOuterClick' => false, 'removeOnClose' => true]
                ]]);

            $aResult = $this->repost($iReposterId, $iOwnerId, $sType, $sAction, $iObjectId, ['text' => $oForm->getCleanValue('text')]);
            if(!empty($aResult) && is_array($aResult))
                return echoJson($aResult);

            $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
            if(empty($aReposted) || !is_array($aReposted))
                return echoJson(['code' => 1, 'message' => _t('_bx_timeline_txt_err_cannot_repost')]);

            return echoJson([
                'code' => 0, 
                'message' => _t('_bx_timeline_txt_msg_success_repost'), 
                'count' => $aReposted['reposts'], 
                'countf' => (int)$aReposted['reposts'] > 0 ? $this->_oTemplate->getRepostCounterLabel($aReposted['reposts']) : '',
                'counter' => $this->_oTemplate->getRepostCounter($aReposted),
            ]);
        }

        echo $this->_oTemplate->getRepostTo($oForm);
    }

    public function actionRepostTo()
    {
        $iReposterId = bx_process_input(bx_get('reposter_id'), BX_DATA_INT);
        if($iReposterId != $this->getUserId())
            return;

        $sType = bx_process_input(bx_get('type'), BX_DATA_TEXT);
        $sAction = bx_process_input(bx_get('action'), BX_DATA_TEXT);
        $iObjectId = bx_process_input(bx_get('object_id'), BX_DATA_INT);

        $oForm = BxDolForm::getObjectInstance($this->_oConfig->getObject('form_repost'), $this->_oConfig->getObject('form_display_repost_to'));
        $oForm->initChecker([
            'reposter_id' => $iReposterId,
            'type' => $sType,
            'action' => $sAction, 
            'object_id' => $iObjectId
        ]);

        if($oForm->isSubmitted()) {
            if(!$oForm->isValid())
                return echoJson(['popup' => [
                    'html' => BxTemplFunctions::getInstance()->transBox($this->_oConfig->getHtmlIds('repost', 'to_popup'), $this->_oTemplate->getRepostTo($oForm)), 
                    'options' => ['closeOnOuterClick' => false, 'removeOnClose' => true]
                ]]);

            $aContexts = [];
            if(($aContextsSearch = $oForm->getCleanValue('search')) !== false)
                $aContexts = array_merge($aContexts, $aContextsSearch);

            if(($aContextsList = $oForm->getCleanValue('list')) !== false)
                $aContexts = array_merge($aContexts, $aContextsList);

            $aContexts = array_unique($aContexts);
            if(empty($aContexts) || !is_array($aContexts))
                return echoJson([]);

            $iResult = 0;
            foreach($aContexts as $iContextId)
                if(($mixedResult = $this->repost($iReposterId, $iContextId, $sType, $sAction, $iObjectId)) && !is_array($mixedResult))
                    $iResult++;

            if(!$iResult)
                return echoJson(['code' => 1, 'message' => _t('_bx_timeline_txt_err_cannot_repost')]);

            $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
            if(empty($aReposted) || !is_array($aReposted))
                return echoJson(['code' => 1, 'message' => _t('_bx_timeline_txt_err_cannot_repost')]);

            return echoJson([
                'code' => 0, 
                'message' => _t('_bx_timeline_txt_msg_success_repost'), 
                'count' => $aReposted['reposts'], 
                'countf' => (int)$aReposted['reposts'] > 0 ? $this->_oTemplate->getRepostCounterLabel($aReposted['reposts']) : '',
                'counter' => $this->_oTemplate->getRepostCounter($aReposted),
            ]);
        }

        echo $this->_oTemplate->getRepostTo($oForm);
    }

    function actionGetView()
    {
        $aParams = $this->_prepareParamsGet();

        $this->_iOwnerId = $aParams['owner_id'];
        $oProfileOwner = BxDolProfile::getInstance($this->_iOwnerId);
        if(!$oProfileOwner)
            return echoJson([]);

        $mixedResult = $oProfileOwner->checkAllowedProfileView();
        if($mixedResult !== CHECK_ACTION_RESULT_ALLOWED)
            return echoJson(['code' => 1, 'msg' => $mixedResult]);

        $aContent = $this->_oTemplate->getViewBlock($aParams);
        if(empty($aContent['content']))
            return echoJson([]);

        if(!empty($aParams['type']))
            $this->_oConfig->setUserChoice(['type' => $aParams['type']]);

        echoJson([
            'code' => 0, 
            'content' => $aContent['content'],
        ]);
    }

    function actionGetViewFilters()
    {
        $aParams = $this->_prepareParamsGet();

        $sContent = $this->_oTemplate->getViewFilters($aParams);
        if(empty($sContent))
            return echoJson([]);

        echoJson([
            'code' => 0,
            'popup' => [
                'html' => $sContent,
                'options' => [
                    'closeOnOuterClick' => true,
                    'removeOnClose' => false,
                ]
            ],
        ]);
    }

    function actionGetPost()
    {
        $aParams = $this->_prepareParamsGet();
        $aParams['dynamic_mode'] = true;

        $this->_iOwnerId = $aParams['owner_id'];

        $sJsObject = '';
        if(bx_get('js_object') !== false)
            $sJsObject = $this->_oConfig->prepareParam('js_object');
        if(empty($sJsObject))
            $sJsObject = $this->_oConfig->getJsObject('post');

        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => (int)bx_get('id')]);
        if(empty($aEvent) || !is_array($aEvent))
            return echoJson([]);

        /**
         * Note. Disabled for now, because Own posts on Timelines of Following members 
         * became visible on posts' author Dashboard Timeline.
         * 
        $bAfpsLoading = (int)bx_get('afps_loading') === 1;
        if($bAfpsLoading && $this->_iOwnerId != $aEvent['owner_id'])
            return echoJson(array('message' => _t('_bx_timeline_txt_msg_posted')));
         * 
         */

        $aResult = [
            'id' => (int)$aEvent['id'],
            'name' => $aParams['name'],
            'view' => $aParams['view'],
            'type' => $aParams['type'],
            'item' => $this->_oTemplate->getPost($aEvent, $aParams),
            'eval' => $sJsObject . "._onGetPost(oData)"
        ];

        /**
         * @hooks
         * @hookdef hook-bx_timeline-on_get_post 'bx_timeline', 'on_get_post' - hook to override just created direct post (update)
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `on_get_post`
         * - $object_id - event author profile id
         * - $sender_id - performer profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `params` - [array] browse params array as key&value pairs
         *      - `override_result` - [array] by ref, result array as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-bx_timeline-on_get_post
         */
        bx_alert($this->getName(), 'on_get_post', 0, 0, [
            'params' => $aParams,
            'override_result' => &$aResult,
        ]);

        echoJson($aResult);
    }

    function actionGetPosts()
    {
        $aParams = $this->_prepareParamsGet();
        list($sItems, $sLoadMore, $sBack, $sEmpty, $iEvent, $bEventsToLoad) = $this->_oTemplate->getPosts($aParams);

        echoJson(array(
            'view' => $aParams['view'],
            'items' => $sItems,
            'load_more' => $sLoadMore, 
            'back' => $sBack,
            'empty' => $sEmpty,
            'events_to_load' => $bEventsToLoad,
            'eval' => $this->_oConfig->getJsObjectView($aParams) . "._onGetPosts(oData)"
        ));
    }
    
  
    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_posts get_posts
     * 
     * @code bx_srv('bx_timeline', 'get_posts', [...]); @endcode
     * 
     * Get a posts list for API.
     *
     * @return an array 
     * 
     * @see BxTimelineModule::serviceGetPosts
     */
     /** 
     * @ref bx_timeline-get_posts "get_posts"
     * @api @ref bx_timeline-get_posts "get_posts"
     */
    public function serviceGetPosts($aParams)
    {
        if(is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams, true);

        return $this->_serviceGetBlockViewByType($aParams);
    }

    public function actionGetPostForm()
    {
        $CNF = &$this->_oConfig->CNF;

        $this->_iOwnerId = bx_process_input(bx_get('owner_id'), BX_DATA_INT);
        $sType = bx_process_input(bx_get('type'));

        $aResult = $this->getFormPost([
            'type' => $sType,
            'form_display' => $this->_oConfig->getPostFormDisplay($sType)
        ]);

        if($this->_oConfig->isEditorAutoattach() && !empty($aResult['form_object'])) {
            $aUploadersInfo = $aResult['form_object']->getUploadersInfo($CNF['FIELD_PHOTO']);
            if(!empty($aUploadersInfo) && is_array($aUploadersInfo))
                $aResult = array_merge($aResult, ['options' => [
                    'sAutoUploader' => $aUploadersInfo['name'], 
                    'sAutoUploaderId' => $aUploadersInfo['id']
                ]]);

            unset($aResult['form_object']);
        }

        echoJson($aResult);
    }

    public function actionGetEditForm($iId)
    {
        $aBrowseParams = $this->_prepareParamsGet();
        $this->_iOwnerId = $aBrowseParams['owner_id'];

        echoJson($this->getFormEdit($iId, [
            'type' => $aBrowseParams['type'],
            'dynamic_mode' => true
        ], $aBrowseParams));
    }

    public function serviceGetEditForm($iId)
    {
        $aResult = [];

        if(($aForm = $this->getFormEdit($iId)) && isset($aForm['form'])) {
            $aForm['form']['inputs']['tlb_do_submit'] = $aForm['form']['inputs']['controls'][0];
            unset($aForm['form']['inputs']['controls']);
            
            $aResult['form'] = ['id' => 'bx_timeline', 'type' => 'form', 'name' => 'feed_edit', 'data' => $aForm['form'], 'request' => ['immutable' => true]];
        }

        $aItemData = $this->getItemData($iId);
        if(is_array($aItemData) && !empty($aItemData['event']))
            $aResult['item'] = $this->_oTemplate->getPostApi($aItemData['event']);

        return $aResult;
    }

    public function actionGetComments()
    {
        $this->_iOwnerId = bx_process_input(bx_get('owner_id'), BX_DATA_INT);

        $sSystem = bx_process_input(bx_get('system'), BX_DATA_TEXT);
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);
        $sComments = $this->_oTemplate->getComments($sSystem, $iId, array('dynamic_mode' => true));

        echoJson(array('content' => $sComments));
    }

    public function actionDeleteAttachLinks()
    {
    	$iUserId = $this->getUserId();
        $iEventId = bx_process_input(bx_get('event_id'), BX_DATA_INT);

        $aParams = $iEventId > 0 ? ['type' => 'event_id', 'event_id' => $iEventId] : ['type' => 'unused', 'profile_id' => $iUserId];
        $aLinks = $this->_oDb->getLinksBy($aParams);

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->getObject('storage_photos'));

        $aUrls = [];
        foreach($aLinks as $aLink) {
            $aUrls[] = $aLink['url'];

            if(!empty($aLink['media_id']))
                $oStorage->deleteFile($aLink['media_id']);

            $this->_oDb->deleteLink($aLink['id']);
        }

        echoJson(['code' => 0, 'urls' => $aUrls]);
    }

    public function actionAutoAttachInsertion()
    {
        $sTxtError = _t('_bx_timeline_txt_err_cannot_perform_insertion');

        $sUploader = bx_process_input(bx_get('u'));
        $sResultContainerId = bx_process_input(bx_get('uid'));

        $sStorage = $this->_oConfig->getObject('storage_photos');
        $oUploader = BxDolUploader::getObjectInstance($sUploader, $sStorage, $sResultContainerId, $this->_oTemplate);
        if(!$oUploader)
            return echoJson(['code' => 1, 'msg' => $sTxtError]);

        ob_start();
        $oUploader->handleUploads(bx_get_logged_profile_id(), isset($_FILES['file']) ? $_FILES['file'] : null, true, false, false);
        ob_end_clean();

        $sError = $oUploader->getUploadErrorMessages();
        if(!empty($sError))
            return echoJson(['code' => 2, 'msg' => $sError]);

        return echoJson(['code' => 0, 'eval' => $oUploader->getNameJsInstanceUploader() . '.restoreGhosts()']);
    }

    public function actionGetRepostedBy()
    {
        $iRepostedId = bx_process_input(bx_get('id'), BX_DATA_INT);

        echo $this->_oTemplate->getRepostedBy($iRepostedId);
    }

    public function actionGetItemBrief()
    {
        $aParams = $this->_prepareParamsGet();

        $iEvent = bx_process_input(bx_get('id'), BX_DATA_INT);
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iEvent));
        if(empty($aEvent) || !is_array($aEvent)) {
            echo MsgBox(_t('_Empty'));
            return;
        }

        if(!$this->isAllowedView($aEvent)) {
            echo MsgBox(_t('_sys_access_denied_to_private_content'));
            return;
        }        

        $sName = $this->_oConfig->getHtmlIdView('item_popup', $aParams, array('whole' => false, 'hash' => false)) . $iEvent;
        $sTitle = _t('_bx_timeline_page_title_item_brief');
        $sContent = BxDolPage::getObjectInstance($this->_oConfig->getObject('page_item_brief'), $this->_oTemplate)->getCodeDynamic();
        echo PopupBox($sName, $sTitle, $sContent, true);
                
    }

    public function actionGetJumpTo()
    {
        $aParams = $this->_prepareParamsGet();
        $this->_iOwnerId = $aParams['owner_id'];

        $sJsObjectView = $this->_oConfig->getJsObjectView($aParams);

        echoJson(array(
            'content' => $this->_oTemplate->getJumpTo($aParams),
            'eval' => $sJsObjectView . '.onGetJumpTo(oData)'
        ));
    }

    public function actionResumeLiveUpdate()
    {
        $aParams = $this->_prepareParamsGet();
    	$sKey = $this->_oConfig->getLiveUpdateKey($aParams);

    	bx_import('BxDolSession');
    	BxDolSession::getInstance()->unsetValue($sKey);
    }

    public function actionPauseLiveUpdate()
    {
        $aParams = $this->_prepareParamsGet();
    	$sKey = $this->_oConfig->getLiveUpdateKey($aParams);

    	bx_import('BxDolSession');
    	BxDolSession::getInstance()->setValue($sKey, 1);
    }

    function actionRss()
    {
        $CNF = &$this->_oConfig->CNF;

        $iLength = $this->_oConfig->getRssLength();
        if(!$iLength)
            return;

        $iOwnerId = 0;

        $aArgs = func_get_args();
        $sType = $this->_oConfig->processParam(array_shift($aArgs));
        switch($sType) {
            case BX_BASE_MOD_NTFS_TYPE_OWNER:
                $iOwnerId = (int)array_shift($aArgs);
                $sOwnerName = $this->getObjectUser($iOwnerId)->getDisplayName();

                $sRssCaption = _t('_bx_timeline_txt_rss_caption', $sOwnerName);
                $sRssLink = $this->_oConfig->getViewUrl($iOwnerId);
                break;

            default:
                $sRssCaption = _t('_bx_timeline_page_title_view_home');
                $sRssLink = $this->_oConfig->getHomeViewUrl();
                break;
        }

        $aParams = $this->_prepareParams(array(
            'view' => BX_TIMELINE_VIEW_DEFAULT,
            'type' => $sType,
            'owner_id' => $iOwnerId,
            'start' => 0, 
            'per_page' => $iLength, 
            'timeline' => 0, 
            'filter' => '', 
            'modules' => array()
        ));
        $aEvents = $this->_oDb->getEvents($aParams);

        $oPrivacy = BxDolPrivacy::getObjectInstance($this->_oConfig->getObject('privacy_view'));

        $aRssData = array();
        foreach($aEvents as $aEvent) {
            if(empty($aEvent['title'])) 
                continue;

            $iEventId = (int)$aEvent[$CNF['FIELD_ID']];
            $sEventFieldAuthor = $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? 'owner_id' : 'object_id';

            if($oPrivacy) {
                $oPrivacy->setTableFieldAuthor($sEventFieldAuthor);
                if(!$oPrivacy->check($iEventId))
                    continue;
            }

            $iOwner = $aEvent[$sEventFieldAuthor];
            $oOwner = BxDolProfile::getInstanceMagic($iOwner);

            $aRssData[$iEventId] = array(
               'UnitID' => $iEventId,
               'UnitTitle' => $aEvent['title'],
               'UnitLink' => $this->_oConfig->getItemViewUrl($aEvent),
               'UnitDesc' => bx_replace_markers($aEvent['description'], array(
                    'profile_name' => $oOwner->getDisplayName()
                )),
               'UnitDateTimeUTS' => $aEvent['date'],
            );
        }

        $oRss = new BxDolRssFactory();

        header('Content-Type: application/xml; charset=utf-8');
        echo $oRss->GenRssByData($aRssData, $sRssCaption, $sRssLink);
    }


    /**
     * SERVICE METHODS
     */

    public function serviceGetSafeServices()
    {
        $a = parent::serviceGetSafeServices();
        return array_merge($a, array (
            'GetCreatePostForm' => '',
            'GetSearchResultUnit' => '',
            'GetBlockPost' => '',
            'GetBlockPostProfile' => '',
            'GetBlockPostHome' => '',
            'GetBlockPostAccount' => '',
            'GetBlockView' => '',
            'GetBlockViewOutline' => '',
            'GetBlockViewProfile' => '',
            'GetBlockViewProfileOutline' => '',
            'GetBlockViewsTimeline' => '',
            'GetBlockViewsOutline' => '',
            'GetBlockViewHome' => '',
            'GetBlockViewHomeOutline' => '',
            'GetBlockViewHot' => '',
            'GetBlockViewHotOutline' => '',
            'GetBlockViewAccount' => '',
            'GetBlockViewAccountOutline' => '',
            'GetBlockItem' => '',
            'GetPosts' => '',
            'Get' => '',
            'Repost' => '',
            'Delete' => '',
            'Pin' => '',
            'Stick' => '',
            'Promote' => '',
            'GetEditForm' => '',
            'GetLiveUpdate' => ''
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_hot_sources_checklist get_hot_sources_checklist
     * 
     * @code bx_srv('bx_timeline', 'get_hot_sources_checklist', [...]); @endcode
     * 
     * Get a list of available sources for Hot feed. Is used in module settings in Studio.
     *
     * @return an array with available sources represented as key => value pairs.
     * 
     * @see BxTimelineModule::serviceGetHotSourcesChecklist
     */
    /** 
     * @ref bx_timeline-get_hot_sources_checklist "get_hot_sources_checklist"
     */
    function serviceGetHotSourcesChecklist()
    {
        $CNF = &$this->_oConfig->CNF;

    	$aSources = $this->_oConfig->getHotSourcesList();

        $aResults = [];
        foreach($aSources as $sSource) 
            $aResults[$sSource] = _t($CNF['T']['option_hfs_' . $sSource]);

        return $aResults;
    }
    
    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_for_you_sources_checklist get_for_you_sources_checklist
     * 
     * @code bx_srv('bx_timeline', 'get_for_you_sources_checklist', [...]); @endcode
     * 
     * Get a list of available sources for 'For You' feed. Is used in module settings in Studio.
     *
     * @return an array with available sources represented as key => value pairs.
     * 
     * @see BxTimelineModule::serviceGetForYouSourcesChecklist
     */
    /** 
     * @ref bx_timeline-get_for_you_sources_checklist "get_for_you_sources_checklist"
     */
    function serviceGetForYouSourcesChecklist()
    {
        $CNF = &$this->_oConfig->CNF;

    	$aSources = $this->_oConfig->getForYouSourcesList();

        $aResults = [];
        foreach($aSources as $sSource) 
            $aResults[$sSource] = _t($CNF['T']['option_fyfs_' . $sSource]);

        return $aResults;
    }

    public function serviceManageTools($sType = 'common')
    {
        $sResult = parent::serviceManageTools($sType);
        if(!empty($sResult))
            $this->_oTemplate->addJsSystem(['modules/base/text/js/|manage_tools.js']);

        return $sResult;
    }

    public function serviceFeedsMenuAdd($mixedModule = false)
    {
        $sSetName = $this->_oConfig->getObject('menu_set_feeds');

        $iOrder = $this->_oDb->getMenuItemMaxOrder($sSetName);

        $aModules = !empty($mixedModule) ? [$this->_oDb->getModuleByName($mixedModule)] : bx_srv('system', 'get_modules_by_type', ['context']);
        foreach($aModules as $aModule) {
            $sModuleName = $aModule['name'];
            $sModuleUri = $aModule['uri'];
            if($sModuleName == 'system' && $sModuleUri == 'system')
                continue;

            $iMenuItem = $this->_oDb->getMenuItemId($sSetName, $sModuleUri);
            if(!empty($iMenuItem))
                continue;

            $sTitleKey = '_' . $sModuleName;
            if(strcmp($sTitleKey, _t($sTitleKey)) == 0)
                $sTitleKey = $aModule['title'];

            $this->_oDb->insertMenuItem($sSetName, $sModuleName, $sModuleUri, $sTitleKey, ++$iOrder);
        }

        return true;
    }

    public function serviceFeedsMenuDelete($mixedModule = false)
    {
        $sSetName = $this->_oConfig->getObject('menu_set_feeds');

        $aModules = !empty($mixedModule) ? [$this->_oDb->getModuleByName($mixedModule)] : bx_srv('system', 'get_modules_by_type', ['context']);
        foreach($aModules as $aModule)
            $this->_oDb->deleteMenuItem($sSetName, $aModule['uri']);

        return true;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_content_owner_profile_id get_content_owner_profile_id
     * 
     * @code bx_srv('bx_timeline', 'get_content_owner_profile_id', [...]); @endcode
     * 
     * Get event's owner profile id.
     * 
     * @param $mixedEvent integer value with event ID or an array with event info.
     * @return event's owner profile id.
     * 
     * @see BxTimelineModule::serviceGetContentOwnerProfileId
     */
    /** 
     * @ref bx_timeline-get_content_owner_profile_id "get_content_owner_profile_id"
     */
    public function serviceGetContentOwnerProfileId($mixedEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $iProfile = (int)bx_get_logged_profile_id();
        if(empty($mixedEvent))
            return $iProfile;

        if(!is_array($mixedEvent))
            $mixedEvent = $this->_oDb->getContentInfoById((int)$mixedEvent);

        if(empty($mixedEvent) || !is_array($mixedEvent) || !isset($mixedEvent[$CNF['FIELD_SYSTEM']]))
            return $iProfile;

        if((int)$mixedEvent[$CNF['FIELD_SYSTEM']] == 0)
            return (int)$mixedEvent[$CNF['FIELD_OBJECT_ID']];

        if(!empty($mixedEvent['object_owner_id']))
            return (int)$mixedEvent['object_owner_id'];

        if(!empty($mixedEvent['content'])) {
            $aContent = unserialize($mixedEvent['content']);

            if(!empty($aContent) && is_array($aContent) && !empty($aContent['object_author_id']))
                return (int)$aContent['object_author_id'];
        }

        $aEventData = $this->_oTemplate->getData($mixedEvent);
        if(!empty($aEventData) && is_array($aEventData) && !empty($aEventData['object_owner_id']))
            return (int)$aEventData['object_owner_id'];

        return $iProfile;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_create_post_form get_create_post_form
     * 
     * @code bx_srv('bx_timeline', 'get_create_post_form', [...]); @endcode
     * 
     * Get form code for add content. Is needed for United Post Form.
     * 
     * @param $aParams optional array with parameters(display name, etc)
     * @return form code or error
     * 
     * @see BxTimelineModule::serviceGetCreatePostForm
     */
    /** 
     * @ref bx_timeline-get_create_post_form "get_create_post_form"
     */
    public function serviceGetCreatePostForm($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

    	$aParams = array_merge($this->_aFormParams, $aParams);

        $bContext = $aParams['context_id'] !== false;
        $this->_iOwnerId = $bContext ? abs($aParams['context_id']) : 0;

    	$oForm = $this->serviceGetObjectForm('add', $aParams);
    	if(!$oForm)
            return '';

        $aParams['type'] = BX_BASE_MOD_NTFS_TYPE_PUBLIC;
        $aParams['form_display'] = 'form_display_post_add_public';
        if($bContext) {
            if($aParams['context_id'] < 0) {
                $aParams['type'] = BX_BASE_MOD_NTFS_TYPE_OWNER;
                $aParams['form_display'] = 'form_display_post_add_profile';
            }
            else {
                $aParams['type'] = BX_TIMELINE_TYPE_FEED;
                $aParams['form_display'] = 'form_display_post_add';
            }
        }

        if(!empty($aParams['display']))
            $aParams['form_display'] = $aParams['display'];

    	$aResult = $this->getFormPost($aParams);
    	if(!empty($aResult['form'])) {
            $bDynamicMode = isset($aParams['dynamic_mode']) && $aParams['dynamic_mode'];

            if($this->_oConfig->isEditorAutoattach() && !empty($aResult['form_object'])) {
                $aUploadersInfo = $aResult['form_object']->getUploadersInfo($CNF['FIELD_PHOTO']);
                if(!empty($aUploadersInfo) && is_array($aUploadersInfo))
                    $aParams = [
                        'gparams' => ['sAutoUploader' => $aUploadersInfo['name'], 'sAutoUploaderId' => $aUploadersInfo['id']],
                        'rparams' => $aParams
                    ];
            }

            $sCode = '';
            $sCode .= $this->_oTemplate->getJsCodePost($this->_iOwnerId, $aParams, true, $bDynamicMode);
            $sCode .= $aResult['form'];
            return $sCode;
        }

        if(!empty($aResult['message']))
            return $aResult['message'];

        return '';
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_object_form get_object_form
     * 
     * @code bx_srv('bx_timeline', 'get_object_form', [...]); @endcode
     * 
     * Get form object for add, edit, view or delete the content.
     * 
     * @param $sType 'add' is supported only 
     * @param $aParams optional array with parameters(display name, etc)
     * @return form object or false on error
     * 
     * @see BxTimelineModule::serviceGetObjectForm
     */
    /** 
     * @ref bx_timeline-get_object_form "get_object_form"
     */
    public function serviceGetObjectForm ($sType, $aParams = array())
    {
    	if(!in_array($sType, array('add')))
            return false;

        $bContext = $aParams['context_id'] !== false;
        if($bContext && ($oContextProfile = BxDolProfile::getInstance(abs($aParams['context_id']))) !== false)
            if($oContextProfile->checkAllowedPostInProfile() !== CHECK_ACTION_RESULT_ALLOWED)
                return false;

        $aParams['type'] = BX_BASE_MOD_NTFS_TYPE_PUBLIC;
        $aParams['form_display'] = 'form_display_post_add_public';
        if($bContext) {
            if($aParams['context_id'] < 0) {
                $aParams['type'] = BX_BASE_MOD_NTFS_TYPE_OWNER;
                $aParams['form_display'] = 'form_display_post_add_profile';
            }
            else {
                $aParams['type'] = BX_TIMELINE_TYPE_OWNER_AND_CONNECTIONS;
                $aParams['form_display'] = 'form_display_post_add';
            }
        }

        if(!empty($aParams['display']))
            $aParams['form_display'] = $aParams['display'];

        $oForm = $this->getFormPostObject($aParams);

        /**
         * @hooks
         * @hookdef hook-system-get_object_form 'system', 'get_object_form' - hook to override an object of create content form, @see BxDolForm
         * - $unit_name - equals `system`
         * - $action - equals `get_object_form`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `module` - [string] module name
         *      - `type` - [string] 'add', 'edit', 'view' or 'delete' form display type
         *      - `params` - [array] form params array as key&value pairs
         *      - `form` - [object] by ref, an object of create content form, @see BxDolForm, can be overridden in hook processing
         * @hook @ref hook-system-get_object_form
         */
        bx_alert('system', 'get_object_form', 0, 0, array(
            'module' => $this->_oConfig->getName(),
            'type' => $sType,
            'params' => $aParams,
            'form' => &$oForm,
            'form_inputs_ref' => &$oForm->aInputs,
        ));

    	return $oForm;
    }
    
    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection get_timeline_post
     * @see BxTimelineModule::serviceGetTimelinePost
     *
     * Get Timeline post. It's needed for Timeline module.
     * 
     * @param $aEvent timeline event array from Timeline module
     * @return array in special format which is needed specifically for Timeline module to display the data.
     */
    public function serviceGetTimelinePost($aEvent, $aBrowseParams = array())
    {
        $aContentInfo = $this->_oDb->getContentInfoById($aEvent['object_id']);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return false;

        $aEvent = array_merge($aEvent, array(
            'owner_id' => $aContentInfo['owner_id'],
            'object_privacy_view' => $aContentInfo['object_privacy_view']
        ));

        /*
         * Note. For 'Direct Timeline Posts' FIELD_OBJECT_ID contains post's author profile ID.
         */
        $this->_oConfig->CNF['FIELD_AUTHOR'] = $this->_oConfig->CNF['FIELD_OBJECT_ID'];
        return parent::serviceGetTimelinePost($aEvent, $aBrowseParams);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection get_timeline_post
     * @see BxTimelineModule::serviceGetTimelinePostAllowedView
     *
     * Check Timeline post's visibility. It's needed for Timeline module, when its events 
     * are accessed and checked from outside. For example, when they are referenced 
     * from Channels module.
     * 
     * @param $aEvent timeline event array from Timeline module
     * @return mixed value: CHECK_ACTION_RESULT_ALLOWED or text of some error message.
     */
    public function serviceGetTimelinePostAllowedView($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $iOwnerId = (int)$aEvent[$CNF['FIELD_OWNER_ID']];
        if($iOwnerId == 0)
            return CHECK_ACTION_RESULT_ALLOWED;

        $oOwner = BxDolProfile::getInstance($iOwnerId);
        if(!$oOwner)
            return CHECK_ACTION_RESULT_ALLOWED;

        $sModule = $oOwner->getModule();
        $aOwnerInfo = BxDolService::call($sModule, 'get_info', array($oOwner->getContentId(), false));
        if(empty($aOwnerInfo) || !is_array($aOwnerInfo))
            return CHECK_ACTION_RESULT_ALLOWED;

        return BxDolService::call($sModule, 'check_allowed_view_for_profile', array($aOwnerInfo));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_author get_author
     * 
     * @code bx_srv('bx_timeline', 'get_author', [...]); @endcode
     * 
     * Get author ID from content info by content ID. Is used in "Content Info Objects" system.
     * 
     * @param $iContentId integer value with content ID.
     * @return integer value with author ID.
     * 
     * @see BxTimelineModule::serviceGetAuthor
     */
    /** 
     * @ref bx_timeline-get_author "get_author"
     */
    public function serviceGetAuthor ($iContentId)
    {
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContentId));
        if(empty($aEvent) || !is_array($aEvent))
            return 0;

        return $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? (int)$aEvent['owner_id'] : (int)$aEvent['object_id'];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_date_changed get_date_changed
     * 
     * @code bx_srv('bx_timeline', 'get_date_changed', [...]); @endcode
     * 
     * Get date when the content was changed last time. Is used in "Content Info Objects" system.
     * Note. In case of Timeline event 0 is returned everytime.
     * 
     * @param $iContentId integer value with content ID.
     * @return integer value with changing date.
     * 
     * @see BxTimelineModule::serviceGetDateChanged
     */
    /** 
     * @ref bx_timeline-get_date_changed "get_date_changed"
     */
    public function serviceGetDateChanged ($iContentId)
    {
        return 0;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_link get_link
     * 
     * @code bx_srv('bx_timeline', 'get_link', [...]); @endcode
     * 
     * Get content view page link. Is used in "Content Info Objects" system.
     * 
     * @param $iContentId integer value with content ID.
     * @return string value with view page link.
     * 
     * @see BxTimelineModule::serviceGetLink
     */
    /** 
     * @ref bx_timeline-get_link "get_link"
     */
    public function serviceGetLink ($iContentId)
    {
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContentId));
        if(empty($aEvent) || !is_array($aEvent))
            return '';

        return $this->_oConfig->getItemViewUrl($aEvent);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_thumb get_thumb
     * 
     * @code bx_srv('bx_timeline', 'get_thumb', [...]); @endcode
     * 
     * Get content thumbnail link. Is used in "Content Info Objects" system.
     * Note. In case of Timeline event an empty string is returned everytime.
     * 
     * @param $iContentId integer value with content ID.
     * @param $sTranscoder (optional) string value with transcoder name which should be applied to thumbnail image.
     * @return string value with thumbnail link.
     * 
     * @see BxTimelineModule::serviceGetThumb
     */
    /** 
     * @ref bx_timeline-get_thumb "get_thumb"
     */
    public function serviceGetThumb ($iContentId, $sTranscoder = '') 
    {
        return '';
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_info get_info
     * 
     * @code bx_srv('bx_timeline', 'get_info', [...]); @endcode
     * 
     * Get content info by content ID. Is used in "Content Info Objects" system.
     * 
     * @param $iContentId integer value with content ID.
     * @param $bSearchableFieldsOnly (optional) boolean value determining all info or "searchable fields" only will be returned.
     * @return an array with content info. Empty array is returned if something is wrong.
     * 
     * @see BxTimelineModule::serviceGetInfo
     */
    /** 
     * @ref bx_timeline-get_info "get_info"
     */
    public function serviceGetInfo ($iContentId, $bSearchableFieldsOnly = true)
    {
        $aContentInfo = $this->_oDb->getEvents(array(
        	'browse' => 'id', 
        	'value' => $iContentId)
        );

        return BxDolContentInfo::formatFields($aContentInfo);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_title get_title
     * 
     * @code bx_srv('bx_timeline', 'get_title', [...]); @endcode
     * 
     * Get content title by content ID. Is used in "Content Info Objects" system.
     * 
     * @param $iContentId integer value with content ID.
     * @return an array with content info. Empty array is returned if something is wrong.
     * 
     * @see BxTimelineModule::serviceGetTitle
     */
    /** 
     * @ref bx_timeline-get_title "get_title"
     */
    public function serviceGetTitle ($iContentId)
    {
        $sResult = parent::serviceGetTitle($iContentId);

        if($sResult != '' && get_mb_substr($sResult, 0, 1) == '_')
            $sResult = _t($sResult);

        return $sResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_text get_text
     * 
     * @code bx_srv('bx_timeline', 'get_text', [...]); @endcode
     * 
     * Get content text by content ID. Is used in "Content Info Objects" system.
     * 
     * @param $iContentId integer value with content ID.
     * @return an array with content info. Empty array is returned if something is wrong.
     * 
     * @see BxTimelineModule::serviceGetText
     */
    /** 
     * @ref bx_timeline-get_text "get_text"
     */
    public function serviceGetText ($iContentId)
    {
        $sResult = parent::serviceGetText($iContentId);
        if(!$sResult)
            return $sResult;
    
        return $this->_oConfig->getDescription($sResult, $this->_getFieldValue('FIELD_OBJECT_OWNER_ID', $iContentId), '');
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_search_result_unit get_search_result_unit
     * 
     * @code bx_srv('bx_timeline', 'get_search_result_unit', [...]); @endcode
     * 
     * Get search result unit by content ID. Is used in "Content Info Objects" system.
     * 
     * @param $iContentId integer value with content ID.
     * @param $sUnitTemplate (optional) string value with template name.
     * @return HTML string with search result unit. Empty string is returned if something is wrong.
     * 
     * @see BxTimelineModule::serviceGetSearchResultUnit
     */
    /** 
     * @ref bx_timeline-get_search_result_unit "get_search_result_unit"
     */
    public function serviceGetSearchResultUnit ($iContentId, $sUnitTemplate = '')
    {
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContentId));
        if(empty($aEvent) || !is_array($aEvent))
            return '';

        if(empty($sUnitTemplate))
            $sUnitTemplate = 'unit.html';

        return $this->_oTemplate->unit($aEvent, true, $sUnitTemplate);
    }
    
    public function serviceGetSearchableFields ($aInputsAdd = [])
    {
        $CNF = $this->_oConfig->CNF;

        foreach(['PUBLIC', 'PROFILE'] as $sDisplay) {
            $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD_' . $sDisplay], $this->_oTemplate);
            if(!$oForm || empty($oForm->aInputs))
                continue;

            $aInputsAdd = array_merge($aInputsAdd, $oForm->aInputs);
        }

        $aResult = parent::serviceGetSearchableFields($aInputsAdd);
        if(isset($aResult['text']))
            unset($aResult['text']);

        return array_merge($aResult, [
            $CNF['FIELD_TITLE'] => _t('_bx_timeline_txt_title'),
            $CNF['FIELD_TEXT'] => _t('_bx_timeline_txt_description'),
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_post get_block_post
     * 
     * @code bx_srv('bx_timeline', 'get_block_post', [...]); @endcode
     * 
     * Get Post block for a separate page.
     *
     * @param $iProfileId (optional) profile ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockPost
     */
    /** 
     * @ref bx_timeline-get_block_post "get_block_post"
     */
    public function serviceGetBlockPost($iProfileId = 0)
    {
    	if(empty($iProfileId) && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        if(empty($iProfileId) && isLogged())
            $iProfileId = bx_get_logged_profile_id();

        if($this->_bIsApi && ($aParams = bx_get('params')) !== false) {
            $iContextId = (int)($aParams['context_id'] ?? 0);
            if($iContextId)
                $iProfileId = abs($iContextId);
        }

        if(!$iProfileId)
            return [];

        $sType = BX_BASE_MOD_NTFS_TYPE_OWNER;
        return $this->_getBlockPost($iProfileId, [
            'type' => $sType,
            'form_display' => $this->_oConfig->getPostFormDisplay($sType)
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_post_profile get_block_post_profile
     * 
     * @code bx_srv('bx_timeline', 'get_block_post_profile', [...]); @endcode
     * 
     * Get Post block for the Profile page.
     *
     * @param $sProfileModule (optional) string value with profile based module name. Persons module is used by default.
     * @param $iProfileContentId (optional) profile's content ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockPostProfile
     */
    /** 
     * @ref bx_timeline-get_block_post_profile "get_block_post_profile"
     */
    public function serviceGetBlockPostProfile($sProfileModule = 'bx_persons', $iProfileContentId = 0)
    {
        
        if(empty($sProfileModule))
            return array();

    	if(empty($iProfileContentId) && bx_get('id') !== false)
            $iProfileContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        $oProfile = BxDolProfile::getInstanceByContentAndType($iProfileContentId, $sProfileModule);
        if(empty($oProfile))
            return array();

        $iProfileId = $oProfile->id();
        $sType = BX_BASE_MOD_NTFS_TYPE_OWNER;
        return $this->_getBlockPost($iProfileId, array(
            'type' => $sType,
            'form_display' => $this->_oConfig->getPostFormDisplay($sType)
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_post_home get_block_post_home
     * 
     * @code bx_srv('bx_timeline', 'get_block_post_home', [...]); @endcode
     * 
     * Get Post block for site's Home page.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockPostHome
     */
    /** 
     * @ref bx_timeline-get_block_post_home "get_block_post_home"
     */
    public function serviceGetBlockPostHome()
    {
        $iProfileId = 0;
        $sType = BX_BASE_MOD_NTFS_TYPE_PUBLIC;
        return $this->_getBlockPost($iProfileId, array(
            'type' => $sType,
            'form_display' => $this->_oConfig->getPostFormDisplay($sType)
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_post_account get_block_post_account
     * 
     * @code bx_srv('bx_timeline', 'get_block_post_account', [...]); @endcode
     * 
     * Get Post block for the Dashboard page.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockPostAccount
     */
    /** 
     * @ref bx_timeline-get_block_post_account "get_block_post_account"
     */
    public function serviceGetBlockPostAccount()
    {
        if(!isLogged())
            return '';

        $iProfileId = $this->getProfileId();

        if($this->_bIsApi && ($aParams = bx_get('params')) !== false) {
            $iContextId = (int)($aParams['context_id'] ?? 0);
            if($iContextId)
                $iProfileId = abs($iContextId);
        }

        $sType = BX_TIMELINE_TYPE_FEED;
        return $this->_getBlockPost($iProfileId, array(
            'type' => $sType,
            'form_display' => $this->_oConfig->getPostFormDisplay($sType)
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_post_custom get_block_post_custom
     * 
     * @code bx_srv('bx_timeline', 'get_block_post_custom', [...]); @endcode
     * 
     * Get Post block for the Custom timeline.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockPostCustom
     */
    /** 
     * @ref bx_timeline-get_block_post_custom "get_block_post_custom"
     */
    public function serviceGetBlockPostCustom($aParams)
    {
        if(!isLogged())
            return '';

        $iProfileId = $this->getProfileId();

        if (!isset($aParams['form_display']))
            $aParams['form_display'] = $this->_oConfig->getPostFormDisplay($aParams['type']);

        return $this->_getBlockPost($iProfileId, $aParams);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view get_block_view
     * 
     * @code bx_srv('bx_timeline', 'get_block_view', [...]); @endcode
     * 
     * Get Timeline View block for a separate page.
     *
     * @param $iProfileId (optional) profile ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockView
     */
    /** 
     * @ref bx_timeline-get_block_view "get_block_view"
     */
    public function serviceGetBlockView($iProfileId = 0)
    {
    	return $this->_serviceGetBlockView($iProfileId, array(
            'view' => BX_TIMELINE_VIEW_TIMELINE, 
            'type' => BX_BASE_MOD_NTFS_TYPE_OWNER, 
            'start' => -1, 
            'per_page' => -1, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_BASE_MOD_NTFS_TYPE_OWNER), 
            'timeline' => -1, 
            'filter' => '', 
            'modules' => array()
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_outline get_block_view_outline
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_outline', [...]); @endcode
     * 
     * Get Outline View block for a separate page.
     * 
     * @param $iProfileId (optional) profile ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewOutline
     */
    /** 
     * @ref bx_timeline-get_block_view_outline "get_block_view_outline"
     */
    public function serviceGetBlockViewOutline($iProfileId = 0)
    {
        return $this->_serviceGetBlockView($iProfileId, array(
            'view' => BX_TIMELINE_VIEW_OUTLINE, 
            'type' => BX_BASE_MOD_NTFS_TYPE_OWNER, 
            'start' => -1, 
            'per_page' => -1, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_BASE_MOD_NTFS_TYPE_OWNER), 
            'timeline' => -1, 
            'filter' => '', 
            'modules' => array()
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_profile get_block_view_profile
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_profile', [...]); @endcode
     * 
     * Get Timeline View block for the Profile page.
     * 
     * @param $sProfileModule (optional) string value with profile based module name. Persons module is used by default.
     * @param $iProfileContentId (optional) profile's content ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @param $iStart (optional) integer value with a page number. Is used in pagination.
     * @param $iPerPage (optional) integer value with a number of items per page. Is used in pagination. 
     * @param $sFilter (optional) string value with filter name.
     * @param $aModules (optional) an array of modules from which the events should be displayed. All available modules are used by default.
     * @param $iTimeline (optional) integer value determining whether the timeline should be displayed or not.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewProfile
     */
    /** 
     * @ref bx_timeline-get_block_view_profile "get_block_view_profile"
     */
    public function serviceGetBlockViewProfile($sProfileModule = 'bx_persons', $iProfileContentId = 0, $iStart = -1, $iPerPage = -1, $sFilter = '', $aModules = array(), $iTimeline = -1)
    {
        return $this->_serviceGetBlockViewProfile($sProfileModule, $iProfileContentId, array(
            'view' => BX_TIMELINE_VIEW_TIMELINE, 
            'type' => BX_BASE_MOD_NTFS_TYPE_OWNER, 
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_BASE_MOD_NTFS_TYPE_OWNER), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_profile_outline get_block_view_profile_outline
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_profile_outline', [...]); @endcode
     * 
     * Get Outline View block for the Profile page.
     * 
     * @param $sProfileModule (optional) string value with profile based module name. Persons module is used by default.
     * @param $iProfileContentId (optional) profile's content ID. If empty value is provided, an attempt to get it from GET/POST arrays will be performed.
     * @param $iStart (optional) integer value with a page number. Is used in pagination.
     * @param $iPerPage (optional) integer value with a number of items per page. Is used in pagination. 
     * @param $sFilter (optional) string value with filter name.
     * @param $aModules (optional) an array of modules from which the events should be displayed. All available modules are used by default.
     * @param $iTimeline (optional) integer value determining whether the timeline should be displayed or not.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewProfileOutline
     */
    /** 
     * @ref bx_timeline-get_block_view_profile_outline "get_block_view_profile_outline"
     */
    public function serviceGetBlockViewProfileOutline($sProfileModule = 'bx_persons', $iProfileContentId = 0, $iStart = -1, $iPerPage = -1, $sFilter = '', $aModules = array(), $iTimeline = -1)
    {
        return $this->_serviceGetBlockViewProfile($sProfileModule, $iProfileContentId, array(
            'view' => BX_TIMELINE_VIEW_OUTLINE, 
            'type' => BX_BASE_MOD_NTFS_TYPE_OWNER, 
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_BASE_MOD_NTFS_TYPE_OWNER), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    public function serviceGetBlockViewsCustom($aParams = array())
    {
        $aParams = array_merge(array(
            'view' => BX_TIMELINE_VIEW_TIMELINE, 
            'type' => BX_BASE_MOD_NTFS_TYPE_PUBLIC,
            'owner_id' => 0,
        ), $aParams);

    	return $this->_serviceGetBlockViews($aParams);
    }

    public function serviceGetBlockViewsTimeline($sType = BX_BASE_MOD_NTFS_TYPE_PUBLIC, $iProfileId = 0, $iStart = -1, $iPerPage = -1, $iTimeline = -1, $sFilter = '', $aModules = array())
    {
        return $this->_serviceGetBlockViews(array(
            'view' => BX_TIMELINE_VIEW_TIMELINE, 
            'type' => $sType,
            'owner_id' => $iProfileId,
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage($sType), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }
    
    public function serviceGetBlockViewsOutline($sType = BX_BASE_MOD_NTFS_TYPE_PUBLIC, $iProfileId = 0, $iStart = -1, $iPerPage = -1, $iTimeline = -1, $sFilter = '', $aModules = array())
    {
        return $this->_serviceGetBlockViews(array(
            'view' => BX_TIMELINE_VIEW_OUTLINE, 
            'type' => $sType,
            'owner_id' => $iProfileId,
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage($sType), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_home get_block_view_home
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_home', [...]); @endcode
     * 
     * Get Timeline View block for site's Home page.
     * 
     * @param $iProfileId (optional) profile ID. 0 should be used here.
     * @param $iStart (optional) integer value with a page number. Is used in pagination.
     * @param $iPerPage (optional) integer value with a number of items per page. Is used in pagination.
     * @param $iTimeline (optional) integer value determining whether the timeline should be displayed or not. 
     * @param $sFilter (optional) string value with filter name.
     * @param $aModules (optional) an array of modules from which the events should be displayed. All available modules are used by default.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewHome
     */
    /** 
     * @ref bx_timeline-get_block_view_home "get_block_view_home"
     */
    public function serviceGetBlockViewHome($iProfileId = 0, $iStart = -1, $iPerPage = -1, $iTimeline = -1, $sFilter = '', $aModules = array())
    {
        return $this->_serviceGetBlockViewHome(array(
            'view' => BX_TIMELINE_VIEW_TIMELINE, 
            'type' => BX_BASE_MOD_NTFS_TYPE_PUBLIC,
            'owner_id' => $iProfileId,
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_BASE_MOD_NTFS_TYPE_PUBLIC), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_home_outline get_block_view_home_outline
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_home_outline', [...]); @endcode
     * 
     * Get Outline View block for site's Home page.
     * 
     * @param $iProfileId (optional) profile ID. 0 should be used here.
     * @param $iStart (optional) integer value with a page number. Is used in pagination.
     * @param $iPerPage (optional) integer value with a number of items per page. Is used in pagination.
     * @param $iTimeline (optional) integer value determining whether the timeline should be displayed or not. 
     * @param $sFilter (optional) string value with filter name.
     * @param $aModules (optional) an array of modules from which the events should be displayed. All available modules are used by default.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewHomeOutline
     */
    /** 
     * @ref bx_timeline-get_block_view_home_outline "get_block_view_home_outline"
     */
    public function serviceGetBlockViewHomeOutline($iProfileId = 0, $iStart = -1, $iPerPage = -1, $iTimeline = -1, $sFilter = '', $aModules = array())
    {
        return $this->_serviceGetBlockViewHome(array(
            'view' => BX_TIMELINE_VIEW_OUTLINE, 
            'type' => BX_BASE_MOD_NTFS_TYPE_PUBLIC,
            'owner_id' => $iProfileId,
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_BASE_MOD_NTFS_TYPE_PUBLIC), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

	/**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_hot get_block_view_hot
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_hot', [...]); @endcode
     * 
     * Get Timeline View block with Hot public events.
     * 
     * @param $iProfileId (optional) profile ID. 0 should be used here.
     * @param $iStart (optional) integer value with a page number. Is used in pagination.
     * @param $iPerPage (optional) integer value with a number of items per page. Is used in pagination.
     * @param $iTimeline (optional) integer value determining whether the timeline should be displayed or not. 
     * @param $sFilter (optional) string value with filter name.
     * @param $aModules (optional) an array of modules from which the events should be displayed. All available modules are used by default.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewHot
     */
    /** 
     * @ref bx_timeline-get_block_view_hot "get_block_view_hot"
     */
    public function serviceGetBlockViewHot($iProfileId = 0, $iStart = -1, $iPerPage = -1, $iTimeline = -1, $sFilter = '', $aModules = array())
    {
        return $this->_serviceGetBlockViewHot(array(
            'view' => BX_TIMELINE_VIEW_TIMELINE, 
            'type' => BX_TIMELINE_TYPE_HOT,
            'owner_id' => $iProfileId,
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_TIMELINE_TYPE_HOT), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_hot_outline get_block_view_hot_outline
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_hot_outline', [...]); @endcode
     * 
     * Get Outline View block with Hot public events.
     * 
     * @param $iProfileId (optional) profile ID. 0 should be used here.
     * @param $iStart (optional) integer value with a page number. Is used in pagination.
     * @param $iPerPage (optional) integer value with a number of items per page. Is used in pagination.
     * @param $iTimeline (optional) integer value determining whether the timeline should be displayed or not. 
     * @param $sFilter (optional) string value with filter name.
     * @param $aModules (optional) an array of modules from which the events should be displayed. All available modules are used by default.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewHotOutline
     */
    /** 
     * @ref bx_timeline-get_block_view_hot_outline "get_block_view_hot_outline"
     */
    public function serviceGetBlockViewHotOutline($iProfileId = 0, $iStart = -1, $iPerPage = -1, $iTimeline = -1, $sFilter = '', $aModules = array())
    {
        return $this->_serviceGetBlockViewHot(array(
            'view' => BX_TIMELINE_VIEW_OUTLINE, 
            'type' => BX_TIMELINE_TYPE_HOT, 
            'owner_id' => $iProfileId, 
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_TIMELINE_TYPE_HOT), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_account get_block_view_account
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_account', [...]); @endcode
     * 
     * Get Timeline View block for the Dashboard page.
     * 
     * @param $iProfileId (optional) profile ID. 0 should be used here.
     * @param $iStart (optional) integer value with a page number. Is used in pagination.
     * @param $iPerPage (optional) integer value with a number of items per page. Is used in pagination.
     * @param $iTimeline (optional) integer value determining whether the timeline should be displayed or not. 
     * @param $sFilter (optional) string value with filter name.
     * @param $aModules (optional) an array of modules from which the events should be displayed. All available modules are used by default.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewAccount
     */
    /** 
     * @ref bx_timeline-get_block_view_account "get_block_view_account"
     */
    public function serviceGetBlockViewAccount($iProfileId = 0, $iStart = -1, $iPerPage = -1, $iTimeline = -1, $sFilter = '', $aModules = array())
    {
        if(!isLogged())
            return '';

        return $this->_serviceGetBlockViewByType(array(
            'view' => BX_TIMELINE_VIEW_TIMELINE, 
            'type' => BX_TIMELINE_TYPE_FEED, 
            'owner_id' => $iProfileId, 
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_TIMELINE_TYPE_FEED), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_account_outline get_block_view_account_outline
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_account_outline', [...]); @endcode
     * 
     * Get Outline View block for the Dashboard page.
     * 
     * @param $iProfileId (optional) profile ID. 0 should be used here.
     * @param $iStart (optional) integer value with a page number. Is used in pagination.
     * @param $iPerPage (optional) integer value with a number of items per page. Is used in pagination.
     * @param $iTimeline (optional) integer value determining whether the timeline should be displayed or not. 
     * @param $sFilter (optional) string value with filter name.
     * @param $aModules (optional) an array of modules from which the events should be displayed. All available modules are used by default.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewAccountOutline
     */
    /** 
     * @ref bx_timeline-get_block_view_account_outline "get_block_view_account_outline"
     */
    public function serviceGetBlockViewAccountOutline($iProfileId = 0, $iStart = -1, $iPerPage = -1, $iTimeline = -1, $sFilter = '', $aModules = array())
    {
        if(!isLogged())
            return '';

        return $this->_serviceGetBlockViewByType(array(
            'view' => BX_TIMELINE_VIEW_OUTLINE, 
            'type' => BX_TIMELINE_TYPE_FEED,
            'owner_id' => $iProfileId, 
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'per_page_default' => $this->_oConfig->getPerPage(BX_TIMELINE_TYPE_FEED), 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_view_custom get_block_view_custom
     * 
     * @code bx_srv('bx_timeline', 'get_block_view_custom', [...]); @endcode
     * 
     * Get custom Timeline View block.
     *
     * @param $aParams (optional) an array with block parameneters.
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockViewCustom
     * 
     * @example Events from followed contexts by type (groups, events, spaces, etc). Groups in this example.
     * array ('module' => 'bx_timeline', 'method' => 'get_block_view_custom', 'params' => array (0 => array ('view' => 'timeline', 'type' => 'connected_contexts', 'context' => 'bx_groups')))
     * 
     * @example Events from "For You" (Feed + Hot) feed.
     * array ('module' => 'bx_timeline', 'method' => 'get_block_view_custom', 'params' => array (0 => array ('view' => 'timeline', 'type' => 'feed_and_hot')))
     */
    /** 
     * @ref bx_timeline-get_block_view_custom "get_block_view_custom"
     */
    public function serviceGetBlockViewCustom($aParams = [])
    {
    	return $this->_serviceGetBlockViewByType($aParams);
    }

    public function serviceGetBlockViewChannels($sView = 'timeline')
    {
        return $this->serviceGetBlockViewCustom([
            'view' => $sView, 
            'type' => 'channels'
        ]);
    }
    
    public function serviceGetBlockViewFeedAndHot($sView = 'timeline')
    {
        return $this->serviceGetBlockViewCustom([
            'view' => $sView, 
            'type' => 'feed_and_hot'
        ]);
    }
    
    public function serviceGetBlockViewContexts($sView = 'timeline', $sContextModule = 'bx_groups')
    {
        return $this->serviceGetBlockViewCustom([
            'view' => $sView, 
            'type' => 'connected_contexts',
            'context' => $sContextModule
        ]);
    }

    public function serviceGetBlockViewMedia($sView = 'timeline', $mixedMedia = ['files', 'images', 'videos'])
    {
        return $this->serviceGetBlockViewCustom([
            'view' => $sView, 
            'type' => 'feed',
            'media' => $mixedMedia
        ]);
    }

    public function serviceGetBlockViewMediaFiles($sView = 'timeline')
    {
        return $this->serviceGetBlockViewMedia($sView, 'files');
    }

    public function serviceGetBlockViewMediaImages($sView = 'timeline')
    {
        return $this->serviceGetBlockViewMedia($sView, 'images');
    }

    public function serviceGetBlockViewMediaVideos($sView = 'timeline')
    {
        return $this->serviceGetBlockViewMedia($sView, 'videos');
    }

    public function serviceGetBlockMenuDb($aParams = [])
    {
        $aParams = $this->_prepareParams(array_merge([
            'name' => BX_TIMELINE_NAME_VIEWS_DB,
            'view' => BX_TIMELINE_VIEW_TIMELINE,
            'type' => BX_TIMELINE_TYPE_FEED,
            'owner_id' => $this->getProfileId()
        ], $aParams));

        if(($sType = $this->_oConfig->getUserChoice('type')) !== false)
            $this->_setParamsType($sType, $aParams);

        $sMenu = $this->_oConfig->getObject('menu_feeds');
        if(isset($aParams['menu_feeds'])) {
            $sMenu = $aParams['menu_feeds'];
            unset($aParams['menu_feeds']);
        }
        $oMenu = BxDolMenu::getObjectInstance($sMenu);
        if(!$oMenu)
            return '';

        $sSelectedModule = $this->getName();
        $sSelectedName = $aParams['type'];
        if(($aModule = $this->_oDb->getModuleByName($aParams['type']))) {
            $sSelectedModule = $aModule['name'];
            $sSelectedName = $aModule['uri'];
        }

        $oMenu->setSelected($sSelectedModule, $sSelectedName);
        $oMenu->setBrowseParams($aParams);
        return $oMenu->getCode();
    }

    public function serviceGetBlockViewsDb($aParams = [])
    {
        $iProfileId = $this->getProfileId();

        $aParams = $this->_prepareParams(array_merge([
            'name' => BX_TIMELINE_NAME_VIEWS_DB,
            'view' => BX_TIMELINE_VIEW_TIMELINE,
            'type' => BX_TIMELINE_TYPE_FEED,
            'viewer_id' => $iProfileId,
            'owner_id' => $iProfileId
        ], $aParams));

        if(($sType = $this->_oConfig->getUserChoice('type', $aParams['viewer_id'])) !== false)
            $this->_setParamsType($sType, $aParams);        

        $this->_iOwnerId = $aParams['owner_id'];
        return $this->_oTemplate->getViewsDbBlock($aParams);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-page_blocks Page Blocks
     * @subsubsection bx_timeline-get_block_item get_block_item
     * 
     * @code bx_srv('bx_timeline', 'get_block_item', [...]); @endcode
     * 
     * Get View Item block.
     * 
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetBlockItem
     */
    /** 
     * @ref bx_timeline-get_block_item "get_block_item"
     */
    public function serviceGetBlockItem()
    {
        $iItemId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iItemId)
            return array();

        $aParams = $this->_prepareParams(array(
            'view' => BX_TIMELINE_VIEW_ITEM, 
            'type' => BX_TIMELINE_TYPE_ITEM
        ));

        $aItemData = $this->getItemData($iItemId, $aParams);

        if (bx_is_api()){
            $aItemData['event'] = $this->_oTemplate->getPostApi($aItemData['event'], $aParams);
            return [bx_api_get_block('feed_item', $aItemData)];
        }
        
        return $this->_oTemplate->getItemBlock($aItemData, $aParams);
    }
    
    public function serviceGetBlockItemContent()
    {
        $iItemId = bx_process_input(bx_get('id'), BX_DATA_INT);
        $sMode = bx_process_input(bx_get('mode'));
        if(!$iItemId || !$sMode)
            return '';
            
        return $this->_oTemplate->getItemBlockContent($iItemId, $sMode);
    }
    
    public function serviceGetBlockItemInfo()
    {
        $iItemId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iItemId)
            return '';

        return $this->_oTemplate->getItemBlockInfo($iItemId);
    }

    public function serviceGetBlockItemComments()
    {
        $iItemId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iItemId)
            return '';

        return $this->_oTemplate->getItemBlockComments($iItemId);
    }

    public function serviceGetBlockMuted($iProfileId = 0)
    {
        if(!isLogged())
            return MsgBox(_t('_Access denied'));

        if($iProfileId == 0)
            $iProfileId = $this->_iProfileId;

        $oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject('grid_mute'));
        if(!$oGrid)
            return MsgBox('_Empty');

        $oGrid->setProfile($iProfileId);
        return $oGrid->getCode();
    }

    public function serviceGetPost($mixedEvent, $aParams = [])
    {
        if(!empty($mixedEvent) && !is_array($mixedEvent))
            $mixedEvent = $this->_oDb->getContentInfoById((int)$mixedEvent);

        if(empty($mixedEvent) || !is_array($mixedEvent))
            return '';

        $sPost = $this->_oTemplate->getPost($mixedEvent, $this->_prepareParams(array_merge([
            'view' => BX_TIMELINE_VIEW_ITEM, 
            'type' => BX_TIMELINE_TYPE_ITEM
        ], $aParams)));

        if(empty($sPost))
            return '';

        return isset($aParams['return_data_type']) && $aParams['return_data_type'] == 'array' ? $mixedEvent : $sPost;
    }

    public function serviceGetTimelineRepostAllowedView($aEvent)
    {
        return isset($aEvent['content']['allowed_view']) ? $aEvent['content']['allowed_view'] : CHECK_ACTION_RESULT_ALLOWED;
    }

    public function serviceGetReputationData()
    {
    	$sModule = $this->_aModule['name'];

        return [
            'handlers' => [
                ['group' => $sModule . '_object', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'post_common', 'points_active' => 3, 'points_passive' => 0],
                ['group' => $sModule . '_object', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'delete', 'points_active' => -3, 'points_passive' => 0],

                ['group' => $sModule . '_repost', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'repost', 'points_active' => 1, 'points_passive' => 2],
                ['group' => $sModule . '_repost', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'delete_repost', 'points_active' => -1, 'points_passive' => -2],

                ['group' => $sModule . '_comment', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'commentPost', 'points_active' => 2, 'points_passive' => 1],
                ['group' => $sModule . '_comment', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'commentRemoved', 'points_active' => -2, 'points_passive' => -1],

                ['group' => $sModule . '_vote', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVote', 'points_active' => 1, 'points_passive' => 1],
                ['group' => $sModule . '_vote', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'undoVote', 'points_active' => -1, 'points_passive' => -1],

                ['group' => $sModule . '_reaction', 'type' => 'insert', 'alert_unit' => $sModule . '_reactions', 'alert_action' => 'doVote', 'points_active' => 1, 'points_passive' => 1],
                ['group' => $sModule . '_reaction', 'type' => 'delete', 'alert_unit' => $sModule . '_reactions', 'alert_action' => 'undoVote', 'points_active' => -1, 'points_passive' => -1],

                ['group' => $sModule . '_score_up', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVoteUp', 'points_active' => 1, 'points_passive' => 1],
                ['group' => $sModule . '_score_up', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'undoVoteUp', 'points_active' => -1, 'points_passive' => -1],

                ['group' => $sModule . '_score_down', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVoteDown', 'points_active' => 1, 'points_passive' => -1],
                ['group' => $sModule . '_score_down', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'undoVoteDown', 'points_active' => -1, 'points_passive' => 1],
            ],
            'alerts' => [
                ['unit' => $sModule, 'action' => 'post_common'],
                ['unit' => $sModule, 'action' => 'delete'],

                ['unit' => $sModule, 'action' => 'repost'],
                ['unit' => $sModule, 'action' => 'delete_repost'],
                
                ['unit' => $sModule, 'action' => 'commentPost'],
                ['unit' => $sModule, 'action' => 'commentRemoved'],

                ['unit' => $sModule, 'action' => 'doVote'],
                ['unit' => $sModule, 'action' => 'undoVote'],

                ['unit' => $sModule . '_reactions', 'action' => 'doVote'],
                ['unit' => $sModule . '_reactions', 'action' => 'undoVote'],

                ['unit' => $sModule, 'action' => 'doVoteUp'],
                ['unit' => $sModule, 'action' => 'undoVoteUp'],
                ['unit' => $sModule, 'action' => 'doVoteDown'],
                ['unit' => $sModule, 'action' => 'undoVoteDown'],
            ]
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-integration_notifications Integration with Notifications
     * @subsubsection bx_timeline-get_notifications_data get_notifications_data
     * 
     * @code bx_srv('bx_timeline', 'get_notifications_data', [...]); @endcode
     * 
     * Data for Notifications module.
     * 
     * @return an array with special format.
     * 
     * @see BxTimelineModule::serviceGetNotificationsData
     */
    /** 
     * @ref bx_timeline-get_notifications_data "get_notifications_data"
     */
    public function serviceGetNotificationsData()
    {
    	$sModule = $this->_aModule['name'];

        return array(
            'handlers' => array(
                array('group' => $sModule . '_object', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'post_common', 'module_name' => $sModule, 'module_method' => 'get_notifications_post', 'module_class' => 'Module'),
                array('group' => $sModule . '_object', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'delete'),

                array('group' => $sModule . '_object_publish_failed', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'publish_failed', 'module_name' => $sModule, 'module_method' => 'get_notifications_post_publish_failed', 'module_class' => 'Module'),
                array('group' => $sModule . '_object_publish_succeeded', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'publish_succeeded', 'module_name' => $sModule, 'module_method' => 'get_notifications_post_publish_succeeded', 'module_class' => 'Module'),

                array('group' => $sModule . '_repost', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'repost', 'module_name' => $sModule, 'module_method' => 'get_notifications_repost', 'module_class' => 'Module'),
                array('group' => $sModule . '_repost', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'delete_repost'),

                array('group' => $sModule . '_comment', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'commentPost', 'module_name' => $sModule, 'module_method' => 'get_notifications_comment', 'module_class' => 'Module'),
                array('group' => $sModule . '_comment', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'commentRemoved'),

                array('group' => $sModule . '_reply', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'replyPost', 'module_name' => $sModule, 'module_method' => 'get_notifications_reply', 'module_class' => 'Module'),
                array('group' => $sModule . '_reply', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'replyRemoved'),

                array('group' => $sModule . '_vote', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVote', 'module_name' => $sModule, 'module_method' => 'get_notifications_vote', 'module_class' => 'Module'),
                array('group' => $sModule . '_vote', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'undoVote'),

                array('group' => $sModule . '_reaction', 'type' => 'insert', 'alert_unit' => $sModule . '_reactions', 'alert_action' => 'doVote', 'module_name' => $sModule, 'module_method' => 'get_notifications_reaction', 'module_class' => 'Module'),
                array('group' => $sModule . '_reaction', 'type' => 'delete', 'alert_unit' => $sModule . '_reactions', 'alert_action' => 'undoVote'),

                array('group' => $sModule . '_score_up', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVoteUp', 'module_name' => $sModule, 'module_method' => 'get_notifications_score_up', 'module_class' => 'Module'),

                array('group' => $sModule . '_score_down', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVoteDown', 'module_name' => $sModule, 'module_method' => 'get_notifications_score_down', 'module_class' => 'Module'),

                //--- Moderation related: For 'admins'.
                ['group' => $sModule . '_object_reported', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'reported_content', 'module_name' => $sModule, 'module_method' => 'get_notifications_post_reported', 'module_class' => 'Module'],
            ),
            'settings' => array(
                array('group' => 'content', 'unit' => $sModule, 'action' => 'post_common', 'types' => array('personal', 'follow_member', 'follow_context')),
                array('group' => 'content', 'unit' => $sModule, 'action' => 'publish_failed', 'types' => array('personal')),
                array('group' => 'content', 'unit' => $sModule, 'action' => 'publish_succeeded', 'types' => array('personal')),
                array('group' => 'content', 'unit' => $sModule, 'action' => 'repost', 'types' => array('personal', 'follow_member', 'follow_context')),
                array('group' => 'comment', 'unit' => $sModule, 'action' => 'commentPost', 'types' => array('personal', 'follow_member', 'follow_context')),
                array('group' => 'reply', 'unit' => $sModule, 'action' => 'replyPost', 'types' => array('personal')),
                array('group' => 'vote', 'unit' => $sModule, 'action' => 'doVote', 'types' => array('personal', 'follow_member', 'follow_context')),
                array('group' => 'vote', 'unit' => $sModule . '_reactions', 'action' => 'doVote', 'types' => array('personal', 'follow_member', 'follow_context')),
                array('group' => 'score_up', 'unit' => $sModule, 'action' => 'doVoteUp', 'types' => array('personal', 'follow_member', 'follow_context')),
                array('group' => 'score_down', 'unit' => $sModule, 'action' => 'doVoteDown', 'types' => array('personal', 'follow_member', 'follow_context')),
                
                //--- Moderation related: For 'admins'.
                ['group' => 'action_required', 'unit' => $sModule, 'action' => 'reported_content', 'types' => ['personal']],
            ),
            'alerts' => array(
                array('unit' => $sModule, 'action' => 'post_common'),
                array('unit' => $sModule, 'action' => 'publish_failed'),
                array('unit' => $sModule, 'action' => 'publish_succeeded'),
                array('unit' => $sModule, 'action' => 'delete'),

                array('unit' => $sModule, 'action' => 'repost'),
                array('unit' => $sModule, 'action' => 'delete_repost'),
                
                array('unit' => $sModule, 'action' => 'commentPost'),
                array('unit' => $sModule, 'action' => 'commentRemoved'),

                array('unit' => $sModule, 'action' => 'replyPost'),
                array('unit' => $sModule, 'action' => 'replyRemoved'),

                array('unit' => $sModule, 'action' => 'doVote'),
                array('unit' => $sModule, 'action' => 'undoVote'),

                array('unit' => $sModule . '_reactions', 'action' => 'doVote'),
                array('unit' => $sModule . '_reactions', 'action' => 'undoVote'),

                array('unit' => $sModule, 'action' => 'doVoteUp'),
                array('unit' => $sModule, 'action' => 'doVoteDown'),

                //--- Moderation related: For 'admins'.
                ['unit' => $sModule, 'action' => 'reported_content'],
            )
        );
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-integration_notifications Integration with Notifications
     * @subsubsection bx_timeline-get_notifications_repost get_notifications_repost
     * 
     * @code bx_srv('bx_timeline', 'get_notifications_repost', [...]); @endcode
     * 
     * Get data for Repost event to display in Notifications module.
     * 
     * @param $aEvent an array with event description.
     * @return an array with special format.
     * 
     * @see BxTimelineModule::serviceGetNotificationsRepost
     */
    /** 
     * @ref bx_timeline-get_notifications_repost "get_notifications_repost"
     */
    public function serviceGetNotificationsRepost($aEvent)
    {
        $aResult = $this->serviceGetNotificationsPost($aEvent);
        $aResult['lang_key'] = '_bx_timeline_txt_object_reposted';

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-integration_notifications Integration with Notifications
     * @subsubsection bx_timeline-get_notifications_post get_notifications_post
     * 
     * @code bx_srv('bx_timeline', 'get_notifications_post', [...]); @endcode
     * 
     * Get data for Post event to display in Notifications module.
     * 
     * @param $aEvent an array with event description.
     * @return an array with special format.
     * 
     * @see BxTimelineModule::serviceGetNotificationsPost
     */
    /** 
     * @ref bx_timeline-get_notifications_post "get_notifications_post"
     */
    public function serviceGetNotificationsPost($aEvent)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iContent = (int)$aEvent['object_id'];
        $aContent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContent));
        if(empty($aContent) || !is_array($aContent))
            return [];

        if($this->_oConfig->isSystem($aContent['type'], $aContent['action']))
            $iEntryAuthor = (int)$aContent['owner_id'];
        else
            $iEntryAuthor = (int)$aContent['object_id'];

        $sEntryCaption = call_user_func_array(array($this->_oConfig, 'getTitleShort'), !empty($aContent['title']) ? array($aContent['title']) : array($aContent['description'], $aContent['object_id']));
        $sEntrySummary = $this->_oConfig->getTitle($aContent['description'], $aContent['object_id'], false);

        return [
            'entry_sample' => $CNF['T']['txt_sample_single_ext'],
            'entry_url' => bx_absolute_url($this->_oConfig->getItemViewUrl($aContent, false), '{bx_url_root}'),
            'entry_caption' => $sEntryCaption,
            'entry_summary' => $sEntrySummary,
            'entry_author' => $iEntryAuthor,
            'lang_key' => '', //may be empty or not specified. In this case the default one from Notification module will be used.
        ];
    }

    public function serviceGetNotificationsPostReported($aEvent)
    {
        $aResult = $this->serviceGetNotificationsPost($aEvent);

        /**
         * Unset Entry Author because the notification is addressed to 'admins'.
         */
        if(isset($aResult['entry_author']))
            unset($aResult['entry_author']);

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-integration_notifications Integration with Notifications
     * @subsubsection bx_timeline-get_notifications_comment get_notifications_comment
     * 
     * @code bx_srv('bx_timeline', 'get_notifications_comment', [...]); @endcode
     * 
     * Get data for Post Comment event to display in Notifications module.
     * 
     * @param $aEvent an array with event description.
     * @return an array with special format.
     * 
     * @see BxTimelineModule::serviceGetNotificationsComment
     */
    /** 
     * @ref bx_timeline-get_notifications_comment "get_notifications_comment"
     */
    public function serviceGetNotificationsComment($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $iContent = (int)$aEvent['object_id'];
        $aContent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContent));
        if(empty($aContent) || !is_array($aContent))
            return [];

        $oComment = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $iContent);
        if(!$oComment || !$oComment->isEnabled())
            return [];

        $sEntryCaption = call_user_func_array(array($this->_oConfig, 'getTitleShort'), !empty($aContent['title']) ? array($aContent['title']) : array($aContent['description'], $aContent['object_id']));
        $sEntrySummary = $this->_oConfig->getTitle($aContent['description'], $aContent['object_id'], false);

        $iCommentId = (int)$aEvent['subobject_id'];

        return [
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => bx_absolute_url($this->_oConfig->getItemViewUrl($aContent, false), '{bx_url_root}'),
            'entry_caption' => $sEntryCaption,
            'entry_summary' => $sEntrySummary,
            'subentry_sample' => $CNF['T']['txt_sample_comment_single'],
            'subentry_url' => $oComment->getItemUrl($iCommentId, '{bx_url_root}'),
            'subentry_url_api' => $oComment->getItemUrlApi($iCommentId, '{bx_url_root}'),
            'subentry_summary' => $oComment->getViewText($iCommentId),
            'lang_key' => '', //may be empty or not specified. In this case the default one from Notification module will be used.
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-integration_notifications Integration with Notifications
     * @subsubsection bx_timeline-get_notifications_reply get_notifications_reply
     * 
     * @code bx_srv('bx_timeline', 'get_notifications_reply', [...]); @endcode
     * 
     * Get data for Reply to Comment event to display in Notifications module.
     * 
     * @param $aEvent an array with event description.
     * @return an array with special format.
     * 
     * @see BxTimelineModule::serviceGetNotificationsReply
     */
    /** 
     * @ref bx_timeline-get_notifications_reply "get_notifications_reply"
     */
    public function serviceGetNotificationsReply($aEvent)
    {
        return parent::serviceGetNotificationsReply($aEvent);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-integration_notifications Integration with Notifications
     * @subsubsection bx_timeline-get_notifications_vote get_notifications_vote
     * 
     * @code bx_srv('bx_timeline', 'get_notifications_vote', [...]); @endcode
     * 
     * Get data for Vote event to display in Notifications module.
     * 
     * @param $aEvent an array with event description.
     * @return an array with special format.
     * 
     * @see BxTimelineModule::serviceGetNotificationsVote
     */
    /** 
     * @ref bx_timeline-get_notifications_vote "get_notifications_vote"
     */
    public function serviceGetNotificationsVote($aEvent)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iContent = (int)$aEvent['object_id'];
        $aContent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContent));
        if(empty($aContent) || !is_array($aContent))
            return [];

        $oVote = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES'], $iContent);
        if(!$oVote || !$oVote->isEnabled())
            return [];

        $sEntryCaption = call_user_func_array(array($this->_oConfig, 'getTitleShort'), !empty($aContent['title']) ? array($aContent['title']) : array($aContent['description'], $aContent['object_id']));
        $sEntrySummary = $this->_oConfig->getTitle($aContent['description'], $aContent['object_id'], false);

        return [
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => bx_absolute_url($this->_oConfig->getItemViewUrl($aContent, false), '{bx_url_root}'),
            'entry_caption' => $sEntryCaption,
            'entry_summary' => $sEntrySummary,
            'subentry_sample' => $CNF['T']['txt_sample_vote_single'],
            'lang_key' => '', //may be empty or not specified. In this case the default one from Notification module will be used.
        ];
    }

    /**
     * Entry post vote for Notifications module
     */
    public function serviceGetNotificationsReaction($aEvent)
    {
    	$CNF = &$this->_oConfig->CNF;

    	$iContent = (int)$aEvent['object_id'];
        $aContent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContent));
        if(empty($aContent) || !is_array($aContent))
            return [];

        $oReaction = BxDolVote::getObjectInstance($CNF['OBJECT_REACTIONS'], $iContent);
        if(!$oReaction || !$oReaction->isEnabled())
            return [];

        $aSubentry = $oReaction->getTrackBy(array('type' => 'id', 'id' => (int)$aEvent['subobject_id']));
        if(empty($aSubentry) || !is_array($aSubentry))
            return [];

        $aSubentrySampleParams = array();
        $aReaction = $oReaction->getReaction($aSubentry['reaction']);
        if(!empty($aReaction['title']))
            $aSubentrySampleParams[] = $aReaction['title'];
        else
            $aSubentrySampleParams[] = '_undefined';

        $sEntryCaption = call_user_func_array(array($this->_oConfig, 'getTitleShort'), !empty($aContent['title']) ? array($aContent['title']) : array($aContent['description'], $aContent['object_id']));
        $sEntrySummary = $this->_oConfig->getTitle($aContent['description'], $aContent['object_id'], false);

        return [
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => bx_absolute_url($this->_oConfig->getItemViewUrl($aContent, false), '{bx_url_root}'),
            'entry_caption' => $sEntryCaption,
            'entry_summary' => $sEntrySummary,
            'subentry_sample' => $CNF['T']['txt_sample_reaction_single'],
            'subentry_sample_params' => $aSubentrySampleParams,
            'lang_key' => '', //may be empty or not specified. In this case the default one from Notification module will be used.
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-integration_notifications Integration with Notifications
     * @subsubsection bx_timeline-get_notifications_score_up get_notifications_score_up
     * 
     * @code bx_srv('bx_timeline', 'get_notifications_score_up', [...]); @endcode
     * 
     * Get data for Score Up Vote event to display in Notifications module.
     * 
     * @param $aEvent an array with event description.
     * @return an array with special format.
     * 
     * @see BxTimelineModule::serviceGetNotificationsScoreUp
     */
    /** 
     * @ref bx_timeline-get_notifications_score_up "get_notifications_score_up"
     */
    public function serviceGetNotificationsScoreUp($aEvent)
    {
    	return $this->_serviceGetNotificationsScore('up', $aEvent);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-integration_notifications Integration with Notifications
     * @subsubsection bx_timeline-get_notifications_score_down get_notifications_score_down
     * 
     * @code bx_srv('bx_timeline', 'get_notifications_score_down', [...]); @endcode
     * 
     * Get data for Score Down Vote event to display in Notifications module.
     * 
     * @param $aEvent an array with event description.
     * @return an array with special format.
     * 
     * @see BxTimelineModule::serviceGetNotificationsScoreDown
     */
    /** 
     * @ref bx_timeline-get_notifications_score_down "get_notifications_score_down"
     */
    public function serviceGetNotificationsScoreDown($aEvent)
    {
    	return $this->_serviceGetNotificationsScore('down', $aEvent);
    }


    protected function _serviceGetNotificationsScore($sType, $aEvent)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iContent = (int)$aEvent['object_id'];
        $aContent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContent));
        if(empty($aContent) || !is_array($aContent))
            return [];

        $oScore = BxDolScore::getObjectInstance($CNF['OBJECT_SCORES'], $iContent);
        if(!$oScore || !$oScore->isEnabled())
            return [];

        $sEntryCaption = call_user_func_array(array($this->_oConfig, 'getTitleShort'), !empty($aContent['title']) ? array($aContent['title']) : array($aContent['description'], $aContent['object_id']));
        $sEntrySummary = $this->_oConfig->getTitle($aContent['description'], $aContent['object_id'], false);

        return [
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => bx_absolute_url($this->_oConfig->getItemViewUrl($aContent, false), '{bx_url_root}'),
            'entry_caption' => $sEntryCaption,
            'entry_summary' => $sEntrySummary,
            'subentry_sample' => $CNF['T']['txt_sample_score_' . $sType . '_single'],
            'lang_key' => '', //may be empty or not specified. In this case the default one from Notification module will be used.
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-get_repost_element_block get_repost_element_block
     * 
     * @code bx_srv('bx_timeline', 'get_repost_element_block', [...]); @endcode
     * 
     * Get repost element for content based modules.
     * 
     * @param $iOwnerId integer value with owner profile ID.
     * @param $sType string value with type (module name). 
     * @param $sAction string value with action (module action). 
     * @param $iObjectId integer value with object ID to be reposted. 
     * @param $aParams (optional) an array with additional params.
     * @return HTML string with repost element to display on the site, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetRepostElementBlock
     */
    /** 
     * @ref bx_timeline-get_repost_element_block "get_repost_element_block"
     */
    public function serviceGetRepostElementBlock($iOwnerId, $sType, $sAction, $iObjectId, $aParams = [])
    {
    	if(!$this->isEnabled())
            return '';

        $aParams = array_merge($this->_oConfig->getRepostDefaults(), $aParams);
        return $this->_oTemplate->getRepostElement($iOwnerId, $sType, $sAction, $iObjectId, $aParams);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-get_repost_element_block_api get_repost_element_block_api
     * 
     * @code bx_srv('bx_timeline', 'get_repost_element_block_api', [...]); @endcode
     * 
     * Get repost element for content based modules. 
     * Note. Response is formated to be used in API calls.
     * 
     * @param $iOwnerId integer value with owner profile ID.
     * @param $sType string value with type (module name). 
     * @param $sAction string value with action (module action). 
     * @param $iObjectId integer value with object ID to be reposted. 
     * @param $aParams (optional) an array with additional params.
     * @return HTML string with repost element to display on the site, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetRepostElementBlockApi
     */
    /** 
     * @ref bx_timeline-get_repost_element_block_api "get_repost_element_block_api"
     * @api @ref bx_timeline-get_repost_element_block_api "get_repost_element_block_api"
     */
    public function serviceGetRepostElementBlockApi($iOwnerId, $sType, $sAction, $iObjectId, $aParams = [])
    {
        if(!$this->_bIsApi || !$this->isEnabled())
            return [];

        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return [];

        $aParams = array_merge($this->_oConfig->getRepostDefaults(true), $aParams);

        $bPerformed = $this->_oDb->isReposted($aReposted['id'], $iOwnerId, $this->getUserId());
        $bDisabled = $this->isAllowedRepost($aReposted) !== true;

        $sDo = isset($aParams['do']) ? $aParams['do'] : 'repost';

        $sDataType = $sType;
        $sDataAction = $sAction;
        $iDataObjectId = $iObjectId;
        if(($sCommonPrefix = $this->_oConfig->getPrefix('common_post')) && str_replace($sCommonPrefix, '', $sType) == BX_TIMELINE_PARSE_TYPE_REPOST) {
            $aRepostedData = unserialize($aReposted['content']);

            $sDataType = $aRepostedData['type'];
            $sDataAction = $aRepostedData['action'];
            $iDataObjectId = $aRepostedData['object_id'];
        }

        return [
            'type' => 'reposts',
            'system' => $sType . (!empty($sAction) ? '_' . $sAction : ''),
            'object_id' => $iObjectId,
            'params' => array_intersect_key($aParams, array_flip($this->_oConfig->getRepostParams(true))),
            'action' => [
                'is_undo' => false,
                'is_performed' => $bPerformed,
                'is_disabled' => $bDisabled || $bPerformed,
                'title' => _t($aParams['text_do_' . $sDo]),
                'data' => [
                    'author_id' => $iOwnerId,
                    'owner_id' => $iOwnerId,
                    'type' => $sDataType,
                    'action' => $sDataAction,
                    'object_id' => $iDataObjectId
                ]
            ],
            'counter' => []
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-get_repost_counter get_repost_counter
     * 
     * @code bx_srv('bx_timeline', 'get_repost_counter', [...]); @endcode
     * 
     * Get repost counter.
     * 
     * @param $sType string value with type (module name). 
     * @param $sAction string value with action (module action). 
     * @param $iObjectId integer value with object ID to be reposted. 
     * @return HTML string with repost counter to display on the site, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetRepostCounter
     */
    /** 
     * @ref bx_timeline-get_repost_counter "get_repost_counter"
     */
    public function serviceGetRepostCounter($sType, $sAction, $iObjectId, $aParams = [])
    {
    	if(!$this->isEnabled())
            return '';

        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return '';

        $aParams = array_merge($this->_oConfig->getRepostDefaults(), $aParams);
        return $this->_oTemplate->getRepostCounter($aReposted, $aParams);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-get_repost_js_script get_repost_js_script
     * 
     * @code bx_srv('bx_timeline', 'get_repost_js_script', [...]); @endcode
     * 
     * Get repost JavaScript code.
     * 
     * @return HTML string with JavaScript code to display on the site, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxTimelineModule::serviceGetRepostJsScript
     */
    /** 
     * @ref bx_timeline-get_repost_js_script "get_repost_js_script"
     */
    public function serviceGetRepostJsScript()
    {
    	if(!$this->isEnabled())
    		return '';

        return $this->_oTemplate->getRepostJsScript();
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-get_repost_js_click get_repost_js_click
     * 
     * @code bx_srv('bx_timeline', 'get_repost_js_click', [...]); @endcode
     * 
     * Get repost JavaScript code for OnClick event.
     * 
     * @param $iOwnerId integer value with owner profile ID.
     * @param $sType string value with type (module name). 
     * @param $sAction string value with action (module action). 
     * @param $iObjectId integer value with object ID to be reposted. 
     * @return HTML string with JavaScript code to display in OnClick events of HTML elements.
     * 
     * @see BxTimelineModule::serviceGetRepostJsClick
     */
    /** 
     * @ref bx_timeline-get_repost_js_click "get_repost_js_click"
     */
    public function serviceGetRepostJsClick($iOwnerId, $sType, $sAction, $iObjectId)
    {
    	if(!$this->isEnabled())
            return '';

        return $this->_oTemplate->getRepostJsClick($iOwnerId, $sType, $sAction, $iObjectId);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-get_repost_with_js_click get_repost_with_js_click
     * 
     * @code bx_srv('bx_timeline', 'get_repost_with_js_click', [...]); @endcode
     * 
     * Get 'repost with' JavaScript code for OnClick event.
     * 
     * @param $iReposterId integer value with reposter profile ID.
     * @param $sType string value with type (module name). 
     * @param $sAction string value with action (module action). 
     * @param $iObjectId integer value with object ID to be reposted. 
     * @return HTML string with JavaScript code to display in OnClick events of HTML elements.
     * 
     * @see BxTimelineModule::serviceGetRepostWithJsClick
     */
    /** 
     * @ref bx_timeline-get_repost_with_js_click "get_repost_with_js_click"
     */
    public function serviceGetRepostWithJsClick($iReposterId, $sType, $sAction, $iObjectId)
    {
    	if(!$this->isEnabled())
            return '';

        return $this->_oTemplate->getRepostWithJsClick($iReposterId, $sType, $sAction, $iObjectId);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-get_repost_to_js_click get_repost_to_js_click
     * 
     * @code bx_srv('bx_timeline', 'get_repost_to_js_click', [...]); @endcode
     * 
     * Get 'repost to' JavaScript code for OnClick event.
     * 
     * @param $iReposterId integer value with reposter profile ID.
     * @param $sType string value with type (module name). 
     * @param $sAction string value with action (module action). 
     * @param $iObjectId integer value with object ID to be reposted. 
     * @return HTML string with JavaScript code to display in OnClick events of HTML elements.
     * 
     * @see BxTimelineModule::serviceGetRepostToJsClick
     */
    /** 
     * @ref bx_timeline-get_repost_to_js_click "get_repost_to_js_click"
     */
    public function serviceGetRepostToJsClick($iReposterId, $sType, $sAction, $iObjectId)
    {
    	if(!$this->isEnabled())
            return '';

        return $this->_oTemplate->getRepostToJsClick($iReposterId, $sType, $sAction, $iObjectId);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-repost repost
     * 
     * @code bx_srv('bx_timeline', 'repost', [...]); @endcode
     * 
     * Perform repost action.
     * 
     * @param $iAuthorId integer value with performer profile ID.
     * @param $iOwnerId integer value with repost event owner profile ID.
     * @param $sType string value with type (module name). 
     * @param $sAction string value with action (module action). 
     * @param $iObjectId integer value with object ID to be reposted. 
     * @parem $bForce boolean value force reposting without ACL check.
     * @return an array with error (code and message) or integer with newly created repost event ID.
     * 
     * @see BxTimelineModule::serviceRepost
     */
    /** 
     * @ref bx_timeline-repost "repost"
     * @api @ref bx_timeline-repost "repost"
     */
    public function serviceRepost($iAuthorId, $iOwnerId, $sType, $sAction, $iObjectId, $bForce = false)
    {
        $mixedResult = $this->repost($iAuthorId, $iOwnerId, $sType, $sAction, $iObjectId, false, $bForce);
        if($this->_bIsApi && !is_array($mixedResult))
            $mixedResult = [
                'code' => 0, 
                'id' => $mixedResult,
                'performer_id' => $iAuthorId,
                'is_performed' => true,
                'is_disabled' => true,
                'counter' => []
            ];

        return $mixedResult;
    }
    
    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-repost_with repost_with
     * 
     * @code bx_srv('bx_timeline', 'repost_with', [...]); @endcode
     * 
     * Perform repost action passing additional data.
     * 
     * @param $iAuthorId integer value with performer profile ID.
     * @param $iOwnerId integer value with repost event owner profile ID.
     * @param $sType string value with type (module name). 
     * @param $sAction string value with action (module action). 
     * @param $iObjectId integer value with object ID to be reposted. 
     * @param $mixedData array with some data to attach to repost event or false. 
     * @parem $bForce boolean value force reposting without ACL check.
     * @return an array with error (code and message) or integer with newly created repost event ID.
     * 
     * @see BxTimelineModule::serviceRepostWith
     */
    /** 
     * @ref bx_timeline-repost_with "repost_with"
     */
    public function serviceRepostWith($iAuthorId, $iOwnerId, $sType, $sAction, $iObjectId, $mixedData = false, $bForce = false)
    {
        return $this->repost($iAuthorId, $iOwnerId, $sType, $sAction, $iObjectId, $mixedData, $bForce);
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-repost Repost
     * @subsubsection bx_timeline-repost_by_id repost_by_id
     * 
     * @code bx_srv('bx_timeline', 'repost_by_id', [...]); @endcode
     * 
     * Perform repost action by Timeline event ID.
     * 
     * @param $iAuthorId integer value with performer profile ID.
     * @param $iOwnerId integer value with repost event owner profile ID.
     * @param $iEventId integer value with event ID which will be reposted.
     * @parem $bForce boolean value force reposting without ACL check.
     * @return an array with error (code and message) or integer with newly created repost event ID.
     * 
     * @see BxTimelineModule::serviceRepostById
     */
    /** 
     * @ref bx_timeline-repost_by_id "repost_by_id"
     */
    public function serviceRepostById($iAuthorId, $iOwnerId, $iEventId, $bForce = false)
    {
        $aEvent = $this->_oDb->getEntriesBy(array('type' => 'id', 'id' => $iEventId));
        if(empty($aEvent) || !is_array($aEvent))
            return array('code' => 1, 'message' => _t('_bx_timeline_txt_err_cannot_repost'));

        $sType = $aEvent['type'];
        $sAction = $aEvent['action'];
        $iObjectId = $this->_oConfig->isSystem($sType, $sAction) ? $aEvent['object_id'] : $aEvent['id'];

        $sCommonPrefix = $this->_oConfig->getPrefix('common_post');
        if(str_replace($sCommonPrefix, '', $sType) == BX_TIMELINE_PARSE_TYPE_REPOST) {
            $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
            if(empty($aReposted) || !is_array($aReposted))
                return array('code' => 1, 'message' => _t('_bx_timeline_txt_err_cannot_repost'));

            $aRepostedData = unserialize($aEvent['content']);

            $sType = $aRepostedData['type'];
            $sAction = $aRepostedData['action'];
            $iObjectId = $aRepostedData['object_id'];
        }

        return $this->repost($iAuthorId, $iOwnerId, $sType, $sAction, $iObjectId, false, $bForce);
    }

    public function isReposted($iAuthorId, $iOwnerId, $sType, $sAction, $iObjectId)
    {
        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return false;

        if(str_replace($this->_oConfig->getPrefix('common_post'), '', $sType) == BX_TIMELINE_PARSE_TYPE_REPOST) {
            $aRepostedData = unserialize($aReposted['content']);

            $aReposted = $this->_oDb->getReposted($aRepostedData['type'], $aRepostedData['action'], $aRepostedData['object_id']);
            if(empty($aReposted) || !is_array($aReposted))
                return false;
        }

        return $this->_oDb->isReposted($aReposted['id'], $iOwnerId, $iAuthorId);
    }

    public function repost($iAuthorId, $iOwnerId, $sType, $sAction, $iObjectId, $mixedData = false, $bForce = false)
    {
        if(!$this->_oDb->isHandler($sType, $sAction))
            return ['code' => 1, 'message' => _t('_bx_timeline_txt_err_cannot_repost')];

        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return ['code' => 1, 'message' => _t('_bx_timeline_txt_err_cannot_repost')];

        $mixedAllowed = $this->isAllowedRepost($aReposted, true);
        if(!$bForce && $mixedAllowed !== true)
            return ['code' => 2, 'message' => strip_tags($mixedAllowed)];

        $bReposted = $this->_oDb->isReposted($aReposted['id'], $iOwnerId, $iAuthorId);
        if($bReposted)
            return ['code' => 3, 'message' => _t('_bx_timeline_txt_err_already_reposted')];

        $iDate = time();
        $iId = $this->_oDb->insertEvent([
            'owner_id' => $iOwnerId,
            'system' => 0,
            'type' => $this->_oConfig->getPrefix('common_post') . 'repost',
            'action' => '',
            'object_id' => $iAuthorId,
            'object_owner_id' => $iAuthorId,
            'object_privacy_view' => $this->_oConfig->getPrivacyViewDefault('object'),
            'content' => serialize([
                'type' => $sType,
                'action' => $sAction,
                'object_id' => $iObjectId,
                'rdata' => $mixedData
            ]),
            'title' => '',
            'description' => '',
            'date' => $iDate,
            'reacted' => $iDate,
            'status_admin' => $this->getStatusAdmin()
        ]);

        if(empty($iId))
            return ['code' => 4, 'message' => _t('_bx_timeline_txt_err_cannot_repost')];

        $this->_oDb->updateEvent([
            'source' => $this->getName() . '_' . $iAuthorId . '_' . $iId
        ], ['id' => $iId]);

        $this->onRepost($iId, $aReposted);

        return $iId;
    }
    
    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-update update
     * 
     * @code bx_srv('bx_timeline', 'update', [...]); @endcode
     * 
     * Update timeline event by ID.
     * 
     * @param $iEventId integer value with event ID.
     * @param $aSet an array with key=>value pairs for fields which should be updated. 
     * @return boolean value with the result of operation.
     * 
     * @see BxTimelineModule::serviceUpdate
     */
    /** 
     * @ref bx_timeline-update "update"
     */
    public function serviceUpdate($iEventId, $aSet)
    {
        if(empty($iEventId))
            return false;

        return (int)$this->_oDb->updateEvent($aSet, array('id' => $iEventId)) > 0;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-delete delete
     * 
     * @code bx_srv('bx_timeline', 'delete', [...]); @endcode
     * 
     * Delete timeline event by ID.
     * 
     * @param $iId integer value with event ID.
     * @return boolean value with the result of operation.
     * 
     * @see BxTimelineModule::serviceDelete
     */
    /** 
     * @ref bx_timeline-delete "delete"
     */
    public function serviceDelete($iId)
    {
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iId));
        if(empty($aEvent) || !is_array($aEvent))
            return true;

        if($this->isAllowedDelete($aEvent, true) !== true || !$this->deleteEvent($aEvent))
            return false;

        return true;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-pin pin
     * 
     * @code bx_srv('bx_timeline', 'pin', [...]); @endcode
     * 
     * Pin or unpin a timeline event by ID. Pin is shown on the profile timeline for the owner.
     * 
     * @param $iId integer value with event ID.
     * @return array with the result of operation.
     * 
     * @see BxTimelineModule::servicePin
     */
    /** 
     * @ref bx_timeline-pin "pin"
     */
    public function servicePin($iId)
    {
        $a = $this->_performPin((int)$iId);
        if ((int)$a['code'] !== 0)
            return $a;

        return [
            'code' => 0,
            'id' => $a['id'],
            'pinned' => $a['pinned'],
            'title' => _t('_bx_timeline_menu_item_title_item_' . $a['next']),
            'request_url' => $this->getName() . '/pin/&params[]=' . $a['id'],
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-stick stick
     * 
     * @code bx_srv('bx_timeline', 'stick', [...]); @endcode
     * 
     * Stick or unstick a timeline event by ID. Stick is shown on the public timeline for everybody.
     * 
     * @param $iId integer value with event ID.
     * @return array with the result of operation.
     * 
     * @see BxTimelineModule::serviceStick
     */
    /** 
     * @ref bx_timeline-stick "stick"
     */
    public function serviceStick($iId)
    {
        $a = $this->_performStick((int)$iId);
        if ((int)$a['code'] !== 0)
            return $a;

        return [
            'code' => 0,
            'id' => $a['id'],
            'sticked' => $a['sticked'],
            'title' => _t('_bx_timeline_menu_item_title_item_' . $a['next']),
            'request_url' => $this->getName() . '/stick/&params[]=' . $a['id'],
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-promote promote
     * 
     * @code bx_srv('bx_timeline', 'promote', [...]); @endcode
     * 
     * Promote or unpromote a timeline event by ID.
     * 
     * @param $iId integer value with event ID.
     * @return array with the result of operation.
     * 
     * @see BxTimelineModule::servicePromote
     */
    /** 
     * @ref bx_timeline-promote "promote"
     */
    public function servicePromote($iId)
    {
        $a = $this->_performPromote((int)$iId);
        if ((int)$a['code'] !== 0)
            return $a;

        return [
            'code' => 0,
            'id' => $a['id'],
            'promoted' => $a['promoted'],
            'title' => _t('_bx_timeline_menu_item_title_item_' . $a['next']),
            'request_url' => $this->getName() . '/promote/&params[]=' . $a['id'],
            'message' => _t('_bx_timeline_txt_msg_performed_action')
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_menu_item_addon_comment get_menu_item_addon_comment
     * 
     * @code bx_srv('bx_timeline', 'get_menu_item_addon_comment', [...]); @endcode
     * 
     * Get addon for Comment menu item.
     * NOTE. The service isn't used for now because comment functionality in card was updated.
     * 
     * @param $sSystem string value with comments engine system.
     * @param $iObjectId integer value with object ID. 
     * @return HTML string to display in menu item.
     * 
     * @see BxTimelineModule::serviceGetMenuItemAddonComment
     */
    /** 
     * @ref bx_timeline-get_menu_item_addon_comment "get_menu_item_addon_comment"
     */
    public function serviceGetMenuItemAddonComment($sSystem, $iObjectId, $aBrowseParams = array())
    {
        if(empty($sSystem) || empty($iObjectId))
            return '';
        
        $oCmts = $this->getCmtsObject($sSystem, $iObjectId);
        if($oCmts === false)
            return '';

        $iCounter = (int)$oCmts->getCommentsCount();
        if(empty($iCounter))
            return '';

        return  $this->_oTemplate->parseLink('javascript:void(0)', $iCounter, array(
            'class' => 'bx-menu-item-addon',
            'title' => _t('_bx_timeline_menu_item_title_item_comment'),
            'onclick' => "javascript:" . $this->_oConfig->getJsObjectView($aBrowseParams) . ".commentItem(this, '" . $sSystem . "', " . $iObjectId . ")" 
        ));
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_settings_checker_helper get_settings_checker_helper
     * 
     * @code bx_srv('bx_timeline', 'get_settings_checker_helper', [...]); @endcode
     * 
     * Get Checker Helper class name for Forms engine.
     * 
     * @return string with Checker Helper class name.
     * 
     * @see BxTimelineModule::serviceGetSettingsCheckerHelper
     */
    /** 
     * @ref bx_timeline-get_settings_checker_helper "get_settings_checker_helper"
     */
    public function serviceGetSettingsCheckerHelper()
    {
        bx_import('FormCheckerHelper', $this->_aModule);
        return 'BxTimelineFormCheckerHelper';
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_options_filters_style get_options_filters_style
     * 
     * @code bx_srv('bx_timeline', 'get_options_filters_style', [...]); @endcode
     * 
     * Get an array with available options for 'Filters: Styles' setting.
     *
     * @return an array with available options represented as key => value pairs.
     * 
     * @see BxTimelineModule::serviceGetOptionsFiltersStyle
     */
    /** 
     * @ref bx_timeline-get_options_filters_style "get_options_filters_style"
     */
    public function serviceGetOptionsFiltersStyle()
    {
        $aStyles = $this->_oConfig->getFiltersStyles();

        $aResult = [];
        foreach($aStyles as $sFilter)
            $aResult[] = [
                'key' => $sFilter, 
                'value' => _t('_bx_timeline_option_filters_style_' . $sFilter)
            ];

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_options_filters_contexts get_options_filters_contexts
     * 
     * @code bx_srv('bx_timeline', 'get_options_filters_contexts', [...]); @endcode
     * 
     * Get an array with available options for 'Filters: By contexts' setting.
     *
     * @return an array with available options represented as key => value pairs.
     * 
     * @see BxTimelineModule::serviceGetOptionsFiltersContexts
     */
    /** 
     * @ref bx_timeline-get_options_filters_contexts "get_options_filters_contexts"
     */
    public function serviceGetOptionsFiltersContexts()
    {
        $aContexts = bx_srv('system', 'get_modules_by_type', ['context']);
        
        $aResult = [];
        foreach($aContexts as $aContext)
            if(($sContext = $aContext['name']) && BxDolModuleQuery::getInstance()->isEnabledByName($sContext))
                $aResult[$aContext['name']] = ($sLk = '_' . $sContext) && ($_sLk = _t($sLk)) && strcmp($sLk, $_sLk) != 0 ? $_sLk : $aContext['title'];

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_options_filters_media get_options_filters_media
     * 
     * @code bx_srv('bx_timeline', 'get_options_filters_media', [...]); @endcode
     * 
     * Get an array with available options for 'Filters: By media' setting.
     *
     * @return an array with available options represented as key => value pairs.
     * 
     * @see BxTimelineModule::serviceGetOptionsFiltersMedia
     */
    /** 
     * @ref bx_timeline-get_options_filters_media "get_options_filters_media"
     */
    public function serviceGetOptionsFiltersMedia()
    {
        $aMedia = $this->_oConfig->getFiltersMediaAvailable();
        
        $aResult = [];
        foreach($aMedia as $sMedia)
            $aResult[$sMedia] = _t('_bx_timeline_form_filters_input_by_media_' . $sMedia);

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_options_videos_preload get_options_videos_preload
     * 
     * @code bx_srv('bx_timeline', 'get_options_videos_preload', [...]); @endcode
     * 
     * Get an array with available options for 'Videos preload in Timeline' setting.
     *
     * @return an array with available options represented as key => value pairs.
     * 
     * @see BxTimelineModule::serviceGetOptionsVideosPreload
     */
    /** 
     * @ref bx_timeline-get_options_videos_preload "get_options_videos_preload"
     */
    public function serviceGetOptionsVideosPreload()
    {
        $CNF = &$this->_oConfig->CNF;

        $aOptions = array('auto', 'metadata', 'none');

        $aResult = array();
        foreach($aOptions as $sOption)
            $aResult[] = array(
                'key' => $sOption,
                'value' => _t($CNF['T']['option_vp_' . $sOption])
            );

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_options_videos_autoplay get_options_videos_autoplay
     * 
     * @code bx_srv('bx_timeline', 'get_options_videos_autoplay', [...]); @endcode
     * 
     * Get an array with available options for 'Videos autoplay in Timeline' setting.
     *
     * @return an array with available options represented as key => value pairs.
     * 
     * @see BxTimelineModule::serviceGetOptionsVideosAutoplay
     */
    /** 
     * @ref bx_timeline-get_options_videos_autoplay "get_options_videos_autoplay"
     */
    public function serviceGetOptionsVideosAutoplay()
    {
        $CNF = &$this->_oConfig->CNF;

        $aOptions = array(BX_TIMELINE_VAP_OFF, BX_TIMELINE_VAP_ON_MUTE, BX_TIMELINE_VAP_ON);

        $aResult = array();
        foreach($aOptions as $sOption)
            $aResult[] = array(
                'key' => $sOption,
                'value' => _t($CNF['T']['option_vap_' . $sOption])
            );

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_options_attachments_layout get_options_attachments_layout
     * 
     * @code bx_srv('bx_timeline', 'get_options_attachments_layout', [...]); @endcode
     * 
     * Get an array with available options for 'Show attachments as' setting.
     *
     * @return an array with available options represented as key => value pairs.
     * 
     * @see BxTimelineModule::serviceGetOptionsAttachmentsLayout
     */
    /** 
     * @ref bx_timeline-get_options_attachments_layout "get_options_attachments_layout"
     */
    public function serviceGetOptionsAttachmentsLayout()
    {
        $CNF = &$this->_oConfig->CNF;

        $aOptions = array(BX_TIMELINE_ML_GALLERY, BX_TIMELINE_ML_SHOWCASE);

        $aResult = array();
        foreach($aOptions as $sOption)
            $aResult[] = array(
                'key' => $sOption,
                'value' => _t($CNF['T']['option_al_' . $sOption])
            );

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_live_update get_live_update
     * 
     * @code bx_srv('bx_timeline', 'get_live_update', [...]); @endcode
     * 
     * Get an array with actual Live Update info. Only one live update notification for all new events.
     *
     * @return an array with Live Update info.
     * 
     * @see BxTimelineModule::serviceGetLiveUpdate
     */
    /** 
     * @ref bx_timeline-get_live_update "get_live_update"
     */
    public function serviceGetLiveUpdate($aBrowseParams, $iProfileId, $iValue = 0, $iInit = 0)
    {
        $CNF = &$this->_oConfig->CNF;
        
        if (!is_array($aBrowseParams)){
            $aTmp = json_decode($aBrowseParams, true);
            $aBrowseParams = $aTmp['params'];
        }

        $sKey = $this->_oConfig->getLiveUpdateKey($aBrowseParams);

        bx_import('BxDolSession');
        if((int)BxDolSession::getInstance()->getValue($sKey) == 1)
            return false;

        $aParams = $this->_prepareParams($aBrowseParams);
        if(($iLiveUpdateLength = $this->_oConfig->getLiveUpdateLength()) != 0)
            $aParams['per_page'] = $iLiveUpdateLength;

        $aEvents = $this->_oDb->getEvents($aParams);
        if(empty($aEvents) || !is_array($aEvents))
            return false;

        $iValueNew = 0;
        foreach($aEvents as $aEvent) {
            if((int)$aEvent[$CNF['FIELD_STICKED']] != 0)
                continue;

            $sContent = $this->_oTemplate->getPost($aEvent, $aParams);
            if(empty($sContent)) 
                continue;

            $iValueNew = $aEvent['id'];
            break;
        }

        if($iValueNew == $iValue)
            return false;

        if($this->_bIsApi)
            return $iValueNew;

        if((int)$iInit != 0)
            return array('count' => $iValueNew);

        return array(
            'count' => $iValueNew, // required (for initialization and visualization)
            'method' => $this->_oConfig->getJsObjectView($aBrowseParams) . '.showLiveUpdate(oData)', // required (for visualization)
            'data' => array(
                'code' => $this->_oTemplate->getLiveUpdate($aBrowseParams, $iProfileId, $iValue, $iValueNew)
            ),  // optional, may have some additional data to be passed in JS method provided using 'method' param above.
        );
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Timeline
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_live_updates get_live_updates
     * 
     * @code bx_srv('bx_timeline', 'get_live_updates', [...]); @endcode
     * 
     * Get an array with actual Live Update info. Separate live update notification for each new Event.
     * Note. This method isn't used for now. @see BxTimelineModule::serviceGetLiveUpdate method instead.
     * 
     * Note. This way to display live update notifications isn't used for now. 
     * See BxTimelineModule::serviceGetLiveUpdate method instead.
     *
     * @return an array with Live Update info.
     * 
     * @see BxTimelineModule::serviceGetLiveUpdates
     */
    /** 
     * @ref bx_timeline-get_live_updates "get_live_updates"
     */
    public function serviceGetLiveUpdates($aBrowseParams, $iProfileId, $iCount = 0, $iInit = 0)
    {
        $sKey = $this->_oConfig->getLiveUpdateKey($aBrowseParams);

        bx_import('BxDolSession');
        if((int)BxDolSession::getInstance()->getValue($sKey) == 1)
            return false;

        $aParams = $this->_prepareParams($aBrowseParams);
        $aParams['filter'] = BX_TIMELINE_FILTER_OTHER_VIEWER;
        $aParams['count'] = true;

        $iCountNew = $this->_oDb->getEvents($aParams);
        if($iCountNew == $iCount)
            return false;

        if((int)$iInit != 0)
            return array('count' => $iCountNew);

        return array(
            'count' => $iCountNew, // required (for initialization and visualization)
            'method' => $this->_oConfig->getJsObjectView($aBrowseParams) . '.showLiveUpdates(oData)', // required (for visualization)
            'data' => array(
                'code' => $this->_oTemplate->getLiveUpdates($aBrowseParams, $iProfileId, $iCount, $iCountNew)
            ),  // optional, may have some additional data to be passed in JS method provided using 'method' param above.
        );
    }
    
    /**
     * @page service Service Calls
     * @section bx_timeline Accounts
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_menu_addon_manage_tools get_menu_addon_manage_tools
     * 
     * @code bx_srv('bx_timeline', 'get_menu_addon_manage_tools', [...]); @endcode
     * 
     * Get number of 'hidden' events for User End -> Dasboard page -> Manage block.
     *
     * @return integer number of 'hidden' events
     * 
     * @see BxTimelineModule::serviceGetMenuAddonManageTools
     */
    /** 
     * @ref bx_timeline-get_menu_addon_manage_tools "get_menu_addon_manage_tools"
     */
    public function serviceGetMenuAddonManageTools()
    {
        $iNum1 = $this->_oDb->getEntriesNumByParams([
            [
                'key' => 'status', 
                'value' => BX_TIMELINE_STATUS_HIDDEN, 
                'operator' => '='
            ]
        ]);
        
        $iNum2 = $this->_oDb->getEntriesNumByParams([
            [
                'key' => 'reports',
                'value' => '0', 
                'operator' => '>'
            ]
        ]);
        
        return array(
            'counter1_value' => $iNum1, 
            'counter2_value' => $iNum2, 
            'counter3_value' => 0
        );
    }

    /**
     * @page service Service Calls
     * @section bx_timeline Accounts
     * @subsection bx_timeline-other Other
     * @subsubsection bx_timeline-get_menu_addon_profile_stats get_menu_addon_profile_stats
     * 
     * @code bx_srv('bx_timeline', 'get_menu_addon_profile_stats', [...]); @endcode
     * 
     * Get number of 'muted' events for currently logged in user. User End -> Profile Stats.
     *
     * @return integer number of 'muted' events
     * 
     * @see BxTimelineModule::serviceGetMenuAddonProfileStats
     */
    /** 
     * @ref bx_timeline-get_menu_addon_profile_stats "get_menu_addon_profile_stats"
     */
    public function serviceGetMenuAddonProfileStats($iProfileId = 0)
    {
        if(empty($iProfileId))
            $iProfileId = $this->_iProfileId;

        return $this->getConnectionMuteObject()->getConnectedContentCount($iProfileId);
    }

    public function serviceGet($aParams)
    {
        if($this->_bIsApi && is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams, true);

        $aParams = $this->_prepareParams($aParams);
        $aParams['return_data_type'] = 'array';

        return $this->_oTemplate->getPosts($aParams);
    }

    public function serviceAdd($aValues)
    {
        return $this->getFormPost(array(
            'values' => $aValues
        ));
    }

    public function serviceEdit($iId, $aValues)
    {
        return $this->getFormEdit($iId, array(
            'values' => $aValues
        ));
    }

    /**
     * Delete content entry
     * @param $iContentId content id 
     * @return error message or empty string on success
     */
    public function serviceDeleteEntity ($iContentId, $sFuncDelete = 'deleteData')
    {
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContentId));
        if(empty($aEvent) || !is_array($aEvent))
            return _t('_Empty');

        if(!$this->deleteEvent($aEvent))
            return _t('_bx_timeline_txt_err_cannot_perform_action');

        return '';
    }

    public function serviceGetEvents($aParams = [])
    {
        return $this->_oDb->getEvents($aParams);
    }

    public function serviceGetEventsByDescriptor($sType, $sAction, $iObjectId)
    {
        return $this->_oDb->getEvents([
            'browse' => 'descriptor', 
            'type' => $sType, 
            'action' => $sAction, 
            'object_id' => $iObjectId
        ]);
    }

    /*
     * COMMON METHODS
     */
    public function getStatusAdmin()
    {
        return $this->isModerator() || $this->_oConfig->isAutoApproveEnabled() ? BX_TIMELINE_STATUS_ACTIVE : BX_TIMELINE_STATUS_PENDING;
    }
    
    public function getModerators($mixedContentInfo)
    {
        $sModule = $this->_oConfig->getName();

        if(!is_array($mixedContentInfo))
            $mixedContentInfo = $this->_oDb->getContentInfoById((int)$mixedContentInfo);

        $aModerators = BxDolAclQuery::getInstance()->getProfilesByAction(['edit', 'delete'], [
            'module' => $sModule, 
            'ids_only' => true
        ]);

        return $aModerators;
    }

    public function getItemData($iId, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParams))
            $aParams = $this->_prepareParams(array(
                'view' => BX_TIMELINE_VIEW_ITEM, 
                'type' => BX_TIMELINE_TYPE_ITEM
            ));

        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iId));
        if(empty($aEvent))
            return array('code' => 1, 'content' => _t('_Empty'));

        $iProfile = (int)$aEvent[$CNF['FIELD_OWNER_ID']];
        if(!empty($iProfile)) {
            $oProfile = BxDolProfile::getInstance($iProfile);
            if(!$oProfile)
                return array('code' => 1, 'content' => _t('_Empty'));

            $mixedResult = $oProfile->checkAllowedProfileView();
            if($mixedResult !== CHECK_ACTION_RESULT_ALLOWED)
                return array('code' => 2, 'content' => $mixedResult);
        }

        $sContent = $this->_oTemplate->getPost($aEvent, $aParams);
        if(empty($sContent))
            return array('code' => 2, 'content' => _t('_Access denied'));

        $sKey = 'allowed_view';
        if(isset($aEvent[$sKey]) && $aEvent[$sKey] !== CHECK_ACTION_RESULT_ALLOWED) 
            return array('code' => 2, 'content' => $aEvent[$sKey]);

        if($this->isAllowedView($aEvent) !== true)
            return array('code' => 2, 'content' => _t('_Access denied'));

        return array('code' => 0, 'content' => $sContent, 'event' => $aEvent);
    }

    public function hideEvent($aEvent)
    {
    	if(empty($aEvent) || !is_array($aEvent) || !$this->_oDb->updateEvent(['status' => 'hidden'], ['id' => (int)$aEvent['id']]))
            return false;

        $this->onHide($aEvent);
        return true;
    }

    public function deleteEvent($aEvent)
    {
    	if(empty($aEvent) || !is_array($aEvent) || !$this->_oDb->deleteEvent(array('id' => (int)$aEvent['id'])))
            return false;

        $this->onDelete($aEvent);
        return true;
    }

    public function getFormPost($aParams = [])
    {
        
        $CNF = &$this->_oConfig->CNF;

        $iUserId = $this->getUserId();

        $oForm = $this->getFormPostObject($aParams);
        $aFormInitCheckerParams = [];

        $bValues = !empty($aParams['values']) && is_array($aParams['values']);
        if($bValues) {
            $this->_prepareFormForAutoSubmit($oForm, $aParams['values']);

            $aFormInitCheckerParams = [[], $aParams['values']];
            unset($aParams['values']);
        }

        call_user_func_array([$oForm, 'initChecker'], $aFormInitCheckerParams);

        $bAjaxMode = $oForm->isAjaxMode();
        $bDynamicMode = $bAjaxMode;
        if($oForm->isSubmittedAndValid()) {
            $sType = $oForm->getCleanValue('type');
            $sType = $this->_oConfig->getPrefix('common_post') . $sType;
            BxDolForm::setSubmittedValue('type', $sType, $oForm->aFormAttrs['method']);

            $aContent = [];

            //--- Process Text ---//
            $sText = $oForm->getCleanValue('text');
            $sText = $this->_prepareTextForSave($sText);
            $bText = !empty($sText);

            if($bText)
            	$aContent['text'] = $sText;

            //--- Process Context and Privacy ---//
            $iOwnerId = (int)$oForm->getCleanValue('owner_id');
            $iObjectPrivacyView = (int)$oForm->getCleanValue('object_privacy_view');
            $iObjectPrivacyViewDefault = $this->_oConfig->getPrivacyViewDefault('object');
            if(empty($iObjectPrivacyView))
                $iObjectPrivacyView = $iObjectPrivacyViewDefault;
            else if($iObjectPrivacyView < 0)
                $iOwnerId = abs($iObjectPrivacyView);

            //--- Process Link ---//
            $aLinkIds = $oForm->getCleanValue($CNF['FIELD_LINK']);
            $bLinkIds = !empty($aLinkIds) && ($this->_bIsApi ? is_string($aLinkIds) : is_array($aLinkIds));

            //--- Process Photos ---//
            $aPhotoIds = $oForm->getCleanValue($CNF['FIELD_PHOTO']);
            $bPhotoIds = !empty($aPhotoIds) && is_array($aPhotoIds);

            //--- Process Videos ---//
            $aVideoIds = $oForm->getCleanValue($CNF['FIELD_VIDEO']);
            $bVideoIds = !empty($aVideoIds) && is_array($aVideoIds);

            //--- Process Files ---//
            $aFileIds = $oForm->getCleanValue($CNF['FIELD_FILE']);
            $bFileIds = !empty($aFileIds) && is_array($aFileIds);
            
            //--- Process Polls ---//
            $aPollIds = $oForm->getCleanValue($CNF['FIELD_POLL']);
            $bPollIds = !empty($aPollIds) && is_array($aPollIds);            

            if(!$bText && !$bLinkIds && !$bPhotoIds && !$bVideoIds && !$bFileIds && !$bPollIds) {
                $oForm->aInputs['text']['error'] =  _t('_bx_timeline_txt_err_empty_post');
                $oForm->setValid(false);

                if($this->_bIsApi)
                    return ['form_object' => $oForm];

            	return $this->_prepareResponse([
                    'form' => $oForm->getCode($bDynamicMode), 
                    'form_id' => $oForm->id
                ], $bAjaxMode);
                
                
            }

            $sTitle = $bText ? $this->_oConfig->getTitle($sText) : $this->_oConfig->getTitleDefault($bLinkIds, $bPhotoIds, $bVideoIds, $bFileIds);
            $sDescription = _t('_bx_timeline_txt_user_added_sample', '{profile_name}', _t('_bx_timeline_txt_sample_with_article'));

            /**
             * Unset 'text' input because its data was already processed 
             * and will be saved via additional values which were passed 
             * to BxDolForm::insert method.
             */

            unset($oForm->aInputs['text']['db']);
            $oForm->aInputs['text']['value'] = '';

            $iId = $oForm->insert([
                'owner_id' => $iOwnerId,
                'object_id' => $iUserId,
                'object_owner_id' => $iUserId,
                'object_privacy_view' => $iObjectPrivacyView,
                'content' => serialize($aContent),
                'title' => $sTitle,
                'description' => $sDescription,
                'status_admin' => $this->getStatusAdmin()
            ]);

            if(!empty($iId)) {
                $this->isAllowedPost(true);

                $sSource = $this->getName() . '_' . $iUserId . '_' . $iId;
                $aContent = array_merge($aContent, [
                    'timeline_group' => [
                        'by' => $sSource,
                        'field' => 'owner_id'
                    ]
                ]);

                $this->_oDb->updateEvent(['content' => serialize($aContent), 'source' => $sSource], ['id' => $iId]);

                //--- Process Meta ---//
                $this->_processMetas($iId, $sText);

                //--- Process Link ---//
                if($bLinkIds) {
                    if($this->_bIsApi) {
                        $aLinks = explode(',', $aLinkIds);
                        if(!empty($aLinks) && is_array($aLinks))
                            foreach($aLinks as $sLink) {
                                $aLink = $this->addAttachLink([
                                    $CNF['FIELD_ATTACH_LINK_CONTENT_ID'] => $iId,
                                    $CNF['FIELD_ATTACH_LINK_URL'] => $sLink
                                ]);
                                
                                if(!is_array($aLink) || empty($aLink['id']))
                                    continue;

                                $this->_oDb->saveLink($iId, $aLink['id']);
                            }
                    }
                    else
                        foreach($aLinkIds as $iLinkId)
                            $this->_oDb->saveLink($iId, $iLinkId);
                }

                //--- Process Media ---//
                $this->_saveMedia($CNF['FIELD_PHOTO'], $iId, $aPhotoIds, $iUserId, true);
                $this->_saveMedia($CNF['FIELD_VIDEO'], $iId, $aVideoIds, $iUserId, true);
                $this->_saveMedia($CNF['FIELD_FILE'], $iId, $aFileIds, $iUserId, true);

                //--- Process Poll ---//
                $oForm->processPolls($CNF['FIELD_POLL'], $iId);

                //--- Process Privacy
                $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
                if(($sKey = 'FIELD_OBJECT_PRIVACY_VIEW') && !empty($aEvent[$CNF[$sKey]]) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false)
                    $oPrivacy->associateGroupCustomWithContent($iUserId, $iId, (int)$aEvent[$CNF[$sKey]]);

                $this->onPost($iId);

                if($this->_bIsApi)
                    return ['form_object' => $oForm, 'id' => $iId];

                return $this->_prepareResponse(['id' => $iId], $bAjaxMode, [
                    'redirect' => $this->_oConfig->getItemViewUrl(['id' => $iId])
                ]);
            }

            return $this->_prepareResponse(['message' => _t('_bx_timeline_txt_err_cannot_perform_action')], $bAjaxMode);
        }

        $bSubmitted = $oForm->isSubmitted();
        if(!$bSubmitted && ($oProfile = BxDolProfile::getInstance()) !== false && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false)
            $oPrivacy->deleteGroupCustomByProfileIdUnused($oProfile->id());

        if($this->_bIsApi)
            return ['form_object' => $oForm];

        $mixedResult = $this->_prepareResponse([
            'form' => $oForm->getCode($bDynamicMode), 
            'form_id' => $oForm->id
        ], $bAjaxMode && $bSubmitted);

        if(is_array($mixedResult))
            $mixedResult['form_object'] = $oForm;

        return $mixedResult;
    }

    public function getFormEdit($iId, $aParams = [], $aBrowseParams = [])
    {
        $CNF = &$this->_oConfig->CNF;
        $sJsObjectView = $this->_oConfig->getJsObjectView($aBrowseParams);

        $iUserId = $this->getUserId();

        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
        if(empty($aEvent) || !is_array($aEvent))
            return [];

        if(($mixedCheck = $this->isAllowedEdit($aEvent)) !== true)
            return $this->_bIsApi ? bx_api_get_msg($mixedCheck !== false ? $mixedCheck : _t('_sys_txt_access_denied')) : ['message' => $mixedCheck !== false ? $mixedCheck : _t('_sys_txt_access_denied')];
        
        $aContent = unserialize($aEvent['content']);
        if(is_array($aContent) && !empty($aContent['text']))
            $aEvent['text'] = $aContent['text'];

        if(empty($aParams['form_object']))
            $aParams['form_object'] = 'form_post';
        if(empty($aParams['form_display']))
            $aParams['form_display'] = 'form_display_post_edit';

        $oForm = $this->getFormPostObject($aParams);
        $oForm->setId($this->_oConfig->getHtmlIds('view', 'edit_form') . $iId);
        $aFormInitCheckerParams = [];

        $bValues = !empty($aParams['values']) && is_array($aParams['values']);
        if($bValues) {
            $this->_prepareFormForAutoSubmit($oForm, $aParams['values']);

            $aFormInitCheckerParams = [[], array_merge($aEvent, $aParams['values'])];
            unset($aParams['values']);
        }
        else {
            $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'edit/' . $iId ;
            if(!empty($aBrowseParams) && is_array($aBrowseParams))
                $oForm->aFormAttrs['action'] = $this->_oConfig->addBrowseParams($oForm->aFormAttrs['action'], $aBrowseParams);

            foreach($oForm->aInputs[$CNF['FIELD_CONTROLS']] as $mixedIndex => $aInput) {
                if(!is_numeric($mixedIndex))
                    continue;

                $oForm->aInputs[$CNF['FIELD_CONTROLS']][$mixedIndex]['attrs'] = bx_replace_markers($aInput['attrs'], [
                    'js_object_view' => $sJsObjectView,
                    'content_id' => $iId
                ]);
            }

            $aFormInitCheckerParams = [$aEvent];
        }

        call_user_func_array([$oForm, 'initChecker'], $aFormInitCheckerParams);

        $bAjaxMode = $oForm->isAjaxMode();
        $bDynamicMode = $bAjaxMode || bx_is_dynamic_request();
        
        $sCodeAdd = '';
        if($bDynamicMode) {
            $sCodeAdd .= $this->_oTemplate->getAddedJs('post', $bDynamicMode);
            $sCodeAdd .= $this->_oTemplate->getJsCode('post', [], true, $bDynamicMode);
        }

        if($oForm->isSubmittedAndValid()) {
            $aContent = unserialize($aEvent['content']);

            //--- Process Text ---//
            $sText = $oForm->getCleanValue('text');
            $sText = $this->_prepareTextForSave($sText);
            $bText = !empty($sText);
            unset($oForm->aInputs['text']);

            if($bText)
            	$aContent['text'] = $sText;

            $aValsToAdd = [
            	'content' => serialize($aContent),
                'status_admin' => $this->getStatusAdmin()
            ];

            //--- Process Privacy ---//
            if(isset($oForm->aInputs[$CNF['FIELD_OBJECT_PRIVACY_VIEW']])) {
                $iObjectPrivacyView = (int)$oForm->getCleanValue('object_privacy_view');
                $iObjectPrivacyViewDefault = $this->_oConfig->getPrivacyViewDefault('object');
                if(empty($iObjectPrivacyView))
                    $aValsToAdd = array_merge($aValsToAdd, [
                        'object_privacy_view' => $iObjectPrivacyViewDefault
                    ]);
                else if($iObjectPrivacyView < 0) 
                    $aValsToAdd = array_merge($aValsToAdd, [
                        'owner_id' => abs($iObjectPrivacyView)
                    ]);
            }

            //--- Process Link ---//
            $aLinkIds = $oForm->getCleanValue($CNF['FIELD_LINK']);
            $bLinkIds = !empty($aLinkIds) && is_array($aLinkIds);

            //--- Process Media ---//
            $aPhotoIds = $oForm->getCleanValue($CNF['FIELD_PHOTO']);
            $bPhotoIds = !empty($aPhotoIds) && is_array($aPhotoIds);

            $aVideoIds = $oForm->getCleanValue($CNF['FIELD_VIDEO']);
            $bVideoIds = !empty($aVideoIds) && is_array($aVideoIds);
            if($bVideoIds && ($mixedCheckResult = $this->_checkMedia($CNF['FIELD_VIDEO'], $iId, $aVideoIds, $iUserId)) !== false) {
                list($bHasImage, $bHasVideo, $bIsVideoProcessed) = $mixedCheckResult;
                if($bHasVideo && !$bIsVideoProcessed)
                    $aValsToAdd[$CNF['FIELD_STATUS']] = 'awaiting';
            }

            $aFileIds = $oForm->getCleanValue($CNF['FIELD_FILE']);
            $bFileIds = !empty($aFileIds) && is_array($aFileIds);
            
            //--- Process Poll ---//
            $aPollIds = $oForm->getCleanValue($CNF['FIELD_POLL']);
            $bPollIds = !empty($aPollIds) && is_array($aPollIds);

            if(!$bText && !$bLinkIds && !$bPhotoIds && !$bVideoIds && !$bFileIds && !$bPollIds) {
                $oForm->aInputs['text']['error'] =  _t('_bx_timeline_txt_err_empty_post');
                $oForm->setValid(false);

            	return $this->_bIsApi ? ['form' => $oForm->getCodeAPI()] : $this->_prepareResponse([
                    'form' => $sCodeAdd . $oForm->getCode($bDynamicMode), 
                    'form_id' => $oForm->id
                ], $bAjaxMode);
            }

            if($oForm->update($iId, $aValsToAdd) === false)
                 return $this->_bIsApi ? bx_api_get_msg(_t('_bx_timeline_txt_err_cannot_perform_action')) : ['message' => _t('_bx_timeline_txt_err_cannot_perform_action')];

            $this->isAllowedEdit($aEvent, true);

            //--- Process Meta ---//
            $this->_processMetas($iId, $sText);

            //--- Process Link ---//
            if($bLinkIds)
                foreach($aLinkIds as $iLinkId)
                    $this->_oDb->saveLink($iId, $iLinkId);

            //--- Process Media ---//
            $this->_saveMedia($CNF['FIELD_PHOTO'], $iId, $aPhotoIds, $iUserId);
            $this->_saveMedia($CNF['FIELD_VIDEO'], $iId, $aVideoIds, $iUserId);
            $this->_saveMedia($CNF['FIELD_FILE'], $iId, $aFileIds, $iUserId);

            //--- Process Poll ---//
            $oForm->processPolls($CNF['FIELD_POLL'], $iId);

            //--- Process Privacy
            $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
            if(($sKey = 'FIELD_OBJECT_PRIVACY_VIEW') && !empty($aEvent[$CNF[$sKey]]) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false)
                $oPrivacy->reassociateGroupCustomWithContent($iUserId, $iId, (int)$aEvent[$CNF[$sKey]]);

            $this->getCacheItemObject()->removeAllByPrefix($this->_oConfig->getPrefix('cache_item') . $iId);

            $this->onEdit($iId);

            return $this->_bIsApi ? [ 'id' => $iId ] : [ 'id' => $iId ];
        }

        return $this->_bIsApi ? ['form' => $oForm->getCodeAPI()] : [
            'id' => $iId, 
            'form' => $sCodeAdd . $oForm->getCode($bDynamicMode), 
            'form_id' => $oForm->id,
            'eval' => $sJsObjectView . '.onEditPost(oData)'
        ];
    }

    public function getFormPostObject($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

    	$sFormObject = !empty($aParams['form_object']) ? $aParams['form_object'] : 'form_post';
        $sFormDisplay = !empty($aParams['form_display']) ? $aParams['form_display'] : 'form_display_post_add';

        $oForm = BxDolForm::getObjectInstance($this->_oConfig->getObject($sFormObject), $this->_oConfig->getObject($sFormDisplay), $this->_oTemplate);
        $oForm->aFormAttrs = bx_replace_markers($oForm->aFormAttrs, [
            'js_object_post' => $this->_oConfig->getJsObject('post')
        ]);

        $sParamsKey = 'type';
        if(!empty($aParams[$sParamsKey]))
            $oForm->setType($aParams[$sParamsKey]);

        /**
         * Note. 'ajax_mode' parameter isn't checked because
         * timeline post form works as Ajax form by default.
         */
        $sParamsKey = 'visibility_autoselect';
        if(isset($aParams[$sParamsKey]) && (bool)$aParams[$sParamsKey] === true)
            $oForm->setVisibilityAutoselect((bool)$aParams[$sParamsKey]);

        $sKey = 'FIELD_LABELS';
        if(isset($oForm->aInputs[$CNF[$sKey]], $aParams['type']) && empty($oForm->aInputs[$CNF[$sKey]]['value']) && $aParams['type'] == BX_BASE_MOD_NTFS_TYPE_OWNER) {
            $iContextProfileId = !empty($aParams['context_id']) ? abs($aParams['context_id']) : $this->_iOwnerId;
            if(($oContextProfile = BxDolProfile::getInstance($iContextProfileId)) !== false) {
                $sMethod = 'is_fan';
                $sModule = $oContextProfile->getModule();
                if(bx_is_srv($sModule, $sMethod) && bx_srv($sModule, $sMethod, [$iContextProfileId, (int)bx_get_logged_profile_id()])) {
                    $aContextInfo = bx_srv($sModule, 'get_content_info_by_profile_id', [$iContextProfileId]);
                    if(!empty($aContextInfo['hashtag']))
                        $oForm->aInputs[$CNF[$sKey]]['value'] = [$aContextInfo['hashtag']];
                }
            }
        }

        $oForm->init();
        return $oForm;
    }

    public function getCmtsObject($sSystem, $iId)
    {
        if(empty($sSystem) || (int)$iId == 0)
            return false;

        $oCmts = BxDolCmts::getObjectInstance($sSystem, $iId, true, $this->_oTemplate);
        if(!$oCmts || !$oCmts->isEnabled())
            return false;

        return $oCmts;
    }

    public function getViewObject($sSystem, $iId)
    {
        if(empty($sSystem) || (int)$iId == 0)
            return false;

        $oView = BxDolView::getObjectInstance($sSystem, $iId, true, $this->_oTemplate);
        if(!$oView || !$oView->isEnabled())
            return false;

        return $oView;
    }

    public function getVoteObject($sSystem, $iId)
    {
        if(empty($sSystem) || (int)$iId == 0)
            return false;

        $oVote = BxDolVote::getObjectInstance($sSystem, $iId, true, $this->_oTemplate);
        if(!$oVote || !$oVote->isEnabled())
            return false;

        return $oVote;
    }
    
    public function getReactionObject($sSystem, $iId)
    {
        if(empty($sSystem) || (int)$iId == 0)
            return false;

        $oReaction = BxDolVote::getObjectInstance($sSystem, $iId, true, $this->_oTemplate);
        if(!$oReaction || !$oReaction->isEnabled())
            return false;

        return $oReaction;
    }

    public function getScoreObject($sSystem, $iId)
    {
        if(empty($sSystem) || (int)$iId == 0)
            return false;

        $oScore = BxDolScore::getObjectInstance($sSystem, $iId, true, $this->_oTemplate);
        if(!$oScore || !$oScore->isEnabled())
            return false;

        return $oScore;
    }

    public function getReportObject($sSystem, $iId)
    {
        if(empty($sSystem) || (int)$iId == 0)
            return false;

        $oReport = BxDolReport::getObjectInstance($sSystem, $iId, true, $this->_oTemplate);
        if(!$oReport || !$oReport->isEnabled())
            return false;

        return $oReport;
    }

    public function getAttachmentsMenuObject()
    {
        return BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_post_attachments'), $this->_oTemplate);
    }

    public function getManageMenuObject()
    {
        return BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_manage'), $this->_oTemplate);
    }

    public function getCacheItemObject()
    {
        $oCacheEngine = bx_instance('BxDolCache' . $this->_oConfig->getCacheItemEngine());
        if(!$oCacheEngine->isAvailable())
            $oCacheEngine = bx_instance('BxDolCacheFile');

        return $oCacheEngine;
    }

    public function getConnectionMuteObject()
    {
        return BxDolConnection::getObjectInstance($this->_oConfig->getObject('connection_mute'));
    }

    //--- Check permissions methods ---//
    public function serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction = false, $iProfileId = false)
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

        $CNF = &$this->_oConfig->CNF;

        // moderator and owner always have access
        $iOwnerId = (int)$aDataEntry['owner_id'];
        if(!empty($iProfileId) && (abs($iOwnerId) == (int)$iProfileId || $this->isModerator()))
            return CHECK_ACTION_RESULT_ALLOWED;

        // check ACL
        if($iOwnerId != 0 && ($oOwner = BxDolProfile::getInstanceMagic($iOwnerId)) !== false && !($oOwner instanceof BxDolProfileUndefined)) {
            $mixedCheckResult = bx_srv($oOwner->getModule(), 'check_allowed_with_content_for_profile', ['view', $oOwner->getContentId(), $iProfileId]);
            if($mixedCheckResult !== CHECK_ACTION_RESULT_ALLOWED)
                return $mixedCheckResult;
        }

        // check privacy
        if(!empty($CNF['OBJECT_PRIVACY_VIEW'])) {
            $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']);
            if($oPrivacy && !$oPrivacy->check($aDataEntry[$CNF['FIELD_ID']], $iProfileId))
                return _t('_sys_access_denied_to_private_content');
        }

        // check alert to allow custom checks
        $mixedResult = null;

        /**
         * @hooks
         * @hookdef hook-system-check_allowed_view 'system', 'check_allowed_view' - hook to override the result of checking whether 'view' action is allowed or not to specified profile
         * - $unit_name - equals `system`
         * - $action - equals `check_allowed_view`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `module` - [string] module name
         *      - `content_info` - [array] content info array as key&value pairs
         *      - `profile_id` - [boolean] or [int] profile id to be checked the availability of the action to
         *      - `override_result` - [string] or [int] by ref, check action result, can be overridden in hook processing. Return string with an error if action isn't allowed or CHECK_ACTION_RESULT_ALLOWED, @see BxDolAcl
         * @hook @ref hook-system-check_allowed_view
         */
        bx_alert('system', 'check_allowed_view', 0, 0, [
            'module' => $this->getName(), 
            'content_info' => $aDataEntry, 
            'profile_id' => $iProfileId, 
            'override_result' => &$mixedResult
        ]);
        if($mixedResult !== null)
            return $mixedResult;

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function isModerator()
    {
        return $this->isModeratorForProfile((int)$this->getUserId());
    }

    public function isModeratorForProfile($iUserId)
    {
        if($this->checkAllowedEditAnyEntryForProfile(false, $iUserId) === CHECK_ACTION_RESULT_ALLOWED)
            return true;

        if($this->checkAllowedDeleteAnyEntryForProfile(false, $iUserId) === CHECK_ACTION_RESULT_ALLOWED)
            return true;

        return false;
    }

    public function isAllowedPost($bPerform = false)
    {
        if(isAdmin())
            return true;

        $iUserId = $this->getUserId();

        $aCheckResult = checkActionModule($iUserId, 'post', $this->getName(), $bPerform);
        if($aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return $aCheckResult[CHECK_ACTION_MESSAGE];
        
        if(!empty($this->_iOwnerId) && ($oProfileOwner = BxDolProfile::getInstance($this->_iOwnerId)) !== false) {
            if($oProfileOwner->checkAllowedPostInProfile($this->_iOwnerId, $this->getName()) !== CHECK_ACTION_RESULT_ALLOWED)
                return _t('_sys_txt_access_denied');

            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_post '{profile_module_name}', 'timeline_post' - hook to override the result of checking whether 'post in profile' action is allowed or not
             * - $unit_name - profile module name
             * - $action - equals `timeline_post`
             * - $object_id - timeline owner profile id
             * - $sender_id - performer profile id
             * - $extra_params - array of additional params with the following array keys:
             *      - `check_result` - [array] by ref, check action result, can be overridden in hook processing.
             * @hook @ref hook-bx_base_profile-timeline_post
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_post', $oProfileOwner->id(), $iUserId, [
                'check_result' => &$aCheckResult,
            ]);
        }

        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    public function isAllowedView($aEvent, $bPerform = false)
    {
        $CNF = $this->_oConfig->CNF;

        if((int)$aEvent[$CNF['FIELD_OWNER_ID']] == 0)
            return true;

        $oProfileOwner = BxDolProfile::getInstance($aEvent[$CNF['FIELD_OWNER_ID']]);
        if($oProfileOwner && $oProfileOwner->checkAllowedProfileView() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        $oPrivacy = BxDolPrivacy::getObjectInstance($this->_oConfig->getObject('privacy_view'));
        if(!$oPrivacy) 
            return true;

        $oPrivacy->setTableFieldAuthor($this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? 'owner_id' : 'object_id');

        return $oPrivacy->check($aEvent[$CNF['FIELD_ID']]);
    }

    public function isAllowedEdit($aEvent, $bPerform = false)
    {
        if(!isLogged())
            return false;
            
        //--- System posts and Reposts cannot be edited at all.
        if(!$this->_oConfig->isCommon($aEvent['type'], $aEvent['action']) || $aEvent['type'] == $this->_oConfig->getPrefix('common_post') . 'repost')
            return false;

        if(isAdmin())
            return true;

        $iUserId = (int)$this->getUserId();
        $iOwnerId = (int)$aEvent['owner_id'];
        $iObjectId = abs((int)$aEvent['object_id']);
        if($iObjectId == $iUserId && $this->_oConfig->isAllowEdit())
           return true;

        $aCheckResult = checkActionModule($iUserId, 'edit', $this->getName(), $bPerform);
        if(!empty($iOwnerId) && ($oProfileOwner = BxDolProfile::getInstance($iOwnerId)) !== false) {
            if(BxDolService::call($oProfileOwner->getModule(), 'check_allowed_module_action_in_profile', array($oProfileOwner->getContentId(), $this->getName(), 'edit_any')) === CHECK_ACTION_RESULT_ALLOWED)
                return true;

            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_edit '{profile_module_name}', 'timeline_edit' - hook to override the result of checking whether 'edit' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_post
             * @hook @ref hook-bx_base_profile-timeline_edit
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_edit', $oProfileOwner->id(), $iUserId, [
                'check_result' => &$aCheckResult
            ]);
        }

        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    public function isAllowedDelete($aEvent, $bPerform = false)
    {
        if(!isLogged())
            return false;

        if(isAdmin())
            return true;

        $iUserId = (int)$this->getUserId();
        $iOwnerId = (int)$aEvent['owner_id'];
        $iObjectId = abs((int)$aEvent['object_id']);
        if((($iOwnerId == $iUserId && $this->_oConfig->isAllowDelete()) || ($this->_oConfig->isCommon($aEvent['type'], $aEvent['action']) && $iObjectId == $iUserId)))
           return true;

        $aCheckResult = checkActionModule($iUserId, 'delete', $this->getName(), $bPerform);
        if(!empty($iOwnerId) && ($oProfileOwner = BxDolProfile::getInstance($iOwnerId)) !== false) {
            if(BxDolService::call($oProfileOwner->getModule(), 'check_allowed_module_action_in_profile', array($oProfileOwner->getContentId(), $this->getName(), 'delete_any')) === CHECK_ACTION_RESULT_ALLOWED)
                return true;

            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_delete '{profile_module_name}', 'timeline_delete' - hook to override the result of checking whether 'delete' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_post
             * @hook @ref hook-bx_base_profile-timeline_delete
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_delete', $oProfileOwner->id(), $iUserId, [
                'check_result' => &$aCheckResult
            ]);
        }

        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    public function isAllowedComment($aEvent, $bPerform = false)
    {
        $mixedComments = $this->getCommentsData($aEvent['comments']);
        if($mixedComments === false)
            return false;

        list($sSystem, $iObjectId, $iCount) = $mixedComments;
        $oCmts = $this->getCmtsObject($sSystem, $iObjectId);

        if($oCmts->isViewAllowed() !== CHECK_ACTION_RESULT_ALLOWED || ($iCount == 0 && !$oCmts->isPostAllowed()))
            return false;

        $oCmts->addCssJs();
        return true;
    }

    public function isAllowedViewCounter($aEvent, $bPerform = false)
    {
        $mixedViews = $this->getViewsData($aEvent['views']);
        if($mixedViews === false)
            return false;

        list($sSystem, $iObjectId) = $mixedViews;
        $oView = $this->getViewObject($sSystem, $iObjectId);

        if(!$oView->isAllowedViewView($bPerform))
        	return false;

        $bResult = true;
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_view_counter '{profile_module_name}', 'timeline_view_counter' - hook to override the result of checking whether 'view counter' action is allowed or not
             * - $unit_name - profile module name
             * - $action - equals `timeline_view_counter`
             * - $object_id - timeline owner profile id
             * - $sender_id - performer profile id
             * - $extra_params - array of additional params with the following array keys:
             *      - `result` - [boolean] by ref, check action result, can be overridden in hook processing.
             * @hook @ref hook-bx_base_profile-timeline_view_counter
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_view_counter', $oProfileOwner->id(), (int)$this->getUserId(), [
                'result' => &$bResult
            ]);

        return $bResult;
    }

    public function isAllowedVote($aEvent, $bPerform = false)
    {
        $mixedVotes = $this->getVotesData($aEvent['votes']);
        if($mixedVotes === false)
            return false;

        list($sSystem, $iObjectId) = $mixedVotes;
        $oVote = $this->getVoteObject($sSystem, $iObjectId);

        if(!$oVote->isAllowedVote($bPerform))
            return false;

        $bResult = true;
        
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_vote '{profile_module_name}', 'timeline_vote' - hook to override the result of checking whether 'vote' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_view_counter
             * @hook @ref hook-bx_base_profile-timeline_vote
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_vote', $oProfileOwner->id(), (int)$this->getUserId(), [
                'result' => &$bResult
            ]);

        return $bResult;
    }
    
    public function isAllowedVoteView($aEvent, $bPerform = false)
    {
        $mixedVotes = $this->getVotesData($aEvent['votes']);
        if($mixedVotes === false)
            return false;

        list($sSystem, $iObjectId) = $mixedVotes;
        $oVote = $this->getVoteObject($sSystem, $iObjectId);

        if(!$oVote->isAllowedVoteView($bPerform))
            return false;

        $bResult = true;
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_vote_view '{profile_module_name}', 'timeline_vote_view' - hook to override the result of checking whether 'vote' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_view_counter
             * @hook @ref hook-bx_base_profile-timeline_vote_view
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_vote_view', $oProfileOwner->id(), (int)$this->getUserId(), [
                'result' => &$bResult
            ]);

        return $bResult;
    }

    public function isAllowedReaction($aEvent, $bPerform = false)
    {
        $mixedReactions = $this->getReactionsData($aEvent['reactions']);
        if($mixedReactions === false)
            return false;

        list($sSystem, $iObjectId) = $mixedReactions;
        $oReaction = $this->getReactionObject($sSystem, $iObjectId);

        if(!$oReaction->isAllowedVote($bPerform))
            return false;

        $bResult = true;
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_reaction '{profile_module_name}', 'timeline_reaction' - hook to override the result of checking whether 'give reaction vote' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_view_counter
             * @hook @ref hook-bx_base_profile-timeline_reaction
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_reaction', $oProfileOwner->id(), (int)$this->getUserId(), [
                'result' => &$bResult
            ]);

        return $bResult;
    }

    public function isAllowedReactionView($aEvent, $bPerform = false)
    {
        $mixedReactions = $this->getReactionsData($aEvent['reactions']);
        if($mixedReactions === false)
            return false;

        list($sSystem, $iObjectId) = $mixedReactions;
        $oReaction = $this->getReactionObject($sSystem, $iObjectId);

        if(!$oReaction->isAllowedVoteView($bPerform))
            return false;

        $bResult = true;
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_reaction_view '{profile_module_name}', 'timeline_reaction_view' - hook to override the result of checking whether 'view reactions' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_view_counter
             * @hook @ref hook-bx_base_profile-timeline_reaction_view
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_reaction_view', $oProfileOwner->id(), (int)$this->getUserId(), [
                'result' => &$bResult
            ]);

        return $bResult;
    }

    public function isAllowedScore($aEvent, $bPerform = false)
    {
        $mixedScores = $this->getScoresData($aEvent['scores']);
        if($mixedScores === false)
            return false;

        list($sSystem, $iObjectId) = $mixedScores;
        $oScore = $this->getScoreObject($sSystem, $iObjectId);

        if(!$oScore->isAllowedVote($bPerform))
        	return false;

        $bResult = true;
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_score '{profile_module_name}', 'timeline_score' - hook to override the result of checking whether 'give score vote' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_view_counter
             * @hook @ref hook-bx_base_profile-timeline_score
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_score', $oProfileOwner->id(), (int)$this->getUserId(), [
                'result' => &$bResult
            ]);

        return $bResult;
    }

    public function isAllowedReport($aEvent, $bPerform = false)
    {
        $mixedReports = $this->getReportsData($aEvent['reports']);
        if($mixedReports === false)
            return false;

        list($sSystem, $iObjectId) = $mixedReports;
        $oReport = $this->getReportObject($sSystem, $iObjectId);

        if(!$oReport->isAllowedReport($bPerform))
        	return false;

        $bResult = true;
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_report '{profile_module_name}', 'timeline_report' - hook to override the result of checking whether 'give score vote' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_view_counter
             * @hook @ref hook-bx_base_profile-timeline_report
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_report', $oProfileOwner->id(), (int)$this->getUserId(), [
                'result' => &$bResult
            ]);

        return $bResult;
    }

    public function isAllowedRepost($aEvent, $bPerform = false)
    {
        $mixedResult = $this->_isAllowedRepost($aEvent, $bPerform);

        /**
         * @hooks
         * @hookdef hook-bx_timeline-is_allowed_repost 'bx_timeline', 'is_allowed_repost' - hook to override the result of checking whether 'repost' action is allowed or not
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `is_allowed_repost`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `content_info` - [array] content info array as key&value pairs
         *      - `override_result` - [string] or [int] by ref, check action result, can be overridden in hook processing. Return string with an error if action isn't allowed or CHECK_ACTION_RESULT_ALLOWED, @see BxDolAcl
         * @hook @ref hook-bx_timeline-is_allowed_repost
         */
        bx_alert($this->getName(), 'is_allowed_repost', 0, 0, [
            'content_info' => $aEvent, 
            'override_result' => &$mixedResult
        ]);

        return $mixedResult;
    }

    public function isAllowedSend($aEvent, $bPerform = false)
    {
        if(!$this->_oDb->isEnabledByName('bx_convos'))
            return false;

        if(isAdmin())
            return true;

        $iUserId = (int)$this->getUserId();
        if($iUserId == 0)
            return false;

        $aCheckResult = checkActionModule($iUserId, 'send', $this->getName(), $bPerform);
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_send '{profile_module_name}', 'timeline_send' - hook to override the result of checking whether 'send' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_post
             * @hook @ref hook-bx_base_profile-timeline_send
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_send', $oProfileOwner->id(), $iUserId, [
                'check_result' => &$aCheckResult
            ]);

        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    public function isAllowedMute($aEvent, $bPerform = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!empty($aEvent[$CNF['FIELD_OWNER_ID']]) && $aEvent[$CNF['FIELD_OWNER_ID']] != $this->_iProfileId)
            return false;

        $iAuthor = (int)$aEvent[$CNF['FIELD_OWNER_ID']];
        if(!$this->_oConfig->isSystem($aEvent['type'], $aEvent['action']))
            $iAuthor = (int)$aEvent[$CNF['FIELD_OBJECT_ID']];

        if($this->_iProfileId == $iAuthor || $this->getConnectionMuteObject()->isConnected($this->_iProfileId, $iAuthor))
            return false;

        return $this->_isAllowedMute($bPerform);
    }

    public function isAllowedUnmute($iAuthor, $bPerform = false)
    {
    	if(!$this->getConnectionMuteObject()->isConnected($this->_iProfileId, $iAuthor))
            return false;

        return $this->_isAllowedMute($bPerform);
    }

    /**
     * Pin - "Pin here" - pin the post on Profile Timeline for profile owner.
     * Can be done by profile owner for himself or by admin for profile owner to see.
     * @param type $aEvent
     * @param type $bPerform
     * @return boolean
     */
    public function isAllowedPin($aEvent, $bPerform = false)
    {
    	if((int)$aEvent['pinned'] != 0)
    		return false;

        return $this->_isAllowedPin($aEvent, $bPerform);
    }

    public function isAllowedUnpin($aEvent, $bPerform = false)
    {
    	if((int)$aEvent['pinned'] == 0)
    		return false;

        return $this->_isAllowedPin($aEvent, $bPerform);
    }

    /**
     * Stick - "Pin for All" - pin the post on Public Timeline for everybody to see.
     * Is available for Administrators/Moderators only.
     * @param type $aEvent
     * @param type $bPerform
     * @return boolean
     */
    public function isAllowedStick($aEvent, $bPerform = false)
    {
    	if((int)$aEvent['sticked'] != 0)
    		return false;
    
    	return $this->_isAllowedStick($aEvent, $bPerform);
    }
    
    public function isAllowedUnstick($aEvent, $bPerform = false)
    {
    	if((int)$aEvent['sticked'] == 0)
            return false;
    
    	return $this->_isAllowedStick($aEvent, $bPerform);
    }
    
    public function isAllowedPromote($aEvent, $bPerform = false)
    {
    	if((int)$aEvent['promoted'] != 0)
            return false;

        return $this->_isAllowedPromote($aEvent, $bPerform);
    }

    public function isAllowedUnpromote($aEvent, $bPerform = false)
    {
    	if((int)$aEvent['promoted'] == 0)
            return false;

        return $this->_isAllowedPromote($aEvent, $bPerform);
    }

    public function isAllowedNotes($aEvent, $bPerform = false)
    {
        return $this->isModerator();
    }

    public function isAllowedMore($aEvent, $bPerform = false)
    {
    	$oMoreMenu = $this->getManageMenuObject();
        if(!$oMoreMenu)
            return false;

    	$oMoreMenu->setEvent($aEvent);
    	return $oMoreMenu->isVisible();
    }

    public function checkAllowedView ($aContentInfo, $isPerformAction = false)
    {
        if(!$this->isAllowedView($aContentInfo, $isPerformAction))
            return _t('_sys_txt_access_denied');

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedDelete (&$aDataEntry, $isPerformAction = false)
    {
        if(($mixedResult = $this->isAllowedDelete($aDataEntry, $isPerformAction)) !== true)
            return is_string($mixedResult) ? $mixedResult : _t('_sys_txt_access_denied');

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * Checks if it's allowed to view a comment by checking the availability to view the content which was commented. 
     * Note. Don't check the related comments object for view action accessibility because this method is called from there.
     */
    public function checkAllowedCommentsView ($aContentInfo, $isPerformAction = false)
    {
        $CNF = $this->_oConfig->CNF;

        $iOwner = (int)$aContentInfo[$CNF['FIELD_OWNER_ID']];
        if($iOwner == 0) //--- in case of Public Timeline.
            return CHECK_ACTION_RESULT_ALLOWED;

        $oOwner = BxDolProfile::getInstance($iOwner);
        if(!$oOwner) //--- in case of non-existed Timeline owner.
            return _t('_sys_txt_access_denied');

        $mixedResult = $oOwner->checkAllowedProfileView();
        if($mixedResult !== CHECK_ACTION_RESULT_ALLOWED)
            return $mixedResult;

        return $this->checkAllowedView($aContentInfo, $isPerformAction);
    }

    /**
     * Checks if it's allowed to post a comment by checking the availability to post anything in the context. 
     * Note. Don't check the related comments object for post action accessibility because this method is called from there.
     */
    public function checkAllowedCommentsPost ($aContentInfo, $isPerformAction = false)
    {
        $CNF = $this->_oConfig->CNF;

        $iOwner = (int)$aContentInfo[$CNF['FIELD_OWNER_ID']];
        if($iOwner == 0) //--- in case of Public Timeline.
            return CHECK_ACTION_RESULT_ALLOWED;

        $oOwner = BxDolProfile::getInstance($iOwner);
        if(!$oOwner) //--- in case of non-existed Timeline owner.
            return _t('_sys_txt_access_denied');

        /*
         * Disabled in accordance with #4238 ticket.
         * 
        if(($mixedResult = $oOwner->checkAllowedPostInProfile()) !== CHECK_ACTION_RESULT_ALLOWED)
            return $mixedResult;
         */

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedEditAnyEntryForProfile ($isPerformAction = false, $iProfileId = false)
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

    	$aCheck = checkActionModule($iProfileId, 'edit', $this->getName(), $isPerformAction);
    	if($aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

    	return _t('_sys_txt_access_denied');
    }

    public function checkAllowedDeleteAnyEntryForProfile ($isPerformAction = false, $iProfileId = false)
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

    	$aCheck = checkActionModule($iProfileId, 'delete', $this->getName(), $isPerformAction);
    	if($aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

    	return _t('_sys_txt_access_denied');
    }

    public function onPost($iContentId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iContentId]);

        if($this->_oConfig->isSystem($aEvent[$CNF['FIELD_TYPE']], $aEvent[$CNF['FIELD_ACTION']])) {
            //--- Request event's data from content module and update it in the Timeline DB.
            $this->_oTemplate->getDataCached($aEvent);

            $sPostType = 'system';
            $iSenderId = $iObjectAuthorId = (int)$aEvent['owner_id'];
        } 
        else {
            $sPostType = 'common';
            $iSenderId = $iObjectAuthorId = (int)$aEvent['object_id'];
        }

        $this->rebuildSlice();

        $sAction = ($aEvent[$CNF['FIELD_STATUS']] == BX_TIMELINE_STATUS_AWAITING ? 'defer' : 'post') . '_' . $sPostType;
        
        /**
         * @hooks
         * @hookdef hook-bx_timeline-post_system 'bx_timeline', 'post_system' - hook after system post was added and published
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `post_system`
         * - $object_id - content id
         * - $sender_id - content author profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `source` - [string] unique source 
         *      - `owner_id` - [int] owner profile id
         *      - `object_author_id` - [int] object author profile id
         *      - `privacy_view` - [int] or [string] privacy for view content action, @see BxDolPrivacy
         * @hook @ref hook-bx_timeline-post_system
         */
        /**
         * @hooks
         * @hookdef hook-bx_timeline-post_common 'bx_timeline', 'post_common' - hook after common post was added and published
         * It's equivalent to @ref hook-bx_timeline-post_system
         * @hook @ref hook-bx_timeline-post_common
         */
        /**
         * @hooks
         * @hookdef hook-bx_timeline-defer_system 'bx_timeline', 'defer_system' - hook after system post was added
         * It's equivalent to @ref hook-bx_timeline-post_system
         * @hook @ref hook-bx_timeline-defer_system
         */
        /**
         * @hooks
         * @hookdef hook-bx_timeline-defer_common 'bx_timeline', 'defer_common' - hook after common post was added
         * It's equivalent to @ref hook-bx_timeline-post_system
         * @hook @ref hook-bx_timeline-defer_common
         */
        bx_alert($this->_oConfig->getObject('alert'), $sAction, $iContentId, $iSenderId, [
            'source' => $aEvent[$CNF['FIELD_SOURCE']],
            'owner_id' => $aEvent[$CNF['FIELD_OWNER_ID']],
            'object_author_id' => $iObjectAuthorId,
            'privacy_view' => $aEvent[$CNF['FIELD_OBJECT_PRIVACY_VIEW']],
        ]);

        /**
         * Note. 0 is used as $iContentId to allow to subscribe on all events at once.
         */
        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
            $oSockets->sendEvent($this->_oConfig->getSocketName(), 0, 'added', json_encode([
                'id' => $aEvent[$CNF['FIELD_ID']],
                'author_id' => $aEvent[$CNF['FIELD_OBJECT_OWNER_ID']],
                'peformer_id' => $iSenderId
            ]));
    }

    public function onEdit($iContentId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iContentId]);
        $iSenderId = $this->_oConfig->isSystem($aEvent[$CNF['FIELD_TYPE']], $aEvent[$CNF['FIELD_ACTION']]) ? $aEvent['owner_id'] : $aEvent['object_id'];

        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
            $oSockets->sendEvent($this->_oConfig->getSocketName(), 0, 'edited', json_encode([
                'id' => $aEvent[$CNF['FIELD_ID']],
                'author_id' => $aEvent[$CNF['FIELD_OBJECT_OWNER_ID']],
                'peformer_id' => $iSenderId
            ]));
    }

    public function onPublished($iContentId)
    {
        //--- Clear Item cache
        $this->getCacheItemObject()->removeAllByPrefix($this->_oConfig->getPrefix('cache_item') . $iContentId);

        $this->onPost($iContentId);
    }
    
    public function onFailed($iContentId)
    {
        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContentId));

        //--- Clear Item cache
        $this->getCacheItemObject()->removeAllByPrefix($this->_oConfig->getPrefix('cache_item') . $iContentId);

        if($this->_oConfig->isSystem($aEvent['type'], $aEvent['action'])) {
            //--- Request event's data from content module and update it in the Timeline DB.
            $this->_oTemplate->getDataCached($aEvent);

            $sPostType = 'system';
            $iSenderId = $iObjectAuthorId = (int)$aEvent['owner_id'];
        } 
        else {
            $sPostType = 'common';
            $iSenderId = $iObjectAuthorId = (int)$aEvent['object_id'];
        }

        /**
         * @hooks
         * @hookdef hook-bx_timeline-fail_system 'bx_timeline', 'fail_system' - hook after system post failed to publish
         * It's equivalent to @ref hook-bx_timeline-post_system
         * @hook @ref hook-bx_timeline-fail_system
         */
        /**
         * @hooks
         * @hookdef hook-bx_timeline-fail_common 'bx_timeline', 'fail_common' - hook after common post failed to publish
         * It's equivalent to @ref hook-bx_timeline-post_system
         * @hook @ref hook-bx_timeline-fail_common
         */
        bx_alert($this->_oConfig->getObject('alert'), 'fail_' . $sPostType, $iContentId, $iSenderId, [
            'source' => $this->_oConfig->getName() . '_' . $iContentId,
            'owner_id' => $aEvent['owner_id'],
            'object_author_id' => $iObjectAuthorId,
            'privacy_view' => $aEvent['object_privacy_view'],
        ]);
    }

    public function onRepost($iContentId, $aReposted = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContentId));

        if(empty($aReposted)) {
            $aContent = unserialize($aEvent['content']);

            $aReposted = $this->_oDb->getReposted($aContent['type'], $aContent['action'], $aContent['object_id']);
            if(empty($aReposted) || !is_array($aReposted))
                return;
        }

        $iUserId = (int)$aEvent[$CNF['FIELD_OBJECT_OWNER_ID']];
        $this->_oDb->insertRepostTrack($aEvent['id'], $iUserId, $this->getUserIp(), $aReposted['id']);
        $this->_oDb->updateRepostCounter($aReposted['id'], $aReposted['reposts']);

        $this->rebuildSlice();

        /**
         * @hooks
         * @hookdef hook-bx_timeline-repost 'bx_timeline', 'repost' - hook after repost was added (published)
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `repost`
         * - $object_id - reposted content id
         * - $sender_id - performer profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `repost_id` - [int] repost id
         *      - `object_author_id` - [int] reposted content author profile id
         *      - `privacy_view` - [int] or [string] privacy for view content action, @see BxDolPrivacy
         * @hook @ref hook-bx_timeline-repost
         */
        bx_alert($this->_oConfig->getObject('alert'), 'repost', $aReposted['id'], $iUserId, [
            'repost_id' => $iContentId,
            'object_author_id' => $aReposted['owner_id'],
            'privacy_view' => $aEvent['object_privacy_view'],
        ]);
    }

    public function onHide($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $iUserId = $this->getUserId();
    	$sCommonPostPrefix = $this->_oConfig->getPrefix('common_post');

    	//--- Update parent event when repost event was deactivated.
    	$bRepost = $aEvent['type'] == $sCommonPostPrefix . BX_TIMELINE_PARSE_TYPE_REPOST;
        if($bRepost) {
            $this->_oDb->updateRepostTrack(['active' => 0], ['event_id' => $aEvent[$CNF['FIELD_ID']]]);

            $aContent = unserialize($aEvent['content']);
            $aReposted = $this->_oDb->getReposted($aContent['type'], $aContent['action'], $aContent['object_id']);
            if(!empty($aReposted) && is_array($aReposted))
                $this->_oDb->updateRepostCounter($aReposted[$CNF['FIELD_ID']], $aReposted['reposts'], -1);
        }

        //--- Find and hide repost events when parent event was deactivated.
        $aRepostEvents = $this->_oDb->getEvents(['browse' => 'reposted_by_track', 'value' => $aEvent[$CNF['FIELD_ID']]]);
        foreach($aRepostEvents as $aRepostEvent) {
            if((int)$this->_oDb->updateEvent(['active' => 0], ['id' => (int)$aRepostEvent[$CNF['FIELD_ID']]]) == 0) 
                continue;

            $this->_oDb->updateRepostTrack(['active' => 0], ['event_id' => $aRepostEvent[$CNF['FIELD_ID']]]);

            /**
             * @hooks
             * @hookdef hook-bx_timeline-hide_repost 'bx_timeline', 'hide_repost' - hook after repost was hidden
             * - $unit_name - equals `bx_timeline`
             * - $action - equals `hide_repost`
             * - $object_id - content id
             * - $sender_id - performer profile id
             * - $extra_params - array of additional params with the following array keys:
             *      - `repost_id` - [int] repost id
             * @hook @ref hook-bx_timeline-hide_repost
             */
            bx_alert($this->_oConfig->getObject('alert'), 'hide_repost', $aEvent[$CNF['FIELD_ID']], $iUserId, [
                'repost_id' => $aRepostEvent[$CNF['FIELD_ID']],
            ]);
        }

        //--- Delete associated meta for Common events.
        if($this->_oConfig->isCommon($aEvent['type'], $aEvent['action'])) {
            $oMetatags = BxDolMetatags::getObjectInstance($this->_oConfig->getObject('metatags'));
            $oMetatags->onDeleteContent($aEvent[$CNF['FIELD_ID']]);
        }

        //--- Delete item cache.
        $this->deleteCacheItem($aEvent[$CNF['FIELD_ID']]);

        //--- Rebuild cache table.
        $this->rebuildSlice();

        //--- Event -> Hide for Alerts Engine ---//
        if($bRepost)
            /**
             * @hooks
             * @hookdef hook-bx_timeline-hide_repost 'bx_timeline', 'hide_repost' - hook after repost was hidden
             * - $unit_name - equals `bx_timeline`
             * - $action - equals `hide_repost`
             * - $object_id - content id
             * - $sender_id - performer profile id
             * - $extra_params - array of additional params with the following array keys:
             *      - `repost_id` - [int] repost id
             * @hook @ref hook-bx_timeline-hide_repost
             */
            bx_alert($this->_oConfig->getObject('alert'), 'hide_repost', $aReposted[$CNF['FIELD_ID']], $iUserId, [
                'repost_id' => $aEvent[$CNF['FIELD_ID']],
            ]);
        else
            /**
             * @hooks
             * @hookdef hook-bx_timeline-hide 'bx_timeline', 'hide' - hook after post (event) was hidden
             * - $unit_name - equals `bx_timeline`
             * - $action - equals `hide`
             * - $object_id - content id
             * - $sender_id - performer profile id
             * - $extra_params - not used
             * @hook @ref hook-bx_timeline-hide
             */
            bx_alert($this->_oConfig->getObject('alert'), 'hide', $aEvent[$CNF['FIELD_ID']], $iUserId);
    }

    public function onUnhide($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $iUserId = $this->getUserId();
    	$sCommonPostPrefix = $this->_oConfig->getPrefix('common_post');

    	//--- Update parent event when repost event was activated back.
    	$bRepost = $aEvent['type'] == $sCommonPostPrefix . BX_TIMELINE_PARSE_TYPE_REPOST;
        if($bRepost) {
            $this->_oDb->updateRepostTrack(['active' => 1], ['event_id' => $aEvent[$CNF['FIELD_ID']]]);

            $aContent = unserialize($aEvent['content']);
            $aReposted = $this->_oDb->getReposted($aContent['type'], $aContent['action'], $aContent['object_id']);
            if(!empty($aReposted) && is_array($aReposted))
                $this->_oDb->updateRepostCounter($aReposted[$CNF['FIELD_ID']], $aReposted['reposts'], 1);
        }

        //--- Find and hide repost events when parent event was activated back.
        $aRepostEvents = $this->_oDb->getEvents(['browse' => 'reposted_by_track', 'value' => $aEvent[$CNF['FIELD_ID']]]);
        foreach($aRepostEvents as $aRepostEvent) {
            if((int)$this->_oDb->updateEvent(['active' => 1], ['id' => (int)$aRepostEvent[$CNF['FIELD_ID']]]) == 0) 
                continue;

            $this->_oDb->updateRepostTrack(['active' => 1], ['event_id' => $aRepostEvent[$CNF['FIELD_ID']]]);

            /**
             * @hooks
             * @hookdef hook-bx_timeline-unhide_repost 'bx_timeline', 'unhide_repost' - hook after repost was unhidden
             * It's equivalent to @ref hook-bx_timeline-hide_repost
             * @hook @ref hook-bx_timeline-unhide_repost
             */
            bx_alert($this->_oConfig->getObject('alert'), 'unhide_repost', $aEvent[$CNF['FIELD_ID']], $iUserId, [
                'repost_id' => $aRepostEvent[$CNF['FIELD_ID']],
            ]);
        }

        //--- Process meta for Common events.
        if($this->_oConfig->isCommon($aEvent['type'], $aEvent['action'])) {
            $aContent = unserialize($aEvent['content']);

            $this->_processMetas($aEvent[$CNF['FIELD_ID']], $aContent['text']);
        }

        //--- Rebuild cache table.
        $this->rebuildSlice();

        if($bRepost)
            /**
             * @hooks
             * @hookdef hook-bx_timeline-unhide_repost 'bx_timeline', 'unhide_repost' - hook after repost was unhidden
             * It's equivalent to @ref hook-bx_timeline-hide_repost
             * @hook @ref hook-bx_timeline-unhide_repost
             */
            bx_alert($this->_oConfig->getObject('alert'), 'unhide_repost', $aReposted[$CNF['FIELD_ID']], $iUserId, [
                'repost_id' => $aEvent[$CNF['FIELD_ID']],
            ]);
        else
            /**
             * @hooks
             * @hookdef hook-bx_timeline-unhide 'bx_timeline', 'unhide' - hook after post (event) was unhidden
             * It's equivalent to @ref hook-bx_timeline-hide
             * @hook @ref hook-bx_timeline-unhide
             */
            bx_alert($this->_oConfig->getObject('alert'), 'unhide', $aEvent[$CNF['FIELD_ID']], $iUserId);
    }

    public function onDelete($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $iUserId = $this->getUserId();
    	$sCommonPostPrefix = $this->_oConfig->getPrefix('common_post');
    	$sCommonPostComment = $this->_oConfig->getObject('comment');

        $bIsSystem = $this->_oConfig->isSystem($aEvent[$CNF['FIELD_TYPE']], $aEvent[$CNF['FIELD_ACTION']]);
        
        //--- Delete related flags.
        $this->_oDb->deleteEventFlags($aEvent[$CNF['FIELD_ID']]);

    	//--- Delete comments for Common posts.
    	if(!$bIsSystem && ($oComments = $this->getCmtsObject($sCommonPostComment, $aEvent[$CNF['FIELD_ID']])) !== false)
            $oComments->onObjectDelete($aEvent[$CNF['FIELD_ID']]);

    	//--- Delete attached photos, videos and links when common event was deleted.
    	if($aEvent['type'] == $sCommonPostPrefix . BX_TIMELINE_PARSE_TYPE_POST) {
            $this->_deleteMedia($CNF['FIELD_PHOTO'], $aEvent[$CNF['FIELD_ID']]);
            $this->_deleteMedia($CNF['FIELD_VIDEO'], $aEvent[$CNF['FIELD_ID']]);
            $this->_deleteMedia($CNF['FIELD_FILE'], $aEvent[$CNF['FIELD_ID']]);
            $this->_deleteLinks($aEvent[$CNF['FIELD_ID']]);

            $this->_oDb->deletePolls(['content_id' => $aEvent[$CNF['FIELD_ID']]]);
    	}

    	//--- Update parent event when repost event was deleted.
    	$bRepost = $aEvent['type'] == $sCommonPostPrefix . BX_TIMELINE_PARSE_TYPE_REPOST;
        if($bRepost) {
            $this->_oDb->deleteRepostTrack($aEvent[$CNF['FIELD_ID']]);

            $aContent = unserialize($aEvent['content']);
            $aReposted = $this->_oDb->getReposted($aContent['type'], $aContent['action'], $aContent['object_id']);
            if(!empty($aReposted) && is_array($aReposted))
                $this->_oDb->updateRepostCounter($aReposted[$CNF['FIELD_ID']], $aReposted['reposts'], -1);
        }

        //--- Find and delete repost events when parent event was deleted.
        $aRepostEvents = $this->_oDb->getEvents(array('browse' => 'reposted_by_track', 'value' => $aEvent[$CNF['FIELD_ID']]));
        foreach($aRepostEvents as $aRepostEvent) {
            if((int)$this->_oDb->deleteEvent(array('id' => (int)$aRepostEvent[$CNF['FIELD_ID']])) == 0) 
                continue;

            $this->_oDb->deleteRepostTrack($aRepostEvent[$CNF['FIELD_ID']]);

            $oComments = $this->getCmtsObject($sCommonPostComment, $aRepostEvent[$CNF['FIELD_ID']]);
            if($oComments !== false)
                $oComments->onObjectDelete($aRepostEvent[$CNF['FIELD_ID']]);

            /**
             * @hooks
             * @hookdef hook-bx_timeline-delete_repost 'bx_timeline', 'delete_repost' - hook after repost was deleted
             * It's equivalent to @ref hook-bx_timeline-hide_repost
             * @hook @ref hook-bx_timeline-delete_repost
             */
            bx_alert($this->_oConfig->getObject('alert'), 'delete_repost', $aEvent[$CNF['FIELD_ID']], $iUserId, [
                'repost_id' => $aRepostEvent[$CNF['FIELD_ID']],
            ]);
        }

        //--- Delete associated meta for Common events.
        if(!$bIsSystem && ($oMetatags = BxDolMetatags::getObjectInstance($this->_oConfig->getObject('metatags'))) !== false)
            $oMetatags->onDeleteContent($aEvent[$CNF['FIELD_ID']]);

        //--- Delete item cache.
        $this->deleteCacheItem($aEvent[$CNF['FIELD_ID']]);

        //--- Rebuild cache table.
        $this->rebuildSlice();

        if($bRepost)
            /**
             * @hooks
             * @hookdef hook-bx_timeline-delete_repost 'bx_timeline', 'delete_repost' - hook after repost was deleted
             * It's equivalent to @ref hook-bx_timeline-hide_repost
             * @hook @ref hook-bx_timeline-delete_repost
             */
            bx_alert($this->_oConfig->getObject('alert'), 'delete_repost', $aReposted[$CNF['FIELD_ID']], $iUserId, [
                'repost_id' => $aEvent[$CNF['FIELD_ID']],
            ]);
        else if(!$bIsSystem)
            /**
             * @hooks
             * @hookdef hook-bx_timeline-delete 'bx_timeline', 'delete' - hook after 'common' post (event) was deleted
             * It's equivalent to @ref hook-bx_timeline-hide
             * @hook @ref hook-bx_timeline-delete
             */
            bx_alert($this->_oConfig->getObject('alert'), 'delete', $aEvent[$CNF['FIELD_ID']], $iUserId, [
                'object_author_id' => (int)$aEvent['object_id'],
                'privacy_view' => $aEvent[$CNF['FIELD_OBJECT_PRIVACY_VIEW']]
            ]);
        //--- Event -> Delete for Alerts Engine ---//

        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
            $oSockets->sendEvent($this->_oConfig->getSocketName(), 0, 'deleted', json_encode([
                'id' => $aEvent[$CNF['FIELD_ID']],
                'author_id' => $aEvent[$CNF['FIELD_OBJECT_OWNER_ID']],
                'peformer_id' => $iUserId
            ]));
    }

    public function getParams($sView = '', $sType = '', $iOwnerId = 0, $iStart = 0, $iPerPage = 0, $sFilter = BX_TIMELINE_FILTER_DEFAULT, $aModules = array(), $iTimeline = 0)
    {
        return $this->_prepareParams(array(
            'view' => $sView,
            'type' => $sType,
            'owner_id' => $iOwnerId,
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'timeline' => $iTimeline, 
            'filter' => $sFilter, 
            'modules' => $aModules
        ));
    }

    public function getParamsExt($aParams = array())
    {
        return $this->_prepareParams($aParams);
    }

    public function getViewsData(&$aViews)
    {
        if(empty($aViews) || !is_array($aViews))
            return false;

        $sSystem = isset($aViews['system']) ? $aViews['system'] : '';
        $iObjectId = isset($aViews['object_id']) ? (int)$aViews['object_id'] : 0;
        $iCount = isset($aViews['count']) ? (int)$aViews['count'] : 0;
        if($sSystem == '' || $iObjectId == 0)
            return false;

        return array($sSystem, $iObjectId, $iCount);
    }

    public function getVotesData(&$aVotes)
    {
        if(empty($aVotes) || !is_array($aVotes))
            return false;

        $sSystem = isset($aVotes['system']) ? $aVotes['system'] : '';
        $iObjectId = isset($aVotes['object_id']) ? (int)$aVotes['object_id'] : 0;
        $iCount = isset($aVotes['count']) ? (int)$aVotes['count'] : 0;
        if($sSystem == '' || $iObjectId == 0)
            return false;

        return array($sSystem, $iObjectId, $iCount);
    }

    public function getReactionsData(&$aReactions)
    {
        if(empty($aReactions) || !is_array($aReactions))
            return false;

        $sSystem = isset($aReactions['system']) ? $aReactions['system'] : '';
        $iObjectId = isset($aReactions['object_id']) ? (int)$aReactions['object_id'] : 0;
        $iCount = isset($aReactions['count']) ? (int)$aReactions['count'] : 0;
        if($sSystem == '' || $iObjectId == 0)
            return false;

        return array($sSystem, $iObjectId, $iCount);
    }

    public function getScoresData(&$aScores)
    {
        if(empty($aScores) || !is_array($aScores))
            return false;

        $sSystem = isset($aScores['system']) ? $aScores['system'] : '';
        $iObjectId = isset($aScores['object_id']) ? (int)$aScores['object_id'] : 0;
        $iScore = isset($aScores['score']) ? (int)$aScores['score'] : 0;
        if($sSystem == '' || $iObjectId == 0)
            return false;

        return array($sSystem, $iObjectId, $iScore);
    }

    public function getReportsData(&$aReports)
    {
        if(empty($aReports) || !is_array($aReports))
            return false;

        $sSystem = isset($aReports['system']) ? $aReports['system'] : '';
        $iObjectId = isset($aReports['object_id']) ? (int)$aReports['object_id'] : 0;
        $iCount = isset($aReports['count']) ? (int)$aReports['count'] : 0;
        if($sSystem == '' || $iObjectId == 0)
            return false;

        return array($sSystem, $iObjectId, $iCount);
    }

    public function getCommentsData(&$aComments)
    {
        if(empty($aComments) || !is_array($aComments))
            return false;

        $sSystem = isset($aComments['system']) ? $aComments['system'] : '';
        $iObjectId = isset($aComments['object_id']) ? (int)$aComments['object_id'] : 0;
        $iCount = isset($aComments['count']) ? (int)$aComments['count'] : 0;
        if($sSystem == '' || $iObjectId == 0)
            return false;

        return [$sSystem, $iObjectId, $iCount];
    }

    public function getEventLinks($iEventId)
    {
        $aLinks = $this->_oDb->getLinks($iEventId);
        if(empty($aLinks) || !is_array($aLinks))
            return array();

        $oTranscoder = BxDolTranscoderImage::getObjectInstance($this->_oConfig->getObject('transcoder_photos_preview'));

        $aResult = array();
        foreach($aLinks as $aLink)
            $aResult[] = array(
                'url' => $aLink['url'],
                'title' => $aLink['title'],
                'text' => $aLink['text'],
                'thumbnail' => (int)$aLink['media_id'] != 0 ? $oTranscoder->getFileUrl($aLink['media_id']) : ''
            );

        return $aResult;
    }

    public function getEventImages($iEventId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aPhotos = $this->_oDb->getMedia($CNF['FIELD_PHOTO'], $iEventId);
        if(empty($aPhotos) || !is_array($aPhotos))
            return [];

        $sStorage = $this->_oConfig->getObject('storage_photos');
        $oTranscoderSm = BxDolTranscoderImage::getObjectInstance($this->_oConfig->getObject('transcoder_photos_view'));
        $oTranscoderMd = BxDolTranscoderImage::getObjectInstance($this->_oConfig->getObject('transcoder_photos_medium'));
        $oTranscoderLg = BxDolTranscoderImage::getObjectInstance($this->_oConfig->getObject('transcoder_photos_big'));

        $aResult = [];
        foreach($aPhotos as $iPhotoId) {
            if($this->_bIsApi) {
                $aResult[] = bx_api_get_image($sStorage, $iPhotoId);
                continue;
            }

            $sPhotoSrcMd = $oTranscoderMd->getFileUrl($iPhotoId);
            if(empty($sPhotoSrcMd))
                continue;

            $sPhotoSrcSm = $oTranscoderSm->getFileUrl($iPhotoId);
            if(empty($sPhotoSrcSm))
                $sPhotoSrcSm = $sPhotoSrcMd;

            $sPhotoSrcLg = $oTranscoderLg->getFileUrl($iPhotoId);
            if(empty($sPhotoSrcLg))
                $sPhotoSrcLg = $sPhotoSrcMd;

            $aResult[] = [
                'id' => $iPhotoId,
                'src' => $sPhotoSrcMd,
                'src_small' => $sPhotoSrcSm,
                'src_medium' => $sPhotoSrcMd,
                'src_orig' => $sPhotoSrcLg,
            ];
        }

        return $aResult;
    }

    public function getEventVideos($iEventId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aMediaIds = $this->_oDb->getMedia($CNF['FIELD_VIDEO'], $iEventId);
        if(empty($aMediaIds) || !is_array($aMediaIds))
            return [];

        $sStorage = $this->_oConfig->getObject('storage_videos');
        $oStorage = BxDolStorage::getObjectInstance($sStorage);

        $oTranscoderPoster = BxDolTranscoderVideo::getObjectInstance($this->_oConfig->getObject('transcoder_videos_poster'));
        $oTranscoderMp4 = BxDolTranscoderVideo::getObjectInstance($this->_oConfig->getObject('transcoder_videos_mp4'));
        $oTranscoderMp4Hd = BxDolTranscoderVideo::getObjectInstance($this->_oConfig->getObject('transcoder_videos_mp4_hd'));

        $oTranscoderPhoto = BxDolTranscoderImage::getObjectInstance($this->_oConfig->getObject('transcoder_videos_photo_view'));
        $oTranscoderPhotoBig = BxDolTranscoderImage::getObjectInstance($this->_oConfig->getObject('transcoder_videos_photo_big'));

        $aResult = [];
        foreach($aMediaIds as $iMediaId) {
            $aMediaFile = $oStorage->getFile($iMediaId);
            if(!$aMediaFile)
                continue;

            $bVideoFile = strncmp('video/', $aMediaFile['mime_type'], 6) === 0 && $oTranscoderPoster->isMimeTypeSupported($aMediaFile['mime_type']);
            if($bVideoFile) {
                $sVideoUrlHd = '';
                if (!empty($aMediaFile['dimensions']) && $oTranscoderMp4Hd->isProcessHD($aMediaFile['dimensions']))
                    $sVideoUrlHd = $oTranscoderMp4Hd->getFileUrl($iMediaId);

                $aResult[$iMediaId] = [
                    'id' => $iMediaId,
                    'src_poster' => $oTranscoderPoster->getFileUrl($iMediaId),
                    'src_mp4' => $oTranscoderMp4->getFileUrl($iMediaId),
                    'src_mp4_hd' => $sVideoUrlHd,
                ];
            }

            $bImageFile = strncmp('image/', $aMediaFile['mime_type'], 6) === 0 && $oTranscoderPhoto->isMimeTypeSupported($aMediaFile['mime_type']);
            if($bImageFile) {
                if($this->_bIsApi) {
                    $aResult[] = bx_api_get_image($sStorage, $iMediaId);
                    continue;
                }

                $sPhotoSrc = $oTranscoderPhoto->getFileUrl($iMediaId);
                $sPhotoSrcBig = $oTranscoderPhotoBig->getFileUrl($iMediaId);
                if(empty($sPhotoSrcBig) && !empty($sPhotoSrc))
                    $sPhotoSrcBig = $sPhotoSrc;

                $aResult[$iMediaId] = [
                    'id' => $iMediaId,
                    'src' => $sPhotoSrc,
                    'src_orig' => $sPhotoSrcBig,
                ];
            }
        }

        return $aResult;
    }
	
    public function getEventFiles($iEventId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aFiles = $this->_oDb->getMedia($CNF['FIELD_FILE'], $iEventId);
		
        if(empty($aFiles) || !is_array($aFiles))
            return [];

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->getObject('storage_files'));
		
        $aResult = [];
        foreach($aFiles as $iFileId) {
            $sFileUrl = $oStorage->getFileUrlById($iFileId);
            $aFileFile = $oStorage->getFile($iFileId);

            $aResult[$iFileId] = [
                'id' => $iFileId,
                'src' => $this->_oTemplate->getIconUrl($oStorage->getIconNameByFileName($aFileFile['file_name'])),
                'src_medium' => '',
                'src_orig' => '',
                'url' => $sFileUrl,
                'title' => $aFileFile['file_name']
            ];
        }

        return $aResult;
    }

    public function getEventPolls($iEventId)
    {
        $aPolls = $this->_oDb->getPolls([
            'type' => 'content_id', 
            'content_id' => $iEventId, 
        ]);
        if(empty($aPolls) || !is_array($aPolls))
            return [];

        $iProfile = bx_get_logged_profile_id();

        $aResult = [];
        foreach($aPolls as $aPoll)
            $aResult[$aPoll['id']] = $this->_bIsApi ? $this->_oTemplate->getPollItem($aPoll, $iProfile) : $aPoll;

        return $aResult;
    }

    public function hasMedia($iEventId, $iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!empty($iEventId))
            return $this->_oDb->hasMedia($iEventId);

        if(empty($iProfileId))
            $iProfileId = $this->_iProfileId;

        $aTypes = [
            $CNF['FIELD_PHOTO'], 
            $CNF['FIELD_VIDEO'], 
            $CNF['FIELD_FILE']
        ];

        $bResult = false;
        foreach($aTypes as $sType) {
            $sStorage = $this->_oConfig->getObject('storage_' . strtolower($sType) . 's');
            if(($oStorage = BxDolStorage::getObjectInstance($sStorage)) !== false) {
                $aGhosts = $oStorage->getGhosts($iProfileId, 0);
                if(!empty($aGhosts) && is_array($aGhosts)) {
                    $bResult = true;
                    break;
                }
            }
        }

        return $bResult;
    }

    public function deleteLinksUnused($iProfileId)
    {
        $aLinks = $this->_oDb->getUnusedLinks($iProfileId);
        if(empty($aLinks) || !is_array($aLinks))
            return;

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->getObject('storage_photos'));
        foreach($aLinks as $aLink)
            if(!empty($aLink['media_id']))
                $oStorage->deleteFile($aLink['media_id']);

        $this->_oDb->deleteUnusedLinks($iProfileId);
    }

    public function deleteCacheItem($iEventId)
    {
        //--- Delete own item cache.
        $oCacheItem = $this->getCacheItemObject();
        $aCacheKeys = $this->_oConfig->getCacheItemKeys($iEventId);
        foreach($aCacheKeys as $sCacheKey)
            $oCacheItem->delData($sCacheKey);

        //--- Delete item cache for reposts.
        $aReposts = $this->_oDb->getReposts($iEventId);
        foreach($aReposts as $aRepost)
            $this->deleteCacheItem($aRepost['event_id']);
    }

    public function rebuildSlice()
    {
        if(!$this->_oConfig->isCacheTable())
            return;

        $this->_oDb->rebuildSlice();
    }

    protected function _performPin($iId)
    {
        $iId = (int)$iId;
        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
        if(empty($aEvent) || !is_array($aEvent))
            return ['code' => 1];

        $bPin = (int)$aEvent['pinned'] == 0;
        $mixedAllowed = $this->{'isAllowed' . ($bPin ? 'Pin' : 'Unpin')}($aEvent, true);
        if($mixedAllowed !== true)
            return ['code' => 2, 'message' => strip_tags($mixedAllowed)];

        $aEvent['pinned'] = $bPin ? time() : 0;
        if(!$this->_oDb->updateEvent(['pinned' => $aEvent['pinned']], ['id' => $iId]))
            return ['code' => 3];

        $this->rebuildSlice();
        $this->onEdit($iId);

        return [
            'code' => 0,
            'id' => $iId,
            'pinned' => (int)$aEvent['pinned'],
            'next' => $bPin ? 'unpin' : 'pin',
        ];
    }

    protected function _performStick($iId)
    {
        $iId = (int)$iId;
        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
        if(empty($aEvent) || !is_array($aEvent))
            return ['code' => 1];

        $bStick = (int)$aEvent['sticked'] == 0;
        $mixedAllowed = $this->{'isAllowed' . ($bStick ? 'Stick' : 'Unstick')}($aEvent, true);
        if($mixedAllowed !== true)
            return ['code' => 2, 'message' => strip_tags($mixedAllowed)];

        $aEvent['sticked'] = $bStick ? time() : 0;
        if(!$this->_oDb->updateEvent(['sticked' => $aEvent['sticked']], ['id' => $iId]))
            return ['code' => 3];

        $this->rebuildSlice();
        $this->onEdit($iId);

        $sAction = $bStick ? 'stick' : 'unstick';
        bx_audit(
            $iId,
            $this->getName(),
            '_sys_audit_action_' . $sAction,
            $this->_prepareAuditParams($aEvent, false)
        );

        return [
            'code' => 0,
            'id' => $iId,
            'sticked' => (int)$aEvent['sticked'],
            'next' => $bStick ? 'unstick' : 'stick',
        ];
    }

    protected function _performPromote($iId)
    {
        $iId = (int)$iId;
        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
        if(empty($aEvent) || !is_array($aEvent))
            return ['code' => 1];

        $sAction = (int)$aEvent['promoted'] == 0 ? 'promote' : 'unpromote';
        $mixedAllowed = $this->{'isAllowed' . ucfirst($sAction)}($aEvent, true);
        if($mixedAllowed !== true)
            return ['code' => 1, 'message' => strip_tags($mixedAllowed)];

        $aEvent['promoted'] = (int)$aEvent['promoted'] == 0 ? time() : 0;
        if(!$this->_oDb->updateEvent(['promoted' => $aEvent['promoted']], ['id' => $iId]))
            return ['code' => 2];

        $this->rebuildSlice();
        $this->onEdit($iId);

        bx_alert($this->_oConfig->getObject('alert'), $sAction . 'd', $iId, (int)$this->getUserId(), [
            'owner_id' => $aEvent['owner_id'],
            'object_id' => $aEvent['object_id'],
            'object_author_id' => $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? $aEvent['owner_id'] : $aEvent['object_id']
        ]);

        bx_audit(
            $iId,
            $this->getName(),
            '_sys_audit_action_' . $sAction,
            $this->_prepareAuditParams($aEvent, false)
        );

        return [
            'code' => 0,
            'id' => $iId,
            'promoted' => (int)$aEvent['promoted'],
            'next' => (int)$aEvent['promoted'] == 0 ? 'promote' : 'unpromote',
        ];
    }


    /**
     * Protected Methods 
     */
    protected function _serviceGetBlockView($iProfileId = 0, $aBrowseParams = array())
    {
        if(empty($iProfileId) && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        if(empty($iProfileId) && isLogged())
            $iProfileId = bx_get_logged_profile_id();

        $aBrowseParams['owner_id'] = $iProfileId;

        $aBlock = $this->_getBlockView($aBrowseParams);
        if(!empty($aBlock))
            return $aBlock;

        return array('content' => MsgBox(_t('_bx_timeline_txt_msg_no_results')));
    }

    protected function _serviceGetBlockViewProfile($sProfileModule = 'bx_persons', $iProfileContentId = 0, $aBrowseParams = array())
    {
        if(empty($sProfileModule))
            return array();

        if(empty($iProfileContentId) && bx_get('id') !== false)
            $iProfileContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        $oProfile = BxDolProfile::getInstanceByContentAndType($iProfileContentId, $sProfileModule);
        if(empty($oProfile))
            return array();

        $aBrowseParams['owner_id'] = $oProfile->id();

        return $this->_getBlockView($aBrowseParams);
    }

    protected function _serviceGetBlockViews($aBrowseParams = [])
    {
        $aParams = $this->_prepareParams($aBrowseParams);

        if(($sType = $this->_oConfig->getUserChoice('type')) !== false)
            $this->_setParamsType($sType, $aParams);

        $this->_iOwnerId = $aParams['owner_id'];

        return $this->_oTemplate->getViewsBlock($aParams);
    }

    protected function _serviceGetBlockViewHome($aBrowseParams = array())
    {
        $sRssUrl = BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'rss/' . $aBrowseParams['type'] . '/';
        BxDolTemplate::getInstance()->addPageRssLink(_t('_bx_timeline_page_title_view_home'), $sRssUrl);

        return $this->_serviceGetBlockViewByType($aBrowseParams);
    }

    protected function _serviceGetBlockViewHot($aBrowseParams = array())
    {
        $sRssUrl = BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'rss/' . $aBrowseParams['type'] . '/';
        BxDolTemplate::getInstance()->addPageRssLink(_t('_bx_timeline_page_title_view_hot'), $sRssUrl);

        return $this->_serviceGetBlockViewByType($aBrowseParams);
    }

    protected function _serviceGetBlockViewByType($aBrowseParams = array())
    {
        $aParams = $this->_prepareParams($aBrowseParams);
        $this->_iOwnerId = $aParams['owner_id'];

        $aResult = $this->_oTemplate->getViewBlock($aParams);

        return $this->_bIsApi ? [bx_api_get_block('browse', [
            'unit' => 'feed',  
            'request_url' => '/api.php?r=bx_timeline/get_posts/&params[]=',
            'params' => $aParams,
            'data' => $aResult,
            'filter_form' => $aParams['filter'] == 'panel' ? ['name' => 'filterform', 'data' => $this->_oTemplate->getViewFilters($aParams)]: null
        ])] : $aResult;
    }

    protected function _getBlockPost($iProfileId, $aParams = array())
    {
        $this->_iOwnerId = $iProfileId;

        if(($mixedResult = $this->isAllowedPost()) !== true)
            return $this->_bIsApi ? [
                bx_api_get_msg($mixedResult)
            ] : [];
        
        $mixedResult = $this->_oTemplate->getPostBlock($this->_iOwnerId, $aParams);

        return $this->_bIsApi ? $mixedResult : [
            'content' => $mixedResult
        ];
    }

    protected function _getBlockView($aBrowseParams = array())
    {
        if(empty($aBrowseParams['owner_id']))
            return array();

        $aParams = $this->_prepareParams($aBrowseParams);
        if(empty($aParams['per_page']))
            $aParams['per_page'] = $this->_oConfig->getPerPage('profile');

        $this->_iOwnerId = $aParams['owner_id'];
        $oProfileOwner = BxDolProfile::getInstance($this->_iOwnerId);
        if(!$oProfileOwner)
            return array();

        $mixedResult = $oProfileOwner->checkAllowedProfileView();
        if($mixedResult !== CHECK_ACTION_RESULT_ALLOWED) {
            if(!$this->_bIsApi) {
                $this->_oTemplate->displayAccessDenied($mixedResult);
                exit;
            }
            else
                return [bx_api_get_msg($mixedResult, ['ext' => ['msg_type' => 'result']])];
        }

        $sUserName = $this->getObjectUser($aParams['owner_id'])->getDisplayName();

        $sView = $aParams['view'];
        $sRssUrl = BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'rss/' . BX_BASE_MOD_NTFS_TYPE_OWNER . '/' . $this->_iOwnerId . '/';
        $sJsObject = $this->_oConfig->getJsObjectView($aParams);
        $aMenu = array(
            array('id' => $sView . '-view-all', 'name' => $sView . '-view-all', 'class' => '', 'link' => 'javascript:void(0)', 'onclick' => 'javascript:' . $sJsObject . '.changeFilter(this)', 'target' => '_self', 'title' => _t('_bx_timeline_menu_item_view_all'), 'active' => 1),
            array('id' => $sView . '-view-owner', 'name' => $sView . '-view-owner', 'class' => '', 'link' => 'javascript:void(0)', 'onclick' => 'javascript:' . $sJsObject . '.changeFilter(this)', 'target' => '_self', 'title' => _t('_bx_timeline_menu_item_view_owner', $sUserName)),
            array('id' => $sView . '-view-other', 'name' => $sView . '-view-other', 'class' => '', 'link' => 'javascript:void(0)', 'onclick' => 'javascript:' . $sJsObject . '.changeFilter(this)', 'target' => '_self', 'title' => _t('_bx_timeline_menu_item_view_other')),
            array('id' => $sView . '-get-rss', 'name' => $sView . '-get-rss', 'class' => '', 'link' => $sRssUrl, 'onclick' => '', 'target' => '_blank', 'title' => _t('_bx_timeline_menu_item_get_rss')),
        );

        $mixedContent = '';

        /**
         * @hooks
         * @hookdef hook-bx_base_profile-timeline_view '{profile_module_name}', 'timeline_view' - hook to override view timeline block
         * - $unit_name - profile module name
         * - $action - equals `timeline_view`
         * - $object_id - timeline owner profile id
         * - $sender_id - currently logged in profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `params` - [array] browsing params array as key&value pairs
         *      - `menu` - [array] block submenu items array
         *      - `override_content` - [string] by ref, block content, can be overridden in hook processing
         * @hook @ref hook-bx_base_profile-timeline_view
         */
        bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_view', $this->_iOwnerId, $this->getUserId(), [
            'params' => &$aParams,
            'menu' => &$aMenu,
            'params_ref' => &$aParams,
            'menu_ref' => &$aMenu,
            'override_content' => &$mixedContent,
        ]);

        $oMenu = new BxTemplMenuInteractive(['template' => 'menu_interactive_vertical.html', 'menu_id'=> $sView . '-view-all', 'menu_items' => $aMenu]);
        $oMenu->setSelected('', $sView . '-view-all');

        if(!$mixedContent)
            $mixedContent = $this->_oTemplate->getViewBlock($aParams);

        if($this->_bIsApi)
            return [bx_api_get_block('browse', [
                'unit' => 'feed',  
                'request_url' => '/api.php?r=bx_timeline/get_posts/&params[]=',
                'params' => $aParams,
                'data' => $mixedContent
            ])];

        BxDolTemplate::getInstance()->addPageRssLink(_t('_bx_timeline_page_title_view'), $sRssUrl);

        if(is_string($mixedContent))
            $mixedContent = ['content' => $mixedContent];

        return array_merge($mixedContent, [
            'menu' => $oMenu
        ]);
    }
    
    protected function _getContentForTimelinePost($aEvent, $aContentInfo, $aBrowseParams = array())
    {
    	$CNF = &$this->_oConfig->CNF;

        $iId = (int)$aContentInfo[$CNF['FIELD_ID']];
    	$sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iId));

        $sText = ''; 
        if(isset($aContentInfo['content'])){
            $aTmp = unserialize($aContentInfo['content']);
            if(isset($aTmp['text']))
                $sText = $aTmp['text'];
        }

        if(empty($sText) && !empty($aContentInfo[$CNF['FIELD_TITLE']]))
            $sText = $aContentInfo[$CNF['FIELD_TITLE']];

        if(!empty($CNF['OBJECT_METATAGS']) && !empty($sText)) {
            $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
            $sText = $oMetatags->metaParse($iId, $sText);
        }

        return array(
            'sample' => isset($CNF['T']['txt_sample_single_with_article']) ? $CNF['T']['txt_sample_single_with_article'] : $CNF['T']['txt_sample_single'],
            'sample_wo_article' => $CNF['T']['txt_sample_single'],
            'sample_action' => isset($CNF['T']['txt_sample_action']) ? $CNF['T']['txt_sample_action'] : '',
            'url' => $sUrl,
            'title' => '',
            'text' => $sText,
            'links' => $this->getEventLinks($iId),
            'images' => array(),
            'images_attach' => $this->getEventImages($iId),
            'videos' => array(),
            'videos_attach' => $this->getEventVideos($iId),
            'files' => array(),
            'files_attach' => $this->getEventFiles($iId)
        );
    }

    protected function _isAllowedRepost($aEvent, $bPerform = false)
    {
        $iUserId = (int)$this->getUserId();
        if($iUserId == 0)
            return false;

        $iPrivacy = (int)$aEvent['object_privacy_view'];
        if($iPrivacy >= 0 && !in_array($iPrivacy, [BX_DOL_PG_ALL, BX_DOL_PG_MEMBERS]))
            return false;         

        if(isAdmin())
            return true;

        $aCheckResult = checkActionModule($iUserId, 'repost', $this->getName(), $bPerform);
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_repost '{profile_module_name}', 'timeline_repost' - hook to override the result of checking whether 'repost' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_post
             * @hook @ref hook-bx_base_profile-timeline_repost
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_repost', $oProfileOwner->id(), $iUserId, [
                'check_result' => &$aCheckResult
            ]);

        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    protected function _isAllowedMute($bPerform = false)
    {
    	if($this->_iProfileId == 0)
            return false;

        if(isAdmin())
           return true;

        $aCheckResult = checkActionModule($this->_iProfileId, 'mute', $this->getName(), $bPerform);
        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    protected function _isAllowedPin($aEvent, $bPerform = false)
    {
    	$iUserId = (int)$this->getUserId();
    	if($iUserId == 0)
            return false;

        if(isAdmin() || (int)$aEvent['owner_id'] == $iUserId || ((int)$aEvent['owner_id'] == 0 && $this->_oConfig->isCommon($aEvent['type'], $aEvent['action']) && (int)$aEvent['object_id'] == $iUserId))
           return true;

        $aCheckResult = checkActionModule($iUserId, 'pin', $this->getName(), $bPerform);
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false) {
            if(bx_srv($oProfileOwner->getModule(), 'check_allowed_module_action_in_profile', array($oProfileOwner->getContentId(), $this->getName(), 'pin')) === CHECK_ACTION_RESULT_ALLOWED)
                return true;
            
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_pin '{profile_module_name}', 'timeline_pin' - hook to override the result of checking whether 'pin' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_post
             * @hook @ref hook-bx_base_profile-timeline_pin
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_pin', $oProfileOwner->id(), $iUserId, [
                'check_result' => &$aCheckResult
            ]);
        }

        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    protected function _isAllowedStick($aEvent, $bPerform = false)
    {
    	$iUserId = (int)$this->getUserId();
    	if($iUserId == 0)
            return false;

    	if(isAdmin())
            return true;

    	$aCheckResult = checkActionModule($iUserId, 'stick', $this->getName(), $bPerform);
    	if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_stick '{profile_module_name}', 'timeline_stick' - hook to override the result of checking whether 'stick' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_post
             * @hook @ref hook-bx_base_profile-timeline_stick
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_stick', $oProfileOwner->id(), $iUserId, [
                'check_result' => &$aCheckResult
            ]);
    
    	return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    protected function _isAllowedPromote($aEvent, $bPerform = false)
    {
        if(isAdmin())
            return true;

        $iUserId = (int)$this->getUserId();
        if($iUserId == 0)
            return false;

        $aCheckResult = checkActionModule($iUserId, 'promote', $this->getName(), $bPerform);
        if(!empty($aEvent['owner_id']) && ($oProfileOwner = BxDolProfile::getInstance($aEvent['owner_id'])) !== false)
            /**
             * @hooks
             * @hookdef hook-bx_base_profile-timeline_promote '{profile_module_name}', 'timeline_promote' - hook to override the result of checking whether 'promote' action is allowed or not
             * It's equivalent to @ref hook-bx_base_profile-timeline_post
             * @hook @ref hook-bx_base_profile-timeline_promote
             */
            bx_alert($oProfileOwner->getModule(), $this->_oConfig->getUri() . '_promote', $oProfileOwner->id(), $iUserId, [
                'check_result' => &$aCheckResult
            ]);

        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    protected function _deleteLinks($iId)
    {
        $aLinks = $this->_oDb->getLinks($iId);
        if(empty($aLinks) || !is_array($aLinks))
            return;

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->getObject('storage_photos'));
        foreach($aLinks as $aLink)
            if(!empty($aLink['media_id']))
                $oStorage->deleteFile($aLink['media_id']);

        $this->_oDb->deleteLinks($iId);
    }

    protected function _processMetas($iId, $sText)
    {
        $CNF = &$this->_oConfig->CNF;

        $oMetatags = BxDolMetatags::getObjectInstance($this->_oConfig->getObject('metatags'));

        if(!empty($sText)) {
            $oMetatags->metaAdd($iId, $sText);

            $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
            if($oMetatags->keywordsIsEnabled() && !empty($aEvent[$CNF['FIELD_LABELS']])) {
                $aLabels = unserialize($aEvent[$CNF['FIELD_LABELS']]);
                if(!empty($aLabels) && is_array($aLabels))
                    foreach ($aLabels as $sLabel) {
                        if(!preg_match("/(\pL[\pL\pN_]+)/u", $sLabel)) 
                            continue;

                        $oMetatags->keywordsAddOne($iId, $sLabel, false);
                    }
            }
        }

        $oMetatags->locationsAddFromForm($iId, $CNF['FIELD_LOCATION_PREFIX']);
    }

    /**
     * Check attached media for content type (photo, video). 
     */
    protected function _checkMedia($sType, $iContentId, $aItemIds, $iProfileId = 0)
    {
        if(empty($iContentId) || empty($aItemIds) || !is_array($aItemIds))
            return false;

        if(empty($iProfileId))
            $iProfileId = $this->_iProfileId;

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->getObject('storage_' . strtolower($sType) . 's'));
        $aGhostFiles = $oStorage->getGhosts ($iProfileId, $iContentId, true, $this->_isModerator());
        if(empty($aGhostFiles) || !is_array($aGhostFiles))
            return false;

        $oTranscoder = BxDolTranscoder::getObjectInstance($this->_oConfig->getObject('transcoder_videos_mp4'));

        $bHasImage = $bHasVideo = false;
        $bIsVideoProcessed = true;
        foreach($aGhostFiles as $aFile) {
            if(is_array($aItemIds) && !in_array($aFile['id'], $aItemIds))
                continue;

            if(strncmp('image/', $aFile['mime_type'], 6) === 0) {
                $bHasImage = true;
                continue;
            }

            if(strncmp('video/', $aFile['mime_type'], 6) === 0) {
                $bHasVideo = true;

                if($oTranscoder && !$oTranscoder->isFileReady((int)$aFile['id']))
                    $bIsVideoProcessed = false;

                continue;
            }
        }

        return [$bHasImage, $bHasVideo, $bIsVideoProcessed];
    }

    protected function _saveMedia($sType, $iContentId, $aItemIds, $iProfileId = 0, $isAssociateWithContent = false)
    {
        if(empty($iContentId))
            return;

        if(!$isAssociateWithContent)
            $this->_oDb->deleteMedia($sType, $iContentId);

    	if(empty($aItemIds) || !is_array($aItemIds))
            return; 

        if(empty($iProfileId))
            $iProfileId = $this->_iProfileId;

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->getObject('storage_' . strtolower($sType) . 's'));
        $aGhostFiles = $oStorage->getGhosts ($iProfileId, !$isAssociateWithContent ? $iContentId : 0, true, $this->_isModerator());
        if(empty($aGhostFiles) || !is_array($aGhostFiles))
            return;

        foreach($aGhostFiles as $aFile) {
            if(is_array($aItemIds) && !in_array($aFile['id'], $aItemIds))
                continue;

            $iFileId = (int)$aFile['id'];

            if($aFile['private'])
                $oStorage->setFilePrivate($iFileId, 1);

            $oStorage->updateGhostsContentId($iFileId, $iProfileId, $iContentId, $this->_isModerator());

            $this->_oDb->saveMedia($sType, $iContentId, $iFileId);
        }
    }

    protected function _deleteMedia($sType, $iContentId)
    {
        $aItems = $this->_oDb->getMedia($sType, $iContentId);
        if(empty($aItems) || !is_array($aItems))
            return;

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->getObject('storage_' . strtolower($sType) . 's'));
        foreach($aItems as $iItemId)
            $oStorage->deleteFile($iItemId);

        $this->_oDb->deleteMedia($sType, $iContentId);
    }

    protected function _setParamsType($sType, &$aParams)
    {
        if(isset($aParams['type']) && $aParams['type'] == $sType)
            return;

        $iPerPage = $this->_oConfig->getPerPage($sType);

        $aParams = array_merge($aParams, [
            'type' => $sType,
            'per_page' => $iPerPage,
            'per_page_default' => $iPerPage
        ]);
    }

    protected function _prepareParams($aParams)
    {
        if(empty($aParams['name']))
            $aParams['name'] = '';
        
        if(empty($aParams['browse']))
            $aParams['browse'] = 'list';
            
        if(empty($aParams['view']))
            $aParams['view'] = BX_TIMELINE_VIEW_DEFAULT;

        if(empty($aParams['type']))
            $aParams['type'] = BX_TIMELINE_TYPE_DEFAULT;

        if(empty($aParams['owner_id']))
            $aParams['owner_id'] = $this->getUserId();

        if(!isset($aParams['start']) || (int)$aParams['start'] < 0)
            $aParams['start'] = 0;

        if(!isset($aParams['per_page_default']) || (int)$aParams['per_page_default'] <= 0)
            $aParams['per_page_default'] = $this->_oConfig->getPerPage($aParams['type']);

        if(!isset($aParams['per_page']) || (int)$aParams['per_page'] <= 0)
            $aParams['per_page'] = $aParams['per_page_default'];
        
        if(empty($aParams['timeline']) || (int)$aParams['timeline'] < 0)
            $aParams['timeline'] = 0;

        if(empty($aParams['filter']))
            $aParams['filter'] = BX_TIMELINE_FILTER_DEFAULT;

        if(!empty($aParams['modules']))
            $aParams['modules'] = is_array($aParams['modules']) ? $aParams['modules'] : explode(',', $aParams['modules']);
        else
            $aParams['modules'] = [];

        if(!empty($aParams['media'])) {
            if(($sDv = ',') && strpos($aParams['media'], $sDv) !== false)
                $aParams['media'] = explode($sDv, $aParams['media']);
        }
        else
            $aParams['media'] = '';

        if(empty($aParams['context']))
            $aParams['context'] = '';

        if(empty($aParams['blink']) || !is_array($aParams['blink']))
            $aParams['blink'] = array();

        $iViewerId = $this->getUserId();
        if(empty($aParams['viewer_id']) || (int)$aParams['viewer_id'] != $iViewerId)
            $aParams['viewer_id'] = $iViewerId;

        if(empty($aParams['status']))
            $aParams['status'] = BX_TIMELINE_STATUS_ACTIVE;

        if(empty($aParams['moderator']))
            $aParams['moderator'] = $this->isModeratorForProfile($aParams['viewer_id']);

        if(empty($aParams['dynamic_mode']))
            $aParams['dynamic_mode'] = false;

        return $aParams;
    }

    protected function _prepareParamsGet($mParams = false)
    {
        $aKeys = ['name', 'view', 'type', 'owner_id', 'start', 'per_page', 'per_page_default', 'timeline', 'filter', 'modules', 'media', 'context', 'blink', 'viewer_id'];

        $aParams = [];
        if(!empty($mParams) && is_array($mParams))
            foreach($aKeys as $sKey)
                $aParams[$sKey] = isset($mParams[$sKey]) ? $mParams[$sKey] : false;
        else
            foreach($aKeys as $sKey)
                $aParams[$sKey] = bx_get($sKey);

        $aParams['name'] = $this->_oConfig->processParam($aParams['name']);
        $aParams['view'] = $this->_oConfig->processParamWithDefault($aParams['view'], BX_TIMELINE_VIEW_DEFAULT);
        $aParams['type'] = $this->_oConfig->processParamWithDefault($aParams['type'], BX_TIMELINE_TYPE_DEFAULT);
        $aParams['owner_id'] = $aParams['owner_id'] !== false ? bx_process_input($aParams['owner_id'], BX_DATA_INT) : $this->getUserId();
        $aParams['start'] = $aParams['start'] !== false ? bx_process_input($aParams['start'], BX_DATA_INT) : 0;
        $aParams['per_page'] = $aParams['per_page'] !== false ? bx_process_input($aParams['per_page'], BX_DATA_INT) : $this->_oConfig->getPerPage($aParams['type']);
        $aParams['per_page_default'] = $aParams['per_page_default'] !== false ? bx_process_input($aParams['per_page_default'], BX_DATA_INT) : $this->_oConfig->getPerPage($aParams['type']);
        $aParams['timeline'] = $aParams['timeline'] !== false ? bx_process_input($aParams['timeline']) : '';
        $aParams['filter'] = $aParams['filter'] !== false ? bx_process_input($aParams['filter'], BX_DATA_TEXT) : BX_TIMELINE_FILTER_DEFAULT;
        $aParams['modules'] = $aParams['modules'] !== false ? bx_process_input($aParams['modules'], BX_DATA_TEXT) : [];
        $aParams['media'] = $aParams['media'] !== false ? $this->_oConfig->processParam($aParams['media']) : '';
        $aParams['context'] = $aParams['context'] !== false ? $this->_oConfig->processParam($aParams['context']) : '';

        if($aParams['blink'] !== false)
            $aParams['blink'] = bx_process_input(is_string($aParams['blink']) ? explode(',', $aParams['blink']) : $aParams['blink'], BX_DATA_TEXT);
        else
            $aParams['blink'] = [];

        $iViewerId = $this->getUserId();
        if($aParams['viewer_id'] !== false)
            $aParams['viewer_id'] = bx_process_input($aParams['viewer_id'], BX_DATA_INT);
        if(!$aParams['viewer_id'] || $aParams['viewer_id'] != $iViewerId)
            $aParams['viewer_id'] = $iViewerId;

        return array_merge($aParams, [
            'browse' => 'list',
            'status' => BX_TIMELINE_STATUS_ACTIVE,
            'moderator' => $this->isModeratorForProfile($aParams['viewer_id']),
            'dynamic_mode' => true,
        ]);
    }

    protected function _prepareTextForSave($s)
    {
        return bx_process_input($s, BX_DATA_HTML);
    }

    protected function _prepareFormForAutoSubmit(&$oForm, &$aValues)
    {
        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        if(!empty($oForm->aParams['db']['submit_name'])) {
            $sSubmitName = $sSubmitValue = false;
            if(is_array($oForm->aParams['db']['submit_name'])) {
                foreach ($oForm->aParams['db']['submit_name'] as $sName) {
                    if(isset($oForm->aInputs[$sName])) {
                        $sSubmitName = $sName;
                        $sSubmitValue = $oForm->aInputs[$sName]['value'];
                        break;
                    }
                    else if(isset($oForm->aInputs['controls'])) 
                        foreach($oForm->aInputs['controls'] as $mixedKey => $mixedInput)
                            if(is_numeric($mixedKey) && isset($mixedInput['name']) && $mixedInput['name'] == $sName) {
                                $sSubmitName = $sName;
                                $sSubmitValue = $mixedInput['value'];
                                break 2;
                            }
                }
            }
            else {
                $sName = $oForm->aParams['db']['submit_name'];
                if(isset($oForm->aInputs[$sName])) {
                    $sSubmitName = $sName;
                    $sSubmitValue = $oForm->aInputs[$sName]['value'];
                }
                else if(isset($oForm->aInputs['controls']))
                    foreach($oForm->aInputs['controls'] as $mixedKey => $mixedInput)
                        if(is_numeric($mixedKey) && isset($mixedInput['name']) && $mixedInput['name'] == $sName) {
                            $sSubmitName = $sName;
                            $sSubmitValue = $mixedInput['value'];
                            break;
                        }
            }

            if($sSubmitName && $sSubmitValue)
                $aValues[$sSubmitName] = $sSubmitValue;
        }
    }

    protected function _getFieldValue($sField, $iContentId)
    {
        $CNF = &$this->_oConfig->CNF;
        if(empty($CNF[$sField]))
            return false;

        $aEvent = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $iContentId));
        if(empty($aEvent) || empty($aEvent[$CNF[$sField]]))
            return false;

        return $aEvent[$CNF[$sField]];
    }

    /**
     * Returns records for React Jot using OAuth2
     * @param int $iProfileId
     * @param string $sPage
     * @param string $sTab
     * @param int $iStart
     * @param int $iPerPage
     * @return array
     */
    public function serviceGetUserPosts($iProfileId = 0, $sPage = 'home', $sTab = 'hot', $iStart = 0, $iPerPage = 0)
    {
        $iProfileId = (int)$iProfileId ? (int)$iProfileId : bx_get_logged_profile_id();
        if(empty($iProfileId))
            return array(
                'code' => 1,
                'result' => array(),
                'message' => _t('_bx_timeline_txt_msg_no_profile_id'),
                'page' => $sPage,
                'tab' => $sTab
            );

        $sType = BX_TIMELINE_TYPE_OWNER_AND_CONNECTIONS;
        $sView = BX_TIMELINE_VIEW_DEFAULT;
        $sFilter = BX_TIMELINE_FILTER_DEFAULT;

        $aModules = array();

        switch($sPage){
            case 'profile':
                $sType = BX_BASE_MOD_NTFS_TYPE_OWNER;
                $sFilter = BX_TIMELINE_FILTER_OWNER;
                break;
            default:
                if ($this -> _oDb -> isModuleByName($sPage))
                   $aModules = array($sPage);
        }

        switch($sTab)
        {
            case 'latest':
                $sType = BX_BASE_MOD_NTFS_TYPE_PUBLIC;
                break;
            case 'popular':
                $sType = BX_TIMELINE_TYPE_HOT;
                break;
            case 'feed':
                $sType = BX_TIMELINE_TYPE_OWNER_AND_CONNECTIONS;
                break;
            default:
                if ($this -> _oDb -> isModuleByName($sTab))
                    $aModules = array($sTab);
        }

        $aParams = $this->getParams($sView, $sType, $iProfileId, $iStart, $iPerPage, $sFilter, $aModules);
        $aEvents = $this->_oDb->getEvents($aParams);
        $iCount = $this->_oDb->getEvents(array_merge($aParams, array('count' => true)));

        if(empty($aEvents) || !is_array($aEvents))
            return array(
                'code' => 0,
                'result' => array(),
                'message' => _t('_bx_timeline_txt_msg_no_results'),
                'page' => $sPage,
                'tab' => $sTab
            );

        $aBrowseParams = array();
        $aItems = array();

        foreach($aEvents as $aEvent) {
            $aResult = $this->_oTemplate->getData($aEvent, $aBrowseParams);

            if($aResult === false)
                continue;

            $oOwnerProfile = BxDolProfile::getInstance($aResult['owner_id']);

            $aFiles = array();
            $aContent = &$aResult['content'];

            if (!empty($aContent['image']))
                $aFiles['images'] = array_values($aContent['images']);
            if (!empty($aContent['images_attach']))
                $aFiles['images'] = array_values($aContent['images_attach']);

            if (!empty($aContent['videos']))
                $aFiles['videos'] = array_values($aContent['videos']);
            else
            if (!empty($aContent['videos_attach']))
                $aFiles['videos'] = array_values($aContent['videos_attach']);

            if (!empty($aContent['files']))
                $aFiles['files'] = array_values($aContent['files']);
            else
                if (!empty($aContent['files_attach']))
                    $aFiles['files'] = array_values($aContent['files_attach']);

            $aItems[$aEvent['id']] = array_merge(array(
                'owner' => array(
                    'icon' => $oOwnerProfile -> getThumb(),
                    'name' => $oOwnerProfile -> getDisplayName(),
                    'url' => $oOwnerProfile -> getUrl()
                ),
                'sample' => !empty($aResult['sample']) ? _t($aResult['sample']) : _t('_bx_timeline_txt_sample'),
                'sample_action' => !empty($aResult['sample_action']) ? _t($aResult['sample_action']) : _t('_bx_timeline_txt_added_sample'),
                'url' => isset($aResult['url']) ? $aResult['url'] : '',
                'raw' => isset($aContent['raw']) ? strip_tags($aContent['raw']) : '',
                'text' => isset($aContent['text']) ? strip_tags($aContent['text']) : '',
                'views' => isset($aResult['views']['count']) ? (int)$aResult['views']['count'] : 0,
                'votes' => isset($aResult['votes']['count']) ? (int)$aResult['votes']['count'] : 0,
                'reactions' => isset($aResult['reactions']['count']) ? (int)$aResult['reactions']['count'] : 0,
                'scores' => isset($aResult['scores']['count']) ? (int)$aResult['scores']['count'] : 0,
                'reports' => isset($aResult['reports']['count']) ? (int)$aResult['reports']['count'] : 0,
                'comments' => isset($aResult['comments']['count']) ? (int)$aResult['comments']['count'] : 0,
                'date' => isset($aResult['date']) ? $aResult['date'] : $aEvent['date'],
                'type' => stripos($aEvent['type'], 'timeline') !== false ? 'bx_timeline' : $aEvent['type'],
                'event_type' => $aEvent['type'],
                'id' => $aEvent['id'],
                'content' => $aResult['content'],
                'title' => isset($aResult['title']) ? _t($aResult['title']) : '',
                'description' => isset($aResult['description']) ? $aResult['description'] : ''
            ), $aFiles);
        }

        return array(
            'result' => $aItems,
            'code' => 0,
            'message' => '',
            'page' => $sPage,
            'tab' => $sTab,
            'total' => $iCount,
            'start' => (int)$iStart
        );
    }
}

/** @} */
