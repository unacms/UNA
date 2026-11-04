<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_MANIFEST', true);

require_once('./inc/header.inc.php');

$aPwa = BxDolDesigns::getPwaSettings();

$aContent = [
    'name' => $aPwa['name']['used'],
    'short_name' => $aPwa['short_name']['used'],
    'description' => $aPwa['description']['used'],
    'orientation' => 'portrait',
    'start_url' => parse_url(BX_DOL_URL_ROOT, PHP_URL_PATH),
    'display' => 'standalone',
    'scope' => '/',
    'background_color' => $aPwa['background_color']['used'],
    'theme_color' => $aPwa['theme_color']['used'],
    'gcm_sender_id' => isLogged() ? '482941778795' : ''
];

foreach($aContent as $sKey => $sValue)
    if(empty($sValue))
        unset($aContent[$sKey]);

$aAdi = [];

/*
 * Apple device icons
 */
if(($iId = (int)getParam('sys_site_icon_apple')) != 0) {
    $oTranscoder = BxDolTranscoderImage::getObjectInstance(BX_DOL_TRANSCODER_OBJ_ICON_APPLE);

    $sSizes = '180x180';
    if(($aTranscoderParams = $oTranscoder->getFilterParams('Resize')) !== false)
        $sSizes = $aTranscoderParams['w'] . 'x' . $aTranscoderParams['h'];

    $aAdi[] = [
        'src' => $oTranscoder->getFileUrl($iId), 
        'type' => $oTranscoder->getFileMimeType($iId), 
        'sizes' => $sSizes
    ];
}

/*
 * Android device icons
 */
if(($iId = (int)getParam('sys_site_icon_android')) != 0) {
    $oTranscoder = BxDolTranscoderImage::getObjectInstance(BX_DOL_TRANSCODER_OBJ_ICON_ANDROID);

    $sSizes = '192x192';
    if(($aTranscoderParams = $oTranscoder->getFilterParams('Resize')) !== false)
        $sSizes = $aTranscoderParams['w'] . 'x' . $aTranscoderParams['h'];

    $aAdi[] = [
        'src' => $oTranscoder->getFileUrl($iId), 
        'type' => $oTranscoder->getFileMimeType($iId), 
        'sizes' => $sSizes
    ];
}

if(($iId = (int)getParam('sys_site_icon_android_splash')) != 0) {
    $oTranscoder = BxDolTranscoderImage::getObjectInstance(BX_DOL_TRANSCODER_OBJ_ICON_ANDROID_SPLASH);

    $sSizes = '512x512';
    if(($aTranscoderParams = $oTranscoder->getFilterParams('Resize')) !== false)
        $sSizes = $aTranscoderParams['w'] . 'x' . $aTranscoderParams['h'];

    $aAdi[] = [
        'src' => $oTranscoder->getFileUrl($iId), 
        'type' => $oTranscoder->getFileMimeType($iId), 
        'sizes' => $sSizes
    ];
}

/*
 * Android defaults: the 192 and 512 icons home screens and the launch screen need (template/images/icons, or the template's own).
 */
$oTemplate = BxDolTemplate::getInstance();
foreach(['sys_site_icon_android' => ['android-icon-192.png', '192x192'], 'sys_site_icon_android_splash' => ['android-icon-512.png', '512x512']] as $sSetting => $aDefault)
    if((int)getParam($sSetting) == 0 && ($sUrl = $oTemplate->getIconUrl($aDefault[0])) != '')
        $aAdi[] = [
            'src' => $sUrl,
            'type' => 'image/png',
            'sizes' => $aDefault[1]
        ];

if(!empty($aAdi) && is_array($aAdi))
    $aContent['icons'] = $aAdi;

header("Content-Type: application/json");
header("X-Robots-Tag: none");
echo json_encode($aContent);
?>
