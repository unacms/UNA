<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */
require_once('./inc/header.inc.php');

$aEmbedData = BxDolPage::getEmbedData(bx_get('url'));
if(empty($aEmbedData)){
    header('HTTP/1.0 404 Not Found');
    header('Status: 404 Not Found');
    exit();
}    
$aResult = [
    'version' => '1.0',
    'type' => 'rich',
    'title' => $aEmbedData['title'],
    'url' => $aEmbedData['url'],
    'provider_name' => getParam('site_title'),
    'provider_url' => BX_DOL_URL_ROOT,
    'html' => $aEmbedData['html'],
];
        
if ($aEmbedData['thumbnail_url']){
    $aResult['thumbnail_url'] = $aEmbedData['thumbnail_url'];

    // oEmbed requires the dimensions to be present whenever the thumbnail is, and they are known
    // for a share card - it is always the same size, whatever the entry it describes
    if (!empty($aEmbedData['thumbnail_width']) && !empty($aEmbedData['thumbnail_height'])) {
        $aResult['thumbnail_width'] = (int)$aEmbedData['thumbnail_width'];
        $aResult['thumbnail_height'] = (int)$aEmbedData['thumbnail_height'];
    }
}
if ($aEmbedData['author_name']){
    $aResult['author_name'] =  $aEmbedData['author_name'];
}
if ($aEmbedData['author_url']){
    $aResult['author_url'] =  $aEmbedData['author_url'];
}
        
header('Content-Type: application/json; charset=utf-8');
        
echo json_encode($aResult);
