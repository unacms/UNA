<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Messenger Messenger
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolPrivacy');

class BxMessengerConfig extends BxBaseModGeneralConfig
{
    function __construct($aModule)
	{
		parent::__construct($aModule);

	    $this->CNF = array(
            // module icon
            'ICON' => 'comments-o col-green3',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'lots',
            'TABLE_NEW_MESSAGES' => $aModule['db_prefix'] . 'unread_jots',
            'TABLE_MESSAGES' => $aModule['db_prefix'] . 'jots',
            'TABLE_TYPES' => $aModule['db_prefix'] . 'lots_types',
            'TABLE_USERS_INFO' => $aModule['db_prefix'] . 'users_info',
            'TABLE_LIVE_COMMENTS' => $aModule['db_prefix'] . 'lcomments',
            'TABLE_JOT_REACTIONS' => $aModule['db_prefix'] . 'jot_reactions',
            'TABLE_JVC' => $aModule['db_prefix'] . 'jvc',
            'TABLE_PUBLIC_JVC' => $aModule['db_prefix'] . 'public_jvc',
            'TABLE_JVCT' => $aModule['db_prefix'] . 'jvc_track',
            'TABLE_LOT_SETTINGS' => $aModule['db_prefix'] . 'lots_settings',
            'TABLE_GROUPS' => $aModule['db_prefix'] . 'groups',
            'TABLE_GROUPS_LOTS' => $aModule['db_prefix'] . 'groups_lots',
            'TABLE_SAVED_JOTS' => $aModule['db_prefix'] . 'saved_jots',
            'TABLE_LOT_ATTACHMENTS' => $aModule['db_prefix'] . 'attachments',
            'TABLE_JOTS_MEDIA_TRACKER' => $aModule['db_prefix'] . 'jots_media_tracker',
            'TABLE_MASS_TRACKER' => $aModule['db_prefix'] . 'mass_convo_tracker',
            'TABLE_CMTS_OBJECTS' => 'sys_objects_cmts',
            'TABLE_ENTRIES_FULLTEXT' => 'search_title',
            'TABLE_ENTRIES_COMMENTS_FULLTEXT' => 'search_fields',

            // database fields

            // fields of system table sys_objects_cmts
            'FIELD_COBJ_ID' => 'ID',
            'FIELD_COBJ_MODULE' => 'Module',

            // live comments table fields
            'FIELD_LCMTS_ID' => 'lcmt_id',
            'FIELD_LCMTS_PARENT_ID' => 'lcmt_parent_id',
            'FIELD_LCMTS_SYS_ID' => 'lcmt_system_id',
            'FIELD_LCMTS_VPARENT_ID' => 'lcmt_vparent_id',
            'FIELD_LCMTS_OBJECT_ID' => 'lcmt_object_id',
            'FIELD_LCMTS_AUTHOR' => 'lcmt_author_id',
            'FIELD_LCMTS_LEVEL' => 'lcmt_level',
            'FIELD_LCMTS_TEXT' => 'lcmt_text',
            'FIELD_LCMTS_DATE' => 'lcmt_time',
            'FIELD_LCMTS_REPLIES' => 'lcmt_replies',

            // main lot table fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'created',
            'FIELD_UPDATED' => 'updated',
            'FIELD_PARTICIPANTS' => 'participants',
            'FIELD_TITLE' => 'title',
            'FIELD_URL' => 'url',
            'FIELD_TYPE' => 'type',
            'FIELD_CLASS' => 'class',
            'FIELD_PARENT_JOT' => 'parent_jot',
            'FIELD_VISIBILITY' => 'visibility',
            'FIELD_HASH' => 'hash',

            // storage tale
            'FIELD_ST_ID' => 'id',
            'FIELD_ST_AUTHOR' => 'profile_id',
            'FIELD_ST_REMOTE' => 'remote_id',
            'FIELD_ST_NAME' => 'file_name',
            'FIELD_ST_ADDED' => 'added',
            'FIELD_ST_JOT' => 'jot_id',
            'FIELD_ST_TYPE' => 'mime_type',
            'FIELD_ST_EXT' => 'ext',

            // messages/jots table fields
            'FIELD_MESSAGE_ID' => 'id',
            'FIELD_MESSAGE' => 'message',
            'FIELD_MESSAGE_FK' => 'lot_id',
            'FIELD_MESSAGE_AUTHOR' => 'user_id',
            'FIELD_MESSAGE_ADDED' => 'created',
            'FIELD_MESSAGE_AT_TYPE' => 'attachment_type',
            'FIELD_MESSAGE_AT' => 'attachment',
            'FIELD_MESSAGE_LAST_EDIT' => 'last_edit',
            'FIELD_MESSAGE_EDIT_BY' => 'edit_by',
            'FIELD_MESSAGE_TRASH' => 'trash',
            'FIELD_MESSAGE_VIDEOC' => 'vc',
            'FIELD_MESSAGE_REPLY' => 'reply',

            // lots types table fields
            'FIELD_TYPE_ID' => 'id',
            'FIELD_TYPE_NAME' => 'name',
            'FIELD_TYPE_LINKED' => 'show_link', // means use link in title

            // new messages table
            'FIELD_NEW_ID' => 'id',
            'FIELD_NEW_LOT' => 'lot_id',
            'FIELD_NEW_JOT' => 'first_jot_id',
            'FIELD_NEW_UNREAD' => 'unread_count',
            'FIELD_NEW_PROFILE' => 'user_id',

            // users info fields
            'FIELD_INFO_LOT_ID' => 'lot_id',
            'FIELD_INFO_USER_ID' => 'user_id',
            'FIELD_INFO_STAR' => 'star',
            'FIELD_INFO_PARAMS' => 'params', // means use link in title

            // jots media tracker
            'FJMT_FILE_ID' => 'file_id',
            'FJMT_USER_ID' => 'user_id',
            'FJMT_COLLAPSED' => 'collapsed',

            // talks mass talks tracker
            'FIELD_MASS_CONVO_ID' => 'convo_id',
            'FIELD_MASS_USER_ID' => 'user_id',
            'FIELD_MASS_ADDED' => 'added',

             // jot reactions fields
            'FIELD_REACT_JOT_ID' => 'jot_id',
            'FIELD_REACT_NATIVE' => 'native',
            'FIELD_REACT_EMOJI_ID' => 'emoji_id',
            'FIELD_REACT_PROFILE_ID' => 'user_id',
            'FIELD_REACT_ADDED' => 'added',

            // jitsi video conference fields
            'FJVC_ID' => 'id',
            'FJVC_LOT_ID' => 'lot_id',
            'FJVC_ROOM' => 'room',
            'FJVC_NUMBER' => 'number',
            'FJVC_ACTIVE' => 'active',

            // jitsi video conference tracking fields
            'FJVCT_ID' => 'id',
            'FJVCT_FK' => 'jvc_id',
            'FJVCT_AUTHOR_ID' => 'author_id',
            'FJVCT_START' => 'start',
            'FJVCT_END' => 'end',
            'FJVCT_PART' => 'participants',
            'FJVCT_JOINED' => 'joined',

            // jitsi public video conference fields
            'FPJVC_ID' => 'id',
            'FPJVC_ROOM' => 'room',
            'FPJVC_PARTS' => 'participants',
            'FPJVC_STATUS' => 'active',
            'FPJVC_CREATED' => 'created',

            // messenger lot settings
            'FLS_ID' => 'lot_id',
            'FLS_ACTIONS' => 'actions',
            'FLS_SETTINGS' => 'settings',
            'FLS_ICON' => 'icon',

            // messenger lot settings
            'FSJ_ID' => 'jot_id',
            'FSJ_PROFILE_ID' => 'profile_id',

            // messenger lots attachments
            'FLAT_NAME' => 'name',
            'FLAT_SERVICE' => 'service',

            // messenger groups
            'FMG_ID' => 'id',
            'FMG_NAME' => 'name',
            'FMG_AUTHOR' => 'author',
            'FMG_ADDED' => 'added',
            'FMG_PRIVACY' => 'allow_view_to',
            'FMG_DESC' => 'desc',
            'FMG_MODULE' => 'module',
            'FMG_URL' => 'url',
            'FMG_PROFILE_ID' => 'profile_id',

            // messenger lot settings
            'FMGL_LOT_ID' => 'lot_id',
            'FMGL_GROUP_ID' => 'group_id',

            // page URIs
            'URL_HOME' => BX_DOL_URL_ROOT . 'page.php?i=messenger',
            'URL_REPOST' => 'archive/',
            'URL_TEMPLATE' => BX_DOL_URL_ROOT . 'page.php?{link}',

            // some params
            'STAR_BACKGROUND_COLOR' => '#f5a623',
            'FILES_UPLOADER' => 'messenger_uploader_',
            'BELL_ICON_ON' => 'bell',
            'STAR_ICON' => 'star',
            'BELL_ICON_OFF' => 'bell-slash',
            'PARAM_FRIENDS_NUM_BY_DEFAULT' => 10,
            'PARAM_CONTACTS_NUM_BY_DEFAULT' => 5,
            'PARAM_NTFS_INTERVAL' => 1, /* INTERVAL IN HOURS*/
            'PARAM_MESSAGES_INTERVAL' => 1, /* INTERVAL IN MINUTE*/
            'PARAM_SEARCH_DEFAULT_USERS' => (int)getParam($aModule['db_prefix'] . 'max_drop_down_select'),
            'PARAM_MAX_HISTORY_MESSAGES' => 50,
            'PARAM_DEFAULT_TALK_FILES_NUM' => 20,
            'PARAM_MAX_JOT_NTFS_MESSAGE_LENGTH' => 50,
            'PARAM_PUSH_NOTIFICATIONS_DEFAULT_SYMBOLS_NUM' => 190,
            'JOT-PREVIEW-TEXT-LENGTH' => 500,
            'PARAM_PRIVATE' => TRUE,
            'PARAM_PUBLIC' => FALSE,
            'PARAM_ICONS_NUMBER' => 3,
            'PARAM_MODULE_TYPES' => array(
                                            'bx_groups' => BX_IM_TYPE_GROUPS,
                                            'bx_events' => BX_IM_TYPE_EVENTS,
                                            'bx_spaces' => BX_IM_TYPE_GROUPS
                                        ),
            'ADD-TO-PAGES-AREA' => array(
                BX_MSG_TALK_TYPE_PAGES => array('system', 'custom', '')
            ),
            'JOT-MENU-TO-SHOW' => ['reaction', 'reply'],
            'IMPLODE_GROUPS' => array(
                BX_ATT_GROUPS_ATTACH => array(
                    BX_ATT_TYPE_FILES, BX_ATT_TYPE_FILES_UPLOADING, BX_ATT_TYPE_GIPHY, BX_ATT_TYPE_REPOST, BX_ATT_TYPE_CUSTOM
                ),
            ),
            'URL_IDENT_PARAMS' => array('i','id','profile_id'),
            'EMOJI_APPS' => ['+1' => 'like'],
            'TITLE_CONSTANTS' => array('opponent'),
			'GROUPS_ITEMS_FIELD' => 'items',

             // GIPHY
             'GIPHY' => array(
                 'api_key' => getParam($aModule['db_prefix'] . 'giphy_key'),
                 'type' => getParam($aModule['db_prefix'] . 'giphy_type'),
                 'rating' => getParam($aModule['db_prefix'] . 'giphy_content_rating'),
                 'limit' => (int)getParam($aModule['db_prefix'] . 'giphy_limit'),
                 'gifs' => 'https://api.giphy.com/v1/gifs/',
                 'stickers' => 'https://api.giphy.com/v1/stickers/',
                 'search' => 'search',
                 'trending' => 'trending'
             ),

            // Jitsi
            'JITSI' => array(
                'LIB-LINK' => 'external_api.js'
            ),

             // objects
            'OBJECT_STORAGE' => 'bx_messenger_files',
            'OBJECT_API_FORM_NAME' => 'bx_messenger_send',
            'OBJECT_PRIVACY_GROUPS' => 'bx_messenger_allow_view_groups_to',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_messenger_photos_resized',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_messenger_preview',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_messenger_icon',
            'OBJECT_MP3_TRANSCODER' => 'bx_messenger_mp3',
            'OBJECT_VIDEOS_TRANSCODERS' => array(
                                                    'poster' => 'bx_messenger_videos_poster',
                                                    'mp4' => 'bx_messenger_videos_mp4',
                                                    'mp4_hd' => 'bx_messenger_videos_mp4_hd',
                                                    'webm' => 'bx_messenger_videos_webm',
                                                ),
            'OBJECT_MENU_SNIPPET_META' => 'bx_messenger_profile_snippet_meta',
            'OBJECT_VIEWS' => 'bx_messenger_lots',
            'OBJECT_JOTS_RVOTES' => 'bx_messenger_jots_rvotes',
            'OBJECT_FORM_ENTRY' => 'bx_messenger_lots',
            'OBJECT_FORM_FILTER' => 'bx_messenger_filter_criteria',
            'OBJECT_FORM_FILTER_DISPLAY' => 'bx_messenger_filter_criteria',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_messenger_lots',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_messenger_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_messenger_my', // actions menu on my entries page
            'OBJECT_MENU_ACTIONS_TALK_MENU' => 'bx_messenger_lot_menu',
            'OBJECT_MENU_TALK_INFO_MENU' => 'bx_messenger_lot_info_menu',
            'OBJECT_MENU_JOT_MENU' => 'bx_messenger_jot_menu',
            'OBJECT_MENU_CREATE_CONVO_MENU' => 'bx_messenger_create_convo_menu',
            'OBJECT_MENU_NAV_LEFT_MENU' => 'bx_messenger_nav_menu',
            'OBJECT_MENU_GROUPS_MENU' => 'bx_messenger_groups_menu',
            'OBJECT_MENU_SUBMENU' => '', // main module submenu
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_messenger_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_GRID' => 'bx_messenger',
            'OBJECT_UPLOADERS' => array('sys_html5'),

            // available lot options
            'LOT_OPTIONS' => array(
                'msg',
                'giphy',
                'files',
                'video_rec',
                'smiles'
            ),
            'SEARCH-CRITERIA' => array('titles', 'participants', 'content'),
            'VIEW-IN-TALKS' => array(BX_MSG_TALK_TYPE_MR, BX_MSG_TALK_TYPE_REPLIES, BX_MSG_TALK_TYPE_SAVED),
            //options
            'DATE-SEPARATOR-FORMAT-Y' => 'MMM D, Y, H:mm',
            'DATE-SEPARATOR-FORMAT' => 'MMM D, H:mm',
            'DATE-SHIFT' => 300, // time period to show date separator
            'MAX_SEND_SYMBOLS'	=> (int)getParam($aModule['db_prefix'] . 'max_symbols_number'),
            'MAX_PREV_JOTS_SYMBOLS' => (int)getParam($aModule['db_prefix'] . 'max_symbols_brief_jot'),
            'MAX_JOTS_BY_DEFAULT' => (int)getParam($aModule['db_prefix'] . 'max_jot_number_default'),
            'MAX_JOTS_LOAD_HISTORY' => (int)getParam($aModule['db_prefix'] . 'max_jot_number_in_history'),
            'MAX_LOTS_NUMBER' => (int)getParam($aModule['db_prefix'] . 'max_lots_number'),
            'SERVER_URL' => getParam($aModule['db_prefix'] . 'server_url'),
            'MAX_FILES_TO_UPLOAD' => (int)getParam($aModule['db_prefix'] . 'max_files_send'),
            'MAX_VIDEO_LENGTH'	=> (int)getParam($aModule['db_prefix'] . 'max_video_length_minutes'),
            'MAX_NTFS_NUMBER'	=> (int)getParam($aModule['db_prefix'] . 'max_ntfs_number'),
            'MAX_VIEWS_PARTS_NUMBER' => (int)getParam($aModule['db_prefix'] . 'max_parts_views'),
            'ALLOW_TO_REMOVE_MESSAGE' => getParam($aModule['db_prefix'] . 'allow_to_remove_messages') == 'on',
            'ALLOW_TO_MODERATE_MESSAGE_FOR_AUTHORS' => getParam($aModule['db_prefix'] . 'allow_to_moderate_messages') == 'on',
            'REMOVE_MESSAGE_IMMEDIATELY' => getParam($aModule['db_prefix'] . 'remove_messages_immediately') == 'on',
            'USE_EMBEDLY' => getParam($aModule['db_prefix'] . 'use_embedly') == 'on',
            'USE_MENTIONS' => getParam($aModule['db_prefix'] . 'enable_mentions') == 'on',
            'EMOJI_SET' => getParam($aModule['db_prefix'] . 'emoji_set'),
            'REACTIONS_SIZE' => (int)getParam($aModule['db_prefix'] . 'reactions_size'),
            'EMOJI_PREVIEW' => getParam($aModule['db_prefix'] . 'show_emoji_preview') == 'on',
            'ENABLE-JITSI' => getParam($aModule['db_prefix'] . 'jitsi_enable') == 'on',
            'JITSI-SERVER' => getParam($aModule['db_prefix'] . 'jitsi_server'),
            'JITSI-CHAT' => getParam($aModule['db_prefix'] . 'jitsi_chat') == 'on',
            'JITSI-CHAT-SYNC' => getParam($aModule['db_prefix'] . 'jitsi_sync') == 'on',
            'JITSI-HIDDEN-INFO' => getParam($aModule['db_prefix'] . 'jitsi_hide_info') == 'on',
            'JITSI-ONLY-FOR-PRIVATE' => getParam($aModule['db_prefix'] . 'jitsi_only_for_private') == 'on',
            'JITSI-ENABLE-WATERMARK' => getParam($aModule['db_prefix'] . 'jitsi_enable_watermark') == 'on',
            'JITSI-WATERMARK-URL' => getParam($aModule['db_prefix'] . 'jitsi_watermark_link'),
            'JITSI-SUPPORT-LINK' => getParam($aModule['db_prefix'] . 'jitsi_support_url'),
            'DISABLE-PROFILE-PRIVACY' => getParam($aModule['db_prefix'] . 'disable_contact_privacy') == 'on',
            'CONTACT-JOIN-ORGANIZATION' => getParam($aModule['db_prefix'] . 'enable_joined_organizations') == 'on',
            'SHOW-FRIENDS' => getParam($aModule['db_prefix'] . 'show_friends') == 'on',
            'CHECK-CONTENT-FOR-TOXIC' => getParam($aModule['db_prefix'] . 'check_toxic') == 'on',
            'TIME-FROM-NOW' => getParam($aModule['db_prefix'] . 'time_in_history') == 'on',
            'DONT-SHOW-DESC' => getParam($aModule['db_prefix'] . 'dont_show_search_desc') == 'on',
            'USE-UNIQUE-MODE' => getParam($aModule['db_prefix'] . 'use_unique_mode') == 'on',
            'USE-FRIENDS-ONLY-MODE' => getParam($aModule['db_prefix'] . 'connect_friends_only') == 'on',
            'UPDATE-PAGE-TITLE' => getParam($aModule['db_prefix'] . 'dont_update_title') == 'on',
            'SEARCH-CRITERIA-SELECTED' => getParam($aModule['db_prefix'] . 'search_criteria'),
            'BROADCAST-FIELDS' => getParam($aModule['db_prefix'] . 'broadcast_fields'),
            'BROADCAST-ALLOWED-FILTER-FIELDS' => ['gender', 'location', 'birthday', 'membership'],
            'JWT' => array(
              'app_id' => getParam($aModule['db_prefix'] . 'jwt_app_id'),
              'secret' => getParam($aModule['db_prefix'] . 'jwt_app_secret'),
            ),
            'JOT-JWT' =>  trim(getParam($aModule['db_prefix'] . 'jot_server_jwt')),
            'JSMain' => 'oMessenger',
            'JSCreateConvoMenu' => 'oMessengerCreateConvo',
            'JSMessengerLib' => 'oMUtils',
        );

		$this->_aObjects = array(
            'alert' => $this->_sName
		);	   
	}

