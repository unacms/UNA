<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Category object, it can make regular form lists to act as categories by making it clickable and display search results with all contents with the same category.
 * Also it provides services to list all categories with number if items in each category.
 *
 * @section editor_create Creating the Category object:
 *
 *
 * Add record to 'sys_objects_category' table:
 *
 * - object: name of the category object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing; 
 * - search_object: associated search object to display search results in 
 * - form_object: form object which displays this category, so category will be transformed to the clickable url
 * - list_name: form list name which values are used to populate categories from
 * - table: table where category value is stores
 * - field: table field name where category value is stored
 * - join: custom SQL JOIN to use when getting number of items in the particular category (filter inactive items here)
 * - where: custom SQL WHERE to use when getting number of items in the particular category (filter inactive items here)
 * - override_class_name: user defined class name which is derived from 'Templ' class.
 * - override_class_file: the location of the user defined class, leave it empty if class is located in system folders.
 *
 */
class BxDolCategory extends BxDolFactory implements iBxDolFactoryObject
{
    protected $_bIsApi;

    protected $_sObject;
    protected $_aObject;

    /**
     * Constructor
     * @param $aObject array of editor options
     */
    protected function __construct($aObject)
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->_sObject = $aObject['object'];
        $this->_aObject = $aObject;
    }

    /**
     * Get category object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject = false)
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolCategory!'.$sObject]))
            return $GLOBALS['bxDolClasses']['BxDolCategory!'.$sObject];

        $aObject = BxDolCategoryQuery::getCategoryObject($sObject);
        if (!$aObject || !is_array($aObject))
            return false;

        $sClass = 'BxTemplCategory';
        if (!empty($aObject['override_class_name']))
            $sClass = $aObject['override_class_name'];
        if (!empty($aObject['override_class_file']))
            require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);

        $o = new $sClass($aObject);

        return ($GLOBALS['bxDolClasses']['BxDolCategory!'.$sObject] = $o);
    }

    /**
     * Get category object instance by form object and list name
     * @param $sObjectForm form object name
     * @patam $sListName list name
     * @return object instance or false on error
     */
    static public function getObjectInstanceByFormAndList($sObjectForm, $sListName)
    {
        $aObject = BxDolCategoryQuery::getCategoryObjectByFormAndList($sObjectForm, $sListName);
        if(empty($aObject) || !is_array($aObject))
            return false;

        return self::getObjectInstance($aObject['object']);
    }

    /**
     * Get object name 
     */
    public function getObjectName()
    {
        return $this->_sObject;
    }

    /**
     * Get search object associated with category object
     */
    public function getSearchObject()
    {
        return $this->_aObject['search_object'];
    }

    /**
     * Set condition for search results object for category object
     * @param $oSearchResult search results object
     * @param $mixedCategory category
     */
    public function setSearchCondition($oSearchResult, $mixedCategory)
    {
        $oSearchResult->aCurrent['restriction']['category_' . $this->_sObject] = array(
            'value' => $mixedCategory,
            'field' => $this->_aObject['field'],
            'operator' => '=',
            'table' => $this->_aObject['table'],
        );
    }

    /**
     * Get number of items in the specified category
     * @param $sCategoryValue category value
     * @return number
     */
    public function getItemsNum($sCategoryValue, $aParams = [])
    {
        return BxDolCategoryQuery::getItemsNumInCategory ($this->_aObject, $sCategoryValue, true, $aParams);
    }

    /**
     * Get number of items in every category at once (one query)
     * @return array category value => number, categories without items left out
     */
    public function getItemsNums($aParams = [])
    {
        return BxDolCategoryQuery::getItemsNumsInCategories ($this->_aObject, true, $aParams);
    }
}

/** @} */
