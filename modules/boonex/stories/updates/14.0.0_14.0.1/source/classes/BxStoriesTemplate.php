<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module representation.
 */
class BxStoriesTemplate extends BxBaseModTextTemplate
{
    /**
     * Constructor
     */
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_stories';

        parent::__construct($oConfig, $oDb);

        $this->addCss([BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flickity/|flickity.css', 'main.css']);
        $this->addJs(['flickity/flickity.pkgd.min.js', 'main.js']);
    }

    public function getJsCode($sType, $aParams = [], $bWrap = true)
    {
        $aParams = array_merge([
            'aHtmlIds' => $this->_oConfig->getHtmlIds(),
            'iDuration' => $this->_oConfig->getDuration()
        ], $aParams);

        return parent::getJsCode($sType, $aParams, $bWrap);
    }

    public function unit($aData, $isCheckPrivateContent = true, $sTemplateName = 'unit.html', $aParams = [])
    {
        if(in_array($sTemplateName, ['unit_media.html', 'unit_media_gallery.html', 'unit_media_live_search.html']))
            return $this->unitMedia($aData, $isCheckPrivateContent, $sTemplateName, $aParams);

        if(!empty($aParams['template_name']))
            $sTemplateName = $aParams['template_name'];
        else 
            $aParams['template_name'] = $sTemplateName;

        $oModule = BxDolModule::getInstance($this->MODULE);
        if($s = $this->checkPrivacy ($aData, $isCheckPrivateContent, $oModule))
            return $s;

        $CNF = &$this->_oConfig->CNF;
        $sJsObject = $this->_oConfig->getJsObject('main');

        $iId = (int)$aData[$CNF['FIELD_ID']];

        // get entry url        
        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iId));