	function getBroadcastAllowedFields(){
        $aFields = $this->CNF['BROADCAST-ALLOWED-FILTER-FIELDS'];

        bx_alert($this->_sName, 'broadcast_filtered_fields', 0, 0, [
            'fields' => &$aFields
        ]);

        return !empty($aFields) && is_array($aFields) ? $aFields : [];
    }
	/**
	* Returns type of the talk 
	*@param string $sModule module uri, if messenger block was added to a special page of any module
	*@return int type
	*/
	public function getTalkType($sModule = ''){
		return $sModule && isset($this->CNF['PARAM_MODULE_TYPES'][$sModule]) ? $this->CNF['PARAM_MODULE_TYPES'][$sModule] : BX_IM_TYPE_PUBLIC;
	}
	
	/**
	* Checks if the posted link is repost link
	*@param string $sUrl internal post url
	*@return array, string url and int post id
	*/
	public function isJotLink($sUrl){
		$aResult = [];
		$sJotPattern = '/^'. preg_replace(array('/\./', '/\//', '/\?/'), array('\.', '\/', '\?'), $this->getRepostUrl()) . '(\d+)/i';
		if (preg_match($sJotPattern, $sUrl, $aMatches) && intval($aMatches[1]))
			$aResult = array('url' => $aMatches[0], 'id' => $aMatches[1]);

		return $aResult;
	}

