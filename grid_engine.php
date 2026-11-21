<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreScripts Scripts
 * @{
 */

/**
 * Switches the engine that renders a grid (sys_objects_grid.engine).
 *
 * Web (site admin only): /grid_engine.php?object=<object>&engine=<engine>
 * Console:               php grid_engine.php <object> <engine>
 *
 *   object - grid object name, for example bx_accounts_administration
 *   engine - ag (AG Grid) or classic (the classic HTML grid)
 */

$aPathInfo = pathinfo(__FILE__);
require_once($aPathInfo['dirname'] . '/inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

class BxDolGridEngineCmd
{
    protected $_bCli;

    protected $_aEngines = [
        'classic' => '',
        'ag' => 'ag',
    ];

    public function __construct()
    {
        $this->_bCli = PHP_SAPI === 'cli';
    }

    public function main()
    {
        if ($this->_bCli) {
            $aArgs = array_slice($GLOBALS['argv'], 1);
            if (count($aArgs) != 2)
                $this->finish(2, $this->getHelp());

            list($sObject, $sEngine) = $aArgs;
        }
        else {
            header('Content-Type: text/plain; charset=utf-8');
            header('Cache-Control: no-store');

            if (!isAdmin())
                $this->finish(403, 'Access denied.');

            $sObject = bx_process_input(bx_get('object'));
            $sEngine = bx_process_input(bx_get('engine'));
            if (!$sObject || !$sEngine)
                $this->finish(400, $this->getHelp());
        }

        if (!isset($this->_aEngines[$sEngine]))
            $this->finish(400, "Unknown engine '" . $sEngine . "'. Use one of: " . implode(', ', array_keys($this->_aEngines)));

        if (!BxDolGridQuery::isGridObject($sObject))
            $this->finish(404, "Grid object '" . $sObject . "' not found.");

        if (!BxDolGridQuery::setGridEngine($sObject, $this->_aEngines[$sEngine]))
            $this->finish(500, "Failed to update grid object '" . $sObject . "'.");

        $this->finish(200, "Grid '" . $sObject . "' now uses the " . $sEngine . " engine.");
    }

    protected function getHelp()
    {
        return "Web:     /grid_engine.php?object=<object>&engine=<engine>\n"
            . "Console: php grid_engine.php <object> <engine>\n"
            . "\t object\tGrid object name (sys_objects_grid.object)\n"
            . "\t engine\t" . implode(' or ', array_keys($this->_aEngines));
    }

    protected function finish($iStatus, $sMsg)
    {
        if ($this->_bCli) {
            echo $sMsg . "\n";
            exit($iStatus == 200 ? 0 : 1);
        }

        http_response_code($iStatus);
        echo $sMsg . "\n";
        exit;
    }
}

$o = new BxDolGridEngineCmd();
$o->main();

/** @} */
