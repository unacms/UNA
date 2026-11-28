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

echoDbgLog($aRequest);

$bEnabled = !empty($GLOBALS['aModule']['enabled']);
$bPost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$bCompletion = $bPost && $aRequest === ['v1', 'chat', 'completions'] && $bEnabled;
$bKnowledge = $bPost && $aRequest === ['v1', 'knowledge', 'search'] && $bEnabled;

if (!$bCompletion && !$bKnowledge) {
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

if ($bKnowledge)
    $oModule->knowledge();
else
    $oModule->completions();

/** @} */