	public function getBaseUri()
    {
        $sLink = parent::getBaseUri();
        if(strncmp($sLink, BX_DOL_URL_ROOT, strlen(BX_DOL_URL_ROOT)) !== 0)
            $sLink = BX_DOL_URL_ROOT . $sLink;

        return $sLink;
    }

    public function getRepostUrl($iJotId = 0)
    {
        return $this->getBaseUri() . $this->CNF['URL_REPOST'] . ( $iJotId ? $iJotId : '');
    }

    /**
	* Converts text link to url (wraps text url to <a>)
	*@param string $sText url
	*@param string $sAttrs special attributes for the link
	*@param boolean $bHtmlSpecialChars convert link to special html chars
	*@return string url
	*/
	public function bx_linkify($sText, $sAttrs = '', $bHtmlSpecialChars = false){
		if ($bHtmlSpecialChars)
			$sText = htmlspecialchars($sText, ENT_NOQUOTES, 'UTF-8');

		$sRe = "@(((https?://)|(www\.))[^\"<\s]+)(?![^<>]*>|[^\"]*?<\/a)@";
		preg_match_all($sRe, $sText, $aMatches, PREG_OFFSET_CAPTURE);

		$aMatches = $aMatches[0];
		if ($i = count($aMatches))
			$bAddNofollow = getParam('sys_add_nofollow') == 'on';

		while ($i--)
		{
			$sUrl = $aMatches[$i][0];
			if (!preg_match('@^https?://@', $sUrl))
				$sUrl = 'http://'.$sUrl;

			if (strncmp(BX_DOL_URL_ROOT, $sUrl, strlen(BX_DOL_URL_ROOT)) !== 0) {
				$sAttrs .= ' target="_blank" ';
				if ($bAddNofollow)
					$sAttrs .= ' rel="nofollow" ';
			}

			if ($this -> isJotLink($sUrl))
				$sReplacement = "<a href=\"{$sUrl}\">{$aMatches[$i][0]}</a>";
			else
			{
				$oEmbed = BxDolEmbed::getObjectInstance();
				if($oEmbed && $this -> CNF['USE_EMBEDLY'])
					$sReplacement = $oEmbed->getLinkHTML($sUrl, $aMatches[$i][0]);
				else
					$sReplacement = "<a {$sAttrs} href=\"{$sUrl}\">{$aMatches[$i][0]}</a>";
			}
			
			$sText = substr_replace($sText, $sReplacement, $aMatches[$i][1], strlen($aMatches[$i][0]));
		}
		
		$mail_pattern = "/([\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6}))(?![^<>]*>|[^\"]*?<\/a)/";
		$sText = preg_replace($mail_pattern, '<a href="mailto:$1">$1</a>', $sText);

		return $sText;
	}
	
