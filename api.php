<?php

define('BX_API', true);

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "profiles.inc.php");
require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

bx_import('BxDolLanguages');

header('Content-Type: application/json');

bx_api_check_access();

if (bx_get('cnf') ){
   $sCnf = getParam('sys_api_config');
   echo json_encode(['data' => $sCnf, 'hash' => md5($sCnf)]);
   exit();
}

if(($sGooType = bx_get('goo')) !== false && ($oLf = BxDolLocationField::getObjectInstance('sys_google')) !== false) {
    $aResponse = false;
    switch($sGooType) {
        case 'list': 
            if(($sValue = bx_get('input')) === false)
                break;

            $aResponse = $oLf->getAutocomplete($sValue);
            break;
        
        case 'place': 
            if(($sPlaceId = bx_get('place_id')) === false)
                break;
            
            $aResponse = $oLf->getPlace($sPlaceId);
            if(empty($aResponse) || !is_array($aResponse))
                break;

            $aLocation = $aResponse['geometry']['location'];
            $aAddress = $aResponse['address_components'];

            $oFind = function($sType) use ($aAddress) {
                foreach($aAddress as $aItem) {
                    if(in_array($sType, $aItem['types']))
                        return trim($aItem['short_name']);
                }

                return '';
            };

            $aResponse = [
                'lat' => $aLocation['lat'],
                'lng' => $aLocation['lng'],
                'location_string'=> $aResponse['formatted_address'],
                'country' => $oFind('country'),
                'state' => $oFind('administrative_area_level_1'),
                'city' => $oFind('locality')?: $oFind('administrative_area_level_2'),
                'street' => $oFind('route'),
                'street_number' => $oFind('street_number'),
                'zip' => $oFind('postal_code'),
            ];
            break;
    }

    if(!$aResponse)
        $aResponse = ['error' => _t('_sys_location_undefined')];

    echo json_encode($aResponse);
    exit;
}

$aRequest = isset($_GET['r']) ? explode('/', $_GET['r']) : [];

$a = ['sModule', 'sMethod', 'sClass'];
foreach ($aRequest as $i => $v)
    if (isset($a[$i]) && preg_match('/^[A-Za-z0-9_-]+$/', $v))
        ${$a[$i]} = $v;

if (!isset($sClass))
    $sClass = 'Module';

foreach ($a as $v) {
    if (!isset($$v)) {
        header('HTTP/1.0 404 Not Found');
        header('Status: 404 Not Found');
        BxDolLanguages::getInstance();
        echo json_encode(['status' => 404, 'error' => _t("_sys_request_page_not_found_cpt")]);
        exit;
    }
}

// check if service exists

if (!BxDolRequest::serviceExists($sModule, $sMethod, $sClass)) {
    header('HTTP/1.0 404 Not Found');
    header('Status: 404 Not Found');
    BxDolLanguages::getInstance();
    echo json_encode(['status' => 404, 'error' => _t("_sys_request_page_not_found_cpt")]);
    exit;
}

// check if service is safe

if (!getParam('sys_api_access_unsafe_services')) {
    $b = BxDolRequest::serviceExists($sModule, 'is_safe_service', 'system' == $sModule ? 'TemplServices' : 'Module');
    $bSafe = $b ? BxDolService::call($sModule, 'is_safe_service', array($sMethod), 'system' == $sModule ? 'TemplServices' : 'Module') : false;

    $bPublic = false;
    if (!$bSafe) {
        $b = BxDolRequest::serviceExists($sModule, 'is_public_service', 'system' == $sModule ? 'TemplServices' : 'Module');
        $bPublic = $b ? BxDolService::call($sModule, 'is_public_service', array($sMethod), 'system' == $sModule ? 'TemplServices' : 'Module') : false;
    } 
    if (!$bPublic && !$bSafe) {
        header('HTTP/1.0 403 Forbidden');
        header('Status: 403 Forbidden');
        echo json_encode(['status' => 403, 'error' => _t("_Access denied")]);
        exit;
    }
}

// call service

if (!($aParams = bx_get('params')))
    $aParams = array();
elseif (is_string($aParams) && preg_match('/^\[.*\]$/', $aParams))
    $aParams = @json_decode($aParams, true);

if (!is_array($aParams))
    $aParams = array($aParams);

$mixedRet = BxDolService::callExternal($sModule, $sMethod, $aParams, $sClass);

// check output and return JSON

if (is_array($mixedRet) && isset($mixedRet['error'])) { 
    header('HTTP/1.0 500 Internal Server Error');
    header('Status: 500 Internal Server Error');
    $a = [
        'status' => isset($mixedRet['code']) ? $mixedRet['code'] : 500,
        'error' => isset($mixedRet['desc']) ? $mixedRet['desc'] : $mixedRet['error'],
        'data' => isset($mixedRet['data']) ? $mixedRet['data'] : '',
    ];
    if (isset($mixedRet['code']))
        $a['code'] = $mixedRet['code'];
    echo json_encode($a);
    exit;
}

$aRv = [
    'status' => 200,
    'module' => $sModule,
    'method' => $sMethod,
    'params' => $aParams,
    'data' => $mixedRet,
    'hash' => md5(getParam('sys_api_config')),
];

echo json_encode($aRv);
