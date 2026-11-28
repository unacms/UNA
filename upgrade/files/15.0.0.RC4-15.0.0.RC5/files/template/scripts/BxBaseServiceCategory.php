<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Services for category objects functionality - @see BxDolCategory
 */
class BxBaseServiceCategory extends BxDol
{

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-categories Categories
     * @subsubsection bx_system_general-categories_list categories_list
     * 
     * @code bx_srv('system', 'categories_list', ["bx_posts_cats", ["show_empty_categories" => true]], 'TemplServiceCategory'); @endcode
     * @code {{~system:categories_list:TemplServiceCategory["bx_posts_cats", {"show_empty_categories":true}]~}} @endcode
     * 
     * Get categories list.
     * @param $sObject categories object name
     * @param $aParams additional params:
     *              - show_empty
     *              - show_empty_categories
     * 
     * @see BxBaseServiceCategory::serviceCategoriesList
     */
    /** 
     * @ref bx_system_general-categories_list "categories_list"
     */
    public function serviceCategoriesList ($sObject, $aParams = array())
    {
    	$bShowEmpty = isset($aParams['show_empty']) ? (bool)$aParams['show_empty'] : false;
    	$bShowEmptyCategories = isset($aParams['show_empty_categories']) ? (bool)$aParams['show_empty_categories'] : false;

        // The apps get no block without categories ("Show empty" is the site's message box).
        $mixedEmpty = bx_is_api() ? [] : ($bShowEmpty ? MsgBox(_t('_Empty')) : '');

        if (!($o = BxDolCategory::getObjectInstance($sObject)))
            return $mixedEmpty;
        
		$sResult = $o->getCategoriesList($bShowEmptyCategories);
		if(empty($sResult))
			return $mixedEmpty;

        return $sResult;
    }
}

/** @} */
