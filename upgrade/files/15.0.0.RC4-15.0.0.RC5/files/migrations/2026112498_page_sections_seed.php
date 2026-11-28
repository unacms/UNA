<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Pages: each section's cover and title settings from its pages' current values, so that nothing looks different
 * (BxDolPage::getSectionSeed): the value most of its pages have, the home page's on a tie, the title as the cover
 * where any page's follows it. A page that has its section's value then takes it from the section ("Same as
 * section", NULL); a page set apart in Studio (People's Home with its cover off) keeps its own as an override.
 * A section that already has settings (from an earlier run, or saved in Studio) keeps them: only its matching pages
 * are set to take them. Sections come from the installed modules' menus (BxDolPageQuery::getSectionsWithPages).
 */

foreach(BxDolPageQuery::getSectionsWithPages() as $sSection => $aSection) {
    $aPages = BxDolPageQuery::getPagesSectionSettings(array_keys($aSection['pages']));
    if(empty($aPages))
        continue;

    // In the section's order (getSectionsWithPages), the home page first on a tie.
    $aOrdered = [];
    foreach(array_keys($aSection['pages']) as $sObject)
        if(isset($aPages[$sObject]))
            $aOrdered[$sObject] = $aPages[$sObject];

    $aRow = BxDolPageQuery::getSection($sSection);
    if(empty($aRow)) {
        $sHome = (string)array_search($aSection['home'], $aSection['pages'], true);
        $aRow = BxDolPage::getSectionSeed($aOrdered, $sHome);

        $aValues = $aRow;
        $aValues['cover_hidden_on'] = $aValues['cover_hidden_on'] ? (string)$aValues['cover_hidden_on'] : '';
        if($aValues['title_hidden_on'] !== null)
            $aValues['title_hidden_on'] = (string)$aValues['title_hidden_on'];

        if(!BxDolPageQuery::setSection($sSection, $aSection['module'], $aValues))
            return false;
    }

    foreach(BxDolPage::getSectionPagesMatching($aOrdered, $aRow) as $sObject => $aFields)
        if(!BxDolPageQuery::setPageFieldsToSection((int)$aOrdered[$sObject]['id'], $aFields))
            return false;
}

return true;