	/**
	* Remove repost links from the message
	*@param string $sMessage message
	*@param int iJotId jot Id
	*@return string message
	*/
	public function cleanRepostLinks($sMessage, $iJotId)
	{
		$sArchiveUrl = $this->getRepostUrl($iJotId);
		return str_replace($sArchiveUrl, '', $sMessage);
	}
	
	/**
	* Builds from server environment valid Url handle for lot 
	*@return string url
	*/
    public function getPageIdent($sPageLink = '')
    {
        $sPageUrl = $sPageLink ? $sPageLink : $_SERVER['REQUEST_URI'];

        if ($sPageUrl === '/' || $sPageUrl === '/index.php')
            return 'index.php';

        // check if the link is jot link, then to return base url
        $sLinkToCheck = BX_DOL_URL_ROOT . substr($sPageUrl, 1);
        if ($this->isJotLink($sLinkToCheck))
            $sPageUrl = BxDolPermalinks::getInstance()->permalink($this->CNF['URL_HOME']);

        $sPageUrl = BxDolPermalinks::getInstance()->unpermalink(ltrim($sPageUrl, '/'));
        $sPageUrl = parse_url($sPageUrl, PHP_URL_QUERY);
        if (!empty($sPageUrl)) {
            parse_str($sPageUrl, $aUrl);
            if (!empty($aUrl)) {
                $aValidUrl = array();
                foreach ($this->CNF['URL_IDENT_PARAMS'] as &$sParam)
                    if (!empty($aUrl[$sParam]))
                        $aValidUrl[$sParam] = $aUrl[$sParam];

                if (!empty($aValidUrl))
                    $sPageUrl = http_build_query($aValidUrl);
            }
        }

        return $sPageUrl;
    }

