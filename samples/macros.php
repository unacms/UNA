<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreSamples Samples
 * @{
 */

/**
 * @page samples
 * @section macros Macros list
 */

/**
 * This sample shows list of all available macros with links to the documentation
 */

require_once('./../inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

$oTemplate = BxDolTemplate::getInstance();
$oTemplate->setPageNameIndex (BX_PAGE_DEFAULT);
$oTemplate->setPageHeader ("Macros List");
$oTemplate->setPageContent ('page_main_code', PageCompMainCode());
$oTemplate->getPageCode();

/**
 * page code function
 */
function PageCompMainCode()
{
    ob_start();

    $aBaseClasses = array(
        'BxBaseModGeneralModule' => 'bx_base_general',
        'BxBaseServices' => 'bx_system_general',
        'BxBaseServiceAccount' => 'bx_system_general',
        'BxBaseServiceCategory' => 'bx_system_general',
        'BxBaseServiceLogin' => 'bx_system_general',
        'BxBaseServiceMetatags' => 'bx_system_general',
        'BxBaseServiceProfiles' => 'bx_system_general',
        'BxBaseChartServices' => 'bx_system_general',
        'BxBasePaymentsServices' => 'bx_system_general',
    );

    $o = BxDolModuleQuery::getInstance();
    $aModules = $o->getModules();
    foreach ($aModules as $aModule) {
        $oModule = BxDolModule::getInstance($aModule['name']);
        if (!$oModule)
            continue;
        $oModuleReflection = new ReflectionClass(get_class($oModule));

        // macros may call only what the module's macro list allows (BxDolService::isMacroService)
        $a = bx_srv($aModule['name'], 'get_macro_services');
        if (!$a)
            continue;
        echo '<h3>' . $aModule['title'] . '</h3>';
        echo '<p>';
        foreach ($a as $sService => $mixedClass) {
            // a list value is a class name, '' for the module class, or an array of class names
            $sClass = is_array($mixedClass) ? (string)reset($mixedClass) : (string)$mixedClass;
            $oModuleReflection = new ReflectionClass(get_class($oModule));
            if ($sClass) {
                if (0 === strncmp('BxPayment', $sClass, 9))
                    bx_import(substr($sClass, 9), 'bx_payment');
                $oModuleReflection = new ReflectionClass($sClass);
            }

            if (!$oModuleReflection->hasMethod('service' . $sService))
                continue;
            $oMethodReflection = $oModuleReflection->getMethod('service' . $sService);
            $sDeclaringClass = $oMethodReflection->getDeclaringClass()->getName();
            
            $sService = trim(preg_replace_callback('/[A-Z]/', function ($aMatches) {
                return '_' . strtolower($aMatches[0]);
            }, $sService), '_');

            $sModule = isset($aBaseClasses[$sDeclaringClass]) ? $aBaseClasses[$sDeclaringClass] : $aModule['name'];

            echo '<a href="https://ci.una.io/docs/service.html#' . $sModule . '-' . $sService . '">';
            echo '{{~' . $aModule['name']  . ':' . $sService . '[...]~}}';
            echo '</a><br />';
        }
        echo '</p>';
    }

    $s = ob_get_clean();
    return DesignBoxContent("Macros List", $s, BX_DB_PADDING_DEF);
}

/** @} */