        $oProfile = BxDolProfile::getInstance($aData[$CNF['FIELD_AUTHOR']]);
        if (!$oProfile) 
            $oProfile = BxDolProfileUndefined::getInstance();

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_TRANSCODER_BROWSE']);
        $oTranscoderPoster = $CNF['OBJECT_VIDEOS_TRANSCODERS'] ? BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['poster']) : false;

        $aBrowseUnits = array ();
        $aMediaList = $oModule->_oDb->getMediaListByContentId($iId, getParam($CNF['PARAM_CARD_MEDIA_NUM']));
        foreach ($aMediaList as $k => $a) {
            $aFileInfo = $oStorage->getFile($a['file_id']);

            $bVideo = $oTranscoderPoster && strncmp('video/', $aFileInfo['mime_type'], 6) === 0 && $oTranscoderPoster->isMimeTypeSupported($aFileInfo['mime_type']);            
            $iVideoDuration = $bVideo ? $oModule->getMediaDuration($aFileInfo) : 0;

            $aBrowseUnits[] = array (
                'img_url' => $oTranscoder->getFileUrl($a['file_id']),
                'url' => $sUrl,
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

        $aTmplVarsMeta = [];
        if(!empty($CNF['OBJECT_MENU_SNIPPET_META']) && ($oMenuMeta = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_SNIPPET_META'], $this)) !== false) {
            $oMenuMeta->setContentId($iId);
            $aTmplVarsMeta = [
                'meta' => $oMenuMeta->getCode()
            ];
        }

        $aVars = [
            'class' => $this->_getUnitClass($aData,(isset($aParams['template_name']) ? $aParams['template_name'] : '')),
            'html_id' => $this->_getUnitHtmlId($aData,(isset($aParams['template_name']) ? $aParams['template_name'] : '')),
            'id' => $iId,
            'content_url' => $sUrl,
            'title' => bx_process_output($aData[$CNF['FIELD_TITLE']]),
            'summary' => $sSummary,
            'author' => $oProfile->getDisplayName(),
            'author_url' => $oProfile->getUrl(),
            'author_icon' => $oProfile->getUnit(0, ['template' => 'unit_wo_info']),
            'entry_posting_date' => bx_time_js($aData[$CNF['FIELD_ADDED']], BX_FORMAT_DATE),
            'module_name' => _t($CNF['T']['txt_sample_single']),
            'ts' => $aData[$CNF['FIELD_ADDED']],
            'bx_if:meta' => [
                'condition' => !empty($aTmplVarsMeta),
                'content' => $aTmplVarsMeta
            ],
            'bx_repeat:browse' => $aBrowseUnits,
            'bx_if:thumb' => [
                'condition' => $aBrowseUnits,
                'content' => [
                    'title' => bx_process_output($aData[$CNF['FIELD_TITLE']]),
                    'summary_attr' => bx_html_attribute($sSummaryPlain),
                    'content_url' => $sUrl,
                    'bx_if:show_thumb_onclick' => [
                        'condition' => true,
                        'content' => [
                            'content_onclick' => 'return ' . $sJsObject . '.play(this, ' . $iId . ');',
                        ]
                    ],
                    'thumb_url' => $aBrowseUnits ? $aBrowseUnits[0]['img_url'] : '',
                    'gallery_url' => $aBrowseUnits ? $aBrowseUnits[0]['img_url'] : '',
                    'image_settings' => '',
                ],
            ],
            'bx_if:no_thumb' => [
                'condition' => !$aBrowseUnits,
                'content' => [
                    'content_url' => $sUrl,
                    'summary_plain' => '',
                    'strecher' => '',
                ],
            ],
        ];

        return $this->parseHtmlByName($sTemplateName, $aVars);
    }

    function unitMedia ($aData, $isCheckPrivateContent = true, $sTemplateName = 'unit.html', $aParams = array())
    {
        $oModule = BxDolModule::getInstance($this->MODULE);
        $CNF = &$oModule->_oConfig->CNF;

        if(!($aMediaInfo = $oModule->_oDb->getMediaInfoById($aData['id'])))
            return '';

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if(!($aFile = $oStorage->getFile($aMediaInfo['file_id'])))
            return '';

        $aTmplVars = $this->mediaVars($aMediaInfo, $CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'], $CNF['OBJECT_VIDEOS_TRANSCODERS']['poster_preview'], $aParams);

        return $this->parseHtmlByName($sTemplateName, array_merge($aTmplVars, [
            'class' => $this->_getUnitClass($aData, $sTemplateName),
            'module_name' => _t($CNF['T']['txt_media_single']),
            'content_url' => $aTmplVars['url'],
            'ts' => $aFile['added'],
            'actions' => $oModule->serviceMediaAllActions([$aData['id'], $aMediaInfo]),
        ]));
    }

    public function entryText ($aData, $sTemplateName = 'entry-text.html')
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $aVars = $this->getTmplVarsText($aData);
        if(empty($aVars[$CNF['FIELD_TITLE']]) && empty($aVars[$CNF['FIELD_TEXT']]))
            return false;

        return $this->parseHtmlByName($sTemplateName, $aVars);
    }

    public function entryAttachments ($aData, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getModule()->_serviceBrowse ('story', ['unit_view' => 'gallery', 'story_id' => $aData[$CNF['FIELD_ID']], 'author' => $aData[$CNF['FIELD_AUTHOR']]], BX_DB_PADDING_DEF, true, true, 'SearchResultMedia');
    }
    
    public function entryPlay($aData)
    {
        $CNF = &$this->_oConfig->CNF;
        $oModule = BxDolModule::getInstance($this->MODULE);

        $iId = (int)$aData[$CNF['FIELD_ID']];
        $aMediaList = $oModule->_oDb->getMediaListByContentId($iId);

        $aTmplsVarsMedia = [];
        foreach($aMediaList as $aMedia) {
            $aMediaVars = $this->mediaVars($aMedia, $CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'], $CNF['OBJECT_VIDEOS_TRANSCODERS']['poster_preview'], ['muted' => true]);
            if(!$aMediaVars)
                continue;

            $aTmplsVarsMedia[] = array_merge($aMediaVars, [
                'bx_if:title' => [
                    'condition' => !empty($aMedia['title']),
                    'content' => [
                        'title' => $aMedia['title']
                    ]
                ]
            ]);
        }

        return BxTemplStudioFunctions::getInstance()->transBox($this->_oConfig->getHtmlIds('play_popup'), $this->parseHtmlByName('play.html', [
            'width' => floor(100/count($aMediaList)),
            'bx_repeat:media' => $aTmplsVarsMedia
        ]));
    }

    protected function mediaVars ($aMediaInfo, $sImageTranscoder = false, $sVideoPosterTranscoder = false, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aMediaInfo[$CNF['FIELD_MEDIA_CONTENT_ID']]));

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        $oTranscoder = BxDolTranscoderImage::getObjectInstance($sImageTranscoder);
        $aTranscodersVideo = false;

        if ($CNF['OBJECT_VIDEOS_TRANSCODERS'])
            $aTranscodersVideo = array (
                'poster' => BxDolTranscoderImage::getObjectInstance($sVideoPosterTranscoder),
                'mp4' => BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4']),
                'mp4_hd' => BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4_hd']),
            );
        
        $aFileInfo = $oStorage->getFile ($aMediaInfo['file_id']);
        if(!$aFileInfo)
            return false;

        $isImage = 0 === strncmp('image/', $aFileInfo['mime_type'], 6) && $oTranscoder->isMimeTypeSupported($aFileInfo['mime_type']); // preview for images, transcoder object for preview must be defined
        $isVideo = $aTranscodersVideo && (0 === strncmp('video/', $aFileInfo['mime_type'], 6)) && $aTranscodersVideo['poster']->isMimeTypeSupported($aFileInfo['mime_type']); // preview for videos, transcoder object for video must be defined

        $sMediaTitle = $this->getMediaTitle($aMediaInfo);
        $sMediaTitleAttr = bx_html_attribute($sMediaTitle);
        $mixedContext = isset($aParams['context']) ? $aParams['context'] : '';

        $aTmplVarsImage = array();
        if($isImage) {
            $aSize = $aMediaInfo['data'] ? explode('x', $aMediaInfo['data']) : array(0, 0);

            $aTmplVarsImage = array (
                'title_attr' => $sMediaTitleAttr,
                'title' => $sMediaTitle,
                'url' => $sUrl,
                'url_img' => $oTranscoder ? $oTranscoder->getFileUrl($aFileInfo['id']) : $oStorage->getFileUrlById($aFileInfo['id']),
                'media_id' => $aMediaInfo['id'],
                'w' => $aSize[0],
                'h' => $aSize[1],
                'context' => $mixedContext,
            );
        }

        $oModule = BxDolModule::getInstance($this->MODULE);

        $aTmplVarsVideo = array();
        if($isVideo) {
            $mixedAttrs = [];
            if(!empty($aParams['autoplay']))
                $mixedAttrs['autoplay'] = 'autoplay';
            if(!empty($aParams['muted']))
                $mixedAttrs['muted'] = 'muted';

            $iVideoDuration = $oModule->getMediaDuration($aFileInfo);
            $sVideoDuration = _t_format_duration($iVideoDuration);

            $sVideoUrl = $oStorage->getFileUrlById($aMediaInfo['file_id']);
            $aVideoFile = $oStorage->getFile($aMediaInfo['file_id']);

            $sVideoUrlHd = '';
            if (!empty($aVideoFile['dimensions']) && $aTranscodersVideo['mp4_hd']->isProcessHD($aVideoFile['dimensions']))
                $sVideoUrlHd = $aTranscodersVideo['mp4_hd']->getFileUrl($aMediaInfo['file_id']);

            $aTmplVarsVideo = array (
                'title_attr' => $sMediaTitleAttr,
                'title' => $sMediaTitle,
                'url' => bx_append_url_params($sUrl, array('autoplay' => 1)),
                'url_img' => $isVideo ? $aTranscodersVideo['poster']->getFileUrl($aMediaInfo['file_id']) : '',
                'video' => $isVideo && $aTranscodersVideo ? BxTemplFunctions::getInstance()->videoPlayer(
                    $aTranscodersVideo['poster']->getFileUrl($aMediaInfo['file_id']), 
                    $aTranscodersVideo['mp4']->getFileUrl($aMediaInfo['file_id']), 
                    $sVideoUrlHd, $mixedAttrs, 'max-height:' . $CNF['OBJECT_VIDEO_TRANSCODER_HEIGHT']
                ) : '',
                'duration' => $sVideoDuration,
                'bx_if:show_duration' => array(
                    'condition' => $iVideoDuration > 0,
                    'content' => array(
                        'duration' => $sVideoDuration
                    )
                )
            );
        }

        return array(
            'bx_if:image' => array (
                'condition' => $isImage,
                'content' => $aTmplVarsImage,
            ),
            'bx_if:video' => array (
                'condition' => $isVideo,
                'content' => $aTmplVarsVideo,
            ),
            'title_attr' => $sMediaTitleAttr,
            'title' => $sMediaTitle,
            'url' => $sUrl,
        );
    }

    function getMediaTitle ($aMediaInfo)
    {
        return !empty($aMediaInfo['title']) ? bx_process_output($aMediaInfo['title']) : _t('_bx_stories_txt_media_title_empty');
    }
}

/** @} */