    function getPageName($sIdent){
        if (!$sIdent)
            return '';

        parse_str($sIdent, $aUrl);
        return !empty($aUrl) && isset($aUrl['i']) ? $aUrl['i'] : '';
    }

    function normalizeLink($sUrl){
        $aValidUrl = array();
        parse_str($sUrl, $aUrl);
        if (!empty($aUrl)) {
            foreach ($this->CNF['URL_IDENT_PARAMS'] as &$sParam)
                if (!empty($aUrl[$sParam]))
                    $aValidUrl[$sParam] = $aUrl[$sParam];
        }

        return !empty($aValidUrl) ? http_build_query($aValidUrl) : $sUrl;
    }

    public function getPageLink($sUrl){
        if ($sUrl === 'index.php' || !$sUrl)
            return BX_DOL_URL_ROOT;

        if ($sUrl && $sUrl[0] === '/') {
            $sUrl = 'i=' . ltrim($sUrl, '/');
        }

	    return BxDolPermalinks::getInstance()->permalink(str_replace('{link}', $sUrl, $this->CNF['URL_TEMPLATE']));
    }

    public function getGiphyGifs($sAction = 'trending', $sValue = '', $iStart = 0){
        $oGiphy = &$this->CNF['GIPHY'];
	    $aParams = array(
            'api_key' => $oGiphy['api_key'],
            'offset' => $iStart,
            'limit' => (int)$oGiphy['limit'],
            'rating' => $oGiphy['rating']
        );

        $sUrl = $oGiphy[$oGiphy['type']];
        if ($sAction === 'search' && $sValue){
            $aParams['q'] = $sValue;
            $aParams['lang'] = bx_lang_name();
            $aParams['random_id'] = time();
        }

        $sAction = $sAction ? $sAction : 'trending';
        $sAction = isset($oGiphy[$sAction]) ? $oGiphy[$sAction] : $sAction;
        return bx_file_get_contents("{$sUrl}{$sAction}", $aParams);
    }

