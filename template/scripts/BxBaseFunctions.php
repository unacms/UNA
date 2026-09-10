<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxBaseFunctions extends BxDolFactory implements iBxDolSingleton
{
    protected $_oTemplate;

    protected $_sDesignBoxMenuTmplDefault;

    protected $_sDesignBoxMenuIcon;
    protected $_sDesignBoxMenuIconType;
    protected $_sDesignBoxMenuClick;

    protected function __construct($oTemplate)
    {
        parent::__construct();

        $this->_oTemplate = $oTemplate ? $oTemplate : BxDolTemplate::getInstance();

        $this->_sDesignBoxMenuTmplDefault = 'menu_block_submenu_ver.html';

        $this->_sDesignBoxMenuIcon = 'ellipsis-v';
        $this->_sDesignBoxMenuIconType = 'icon';
        $this->_sDesignBoxMenuClick = "bx_menu_popup_inline('#{design_box_menu}', this, " . json_encode(array(
            'moveToDocRoot' => false
        )) . ")";
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    public static function getInstanceWithTemplate($oTemplate)
    {
        $sClassName = 'BxTemplFunctions';
        if ($oTemplate){
            $sClassName .= get_class($oTemplate);
        }
        if(!isset($GLOBALS['bxDolClasses'][$sClassName]))
            $GLOBALS['bxDolClasses'][$sClassName] = new BxTemplFunctions($oTemplate);

        return $GLOBALS['bxDolClasses'][$sClassName];
    }
    
    public static function getInstance()
    {
        return self::getInstanceWithTemplate(null);
    }

    function TemplPageAddComponent($sKey)
    {
        $mixedResult = false; // if you have not such component, return false!

        switch($sKey) {
            case 'sys_header_width':
                $mixedResult = 'bx-def-page-width';
                break;

            case 'sys_toolbar_search':
                $oSearch = new BxTemplSearch();
                $oSearch->setLiveSearch(true);

                $mixedResult = $this->_oTemplate->parseHtmlByName('_page_toolbar_search.html', [
                    'sys_site_search' => $oSearch->getForm(BX_DB_PADDING_DEF, false, true) . $oSearch->getResultsContainer()
                ]);
                break;
        }

        return $mixedResult;
    }

    function msgBox($sText, $iTimer = 0, $sOnClose = "")
    {
        $iId = time() . mt_rand(1, 1000);

        if($iTimer > 0)
            BxDolTemplate::getInstance()->addJs(array('jquery.anim.js'));

        return $this->_oTemplate->parseHtmlByName('messageBox.html', array(
            'id' => $iId,
            'msgText' => $sText,
            'bx_if:timer' => array(
                'condition' => $iTimer > 0,
                'content' => array(
                    'id' => $iId,
                    'time' => 1000 * $iTimer,
                    'on_close' => $sOnClose,
                )
            )
        ));
    }

    /**
     * Get standard popup box with title.
     *
     * @param  string $sName    - unique name
     * @param  string $sTitle   - translated title
     * @param  string $sContent - content of the box
     * @return HTML   string
     */
    function popupBox($sName, $sTitle, $sContent, $isHiddenByDefault = false)
    {
        $iId = !empty($sName) ? $sName : time();

        return $this->_oTemplate->parseHtmlByName('popup_box.html', array(
            'id' => $iId,
            'wrapper_style' => $isHiddenByDefault ? 'display:none;' : '',
            'title' => $sTitle,
            'content' => $sContent
        ));
    }

    /**
     * Get popup box without title.
     *
     * @param  string $sName    - unique name
     * @param  string $sContent - content of the box
     * @return HTML   string
     */
    function transBox($sName, $sContent, $isHiddenByDefault = false, $isPlaceInCenter = false)
    {
    	return $this->simpleBox($sName, $sContent, $isHiddenByDefault, $isPlaceInCenter, 'popup_trans.html');
    }

    function slideBox($sName, $sContent, $isHiddenByDefault = false)
    {
    	return $this->simpleBox($sName, $sContent, $isHiddenByDefault, false, 'popup_slide.html');
    }

    function inlineBox($sName, $sContent, $isHiddenByDefault = false)
    {
        return $this->simpleBox($sName, $sContent, $isHiddenByDefault, false, 'popup_inline.html');
    }

    protected function simpleBox($sName, $sContent, $isHiddenByDefault, $isPlaceInCenter, $sTemplate) 
    {
    	$iId = !empty($sName) ? $sName : time();

        if(!is_array($sContent))
            $sContent = array('content' => $sContent);

        $sContent = $this->_oTemplate->parseHtmlByName($sTemplate, array_merge(array(
            'id' => $iId,
            'wrapper_class' => '',
            'wrapper_style' => $isHiddenByDefault ? 'display:none;' : '',
            'wrapper_role' => 'dialog',
            'wrapper_attrs' => '',
            'content' => ''
        ), $sContent));

        if($isPlaceInCenter)
            $sContent = '<div class="login_ajax_wrap">' . $sContent . '</div>';

        return $sContent;
    }

    function simpleBoxContent($sContent, $bWithIndent = true)
    {
        if(!$bWithIndent)
            return $sContent;

        return $this->_oTemplate->parseHtmlByName('popup_content_indent.html', array(
            'content' => $sContent
        ));
    }

    function getIcon($sCode, $aAttrs = array())
    {
        $sIconFont = false;
        $sIconA = false;
        $sIconUrl = false;
        $sIconHtml = false;
        $sIconFontWithHtml = false;

        $sClass = '';
        if(!empty($aAttrs['class'])) {
            $sClass = ' ' . $aAttrs['class'] .' ';
            unset($aAttrs['class']);
        }

        $sAttrs = '';
        foreach($aAttrs as $sKey => $sValue)
            $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

        if (!empty($sCode)) {
            if (is_numeric($sCode) && (int)$sCode > 0) {
                $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
                $sIconUrl = $oStorage ? $oStorage->getFileUrlById((int)$sCode) : false;
            } 
            else {

                if (strpos($sCode, '&lt;img') !== false || strpos($sCode, '<img') !== false) {
                    if(strpos($sCode, '&lt;img') !== false)
                        $sIconHtml = htmlspecialchars_decode($sCode);
                    else
                        $sIconHtml = $sCode;

                    //--- Process Inline SVG
                } else if (strpos($sCode, '&lt;svg') !== false || strpos($sCode, '<svg') !== false) {
                        if(strpos($sCode, '&lt;svg') !== false)
                            $sIconHtml = htmlspecialchars_decode($sCode);
                        else
                            $sIconHtml = $sCode;

                        $sClass .= 'sys-icon sys-icon-svg ';


                        $sIconHtmlClear = strip_tags($sIconHtml, '<svg>');
                        if ($sClass != '' && strpos($sIconHtmlClear, 'class="') !== false)
                            $sIconHtml = str_replace('class="', 'class="' . $sClass, $sIconHtml);
                        else
                            $sIconHtml = str_replace('<svg', '<svg class="' . $sClass . '" ', $sIconHtml);

                        if ($sAttrs != '')
                            $sIconHtml = str_replace('<svg', '<svg ' . $sAttrs . ' ', $sIconHtml);
                }
                else {
                    $sEmojIsRegex =
                        '/[\x{0080}-\x{02AF}'
                        .'\x{0300}-\x{03FF}'
                        .'\x{0600}-\x{06FF}'
                        .'\x{0C00}-\x{0C7F}'
                        .'\x{1DC0}-\x{1DFF}'
                        .'\x{1E00}-\x{1EFF}'
                        .'\x{2000}-\x{209F}'
                        .'\x{20D0}-\x{214F}'
                        .'\x{2190}-\x{23FF}'
                        .'\x{2460}-\x{25FF}'
                        .'\x{2600}-\x{27EF}'
                        .'\x{2900}-\x{29FF}'
                        .'\x{2B00}-\x{2BFF}'
                        .'\x{2C60}-\x{2C7F}'
                        .'\x{2E00}-\x{2E7F}'
                        .'\x{3000}-\x{303F}'
                        .'\x{A490}-\x{A4CF}'
                        .'\x{E000}-\x{F8FF}'
                        .'\x{FE00}-\x{FE0F}'
                        .'\x{FE30}-\x{FE4F}'
                        .'\x{1F000}-\x{1F02F}'
                        .'\x{1F0A0}-\x{1F0FF}'
                        .'\x{1F100}-\x{1F64F}'
                        .'\x{1F680}-\x{1F6FF}'
                        .'\x{1F910}-\x{1F96B}'
                        .'\x{1F980}-\x{1F9E0}]/u';

                    //--- Process Emoji
                    if(preg_match($sEmojIsRegex, $sCode, $aTmp))
                        $sIconHtml = $this->_oTemplate->parseHtmlByName('icon_emoji.html', array(
                            'icon' => $sCode, 
                            'class' => $sClass, 
                            'attrs' => $sAttrs
                        ));
                    else {
                        if (strpos($sCode, '.') === false) {
                            //--- Process animated icon
                            if (strncmp($sCode, 'a:', 2) === 0)
                                $sIconA = substr($sCode, 2);
                            //--- Process font icons
                            else {
                                $sIconFont = $sCode;
                                $sIconFontWithHtml = $this->getFontIconAsHtml($sIconFont, $sClass, $sAttrs);
                            }
                        } 
                        else {
                            //--- Process common image
                            if((!preg_match('/^https?:\/\//', $sCode)))
                                $sIconUrl = $this->_oTemplate->getIconUrl($sCode);
                            else
                                $sIconUrl = $sCode;
                        }
                    }
                }
            }
        }

        return array ($sIconFont, $sIconUrl, $sIconA, $sIconHtml, $sIconFontWithHtml);
    }

    function getFontIconAsHtml($sIconFont, $sClass = '', $sAttrs = '')
    {
        return  '<i class="sys-icon ' . $sIconFont .' ' . $sClass . '"' . $sAttrs . '></i>';
    }

    function getIconAsHtml($sCode, $aAttrs = array())
    {
        $aIcons = $this->getIcon($sCode, $aAttrs);
        return $aIcons[3] . $aIcons[4]; 
    }
    
    function getIconPreview($iId, $sIconImage = '', $sIcon = '')
    {
        $bIconImage = !empty($sIconImage);

        $aIcons = $this->getIcon($sIcon);
        $sIconHtml = $aIcons[2] . $aIcons[3] . $aIcons[4];
        $bIconHtml = !empty($sIconHtml) && !$bIconImage;

        return $this->_oTemplate->parseHtmlByName('item_icon_preview.html', [
            'id' => $iId,
            'bx_if:show_icon_empty' => [
                'condition' => !$bIconImage && !$bIconHtml,
                'content' => []
            ],
            'bx_if:show_icon_image' => [
                'condition' => $bIconImage,
                'content' => [
                    'url' => $sIconImage,
                    'id' => $iId
                ]
            ],
            'bx_if:show_icon_html' => [
                'condition' => $bIconHtml,
                'content' => [
                    'icon' => $sIconHtml
                ]
            ]
        ]);
    }

    function getTemplateIcon($sName)
    {
        $sUrl = $this->_oTemplate->getIconUrl($sName);
        return !empty($sUrl) ? $sUrl : $this->_oTemplate->getIconUrl('spacer.gif');
    }

    function getTemplateImage($sName)
    {
        $sUrl = $this->_oTemplate->getImageUrl($sName);
        return !empty($sUrl) ? $sUrl : $this->_oTemplate->getImageUrl('spacer.gif');
    }

    function sysIcon ($sIcon, $sName, $sUrl = '', $iWidth = 0)
    {
        return '<div class="sys_icon">' . ($sUrl ? '<a title="'.$sName.'" href="'.$sUrl.'">' : '') . '<img alt="'.$sName.'" src="'.$sIcon.'" '.($iWidth ? 'width='.$iWidth : '').' />' . ($sUrl ? '</a>' : '') . '</div>';
    }

    /**
     * functions for limiting maximal string length
     */
    function getStringWithLimitedLength($mixedString, $iWidth = 45, $isPopupOnOverflow = false, $bReturnString = true, $sPopupString = null)
    {
        if(is_array($mixedString))
            list($sStrPlane, $sStrOriginal) = $mixedString;
        else
            $sStrPlane = $sStrOriginal = $mixedString;

        if(empty($sStrPlane) || mb_strlen($sStrPlane, 'UTF-8') <= $iWidth)
            return $bReturnString ? $sStrPlane : [$sStrPlane];

        $sResult = '';
        $aWords = mb_split("[\s\r\n]", $sStrPlane);
        $iPosition = 0;
        $iWidthReal = $iWidth - 3;
        $iWidthMin = $iWidth - 15;
        foreach($aWords as $sWord) {
            $sWord = trim($sWord);
            $iWord = mb_strlen($sWord, 'UTF-8');
            if ($iPosition + $iWord > $iWidthReal)
                break;

            // add word and continue
            $sResult .= ' ' . $sWord;
            $iPosition += 1 + $iWord;
        }

        // last word is too long, cut it
        if(!$iPosition || $iPosition < $iWidthMin)
            $sResult .= ' ' . mb_substr($sWord, 0, $iWidthReal - $iPosition - $iWord, 'UTF-8');
        $sResult = trim($sResult);

        // add tripple dot
        if(!$isPopupOnOverflow) {
            $sResult .= '...';
            return $bReturnString ? $sResult : [$sResult];
        }

        // add button width popup
        $sId = 'bx-str-limit-' . rand(1, PHP_INT_MAX);
        $sTitle = bx_html_attribute(_t('_sys_str_limit_show'));
        $sPopup = '<button type="button" class="bx-str-limit pl-2" title="' . $sTitle . '" aria-label="' . $sTitle . '" onclick="$(\'#' . $sId . '\').dolPopup({pointer:{el:$(this), offset:\'10 1\'}})"><i class="sys-icon ellipsis-h"></i></button>';
        $sPopup .= BxTemplFunctions::getInstance()->transBox($sId, '<div class="bx-def-padding">' . ($sPopupString ?? $sStrOriginal) . '</div>', true);

        return $bReturnString ? $sResult . $sPopup : [$sResult, $sPopup];
    }

    /**
     * Display design box with specified title, template, content and menu.
     * @param $sTitle - design box title, please note that some templates don't use title.
     * @param $sContent - design box content.
     * @param $iTemplateNum - number of design box template, use predefined contants only, default is BX_DB_DEF.
     * @param $mixedMenu - design box menu, it can be:
     *      - object: instance of BxTemplMenu class
     *      - string: menu object identifier
     *      - array: array of menu links to create menu from
     * @param $mixedButtons - design box menu representation, it can be:
     *      - false: design box menu will be used as horizontal menu (tabs)
     *      - array: array of menu links to create menu from. If empty array is used and 'design box menu' isn't empty, then 'design box menu' will be added as one of menu items automatically. If non-empty array is used and 'design box menu' isn't empty then it should be added as one of menu items. Use array('menu' => 1) to define menu item for 'design box menu'.
     * @return string
     *
     * @see BX_DB_CONTENT_ONLY
     * @see BX_DB_DEF
     * @see BX_DB_EMPTY
     * @see BX_DB_NO_CAPTION
     * @see BX_DB_PADDING_CONTENT_ONLY
     * @see BX_DB_PADDING_DEF
     * @see BX_DB_PADDING_NO_CAPTION
     */
    function designBoxContent ($sTitle, $sContent, $iTemplateNum = BX_DB_DEF, $mixedMenu = false, $mixedButtons = [])
    {
        $bNoTitle = in_array($iTemplateNum, [BX_DB_CONTENT_ONLY, BX_DB_PADDING_CONTENT_ONLY, BX_DB_NO_CAPTION, BX_DB_PADDING_NO_CAPTION]);
        $sMenu = $this->designBoxMenu($mixedMenu, $mixedButtons);

        $aTmplVarsDbMenu = [];
        if($bNoTitle && $sMenu)
            $aTmplVarsDbMenu = [
                'caption_item' => $sMenu
            ];

        $sDescription = $sIcon = $sIconHtml = '';
        if(is_array($sTitle)) {
            list($sTitle, $sDescription, $sIcon) = $sTitle;

            if($sIcon) {
                list($sIcon, $sIconUrl, $sIconA, $sIconHtml) = $this->getIcon($sIcon);

                if($sIcon)
                    $sIcon = BxDolIconset::getObjectInstance()->getIcon($sIcon);
            }
        }

        return $this->_oTemplate->parseHtmlByName('designbox_' . (int)$iTemplateNum . '.html', array_merge([
                'bx_if:show_db_icon' => [
                    'condition' => !empty($sIcon),
                    'content' =>  [
                        'icon' => $sIcon,
                    ]
                ],
                'bx_if:show_db_icon_html' => [
                    'condition' => !empty($sIconHtml),
                    'content' =>  [
                        'icon_html' => $sIconHtml,
                    ]
                ],
                'title' => $sTitle,
                'bx_if:show_db_description' => [
                    'condition' => !empty($sDescription),
                    'content' =>  [
                        'description' => $sDescription,
                    ]
                ],
                'designbox_content' => $sContent,
            ], ($bNoTitle ? [
                'bx_if:show_db_menu' => [
                    'condition' => !empty($aTmplVarsDbMenu),
                    'content' => $aTmplVarsDbMenu
                ]
            ] : [
                'caption_item' => $sMenu
            ]))
        );
    }

    function designBoxMenu ($mixedMenu, $mixedButtons = [])
    {
        $bUseTabs = is_bool($mixedButtons) && $mixedButtons === true;

        $sClass = $sMenu = '';
        if(!empty($mixedMenu)) {
            if(is_string($mixedMenu)) {
                if(($oMenu = BxTemplMenu::getObjectInstance($mixedMenu)) !== false) {
                    $oMenu->setTemplateById($bUseTabs ? BX_DB_MENU_TEMPLATE_TABS : BX_DB_MENU_TEMPLATE_POPUP);

                    $sMenu = $oMenu->getCode();
                }
                else
                    $sMenu = $mixedMenu;
            } 
            else if(is_array($mixedMenu)) {
                if(isset($mixedMenu['template']) && isset($mixedMenu['menu_items']))
                    $aMenu = $mixedMenu;
                else
                    $aMenu = array('template' => $this->_sDesignBoxMenuTmplDefault, 'menu_items' => $mixedMenu);

                if(($oMenu = new BxTemplMenu($aMenu, $this->_oTemplate)) !== false) {
                    $oMenu->setTemplateById($bUseTabs ? BX_DB_MENU_TEMPLATE_TABS : BX_DB_MENU_TEMPLATE_POPUP);

                    $sMenu = $oMenu->getCode();
                }
                else
                    $sMenu = '';
            }
            else if(is_object($mixedMenu) && is_a($mixedMenu, 'BxTemplMenu')) {
                $mixedMenu->setTemplateById($bUseTabs ? BX_DB_MENU_TEMPLATE_TABS : BX_DB_MENU_TEMPLATE_POPUP);
                if(($mixedMenu instanceof BxBaseMenuMoreAuto) && $mixedMenu->isMoreAuto())
                    $sClass = ' bx-db-menu-tab-more-auto';

                $sMenu = $mixedMenu->getCode();
            }
        }
        $bMenu = !empty($sMenu);

        $sResult = '';
        if($bUseTabs && $bMenu)
            $sResult = $sMenu;
        else if(is_array($mixedButtons)) {
            $sPopup = '';

            if($bMenu) {
                $aButton = array();
                if(empty($mixedButtons))
                    list($aButton, $sPopup) = $this->_designBoxMenuButton($sMenu);
                //--- For backward compatibility
                else if(!empty($mixedButtons['menu']) && is_array($mixedButtons['menu'])) {
                    list($aButton, $sPopup) = $this->_designBoxMenuButton($sMenu, $mixedButtons['menu']);
                    unset($mixedButtons['menu']);
                }

                if(!empty($aButton))
                    $mixedButtons[] = $aButton;
            }

            foreach($mixedButtons as $aButton) {
                if($bMenu && isset($aButton['menu'])) {
                    if(is_numeric($aButton['menu']) && (int)$aButton['menu'] == 1)
                        list($aButton, $sPopup) = $this->_designBoxMenuButton($sMenu);
                    else if(is_array($aButton['menu']))
                        list($aButton, $sPopup) = $this->_designBoxMenuButton($sMenu, $aButton['menu']);

                    if(isset($aButton['menu']))
                        continue;
                }

                $aAttrs = [];
                if(!empty($aButton['href']))
                    $aAttrs['href'] = $aButton['href'];
                if(!empty($aButton['onclick'])) {
                    $aAttrs['href'] = "javascript:void(0);";
                    $aAttrs['onclick'] = $aButton['onclick'];
                }
                
                $aAttrs['class'] = 'bx-btn bx-btn-small';
                if(!empty($aButton['class']))
                    $aAttrs['class'] .= ' ' . trim($aButton['class']);

                $bTmplVarsButtonIcon = !empty($aButton['icon']);
                $aTmplVarsButtonIcon = !$bTmplVarsButtonIcon ? array() : array(
                    'icon' => $aButton['icon']
                );

                $bTmplVarsButtonIconA = !empty($aButton['icon-a']);
                $aTmplVarsButtonIconA = !$bTmplVarsButtonIconA ? array() : array(
                    'icon_a' => $aButton['icon-a']
                );

                $bTmplVarsButtonTitle = !empty($aButton['title']);
                $aTmplVarsButtonTitle = !$bTmplVarsButtonTitle ? array() : array(
                    'title' => $aButton['title']
                );

                $sResult .= $this->_oTemplate->parseHtmlByName('designbox_menu_button.html', array(
                    'attrs' => bx_convert_array2attrs($aAttrs),
                    'bx_if:show_icon' => array(
                        'condition' => $bTmplVarsButtonIcon,
                        'content' => $aTmplVarsButtonIcon
                    ),
                    'bx_if:show_icon_a' => array(
                        'condition' => $bTmplVarsButtonIconA,
                        'content' => $aTmplVarsButtonIconA
                    ),
                    'bx_if:show_title' => array(
                        'condition' => $bTmplVarsButtonTitle,
                        'content' => $aTmplVarsButtonTitle
                    )
                ));
            }

            $sResult .= $sPopup;
        }

        if(!empty($sResult))
            $sResult = $this->_oTemplate->parseHtmlByName('designbox_menu.html', array(
                'class' => $sClass,
                'content' => $sResult
            ));

        return $sResult;
    }

    protected function _designBoxMenuId ()
    {
        return 'bx-menu-db-' . time() . rand(0, PHP_INT_MAX);
    }

    protected function _designBoxMenuButton ($sMenu, $aParams = array())
    {
        $sId = $this->_designBoxMenuId();
        $aButton = array($this->_sDesignBoxMenuIconType => $this->_sDesignBoxMenuIcon, 'onclick' => $this->_sDesignBoxMenuClick);

        if(!empty($aParams)) {
            if(!empty($aParams['id']))
                $sId = $aParams['id'];

            $aButton = array_merge($aButton, $aParams);
        }

        $aButton['onclick'] = bx_replace_markers($aButton['onclick'], array(
            'design_box_menu' => $sId
        ));

        $sMenu = $this->_oTemplate->parseHtmlByName('designbox_menu_popup.html', array(
            'content' => $sMenu
        ));

        return array($aButton, $this->transBox($sId, $sMenu, true));
    }

    /**
     * Get logo URL.
     * @return string
     */
    function getMainLogoUrl()
    {
        return BxDolDesigns::getInstance()->getSiteLogoUrl();
    }

    /**
     * Get mark URL.
     * @return string
     */
    function getMainMarkUrl()
    {
        return BxDolDesigns::getInstance()->getSiteMarkUrl();
    }

    /**
     * Get logo HTML.
     * @return string
     */
    function getMainLogo($aParams = array())
    {
        $oDesigns = BxDolDesigns::getInstance();

        $sAlt = $oDesigns->getSiteLogoAlt();
        if(empty($sAlt))
            $sAlt = getParam('site_title');

        $aLogoImages = [];
        if(($mixedFileUrl = $this->getMainLogoUrl()) && !empty($mixedFileUrl)) {
            if(!is_array($mixedFileUrl))
                $mixedFileUrl = ['light' => $mixedFileUrl];

            foreach($mixedFileUrl as $sName => $sFileUrl) {
                $iLogoWidth = (int)$oDesigns->getSiteLogoWidth();
                $sWidth = $iLogoWidth > 0 ? 'width:' . round($iLogoWidth/16, 3) . 'rem;' : '';

                $iLogoHeight = (int)$oDesigns->getSiteLogoHeight();
                $sHeight = $iLogoHeight > 0 ? 'height:' . round($iLogoHeight/16, 3) . 'rem;' : '';

                $aLogoImages[] = [
                    'id' => 'bx-logo', 
                    'src' => $sFileUrl, 
                    'alt' => bx_html_attribute($sAlt, BX_ESCAPE_STR_QUOTE),
                    'style' => $sWidth . ' ' . $sHeight
                ];
            }
        }
        $bLogoImages = !empty($aLogoImages) && is_array($aLogoImages);

        $aAttrs = array(
            'class' => 'bx-def-font-contrasted',
            'href' => BX_DOL_URL_ROOT,
            'title' => bx_html_attribute($sAlt, BX_ESCAPE_STR_QUOTE)
        );
        if(!empty($aParams['attrs']) && is_array($aParams['attrs']))
            $aAttrs = array_merge($aAttrs, $aParams['attrs']);

        $sTmplName = 'logo_main.html';
        $aTmplVars = [
            'attrs' => bx_convert_array2attrs($aAttrs),
             'bx_if:show_title' => [
                'condition' => !$bLogoImages,
                'content' => [
                    'logo' => $sAlt,
                ]
            ],
            'bx_if:show_logo' => [
                'condition' => $bLogoImages,
                'content' => [
                    'bx_repeat:images' => $aLogoImages,
                ]
            ],
        ];

        bx_alert('system', 'get_logo', 0, 0, [
            'tmpl_name' => &$sTmplName,
            'tmpl_vars' => &$aTmplVars,

            'tmpl_name_ref' => &$sTmplName,
            'tmpl_vars_ref' => &$aTmplVars,
        ]);

        return $this->_oTemplate->parseHtmlByName($sTmplName, $aTmplVars);
    }

    /**
     * Get HTML code for manifests.
     * @return HTML string to insert into HEAD section
     */
    function getManifests()
    {
        return '<link rel="manifest" href="' . BX_DOL_URL_ROOT . 'manifest.json.php" crossorigin="use-credentials" />';
    }

    /**
     * Get HTML code for meta icons.
     * @return HTML string to insert into HEAD section
     */
    function getMetaIcons()
    {
        // favicon icon
        $sImageUrlFav = '';
        if(($iId = (int)getParam('sys_site_icon')) != 0)
            $sImageUrlFav = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_FILES)->getFileUrlById($iId);          

        // svg icon
        $sImageUrlSvg = '';
        if(($iId = (int)getParam('sys_site_icon_svg')) != 0)
            $sImageUrlSvg = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->getFileUrlById($iId);

        if(empty($sImageUrlFav) && empty($sImageUrlSvg))
            $sImageUrlFav = $sImageUrlSvg = $this->_oTemplate->getIconUrl('favicon.svg');

        // apple device icon
        $sImageUrlApl = '';
        if(($iId = (int)getParam('sys_site_icon_apple')) != 0)
            $sImageUrlApl = BxDolTranscoderImage::getObjectInstance(BX_DOL_TRANSCODER_OBJ_ICON_APPLE)->getFileUrl($iId);
        if(empty($sImageUrlApl))
            $sImageUrlApl = $this->_oTemplate->getIconUrl('apple-touch-icon.png');

/* 
 * TODO: 
 * 1. Remove commented code later if it won't be used.
 * 2. Remove 'sys_icon_favicon' and 'sys_icon_facebook' transcoders and related transcoder filters.
 * 
        // facebook icon
        $sImageUrlFcb = '';
        $oTranscoder = BxDolTranscoderImage::getObjectInstance(BX_DOL_TRANSCODER_OBJ_ICON_FACEBOOK);
        $sImageUrlFcb = $oTranscoder->getFileUrl($iId);
        if(empty($sImageUrlFcb))
            $sImageUrlFcb = $this->_oTemplate->getIconUrl('facebook-icon.png');
*/

        $sRet = '';
        if($sImageUrlFav)
            $sRet .= '<link rel="icon" href="' . $sImageUrlFav . '" sizes="any" />';
        if($sImageUrlSvg)
            $sRet .= '<link rel="icon" href="' . $sImageUrlSvg . '" type="image/svg+xml" />';
        $sRet .= '<link rel="apple-touch-icon" href="' . $sImageUrlApl . '" />';

/*
        $sRet .= '<link rel="image_src" sizes="100x100" href="' . $sImageUrlFcb . '" />';
*/

        return $sRet;
    }

    function getInjectionHead() 
    {
        return $this->getInjection('getInjHead');
    }

    function getInjectionHeader() 
    {
        return $this->getInjection('getInjHeader');
    }

    function getInjectionFooter() 
    {
        return $this->getInjection('getInjFooter');
    }

    public function getPopupAlert()
    {
        return $this->transBox('bx-popup-alert', $this->_oTemplate->parseHtmlByName('popup_trans_alert_cnt.html', array()), true);
    }

    public function getPopupConfirm()
    {
        return $this->transBox('bx-popup-confirm', $this->_oTemplate->parseHtmlByName('popup_trans_confirm_cnt.html', array()), true);
    }

    public function getPopupPrompt()
    {
        $sInputText = 'bx-popup-prompt-value';
        $aInputText = array(
            'type' => 'text',
            'name' => $sInputText,
            'attrs' => array(
                'id' => $sInputText,
                'aria-labelledby' => 'bx-popup-prompt-text',
            ),
            'value' => '',
            'caption' => ''
        );

        $oForm = new BxTemplFormView(array(), $this->_oTemplate);
        return $this->transBox('bx-popup-prompt', $this->_oTemplate->parseHtmlByName('popup_trans_prompt_cnt.html', array(
            'input' => $oForm->genRow($aInputText)
        )), true);
    }

    /**
     * Output time wrapped in <time> tag in HTML.
     * Then time is autoformatted using JS upon page load, this is aumatically converted to user's timezone and
     * updated in realtime in case of short periods of 'from now' time format.
     *
     * Short version of this function:
     * @see bx_time_js
     *
     * @param $iUnixTimestamp time as unixtimestamp
     * @param $sFormatIdentifier output format identifier
     *     @see BX_FORMAT_DATE
     *     @see BX_FORMAT_TIME
     *     @see BX_FORMAT_DATE_TIME
     * @param $bForceFormat force provided format and don't use "from now" time autoformat.
     */
    function timeForJs ($iUnixTimestamp, $sFormatIdentifier = BX_FORMAT_DATE, $bForceFormat = false)
    {
        $sDateUTC = bx_time_utc ($iUnixTimestamp);
        return $this->timeForJsFullDate ($sDateUTC, $sFormatIdentifier, $bForceFormat);
    }

    /**
     * Same as @see timeForJs but instead of unxtimestamp full date format is used (ex: 2005-08-15T15:52:01) as passec date param
     */ 
    function timeForJsFullDate ($sDateUTC, $sFormatIdentifier = BX_FORMAT_DATE, $bForceFormat = false, $bUTC = false)
    {
        return '<time datetime="' . $sDateUTC . '" data-bx-format="' . getParam($sFormatIdentifier) . '" data-bx-autoformat="' . ($bForceFormat ? 0 : getParam('sys_format_timeago')) . '" data-bx-utc="' . ($bUTC ? 1 : 0) . '">' . $sDateUTC . '</time>';
    }
    
    function statusOnOff ($mixed, $isMsg = false)
    {
        if ((is_bool($mixed) && !$mixed) || (is_string($mixed) && 'fail' == $mixed))
            return '<i class="sys-icon circle col-red2"></i> ' . ($isMsg ? _t('_sys_off') : '');
        elseif (is_string($mixed) && 'warn' == $mixed)
            return '<i class="sys-icon circle col-red3"></i> ' . ($isMsg ? _t('_sys_warn') : '');
        elseif (is_string($mixed) && 'undef' == $mixed)
            return '<i class="sys-icon circle col-gray"></i> ' . ($isMsg ? _t('_undefined') : '');
        else
            return '<i class="sys-icon circle col-green1"></i> ' . ($isMsg ? _t('_sys_on') : '');
    }

    /**
     * Ouputs HTML5 video player.
     * @param $sUrlPoster video poster image
     * @param $sUrlMP4 .mp4 video
     * @param $sUrlMP4Hd .mp4 video in better quality
     * @param $aAttrs custom attributes, defaults are: controls="" preload="none" autobuffer=""
     * @param $sStyles custom styles, defaults are: width:100%; height:auto;
     */
    function videoPlayer ($sUrlPoster, $sUrlMP4, $sUrlMP4Hd = '', $aAttrs = false, $sStyles = false, $bDynamicMode = false)
    {
        $oPlayer = BxDolPlayer::getObjectInstance();
        if(!$oPlayer)
            return '';

        if($sStyles === false)
            $sStyles = 'width:100%; height:auto;';

        return $oPlayer->getCodeVideo (BX_PLAYER_STANDARD, array(
            'poster' => $sUrlPoster,
            'mp4' => array('sd' => $sUrlMP4, 'hd' => $sUrlMP4Hd),
            'attrs' => $aAttrs,
            'styles' => $sStyles,
        ), $bDynamicMode);
    }

    protected function getInjection($sPrefix)
    {
        $sContent = '';

        $aMethods = get_class_methods($this);
        foreach($aMethods as $sMethod)
            if(preg_match("/^(" . $sPrefix . ")[A-Z].+$/", $sMethod))
                $sContent .= $this->$sMethod();

        return $sContent;
    }

    protected function getInjHeadLiveUpdates() 
    {
        $sContent = '';

        if(($oLiveUpdates = BxDolLiveUpdates::getInstance()) !== false)
            $sContent .= $oLiveUpdates->init();

        return $sContent;
    }

    protected function getInjHeaderPushNotifications() 
    {
        $sResult = '';

        if(($oPush = BxDolPush::getObjectInstance()) !== false)
            $sResult = $oPush->getCode('page_header');

        return $sResult;
    }

    protected function getInjHeaderPopupLoading() 
    {
        return $this->transBox('bx-popup-loading', $this->_oTemplate->parsePageByName('popup_loading.html', array()), true);  
    }
    
    protected function getInjFooterMenuLoading() 
    {
        return $this->_oTemplate->parsePageByName('menu_loading.html', array());  
    }

    protected function getInjFooterPopupMenus() 
    {
        $sContent = '';

        $oSearch = new BxTemplSearch();
        $oSearch->setLiveSearch(true);
        $sContent .= $this->_oTemplate->parsePageByName('search.html', array(
            'search_form' => $oSearch->getForm(BX_DB_CONTENT_ONLY),
            'results' => $oSearch->getResultsContainer(),
        ));

        $sContent .= $this->_oTemplate->getMenu ('sys_site');
        if(isLogged()) {
            $sContent .= $this->_oTemplate->getMenu ('sys_add_content');
            $sContent .= $this->_oTemplate->getMenu ('sys_account_popup');
        }

        return $sContent;
    }
    
    protected function getInjFooterPopupApps() 
    {
        if($this->_oTemplate->getPageType() != BX_PAGE_TYPE_APPLICATION) 
            return '';

        $oMenu = BxDolMenu::getObjectInstance('sys_homepage');
        if(!$oMenu) 
            return '';

        $this->_oTemplate->addJs(['popper.js']);
        return $this->_oTemplate->parsePageByName('menu_apps.html', [
            'name' => 'sys-menu-apps',
            'title' => _t('_apps'),
            'bx_repeat:menu_items' => $oMenu->getMenuItems(),
        ]);
    }

    protected function getInjFooterPopups() 
    {
        $sContent = '';

        $sContent .= $this->getPopupAlert();
        $sContent .= $this->getPopupConfirm();
        $sContent .= $this->getPopupPrompt();

        return $sContent;
    }

    protected function getInjFooterEmbed() 
    {    
        // Load embed files
        $oEmbed = BxDolEmbed::getObjectInstance(false);
        if ($oEmbed) 
            return $oEmbed->addJsCss() . $oEmbed->addProcessLinkMethod();

        return '';
    }
}

/** @} */
