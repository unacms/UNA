<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseText Base classes for text modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Module representation.
 */
class BxBaseModTextTemplate extends BxBaseModGeneralTemplate
{
    protected $_sUnitClassShowCase;
    
    function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);
        
        $this->_sUnitClassShowCase = 'bx-base-unit-showcase bx-base-text-unit-showcase bx-def-margin-sec-bottom';
    }

    public function addLocationBase()
    {
        parent::addLocationBase();

        $this->addLocation('mod_text', BX_DIRECTORY_PATH_MODULES . 'base' . DIRECTORY_SEPARATOR . 'text' . DIRECTORY_SEPARATOR, BX_DOL_URL_MODULES . 'base/text/');
    }

    public function getJsCode($sType, $aParams = array(), $bWrap = true)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $aParams = array_merge(array(
            'aHtmlIds' => $this->_oConfig->getHtmlIds(),
            'sEditorId' => isset($CNF['FIELD_TEXT_ID']) ? $CNF['FIELD_TEXT_ID'] : ''
        ), $aParams);

        return parent::getJsCode($sType, $aParams, $bWrap);
    }

    function unit ($aData, $isCheckPrivateContent = true, $sTemplateName = 'unit.html', $aParams = array())
    {
        if(!empty($aParams['template_name']))
            $sTemplateName = $aParams['template_name'];
        else 
            $aParams['template_name'] = $sTemplateName;

    	$sResult = $this->checkPrivacy ($aData, $isCheckPrivateContent, $this->getModule(), $sTemplateName);
    	if($sResult)
            return $sResult;            

        $aTemplateVars = $this->getUnit($aData, $aParams);

        /**
         * @hooks
         * @hookdef hook-bx_base_text-unit '{module_name}', 'unit' - hook to override content browsing unit
         * - $unit_name - module name
         * - $action - equals `unit`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `data` - [array] content info array as key&value pairs
         *      - `check_private_content` - [boolean] check if it's a provate content
         *      - `template` - [string] or [array] with template for content unit
         *      - `params` - [array] additional params array as key&value pairs
         *      - `tmpl_name` - [string] by ref, template name, can be overridden in hook processing
         *      - `tmpl_vars` - [array] by ref, template parsable variables as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-bx_base_text-unit
         */
        bx_alert($this->getModule()->getName(), 'unit', 0, 0, [
            'data' => $aData,
            'check_private_content' => $isCheckPrivateContent,
            'template' => $sTemplateName,
            'params' => $aParams,

            'tmpl_name' => &$sTemplateName,
            'tmpl_vars' => &$aTemplateVars,

            'tmpl_name_ref' => &$sTemplateName,
            'tmpl_vars_ref' => &$aTemplateVars,
        ]);

        return $this->parseHtmlByName($sTemplateName, $aTemplateVars);
    }

    function entryAttachments ($aData, $aParams = array())
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $aStoragesKeys = array('OBJECT_STORAGE_PHOTOS', 'OBJECT_STORAGE_VIDEOS', 'OBJECT_STORAGE_SOUNDS', 'OBJECT_STORAGE_FILES');

        $aStorages = array();
        foreach($aStoragesKeys as $sKey)
            if(!empty($CNF[$sKey]))
                $aStorages[] = $CNF[$sKey];

        if(!empty($aStorages))
            return $this->entryAttachmentsByStorage($aStorages, $aData, array_merge($aParams, array('filter_field' => '')));

        return parent::entryAttachments($aData, $aParams);
    }

    function entryAuthor ($aData, $iProfileId = false, $sFuncAuthorDesc = 'getAuthorDesc', $sTemplateName = 'author.html', $sFuncAuthorAddon = 'getAuthorAddon')
    {
        $oModule = $this->getModule();
        $CNF = &$oModule->_oConfig->CNF;

        if (!$iProfileId)
            $iProfileId = $aData[$CNF['FIELD_AUTHOR']];

        if($this->_bIsApi) {
            $sFldAdd = 'FIELD_ADDED';
            $sFldAvt = 'FIELD_ALLOW_VIEW_TO';

            return [
                bx_api_get_block('entity_author', [
                    'author_data' => BxDolProfile::getData($iProfileId),
                    'entry_date' => !empty($CNF[$sFldAdd]) && !empty($aData[$CNF[$sFldAdd]]) ? $aData[$CNF[$sFldAdd]] : '',
                    'entry_context' => !empty($CNF[$sFldAvt]) && (int)$aData[$CNF[$sFldAvt]] < 0 ? BxDolProfile::getData(abs((int)$aData[$CNF[$sFldAvt]])) : '',
                    'menu_manage' => $oModule->getEntryAllActions()
                ])
            ];
        }

        $oProfile = BxDolProfile::getInstanceMagic($iProfileId);
        $sName = $oProfile->getDisplayName();
        $sAddon = $sFuncAuthorAddon && is_a($oProfile, 'BxDolProfile') ? $this->$sFuncAuthorAddon($aData, $oProfile) : '';        

        return $this->parseHtmlByName($sTemplateName, [
            'author_url' => $oProfile->getUrl(),
            'author_thumb_url' => $oProfile->getThumb(),
            'author_unit' => $oProfile->getUnit(0, ['template' => 'unit_wo_info']),
            'author_title' => $sName,
            'author_title_attr' => bx_html_attribute($sName),
            'author_desc' => $sFuncAuthorDesc ? $this->$sFuncAuthorDesc($aData, $oProfile) : '',
            'author_profile_desc' => $this->getAuthorProfileDesc($aData, $oProfile),
            'bx_if:addon' => [
                'condition' => (bool)$sAddon,
                'content' => [
                    'content' => $sAddon,
                ],
            ],
        ]);
    }

    public function entryBreadcrumb($aContentInfo, $aTmplVarsItems = array())
    {
        if(!empty($aTmplVarsItems) && is_array($aTmplVarsItems))
            return parent::entryBreadcrumb($aContentInfo, $aTmplVarsItems);

    	$CNF = &$this->getModule()->_oConfig->CNF;

        $aTmplVarsItems = array();
        if(!empty($CNF['OBJECT_CATEGORY']) && !empty($CNF['FIELD_CATEGORY'])) {
            $oCategory = BxDolCategory::getObjectInstance($CNF['OBJECT_CATEGORY']);

            $aParams = [];
            if(isset($CNF['URL_CATEGORY']))
                $aParams['page'] = bx_append_url_params(BxDolPermalinks::getInstance()->permalink($CNF['URL_CATEGORY']), [
                    'category' => '{keyword}'
                ], true, ['{keyword}']);

            $aTmplVarsItems[] = array(
                'url' => $oCategory->getCategoryUrl($aContentInfo[$CNF['FIELD_CATEGORY']], $aParams),
                'title' => $oCategory->getCategoryTitle($aContentInfo[$CNF['FIELD_CATEGORY']])
            );
        }

    	$aTmplVarsItems[] = array(
            'url' => BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']]),
            'title' => bx_process_output($aContentInfo[$CNF['FIELD_TITLE']])
        );

    	return parent::entryBreadcrumb($aContentInfo, $aTmplVarsItems);
    }

    protected function _addCssJsPolls($bDynamic = false)
    {
        $sInclude = parent::_addCssJsPolls($bDynamic);
        $sInclude .= $this->addJs(['modules/base/text/js/|polls.js','polls.js'], $bDynamic);
        return $bDynamic ? $sInclude : '';
    }
    
    public function getAttachLinkForm($iContentId = 0)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('links');

        $aForm = $this->getModule()->getFormAttachLink($iContentId);

        return $this->parseHtmlByName('attach_link_form.html', array(
            'style_prefix' => $sStylePrefix,
            'js_object' => $sJsObject,
            'form_id' => $aForm['form_id'],
            'form' => $aForm['form'],
        ));
    }
    
    public function getAttachLinkField($iUserId, $iContentId = 0)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        if(!$iContentId)
            $aLinks = $this->_oDb->getUnusedLinks($iUserId);
        else
            $aLinks = $this->_oDb->getLinks($iContentId);

        $sLinks = '';
        foreach($aLinks as $aLink)
            $sLinks .= $this->getAttachLinkItem($iUserId, $aLink);

        return $this->parseHtmlByName('attach_link_form_field.html', array(
            'html_id' => $this->_oConfig->getHtmlIds('attach_link_form_field') . $iContentId,
            'style_prefix' => $sStylePrefix,
            'links' => $sLinks
        ));
    }

    public function getAttachLinkItem($iUserId, $mixedLink, $aParams = [])
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        return parent::getAttachLinkItem($iUserId, $mixedLink, array_merge($aParams ?? [], [
            'html_id_link_item' => $this->_oConfig->getHtmlIds('attach_link_item'),
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'js_object' => $this->_oConfig->getJsObject('links'),
            'transcoder' => $CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS']
        ]));
    }

    public function getAttachLinks($iContentId)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        
        $aLinks = $this->_oDb->getLinks($iContentId);
        if(empty($aLinks) || !is_array($aLinks))
            return array();

        $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS']);

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
    
    public function getTmplVarsText($aData)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $aVars = parent::getTmplVarsText($aData);

        $aImageParams = $this->_getHeaderImageParams();
        $mixedImage = $this->_getHeaderImage($aData);

        $sImage = '';
        if($mixedImage !== false) {
            if(!empty($mixedImage['object']))
                $o = BxDolStorage::getObjectInstance($mixedImage['object']);
            else if(!empty($mixedImage['transcoder']))
                $o = BxDolTranscoder::getObjectInstance($mixedImage['transcoder']);

            if($o)
                $sImage = $o->getFileUrlById($mixedImage['id']);
        }

        if($this->_bIsApi) {
            if($sImage)
                $aVars['image'] = bx_api_get_image($aImageParams['storage'], $mixedImage['id']);

            return $aVars;
        }

        $sAddClassPicture = "";
        $sAddCode = "";
        $oModule = $this->getModule();
        $bIsAllowEditPicture = CHECK_ACTION_RESULT_ALLOWED === $oModule->checkAllowedEdit($aData);

        if($aImageParams['field'] && $aImageParams['uploaders'] && $aImageParams['storage'] && $aImageParams['transcoder_cover']) {
            /**
             * @hooks
             * @hookdef hook-system-image_editor 'system', 'image_editor' - hook to override content header image editor
             * - $unit_name - equals `system`
             * - $action - equals `image_editor`
             * - $object_id - not used
             * - $sender_id - not used
             * - $extra_params - array of additional params with the following array keys:
             *      - `module` - [string] module name
             *      - `content_id` - [int] profile content id
             *      - `is_allow_edit` - [boolean] if edit action is allowed to current user
             *      - `image_type` - [string] image type equals to `header_image`
             *      - `image_url` - [string] image URL
             *      - `uploader` - [string] uploader name
             *      - `storage` - [string] storage name
             *      - `transcoder` - [string] transcoder name
             *      - `field` - [string] field name
             *      - `is_background` - [boolean] if image is used as background, always `false`
             *      - `add_class` - [string] by ref, class to add, can be overridden in hook processing
             *      - `add_code` - [array] by ref, code to add, can be overridden in hook processing
             * @hook @ref hook-system-image_editor
             */
            bx_alert('system', 'image_editor', 0, 0, [
                'module' => $oModule->getName(),
                'content_id' => $aData[$CNF['FIELD_ID']],
                'is_allow_edit' => $bIsAllowEditPicture,
                'image_type' => 'header_image',
                'image_url' => $sImage,
                'uploader' => $aImageParams['uploaders'] && is_array($aImageParams['uploaders']) ? $aImageParams['uploaders'][0] : '',
                'storage' => $aImageParams['storage'],
                'transcoder' => $aImageParams['transcoder_cover'],
                'field' => $aImageParams['field'],
                'is_background' => false,
                'add_class' => &$sAddClassPicture,
                'add_code' => &$sAddCode,
                'add_class_ref' => &$sAddClassPicture,
                'add_code_ref' => &$sAddCode,
            ]); 
        }

        $sImageTweak = '';
        $sUniqIdImage = genRndPwd (8, false);
        if ($bIsAllowEditPicture && empty($sAddCode) && $aImageParams['field_position']){
            $sImageTweak = $this->_prepareImage($aData, $sUniqIdImage, $aImageParams['uploaders'], $aImageParams['storage'], $aImageParams['field'], true);
        }

        
        $aVars['content_description_before'] = '';
        $aVars['content_description_after'] = '';
        $aVars['bx_if:show_image'] = array(
            'condition' => !empty($sImage),
            'content' => array(
                'entry_image' => $sImage,
                'image_settings' => $aImageParams['field_position'] ? $this->_getImageSettings($aImageParams['field'], $aData[$aImageParams['field_position']], 'page_cover') : '',
                'add_class' => $sAddClassPicture,
                'img_class' => $sAddClassPicture != '' ? 'bx-media-editable-src' : '',
                'additional_code' => $sAddCode,
                'image_tweak' => $sImageTweak,
                'unique_id' => $sUniqIdImage,
            )
        );

        $aTmplVarsLinks = [];
        if(isset($CNF['FIELD_LINK']) && ($aLinks = $this->getAttachLinks($aData[$CNF['FIELD_ID']])))
            $aTmplVarsLinks = $this->getTmplVarsAttachedLinks($aLinks);

        $aVars['bx_if:show_links'] = [
            'condition' => count($aTmplVarsLinks) > 0,
            'content' => [
                'style_prefix' => $sStylePrefix,
                'bx_repeat:links' => $aTmplVarsLinks
            ]
        ];

        if(!empty($CNF['OBJECT_REACTIONS']) && ($oReactions = BxDolVote::getObjectInstance($CNF['OBJECT_REACTIONS'], $aData[$CNF['FIELD_ID']])) !== false)
            $aVars['content_description_after'] .= $oReactions->getCounter([
                'show_counter' => true,
                'show_counter_empty' => false
            ]);
        
        $this->addCss(array('cover.css'));

        return $aVars;
    }

    function getAuthorDesc($aData, $oProfile)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $aItem = array(
            'bx_if:text' => array(
                'condition' => false,
                'content' => array(
                    'content' => ''
                )
            ),
            'bx_if:link' => array(
                'condition' => false,
                'content' => array(
                    'link' => '',
                    'content' => ''
                )
            )
        );

        $aTmplVarsItems = array();
        if(!empty($CNF['FIELD_ADDED']) && !empty($aData[$CNF['FIELD_ADDED']]))
            $aTmplVarsItems[] = array_merge($aItem, array('bx_if:text' => array(
                'condition' => true,
                'content' => array(
                    'content' => bx_time_js($aData[$CNF['FIELD_ADDED']], BX_FORMAT_DATE)
                )
            )));

        if(!empty($CNF['URI_AUTHOR_ENTRIES']))
            $aTmplVarsItems[] = array_merge($aItem, array('bx_if:link' => array(
                'condition' => true,
                'content' => array(
                    'link' => BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_AUTHOR_ENTRIES'] . '&profile_id=' . $oProfile->id()),
                    'content' => _t($CNF['T']['txt_all_entries_by'], $this->getModule()->serviceGetMenuAddonManageToolsProfileStats($oProfile->id()))
                )
            )));

        return $this->parseHtmlByName('author_desc.html', array(
            'bx_repeat:items' => $aTmplVarsItems
        ));
    }

    function getAuthorProfileDesc ($aData, $oProfile)
    {
        $aSnippetMeta = $this->getProfileSnippetMenu($aData);
        if(empty($aSnippetMeta) || !is_array($aSnippetMeta) || !isset($aSnippetMeta['meta']))
            return '';

        return $aSnippetMeta['meta'];
    }

    function getProfileSnippetMenu ($aData)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        if (!($oProfile = BxDolProfile::getInstance($aData[$CNF['FIELD_AUTHOR']])))
            return array();

        return bx_srv($oProfile->getModule(), 'get_snippet_menu_vars', array($oProfile->id()));
    }

    function getAuthorAddon ($aData, $oProfile)
    {
        return '';
    }

    protected function checkPrivacy ($aData, $isCheckPrivateContent, $oModule, $sTemplateName = '')
    {
        $CNF = &$this->_oConfig->CNF;

        if($isCheckPrivateContent && CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $oModule->checkAllowedView($aData)))
            return $this->parseHtmlByName($sTemplateName ? str_replace('.html', '_private.html', $sTemplateName) : 'unit_private.html', [
                'module_name' => _t($CNF['T']['txt_sample_single']),
                'module_icon' => $CNF['ICON'],
                'title' => _t('_sys_private_content'),
                'summary' => $sMsg,
                'ts' => $aData[$CNF['FIELD_ADDED']],
            ]);

        return '';
    }

    protected function getUnitThumbAndGallery ($aData)
    {
        $CNF = &BxDolModule::getInstance($this->MODULE)->_oConfig->CNF;

        $sPhotoThumb = '';
        $sPhotoGallery = '';
        if(!empty($CNF['FIELD_THUMB']) && !empty($aData[$CNF['FIELD_THUMB']])) {

            $oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW']);
            if ($oImagesTranscoder)
                $sPhotoThumb = $oImagesTranscoder->getFileUrl($aData[$CNF['FIELD_THUMB']]);

            $oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY']);
            if ($oImagesTranscoder)
                $sPhotoGallery = $oImagesTranscoder->getFileUrl($aData[$CNF['FIELD_THUMB']]);
            else
                $sPhotoGallery = $sPhotoThumb;
        }

        return array($sPhotoThumb, $sPhotoGallery);
    }

    protected function getUnit ($aData, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;
        $oModule = $this->getModule();

        // get thumb url
        list($sPhotoThumb, $sPhotoGallery) = $this->getUnitThumbAndGallery($aData);

        if ($sPhotoGallery == '' && isset($CNF['PARAM_USE_GALERY_AS_COVER']) && getParam($CNF['PARAM_USE_GALERY_AS_COVER']) == 'on'){
            if(!empty($CNF['OBJECT_STORAGE_PHOTOS'])){
                $sStorage = $CNF['OBJECT_STORAGE_PHOTOS'];
                $oStorage = BxDolStorage::getObjectInstance($sStorage); 
                list($oTranscoder, $oTranscoderView) = $this->getAttachmentsImagesTranscoders($sStorage);
                $aGhostFiles = $oStorage->getGhosts($oModule->serviceGetContentOwnerProfileId($aData[$CNF['FIELD_ID']]), $aData[$CNF['FIELD_ID']]);
                if(!empty($aGhostFiles) && is_array($aGhostFiles)) {
                    $aGhostFile = array_shift($aGhostFiles);

                    $sPhotoThumb = $oTranscoderView->getFileUrl($aGhostFile['id']);
                    $sPhotoGallery = $oTranscoder->getFileUrl($aGhostFile['id']);
                }
            }
        }

        $oProfile = BxDolProfile::getInstanceMagic($aData[$CNF['FIELD_AUTHOR']]);

        $sUrl = $this->getUnitLink($aData);
        $sTitle = $this->getUnitTitle($aData);
        $sText = $this->getUnitText($aData);
        $sSummary = $this->getUnitSummary($aData, $sTitle, $sText, $sUrl);
        $sSummaryPlain = isset($CNF['PARAM_CHARS_SUMMARY_PLAIN']) && $CNF['PARAM_CHARS_SUMMARY_PLAIN'] ? BxTemplFunctions::getInstance()->getStringWithLimitedLength(strip_tags($sSummary), (int)getParam($CNF['PARAM_CHARS_SUMMARY_PLAIN'])) : '';

        if(!empty($CNF['OBJECT_METATAGS'])) {
            $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
            $sText = $oMetatags->metaParse($aData[$CNF['FIELD_ID']], $sText);
        }

        $aTmplVarsMeta = [];
        if(!empty($CNF['OBJECT_MENU_SNIPPET_META'])) {
            $oMenuMeta = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_SNIPPET_META'], $this);
            if($oMenuMeta) {
                $oMenuMeta->setContentId($aData[$CNF['FIELD_ID']]);
                if(isset($aParams['context']))
                    $oMenuMeta->setContext($aParams['context']);

                $aTmplVarsMeta = [
                    'meta' => $oMenuMeta->getCode()
                ];
            }
        }

        $bBadgesSingle = isset($aParams['badges_single']) ? $aParams['badges_single'] : false;
        $bBadgesCompact = isset($aParams['badges_compact']) ? $aParams['badges_compact'] : false;

        $sCoverData = ($sKey = 'FIELD_THUMB_POSITION') && isset($CNF[$sKey], $aData[$CNF[$sKey]]) ? $aData[$CNF[$sKey]] : '';
        $sCoverSettings = ($sKey = 'FIELD_THUMB') && isset($CNF[$sKey]) ? $this->_getImageSettings($CNF[$sKey], $sCoverData, 'unit_cover') : '';

        $aTmplVars = array (
            'class' => $this->_getUnitClass($aData,(isset($aParams['template_name']) ? $aParams['template_name'] : '')),
            'html_id' => $this->_getUnitHtmlId($aData,(isset($aParams['template_name']) ? $aParams['template_name'] : '')),
            'id' => $aData[$CNF['FIELD_ID']],
            'content_url' => $sUrl,
            'content_url_attrs' => '',
            'bx_if:show_onclick' => [
                'condition' => false,
                'content' => [
                    'content_onclick' => ''
                ]
            ],
            'title' => $sTitle,
            'badges' => $oModule->serviceGetBadges($aData[$CNF['FIELD_ID']], $bBadgesSingle, $bBadgesCompact),
            'title_attr' => bx_html_attribute($sTitle),
            'summary' => $sSummary,
            'text' => $sText,
            'author' => $oProfile->getDisplayName(),
            'author_url' => $oProfile->getUrl(),
            'author_icon' => $oProfile->getIcon(),
            'author_thumb' => $oProfile->getThumb(),
            'author_avatar' => $oProfile->getAvatar(),
            'entry_posting_date' => bx_time_js($aData[$CNF['FIELD_ADDED']], BX_FORMAT_DATE),
            'module_name' => _t($CNF['T']['txt_sample_single']),
            'ts' => $aData[$CNF['FIELD_ADDED']],
            'bx_if:meta' => array(
                'condition' => !empty($aTmplVarsMeta),
                'content' => $aTmplVarsMeta
            ),
            'bx_if:thumb' => array (
                'condition' => $sPhotoThumb,
                'content' => array (
                    'title' => $sTitle,
                    'summary_attr' => bx_html_attribute($sSummaryPlain),
                    'content_url' => $sUrl,
                    'bx_if:show_thumb_onclick' => [
                        'condition' => false,
                        'content' => [
                            'content_onclick' => ''
                        ]
                    ],
                    'thumb_url' => $sPhotoThumb ? $sPhotoThumb : '',
                    'gallery_url' => $sPhotoGallery ? $sPhotoGallery : '',
                    'image_settings' => $sCoverSettings,
                    'strecher' => str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ', 40),
                ),
            ),
            'bx_if:no_thumb' => array (
                'condition' => !$sPhotoThumb,
                'content' => array (
                    'module_icon' => $CNF['ICON'],
                    'content_url' => $sUrl,
                    'bx_if:show_no_thumb_onclick' => [
                        'condition' => false,
                        'content' => [
                            'content_onclick' => ''
                        ]
                    ],
                    'summary_plain' => $sSummaryPlain,
                    'summary_attr' => bx_html_attribute($sSummaryPlain),
                    'strecher' => mb_strlen($sSummaryPlain) > 240 ? '' : str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ', round((240 - mb_strlen($sSummaryPlain)) / 6)),
                ),
            ),
            'unit_content_before' => '',
            'unit_content_after' => ''
        );

        if(isset($aParams['template_vars']) && is_array($aParams['template_vars']))
            $aTmplVars = array_merge($aTmplVars, $aParams['template_vars']);

        // generate html
        return $aTmplVars;
    }

    protected function getAttachmentsImagesTranscoders ($sStorage = '')
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $oTranscoder = null;
        $oTranscoderView = null;

        if(isset($CNF['OBJECT_STORAGE_PHOTOS']) && $CNF['OBJECT_STORAGE_PHOTOS'] == $sStorage) {
            if(!empty($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS']))
                $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS']);
            if(!empty($CNF['OBJECT_IMAGES_TRANSCODER_VIEW_PHOTOS']))
                $oTranscoderView = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_VIEW_PHOTOS']);
            else if(!empty($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY_PHOTOS']))
                $oTranscoderView = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY_PHOTOS']);
        }
        else if(isset($CNF['OBJECT_STORAGE_FILES']) && $CNF['OBJECT_STORAGE_FILES'] == $sStorage) {
            if(!empty($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW_FILES']))
                $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW_FILES']);
            if(!empty($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY_FILES']))
                $oTranscoderView = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY_FILES']);
        }
        else
            list($oTranscoder, $oTranscoderView) = parent::getAttachmentsImagesTranscoders($sStorage);

        return array($oTranscoder, $oTranscoderView);
    }

    protected function _getUnitName($aData, $sTemplateName = 'unit.html')
    {
        return trim(str_replace('.html', '', $sTemplateName));
    }

    protected function _getUnitClass($aData, $sTemplateName = 'unit.html')
    {
        $sResult = '';

        switch($sTemplateName) {
            case 'unit_showcase.html':
                $sResult = $this->_sUnitClassShowCase;
                break;
        }

        return $sResult;
    }

    protected function _getUnitHtmlId($aData, $sTemplateName = 'unit.html')
    {
        $CNF = &$this->_oConfig->CNF;

        return str_replace('_', '-', $this->MODULE . '_unit_' . $aData[$CNF['FIELD_ID']]);
    }

    protected function _getHeaderImageParams()
    {
        $CNF = &$this->_oConfig->CNF;

        return [
            'field' => isset($CNF['FIELD_THUMB']) ? $CNF['FIELD_THUMB'] : false,
            'field_position' => isset($CNF['FIELD_THUMB_POSITION']) ? $CNF['FIELD_THUMB_POSITION'] : false,
            'storage' => isset($CNF['OBJECT_STORAGE']) ? $CNF['OBJECT_STORAGE'] : false,
            'uploaders' => isset($CNF['OBJECT_UPLOADERS']) ? $CNF['OBJECT_UPLOADERS'] : false,
            'transcoder_cover' => isset($CNF['OBJECT_IMAGES_TRANSCODER_COVER']) ? $CNF['OBJECT_IMAGES_TRANSCODER_COVER'] : false,
        ];
    }

    protected function _getHeaderImage($aData)
    {
        return $this->getModule()->getEntryImageData($aData);
    }
    
    function mediaExif ($aMediaInfo, $iProfileId = false, $sFuncAuthorDesc = '', $sTemplateName = 'media-exif.html') 
    {
        if (empty($aMediaInfo['exif']))
            return '';

        $a = unserialize($aMediaInfo['exif']);

        $s = '';
        if (!empty($a['Make'])) {
            $oModule = BxDolModule::getInstance($this->MODULE);
            $CNF = &$oModule->_oConfig->CNF;
          
            $sCamera = BxDolMetatags::keywordsCameraModel($a);
            if (!empty($CNF['OBJECT_METATAGS_MEDIA_CAMERA'])) {
                $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS_MEDIA_CAMERA']);
                if ($oMetatags->keywordsIsEnabled()) {
                    $sCamera = $oMetatags->keywordsParseOne($aMediaInfo['id'], $sCamera);
                }
            }

            if (!empty($sCamera))
                $s .= $this->parseHtmlByName('media-exif-value.html', array(
                    'key' => _t($CNF['T']['txt_media_exif_camera']), 
                    'val' => $sCamera,
                ));
        }
        
        if (!empty($a['FocalLength']))
            $s .= $this->parseHtmlByName('media-exif-value.html', array(
                'key' => _t($CNF['T']['txt_media_exif_focal_length']),
                'val' => _t($CNF['T']['txt_media_exif_focal_length_value'], $a['FocalLength']),
            ));

        if (!empty($a['COMPUTED']['ApertureFNumber']))
            $s .= $this->parseHtmlByName('media-exif-value.html', array(
                'key' => _t($CNF['T']['txt_media_exif_aperture']),
                'val' => $a['COMPUTED']['ApertureFNumber'],
            ));

        if (!empty($a['ExposureTime']))
            $s .= $this->parseHtmlByName('media-exif-value.html', array(
                'key' => _t($CNF['T']['txt_media_exif_shutter_speed']),
                'val' => _t($CNF['T']['txt_media_exif_shutter_speed_value'], $a['ExposureTime']),
            ));

        if (!empty($a['ISOSpeedRatings']))
            $s .= $this->parseHtmlByName('media-exif-value.html', array(
                'key' => _t($CNF['T']['txt_media_exif_iso']),
                'val' => $a['ISOSpeedRatings'],
            ));

        if (empty($s))
            return '';
        
        return $this->parseHtmlByName($sTemplateName, array('content' => $s));
    }
}

/** @} */
