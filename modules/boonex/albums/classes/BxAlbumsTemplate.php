<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Albums Albums
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module representation.
 */
class BxAlbumsTemplate extends BxBaseModTextTemplate
{
    /**
     * Constructor
     */
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_albums';
        parent::__construct($oConfig, $oDb);

        $this->addCss(array(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flickity/|flickity.css'));
        $this->addJs(array('flickity/flickity.pkgd.min.js', 'main.js'));
    }

    function unit ($aData, $isCheckPrivateContent = true, $sTemplateName = 'unit.html', $aParams = array())
    {
        if ('unit_media.html' == $sTemplateName || 'unit_media_live_search.html' == $sTemplateName || 'unit_showcase.html' == $sTemplateName || 'unit_media_gallery.html' == $sTemplateName)
            return $this->unitMedia($aData, $isCheckPrivateContent, $sTemplateName, $aParams);

        $oModule = BxDolModule::getInstance($this->MODULE);
        $CNF = &$oModule->_oConfig->CNF;

        if ($s = $this->checkPrivacy ($aData, $isCheckPrivateContent, $oModule))
            return $s;

        // get entry url        
        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aData[$CNF['FIELD_ID']]));

        $oProfile = BxDolProfile::getInstance($aData[$CNF['FIELD_AUTHOR']]);
        if (!$oProfile) 
            $oProfile = BxDolProfileUndefined::getInstance();

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_TRANSCODER_BROWSE']);
        $oTranscoderPoster = $CNF['OBJECT_VIDEOS_TRANSCODERS'] ? BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['poster']) : false;

        $aBrowseUnits = array ();
        $aMediaList = $oModule->_oDb->getMediaListByContentId($aData[$CNF['FIELD_ID']], getParam('bx_albums_album_browsing_unit'));
        foreach ($aMediaList as $k => $a) {
            $aFileInfo = $oStorage->getFile($a['file_id']);

            $bVideo = $oTranscoderPoster && strncmp('video/', $aFileInfo['mime_type'], 6) === 0 && $oTranscoderPoster->isMimeTypeSupported($aFileInfo['mime_type']);            
            $iVideoDuration = $bVideo ? $oModule->getMediaDuration($aFileInfo) : 0;

            $aBrowseUnits[] = array (
                'img_url' => $oTranscoder->getFileUrl($a['file_id']),
                'url' => $this->getViewMediaUrl($CNF, $a['id']),
                'title_attr' => bx_html_attribute($a['title']),
                'bx_if:show_play' => array(
                    'condition' => $bVideo,
                    'content' => array()
                ),
                'bx_if:show_duration' => array(
                    'condition' => $iVideoDuration > 0,
                    'content' => array(
                        'duration' => _t_format_duration($iVideoDuration)
                    )
                )

            );
        }

        // get summary
        $sLinkMore = ' <a title="' . bx_html_attribute(_t('_sys_read_more', $aData[$CNF['FIELD_TITLE']])) . '" href="' . $sUrl . '"><i class="sys-icon ellipsis-h"></i></a>';
        $sSummary = strmaxtextlen($aData[$CNF['FIELD_TEXT']], (int)getParam($CNF['PARAM_CHARS_SUMMARY']), $sLinkMore);
        $sSummaryPlain = BxTemplFunctions::getInstance()->getStringWithLimitedLength(strip_tags($sSummary), (int)getParam($CNF['PARAM_CHARS_SUMMARY_PLAIN']));

        $sMeta = '';
        if(!empty($CNF['OBJECT_MENU_SNIPPET_META'])) {
            $oMenuMeta = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_SNIPPET_META'], $this);
            if($oMenuMeta) {
                $oMenuMeta->setContentId($aData[$CNF['FIELD_ID']]);
                $aTmplVarsMeta = array(
                    'meta' => $oMenuMeta->getCode()
                );
            }
        }

        $bBadgesSingle = isset($aParams['badges_single']) ? $aParams['badges_single'] : false;
        $bBadgesCompact = isset($aParams['badges_compact']) ? $aParams['badges_compact'] : false;

        // generate html
        $aVars = array (
            'id' => $aData[$CNF['FIELD_ID']],
            'content_url' => $sUrl,
            'title' => bx_process_output($aData[$CNF['FIELD_TITLE']]),
            'badges' => $oModule->serviceGetBadges($aData[$CNF['FIELD_ID']], $bBadgesSingle, $bBadgesCompact),
            'summary' => $sSummary,
            'author' => $oProfile->getDisplayName(),
            'author_url' => $oProfile->getUrl(),
            'entry_posting_date' => bx_time_js($aData[$CNF['FIELD_ADDED']], BX_FORMAT_DATE),
            'module_name' => _t($CNF['T']['txt_sample_single']),
            'ts' => $aData[$CNF['FIELD_ADDED']],
        	'bx_if:meta' => array(
                'condition' => !empty($aTmplVarsMeta),
                'content' => $aTmplVarsMeta
            ),
            'bx_repeat:browse' => $aBrowseUnits,
            'bx_if:thumb' => array (
                'condition' => $aBrowseUnits,
                'content' => array (
                    'title' => bx_process_output($aData[$CNF['FIELD_TITLE']]),
                    'summary_attr' => '',
                    'content_url' => $sUrl,
                    'thumb_url' => $aBrowseUnits ? $aBrowseUnits[0]['img_url'] : '',
                    'gallery_url' => '',
                    'strecher' => '',
                ),
            ),
            'bx_if:no_thumb' => array (
                'condition' => !$aBrowseUnits,
                'content' => array (
                    'content_url' => $sUrl,
                    'summary_plain' => '',
                    'strecher' => '',
                ),
            ),

        );

        return $this->parseHtmlByName($sTemplateName, $aVars);
    }

    function unitMedia ($aData, $isCheckPrivateContent = true, $sTemplateName = 'unit.html', $aParams = array())
    {
        $oModule = BxDolModule::getInstance($this->MODULE);
        $CNF = &$oModule->_oConfig->CNF;

        if (!($aMediaInfo = $oModule->_oDb->getMediaInfoById($aData['id'])))
            return '';

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if (!($aFile = $oStorage->getFile($aMediaInfo['file_id'])))
            return '';

        $aVars = $this->mediaVars($aMediaInfo, $CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'], $CNF['OBJECT_VIDEOS_TRANSCODERS']['poster_preview'], $aParams);

        $aVarsTmp = $aVars['bx_if:image']['condition'] ? $aVars['bx_if:image']['content'] : $aVars['bx_if:video']['content'];

        $aVars = array_merge($aVars, array (
            'class' => $this->_getUnitClass($aData, $sTemplateName),
            'module_name' => _t($CNF['T']['txt_media_single']),
            'content_url' => $aVars['url'],
            'ts' => $aFile['added'],
            'actions' => $oModule->serviceMediaAllActions(array($aData['id'], $aMediaInfo), array(
                'object_menu' => $CNF['OBJECT_MENU_ACTIONS_VIEW_MEDIA_UNIT']
            )),
            'bx_if:thumb' => array (
                'condition' => isset($aData['file_id']) && $aData['file_id'],
                'content' => array (
                    'title' => bx_process_output($aData['title']),
                    'summary_attr' => '',
                    'content_url' => $aVarsTmp['url'],
                    'thumb_url' => $aVarsTmp['url_img'],
                    'gallery_url' => '',
                    'strecher' => '',
                ),
            ),
            'bx_if:no_thumb' => array (
                'condition' => false,
                'content' => array (),
            ),
        ));

        return $this->parseHtmlByName($sTemplateName, $aVars);
    }

    public function entryText ($aData, $sTemplateName = 'entry-text.html')
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $aVars = $this->getTmplVarsText($aData);
        if(empty($aVars[$CNF['FIELD_TITLE']]) && empty($aVars[$CNF['FIELD_TEXT']]))
            return false;

        return $this->_bIsApi ? $aVars : $this->parseHtmlByName($sTemplateName, $aVars);
    }

    function entryMediaView ($iMediaId, $aParams = [])
    {
        $oModule = parent::getModule();
        $CNF = &$this->_oConfig->CNF;

        $aMediaInfo = [];
        if(!($aMediaInfo = $oModule->_oDb->getMediaInfoById($iMediaId)))
            return $this->_bIsApi ? [] : '';

        $aAlbumInfo = [];
        if(!($aAlbumInfo = $oModule->_oDb->getContentInfoById($aMediaInfo['content_id'])))
            return $this->_bIsApi ? [] : '';        

        $iProfileId = $aAlbumInfo[$CNF['FIELD_AUTHOR']];
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile) 
            $oProfile = BxDolProfileUndefined::getInstance();

        $mixedContext = isset($aParams['context']) ? $aParams['context'] : false;
        $sAlbumUrl = $this->_oConfig->getAlbumUrl($aAlbumInfo[$CNF['FIELD_ID']]);
        $sAlbumTitle = bx_process_output($aAlbumInfo[$CNF['FIELD_TITLE']]);

        $aVars = $this->mediaVars($aMediaInfo, $CNF['OBJECT_IMAGES_TRANSCODER_BIG'], $CNF['OBJECT_VIDEOS_TRANSCODERS']['poster'], $aParams);
        if($this->_bIsApi)
            return array_merge($aVars, [
                'text' => $sAlbumTitle,
                'entry_text' => $sAlbumTitle,
            ]);

        $aVars = array_merge($aVars, [
            'album' => _t('_bx_albums_txt_media_album_link', $sAlbumUrl, $sAlbumTitle, $oProfile->getUrl(), $oProfile->getDisplayName()),
            'js_code' => $this->getJsCode('main')
        ]);

        $aNextPrev = [
            'next' => $this->getNextPrevMedia($aMediaInfo, true, $mixedContext),
            'prev' => $this->getNextPrevMedia($aMediaInfo, false, $mixedContext),
        ];

        foreach ($aNextPrev as $k => $a) {
            $aVars['bx_if:' . $k] = [
                'condition' => $a,
                'content' => $a,
            ];
            $aVars['bx_if:' . $k . '-na'] = [
                'condition' => !$a,
                'content' => [],
            ];
        }

        $aMediaItems = $oModule->_oDb->getMediaListByContentId($aMediaInfo['content_id'], false);
        $aMediaItemsFormatted = [];
        foreach ($aMediaItems as $i => $r) {
            $a = $this->mediaVars($r, $CNF['OBJECT_IMAGES_TRANSCODER_BIG'], $CNF['OBJECT_VIDEOS_TRANSCODERS']['poster'], $aParams);
            $aMedia = $a['bx_if:image']['condition'] ? $a['bx_if:image']['content'] : $a['bx_if:video']['content'];
            $aMediaItemsFormatted[$i] = [
                'index' => $i,
                'alt' => $aMedia['title'],
                'url' => $aMedia['url'],
                'media-id' => $r['id'],

            ];
            if ($a['bx_if:video']['condition']) {
                $aMediaItemsFormatted[$i]['html'] = '<div class="pswp__video">' . $a['bx_if:video']['content']['video'] . '</div>';
            } else {
                $aMediaItemsFormatted[$i]['src'] = $aMedia['url_img'];
                $aMediaItemsFormatted[$i]['width'] = $a['bx_if:image']['content']['w'];
                $aMediaItemsFormatted[$i]['height'] = $a['bx_if:image']['content']['h'];
            }
        }
        $aVars['media_items'] = json_encode($aMediaItemsFormatted);

        return $this->parseHtmlByName('media-view.html', $aVars);
    }

    protected function mediaVars ($aMediaInfo, $sImageTranscoder = false, $sVideoPosterTranscoder = false, $aParams = array())
    {
        $oModule = BxDolModule::getInstance($this->MODULE);
        $CNF = &$oModule->_oConfig->CNF;

        $sStorage = $CNF['OBJECT_STORAGE'];
        $oStorage = BxDolStorage::getObjectInstance($sStorage);
        $oTranscoder = BxDolTranscoderImage::getObjectInstance($sImageTranscoder);
        $aTranscodersVideo = [
            'poster' => BxDolTranscoderImage::getObjectInstance($sVideoPosterTranscoder),
            'mp4' => BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4']),
            'mp4_hd' => BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4_hd']),
        ];

        $aFileInfo = $oStorage->getFile ($aMediaInfo['file_id']);
        if (!$aFileInfo)
            return '';

        $isImage = 0 === strncmp('image/', $aFileInfo['mime_type'], 6) && $oTranscoder->isMimeTypeSupported($aFileInfo['mime_type']); // preview for images, transcoder object for preview must be defined
        $isVideo = $aTranscodersVideo && (0 === strncmp('video/', $aFileInfo['mime_type'], 6)) && $aTranscodersVideo['poster']->isMimeTypeSupported($aFileInfo['mime_type']); // preview for videos, transcoder object for video must be defined

        $sMediaTitle = $this->getMediaTitle($aMediaInfo);
        $sMediaTitleAttr = bx_html_attribute($sMediaTitle);
        $mixedContext = isset($aParams['context']) ? $aParams['context'] : '';
        $sUrl = $this->getViewMediaUrl($CNF, $aMediaInfo['id'], $mixedContext);

        $aTmplVarsImage = [];
        if($isImage) {
            $sSrc = $oTranscoder ? $oTranscoder->getFileUrl($aFileInfo['id']) : $oStorage->getFileUrlById($aFileInfo['id']);

            list($iWidth, $iHeight) = $aMediaInfo['data'] ? explode('x', $aMediaInfo['data']) : [0, 0];

            $aTmplVarsImage = $this->_bIsApi ? [
                'storage' => $sStorage,
                'src' => $sSrc,
                'width' => $iWidth,
                'height' => $iHeight
            ] : [
                'title_attr' => $sMediaTitleAttr,
                'title' => $sMediaTitle,
                'url' => $sUrl,
                'url_img' => $sSrc,
                'media_id' => $aMediaInfo['id'],
                'w' => $iWidth,
                'h' => $iHeight,
                'context' => $mixedContext,
            ];
        }

        $aTmplVarsVideo = [];
        if($isVideo) {
            $mixedAttrs = false;
            if(!empty($aParams['autoplay']))
                $mixedAttrs = ['autoplay' => 'autoplay'];

            $iVideoDuration = $oModule->getMediaDuration($aFileInfo);
            $sVideoDuration = _t_format_duration($iVideoDuration);

            $sVideoUrl = $oStorage->getFileUrlById($aMediaInfo['file_id']);
            $aVideoFile = $oStorage->getFile($aMediaInfo['file_id']);

            $sVideoUrlHd = '';
            if(!empty($aVideoFile['dimensions']) && $aTranscodersVideo['mp4_hd']->isProcessHD($aVideoFile['dimensions']))
                $sVideoUrlHd = $aTranscodersVideo['mp4_hd']->getFileUrl($aMediaInfo['file_id']);

            $aTmplVarsVideo = $this->_bIsApi ? [
                //TODO: process Media's Video here.
            ] : [
                'title_attr' => $sMediaTitleAttr,
                'title' => $sMediaTitle,
                'url' => bx_append_url_params($sUrl, ['autoplay' => 1]),
                'url_img' => $isVideo ? $aTranscodersVideo['poster']->getFileUrl($aMediaInfo['file_id']) : '',
                'video' => $isVideo && $aTranscodersVideo ? BxTemplFunctions::getInstance()->videoPlayer(
                    $aTranscodersVideo['poster']->getFileUrl($aMediaInfo['file_id']), 
                    $aTranscodersVideo['mp4']->getFileUrl($aMediaInfo['file_id']), 
                    $sVideoUrlHd, $mixedAttrs, 'max-height:' . $CNF['OBJECT_VIDEO_TRANSCODER_HEIGHT']
                ) : '',
                'duration' => $sVideoDuration,
                'bx_if:show_duration' => [
                    'condition' => $iVideoDuration > 0,
                    'content' => [
                        'duration' => $sVideoDuration
                    ]
                ]
            ];
        }

        $aVars = $this->_bIsApi ? [
            'id' => $aMediaInfo['id'],
            'title' => $sMediaTitle,
            'text' => '',
            'image' => $aTmplVarsImage,
            'entry_title' => $sMediaTitle,
            'entry_text' => '',
        ] : [
            'bx_if:image' => [
                'condition' => $isImage,
                'content' => $aTmplVarsImage,
            ],
            'bx_if:video' => [
                'condition' => $isVideo,
                'content' => $aTmplVarsVideo,
            ],
            'title_attr' => $sMediaTitleAttr,
            'title' => $sMediaTitle,
            'url' => $sUrl,
        ];

        return $aVars;
    }

    public function getViewMediaUrl($CNF, $iMediaId, $sContext = '')
    {
        return $this->_oConfig->getMediaUrl($iMediaId, $sContext);
    }

    public function getNextPrevMedia($aMediaInfo, $isNext, $sContext, $aParamsSearchResult = array())
    {
        if (!$sContext) {
            $sContext = 'album';
            $aParamsSearchResult = array('album_id' => $aMediaInfo['content_id']);
        }

        $oModule = BxDolModule::getInstance($this->MODULE);
        $CNF = &$oModule->_oConfig->CNF;

        bx_import('SearchResultMedia', $oModule->_aModule);
        $sClass = $oModule->_aModule['class_prefix'] . 'SearchResultMedia';
        $o = new $sClass($sContext, $aParamsSearchResult);
        if ($o->isError)
            return false;

        $o->setUnitParams(array('context' => $sContext));

        $a = $o->getNextPrevItem($aMediaInfo, $isNext);
    
        if ($a) {

            $aVars = $this->mediaVars($a, $CNF['OBJECT_IMAGES_TRANSCODER_BIG'], $CNF['OBJECT_VIDEOS_TRANSCODERS']['poster'], array('context' => $sContext));
            $aMedia = $aVars['bx_if:image']['condition'] ? $aVars['bx_if:image']['content'] : $aVars['bx_if:video']['content'];

            $a['url'] = $aMedia['url'];
            $a['url_img'] = $aMedia['url_img'];
            $a['title_attr'] = $aMedia['title_attr'];
            $a['title_js_string'] = bx_js_string($aMedia['title']);
            $a['w'] = $aVars['bx_if:image']['condition'] ? $aVars['bx_if:image']['content']['w'] : 0;
            $a['h'] = $aVars['bx_if:image']['condition'] ? $aVars['bx_if:image']['content']['h'] : 0;
            $a['html'] = $aVars['bx_if:video']['condition'] ? '<div class="pswp__video">' . $aVars['bx_if:video']['content']['video'] . '</div>': 0;
        }

        return $a;
    }

    function mediaAuthor ($aMediaInfo, $iProfileId = false, $sFuncAuthorDesc = '', $sTemplateName = '') 
    {
        $CNF = &$this->_oConfig->CNF;
        $oModule = $this->getModule();

        $aAlbumInfo = $oModule->_oDb->getContentInfoById($aMediaInfo['content_id']);
        if(!$aAlbumInfo)
            return $this->_bIsApi ? [] : '';

        if($this->_bIsApi)
            return [bx_api_get_block('entity_author', [
                'author_data' => BxDolProfile::getData($iProfileId),
                'entry_date' => $aMediaInfo[$CNF['FIELD_ADDED']] ?? '',
                'entry_context' => '',
                'menu_manage' => $oModule->getEntryAllActions([$aMediaInfo['id'], $aMediaInfo], [
                    'object_menu' => $CNF['OBJECT_MENU_ACTIONS_VIEW_MEDIA_ALL']
                ])
            ])];

        return $this->entryAuthor($aMediaInfo, $aAlbumInfo[$CNF['FIELD_AUTHOR']]);
    }

    function getMediaTitle ($aMediaInfo)
    {
        $oModule = BxDolModule::getInstance($this->MODULE);
        $CNF = &$oModule->_oConfig->CNF;

        if(!empty($aMediaInfo['title'])) {
            $sText = bx_process_output($aMediaInfo['title']);
            if(!empty($CNF['OBJECT_METATAGS_MEDIA'])) {
                $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS_MEDIA']);
                if($oMetatags && $oMetatags->keywordsIsEnabled())
                    $sText = $oMetatags->keywordsParse($aMediaInfo['id'], $sText);
            }
        }
        else 
            $sText = _t('_bx_albums_txt_media_title_empty');

        return $sText;
    }
}

/** @} */
