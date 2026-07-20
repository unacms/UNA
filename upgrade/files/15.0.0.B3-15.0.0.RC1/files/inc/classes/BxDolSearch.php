<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT', 10);
define('BX_DOL_SEARCH_KEYWORD_PAGE', 'site-search-page');

/**
 * Search class for different content.
 *
 * Allows present content in main search area for all modules.
 *
 * To add taking part content from your module to search area you need add a record to `sys_objects_search` table:
 * @code
 *   ID - autoincremented id for internal usage
 *   ObjectName - your unique module name, with vendor prefix, lowercase and spaces are underscored
 *   Title - language key for module's choicer in global search form
 *   ClassName - class name which is responsible for search process ad showing result for found results
 *   ClassPath - file where your ClassName is stored (if class is stored in template folder then you can use key {tmpl})
 * @endcode
 *
 * For using this class you should have unit of BxDolSearchResult class (see description below) with method processing which is responsible for processing of search request.
 *
 * Example of usage can be seen in the BoonEx modules, for example: Posts
 *
 * Memberships/ACL:
 * Doesn't depend on user's membership.
 *
 * Alerts:
 * no alerts available
 *
 */
class BxDolSearch extends BxDol
{
    protected $_bIsApi;
    protected $_bAssitantForLiveSearch = true;
        
    protected $aClasses = array(); ///< array of all search classes
    protected $aChoice  = array(); ///< array of current search classes which were choosen in search area
    protected $_bRawProcessing = false; ///< display search results without design box and paginate
    protected $_bDataProcessing = false; ///< return result as array of data

    protected $_bLiveSearch = false;
    protected $_sMetaType = '';
    protected $_sCategoryObject = ''; ///< by default = object from sys_objects_category table, for multicategories set to 'multi' string 
    protected $_aCustomSearchCondition = array();
    protected $_aCustomCurrentCondition = array();
    protected $_sUnitTemplate = '';

    /**
     * Constructor
     * @param array $aChoice - array of choosen classes (will take a part only existing in `sys_objects_search` table)
     */
    public function __construct ($aChoice = '')
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->aClasses = self::getSections();

