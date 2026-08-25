<?php
require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

check_logged();

$oTemplate = BxDolTemplate::getInstance();
$oTemplate->setPageNameIndex(BX_PAGE_DEFAULT);
$oTemplate->setPageHeader("AI Chat");
$oTemplate->setPageContent('page_main_code', PageCompMainCode());
$oTemplate->getPageCode();

function PageCompMainCode()
{
    ob_start();
?>
<div id="bx-ai-chat" class="h-[32rem]"></div>
<script>
    una.Chat.init('#bx-ai-chat', { agentId: 1 });
</script>
<?php
    return DesignBoxContent("AI Chat", ob_get_clean(), BX_DB_PADDING_DEF);
}