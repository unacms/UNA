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
 * @section ajax AJAX loader
 */

$aPathInfo = pathinfo(__FILE__);
require_once ($aPathInfo['dirname'] . '/../inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");


if  (bx_get('ajax') || (isset( $_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest')) {
    sleep(3);
    echo '<div class="bx-def-padding bx-def-color-bg-block">AJAX content here: ' .  bx_time_js(time(), BX_FORMAT_DATE_TIME, rand(0, 1)) . '</div>';
    exit;
}

$oTemplate = BxDolTemplate::getInstance();
$oTemplate->addJs('jquery.webForms.js');
$oTemplate->setPageNameIndex (BX_PAGE_DEFAULT);
$oTemplate->setPageHeader ("AJAX");
$oTemplate->setPageContent ('page_main_code', PageCompMainCode());
$oTemplate->getPageCode();

/**
 * page code function
 */
function PageCompMainCode()
{
    ob_start();
?>
    <script>
    function ajaxTest(e)
    {
        bx_loading_btn(e, 1);
        getHtmlData('bx-result', 'samples/ajax.php?ajax=1', function () {
            bx_loading_btn(e, 0);
        });
    }
    </script>
    <button class="bx-btn" onclick="getHtmlData('bx-result', 'samples/ajax.php?ajax=1')">Click me</button>
    <button class="bx-btn bx-def-margin-left" onclick="ajaxTest(this)">And me!</button>

    <div class="bx-clear"></div>

    <div id="bx-result" style="width:500px; height:200px;" class="bx-def-border bx-def-round-corners bx-def-margin-top"></div>
<?php
    return DesignBoxContent("AJAX", ob_get_clean(), BX_DB_PADDING_DEF);
}

/** @} */