        if (is_array($aChoice) && !empty($aChoice)) {
            foreach ($aChoice as $sValue) {
                if (isset($this->aClasses[$sValue]))
                    $this->aChoice[$sValue] = $this->aClasses[$sValue];
            }
        } else {
            $this->aChoice = $this->aClasses;
        }
    }

    public static function getSections($bGlobal = null) 
    {
        $sWhere = '';
        if ($bGlobal != null)
            $sWhere = ' AND `GlobalSearch` = ' . ($bGlobal ? '1' : '0');

        return BxDolDb::getInstance()->fromCache('sys_objects_search', 'getAllWithKey',
           'SELECT `ID` as `id`,
                   `Title` as `title`,
                   `ClassName` as `class`,
                   `ClassPath` as `file`,
                   `ObjectName`,
                   `GlobalSearch`
            FROM `sys_objects_search`
            WHERE 1 ' . $sWhere . '
            ORDER BY `Order` ASC', 'ObjectName'
        );
    }

    public function setApiOutput($bIsApi)
    {
        $this->_bIsApi = $bIsApi;
    }   

    public function setAssistantForLiveSearch($bAssistantForLiveSearch)
    {
        $this->_bAssitantForLiveSearch = $bAssistantForLiveSearch;
    }  

    /**
     * create units for all classes and calling their processing methods
     */
    public function response ()
    {
        $sCode = $this->_bDataProcessing ? [] : '';

        if($this->_bAssitantForLiveSearch && $this->_bLiveSearch && ($iAssistant = BxDolAI::getAssistantForLiveSearch()) != 0) {
            $sKeyword = '';
            if(($sKeyword = bx_get('keyword')) !== false)
                $sKeyword = bx_process_input($sKeyword);

            if($this->_bIsApi)
                $sCode .= BxDolAIAssistant::getObjectInstance($iAssistant)->getAskButton($sKeyword);
        }

        $bSingle = count($this->aChoice) == 1;
        foreach($this->aChoice as $sKey => $aValue) {
            if(!$this->_sMetaType && !$aValue['GlobalSearch'])
                continue;

            $sClassName = 'BxTemplSearchResult';
            if(!empty($aValue['class'])) {
                $sClassName = $aValue['class'];
                if(!empty($aValue['file']))
                    require_once(BX_DIRECTORY_PATH_ROOT . $aValue['file']);
            }

            $oEx = new $sClassName();            
            if($this->_sMetaType && !$oEx->isMetaEnabled($this->_sMetaType))
                continue;

            $oEx->setId($aValue['id']);
            $oEx->setLiveSearch($this->_bLiveSearch);
            $oEx->setMetaType($this->_sMetaType);
            $oEx->setCategoryObject($this->_sCategoryObject);
            $oEx->setCenterContentUnitSelector(false);
            $oEx->setSingleSearch($bSingle);
            $oEx->setCustomSearchCondition($this->_aCustomSearchCondition);
            
            $oEx->aCurrent = array_merge_recursive($oEx->aCurrent, $this->_aCustomCurrentCondition);
            if($this->_sUnitTemplate)
                $oEx->setUnitTemplate($this->_sUnitTemplate);

            if($this->_bDataProcessing) {
                if($this->_bIsApi) {
                    if($bSingle) {
                        $sMethod = 'decodeDataAPI';
                        if($this->_bLiveSearch && ($sMethodLs = 'decodeLsDataAPI') && method_exists($oEx, $sMethodLs))
                            $sMethod = $sMethodLs;

                        $sCode = $oEx->$sMethod($oEx->getSearchData());
                    }
                    else
                        $sCode[$sKey] = $oEx->getSearchQuery($sKey);
                }
                else
                    $sCode[$sKey] = $oEx->getSearchData();
            }
            else
                $sCode .= $this->_bRawProcessing ? $oEx->processingRaw() : $oEx->processing();
        }

        if($this->_bIsApi && !$bSingle && is_array($sCode)) {
            $bExtendedUnits = getParam('sys_api_extended_units') == 'on';

            $aQueries = [];
            foreach($sCode as $aQuery)
                if(!empty($aQuery['query']))
                    $aQueries[] = $aQuery['query'];

            $aItems = BxDolDb::getInstance()->getAll('(' . implode(') UNION (', $aQueries) . ') ORDER BY `added` DESC ' . current($sCode)['limit']);

            $sCode = [];
            foreach($aItems as $aItem)
                if(($oContentInfo = BxDolContentInfo::getObjectInstance($aItem['content_info'])) !== false)
                    $sCode[] = $oContentInfo->getContentInfoAPI($aItem['id'], $bExtendedUnits);
        }

        return $sCode;
    }

    public function getEmptyResult ()
    {
        $sKey = _t('_Empty');
        return DesignBoxContent($sKey, MsgBox($sKey), BX_DB_PADDING_DEF);
    }

    public function getSearchResultObject($sChoice = '')
    {
        $aSearchResult = [];

        if($sChoice) {
            if(empty($this->aChoice[$sChoice]) || !is_array($this->aChoice[$sChoice]))
                return false;

            $aSearchResult = $this->aChoice[$sChoice];
        }
        else
            $aSearchResult = reset($this->aChoice);

        $sClassName = 'BxTemplSearchResult';
        if(!empty($aSearchResult['class'])) {
            $sClassName = $aSearchResult['class'];
            if(!empty($aSearchResult['file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aSearchResult['file']);
        }

        return new $sClassName();
    }

    protected function getKeyTitlesPairs ()
    {
        $a = array();
        foreach ($this->aChoice as $sKey => $r)
            if ($this->_sMetaType || $r['GlobalSearch'])
                $a[$sKey] = _t($r['title']);
        return $a;
    }

    public function setLiveSearch($bLiveSearch)
    {
        $this->_bLiveSearch = $bLiveSearch;
    }

    public function setMetaType($s)
    {
        $aMetaTypes = array('location_country', 'location_country_city', 'location_country_state', 'mention', 'keyword');
        if (in_array($s, $aMetaTypes))
            $this->_sMetaType = $s;
    }
    
    public function setCategoryObject($s)
    {
        $this->_sCategoryObject = $s;
    }

    /**
     * Set custom search condition to use istead of GET/POST variables
     * @param $a array of params, such as 'keyword', 'state', 'city'
     * @return nothing
     */
    public function setCustomSearchCondition($a)
    {
        $this->_aCustomSearchCondition = $a;
    }

    /**
     * Set custom data for aCurrent array
     * @param $a array of params
     * @return nothing
     */
    public function setCustomCurrentCondition($a)
    {
        $this->_aCustomCurrentCondition = $a;
    }

    /**
     * Set custom unit template
     * @param $s template name
     * @return nothing
     */
    public function setUnitTemplate($s)
    {
        $this->_sUnitTemplate = $s;
    }
    
    /**
     * Display search results without design box and paginate
     */ 
    public function setRawProcessing($b)
    {
        $this->_bRawProcessing = $b;
    }

    /**
     * Return search result as array of data
     */ 
    public function setDataProcessing($b)
    {
        $this->_bDataProcessing = $b;
    }
}

/*
 * Search class for processing search requests and displaying search results.
 *
 * Allows present content from modules on search params or internal (via fields of class) conditions.
 *
 * Example of usage (you can see example in any of default Dolhpin's modules):
 *
 * 1. Extends your own search class from this one (or from BxBaseSearchResult or BxBaseSearchResultSharedMedia classes)
 * 2. Set necessary fields of class (using as example BxFilesSearch):
 *
 * @code
 *
 *  // main field of search class
 *  $this->aCurrent = array(
 *
 *      // name of module
 *      'name' => 'bx_files',
 *
 *      // language key with name of module
 *      'title' => '_bx_files',
 *
 *      // main content table
 *      'table' => 'bx_files_main',
 *
 *      // array of all fields which can be choosen for select in result query
 *      'ownFields' => array('ID', 'Title', 'Uri', 'Desc', 'Date', 'Size', 'Ext', 'Views', 'Rate', 'RateCount', 'Type'),
 *
 *      // array of fields which take a part in search by keyword (global search and related words only - in other cases leave it blank)
 *      'searchFields' => array('Title', 'Tags', 'Desc', 'Categories'),
 *
 *      // array of join tables
 *      //   'type' - type of join
 *      //   'table' - join table
 *      //   'mainField' - field from main table for 'on' condition
 *      //   'onField' - field from joining table for 'on' condition
 *      //   'joinFields' - array of fields from joining table
 *
 *      'join' => array(
 *          'profile' => array(
 *              'type' => 'left',
 *              'table' => 'Profiles',
 *              'mainField' => 'Owner',
 *              'onField' => 'ID',
 *              'joinFields' => array('NickName'),
 *          ),
 *          // ...
 *      ),
 *
 *      // array of search parameters
 *      //   'value' - value of search parameter (can be number, string or array)
 *      //   'field' - field which will take value of search, may be lefy as blank then in search query will be pasted to WHERE conditon via operator AGAINST
 *      //   'operator' - operator between field and value (can be 'in', 'not in', '>', '<', 'against', 'like' and '=' by default),
 *      //   'paramName' - GET param which will keep 'value' for pagianation
 *
 *      'restriction' => array(
 *          'activeStatus' => array('value'=>'approved', 'field'=>'Status', 'operator'=>'=', 'paramName' => 'status'),
 *          'albumType' => array('value'=>'', 'field'=>'Type', 'operator'=>'=', 'paramName'=>'albumType', 'table'=>'sys_albums'),
 *      ),
 *
 *      // array of pagination
 *      //   'perPage' - units per page
 *      //   'start' - show search results starting from this number
 *      //   'num' - number of element to show on current page + 1
 *
 *      'paginate' => array('perPage' => 10, 'start' => 0, 'num' => 11),
 *
 *      // sort mode - by default it was last (DESC by date)
 *      'sorting' => 'last',
 *
 *      // mode of units presentation in search result, can be 'short' or 'full' view
 *      'view' => 'full',
 *
 *      // field of id
 *      'ident' => 'ID',
 *
 *      // rss feed array
 *      'rss' => array(
 *          'title' => '',
 *          'link' => '',
 *          'image' => '',
 *          'profile' => 0,
 *          'fields' => array (
 *              'Link' => '',
 *              'Title' => 'Title',
 *              'DateTimeUTS' => 'Date',
 *              'Desc' => 'Desc',
 *              'Photo' => '',
 *          ),
 *      ),
 *  );
 *
 *  // array of fields renamings
 *  $aPseud - filling in costructor by function _getPseud
 *
 *  // unique identificator from `sys_objects_search` table
 *  $id;
 *
 * @endcode
 *
 * Memberships/ACL:
 * Doesn't depend on user's membership.
 *
 * Alerts:
 * no alerts available
 *
 */

class BxDolSearchResult implements iBxDolReplaceable
{
    public $aCurrent; ///< search results configuration

    protected $aPseud; ///< array of fields renamings
    protected $id; ///< unique identificator of block on mixed search results page
    protected $bDisplayEmptyMsg = false; ///< display empty message instead of nothing, when no results
    protected $sDisplayEmptyMsgKey = ''; ///< custom empty message language key, instead of default "empty" message
    protected $bProcessPrivateContent = true; ///< check each item for privacy, if view isn't allowed then display private view instead
    protected $aPrivateConditionsIndexes = array('restriction' => array(), 'join' => array()); ///< conditions indexes for bProcessPrivateContent
    protected $bForceAjaxPaginate = false; ///< force ajax paginate
    protected $iPaginatePerPage = BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT; ///< default 'per page' value for paginate.

    protected $_bIsApi;
    protected $_bSingleSearch = true;
    protected $_bLiveSearch = false;
    protected $_sMetaType = '';
    protected $_sMode = '';
    protected $_aParams = [];
    protected $_sCategoryObject = '';
    protected $_aCustomSearchCondition = array();

    protected $_aMarkers = array (); ///< markers to replace somewhere, usually title and browse url (defined in custom class)
    
    /**
     * constructor
     * filling identificator field
     */
    function __construct ()
    {
        $this->_bIsApi = bx_is_api();

        if (isset($this->aPseud['id']))
            $this->aCurrent['ident'] = $this->aPseud['id'];
    }

    public function getId()
    {
        return $this->id;
    }

    public function setId($sId)
    {
        $this->id = $sId;
    }

    public function getModuleName()
    {
        return isset($this->aCurrent['module_name']) ? $this->aCurrent['module_name'] : '';
    }

    public function getContentInfoName()
    {
        return isset($this->aCurrent['name']) ? $this->aCurrent['name'] : '';
    }

    public function setAjaxPaginate($b = true)
    {
        $this->bForceAjaxPaginate = $b;
    }

    public function setPaginatePerPage($iPerPage)
    {
        $this->iPaginatePerPage = $iPerPage;
    }

    public function setSingleSearch($bSingleSearch)
    {
        $this->_bSingleSearch = $bSingleSearch;
    }

    public function setLiveSearch($bLiveSearch)
    {
        $this->_bLiveSearch = $bLiveSearch;
    }

    public function setMetaType($s)
    {
        $this->_sMetaType = $s;
    }

    public function isMetaEnabled($s)
    {
        if (empty($this->aCurrent['object_metatags']))
            return false;
            
        if (!($o = BxDolMetatags::getObjectInstance($this->aCurrent['object_metatags'])))
            return false;

        switch ($s) {
            case 'location_country_city':
            case 'location_country_state':            
            case 'location_country':
                return $o->locationsIsEnabled();
            case 'mention':
                return $o->mentionsIsEnabled();
            case 'keyword':
                return $o->keywordsIsEnabled();
        }

        return false;
    }
    
    public function setCategoryObject($s)
    {
        $this->_sCategoryObject = $s;
    }

    public function setCustomSearchCondition($a)
    {
        $this->_aCustomSearchCondition = $a;
    }
    
    public function setCustomCurrentCondition($a)
    {
        $this->aCurrent = array_merge_recursive($this->aCurrent, $a);
    }

    public function setCategoriesCondition($sKeyword)
    {
		$this->aCurrent['join']['multicat'] = array(
            'type' => 'INNER',
            'table' => 'sys_categories2objects',
            'mainField' => 'id',
            'onField' => 'object_id',
            'joinFields' => array(),
        );
		
		if (isset($this->aCurrent['tableSearch'])){
			$this->aCurrent['join']['multicat']['mainTable'] = $this->aCurrent['tableSearch'];
		}
		
        $this->aCurrent['join']['multicat2'] = array(
           'type' => 'INNER',
           'table' => 'sys_categories',
           'mainField' => 'category_id',
           'mainTable' => 'sys_categories2objects',
           'onField' => 'id',
           'joinFields' => array(),
       );
       $this->aCurrent['restriction']['multicat'] = array('value' => $sKeyword, 'field' => 'value', 'operator' => '=', 'table' => 'sys_categories');
    }
    
    /**
     * Display empty message if there is no content, custom empty message can be used.
     * @param $b - boolan value to enable or disable 'empty' message
     * @param $sLangKey [optional] - custom 'empty' message
     */
    public function setDisplayEmptyMsg($b, $sLangKey = '')
    {
        $this->bDisplayEmptyMsg = $b;
        if ($sLangKey)
           $this->sDisplayEmptyMsgKey = $sLangKey;
    }

    /**
     * Perform privacy checking for every unit
     * @param $b - boolan value to enable or disable privacy checking
     */
    public function setProcessPrivateContent ($b)
    {
        $this->bProcessPrivateContent = $b;
        if ($b) {
            // unset condition which was set when 'bProcessPrivateContent' was set to 'false'
            foreach ($this->aPrivateConditionsIndexes['restriction'] as $sKey) 
                unset($this->aCurrent['restriction'][$sKey]);
            foreach ($this->aPrivateConditionsIndexes['join'] as $sKey)
                unset($this->aCurrent['join'][$sKey]);
        }
    }

    /**
     * Get search results without design box and paginate
     * @return html code
     */
    function processingRaw ()
    {
        $sCode = $this->displayResultBlock();
        return $this->aCurrent['paginate']['num'] > 0 ? $sCode : '';
    }
    
    /**
     * Get html box of search results (usually used in grlobal search)
     * @return html code
     */
    function processing ()
    {
        if($this->_bIsApi)
            return $this->processingAPI();

        $sCode = $this->displayResultBlock();
        if ($this->aCurrent['paginate']['num'] > 0) {
            $sPaginate = $this->showPagination();
            $sCode = $this->displaySearchBox($sCode, $sPaginate);
        }
        else {
            $sCode = $this->bDisplayEmptyMsg ? $this->displaySearchBox($this->displayResultBlockEmpty()) : '';
        }

        return $sCode;
    }

    function processingAPI ($bForceGetData = false)
    {
        $sModule = 'system';
        $sUnitType = 'content';
        $sHomeUrl = '';
        
        if(!empty($this->oModule)) {
            $sModule = $this->oModule->getName();

            if(method_exists($this->oModule, 'serviceActAsProfile') && $this->oModule->serviceActAsProfile())
                 $sUnitType = 'profile';
            if(method_exists($this->oModule, 'serviceIsGroupProfile') && $this->oModule->serviceIsGroupProfile())
                 $sUnitType = 'context';
            
            $sHomeUrl = bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($this->oModule->_oConfig->CNF['URL_HOME']));
        }

        $sUnit =  'list';
        if(in_array($this->sUnitViewDefault, ['showcase', 'gallery']))
            $sUnit = 'card';
        
        $aData = defined('BX_API_PAGE') && !$bForceGetData ? [] : $this->decodeDataAPI($this->getSearchData());

        $aParams =  [
            'type' => $this->_sMode,
            'start' => $this->aCurrent['paginate']['start'],
            'per_page' => $this->aCurrent['paginate']['perPage'],
            'view' => $this->_aParams['unit_view'] ?? '',
        ];

        if($sHomeUrl)
            $aParams['home_url'] = $sHomeUrl;

        if(($sK = 'class_search_result') && isset($this->_aParams[$sK]))
            $aParams[$sK] = $this->_aParams[$sK];

        $aParamsAdd = [];
        if(($sMethod = 'addProcessingParamsAPI') && method_exists($this, $sMethod))
            $aParamsAdd = $this->$sMethod();

        foreach($aParamsAdd as $sParamAdd)
            if(isset($this->_aParams[$sParamAdd]))
                $aParams[$sParamAdd] = $this->_aParams[$sParamAdd];

        return [
            'module' => $sModule,
            'unit' => 'general-' . $sUnitType . '-' . $sUnit,
            'request_url' => !empty($this->aCurrent['api_request_url']) ? $this->aCurrent['api_request_url'] : '/api.php?r=' . $sModule . '/browse/&params[]=',
            'data' =>  $aData,
            'params' => $aParams
        ];
    }

    function addProcessingParamsAPI()
    {
        return ['author', 'category', 'context', 'joined_profile', 'followed_contexts', 'level'];
    }

    function decodeDataAPI ($a)
    {
        return $a;
    }

    /**
     * Get html output of search result
     * @return html code
     */
    function displayResultBlock ()
    {
        $aData = $this->getSearchData();

        $sCode = '';
        if (count($aData) > 0) {
            $sCode = $this->addCustomParts();
            foreach ($aData as $iKey => $aValue) {
                $sCode .= $this->displaySearchUnit($aValue);
            }
        }
        return $sCode;
    }

    /**
     * Get html output of empty search result
     * @return html code
     */
    function displayResultBlockEmpty ()
    {
        return MsgBox(_t($this->sDisplayEmptyMsgKey ? $this->sDisplayEmptyMsgKey : '_Empty'));
    }
            
    /**
     * Add different code before html output (usually redeclared)
     * no return result
     */
    function addCustomParts ()
    {

    }

    /**
     * Get XML string for rss output
     */
    function rss ()
    {
        if (!isset($this->aCurrent['rss']['fields']) || !isset($this->aCurrent['rss']['link']))
            return '';

        $aData = $this->getSearchData();
        $f = &$this->aCurrent['rss']['fields'];
        if ($aData) {
            foreach ($aData as $k => $a) {
                $aData[$k][$f['Link']] = $this->getRssUnitLink ($a);

                if(isset($f['Image']))
                    $aData[$k][$f['Image']] = $this->getRssUnitImage ($a, $f['Image']);
            }
        }

        $oRss = new BxDolRssFactory ();

        return $oRss->GenRssByCustomData(
            $aData,
            isset($this->aCurrent['rss']['title']) && $this->aCurrent['rss']['title'] ? $this->aCurrent['rss']['title'] : $this->aCurrent['title'],
            $this->aCurrent['rss']['link'],
            $this->aCurrent['rss']['fields'],
            isset($this->aCurrent['rss']['image']) ? $this->aCurrent['rss']['image'] : '',
            isset($this->aCurrent['rss']['profile']) ? $this->aCurrent['rss']['profile'] : 0
        );
    }

    /**
     * Output RSS XML with XML header
     */
    function outputRSS ()
    {
        header('Content-Type: text/xml; charset=UTF-8');
        echo $this->rss();
    }

    /**
     * Return rss unit link (redeclared)
     */
    function getRssUnitLink (&$a)
    {
        // override this functions to return permalink to rss unit
    }

	/**
     * Return rss unit image (redeclared)
     */
    function getRssUnitImage (&$a, $sField)
    {
        // override this functions to return image for rss unit
    }

    /**
     * Naming fields in query's body
     * @param string  $sFieldName  name of field
     * @param string  $sTableName  name of field's table
     *                             $param string $sOperator of field's calculation (like MAX)
     * @param boolean $bRenameMode indicator for renaming and unsetting fields from field of class $this->aPseud
     *                             return $sqlUnit sql code and unsetting elements from aPseud field
     */
    function setFieldUnit ($sFieldName, $sTableName, $sOperator = '', $bRenameMode = true)
    {
        $bOperator = !empty($sOperator);

        $sqlUnit  = "`$sTableName`.`$sFieldName`";
        if($bOperator)
            $sqlUnit = $sOperator . '(' . $sqlUnit . ')';

        if(!empty($this->aPseud) && $bRenameMode !== false && ($sKey = array_search($sFieldName . ($bOperator ? '_' . strtolower($sOperator) : ''), $this->aPseud)) !== false) {
            $sqlUnit .= " as `$sKey`";
            unset($this->aPseud[$sKey]);
        }

        return $sqlUnit . ', ';
    }

    /**
     * Get html code of of every search unit
     * @param array $aData array of every search unit
     *                     return html code
     */
    function displaySearchUnit ($aData)
    {

    }

    /**
     * Get html code of search box with search results
     * @param string $sCode html code of search results
     *                      $param $sPaginate html code of paginate
     *                      return html code
     */
    function displaySearchBox ($sCode, $sPaginate = '')
    {

    }

    /**
     * Get html code of pagination
     */
    function showPagination ($bAdmin = false, $bChangePage = true, $bPageReload = true)
    {

    }

    /**
     * Get array of data with search results
     * return array with data
     */
    function getSearchData ()
    {
        /**
         * @hooks
         * @hookdef hook-simple_search-before_get_data 'simple_search', 'before_get_data' - hook on before after get data 
         * - $unit_name - equals `simple_search`
         * - $action - equals `before_get_data` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [array] by ref, array of parameters, can be overridden in hook processing
         *      - `mode` - [string] search mode
         * @hook @ref hook-simple_search-before_get_data
         */
        bx_alert('simple_search', 'before_get_data', 0, false, [
            'object' => &$this->aCurrent, 
            'object_ref' => &$this->aCurrent, 
            'mode' => $this->_sMode
        ]);

        if(($this->aPseud = $this->_getPseudFromParam()) === false)
            $this->aPseud = $this->_getPseud();

        $this->setConditionParams();
        $aData = $this->aCurrent['paginate']['num'] > 0 ? $this->getSearchDataByParams() : [];

        /**
         * @hooks
         * @hookdef hook-simple_search-get_data 'simple_search', 'get_data' - hook on after get data 
         * - $unit_name - equals `simple_search`
         * - $action - equals `get_data` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [array] by ref, array of parameters, can be overridden in hook processing
         *      - `mode` - [string] search mode
         *      - `search_object` - [string] search object name
         * @hook @ref hook-simple_search-get_data
         */
        bx_alert('simple_search', 'get_data', 0, false, [
            'object' => &$this->aCurrent, 
            'object_ref' => &$this->aCurrent, 
            'mode' => $this->_sMode, 
            'search_results' => &$aData,
            'search_results_ref' => &$aData
        ]);

        return $aData;
    }

    /**
     * Get query [query, limit] for search results. Is used for combined search from different sections.
     * @param type $aParams array with params
     * @return type array with query and limit
     */
    function getSearchQuery($sObject, $aParams = [])
    {
        if(!is_array($aParams))
            $aParams = [];
        $aParams = array_merge($aParams, ['for_union' => true]);

        $this->aPseud = [
            'id' => !empty($this->aCurrent['ident']) ? $this->aCurrent['ident'] : 'id', 
            'added' => !empty($this->aCurrent['added']) ? $this->aCurrent['added'] : 'added'
        ];

        $this->setConditionParams();
        $aQuery = $this->getSearchDataByParams($aParams);

        /**
         * @hooks
         * @hookdef hook-simple_search-get_query 'simple_search', 'get_query' - hook on get sql queries
         * - $unit_name - equals `simple_search`
         * - $action - equals `get_query` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [array] by ref, array of parameters, can be overridden in hook processing
         *      - `mode` - [string] search mode
         *      - `search_object` - [string] search object name
         *      - `search_query` - [array] by ref, array of sql, can be overridden in hook processing
         * @hook @ref hook-simple_search-get_query
         */
        bx_alert('simple_search', 'get_query', 0, false, [
            'object' => &$this->aCurrent, 
            'object_ref' => &$this->aCurrent, 
            'mode' => $this->_sMode, 
            'search_object' => $sObject,
            'search_query' => &$aQuery,
            'search_query_ref' => &$aQuery
        ]);

        return $aQuery;
    }

    function getFieldsOwn()
    {
        return false;
    }

    function getFieldsJoin($sJoin)
    {
        return false;
    }

    /**
     * Get array with code for sql elements
     * @param $bRenameMode indicator of renmaing fields
     * return array with joinFields, ownFields, groupBy and join elements
     */
    function getJoins ($bRenameMode = true)
    {
        if(!isset($this->aCurrent['join']) || !is_array($this->aCurrent['join']))
            return false;

        $aSql = [
            'join' => '', 
            'ownFields' => '', 
            'joinFields' => '', 
            'groupBy' => '', 
            'groupHaving' => ''
        ];

        foreach($this->aCurrent['join'] as $sKey => $aValue) {
            $sAlias = isset($aValue['table_alias']) ? $aValue['table_alias'] : $aValue['table'];
            $sTableAlias = isset($aValue['table_alias']) ? " AS {$aValue['table_alias']} " : '';
            $sOperator = isset($aValue['operator']) ? $aValue['operator'] : null;

            // joinFields
            $aJoinFields = $this->getFieldsJoin($sKey);
            if($aJoinFields === false && !empty($aValue['joinFields']) && is_array($aValue['joinFields']))
                $aJoinFields = $aValue['joinFields'];

            if($aJoinFields)
                foreach($aJoinFields as $mixedField) {
                    list($sFldName, $sFldOperator) = is_array($mixedField) ? $mixedField : [$mixedField, $sOperator];

                    $aSql['joinFields'] .= $this->setFieldUnit($sFldName, $sAlias, $sFldOperator, $bRenameMode);
                }

            // group by
            if(isset($aValue['groupTable']))
                $aSql['groupBy'] .= "`{$aValue['groupTable']}`.`{$aValue['groupField']}`, ";

            // having
            if(isset($aValue['groupHaving']))
                $aSql['groupHaving'] .= $aValue['groupHaving'];

            $sOn = isset($aValue['mainTable']) ? $aValue['mainTable'] : $this->aCurrent['table'];
            $aSql['join'] .= " {$aValue['type']} JOIN `{$aValue['table']}` $sTableAlias ON " . (!empty($aValue['on_sql']) ? $aValue['on_sql'] : "`{$sAlias}`.`{$aValue['onField']}`=" . trim($this->setFieldUnit($aValue['mainField'], $sOn, isset($aValue['mainFieldFunc']) ? $aValue['mainFieldFunc'] : '', false), ", "));
            $aSql['ownFields'] .= $this->setFieldUnit($aValue['mainField'], $sOn, '', $bRenameMode);
        }

        $aSql['joinFields'] = trim($aSql['joinFields'], ', ');

        if(!empty($aSql['groupBy']))
            $aSql['groupBy'] = trim('GROUP BY ' . $aSql['groupBy'], ', ');

        if(!empty($aSql['groupHaving']))
            $aSql['groupHaving'] = 'HAVING ' . $aSql['groupHaving'];

        return $aSql;
    }

    /**
     * Concat sql parts of query, run it and return result array
     * @param $aParams addon param
     * return $aData multivariate array
     */
    function getSearchDataByParams ($aParams = '')
    {
        $bForUnion = isset($aParams['for_union']) && $aParams['for_union'] === true;

        $aSql = [
            'ownFields' => '', 
            'order' => ''
        ];

        // searchFields
        if($bForUnion) {
            $sTable = isset($this->aCurrent['tableSearch']) ? $this->aCurrent['tableSearch'] : $this->aCurrent['table'];

            $aSql['ownFields'] .= $this->setFieldUnit(!empty($this->aCurrent['ident']) ? $this->aCurrent['ident'] : 'id', $sTable);
            $aSql['ownFields'] .= $this->setFieldUnit(!empty($this->aCurrent['added']) ? $this->aCurrent['added'] : 'added', $sTable);
            $aSql['ownFields'] .= "'" . $this->getContentInfoName()  . "' AS `content_info`";
        }
        else {
            $aOwnFields = $this->getFieldsOwn();
            if($aOwnFields === false)
                $aOwnFields = $this->aCurrent['ownFields'];

            foreach($aOwnFields as $mixedField) {
                list($sFldName, $sFldOperator) = is_array($mixedField) ? $mixedField : [$mixedField, ''];

                $aSql['ownFields'] .= $this->setFieldUnit($sFldName, $this->aCurrent['table'], $sFldOperator);
            }
        }

        // joinFields & join
        if(($aJoins = $this->getJoins()) !== false) {
            if(!$bForUnion) {
                $aSql['ownFields'] .= $aJoins['ownFields'];
                $aSql['ownFields'] .= $aJoins['joinFields'];
            }

            $aSql['join'] = $aJoins['join'];
            $aSql['groupBy'] = $aJoins['groupBy'];
            $aSql['groupHaving'] = $aJoins['groupHaving'];
        }

        $aSql['ownFields'] = trim($aSql['ownFields'], ', ');

        // from
        $aSql['from'] = " FROM `{$this->aCurrent['table']}`";

        // where
        $aSql['where'] = $this->getRestriction();

        // limit
        $aSql['limit'] = $this->getLimit();

        // sorting
        $this->setSorting();

        $aSort = $this->getSorting($this->aCurrent['sorting']);
        foreach ($aSort as $sKey => $sValue)
            $aSql[$sKey] .= $sValue;

        // execution
        $sqlQuery = 'SELECT';

        if(isset($this->aCurrent['distinct']) && $this->aCurrent['distinct'] === true)
            $sqlQuery .= ' DISTINCT';

        $sqlQuery .= ' ' . $aSql['ownFields'];

        $sqlQuery .= ' ' . $aSql['from'];

        if (isset($aSql['join']))
            $sqlQuery .= ' ' . $aSql['join'];

        if (isset($aSql['where']))
            $sqlQuery .= ' ' . $aSql['where'];

        if (isset($aSql['groupBy']))
            $sqlQuery .= ' ' . $aSql['groupBy'];

        if (isset($aSql['groupHaving']))
            $sqlQuery .= ' ' . $aSql['groupHaving'];

        if($bForUnion)
            return [
                'query' => $sqlQuery, 
                'limit' => $aSql['limit']
            ];

        if (isset($aSql['order']))
            $sqlQuery .= ' ' . $aSql['order'];

        if (isset($aSql['limit']))
            $sqlQuery .= ' ' . $aSql['limit'];

        //echoDbg($sqlQuery);
        $aRes = BxDolDb::getInstance()->getAll($sqlQuery);
        return $aRes;
    }

    /**
     * Set class fields condition params and paginate array
     */
    function setConditionParams()
    {
        $this->aCurrent['paginate']['num'] = 0;

        // keyword
        $sKeyword = bx_process_input(isset($this->_aCustomSearchCondition['keyword']) ? $this->_aCustomSearchCondition['keyword'] : bx_get('keyword'));
        $bKeyword = !empty($sKeyword);

        if ($this->_bLiveSearch && !$bKeyword)
            return;

        if ($bKeyword) {
            if (substr($sKeyword, 0, 1) == '@') {
                $sModule = $this->aCurrent['module_name'];
                $sMethod = 'act_as_profile';
                if(!bx_is_srv($sModule, $sMethod) || !bx_srv($sModule, $sMethod))
                    return;

                $sKeyword = substr($sKeyword, 1);
            }

            $this->aCurrent['restriction']['keyword'] = array(
                'value' => $sKeyword,
                'field' => '',
                'operator' => 'against'
            );

            // for search results we need to show all items, not only public content
            $this->setProcessPrivateContent(true);
        }

        // owner
        if (isset($_GET['ownerName'])) {
            $sName = bx_process_input($_GET['ownerName']);
            $iUser = (int)BxDolProfileQuery::getInstance()->getIdByNickname($sName);
            BxDolMenu::getInstance()->setCurrentProfileID($iUser);
        } elseif (isset($_GET['userID']))
            $iUser = bx_process_input($_GET['userID'], BX_DATA_INT);

        if (!empty($iUser))
            $this->aCurrent['restriction']['owner']['value'] = $iUser;
        
        // meta info
        if ($this->_sMetaType && !empty($this->aCurrent['object_metatags'])) {
            $o = BxDolMetatags::getObjectInstance($this->aCurrent['object_metatags']);
            if ($o) {
                unset($this->aCurrent['restriction']['keyword']);

                $aLocationString = [];
                switch ($this->_sMetaType) {
                    case 'location_country':
                        $aLocationString['country'] = $sKeyword;
                        $o->locationsSetSearchCondition($this, $sKeyword);
                        break;
                    case 'location_country_state':
                        $aLocationString['country'] = $sKeyword;
                        $aLocationString['state'] = bx_process_input(isset($this->_aCustomSearchCondition['state']) ? $this->_aCustomSearchCondition['state'] : bx_get('state'));
                        $o->locationsSetSearchCondition($this, $sKeyword, $aLocationString['state']);
                        break;
                    case 'location_country_city':
                        $aLocationString['country'] = $sKeyword;
                        $aLocationString['state'] = bx_process_input(isset($this->_aCustomSearchCondition['state']) ? $this->_aCustomSearchCondition['state'] : bx_get('state'));
                        $aLocationString['city'] = bx_process_input(isset($this->_aCustomSearchCondition['city']) ? $this->_aCustomSearchCondition['city'] : bx_get('city'));
                        $o->locationsSetSearchCondition($this, $sKeyword, $aLocationString['state'], $aLocationString['city']);
                        break;
                    case 'location_state':
                        $aLocationString['state'] = $sKeyword;
                        $o->locationsSetSearchCondition($this, false, $sKeyword);
                        break;
                    case 'location_city':
                        $aLocationString['city'] = $sKeyword;
                        $o->locationsSetSearchCondition($this, false, false, $sKeyword);
                        break;
                    case 'mention':
                        $oCmts = !empty($this->sModuleObjectComments) ? BxDolCmts::getObjectInstance($this->sModuleObjectComments, 0, false) : false;
                        $o->mentionsSetSearchCondition($this, $sKeyword, $oCmts ? $oCmts->getSystemId() : 0);

                        if(($oProfile = BxDolProfile::getInstance((int)$sKeyword)) !== false)
                            $this->_setPageDescription('_sys_page_description_mention', $oProfile->getDisplayName(), $this->aCurrent['title']);
                        break;
                    case 'keyword':
                        $oCmts = !empty($this->sModuleObjectComments) ? BxDolCmts::getObjectInstance($this->sModuleObjectComments, 0, false) : false;
                        $o->keywordsSetSearchCondition($this, $sKeyword, $oCmts ? $oCmts->getSystemId() : 0);

                        $this->_setPageDescription('_sys_page_description_hashtag', $sKeyword, $this->aCurrent['title']);
                        break;
                }

                if(in_array($this->_sMetaType, ['location_country', 'location_country_state', 'location_country_city', 'location_state', 'location_city']))
                    $this->_setPageDescription('_sys_page_description_location', $o->locationsStringFromArray($aLocationString, false), $this->aCurrent['title']);
            }
        }

        // category
        if ($this->_sCategoryObject) {
            if(($o = BxDolCategory::getObjectInstance($this->_sCategoryObject)) && $this->_bSingleSearch) {
                if ($this->aCurrent['name'] == $o->getSearchObject()) {
                    unset($this->aCurrent['restriction']['keyword']);
                    $o->setSearchCondition($this, $sKeyword);
                }

                $this->_setPageDescription('_sys_page_description_category', $o->getCategoryTitle($sKeyword), $this->aCurrent['title']);
            }

            if ($this->_sCategoryObject == 'multi'){
                unset($this->aCurrent['restriction']['keyword']);
                $this->setCategoriesCondition($sKeyword);
            }
        }

        if($bKeyword && !$this->_sMetaType && !$this->_sCategoryObject)
            $this->_setPageDescription('_sys_page_description_keyword', $sKeyword, $this->aCurrent['title']);

        $this->setPaginate();
        $iNum = $this->getNum();
        if ($iNum > 0)
            $this->aCurrent['paginate']['num'] = $iNum;
    }

    /**
     * Check number of records on current page
     * return number of records on current page + 1
     */
    function getNum ()
    {
        $aJoins = $this->getJoins(false);
        $sqlQuery =  "SELECT * FROM `{$this->aCurrent['table']}` " . (isset($aJoins['join']) ? ' ' . $aJoins['join'] : '' ) . $this->getRestriction() . (isset($aJoins['groupBy']) ? ' ' . $aJoins['groupBy'] : '') . ' ' . $this->getLimit(true);
        return count(BxDolDb::getInstance()->getAll($sqlQuery));
    }

    /**
     * Get total number of records
     * return total number of records
     */
    function getTotal ()
    {
        $aJoins = $this->getJoins(false);
        $sqlQuery =  "SELECT COUNT(*) FROM `{$this->aCurrent['table']}` " . (isset($aJoins['join']) ? ' ' . $aJoins['join'] : '' ) . $this->getRestriction() . (isset($aJoins['groupBy']) ? ' ' . $aJoins['groupBy'] : '');
        return BxDolDb::getInstance()->getOne($sqlQuery);
    }

    /**
     * Check restriction params and make condition part of query
     * return $sqlWhere sql code of query for WHERE part
     */
    function getRestriction ()
    {
        $oDb = BxDolDb::getInstance();
        $sqlWhere = '';
        if (isset($this->aCurrent['restriction'])) {
            $aWhere[] = '1';
            foreach ($this->aCurrent['restriction'] as $sKey => $aValue) {
                $sqlCondition = '';
                if (isset($aValue['operator']) && isset($aValue['value']) && $aValue['value'] !== '' && $aValue['value'] !== false && $aValue['value'] !== null) {
                   $sFieldTable = isset($aValue['table']) ? $aValue['table'] : $this->aCurrent['table'];
                   $sqlCondition = "`{$sFieldTable}`.`{$aValue['field']}` ";
                   switch ($aValue['operator']) {
                       case 'empty value':
                            $sqlCondition .= " = '' ";
                            break;
                       case 'not empty value':
                            $sqlCondition .= " != '' ";
                            break;
                       case 'nothing':
                            $sqlCondition = " 0 ";
                            break;
                       case 'against':
                            $aCond = isset($aValue['field']) && strlen($aValue['field']) > 0 ? $aValue['field'] : $this->aCurrent['searchFields'];
                            $sqlCondition = !empty($aCond) ? $this->getSearchFieldsCond($aCond, $aValue['value']) : "";
                            break;
                       case 'like':
                            $sqlCondition .= "LIKE " . $oDb->escape('%' . $aValue['value'] . '%');
                            break;
                       case 'in':
                       case 'not in':
                            $sValuesString = $this->getMultiValues($aValue['value']);
                            $sqlCondition .= strtoupper($aValue['operator']) . '(' . $sValuesString . ')';
                            break;
                       case 'in_set':
                           $sqlCondition = "1 << (" . $sqlCondition . " - 1) & " . (int)$aValue['value'];
                           break;
                       default:
                               $sqlCondition .= $aValue['operator'] . (isset($aValue['no_quote_value']) && $aValue['no_quote_value'] ?  $aValue['value'] : $oDb->escape($aValue['value']));
                       break;
                    }
                }
                if (strlen($sqlCondition) > 0)
                    $aWhere[] = $sqlCondition;
            }
            $sqlWhere .= "WHERE ". implode(' AND ', $aWhere) . (isset($this->aCurrent['restriction_sql']) ? $this->aCurrent['restriction_sql'] : '');
        }

        return $sqlWhere;
    }

    /**
     * Get limit part of query
     * return $sqlFrom code for limit part pf query
     */
    function getLimit ($isAddPlusOne = false)
    {
        if (!isset($this->aCurrent['paginate']))
            return;

        $sqlFrom = (int)$this->aCurrent['paginate']['start'] > 0 ? (int)$this->aCurrent['paginate']['start'] : 0;
        $sqlTo = $this->aCurrent['paginate']['perPage'] + ($isAddPlusOne ? 1 : 0);
        if ($sqlTo > 0)
            return 'LIMIT ' . $sqlFrom . ', ' . $sqlTo;
    }

    /**
     * Set sorting field of class
     */
    function setSorting ()
    {
        $this->aCurrent['sorting'] = isset($_GET[$this->aCurrent['name'] . '_mode']) ? $_GET[$this->aCurrent['name'] . '_mode'] : $this->aCurrent['sorting'];
    }

    /**
     * Get sorting part of query according current sorting mode
     * @param string $sSortType sorting type
     *                          return array with sql elements order and ownFields
     */
    function getSorting ($sSortType = 'last')
    {
        if (isset($this->aCurrent['sorting_sql']))
            return array('order' => $this->aCurrent['sorting_sql']);
        
        $aOverride = $this->getAlterOrder();
        if (is_array($aOverride) && !empty($aOverride))
            return $aOverride;

       $aSql = array();
       switch ($sSortType) {
           case 'rand':
                $aSql['order'] = "ORDER BY RAND()";
                break;
           case 'score':
                if (is_array($this->aCurrent['restriction']['keyword'])) {
                    $sPseud = '';
                    if ('on' == getParam('useLikeOperator')) {
                        $aSql['order'] = "ORDER BY `score` DESC";
                        $sPseud = 'score';
                    }
                    $aSql['ownFields'] .= $this->getSearchFieldsCond($this->aCurrent['searchFields'], $this->aCurrent['restriction']['keyword']['value'], $sPseud) . ',';
                }
                break;
           case 'none':
                $aSql['order'] = "";
                break;
           default:
                $aSql['order'] = "ORDER BY `date` DESC";
        }
        return $aSql;
    }

    /**
     * Return own varaint for sorting (redeclare if necessary)
     * return array of sql elements
     */
    function getAlterOrder ()
    {
        return array();
    }

    /**
     * Set paginate fields of class according GET params 'start' and 'per_page'
     * forcePage is need for setting most important number of current page
     */
    function setPaginate ()
    {
        $iStart = 0;
        $iPerPage = 0;

        //--- Check in aCurrent (low priority).
        if(isset($this->aCurrent['paginate']['perPage']) && (int)$this->aCurrent['paginate']['perPage'] != 0)
            $iPerPage = (int)$this->aCurrent['paginate']['perPage'];
        
        //--- Check in aParams (middle priority).
        if(isset($this->_aParams['per_page']) && (int)$this->_aParams['per_page'] != 0)
            $iPerPage = (int)$this->_aParams['per_page'];

        //--- Check in GET params (high priority).
        if(isset($_GET['per_page']) && (int)$_GET['per_page'] != 0)
            $iPerPage = (int)$_GET['per_page'];

        //--- Trying to get from System settings.
        if (empty($iPerPage))
            $iPerPage = (int)getParam('sys_per_page_search_keyword_' . ($this->_bSingleSearch ? 'single' : 'plural'));

        //--- Use default value in case of emergency.
        if (empty($iPerPage))
            $iPerPage = BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT;
        
        if ($this->iPaginatePerPage != BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT)
            $iPerPage = $this->iPaginatePerPage;

        $this->aCurrent['paginate']['perPage'] = $iPerPage;

        if(!isset($this->aCurrent['paginate']['forceStart'])) {
            if(isset($this->_aParams['start']))
                $iStart = (int)$this->_aParams['start'];

            if(($iStartGet = bx_get('start')) !== false)
                $iStart = (int)$iStartGet;
        }
        else
            $iStart = (int)$this->aCurrent['paginate']['forceStart'];

        if($iStart < 0)
            $iStart = 0;

        $this->aCurrent['paginate']['start'] = $iStart;
    }

    function unsetPaginate()
    {
    	unset($this->aCurrent['paginate']);
    }

    /**
     * Get sql where condition for search fields
     * @param array of search fields
     * @param string $sKeyword keyword value for search
     * @param string sPseud for setting new name for generated set of fields in query
     *                         return sql code of WHERE part in query
     */
    function getSearchFieldsCond ($aFields, $sKeyword, $sPseud = '')
    {
        if (!$sKeyword)
            return '';

        $sTable = empty($this->aCurrent['tableSearch']) ? $this->aCurrent['table'] : $this->aCurrent['tableSearch'];

        $oDb = BxDolDb::getInstance();

        $bLike = getParam('useLikeOperator');

        if (!is_array($aFields))
            $aFields = array($aFields);

        if ($bLike == 'on') {
            $sKeyword = $oDb->escape('%' . preg_replace('/\s+/', '%', $sKeyword) . '%');

            $sSqlWhere = '';
            foreach ($aFields as $sValue)
                $sSqlWhere .= "`{$sTable}`.`$sValue` LIKE  " . $sKeyword . " OR ";

            $sSqlWhere = '(' . trim($sSqlWhere, 'OR ') . ')';

        } else {
        	$sKeyword = $oDb->escape($sKeyword);

            $sSqlWhere = '';
            foreach ($aFields as $sValue)
                $sSqlWhere .= "`{$sTable}`.`$sValue`, ";

            $sSqlWhere = trim($sSqlWhere, ', ');
            $sSqlWhere = " MATCH({$sSqlWhere}) AGAINST (" . $sKeyword . ") ";

            if (!empty($sPseud))
                $sSqlWhere .= " AS `$sPseud` ";
        }

        return $sSqlWhere;
    }

    /**
     * Get set from several values for 'in' and 'not in' operators
     * @param $aValues array of values
     * return sql code for field with operator IN (NOT IN)
     */
    function getMultiValues ($aValues)
    {
        $oDb = BxDolDb::getInstance();
        return $oDb->implode_escape($aValues);
    }

    /**
     * System method for filling aPseud array. Fill field aPseud for current class from system option.
     * It may be useful when Fields are taken from system option too.
     */
    function _getPseudFromParam ()
    {
        return false;
    }

    /**
     * System method for filling aPseud array.
     * Fill field aPseud for current class (if you will use own getSearchUnit methods then not necessary to redeclare).
     */
    function _getPseud ()
    {

    }

    /**
     * Add replace markers. Markers are replaced in titles and browse urls
     * @param $a array of markers as key => value
     * @return true on success or false on error
     */
    public function addMarkers ($a)
    {
        if (empty($a) || !is_array($a))
            return false;
        $this->_aMarkers = array_merge ($this->_aMarkers, $a);
        return true;
    }

    /**
     * Replace provided markers in a string
     * @param $mixed string or array to replace markers in
     * @return string where all occured markers are replaced
     */
    protected function _replaceMarkers ($mixed)
    {
        return bx_replace_markers($mixed, $this->_aMarkers);
    }

    protected function _setPageDescription()
    {
        $aArgs = func_get_args();

        if($this->_bSingleSearch)
            $aArgs[0] .= '_in_section';

        BxDolTemplate::getInstance()->setPageDescription(call_user_func_array('_t', $aArgs));
    }
}

/** @} */
