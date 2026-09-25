<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Meta-tags for different content. It can handle \#keywords, \@mentions, locations and meta image for the content.
 *
 * Keywords are parsed after content add and edit and added to the database, 
 * later when content is displayed \#keywords are highlighted as links to the search page with all content with this keyword, 
 * also keywords are displayed as meta info in page header.
 * 
 * Location info upon content adding/editing is displayed as custom field, it detects current user location and attach location as hidden form fields.
 * When content is displayed location can be shown as clickable links to search page where results are other items from same location,
 * also location is displayed as meta info in page header as latutude and longitude.
 * 
 * Content image can be added as meta info using this class as well.
 *
 *
 *
 * @section metatags_create Add new meta-tags object.
 *
 * To add new meta-tags object insert new record into `sys_objects_metatags` table:
 * - object: name of the meta-tags object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing
 * - table_keywords: table name to store keywords, leave empty to disable keywords
 * - table_locations: table name to store locations, leave empty to disable locations
 * - table_mentions: table name to store mentions, leave empty to disable mentions
 * - override_class_name: class name to override  
 * - override_class_file: class file path to override
 *
 * To simplify operations with metatags in modules which are derived from some 'base' modules, specify it in module config class in 'CNF' array: 
 * - FIELDS_WITH_KEYWORDS: array or comma separated list of field names with keywords support, or 'auto' to automatically use all 'textarea' fields
 * - OBJECT_METATAGS: metatags object name
 *
 *
 *
 * @section metatags_locations Location
 *
 * Upon content 'add' and 'edit' form submit, call BxDolMetatags::locationsAddFromForm
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $oMetatags->locationsAddFromForm($iContentId);
 * @endcode
 *
 * Upon 'edit' form display call BxDolMetatags::locationGet to fill-in location form input, for example:
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $aSpecificValues = $oMetatags->locationGet($iContentId);
 *   $oForm->initChecker($aContentInfo, $aSpecificValues);
 * @endcode
 *
 * To display location call BxDolMetatags::locationsString:
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   echo $oMetatags->locationsString($iContentId)
 * @endcode
 *
 * Upon page display call BxDolMetatags::addPageMetaInfo to add location (and all other, including content image) meta information to the page header:
 * @code
 *   $o = BxDolMetatags::getObjectInstance('object_name');
 *   $o->addPageMetaInfo($iContentId, array('id' => $iFileId, 'object' => 'storage_object_name'));
 * @endcode
 * 
 * Form object must have location field, usual name for this field is 'location' (this name is used as $sPrefix in some functions), type is 'custom', 
 * also form object must be derived from BxBaseModGeneralFormEntry class, which has custom field declaration.
 *
 *
 *
 * @section metatags_keywords \#keyword
 *
 * Upon content 'add' and 'edit' form submit, call BxDolMetatags::keywordsAdd
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $oMetatags->keywordsAdd($iContentId, $aContentInfo['text_field_with_hash_tags']);
 * @endcode
 *
 * Before displaying the text with hashtags call BxDolMetatags::keywordsParse to highlight keywords:
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $sText = $oMetatags->keywordsParse($iContentId, $sText);
 * @endcode
 *
 * Upon page display call BxDolMetatags::addPageMetaInfo to add keywords (and all other, including content image) meta information to the page header.
 *
 * To be able to search by tags metatgs object must be specified in *SearchResult class as 'object_metatags' in 'aCurrent' array.
 *
 *
 *
 * @section metatags_mention \@mention
 * 
 * Upon content 'add' and 'edit' form submit, call BxDolMetatags::mentionsAdd
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $oMetatags->mentionsAdd($iContentId, $aContentInfo['text_field_with_mentions']);
 * @endcode
 *
 * Before displaying the text with mentions call BxDolMetatags::mentionsParse:
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $sText = $oMetatags->mentionsParse($iContentId, $sText);
 * @endcode
 *
 * Upon page display call BxDolMetatags::addPageMetaInfo to add all available meta info to the page meta into where possible, however it doesn't adding anyting for mentions for now.
 *
 * To be able to search by mentions object must be specified in *SearchResult class as 'object_metatags' in 'aCurrent' array.
 *
 *
 *
 * @section metatags_auto Add \@mention, \#keyword using one call
 * 
 * Upon content 'add' and 'edit' form submit, call BxDolMetatags::metaAdd
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $oMetatags->metaAdd($iContentId, $aContentInfo['text_field']);
 * @endcode
 * or call BxDolMetatags::metaAddAuto, it autodetects fields with metainfo:
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $oMetatags->metaAddAuto($iContentId, $aContentInfo, $CNF, $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD']);
 * @endcode
 *
 * Before displaying the text with different metainfo call BxDolMetatags::metaParse:
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $sText = $oMetatags->metaParse($iContentId, $sText);
 * @endcode
 *
 * Upon page display call BxDolMetatags::addPageMetaInfo to add all available meta info to the page meta into where possible.
 *
 *
 * 
 * @section metatags_delete_content Content deletion
 * 
 * When content is deleted associated meta data can be deleted by calling BxDolMetatags::onDeleteContent:
 * @code
 *   $oMetatags = BxDolMetatags::getObjectInstance('object_name');
 *   $oMetatags->onDeleteContent($iContentId);
 * @endcode
 *
 */
class BxDolMetatags extends BxDolFactory implements iBxDolFactoryObject
{
    protected static $_aLocationKeys = ['lat', 'lng', 'country', 'state', 'city', 'zip', 'street', 'street_number'];
    protected static $_sKeywordPattern = '/[\pCc\pZ\p{Ps}\p{Pe}\p{Pi}\p{Pf}]\#(\pL[\pL\pN_]+)/u';
            
    protected $_sObject;
    protected $_aObject;
    protected $_oQuery;
    protected $_aMetas = [];

    /**
     * Constructor
     * @param $aObject array of metags object options
     */
    protected function __construct($aObject)
    {
        parent::__construct();

        $this->_sObject = $aObject['object'];
        $this->_aObject = $aObject;
        
        $a = array ('keywords', 'locations', 'mentions', 'pictures');
        foreach ($a as $sMeta) {
            if (empty($this->_aObject['table_' . $sMeta]))
                continue;
            $this->_aMetas[] = $sMeta;
        }

        $this->_oQuery = new BxDolMetatagsQuery($this->_aObject);
    }

    /**
     * Get metatags object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject)
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolMetatags!'.$sObject])) 
            return $GLOBALS['bxDolClasses']['BxDolMetatags!'.$sObject];

        $aObject = BxDolMetatagsQuery::getMetatagsObject($sObject);
        if (!$aObject || !is_array($aObject))
            return false;

        $sClass = 'BxTemplMetatags';
        if (!empty($aObject['override_class_name']))
            $sClass = $aObject['override_class_name'];
        if (!empty($aObject['override_class_file']))
            require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);

        $o = new $sClass($aObject);

        return ($GLOBALS['bxDolClasses']['BxDolMetatags!'.$sObject] = $o);
    }

    /**
     * Get metatags by term
     * @param string $sMeta - 'keywords' is only supported meta for now
     * @param type $sMetaItem
     * @param type $sTerm
     * @return type
     */
    static public function getMetatagsDataByTerm($sMeta, $sMetaItem, $sTerm)
    {
        $bHashtagsOnly = getParam('sys_metatags_hashtags_only') == 'on';
        $aLabels = []; 
        if($bHashtagsOnly)
            $aLabels = array_map(function($sValue) {return mb_strtolower($sValue);}, BxDolLabel::getInstance()->getLabels(['type' => 'values']));

        $aValues = [];
        $aObjects = BxDolMetatagsQuery::getMetatagsObjects();
        foreach($aObjects as $aObject) {
            $oObject = BxDolMetatags::getObjectInstance($aObject['object']);
            if(!$oObject || !$oObject->{$sMeta . 'IsEnabled'}())
                continue;

            $sMethod = $sMeta . 'GetByTerm';
            if(!method_exists($oObject->_oQuery, $sMethod))
                continue;

            $aData = $oObject->_oQuery->$sMethod($sTerm);
            foreach($aData as $aMeta) {
                if($bHashtagsOnly && in_array(strtolower($aMeta[$sMetaItem]), $aLabels))
                    continue;

                $aMatch = [];
                if(!preg_match(self::$_sKeywordPattern, ' #' . $aMeta[$sMetaItem], $aMatch) || !isset($aMatch[1]) || strcasecmp($aMeta[$sMetaItem], $aMatch[1]) != 0) 
                    continue;

                $aValues[$aMeta[$sMetaItem]] = [
                    'id' => $aMeta['object_id'], 
                    'meta' => $aMeta[$sMetaItem], 
                    'url' => $oObject->keywordsGetHashTagUrl($aMeta[$sMetaItem], $aMeta['object_id'])
                ];
            }
        }

        $aValues = array_slice($aValues, 0, (int)getParam('sys_profiles_search_limit'));
        
        return $aValues;
    }

    public function getModule()
    {
        return $this->_aObject['module'];
    }

    /**
     * Add all available meta tags to the head section 
     * @return number of successfully added metas
     */
    public function addPageMetaInfo($iId, $mixedImage = false)
    {
        $i = 0;
        foreach ($this->_aMetas as $sMeta) {
            $sFunc = $sMeta . 'AddMeta';
            $i += $this->$sFunc($iId);
        }

        if ($mixedImage && is_array($mixedImage)) {
            
            if (!empty($mixedImage['object']))
                $o = BxDolStorage::getObjectInstance($mixedImage['object']);
            elseif (!empty($mixedImage['transcoder']))
                $o = BxDolTranscoder::getObjectInstance($mixedImage['transcoder']);

            $mixedImage = $o ? $o->getFileUrlById($mixedImage['id']) : false;
        }

        if ($mixedImage) 
            BxDolTemplate::getInstance()->addPageMetaImage($mixedImage);

        return $i;
    }

    /**
     * Perform @see keywordsParse @see mentionsParse and maybe other
     * @param $iId content id
     * @param $s string
     * @return modified string
     */    
    public function metaParse($iId, $s)
    {
        foreach ($this->_aMetas as $sMeta) {
            $sFunc = $sMeta . 'Parse';
            if (method_exists($this, $sFunc))
                $s = $this->$sFunc($iId, $s);
        }
        return $s;
    }

    /**
     * Perform @see keywordsAddAuto @see mentionsAddAuto and maybe other
     * @param $iId content id
     * @param $aContentInfo content info array
     * @param $CNF module config array
     * @param $sFormDisplay form display object
     * @return number of founded keywords, mentions, etc
     */
    public function metaAddAuto($iId, $aContentInfo, $CNF, $sFormDisplay) 
    {
        $i = 0;
        foreach ($this->_aMetas as $sMeta) {
            $sFunc = $sMeta . 'AddAuto';
            if (method_exists($this, $sFunc))
                $i += $this->$sFunc($iId, $aContentInfo, $CNF, $sFormDisplay);
        }
        return $i;
    }

    /**
     * Perform @see keywordsAdd @see mentionsAdd and maybe other
     * @param $iId content id
     * @param $s string
     * @return number of added keywords, mentions, etc
     */
    public function metaAdd($iId, $s)
    {
        $i = 0;
        foreach ($this->_aMetas as $sMeta) {
            if ('locations' == $sMeta)
                continue;
            $sFunc = $sMeta . 'Add';
            if (method_exists($this, $sFunc))
                $i += $this->$sFunc($iId, $s);
        }
        return $i;
    }
    
    /**
     * Checks if keywords enabled for current metatags object
     */
    public function keywordsIsEnabled() 
    {
        return empty($this->_aObject['table_keywords']) ? false : true;
    }

    /**
     * This function is specifically for formatting "Photo Camera" string, when "Photo Camera" is used as image hashtag
     */
    static public function keywordsCameraModel($aExif) 
    {
        if (!isset($aExif['Make']))
            return '';

        $sMake = trim($aExif['Make']);
        if ($sMake && isset($aExif['Model'])) {
            $sModel = trim($aExif['Model']);
            if (0 === mb_strpos($sModel, $sMake))
                $sModel = mb_substr($sModel, mb_strlen($sMake));
        }

        return $sMake . (empty($sModel) ? '' : ' ' . trim($sModel));
    }

    /**
     * Add \#keywords from the string
     * @param $iId content id
     * @param $s string with \#keywords
     * @return number of found keywords
     */
    public function keywordsAdd($iId, $s) 
    {
        /**
         * First of all remove <a> HTML tags which don't have 'bx-tag-link' class WITH their content.
         * It's needed because hashtags cannot be used inside links, otherwise we'll get link inside link.
         */
        $s = preg_replace("/<a\b((?!bx-tag-link)[^>])*>(.*?)<\/a>/si", '', $s);

        //--- Strip the other HTML tags.
        $s = strip_tags(str_replace(array('<br>', '<br />', '<hr>', '<hr />', '</p>', '</h1>', '</h2>', '</h3>', '</h4>', '</h5>', '</h6>'), "\n", $s));

        // process spaces
        $s = str_ireplace('&nbsp;', ' ', $s);
        
        return $this->_metaAdd($iId, ' ' . $s, self::$_sKeywordPattern, 'keywordsDelete', 'keywordsAdd', 'keywordsGet', (int)getParam('sys_metatags_hashtags_max'), 'keyword');
    }

    /**
     * Add keyword from the whole string
     * @param $iId content id
     * @param $s keyword 
     * @return number of added keywords, should be 1
     */
    public function keywordsAddOne($iId, $s, $bDeletePreviousKeywords = true)
    {
        if ($iRet = $this->_oQuery->keywordsAdd($iId, array($s), $bDeletePreviousKeywords)) {
            $sSource = $this->_sObject . '_' . $iId;

            /**
             * @hooks
             * @hookdef hook-bx_dol_metatags-keyword_added '{object_name}', 'keyword_added' - hook after a keyword (hashtag) was recognized in provided text
             * - $unit_name - metatags object name
             * - $action - equals `keyword_added`
             * - $object_id - content id
             * - $sender_id - logged in profile id
             * - $extra_params - array of additional params with the following array keys:
             *      - `meta` - [string] recognized keyword
             *      - `content_id` - [int] content id 
             *      - `source` - [string] unique source id
             * @hook @ref hook-bx_dol_metatags-keyword_added
             */
            bx_alert($this->_aObject['module'], 'keyword_added', $iId, bx_get_logged_profile_id(), [
                'meta' => $s, 
                'content_id' => $iId, 
                'source' => $sSource
            ]);

            /**
             * @hooks
             * @hookdef hook-meta_keyword-added 'meta_keyword', 'added' - hook after a keyword (hashtag) was recognized in provided text
             * It's equivalent to @ref hook-bx_dol_metatags-keyword_added 
             * except `object` parameter with metatags object name was added in $extra_params
             * @hook @ref hook-meta_keyword-added
             */
            bx_alert('meta_keyword', 'added', $iId, bx_get_logged_profile_id(), [
                'meta' => $s, 
                'content_id' => $iId, 
                'object' => $this->_sObject, 
                'source' => $sSource
            ]);
        }

        return $iRet;
    }

    /**
     * Add \#keywords from the content fields
     * @param $iId content id
     * @param $aContentInfo content info array
     * @param $CNF module config array
     * @param $sFormDisplay form display object
     * @return number of found keywords
     */
    public function keywordsAddAuto($iId, $aContentInfo, $CNF, $sFormDisplay) 
    {
        $aFields = $this->metaFields($aContentInfo, $CNF, $sFormDisplay); 
        $sTextWithKeywords = '';
        foreach ($aFields as $sField)
            $sTextWithKeywords .= "\n" . $aContentInfo[$sField];

        return $this->keywordsAdd($iId, $sTextWithKeywords);
    }

    /**
     * Get field names which are subject to parse keywords
     */
    public function metaFields($aContentInfo, $CNF, $sFormDisplay, $bHtmlOnly = false)
    {
        $aFields = array();
        if (empty($CNF['FIELDS_WITH_KEYWORDS'])) {
            return array();
        }
        elseif (is_string($CNF['FIELDS_WITH_KEYWORDS']) && 'auto' == $CNF['FIELDS_WITH_KEYWORDS']) {
            if (!($oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $sFormDisplay)))
                return array();

            foreach ($oForm->aInputs as $k => $a) {
                if ('textarea' == $a['type'] && (!$bHtmlOnly || ($bHtmlOnly && $a['html'])))
                    $aFields[] = $a['name'];
            }
        } 
        elseif (is_array($CNF['FIELDS_WITH_KEYWORDS'])) {
            $aFields = $CNF['FIELDS_WITH_KEYWORDS'];
        } 
        elseif (is_string($CNF['FIELDS_WITH_KEYWORDS'])) {
            $aFields = explode(',', $CNF['FIELDS_WITH_KEYWORDS']);
        }

        return $aFields;
    }

    /**
     * Add links to the \#keywords in the string
     * @param $iId content id
     * @param $s string with \#keywords
     * @return modified string where all \#keywords are transformed to links with rel="tag" attribute
     */
    public function keywordsParse($iId, $s) 
    {   
        $a = $this->keywordsGet($iId);
        if (empty($a))
            return $s;

        /**
         * Replace <a> tags, which have 'bx-tag-link' class, with their content. 
         * It's needed to avoid link inside link after hashtags parsing.
         */
        $s = preg_replace('/<a\b[^>]*\bbx-tag-link\b[^>]*>(.*?)<\/a>/si', '$1', $s);

        foreach ($a as $sKeyword) {
            $f = function ($a) use ($sKeyword, $iId) {
                return $a[1] . '<a class="bx-tag-link" rel="tag" href="' . $this->keywordsGetHashTagUrl($sKeyword, $iId) . '">' . (bx_is_api() ? '#' . $sKeyword : '<s>#</s><b>' . $sKeyword . '</b>') . '</a>';
            };

            $s = preg_replace_callback('/([^\pN^\pL])\#(' . preg_quote($sKeyword, '/') . ')/u', $f, $s);
            $s = preg_replace_callback('/^()\#(' . preg_quote($sKeyword, '/') . ')/u', $f, $s);
        }

        return $s;
    }

    /**
     * Add link to the provided keyword
     * @param $iId content id
     * @param $s keyword 
     * @return modified string where provided keyword is transformed to link with rel="tag" attribute
     */
    public function keywordsParseOne($iId, $s) 
    {   
        $a = $this->keywordsGet($iId);
        if (empty($a))
            return $s;
    
        foreach ($a as $sKeyword)
            if (0 === strcasecmp(mb_strtolower($s), mb_strtolower($sKeyword)))
                $s = '<a class="bx-tag-link" rel="tag" href="' . $this->keywordsGetHashTagUrl($sKeyword, $iId) . '">' . $sKeyword . '</a>';

        return $s;
    }
	
    public function keywordsGetHashTagUrl($sKeyword, $iId, $mixedSection = false) 
    {
        $aUrlParams = ['type' => 'keyword', 'keyword' => rawurlencode($sKeyword)];
        if(!empty($mixedSection))
            $aUrlParams['section'] = $mixedSection;

        $sUrl = BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=search-keyword', $aUrlParams);

        /**
         * @hooks
         * @hookdef hook-meta_keyword-url 'meta_keyword', 'url' - hook to override meta keyword URL
         * - $unit_name - equals `meta_keyword`
         * - $action - equals `url`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `url` - [string] by ref, keyword URL, can be overridden in hook processing
         *      - `keyword` - [string] keyword
         *      - `id` - [int] content id
         *      - `object` - [string] metatags object name
         *      - `section` - [string] a string with sections (modules) in which a search by keyword will be performed (for default hashtag URL)
         * @hook @ref hook-meta_keyword-url
         */
        bx_alert('meta_keyword', 'url', 0, false, [
            'url' => &$sUrl,
            'url_ref' => &$sUrl,
            'keyword' => $sKeyword,
            'id' => $iId,
            'object' => $this->_sObject,
            'section' => $mixedSection,
            'sObject' => $this->_sObject, //depricated, will be removed in future versions, approximately in UNA 15.
        ]);
    
        return bx_is_api() ? bx_api_get_relative_url($sUrl) : $sUrl;
    }

    /**
     * Add keywords meta info to the head section
     * @param $iId content id
     */
    protected function keywordsAddMeta($iId)
    {
        BxDolTemplate::getInstance()->addPageKeywords($this->keywordsGet($iId));
    }

    /**
     * Get list of keywords associated with the content
     * @return array of keywords
     */
    public function keywordsGet($iId)
    {
        return $this->_oQuery->keywordsGet($iId);
    }

    /**
     * Set condition for search results object for meta keyword
     * @param $oSearchResult search results object
     * @param $sKeyword keyword
     */
    public function keywordsSetSearchCondition($oSearchResult, $sKeyword, $iCmtsSystemId = 0)
    {
        if (!$this->keywordsIsEnabled())
            return;

        if ('sys_cmts' == $oSearchResult->aCurrent['object_metatags']) {
            $this->keywordsSetSearchConditionCmts($oSearchResult, $sKeyword, $iCmtsSystemId);
            return;
        }

        $oSearchResult->aCurrent['restriction']['meta_keyword'] = array(
            'value' => $sKeyword,
            'field' => 'keyword',
            'operator' => '=',
            'table' => $this->_aObject['table_keywords'],
        );

        $oSearchResult->aCurrent['join']['meta_keyword'] = array(
            'type' => 'INNER',
            'table' => $this->_aObject['table_keywords'],
            'mainField' => $oSearchResult->aCurrent['ident'],
            'mainTable' => !empty($oSearchResult->aCurrent['tableSearch']) ? $oSearchResult->aCurrent['tableSearch'] : $oSearchResult->aCurrent['table'],
            'onField' => 'object_id',
            'joinFields' => array(),
        );
    }

    public function keywordsSetSearchConditionCmts($oSearchResult, $sKeyword, $iCmtsSystemId = 0)
    {
        if (!$this->keywordsIsEnabled())
            return;

        if ($iCmtsSystemId) {
            $oSearchResult->aCurrent['restriction']['meta_keyword_cmts_system'] = array(
                'value' => $iCmtsSystemId,
                'field' => 'system_id',
                'operator' => '=',
                'table' => 'sys_cmts_ids',
            );
        }
        
        $oSearchResult->aCurrent['restriction']['meta_keyword'] = array(
            'value' => $sKeyword,
            'field' => 'keyword',
            'operator' => '=',
            'table' => $this->_aObject['table_keywords'],
        );

        $oSearchResult->aCurrent['join']['meta_keyword_cmts'] = array(
            'type' => 'INNER',
            'table' => 'sys_cmts_ids',
            'mainField' => $oSearchResult->aCurrent['ident'],
            'mainTable' => !empty($oSearchResult->aCurrent['tableSearch']) ? $oSearchResult->aCurrent['tableSearch'] : $oSearchResult->aCurrent['table'],
            'onField' => 'cmt_id',
            'joinFields' => array(),
        );
        
        $oSearchResult->aCurrent['join']['meta_keyword'] = array(
            'type' => 'INNER',
            'table' => $this->_aObject['table_keywords'],
            'mainField' => 'id',
            'mainTable' => 'sys_cmts_ids',
            'onField' => 'object_id',
            'joinFields' => array(),
        );
    }
    
	/**
     * Get part of SQL query for meta keyword
     * @param $sContentTable content table or alias
     * @param $sContentField content table field or field alias
     * @param $sKeyword keyword
     */
    public function keywordsGetAsSQLPart($sContentTable, $sContentField, $sKeyword)
    {
        if (empty($this->_aObject['table_keywords']))
            return array();

        return call_user_func_array(array($this->_oQuery, 'keywordsGetSQLParts'), func_get_args());
    }

    public function keywordsPopularList($iLimit, $mContextId = false)
    {
        return $this->_oQuery->keywordsPopularList($iLimit, $mContextId);
    }


    /**
     * Checks if locations enabled for current metatags object
     */
    public function locationsIsEnabled() 
    {
        return empty($this->_aObject['table_locations']) ? false : true;
    }

    /**
     * Add location for the content
     * @param $iId content id
     * @param $sLatitude latitude
     * @param $sLongitude longitude
     * @param $sCountryCode optional 2 letters country code (ISO 3166-1)
     * @param $sState optional state/province/territory name
     * @param $sCity optional city name
     * @param $sZip optional ZIP/postcode
     * @param $sStreet optional street name
     * @param $sStreetNumber optional street number
     * @return true if location was added, or false otherwise
     */
    public function locationsAdd($iId, $sLatitude, $sLongitude, $sCountryCode, $sState, $sCity, $sZip = '', $sStreet = '', $sStreetNumber = '') 
    {
        // TODO: if lat & lng aren't defined then perform geocoding automatically, or maybe leverage this on client side ?

        return $this->_oQuery->locationsAdd($iId, $sLatitude, $sLongitude, $sCountryCode, $sState, $sCity, $sZip, $sStreet, $sStreetNumber);
    }

	/**
     * Retrieve location for the content from POST data
     * @param $sPrefix field prefix for POST data, or empty -  if no prefix
     * @param $oForm form to use to get POST data, or null - then new form instance will be created
     */
    public static function locationsRetrieveFromForm($sPrefix = '', $oForm = null)
    {
        if($sPrefix)
            $sPrefix .= '_';

        if(!$oForm)
            $oForm = new BxDolForm(array(), false);

        $aResults = [];
        foreach(self::$_aLocationKeys as $sKey) {
            $sValue = $oForm->getCleanValue($sPrefix . $sKey);
            if(!$sValue || in_array($sValue, ['null', 'false']))
                $sValue = '';

            $aResults[] = $sValue;
        }

        return $aResults;
    }

    /**
     * Parse address components into associative array with the following indexes:
     * lat, lng, country, state, city, zip, street, street_number
     */ 
    public static function locationsParseComponents($aAdress, $sPrefix = '')
    {
        if($sPrefix)
            $sPrefix .= '_';

        $aRet = array();
        $iAdress = count($aAdress);
        for($i = 0; $i < $iAdress; $i++)
            if(isset(self::$_aLocationKeys[$i]))
                $aRet[$sPrefix . self::$_aLocationKeys[$i]] = $aAdress[$i];

        return $aRet;
    }

    /**
     * Parse google's formatted address components into array with the following indexes:
     * lat, lng, country, state, city, zip, street, street_number
     */ 
    public static function locationsParseAddressComponents($aAdress, $sPrefix = '')
    {
        if (!isset($aAdress['address_components']))
            return false;
        if (!isset($aAdress['geometry']['location']))
            return false;

        $aRet = array(
            $sPrefix . 'lat' => $aAdress['geometry']['location']['lat'],
            $sPrefix . 'lng' => $aAdress['geometry']['location']['lng'],
        );

        $aMap = array(
            $sPrefix . 'city' => 'locality',
            $sPrefix . 'state' => 'administrative_area_level_1',
            $sPrefix . 'country' => 'country',
            $sPrefix . 'zip' => 'postal_code',
            $sPrefix . 'street' => 'route',
            $sPrefix . 'street_number' => 'street_number'        
        );

        $aAdressComponents = $aAdress['address_components'];
        
        foreach ($aAdressComponents as $r) {
            if (!isset($r['types']))
                continue;
            foreach ($aMap as $sKey => $sName) {
                
                if ('locality' == $sName && !in_array($sName, $r['types']))
                    $sName = 'postal_town';
                
                if ('administrative_area_level_1' == $sName && !in_array($sName, $r['types']))
                    $sName = 'administrative_area_level_2';

                if (in_array($sName, $r['types'])) {
                    $sIndex = 'route' == $sName || 'locality' == $sName ? 'long_name' : 'short_name';
                    $aRet[$sKey] = $r[$sIndex];
                }

                if (in_array('locality', $r['types']))
                    $aRet[$sPrefix . 'city'] = $r['short_name'];
                else if (in_array('country', $r['types']))
                    $aRet[$sPrefix . 'country'] = $r['short_name'];
            }
        }
        
        return $aRet;
    }
    
    /**
     * Add location for the content from POST data
     * @param $iId content id
     * @param $sPrefix field prefix for POST data, or empty -  if no prefix
     * @param $oForm form to use to get POST data, or null - then new form instance will be created
     */
    public function locationsAddFromForm($iId, $sPrefix = '', $oForm = null)
    {
        if (!$this->locationsIsEnabled())
            return;

        call_user_func_array(array($this, 'locationsAdd'), array_merge(array($iId), self::locationsRetrieveFromForm($sPrefix, $oForm)));
    }

    /**
     * Get locations string with links
     * @param $iId content id
     * @return string with links to country and city
     */
    public function locationsString($iId, $bHTML = true, $aParams = array())
    {
        bx_import('BxDolForm');        
        $aLocation = $this->locationGet($iId);
        if(bx_is_api())
            return bx_api_get_location_string($aLocation);

        return $this->locationsStringFromArray($aLocation, $bHTML, $aParams);
    }

    /**
     * Get locations string with links
     * @param $aLocation location array
     * @return string with links to country and city
     */
    public function locationsStringFromArray($aLocation, $bHTML = true, $aParams = array())
    {
        $s = '';
        $aCountries = BxDolFormQuery::getDataItems('Country');

        if(!$aLocation || !$aLocation['country'] || !isset($aCountries[$aLocation['country']])) {
            if (!empty($aLocation['lat']) || !empty($aLocation['lng']))
                $s = _t('_sys_location_country', $aLocation['lat'] . ', ' . $aLocation['lng']);
            else
                return '';
        }
        
        if (!$s) {
            $sCountryUrl = '<a href="' . BX_DOL_URL_ROOT . 'searchKeyword.php?type=location_country&keyword=' . rawurlencode($aLocation['country']) . '">' . $aCountries[$aLocation['country']] . '</a>';
            
            if(empty($aLocation['state']) || empty($aLocation['city']) || (isset($aParams['country_only']) && $aParams['country_only']))
                $s = _t('_sys_location_country', $sCountryUrl);
        }

        if (!$s) {
            $sCityUrl = '<a href="' . BX_DOL_URL_ROOT . 'searchKeyword.php?type=location_country_city&keyword=' . $aLocation['country'] . '&state=' . rawurlencode($aLocation['state']) . '&city=' . rawurlencode($aLocation['city']) . '">' . bx_process_output($aLocation['city']) . '</a>';
            $sStateUrl = '<a href="' . BX_DOL_URL_ROOT . 'searchKeyword.php?type=location_country_state&keyword=' . $aLocation['country'] . '&state=' . rawurlencode($aLocation['state']) . '">' . bx_process_output($aLocation['state']) . '</a>';

            if (empty($aLocation['street']) || empty($aLocation['street_number']) || (isset($aParams['country_city_only']) && $aParams['country_city_only']))
        	    $s = _t('_sys_location_country_city', $sCountryUrl, $sStateUrl, $sCityUrl);
            elseif (!isset($aParams['country_city_only']) || !$aParams['country_city_only'])
                $s = _t('_sys_location_country_city_street', $sCountryUrl, $sStateUrl, $sCityUrl, bx_process_output($aLocation['street']), bx_process_output($aLocation['street_number']));
        }

        return $bHTML ? $s : trim(strip_tags($s));
    }

    public function locationsStringFromArrayAPI($mixedValue)
    {
        if(!is_array($mixedValue)) {
            $aValue = @unserialize($mixedValue);
            if(!$aValue)
                $aValue = json_decode($mixedValue, true);
        }
        else
            $aValue = $mixedValue;

        if(empty($aValue) || !is_array($aValue) || empty($aValue['country'])) 
            return '';

        $aCountries = BxDolFormQuery::getDataItems('Country');

        $sResult = '';
        $sResult .= $aValue['street_number'] ? $aValue['street_number'] . ', ' : '';
        $sResult .= $aValue['street'] ? $aValue['street'] . ', ' : '';
        $sResult .= $aValue['city'] ? $aValue['city'] . ', ' : '';
        $sResult .= $aValue['state'] ? $aValue['state'] . ', ' : '';
        $sResult .= $aCountries[$aValue['country']];

        return $sResult;
    }

    /**
     * Add keywords meta info to the head section
     * @param $iId content id
     */
    protected function locationsAddMeta($iId) 
    {
        $aLocation = $this->locationGet($iId);
        if (!empty($aLocation['lat']) && !empty($aLocation['lng']) && !empty($aLocation['country']))
            BxDolTemplate::getInstance()->addPageMetaLocation($aLocation['lat'], $aLocation['lng'], $aLocation['country']);
    }

    /**
     * Set condition for search results object for meta locations
     * @param $oSearchResult search results object
     * @param $sCountry country and other location info
     */
    public function locationsSetSearchCondition($oSearchResult, $sCountry = false, $sState = false, $sCity = false, $sZip = false)
    {
        if (empty($this->_aObject['table_locations'])) {
            $oSearchResult->aCurrent['restriction']['meta_location'] = array(
                'operator' => 'nothing',
                'field' => 'nofield',
                'value' => 'novalue',
            );
            return;
        }

        $aIndexes = ['country' => 'sCountry', 'state' => 'sState', 'city' => 'sCity', 'zip' => 'sZip'];
        $aOperators = ['city' => 'like'];

        foreach ($aIndexes as $sIndex => $sVar) {
            if (!$$sVar)
                continue;

            $oSearchResult->aCurrent['restriction']['meta_location_' . $sIndex] = [
                'value' => $$sVar,
                'field' => $sIndex,
                'operator' => isset($aOperators[$sIndex]) ? $aOperators[$sIndex] : '=',
                'table' => $this->_aObject['table_locations'],
            ];
        }

        $oSearchResult->aCurrent['join']['meta_location'] = array(
            'type' => 'INNER',
            'table' => $this->_aObject['table_locations'],
            'mainField' => $oSearchResult->aCurrent['ident'],
            'mainTable' => !empty($oSearchResult->aCurrent['tableSearch']) ? $oSearchResult->aCurrent['tableSearch'] : $oSearchResult->aCurrent['table'],
            'onField' => 'object_id',
            'joinFields' => array(),
        );
    }

    /**
     * Get part of SQL query for meta locations
     * @param $sContentTable content table or alias
     * @param $sContentField content table field or field alias
     * @param $sCountry country and other location info
     */
    public function locationsGetAsSQLPart($sContentTable, $sContentField, $sCountry = false, $sState = false, $sCity = false, $sZip = false, $aBounds = array())
    {
        if (empty($this->_aObject['table_locations']))
            return array();

        return call_user_func_array(array($this->_oQuery, 'locationsGetSQLParts'), func_get_args());
    }

    /**
     * Get location
     * @param $iId content id
     * @param $sPrefix field prefix for returning data array
     * @return location array with the following keys (when no prefix specified): object_id, lat, lng, country, state, city, zip, street, street_number
     */
    public function locationGet($iId, $sPrefix = '')
    {
        if (!$this->locationsIsEnabled())
            return;

        $a = $this->_oQuery->locationGet($iId);
        if (!$sPrefix)
            return $a;

        $aRet = array();
        foreach ($a as $sKey => $sVal)
            $aRet[$sPrefix . '_' . $sKey] = $sVal;
        return $aRet;
    }

    /**
     * Checks if mentions enabled for current metatags object
     */
    public function mentionsIsEnabled() 
    {
        return empty($this->_aObject['table_mentions']) ? false : true;
    }

    /**
     * Add \@mentions from the string (most probably \@mentions will be some sort of links already, so parsing may have to look for smth like <a data-mention="bx_persons|123">mention name</a> instead of \@mention, since there is no usernames for profiles modules and name could contain spaces and othr characters)
     * @param $iId content id
     * @param $s string with \@mentions
     * @return number of found mentions 
     */
    public function mentionsAdd($iId, $s) 
    {
        $sPreg = '/data\-profile\-id=(?:"([0-9A-Za-z]+)"|\'([0-9A-Za-z]+)\'|([0-9A-Za-z]+))/u';

        return $this->_metaAdd($iId, $s, $sPreg, 'mentionsDelete', 'mentionsAdd', 'mentionsGet', (int)getParam('sys_metatags_mentions_max'), 'mention');
    }

    /**
     * Add \@mentions from the content of form fields
     * @param $iId content id
     * @param $aContentInfo content info array
     * @param $CNF module config array
     * @param $sFormDisplay form display object
     * @return number of found keywords
     */
    public function mentionsAddAuto($iId, $aContentInfo, $CNF, $sFormDisplay) 
    {
        $aFields = $this->metaFields($aContentInfo, $CNF, $sFormDisplay, true); 
        $sTextWithKeywords = '';
        foreach ($aFields as $sField)
            $sTextWithKeywords .= "\n" . $aContentInfo[$sField];

        return $this->mentionsAdd($iId, $sTextWithKeywords);
    }
    
    /**
     * Add links to the \@mentions in the string (actual tranformation may have to be performed with ready links like <a data-mention="bx_persons|123">mention name</a>)
     * @param $iId content id
     * @param $s string with \@mentions
     * @return modified string where all \@mentions are transformed to links
     */
    public function mentionsParse($iId, $s) 
    {
        if (!bx_is_api())
            return $s;
        
        if(($sRootUrl = getParam('sys_api_url_root_email')) !== '') {
            if(substr(BX_DOL_URL_ROOT, -1) == '/' && substr($sRootUrl, -1) != '/')
                $sRootUrl .= '/';

            $s = str_replace(BX_DOL_URL_ROOT, $sRootUrl, $s);
        }
        
        return $s;
    }

    /**
     * No mentions meta info in the head section
     */
    protected function mentionsAddMeta($iId) 
    {
        return 0;
    }

    /**
     * Get list of profile IDs associated with the content
     * @return array of profile IDs
     */
    public function mentionsGet($iId)
    {
        return $this->_oQuery->mentionsGet($iId);
    }
    
    /**
     * Set condition for search results object for mentions
     * @param $oSearchResult search results object
     * @param $sMention smbd
     */
    public function mentionsSetSearchCondition($oSearchResult, $iProfileId, $iCmtsSystemId = 0)
    {
        if (!$this->mentionsIsEnabled())
            return;

        if ('sys_cmts' == $oSearchResult->aCurrent['object_metatags']) {
            $this->mentionsSetSearchConditionCmts($oSearchResult, $iProfileId, $iCmtsSystemId);
            return;
        }

        $oSearchResult->aCurrent['restriction']['meta_mentions'] = array(
            'value' => $iProfileId,
            'field' => 'profile_id',
            'operator' => '=',
            'table' => $this->_aObject['table_mentions'],
        );

        $oSearchResult->aCurrent['join']['meta_mentions'] = array(
            'type' => 'INNER',
            'table' => $this->_aObject['table_mentions'],
            'mainField' => $oSearchResult->aCurrent['ident'],
            'mainTable' => !empty($oSearchResult->aCurrent['tableSearch']) ? $oSearchResult->aCurrent['tableSearch'] : $oSearchResult->aCurrent['table'],
            'onField' => 'object_id',
            'joinFields' => array(),
        );
    }

    public function mentionsSetSearchConditionCmts($oSearchResult, $iProfileId, $iCmtsSystemId = 0)
    {
        if (!$this->keywordsIsEnabled())
            return;

        if ($iCmtsSystemId) {
            $oSearchResult->aCurrent['restriction']['meta_mentions_cmts_system'] = array(
                'value' => $iCmtsSystemId,
                'field' => 'system_id',
                'operator' => '=',
                'table' => 'sys_cmts_ids',
            );
        }
        
        $oSearchResult->aCurrent['restriction']['meta_mentions'] = array(
            'value' => $iProfileId,
            'field' => 'profile_id',
            'operator' => '=',
            'table' => $this->_aObject['table_mentions'],
        );

        $oSearchResult->aCurrent['join']['meta_mentions_cmts'] = array(
            'type' => 'INNER',
            'table' => 'sys_cmts_ids',
            'mainField' => $oSearchResult->aCurrent['ident'],
            'mainTable' => !empty($oSearchResult->aCurrent['tableSearch']) ? $oSearchResult->aCurrent['tableSearch'] : $oSearchResult->aCurrent['table'],
            'onField' => 'cmt_id',
            'joinFields' => array(),
        );
        
        $oSearchResult->aCurrent['join']['meta_mentions'] = array(
            'type' => 'INNER',
            'table' => $this->_aObject['table_mentions'],
            'mainField' => 'id',
            'mainTable' => 'sys_cmts_ids',
            'onField' => 'object_id',
            'joinFields' => array(),
        );
    }
    
    /**
     * Delete all data associated with the content
     * @param $iId content id
     */
    public function onDeleteContent($iId) 
    {
        $i = 0;
        foreach ($this->_aMetas as $sMeta) {
            $sFunc = $sMeta . 'Delete';
            $i += $this->_oQuery->$sFunc($iId);
        }
        return $i;
    }

    protected function _metaAdd($iId, $s, $sPreg, $sFuncDelete, $sFuncAdd, $sFuncGet, $iMaxItems, $sAlertName) 
    {
        $a = array();
        if (!preg_match_all($sPreg, $s, $a)) {
            $this->_oQuery->$sFuncDelete($iId);
            return 0;
        }

        $aMetas = array_unique($a[1]);
        $aMetas = array_slice($aMetas, 0, $iMaxItems);

        // check if keywords/mentions were changed
        $aMetasOld = $this->$sFuncGet($iId);
        if (is_array($aMetas) && is_array($aMetasOld) 
            && count($aMetas) == count($aMetasOld) 
            && empty(array_diff($aMetas, $aMetasOld))
            && empty(array_diff($aMetasOld, $aMetas))
        ) {
            return 0;
        }

        /**
         * @hooks
         * @hookdef hook-meta_keyword-before_add_multiple 'meta_keyword', 'before_add_multiple' - hook to override meta keywords before it will be processed
         * - $unit_name - equals `meta_keyword` or `meta_mention` 
         * - $action - equals `before_add_multiple`
         * - $object_id - content id 
         * - $sender_id - currently logged in profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `metas` - [array] array of keyword/mentions, can be overridden in hook processing
         *      - `text` - [string] original string with keywords
         *      - `content_id` - [int] content id
         *      - `object` - [string] metatags object name
         * @hook @ref hook-meta_keyword-before_add_multiple
         */
        /**
         * @hooks
         * @hookdef hook-meta_keyword-before_add_multiple 'meta_keyword', 'before_add_multiple' - hook to override meta keyword/mention before it will be processed
         * It's equivalent to @ref hook-meta_mention-before_added
         * except mention value is used as $iObjectId
         * @hook @ref hook-meta_keyword-before_add_multiple
         */
        bx_alert('meta_' . $sAlertName, 'before_add_multiple', 'mention' == $sAlertName ? 0 : $iId, bx_get_logged_profile_id(), [
            'metas' => &$aMetas,
            'metas_ref' => &$aMetas,
            'text' => $s,
            'content_id' => $iId, 
            'object' => $this->_sObject
        ]);

        if ($iRet = $this->_oQuery->$sFuncAdd($iId, $aMetas)) {
            $iAuthorId = bx_get_logged_profile_id();

            foreach ($aMetas as $sMeta) {
                $iObjectId = 'mention' == $sAlertName ? $sMeta : $iId;
                
                /**
                 * @hooks
                 * @hookdef hook-meta_keyword-before_added 'meta_keyword', 'before_added' - hook to override meta keyword before it will be processed
                 * - $unit_name - equals `meta_keyword`
                 * - $action - equals `before_added`
                 * - $object_id - object id
                 * - $sender_id - currently logged in profile id
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `meta` - [string] by ref, keyword, can be overridden in hook processing
                 *      - `content_id` - [int] content id
                 *      - `object` - [string] metatags object name
                 * @hook @ref hook-meta_keyword-before_added
                 */
                /**
                 * @hooks
                 * @hookdef hook-meta_keyword-before_added 'meta_mention', 'before_added' - hook to override meta keyword before it will be processed
                 * It's equivalent to @ref hook-meta_mention-before_added
                 * except mention value is used in object id param
                 * @hook @ref hook-meta_keyword-before_added
                 */
                bx_alert('meta_' . $sAlertName, 'before_added', $iObjectId, $iAuthorId, [
                    'meta' => &$sMeta, 
                    'meta_ref' => &$sMeta, 
                    'content_id' => $iId, 
                    'object' => $this->_sObject
                ]);

                $sSource = $this->_sObject . '_' . $iId;
                $sSourceMac = $this->_sObject . '_' . $iAuthorId . '_' . $iId;

                /**
                 * @hooks
                 * @hookdef hook-bx_dol_metatags-keyword_added '{object_name}', 'keyword_added' - hook after meta keyword/mention was processed (added)
                 * - $unit_name - metatags object name
                 * - $action - equals `keyword_added`
                 * - $object_id - object id
                 * - $sender_id - currently logged in profile id
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `meta` - [string] keyword
                 *      - `content_id` - [int] content id
                 *      - `source` - [string] unique source id
                 * @hook @ref hook-bx_dol_metatags-keyword_added
                 */
                /**
                 * @hooks
                 * @hookdef hook-bx_dol_metatags-keyword_added '{object_name}', 'keyword_added' - hook after meta keyword/mention was processed
                 * It's equivalent to @ref hook-bx_dol_metatags-keyword_added
                 * @hook @ref hook-bx_dol_metatags-keyword_added
                 */
                bx_alert($this->_sObject, $sAlertName . '_added', $iObjectId, $iAuthorId, [
                    'meta' => $sMeta, 
                    'content_id' => $iId, 
                    'source' => $sSource,
                    'source_mac' => $sSourceMac
                ]);

                /**
                 * @hooks
                 * @hookdef hook-meta_keyword-added 'meta_keyword', 'added' - hook after meta keyword was processed (added)
                 * - $unit_name - equals `meta_keyword`
                 * - $action - equals `added`
                 * - $object_id - object id
                 * - $sender_id - currently logged in profile id
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `meta` - [string] keyword
                 *      - `content_id` - [int] content id
                 *      - `source` - [string] unique source id
                 *      - `object` - [string] metatags object name
                 * @hook @ref hook-meta_keyword-added
                 */
                /**
                 * @hooks
                 * @hookdef hook-meta_keyword-added 'meta_keyword', 'added' - hook after meta mention/keyword was processed
                 * It's equivalent to @ref hook-meta_keyword-added
                 * @hook @ref hook-meta_keyword-added
                 */
                bx_alert('meta_' . $sAlertName, 'added', $iObjectId, $iAuthorId, [
                    'meta' => $sMeta, 
                    'content_id' => $iId, 
                    'source' => $sSource,
                    'source_mac' => $sSourceMac, 
                    'object' => $this->_sObject
                ]);
            }
        }

        return $iRet;
    }
}

/** @} */