    public function getRoomId($mixedLotId = '', $mixedAuthor = ''){
        return 'UNA' . md5(BX_DOL_URL_ROOT . $mixedLotId . $mixedAuthor . BX_DOL_SECRET);
    }

    public function isJitsiAllowed($iType){
        if (!$this->CNF['ENABLE-JITSI'])
	        return false;

	    if ($this->CNF['JITSI-ONLY-FOR-PRIVATE'] && ($iType == BX_IM_TYPE_PUBLIC || $iType == BX_IM_TYPE_SETS))
	        return false;

	    return $this->isAllowedAction(BX_MSG_ACTION_CREATE_VC) === true;
    }

    public function getValidUrl($sUrl, $sType = 'domain'){
        if (!$sUrl || !($aUrl = parse_url($sUrl)))
            return '';

        $sDomain = isset($aUrl['host']) ? $aUrl['host'] : (isset($aUrl['path']) ? $aUrl['path'] : $sUrl);
        $sDomain = str_replace(["www."], [''], $sDomain);

        return $sType === 'domain' ? $sDomain : "https://{$sDomain}";
    }

    public function isAllowedAction($sAction = BX_MSG_ACTION_SEND_MESSAGE, $iProfileId = 0){
        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        $aProfileMembership = BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId);
        if (isset($aProfileMembership['status']) && $aProfileMembership['status'] !== 'active')
            return false;

