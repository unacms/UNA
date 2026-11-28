<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Wiki Wiki
 * @ingroup     UnaModules
 *
 * @{
 */

class BxWikiModule extends BxDolModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function serviceGetSafeServices()
    {
        return array (
            'Contents' => '',
            'MissingTranslations' => '',
            'OutdatedTranslations' => '',
        );
    }

    /**
     * @see BxDolModule::serviceGetMacroServices
     */
    public function serviceGetMacroServices()
    {
        return array_merge(parent::serviceGetMacroServices(), [
            'Contents' => '',
            'MissingTranslations' => '',
            'OutdatedTranslations' => '',
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_wiki Wiki
     * @subsection bx_wiki-macros Macros
     * @subsubsection bx_wiki-contents contents
     * 
     * @code bx_srv('bx_wiki', 'contents'); @endcode
     * @code {{~bx_wiki:contents~}} @endcode
     * 
     * Wiki contents - list of pages
     * @param $sAllExceptSpecified optional comma separated list of URIs of pages to filter out
     * @param $sOnlySpecified optional comma separated list of URIs of pages to show only
     *
     * @see BxWikiModule::serviceContents
     */
    /** 
     * @ref bx_wiki-contents "contents"
     */
    public function serviceContents ($sAllExceptSpecified = '', $sOnlySpecified = '')
    {
        if (!($oWiki = BxDolWiki::getObjectInstance($this->getName())))
            return '';
        
        return $oWiki->getContents($sAllExceptSpecified, $sOnlySpecified);
    }

    /**
     * @page service Service Calls
     * @section bx_wiki Wiki
     * @subsection bx_wiki-macros Macros
     * @subsubsection bx_wiki-missing_translations missing_translations
     * 
     * @code bx_srv('bx_wiki', 'missing_translations'); @endcode
     * @code {{~bx_wiki:missing_translations["ru"]~}} @endcode
     * 
     * Get list of blocks with missing translations
     * @param $sLang language to get missing translations for
     *
     * @see BxWikiModule::serviceMissingTranslations
     */
    /** 
     * @ref bx_wiki-missing_translations "missing_translations"
     */
    public function serviceMissingTranslations ($sLang)
    {
        if (!($oWiki = BxDolWiki::getObjectInstance($this->getName())))
            return '';
        
        return $oWiki->getMissingTranslations($sLang);
    }

    /**
     * @page service Service Calls
     * @section bx_wiki Wiki
     * @subsection bx_wiki-macros Macros
     * @subsubsection bx_wiki-outdated_translations outdated_translations
     * 
     * @code bx_srv('bx_wiki', 'outdated_translations'); @endcode
     * @code {{~bx_wiki:outdated_translations["ru"]~}} @endcode
     * 
     * Get list of blocks with outdated translations
     * @param $sLang language to get outdated translations for
     *
     * @see BxWikiModule::serviceOutdatedTranslations
     */
    /** 
     * @ref bx_wiki-outdated_translations "outdated_translations"
     */
    public function serviceOutdatedTranslations ($sLang)
    {
        if (!($oWiki = BxDolWiki::getObjectInstance($this->getName())))
            return '';
        
        return $oWiki->getOutdatedTranslations($sLang);
    }
}

/** @} */
