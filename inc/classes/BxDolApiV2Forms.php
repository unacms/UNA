<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * What API v2 endpoints need of the site's forms when they save through a module's own services.
 */
class BxDolApiV2Forms
{
    /**
     * Values as the form's db pass keeps what it saves: the site's HTML filter for a text
     * (`XssHtml`), `Xss` for a title, `Int` and so on. An input without a pass gets the form's
     * default one (`Xss`). A pass is not always safe to run twice (dates): call it once per value.
     *
     * For what a value will be once saved (to check it or compare it with the stored one). The
     * edit service (serviceEditEntity) runs these passes itself, so give it the values as they
     * came, not these: see changed().
     *
     * @param BxDolForm|false|null $oForm the module's edit form, of the display the service is given
     * @param array $aValues field => value
     * @return array the same fields, passed
     */
    public static function dbPassed($oForm, $aValues)
    {
        if (!$oForm || !$aValues)
            return $aValues;
        $oChecker = new BxDolFormChecker($oForm->aParams['checker_helper'] ?? '');
        $oChecker->setFormMethod(BX_DOL_FORM_METHOD_SPECIFIC, $aValues);
        foreach (array_keys($aValues) as $sField) {
            $aDb = $oForm->aInputs[$sField]['db'] ?? [];
            $aValues[$sField] = $oChecker->get($sField, is_array($aDb) && !empty($aDb['pass']) ? $aDb['pass'] : 'Xss', is_array($aDb) && !empty($aDb['params']) ? $aDb['params'] : []);
        }
        return $aValues;
    }

    /**
     * A module's edit_entity service (serviceEditEntity) for an API v2 edit: the form takes a
     * file field's single value for the one file the entry stores (setFilesAsStored), not for
     * every file of the entry, which is how the site and API v1 read it. Without it a text edit
     * of a profile gives it each of its old pictures in turn.
     *
     * @param BxBaseModGeneralModule $oModule the module of the entry
     * @param array $aValues field => value, as the caller sent them
     * @return string the service's answer: an error message, empty when it saved
     */
    public static function editEntity($oModule, $iContentId, $aValues, $sDisplay = false)
    {
        $oForm = $oModule->getFormsHelper()->getObjectFormEdit($sDisplay);
        $bSet = $oForm && method_exists($oForm, 'setFilesAsStored');
        if ($bSet)
            $oForm->setFilesAsStored(true);
        try {
            return $oModule->serviceEditEntity($iContentId, $aValues, $sDisplay);
        }
        finally {
            if ($bSet)
                $oForm->setFilesAsStored(false);
        }
    }

    /**
     * The values, as they came, that would change what is stored: a value whose passed form
     * (dbPassed) is what the content has already is left out, since a module's edit says it
     * failed when no row changes. A field the content has no column for is kept.
     *
     * @param BxDolForm|false|null $oForm the module's edit form, of the display the service is given
     * @param array $aValues field => value, as the caller sent them
     * @param array $aContent the stored content row
     * @return array field => value, as the caller sent them
     */
    public static function changed($oForm, $aValues, $aContent)
    {
        $aPassed = self::dbPassed($oForm, $aValues);
        return array_filter($aValues, function ($sField) use ($aPassed, $aContent) {
            return !array_key_exists($sField, $aContent) || (string)$aContent[$sField] !== (string)$aPassed[$sField];
        }, ARRAY_FILTER_USE_KEY);
    }
}

/** @} */
