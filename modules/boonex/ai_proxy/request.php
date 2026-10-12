<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AIProxy AI Proxy
 * @ingroup     UnaModules
 *
 * @{
 */

$aRequest = array_values(array_filter($GLOBALS['aRequest'] ?? [], static function ($sPart) {
    return $sPart !== '';
}));

$bCompletion = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST'
    && $aRequest === ['v1', 'chat', 'completions']
    && !empty($GLOBALS['aModule']['enabled']);

if (!$bCompletion) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => [
            'message' => 'Not found',
            'type' => 'not_found',
        ],
    ]);
    return;
}

$oModule = BxDolModule::getInstance($GLOBALS['aModule']['name']);
if (!$oModule)
    return;

$oModule->completions();

/** @} */