        if ($sAction && ($sMembershipAction = str_replace('_', ' ', $sAction))){
           $aCheck = checkActionModule($iProfileId, $sMembershipAction, $this->getName(), true);
           if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
                return $aCheck[CHECK_ACTION_MESSAGE];
        }

        return true;
    }

    function generateJWTToken($iProfileId, $aUserParams = array(), $aTokenParams = array()){
        $oProfileInfo = BxDolProfile::getInstance( $iProfileId );
        if (!$iProfileId || (empty($aUserParams) && empty($aTokenParams)))
            return false;

        // Encode Header to Base64Url String
        $sHeader = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $sHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sHeader));

        // Create token payload as a JSON string
        $sPayload = json_encode( array_merge(array('context' => $aUserParams), $aTokenParams));
        $sPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sPayload));

        // Create Signature Hash
        $sSignature = hash_hmac('sha256', $sHeader . "." . $sPayload, $this->CNF['JOT-JWT'], true);
        $sSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sSignature));

        return "{$sHeader}.{$sPayload}.{$sSignature}";
    }

    function getPageIcon(){
        if ($sFileUrl = BxDolDesigns::getInstance()->getSiteLogoUrl())
            return $sFileUrl;

        if (!($iIdIcon = (int)getParam('sys_site_icon')))
            return BxDolTemplate::getInstance()->getIconUrl('apple-touch-icon.png');

        $oTranscoder = BxDolTranscoderImage::getObjectInstance(BX_DOL_TRANSCODER_OBJ_ICON_FAVICON);
        return $oTranscoder->getFileUrl($iIdIcon);
    }

    function getSeparatorTime($iUnixTimestamp){
        $sDateUTC = bx_time_utc($iUnixTimestamp);
        $sFormat = date('Y', $iUnixTimestamp) != date('Y') ? $this->CNF['DATE-SEPARATOR-FORMAT-Y'] : $this->CNF['DATE-SEPARATOR-FORMAT'];
        return '<time datetime="' . $sDateUTC . '" data-bx-autoformat="' . ( !$this->CNF['TIME-FROM-NOW'] ? 0 : getParam('sys_format_timeago')) . '" data-bx-format="' . $sFormat . '">' . $sDateUTC . '</time>';
    }

    public function isValidToUpload($sFileName){
        if (!$sFileName)
            return false;

        $sBaseName = basename($sFileName);
        if (strcmp($sBaseName, $sFileName) !== 0)
            return false;

        $sRequestPath = realpath(BX_DIRECTORY_PATH_TMP . $sFileName);
        $sValidRootPath = realpath(BX_DIRECTORY_PATH_TMP);

        return $sRequestPath !== false && strcmp(substr($sRequestPath, 0, strlen($sValidRootPath)), $sValidRootPath) === 0;
    }

    public function isSearchCriteria($sSelected){
        $aItems = $this->CNF['SEARCH-CRITERIA-SELECTED'] ? explode(',', $this->CNF['SEARCH-CRITERIA-SELECTED']) : array();
        if (empty($aItems))
            return false;

        return in_array($sSelected, $aItems);
    }

    public function replaceConstant($sTitle, $aMarkers){
        foreach($this->CNF['TITLE_CONSTANTS'] as &$sItem){
            if (isset($aMarkers[$sItem]))
                $sTitle = str_replace('{' . $sItem . '}', $aMarkers[$sItem], $sTitle);
        }

        return $sTitle;
    }

    public function generateHash($sId){
        return md5(BX_DOL_SECRET . $sId);
    }

    public function isAttachmentType(&$aJot, $sType = BX_ATT_TYPE_REPLY) {
        if (empty($aJot) || empty($aJot[$this->CNF['FIELD_MESSAGE_AT']]))
            return false;

        if ($aJot[$this->CNF['FIELD_MESSAGE_AT_TYPE']])
            return $aJot[$this->CNF['FIELD_MESSAGE_AT_TYPE']] === $sType;

        $mixedResult = @unserialize($aJot[$this->CNF['FIELD_MESSAGE_AT']]);
        return isset($mixedResult[$sType]);
    }

    public function convertEmoji2App($sName){
        return isset($this->CNF['EMOJI_APPS'][$sName]) ? $this->CNF['EMOJI_APPS'][$sName] : $sName;
    }

    public function convertApp2Emoji($sName){
       $sKey = array_search($sName, $this->CNF['EMOJI_APPS']);
       if ($sKey === false)
           return $sName;

        return $this->CNF['EMOJI_APPS'][$sKey];
    }

    public function getConnectionToFunctionCheck(){
        return true;
    }

    public function generateConvoHash($iId){
        $sHash = genRndPwd(10, false);
        if (!uriCheckUniq($sHash, $this->CNF['TABLE_ENTRIES'], $this->CNF['FIELD_HASH']))
            $sHash = md5($iId . BX_DOL_SECRET);

        return strtolower($sHash);
    }

    public function getConnectionByType($sType){
        if ($sType === 'followers')
            return BxDolConnection::getObjectInstance('sys_profiles_subscriptions');

        if ($sType === 'friends')
            return BxDolConnection::getObjectInstance('sys_profiles_friends');

        return false;
    }

    public function getSelectedNotificationMode($aNotifData){
        if (empty($aNotifData) || !$oModule = BxDolModule::getInstance('bx_notifications'))
            return false;

        $bEmail = in_array('email', $aNotifData);
        $bPush = in_array('push', $aNotifData);
        $bSite = in_array('site', $aNotifData);

        if ($bEmail && $bPush)
            return BX_BASE_MOD_NTFS_SLTMODE_DISABLED;

        if ($bEmail)
            return BX_NTFS_SLTMODE_SITE_EMAIL;

        if ($bPush)
            return BX_NTFS_SLTMODE_SITE_PUSH;

        if ($bSite)
            return BX_NTFS_SLTMODE_SITE;

        return BX_NTFS_SLTMODE_ABSOLUTE;
    }
}

/** @} */
